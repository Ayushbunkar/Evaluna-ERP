import { orders, transactions } from "@evaluna/db/schema";
import { format, startOfHour, subHours } from "date-fns";
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

			// Real Hourly Sales Data
			const hourlyRaw = await ctx.db
				.select({
					hourRaw: sql<string>`TO_CHAR(DATE_TRUNC('hour', ${orders.created_at}), 'HH24:MI')`,
					amount: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)`,
				})
				.from(orders)
				.where(gte(orders.created_at, today))
				.groupBy(sql`DATE_TRUNC('hour', ${orders.created_at})`)
				.orderBy(sql`DATE_TRUNC('hour', ${orders.created_at})`);

			const hourlySales = hourlyRaw.map((h) => ({
				hour: h.hourRaw,
				amount: Number(h.amount),
			}));

			// Format for sales chart which uses time/sales keys
			const salesChart = hourlyRaw.map((h) => ({
				time: h.hourRaw,
				sales: Number(h.amount),
			}));

			const paymentDistribution = [
				{ name: "Cash", value: cashCollected },
				{ name: "Card", value: cardCollected },
				{ name: "UPI", value: upiCollected },
			].filter((p) => p.value > 0);

			const topCashiers: any[] = []; // Would require staff/cashier relationships on orders

			const recentBillsRes = await ctx.db.query.orders.findMany({
				orderBy: [desc(orders.created_at)],
				limit: 10,
				with: {
					customer: true,
					orderItems: true,
					paymentMethod: true,
				},
			});

			const recentTransactions = recentBillsRes.map((b) => ({
				id: `INV-${b.id}`,
				time: b.created_at ? format(new Date(b.created_at), "HH:mm") : "N/A",
				cashier: "Admin", // TODO: link user_uid to actual staff member
				amount: Number(b.total_amount || 0),
				status: b.status
					? b.status.charAt(0).toUpperCase() + b.status.slice(1)
					: "Pending",
				method: b.paymentMethod?.name || "Cash",
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
				recentTransactions,
			};
		}),
});
