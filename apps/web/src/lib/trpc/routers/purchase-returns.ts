import {
	purchaseReturnItems,
	purchaseReturns,
	purchases,
} from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { purchaseReturnInsertSchema } from "@/lib/validation/purchase-return";
import { protectedProcedure, router } from "../init";

export const purchaseReturnsRouter = router({
	list: protectedProcedure.query(async () => {
		return await db.query.purchaseReturns.findMany({
			with: {
				purchase: true,
				supplier: true,
			},
			orderBy: (table: any, { desc }: any) => [desc(table.created_at)],
		});
	}),
	get: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			return await db.query.purchaseReturns.findFirst({
				where: eq(purchaseReturns.id, input.id),
				with: {
					returnItems: {
						with: { product: true },
					},
					purchase: true,
					supplier: true,
				},
			});
		}),
	create: protectedProcedure
		.input(purchaseReturnInsertSchema)
		.mutation(async ({ input, ctx }) => {
			const purchase = await db.query.purchases.findFirst({
				where: eq(purchases.id, input.purchase_id),
			});
			if (!purchase) throw new Error("Purchase not found");

			const [newReturn] = await db
				.insert(purchaseReturns)
				.values({
					purchase_id: input.purchase_id,
					supplier_id: purchase.supplier_id,
					total_amount: input.total_amount.toString(),
					status: input.status || "pending",
					user_uid: ctx.user.id,
				})
				.returning();

			if (input.items && input.items.length > 0) {
				await db.insert(purchaseReturnItems).values(
					input.items.map((item) => ({
						return_id: newReturn.id,
						product_id: item.product_id,
						quantity: item.quantity,
						refund_amount: item.price.toString(),
					})),
				);
			}
			return newReturn;
		}),
	update: protectedProcedure
		.input(purchaseReturnInsertSchema.extend({ id: z.number() }))
		.mutation(async ({ input, ctx }) => {
			const { id, items, ...updateData } = input;
			const [updatedReturn] = await db
				.update(purchaseReturns)
				.set({
					total_amount: input.total_amount.toString(),
					status: input.status,
				})
				.where(eq(purchaseReturns.id, id))
				.returning();

			return updatedReturn;
		}),
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db
				.delete(purchaseReturnItems)
				.where(eq(purchaseReturnItems.return_id, input.id));
			await db.delete(purchaseReturns).where(eq(purchaseReturns.id, input.id));
			return { success: true };
		}),
});
