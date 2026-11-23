import {
	branchInventory,
	orderItems,
	orders,
	products,
	stockLedger,
} from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

export interface StockDeductionItem {
	productId: number;
	quantity: number | string;
	price?: number | string;
}

export interface DeductStockOptions {
	orderId: number;
	branchId?: number | null;
	items: StockDeductionItem[];
	referenceType?: string;
	actorId?: number | null;
}

export interface RestoreStockOptions {
	orderId: number;
	branchId?: number | null;
	reason?: string;
	actorId?: number | null;
}

export interface AdjustStockOptions {
	orderId: number;
	branchId?: number | null;
	newItems: StockDeductionItem[];
	actorId?: number | null;
}

/**
 * Normalizes branch ID, ensuring a valid integer branch is always targeted.
 * Defaults to 1 (main warehouse branch) if null or undefined.
 */
export function resolveEffectiveBranchId(branchId?: number | null): number {
	if (typeof branchId === "number" && branchId > 0) {
		return branchId;
	}
	return 1;
}

/**
 * Aggregates duplicate line items containing the same product ID into a single quantity.
 */
export function aggregateOrderItems(
	items: StockDeductionItem[],
): Map<number, { productId: number; quantity: number; price: number }> {
	const map = new Map<number, { productId: number; quantity: number; price: number }>();

	for (const item of items) {
		const pid = Number(item.productId);
		const qty = Number(item.quantity || 0);
		const prc = Number(item.price || 0);

		if (!pid || qty <= 0) continue;

		const existing = map.get(pid);
		if (existing) {
			existing.quantity = Math.round((existing.quantity + qty) * 1000) / 1000;
			// Keep highest or latest non-zero price
			if (prc > 0) existing.price = prc;
		} else {
			map.set(pid, {
				productId: pid,
				quantity: Math.round(qty * 1000) / 1000,
				price: prc,
			});
		}
	}

	return map;
}

/**
 * Deducts warehouse stock atomically for a finalized invoice/order.
 * Idempotent: If stock was already deducted for this order, it will not deduct again.
 */
export async function deductStockForOrder(
	tx: any,
	options: DeductStockOptions,
): Promise<{
	success: boolean;
	alreadyDeducted: boolean;
	deductedItems: Array<{ productId: number; quantity: number }>;
}> {
	const { orderId, referenceType = "sale" } = options;
	const branchId = resolveEffectiveBranchId(options.branchId);

	// 1. Idempotency Check: Check if stock was already deducted for this order
	const existingDeductions = await tx
		.select({
			id: stockLedger.id,
			productId: stockLedger.product_id,
			quantity: stockLedger.quantity,
		})
		.from(stockLedger)
		.where(
			and(
				eq(stockLedger.reference_id, orderId),
				eq(stockLedger.reference_type, referenceType),
				eq(stockLedger.transaction_type, "out"),
			),
		);

	if (existingDeductions.length > 0) {
		return {
			success: true,
			alreadyDeducted: true,
			deductedItems: existingDeductions.map((d: any) => ({
				productId: d.productId,
				quantity: Math.abs(Number(d.quantity)),
			})),
		};
	}

	// 2. Aggregate quantities by product ID
	const aggregated = aggregateOrderItems(options.items);
	if (aggregated.size === 0) {
		return { success: true, alreadyDeducted: false, deductedItems: [] };
	}

	const productIds = Array.from(aggregated.keys());

	// 3. Fetch product details for accurate cost valuation and mapping
	const productRows = await tx
		.select({
			id: products.id,
			name: products.name,
			sku: products.sku,
			baseProcurementPrice: products.base_procurement_price,
			price: products.price,
		})
		.from(products)
		.where(inArray(products.id, productIds));

	const productMap = new Map<number, any>(productRows.map((p: any) => [p.id, p]));

	// 4. Fetch existing branch inventory records for this branch
	const existingStockRows = await tx
		.select()
		.from(branchInventory)
		.where(
			and(
				eq(branchInventory.branch_id, branchId),
				inArray(branchInventory.product_id, productIds),
			),
		);

	const stockMap = new Map<number, any>(
		existingStockRows.map((s: any) => [s.product_id, s]),
	);

	const deductedItems: Array<{ productId: number; quantity: number }> = [];
	const ledgerEntries: any[] = [];

	// 5. Atomic Stock Deduction per product
	for (const [pid, item] of Array.from(aggregated.entries())) {
		const qty = item.quantity;
		const prod = productMap.get(pid);

		// Resolve valuation unit cost (prefer procurement price, fallback to catalog price / line price)
		const unitCost =
			Number(prod?.baseProcurementPrice) > 0
				? Number(prod.baseProcurementPrice)
				: Number(prod?.price) > 0
					? Number(prod.price)
					: item.price;

		const existing = stockMap.get(pid);
		if (existing) {
			await tx
				.update(branchInventory)
				.set({
					in_stock: sql`${branchInventory.in_stock} - ${qty}`,
				})
				.where(eq(branchInventory.id, existing.id));
		} else {
			// Auto-provision branch inventory record with negative stock reflecting real sold quantity
			await tx.insert(branchInventory).values({
				branch_id: branchId,
				product_id: pid,
				in_stock: -qty,
				reserved_stock: 0,
				reorder_level: 10,
			});
		}

		deductedItems.push({ productId: pid, quantity: qty });

		ledgerEntries.push({
			branch_id: branchId,
			product_id: pid,
			transaction_type: "out",
			quantity: -qty,
			unit_cost: unitCost.toFixed(2),
			total_cost: (unitCost * qty).toFixed(2),
			reference_id: orderId,
			reference_type: referenceType,
		});
	}

	// 6. Record Stock Ledger movements
	if (ledgerEntries.length > 0) {
		await tx.insert(stockLedger).values(ledgerEntries);
	}

	return {
		success: true,
		alreadyDeducted: false,
		deductedItems,
	};
}

