import { endOfDay, startOfDay, subDays } from "date-fns";
import {
	and,
	asc,
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
import { db } from "@/lib/db";
import {
	branches,
	orders,
	paymentMethods,
	transactions,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../init";

export const cashbookRouter = router({
	getLedger: protectedProcedure
		.input(
			z.object({
				limit: z.number().default(50),
				offset: z.number().default(0),
				type: z.enum(["in", "out", "all"]).optional().default("all"),
				category: z.string().optional(),
				search: z.string().optional(),
				dateFrom: z.string().optional(),
				dateTo: z.string().optional(),
				branchId: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const role = ctx.user?.role || ctx.user?.primaryRole?.name?.toLowerCase() || "";
			const isCustomer = role === "customer";
			const effectiveBranchId =
				input.branchId ?? (ctx.user?.isSuperadmin ? undefined : ctx.user?.branchId);

			const conditions: any[] = [];

			if (isCustomer) {
				conditions.push(eq(transactions.user_uid, ctx.user.id));
			} else if (effectiveBranchId != null) {
				conditions.push(
					or(
						eq(transactions.branch_id, effectiveBranchId),
						isNull(transactions.branch_id),
					),
				);
			}

			if (input.type && input.type !== "all") {
				if (input.type === "in") {
					conditions.push(
						inArray(transactions.type, ["in", "income", "credit"]),
					);
				} else if (input.type === "out") {
					conditions.push(
						inArray(transactions.type, ["out", "expense", "debit"]),
					);
				}
			}

			if (input.category && input.category !== "all") {
				conditions.push(eq(transactions.category, input.category));
			}

			if (input.search && input.search.trim() !== "") {
				const query = `%${input.search.trim()}%`;
				conditions.push(
					or(
						ilike(transactions.description, query),
						ilike(transactions.category, query),
						ilike(transactions.reference_type, query),
						sql`CAST(${transactions.id} AS TEXT) ILIKE ${query}`,
						sql`CAST(${transactions.order_id} AS TEXT) ILIKE ${query}`,
					),
				);
			}

			if (input.dateFrom) {
				conditions.push(gte(transactions.created_at, new Date(input.dateFrom)));
			}
			if (input.dateTo) {
				conditions.push(lte(transactions.created_at, new Date(input.dateTo)));
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			const rows = await db
				.select({
					id: transactions.id,
					branch_id: transactions.branch_id,
					description: transactions.description,
					order_id: transactions.order_id,
					payment_method_id: transactions.payment_method_id,
					payment_method_name: paymentMethods.name,
					amount: transactions.amount,
					original_amount: transactions.original_amount,
					adjustment_amount: transactions.adjustment_amount,
					user_uid: transactions.user_uid,
					type: transactions.type,
					category: transactions.category,
					status: transactions.status,
					reference_id: transactions.reference_id,
					reference_type: transactions.reference_type,
					reconciliation_status: transactions.reconciliation_status,
					created_at: transactions.created_at,
				})
				.from(transactions)
				.leftJoin(
					paymentMethods,
					eq(transactions.payment_method_id, paymentMethods.id),
				)
				.where(whereClause)
				.orderBy(desc(transactions.created_at))
				.limit(input.limit)
				.offset(input.offset);

			// Normalize type to "in" / "out" for consistency
			const items = rows.map((r) => {
				const rawType = r.type?.toLowerCase() || "in";
				const normalizedType: "in" | "out" =
					rawType === "out" || rawType === "expense" || rawType === "debit"
						? "out"
						: "in";

				return {
					...r,
					type: normalizedType,
					amount: r.amount || "0.00",
					original_amount: r.original_amount || r.amount || "0.00",
					adjustment_amount: r.adjustment_amount || "0.00",
					reconciliation_status: r.reconciliation_status || "pending",
				};
			});

			return { items };
		}),

	addEntry: protectedProcedure
		.input(
			z.object({
				amount: z.number().positive(),
				type: z.enum(["in", "out"]),
				description: z.string().min(1),
				category: z.string().optional().default("manual"),
				user_uid: z.string().optional(),
				branchId: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.user?.id || input.user_uid || "system";
			const branchId = input.branchId ?? ctx.user?.branchId ?? 1;

			const [newEntry] = await db
				.insert(transactions)
				.values({
					branch_id: branchId,
					amount: input.amount.toString(),
					original_amount: input.amount.toString(),
					adjustment_amount: "0",
					type: input.type,
					description: input.description,
					category: input.category,
					user_uid: userId,
					reference_type: "manual",
					status: "completed",
					reconciliation_status: "pending",
					created_at: new Date(),
				})
				.returning();

			return newEntry;
		}),

	getDailySummary: protectedProcedure
		.input(
			z.object({
				date: z.string().optional(),
				period: z.enum(["today", "week", "month", "all"]).optional().default("today"),
				branchId: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const role = ctx.user?.role || ctx.user?.primaryRole?.name?.toLowerCase() || "";
			const isCustomer = role === "customer";
			const effectiveBranchId =
				input.branchId ?? (ctx.user?.isSuperadmin ? undefined : ctx.user?.branchId);

			const baseConditions: any[] = [];
			if (isCustomer) {
				baseConditions.push(eq(transactions.user_uid, ctx.user.id));
			} else if (effectiveBranchId != null) {
				baseConditions.push(
					or(
						eq(transactions.branch_id, effectiveBranchId),
						isNull(transactions.branch_id),
					),
				);
			}

			const now = new Date();
			let startDate: Date | undefined;
			let endDate: Date | undefined;

			if (input.period === "today") {
				startDate = startOfDay(now);
				endDate = endOfDay(now);
			} else if (input.period === "week") {
				startDate = startOfDay(subDays(now, 7));
				endDate = endOfDay(now);
			} else if (input.period === "month") {
				startDate = startOfDay(subDays(now, 30));
				endDate = endOfDay(now);
			}

			if (input.date) {
				const specific = new Date(input.date);
				startDate = startOfDay(specific);
				endDate = endOfDay(specific);
			}

			const periodConditions = [...baseConditions];
			if (startDate && endDate) {
				periodConditions.push(
					gte(transactions.created_at, startDate),
					lte(transactions.created_at, endDate),
				);
			}

			// Fetch period transactions and all-time totals in parallel
			const [periodTx, allTx] = await Promise.all([
				db.query.transactions.findMany({
					where:
						periodConditions.length > 0 ? and(...periodConditions) : undefined,
				}),
				db.query.transactions.findMany({
					where: baseConditions.length > 0 ? and(...baseConditions) : undefined,
				}),
			]);

			let totalIn = 0;
			let totalOut = 0;
			let sales = 0;
			let expenses = 0;

			for (const tx of periodTx) {
				const amt = Number.parseFloat(tx.amount) || 0;
				const rawType = tx.type?.toLowerCase() || "in";
				const isIncome =
					rawType === "in" || rawType === "income" || rawType === "credit";
				const isExpense =
					rawType === "out" || rawType === "expense" || rawType === "debit";

				if (isIncome) {
					totalIn += amt;
					if (
						tx.category === "sale" ||
						tx.category === "selling" ||
						tx.category === "pos" ||
						tx.reference_type === "order" ||
						tx.reference_type === "pos" ||
						tx.reference_type === "driver_cash"
					) {
						sales += amt;
					}
				} else if (isExpense) {
					totalOut += amt;
					if (
						tx.category === "expense" ||
						tx.category === "purchase" ||
						tx.category === "payroll" ||
						tx.reference_type === "expense" ||
						tx.reference_type === "purchase"
					) {
						expenses += amt;
					}
				}
			}

			// If current day has 0 entries, calculate fallback from all records so total is visible
			let allTimeIn = 0;
			let allTimeOut = 0;
			let allTimeSales = 0;
			let allTimeExpenses = 0;

			for (const tx of allTx) {
				const amt = Number.parseFloat(tx.amount) || 0;
				const rawType = tx.type?.toLowerCase() || "in";
				if (rawType === "in" || rawType === "income" || rawType === "credit") {
					allTimeIn += amt;
					if (
						tx.category === "sale" ||
						tx.category === "selling" ||
						tx.reference_type === "order" ||
						tx.reference_type === "pos"
					) {
						allTimeSales += amt;
					}
				} else {
					allTimeOut += amt;
					if (
						tx.category === "expense" ||
						tx.category === "purchase" ||
						tx.reference_type === "expense"
					) {
						allTimeExpenses += amt;
					}
				}
			}

			return {
				totalIn,
				totalOut,
				sales,
				expenses,
				net: totalIn - totalOut,
				count: periodTx.length,
				allTimeIn,
				allTimeOut,
				allTimeSales,
				allTimeExpenses,
				allTimeNet: allTimeIn - allTimeOut,
				allTimeCount: allTx.length,
			};
		}),
});
