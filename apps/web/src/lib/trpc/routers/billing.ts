import { orders, transactions } from "@evaluna/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const billingRouter = router({
	getDashboardStats: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const todaysBillsRes = await ctx.db
				.select({ count: sql<number>`COUNT(*)` })
				.from(orders)
				.where(gte(orders.created_at, today));
			const todaysBills = Number(todaysBillsRes[0]?.count || 0);

			const revenueRes = await ctx.db
				.select({
					total: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)`,
				})
				.from(orders)
				.where(gte(orders.created_at, today));
			const revenue = Number(revenueRes[0]?.total || 0);

			const averageBill = todaysBills > 0 ? revenue / todaysBills : 0;
			const refunds = 0;

			const paymentsRes = await ctx.db
				.select({
					method: transactions.payment_method_id,
					amount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
				})
				.from(transactions)
				.where(
					and(
						gte(transactions.created_at, today),
						eq(transactions.type, "credit"),
					),
				)
				.groupBy(transactions.payment_method_id);

			let cashCollected = 0;
			let cardCollected = 0;
			let upiCollected = 0;

			for (const p of paymentsRes) {
				if (p.method === 1) cashCollected += Number(p.amount);
				else if (p.method === 2) cardCollected += Number(p.amount);
				else if (p.method === 3) upiCollected += Number(p.amount);
				else cashCollected += Number(p.amount);
			}

			const pendingBillsRes = await ctx.db
				.select({ count: sql<number>`COUNT(*)` })
				.from(orders)
				.where(
					and(gte(orders.created_at, today), eq(orders.status, "pending")),
				);
			const pendingBills = Number(pendingBillsRes[0]?.count || 0);

			const salesChart: any[] = [];
			const paymentDistribution = [
				{ name: "Cash", value: cashCollected },
				{ name: "Card", value: cardCollected },
				{ name: "UPI", value: upiCollected },
			];
			const hourlySales: any[] = [];
			const topCashiers: any[] = [];

			const recentBillsRes = await ctx.db.query.orders.findMany({
				orderBy: [desc(orders.created_at)],
				limit: 10,
				with: {
					customer: true,
					orderItems: true,
					paymentMethod: true,
				},
			});

			const recentBills = recentBillsRes.map((b) => ({
				id: `INV-${b.id}`,
				customer: b.customer?.name || "Walk-in Customer",
				items: b.orderItems?.length || 0,
				amount: Number(b.total_amount || 0),
				status: b.status || "pending",
				payment: b.paymentMethod?.name || "Cash",
			}));

			return {
				todaysBills,
				revenue,
				averageBill,
				refunds,
				cashCollected,
				cardCollected,
				upiCollected,
				pendingBills,
				salesChart,
				paymentDistribution,
				hourlySales,
				topCashiers,
				recentBills,
			};
		}),
});
