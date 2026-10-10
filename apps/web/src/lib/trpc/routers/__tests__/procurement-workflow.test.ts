// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { buildDDL, createTestDb, makeFinanceUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));


const { procurementRouter } = await import("../procurement");
const { warehouseRouter } = await import("../warehouse");
const { createCallerFactory } = await import("../../init");

const procurementTables = [
	schema.branches,
	schema.staff,
	schema.suppliers,
	schema.products,
	schema.purchaseRequests,
	schema.purchaseRequestItems,
	schema.purchases,
	schema.purchaseItems,
	schema.goodsReceiptNotes,
	schema.goodsReceiptItems,
	schema.receivingInspections,
	schema.placementVerifications,
	schema.productBatches,
	schema.branchLocations,
	schema.batchStock,
	schema.branchInventory,
	schema.stockLedger,
	schema.supplierInvoices,
	schema.supplierInvoiceItems,
	schema.supplierPaymentAllocations,
	schema.procurementExceptions,
	schema.bankAccounts,
	schema.payments,
	schema.auditLogs,
	schema.notifications,
];

const PROCUREMENT_SCHEMA_DDL = buildDDL(procurementTables, false);

// Users
const procurementManager = makeFinanceUser({
	id: "proc-mgr-1",
	email: "procurement@evaluna.com",
	role: "manager",
	branchId: 1,
});

const warehouseStaff = makeFinanceUser({
	id: "wh-staff-1",
	email: "warehouse@evaluna.com",
	role: "warehouse",
	branchId: 1,
});

const financeOfficer = makeFinanceUser({
	id: "fin-off-1",
	email: "finance@evaluna.com",
	role: "finance",
	branchId: 1,
});

const callProcurement = (u = procurementManager) =>
	createCallerFactory(procurementRouter)({ user: u, db });

const callWarehouse = (u = warehouseStaff) =>
	createCallerFactory(warehouseRouter)({ user: u, db });