/**
 * Restores warehouse stock atomically when a finalized order/invoice is cancelled.
 * Guarantees:
 * - Cancelling unfinalized drafts does NOT add phantom stock.
 * - Restores exactly what was previously deducted for this order.
 * - Idempotent: repeated cancellations do not restore stock multiple times.
 */
export async function restoreStockForOrder(
	tx: any,
	options: RestoreStockOptions,
): Promise<{
	restored: boolean;
	reason?: string;
	itemsRestored: Array<{ productId: number; quantity: number }>;
}> {
	const { orderId } = options;
	const branchId = resolveEffectiveBranchId(options.branchId);

	// 1. Check all prior OUT movements for this order
	const priorDeductions = await tx
		.select({
			productId: stockLedger.product_id,
			quantity: stockLedger.quantity,
			unitCost: stockLedger.unit_cost,
		})
		.from(stockLedger)
		.where(
			and(
				eq(stockLedger.reference_id, orderId),
				eq(stockLedger.reference_type, "sale"),
				eq(stockLedger.transaction_type, "out"),
			),
		);

	if (priorDeductions.length === 0) {
		return {
			restored: false,
			reason: "Order had no prior stock deduction (unfinalized draft or already zero-stock).",
			itemsRestored: [],
		};
	}

	// 2. Check prior cancellation restorations for this order
	const priorRestorations = await tx
		.select({
			productId: stockLedger.product_id,
			quantity: stockLedger.quantity,
		})
		.from(stockLedger)
		.where(
			and(
				eq(stockLedger.reference_id, orderId),
				eq(stockLedger.reference_type, "order_cancellation"),
				eq(stockLedger.transaction_type, "in"),
			),
		);

	// Calculate net quantity previously deducted per product
	const netDeductedMap = new Map<number, { quantity: number; unitCost: string }>();

	for (const d of priorDeductions) {
		const pid = Number(d.productId);
		const qty = Math.abs(Number(d.quantity));
		const current = netDeductedMap.get(pid) || { quantity: 0, unitCost: String(d.unitCost || "0") };
		current.quantity += qty;
		netDeductedMap.set(pid, current);
	}

	for (const r of priorRestorations) {
		const pid = Number(r.productId);
		const qty = Math.abs(Number(r.quantity));
		const current = netDeductedMap.get(pid);
		if (current) {
			current.quantity -= qty;
		}
	}

	// Filter products that actually need restoration (net > 0)
	const itemsToRestore: Array<{ productId: number; quantity: number; unitCost: string }> = [];
	for (const [pid, data] of Array.from(netDeductedMap.entries())) {
		const rounded = Math.round(data.quantity * 1000) / 1000;
		if (rounded > 0) {
			itemsToRestore.push({
				productId: pid,
				quantity: rounded,
				unitCost: data.unitCost,
			});
		}
	}

	if (itemsToRestore.length === 0) {
		return {
			restored: false,
			reason: "All previously deducted quantities for this order were already restored.",
			itemsRestored: [],
		};
	}

	const productIds = itemsToRestore.map((i) => i.productId);

	// 3. Fetch existing inventory records
	const existingStocks = await tx
		.select()
		.from(branchInventory)
		.where(
			and(
				eq(branchInventory.branch_id, branchId),
				inArray(branchInventory.product_id, productIds),
			),
		);

	const stockMap = new Map<number, any>(existingStocks.map((s: any) => [s.product_id, s]));
	const ledgerEntries: any[] = [];
	const itemsRestoredResult: Array<{ productId: number; quantity: number }> = [];

	// 4. Atomically restore stock in branch inventory
	for (const item of itemsToRestore) {
		const existing = stockMap.get(item.productId);
		if (existing) {
			await tx
				.update(branchInventory)
				.set({
					in_stock: sql`COALESCE(${branchInventory.in_stock}, 0) + ${item.quantity}`,
					reserved_stock: sql`GREATEST(0, COALESCE(${branchInventory.reserved_stock}, 0) - ${item.quantity})`,
				})
				.where(eq(branchInventory.id, existing.id));
		} else {
			await tx.insert(branchInventory).values({
				branch_id: branchId,
				product_id: item.productId,
				in_stock: item.quantity,
				reserved_stock: 0,
				reorder_level: 10,
			});
		}

		itemsRestoredResult.push({
			productId: item.productId,
			quantity: item.quantity,
		});

		ledgerEntries.push({
			branch_id: branchId,
			product_id: item.productId,
			transaction_type: "in",
			quantity: item.quantity,
			unit_cost: item.unitCost,
			total_cost: (Number(item.unitCost) * item.quantity).toFixed(2),
			reference_id: orderId,
			reference_type: "order_cancellation",
		});
	}

	// 5. Append restoration stock ledger entries
	if (ledgerEntries.length > 0) {
		await tx.insert(stockLedger).values(ledgerEntries);
	}

	return {
		restored: true,
		itemsRestored: itemsRestoredResult,
	};
}

