import {
	batchStock,
	branchInventory,
	branchLocations,
	orders,
	pickListItems,
	pickLists,
	productBatches,
	products,
	staff,
	stockAdjustments,
	stockLedger,
	purchases,
	purchaseItems,
	packages,
	packageItems,
	receivingInspections,
	placementVerifications,
	auditLogs,
	customers,
	user,
	suppliers,
} from "@evaluna/db/schema";
import { and, count, desc, eq, gte, lte, sql, sum, inArray, notInArray, not } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { resolveStaffId, logAudit, notify } from "../util/audit";

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
				quantity: z.number().min(1),
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

			const [freshBatches, recentBatches, oldBatches, veryOldBatches] =
				await Promise.all([
					db
						.select({ count: count() })
						.from(productBatches)
						.where(gte(productBatches.created_at, fifteenDaysAgo)),
					db
						.select({ count: count() })
						.from(productBatches)
						.where(
							and(
								gte(productBatches.created_at, thirtyDaysAgo),
								lte(productBatches.created_at, fifteenDaysAgo),
							),
						),
					db
						.select({ count: count() })
						.from(productBatches)
						.where(
							and(
								gte(productBatches.created_at, sixtyDaysAgo),
								lte(productBatches.created_at, thirtyDaysAgo),
							),
						),
					db
						.select({ count: count() })
						.from(productBatches)
						.where(lte(productBatches.created_at, sixtyDaysAgo)),
				]);

			const fifoStatus = [
				{ age: "0-15 days", value: freshBatches[0]?.count || 0 },
				{ age: "16-30 days", value: recentBatches[0]?.count || 0 },
				{ age: "31-60 days", value: oldBatches[0]?.count || 0 },
				{ age: "60+ days", value: veryOldBatches[0]?.count || 0 },
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
			// Get warehouse staff (pickers, putters, warehouse)
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

			// Get picking performance for each staff member from pickListItems
			const workerPerformance = await Promise.all(
				warehouseStaff.map(async (w) => {
					// Get total quantity picked and total quantity ordered for this staff member
					const [pickingStats] = await db
						.select({
							totalPicked: sum(pickListItems.quantity_picked).map(
								(val) => Number(val) || 0,
							),
							totalOrdered: sum(pickListItems.quantity_ordered).map(
								(val) => Number(val) || 0,
							),
						})
						.from(pickListItems)
						.innerJoin(pickLists, eq(pickListItems.pickListId, pickLists.id))
						.where(
							and(
								eq(pickLists.assignedToId, w.id),
								eq(pickLists.is_deleted, false),
								input.branch_id
									? eq(pickLists.branch_id, input.branch_id)
									: undefined,
							),
						);

					const totalPicked = pickingStats[0]?.totalPicked || 0;
					const totalOrdered = pickingStats[0]?.totalOrdered || 0;
					const accuracy =
						totalOrdered > 0
							? Math.round((totalPicked / totalOrdered) * 100)
							: 0;

					return {
						name: w.name,
						role: w.role,
						items: totalPicked, // Total quantity picked
						accuracy: accuracy, // Accuracy percentage
					};
				}),
			);

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
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = input.branch_id ?? ctx.user.branchId;

			const [ordersWaiting] = await db
				.select({ count: count() })
				.from(pickLists)
				.where(
					and(
						eq(pickLists.status, "pending")
					)
				);

			const [receivingQueue] = await db
				.select({ count: count() })
				.from(purchases)
				.where(
					and(
						eq(purchases.status, "pending")
					)
				);

			const [putAwayQueue] = await db
				.select({ count: count() })
				.from(placementVerifications)
				.where(
					and(
						inArray(placementVerifications.status, ["AWAITING_PLACEMENT", "VERIFICATION_REQUIRED"])
					)
				);

			const [pickingQueue] = await db
				.select({ count: count() })
				.from(pickLists)
				.where(
					and(
						inArray(pickLists.status, ["assigned", "picking"])
					)
				);

			const [packingQueue] = await db
				.select({ count: count() })
				.from(packages)
				.where(
					and(
						eq(packages.status, "packing")
					)
				);

			const [dispatchReady] = await db
				.select({ count: count() })
				.from(packages)
				.where(
					and(
						inArray(packages.status, ["packed", "ready_for_dispatch", "checked"])
					)
				);

			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);

			const [completedPickLists] = await db
				.select({ count: count() })
				.from(pickLists)
				.where(
					and(
						eq(pickLists.status, "completed"),
						gte(pickLists.completed_at, todayStart)
					)
				);

			const [completedPackages] = await db
				.select({ count: count() })
				.from(packages)
				.where(
					and(
						inArray(packages.status, ["packed", "ready_for_dispatch", "checked", "dispatched"]),
						gte(packages.packed_at, todayStart)
					)
				);

			const completedToday = (completedPickLists?.count || 0) + (completedPackages?.count || 0);

			const [tasksInProgressPick] = await db
				.select({ count: count() })
				.from(pickLists)
				.where(
					and(
						eq(pickLists.status, "picking")
					)
				);

			const [tasksInProgressPut] = await db
				.select({ count: count() })
				.from(placementVerifications)
				.where(
					and(
						eq(placementVerifications.status, "VERIFICATION_REQUIRED")
					)
				);

			const tasksInProgress = (tasksInProgressPick?.count || 0) + (tasksInProgressPut?.count || 0);

			const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
			const [delayedPickLists] = await db
				.select({ count: count() })
				.from(pickLists)
				.where(
					and(
						notInArray(pickLists.status, ["completed", "cancelled"]),
						lte(pickLists.created_at, twoHoursAgo)
					)
				);

			const [delayedPurchases] = await db
				.select({ count: count() })
				.from(purchases)
				.where(
					and(
						notInArray(purchases.status, ["completed", "received", "cancelled"]),
						lte(purchases.created_at, twoHoursAgo)
					)
				);

			const delayedTasks = (delayedPickLists?.count || 0) + (delayedPurchases?.count || 0);

			const capacityData = await db
				.select({
					cap: sum(branchLocations.capacity),
					used: sum(branchLocations.current_stock),
				})
				.from(branchLocations)
				.where(branchId ? eq(branchLocations.branch_id, branchId) : undefined);

			const capVal = Number(capacityData[0]?.cap) || 1000;
			const usedVal = Number(capacityData[0]?.used) || 0;
			const warehouseUtilization = Math.round((usedVal / capVal) * 100);

			return {
				ordersWaiting: ordersWaiting?.count || 0,
				receivingQueue: receivingQueue?.count || 0,
				putAwayQueue: putAwayQueue?.count || 0,
				pickingQueue: pickingQueue?.count || 0,
				packingQueue: packingQueue?.count || 0,
				dispatchReady: dispatchReady?.count || 0,
				completedToday,
				tasksInProgress,
				delayedTasks,
				warehouseUtilization,
			};
		}),

	getReceivingPOs: protectedProcedure
		.input(z.void())
		.query(async ({ ctx }) => {
			const db = ctx.db;
			return await db
				.select({
					id: purchases.id,
					grn_number: purchases.grn_number,
					supplier_id: purchases.supplier_id,
					supplier_name: suppliers.name,
					status: purchases.status,
					created_at: purchases.created_at,
					total_amount: purchases.total_amount,
				})
				.from(purchases)
				.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
				.orderBy(desc(purchases.created_at))
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
					})
				),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			return await db.transaction(async (tx) => {
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

					await tx
						.insert(placementVerifications)
						.values({
							product_id: item.productId,
							batch_id: batchId,
							branch_id: ctx.user.branchId ?? 1,
							status: "AWAITING_PLACEMENT",
						});
				}

				await tx
					.update(purchases)
					.set({ status: "received" })
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

	getPutAwayQueue: protectedProcedure
		.input(z.void())
		.query(async ({ ctx }) => {
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
				.leftJoin(productBatches, eq(placementVerifications.batch_id, productBatches.id))
				.leftJoin(branchLocations, eq(placementVerifications.location_id, branchLocations.id))
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
			})
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
							eq(batchStock.location_id, input.locationId)
						)
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
							eq(branchInventory.branch_id, ctx.user.branchId ?? 1)
						)
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

	getPickingQueue: protectedProcedure
		.input(z.void())
		.query(async ({ ctx }) => {
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
				newValues: { workerId: input.workerId },
			});

			return { success: true };
		}),

	startPickingTask: protectedProcedure
		.input(z.object({ pickListId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			await db
				.update(pickLists)
				.set({ status: "picking" })
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

				await logAudit(tx, {
					userId: staffId,
					action: "PICK_LIST_COMPLETED",
					entityType: "pick_lists",
					entityId: pl.id,
				});

				return { success: true, packageId: pkg.id };
			});
		}),

	getPackingQueue: protectedProcedure
		.input(z.void())
		.query(async ({ ctx }) => {
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
				})
				.from(packages)
				.leftJoin(staff, eq(packages.packed_by, staff.id))
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
			})
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

	logException: protectedProcedure
		.input(
			z.object({
				productId: z.number(),
				qty: z.number(),
				reason: z.string(),
				type: z.enum(["damage", "missing", "mismatch"]),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const staffId = await resolveStaffId(db, ctx.user.email);

			return await db.transaction(async (tx) => {
				const [adj] = await tx
					.insert(stockAdjustments)
					.values({
						product_id: input.productId,
						branch_id: ctx.user.branchId ?? 1,
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
});
