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
				createdAt: pl.created_at?.toISOString() ?? new Date().toISOString(),
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
});
