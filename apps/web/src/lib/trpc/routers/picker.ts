import { pickListItems, pickLists } from "@evaluna/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
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
					qty_picked: i.quantity_picked,
					status: i.status,
					product: i.product?.name ?? "Unknown",
					sku: i.product?.sku ?? i.product?.barcode ?? "N/A",
					location: i.location?.name ?? "Warehouse",
				})),
			};
		}),

	getCompleted: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }))
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
				accuracy: 100,
			}));
		}),

	getPending: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;

			const lists = await db.query.pickLists.findMany({
				where: eq(pickLists.status, "pending"),
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
		.query(async () => {
			return [];
		}),

	getReports: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async () => {
			return [];
		}),
});
