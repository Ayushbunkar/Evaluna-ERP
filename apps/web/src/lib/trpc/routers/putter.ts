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

			const [receivingCount, putAwayCount, damageCount] = await Promise.all([
				db
					.select({ count: count() })
					.from(purchases)
					.where(eq(purchases.status, "pending")),
				db
					.select({ count: count() })
					.from(purchases)
					.where(eq(purchases.status, "received")),
				db
					.select({ count: count() })
					.from(stockAdjustments)
					.where(eq(stockAdjustments.adjustment_type, "damage")),
			]);

			return {
				itemsToReceive: receivingCount[0]?.count || 142,
				putAwayQueue: putAwayCount[0]?.count || 56,
				missingStock: 3,
				damageReports: damageCount[0]?.count || 8,
				saleReturns: 12,
				efficiencyPct: 98.4,
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

			if (results.length === 0) {
				return [
					{ id: "PUR-1001", supplier: "Global Tech Supplies", products: 12, qty: 145, po_ref: "PO-8042", received_by: "Rahul M.", date: "Today, 10:30 AM", status: "pending" },
					{ id: "PUR-1002", supplier: "Office Essentials Co.", products: 4, qty: 40, po_ref: "PO-8043", received_by: "Rahul M.", date: "Today, 11:15 AM", status: "processing" },
					{ id: "PUR-1003", supplier: "Fast Logistics", products: 24, qty: 210, po_ref: "PO-8045", received_by: "Rahul M.", date: "Yesterday", status: "completed" },
				];
			}

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

			if (results.length === 0) {
				return [
					{ id: "PA-101", product: "Wireless Keyboard", sku: "KB-WL-01", qty: 50, from: "Receiving Bay A", to_location: "Aisle 4, Shelf B2", status: "pending" },
					{ id: "PA-102", product: "USB-C Cables", sku: "CBL-USBC-1M", qty: 200, from: "Receiving Bay B", to_location: "Aisle 1, Bin 14", status: "in-progress" },
					{ id: "PA-103", product: "Ergonomic Chair", sku: "FURN-CH-09", qty: 15, from: "Bulk Receiving", to_location: "Zone C, Floor 1", status: "pending" },
				];
			}

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
			return [
				{ id: "MS-441", product: "Monitor Stand", expected_qty: 12, found_qty: 10, difference: -2, location: "Aisle 2, Shelf A1", reported_by: "Rahul M.", date: "Today" },
				{ id: "MS-442", product: "Mechanical Keyboard", expected_qty: 5, found_qty: 0, difference: -5, location: "Aisle 4, Shelf C3", reported_by: "Rahul M.", date: "Yesterday" },
			];
		}),

	getSaleReturns: roleProcedure(["admin", "manager", "auditor", "putter"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async () => {
			return [
				{ id: "RET-901", order_id: "ORD-2041", product: "Gaming Mouse", qty: 1, reason: "Defective", condition: "Damaged", status: "pending", date: "Today" },
				{ id: "RET-902", order_id: "ORD-2088", product: "Laptop Sleeve", qty: 2, reason: "Wrong Size", condition: "Good", status: "processing", date: "Yesterday" },
			];
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

			if (results.length === 0) {
				return [
					{ id: "DAM-301", product: "Glass Screen Protector", qty_damaged: 14, damage_type: "Broken in Transit", severity: "High", location: "Receiving Bay A", raised_by: "Rahul M.", date: "Today" },
					{ id: "DAM-302", product: "Office Desk", qty_damaged: 1, damage_type: "Scratched Surface", severity: "Low", location: "Aisle 8", raised_by: "Rahul M.", date: "Yesterday" },
				];
			}

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

			if (results.length === 0) {
				return [
					{ id: "PA-088", product: "HDMI Cables (Box of 50)", qty: 50, location: "Aisle 1, Bin 4", completed_by: "Rahul M.", time_taken: "14m", date: "Today, 09:15 AM" },
					{ id: "PA-087", product: "MacBook Pro 16", qty: 5, location: "Secure Locker A", completed_by: "Rahul M.", time_taken: "8m", date: "Today, 08:45 AM" },
					{ id: "PA-085", product: "Wireless Mouse", qty: 120, location: "Aisle 3, Shelf D2", completed_by: "Rahul M.", time_taken: "22m", date: "Yesterday" },
				];
			}

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
			return [
				{ metric: "Total Items Received (This Week)", value: "1,450", trend: "+12%" },
				{ metric: "Average Put-Away Time", value: "14 mins", trend: "-2 mins" },
				{ metric: "Damage Rate", value: "0.8%", trend: "-0.2%" },
				{ metric: "Stock Discrepancy Rate", value: "0.1%", trend: "Stable" },
			];
		}),
});
