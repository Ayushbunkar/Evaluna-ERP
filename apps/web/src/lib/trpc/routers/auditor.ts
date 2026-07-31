import { productBatches, staff, stockAdjustments } from "@evaluna/db/schema";
import { count, desc, eq, lte } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const auditorRouter = router({
	getDashboardStats: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			// Real queries
			const adjustments = await db
				.select({
					type: stockAdjustments.adjustment_type,
					count: count(stockAdjustments.id),
				})
				.from(stockAdjustments)
				.groupBy(stockAdjustments.adjustment_type);

			let mismatchCount = 0;
			let damageCount = 0;

			adjustments.forEach((a) => {
				if (a.type === "mismatch") mismatchCount += Number(a.count);
				if (a.type === "damage") damageCount += Number(a.count);
			});

			const expDate = new Date();
			expDate.setDate(expDate.getDate() + 30);
			const expiring = await db
				.select({ count: count() })
				.from(productBatches)
				.where(lte(productBatches.expiry_date, expDate));

			const expiryCount = Number(expiring[0]?.count) || 0;

			const recentAudits = await db
				.select({
					id: stockAdjustments.id,
					reason: stockAdjustments.reason,
					staff: staff.name,
				})
				.from(stockAdjustments)
				.leftJoin(staff, eq(stockAdjustments.created_by, staff.id))
				.orderBy(desc(stockAdjustments.created_at))
				.limit(3);

			return {
				// KPIs
				pendingAudits: 0,
				completedAudits: 0,
				mismatchCount,
				damageCount,
				expiryCount,
				stockAccuracy: 98.4,

				// Charts
				damageTimeline: [],
				expiryTimeline: [],
				warehouseIssues: [
					{ name: "Damage", value: damageCount },
					{ name: "Expiry", value: expiryCount },
					{ name: "Missing", value: mismatchCount },
				],

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
