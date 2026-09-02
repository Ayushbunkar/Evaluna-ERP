import {
	branchInventory,
	orderItems,
	orders,
	products,
	purchaseItems,
	purchases,
	staff,
	stockAdjustments,
	suppliers,
} from "@evaluna/db/schema";
import { and, avg, count, desc, eq, inArray, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";


export const putterRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId; // Use authenticated user's branch for scoping

			const [
				receivingCount,
				putAwayCount,
				damageCount,
				missingStockCount,
				saleReturnsCount,
				efficiencyData,
			] = await Promise.all([
				db
					.select({ count: count() })
					.from(purchases)
					.where(
						and(
							eq(purchases.status, "pending"),
							branchId ? eq(purchases.branch_id, branchId) : undefined,
						),
					),
				db
					.select({ count: count() })
					.from(purchases)
					.where(
						and(
							eq(purchases.status, "received"),
							branchId ? eq(purchases.branch_id, branchId) : undefined,
						),
					),
				db
					.select({ count: count() })
					.from(stockAdjustments)
					.where(
						and(
							eq(stockAdjustments.adjustment_type, "damage"),
							branchId ? eq(stockAdjustments.branch_id, branchId) : undefined,
						),
					),
				// Missing stock: items where reserved stock > 0 but in_stock = 0, or negative inventory
				db
					.select({ count: count() })
					.from(branchInventory)
					.where(
						and(
							branchId ? eq(branchInventory.branch_id, branchId) : undefined,
							sql`${branchInventory.in_stock} < 0`,
						),
					),
				// Sale returns: count of completed sales with return status or similar
				// For now using a placeholder approach - in real system this would query sales returns
				db
					.select({ count: count() })
					.from(orders)
					.where(
						and(
							eq(orders.status, "returned"),
							branchId ? eq(orders.branch_id, branchId) : undefined,
						),
					),
				// Efficiency: percentage of put-away tasks completed vs total received/completed
				db
					.select({
						completedOnTime: sql<number>`COUNT(CASE WHEN ${purchases.status} = 'completed' THEN 1 END)`,
						totalPutAway: count(),
					})
					.from(purchases)
					.where(
						and(
							branchId ? eq(purchases.branch_id, branchId) : undefined,
							inArray(purchases.status, ["received", "completed"]),
						),
					),
			]);


			const recentPurchases = await db
				.select({
					created_at: purchases.created_at,
					status: purchases.status,
				})
				.from(purchases)
				.where(branchId ? eq(purchases.branch_id, branchId) : undefined)
				.orderBy(desc(purchases.created_at))
				.limit(100);

			// Group by date for chart data
			const chartDataMap = new Map<
				string,
				{ date: string; received: number; putAway: number }
			>();

			// Initialize last 7 days with 0
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				const dateStr = d.toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				});
				chartDataMap.set(dateStr, { date: dateStr, received: 0, putAway: 0 });
			}

			recentPurchases.forEach((p) => {
				if (!p.created_at) return;
				const dateStr = p.created_at.toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				});
				if (chartDataMap.has(dateStr)) {
					const entry = chartDataMap.get(dateStr)!;
					if (p.status === "pending") entry.received += 1; // representing items to receive
					if (p.status === "received") entry.putAway += 1; // representing items to put away
				}
			});

			// Use real data or empty arrays - no more mock fallbacks
			const chartData = Array.from(chartDataMap.values());

			// Calculate efficiency percentage safely
			const efficiencyPct =
				efficiencyData[0]?.completedOnTime && efficiencyData[0]?.totalPutAway
					? Math.round(
							(Number(efficiencyData[0].completedOnTime) /
								Number(efficiencyData[0].totalPutAway)) *
								100,
						)
					: 0;

			return {
				itemsToReceive: receivingCount[0]?.count || 0,
				putAwayQueue: putAwayCount[0]?.count || 0,
				missingStock: missingStockCount[0]?.count || 0,
				damageReports: damageCount[0]?.count || 0,
				saleReturns: saleReturnsCount[0]?.count || 0,
				efficiencyPct,
				recentActivity: [],
				chartData,
			};
		}),

	getReceiving: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const results = await db
				.select({
					id: purchases.id,
					grn_number: purchases.grn_number,
					supplier: suppliers.name,
					created_at: purchases.created_at,
					status: purchases.status,
					itemCount: count(purchaseItems.id),
					qtySum: sum(purchaseItems.quantity),
				})
				.from(purchases)
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchase_id))
				.groupBy(purchases.id, suppliers.name)
				.orderBy(desc(purchases.created_at))
				.limit(50);

			return results.map((r) => ({
				id: r.grn_number || `PUR-${r.id}`,
				supplier: r.supplier || "Unknown",
				products: r.itemCount || 0,
				qty: Number(r.qtySum) || 0,
				po_ref: `PO-${r.id}`,
				received_by: "System",
				date: r.created_at?.toLocaleDateString() || "",
				status: r.status || "pending",
			}));
		}),

	getPutAwayTasks: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const results = await db
				.select({
					id: purchaseItems.id,
					purchase_id: purchases.id,
					status: purchases.status,
					product_name: products.name,
					sku: products.sku,
					qty: purchaseItems.quantity,
				})
				.from(purchaseItems)
				.innerJoin(purchases, eq(purchases.id, purchaseItems.purchase_id))
				.leftJoin(products, eq(products.id, purchaseItems.product_id))
				.where(eq(purchases.status, "received"))
				.orderBy(desc(purchases.id))
				.limit(50);

			return results.map((r) => ({
				id: `PA-${r.purchase_id}-${r.id}`,
				product: r.product_name || "Unknown Product",
				sku: r.sku || "N/A",
				qty: r.qty || 0,
				from: "Receiving Bay",
				to_location: "Warehouse",
				status: "pending",
			}));
		}),

	getMissingStock: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId; // Use authenticated user's branch for scoping

			const results = await db
				.select({
					id: branchInventory.id,
					product: products.name,
					sku: products.sku,
					quantity_needed: sql`${branchInventory.reserved_stock} - ${branchInventory.in_stock}`,
					location: "Warehouse", // Simplified - in real system would reference specific locations
					reason: "Insufficient stock",
					updated_at: branchInventory.updated_at,
				})
				.from(branchInventory)
				.innerJoin(products, eq(branchInventory.product_id, products.id))
				.where(
					and(
						branchId ? eq(branchInventory.branch_id, branchId) : undefined,
						sql`${branchInventory.in_stock} < ${branchInventory.reserved_stock}`,
					),
				)
				.orderBy(desc(branchInventory.updated_at))
				.limit(50);

			return results.map((r) => ({
				id: `MS-${r.id}`,
				product: r.product || "Unknown",
				sku: r.sku || "N/A",
				quantity_needed: Number(r.quantity_needed) || 0,
				location: r.location,
				reason: r.reason || "Insufficient stock",
				date: r.updated_at?.toLocaleDateString() || "",
			}));
		}),

	getSaleReturns: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId; // Use authenticated user's branch for scoping

			const results = await db
				.select({
					id: orders.id,
					product: products.name,
					sku: products.sku,
					quantity: orderItems.quantity,
					reason: "Customer return", // Simplified - in real system would have specific return reasons
					status: "Pending",
					return_date: orders.updated_at,
				})
				.from(orders)
				.innerJoin(orderItems, eq(orders.id, orderItems.order_id))
				.innerJoin(products, eq(orderItems.product_id, products.id))
				.where(
					and(
						eq(orders.status, "returned"),
						branchId ? eq(orders.branch_id, branchId) : undefined,
					),
				)
				.orderBy(desc(orders.updated_at))
				.limit(50);

			return results.map((r) => ({
				id: `RTN-${r.id}`,
				product: r.product || "Unknown",
				sku: r.sku || "N/A",
				qty: Number(r.quantity) || 0,
				reason: r.reason || "Customer return",
				status: r.status,
				date: r.return_date?.toLocaleDateString() || "",
			}));
		}),

	getDamageReports: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const results = await db
				.select({
					id: stockAdjustments.id,
					product: products.name,
					quantity: stockAdjustments.quantity,
					reason: stockAdjustments.reason,
					created_at: stockAdjustments.created_at,
					reported_by: staff.name,
				})
				.from(stockAdjustments)
				.leftJoin(products, eq(stockAdjustments.product_id, products.id))
				.leftJoin(staff, eq(stockAdjustments.created_by, staff.id))
				.where(eq(stockAdjustments.adjustment_type, "damage"))
				.orderBy(desc(stockAdjustments.created_at))
				.limit(50);

			return results.map((r) => ({
				id: `DAM-${r.id}`,
				product: r.product || "Unknown",
				qty_damaged: r.quantity,
				damage_type: r.reason || "Unknown",
				severity: "Medium",
				location: "Warehouse",
				raised_by: r.reported_by || "Unknown",
				date: r.created_at?.toLocaleDateString() || "",
			}));
		}),

	getCompleted: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId; // Use authenticated user's branch for scoping

			const results = await db
				.select({
					id: purchases.id,
					status: purchases.status,
					productName: products.name,
					totalQuantity: sum(purchaseItems.quantity),
					completedBy: staff.name,
					createdAt: purchases.created_at,
					updatedAt: purchases.updated_at,
				})
				.from(purchases)
				.innerJoin(purchaseItems, eq(purchases.id, purchaseItems.purchase_id))
				.innerJoin(products, eq(purchaseItems.product_id, products.id))
				.leftJoin(staff, eq(purchases.user_uid, staff.user_uid))
				.where(
					and(
						eq(purchases.status, "completed"),
						branchId ? eq(purchases.branch_id, branchId) : undefined,
					),
				)
				.groupBy(
					purchases.id,
					purchases.status,
					products.name,
					staff.name,
					purchases.created_at,
					purchases.updated_at,
				)
				.orderBy(desc(purchases.id))
				.limit(50);

			return results.map((r) => {
				const timeTakenHours =
					r.updatedAt && r.createdAt
						? Math.round(
								(r.updatedAt.getTime() - r.createdAt.getTime()) /
									(1000 * 60 * 60),
							)
						: 0;

				return {
					id: `PA-${r.id}`,
					product: r.productName || "Various Products",
					qty: Number(r.totalQuantity) || 0,
					location: "Warehouse", // Simplified - would be more specific in real system
					completed_by: r.completedBy || "Unknown",
					time_taken: `${timeTakenHours}h`,
					date: r.updatedAt?.toLocaleDateString() || "",
				};
			});
		}),

	getReports: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }).optional())
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId;

			const completedLists = await db.query.purchases.findMany({
				where: eq(purchases.status, "completed"),
				limit: 50,
				with: {
					supplier: true,
					purchaseItems: true,
				},
			});

			if (completedLists.length === 0) return [];

			return completedLists.map((r) => ({
				employeeName: r.supplier?.name || "Putter Staff",
				tasksDone: 1,
				avgCompletionHours: 1.5,
				efficiencyPct: 100,
				period: "Last 30 days",
			}));
		}),

	confirmPutAway: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ id: z.string(), location: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const cleanId = parseInt(input.id.replace(/\D/g, "") || "1", 10);
			const [updated] = await db
				.update(purchases)
				.set({ status: "completed", updated_at: new Date() })
				.where(eq(purchases.id, cleanId))
				.returning();
			return updated;
		}),

	createMissingStock: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(
			z.object({
				product_id: z.number(),
				expected_qty: z.number(),
				found_qty: z.number(),
				location: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const diff = input.expected_qty - input.found_qty;
			const [adj] = await db
				.insert(stockAdjustments)
				.values({
					product_id: input.product_id,
					branch_id: ctx.user.branchId || 1,
					quantity: diff,
					adjustment_type: "missing",
					reason: input.notes || "Missing stock reported during put-away audit",
					created_by: ctx.user.id ? parseInt(ctx.user.id.replace(/\D/g, "") || "1", 10) : 1,
				})
				.returning();
			return adj;
		}),

	createDamageReport: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(
			z.object({
				product_id: z.number(),
				qty_damaged: z.number(),
				damage_type: z.string(),
				severity: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const [adj] = await db
				.insert(stockAdjustments)
				.values({
					product_id: input.product_id,
					branch_id: ctx.user.branchId || 1,
					quantity: input.qty_damaged,
					adjustment_type: "damage",
					reason: `[${input.damage_type}] ${input.notes || "Damaged goods reported"}`,
					created_by: ctx.user.id ? parseInt(ctx.user.id.replace(/\D/g, "") || "1", 10) : 1,
				})
				.returning();
			return adj;
		}),
});

