import { endOfDay, startOfDay } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { publicProcedure, router } from "../init";

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
