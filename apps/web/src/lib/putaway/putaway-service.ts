import {
	branchInventory,
	branchLocations,
	products,
	putawayDiscrepancies,
	putawayTaskItems,
	putawayTasks,
	stockLedger,
	vanStockAudits,
	vanStockPlanItems,
	vanStockPlans,
} from "@evaluna/db/schema";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

/**
 * Creates a putaway task for a rejected van stock plan so the putter
 * can physically return the picked goods to warehouse shelves.
 */
export async function createPutawayTaskForRejectedPlan(
	tx: any,
	plan: any,
	rejectionReason: string,
	actorName: string,
) {
	// Check if a putaway task already exists for this plan to ensure idempotency
	const [existingTask] = await tx
		.select()
		.from(putawayTasks)
		.where(
			and(
				eq(putawayTasks.source_type, "VAN_MANIFEST_REJECTION"),
				eq(putawayTasks.source_reference, plan.plan_code),
			),
		)
		.limit(1);

	if (existingTask) {
		return existingTask;
	}

	// Fetch plan items if not populated
	let items = plan.items;
	if (!items || items.length === 0) {
		items = await tx
			.select()
			.from(vanStockPlanItems)
			.where(eq(vanStockPlanItems.plan_id, plan.id));
	}

	// Filter items that have picked or planned quantities to restock
	const restockItems = [];
	let totalQty = 0;

	for (const item of items) {
		const packed = Number(item.packed_quantity || 0);
		const picked = Number(item.picked_quantity || 0);
		const planned = Number(item.planned_quantity || 0);
		const qtyToRestock = packed > 0 ? packed : (picked > 0 ? picked : planned);

		if (qtyToRestock > 0) {
			// Resolve product name and sku
			let prodName = item.product?.name;
			let prodSku = item.product?.sku;

			if (!prodName) {
				const [p] = await tx
					.select({ name: products.name, sku: products.sku })
					.from(products)
					.where(eq(products.id, item.product_id))
					.limit(1);
				prodName = p?.name || `Product #${item.product_id}`;
				prodSku = p?.sku || `SKU-${item.product_id}`;
			}

			restockItems.push({
				productId: item.product_id,
				productName: prodName,
				sku: prodSku,
				quantity: qtyToRestock,
				vanPlanItemId: item.id,
			});
			totalQty += qtyToRestock;
		}
	}

	const taskNumber = `PUT-REJ-${plan.plan_code || plan.id}-${Date.now().toString().slice(-4)}`;

	const [createdTask] = await tx
		.insert(putawayTasks)
		.values({
			task_number: taskNumber,
			branch_id: plan.branch_id || 1,
			source_type: "VAN_MANIFEST_REJECTION",
			source_id: plan.id,
			source_reference: plan.plan_code || `VSP-${plan.id}`,
			vehicle_number: plan.vehicle?.registration_number || null,
			driver_name: plan.driver?.name || null,
			status: "PENDING",
			total_items: restockItems.length,
			total_expected_quantity: totalQty.toFixed(3),
			total_putaway_quantity: "0.000",
			rejection_reason: rejectionReason || "Manager rejected manifest",
			notes: `Rejected van manifest requiring physical putaway restock to warehouse inventory. Reason: ${rejectionReason || "N/A"}`,
			created_at: new Date(),
			updated_at: new Date(),
		})
		.returning();

	for (const item of restockItems) {
		await tx.insert(putawayTaskItems).values({
			task_id: createdTask.id,
			product_id: item.productId,
			product_name: item.productName,
			sku: item.sku,
			expected_quantity: item.quantity.toFixed(3),
			verified_quantity: item.quantity.toFixed(3),
			putaway_quantity: "0.000",
			remaining_quantity: item.quantity.toFixed(3),
			damaged_quantity: "0.000",
			rejected_quantity: "0.000",
			condition: "USABLE",
			location_name: "Warehouse Main Storage",
			status: "PENDING",
			created_at: new Date(),
		});
	}

	return createdTask;
}

