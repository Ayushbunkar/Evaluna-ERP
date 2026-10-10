// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { buildDDL, createTestDb, makeFinanceUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { auditRouter } = await import("../audit");
const { createCallerFactory } = await import("../../init");

const auditTables = [
	schema.branches,
	schema.staff,
	schema.user,
	schema.products,
	schema.productCategories,
	schema.productCategoryMapping,
	schema.branchInventory,
	schema.stockAudits,
	schema.stockAuditItems,
	schema.auditDiscrepancies,
	schema.missingStockQueue,
	schema.stockAdjustments,
	schema.stockLedger,
	schema.auditLogs,
	schema.notifications,
];

const AUDIT_SCHEMA_DDL = buildDDL(auditTables, false);

// Users with proper permissions
const warehouseManager = makeFinanceUser({
	id: "wh-mgr-1",
	email: "manager@warehouse.com",
	role: "warehouse_supervisor",
	branchId: 1,
	permissions: [
		"inventory_audit.read",
		"inventory_audit.write",
		"inventory_audit.approve",
	],
});

const warehouseCounter = makeFinanceUser({
	id: "wh-counter-1",
	email: "counter@warehouse.com",
	role: "loader",
	branchId: 1,
	permissions: ["inventory_audit.read", "inventory_audit.write"],
});

const callerFactory = createCallerFactory(auditRouter);

