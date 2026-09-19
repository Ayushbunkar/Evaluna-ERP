import { customers, orderItems, orders, pickListItems, pickLists } from "@evaluna/db/schema";
import { and, count, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyPickComplete } from "@/lib/notification-service";
import { roleProcedure, router } from "../init";

export const pickerRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);

			const [
				[counts],
				[itemsPickedRow],
				recent,
			] = await Promise.all([
				db
					.select({
						assignedCount: sql<number>`coalesce(count(*) filter (where ${pickLists.status} in ('assigned', 'picking', 'in_progress') or (${pickLists.assigned_to} is not null and (${pickLists.created_at} >= ${todayStart} or ${pickLists.completed_at} >= ${todayStart})) or (${pickLists.created_at} >= ${todayStart} and ${pickLists.status} != 'pending')), 0)::int`,
						completedCount: sql<number>`coalesce(count(*) filter (where ${pickLists.status} = 'completed' and (${pickLists.completed_at} >= ${todayStart} or ${pickLists.created_at} >= ${todayStart})), 0)::int`,
						pendingCount: sql<number>`coalesce(count(*) filter (where ${pickLists.status} in ('pending', 'unassigned') or ${pickLists.status} is null), 0)::int`,
					})
					.from(pickLists),
				db
					.select({
						total: sql<number>`coalesce(sum(${pickListItems.quantity_picked}), 0)::int`,
					})
					.from(pickListItems)
					.where(or(eq(pickListItems.status, "picked"), gte(pickListItems.quantity_picked, 1))),
				db
					.select({
						id: pickLists.id,
						order_id: pickLists.order_id,
						status: pickLists.status,
						created_at: pickLists.created_at,
						items_count: sql<number>`coalesce(sum(${pickListItems.quantity_ordered}), 0)::int`,
					})
					.from(pickLists)
					.leftJoin(pickListItems, eq(pickLists.id, pickListItems.pick_list_id))
					.groupBy(pickLists.id, pickLists.order_id, pickLists.status, pickLists.created_at)
					.orderBy(desc(pickLists.created_at))
					.limit(5),
			]);

			const totalItemsPicked = Number(itemsPickedRow?.total || 0);

			return {
				assignedToday: Number(counts?.assignedCount || 0),
				completed: Number(counts?.completedCount || 0),
				pending: Number(counts?.pendingCount || 0),
				exceptions: 0,
				totalItemsPicked,
				pickAccuracy: 100,
				recentTasks: recent.map((r) => ({
					id: `PL-${r.id}`,
					order: `ORD-${r.order_id}`,
					items: Number(r.items_count || 0),
					area: "Warehouse",
					status: r.status ?? "pending",
					time: r.created_at ? new Date(r.created_at).toLocaleTimeString() : "",
				})),
			};
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

			return {
				task: {
					id: `PL-${task.id}`,
					order_id: `ORD-${task.order_id}`,
					area: "Warehouse",
					progress: Math.round(
						(items.filter((i) => i.status === "picked").length /
							(items.length || 1)) *
							100,
					),
					total_items: items.length,
					picked_items: items.filter((i) => i.status === "picked").length,
				},
				items: items.map((i) => ({
					id: i.id,
					qty_required: i.quantity_ordered,
					qty_picked: i.quantity_picked ?? 0,
					status: i.status,
					product: i.product?.name ?? "Unknown",
					sku: i.product?.sku ?? i.product?.barcode ?? "N/A",
					location: i.location?.name ?? "Warehouse",
					batch: i.batch_id ? `B-${i.batch_id}` : "Any",
				})),
			};
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

			const newQtyPicked = (item.quantity_picked ?? 0) + 1;
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

			const newQtyPicked = input.quantity;
			const newStatus =
				newQtyPicked >= item.quantity_ordered
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
		.input(z.object({ branch_id: z.number().optional() }).optional())
		.query(async ({ ctx }) => {
			const db = ctx.db;

			const lists = await db.query.pickLists.findMany({
				where: eq(pickLists.status, "completed"),
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
				items: r.pickListItems.reduce(
					(acc, item) => acc + (item.quantity_ordered ?? 0),
					0,
				),
				time_taken: "N/A",
				completed_by: r.assignedTo?.name || "Unknown",
				date: r.created_at?.toLocaleDateString() || "",
				accuracy: 100, // In real system, this would be calculated based on expected vs actual
			}));
		}),

	getPending: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;

			const lists = await db.query.pickLists.findMany({
				where: inArray(pickLists.status, ["pending", "assigned"]),
				orderBy: [desc(pickLists.created_at)],
				limit: 50,
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

			return lists.map((r, i) => {
				let itemCount =
					r.pickListItems?.reduce(
						(acc, item) => acc + (item.quantity_ordered ?? 0),
						0,
					) || 0;

				if (itemCount === 0 && r.order_id) {
					itemCount = orderItemCounts.get(r.order_id) || 1;
				}

				return {
					id: r.id,
					queue_no: i + 1,
					order_id: `ORD-${r.order_id}`,
					priority: r.priority ?? "Normal",
					items: itemCount > 0 ? itemCount : 1,
					assigned_to: r.assignedTo?.name || "Unassigned",
					waiting_since: r.created_at?.toLocaleTimeString() || "",
					expected_by: "N/A",
				};
			});
		}),

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
				where: eq(pickLists.status, "completed"),
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