describe("End-to-End Procurement, Warehouse & Finance Integration Workflow", () => {
	let testSupplierId: number;
	let testProductId: number;
	let testBankAccountId: number;

	beforeAll(async () => {
		await pg.exec(PROCUREMENT_SCHEMA_DDL);

		// Seed Branch
		await db.insert(schema.branches).values({
			id: 1,
			name: "Central Warehouse Delhi",
			code: "DEL-WH-01",
		});

		// Seed Supplier
		const [sup] = await db
			.insert(schema.suppliers)
			.values({
				name: "Apex Goods Distributors Pvt Ltd",
				phone: "+91-9876543210",
				email: "orders@apexdistributors.com",
				address: "Plot 42, Okhla Industrial Area, New Delhi",
				outstanding_balance: "0.00",
			})
			.returning();
		testSupplierId = sup.id;

		// Seed Product
		const [prod] = await db
			.insert(schema.products)
			.values({
				name: "Premium Basmati Rice 10kg",
				sku: "RICE-BAS-10KG",
				price: "850.00",
				base_procurement_price: "650.00",
				user_uid: procurementManager.id,
			})
			.returning();
		testProductId = prod.id;

		// Seed Bank Account
		const [bank] = await db
			.insert(schema.bankAccounts)
			.values({
				branch_id: 1,
				account_name: "HDFC Operating Bank Account",
				bank_name: "HDFC Bank",
				account_number: "50100456789012",
				current_balance: "500000.00",
				status: "active",
			})
			.returning();
		testBankAccountId = bank.id;
	});

	// ───────────────────────────────────────────────────────────────────────────
	// 1. PURCHASE REQUEST LIFECYCLE
	// ───────────────────────────────────────────────────────────────────────────
	describe("1. Purchase Request (PR) Lifecycle", () => {
		let createdRequestId: number;

		it("creates a purchase request with items and accurate estimated total", async () => {
			const caller = callProcurement(warehouseStaff);

			const pr = await caller.createRequest({
				department: "Warehouse",
				priority: "high",
				notes: "Stock running low due to upcoming festival season",
				items: [
					{
						productId: testProductId,
						quantity: 50,
						estimatedUnitCost: 650,
						preferredSupplierId: testSupplierId,
					},
				],
			});

			expect(pr.id).toBeDefined();
			expect(pr.request_number).toMatch(/^REQ-/);
			expect(pr.status).toBe("pending_approval");
			expect(Number(pr.estimated_total)).toBe(32500); // 50 * 650
			createdRequestId = pr.id;

			const fetched = await caller.getRequest({ id: pr.id });
			expect(fetched.items.length).toBe(1);
			expect(fetched.items[0].product_name).toBe("Premium Basmati Rice 10kg");
		});

		it("allows manager to reject a request with reasons", async () => {
			const caller = callProcurement(procurementManager);

			// Create a draft request to reject
			const tempReq = await caller.createRequest({
				department: "Retail",
				priority: "low",
				items: [
					{
						productId: testProductId,
						quantity: 5,
						estimatedUnitCost: 650,
					},
				],
			});

			const rejected = await caller.rejectRequest({
				id: tempReq.id,
				reason: "Sufficient safety stock present in secondary store",
			});

			expect(rejected.status).toBe("rejected");
			expect(rejected.rejection_reason).toContain("Sufficient safety stock");
		});

		it("allows authorized manager to approve the purchase request", async () => {
			const caller = callProcurement(procurementManager);

			const approved = await caller.approveRequest({ id: createdRequestId });
			expect(approved.status).toBe("approved");
			expect(approved.approved_by).toBeDefined();
			expect(approved.approved_at).toBeDefined();
		});

		it("converts approved PR into a Purchase Order", async () => {
			const caller = callProcurement(procurementManager);

			const po = await caller.convertToPO({
				requestId: createdRequestId,
				supplierId: testSupplierId,
				expectedDeliveryDate: new Date(Date.now() + 86400000 * 3), // +3 days
				notes: "Please deliver directly to Bay 4",
			});

			expect(po.id).toBeDefined();
			expect(po.po_number).toMatch(/^PO-/);
			expect(po.purchase_request_id).toBe(createdRequestId);
			expect(Number(po.total_amount)).toBe(32500);

			// PR must now be marked 'converted'
			const pr = await caller.getRequest({ id: createdRequestId });
			expect(pr.status).toBe("converted");
		});
	});

	// ───────────────────────────────────────────────────────────────────────────
	// 2. PURCHASE ORDER CREATION & INVENTORY ISOLATION
	// ───────────────────────────────────────────────────────────────────────────
	describe("2. PO Creation & Inventory Independence", () => {
		let createdPOId: number;

		it("issuing a Purchase Order must NEVER increase stock ledger inventory", async () => {
			const caller = callProcurement(procurementManager);

			// Count current stock ledger entries
			const preLedger = await db
				.select()
				.from(schema.stockLedger)
				.where(eq(schema.stockLedger.product_id, testProductId));
			expect(preLedger.length).toBe(0);

			// Create standalone PO with 18% GST (9% CGST + 9% SGST)
			const po = await caller.createPO({
				supplierId: testSupplierId,
				expectedDeliveryDate: new Date(Date.now() + 86400000 * 5),
				notes: "Commercial contract #PO-2026-09",
				items: [
					{
						productId: testProductId,
						quantity: 100,
						price: 650,
						cgstRate: 9,
						sgstRate: 9,
					},
				],
			});

			expect(po.id).toBeDefined();
			expect(po.po_number).toMatch(/^PO-/);
			expect(po.receiving_status).toBe("pending");
			expect(po.payment_status).toBe("unpaid");

			// Subtotal = 65,000, CGST = 5,850, SGST = 5,850, Grand Total = 76,700
			expect(Number(po.total_amount)).toBe(76700);
			expect(Number(po.cgst_amount)).toBe(5850);
			expect(Number(po.sgst_amount)).toBe(5850);
			createdPOId = po.id;

			// VERIFY CRITICAL RULE: stockLedger must still have 0 entries!
			const postLedger = await db
				.select()
				.from(schema.stockLedger)
				.where(eq(schema.stockLedger.product_id, testProductId));
			expect(postLedger.length).toBe(0);
		});

		it("allows supplier confirmation and delivery date scheduling", async () => {
			const caller = callProcurement(procurementManager);

			const confirmedDate = new Date(Date.now() + 86400000 * 4);
			const confirmed = await caller.confirmPO({
				purchaseId: createdPOId,
				confirmedDeliveryDate: confirmedDate,
				notes: "Supplier confirmed truck dispatch",
			});

			expect(confirmed.status).toBe("ordered");
			expect(confirmed.confirmed_delivery_date).toBeDefined();
		});
	});

	// ───────────────────────────────────────────────────────────────────────────
	// 3. WAREHOUSE RECEIVING & QUALITY INSPECTION (GRN)
	// ───────────────────────────────────────────────────────────────────────────
	describe("3. Warehouse Inbound & Quality Inspection", () => {
		let poIdToReceive: number;

		beforeAll(async () => {
			const caller = callProcurement(procurementManager);
			const po = await caller.createPO({
				supplierId: testSupplierId,
				items: [
					{
						productId: testProductId,
						quantity: 20,
						price: 650,
					},
				],
			});
			poIdToReceive = po.id;
		});

		it("records goods receipt with accepted and damaged quantities and posts to stock ledger ONLY for accepted units", async () => {
			const caller = callProcurement(warehouseStaff);

			// Out of 20 ordered units: 16 accepted, 3 damaged, 1 rejected
			const grn = await caller.recordReceipt({
				purchaseId: poIdToReceive,
				deliveryNoteNumber: "CHALLAN-90214",
				vehicleNumber: "DL-1L-AA-5555",
				notes: "Driver delivered at 11:30 AM. Bag 19 torn in transit.",
				items: [
					{
						productId: testProductId,
						orderedQuantity: 20,
						receivedQuantity: 20,
						acceptedQuantity: 16,
						damagedQuantity: 3,
						rejectedQuantity: 1,
						unitCost: 650,
						batchNumber: "BATCH-RICE-2026",
					},
				],
			});

			expect(grn.id).toBeDefined();
			expect(grn.grn_number).toMatch(/^GRN-/);
			expect(grn.status).toBe("partially_accepted");

			// 1. Verify stock ledger ONLY has 16 units posted (NOT 20!)
			const ledgerRows = await db
				.select()
				.from(schema.stockLedger)
				.where(eq(schema.stockLedger.reference_id, grn.id));
			expect(ledgerRows.length).toBe(1);
			expect(Number(ledgerRows[0].quantity)).toBe(16);
			expect(ledgerRows[0].transaction_type).toBe("in");

			// 2. Verify branch inventory is exactly 16
			const invRows = await db
				.select()
				.from(schema.branchInventory)
				.where(eq(schema.branchInventory.product_id, testProductId));
			expect(Number(invRows[0].in_stock)).toBe(16);

			// 3. Verify discrepancy exception logged for damaged items
			const exceptions = await db
				.select()
				.from(schema.procurementExceptions)
				.where(eq(schema.procurementExceptions.purchase_id, poIdToReceive));
			expect(exceptions.length).toBeGreaterThanOrEqual(1);
			expect(exceptions[0].exception_type).toBe("damage");
			expect(exceptions[0].description).toContain("Damaged 3");

			// 4. Verify PO receiving status updated to partial
			const po = await caller.getPO({ id: poIdToReceive });
			expect(po.receiving_status).toBe("partial");
		});

		it("warehouse router receivePO also generates formal GRN and updates receiving status", async () => {
			const procCaller = callProcurement(procurementManager);
			const newPO = await procCaller.createPO({
				supplierId: testSupplierId,
				items: [{ productId: testProductId, quantity: 10, price: 650 }],
			});

			const whCaller = callWarehouse(warehouseStaff);
			const result = await whCaller.receivePO({
				purchaseId: newPO.id,
				items: [
					{
						productId: testProductId,
						expectedQty: 10,
						receivedQty: 10,
						condition: "good",
					},
				],
			});

			expect(result.success).toBe(true);

			// Verify PO is marked received
			const po = await procCaller.getPO({ id: newPO.id });
			expect(po.receiving_status).toBe("received");
			expect(po.grns.length).toBe(1);
		});
	});

	// ───────────────────────────────────────────────────────────────────────────
	// 4. SUPPLIER INVOICES & 3-WAY MATCHING
	// ───────────────────────────────────────────────────────────────────────────
	describe("4. Supplier Invoices & 3-Way Matching", () => {
		let poIdForMatching: number;

		beforeAll(async () => {
			const caller = callProcurement(procurementManager);
			// Order 50 items @ 600
			const po = await caller.createPO({
				supplierId: testSupplierId,
				items: [{ productId: testProductId, quantity: 50, price: 600 }],
			});
			poIdForMatching = po.id;

			// Warehouse receives 50 items clean
			await caller.recordReceipt({
				purchaseId: po.id,
				items: [
					{
						productId: testProductId,
						orderedQuantity: 50,
						receivedQuantity: 50,
						acceptedQuantity: 50,
						unitCost: 600,
					},
				],
			});
		});

		it("registers invoice matching PO and GRN with clean 'matched' status", async () => {
			const caller = callProcurement(financeOfficer);

			const inv = await caller.registerInvoice({
				purchaseId: poIdForMatching,
				supplierId: testSupplierId,
				invoiceNumber: "BILL-2026-001",
				invoiceDate: new Date(),
				items: [
					{
						productId: testProductId,
						billedQuantity: 50,
						unitPrice: 600,
						taxRate: 5,
					},
				],
			});

			expect(inv.id).toBeDefined();
			expect(inv.matching_status).toBe("matched");
			expect(inv.status).toBe("verified");
			// Subtotal = 30,000, Tax = 1,500, Total = 31,500
			expect(Number(inv.total_amount)).toBe(31500);
			expect(Number(inv.outstanding_amount)).toBe(31500);
		});

		it("prevents duplicate invoice registration for the same supplier", async () => {
			const caller = callProcurement(financeOfficer);

			await expect(
				caller.registerInvoice({
					purchaseId: poIdForMatching,
					supplierId: testSupplierId,
					invoiceNumber: "BILL-2026-001", // Duplicate!
					invoiceDate: new Date(),
					items: [
						{
							productId: testProductId,
							billedQuantity: 50,
							unitPrice: 600,
						},
					],
				}),
			).rejects.toThrow("already been registered");
		});

		it("flags price mismatch when vendor bills higher than PO unit price", async () => {
			const caller = callProcurement(financeOfficer);

			const inv = await caller.registerInvoice({
				purchaseId: poIdForMatching,
				supplierId: testSupplierId,
				invoiceNumber: "BILL-2026-PRICE-DIFF",
				invoiceDate: new Date(),
				items: [
					{
						productId: testProductId,
						billedQuantity: 50,
						unitPrice: 650, // PO price was 600!
					},
				],
			});

			expect(inv.matching_status).toBe("price_mismatch");
			expect(inv.status).toBe("draft"); // Requires variance override

			// Verify exception logged
			const exceptions = await db
				.select()
				.from(schema.procurementExceptions)
				.where(eq(schema.procurementExceptions.invoice_id, inv.id));
			expect(exceptions.length).toBe(1);
			expect(exceptions[0].exception_type).toBe("price_variance");
		});

		it("flags quantity mismatch when vendor bills more than GRN accepted quantity", async () => {
			const caller = callProcurement(financeOfficer);

			const inv = await caller.registerInvoice({
				purchaseId: poIdForMatching,
				supplierId: testSupplierId,
				invoiceNumber: "BILL-2026-QTY-DIFF",
				invoiceDate: new Date(),
				items: [
					{
						productId: testProductId,
						billedQuantity: 65, // GRN accepted was only 50!
						unitPrice: 600,
					},
				],
			});

			expect(inv.matching_status).toBe("quantity_mismatch");
		});
	});

	// ───────────────────────────────────────────────────────────────────────────
	// 5. FINANCE APPROVAL & PAYMENT DISBURSEMENT
	// ───────────────────────────────────────────────────────────────────────────
	describe("5. Finance Approval & Payment Execution", () => {
		let cleanInvoiceId: number;
		let discrepantInvoiceId: number;

		beforeAll(async () => {
			const caller = callProcurement(financeOfficer);
			const invoices = await caller.listInvoices({});
			const clean = invoices.find((i) => i.invoice_number === "BILL-2026-001");
			const discrepant = invoices.find((i) => i.invoice_number === "BILL-2026-PRICE-DIFF");
			cleanInvoiceId = clean!.id;
			discrepantInvoiceId = discrepant!.id;
		});

		it("rejects approval of mismatched invoice without explicit variance override", async () => {
			const caller = callProcurement(financeOfficer);

			await expect(
				caller.approveInvoice({
					invoiceId: discrepantInvoiceId,
					allowVarianceOverride: false,
				}),
			).rejects.toThrow("variance override");
		});

		it("approves mismatched invoice when authorized with variance override rationale", async () => {
			const caller = callProcurement(financeOfficer);

			const approved = await caller.approveInvoice({
				invoiceId: discrepantInvoiceId,
				allowVarianceOverride: true,
				overrideNotes: "Market freight surcharge accepted per addendum",
			});

			expect(approved.status).toBe("approved_for_payment");
			expect(approved.matching_status).toBe("variance_approved");
		});

		it("approves clean matched invoice for disbursement", async () => {
			const caller = callProcurement(financeOfficer);

			const approved = await caller.approveInvoice({
				invoiceId: cleanInvoiceId,
				allowVarianceOverride: false,
			});

			expect(approved.status).toBe("approved_for_payment");
		});

		it("executes supplier payment, deducts bank balance atomically, and updates ledger", async () => {
			const caller = callProcurement(financeOfficer);

			// Pre-payment bank balance
			const [preBank] = await db
				.select()
				.from(schema.bankAccounts)
				.where(eq(schema.bankAccounts.id, testBankAccountId));
			const initialBalance = Number(preBank.current_balance);

			// Disburse ₹31,500 for BILL-2026-001
			const result = await caller.executePayment({
				invoiceId: cleanInvoiceId,
				amount: 31500,
				paymentMode: "bank_transfer",
				referenceNumber: "UTR-HDFC-992211",
				bankAccountId: testBankAccountId,
				notes: "Settled in full via NEFT",
			});

			expect(result.success).toBe(true);
			expect(result.remainingOutstanding).toBe(0);

			// 1. Verify Bank Balance deducted
			const [postBank] = await db
				.select()
				.from(schema.bankAccounts)
				.where(eq(schema.bankAccounts.id, testBankAccountId));
			expect(Number(postBank.current_balance)).toBe(initialBalance - 31500);

			// 2. Verify Invoice is marked Paid
			const inv = await caller.getInvoice({ id: cleanInvoiceId });
			expect(inv.status).toBe("paid");
			expect(inv.payment_status).toBe("paid");
			expect(Number(inv.outstanding_amount)).toBe(0);
			expect(Number(inv.amount_paid)).toBe(31500);

			// 3. Verify Payment Allocation recorded
			expect(inv.allocations.length).toBe(1);
			expect(inv.allocations[0].reference_number).toBe("UTR-HDFC-992211");

			// 4. Verify Purchase Order lifecycle closed
			const po = await caller.getPO({ id: inv.purchase_id });
			expect(po.payment_status).toBe("paid");
			expect(po.status).toBe("completed"); // Both received and paid = completed!
		});
	});

	// ───────────────────────────────────────────────────────────────────────────
	// 6. PROCUREMENT OVERVIEW KPIS
	// ───────────────────────────────────────────────────────────────────────────
	describe("6. Unified Procurement Overview KPIs", () => {
		it("returns aggregated counts and spend across Procurement, Warehouse, and Finance", async () => {
			const caller = callProcurement(procurementManager);
			const kpis = await caller.getProcurementKpis();

			expect(kpis.totalPOs).toBeGreaterThan(0);
			expect(kpis.totalSpend).toBeGreaterThan(0);
			expect(kpis.totalInvoiced).toBeGreaterThan(0);
			expect(kpis.activeSuppliers).toBeGreaterThan(0);
			expect(typeof kpis.pendingPRs).toBe("number");
			expect(typeof kpis.openExceptions).toBe("number");
		});
	});
});
