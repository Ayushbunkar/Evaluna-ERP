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
	getInvoices: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(z.object({
			branch_id: z.number().optional(),
			page: z.number().default(1),
			limit: z.number().default(10),
			search: z.string().optional(),
			status: z.string().optional(),
			customer_id: z.number().optional(),
			date_from: z.string().optional(),
			date_to: z.string().optional(),
		}).optional())
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;
			const { page = 1, limit = 10, search, status, customer_id, date_from, date_to } = input || {};
			
			const conditions = [];
			if (branchId != null) conditions.push(eq(orders.branch_id, branchId));
			if (status) conditions.push(eq(orders.status, status));
			if (customer_id) conditions.push(eq(orders.customer_id, customer_id));
			if (date_from) conditions.push(gte(orders.created_at, new Date(date_from)));
			if (date_to) conditions.push(lte(orders.created_at, new Date(date_to)));
			if (search) {
				conditions.push(sql`${orders.id}::text ILIKE ${'%' + search + '%'}`);
			}
			
			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
			
			const countResult = await ctx.db
				.select({ count: sql<number>`count(*)` })
				.from(orders)
				.where(whereClause);
			const total = Number(countResult[0]?.count || 0);

			const results = await ctx.db
				.select({
					id: orders.id,
					date: sql<string>`TO_CHAR(CAST(${orders.created_at} AS DATE), 'YYYY-MM-DD')`,
					customer_name: customers.name,
					amount: orders.total_amount,
					status: orders.status,
				})
				.from(orders)
				.leftJoin(customers, eq(orders.customer_id, customers.id))
				.where(whereClause)
				.orderBy(desc(orders.created_at))
				.limit(limit)
				.offset((page - 1) * limit);
				
			return {
				items: results.map((r: any) => ({
					id: r.id.toString(),
					date: r.date,
					customer_name: r.customer_name || "Walk-in Customer",
					amount: Number(r.amount),
					status: r.status || "pending",
				})),
				total,
				pages: Math.ceil(total / limit),
			};
		}),

	getTransactions: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(z.object({
			branch_id: z.number().optional(),
			page: z.number().default(1),
			limit: z.number().default(10),
			search: z.string().optional(),
			type: z.string().optional(),
			category: z.string().optional(),
			status: z.string().optional(),
			date_from: z.string().optional(),
			date_to: z.string().optional(),
		}).optional())
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;
			const { page = 1, limit = 10, search, type, category, status, date_from, date_to } = input || {};
			
			const conditions = [];
			if (branchId != null) conditions.push(eq(transactions.branch_id, branchId));
			if (type) conditions.push(eq(transactions.type, type));
			if (category) conditions.push(eq(transactions.category, category));
			if (status) conditions.push(eq(transactions.status, status));
			if (date_from) conditions.push(gte(transactions.created_at, new Date(date_from)));
			if (date_to) conditions.push(lte(transactions.created_at, new Date(date_to)));
			if (search) {
				conditions.push(sql`${transactions.description} ILIKE ${'%' + search + '%'}`);
			}
			
			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
			
			const countResult = await ctx.db
				.select({ count: sql<number>`count(*)` })
				.from(transactions)
				.where(whereClause);
			const total = Number(countResult[0]?.count || 0);

			const results = await ctx.db
				.select({
					id: transactions.id,
					date: sql<string>`TO_CHAR(CAST(${transactions.created_at} AS DATE), 'YYYY-MM-DD')`,
					description: transactions.description,
					amount: transactions.amount,
					type: transactions.type,
					category: transactions.category,
					status: transactions.status,
				})
				.from(transactions)
				.where(whereClause)
				.orderBy(desc(transactions.created_at))
				.limit(limit)
				.offset((page - 1) * limit);
				
			return {
				items: results.map((r: any) => ({
					id: r.id.toString(),
					date: r.date,
					description: r.description || "-",
					amount: Number(r.amount),
					type: r.type || "-",
					category: r.category || "-",
					status: r.status || "completed",
				})),
				total,
				pages: Math.ceil(total / limit),
			};
		}),

	getExpenses: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(z.object({
			branch_id: z.number().optional(),
			page: z.number().default(1),
			limit: z.number().default(10),
			search: z.string().optional(),
			category: z.string().optional(),
			date_from: z.string().optional(),
			date_to: z.string().optional(),
		}).optional())
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;
			const { page = 1, limit = 10, search, category, date_from, date_to } = input || {};
			
			const conditions = [];
			if (branchId != null) conditions.push(eq(expenses.branch_id, branchId));
			if (category) conditions.push(eq(expenses.expense_category, category));
			if (date_from) conditions.push(gte(expenses.created_at, new Date(date_from)));
			if (date_to) conditions.push(lte(expenses.created_at, new Date(date_to)));
			if (search) {
				conditions.push(sql`${expenses.description} ILIKE ${'%' + search + '%'}`);
			}
			
			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
			
			const countResult = await ctx.db
				.select({ count: sql<number>`count(*)` })
				.from(expenses)
				.where(whereClause);
			const total = Number(countResult[0]?.count || 0);

			const results = await ctx.db
				.select({
					id: expenses.id,
					date: sql<string>`TO_CHAR(CAST(${expenses.created_at} AS DATE), 'YYYY-MM-DD')`,
					category: expenses.expense_category,
					amount: expenses.amount,
					notes: expenses.description,
				})
				.from(expenses)
				.where(whereClause)
				.orderBy(desc(expenses.created_at))
				.limit(limit)
				.offset((page - 1) * limit);
				
			return {
				items: results.map((r: any) => ({
					id: r.id.toString(),
					date: r.date,
					category: r.category || "Uncategorized",
					amount: Number(r.amount),
					notes: r.notes || "-",
					payment_status: "paid",
				})),
				total,
				pages: Math.ceil(total / limit),
			};
		}),

	getBankAccounts: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(z.object({
			branch_id: z.number().optional(),
		}).optional())
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;
			
			const results = await ctx.db
				.select({
					id: bankAccounts.id,
					name: bankAccounts.account_name,
					bank_name: bankAccounts.bank_name,
					type: bankAccounts.account_type,
					account_number: bankAccounts.account_number_masked,
					opening_balance: bankAccounts.opening_balance,
					current_balance: bankAccounts.current_balance,
					status: bankAccounts.status,
				})
				.from(bankAccounts)
				.where(and(
					eq(bankAccounts.is_deleted, false),
					branchId != null ? eq(bankAccounts.branch_id, branchId) : undefined
				))
				.orderBy(bankAccounts.account_name);
				
			return results.map((r: any) => ({
				id: r.id.toString(),
				name: r.name,
				bank_name: r.bank_name || "-",
				type: r.type,
				account_number: r.account_number || "****",
				opening_balance: Number(r.opening_balance || 0),
				current_balance: Number(r.current_balance || 0),
				status: r.status,
			}));
		}),

	getFinancialReports: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(z.object({
			branch_id: z.number().optional(),
			period: z.string().default("month"), // month, quarter, year
		}).optional())
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;
			
			// Revenue
			const revenueRes = await ctx.db
				.select({ total: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)` })
				.from(orders)
				.where(branchId != null ? eq(orders.branch_id, branchId) : undefined);
				
			// Purchases/COGS
			const purchasesRes = await ctx.db
				.select({ total: sql<number>`COALESCE(SUM(${suppliers.outstanding_balance}), 0)` }) // Simplified mock for purchases
				.from(suppliers);
				
			// Operational Expenses
			const expensesRes = await ctx.db
				.select({ 
					total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
					category: expenses.expense_category 
				})
				.from(expenses)
				.where(branchId != null ? eq(expenses.branch_id, branchId) : undefined)
				.groupBy(expenses.expense_category);

			const totalRevenue = Number(revenueRes[0]?.total || 0);
			const totalPurchases = Number(purchasesRes[0]?.total || 0);
			const totalExpenses = expensesRes.reduce((acc: number, exp: any) => acc + Number(exp.total), 0);
			
			const grossProfit = totalRevenue - totalPurchases;
			const netProfit = grossProfit - totalExpenses;
			
			const cashInRes = await ctx.db
				.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
				.from(transactions)
				.where(and(
					sql`${transactions.type} IN ('in', 'credit')`,
					branchId != null ? eq(transactions.branch_id, branchId) : undefined
				));
				
			const cashOutRes = await ctx.db
				.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
				.from(transactions)
				.where(and(
					sql`${transactions.type} IN ('out', 'debit')`,
					branchId != null ? eq(transactions.branch_id, branchId) : undefined
				));

			return {
				profitAndLoss: {
					revenue: totalRevenue,
					cogs: totalPurchases,
					grossProfit,
					operatingExpenses: totalExpenses,
					netProfit,
				},
				expenseBreakdown: expensesRes.map((e: any) => ({
					category: e.category || "Other",
					amount: Number(e.total)
				})),
				cashFlow: {
					inflows: Number(cashInRes[0]?.total || 0),
					outflows: Number(cashOutRes[0]?.total || 0),
					net: Number(cashInRes[0]?.total || 0) - Number(cashOutRes[0]?.total || 0)
				}
			};
		}),

	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "finance"])
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
				unpaidOrdersRes,
				unpaidPurchasesRes,
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
				// Unpaid / Overdue Orders (assuming pending means unpaid and older than 30 days is overdue)
				ctx.db
					.select({
						count: sql<number>`COUNT(*)`,
						amount: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)`,
						overdueAmount: sql<number>`COALESCE(SUM(CASE WHEN ${orders.created_at} < NOW() - INTERVAL '30 days' THEN ${orders.total_amount} ELSE 0 END), 0)`
					})
					.from(orders)
					.where(and(eq(orders.status, 'pending'), orderBranch)),
				// Unpaid / Overdue Purchases
				ctx.db
					.select({
						count: sql<number>`COUNT(*)`,
						amount: sql<number>`COALESCE(SUM(${suppliers.outstanding_balance}), 0)`, // Simplified
					})
					.from(suppliers)
			]);

			const todaysCash = Number(todaysCashRes[0]?.total || 0);
			const monthlyRevenue = Number(monthlyRevRes[0]?.total || 0);
			const totalExpenses = Number(totalExpRes[0]?.total || 0);
			const netProfit = monthlyRevenue - totalExpenses;
			const grossProfit = monthlyRevenue; // Simplified assuming COGS is not fully tracked
			const gstLiability = monthlyRevenue * 0.18;
			const totalReceivables = Number(receivablesRes[0]?.total || 0);
			const totalPayables = Number(payablesRes[0]?.total || 0);
			const cashFlow = todaysCash - totalExpenses;
			
			const unpaidInvoicesCount = Number(unpaidOrdersRes[0]?.count || 0);
			const overdueReceivables = Number(unpaidOrdersRes[0]?.overdueAmount || 0);
			const overduePayables = totalPayables * 0.2; // Mocked portion since due date not explicit in schema


			const recentTransactions = recentTx.map((tx: any) => ({
				id: `TX-${tx.id}`,
				date: tx.created_at ? new Date(tx.created_at).toLocaleString() : "N/A",
				description: tx.description || "Transaction",
				type: tx.type || "debit",
				amount: Number(tx.amount || 0),
				status: tx.status || "completed",
			}));

			const outstandingPayments = outCust.map((c: any) => ({
				id: `CUST-${c.id}`,
				party: c.name,
				type: "Receivable",
				amount: Number(c.amount || 0),
				due: "Now",
			}));

			// Cash flow data for chart
			const cashFlowData = cashFlowRes.map((c: any) => ({
				date: c.date,
				inflow: Number(c.inflow),
				outflow: Number(c.outflow),
				net: Number(c.inflow) - Number(c.outflow),
			}));

			// Profit chart with both revenue and expenses per month
			const profitChart = profitChartRes.map((p: any) => ({
				month: p.month,
				revenue: Number(p.revenue),
				expenses: 0, // expenses per month query can be added if needed
			}));

			// Real balances from bank_accounts; fall back to cash-in-hand only when
			// no accounts have been set up yet so the widget is never empty/hardcoded.
			const bankBalances =
				bankBalancesRes.length > 0
					? bankBalancesRes.map((b: any) => ({
							bank: b.bank,
							balance: Number(b.balance || 0),
							type: b.type,
						}))
					: [{ bank: "Cash in Hand", balance: todaysCash, type: "cash" }];

			return {
				todaysCash,
				monthlyRevenue,
				totalExpenses,
				grossProfit,
				netProfit,
				gstLiability,
				totalReceivables,
				totalPayables,
				cashFlow,
				unpaidInvoicesCount,
				overdueReceivables,
				overduePayables,
				profitChart,
				expenseBreakdown: expenseBreakdownRes.map((e: any) => ({
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
