import { customers, orders, transactions } from "@evaluna/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const customerRouter = router({
	getPortalStats: protectedProcedure
		.input(z.object({}))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			// Note: Ideally filter by the logged-in customer's ID from ctx.user.
			// Assuming context has customer data or returning aggregate for now

			const ordersCount = await db.select({ count: count() }).from(orders);
			const totalSpent = await db
				.select({ total: sql<number>`SUM(${orders.total_amount})` })
				.from(orders)
				.where(eq(orders.status, "completed"));
			const pendingCount = await db
				.select({ count: count() })
				.from(orders)
				.where(eq(orders.status, "pending"));

			return {
				totalOrders: ordersCount[0]?.count || 0,
				totalSpent: totalSpent[0]?.total || 0,
				loyaltyPoints: 0,
				walletBalance: 0,
				pendingOrders: pendingCount[0]?.count || 0,
				returnRequests: 0,
				loyaltyTier: "Bronze",
				pointsToNextTier: 1000,
			};
		}),

	getOrders: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
		const db = ctx.db;
		const results = await db
			.select({
				id: orders.id,
				total_amount: orders.total_amount,
				status: orders.status,
				created_at: orders.created_at,
			})
			.from(orders)
			.orderBy(desc(orders.created_at))
			.limit(50);

		return results.map((r) => ({
			id: `ORD-${r.id}`,
			date: r.created_at?.toLocaleDateString() || "",
			items_count: 0,
			total: Number(r.total_amount) || 0,
			payment_method: "N/A",
			status: r.status,
			tracking_id: "N/A",
		}));
	}),

	getInvoices: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
		const db = ctx.db;
		const results = await db
			.select({
				id: orders.id,
				total_amount: orders.total_amount,
				status: orders.status,
				created_at: orders.created_at,
			})
			.from(orders)
			.where(eq(orders.status, "completed"))
			.orderBy(desc(orders.created_at))
			.limit(50);

		return results.map((r) => ({
			invoice_no: `INV-${r.id}`,
			date: r.created_at?.toLocaleDateString() || "",
			amount: Number(r.total_amount) || 0,
			payment_status: "Paid",
		}));
	}),

	getWishlist: protectedProcedure.input(z.object({})).query(async () => {
		return [];
	}),

	getLoyalty: protectedProcedure.input(z.object({})).query(async () => {
		return [];
	}),

	getWallet: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
		const db = ctx.db;
		const results = await db
			.select()
			.from(transactions)
			.where(eq(transactions.category, "wallet"))
			.orderBy(desc(transactions.created_at))
			.limit(50);

		return results.map((r) => ({
			date: r.created_at?.toLocaleDateString() || "",
			description: r.description || "Transaction",
			amount: Number(r.amount) || 0,
			type: r.type === "in" ? "Credit" : "Debit",
			balance: 0,
		}));
	}),

	getAddresses: protectedProcedure
		.input(z.object({}))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const results = await db.select().from(customers).limit(10);

			return results.map((r) => ({
				id: r.id,
				name: r.name,
				address: r.address || "N/A",
				city: "N/A",
				state: "N/A",
				pincode: "N/A",
				phone: r.phone || "N/A",
				is_default: true,
			}));
		}),

	getReturns: protectedProcedure.input(z.object({})).query(async () => {
		return [];
	}),

	getSupportTickets: protectedProcedure.input(z.object({})).query(async () => {
		return [];
	}),
});
