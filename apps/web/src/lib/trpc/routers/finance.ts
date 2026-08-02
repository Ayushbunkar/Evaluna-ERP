import {
	customers,
	expenses,
	orders,
	suppliers,
	transactions,
} from "@evaluna/db/schema";
import { and, desc, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const financeRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const firstDayOfMonth = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);

			const [
				todaysCashRes,
				monthlyRevRes,
				totalExpRes,
				receivablesRes,
				payablesRes,
				profitChartRes,
				expenseBreakdownRes,
				recentTx,
				outCust
			] = await Promise.all([
				ctx.db
					.select({
						total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
					})
					.from(transactions)
					.where(
						and(
							gte(transactions.created_at, today),
							sql`${transactions.type} IN ('in', 'credit')`,
						),
					),
				ctx.db
					.select({
						total: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)`,
					})
					.from(orders)
					.where(gte(orders.created_at, firstDayOfMonth)),
				ctx.db
					.select({
						total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
					})
					.from(expenses)
					.where(gte(expenses.created_at, firstDayOfMonth)),
				ctx.db
					.select({
						total: sql<number>`COALESCE(SUM(${customers.credit_used}), 0)`,
					})
					.from(customers),
				ctx.db
					.select({
						total: sql<number>`COALESCE(SUM(${suppliers.outstanding_balance}), 0)`,
					})
					.from(suppliers),
				ctx.db
					.select({
						month: sql<string>`TO_CHAR(${orders.created_at}, 'Mon')`,
						revenue: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)`,
					})
					.from(orders)
					.groupBy(sql`TO_CHAR(${orders.created_at}, 'Mon')`),
				ctx.db
					.select({
						category: expenses.expense_category,
						amount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
					})
					.from(expenses)
					.groupBy(expenses.expense_category),
				ctx.db.query.transactions.findMany({
					orderBy: [desc(transactions.created_at)],
					limit: 10,
				}),
				ctx.db
					.select({
						id: customers.id,
						name: customers.name,
						amount: customers.credit_used,
					})
					.from(customers)
					.where(sql`${customers.credit_used} > 0`)
					.limit(5)
			]);

			const todaysCash = Number(todaysCashRes[0]?.total || 0);
			const monthlyRevenue = Number(monthlyRevRes[0]?.total || 0);
			const totalExpenses = Number(totalExpRes[0]?.total || 0);
			const netProfit = monthlyRevenue - totalExpenses;
			const gstLiability = monthlyRevenue * 0.18;
			const totalReceivables = Number(receivablesRes[0]?.total || 0);
			const totalPayables = Number(payablesRes[0]?.total || 0);
			const cashFlow = todaysCash - totalExpenses;

			const recentTransactions = recentTx.map((tx) => ({
				id: `TX-${tx.id}`,
				date: (new Date(tx.created_at)).toLocaleString() || "N/A",
				description: tx.description || "Transaction",
				type: tx.type || "debit",
				amount: Number(tx.amount || 0),
				status: tx.status || "completed",
			}));

			const outstandingPayments = outCust.map((c) => ({
				id: `CUST-${c.id}`,
				party: c.name,
				type: "Receivable",
				amount: Number(c.amount || 0),
				due: "Now",
			}));

			return {
				todaysCash,
				monthlyRevenue,
				totalExpenses,
				netProfit,
				gstLiability,
				totalReceivables,
				totalPayables,
				cashFlow,
				profitChart: profitChartRes.map((p) => ({
					month: p.month,
					revenue: Number(p.revenue),
					expenses: 0,
				})),
				expenseBreakdown: expenseBreakdownRes.map((e) => ({
					category: e.category || "Misc",
					amount: Number(e.amount),
				})),
				cashFlowData: [],
				bankBalances: [],
				gstSummary: {
					inputTax: 0,
					outputTax: gstLiability,
					netLiability: gstLiability,
				},
				outstandingPayments,
				recentTransactions,
			};
		}),
});