/**
 * Creates a putaway task for a supplier Goods Received Note (GRN)
 */
export async function createPutawayTaskForGRN(
	tx: any,
	grn: any,
	items: any[],
	branchId: number,
	receivedBy: string,
) {
	// Idempotency check
	const [existingTask] = await tx
		.select()
		.from(putawayTasks)
		.where(
			and(
				eq(putawayTasks.source_type, "SUPPLIER_GRN"),
				eq(putawayTasks.source_reference, grn.grn_number),
			),
		)
		.limit(1);

	if (existingTask) return existingTask;

	let totalQty = 0;
	const taskItems = [];

	for (const item of items) {
		const acceptedQty = Number(item.acceptedQuantity || item.accepted_quantity || 0);
		if (acceptedQty > 0) {
			const prodId = item.productId || item.product_id;
			let prodName = item.customProductName || item.product_name;
			let prodSku = item.customSku || item.sku;

			if (!prodName) {
				const [p] = await tx
					.select({ name: products.name, sku: products.sku })
					.from(products)
					.where(eq(products.id, prodId))
					.limit(1);
				prodName = p?.name || `Product #${prodId}`;
				prodSku = p?.sku || `SKU-${prodId}`;
			}

			taskItems.push({
				productId: prodId,
				productName: prodName,
				sku: prodSku,
				quantity: acceptedQty,
				unitCost: Number(item.unitCost || item.unit_cost || 0),
				batchNumber: item.batchNumber || item.batch_number || null,
				expiryDate: item.expiryDate || item.expiry_date || null,
			});
			totalQty += acceptedQty;
		}
	}

	if (taskItems.length === 0) return null;

	const taskNumber = `PUT-GRN-${grn.grn_number}-${Date.now().toString().slice(-4)}`;

	const [createdTask] = await tx
		.insert(putawayTasks)
		.values({
			task_number: taskNumber,
			branch_id: branchId,
			source_type: "SUPPLIER_GRN",
			source_id: grn.id,
			source_reference: grn.grn_number,
			purchase_id: grn.purchase_id,
			grn_id: grn.id,
			supplier_name: grn.supplier_name || null,
			vehicle_number: grn.vehicle_number || null,
			status: "PENDING",
			total_items: taskItems.length,
			total_expected_quantity: totalQty.toFixed(3),
			total_putaway_quantity: "0.000",
			verified_by: receivedBy,
			notes: `Supplier Goods Received Note awaiting physical shelf put-away. GRN: ${grn.grn_number}`,
			created_at: new Date(),
			updated_at: new Date(),
		})
		.returning();

	for (const item of taskItems) {
		await tx.insert(putawayTaskItems).values({
			task_id: createdTask.id,
			product_id: item.productId,
			product_name: item.productName,
			sku: item.sku,
			expected_quantity: item.quantity.toFixed(3),
			verified_quantity: item.quantity.toFixed(3),
			putaway_quantity: "0.000",
			remaining_quantity: item.quantity.toFixed(3),
			damaged_quantity: "0.000",
			rejected_quantity: "0.000",
			unit_cost: item.unitCost.toFixed(2),
			batch_number: item.batchNumber,
			expiry_date: item.expiryDate ? new Date(item.expiryDate) : null,
			condition: "USABLE",
			location_name: "Warehouse Inward Bay",
			status: "PENDING",
			created_at: new Date(),
		});
	}

	return createdTask;
}

/**
 * Creates a putaway task for approved van return stock
 */
