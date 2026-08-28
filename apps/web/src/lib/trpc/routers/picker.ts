import { pickListItems, pickLists } from "@evaluna/db/schema";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const pickerRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;

			const [
				assignedCount,
				completedCount,
				pendingCount,
				itemsPickedResult,
				recent,
			] = await Promise.all([
				db
					.select({ count: count() })
					.from(pickLists)
					.where(eq(pickLists.status, "assigned")),
				db
					.select({ count: count() })
					.from(pickLists)
					.where(eq(pickLists.status, "completed")),
				db
					.select({ count: count() })
					.from(pickLists)
					.where(eq(pickLists.status, "pending")),
				db
					.select({
						total: sql<number>`SUM(${pickListItems.quantity_picked})`,
					})
					.from(pickListItems)
					.where(eq(pickListItems.status, "picked")),
				db.query.pickLists.findMany({
					orderBy: [desc(pickLists.created_at)],
					limit: 5,
					with: {
						pickListItems: true,
					},
				}),
			]);

			const totalItemsPicked = Number(itemsPickedResult[0]?.total || 0);

			return {
				assignedToday: assignedCount[0]?.count || 0,
				completed: completedCount[0]?.count || 0,
				pending: pendingCount[0]?.count || 0,
				exceptions: 0,
				totalItemsPicked,
				pickAccuracy: 100,
				recentTasks: recent.map((r) => ({
					id: `PL-${r.id}`,
					order: `ORD-${r.order_id}`,
					items: r.pickListItems.reduce(
						(acc, item) => acc + (item.quantity_ordered ?? 0),
						0,
					),
					area: "Warehouse",
					status: r.status ?? "pending",
					time: r.created_at?.toLocaleTimeString() || "",
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
		.input(z.object({}))
		.query(async ({ ctx }) => {
			const db = ctx.db;

			const activeLists = await db.query.pickLists.findMany({
				where: eq(pickLists.status, "picking"),
				limit: 1,
				with: {
					pickListItems: {
						with: {
							product: true,
							location: true,
						},
					},
				},
			});

			if (activeLists.length === 0) {
				return { task: null, items: [] };
			}

			const task = activeLists[0];
			const items = task.pickListItems;

			return {
				task: {
					id: `PL-${task.id}`,
					order_id: `ORD-${task.order_id}`,
					area: "Warehouse",
					progress: 0,
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
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;

			const lists = await db.query.pickLists.findMany({
				where: and(
					eq(pickLists.status, "completed"),
					ctx.user.branchId
						? eq(pickLists.branch_id, ctx.user.branchId)
						: undefined,
				),
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
				where: and(
					eq(pickLists.status, "pending"),
					ctx.user.branchId
						? eq(pickLists.branch_id, ctx.user.branchId)
						: undefined,
				),
				orderBy: [desc(pickLists.created_at)],
				limit: 50,
				with: {
					assignedTo: true,
					pickListItems: true,
				},
			});

			return lists.map((r, i) => ({
				queue_no: i + 1,
				order_id: `ORD-${r.order_id}`,
				priority: r.priority ?? "Normal",
				items: r.pickListItems.reduce(
					(acc, item) => acc + (item.quantity_ordered ?? 0),
					0,
				),
				assigned_to: r.assignedTo?.name || "Unassigned",
				waiting_since: r.created_at?.toLocaleTimeString() || "",
				expected_by: "N/A",
			}));
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
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;

			// Get picker performance metrics
			const results = await db
				.select({
					staffId: staff.id,
					staffName: staff.name,
					pickListsCompleted: count().filterWhere(
						eq(pickLists.status, "completed"),
					),
					totalItemsPicked: sum(pickListItems.quantity_picked),
					accuracy: sql`ROUND(
						(SUM(pickListItems.quantity_picked)::decimal /
						NULLIF(SUM(pickListItems.quantity_ordered), 0) * 100)
					, 2)`,
				})
				.from(pickLists)
				.innerJoin(pickListItems, eq(pickLists.id, pickListItems.pickListId))
				.innerJoin(staff, eq(pickLists.assignedToId, staff.id))
				.where(
					and(
						eq(pickLists.status, "completed"),
						ctx.user.branchId
							? eq(pickLists.branch_id, ctx.user.branchId)
							: undefined,
					),
				)
				.groupBy(staff.id, staff.name)
				.orderBy(desc(sql`totalItemsPicked`))
				.limit(10);

			return results.map((r) => ({
				employeeName: r.staffName || "Unknown",
				tasksDone: Number(r.pickListsCompleted) || 0,
				totalItemsPicked: Number(r.totalItemsPicked) || 0,
				accuracyPct: Number(r.accuracy) || 0,
				period: "Last 30 days", // Simplified - in real system would be configurable
			}));
		}),
});
