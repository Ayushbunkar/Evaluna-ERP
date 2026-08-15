import {
	branchInventory,
	products,
	purchaseItems,
	purchaseReturnItems,
	purchaseReturns,
	purchases,
	stockLedger,
	suppliers,
} from "@evaluna/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { purchaseSchema } from "@/lib/validation/purchase";
import { protectedProcedure, router } from "../init";

export const purchasesRouter = router({
	create: protectedProcedure
		.input(purchaseSchema)
		.mutation(async ({ input, ctx }) => {
			const {
				items,
				id,
				createdAt,
				updatedAt,
				supplierId,
				total,
				...purchaseData
			} = input;

			const grn = `GRN-${Math.floor(10000 + Math.random() * 90000)}`;

			const newPurchase = await db
				.insert(purchases)
				.values({
					...purchaseData,
					supplier_id: Number.parseInt(supplierId, 10),
					total_amount: total.toString(),
					user_uid: ctx.user.id,
					grn_number: grn,
					amount_paid: "0",
					payment_status: "unpaid",
				})
				.returning();

			if (newPurchase[0] && items) {
				// Insert purchase items (batch)
				await db.insert(purchaseItems).values(
					items.map((item) => ({
						...item,
						purchase_id: newPurchase[0].id,
						product_id: Number.parseInt(item.productId, 10),
						price: item.price.toString(),
					})),
				);

				// Batch fetch all products at once, then insert ledger entries in one query
				const productIds = items.map((item) => Number.parseInt(item.productId, 10));
				const foundProducts = await db.query.products.findMany({
					where: inArray(products.id, productIds),
				});
				const productMap = new Map(foundProducts.map((p) => [p.id, p]));

				const ledgerEntries = items
					.map((item) => {
						const product = productMap.get(Number.parseInt(item.productId, 10));
						if (!product) return null;
						return {
							product_id: product.id,
							transaction_type: "in" as const,
							quantity: item.quantity,
							unit_cost: item.price.toString(),
							total_cost: (item.quantity * Number(item.price)).toString(),
						};
					})
					.filter(Boolean) as any[];

				if (ledgerEntries.length > 0) {
					await db.insert(stockLedger).values(ledgerEntries);
				}

				// Increase supplier outstanding balance
				const supplier = await db.query.suppliers.findFirst({
					where: eq(suppliers.id, Number.parseInt(supplierId, 10)),
				});
				if (supplier) {
					const newBalance =
						Number.parseFloat(supplier.outstanding_balance || "0") + total;
					await db
						.update(suppliers)
						.set({ outstanding_balance: newBalance.toString() })
						.where(eq(suppliers.id, supplier.id));
				}
			}

			return newPurchase[0];
		}),

	list: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(10),
				cursor: z.number().nullish(),
			}),
		)
		.query(async ({ input }) => {
			const limit = input.limit ?? 10;
			const cursor = input.cursor ?? null;

			const items = await db.query.purchases.findMany({
				limit: limit + 1,
				offset: cursor ? cursor * limit : 0,
				with: {
					supplier: true,
				},
			});

			let nextCursor: typeof cursor | undefined;
			if (items.length > limit) {
				items.pop();
				nextCursor = (cursor ?? 0) + 1;
			}
			return {
				items,
				nextCursor,
			};
		}),

	get: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const purchase = await db.query.purchases.findFirst({
				where: eq(purchases.id, input.id),
				with: {
					purchaseItems: true,
					supplier: true,
				},
			});
			return purchase;
		}),

	processReturn: protectedProcedure
		.input(
			z.object({
				purchase_id: z.number(),
				items: z.array(
					z.object({
						product_id: z.number(),
						quantity: z.number(),
						refund_amount: z.number(),
					}),
				),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const purchase = await db.query.purchases.findFirst({
				where: eq(purchases.id, input.purchase_id),
			});
			if (!purchase) throw new Error("Purchase not found");

			const totalRefund = input.items.reduce(
				(acc, curr) => acc + curr.refund_amount,
				0,
			);

			const [newReturn] = await db
				.insert(purchaseReturns)
				.values({
					purchase_id: purchase.id,
					supplier_id: purchase.supplier_id,
					total_amount: totalRefund.toString(),
					status: "processed",
					user_uid: ctx.user.id,
				})
				.returning();

			for (const item of input.items) {
				await db.insert(purchaseReturnItems).values({
					return_id: newReturn.id,
					product_id: item.product_id,
					quantity: item.quantity,
					refund_amount: item.refund_amount.toString(),
				});

				// Deduct from inventory
				const inv = await db.query.branchInventory.findFirst({
					where: eq(branchInventory.product_id, item.product_id),
				});
				if (inv) {
					const newStock = Math.max(0, inv.in_stock - item.quantity);
					await db
						.update(branchInventory)
						.set({ in_stock: newStock })
						.where(eq(branchInventory.id, inv.id));

					await db.insert(stockLedger).values({
						product_id: item.product_id,
						transaction_type: "out",
						quantity: item.quantity,
						unit_cost: "0", // Should calculate
						total_cost: item.refund_amount.toString(),
					});
				}
			}

			// Decrease supplier outstanding balance
			const supplier = await db.query.suppliers.findFirst({
				where: eq(suppliers.id, purchase.supplier_id),
			});
			if (supplier) {
				const newBalance =
					Number.parseFloat(supplier.outstanding_balance || "0") - totalRefund;
				await db
					.update(suppliers)
					.set({ outstanding_balance: newBalance.toString() })
					.where(eq(suppliers.id, supplier.id));
			}

			return newReturn;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db
				.delete(purchaseItems)
				.where(eq(purchaseItems.purchase_id, input.id));
			await db.delete(purchases).where(eq(purchases.id, input.id));
			return { id: input.id };
		}),
});
