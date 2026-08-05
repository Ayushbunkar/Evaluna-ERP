import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { pickListItems, pickLists } from "@/lib/db/schema";
import { protectedProcedure, router } from "../init";

export const pickingRouter = router({
	getPickLists: protectedProcedure
		.input(z.object({ limit: z.number().optional().default(10) }))
		.query(async ({ input }) => {
			const lists = await db.query.pickLists.findMany({
				limit: input.limit,
				orderBy: [desc(pickLists.created_at)],
				with: {
					order: {
						with: { customer: true },
					},
					assignedTo: true,
					pickListItems: true,
				},
			});

			return lists.map((pl: any) => ({
				id: `PL-${pl.id}`,
				orderId: pl.order_id ? `ORD-${pl.order_id}` : "N/A",
				customerName: pl.order?.customer?.name ?? "Unknown",
				status: pl.status ?? "pending",
				priority: pl.priority ?? "normal",
				totalItems: pl.pickListItems.reduce(
					(acc: number, item: any) => acc + (item.quantity_ordered ?? 0),
					0,
				),
				assignedTo: pl.assignedTo?.name ?? "Not Assigned",
				createdAt: pl.created_at
					? new Date(pl.created_at).toISOString()
					: new Date().toISOString(),
			}));
		}),

	getPickListItems: protectedProcedure
		.input(z.object({ pickListId: z.string() }))
		.query(async ({ input }) => {
			const idStr = input.pickListId.replace("PL-", "");
			const id = Number.parseInt(idStr, 10);

			if (Number.isNaN(id)) return [];

			const items = await db.query.pickListItems.findMany({
				where: eq(pickListItems.pick_list_id, id),
				with: {
					product: true,
					location: true,
				},
			});

			return items.map((item: any) => ({
				id: `ITEM-${item.pick_list_id}-${item.id}`,
				productCode:
					item.product?.sku ??
					item.product?.barcode ??
					`SKU-${item.product_id}`,
				productName: item.product?.name ?? "Unknown Product",
				orderedQty: item.quantity_ordered ?? 0,
				pickedQty: item.quantity_picked ?? 0,
				location: item.location?.name ?? "Unknown Location",
				status: item.status ?? "pending",
			}));
		}),

	startPickList: protectedProcedure
		.input(z.object({ pickListId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const idStr = input.pickListId.replace("PL-", "");
			const id = Number.parseInt(idStr, 10);
			if (Number.isNaN(id)) throw new Error("Invalid pick list ID");

			await db
				.update(pickLists)
				.set({
					status: "picking",
					assigned_to: Number.parseInt(ctx.user.id) || null,
				})
				.where(eq(pickLists.id, id));

			return { success: true };
		}),

	pickItem: protectedProcedure
		.input(
			z.object({
				itemId: z.string(),
				quantity: z.number(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// itemId format: ITEM-<pick_list_id>-<id>
			const parts = input.itemId.split("-");
			const id = Number.parseInt(parts[2], 10);
			if (Number.isNaN(id)) throw new Error("Invalid item ID");

			await db
				.update(pickListItems)
				.set({
					quantity_picked: input.quantity,
					status: "picked",
					picked_by: Number.parseInt(ctx.user.id) || null,
					picked_at: new Date(),
				})
				.where(eq(pickListItems.id, id));

			return { success: true };
		}),

	completePickList: protectedProcedure
		.input(z.object({ pickListId: z.string() }))
		.mutation(async ({ input }) => {
			const idStr = input.pickListId.replace("PL-", "");
			const id = Number.parseInt(idStr, 10);
			if (Number.isNaN(id)) throw new Error("Invalid pick list ID");

			await db
				.update(pickLists)
				.set({
					status: "completed",
					completed_at: new Date(),
				})
				.where(eq(pickLists.id, id));

			return { success: true };
		}),
});
