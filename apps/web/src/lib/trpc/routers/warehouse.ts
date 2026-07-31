import {
	branchLocations,
	orders,
	productBatches,
	stockLedger,
} from "@evaluna/db/schema";
import { count, desc, eq, lte, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const warehouseRouter = router({
	list: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
		const db = ctx.db;
		const locations = await db
			.select({
				id: branchLocations.id,
				zone: branchLocations.section,
				rack: branchLocations.name,
				capacity: branchLocations.capacity,
				used: branchLocations.current_stock,
				status: sql<string>`
          CASE 
            WHEN ${branchLocations.current_stock} >= ${branchLocations.capacity} THEN 'full'
            WHEN ${branchLocations.current_stock} >= ${branchLocations.capacity} * 0.8 THEN 'near_full'
            WHEN ${branchLocations.is_active} = false THEN 'maintenance'
            ELSE 'active'
          END
        `,
			})
			.from(branchLocations)
			.limit(50);

		return locations;
	}),

	getStats: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const received = await db
				.select({ val: sum(stockLedger.quantity) })
				.from(stockLedger)
				.where(eq(stockLedger.transaction_type, "in"));

			const pickingCount = await db
				.select({ count: count() })
				.from(orders)
				.where(eq(orders.status, "pending"));

			const capacityData = await db
				.select({
					cap: sum(branchLocations.capacity),
					used: sum(branchLocations.current_stock),
					locations: count(branchLocations.id),
				})
				.from(branchLocations);

			const expDate = new Date();
			expDate.setDate(expDate.getDate() + 30);
			const expiredCount = await db
				.select({ count: count() })
				.from(productBatches)
				.where(lte(productBatches.expiry_date, expDate));

			const locationsUsedVal = capacityData[0]?.locations || 0;
			const capVal = Number(capacityData[0]?.cap) || 1;
			const usedVal = Number(capacityData[0]?.used) || 0;
			const capacityPct = Math.round((usedVal / capVal) * 100);

			const rackUtil = await db
				.select({
					name: branchLocations.name,
					used: branchLocations.current_stock,
					total: branchLocations.capacity,
				})
				.from(branchLocations)
				.limit(4);

			const activityList = await db
				.select({
					id: stockLedger.id,
					action: stockLedger.transaction_type,
					time: stockLedger.created_at,
				})
				.from(stockLedger)
				.orderBy(desc(stockLedger.created_at))
				.limit(3);

			return {
				itemsReceived: Number(received[0]?.val) || 0,
				itemsPutAway: Number(received[0]?.val) || 0, // Simplified
				pickingQueue: pickingCount[0]?.count || 0,
				packingQueue: 0,
				warehouseCapacity: capacityPct,
				locationsUsed: locationsUsedVal,
				damageItems: 0,
				expiredProducts: expiredCount[0]?.count || 0,

				heatmapData: [],
				rackUtilization: rackUtil.map((r) => ({
					name: r.name || "Unknown Rack",
					used: Number(r.used) || 0,
					total: Number(r.total) || 100,
				})),
				fifoStatus: [],
				workerPerformance: [],
				pendingTasks: [],
				recentActivity: activityList.map((a) => ({
					id: a.id,
					action: `Transaction: ${a.action}`,
					time: a.time?.toLocaleString() || "N/A",
					user: "System",
				})),
				inventoryAlerts: [],
			};
		}),
});