/**
 * Handles adjustments to order items on confirmed / stock-deducted orders.
 * Calculates deltas between previous deductions and new item quantities:
 * - If delta > 0: customer increased quantity -> deducts additional stock.
 * - If delta < 0: customer decreased quantity -> restores difference to stock.
 */
export async function adjustStockForOrderQuantityChange(
	tx: any,
	options: AdjustStockOptions,
): Promise<{
	adjusted: boolean;
	deltas: Array<{ productId: number; delta: number }>;
}> {
	const { orderId } = options;
	const branchId = resolveEffectiveBranchId(options.branchId);

	// 1. Get net previously deducted stock for this order
	const priorDeductions = await tx
		.select({
			productId: stockLedger.product_id,
			quantity: stockLedger.quantity,
			unitCost: stockLedger.unit_cost,
		})
		.from(stockLedger)
		.where(
			and(
				eq(stockLedger.reference_id, orderId),
				eq(stockLedger.reference_type, "sale"),
				eq(stockLedger.transaction_type, "out"),
			),
		);

	// If order has no prior deductions, stock was never deducted (e.g. review phase)
	if (priorDeductions.length === 0) {
		return { adjusted: false, deltas: [] };
	}

	const priorRestorations = await tx
		.select({
			productId: stockLedger.product_id,
			quantity: stockLedger.quantity,
		})
		.from(stockLedger)
		.where(
			and(
				eq(stockLedger.reference_id, orderId),
				eq(stockLedger.reference_type, "order_cancellation"),
				eq(stockLedger.transaction_type, "in"),
			),
		);

	const netDeductedMap = new Map<number, { quantity: number; unitCost: string }>();

	for (const d of priorDeductions) {
		const pid = Number(d.productId);
		const qty = Math.abs(Number(d.quantity));
		const current = netDeductedMap.get(pid) || { quantity: 0, unitCost: String(d.unitCost || "0") };
		current.quantity += qty;
		netDeductedMap.set(pid, current);
	}

	for (const r of priorRestorations) {
		const pid = Number(r.productId);
		const qty = Math.abs(Number(r.quantity));
		const current = netDeductedMap.get(pid);
		if (current) {
			current.quantity -= qty;
		}
	}

	const newAggregated = aggregateOrderItems(options.newItems);
	const allProductIds = Array.from(
		new Set<number>([
			...Array.from(netDeductedMap.keys()),
			...Array.from(newAggregated.keys()),
		]),
	);

	const deltas: Array<{ productId: number; delta: number; unitCost: string }> = [];

	for (const pid of allProductIds) {
		const oldQty = Math.round((netDeductedMap.get(pid)?.quantity || 0) * 1000) / 1000;
		const newQty = Math.round((newAggregated.get(pid)?.quantity || 0) * 1000) / 1000;
		const delta = Math.round((newQty - oldQty) * 1000) / 1000;

		if (delta !== 0) {
			const unitCost =
				netDeductedMap.get(pid)?.unitCost ||
				String(newAggregated.get(pid)?.price || "0");
			deltas.push({ productId: pid, delta, unitCost });
		}
	}

	if (deltas.length === 0) {
		return { adjusted: true, deltas: [] };
	}

	const productIds = deltas.map((d) => d.productId);
	const existingStocks = await tx
		.select()
		.from(branchInventory)
		.where(
			and(
				eq(branchInventory.branch_id, branchId),
				inArray(branchInventory.product_id, productIds),
			),
		);

	const stockMap = new Map<number, any>(existingStocks.map((s: any) => [s.product_id, s]));
	const ledgerEntries: any[] = [];

	for (const item of deltas) {
		const existing = stockMap.get(item.productId);
		if (item.delta > 0) {
			// Additional sale: deduct delta from stock
			if (existing) {
				await tx
					.update(branchInventory)
					.set({
						in_stock: sql`${branchInventory.in_stock} - ${item.delta}`,
					})
					.where(eq(branchInventory.id, existing.id));
			} else {
				await tx.insert(branchInventory).values({
					branch_id: branchId,
					product_id: item.productId,
					in_stock: -item.delta,
					reserved_stock: 0,
					reorder_level: 10,
				});
			}

			ledgerEntries.push({
				branch_id: branchId,
				product_id: item.productId,
				transaction_type: "out",
				quantity: -item.delta,
				unit_cost: item.unitCost,
				total_cost: (Number(item.unitCost) * item.delta).toFixed(2),
				reference_id: orderId,
				reference_type: "sale",
			});
		} else if (item.delta < 0) {
			// Reduced quantity: restore difference to stock
			const restoreQty = Math.abs(item.delta);
			if (existing) {
				await tx
					.update(branchInventory)
					.set({
						in_stock: sql`COALESCE(${branchInventory.in_stock}, 0) + ${restoreQty}`,
					})
					.where(eq(branchInventory.id, existing.id));
			} else {
				await tx.insert(branchInventory).values({
					branch_id: branchId,
					product_id: item.productId,
					in_stock: restoreQty,
					reserved_stock: 0,
					reorder_level: 10,
				});
			}

			ledgerEntries.push({
				branch_id: branchId,
				product_id: item.productId,
				transaction_type: "in",
				quantity: restoreQty,
				unit_cost: item.unitCost,
				total_cost: (Number(item.unitCost) * restoreQty).toFixed(2),
				reference_id: orderId,
				reference_type: "order_cancellation",
			});
		}
	}

	if (ledgerEntries.length > 0) {
		await tx.insert(stockLedger).values(ledgerEntries);
	}

	return {
		adjusted: true,
		deltas: deltas.map((d) => ({ productId: d.productId, delta: d.delta })),
	};
}
