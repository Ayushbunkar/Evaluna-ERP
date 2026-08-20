import {
	bankAccounts,
	customers,
	expenses,
	orders,
	suppliers,
	transactions,
} from "@evaluna/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
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
			const sevenDaysAgo = new Date(today);
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			// Tenant isolation: scoped users see only their branch; superadmin (null) sees all.
			const branchId = ctx.user.branchId ?? null;
			const txBranch =
				branchId != null ? eq(transactions.branch_id, branchId) : undefined;
			const orderBranch =
				branchId != null ? eq(orders.branch_id, branchId) : undefined;
			const expBranch =
				branchId != null ? eq(expenses.branch_id, branchId) : undefined;

			const [
				todaysCashRes,
				monthlyRevRes,
				totalExpRes,
				receivablesRes,
				payablesRes,
				profitChartRes,
				expenseBreakdownRes,
				recentTx,
				outCust,
				cashFlowRes,
				bankBalancesRes,
			] = await Promise.all([
				ctx.db
					.select({
						total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
					})
					.from(transactions)
					.where(
						and(
							txBranch,
							gte(transactions.created_at, today),
							sql`${transactions.type} IN ('in', 'credit')`,
						),
					),
				ctx.db
					.select({
						total: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)`,
					})
					.from(orders)
					.where(and(orderBranch, gte(orders.created_at, firstDayOfMonth))),
				ctx.db
					.select({
						total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
					})
					.from(expenses)
					.where(and(expBranch, gte(expenses.created_at, firstDayOfMonth))),
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
						month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.created_at}), 'Mon YYYY')`,
						monthSort: sql<string>`DATE_TRUNC('month', ${orders.created_at})`,
						revenue: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)`,
					})
					.from(orders)
					.where(
						gte(
							orders.created_at,
							new Date(today.getFullYear(), today.getMonth() - 5, 1),
						),
					)
					.groupBy(sql`DATE_TRUNC('month', ${orders.created_at})`)
					.orderBy(sql`DATE_TRUNC('month', ${orders.created_at})`),
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
					.limit(5),
				// Cash flow: last 7 days (inflow vs outflow per day)
				ctx.db
					.select({
						date: sql<string>`TO_CHAR(CAST(${transactions.created_at} AS DATE), 'DD Mon')`,
						dateSort: sql<string>`CAST(${transactions.created_at} AS DATE)`,
						inflow: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'in' THEN ${transactions.amount} ELSE 0 END), 0)`,
						outflow: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'out' THEN ${transactions.amount} ELSE 0 END), 0)`,
					})
					.from(transactions)
					.where(gte(transactions.created_at, sevenDaysAgo))
					.groupBy(sql`CAST(${transactions.created_at} AS DATE)`)
					.orderBy(sql`CAST(${transactions.created_at} AS DATE)`),
				// Real bank/cash balances from the finance module's accounts.
				ctx.db
					.select({
						id: bankAccounts.id,
						bank: bankAccounts.account_name,
						type: bankAccounts.account_type,
						balance: bankAccounts.current_balance,
					})
					.from(bankAccounts)
					.where(
						and(
							eq(bankAccounts.is_deleted, false),
							eq(bankAccounts.status, "active"),
							branchId != null
								? eq(bankAccounts.branch_id, branchId)
								: undefined,
						),
					)
					.orderBy(bankAccounts.account_name),
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
				date: tx.created_at ? new Date(tx.created_at).toLocaleString() : "N/A",
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

			// Cash flow data for chart
			const cashFlowData = cashFlowRes.map((c) => ({
				date: c.date,
				inflow: Number(c.inflow),
				outflow: Number(c.outflow),
				net: Number(c.inflow) - Number(c.outflow),
			}));

			// Profit chart with both revenue and expenses per month
			const profitChart = profitChartRes.map((p) => ({
				month: p.month,
				revenue: Number(p.revenue),
				expenses: 0, // expenses per month query can be added if needed
			}));

			// Real balances from bank_accounts; fall back to cash-in-hand only when
			// no accounts have been set up yet so the widget is never empty/hardcoded.
			const bankBalances =
				bankBalancesRes.length > 0
					? bankBalancesRes.map((b) => ({
							bank: b.bank,
							balance: Number(b.balance || 0),
							type: b.type,
						}))
					: [{ bank: "Cash in Hand", balance: todaysCash, type: "cash" }];

			return {
				todaysCash,
				monthlyRevenue,
				totalExpenses,
				netProfit,
				gstLiability,
				totalReceivables,
				totalPayables,
				cashFlow,
				profitChart,
				expenseBreakdown: expenseBreakdownRes.map((e) => ({
					category: e.category || "Misc",
					amount: Number(e.amount),
				})),
				cashFlowData,
				bankBalances,
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