export async function createPutawayTaskForVanReturn(
	tx: any,
	plan: any,
	verifiedItems: Array<{ productId: number; acceptedQty: number; productName?: string; sku?: string }>,
	actorName: string,
) {
	const returnRef = `RET-${plan.plan_code || plan.id}`;
	const [existingTask] = await tx
		.select()
		.from(putawayTasks)
		.where(
			and(
				eq(putawayTasks.source_type, "VAN_RETURN"),
				eq(putawayTasks.source_reference, returnRef),
			),
		)
		.limit(1);

	if (existingTask) return existingTask;

	let totalQty = 0;
	const taskItems = [];

	for (const vi of verifiedItems) {
		if (vi.acceptedQty > 0) {
			let prodName = vi.productName;
			let prodSku = vi.sku;

			if (!prodName) {
				const [p] = await tx
					.select({ name: products.name, sku: products.sku })
					.from(products)
					.where(eq(products.id, vi.productId))
					.limit(1);
				prodName = p?.name || `Product #${vi.productId}`;
				prodSku = p?.sku || `SKU-${vi.productId}`;
			}

			taskItems.push({
				productId: vi.productId,
				productName: prodName,
				sku: prodSku,
				quantity: vi.acceptedQty,
			});
			totalQty += vi.acceptedQty;
		}
	}

	if (taskItems.length === 0) return null;

	const taskNumber = `PUT-VAN-${plan.plan_code || plan.id}-${Date.now().toString().slice(-4)}`;

	const [createdTask] = await tx
		.insert(putawayTasks)
		.values({
			task_number: taskNumber,
			branch_id: plan.branch_id || 1,
			source_type: "VAN_RETURN",
			source_id: plan.id,
			source_reference: returnRef,
			vehicle_number: plan.vehicle?.registration_number || null,
			driver_name: plan.driver?.name || null,
			status: "PENDING",
			total_items: taskItems.length,
			total_expected_quantity: totalQty.toFixed(3),
			total_putaway_quantity: "0.000",
			verified_by: actorName,
			notes: `Van stock return verified by sales/manager, awaiting physical warehouse put-away.`,
			created_at: new Date(),
			updated_at: new Date(),
		})
		.returning();

	for (const item of taskItems) {
		await tx.insert(putawayTaskItems).values({
			task_id: createdTask.id,
			product_id: item.productId,
			product_name: item.productName,
			sku: item.sku,
			expected_quantity: item.quantity.toFixed(3),
			verified_quantity: item.quantity.toFixed(3),
			putaway_quantity: "0.000",
			remaining_quantity: item.quantity.toFixed(3),
			condition: "USABLE",
			location_name: "Warehouse Return Bay",
			status: "PENDING",
			created_at: new Date(),
		});
	}

	return createdTask;
}

/**
 * Self-healing / On-demand sync: Ensures all rejected van stock plans
 * currently in the database have a corresponding putaway task.
 * (Handles plans like VSP-20261109-1906 created before this feature was deployed).
 */
export async function syncPendingRejectionsToPutaway(db: any, branchId?: number) {
	try {
		const conditions = [
			branchId ? eq(vanStockPlans.branch_id, branchId) : undefined,
			inArray(vanStockPlans.status, [
				"MANAGER_VERIFICATION_REJECTED",
				"DISPATCH_REJECTED",
			]),
		].filter(Boolean);

		const rejectedPlans = await db
			.select()
			.from(vanStockPlans)
			.where(and(...(conditions as any[])));

		for (const plan of rejectedPlans) {
			const [existingTask] = await db
				.select()
				.from(putawayTasks)
				.where(
					and(
						eq(putawayTasks.source_type, "VAN_MANIFEST_REJECTION"),
						eq(putawayTasks.source_reference, plan.plan_code),
					),
				)
				.limit(1);

			if (!existingTask) {
				await db.transaction(async (tx: any) => {
					await createPutawayTaskForRejectedPlan(
						tx,
						plan,
						plan.rejection_reason || "Manager rejected manifest",
						"System Sync",
					);
				});
			}
		}
	} catch (e) {
		console.warn("[syncPendingRejectionsToPutaway] Auto-sync notice:", e);
	}
}
