import {
	auditLogs,
	batchStock,
	branchInventory,
	branchLocations,
	customers,
	goodsReceiptItems,
	goodsReceiptNotes,
	orders,
	packageItems,
	packages,
	pickListItems,
	pickLists,
	placementVerifications,
	procurementExceptions,
	productBatches,
	products,
	purchaseItems,
	purchases,
	receivingInspections,
	staff,
	stockAdjustments,
	stockLedger,
	suppliers,
	user,
} from "@evaluna/db/schema";
import {
	and,
	count,
	desc,
	eq,
	gte,
	inArray,
	lte,
	not,
	notInArray,
	or,
	sql,
	sum,
} from "drizzle-orm";
import { z } from "zod";
import { EWayBillService } from "@/lib/services/eway-bill";
import { protectedProcedure, router } from "../init";
import { logAudit, notify, resolveStaffId } from "../util/audit";

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

	getLocations: protectedProcedure
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			let query = ctx.db.select().from(branchLocations);

			if (input.branchId) {
				query = query.where(
					eq(branchLocations.branch_id, input.branchId),
				) as any;
			}

			return await query.orderBy(desc(branchLocations.created_at));
		}),

	createLocation: protectedProcedure
		.input(
			z.object({
				branch_id: z.number().default(1),
				name: z.string().min(1),
				section: z.string().optional(),
				aisle: z.string().optional(),
				shelf: z.string().optional(),
				level: z.string().optional(),
				location_type: z.string().default("storage"),
				capacity: z.number().default(0),
				is_active: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [location] = await ctx.db
				.insert(branchLocations)
				.values(input)
				.returning();
			return location;
		}),

	updateLocation: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				section: z.string().optional(),
				aisle: z.string().optional(),
				shelf: z.string().optional(),
				level: z.string().optional(),
				location_type: z.string().optional(),
				capacity: z.number().optional(),
				is_active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [location] = await ctx.db
				.update(branchLocations)
				.set(data)
				.where(eq(branchLocations.id, id))
				.returning();
			return location;
		}),

	deleteLocation: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(branchLocations)
				.where(eq(branchLocations.id, input.id));
			return { success: true };
		}),

	getStockByLocation: protectedProcedure
		.input(z.object({ locationId: z.number() }))
		.query(async ({ ctx, input }) => {
			const stock = await ctx.db
				.select({
					id: batchStock.id,
					batch_id: batchStock.batch_id,
					batch_number: productBatches.batch_number,
					product_name: products.name,
					quantity: batchStock.quantity,
				})
				.from(batchStock)
				.leftJoin(productBatches, eq(batchStock.batch_id, productBatches.id))
				.leftJoin(products, eq(productBatches.product_id, products.id))
				.where(eq(batchStock.location_id, input.locationId));

			return stock;
		}),

	moveStock: protectedProcedure
		.input(
			z.object({
				batch_stock_id: z.number(),
				from_location_id: z.number(),
				to_location_id: z.number(),
				quantity: z.number().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx) => {
				// 1. Verify source stock exists and has sufficient quantity
				const [sourceStock] = await tx
					.select()
					.from(batchStock)
					.where(eq(batchStock.id, input.batch_stock_id));

				if (!sourceStock || sourceStock.quantity < input.quantity) {
					throw new Error("Insufficient stock in source location");
				}

				// 2. Deduct from source
				await tx
					.update(batchStock)
					.set({ quantity: sourceStock.quantity - input.quantity })
					.where(eq(batchStock.id, input.batch_stock_id));

				// 3. Find or create destination stock record for same batch
				const [destStock] = await tx
					.select()
					.from(batchStock)
					.where(
						and(
							eq(batchStock.batch_id, sourceStock.batch_id),
							eq(batchStock.location_id, input.to_location_id),
						),
					);

				if (destStock) {
					await tx
						.update(batchStock)
						.set({ quantity: destStock.quantity + input.quantity })
						.where(eq(batchStock.id, destStock.id));
				} else {
					await tx.insert(batchStock).values({
						batch_id: sourceStock.batch_id,
						location_id: input.to_location_id,
						quantity: input.quantity,
					});
				}

				// 4. Log to stock ledger
				// Note: Since total branch inventory doesn't change, we may not need to hit branchInventory,
				// but we should log the internal movement.
				// We'll use reference_type = 'internal_transfer'
				const [batchInfo] = await tx
					.select({ product_id: productBatches.product_id })
					.from(productBatches)
					.where(eq(productBatches.id, sourceStock.batch_id));

				if (batchInfo) {
					await tx.insert(stockLedger).values({
						branch_id: sourceStock.location_id, // approximation or hardcode to 1
						product_id: batchInfo.product_id,
						batch_id: sourceStock.batch_id,
						transaction_type: "transfer", // Internal transfer out of bin
						quantity: -input.quantity,
						unit_cost: "0",
						total_cost: "0",
						reference_type: "internal_movement_out",
						reference_id: input.from_location_id,
					});
					await tx.insert(stockLedger).values({
						branch_id: sourceStock.location_id,
						product_id: batchInfo.product_id,
						batch_id: sourceStock.batch_id,
						transaction_type: "transfer", // Internal transfer into bin
						quantity: input.quantity,
						unit_cost: "0",
						total_cost: "0",
						reference_type: "internal_movement_in",
						reference_id: input.to_location_id,
					});
				}

				return { success: true };
			});
		}),

	getStats: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchFilter = input.branch_id
				? eq(branchLocations.branch_id, input.branch_id)
				: undefined;

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
				.from(branchLocations)
				.where(branchFilter);

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

			// ── Rack Utilization: real data from branch_locations ─────────────
			const rackUtil = await db
				.select({
					name: branchLocations.name,
					used: branchLocations.current_stock,
					total: branchLocations.capacity,
					section: branchLocations.section,
				})
				.from(branchLocations)
				.where(branchFilter)
				.orderBy(desc(branchLocations.current_stock))
				.limit(8);

			// ── Heatmap Data: locations plotted by section/aisle ─────────────
			const heatmapRaw = await db
				.select({
					section: branchLocations.section,
					aisle: branchLocations.aisle,
					current_stock: branchLocations.current_stock,
					capacity: branchLocations.capacity,
					name: branchLocations.name,
				})
				.from(branchLocations)
				.where(branchFilter)
				.limit(50);

			// Convert locations to scatter chart points (x=aisle index, y=shelf level, z=activity)
			const sectionMap: Record<string, number> = {};
			let sectionIdx = 0;
			const heatmapData = heatmapRaw.map((loc) => {
				const section = loc.section || "A";
				if (!(section in sectionMap)) {
					sectionMap[section] = sectionIdx++;
				}
				return {
					x: sectionMap[section],
					y: Number(loc.current_stock) || 0,
					activity: loc.capacity
						? Math.round(
								(Number(loc.current_stock) / Number(loc.capacity)) * 100,
							)
						: 0,
					name: loc.name,
				};
			});

			// ── FIFO Status: batch age distribution ──────────────────────────
			const now = new Date();
			const fifteenDaysAgo = new Date(now);
			fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
			const thirtyDaysAgo = new Date(now);
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			const sixtyDaysAgo = new Date(now);
			sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

			const [fifoData] = await db
				.select({
					fresh: sql<number>`count(*) filter (where ${productBatches.created_at} >= ${fifteenDaysAgo})`,
					recent: sql<number>`count(*) filter (where ${productBatches.created_at} >= ${thirtyDaysAgo} and ${productBatches.created_at} <= ${fifteenDaysAgo})`,
					old: sql<number>`count(*) filter (where ${productBatches.created_at} >= ${sixtyDaysAgo} and ${productBatches.created_at} <= ${thirtyDaysAgo})`,
					veryOld: sql<number>`count(*) filter (where ${productBatches.created_at} <= ${sixtyDaysAgo})`,
				})
				.from(productBatches);

			const fifoStatus = [
				{ age: "0-15 days", value: Number(fifoData?.fresh) || 0 },
				{ age: "16-30 days", value: Number(fifoData?.recent) || 0 },
				{ age: "31-60 days", value: Number(fifoData?.old) || 0 },
				{ age: "60+ days", value: Number(fifoData?.veryOld) || 0 },
			].filter((f) => f.value > 0);

			// ── Activity from stock ledger with product names ─────────────────
			const activityList = await db
				.select({
					id: stockLedger.id,
					action: stockLedger.transaction_type,
					productName: products.name,
					qty: stockLedger.quantity,
					time: stockLedger.created_at,
				})
				.from(stockLedger)
				.leftJoin(products, eq(stockLedger.product_id, products.id))
				.orderBy(desc(stockLedger.created_at))
				.limit(6);

			// ── Worker Performance from staff (warehouse pickers/putters) ─────
			const warehouseStaff = await db
				.select({
					id: staff.id,
					name: staff.name,
					role: staff.role,
					branch_id: staff.branch_id,
				})
				.from(staff)
				.where(
					and(
						sql`${staff.role} IN ('picker', 'putter', 'warehouse')`,
						eq(staff.status, "active"),
						input.branch_id ? eq(staff.branch_id, input.branch_id) : undefined,
					),
				)
				.limit(5);

			let workerPerformance: {
				name: string;
				role: string;
				items: number;
				accuracy: number;
			}[] = [];

			if (warehouseStaff.length > 0) {
				const staffIds = warehouseStaff.map((s) => s.id);
				const staffStatsRows = await db
					.select({
						assignedTo: pickLists.assigned_to,
						totalPicked: sql<number>`coalesce(sum(${pickListItems.quantity_picked}), 0)`,
						totalOrdered: sql<number>`coalesce(sum(${pickListItems.quantity_ordered}), 0)`,
					})
					.from(pickListItems)
					.innerJoin(pickLists, eq(pickListItems.pick_list_id, pickLists.id))
					.where(inArray(pickLists.assigned_to, staffIds))
					.groupBy(pickLists.assigned_to);

				const statsMap = new Map(
					staffStatsRows.map((r) => [
						r.assignedTo,
						{
							totalPicked: Number(r.totalPicked) || 0,
							totalOrdered: Number(r.totalOrdered) || 0,
						},
					]),
				);

				workerPerformance = warehouseStaff.map((w) => {
					const s = statsMap.get(w.id);
					const totalPicked = s?.totalPicked || 0;
					const totalOrdered = s?.totalOrdered || 0;
					const accuracy =
						totalOrdered > 0
							? Math.round((totalPicked / totalOrdered) * 100)
							: 0;

					return {
						name: w.name,
						role: w.role,
						items: totalPicked,
						accuracy,
					};
				});
			}

			// ── Inventory Alerts: low stock items ─────────────────────────────
			const lowStockItems = await db
				.select({
					id: branchInventory.id,
					productName: products.name,
					inStock: branchInventory.in_stock,
					reorderLevel: branchInventory.reorder_level,
				})
				.from(branchInventory)
				.leftJoin(products, eq(branchInventory.product_id, products.id))
				.where(
					and(
						lte(branchInventory.in_stock, branchInventory.reorder_level),
						input.branch_id
							? eq(branchInventory.branch_id, input.branch_id)
							: undefined,
					),
				)
				.orderBy(branchInventory.in_stock)
				.limit(5);

			const inventoryAlerts = lowStockItems.map((item) => ({
				id: item.id,
				message: `Low Stock: ${item.productName ?? "Unknown"} — ${item.inStock} units remaining (reorder at ${item.reorderLevel})`,
				time: "Now",
				severity: item.inStock === 0 ? "critical" : "warning",
			}));

			// ── Damage Items: count of damage stock adjustments ───────────────
			const damageCount = await db
				.select({ count: count() })
				.from(stockAdjustments)
				.where(
					and(
						eq(stockAdjustments.adjustment_type, "damage"),
						input.branch_id
							? eq(stockAdjustments.branch_id, input.branch_id)
							: undefined,
					),
				);

			// ── Pending Tasks: pending orders ─────────────────────────────────
			const pendingOrdersList = await db
				.select({
					id: orders.id,
					status: orders.status,
					created_at: orders.created_at,
					total_amount: orders.total_amount,
				})
				.from(orders)
				.where(eq(orders.status, "pending"))
				.orderBy(desc(orders.created_at))
				.limit(5);

			const pendingTasks = pendingOrdersList.map((o) => ({
				id: o.id,
				title: `Order #${o.id} — ₹${Number(o.total_amount).toFixed(2)}`,
				status: o.status,
				priority:
					o.created_at &&
					new Date(o.created_at) < new Date(Date.now() - 3600000 * 2)
						? "high"
						: "medium",
			}));

			return {
				itemsReceived: Number(received[0]?.val) || 0,
				itemsPutAway: Number(received[0]?.val) || 0, // Note: This is the same as itemsReceived; consider renaming or clarifying
				pickingQueue: pickingCount[0]?.count || 0,
				packingQueue: 0, // No packing queue data available
				warehouseCapacity: capacityPct,
				locationsUsed: locationsUsedVal,
				damageItems: damageCount[0]?.count || 0,
				expiredProducts: expiredCount[0]?.count || 0,

				heatmapData,
				rackUtilization: rackUtil.map((r) => ({
					name: r.name || "Unknown",
					used: Number(r.used) || 0,
					total: Number(r.total) || 100,
					section: r.section || "N/A",
				})),
				fifoStatus,
				workerPerformance,
				pendingTasks,
				recentActivity: activityList.map((a) => ({
					id: a.id,
					action: `${a.action === "in" ? "Received" : "Dispatched"}: ${a.productName ?? "Product"} (${a.qty} units)`,
					time: a.time ? new Date(a.time).toLocaleString() : "N/A",
					user: "System",
				})),
				inventoryAlerts,
			};
		}),

	getOverviewStats: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = input?.branch_id ?? ctx.user.branchId;

			const [
				[pickListsStats],
				[ordersWaitingData],
				[purchasesStats],
				[placementStats],
				[packagesStats],
				[capacityData],
				packedPackagesRows,
				completedPickListRows,
			] = await Promise.all([
				// 1. PickLists aggregations
				db
					.select({
						ordersWaitingPickLists: sql<number>`count(*) filter (where ${pickLists.status} in ('pending', 'unassigned'))`,
						pickingQueue: sql<number>`count(*) filter (where ${pickLists.status} in ('assigned', 'picking', 'in_progress', 'started', 'active'))`,
						completedToday: sql<number>`count(*) filter (where ${pickLists.status} = 'completed' and (${pickLists.completed_at} >= CURRENT_DATE or ${pickLists.completed_at} is null))`,
						tasksInProgress: sql<number>`count(*) filter (where ${pickLists.status} in ('picking', 'in_progress', 'assigned'))`,
						delayed: sql<number>`count(*) filter (where ${pickLists.status} not in ('completed', 'cancelled') and ${pickLists.created_at} <= NOW() - INTERVAL '2 hours')`,
					})
					.from(pickLists),

				// 2. Orders awaiting pick allocation
				db
					.select({
						ordersWaiting: sql<number>`count(*) filter (where ${orders.status} in ('confirmed', 'pending', 'processing', 'awaiting_picking', 'under_review'))`,
					})
					.from(orders)
					.where(branchId ? sql`(${orders.branch_id} = ${branchId} OR ${orders.branch_id} IS NULL)` : undefined),

				// 3. Purchases aggregations (Expected inbound POs awaiting receipt / inspection)
				db
					.select({
						receivingQueue: sql<number>`count(*) filter (where LOWER(${purchases.status}) in ('pending', 'ordered', 'in_transit', 'draft', 'approved', 'partially_received', 'awaiting_receipt'))`,
						delayed: sql<number>`count(*) filter (where LOWER(${purchases.status}) not in ('completed', 'cancelled') and ${purchases.created_at} <= NOW() - INTERVAL '2 hours')`,
					})
					.from(purchases)
					.where(branchId ? sql`(${purchases.branch_id} = ${branchId} OR ${purchases.branch_id} IS NULL)` : undefined),

				// 4. Placement verifications aggregations (Put-away tasks)
				db
					.select({
						putAwayQueue: sql<number>`count(*) filter (where UPPER(${placementVerifications.status}) in ('AWAITING_PLACEMENT', 'VERIFICATION_REQUIRED', 'PENDING'))`,
						tasksInProgress: sql<number>`count(*) filter (where UPPER(${placementVerifications.status}) in ('VERIFICATION_REQUIRED', 'PLACED', 'IN_PROGRESS'))`,
					})
					.from(placementVerifications)
					.where(branchId ? sql`(${placementVerifications.branch_id} = ${branchId} OR ${placementVerifications.branch_id} IS NULL)` : undefined),

				// 5. Packages aggregations
				db
					.select({
						activePacking: sql<number>`count(*) filter (where ${packages.status} in ('packing', 'pending', 'in_progress', 'ready_for_packing'))`,
						dispatchReady: sql<number>`count(*) filter (where ${packages.status} in ('packed', 'ready_for_dispatch', 'checked', 'loaded'))`,
						completedToday: sql<number>`count(*) filter (where ${packages.status} in ('packed', 'ready_for_dispatch', 'checked', 'dispatched', 'loaded') and (${packages.packed_at} >= CURRENT_DATE or ${packages.packed_at} is null))`,
					})
					.from(packages),

				// 6. Capacity aggregations
				db
					.select({
						cap: sum(branchLocations.capacity),
						used: sum(branchLocations.current_stock),
					})
					.from(branchLocations)
					.where(branchId ? sql`(${branchLocations.branch_id} = ${branchId} OR ${branchLocations.branch_id} IS NULL)` : undefined),

				// 7. Packages already packed for packing queue exclusion
				db
					.select({
						order_id: packages.order_id,
						pick_list_id: packages.pick_list_id,
					})
					.from(packages)
					.where(
						inArray(packages.status, [
							"packed",
							"ready_for_dispatch",
							"dispatched",
							"completed",
						]),
					),

				// 8. Completed picklists awaiting packing
				db
					.select({
						id: pickLists.id,
						order_id: pickLists.order_id,
					})
					.from(pickLists)
					.where(eq(pickLists.status, "completed")),
			]);

			// Calculate pending to pack picklists (items picked but not yet packed)
			const packedOrderIds = new Set(packedPackagesRows.map((p) => p.order_id).filter(Boolean));
			const packedPickListIds = new Set(packedPackagesRows.map((p) => p.pick_list_id).filter(Boolean));

			const pendingPickListsCount = completedPickListRows.filter(
				(p) => !packedPickListIds.has(p.id) && (!p.order_id || !packedOrderIds.has(p.order_id)),
			).length;

			const packingQueueTotal = pendingPickListsCount + (Number(packagesStats?.activePacking) || 0);

			// Real orders waiting count
			const ordersWaitingTotal = Math.max(
				Number(ordersWaitingData?.ordersWaiting) || 0,
				Number(pickListsStats?.ordersWaitingPickLists) || 0,
			);

			const completedToday =
				(Number(pickListsStats?.completedToday) || 0) +
				(Number(packagesStats?.completedToday) || 0);

			const tasksInProgress =
				(Number(pickListsStats?.tasksInProgress) || 0) +
				(Number(placementStats?.tasksInProgress) || 0);

			const delayedTasks =
				(Number(pickListsStats?.delayed) || 0) +
				(Number(purchasesStats?.delayed) || 0);

			const capVal = Number(capacityData?.cap) || 1000;
			const usedVal = Number(capacityData?.used) || 0;
			const warehouseUtilization = Math.round((usedVal / capVal) * 100);

			return {
				ordersWaiting: ordersWaitingTotal,
				receivingQueue: Number(purchasesStats?.receivingQueue) || 0,
				putAwayQueue: Number(placementStats?.putAwayQueue) || 0,
				pickingQueue: Number(pickListsStats?.pickingQueue) || 0,
				packingQueue: packingQueueTotal,
				dispatchReady: Number(packagesStats?.dispatchReady) || 0,
				completedToday,
				tasksInProgress,
				delayedTasks,
				warehouseUtilization,
			};
		}),

	getThroughputAnalytics: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = input?.branch_id ?? ctx.user.branchId;

			// 1. Core Task Counts & SLA Metrics
			const [
				pickCounts,
				orderCounts,
				purchaseCounts,
				placementCounts,
				packageCounts,
				staffCounts,
				assignedStaffCounts,
				hourlyPickActivity,
				hourlyPackActivity,
				topProducts,
				operatorStats,
			] = await Promise.all([
				// 1. PickLists (total, pending, active, completed, delayed)
				db
					.select({
						total: sql<number>`count(*)`,
						pending: sql<number>`count(*) filter (where ${pickLists.status} in ('pending', 'unassigned'))`,
						active: sql<number>`count(*) filter (where ${pickLists.status} in ('assigned', 'picking', 'in_progress', 'started', 'active'))`,
						completedToday: sql<number>`count(*) filter (where ${pickLists.status} = 'completed' and (${pickLists.completed_at} >= CURRENT_DATE or ${pickLists.completed_at} is null))`,
						completedTotal: sql<number>`count(*) filter (where ${pickLists.status} = 'completed')`,
						delayed: sql<number>`count(*) filter (where ${pickLists.status} not in ('completed', 'cancelled') and ${pickLists.created_at} <= NOW() - INTERVAL '2 hours')`,
					})
					.from(pickLists),

				// 2. Orders awaiting pick allocation
				db
					.select({
						ordersWaiting: sql<number>`count(*) filter (where ${orders.status} in ('confirmed', 'pending', 'processing', 'awaiting_picking', 'under_review'))`,
						totalOrders: sql<number>`count(*)`,
					})
					.from(orders)
					.where(branchId ? sql`(${orders.branch_id} = ${branchId} OR ${orders.branch_id} IS NULL)` : undefined),

				// 3. Purchases (Receiving queue)
				db
					.select({
						receivingQueue: sql<number>`count(*) filter (where LOWER(${purchases.status}) in ('pending', 'ordered', 'in_transit', 'draft', 'approved', 'partially_received', 'awaiting_receipt', 'received'))`,
						receivedToday: sql<number>`count(*) filter (where LOWER(${purchases.status}) in ('received', 'completed') and (${purchases.created_at} >= CURRENT_DATE or ${purchases.created_at} is null))`,
						delayedReceiving: sql<number>`count(*) filter (where LOWER(${purchases.status}) not in ('completed', 'received', 'cancelled') and ${purchases.created_at} <= NOW() - INTERVAL '2 hours')`,
					})
					.from(purchases)
					.where(branchId ? sql`(${purchases.branch_id} = ${branchId} OR ${purchases.branch_id} IS NULL)` : undefined),

				// 4. Placements (Put-away queue)
				db
					.select({
						putAwayQueue: sql<number>`count(*) filter (where UPPER(${placementVerifications.status}) in ('AWAITING_PLACEMENT', 'VERIFICATION_REQUIRED', 'PENDING'))`,
						placedToday: sql<number>`count(*) filter (where UPPER(${placementVerifications.status}) in ('PLACED', 'VERIFIED', 'COMPLETED') and (${placementVerifications.created_at} >= CURRENT_DATE or ${placementVerifications.created_at} is null))`,
						delayedPlacement: sql<number>`count(*) filter (where UPPER(${placementVerifications.status}) not in ('PLACED', 'VERIFIED', 'COMPLETED') and ${placementVerifications.created_at} <= NOW() - INTERVAL '2 hours')`,
					})
					.from(placementVerifications)
					.where(branchId ? sql`(${placementVerifications.branch_id} = ${branchId} OR ${placementVerifications.branch_id} IS NULL)` : undefined),

				// 5. Packages (Packing queue)
				db
					.select({
						activePacking: sql<number>`count(*) filter (where ${packages.status} in ('packing', 'pending', 'in_progress', 'ready_for_packing'))`,
						packedToday: sql<number>`count(*) filter (where ${packages.status} in ('packed', 'ready_for_dispatch', 'checked', 'dispatched', 'loaded') and (${packages.packed_at} >= CURRENT_DATE or ${packages.packed_at} is null))`,
						dispatchReady: sql<number>`count(*) filter (where ${packages.status} in ('packed', 'ready_for_dispatch', 'checked', 'loaded'))`,
					})
					.from(packages),

				// 6. Total active warehouse staff
				db
					.select({ count: sql<number>`count(*)` })
					.from(staff)
					.where(and(eq(staff.is_deleted, false), eq(staff.status, "active"))),

				// 7. Staff currently actively assigned to open tasks
				db
					.select({ count: sql<number>`count(distinct ${pickLists.assigned_to})` })
					.from(pickLists)
					.where(sql`${pickLists.status} in ('assigned', 'picking', 'in_progress') and ${pickLists.assigned_to} is not null`),

				// 8. Hourly picks activity
				db
					.select({
						hour: sql<number>`EXTRACT(HOUR FROM ${pickLists.created_at})`,
						count: sql<number>`count(*)`,
					})
					.from(pickLists)
					.where(sql`${pickLists.created_at} >= CURRENT_DATE`)
					.groupBy(sql`EXTRACT(HOUR FROM ${pickLists.created_at})`),

				// 9. Hourly packages packed activity
				db
					.select({
						hour: sql<number>`EXTRACT(HOUR FROM ${packages.created_at})`,
						count: sql<number>`count(*)`,
					})
					.from(packages)
					.where(sql`${packages.created_at} >= CURRENT_DATE`)
					.groupBy(sql`EXTRACT(HOUR FROM ${packages.created_at})`),

				// 10. Top Products Picked / Moved
				db
					.select({
						product_id: pickListItems.product_id,
						product_name: products.name,
						product_sku: products.sku,
						total_picked: sql<number>`COALESCE(sum(${pickListItems.quantity_picked}), 0)`,
						total_ordered: sql<number>`COALESCE(sum(${pickListItems.quantity_ordered}), 0)`,
					})
					.from(pickListItems)
					.leftJoin(products, eq(pickListItems.product_id, products.id))
					.groupBy(pickListItems.product_id, products.name, products.sku)
					.orderBy(desc(sql`COALESCE(sum(${pickListItems.quantity_picked}), 0)`))
					.limit(5),

				// 11. Operator Productivity Summary
				db
					.select({
						staff_id: staff.id,
						staff_name: staff.name,
						role: staff.role,
						completed_picks: sql<number>`count(distinct ${pickLists.id}) filter (where ${pickLists.status} = 'completed')`,
					})
					.from(staff)
					.leftJoin(pickLists, eq(staff.id, pickLists.assigned_to))
					.where(and(eq(staff.is_deleted, false), eq(staff.status, "active")))
					.groupBy(staff.id, staff.name, staff.role)
					.orderBy(desc(sql`count(distinct ${pickLists.id}) filter (where ${pickLists.status} = 'completed')`))
					.limit(5),
			]);

			const pCounts = pickCounts[0] || { total: 0, pending: 0, active: 0, completedToday: 0, completedTotal: 0, delayed: 0 };
			const oCounts = orderCounts[0] || { ordersWaiting: 0, totalOrders: 0 };
			const rCounts = purchaseCounts[0] || { receivingQueue: 0, receivedToday: 0, delayedReceiving: 0 };
			const pvCounts = placementCounts[0] || { putAwayQueue: 0, placedToday: 0, delayedPlacement: 0 };
			const pkgCounts = packageCounts[0] || { activePacking: 0, packedToday: 0, dispatchReady: 0 };

			const totalBacklogUnits =
				Number(oCounts.ordersWaiting || 0) +
				Number(rCounts.receivingQueue || 0) +
				Number(pvCounts.putAwayQueue || 0) +
				Number(pkgCounts.activePacking || 0);

			const totalDelayedTasks =
				Number(pCounts.delayed || 0) +
				Number(rCounts.delayedReceiving || 0) +
				Number(pvCounts.delayedPlacement || 0);

			const totalCompletedTasks =
				Number(pCounts.completedToday || 0) +
				Number(rCounts.receivedToday || 0) +
				Number(pvCounts.placedToday || 0) +
				Number(pkgCounts.packedToday || 0);

			const totalEvaluatedTasks = totalCompletedTasks + totalDelayedTasks;
			const slaCompliancePercent =
				totalEvaluatedTasks > 0
					? Math.max(0, Math.min(100, Math.round(((totalEvaluatedTasks - totalDelayedTasks) / totalEvaluatedTasks) * 1000) / 10))
					: 100.0;

			const totalStaffNumber = Number(staffCounts[0]?.count || 0);
			const assignedStaffNumber = Number(assignedStaffCounts[0]?.count || 0);
			const operatorUtilizationPercent =
				totalStaffNumber > 0
					? Math.min(100, Math.round((assignedStaffNumber / totalStaffNumber) * 1000) / 10)
					: 0.0;

			// Construct Real 2-Hour Time Buckets (00:00 to 22:00)
			const hourlyBuckets = [
				{ label: "0:00", hourRange: [0, 1], volume: 0 },
				{ label: "2:00", hourRange: [2, 3], volume: 0 },
				{ label: "4:00", hourRange: [4, 5], volume: 0 },
				{ label: "6:00", hourRange: [6, 7], volume: 0 },
				{ label: "8:00", hourRange: [8, 9], volume: 0 },
				{ label: "10:00", hourRange: [10, 11], volume: 0 },
				{ label: "12:00", hourRange: [12, 13], volume: 0 },
				{ label: "14:00", hourRange: [14, 15], volume: 0 },
				{ label: "16:00", hourRange: [16, 17], volume: 0 },
				{ label: "18:00", hourRange: [18, 19], volume: 0 },
				{ label: "20:00", hourRange: [20, 21], volume: 0 },
				{ label: "22:00", hourRange: [22, 23], volume: 0 },
			];

			hourlyPickActivity.forEach((row) => {
				const h = Number(row.hour);
				const bucket = hourlyBuckets.find((b) => b.hourRange.includes(h));
				if (bucket) {
					bucket.volume += Number(row.count || 0);
				}
			});

			hourlyPackActivity.forEach((row) => {
				const h = Number(row.hour);
				const bucket = hourlyBuckets.find((b) => b.hourRange.includes(h));
				if (bucket) {
					bucket.volume += Number(row.count || 0);
				}
			});

			const maxVol = Math.max(...hourlyBuckets.map((b) => b.volume), 1);
			const hourlyChart = hourlyBuckets.map((b) => ({
				label: b.label,
				volume: b.volume,
				heightPercent: Math.max(6, Math.round((b.volume / maxVol) * 100)),
			}));

			return {
				backlogUnits: totalBacklogUnits,
				slaCompliancePercent,
				operatorUtilizationPercent,
				delayedTasks: totalDelayedTasks,
				receivingQueue: Number(rCounts.receivingQueue || 0),
				putAwayQueue: Number(pvCounts.putAwayQueue || 0),
				pickingQueue: Number(pCounts.pending || 0) + Number(pCounts.active || 0),
				packingQueue: Number(pkgCounts.activePacking || 0),
				completedToday: totalCompletedTasks,
				hourlyChart,
				topProducts: topProducts.map((p) => ({
					id: p.product_id,
					name: p.product_name || "Unknown Product",
					sku: p.product_sku || "N/A",
					picked: Number(p.total_picked || 0),
					ordered: Number(p.total_ordered || 0),
				})),
				operatorLeaderboard: operatorStats.map((op) => ({
					id: op.staff_id,
					name: op.staff_name,
					role: op.role,
					completedPicks: Number(op.completed_picks || 0),
				})),
			};
		}),

	getReceivingPOs: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
		const db = ctx.db;
		const branchId = ctx.user.branchId;

		const rows = await db
			.select({
				id: purchases.id,
				po_number: purchases.po_number,
				grn_number: purchases.grn_number,
				supplier_id: purchases.supplier_id,
				supplier_name: suppliers.name,
				supplier_phone: suppliers.phone,
				status: purchases.status,
				receiving_status: purchases.receiving_status,
				payment_status: purchases.payment_status,
				expected_delivery_date: purchases.expected_delivery_date,
				confirmed_delivery_date: purchases.confirmed_delivery_date,
				created_at: purchases.created_at,
				total_amount: purchases.total_amount,
				item_count: count(purchaseItems.id),
				total_quantity: sum(purchaseItems.quantity),
			})
			.from(purchases)
			.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
			.leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchase_id))
			.where(branchId ? eq(purchases.branch_id, branchId) : undefined)
			.groupBy(purchases.id, suppliers.id, suppliers.name, suppliers.phone)
			.orderBy(desc(purchases.created_at))
			.limit(100);

		return rows.map((r) => ({
			...r,
			item_count: Number(r.item_count) || 0,
			total_quantity: Number(r.total_quantity) || 0,
		}));
	}),

	getReceivingInspections: protectedProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
					condition: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId;

			return await db
				.select({
					id: receivingInspections.id,
					purchase_id: receivingInspections.purchase_id,
					product_id: receivingInspections.product_id,
					product_name: products.name,
					product_sku: products.sku,
					expected_qty: receivingInspections.expected_qty,
					received_qty: receivingInspections.received_qty,
					condition: receivingInspections.condition,
					status: receivingInspections.status,
					upc_status: receivingInspections.upc_status,
					notes: receivingInspections.notes,
					created_at: receivingInspections.created_at,
					verified_at: receivingInspections.verified_at,
					inspector_name: staff.name,
					supplier_name: suppliers.name,
					grn_number: purchases.grn_number,
				})
				.from(receivingInspections)
				.leftJoin(products, eq(receivingInspections.product_id, products.id))
				.leftJoin(purchases, eq(receivingInspections.purchase_id, purchases.id))
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.leftJoin(staff, eq(receivingInspections.inspected_by, staff.id))
				.where(branchId ? eq(receivingInspections.branch_id, branchId) : undefined)
				.orderBy(desc(receivingInspections.created_at))
				.limit(100);
		}),

	getPurchaseItems: protectedProcedure
		.input(z.object({ purchaseId: z.number() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			return await db
				.select({
					id: purchaseItems.id,
					product_id: purchaseItems.product_id,
					product_name: products.name,
					product_sku: products.sku,
					quantity: purchaseItems.quantity,
					price: purchaseItems.price,
				})
				.from(purchaseItems)
				.innerJoin(products, eq(purchaseItems.product_id, products.id))
				.where(eq(purchaseItems.purchase_id, input.purchaseId));
		}),

	receivePO: protectedProcedure
		.input(
			z.object({
				purchaseId: z.number(),
				items: z.array(
					z.object({
						productId: z.number(),
						expectedQty: z.number(),
						receivedQty: z.number(),
						condition: z.enum(["good", "damaged", "mismatch"]),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);
			const grnGenerated = `GRN-${Math.floor(10000 + Math.random() * 90000)}`;

			return await db.transaction(async (tx) => {
				const [grn] = await tx
					.insert(goodsReceiptNotes)
					.values({
						grn_number: grnGenerated,
						purchase_id: input.purchaseId,
						branch_id: ctx.user.branchId ?? 1,
						received_by: staffId ? staffId.toString() : (ctx.user.name || ctx.user.email || ctx.user.id),
						status: input.items.some((i) => i.condition !== "good")
							? "partially_accepted"
							: "accepted",
					})
					.returning();

				for (const item of input.items) {
					const [insp] = await tx
						.insert(receivingInspections)
						.values({
							purchase_id: input.purchaseId,
							product_id: item.productId,
							branch_id: ctx.user.branchId ?? 1,
							expected_qty: item.expectedQty,
							received_qty: item.receivedQty,
							condition: item.condition,
							status: item.condition === "good" ? "VERIFIED" : "DISCREPANCY",
							inspected_by: staffId,
							verified_at: new Date(),
						})
						.returning();

					const acceptedQty = item.condition === "good" ? item.receivedQty : 0;
					const rejectedQty = item.condition !== "good" ? item.receivedQty : 0;

					await tx.insert(goodsReceiptItems).values({
						grn_id: grn.id,
						product_id: item.productId,
						ordered_quantity: item.expectedQty.toString(),
						received_quantity: item.receivedQty.toString(),
						accepted_quantity: acceptedQty.toString(),
						rejected_quantity: rejectedQty.toString(),
						damaged_quantity:
							item.condition === "damaged" ? item.receivedQty.toString() : "0",
						inspection_status: item.condition === "good" ? "passed" : "failed",
					});

					if (item.condition !== "good") {
						await tx.insert(procurementExceptions).values({
							purchase_id: input.purchaseId,
							grn_id: grn.id,
							exception_type:
								item.condition === "damaged" ? "damage" : "shortage",
							severity: "high",
							description: `Item #${item.productId}: Inspection discrepancy condition=${item.condition}`,
							status: "open",
						});
					}

					const [batch] = await tx
						.select()
						.from(productBatches)
						.where(eq(productBatches.product_id, item.productId))
						.limit(1);

					let batchId = batch?.id;
					if (!batchId) {
						const [newBatch] = await tx
							.insert(productBatches)
							.values({
								product_id: item.productId,
								batch_number: `B-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
								mrp: "0.00",
								selling_price: "0.00",
								purchase_price: "0.00",
								created_at: new Date(),
							})
							.returning();
						batchId = newBatch.id;
					}

					await tx.insert(placementVerifications).values({
						product_id: item.productId,
						batch_id: batchId,
						branch_id: ctx.user.branchId ?? 1,
						status: "AWAITING_PLACEMENT",
					});
				}

				const allGood = input.items.every(
					(i) => i.condition === "good" && i.receivedQty >= i.expectedQty,
				);

				await tx
					.update(purchases)
					.set({
						status: allGood ? "received" : "partially_received",
						receiving_status: allGood ? "received" : "partial",
						grn_number: sql`COALESCE(${purchases.grn_number}, ${grnGenerated})`,
					})
					.where(eq(purchases.id, input.purchaseId));

				await logAudit(tx, {
					userId: staffId,
					action: "PURCHASE_RECEIVED_INSPECTED",
					entityType: "purchases",
					entityId: input.purchaseId,
				});

				return { success: true };
			});
		}),

	getPutAwayQueue: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
		const db = ctx.db;
		return await db
			.select({
				id: placementVerifications.id,
				product_id: placementVerifications.product_id,
				product_name: products.name,
				product_sku: products.sku,
				batch_id: placementVerifications.batch_id,
				batch_number: productBatches.batch_number,
				location_id: placementVerifications.location_id,
				location_name: branchLocations.name,
				status: placementVerifications.status,
				placed_by: placementVerifications.placed_by,
				worker_name: staff.name,
				created_at: placementVerifications.created_at,
			})
			.from(placementVerifications)
			.innerJoin(products, eq(placementVerifications.product_id, products.id))
			.leftJoin(
				productBatches,
				eq(placementVerifications.batch_id, productBatches.id),
			)
			.leftJoin(
				branchLocations,
				eq(placementVerifications.location_id, branchLocations.id),
			)
			.leftJoin(staff, eq(placementVerifications.placed_by, staff.id))
			.orderBy(desc(placementVerifications.created_at))
			.limit(100);
	}),

	assignPutAwayTask: protectedProcedure
		.input(z.object({ placementId: z.number(), workerId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			await db
				.update(placementVerifications)
				.set({
					placed_by: input.workerId,
				})
				.where(eq(placementVerifications.id, input.placementId));

			await logAudit(db, {
				userId: staffId,
				action: "PUT_AWAY_ASSIGNED",
				entityType: "placement_verifications",
				entityId: input.placementId,
				newValues: { workerId: input.workerId },
			});

			return { success: true };
		}),

	startPutAwayTask: protectedProcedure
		.input(z.object({ placementId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			await db
				.update(placementVerifications)
				.set({
					status: "VERIFICATION_REQUIRED",
				})
				.where(eq(placementVerifications.id, input.placementId));

			await logAudit(db, {
				userId: staffId,
				action: "PUT_AWAY_STARTED",
				entityType: "placement_verifications",
				entityId: input.placementId,
			});

			return { success: true };
		}),

	completePutAwayTask: protectedProcedure
		.input(
			z.object({
				placementId: z.number(),
				locationId: z.number(),
				qty: z.number(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			return await db.transaction(async (tx) => {
				const [pv] = await tx
					.select()
					.from(placementVerifications)
					.where(eq(placementVerifications.id, input.placementId))
					.limit(1);

				if (!pv) throw new Error("Placement not found");

				await tx
					.update(placementVerifications)
					.set({
						status: "VERIFIED",
						location_id: input.locationId,
						verified_by: staffId,
						verified_at: new Date(),
						notes: input.notes ?? null,
					})
					.where(eq(placementVerifications.id, input.placementId));

				const [existingBatchStock] = await tx
					.select()
					.from(batchStock)
					.where(
						and(
							eq(batchStock.batch_id, pv.batch_id!),
							eq(batchStock.location_id, input.locationId),
						),
					)
					.limit(1);

				if (existingBatchStock) {
					await tx
						.update(batchStock)
						.set({
							quantity: existingBatchStock.quantity + input.qty,
						})
						.where(eq(batchStock.id, existingBatchStock.id));
				} else {
					await tx.insert(batchStock).values({
						batch_id: pv.batch_id!,
						location_id: input.locationId,
						quantity: input.qty,
					});
				}

				const [existingInv] = await tx
					.select()
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.product_id, pv.product_id),
							eq(branchInventory.branch_id, ctx.user.branchId ?? 1),
						),
					)
					.limit(1);

				if (existingInv) {
					await tx
						.update(branchInventory)
						.set({
							in_stock: existingInv.in_stock + input.qty,
						})
						.where(eq(branchInventory.id, existingInv.id));
				} else {
					await tx.insert(branchInventory).values({
						product_id: pv.product_id,
						branch_id: ctx.user.branchId ?? 1,
						in_stock: input.qty,
						reserved_stock: 0,
						reorder_level: 10,
					});
				}

				await logAudit(tx, {
					userId: staffId,
					action: "PUT_AWAY_COMPLETED_VERIFIED",
					entityType: "placement_verifications",
					entityId: input.placementId,
				});

				return { success: true };
			});
		}),

	getPickingQueue: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
		const db = ctx.db;
		return await db
			.select({
				id: pickLists.id,
				order_id: pickLists.order_id,
				reference_type: pickLists.reference_type,
				status: pickLists.status,
				priority: pickLists.priority,
				assigned_to: pickLists.assigned_to,
				worker_name: staff.name,
				created_at: pickLists.created_at,
				customer_name: customers.name,
			})
			.from(pickLists)
			.leftJoin(orders, eq(pickLists.order_id, orders.id))
			.leftJoin(customers, eq(orders.customer_id, customers.id))
			.leftJoin(staff, eq(pickLists.assigned_to, staff.id))
			.orderBy(desc(pickLists.created_at))
			.limit(100);
	}),

	assignPickingTask: protectedProcedure
		.input(z.object({ pickListId: z.number(), workerId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			// Strict verification that selected staff is an authorized picker
			const [worker] = await db
				.select({ id: staff.id, role: staff.role, name: staff.name })
				.from(staff)
				.where(
					and(
						eq(staff.id, input.workerId),
						eq(staff.is_deleted, false),
						sql`LOWER(${staff.status}) = 'active'`,
						sql`(LOWER(${staff.role}) = 'picker' OR ${staff.role} ILIKE '%picker%' OR ${staff.department} ILIKE '%picking%')`,
					),
				)
				.limit(1);

			if (!worker) {
				throw new Error(
					"Invalid assignment: Selected staff does not have picker access.",
				);
			}

			await db
				.update(pickLists)
				.set({
					assigned_to: input.workerId,
					status: "assigned",
				})
				.where(eq(pickLists.id, input.pickListId));

			await logAudit(db, {
				userId: staffId,
				action: "PICK_LIST_ASSIGNED",
				entityType: "pick_lists",
				entityId: input.pickListId,
				newValues: { workerId: input.workerId, workerName: worker.name },
			});

			return { success: true };
		}),

	startPickingTask: protectedProcedure
		.input(
			z.object({
				pickListId: z.number(),
				workerId: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId =
				input.workerId ?? (await resolveStaffId(db, ctx.user.email));

			await db
				.update(pickLists)
				.set({
					status: "picking",
					assigned_to: sql`COALESCE(${pickLists.assigned_to}, ${staffId})`,
				})
				.where(eq(pickLists.id, input.pickListId));

			await logAudit(db, {
				userId: staffId,
				action: "PICK_LIST_STARTED",
				entityType: "pick_lists",
				entityId: input.pickListId,
			});

			return { success: true };
		}),

	getPickListItems: protectedProcedure
		.input(z.object({ pickListId: z.number() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			return await db
				.select({
					id: pickListItems.id,
					product_id: pickListItems.product_id,
					product_name: products.name,
					product_sku: products.sku,
					quantity_ordered: pickListItems.quantity_ordered,
					quantity_picked: pickListItems.quantity_picked,
					status: pickListItems.status,
				})
				.from(pickListItems)
				.innerJoin(products, eq(pickListItems.product_id, products.id))
				.where(eq(pickListItems.pick_list_id, input.pickListId));
		}),

	pickItem: protectedProcedure
		.input(z.object({ itemId: z.number(), qtyPicked: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			await db
				.update(pickListItems)
				.set({
					quantity_picked: input.qtyPicked,
					status: "picked",
					picked_by: staffId,
					picked_at: new Date(),
				})
				.where(eq(pickListItems.id, input.itemId));

			return { success: true };
		}),

	completePickingTask: protectedProcedure
		.input(z.object({ pickListId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			return await db.transaction(async (tx) => {
				const [pl] = await tx
					.select()
					.from(pickLists)
					.where(eq(pickLists.id, input.pickListId))
					.limit(1);

				if (!pl) throw new Error("Pick list not found");

				if (pl.status === "completed") {
					throw new Error("Picking task is already completed.");
				}

				// Check that ALL items/quantities are fully picked
				const items = await tx
					.select()
					.from(pickListItems)
					.where(eq(pickListItems.pick_list_id, input.pickListId));

				if (items.length === 0) {
					throw new Error("Cannot complete picking for empty picklist.");
				}

				const unpicked = items.filter(
					(i) => (i.quantity_picked ?? 0) < i.quantity_ordered,
				);

				if (unpicked.length > 0) {
					const totalPending = unpicked.reduce(
						(acc, i) => acc + (i.quantity_ordered - (i.quantity_picked ?? 0)),
						0,
					);
					throw new Error(
						`Picking cannot be completed. ${unpicked.length} item(s) (${totalPending} units) are still pending.`,
					);
				}

				await tx
					.update(pickLists)
					.set({
						status: "completed",
						completed_at: new Date(),
					})
					.where(eq(pickLists.id, input.pickListId));

				const packageNumber = `PKG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
				const [pkg] = await tx
					.insert(packages)
					.values({
						order_id: pl.order_id!,
						pick_list_id: pl.id,
						package_number: packageNumber,
						status: "packing",
						created_at: new Date(),
					})
					.returning();

				if (pl.order_id) {
					await tx
						.update(orders)
						.set({ status: "processing" })
						.where(eq(orders.id, pl.order_id));
				}

				try {
					await notify(tx, {
						branchId: (pl as any).branch_id ?? null,
						type: "packing",
						priority: "high",
						title: `🏷️ Picklist PL-${pl.id} Picked — Ready for Packing`,
						message: `Picking completed for Order ORD-${pl.order_id}. Package ${pkg.package_number} is ready for packing.`,
						referenceType: "packages",
						referenceId: pkg.id,
					});
				} catch (notifErr) {
					console.warn("[completePickingTask] Notification dispatch error:", notifErr);
				}

				await logAudit(tx, {
					userId: staffId,
					action: "PICK_LIST_COMPLETED",
					entityType: "pick_lists",
					entityId: pl.id,
				});

				return { success: true, packageId: pkg.id };
			});
		}),

	getPackingQueue: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
		const db = ctx.db;
		return await db
			.select({
				id: packages.id,
				package_number: packages.package_number,
				order_id: packages.order_id,
				pick_list_id: packages.pick_list_id,
				status: packages.status,
				packed_by: packages.packed_by,
				worker_name: staff.name,
				created_at: packages.created_at,
				e_way_bill_no: orders.e_way_bill_no,
				total_amount: orders.total_amount,
			})
			.from(packages)
			.leftJoin(staff, eq(packages.packed_by, staff.id))
			.leftJoin(orders, eq(packages.order_id, orders.id))
			.orderBy(desc(packages.created_at))
			.limit(100);
	}),

	packPackage: protectedProcedure
		.input(
			z.object({
				packageId: z.number(),
				weight: z.number().optional(),
				dimensions: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			await db
				.update(packages)
				.set({
					status: "packed",
					packed_by: staffId,
					packed_at: new Date(),
					weight: input.weight ? input.weight.toString() : null,
					dimensions: input.dimensions ?? null,
					notes: input.notes ?? null,
				})
				.where(eq(packages.id, input.packageId));

			await logAudit(db, {
				userId: staffId,
				action: "PACKAGE_PACKED",
				entityType: "packages",
				entityId: input.packageId,
			});

			return { success: true };
		}),

	getExceptions: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
		const db = ctx.db;
		const branchId = ctx.user.branchId;
		const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

		// 1. Stock Adjustments (Damages, Missing, Mismatches, Quarantines)
		const adjustments = await db
			.select({
				id: stockAdjustments.id,
				product_id: stockAdjustments.product_id,
				product_name: products.name,
				product_sku: products.sku,
				quantity: stockAdjustments.quantity,
				type: stockAdjustments.adjustment_type,
				reason: stockAdjustments.reason,
				reference_document: stockAdjustments.reference_document,
				created_by: stockAdjustments.created_by,
				created_by_name: staff.name,
				created_at: stockAdjustments.created_at,
			})
			.from(stockAdjustments)
			.leftJoin(products, eq(stockAdjustments.product_id, products.id))
			.leftJoin(staff, eq(stockAdjustments.created_by, staff.id))
			.orderBy(desc(stockAdjustments.created_at))
			.limit(100);

		// 2. Receiving Inspections with discrepancies or non-good condition
		const inspections = await db
			.select({
				id: receivingInspections.id,
				purchase_id: receivingInspections.purchase_id,
				product_id: receivingInspections.product_id,
				product_name: products.name,
				product_sku: products.sku,
				expected_qty: receivingInspections.expected_qty,
				received_qty: receivingInspections.received_qty,
				condition: receivingInspections.condition,
				status: receivingInspections.status,
				notes: receivingInspections.notes,
				created_at: receivingInspections.created_at,
				verified_at: receivingInspections.verified_at,
				inspector_name: staff.name,
				supplier_name: suppliers.name,
				grn_number: purchases.grn_number,
			})
			.from(receivingInspections)
			.leftJoin(products, eq(receivingInspections.product_id, products.id))
			.leftJoin(purchases, eq(receivingInspections.purchase_id, purchases.id))
			.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
			.leftJoin(staff, eq(receivingInspections.inspected_by, staff.id))
			.where(
				and(
					branchId ? eq(receivingInspections.branch_id, branchId) : undefined,
					sql`(${receivingInspections.condition} != 'good' OR ${receivingInspections.status} in ('rejected', 'quarantined', 'failed') OR ${receivingInspections.expected_qty} != ${receivingInspections.received_qty})`,
				),
			)
			.orderBy(desc(receivingInspections.created_at))
			.limit(50);

		// 3. Overdue SLA Tasks
		const overduePicks = await db
			.select({
				id: pickLists.id,
				order_id: pickLists.order_id,
				status: pickLists.status,
				created_at: pickLists.created_at,
				assigned_to: pickLists.assigned_to,
				worker_name: staff.name,
			})
			.from(pickLists)
			.leftJoin(staff, eq(pickLists.assigned_to, staff.id))
			.where(
				and(
					notInArray(pickLists.status, ["completed", "cancelled"]),
					lte(pickLists.created_at, twoHoursAgo),
				),
			)
			.limit(20);

		return {
			adjustments,
			inspections,
			overduePicks,
		};
	}),

	resolveException: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				source: z.enum(["adjustment", "inspection"]),
				resolutionNotes: z.string().min(1, "Resolution notes are required"),
				actionType: z.enum([
					"quarantine_isolated",
					"write_off",
					"supplier_claim",
					"adjusted_counts",
					"passed_override",
				]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			if (input.source === "adjustment") {
				await db
					.update(stockAdjustments)
					.set({
						reference_document: `RESOLVED: [${input.actionType.toUpperCase()}] ${input.resolutionNotes}`,
					})
					.where(eq(stockAdjustments.id, input.id));

				await logAudit(db, {
					userId: staffId,
					action: "EXCEPTION_RESOLVED",
					entityType: "stock_adjustments",
					entityId: input.id,
					newValues: {
						actionType: input.actionType,
						resolutionNotes: input.resolutionNotes,
					},
				});
			} else if (input.source === "inspection") {
				await db
					.update(receivingInspections)
					.set({
						status: "verified",
						notes: sql`COALESCE(${receivingInspections.notes}, '') || ' | RESOLVED: [' || ${input.actionType.toUpperCase()} || '] ' || ${input.resolutionNotes}`,
						verified_at: new Date(),
					})
					.where(eq(receivingInspections.id, input.id));

				await logAudit(db, {
					userId: staffId,
					action: "INSPECTION_EXCEPTION_RESOLVED",
					entityType: "receiving_inspections",
					entityId: input.id,
					newValues: {
						actionType: input.actionType,
						resolutionNotes: input.resolutionNotes,
					},
				});
			}

			return { success: true };
		}),

	logException: protectedProcedure
		.input(
			z.object({
				productId: z.number(),
				qty: z.number(),
				reason: z.string(),
				type: z.enum(["damage", "missing", "mismatch", "quarantine"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			return await db.transaction(async (tx) => {
				const [adj] = await tx
					.insert(stockAdjustments)
					.values({
						product_id: input.productId,
						quantity: input.qty,
						adjustment_type: input.type,
						reason: input.reason,
						created_by: staffId ?? 1,
						created_at: new Date(),
					})
					.returning();

				await logAudit(tx, {
					userId: staffId,
					action: `EXCEPTION_LOGGED_${input.type.toUpperCase()}`,
					entityType: "stock_adjustments",
					entityId: adj.id,
				});

				return { success: true, adjustmentId: adj.id };
			});
		}),

	isEWayBillConfigured: protectedProcedure.query(async () => {
		return EWayBillService.isConfigured();
	}),

	generateEWayBill: protectedProcedure
		.input(
			z.object({
				orderId: z.number(),
				vehicleNo: z.string(),
				modeOfTransport: z.enum(["road", "rail", "air", "ship"]),
				approxDistanceKm: z.number(),
				transporterName: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx) => {
				return await EWayBillService.generate(tx, input, ctx.user);
			});
		}),

	autoAssignPicking: protectedProcedure
		.input(
			z
				.object({
					pickListIds: z.array(z.number()).optional(),
				})
				.optional(),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			// 1. Get active staff strictly with picker role
			const pickers = await db
				.select({
					id: staff.id,
					name: staff.name,
					email: staff.email,
				})
				.from(staff)
				.where(
					and(
						eq(staff.is_deleted, false),
						sql`LOWER(${staff.status}) = 'active'`,
						sql`(LOWER(${staff.role}) = 'picker' OR ${staff.role} ILIKE '%picker%' OR ${staff.department} ILIKE '%picking%')`,
						sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com' AND ${staff.name} NOT ILIKE 'fake%')`,
					),
				);

			if (pickers.length === 0) {
				throw new Error("No active staff with 'picker' role available in the warehouse.");
			}

			// 2. Count current active load per picker
			const activePicksPerWorker = await db
				.select({
					assigned_to: pickLists.assigned_to,
					count: count(),
				})
				.from(pickLists)
				.where(
					and(
						inArray(pickLists.status, ["assigned", "picking", "in_progress"]),
						sql`${pickLists.assigned_to} IS NOT NULL`,
					),
				)
				.groupBy(pickLists.assigned_to);

			const loadMap = new Map<number, number>();
			for (const p of pickers) {
				loadMap.set(p.id, 0);
			}
			for (const row of activePicksPerWorker) {
				if (row.assigned_to && loadMap.has(row.assigned_to)) {
					loadMap.set(row.assigned_to, Number(row.count) || 0);
				}
			}

			// 3. Find unassigned pick lists
			const pendingPicks = await db
				.select({
					id: pickLists.id,
					order_id: pickLists.order_id,
					priority: pickLists.priority,
				})
				.from(pickLists)
				.where(
					input?.pickListIds && input.pickListIds.length > 0
						? inArray(pickLists.id, input.pickListIds)
						: or(
								inArray(pickLists.status, ["pending", "unassigned"]),
								sql`${pickLists.assigned_to} IS NULL and ${pickLists.status} not in ('completed', 'cancelled')`,
							),
				)
				.orderBy(
					sql`CASE WHEN ${pickLists.priority} = 'urgent' THEN 1 WHEN ${pickLists.priority} = 'high' THEN 2 ELSE 3 END`,
					pickLists.created_at,
				);

			if (pendingPicks.length === 0) {
				return {
					success: true,
					assignedCount: 0,
					message: "All pick lists are already assigned!",
					assignments: [],
				};
			}

			const assignments: Array<{
				pickListId: number;
				pickerId: number;
				pickerName: string;
			}> = [];

			for (const pl of pendingPicks) {
				let lowestPicker = pickers[0];
				let lowestLoad = loadMap.get(lowestPicker.id) ?? 0;

				for (const p of pickers) {
					const currentLoad = loadMap.get(p.id) ?? 0;
					if (currentLoad < lowestLoad) {
						lowestLoad = currentLoad;
						lowestPicker = p;
					}
				}

				await db
					.update(pickLists)
					.set({
						assigned_to: lowestPicker.id,
						status: "assigned",
					})
					.where(eq(pickLists.id, pl.id));

				loadMap.set(lowestPicker.id, lowestLoad + 1);
				assignments.push({
					pickListId: pl.id,
					pickerId: lowestPicker.id,
					pickerName: lowestPicker.name,
				});

				try {
					await notify(db, {
						branchId: ctx.user.branchId ?? null,
						type: "picking",
						priority: pl.priority === "urgent" ? "high" : "normal",
						title: `⚡ Auto-Assigned: Picklist PL-${pl.id}`,
						message: `Picklist PL-${pl.id} for Order ORD-${pl.order_id} has been automatically assigned to you.`,
						referenceType: "pick_lists",
						referenceId: pl.id,
					});
				} catch (notifErr) {
					console.warn("[autoAssignPicking] Notification error:", notifErr);
				}
			}

			await logAudit(db, {
				userId: staffId,
				action: "AUTO_ASSIGN_PICKING_EXECUTED",
				entityType: "pick_lists",
				entityId: assignments[0]?.pickListId ?? 0,
				newValues: { assignedCount: assignments.length, assignments },
			});

			return {
				success: true,
				assignedCount: assignments.length,
				message: `Successfully auto-assigned ${assignments.length} pick list(s) to authorized pickers!`,
				assignments,
			};
		}),

	autoAssignPacking: protectedProcedure
		.input(
			z
				.object({
					packageIds: z.array(z.number()).optional(),
				})
				.optional(),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			const packers = await db
				.select({
					id: staff.id,
					name: staff.name,
				})
				.from(staff)
				.where(
					and(
						eq(staff.is_deleted, false),
						sql`LOWER(${staff.status}) = 'active'`,
						sql`(LOWER(${staff.role}) = 'packer' OR ${staff.role} ILIKE '%packer%' OR ${staff.department} ILIKE '%packing%')`,
						sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com' AND ${staff.name} NOT ILIKE 'fake%')`,
					),
				);

			if (packers.length === 0) {
				throw new Error("No active staff with 'packer' role available in the warehouse.");
			}

			const unassignedPackages = await db
				.select({
					id: packages.id,
					package_number: packages.package_number,
					order_id: packages.order_id,
				})
				.from(packages)
				.where(
					input?.packageIds && input.packageIds.length > 0
						? inArray(packages.id, input.packageIds)
						: and(
								inArray(packages.status, ["packing", "pending"]),
								sql`${packages.packed_by} IS NULL`,
							),
				)
				.orderBy(packages.created_at);

			if (unassignedPackages.length === 0) {
				return {
					success: true,
					assignedCount: 0,
					message: "All packages in packing queue are already assigned!",
				};
			}

			let packerIdx = 0;
			let assignedCount = 0;

			for (const pkg of unassignedPackages) {
				const assignedPacker = packers[packerIdx % packers.length];
				packerIdx++;

				await db
					.update(packages)
					.set({
						packed_by: assignedPacker.id,
					})
					.where(eq(packages.id, pkg.id));

				assignedCount++;

				try {
					await notify(db, {
						branchId: ctx.user.branchId ?? null,
						type: "packing",
						priority: "normal",
						title: `⚡ Auto-Assigned: Package ${pkg.package_number}`,
						message: `Package ${pkg.package_number} for Order ORD-${pkg.order_id} has been automatically routed to you for packing.`,
						referenceType: "packages",
						referenceId: pkg.id,
					});
				} catch (e) {
					console.warn("[autoAssignPacking] Notification error:", e);
				}
			}

			await logAudit(db, {
				userId: staffId,
				action: "AUTO_ASSIGN_PACKING_EXECUTED",
				entityType: "packages",
				entityId: unassignedPackages[0]?.id ?? 0,
				newValues: { assignedCount },
			});

			return {
				success: true,
				assignedCount,
				message: `Successfully auto-assigned ${assignedCount} package(s) to packing staff!`,
			};
		}),

	getPipelineHealth: protectedProcedure.query(async ({ ctx }) => {
		const db = ctx.db;
		const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

		const [
			[unassignedPicksRow],
			[activePicksRow],
			[unassignedPacksRow],
			[activePacksRow],
			[delayedPicksRow],
			activePickers,
			activePackers,
			missingItems,
		] = await Promise.all([
			db
				.select({ count: count() })
				.from(pickLists)
				.where(
					or(
						inArray(pickLists.status, ["pending", "unassigned"]),
						sql`${pickLists.assigned_to} IS NULL and ${pickLists.status} not in ('completed', 'cancelled')`,
					),
				),
			db
				.select({ count: count() })
				.from(pickLists)
				.where(inArray(pickLists.status, ["assigned", "picking", "in_progress"])),
			db
				.select({ count: count() })
				.from(packages)
				.where(
					and(
						inArray(packages.status, ["packing", "pending"]),
						sql`${packages.packed_by} IS NULL`,
					),
				),
			db
				.select({ count: count() })
				.from(packages)
				.where(
					and(
						inArray(packages.status, ["packing", "in_progress"]),
						sql`${packages.packed_by} IS NOT NULL`,
					),
				),
			db
				.select({ count: count() })
				.from(pickLists)
				.where(
					and(
						notInArray(pickLists.status, ["completed", "cancelled"]),
						lte(pickLists.created_at, thirtyMinsAgo),
					),
				),
			db
				.select({
					id: staff.id,
					name: staff.name,
					role: staff.role,
				})
				.from(staff)
				.where(
					and(
						eq(staff.is_deleted, false),
						sql`LOWER(${staff.status}) = 'active'`,
						sql`(LOWER(${staff.role}) = 'picker' OR ${staff.role} ILIKE '%picker%' OR ${staff.department} ILIKE '%picking%')`,
						sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com' AND ${staff.name} NOT ILIKE 'fake%')`,
					),
				),
			db
				.select({
					id: staff.id,
					name: staff.name,
					role: staff.role,
				})
				.from(staff)
				.where(
					and(
						eq(staff.is_deleted, false),
						sql`LOWER(${staff.status}) = 'active'`,
						sql`(LOWER(${staff.role}) = 'packer' OR ${staff.role} ILIKE '%packer%' OR ${staff.department} ILIKE '%packing%')`,
						sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com' AND ${staff.name} NOT ILIKE 'fake%')`,
					),
				),
			db
				.select({
					id: pickListItems.id,
					pick_list_id: pickListItems.pick_list_id,
					product_name: products.name,
					quantity_ordered: pickListItems.quantity_ordered,
					status: pickListItems.status,
				})
				.from(pickListItems)
				.leftJoin(products, eq(pickListItems.product_id, products.id))
				.where(eq(pickListItems.status, "missing"))
				.limit(10),
		]);

		const unassignedPicks = Number(unassignedPicksRow?.count || 0);
		const activePicks = Number(activePicksRow?.count || 0);
		const unassignedPacks = Number(unassignedPacksRow?.count || 0);
		const activePacks = Number(activePacksRow?.count || 0);
		const delayedCount = Number(delayedPicksRow?.count || 0);

		const bottlenecks: Array<{
			id: string;
			type: "delayed_picking" | "unassigned_backlog" | "missing_item" | "no_active_pickers";
			title: string;
			description: string;
			severity: "warning" | "critical";
			count?: number;
		}> = [];

		if (unassignedPicks > 0) {
			bottlenecks.push({
				id: "unassigned_picks",
				type: "unassigned_backlog",
				title: `${unassignedPicks} Picklist(s) Awaiting Picker Assignment`,
				description: "Orders are pending picker allocation. Run auto-assign pipeline to distribute tasks immediately.",
				severity: unassignedPicks > 10 ? "critical" : "warning",
				count: unassignedPicks,
			});
		}

		if (delayedCount > 0) {
			bottlenecks.push({
				id: "delayed_picks",
				type: "delayed_picking",
				title: `${delayedCount} Stalled / Delayed Pick Task(s)`,
				description: "Picking tasks exceeding SLA (>30m). Trigger self-healing pipeline to re-balance or re-assign to active pickers.",
				severity: "critical",
				count: delayedCount,
			});
		}

		if (unassignedPacks > 0) {
			bottlenecks.push({
				id: "unassigned_packs",
				type: "unassigned_backlog",
				title: `${unassignedPacks} Package(s) Awaiting Packer Allocation`,
				description: "Picked orders are ready for sealing & packaging. Run auto-assign to route to available packers.",
				severity: "warning",
				count: unassignedPacks,
			});
		}

		if (missingItems.length > 0) {
			bottlenecks.push({
				id: "missing_items",
				type: "missing_item",
				title: `${missingItems.length} Item(s) Reported Missing / Stockout`,
				description: "Pickers reported stock unavailable on shelf. Review exceptions or adjust inventory to clear orders.",
				severity: "critical",
				count: missingItems.length,
			});
		}

		return {
			isHealthy: bottlenecks.length === 0,
			unassignedPicks,
			activePicks,
			unassignedPacks,
			activePacks,
			delayedCount,
			activePickersCount: activePickers.length,
			activePackersCount: activePackers.length,
			activePickers,
			activePackers,
			missingItems,
			bottlenecks,
		};
	}),

	runSelfHealingPipeline: protectedProcedure.mutation(async ({ ctx }) => {
		const db = ctx.db;
		const staffId = await resolveStaffId(db, ctx.user.email);
		const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

		// 1. Get active staff strictly with picker role
		const pickers = await db
			.select({ id: staff.id, name: staff.name })
			.from(staff)
			.where(
				and(
					eq(staff.is_deleted, false),
					sql`LOWER(${staff.status}) = 'active'`,
					sql`(LOWER(${staff.role}) = 'picker' OR ${staff.role} ILIKE '%picker%' OR ${staff.department} ILIKE '%picking%')`,
					sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com' AND ${staff.name} NOT ILIKE 'fake%')`,
				),
			);

		let assignedPicks = 0;
		let reassignedStalled = 0;
		let assignedPacks = 0;

		if (pickers.length > 0) {
			// Auto assign unassigned picklists
			const unassignedPicks = await db
				.select({ id: pickLists.id, order_id: pickLists.order_id })
				.from(pickLists)
				.where(
					or(
						inArray(pickLists.status, ["pending", "unassigned"]),
						sql`${pickLists.assigned_to} IS NULL and ${pickLists.status} not in ('completed', 'cancelled')`,
					),
				);

			let pIdx = 0;
			for (const pl of unassignedPicks) {
				const picker = pickers[pIdx % pickers.length];
				pIdx++;
				await db
					.update(pickLists)
					.set({ assigned_to: picker.id, status: "assigned" })
					.where(eq(pickLists.id, pl.id));
				assignedPicks++;
			}

			// Reassign stalled tasks (>30 mins without completion)
			const stalledPicks = await db
				.select({ id: pickLists.id, assigned_to: pickLists.assigned_to })
				.from(pickLists)
				.where(
					and(
						inArray(pickLists.status, ["assigned", "pending"]),
						lte(pickLists.created_at, thirtyMinsAgo),
					),
				);

			for (const pl of stalledPicks) {
				const alternatePicker =
					pickers.find((p) => p.id !== pl.assigned_to) || pickers[0];
				if (alternatePicker) {
					await db
						.update(pickLists)
						.set({ assigned_to: alternatePicker.id, priority: "urgent" })
						.where(eq(pickLists.id, pl.id));
					reassignedStalled++;
				}
			}
		}

		// Auto assign unassigned packages strictly to active packers
		const packers = await db
			.select({ id: staff.id, name: staff.name })
			.from(staff)
			.where(
				and(
					eq(staff.is_deleted, false),
					sql`LOWER(${staff.status}) = 'active'`,
					sql`(LOWER(${staff.role}) = 'packer' OR ${staff.role} ILIKE '%packer%' OR ${staff.department} ILIKE '%packing%')`,
					sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com' AND ${staff.name} NOT ILIKE 'fake%')`,
				),
			);

		if (packers.length > 0) {
			const unassignedPackages = await db
				.select({ id: packages.id })
				.from(packages)
				.where(
					and(
						inArray(packages.status, ["packing", "pending"]),
						sql`${packages.packed_by} IS NULL`,
					),
				);

			let kIdx = 0;
			for (const pkg of unassignedPackages) {
				const packer = packers[kIdx % packers.length];
				kIdx++;
				await db
					.update(packages)
					.set({ packed_by: packer.id })
					.where(eq(packages.id, pkg.id));
				assignedPacks++;
			}
		}

		await logAudit(db, {
			userId: staffId,
			action: "SELF_HEALING_PIPELINE_EXECUTED",
			entityType: "warehouse_pipeline",
			entityId: 0,
			newValues: { assignedPicks, reassignedStalled, assignedPacks },
		});

		return {
			success: true,
			assignedPicks,
			reassignedStalled,
			assignedPacks,
			totalResolved: assignedPicks + reassignedStalled + assignedPacks,
			message: `Self-healing pipeline executed: ${assignedPicks} pick(s) assigned to authorized pickers, ${reassignedStalled} stalled task(s) prioritized, ${assignedPacks} package(s) routed!`,
		};
	}),

	raisePipelineIssue: protectedProcedure
		.input(
			z.object({
				referenceType: z.enum(["pick_list", "package", "item"]),
				referenceId: z.number(),
				issueType: z.enum([
					"stockout",
					"damaged_item",
					"barcode_mismatch",
					"picker_unresponsive",
					"order_hold",
				]),
				notes: z.string().min(1, "Please provide description of the problem"),
				productId: z.number().optional(),
				autoReassign: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			if (input.referenceType === "pick_list") {
				if (input.autoReassign) {
					const pickers = await db
						.select({ id: staff.id })
						.from(staff)
						.where(
							and(
								eq(staff.is_deleted, false),
								sql`LOWER(${staff.status}) = 'active'`,
								sql`(LOWER(${staff.role}) = 'picker' OR ${staff.role} ILIKE '%picker%' OR ${staff.department} ILIKE '%picking%')`,
								sql`(${staff.email} NOT ILIKE '%@example.com' AND ${staff.email} NOT ILIKE '%@mock.com' AND ${staff.email} NOT ILIKE '%@seed.com' AND ${staff.name} NOT ILIKE 'fake%')`,
							),
						);

					const [currentPl] = await db
						.select()
						.from(pickLists)
						.where(eq(pickLists.id, input.referenceId))
						.limit(1);

					const alternatePicker =
						pickers.find((p) => p.id !== currentPl?.assigned_to) || pickers[0];

					await db
						.update(pickLists)
						.set({
							priority: "urgent",
							assigned_to: alternatePicker ? alternatePicker.id : currentPl?.assigned_to,
						})
						.where(eq(pickLists.id, input.referenceId));
				} else {
					await db
						.update(pickLists)
						.set({ priority: "urgent" })
						.where(eq(pickLists.id, input.referenceId));
				}
			}

			if (input.productId) {
				await db.insert(stockAdjustments).values({
					product_id: input.productId,
					quantity: 1,
					adjustment_type:
						input.issueType === "damaged_item" ? "damage" : "missing",
					reason: `[PIPELINE EXCEPTION] ${input.issueType}: ${input.notes}`,
					created_by: staffId ?? 1,
					created_at: new Date(),
				});
			}

			await logAudit(db, {
				userId: staffId,
				action: `PIPELINE_ISSUE_RAISED_${input.issueType.toUpperCase()}`,
				entityType: input.referenceType,
				entityId: input.referenceId,
				newValues: { issueType: input.issueType, notes: input.notes },
			});

			return {
				success: true,
				message: `Issue logged successfully. Task prioritized and alert dispatched to warehouse managers.`,
			};
		}),
});
