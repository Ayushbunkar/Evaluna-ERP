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

			if (lists.length === 0) {
				return [
					{ id: "PL-1011", order_id: "ORD-5001", priority: "High", items_count: 12, assigned_to: "Rahul M.", area: "Zone A, Aisle 1-4", status: "In Progress", estimated_time: "15 mins", created_at: "Today, 10:30 AM" },
					{ id: "PL-1012", order_id: "ORD-5003", priority: "Medium", items_count: 5, assigned_to: "Unassigned", area: "Zone B", status: "Pending", estimated_time: "8 mins", created_at: "Today, 10:45 AM" },
					{ id: "PL-1015", order_id: "ORD-5010", priority: "Low", items_count: 24, assigned_to: "Unassigned", area: "Bulk Section", status: "Pending", estimated_time: "35 mins", created_at: "Today, 11:00 AM" },
					{ id: "PL-1008", order_id: "ORD-4990", priority: "High", items_count: 8, assigned_to: "Deepak S.", area: "Zone A", status: "Completed", estimated_time: "12 mins", created_at: "Yesterday" },
				];
			}

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
				return {
					task: { id: "PL-1011", order_id: "ORD-5001", area: "Zone A, Aisle 1-4", progress: 40, total_items: 5, picked_items: 2 },
					items: [
						{ id: 1, qty_required: 2, qty_picked: 2, status: "picked", product: "Wireless Mouse M330", sku: "MS-WL-330", location: "A1-Bin2", batch: "Any" },
						{ id: 2, qty_required: 1, qty_picked: 0, status: "pending", product: "Mechanical Keyboard RGB", sku: "KB-MCH-RGB", location: "A2-Shelf4", batch: "B-8801" },
						{ id: 3, qty_required: 4, qty_picked: 0, status: "pending", product: "USB-C Hub 6-in-1", sku: "USB-HUB-61", location: "A2-Bin1", batch: "Any" },
						{ id: 4, qty_required: 1, qty_picked: 0, status: "pending", product: "Laptop Stand Aluminum", sku: "LPT-STD-AL", location: "A4-Shelf1", batch: "Any" },
						{ id: 5, qty_required: 2, qty_picked: 0, status: "pending", product: "Ergonomic Wrist Rest", sku: "ERG-WR-01", location: "A4-Bin5", batch: "B-9902" },
					]
				};
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
			const newStatus = newQtyPicked >= item.quantity_ordered ? "picked" : "partial";
			
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
			const newStatus = newQtyPicked >= item.quantity_ordered ? "picked" : (newQtyPicked > 0 ? "partial" : "pending");
			
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
				where: eq(pickLists.status, "completed"),
				orderBy: [desc(pickLists.created_at)],
				limit: 50,
				with: {
					assignedTo: true,
					pickListItems: true,
				},
			});

			if (lists.length === 0) {
				return [
					{
						id: "PL-101",
						order_id: "ORD-998",
						items: 5,
						time_taken: "14m",
						completed_by: "Deepak Sharma",
						date: "Jan 15, 2024",
						accuracy: 100,
					},
					{
						id: "PL-102",
						order_id: "ORD-999",
						items: 12,
						time_taken: "22m",
						completed_by: "Rupesh",
						date: "Jan 15, 2024",
						accuracy: 95,
					}
				];
			}

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

			if (lists.length === 0) {
				return [
					{
						queue_no: 1,
						order_id: "ORD-1004",
						priority: "High",
						items: 8,
						assigned_to: "Unassigned",
						waiting_since: "10:15 AM",
						expected_by: "N/A",
					},
					{
						queue_no: 2,
						order_id: "ORD-1006",
						priority: "Medium",
						items: 3,
						assigned_to: "Deepak Sharma",
						waiting_since: "10:30 AM",
						expected_by: "N/A",
					}
				];
			}

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
			return [
				{
					id: "RTN-501",
					product: "Example Product 1",
					sku: "SKU-1002",
					qty: 2,
					location: "A1-B2",
					reason: "Damaged",
					status: "Pending",
				},
				{
					id: "RTN-502",
					product: "Example Product 2",
					sku: "SKU-1005",
					qty: 1,
					location: "C3-D4",
					reason: "Wrong Item",
					status: "Placed",
				}
			];
		}),

	getReports: roleProcedure(["admin", "manager", "auditor", "picker"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async () => {
			return [
				{
					name: "Deepak Sharma",
					tasks_done: 188,
					accuracy: 98.4,
					avg_time: "20m",
					date: "Jan 2024",
				},
				{
					name: "Rupesh",
					tasks_done: 156,
					accuracy: 99.1,
					avg_time: "18m",
					date: "Jan 2024",
				}
			];
		}),
});
