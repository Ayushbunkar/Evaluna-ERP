import {
	products,
	purchaseItems,
	purchases,
	staff,
	stockAdjustments,
	suppliers,
} from "@evaluna/db/schema";
import { count, desc, eq, sum } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const putterRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;

			const receivingCount = await db
				.select({ count: count() })
				.from(purchases)
				.where(eq(purchases.status, "pending"));
			// Using purchases with "received" status that need putaway (since we don't have a putLists table)
			const putAwayCount = await db
				.select({ count: count() })
				.from(purchases)
				.where(eq(purchases.status, "received"));
			const damageCount = await db
				.select({ count: count() })
				.from(stockAdjustments)
				.where(eq(stockAdjustments.adjustment_type, "damage"));

			return {
				itemsToReceive: receivingCount[0]?.count || 0,
				putAwayQueue: putAwayCount[0]?.count || 0,
				missingStock: 0,
				damageReports: damageCount[0]?.count || 0,
				saleReturns: 0,
				efficiencyPct: 100,
				recentActivity: [],
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
		.query(async () => {
			return [];
		}),

	getSaleReturns: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async () => {
			return [];
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
			const results = await db
				.select({
					id: purchases.id,
					status: purchases.status,
				})
				.from(purchases)
				.where(eq(purchases.status, "completed"))
				.orderBy(desc(purchases.id))
				.limit(50);

			return results.map((r) => ({
				id: `PA-${r.id}`,
				product: "Various",
				qty: 0,
				location: "Warehouse",
				completed_by: "Unknown",
				time_taken: "N/A",
				date: "N/A",
			}));
		}),

	getReports: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async () => {
			return [];
		}),
});