describe("Complete Production-Level Inventory Audit & Stock Counting System", () => {
	let testBranchId: number;
	let managerStaffId: number;
	let counterStaffId: number;
	let product1Id: number;
	let product2Id: number;
	let product3Id: number;

	beforeAll(async () => {
		await pg.exec(AUDIT_SCHEMA_DDL);

		// Seed Branch
		const [branch] = await db
			.insert(schema.branches)
			.values({
				name: "Central Logistics Hub",
				code: "CLH-01",
				address: "Sector 18, Warehouse Complex",
			})
			.returning();
		testBranchId = branch.id;

		// Seed Staff
		const [mgrStaff] = await db
			.insert(schema.staff)
			.values({
				name: "Warehouse Manager",
				staff_code: "MGR-001",
				email: "manager@warehouse.com",
				role: "warehouse_supervisor",
				branch_id: testBranchId,
				salary: "50000.00",
				join_date: new Date(),
			})
			.returning();
		managerStaffId = mgrStaff.id;

		const [cntStaff] = await db
			.insert(schema.staff)
			.values({
				name: "Inventory Auditor Staff",
				staff_code: "STF-002",
				email: "counter@warehouse.com",
				role: "loader",
				branch_id: testBranchId,
				salary: "25000.00",
				join_date: new Date(),
			})
			.returning();
		counterStaffId = cntStaff.id;

		// Seed Products
		const [p1] = await db
			.insert(schema.products)
			.values({
				name: "Organic Arabica Coffee 500g",
				sku: "COF-ARA-500",
				barcode: "8901234567890",
				price: "450.00",
				base_procurement_price: "300.00",
				in_stock: "100",
				user_uid: "test-system",
			})
			.returning();
		product1Id = p1.id;

		const [p2] = await db
			.insert(schema.products)
			.values({
				name: "Almond Butter Creamy 350g",
				sku: "ALM-BUT-350",
				barcode: "8901234567891",
				price: "350.00",
				base_procurement_price: "220.00",
				in_stock: "50",
				user_uid: "test-system",
			})
			.returning();
		product2Id = p2.id;

		const [p3] = await db
			.insert(schema.products)
			.values({
				name: "Raw Wild Honey 1kg",
				sku: "RAW-HON-1000",
				barcode: "8901234567892",
				price: "600.00",
				base_procurement_price: "400.00",
				in_stock: "20",
				user_uid: "test-system",
			})
			.returning();
		product3Id = p3.id;

		// Seed Branch Inventory snapshot benchmarks
		await db.insert(schema.branchInventory).values([
			{
				branch_id: testBranchId,
				product_id: product1Id,
				in_stock: "100",
			},
			{
				branch_id: testBranchId,
				product_id: product2Id,
				in_stock: "50",
			},
			{
				branch_id: testBranchId,
				product_id: product3Id,
				in_stock: "20",
			},
		]);
	});

	let createdAuditId: number;
	let createdAuditNumber: string;

	it("1. Scope Preview > calculates matching product count and on-hand stock benchmark", async () => {
		const caller = callerFactory({
			user: warehouseManager,
			db,
		});

		const preview = await caller.getAuditScopePreview({
			branchId: testBranchId,
			productIds: [product1Id, product2Id, product3Id],
		});

		expect(preview.totalProducts).toBe(3);
		expect(preview.totalExpectedStock).toBe(170); // 100 + 50 + 20
		expect(preview.sampleProducts.length).toBe(3);
	});

	it("2. Assignable Auditors > returns eligible staff members for assignment", async () => {
		const caller = callerFactory({
			user: warehouseManager,
			db,
		});

		const auditors = await caller.getAssignableAuditors({
			branchId: testBranchId,
		});

		expect(auditors.length).toBeGreaterThanOrEqual(2);
		expect(auditors.some((a) => a.id === counterStaffId)).toBe(true);
	});

	it("3. Create Audit Plan > freezes snapshot expected_qty into audit items and logs audit trail", async () => {
		const caller = callerFactory({
			user: warehouseManager,
			db,
		});

		const audit = await caller.createAuditPlan({
			branch_id: testBranchId,
			title: "Q4 High-Value Goods Blind Audit",
			audit_type: "cycle_count",
			counting_method: "blind",
			priority: "high",
			auditor_id: counterStaffId,
			location_name: "Aisle A, Racks 1-3",
			notes: "Verify seal integrity and check top shelves.",
			product_ids: [product1Id, product2Id, product3Id],
		});

		expect(audit).toBeDefined();
		expect(audit.id).toBeGreaterThan(0);
		expect(audit.status).toBe("planned");
		expect(audit.counting_method).toBe("blind");
		expect(audit.audit_number).toMatch(/^AUD-\d{4}-\d{4}$/);

		createdAuditId = audit.id;
		createdAuditNumber = audit.audit_number;

		// Verify audit lines snapshot
		const items = await db
			.select()
			.from(schema.stockAuditItems)
			.where(eq(schema.stockAuditItems.audit_id, createdAuditId));

		expect(items.length).toBe(3);
		// Check that snapshot expected quantities match branch inventory
		const p1Item = items.find((i) => i.product_id === product1Id);
		const p2Item = items.find((i) => i.product_id === product2Id);
		const p3Item = items.find((i) => i.product_id === product3Id);

		expect(p1Item?.expected_qty).toBe(100);
		expect(p2Item?.expected_qty).toBe(50);
		expect(p3Item?.expected_qty).toBe(20);
		expect(p1Item?.counted_qty).toBeNull();

		// Verify notification created for counter
		const notifications = await db
			.select()
			.from(schema.notifications)
			.where(eq(schema.notifications.user_id, counterStaffId));
		expect(notifications.length).toBeGreaterThan(0);
	});

	it("4. Blind Count Security > masks expected_qty from field counter, visible to manager", async () => {
		// Field Counter query (no approve permission)
		const counterCaller = callerFactory({
			user: warehouseCounter,
			db,
		});

		const counterView = await counterCaller.getAudit({
			auditId: createdAuditId,
		});

		expect(counterView.audit).toBeDefined();
		expect(counterView.items.length).toBe(3);
		// In blind count, uncounted lines MUST have expected_qty masked (null)
		for (const item of counterView.items) {
			expect(item.expected_qty).toBeNull();
		}

		// Manager query (has approve permission)
		const managerCaller = callerFactory({
			user: warehouseManager,
			db,
		});

		const managerView = await managerCaller.getAudit({
			auditId: createdAuditId,
		});

		// Manager CAN see expected_qty
		const mgrP1 = managerView.items.find((i) => i.product_id === product1Id);
		expect(mgrP1?.expected_qty).toBe(100);
	});

	it("5. Employee Workspace (getMyAudits) > retrieves assigned active audit tasks", async () => {
		const caller = callerFactory({
			user: warehouseCounter,
			db,
		});

		const tasks = await caller.getMyAudits({
			status: "active",
		});

		expect(tasks.length).toBeGreaterThanOrEqual(1);
		const myTask = tasks.find((t) => t.id === createdAuditId);
		expect(myTask).toBeDefined();
		expect(myTask?.totalLines).toBe(3);
		expect(myTask?.countedLines).toBe(0);
	});

	it("6. Start Audit > marks audit in_progress", async () => {
		const caller = callerFactory({
			user: warehouseCounter,
			db,
		});

		const started = await caller.startAudit({
			audit_id: createdAuditId,
		});

		expect(started.status).toBe("in_progress");
		expect(started.start_date).toBeDefined();
	});

	it("7. Record Count Progress (Draft Autosave & Explicit Zero) > saves counts without finalizing", async () => {
		const caller = callerFactory({
			user: warehouseCounter,
			db,
		});

		const items = await db
			.select()
			.from(schema.stockAuditItems)
			.where(eq(schema.stockAuditItems.audit_id, createdAuditId));

		const p1Item = items.find((i) => i.product_id === product1Id)!;
		const p3Item = items.find((i) => i.product_id === product3Id)!;

		// Product 1: physical count = 100 (matched)
		// Product 3: physical count = 0 (explicit zero count out-of-stock)
		const progress = await caller.recordCountProgress({
			audit_id: createdAuditId,
			items: [
				{ item_id: p1Item.id, counted_qty: 100, remarks: "Full shelf verified" },
				{ item_id: p3Item.id, counted_qty: 0, remarks: "Rack bin empty" },
			],
		});

		expect(progress.success).toBe(true);

		// Verify draft is stored in database
		const updatedItems = await db
			.select()
			.from(schema.stockAuditItems)
			.where(eq(schema.stockAuditItems.audit_id, createdAuditId));

		const updatedP1 = updatedItems.find((i) => i.id === p1Item.id);
		const updatedP3 = updatedItems.find((i) => i.id === p3Item.id);

		expect(updatedP1?.counted_qty).toBe(100);
		expect(updatedP3?.counted_qty).toBe(0); // Explicit zero persisted!
	});

	it("8. Submit Count Lines > calculates variances, logs discrepancies, and transitions to review", async () => {
		const caller = callerFactory({
			user: warehouseCounter,
			db,
		});

		const items = await db
			.select()
			.from(schema.stockAuditItems)
			.where(eq(schema.stockAuditItems.audit_id, createdAuditId));

		const p1Item = items.find((i) => i.product_id === product1Id)!; // Expected: 100
		const p2Item = items.find((i) => i.product_id === product2Id)!; // Expected: 50
		const p3Item = items.find((i) => i.product_id === product3Id)!; // Expected: 20

		// P1: Counted 100 (match)
		// P2: Counted 45 (shortage of 5)
		// P3: Counted 25 (excess of 5)
		const submitResult = await caller.submitCountLines({
			audit_id: createdAuditId,
			items: [
				{ item_id: p1Item.id, counted_qty: 100 },
				{
					item_id: p2Item.id,
					counted_qty: 45,
					discrepancy_reason: "5 units missing from carton",
				},
				{
					item_id: p3Item.id,
					counted_qty: 25,
					discrepancy_reason: "Found 5 extra units in adjacent bin",
				},
			],
		});

		expect(submitResult.success).toBe(true);
		expect(submitResult.status).toBe("discrepancy_review");
		expect(submitResult.discrepancyCount).toBe(2);

		// Verify variances in database
		const submittedItems = await db
			.select()
			.from(schema.stockAuditItems)
			.where(eq(schema.stockAuditItems.audit_id, createdAuditId));

		const subP1 = submittedItems.find((i) => i.id === p1Item.id)!;
		const subP2 = submittedItems.find((i) => i.id === p2Item.id)!;
		const subP3 = submittedItems.find((i) => i.id === p3Item.id)!;

		expect(subP1.status).toBe("match");
		expect(subP1.variance_qty).toBe(0);

		expect(subP2.status).toBe("mismatch");
		expect(subP2.variance_qty).toBe(-5);

		expect(subP3.status).toBe("mismatch");
		expect(subP3.variance_qty).toBe(5);

		// Verify audit discrepancies records created
		const discrepancies = await db
			.select()
			.from(schema.auditDiscrepancies)
			.where(eq(schema.auditDiscrepancies.audit_item_id, p2Item.id));

		expect(discrepancies.length).toBe(1);
		expect(discrepancies[0].discrepancy_type).toBe("missing");
		expect(discrepancies[0].quantity).toBe(5);
		expect(Number(discrepancies[0].variance_value)).toBe(5 * 220); // 5 * procurement price 220 = 1100
	});

	it("9. Request Recount > preserves original physical count and flags lines for recount", async () => {
		const caller = callerFactory({
			user: warehouseManager,
			db,
		});

		const items = await db
			.select()
			.from(schema.stockAuditItems)
			.where(eq(schema.stockAuditItems.audit_id, createdAuditId));

		const p2Item = items.find((i) => i.product_id === product2Id)!;

		const recountReq = await caller.requestRecount({
			audit_id: createdAuditId,
			item_ids: [p2Item.id],
			recount_notes: "Please re-count P2 carton C-12, could be in receiving holding.",
		});

		expect(recountReq.status).toBe("recount_requested");

		// CRITICAL: verify original count is preserved!
		const lineAfterReq = await db
			.select()
			.from(schema.stockAuditItems)
			.where(eq(schema.stockAuditItems.id, p2Item.id));

		expect(lineAfterReq[0].counted_qty).toBe(45); // NOT erased!
		expect(lineAfterReq[0].status).toBe("recount_requested");
		expect(lineAfterReq[0].recount_notes).toBe(
			"Please re-count P2 carton C-12, could be in receiving holding.",
		);
	});

	it("10. Submit Recount > logs recount result alongside original count", async () => {
		const caller = callerFactory({
			user: warehouseCounter,
			db,
		});

		const items = await db
			.select()
			.from(schema.stockAuditItems)
			.where(eq(schema.stockAuditItems.audit_id, createdAuditId));

		const p2Item = items.find((i) => i.product_id === product2Id)!;

		// Staff recounts and finds 48 units (still missing 2, but better than 45)
		const recountSub = await caller.submitRecount({
			audit_id: createdAuditId,
			items: [
				{
					item_id: p2Item.id,
					recount_qty: 48,
					notes: "Found 3 units in receiving area. Total physically 48.",
				},
			],
		});

		expect(recountSub.status).toBe("discrepancy_review");

		const recountedLine = await db
			.select()
			.from(schema.stockAuditItems)
			.where(eq(schema.stockAuditItems.id, p2Item.id));

		expect(recountedLine[0].counted_qty).toBe(45); // Original intact!
		expect(recountedLine[0].recount_qty).toBe(48); // Recount recorded!
		expect(recountedLine[0].variance_qty).toBe(-2); // 48 - 50 = -2
		expect(recountedLine[0].status).toBe("mismatch");
	});

	it("11. Manager Reconciliation > atomically posts stockAdjustments, stockLedger, updates branchInventory & product master", async () => {
		const caller = callerFactory({
			user: warehouseManager,
			db,
		});

		// Check pre-reconciliation inventory
		const [preP2Inv] = await db
			.select()
			.from(schema.branchInventory)
			.where(
				eq(schema.branchInventory.product_id, product2Id),
			);
		expect(Number(preP2Inv.in_stock)).toBe(50);

		const [preP3Inv] = await db
			.select()
			.from(schema.branchInventory)
			.where(
				eq(schema.branchInventory.product_id, product3Id),
			);
		expect(Number(preP3Inv.in_stock)).toBe(20);

		// Execute reconciliation
		const result = await caller.reconcileAudit({
			audit_id: createdAuditId,
			notes: "Reconciliation approved by Warehouse Manager.",
			apply_adjustments: true,
		});

		expect(result.success).toBe(true);
		expect(result.adjustedLinesCount).toBe(2); // P2 delta -2, P3 delta +5

		// 1. Verify stock adjustments records
		const adjustments = await db
			.select()
			.from(schema.stockAdjustments)
			.where(eq(schema.stockAdjustments.created_by, managerStaffId));
		expect(adjustments.length).toBe(2);

		// 2. Verify stock ledger records
		const ledgerEntries = await db
			.select()
			.from(schema.stockLedger)
			.where(
				eq(schema.stockLedger.reference_type, "audit_reconciliation"),
			);
		expect(ledgerEntries.length).toBe(2);

		// 3. Verify on-hand stock updated accurately
		const [postP2Inv] = await db
			.select()
			.from(schema.branchInventory)
			.where(
				eq(schema.branchInventory.product_id, product2Id),
			);
		expect(Number(postP2Inv.in_stock)).toBe(48); // 50 - 2 = 48

		const [postP3Inv] = await db
			.select()
			.from(schema.branchInventory)
			.where(
				eq(schema.branchInventory.product_id, product3Id),
			);
		expect(Number(postP3Inv.in_stock)).toBe(25); // 20 + 5 = 25

		// 4. Verify audit status completed
		const [finalAudit] = await db
			.select()
			.from(schema.stockAudits)
			.where(eq(schema.stockAudits.id, createdAuditId));

		expect(finalAudit.status).toBe("completed");
		expect(finalAudit.reconciled_at).toBeDefined();
		expect(finalAudit.reconciled_by).toBe(managerStaffId);
	});

	it("12. Idempotency Protection > rejects duplicate reconciliation of completed audit", async () => {
		const caller = callerFactory({
			user: warehouseManager,
			db,
		});

		// Attempting to reconcile the same audit again must fail with CONFLICT
		expect(
			caller.reconcileAudit({
				audit_id: createdAuditId,
				notes: "Duplicate attempt",
			}),
		).rejects.toThrow();
	});

	it("13. Dashboard KPI Statistics > aggregates accurate counts and financial exposure", async () => {
		const caller = callerFactory({
			user: warehouseManager,
			db,
		});

		const stats = await caller.getDashboardStats({
			branchId: testBranchId,
		});

		expect(stats.totalAudits).toBeGreaterThanOrEqual(1);
		expect(stats.completedAudits).toBeGreaterThanOrEqual(1);
		expect(stats.totalLinesCounted).toBeGreaterThanOrEqual(3);
		expect(stats.discrepancyBreakdown).toBeDefined();
		expect(stats.discrepancyBreakdown.missing).toBeGreaterThanOrEqual(1);
		expect(stats.totalVarianceExposure).toBeGreaterThan(0);
	});

	it("14. List Audits Filter & Search > retrieves audits matching criteria", async () => {
		const caller = callerFactory({
			user: warehouseManager,
			db,
		});

		const completedList = await caller.listAudits({
			status: "completed",
		});

		expect(completedList.length).toBeGreaterThanOrEqual(1);
		const found = completedList.find((a) => a.id === createdAuditId);
		expect(found).toBeDefined();
		expect(found?.totalItemsCount).toBe(3);
		expect(found?.countedItemsCount).toBe(3);
	});

	it("15. Cancel Audit > allows cancelling planned audit with audit trail", async () => {
		const caller = callerFactory({
			user: warehouseManager,
			db,
		});

		const newPlan = await caller.createAuditPlan({
			branch_id: testBranchId,
			title: "Spot Check To Cancel",
			auditor_id: counterStaffId,
			product_ids: [product1Id],
		});

		const cancelled = await caller.cancelAudit({
			audit_id: newPlan.id,
			reason: "Rescheduled to next month due to warehouse maintenance",
		});

		expect(cancelled.status).toBe("cancelled");
		expect(cancelled.notes).toBe(
			"Rescheduled to next month due to warehouse maintenance",
		);
	});
});
