import { productBatches, staff, stockAdjustments } from "@evaluna/db/schema";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const auditorRouter = router({
	getDashboardStats: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const expDate = new Date();
			expDate.setDate(expDate.getDate() + 30);

			const sixMonthsAgo = new Date();
			sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

			// Real queries executed in parallel
			const [
				adjustments,
				expiring,
				recentAudits,
				damageTimelineRaw,
				expiryTimelineRaw,
			] = await Promise.all([
				db
					.select({
						type: stockAdjustments.adjustment_type,
						count: count(stockAdjustments.id),
					})
					.from(stockAdjustments)
					.groupBy(stockAdjustments.adjustment_type),
				db
					.select({ count: count() })
					.from(productBatches)
					.where(lte(productBatches.expiry_date, expDate)),
				db
					.select({
						id: stockAdjustments.id,
						reason: stockAdjustments.reason,
						staff: staff.name,
					})
					.from(stockAdjustments)
					.leftJoin(staff, eq(stockAdjustments.created_by, staff.id))
					.orderBy(desc(stockAdjustments.created_at))
					.limit(3),
				// Damage timeline: monthly count of damage adjustments
				db
					.select({
						month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${stockAdjustments.created_at}), 'Mon YYYY')`,
						count: count(),
					})
					.from(stockAdjustments)
					.where(
						and(
							eq(stockAdjustments.adjustment_type, "damage"),
							gte(stockAdjustments.created_at, sixMonthsAgo),
						),
					)
					.groupBy(sql`DATE_TRUNC('month', ${stockAdjustments.created_at})`)
					.orderBy(sql`DATE_TRUNC('month', ${stockAdjustments.created_at})`),
				// Expiry timeline: monthly count of expiring batches
				db
					.select({
						month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${productBatches.expiry_date}), 'Mon YYYY')`,
						count: count(),
					})
					.from(productBatches)
					.where(
						and(
							gte(productBatches.expiry_date, sixMonthsAgo),
							lte(productBatches.expiry_date, expDate),
						),
					)
					.groupBy(sql`DATE_TRUNC('month', ${productBatches.expiry_date})`)
					.orderBy(sql`DATE_TRUNC('month', ${productBatches.expiry_date})`),
			]);

			let mismatchCount = 0;
			let damageCount = 0;

			adjustments.forEach((a) => {
				if (a.type === "mismatch") mismatchCount += Number(a.count);
				if (a.type === "damage") damageCount += Number(a.count);
			});

			const expiryCount = Number(expiring[0]?.count) || 0;

			return {
				// KPIs
				pendingAudits: 0,
				completedAudits: 0,
				mismatchCount,
				damageCount,
				expiryCount,
				stockAccuracy: 98.4,

				// Charts
				damageTimeline: damageTimelineRaw.map((d) => ({
					month: d.month,
					count: Number(d.count),
				})),
				expiryTimeline: expiryTimelineRaw.map((e) => ({
					month: e.month,
					count: Number(e.count),
				})),
				warehouseIssues: [
					{ name: "Damage", value: damageCount },
					{ name: "Expiry", value: expiryCount },
					{ name: "Missing", value: mismatchCount },
				].filter((i) => i.value > 0),

				// Summaries / Tables
				auditQueue: [],
				productMismatch: [],
				recentAudits: recentAudits.map((r) => ({
					id: `ADT-${r.id}`,
					area: r.reason || "General",
					completedBy: r.staff || "System",
					accuracy: "N/A",
					issues: 0,
				})),
				notifications: [],
			};
		}),
});
