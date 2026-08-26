I need to analyze the provided code for accounting/finance issues. Let me go through the code and identify any problems related to invoices, payments, bills, ledger, journal entries, debit/credit integrity, totals, taxes, GST, rounding, financial transactions, accounting periods, reversals, refunds, transaction atomicity, duplicate financial records, and audit trails.

Let me look for relevant files:

1. apps/web/src/lib/trpc/routers/accounting.ts - This handles journal entries
2. apps/web/src/lib/trpc/routers/finance.ts - This handles finance dashboard stats
3. apps/web/src/lib/trpc/routers/transactions.ts - This handles transactions
4. apps/web/src/lib/trpc/routers/cashbook.ts - This handles cash book
5. apps/web/src/lib/trpc/routers/payroll.ts - This handles payroll
6. apps/web/src/app/admin/accounting/journal/page.tsx - Journal voucher page
7. apps/web/src/app/admin/accounting/coa/page.tsx - Chart of accounts
8. apps/web/src/app/admin/payments/page.tsx - Payment ledger page
9. apps/web/src/app/admin/supplier/payments/page.tsx - Supplier payment ledger
10. apps/web/src/app/admin/customer/invoices/page.tsx - Customer invoices
11. apps/web/src/app/admin/supplier/invoices/page.tsx - Supplier invoices
12. apps/web/src/app/admin/finance/page.tsx - Finance dashboard
13. apps/web/src/app/admin/layout.tsx - Admin layout with finance links
14. apps/web/src/components/printing/ThermalReceipt.tsx - Thermal receipt printing
15. apps/web/src/components/printing/A4Invoice.tsx - A4 invoice printing
16. apps/web/src/components/pos/receipt-print.tsx - POS receipt printing
17. apps/web/src/components/pos/payment-modal.tsx - Payment modal
18. apps/web/src/lib/trpc/routers/sales-returns.ts - Sales returns
19. apps/web/src/lib/trpc/routers/purchases.ts - Purchases
20. apps/web/src/lib/trpc/routers/suppliers.ts - Suppliers (including paySupplier)
21. apps/web/src/lib/trpc/routers/biller.ts - Biller dashboard
22. apps/web/src/lib/trpc/routers/billing.ts - Billing dashboard stats
23. apps/web/src/lib/trpc/routers/payment-methods.ts - Payment methods
24. apps/web/src/lib/trpc/routers/transactions.ts - Transactions
25. apps/web/src/lib/trpc/routers/cashbook.ts - Cashbook
26. apps/web/src/lib/trpc/routers/payroll.ts - Payroll
27. apps/web/src/lib/trpc/routers/payroll-lock.ts - Payroll lock
28. apps/web/src/lib/trpc/routers/backups.ts - Backups
29. apps/web/src/lib/trpc/routers/audit.ts - Audit
30. apps/web/src/lib/trpc/routers/notifications.ts - Notifications
31. apps/web/src/lib/trpc/routers/transfers.ts - Transfers
32. apps/web/src/lib/trpc/routers/master-data.ts - Master data (tax rates)
33. apps/web/src/lib/validation/supplier.ts - Supplier validation (GSTIN, PAN)
34. apps/web/src/lib/trpc/routers/superadmin.ts - Superadmin dashboard stats (revenue from billingInvoices)
35. apps/web/src/lib/trpc/routers/dashboard.ts - Dashboard (not in provided code but referenced in tests)
36. apps/web/src/lib/trpc/routers/init.ts - TRPC init (not in provided code)
37. apps/web/src/lib/trpc/router.ts - Main router (not in provided code)
38. apps/web/src/lib/trpc/client.ts - TRPC client (not in provided code)
39. apps/web/src/lib/trpc/server.ts - TRPC server (not in provided code)
40. apps/web/src/lib/auth-guard.ts - Auth guard (not in provided code)
41. apps/web/src/lib/auth.ts - Auth (not in provided code)
42. apps/web/src/lib/db/index.ts - DB index (not in provided code)
43. apps/web/src/lib/db/schema.ts - DB schema (not in provided code)
44. packages/db/src/schema.ts - DB schema (not in provided code)
45. packages/db/src/auth-schema.ts - Auth schema (not in provided code)
46. packages/db/src/schema-monitoring.ts - Schema monitoring (not in provided code)
47. packages/db/src/types.ts - Types (not in provided code)
48. packages/db/src/schema/rbac.ts - RBAC schema (not in provided code)
49. apps/web/src/lib/constants.ts - Constants (payment methods)
50. apps/web/src/lib/utils.ts - Utils (not in provided code)
51. apps/web/src/lib/branch-context.ts - Branch context (not in provided code)
52. apps/web/src/lib/animations.ts - Animations (not in provided code)
53. apps/web/src/lib/trpc/util/auditor-procedures.ts - Auditor procedures (not in provided code)
54. apps/web/src/lib/trpc/util/audit.ts - Audit util (not in provided code)
55. apps/web/src/lib/monitor-logger.ts - Monitor logger (not in provided code)
56. apps/web/src/lib/permissions.ts - Permissions (not in provided code)
57. apps/web/src/lib/validation/expense.ts - Expense validation (not in provided code)
58. apps/web/src/lib/validation/purchase.ts - Purchase validation (not in provided code)
59. apps/web/src/lib/validation/supplier.ts - Supplier validation (provided)
60. apps/web/src/lib/validation/invoice.ts - Invoice validation (not in provided code)
61. apps/web/src/lib/validation/customer.ts - Customer validation (not in provided code)
62. apps/web/src/lib/validation/auth.ts - Auth validation (not in provided code)
63. apps/web/src/lib/validation/tax.ts - Tax validation (not in provided code)
64. apps/web/src/lib/validation/gst.ts - GST validation (not in provided code)
65. apps/web/src/lib/validation/rounding.ts - Rounding validation (not in provided code)
66. apps/web/src/lib/validation/transaction.ts - Transaction validation (not in provided code)
67. apps/web/src/lib/validation/journal-entry.ts - Journal entry validation (not in provided code)
68. apps/web/src/lib/validation/ledger.ts - Ledger validation (not in provided code)
69. apps/web/src/lib/validation/bill.ts - Bill validation (not in provided code)
70. apps/web/src/lib/validation/payment.ts - Payment validation (not in provided code)
71. apps/web/src/lib/validation/refund.ts - Refund validation (not in provided code)
72. apps/web/src/lib/validation/reversal.ts - Reversal validation (not in provided code)
73. apps/web/src/lib/validation/atomicity.ts - Atomicity validation (not in provided code)
74. apps/web/src/lib/validation/duplicate.ts - Duplicate validation (not in provided code)
75. apps/web/src/lib/validation/audit-trail.ts - Audit trail validation (not in provided code)

