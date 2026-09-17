import {
	bankAccounts,
	customers,
	expenses,
	orders,
	suppliers,
	transactions,
	tripCollections,
} from "@evaluna/db/schema";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
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
			if (date_from)
				conditions.push(gte(transactions.created_at, new Date(date_from)));
			if (date_to)
				conditions.push(lte(transactions.created_at, new Date(date_to)));
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
					(SELECT coalesce(sum(total_amount), 0) FROM orders ${branchId != null ? sql`WHERE branch_id = ${branchId}` : sql``}) AS revenue,
					(SELECT coalesce(sum(outstanding_balance), 0) FROM suppliers) AS purchases,
					(SELECT coalesce(sum(amount), 0) FROM transactions WHERE type IN ('in', 'credit') ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS cash_in,
					(SELECT coalesce(sum(amount), 0) FROM transactions WHERE type IN ('out', 'debit') ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS cash_out,
					(
						SELECT coalesce(json_agg(t), '[]'::json)
						FROM (
							SELECT expense_category as category, COALESCE(SUM(amount), 0)::numeric as total
							FROM expenses
							${branchId != null ? sql`WHERE branch_id = ${branchId}` : sql``}
							GROUP BY expense_category
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
					(SELECT coalesce(sum(total_amount), 0) FROM orders WHERE created_at >= ${firstDayOfMonthStr}::timestamp ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS monthly_revenue,
					(SELECT coalesce(sum(amount), 0) FROM expenses WHERE created_at >= ${firstDayOfMonthStr}::timestamp ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS total_expenses,
					(SELECT coalesce(sum(credit_used), 0) FROM customers) AS receivables,
					(SELECT coalesce(sum(outstanding_balance), 0) FROM suppliers) AS payables,
					(SELECT coalesce(count(*), 0)::int FROM orders WHERE status = 'pending' ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS unpaid_invoices_count,
					(SELECT coalesce(sum(CASE WHEN created_at < NOW() - INTERVAL '30 days' THEN total_amount ELSE 0 END), 0) FROM orders WHERE status = 'pending' ${branchId != null ? sql`AND branch_id = ${branchId}` : sql``}) AS overdue_receivables,
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
							SELECT expense_category as category, COALESCE(SUM(amount), 0)::numeric as amount
							FROM expenses
							${branchId != null ? sql`WHERE branch_id = ${branchId}` : sql``}
							GROUP BY expense_category
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
			const monthlyRevenue = Number(scalarRes?.monthly_revenue || 0);
			const totalExpenses = Number(scalarRes?.total_expenses || 0);
			const netProfit = monthlyRevenue - totalExpenses;
			const grossProfit = monthlyRevenue; // Simplified assuming COGS is not fully tracked
			const gstLiability = monthlyRevenue * 0.18;
			const totalReceivables = Number(scalarRes?.receivables || 0);
			const totalPayables = Number(scalarRes?.payables || 0);
			const cashFlow = todaysCash - totalExpenses;

			const unpaidInvoicesCount = Number(scalarRes?.unpaid_invoices_count || 0);
			const overdueReceivables = Number(scalarRes?.overdue_receivables || 0);
			const overduePayables = totalPayables * 0.2; // Mocked portion since due date not explicit in schema

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
			const expenseBreakdownRes = (scalarRes?.expense_breakdown || []) as Array<{
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

	getDriverCollections: roleProcedure([
		"admin",
		"manager",
		"auditor",
		"finance",
	]).query(async ({ ctx }) => {
		const collections = await ctx.db.query.tripCollections?.findMany({
			orderBy: [desc(tripCollections.collected_at)],
			limit: 100,
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

		return collections.map((col: any) => {
			const stops = col.trip?.stops || [];
			const stopCustomer = stops[0]?.customer || null;
			const linkedOrders = dbOrders.filter((o: any) =>
				stops.some((s: any) => s.customer_id === o.customer_id),
			);

			return {
				id: col.id,
				tripId: col.trip_id,
				paymentMethod: col.payment_method || "Cash",
				amount: Number(col.amount || 0),
				transactionId: col.transaction_id || `COL-${col.id}`,
				referenceNumber: col.reference_number || `REF-${col.id}`,
				collectedAt: col.collected_at
					? new Date(col.collected_at).toLocaleString("en-IN")
					: new Date().toLocaleString("en-IN"),
				driverName: col.trip?.driver?.name || "Driver Staff",
				driverEmail: col.trip?.driver?.email || "driver@evaluna.com",
				status: "Verified",
				customerName:
					stopCustomer?.name || (linkedOrders[0]?.customer?.name ?? "Customer"),
				customerPhone:
					stopCustomer?.phone || linkedOrders[0]?.customer?.phone || "N/A",
				customerAddress:
					stopCustomer?.address ||
					linkedOrders[0]?.customer?.address ||
					"On-Route Delivery Address",
				orders: linkedOrders.map((o: any) => ({
					id: o.id,
					totalAmount: Number(o.total_amount || 0),
					status: o.status || "completed",
					financeStatus: o.finance_status || "driver_collected",
					createdAt: o.created_at
						? new Date(o.created_at).toLocaleString("en-IN")
						: "N/A",
					items: (o.orderItems || []).map((it: any) => ({
						id: it.id,
						productName: it.product?.name || `Item #${it.product_id || it.id}`,
						category: it.product?.category || "General",
						quantity: Number(it.quantity || 1),
						unitPrice: Number(it.unit_price || 0),
						totalPrice: Number(it.unit_price || 0) * Number(it.quantity || 1),
					})),
				})),
			};
		});
	}),
});
