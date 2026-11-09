import {
	bankAccounts,
	customers,
	expenses,
	orders,
	products,
	proofOfDeliveries,
	purchaseItems,
	purchases,
	suppliers,
	transactions,
	tripCollections,
	tripStops,
} from "@evaluna/db/schema";
import {
	and,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNull,
	lte,
	or,
	sql,
	sum,
} from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const financeRouter = router({
	getInvoices: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					page: z.number().default(1),
					limit: z.number().default(10),
					search: z.string().optional(),
					status: z.string().optional(),
					customer_id: z.number().optional(),
					date_from: z.string().optional(),
					date_to: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;
			const {
				page = 1,
				limit = 10,
				search,
				status,
				customer_id,
				date_from,
				date_to,
			} = input || {};

			const conditions = [];
			if (branchId != null) conditions.push(eq(orders.branch_id, branchId));
			if (status) conditions.push(eq(orders.status, status));
			if (customer_id) conditions.push(eq(orders.customer_id, customer_id));
			if (date_from)
				conditions.push(gte(orders.created_at, new Date(date_from)));
			if (date_to) conditions.push(lte(orders.created_at, new Date(date_to)));
			if (search) {
				conditions.push(sql`${orders.id}::text ILIKE ${"%" + search + "%"}`);
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

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
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					page: z.number().default(1),
					limit: z.number().default(10),
					search: z.string().optional(),
					type: z.string().optional(),
					category: z.string().optional(),
					status: z.string().optional(),
					date_from: z.string().optional(),
					date_to: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;
			const {
				page = 1,
				limit = 10,
				search,
				type,
				category,
				status,
				date_from,
				date_to,
			} = input || {};

			const conditions = [];
			if (branchId != null)
				conditions.push(eq(transactions.branch_id, branchId));
			if (type) conditions.push(eq(transactions.type, type));
			if (category) conditions.push(eq(transactions.category, category));
			if (status) conditions.push(eq(transactions.status, status));
			if (date_from) {
				const fromDate = new Date(date_from);
				fromDate.setHours(0, 0, 0, 0);
				conditions.push(gte(transactions.created_at, fromDate));
			}
			if (date_to) {
				const toDate = new Date(date_to);
				toDate.setHours(23, 59, 59, 999);
				conditions.push(lte(transactions.created_at, toDate));
			}
			if (search) {
				conditions.push(
					sql`${transactions.description} ILIKE ${"%" + search + "%"}`,
				);
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

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
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					page: z.number().default(1),
					limit: z.number().default(10),
					search: z.string().optional(),
					category: z.string().optional(),
					date_from: z.string().optional(),
					date_to: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;
			const {
				page = 1,
				limit = 10,
				search,
				category,
				date_from,
				date_to,
			} = input || {};

			const conditions = [];
			if (branchId != null) conditions.push(eq(expenses.branch_id, branchId));
			if (category) conditions.push(eq(expenses.expense_category, category));
			if (date_from)
				conditions.push(gte(expenses.created_at, new Date(date_from)));
			if (date_to) conditions.push(lte(expenses.created_at, new Date(date_to)));
			if (search) {
				conditions.push(
					sql`${expenses.description} ILIKE ${"%" + search + "%"}`,
				);
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

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
		.input(
			z
				.object({
					branch_id: z.number().optional(),
				})
				.optional(),
		)
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
				.where(
					and(
						eq(bankAccounts.is_deleted, false),
						branchId != null ? eq(bankAccounts.branch_id, branchId) : undefined,
					),
				)
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
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					period: z.string().default("month"), // month, quarter, year
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;

			const rawRes: any = await ctx.db.execute(sql`
				SELECT
					(SELECT coalesce(sum(total_amount), 0) FROM orders WHERE status != 'cancelled' ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS revenue,
					(SELECT coalesce(sum(total_amount), 0) FROM purchases ${branchId != null ? sql`WHERE branch_id = ${branchId}` : sql``}) AS purchases,
					(SELECT coalesce(sum(amount), 0) FROM transactions WHERE type IN ('in', 'credit') ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS cash_in,
					(SELECT coalesce(sum(amount), 0) FROM transactions WHERE type IN ('out', 'debit') ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS cash_out,
					(
						SELECT coalesce(json_agg(t), '[]'::json)
						FROM (
							SELECT coalesce(category, 'General') as category, sum(amt)::numeric as total
							FROM (
								SELECT expense_category as category, amount as amt FROM expenses ${branchId != null ? sql`WHERE branch_id = ${branchId}` : sql``}
								UNION ALL
								SELECT category as category, amount as amt FROM transactions WHERE type IN ('out', 'debit') AND category IN ('expense', 'petty_cash', 'logistics') AND (reference_type IS NULL OR reference_type != 'expense') ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}
							) exp_combined
							GROUP BY category
						) t
					) AS expense_breakdown
			`);

			const totalsRes = Array.isArray(rawRes) ? rawRes[0] : rawRes?.rows?.[0];
			const expensesRes = (totalsRes?.expense_breakdown || []) as Array<{
				category: string | null;
				total: number | string;
			}>;

			const totalRevenue = Number(totalsRes?.revenue || 0);
			const totalPurchases = Number(totalsRes?.purchases || 0);
			const totalExpenses = expensesRes.reduce(
				(acc: number, exp: any) => acc + Number(exp.total),
				0,
			);

			const grossProfit = totalRevenue - totalPurchases;
			const netProfit = grossProfit - totalExpenses;
			const cashIn = Number(totalsRes?.cash_in || 0);
			const cashOut = Number(totalsRes?.cash_out || 0);

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
					amount: Number(e.total),
				})),
				cashFlow: {
					inflows: cashIn,
					outflows: cashOut,
					net: cashIn - cashOut,
				},
			};
		}),

	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const todayStr = today.toISOString();
			const firstDayOfMonth = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const firstDayOfMonthStr = firstDayOfMonth.toISOString();
			const sixMonthsAgo = new Date(
				today.getFullYear(),
				today.getMonth() - 5,
				1,
			);
			const sixMonthsAgoStr = sixMonthsAgo.toISOString();
			const sevenDaysAgo = new Date(today);
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			const sevenDaysAgoStr = sevenDaysAgo.toISOString();

			// Tenant isolation: scoped users see only their branch; superadmin (null) sees all.
			const branchId = ctx.user.branchId ?? null;

			const rawRes: any = await ctx.db.execute(sql`
				SELECT
					(SELECT coalesce(sum(amount), 0) FROM transactions WHERE type IN ('in', 'credit') AND created_at >= ${todayStr}::timestamp ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS todays_cash,
					(SELECT coalesce(sum(current_balance), 0) FROM bank_accounts WHERE is_deleted = false AND status = 'active' AND account_type IN ('cash', 'petty_cash') ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS cash_balance,
					(SELECT coalesce(sum(current_balance), 0) FROM bank_accounts WHERE is_deleted = false AND status = 'active' ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS total_bank_and_cash,
					(SELECT coalesce(sum(CASE WHEN type IN ('in', 'credit') THEN amount WHEN type IN ('out', 'debit') THEN -amount ELSE 0 END), 0) FROM transactions WHERE 1=1 ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS net_cash_transactions,
					(SELECT coalesce(sum(total_amount), 0) FROM orders WHERE status != 'cancelled' AND created_at >= ${firstDayOfMonthStr}::timestamp ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS monthly_revenue,
					(
						SELECT coalesce(
							(SELECT coalesce(sum(amount), 0) FROM expenses WHERE created_at >= ${firstDayOfMonthStr}::timestamp ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}), 0
						) + coalesce(
							(SELECT coalesce(sum(amount), 0) FROM transactions WHERE type IN ('out', 'debit') AND category IN ('expense', 'petty_cash', 'logistics') AND (reference_type IS NULL OR reference_type != 'expense') AND created_at >= ${firstDayOfMonthStr}::timestamp ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}), 0
						)
					) AS total_expenses,
					(
						SELECT coalesce(
							(SELECT coalesce(sum(total_amount), 0) FROM purchases WHERE created_at >= ${firstDayOfMonthStr}::timestamp ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}), 0
						) + coalesce(
							(SELECT coalesce(sum(amount), 0) FROM transactions WHERE type IN ('out', 'debit') AND category = 'purchase' AND created_at >= ${firstDayOfMonthStr}::timestamp ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}), 0
						)
					) AS monthly_purchases,
					(
						SELECT coalesce(
							(SELECT coalesce(sum(credit_used), 0) FROM customers), 0
						) + coalesce(
							(SELECT coalesce(sum(total_amount - coalesce(driver_collected_amount, 0)), 0) FROM orders WHERE status NOT IN ('cancelled') AND (driver_collected_amount IS NULL OR driver_collected_amount < total_amount) ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}), 0
						)
					) AS receivables,
					(SELECT coalesce(sum(outstanding_balance), 0) FROM suppliers) AS payables,
					(SELECT coalesce(count(*), 0)::int FROM orders WHERE status NOT IN ('cancelled') AND (finance_verified_amount IS NULL OR finance_verified_amount < total_amount) ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS unpaid_invoices_count,
					(SELECT coalesce(count(*), 0)::int FROM purchases WHERE status IN ('pending', 'pending_finance', 'pending_approval') ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS pending_purchases_count,
					(
						SELECT coalesce(sum(total_amount - coalesce(driver_collected_amount, 0)), 0)
						FROM orders
						WHERE status NOT IN ('cancelled')
						  AND created_at < NOW() - INTERVAL '30 days'
						  AND (driver_collected_amount IS NULL OR driver_collected_amount < total_amount)
						  ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}
					) AS overdue_receivables,
					(
						SELECT coalesce(sum(total_amount - coalesce(amount_paid, 0)), 0)
						FROM purchases
						WHERE payment_status != 'paid'
						  AND (
						    (expected_delivery_date IS NOT NULL AND expected_delivery_date < NOW())
						    OR (expected_delivery_date IS NULL AND created_at < NOW() - INTERVAL '30 days')
						  )
						  ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}
					) AS overdue_payables,
					(
						SELECT coalesce(sum(coalesce(cgst_amount, 0) + coalesce(sgst_amount, 0) + coalesce(igst_amount, 0)), 0)
						FROM orders
						WHERE status NOT IN ('cancelled')
						  AND created_at >= ${firstDayOfMonthStr}::timestamp
						  ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}
					) AS output_gst,
					(
						SELECT coalesce(sum(coalesce(cgst_amount, 0) + coalesce(sgst_amount, 0) + coalesce(igst_amount, 0)), 0)
						FROM purchases
						WHERE created_at >= ${firstDayOfMonthStr}::timestamp
						  ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}
					) AS input_gst,
					(
						SELECT coalesce(json_agg(t), '[]'::json)
						FROM (
							SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
							       COALESCE(SUM(total_amount), 0)::numeric as revenue
							FROM orders
							WHERE created_at >= ${sixMonthsAgoStr}::timestamp
							${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}
							GROUP BY DATE_TRUNC('month', created_at)
							ORDER BY DATE_TRUNC('month', created_at)
						) t
					) AS profit_chart,
					(
						SELECT coalesce(json_agg(t), '[]'::json)
						FROM (
							SELECT coalesce(category, 'General') as category, sum(amt)::numeric as amount
							FROM (
								SELECT expense_category as category, amount as amt FROM expenses ${branchId != null ? sql`WHERE branch_id = ${branchId}` : sql``}
								UNION ALL
								SELECT category as category, amount as amt FROM transactions WHERE type IN ('out', 'debit') AND category IN ('expense', 'petty_cash', 'logistics') AND (reference_type IS NULL OR reference_type != 'expense') ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}
							) exp_combined
							GROUP BY category
						) t
					) AS expense_breakdown,
					(
						SELECT coalesce(json_agg(t), '[]'::json)
						FROM (
							SELECT id, created_at, description, type, amount, status
							FROM transactions
							${branchId != null ? sql`WHERE branch_id = ${branchId}` : sql``}
							ORDER BY created_at DESC
							LIMIT 10
						) t
					) AS recent_transactions,
					(
						SELECT coalesce(json_agg(t), '[]'::json)
						FROM (
							SELECT id, name, credit_used as amount
							FROM customers
							WHERE credit_used > 0
							LIMIT 5
						) t
					) AS outstanding_customers,
					(
						SELECT coalesce(json_agg(t), '[]'::json)
						FROM (
							SELECT TO_CHAR(CAST(created_at AS DATE), 'DD Mon') as date,
							       COALESCE(SUM(CASE WHEN type IN ('in', 'credit') THEN amount ELSE 0 END), 0)::numeric as inflow,
							       COALESCE(SUM(CASE WHEN type IN ('out', 'debit') THEN amount ELSE 0 END), 0)::numeric as outflow
							FROM transactions
							WHERE created_at >= ${sevenDaysAgoStr}::timestamp
							${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}
							GROUP BY CAST(created_at AS DATE)
							ORDER BY CAST(created_at AS DATE)
						) t
					) AS cash_flow_data,
					(
						SELECT coalesce(json_agg(t), '[]'::json)
						FROM (
							SELECT id, account_name as bank, account_type as type, current_balance as balance
							FROM bank_accounts
							WHERE is_deleted = false AND status = 'active'
							${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}
							ORDER BY account_name
						) t
					) AS bank_balances
			`);

			const scalarRes = Array.isArray(rawRes) ? rawRes[0] : rawRes?.rows?.[0];

			const todaysCash = Number(scalarRes?.todays_cash || 0);
			const dbCashBalance = Number(scalarRes?.cash_balance || 0);
			const netCashTransactions = Number(scalarRes?.net_cash_transactions || 0);
			const totalBankAndCash = Number(scalarRes?.total_bank_and_cash || 0);
			const cashBalance = dbCashBalance > 0 ? dbCashBalance : (totalBankAndCash > 0 ? totalBankAndCash : (netCashTransactions > 0 ? netCashTransactions : todaysCash));

			const monthlyRevenue = Number(scalarRes?.monthly_revenue || 0);
			const totalExpenses = Number(scalarRes?.total_expenses || 0);
			const monthlyPurchases = Number(scalarRes?.monthly_purchases || 0);
			const grossProfit = monthlyRevenue - monthlyPurchases;
			const netProfit = grossProfit - totalExpenses;

			const outputGst = Number(scalarRes?.output_gst || 0);
			const inputGst = Number(scalarRes?.input_gst || 0);
			const gstLiability = Math.max(0, outputGst - inputGst);

			const totalReceivables = Number(scalarRes?.receivables || 0);
			const totalPayables = Number(scalarRes?.payables || 0);
			const cashFlow = todaysCash - totalExpenses;

			const unpaidInvoicesCount = Number(scalarRes?.unpaid_invoices_count || 0);
			const pendingPurchasesCount = Number(
				scalarRes?.pending_purchases_count || 0,
			);
			const overdueReceivables = Number(scalarRes?.overdue_receivables || 0);
			const overduePayables = Number(scalarRes?.overdue_payables || 0);

			const recentTx = (scalarRes?.recent_transactions || []) as Array<{
				id: number;
				created_at: string | Date;
				description: string | null;
				type: string | null;
				amount: number | string | null;
				status: string | null;
			}>;
			const outCust = (scalarRes?.outstanding_customers || []) as Array<{
				id: number;
				name: string;
				amount: number | string | null;
			}>;
			const cashFlowRes = (scalarRes?.cash_flow_data || []) as Array<{
				date: string;
				inflow: number | string;
				outflow: number | string;
			}>;
			const profitChartRes = (scalarRes?.profit_chart || []) as Array<{
				month: string;
				revenue: number | string;
			}>;
			const expenseBreakdownRes = (scalarRes?.expense_breakdown ||
				[]) as Array<{
				category: string | null;
				amount: number | string;
			}>;
			const bankBalancesRes = (scalarRes?.bank_balances || []) as Array<{
				id: number;
				bank: string;
				type: string;
				balance: number | string | null;
			}>;

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
				cashBalance,
				totalBankAndCash,
				monthlyRevenue,
				totalExpenses,
				monthlyPurchases,
				grossProfit,
				netProfit,
				gstLiability,
				totalReceivables,
				totalPayables,
				cashFlow,
				unpaidInvoicesCount,
				pendingPurchasesCount,
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
					inputTax: inputGst,
					outputTax: outputGst,
					netLiability: gstLiability,
				},
				outstandingPayments,
				recentTransactions,
			};
		}),

	getDriverCollections: roleProcedure([
		"admin",
		"manager",
		"auditor",
		"finance",
	])
		.input(
			z
				.object({
					startDate: z.string().optional(),
					endDate: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const conditions: any[] = [];
			if (input?.startDate) {
				conditions.push(
					or(
						gte(
							tripCollections.collected_at,
							new Date(`${input.startDate}T00:00:00`),
						),
						and(
							isNull(tripCollections.collected_at),
							gte(
								tripCollections.created_at,
								new Date(`${input.startDate}T00:00:00`),
							),
						),
					),
				);
			}
			if (input?.endDate) {
				conditions.push(
					or(
						lte(
							tripCollections.collected_at,
							new Date(`${input.endDate}T23:59:59`),
						),
						and(
							isNull(tripCollections.collected_at),
							lte(
								tripCollections.created_at,
								new Date(`${input.endDate}T23:59:59`),
							),
						),
					),
				);
			}

			let collections: any[] = [];
			try {
				if (ctx.db?.query?.tripCollections) {
					collections = await ctx.db.query.tripCollections.findMany({
						where: conditions.length > 0 ? and(...conditions) : undefined,
						orderBy: [desc(tripCollections.collected_at)],
						limit: 200,
						with: {
							trip: {
								with: {
									driver: true,
									stops: {
										with: {
											customer: true,
										},
									},
								},
							},
						},
					});
				}
			} catch (e) {
				console.warn("[getDriverCollections] DB query fallback:", e);
				return [];
			}

		if (!collections || collections.length === 0) return [];

		const allCustomerIds = Array.from(
			new Set(
				collections.flatMap((col: any) =>
					(col.trip?.stops || [])
						.map((s: any) => s.customer_id)
						.filter(Boolean),
				),
			),
		);

		let dbOrders: any[] = [];
		if (allCustomerIds.length > 0) {
			dbOrders = await ctx.db.query.orders.findMany({
				where: inArray(orders.customer_id, allCustomerIds),
				orderBy: [desc(orders.created_at)],
				with: {
					customer: true,
					orderItems: {
						with: {
							product: true,
						},
					},
				},
			});
		}

		// Fetch proof of deliveries for notes/returns
		const allStopIds = Array.from(
			new Set(
				collections
					.map((col: any) => {
						if (col.reference_number?.startsWith("STOP-")) {
							return Number(col.reference_number.replace("STOP-", ""));
						}
						return null;
					})
					.filter(Boolean) as number[],
			),
		);

		let podList: any[] = [];
		if (allStopIds.length > 0) {
			try {
				podList = await ctx.db.query.proofOfDeliveries.findMany({
					where: inArray(proofOfDeliveries.trip_stop_id, allStopIds),
				});
			} catch (e) {
				console.warn("[getDriverCollections] POD fetch fallback:", e);
			}
		}

		return collections.map((col: any) => {
			const stops = col.trip?.stops || [];
			let targetStopId: number | null = null;
			if (col.reference_number?.startsWith("STOP-")) {
				targetStopId = Number(col.reference_number.replace("STOP-", ""));
			}

			const matchedStop =
				stops.find((s: any) => s.id === targetStopId) || stops[0] || null;
			const stopCustomer = matchedStop?.customer || stops[0]?.customer || null;
			const linkedOrders = dbOrders.filter(
				(o: any) =>
					o.customer_id === (stopCustomer?.id || matchedStop?.customer_id),
			);

			const pod = podList.find(
				(p: any) => p.trip_stop_id === (targetStopId || matchedStop?.id),
			);

			let parsedDeliveryNotes = matchedStop?.comments || "";
			let returnedItems: any[] = [];

			if (pod?.notes) {
				try {
					const parsed = JSON.parse(pod.notes);
					if (parsed.deliveryNotes) parsedDeliveryNotes = parsed.deliveryNotes;
					if (Array.isArray(parsed.returns) && parsed.returns.length > 0) {
						returnedItems = parsed.returns;
					}
				} catch {
					parsedDeliveryNotes = pod.notes;
				}
			}

			// Also parse returned items from comments string if present
			if (
				returnedItems.length === 0 &&
				matchedStop?.comments &&
				matchedStop.comments.includes("Returned/Rejected:")
			) {
				const parts = matchedStop.comments.split("Returned/Rejected:");
				if (parts[1]) {
					parsedDeliveryNotes = parts[0].replace(" | ", "").trim();
					const itemStrs = parts[1].split(",");
					returnedItems = itemStrs.map((str: string, idx: number) => {
						const trimmed = str.trim();
						return {
							id: idx + 1,
							name: trimmed,
							qty: 1,
							reason: "Reported at Doorstep",
						};
					});
				}
			}

			const colAmt = Number(col.amount || 0);
			let totalColCost = 0;
			let totalColSelling = 0;

			if (linkedOrders.length > 0) {
				for (const o of linkedOrders) {
					for (const it of o.orderItems || []) {
						const qty = Number(it.quantity || 1);
						const unitSelling = Number(it.price || it.unit_price || 0);
						const unitCost = it.product
							? Number(
									it.product.base_procurement_price ||
										Number(it.product.price || unitSelling) * 0.8,
								)
							: unitSelling * 0.8;
						totalColCost += qty * unitCost;
						totalColSelling += qty * unitSelling;
					}
				}
			}

			if (totalColSelling === 0 && colAmt > 0) {
				totalColSelling = colAmt;
				totalColCost = colAmt * 0.8;
			}
			const totalColProfit = totalColSelling - totalColCost;
			const totalColMargin =
				totalColSelling > 0 ? (totalColProfit / totalColSelling) * 100 : 0;

			return {
				id: col.id,
				tripId: col.trip_id,
				tripName: `Trip #${col.trip_id}`,
				stopId: targetStopId || matchedStop?.id || null,
				customerId: stopCustomer?.id || null,
				paymentMethod: col.payment_method || "Cash",
				amount: Number(col.amount || 0),
				costPrice: Number(totalColCost.toFixed(2)),
				sellingPrice: Number(totalColSelling.toFixed(2)),
				netProfit: Number(totalColProfit.toFixed(2)),
				marginPercent: Number(totalColMargin.toFixed(1)),
				transactionId: col.transaction_id || `COL-${col.id}`,
				referenceNumber: col.reference_number || `REF-${col.id}`,
				collectedAt: col.collected_at
					? new Date(col.collected_at).toLocaleString("en-IN")
					: new Date().toLocaleString("en-IN"),
				rawCollectedAt: col.collected_at
					? new Date(col.collected_at).toISOString()
					: new Date().toISOString(),
				driverName: col.trip?.driver?.name || "Driver Staff",
				driverEmail: col.trip?.driver?.email || "driver@evaluna.com",
				driverPhone: col.trip?.driver?.phone || "N/A",
				status: "Verified",
				customerName:
					stopCustomer?.name || (linkedOrders[0]?.customer?.name ?? "Customer"),
				customerPhone:
					stopCustomer?.phone || linkedOrders[0]?.customer?.phone || "N/A",
				customerAddress:
					stopCustomer?.address ||
					linkedOrders[0]?.customer?.address ||
					"On-Route Delivery Address",
				deliveryNotes: parsedDeliveryNotes,
				returnedItems: returnedItems,
				proofOfDelivery: pod
					? {
							id: pod.id,
							status: pod.delivery_status,
							deliveredAt: pod.delivered_at
								? new Date(pod.delivered_at).toLocaleString("en-IN")
								: null,
						}
					: null,
				orders: linkedOrders.map((o: any) => {
					let orderCost = 0;
					let orderSelling = 0;

					const items = (o.orderItems || []).map((it: any) => {
						const qty = Number(it.quantity || 1);
						const unitSelling = Number(it.price || it.unit_price || 0);
						const unitCost = it.product
							? Number(
									it.product.base_procurement_price ||
										Number(it.product.price || unitSelling) * 0.8,
								)
							: unitSelling * 0.8;
						const totalItemSelling = unitSelling * qty;
						const totalItemCost = unitCost * qty;
						const itemProfit = totalItemSelling - totalItemCost;

						orderCost += totalItemCost;
						orderSelling += totalItemSelling;

						return {
							id: it.id,
							productId: it.product_id,
							productName: it.product?.name || `Item #${it.product_id || it.id}`,
							category: it.product?.category || "General",
							unit: it.product?.unit || "pcs",
							sku: it.product?.sku || "—",
							quantity: qty,
							unitPrice: unitSelling,
							costPrice: Number(unitCost.toFixed(2)),
							totalPrice: Number(totalItemSelling.toFixed(2)),
							totalCost: Number(totalItemCost.toFixed(2)),
							profit: Number(itemProfit.toFixed(2)),
						};
					});

					const totalAmount = Number(o.total_amount || orderSelling);
					const netSelling = totalAmount > 0 ? totalAmount : orderSelling;
					const netProfit = netSelling - orderCost;
					const marginPercent =
						netSelling > 0 ? (netProfit / netSelling) * 100 : 0;

					return {
						id: o.id,
						orderRef: `ORD-${o.id}`,
						totalAmount,
						costPrice: Number(orderCost.toFixed(2)),
						sellingPrice: Number(netSelling.toFixed(2)),
						netProfit: Number(netProfit.toFixed(2)),
						marginPercent: Number(marginPercent.toFixed(1)),
						discountAmount: Number(o.discount_amount || 0),
						discountReason: o.discount_reason || null,
						otherCharges: Number(o.other_charges || 0),
						otherChargesReason: o.other_charges_reason || null,
						status: o.status || "completed",
						financeStatus: o.finance_status || "driver_collected",
						createdAt: o.created_at
							? new Date(o.created_at).toLocaleString("en-IN")
							: "N/A",
						items,
					};
				}),
			};
		});
	}),

	// ───────────────────────────────────────────────────────────────────────────
	// PURCHASE ORDER VERIFICATION & APPROVAL (FINANCE)
	// ───────────────────────────────────────────────────────────────────────────

	listPurchases: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(
			z
				.object({
					status: z.string().optional(),
					search: z.string().optional(),
					limit: z.number().min(1).max(100).default(50),
					page: z.number().default(1),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user.branchId ?? null;
			const { status = "pending", search, limit = 50, page = 1 } = input || {};

			const filters: any[] = [];
			if (branchId != null) {
				filters.push(
					or(
						eq(purchases.branch_id, branchId),
						sql`${purchases.branch_id} IS NULL`,
					),
				);
			}

			if (status && status !== "all") {
				if (status === "pending" || status === "pending_finance") {
					filters.push(
						inArray(purchases.status, [
							"pending",
							"pending_finance",
							"pending_approval",
						]),
					);
				} else {
					filters.push(eq(purchases.status, status));
				}
			}

			if (search) {
				filters.push(
					or(
						ilike(purchases.po_number, `%${search}%`),
						ilike(purchases.grn_number, `%${search}%`),
						ilike(suppliers.name, `%${search}%`),
					),
				);
			}

			const whereClause = filters.length > 0 ? and(...filters) : undefined;

			// Get summary counts
			const baseBranchFilter =
				branchId != null ? sql`AND branch_id = ${branchId}` : sql``;

			const statsRes: any = await ctx.db.execute(sql`
				SELECT
					(SELECT coalesce(count(*), 0)::int FROM purchases WHERE status IN ('pending', 'pending_finance', 'pending_approval') ${baseBranchFilter}) as pending_count,
					(SELECT coalesce(sum(total_amount), 0)::numeric FROM purchases WHERE status IN ('pending', 'pending_finance', 'pending_approval') ${baseBranchFilter}) as pending_amount,
					(SELECT coalesce(count(*), 0)::int FROM purchases WHERE status = 'issued' ${baseBranchFilter}) as issued_count,
					(SELECT coalesce(count(*), 0)::int FROM purchases WHERE status = 'rejected' ${baseBranchFilter}) as rejected_count,
					(SELECT coalesce(count(*), 0)::int FROM purchases WHERE 1=1 ${baseBranchFilter}) as total_count
			`);
			const statsRow = Array.isArray(statsRes)
				? statsRes[0]
				: statsRes?.rows?.[0];

			const countRes = await ctx.db
				.select({ count: count(purchases.id) })
				.from(purchases)
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.where(whereClause);
			const total = Number(countRes[0]?.count || 0);

			const rows = await ctx.db
				.select({
					id: purchases.id,
					po_number: purchases.po_number,
					grn_number: purchases.grn_number,
					purchase_request_id: purchases.purchase_request_id,
					supplier_id: purchases.supplier_id,
					supplier_name: suppliers.name,
					supplier_phone: suppliers.phone,
					supplier_email: suppliers.email,
					status: purchases.status,
					receiving_status: purchases.receiving_status,
					payment_status: purchases.payment_status,
					total_amount: purchases.total_amount,
					cgst_amount: purchases.cgst_amount,
					sgst_amount: purchases.sgst_amount,
					igst_amount: purchases.igst_amount,
					amount_paid: purchases.amount_paid,
					expected_delivery_date: purchases.expected_delivery_date,
					notes: purchases.notes,
					created_at: purchases.created_at,
					item_count: count(purchaseItems.id),
					total_quantity: sum(purchaseItems.quantity),
				})
				.from(purchases)
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchase_id))
				.where(whereClause)
				.groupBy(
					purchases.id,
					suppliers.id,
					suppliers.name,
					suppliers.phone,
					suppliers.email,
				)
				.orderBy(desc(purchases.created_at))
				.limit(limit)
				.offset((page - 1) * limit);

			return {
				items: rows.map((r) => ({
					...r,
					total_amount: Number(r.total_amount || 0),
					cgst_amount: Number(r.cgst_amount || 0),
					sgst_amount: Number(r.sgst_amount || 0),
					igst_amount: Number(r.igst_amount || 0),
					amount_paid: Number(r.amount_paid || 0),
					item_count: Number(r.item_count || 0),
					total_quantity: Number(r.total_quantity || 0),
				})),
				total,
				pages: Math.ceil(total / limit),
				stats: {
					pendingCount: Number(statsRow?.pending_count || 0),
					pendingAmount: Number(statsRow?.pending_amount || 0),
					issuedCount: Number(statsRow?.issued_count || 0),
					rejectedCount: Number(statsRow?.rejected_count || 0),
					totalCount: Number(statsRow?.total_count || 0),
				},
			};
		}),

	getPurchaseDetails: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const [po] = await ctx.db
				.select({
					id: purchases.id,
					po_number: purchases.po_number,
					grn_number: purchases.grn_number,
					purchase_request_id: purchases.purchase_request_id,
					branch_id: purchases.branch_id,
					supplier_id: purchases.supplier_id,
					supplier_name: suppliers.name,
					supplier_phone: suppliers.phone,
					supplier_email: suppliers.email,
					supplier_address: suppliers.address,
					total_amount: purchases.total_amount,
					cgst_amount: purchases.cgst_amount,
					sgst_amount: purchases.sgst_amount,
					igst_amount: purchases.igst_amount,
					status: purchases.status,
					receiving_status: purchases.receiving_status,
					payment_status: purchases.payment_status,
					amount_paid: purchases.amount_paid,
					expected_delivery_date: purchases.expected_delivery_date,
					notes: purchases.notes,
					terms_and_conditions: purchases.terms_and_conditions,
					created_at: purchases.created_at,
				})
				.from(purchases)
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.where(eq(purchases.id, input.id))
				.limit(1);

			if (!po) throw new Error("Purchase order not found");

			const items = await ctx.db
				.select({
					id: purchaseItems.id,
					purchase_id: purchaseItems.purchase_id,
					product_id: purchaseItems.product_id,
					product_name: products.name,
					product_sku: products.sku,
					quantity: purchaseItems.quantity,
					price: purchaseItems.price,
					cgst_rate: purchaseItems.cgst_rate,
					sgst_rate: purchaseItems.sgst_rate,
					igst_rate: purchaseItems.igst_rate,
					cgst_amount: purchaseItems.cgst_amount,
					sgst_amount: purchaseItems.sgst_amount,
					igst_amount: purchaseItems.igst_amount,
				})
				.from(purchaseItems)
				.leftJoin(products, eq(purchaseItems.product_id, products.id))
				.where(eq(purchaseItems.purchase_id, input.id));

			return {
				...po,
				total_amount: Number(po.total_amount || 0),
				cgst_amount: Number(po.cgst_amount || 0),
				sgst_amount: Number(po.sgst_amount || 0),
				igst_amount: Number(po.igst_amount || 0),
				items: items.map((it) => ({
					...it,
					product_name: it.product_name || `Product #${it.product_id}`,
					product_sku: it.product_sku || "—",
					quantity: Number(it.quantity || 0),
					price: Number(it.price || 0),
					cgst_rate: Number(it.cgst_rate || 0),
					sgst_rate: Number(it.sgst_rate || 0),
					igst_rate: Number(it.igst_rate || 0),
					cgst_amount: Number(it.cgst_amount || 0),
					sgst_amount: Number(it.sgst_amount || 0),
					igst_amount: Number(it.igst_amount || 0),
					total:
						Number(it.quantity || 0) * Number(it.price || 0) +
						Number(it.cgst_amount || 0) +
						Number(it.sgst_amount || 0) +
						Number(it.igst_amount || 0),
				})),
			};
		}),

	approvePO: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(
			z.object({
				purchaseId: z.number(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [existing] = await ctx.db
				.select()
				.from(purchases)
				.where(eq(purchases.id, input.purchaseId))
				.limit(1);

			if (!existing) throw new Error("Purchase order not found");
			if (
				existing.status !== "pending_finance" &&
				existing.status !== "pending" &&
				existing.status !== "pending_approval"
			) {
				throw new Error(
					`Cannot verify and issue a PO with status '${existing.status}'`,
				);
			}

			const approverName = ctx.user.name || ctx.user.email || "Finance";
			const noteText = input.notes
				? `\n[Finance Verified & Issued by ${approverName} on ${new Date().toLocaleString("en-IN")}]: ${input.notes}`
				: `\n[Finance Verified & Issued by ${approverName} on ${new Date().toLocaleString("en-IN")}]`;

			const [updated] = await ctx.db
				.update(purchases)
				.set({
					status: "issued",
					notes: sql`COALESCE(${purchases.notes}, '') || ${noteText}`,
				})
				.where(eq(purchases.id, input.purchaseId))
				.returning();

			return updated;
		}),

	rejectPO: roleProcedure(["admin", "manager", "auditor", "finance"])
		.input(
			z.object({
				purchaseId: z.number(),
				reason: z.string().min(1, "Reason is mandatory to reject this order"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [existing] = await ctx.db
				.select()
				.from(purchases)
				.where(eq(purchases.id, input.purchaseId))
				.limit(1);

			if (!existing) throw new Error("Purchase order not found");
			if (
				existing.receiving_status === "received" ||
				existing.status === "completed"
			) {
				throw new Error("Cannot reject an already received or completed order");
			}

			const rejectorName = ctx.user.name || ctx.user.email || "Finance";
			const noteText = `\n[Finance Rejected by ${rejectorName} on ${new Date().toLocaleString("en-IN")}]: ${input.reason}`;

			const [updated] = await ctx.db
				.update(purchases)
				.set({
					status: "rejected",
					notes: sql`COALESCE(${purchases.notes}, '') || ${noteText}`,
				})
				.where(eq(purchases.id, input.purchaseId))
				.returning();

			return updated;
		}),
});
