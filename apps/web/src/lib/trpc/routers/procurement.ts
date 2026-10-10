import {
	bankAccounts,
	batchStock,
	branchInventory,
	branches,
	goodsReceiptItems,
	goodsReceiptNotes,
	payments,
	procurementExceptions,
	productBatches,
	products,
	purchaseItems,
	purchaseRequestItems,
	purchaseRequests,
	purchases,
	stockLedger,
	supplierInvoiceItems,
	supplierInvoices,
	supplierPaymentAllocations,
	suppliers,
} from "@evaluna/db/schema";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	or,
	sql,
	sum,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "../init";

export const procurementRouter = router({
	// ───────────────────────────────────────────────────────────────────────────
	// 1. PURCHASE REQUESTS (PR)
	// ───────────────────────────────────────────────────────────────────────────

	listRequests: protectedProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
					priority: z.string().optional(),
					department: z.string().optional(),
					search: z.string().optional(),
					limit: z.number().min(1).max(100).default(50),
					cursor: z.number().nullish(),
				})
				.optional(),
		)
		.query(async ({ input, ctx }) => {
			const branchId = ctx.user.branchId;
			const filters: any[] = [];

			if (branchId) {
				filters.push(
					or(
						eq(purchaseRequests.branch_id, branchId),
						sql`${purchaseRequests.branch_id} IS NULL`,
					),
				);
			}

			if (input?.status) {
				filters.push(eq(purchaseRequests.status, input.status));
			}
			if (input?.priority) {
				filters.push(eq(purchaseRequests.priority, input.priority));
			}
			if (input?.department) {
				filters.push(eq(purchaseRequests.department, input.department));
			}
			if (input?.search) {
				filters.push(
					or(
						ilike(purchaseRequests.request_number, `%${input.search}%`),
						ilike(purchaseRequests.requested_by, `%${input.search}%`),
					),
				);
			}

			const items = await db
				.select({
					id: purchaseRequests.id,
					request_number: purchaseRequests.request_number,
					branch_id: purchaseRequests.branch_id,
					department: purchaseRequests.department,
					requested_by: purchaseRequests.requested_by,
					priority: purchaseRequests.priority,
					status: purchaseRequests.status,
					notes: purchaseRequests.notes,
					required_by_date: purchaseRequests.required_by_date,
					approved_by: purchaseRequests.approved_by,
					approved_at: purchaseRequests.approved_at,
					rejection_reason: purchaseRequests.rejection_reason,
					estimated_total: purchaseRequests.estimated_total,
					created_at: purchaseRequests.created_at,
					item_count: count(purchaseRequestItems.id),
				})
				.from(purchaseRequests)
				.leftJoin(
					purchaseRequestItems,
					eq(purchaseRequests.id, purchaseRequestItems.request_id),
				)
				.where(filters.length > 0 ? and(...filters) : undefined)
				.groupBy(purchaseRequests.id)
				.orderBy(desc(purchaseRequests.created_at))
				.limit(input?.limit ?? 50);

			return items;
		}),

	getRequest: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const [request] = await db
				.select()
				.from(purchaseRequests)
				.where(eq(purchaseRequests.id, input.id))
				.limit(1);

			if (!request) throw new Error("Purchase request not found");

			const items = await db
				.select({
					id: purchaseRequestItems.id,
					request_id: purchaseRequestItems.request_id,
					product_id: purchaseRequestItems.product_id,
					product_name: products.name,
					product_sku: products.sku,
					quantity: purchaseRequestItems.quantity,
					estimated_unit_cost: purchaseRequestItems.estimated_unit_cost,
					preferred_supplier_id: purchaseRequestItems.preferred_supplier_id,
					preferred_supplier_name: suppliers.name,
					notes: purchaseRequestItems.notes,
				})
				.from(purchaseRequestItems)
				.leftJoin(products, eq(purchaseRequestItems.product_id, products.id))
				.leftJoin(
					suppliers,
					eq(purchaseRequestItems.preferred_supplier_id, suppliers.id),
				)
				.where(eq(purchaseRequestItems.request_id, input.id));

			return {
				...request,
				items,
			};
		}),

	createRequest: protectedProcedure
		.input(
			z.object({
				department: z.string().default("Warehouse"),
				priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
				requiredByDate: z.date().optional(),
				notes: z.string().optional(),
				items: z.array(
					z.object({
						productId: z.number(),
						quantity: z.number().min(0.001),
						estimatedUnitCost: z.number().min(0).default(0),
						preferredSupplierId: z.number().optional(),
						notes: z.string().optional(),
					}),
				).min(1),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const reqNumber = `REQ-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

			// Accurate total calculation
			const estimatedTotal = input.items.reduce(
				(sum, it) => sum + it.quantity * it.estimatedUnitCost,
				0,
			);

			return await db.transaction(async (tx) => {
				const [pr] = await tx
					.insert(purchaseRequests)
					.values({
						request_number: reqNumber,
						branch_id: ctx.user.branchId ?? 1,
						department: input.department,
						requested_by: ctx.user.name || ctx.user.email || ctx.user.id,
						priority: input.priority,
						status: "pending_approval",
						notes: input.notes,
						required_by_date: input.requiredByDate,
						estimated_total: estimatedTotal.toFixed(2),
					})
					.returning();

				await tx.insert(purchaseRequestItems).values(
					input.items.map((it) => ({
						request_id: pr.id,
						product_id: it.productId,
						quantity: it.quantity.toString(),
						estimated_unit_cost: it.estimatedUnitCost.toFixed(2),
						preferred_supplier_id: it.preferredSupplierId,
						notes: it.notes,
					})),
				);

				return pr;
			});
		}),

	approveRequest: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input, ctx }) => {
			const [existing] = await db
				.select()
				.from(purchaseRequests)
				.where(eq(purchaseRequests.id, input.id))
				.limit(1);

			if (!existing) throw new Error("Purchase request not found");
			if (existing.status !== "pending_approval" && existing.status !== "draft") {
				throw new Error(`Cannot approve a request with status ${existing.status}`);
			}

			const [updated] = await db
				.update(purchaseRequests)
				.set({
					status: "approved",
					approved_by: ctx.user.name || ctx.user.email || ctx.user.id,
					approved_at: new Date(),
				})
				.where(eq(purchaseRequests.id, input.id))
				.returning();

			return updated;
		}),

	rejectRequest: protectedProcedure
		.input(z.object({ id: z.number(), reason: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			const [existing] = await db
				.select()
				.from(purchaseRequests)
				.where(eq(purchaseRequests.id, input.id))
				.limit(1);

			if (!existing) throw new Error("Purchase request not found");
			if (existing.status === "converted") {
				throw new Error("Cannot reject an already converted request");
			}

			const [updated] = await db
				.update(purchaseRequests)
				.set({
					status: "rejected",
					rejection_reason: input.reason,
					approved_by: ctx.user.name || ctx.user.email || ctx.user.id,
					approved_at: new Date(),
				})
				.where(eq(purchaseRequests.id, input.id))
				.returning();

			return updated;
		}),

	convertToPO: protectedProcedure
		.input(
			z.object({
				requestId: z.number(),
				supplierId: z.number(),
				expectedDeliveryDate: z.date().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			return await db.transaction(async (tx) => {
				const [pr] = await tx
					.select()
					.from(purchaseRequests)
					.where(eq(purchaseRequests.id, input.requestId))
					.limit(1);

				if (!pr) throw new Error("Purchase request not found");
				if (pr.status !== "approved") {
					throw new Error("Only approved purchase requests can be converted to PO");
				}

				const prItems = await tx
					.select()
					.from(purchaseRequestItems)
					.where(eq(purchaseRequestItems.request_id, pr.id));

				if (prItems.length === 0) {
					throw new Error("Purchase request has no items to order");
				}

				const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
				const grnNumber = `GRN-${Math.floor(10000 + Math.random() * 90000)}`;

				// Calculate totals
				const total = prItems.reduce(
					(sum, it) =>
						sum + Number(it.quantity) * Number(it.estimated_unit_cost || 0),
					0,
				);

				const [po] = await tx
					.insert(purchases)
					.values({
						branch_id: pr.branch_id ?? ctx.user.branchId ?? 1,
						po_number: poNumber,
						purchase_request_id: pr.id,
						grn_number: grnNumber,
						supplier_id: input.supplierId,
						total_amount: total.toFixed(2),
						user_uid: ctx.user.id,
						status: "pending",
						receiving_status: "pending",
						invoice_status: "pending",
						expected_delivery_date: input.expectedDeliveryDate,
						notes: input.notes || pr.notes,
						amount_paid: "0",
						payment_status: "unpaid",
					})
					.returning();

				await tx.insert(purchaseItems).values(
					prItems.map((it) => ({
						purchase_id: po.id,
						product_id: it.product_id,
						quantity: it.quantity,
						price: it.estimated_unit_cost || "0",
					})),
				);

				// Mark PR as converted
				await tx
					.update(purchaseRequests)
					.set({ status: "converted" })
					.where(eq(purchaseRequests.id, pr.id));

				return po;
			});
		}),

	// ───────────────────────────────────────────────────────────────────────────
	// 2. PURCHASE ORDERS (PO)
	// ───────────────────────────────────────────────────────────────────────────

	listPOs: protectedProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
					receivingStatus: z.string().optional(),
					paymentStatus: z.string().optional(),
					supplierId: z.number().optional(),
					search: z.string().optional(),
					limit: z.number().min(1).max(100).default(50),
				})
				.optional(),
		)
		.query(async ({ input, ctx }) => {
			const branchId = ctx.user.branchId;
			const filters: any[] = [];

			if (branchId) {
				filters.push(
					or(
						eq(purchases.branch_id, branchId),
						sql`${purchases.branch_id} IS NULL`,
					),
				);
			}

			if (input?.status) {
				filters.push(eq(purchases.status, input.status));
			}
			if (input?.receivingStatus) {
				filters.push(eq(purchases.receiving_status, input.receivingStatus));
			}
			if (input?.paymentStatus) {
				filters.push(eq(purchases.payment_status, input.paymentStatus));
			}
			if (input?.supplierId) {
				filters.push(eq(purchases.supplier_id, input.supplierId));
			}
			if (input?.search) {
				filters.push(
					or(
						ilike(purchases.po_number, `%${input.search}%`),
						ilike(purchases.grn_number, `%${input.search}%`),
						ilike(suppliers.name, `%${input.search}%`),
					),
				);
			}

			const rows = await db
				.select({
					id: purchases.id,
					po_number: purchases.po_number,
					grn_number: purchases.grn_number,
					purchase_request_id: purchases.purchase_request_id,
					supplier_id: purchases.supplier_id,
					supplier_name: suppliers.name,
					supplier_phone: suppliers.phone,
					status: purchases.status,
					receiving_status: purchases.receiving_status,
					invoice_status: purchases.invoice_status,
					payment_status: purchases.payment_status,
					expected_delivery_date: purchases.expected_delivery_date,
					confirmed_delivery_date: purchases.confirmed_delivery_date,
					total_amount: purchases.total_amount,
					amount_paid: purchases.amount_paid,
					created_at: purchases.created_at,
					item_count: count(purchaseItems.id),
					total_quantity: sum(purchaseItems.quantity),
				})
				.from(purchases)
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchase_id))
				.where(filters.length > 0 ? and(...filters) : undefined)
				.groupBy(purchases.id, suppliers.id, suppliers.name, suppliers.phone)
				.orderBy(desc(purchases.created_at))
				.limit(input?.limit ?? 50);

			return rows.map((r) => ({
				...r,
				item_count: Number(r.item_count) || 0,
				total_quantity: Number(r.total_quantity) || 0,
			}));
		}),

	getPO: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const [po] = await db
				.select({
					id: purchases.id,
					po_number: purchases.po_number,
					grn_number: purchases.grn_number,
					purchase_request_id: purchases.purchase_request_id,
					branch_id: purchases.branch_id,
					supplier_id: purchases.supplier_id,
					supplier_name: suppliers.name,
					supplier_phone: suppliers.phone,
					supplier_email: suppliers.email,
					supplier_address: suppliers.address,
					total_amount: purchases.total_amount,
					cgst_amount: purchases.cgst_amount,
					sgst_amount: purchases.sgst_amount,
					igst_amount: purchases.igst_amount,
					status: purchases.status,
					receiving_status: purchases.receiving_status,
					invoice_status: purchases.invoice_status,
					payment_status: purchases.payment_status,
					amount_paid: purchases.amount_paid,
					expected_delivery_date: purchases.expected_delivery_date,
					confirmed_delivery_date: purchases.confirmed_delivery_date,
					notes: purchases.notes,
					terms_and_conditions: purchases.terms_and_conditions,
					created_at: purchases.created_at,
				})
				.from(purchases)
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.where(eq(purchases.id, input.id))
				.limit(1);

			if (!po) throw new Error("Purchase order not found");

			// Fetch items with product details
			const items = await db
				.select({
					id: purchaseItems.id,
					purchase_id: purchaseItems.purchase_id,
					product_id: purchaseItems.product_id,
					product_name: products.name,
					product_sku: products.sku,
					quantity: purchaseItems.quantity,
					price: purchaseItems.price,
					cgst_rate: purchaseItems.cgst_rate,
					sgst_rate: purchaseItems.sgst_rate,
					igst_rate: purchaseItems.igst_rate,
					cgst_amount: purchaseItems.cgst_amount,
					sgst_amount: purchaseItems.sgst_amount,
					igst_amount: purchaseItems.igst_amount,
				})
				.from(purchaseItems)
				.innerJoin(products, eq(purchaseItems.product_id, products.id))
				.where(eq(purchaseItems.purchase_id, input.id));

			// Fetch associated Goods Receipts
			const grns = await db
				.select()
				.from(goodsReceiptNotes)
				.where(eq(goodsReceiptNotes.purchase_id, input.id))
				.orderBy(desc(goodsReceiptNotes.received_at));

			// Fetch associated Invoices
			const invoices = await db
				.select()
				.from(supplierInvoices)
				.where(eq(supplierInvoices.purchase_id, input.id))
				.orderBy(desc(supplierInvoices.invoice_date));

			// Fetch Payment Allocations
			const paymentAllocations = await db
				.select()
				.from(supplierPaymentAllocations)
				.where(eq(supplierPaymentAllocations.purchase_id, input.id))
				.orderBy(desc(supplierPaymentAllocations.payment_date));

			// Fetch Exceptions
			const exceptions = await db
				.select()
				.from(procurementExceptions)
				.where(eq(procurementExceptions.purchase_id, input.id))
				.orderBy(desc(procurementExceptions.created_at));

			return {
				...po,
				items,
				grns,
				invoices,
				paymentAllocations,
				exceptions,
			};
		}),

	createPO: protectedProcedure
		.input(
			z.object({
				supplierId: z.number(),
				expectedDeliveryDate: z.date().optional(),
				notes: z.string().optional(),
				termsAndConditions: z.string().optional(),
				items: z
					.array(
						z.object({
							productId: z.number(),
							quantity: z.number().min(0.001),
							price: z.number().min(0),
							cgstRate: z.number().optional().default(0),
							sgstRate: z.number().optional().default(0),
							igstRate: z.number().optional().default(0),
						}),
					)
					.min(1),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
			const grnNumber = `GRN-${Math.floor(10000 + Math.random() * 90000)}`;

			// Accurate calculation of taxes and totals
			let subtotal = 0;
			let totalCgst = 0;
			let totalSgst = 0;
			let totalIgst = 0;

			const calculatedItems = input.items.map((it) => {
				const lineBase = it.quantity * it.price;
				subtotal += lineBase;
				const cgst = lineBase * (it.cgstRate / 100);
				const sgst = lineBase * (it.sgstRate / 100);
				const igst = lineBase * (it.igstRate / 100);
				totalCgst += cgst;
				totalSgst += sgst;
				totalIgst += igst;

				return {
					...it,
					cgstAmount: cgst.toFixed(2),
					sgstAmount: sgst.toFixed(2),
					igstAmount: igst.toFixed(2),
				};
			});

			const grandTotal = subtotal + totalCgst + totalSgst + totalIgst;

			return await db.transaction(async (tx) => {
				const [newPurchase] = await tx
					.insert(purchases)
					.values({
						branch_id: ctx.user.branchId ?? 1,
						po_number: poNumber,
						grn_number: grnNumber,
						supplier_id: input.supplierId,
						total_amount: grandTotal.toFixed(2),
						cgst_amount: totalCgst.toFixed(2),
						sgst_amount: totalSgst.toFixed(2),
						igst_amount: totalIgst.toFixed(2),
						user_uid: ctx.user.id,
						status: "pending",
						receiving_status: "pending",
						invoice_status: "pending",
						amount_paid: "0",
						payment_status: "unpaid",
						expected_delivery_date: input.expectedDeliveryDate,
						notes: input.notes,
						terms_and_conditions: input.termsAndConditions,
					})
					.returning();

				await tx.insert(purchaseItems).values(
					calculatedItems.map((it) => ({
						purchase_id: newPurchase.id,
						product_id: it.productId,
						quantity: it.quantity.toString(),
						price: it.price.toFixed(2),
						cgst_rate: it.cgstRate.toString(),
						sgst_rate: it.sgstRate.toString(),
						igst_rate: it.igstRate.toString(),
						cgst_amount: it.cgstAmount,
						sgst_amount: it.sgstAmount,
						igst_amount: it.igstAmount,
					})),
				);

				// IMPORTANT: Inventory/stockLedger is NOT altered here.
				// Inventory is only updated upon physical warehouse receiving & quality acceptance.

				return newPurchase;
			});
		}),

	updatePODeliveryDate: protectedProcedure
		.input(
			z.object({
				purchaseId: z.number(),
				expectedDeliveryDate: z.date(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(purchases)
				.set({
					expected_delivery_date: input.expectedDeliveryDate,
					notes: input.notes ? sql`COALESCE(${purchases.notes}, '') || '\n' || ${input.notes}` : undefined,
				})
				.where(eq(purchases.id, input.purchaseId))
				.returning();

			return updated;
		}),

	confirmPO: protectedProcedure
		.input(
			z.object({
				purchaseId: z.number(),
				confirmedDeliveryDate: z.date(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(purchases)
				.set({
					status: "ordered",
					confirmed_delivery_date: input.confirmedDeliveryDate,
					notes: input.notes ? sql`COALESCE(${purchases.notes}, '') || '\n' || ${input.notes}` : undefined,
				})
				.where(eq(purchases.id, input.purchaseId))
				.returning();

			return updated;
		}),

	cancelPO: protectedProcedure
		.input(z.object({ purchaseId: z.number(), reason: z.string().min(1) }))
		.mutation(async ({ input }) => {
			const [po] = await db
				.select()
				.from(purchases)
				.where(eq(purchases.id, input.purchaseId))
				.limit(1);

			if (!po) throw new Error("Purchase order not found");
			if (po.receiving_status === "received" || po.status === "completed") {
				throw new Error("Cannot cancel an already received or completed order");
			}

			const [updated] = await db
				.update(purchases)
				.set({
					status: "cancelled",
					notes: sql`COALESCE(${purchases.notes}, '') || '\nCancellation Reason: ' || ${input.reason}`,
				})
				.where(eq(purchases.id, input.purchaseId))
				.returning();

			return updated;
		}),

	// ───────────────────────────────────────────────────────────────────────────
	// 3. WAREHOUSE GOODS RECEIVING & INSPECTION (GRN)
	// ───────────────────────────────────────────────────────────────────────────

	listGRNs: protectedProcedure
		.input(
			z
				.object({
					purchaseId: z.number().optional(),
					limit: z.number().min(1).max(100).default(50),
				})
				.optional(),
		)
		.query(async ({ input, ctx }) => {
			const branchId = ctx.user.branchId;
			const filters: any[] = [];

			if (branchId) {
				filters.push(eq(goodsReceiptNotes.branch_id, branchId));
			}
			if (input?.purchaseId) {
				filters.push(eq(goodsReceiptNotes.purchase_id, input.purchaseId));
			}

			return await db
				.select({
					id: goodsReceiptNotes.id,
					grn_number: goodsReceiptNotes.grn_number,
					purchase_id: goodsReceiptNotes.purchase_id,
					po_number: purchases.po_number,
					supplier_name: suppliers.name,
					received_by: goodsReceiptNotes.received_by,
					received_at: goodsReceiptNotes.received_at,
					delivery_note_number: goodsReceiptNotes.delivery_note_number,
					vehicle_number: goodsReceiptNotes.vehicle_number,
					status: goodsReceiptNotes.status,
					notes: goodsReceiptNotes.notes,
				})
				.from(goodsReceiptNotes)
				.leftJoin(purchases, eq(goodsReceiptNotes.purchase_id, purchases.id))
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.where(filters.length > 0 ? and(...filters) : undefined)
				.orderBy(desc(goodsReceiptNotes.received_at))
				.limit(input?.limit ?? 50);
		}),

	getGRN: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const [grn] = await db
				.select({
					id: goodsReceiptNotes.id,
					grn_number: goodsReceiptNotes.grn_number,
					purchase_id: goodsReceiptNotes.purchase_id,
					branch_id: goodsReceiptNotes.branch_id,
					received_by: goodsReceiptNotes.received_by,
					received_at: goodsReceiptNotes.received_at,
					delivery_note_number: goodsReceiptNotes.delivery_note_number,
					vehicle_number: goodsReceiptNotes.vehicle_number,
					status: goodsReceiptNotes.status,
					notes: goodsReceiptNotes.notes,
					po_number: purchases.po_number,
					supplier_name: suppliers.name,
				})
				.from(goodsReceiptNotes)
				.leftJoin(purchases, eq(goodsReceiptNotes.purchase_id, purchases.id))
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.where(eq(goodsReceiptNotes.id, input.id))
				.limit(1);

			if (!grn) throw new Error("Goods receipt note not found");

			const items = await db
				.select({
					id: goodsReceiptItems.id,
					product_id: goodsReceiptItems.product_id,
					product_name: products.name,
					product_sku: products.sku,
					ordered_quantity: goodsReceiptItems.ordered_quantity,
					received_quantity: goodsReceiptItems.received_quantity,
					accepted_quantity: goodsReceiptItems.accepted_quantity,
					rejected_quantity: goodsReceiptItems.rejected_quantity,
					damaged_quantity: goodsReceiptItems.damaged_quantity,
					shortage_quantity: goodsReceiptItems.shortage_quantity,
					batch_number: goodsReceiptItems.batch_number,
					inspection_status: goodsReceiptItems.inspection_status,
					inspection_notes: goodsReceiptItems.inspection_notes,
				})
				.from(goodsReceiptItems)
				.innerJoin(products, eq(goodsReceiptItems.product_id, products.id))
				.where(eq(goodsReceiptItems.grn_id, input.id));

			return {
				...grn,
				items,
			};
		}),

	recordReceipt: protectedProcedure
		.input(
			z.object({
				purchaseId: z.number(),
				deliveryNoteNumber: z.string().optional(),
				vehicleNumber: z.string().optional(),
				notes: z.string().optional(),
				items: z
					.array(
						z.object({
							purchaseItemId: z.number().optional(),
							productId: z.number(),
							orderedQuantity: z.number().min(0),
							receivedQuantity: z.number().min(0),
							acceptedQuantity: z.number().min(0),
							rejectedQuantity: z.number().min(0).default(0),
							damagedQuantity: z.number().min(0).default(0),
							shortageQuantity: z.number().min(0).default(0),
							unitCost: z.number().min(0).default(0),
							batchNumber: z.string().optional(),
							expiryDate: z.date().optional(),
							inspectionNotes: z.string().optional(),
						}),
					)
					.min(1),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const branchId = ctx.user.branchId ?? 1;
			const grnNumber = `GRN-${Math.floor(10000 + Math.random() * 90000)}`;

			return await db.transaction(async (tx) => {
				const [po] = await tx
					.select()
					.from(purchases)
					.where(eq(purchases.id, input.purchaseId))
					.limit(1);

				if (!po) throw new Error("Purchase order not found");

				let hasDiscrepancy = false;
				let totalAccepted = 0;
				let totalOrdered = 0;

				for (const item of input.items) {
					totalOrdered += item.orderedQuantity;
					totalAccepted += item.acceptedQuantity;
					if (
						item.rejectedQuantity > 0 ||
						item.damagedQuantity > 0 ||
						item.shortageQuantity > 0 ||
						item.acceptedQuantity < item.orderedQuantity
					) {
						hasDiscrepancy = true;
					}
				}

				// 1. Create Goods Receipt Note
				const [grn] = await tx
					.insert(goodsReceiptNotes)
					.values({
						grn_number: grnNumber,
						purchase_id: input.purchaseId,
						branch_id: branchId,
						received_by: ctx.user.name || ctx.user.email || ctx.user.id,
						received_at: new Date(),
						delivery_note_number: input.deliveryNoteNumber,
						vehicle_number: input.vehicleNumber,
						status: hasDiscrepancy ? "partially_accepted" : "accepted",
						notes: input.notes,
					})
					.returning();

				// 2. Insert items and post to stock ledger for ACCEPTED goods only
				for (const item of input.items) {
					await tx.insert(goodsReceiptItems).values({
						grn_id: grn.id,
						purchase_item_id: item.purchaseItemId,
						product_id: item.productId,
						ordered_quantity: item.orderedQuantity.toString(),
						received_quantity: item.receivedQuantity.toString(),
						accepted_quantity: item.acceptedQuantity.toString(),
						rejected_quantity: item.rejectedQuantity.toString(),
						damaged_quantity: item.damagedQuantity.toString(),
						shortage_quantity: item.shortageQuantity.toString(),
						unit_cost: item.unitCost.toFixed(2),
						batch_number: item.batchNumber,
						expiry_date: item.expiryDate,
						inspection_status:
							item.rejectedQuantity > 0 || item.damagedQuantity > 0
								? "conditional"
								: "passed",
						inspection_notes: item.inspectionNotes,
					});

					// Update stock ledger ONLY for accepted quantities
					if (item.acceptedQuantity > 0) {
						await tx.insert(stockLedger).values({
							branch_id: branchId,
							product_id: item.productId,
							transaction_type: "in",
							quantity: item.acceptedQuantity,
							unit_cost: item.unitCost.toFixed(2),
							total_cost: (item.acceptedQuantity * item.unitCost).toFixed(2),
							reference_id: grn.id,
							reference_type: "grn",
						});

						// Update or insert into branchInventory
						const [existingInv] = await tx
							.select()
							.from(branchInventory)
							.where(
								and(
									eq(branchInventory.product_id, item.productId),
									eq(branchInventory.branch_id, branchId),
								),
							)
							.limit(1);

						if (existingInv) {
							await tx
								.update(branchInventory)
								.set({
									in_stock: (Number(existingInv.in_stock) || 0) + item.acceptedQuantity,
								})
								.where(eq(branchInventory.id, existingInv.id));
						} else {
							await tx.insert(branchInventory).values({
								branch_id: branchId,
								product_id: item.productId,
								in_stock: item.acceptedQuantity,
								reserved_stock: 0,
								reorder_level: 10,
							});
						}
					}

					// Record Discrepancy Exception if needed
					if (item.rejectedQuantity > 0 || item.damagedQuantity > 0) {
						await tx.insert(procurementExceptions).values({
							purchase_id: input.purchaseId,
							grn_id: grn.id,
							exception_type: item.damagedQuantity > 0 ? "damage" : "shortage",
							severity: item.damagedQuantity > 5 ? "high" : "medium",
							description: `Item #${item.productId}: Rejected ${item.rejectedQuantity}, Damaged ${item.damagedQuantity}, Shortage ${item.shortageQuantity}`,
							status: "open",
						});
					}
				}

				// 3. Update PO receiving status
				const newReceivingStatus =
					totalAccepted >= totalOrdered
						? "received"
						: totalAccepted > 0
							? "partial"
							: "inspection_failed";

				await tx
					.update(purchases)
					.set({
						status: newReceivingStatus === "received" ? "received" : po.status,
						receiving_status: newReceivingStatus,
					})
					.where(eq(purchases.id, input.purchaseId));

				return grn;
			});
		}),

	// ───────────────────────────────────────────────────────────────────────────
	// 4. SUPPLIER INVOICES & 3-WAY MATCHING
	// ───────────────────────────────────────────────────────────────────────────

	listInvoices: protectedProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
					matchingStatus: z.string().optional(),
					paymentStatus: z.string().optional(),
					supplierId: z.number().optional(),
					purchaseId: z.number().optional(),
					search: z.string().optional(),
					limit: z.number().min(1).max(100).default(50),
				})
				.optional(),
		)
		.query(async ({ input, ctx }) => {
			const branchId = ctx.user.branchId;
			const filters: any[] = [];

			if (branchId) {
				filters.push(
					or(
						eq(supplierInvoices.branch_id, branchId),
						sql`${supplierInvoices.branch_id} IS NULL`,
					),
				);
			}

			if (input?.status) {
				filters.push(eq(supplierInvoices.status, input.status));
			}
			if (input?.matchingStatus) {
				filters.push(eq(supplierInvoices.matching_status, input.matchingStatus));
			}
			if (input?.paymentStatus) {
				filters.push(eq(supplierInvoices.payment_status, input.paymentStatus));
			}
			if (input?.supplierId) {
				filters.push(eq(supplierInvoices.supplier_id, input.supplierId));
			}
			if (input?.purchaseId) {
				filters.push(eq(supplierInvoices.purchase_id, input.purchaseId));
			}
			if (input?.search) {
				filters.push(
					or(
						ilike(supplierInvoices.invoice_number, `%${input.search}%`),
						ilike(suppliers.name, `%${input.search}%`),
					),
				);
			}

			return await db
				.select({
					id: supplierInvoices.id,
					invoice_number: supplierInvoices.invoice_number,
					supplier_id: supplierInvoices.supplier_id,
					supplier_name: suppliers.name,
					purchase_id: supplierInvoices.purchase_id,
					po_number: purchases.po_number,
					invoice_date: supplierInvoices.invoice_date,
					due_date: supplierInvoices.due_date,
					subtotal: supplierInvoices.subtotal,
					tax_amount: supplierInvoices.tax_amount,
					total_amount: supplierInvoices.total_amount,
					amount_paid: supplierInvoices.amount_paid,
					outstanding_amount: supplierInvoices.outstanding_amount,
					matching_status: supplierInvoices.matching_status,
					status: supplierInvoices.status,
					payment_status: supplierInvoices.payment_status,
					verified_by: supplierInvoices.verified_by,
					verified_at: supplierInvoices.verified_at,
					approved_by: supplierInvoices.approved_by,
					approved_at: supplierInvoices.approved_at,
					created_at: supplierInvoices.created_at,
				})
				.from(supplierInvoices)
				.leftJoin(suppliers, eq(supplierInvoices.supplier_id, suppliers.id))
				.leftJoin(purchases, eq(supplierInvoices.purchase_id, purchases.id))
				.where(filters.length > 0 ? and(...filters) : undefined)
				.orderBy(desc(supplierInvoices.created_at))
				.limit(input?.limit ?? 50);
		}),

	getInvoice: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const [invoice] = await db
				.select({
					id: supplierInvoices.id,
					invoice_number: supplierInvoices.invoice_number,
					supplier_id: supplierInvoices.supplier_id,
					supplier_name: suppliers.name,
					purchase_id: supplierInvoices.purchase_id,
					po_number: purchases.po_number,
					branch_id: supplierInvoices.branch_id,
					invoice_date: supplierInvoices.invoice_date,
					due_date: supplierInvoices.due_date,
					subtotal: supplierInvoices.subtotal,
					tax_amount: supplierInvoices.tax_amount,
					total_amount: supplierInvoices.total_amount,
					amount_paid: supplierInvoices.amount_paid,
					outstanding_amount: supplierInvoices.outstanding_amount,
					matching_status: supplierInvoices.matching_status,
					status: supplierInvoices.status,
					payment_status: supplierInvoices.payment_status,
					verified_by: supplierInvoices.verified_by,
					verified_at: supplierInvoices.verified_at,
					approved_by: supplierInvoices.approved_by,
					approved_at: supplierInvoices.approved_at,
					discrepancy_notes: supplierInvoices.discrepancy_notes,
					document_url: supplierInvoices.document_url,
					created_at: supplierInvoices.created_at,
				})
				.from(supplierInvoices)
				.leftJoin(suppliers, eq(supplierInvoices.supplier_id, suppliers.id))
				.leftJoin(purchases, eq(supplierInvoices.purchase_id, purchases.id))
				.where(eq(supplierInvoices.id, input.id))
				.limit(1);

			if (!invoice) throw new Error("Supplier invoice not found");

			const items = await db
				.select({
					id: supplierInvoiceItems.id,
					product_id: supplierInvoiceItems.product_id,
					product_name: products.name,
					product_sku: products.sku,
					billed_quantity: supplierInvoiceItems.billed_quantity,
					unit_price: supplierInvoiceItems.unit_price,
					tax_rate: supplierInvoiceItems.tax_rate,
					tax_amount: supplierInvoiceItems.tax_amount,
					line_total: supplierInvoiceItems.line_total,
					po_quantity: supplierInvoiceItems.po_quantity,
					grn_quantity: supplierInvoiceItems.grn_quantity,
					price_variance: supplierInvoiceItems.price_variance,
					quantity_variance: supplierInvoiceItems.quantity_variance,
				})
				.from(supplierInvoiceItems)
				.innerJoin(products, eq(supplierInvoiceItems.product_id, products.id))
				.where(eq(supplierInvoiceItems.invoice_id, input.id));

			const allocations = await db
				.select()
				.from(supplierPaymentAllocations)
				.where(eq(supplierPaymentAllocations.invoice_id, input.id))
				.orderBy(desc(supplierPaymentAllocations.payment_date));

			return {
				...invoice,
				items,
				allocations,
			};
		}),

	registerInvoice: protectedProcedure
		.input(
			z.object({
				purchaseId: z.number(),
				supplierId: z.number(),
				invoiceNumber: z.string().min(1),
				invoiceDate: z.date(),
				dueDate: z.date().optional(),
				documentUrl: z.string().optional(),
				items: z
					.array(
						z.object({
							purchaseItemId: z.number().optional(),
							productId: z.number(),
							billedQuantity: z.number().min(0.001),
							unitPrice: z.number().min(0),
							taxRate: z.number().min(0).default(0),
						}),
					)
					.min(1),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Duplicate Invoice Detection
			const [duplicate] = await db
				.select()
				.from(supplierInvoices)
				.where(
					and(
						eq(supplierInvoices.supplier_id, input.supplierId),
						eq(supplierInvoices.invoice_number, input.invoiceNumber.trim()),
					),
				)
				.limit(1);

			if (duplicate) {
				throw new Error(
					`Invoice #${input.invoiceNumber} has already been registered for this supplier.`,
				);
			}

			// Fetch PO details and items
			const [po] = await db
				.select()
				.from(purchases)
				.where(eq(purchases.id, input.purchaseId))
				.limit(1);

			if (!po) throw new Error("Purchase order not found");

			const poItems = await db
				.select()
				.from(purchaseItems)
				.where(eq(purchaseItems.purchase_id, input.purchaseId));

			const poItemMap = new Map(poItems.map((it) => [it.product_id, it]));

			// Fetch latest Goods Receipts for this PO to compare delivered vs billed
			const grnItems = await db
				.select({
					product_id: goodsReceiptItems.product_id,
					total_accepted: sum(goodsReceiptItems.accepted_quantity),
				})
				.from(goodsReceiptItems)
				.innerJoin(
					goodsReceiptNotes,
					eq(goodsReceiptItems.grn_id, goodsReceiptNotes.id),
				)
				.where(eq(goodsReceiptNotes.purchase_id, input.purchaseId))
				.groupBy(goodsReceiptItems.product_id);

			const grnMap = new Map(
				grnItems.map((g) => [g.product_id, Number(g.total_accepted) || 0]),
			);

			// 3-Way Matching Computation
			let isPriceMismatch = false;
			let isQuantityMismatch = false;
			let calculatedSubtotal = 0;
			let calculatedTax = 0;

			const evaluatedItems = input.items.map((item) => {
				const poItem = poItemMap.get(item.productId);
				const grnAccepted = grnMap.get(item.productId) ?? 0;
				const poPrice = poItem ? Number(poItem.price) : 0;
				const poQty = poItem ? Number(poItem.quantity) : 0;

				const priceVariance = item.unitPrice - poPrice;
				const qtyVariance = item.billedQuantity - (grnAccepted > 0 ? grnAccepted : poQty);

				if (Math.abs(priceVariance) > 0.01) {
					isPriceMismatch = true;
				}
				if (qtyVariance > 0.001) {
					isQuantityMismatch = true;
				}

				const lineBase = item.billedQuantity * item.unitPrice;
				const lineTax = lineBase * (item.taxRate / 100);
				const lineTotal = lineBase + lineTax;

				calculatedSubtotal += lineBase;
				calculatedTax += lineTax;

				return {
					...item,
					lineTotal,
					lineTax,
					poQty,
					grnAccepted,
					priceVariance,
					qtyVariance,
				};
			});

			const calculatedGrandTotal = calculatedSubtotal + calculatedTax;

			let matchingStatus = "matched";
			if (isPriceMismatch && isQuantityMismatch) {
				matchingStatus = "price_and_quantity_mismatch";
			} else if (isPriceMismatch) {
				matchingStatus = "price_mismatch";
			} else if (isQuantityMismatch) {
				matchingStatus = "quantity_mismatch";
			}

			return await db.transaction(async (tx) => {
				const [inv] = await tx
					.insert(supplierInvoices)
					.values({
						invoice_number: input.invoiceNumber.trim(),
						supplier_id: input.supplierId,
						purchase_id: input.purchaseId,
						branch_id: po.branch_id ?? ctx.user.branchId ?? 1,
						invoice_date: input.invoiceDate,
						due_date: input.dueDate,
						subtotal: calculatedSubtotal.toFixed(2),
						tax_amount: calculatedTax.toFixed(2),
						total_amount: calculatedGrandTotal.toFixed(2),
						amount_paid: "0",
						outstanding_amount: calculatedGrandTotal.toFixed(2),
						matching_status: matchingStatus,
						status: matchingStatus === "matched" ? "verified" : "draft",
						payment_status: "unpaid",
						verified_by:
							matchingStatus === "matched"
								? ctx.user.name || ctx.user.email
								: null,
						verified_at: matchingStatus === "matched" ? new Date() : null,
						document_url: input.documentUrl,
					})
					.returning();

				await tx.insert(supplierInvoiceItems).values(
					evaluatedItems.map((item) => ({
						invoice_id: inv.id,
						purchase_item_id: item.purchaseItemId,
						product_id: item.productId,
						billed_quantity: item.billedQuantity.toString(),
						unit_price: item.unitPrice.toFixed(2),
						tax_rate: item.taxRate.toString(),
						tax_amount: item.lineTax.toFixed(2),
						line_total: item.lineTotal.toFixed(2),
						po_quantity: item.poQty.toString(),
						grn_quantity: item.grnAccepted.toString(),
						price_variance: item.priceVariance.toFixed(2),
						quantity_variance: item.qtyVariance.toString(),
					})),
				);

				// Log exception if mismatch occurred
				if (matchingStatus !== "matched") {
					await tx.insert(procurementExceptions).values({
						purchase_id: input.purchaseId,
						invoice_id: inv.id,
						exception_type:
							matchingStatus === "price_mismatch"
								? "price_variance"
								: "quantity_variance",
						severity: "high",
						description: `3-Way match flagged ${matchingStatus} on Invoice #${input.invoiceNumber}`,
						status: "open",
					});
				}

				// Update PO invoice status
				await tx
					.update(purchases)
					.set({ invoice_status: "invoiced" })
					.where(eq(purchases.id, input.purchaseId));

				return inv;
			});
		}),

	approveInvoice: protectedProcedure
		.input(
			z.object({
				invoiceId: z.number(),
				allowVarianceOverride: z.boolean().default(false),
				overrideNotes: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const [inv] = await db
				.select()
				.from(supplierInvoices)
				.where(eq(supplierInvoices.id, input.invoiceId))
				.limit(1);

			if (!inv) throw new Error("Invoice not found");

			if (
				inv.matching_status !== "matched" &&
				inv.matching_status !== "variance_approved" &&
				!input.allowVarianceOverride
			) {
				throw new Error(
					`Invoice has matching status '${inv.matching_status}'. You must provide variance override approval to proceed.`,
				);
			}

			return await db.transaction(async (tx) => {
				const [updated] = await tx
					.update(supplierInvoices)
					.set({
						status: "approved_for_payment",
						matching_status:
							inv.matching_status !== "matched"
								? "variance_approved"
								: inv.matching_status,
						approved_by: ctx.user.name || ctx.user.email || ctx.user.id,
						approved_at: new Date(),
						discrepancy_notes: input.overrideNotes
							? sql`COALESCE(${supplierInvoices.discrepancy_notes}, '') || '\nOverride: ' || ${input.overrideNotes}`
							: undefined,
					})
					.where(eq(supplierInvoices.id, input.invoiceId))
					.returning();

				// Increase supplier's outstanding ledger balance by the approved payable amount
				const [sup] = await tx
					.select()
					.from(suppliers)
					.where(eq(suppliers.id, inv.supplier_id))
					.limit(1);

				if (sup) {
					const newBalance =
						Number(sup.outstanding_balance || 0) + Number(inv.outstanding_amount);
					await tx
						.update(suppliers)
						.set({ outstanding_balance: newBalance.toFixed(2) })
						.where(eq(suppliers.id, sup.id));
				}

				return updated;
			});
		}),

	// ───────────────────────────────────────────────────────────────────────────
	// 5. SUPPLIER PAYMENT EXECUTION & ALLOCATION
	// ───────────────────────────────────────────────────────────────────────────

	executePayment: protectedProcedure
		.input(
			z.object({
				invoiceId: z.number(),
				amount: z.number().min(0.01),
				paymentMode: z
					.enum(["bank_transfer", "cheque", "cash", "upi", "neft"])
					.default("bank_transfer"),
				referenceNumber: z.string().optional(),
				bankAccountId: z.number().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			return await db.transaction(async (tx) => {
				const [inv] = await tx
					.select()
					.from(supplierInvoices)
					.where(eq(supplierInvoices.id, input.invoiceId))
					.limit(1);

				if (!inv) throw new Error("Invoice not found");

				if (
					inv.status !== "approved_for_payment" &&
					inv.status !== "partially_paid"
				) {
					throw new Error(
						`Invoice must be approved for payment by Finance before disbursement (current status: ${inv.status})`,
					);
				}

				const currentOutstanding = Number(inv.outstanding_amount);
				if (input.amount > currentOutstanding + 0.01) {
					throw new Error(
						`Payment amount (₹${input.amount}) exceeds outstanding invoice balance (₹${currentOutstanding.toFixed(2)})`,
					);
				}

				// Deduct from Bank Account if provided
				if (input.bankAccountId) {
					const [bank] = await tx
						.select()
						.from(bankAccounts)
						.where(eq(bankAccounts.id, input.bankAccountId))
						.limit(1);

					if (!bank) throw new Error("Bank account not found");
					const bankBalance = Number(bank.current_balance);
					if (bankBalance < input.amount) {
						throw new Error(
							`Insufficient funds in bank account ${bank.account_name} (Balance: ₹${bankBalance.toFixed(2)}, Required: ₹${input.amount.toFixed(2)})`,
						);
					}

					await tx
						.update(bankAccounts)
						.set({
							current_balance: (bankBalance - input.amount).toFixed(2),
						})
						.where(eq(bankAccounts.id, bank.id));
				}

				// Create Payment Record
				const paymentRef =
					input.referenceNumber ||
					`PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

				// Record Allocation
				const [allocation] = await tx
					.insert(supplierPaymentAllocations)
					.values({
						invoice_id: inv.id,
						purchase_id: inv.purchase_id,
						allocated_amount: input.amount.toFixed(2),
						payment_mode: input.paymentMode,
						reference_number: paymentRef,
						notes: input.notes,
						created_by: ctx.user.name || ctx.user.email || ctx.user.id,
					})
					.returning();

				// Update Invoice Amount Paid and Status
				const newInvPaid = Number(inv.amount_paid) + input.amount;
				const newInvOutstanding = Math.max(0, currentOutstanding - input.amount);
				const isFullyPaid = newInvOutstanding <= 0.01;

				await tx
					.update(supplierInvoices)
					.set({
						amount_paid: newInvPaid.toFixed(2),
						outstanding_amount: newInvOutstanding.toFixed(2),
						status: isFullyPaid ? "paid" : "partially_paid",
						payment_status: isFullyPaid ? "paid" : "partially_paid",
					})
					.where(eq(supplierInvoices.id, inv.id));

				// Update Purchase Order Payment Status
				const [po] = await tx
					.select()
					.from(purchases)
					.where(eq(purchases.id, inv.purchase_id))
					.limit(1);

				if (po) {
					const newPOPaid = Number(po.amount_paid) + input.amount;
					const poTotal = Number(po.total_amount);
					const isPOFullyPaid = newPOPaid >= poTotal - 0.01;

					await tx
						.update(purchases)
						.set({
							amount_paid: newPOPaid.toFixed(2),
							payment_status: isPOFullyPaid ? "paid" : "partial",
							// Lifecycle Closure: If both received and fully paid, mark closed/completed!
							status:
								po.receiving_status === "received" && isPOFullyPaid
									? "completed"
									: po.status,
						})
						.where(eq(purchases.id, po.id));
				}

				// Deduct from Supplier Outstanding Balance
				const [sup] = await tx
					.select()
					.from(suppliers)
					.where(eq(suppliers.id, inv.supplier_id))
					.limit(1);

				if (sup) {
					const newSupBal = Math.max(
						0,
						Number(sup.outstanding_balance || 0) - input.amount,
					);
					await tx
						.update(suppliers)
						.set({ outstanding_balance: newSupBal.toFixed(2) })
						.where(eq(suppliers.id, sup.id));
				}

				return {
					success: true,
					allocationId: allocation.id,
					amountPaid: input.amount,
					remainingOutstanding: newInvOutstanding,
				};
			});
		}),

	// ───────────────────────────────────────────────────────────────────────────
	// 6. PROCUREMENT OVERVIEW KPIS & METRICS
	// ───────────────────────────────────────────────────────────────────────────

	getProcurementKpis: protectedProcedure.query(async ({ ctx }) => {
		const branchId = ctx.user.branchId;

		const [
			poStats,
			prStats,
			invoiceStats,
			exceptionStats,
			supplierStats,
		] = await Promise.all([
			// PO aggregations
			db
				.select({
					totalPOs: count(purchases.id),
					draftPOs: sql<number>`count(*) filter (where ${purchases.status} = 'draft')`,
					pendingApproval: sql<number>`count(*) filter (where ${purchases.status} = 'pending')`,
					awaitingConfirmation: sql<number>`count(*) filter (where ${purchases.status} = 'ordered' and ${purchases.confirmed_delivery_date} is null)`,
					upcomingDeliveries: sql<number>`count(*) filter (where ${purchases.receiving_status} = 'pending' and ${purchases.expected_delivery_date} >= CURRENT_DATE)`,
					partiallyReceived: sql<number>`count(*) filter (where ${purchases.receiving_status} = 'partial')`,
					receivedAwaitingInvoice: sql<number>`count(*) filter (where ${purchases.receiving_status} = 'received' and ${purchases.invoice_status} = 'pending')`,
					closedPOs: sql<number>`count(*) filter (where ${purchases.status} in ('completed', 'closed'))`,
					totalSpend: sql<number>`coalesce(sum(${purchases.total_amount}::numeric), 0)`,
				})
				.from(purchases)
				.where(branchId ? eq(purchases.branch_id, branchId) : undefined),

			// PR aggregations
			db
				.select({
					pendingPRs: sql<number>`count(*) filter (where ${purchaseRequests.status} = 'pending_approval')`,
					approvedPRs: sql<number>`count(*) filter (where ${purchaseRequests.status} = 'approved')`,
				})
				.from(purchaseRequests)
				.where(branchId ? eq(purchaseRequests.branch_id, branchId) : undefined),

			// Invoice & Payables aggregations
			db
				.select({
					totalInvoiced: sql<number>`coalesce(sum(${supplierInvoices.total_amount}::numeric), 0)`,
					totalOutstanding: sql<number>`coalesce(sum(${supplierInvoices.outstanding_amount}::numeric), 0)`,
					pendingMatching: sql<number>`count(*) filter (where ${supplierInvoices.matching_status} = 'pending')`,
					mismatchedInvoices: sql<number>`count(*) filter (where ${supplierInvoices.matching_status} not in ('matched', 'variance_approved'))`,
					awaitingFinanceApproval: sql<number>`count(*) filter (where ${supplierInvoices.status} in ('draft', 'verified'))`,
				})
				.from(supplierInvoices)
				.where(branchId ? eq(supplierInvoices.branch_id, branchId) : undefined),

			// Exception aggregations
			db
				.select({
					openExceptions: sql<number>`count(*) filter (where ${procurementExceptions.status} = 'open')`,
				})
				.from(procurementExceptions),

			// Active Suppliers
			db
				.select({
					activeSuppliers: count(suppliers.id),
				})
				.from(suppliers),
		]);

		return {
			totalPOs: Number(poStats[0]?.totalPOs) || 0,
			draftPOs: Number(poStats[0]?.draftPOs) || 0,
			pendingApproval: Number(poStats[0]?.pendingApproval) || 0,
			awaitingConfirmation: Number(poStats[0]?.awaitingConfirmation) || 0,
			upcomingDeliveries: Number(poStats[0]?.upcomingDeliveries) || 0,
			partiallyReceived: Number(poStats[0]?.partiallyReceived) || 0,
			receivedAwaitingInvoice: Number(poStats[0]?.receivedAwaitingInvoice) || 0,
			closedPOs: Number(poStats[0]?.closedPOs) || 0,
			totalSpend: Number(poStats[0]?.totalSpend) || 0,

			pendingPRs: Number(prStats[0]?.pendingPRs) || 0,
			approvedPRs: Number(prStats[0]?.approvedPRs) || 0,

			totalInvoiced: Number(invoiceStats[0]?.totalInvoiced) || 0,
			totalOutstanding: Number(invoiceStats[0]?.totalOutstanding) || 0,
			pendingMatching: Number(invoiceStats[0]?.pendingMatching) || 0,
			mismatchedInvoices: Number(invoiceStats[0]?.mismatchedInvoices) || 0,
			awaitingFinanceApproval: Number(invoiceStats[0]?.awaitingFinanceApproval) || 0,

			openExceptions: Number(exceptionStats[0]?.openExceptions) || 0,
			activeSuppliers: Number(supplierStats[0]?.activeSuppliers) || 0,
		};
	}),
});
