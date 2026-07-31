import {
	products,
	purchaseItems,
	purchases,
	transactions,
} from "@evaluna/db/schema";
import { count, desc, eq, sum } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const supplierRouter = router({
	getPortalStats: protectedProcedure
		.input(z.object({}))
		.query(async ({ ctx }) => {
			const db = ctx.db;

			const posCount = await db.select({ count: count() }).from(purchases);
			const pendingDeliv = await db
				.select({ count: count() })
				.from(purchases)
				.where(eq(purchases.status, "pending"));

			const amounts = await db
				.select({
					totalAmount: sum(purchases.total_amount),
					paidAmount: sum(purchases.amount_paid),
				})
				.from(purchases);

			const totalSuppliedVal = Number(amounts[0]?.totalAmount) || 0;
			const totalPaidVal = Number(amounts[0]?.paidAmount) || 0;

			return {
				totalPOs: posCount[0]?.count || 0,
				pendingDeliveries: pendingDeliv[0]?.count || 0,
				invoicesSubmitted: 0, // No invoice table
				pendingPayment:
					totalSuppliedVal - totalPaidVal > 0
						? totalSuppliedVal - totalPaidVal
						: 0,
				totalSupplied: totalSuppliedVal,
				paymentDue:
					totalSuppliedVal - totalPaidVal > 0
						? totalSuppliedVal - totalPaidVal
						: 0,
			};
		}),

	getPurchaseOrders: protectedProcedure
		.input(z.object({}))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const results = await db
				.select({
					id: purchases.id,
					grn_number: purchases.grn_number,
					total_amount: purchases.total_amount,
					status: purchases.status,
					created_at: purchases.created_at,
					itemsCount: count(purchaseItems.id),
				})
				.from(purchases)
				.leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchase_id))
				.groupBy(purchases.id)
				.orderBy(desc(purchases.created_at))
				.limit(50);

			return results.map((r) => ({
				po_number: `PO-${r.id}`,
				date: r.created_at?.toLocaleDateString() || "",
				items: r.itemsCount || 0,
				total_amount: Number(r.total_amount) || 0,
				delivery_date: "N/A", // Not in schema
				status: r.status,
			}));
		}),

	getGRN: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
		const db = ctx.db;
		const results = await db
			.select({
				id: purchases.id,
				grn_number: purchases.grn_number,
				created_at: purchases.created_at,
				status: purchases.status,
				itemsCount: count(purchaseItems.id),
				qtySum: sum(purchaseItems.quantity),
			})
			.from(purchases)
			.leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchase_id))
			.where(eq(purchases.status, "received"))
			.groupBy(purchases.id)
			.orderBy(desc(purchases.created_at))
			.limit(50);

		return results.map((r) => ({
			grn_number: r.grn_number || `GRN-${r.id}`,
			po_reference: `PO-${r.id}`,
			date: r.created_at?.toLocaleDateString() || "",
			items: r.itemsCount || 0,
			quantity: Number(r.qtySum) || 0,
			verified_by: "System",
			status: r.status,
		}));
	}),

	getInvoices: protectedProcedure.input(z.object({})).query(async () => {
		return [];
	}),

	getPayments: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
		const db = ctx.db;
		const results = await db
			.select()
			.from(transactions)
			.where(eq(transactions.category, "purchase"))
			.orderBy(desc(transactions.created_at))
			.limit(50);

		return results.map((r) => ({
			date: r.created_at?.toLocaleDateString() || "",
			reference: `PAY-${r.id}`,
			amount: Number(r.amount) || 0,
			payment_mode: r.payment_method_id ? "Bank/Card" : "Cash",
			bank: "N/A",
			status: r.status || "completed",
		}));
	}),

	getReturns: protectedProcedure.input(z.object({})).query(async () => {
		return [];
	}),

	getProducts: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
		const db = ctx.db;
		const results = await db
			.select()
			.from(products)
			.orderBy(desc(products.created_at))
			.limit(50);

		return results.map((r) => ({
			product_code: r.sku || `PRD-${r.id}`,
			name: r.name,
			category: r.category || "General",
			unit_price: Number(r.price) || 0,
			moq: 0,
			lead_time: "N/A",
			availability: "Available",
		}));
	}),
});