Now let me look for specific issues in the provided code:

Starting with apps/web/src/lib/trpc/routers/accounting.ts:

```typescript
export const accountingRouter = router({
	postJournalEntry: protectedProcedure
		.input(
			z.object({
				entryDate: z.union([z.string(), z.coerce.date()]).optional(),
				narration: z.string().optional(),
				lines: z
					.array(
						z.object({
							accountId: z.number(),
							debit: z.number().default(0),
							credit: z.number().default(0),
							narration: z.string().optional(),
						}),
					)
					.min(2),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { entryDate, narration, lines } = input;

			const totalDebit = lines.reduce((acc, line) => acc + line.debit, 0);
			const totalCredit = lines.reduce((acc, line) => acc + line.credit, 0);

			if (totalDebit !== totalCredit) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Journal entry is not balanced",
				});
			}

			const entryNumber = `JE-${Date.now()}`;

			const [entry] = await ctx.db
				.insert(journalEntries)
				.values({
					entry_number: entryNumber,
					entry_date: entryDate ? new Date(entryDate) : new Date(),
					narration: narration || null,
					status: "posted",
				})
				.returning();

			const linesData = lines.map((line) => ({
				journal_entry_id: entry.id,
				account_id: line.accountId,
				debit: line.debit.toString(),
				credit: line.credit.toString(),
				narration: line.narration || null,
			}));

			await ctx.db.insert(journalEntryLines).values(linesData);

			return entry;
		}),

	getTrialBalance: protectedProcedure.query(async ({ ctx }) => {
		const allAccounts = await ctx.db.select().from(accounts);
		const allLines = await ctx.db.select().from(journalEntryLines);

		const trialBalance = allAccounts.map((account) => {
			const relatedLines = allLines.filter((l) => l.account_id === account.id);
			const totalDebit = relatedLines.reduce(
				(acc, l) => acc + Number.parseFloat(l.debit || "0"),
				0,
			);
			const totalCredit = relatedLines.reduce(
				(acc, l) => acc + Number.parseFloat(l.credit || "0"),
				0,
			);
			return {
				accountId: account.id,
				accountCode: account.account_code,
				accountName: account.name,
				accountType: account.account_type,
				balanceType: account.balance_type,
				totalDebit,
				totalCredit,
				netBalance: totalDebit - totalCredit,
			};
		});

		return trialBalance;
	}),
});
```

