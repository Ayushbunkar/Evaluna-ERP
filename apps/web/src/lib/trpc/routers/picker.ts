import {
	branchDamage,
	branchInventory,
	branchLocations,
	customers,
	deliveryRoutes,
	orderItems,
	orders,
	pickingExceptions,
	pickListItems,
	pickLists,
	routeStops,
	staff,
	stockLedger,
	user,
} from "@evaluna/db/schema";
import {
	and,
	count,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	lte,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyPickComplete } from "@/lib/notification-service";
import { ensurePickingExceptionsTable } from "@/lib/product-schema-ensure";
import { isDateInISTRange, parseDateFilterRange } from "@/lib/utils";
import { roleProcedure, router } from "../init";
import { logAudit, notify, resolveStaffId } from "../util/audit";

export const pickerRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);

			try {
				const [
					[assignedRow],
					[completedRow],
					[pendingRow],
					[itemsPickedRow],
					recent,
				] = await Promise.all([
					db
						.select({ count: count() })
						.from(pickLists)
						.where(
							or(
								inArray(pickLists.status, [
									"assigned",
									"picking",
									"in_progress",
								]),
								and(
									isNotNull(pickLists.assigned_to),
									or(
										gte(pickLists.created_at, todayStart),
										gte(pickLists.completed_at, todayStart),
									),
								),
								and(
									gte(pickLists.created_at, todayStart),
									sql`${pickLists.status} != 'pending'`,
								),
							),
						),
					db
						.select({ count: count() })
						.from(pickLists)
						.where(
							and(
								or(
									inArray(pickLists.status, ["completed", "packed"]),
									isNotNull(pickLists.completed_at),
								),
								or(
									gte(pickLists.completed_at, todayStart),
									gte(pickLists.created_at, todayStart),
								),
							),
						),
					db
						.select({ count: count() })
						.from(pickLists)
						.where(
							or(
								inArray(pickLists.status, ["pending", "unassigned"]),
								sql`${pickLists.status} is null`,
							),
						),
					db
						.select({
							total: sql<number>`coalesce(sum(${pickListItems.quantity_picked}), 0)::int`,
						})
						.from(pickListItems)
						.where(
							or(
								eq(pickListItems.status, "picked"),
								gte(pickListItems.quantity_picked, 1),
							),
						),
					db
						.select({
							id: pickLists.id,
							order_id: pickLists.order_id,
							status: pickLists.status,
							created_at: pickLists.created_at,
							items_count: sql<number>`coalesce(sum(${pickListItems.quantity_ordered}), 0)::int`,
							customer_name: customers.name,
						})
						.from(pickLists)
						.leftJoin(
							pickListItems,
							eq(pickLists.id, pickListItems.pick_list_id),
						)
						.leftJoin(orders, eq(pickLists.order_id, orders.id))
						.leftJoin(customers, eq(orders.customer_id, customers.id))
						.groupBy(
							pickLists.id,
							pickLists.order_id,
							pickLists.status,
							pickLists.created_at,
							customers.name,
						)
						.orderBy(desc(pickLists.created_at))
						.limit(5),
				]);

				const totalItemsPicked = Number(itemsPickedRow?.total || 0);

				return {
					assignedToday: Number(assignedRow?.count || 0),
					completed: Number(completedRow?.count || 0),
					pending: Number(pendingRow?.count || 0),
					exceptions: 0,
					totalItemsPicked,
					pickAccuracy: 100,
					recentTasks: (recent || []).map((r: any) => ({
						id: `PL-${r.id}`,
						numericId: r.id,
						order: `ORD-${r.order_id}`,
						customerName: r.customer_name || "N/A",
						items: Number(r.items_count || 0),
						area: "Warehouse",
						status: r.status ?? "pending",
						created_at: r.created_at,
						time: r.created_at
							? new Date(r.created_at).toLocaleTimeString()
							: "",
					})),
				};
			} catch (err) {
				console.warn(
					"[pickerRouter.getDashboardStats] Error fetching stats:",
					err,
				);
				return {
					assignedToday: 0,
					completed: 0,
					pending: 0,
					exceptions: 0,
					totalItemsPicked: 0,
					pickAccuracy: 100,
					recentTasks: [],
				};
			}
		}),

	getPickLists: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(
			z.object({
				branch_id: z.number().optional(),
				status: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const lists = await db.query.pickLists.findMany({
				where: input.status ? eq(pickLists.status, input.status) : undefined,
				orderBy: [desc(pickLists.created_at)],
				limit: 50,
				with: {
					assignedTo: true,
					pickListItems: true,
				},
			});

			return lists.map((r) => ({
				id: `PL-${r.id}`,
				order_id: `ORD-${r.order_id}`,
				priority: r.priority ?? "Normal",
				items_count: r.pickListItems.reduce(
					(acc, item) => acc + (item.quantity_ordered ?? 0),
					0,
				),
				assigned_to: r.assignedTo?.name || "Unassigned",
				area: "Warehouse",
				status: r.status ?? "pending",
				estimated_time: "N/A",
				created_at: r.created_at ? new Date(r.created_at).toLocaleString() : "",
			}));
		}),

	getCurrentTask: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ pickListId: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const activeLists = await db.query.pickLists.findMany({
				where: input.pickListId
					? eq(pickLists.id, input.pickListId)
					: eq(pickLists.status, "picking"),
				orderBy: [desc(pickLists.created_at)],
				with: {
					order: {
						with: {
							customer: true,
						},
					},
					pickListItems: {
						with: {
							product: true,
							location: true,
						},
					},
				},
			});

			const validActive = activeLists.filter(
				(l) => l.pickListItems && l.pickListItems.length > 0,
			);

			if (validActive.length === 0) {
				return { task: null, items: [] };
			}

			const task = validActive[0];
			const items = task.pickListItems;

			let customerName = (task as any).order?.customer?.name || "N/A";
			let customerPhone = (task as any).order?.customer?.phone || "N/A";
			let customerAddress = (task as any).order?.customer?.address || "N/A";
			let routeName = "N/A";

			if (task.order_id) {
				try {
					if (
						customerName === "N/A" ||
						customerAddress === "N/A" ||
						customerPhone === "N/A"
					) {
						const [ord] = await db
							.select({
								name: customers.name,
								phone: customers.phone,
								address: customers.address,
							})
							.from(orders)
							.leftJoin(customers, eq(orders.customer_id, customers.id))
							.where(eq(orders.id, task.order_id))
							.limit(1);

						if (ord) {
							if (ord.name) customerName = ord.name;
							if (ord.phone) customerPhone = ord.phone;
							if (ord.address) customerAddress = ord.address;
						}
					}

					const [rStop] = await db
						.select({ routeName: deliveryRoutes.name })
						.from(orders)
						.innerJoin(
							routeStops,
							eq(routeStops.customer_id, orders.customer_id),
						)
						.innerJoin(
							deliveryRoutes,
							eq(deliveryRoutes.id, routeStops.route_id),
						)
						.where(eq(orders.id, task.order_id))
						.limit(1);
					if (rStop?.routeName) {
						routeName = rStop.routeName;
					}
				} catch (err) {
					console.warn(
						"[pickerRouter.getCurrentTask] Error fetching customer/route details:",
						err,
					);
				}
			}

			const itemIds = items.map((i) => i.id);
			let existingExceptions: any[] = [];
			if (itemIds.length > 0) {
				try {
					existingExceptions = await db
						.select()
						.from(pickingExceptions)
						.where(inArray(pickingExceptions.pick_list_item_id, itemIds));
				} catch (exErr) {
					console.warn(
						"[pickerRouter.getCurrentTask] Error fetching picking exceptions:",
						exErr,
					);
				}
			}

			const productIds = items.map((i) => i.product_id).filter(Boolean);
			const stockMap = new Map<number, number>();
			if (productIds.length > 0) {
				try {
					const stocks = await db
						.select({
							productId: branchInventory.product_id,
							quantity: branchInventory.quantity,
						})
						.from(branchInventory)
						.where(inArray(branchInventory.product_id, productIds));
					for (const s of stocks) {
						if (s.productId) {
							stockMap.set(s.productId, Number(s.quantity ?? 0));
						}
					}
				} catch (stErr) {
					console.warn(
						"[pickerRouter.getCurrentTask] Error fetching branchInventory:",
						stErr,
					);
				}
			}

			const accountedCount = items.filter((i) => {
				const picked = Number(i.quantity_picked ?? 0);
				const ordered = Number(i.quantity_ordered ?? 0);
				if (i.status === "picked" || picked >= ordered) return true;
				return existingExceptions.some((e) => e.pick_list_item_id === i.id);
			}).length;
			const totalItemsCount = items.length;
			const allAccounted =
				accountedCount === totalItemsCount && totalItemsCount > 0;

			return {
				task: {
					id: `PL-${task.id}`,
					raw_id: task.id,
					order_id: `ORD-${task.order_id}`,
					raw_order_id: task.order_id,
					customer_name: customerName,
					customer_phone: customerPhone,
					customer_address: customerAddress,
					route_name: routeName !== "N/A" ? routeName : undefined,
					area: "Warehouse",
					progress: Math.round((accountedCount / (totalItemsCount || 1)) * 100),
					total_items: totalItemsCount,
					picked_items: accountedCount,
					all_accounted: allAccounted,
				},
				items: items.map((i) => {
					const req =
						Math.round(
							(Number.parseFloat(String(i.quantity_ordered ?? "1")) || 1) *
								1000,
						) / 1000;
					const picked =
						Math.round(
							(Number.parseFloat(String(i.quantity_picked ?? "0")) || 0) * 1000,
						) / 1000;
					const remaining = Math.max(
						0,
						Math.round((req - picked) * 1000) / 1000,
					);
					const ex = existingExceptions.find(
						(e) => e.pick_list_item_id === i.id,
					);
					const availStock = stockMap.get(i.product_id) ?? req + 10;

					return {
						id: i.id,
						product_id: i.product_id,
						qty_required: req,
						qty_picked: picked,
						remaining_qty: remaining,
						available_stock: availStock,
						status: i.status,
						product: i.product?.name ?? "Unknown",
						sku: i.product?.sku ?? i.product?.barcode ?? "N/A",
						barcode: i.product?.barcode ?? i.product?.sku ?? "N/A",
						location:
							i.location?.name ??
							(i.location?.shelf ? `Shelf: ${i.location.shelf}` : "Warehouse"),
						shelf: i.location?.shelf ?? i.location?.name ?? "A-1",
						batch: i.batch_id ? `B-${i.batch_id}` : "Any",
						exception: ex
							? {
									id: ex.id,
									quantity_damaged: Number(ex.quantity_damaged ?? 0),
									quantity_missing: Number(ex.quantity_missing ?? 0),
									reason: ex.reason,
									remarks: ex.remarks,
									photo_url: ex.photo_url,
									status: ex.status,
								}
							: null,
					};
				}),
			};
		}),

	confirmQuantityWithException: roleProcedure([
		"admin",
		"manager",
		"auditor",
		"picker",
	])
		.input(
			z.object({
				item_id: z.number(),
				quantity_picked: z.number().min(0),
				quantity_damaged: z.number().min(0).default(0),
				quantity_missing: z.number().min(0).default(0),
				reason: z
					.enum([
						"Damaged items",
						"Stock not found",
						"Wrong shelf location",
						"Expired items",
						"Inventory mismatch",
						"Other",
					])
					.optional(),
				remarks: z.string().optional(),
				photo_url: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			await ensurePickingExceptionsTable(db);
			const staffId = await resolveStaffId(db, ctx.user.email);

			return await db.transaction(async (tx) => {
				const item = await tx.query.pickListItems.findFirst({
					where: eq(pickListItems.id, input.item_id),
					with: {
						pickList: true,
						product: true,
						location: true,
					},
				});

				if (!item) throw new Error("Pick list item not found");
				if (
					item.pickList.status === "completed" ||
					item.pickList.status === "cancelled"
				) {
					throw new Error(
						"Cannot modify an already completed or cancelled pick list.",
					);
				}

				const orderedQty = Number(item.quantity_ordered) || 0;
				const pickedQty = Number(input.quantity_picked) || 0;
				const damagedQty = Number(input.quantity_damaged) || 0;
				const missingQty = Number(input.quantity_missing) || 0;

				if (pickedQty > orderedQty) {
					throw new Error(
						`Picked quantity (${pickedQty}) cannot exceed ordered quantity (${orderedQty})`,
					);
				}

				const shortfall = Math.max(0, orderedQty - pickedQty);

				// If shortfall > 0 (partial picking), require reason and remarks
				if (shortfall > 0) {
					if (!input.reason) {
						throw new Error(
							"Reason is required when reporting partial picking or stock shortage.",
						);
					}
					if (
						!input.remarks &&
						(damagedQty > 0 ||
							missingQty > 0 ||
							input.reason === "Damaged items" ||
							input.reason === "Stock not found")
					) {
						throw new Error(
							"Remarks are required for damaged or missing items.",
						);
					}
				}

				const newStatus =
					pickedQty >= orderedQty
						? "picked"
						: pickedQty > 0
							? "partial"
							: "missing";

				const [updatedItem] = await tx
					.update(pickListItems)
					.set({
						quantity_picked: pickedQty,
						status: newStatus,
						picked_by: staffId,
						picked_at: new Date(),
					})
					.where(eq(pickListItems.id, input.item_id))
					.returning();

				let exceptionRecord: any = null;

				if (shortfall > 0) {
					const finalDamaged = damagedQty;
					const finalMissing =
						missingQty || Math.max(0, shortfall - finalDamaged);

					try {
						const [existingEx] = await tx
							.select()
							.from(pickingExceptions)
							.where(eq(pickingExceptions.pick_list_item_id, input.item_id))
							.limit(1);

						if (existingEx) {
							const [updatedEx] = await tx
								.update(pickingExceptions)
								.set({
									quantity_picked: pickedQty,
									quantity_damaged: finalDamaged,
									quantity_missing: finalMissing,
									reason: input.reason!,
									remarks: input.remarks || null,
									photo_url: input.photo_url || null,
									reported_by: staffId || existingEx.reported_by,
									status: "PENDING_REVIEW",
									updated_at: new Date(),
								})
								.where(eq(pickingExceptions.id, existingEx.id))
								.returning();
							exceptionRecord = updatedEx;
						} else {
							const [insertedEx] = await tx
								.insert(pickingExceptions)
								.values({
									pick_list_id: item.pick_list_id,
									pick_list_item_id: item.id,
									order_id: item.pickList.order_id,
									product_id: item.product_id,
									branch_id: (item.pickList as any).branch_id ?? 1,
									location_id: item.location_id,
									quantity_ordered: orderedQty,
									quantity_picked: pickedQty,
									quantity_damaged: finalDamaged,
									quantity_missing: finalMissing,
									reason: input.reason!,
									remarks: input.remarks || null,
									photo_url: input.photo_url || null,
									reported_by: staffId || 1,
									status: "PENDING_REVIEW",
								})
								.returning();
							exceptionRecord = insertedEx;
						}

						// Notify Warehouse Manager
						if (exceptionRecord?.id) {
							try {
								await notify(tx, {
									branchId: (item.pickList as any).branch_id ?? 1,
									type: "damage",
									priority: "high",
									title: `⚠️ Picker Stock Shortage: ${item.product?.name || "Product"}`,
									message: `Order #ORD-${item.pickList.order_id}: Picker confirmed ${pickedQty} of ${orderedQty} units. Damaged: ${finalDamaged}, Missing: ${finalMissing}. Reason: ${input.reason}`,
									referenceType: "picking_exceptions",
									referenceId: exceptionRecord.id,
								});
							} catch (e) {
								console.warn(
									"[confirmQuantityWithException] manager notify error:",
									e,
								);
							}
						}
					} catch (exErr) {
						console.warn(
							"[confirmQuantityWithException] exception record error:",
							exErr,
						);
					}

					// Notify Sales
					try {
						await notify(tx, {
							branchId: (item.pickList as any).branch_id ?? 1,
							type: "sale",
							priority: "high",
							title: `📋 Partial Picking Alert: Order #ORD-${item.pickList.order_id}`,
							message: `Picking completed partially. ${pickedQty} of ${orderedQty} units picked. ${finalDamaged > 0 ? `${finalDamaged} units reported damaged by Picker. ` : ""}${finalMissing > 0 ? `${finalMissing} units reported missing. ` : ""}Warehouse Manager approval required.`,
							referenceType: "orders",
							referenceId: item.pickList.order_id ?? undefined,
						});
					} catch (e) {
						console.warn(
							"[confirmQuantityWithException] sales notify error:",
							e,
						);
					}
				} else {
					try {
						await tx
							.delete(pickingExceptions)
							.where(
								and(
									eq(pickingExceptions.pick_list_item_id, input.item_id),
									eq(pickingExceptions.status, "PENDING_REVIEW"),
								),
							);
					} catch (delErr) {
						console.warn(
							"[confirmQuantityWithException] delete exception notice:",
							delErr,
						);
					}
				}

				return {
					success: true,
					item: updatedItem,
					exception: exceptionRecord,
				};
			});
		}),

	reportPNA: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ item_id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(pickListItems)
				.set({ status: "missing" })
				.where(eq(pickListItems.id, input.item_id))
				.returning();
			return updated;
		}),

	scanItem: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ item_id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const item = await ctx.db.query.pickListItems.findFirst({
				where: eq(pickListItems.id, input.item_id),
			});

			if (!item) throw new Error("Item not found");

			const maxAllowed = item.quantity_ordered || 1;
			const newQtyPicked = Math.min(
				(item.quantity_picked ?? 0) + 1,
				maxAllowed,
			);
			const newStatus =
				newQtyPicked >= item.quantity_ordered ? "picked" : "partial";

			const [updated] = await ctx.db
				.update(pickListItems)
				.set({
					quantity_picked: newQtyPicked,
					status: newStatus,
					picked_at: new Date(),
				})
				.where(eq(pickListItems.id, input.item_id))
				.returning();

			return updated;
		}),

	manualConfirm: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ item_id: z.number(), quantity: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const item = await ctx.db.query.pickListItems.findFirst({
				where: eq(pickListItems.id, input.item_id),
			});

			if (!item) throw new Error("Item not found");

			const orderedQty = Number(item.quantity_ordered) || 0;
			const maxAllowed = orderedQty > 0 ? orderedQty : 1;
			const newQtyPicked = Math.min(Math.max(0, input.quantity), maxAllowed);
			const newStatus =
				newQtyPicked >= orderedQty
					? "picked"
					: newQtyPicked > 0
						? "partial"
						: "pending";

			const [updated] = await ctx.db
				.update(pickListItems)
				.set({
					quantity_picked: newQtyPicked,
					status: newStatus,
					picked_at: newQtyPicked > 0 ? new Date() : null,
				})
				.where(eq(pickListItems.id, input.item_id))
				.returning();

			return updated;
		}),

	getCompleted: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					startDate: z.union([z.string(), z.coerce.date()]).optional(),
					endDate: z.union([z.string(), z.coerce.date()]).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			try {
				const conditions = [
					or(
						inArray(pickLists.status, ["completed", "packed"]),
						isNotNull(pickLists.completed_at),
					),
				];
				if (input?.branch_id) {
					conditions.push(eq(orders.branch_id, input.branch_id));
				}

				const { fromDate, toDate, startIST, endIST } = parseDateFilterRange(
					input?.startDate,
					input?.endDate,
				);
				const targetDateCol = sql`COALESCE(${pickLists.completed_at}, ${pickLists.created_at})`;

				if (fromDate) {
					conditions.push(gte(targetDateCol, fromDate));
				}
				if (toDate) {
					conditions.push(lte(targetDateCol, toDate));
				}

				const rawLists = await db
					.select({
						id: pickLists.id,
						order_id: pickLists.order_id,
						created_at: pickLists.created_at,
						completed_at: pickLists.completed_at,
						completed_by: staff.name,
						customerName: customers.name,
					})
					.from(pickLists)
					.leftJoin(orders, eq(pickLists.order_id, orders.id))
					.leftJoin(customers, eq(orders.customer_id, customers.id))
					.leftJoin(staff, eq(pickLists.assigned_to, staff.id))
					.where(and(...conditions))
					.orderBy(desc(targetDateCol))
					.limit(500);

				const lists =
					startIST || endIST
						? rawLists.filter((r) =>
								isDateInISTRange(
									r.completed_at || r.created_at,
									startIST,
									endIST,
								),
							)
						: rawLists;

				if (!lists || lists.length === 0) return [];

				const listIds = lists.map((l) => l.id);
				const plItems = await db
					.select({
						pick_list_id: pickListItems.pick_list_id,
						qty: pickListItems.quantity_ordered,
					})
					.from(pickListItems)
					.where(inArray(pickListItems.pick_list_id, listIds));

				const productCounts = new Map<number, number>();
				const totalQuantities = new Map<number, number>();

				for (const item of plItems) {
					const pCount = productCounts.get(item.pick_list_id) || 0;
					productCounts.set(item.pick_list_id, pCount + 1);

					const numQty = Number.parseFloat(String(item.qty || "0"));
					const currentQty = totalQuantities.get(item.pick_list_id) || 0;
					totalQuantities.set(
						item.pick_list_id,
						currentQty + (Number.isNaN(numQty) ? 0 : numQty),
					);
				}

				return lists.map((r) => {
					const productCount = productCounts.get(r.id) || 1;
					const rawQty = totalQuantities.get(r.id) || productCount;
					const roundedQty = Math.round(rawQty * 10) / 10;
					const effectiveDate = r.completed_at || r.created_at;

					return {
						id: `PL-${r.id}`,
						order_id: `ORD-${r.order_id}`,
						items: productCount,
						total_quantity: roundedQty,
						time_taken: "N/A",
						completed_by: r.completed_by || "Unknown",
						customerName: r.customerName || "Customer",
						date: effectiveDate
							? new Date(effectiveDate).toLocaleDateString("en-GB", {
									day: "2-digit",
									month: "2-digit",
									year: "numeric",
								})
							: "Today",
						completed_at: r.completed_at,
						accuracy: 100,
					};
				});
			} catch (e) {
				console.warn(
					"[picker.getCompleted] Error querying completed picklists:",
					e,
				);
				// Fallback to db.query API
				try {
					const rawFallbackLists = await db.query.pickLists.findMany({
						where: or(
							inArray(pickLists.status, ["completed", "packed"]),
							isNotNull(pickLists.completed_at),
						),
						limit: 500,
						orderBy: [desc(pickLists.created_at)],
						with: {
							assignedTo: true,
							pickListItems: true,
							order: {
								with: {
									customer: true,
								},
							},
						},
					});

					const { startIST, endIST } = parseDateFilterRange(
						input?.startDate,
						input?.endDate,
					);
					const fallbackLists =
						startIST || endIST
							? rawFallbackLists.filter((l: any) =>
									isDateInISTRange(
										l.completed_at || l.created_at,
										startIST,
										endIST,
									),
								)
							: rawFallbackLists;

					return fallbackLists.map((l: any) => {
						const itemsList = l.pickListItems || [];
						const rawTotalQty = itemsList.reduce(
							(acc: number, item: any) =>
								acc +
								(Number.parseFloat(String(item.quantity_ordered || "0")) || 0),
							0,
						);
						const roundedQty =
							Math.round((rawTotalQty || itemsList.length || 1) * 10) / 10;
						const effectiveDate = l.completed_at || l.created_at;

						return {
							id: `PL-${l.id}`,
							order_id: `ORD-${l.order_id}`,
							items: itemsList.length || 1,
							total_quantity: roundedQty,
							time_taken: "N/A",
							completed_by: l.assignedTo?.name || "Picker Staff",
							customerName: l.order?.customer?.name || "Customer",
							date: effectiveDate
								? new Date(effectiveDate).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
									})
								: "Today",
							completed_at: l.completed_at,
							accuracy: 100,
						};
					});
				} catch (fallbackErr) {
					console.warn(
						"[picker.getCompleted] Fallback query failed:",
						fallbackErr,
					);
					return [];
				}
			}
		}),

	getPending: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					date: z.string().optional(),
					datePreset: z
						.enum(["all", "today", "yesterday", "custom"])
						.optional()
						.default("all"),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const conditions: any[] = [
				inArray(pickLists.status, ["pending", "assigned"]),
			];

			if (input?.datePreset && input.datePreset !== "all") {
				const now = new Date();
				if (input.datePreset === "today") {
					const s = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate(),
						0,
						0,
						0,
					);
					const e = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate(),
						23,
						59,
						59,
						999,
					);
					conditions.push(
						gte(pickLists.created_at, s),
						lte(pickLists.created_at, e),
					);
				} else if (input.datePreset === "yesterday") {
					const y = new Date(now);
					y.setDate(y.getDate() - 1);
					const s = new Date(
						y.getFullYear(),
						y.getMonth(),
						y.getDate(),
						0,
						0,
						0,
					);
					const e = new Date(
						y.getFullYear(),
						y.getMonth(),
						y.getDate(),
						23,
						59,
						59,
						999,
					);
					conditions.push(
						gte(pickLists.created_at, s),
						lte(pickLists.created_at, e),
					);
				} else if (input.datePreset === "custom" && input.date) {
					const parts = input.date.split("-").map(Number);
					if (parts.length === 3) {
						const s = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
						const e = new Date(
							parts[0],
							parts[1] - 1,
							parts[2],
							23,
							59,
							59,
							999,
						);
						conditions.push(
							gte(pickLists.created_at, s),
							lte(pickLists.created_at, e),
						);
					}
				}
			}

			const lists = await db.query.pickLists.findMany({
				where: conditions.length > 1 ? and(...conditions) : conditions[0],
				orderBy: [desc(pickLists.created_at)],
				limit: 100,
				with: {
					assignedTo: true,
					pickListItems: true,
				},
			});

			const missingOrderIds = lists
				.filter(
					(r) =>
						(!r.pickListItems || r.pickListItems.length === 0) && r.order_id,
				)
				.map((r) => r.order_id!);

			let orderItemCounts = new Map<number, number>();
			if (missingOrderIds.length > 0) {
				const oItems = await db
					.select({
						orderId: orderItems.order_id,
						count: count(),
					})
					.from(orderItems)
					.where(inArray(orderItems.order_id, missingOrderIds))
					.groupBy(orderItems.order_id);
				orderItemCounts = new Map(oItems.map((o) => [o.orderId, o.count]));
			}

			const historyItems = [];
			for (const r of lists) {
				let totalUnits =
					r.pickListItems?.reduce(
						(acc, item) =>
							acc +
							(Number.parseFloat(String(item.quantity_ordered || "0")) || 0),
						0,
					) || 0;
				totalUnits = Math.round(totalUnits * 10) / 10;

				let distinctProducts = r.pickListItems?.length || 0;

				if (totalUnits === 0 && r.order_id) {
					totalUnits = orderItemCounts.get(r.order_id) || 1;
				}
				if (distinctProducts === 0 && r.order_id) {
					distinctProducts = orderItemCounts.get(r.order_id) || 1;
				}

				let customerName = "N/A";
				let routeName = "N/A";
				if (r.order_id) {
					try {
						const [ord] = await db
							.select({
								customer_id: orders.customer_id,
								customerName: customers.name,
							})
							.from(orders)
							.leftJoin(customers, eq(orders.customer_id, customers.id))
							.where(eq(orders.id, r.order_id))
							.limit(1);
						if (ord?.customerName) {
							customerName = ord.customerName;
						}
						if (ord?.customer_id) {
							const [rStop] = await db
								.select({ routeName: deliveryRoutes.name })
								.from(routeStops)
								.leftJoin(
									deliveryRoutes,
									eq(deliveryRoutes.id, routeStops.route_id),
								)
								.where(eq(routeStops.customer_id, ord.customer_id))
								.limit(1);
							if (rStop?.routeName) {
								routeName = rStop.routeName;
							}
						}
					} catch (e) {}
				}

				historyItems.push({
					id: r.id,
					queue_no: historyItems.length + 1,
					order_id: `ORD-${r.order_id}`,
					priority: r.priority ?? "Normal",
					items: totalUnits > 0 ? totalUnits : 1,
					products_count: distinctProducts > 0 ? distinctProducts : 1,
					assigned_to: r.assignedTo?.name || "Unassigned Queue",
					status: r.status ?? "pending",
					is_assigned: Boolean(r.assignedTo),
					customerName,
					routeName,
					created_at: r.created_at,
					waiting_since: r.created_at
						? new Date(r.created_at).toLocaleTimeString("en-US", {
								hour: "2-digit",
								minute: "2-digit",
								second: "2-digit",
								hour12: true,
							})
						: "",
					expected_by: "N/A",
				});
			}

			return historyItems;
		}),

	// ── Claim Next Available Pick Task from Queue ─────────────────────────────
	claimNextTask: roleProcedure(["admin", "manager", "picker"]).mutation(
		async ({ ctx }) => {
			const db = ctx.db;

			// First check if user already has an active task in 'picking' status
			const activeTask = await db.query.pickLists.findFirst({
				where: and(
					eq(pickLists.status, "picking"),
					eq(pickLists.assigned_to, Number(ctx.user.id) || 1),
				),
			});

			if (activeTask) {
				return { success: true, pickListId: activeTask.id, isExisting: true };
			}

			// Find earliest unassigned or pending pickList in queue
			const pendingLists = await db.query.pickLists.findMany({
				where: inArray(pickLists.status, ["pending", "unassigned"]),
				orderBy: [pickLists.created_at],
				limit: 10,
			});

			if (pendingLists.length === 0) {
				throw new Error("No pending pick tasks available in the queue.");
			}

			const nextTask = pendingLists[0];

			// Resolve current user staff ID
			let staffId = Number(ctx.user.id) || 1;
			if (ctx.user.email) {
				const [staffRow] = await db
					.select({ id: staff.id })
					.from(staff)
					.where(eq(staff.email, ctx.user.email))
					.limit(1);
				if (staffRow) staffId = staffRow.id;
			}

			await db
				.update(pickLists)
				.set({
					status: "picking",
					assigned_to: staffId,
				})
				.where(eq(pickLists.id, nextTask.id));

			return { success: true, pickListId: nextTask.id, isExisting: false };
		},
	),

	getReturns: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;

			// For now returning empty array since we don't have a dedicated returns table in the schema yet
			// In a real implementation, this would query sales returns or purchase returns tables
			return [];
		}),

	getReports: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }).optional())
		.query(async ({ ctx }) => {
			const db = ctx.db;

			const completedLists = await db.query.pickLists.findMany({
				where: or(
					inArray(pickLists.status, ["completed", "packed"]),
					isNotNull(pickLists.completed_at),
				),
				limit: 50,
				with: {
					assignedTo: true,
					pickListItems: true,
				},
			});

			if (completedLists.length === 0) return [];

			return completedLists.map((r) => ({
				employeeName: r.assignedTo?.name || "Picker Staff",
				tasksDone: 1,
				totalItemsPicked: r.pickListItems.reduce(
					(acc, it) => acc + (it.quantity_picked || 0),
					0,
				),
				accuracyPct: 100,
				period: "Last 30 days",
			}));
		}),
});