Issues I notice:
1. In `postJournalEntry`, the debit and credit values are stored as strings in the database (`debit: line.debit.toString()`, `credit: line.credit.toString()`), but they're defined as numbers in the schema (based on the reduction using `Number.parseFloat`). This could cause issues with calculations and comparisons.
2. The validation only checks if totalDebit !== totalCredit, but doesn't check if either is zero or negative. A journal entry should have at least one debit and one credit amount greater than zero.
3. The entryNumber uses `Date.now()` which could potentially create duplicates if two entries are created in the same millisecond (though unlikely, it's possible).
4. The `getTrialBalance` function does a client-side calculation by fetching all accounts and all journal entry lines, which could be inefficient for large datasets. It should be done with a SQL query.

Let me check apps/web/src/lib/trpc/routers/finance.ts:

```typescript
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
```

Issues I notice:
1. The GST liability calculation is hardcoded as `monthlyRevenue * 0.18` (18%). This assumes a flat GST rate, but GST rates can vary by product/category. This is a significant issue for financial accuracy.
2. The `profitChart` sets expenses to 0 with a comment that expenses per month query can be added if needed. This means the profit chart is inaccurate as it doesn't subtract expenses.
3. The `outstandingPayments` only considers customer credit used, but doesn't consider supplier outstanding balances (which would be payables).
4. The cash flow calculation uses `todaysCash - totalExpenses` but should be inflow - outflow for the period.
5. The `bankBalances` fallback to "Cash in Hand" with `todaysCash` might be misleading if there are actual bank accounts with different balances.

Let me check apps/web/src/lib/trpc/routers/transactions.ts:

```typescript
export const transactionsRouter = router({
	list: protectedProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/transactions",
				tags: ["Transactions"],
				summary: "List all transactions",
			},
		})
		.input(z.void())
		.output(z.array(transactionSchema))
		.query(async ({ ctx }) => {
			return db
				.select()
				.from(transactions)
				.where(eq(transactions.user_uid, ctx.user.id));
		}),

	create: protectedProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/transactions",
				tags: ["Transactions"],
				summary: "Create a transaction",
			},
		})
		.input(
			z.object({
				description: z.string().min(1),
				amount: z.string(),
				type: z.enum(["income", "expense"]),
				category: z.string().optional(),
				status: z.enum(["completed", "pending"]).optional(),
			}),
		)
		.output(transactionSchema)
		.mutation(async ({ ctx, input }) => {
			const [data] = await db
				.insert(transactions)
				.values({ ...input, user_uid: ctx.user.id })
				.returning();
			return data;
		}),

	update: protectedProcedure
		.meta({
			openapi: {
				method: "PATCH",
				path: "/transactions/{id}",
				tags: ["Transactions"],
				summary: "Update a transaction",
			},
		})
		.input(
			z.object({
				id: z.number(),
				description: z.string().optional(),
				amount: z.string().optional(),
				type: z.enum(["income", "expense"]).optional(),
				category: z.string().optional(),
				status: z.enum(["completed", "pending"]).optional(),
			}),
		)
		.output(transactionSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await db
				.update(transactions)
				.set({ ...data, user_uid: ctx.user.id })
				.where(
					and(eq(transactions.id, id), eq(transactions.user_uid, ctx.user.id)),
				)
				.returning();
			return updated;
		}),

	delete: protectedProcedure
		.meta({
			openapi: {
				method: "DELETE",
				path: "/transactions/{id}",
				tags: ["Transactions"],
				summary: "Delete a transaction",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			await db
				.delete(transactions)
				.where(
					and(
						eq(transactions.id, input.id),
						eq(transactions.user_uid, ctx.user.id),
					),
				);
			return { success: true };
		}),
});
```

Issues I notice:
1. The `amount` field is stored as a string in the database (based on the schema), but financial calculations should use numeric types for accuracy. Storing as string can lead to precision issues and incorrect calculations.
2. There's no validation to ensure the amount is a valid positive number.
3. The `type` field is limited to "income" and "expense", but in accounting, we typically have "debit" and "credit" or more specific types.
4. There's no linkage to journal entries or other financial modules, which breaks audit trails.

Let me check apps/web/src/lib/trpc/routers/cashbook.ts:

```typescript
export const cashbookRouter = router({
	getLedger: publicProcedure
		.input(
			z.object({
				limit: z.number().default(50),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			const items = await db.query.transactions.findMany({
				orderBy: [desc(transactions.created_at)],
				limit: input.limit,
				offset: input.offset,
			});

			// Compute running balance for displayed items roughly (usually requires window functions)
			return { items };
		}),

	addEntry: publicProcedure
		.input(
			z.object({
				amount: z.number().positive(),
				type: z.enum(["in", "out"]),
				description: z.string().min(1),
				category: z.string().optional().default("manual"),
				user_uid: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			return await db
				.insert(transactions)
				.values({
					amount: input.amount.toString(),
					type: input.type,
					description: input.description,
					category: input.category,
					user_uid: input.user_uid,
					reference_type: "manual",
					status: "completed",
				})
				.returning();
		}),

	getDailySummary: publicProcedure
		.input(
			z.object({
				date: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			let targetDate = input.date ? new Date(input.date) : new Date();

			if (!input.date) {
				const latestTx = await db.query.transactions.findFirst({
					orderBy: [desc(transactions.created_at)],
				});
				if (latestTx?.created_at) {
					targetDate = new Date(latestTx.created_at);
				}
			}

			const start = startOfDay(targetDate);
			const end = endOfDay(targetDate);

			const dailyTx = await db.query.transactions.findMany({
				where: and(
					gte(transactions.created_at, start),
					lte(transactions.created_at, end),
					eq(transactions.status, "completed"),
				),
			});

			let totalIn = 0;
			let totalOut = 0;
			let sales = 0;
			let expenses = 0;

			for (const tx of dailyTx) {
				const amt = Number.parseFloat(tx.amount);
				if (tx.type === "in" || tx.type === "income") {
					totalIn += amt;
					if (tx.category === "sale" || tx.category === "selling") sales += amt;
				} else if (tx.type === "out" || tx.type === "expense") {
					totalOut += amt;
					if (tx.category === "expense") expenses += amt;
				}
			}

			return {
				totalIn,
				totalOut,
				sales,
				expenses,
				net: totalIn - totalOut,
			};
		}),
});
```

Issues I notice:
1. In `addEntry`, the amount is converted to string for storage (`amount: input.amount.toString()`), which has the same issue as in transactions router - storing financial amounts as strings can cause precision issues.
2. The `getLedger` function comments mention that computing running balance requires window functions, but it's not implemented. This means the ledger doesn't show running balances, which is a key feature of a cash book.
3. The `getDailySummary` function has logic that treats "in" as income and "out" as expense, but also has special handling for categories. However, it doesn't properly distinguish between different types of inflows and outflows (e.g., loans, investments, etc.).
4. There's no validation to ensure that the cash book entries are balanced or that they properly integrate with the general ledger.

Let me check apps/web/src/lib/trpc/routers/payroll.ts:

```typescript
export const payrollRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				branch_id: z.number().nullable().optional(),
				month: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const branchId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];

			if (input.month) {
				conditions.push(eq(payroll.month, input.month));
			}
			if (branchId) {
				conditions.push(eq(payroll.branch_id, branchId));
			}

			return ctx.db.query.payroll.findMany({
				where: conditions.length > 0 ? and(...conditions) : undefined,
				with: {
					staff: true,
					paymentMethod: true,
				},
				orderBy: [desc(payroll.created_at)],
			});
		}),

	generate: protectedProcedure
		.input(
			z.object({
				branch_id: z.number().nullable().optional(),
				month: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const branchId = input.branch_id ?? ctx.user.branchId;

			const staffConditions = [];
			if (branchId) {
				staffConditions.push(eq(staff.branch_id, branchId));
			}
			staffConditions.push(eq(staff.status, "active"));

			const activeStaff = await ctx.db.query.staff.findMany({
				where: staffConditions.length ? and(...staffConditions) : undefined,
			});

			// Batch-check existing payroll records for all staff in one query
			const staffIds = activeStaff.map((s) => s.id);
			const existingPayrolls = staffIds.length > 0
				? await ctx.db.query.payroll.findMany({
					where: and(
						inArray(payroll.staff_id, staffIds),
						eq(payroll.month, input.month),
					),
			  })
				: [];

			const existingStaffIds = new Set(existingPayrolls.map((p) => p.staff_id));

			// Only create payroll for staff who don't have one yet
			const newStaff = activeStaff.filter((e) => !existingStaffIds.has(e.id));

			let generated: any[] = [];
			if (newStaff.length > 0) {
				generated = await ctx.db
					.insert(payroll)
					.values(
						newStaff.map((employee) => ({
							staff_id: employee.id,
							branch_id: employee.branch_id,
							month: input.month,
							base_salary: employee.salary,
							net_payable: employee.salary,
							status: "draft",
						}))
					)
					.returning();
			}

			return { generated: generated.length };
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				overtime_pay: z.string().optional(),
				bonus: z.string().optional(),
				deductions: z.string().optional(),
				advance_deduction: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.payroll.findFirst({
				where: eq(payroll.id, input.id),
			});
			if (!existing) throw new Error("Payroll record not found");

			const base = Number.parseFloat(existing.base_salary as string);
			const ot =
				input.overtime_pay !== undefined
					? Number.parseFloat(input.overtime_pay)
					: Number.parseFloat(existing.overtime_pay as string);
			const bonus =
				input.bonus !== undefined
					? Number.parseFloat(input.bonus)
					: Number.parseFloat(existing.bonus as string);
			const deductions =
				input.deductions !== undefined
					? Number.parseFloat(input.deductions)
					: Number.parseFloat(existing.deductions as string);
			const advance =
				input.advance_deduction !== undefined
					? Number.parseFloat(input.advance_deduction)
					: Number.parseFloat(existing.advance_deduction as string);

			const netPayable = base + ot + bonus - (deductions + advance);

			const [updated] = await ctx.db
				.update(payroll)
				.set({
					...(input.overtime_pay !== undefined && {
						overtime_pay: input.overtime_pay,
					}),
					...(input.bonus !== undefined && { bonus: input.bonus }),
					...(input.deductions !== undefined && {
						deductions: input.deductions,
					}),
					...(input.advance_deduction !== undefined && {
						advance_deduction: input.advance_deduction,
					}),
					...(input.notes !== undefined && { notes: input.notes }),
					net_payable: netPayable.toFixed(2),
					updated_at: new Date(),
				})
				.where(eq(payroll.id, input.id))
				.returning();

			return updated;
		}),

	approve: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const [approved] = await ctx.db
				.update(payroll)
				.set({ status: "approved", updated_at: new Date() })
				.where(eq(payroll.id, input.id))
				.returning();
			return approved;
		}),

	pay: protectedProcedure
		.input(z.object({ id: z.number(), payment_method_id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const record = await ctx.db.query.payroll.findFirst({
				where: eq(payroll.id, input.id),
				with: { staff: true },
			});
			if (!record) throw new Error("Payroll not found");

			return await ctx.db.transaction(async (tx) => {
				// Mark as paid
				const [paid] = await tx
					.update(payroll)
					.set({
						status: "paid",
						payment_date: new Date(),
						payment_method_id: input.payment_method_id,
						updated_at: new Date(),
					})
					.where(eq(payroll.id, input.id))
					.returning();

				// Deduct from transactions (financial integration)
				await tx.insert(transactions).values({
					amount: record.net_payable,
					type: "out",
					category: "expense",
					reference_type: "payroll",
					reference_id: paid.id,
					payment_method_id: input.payment_method_id,
					branch_id: record.branch_id,
					user_uid: ctx.user.id,
					status: "success",
					description: `Salary payment for ${record.staff.name} (${record.month})`,
				});

				return paid;
			});
		}),
});
```

Issues I notice:
1. In the `generate` function, `net_payable` is set to `employee.salary` (which is a string) without any calculations for overtime, bonus, deductions, etc. This is incorrect - net payable should be calculated based on the components.
2. In the `update` function, the net payable is calculated correctly, but it's stored as a string with `toFixed(2)`. This has the same issue as before - storing financial amounts as strings.
3. In the `pay` function, when creating a transaction for the salary payment, the amount is taken directly from `record.net_payable` (which is a string) without conversion to a numeric type for the transaction amount (which is also stored as a string). This maintains the string storage issue.
4. There's no validation to ensure that the payroll calculations are correct or that the net payable matches the sum of components.
5. The payroll module doesn't seem to integrate with the journal entries module for proper accounting entries (though it does create a transaction).

Let me check apps/web/src/lib/trpc/routers/payroll-lock.ts