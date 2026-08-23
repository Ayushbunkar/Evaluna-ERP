import { priceChangeHistory, products, branchInventory } from "@evaluna/db/schema";
import { eq, inArray, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "@/lib/trpc/init";
import { logAudit, resolveStaffId } from "../util/audit";
import { permProcedure } from "../util/auditor-procedures";

export const productsRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		// Basic RBAC: If not admin, maybe filter by visibility. For now, fetch all active products.
		// In a full implementation, we would check ctx.user.role here.
		const allProducts = await db
			.select()
			.from(products)
			.where(eq(products.is_deleted, false));

		// Get total stock per product from branchInventory
		const stockMap = new Map<number, number>();
		const stockResults = await db
			.select({
				productId: branchInventory.product_id,
				totalStock: sum(branchInventory.in_stock),
			})
			.from(branchInventory)
			.where(eq(branchInventory.is_deleted, false)) // Assuming is_deleted exists? We don't see it in branchInventory schema, but we can check.
			.groupBy(branchInventory.product_id);

		stockResults.forEach((row) => {
			stockMap.set(row.productId, Number(row.totalStock) || 0);
		});

		// Map to the format the UI expects, ensuring numbers are correctly parsed from decimals
		return allProducts.map((p: any) => ({
			id: p.id,
			name: p.name,
			sku: p.sku || "",
			category: p.category || "General",
			baseProcurementPrice:
				Number.parseFloat(p.base_procurement_price as string) || 0,
			baseSellingPrice: Number.parseFloat(p.base_selling_price as string) || 0,
			margin:
				p.base_procurement_price && p.base_selling_price
					? Math.round(
							((Number.parseFloat(p.base_selling_price as string) -
								Number.parseFloat(p.base_procurement_price as string)) /
								Number.parseFloat(p.base_selling_price as string)) *
								100,
						)
					: 0,
			visibilityLevel: p.visibility_level || "global",
			status: p.is_hidden ? "inactive" : "active",
			stock: stockMap.get(p.id) ?? 0, // Pull from inventory stock view
		}));
	}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().optional(),
				price: z.number(),
				category: z.string().optional(),
				barcode: z.string().optional(),
				sku: z.string().optional(),
				unit: z.string().optional(),
				is_pack: z.boolean().default(false),
				loose_product_id: z.number().optional().nullable(),
				units_per_pack: z.number().optional().nullable(),
				is_weighted: z.boolean().default(false),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const [product] = await db
				.insert(products)
				.values({
					name: input.name,
					description: input.description,
					price: input.price.toString(),
					user_uid: ctx.user.id,
					category: input.category,
					barcode: input.barcode,
					sku: input.sku,
					unit: input.unit,
					is_pack: input.is_pack,
					loose_product_id: input.loose_product_id,
					units_per_pack: input.units_per_pack,
					is_weighted: input.is_weighted,
				})
				.returning();
			return product;
		}),

	// Gated by `products.write` (manager/admin). Auditors have pricing_audit
	// (flag-only) but NOT products.write, so they cannot edit a price here.
	update: permProcedure("products", "write")
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				price: z.number().optional(),
				category: z.string().optional(),
				barcode: z.string().optional(),
				sku: z.string().optional(),
				unit: z.string().optional(),
				is_pack: z.boolean().optional(),
				loose_product_id: z.number().optional().nullable(),
				units_per_pack: z.number().optional().nullable(),
				is_weighted: z.boolean().optional(),
				// Optional provenance for the immutable price-change log.
				priceChangeReason: z.string().optional(),
				approvalRef: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { id, priceChangeReason, approvalRef, ...data } = input;
			const updates: any = { ...data };
			// These are audit-only fields, never columns on `products`.
			delete updates.priceChangeReason;
			delete updates.approvalRef;
			if (data.price !== undefined) updates.price = data.price.toString();

			const staffId = await resolveStaffId(db, ctx.user.email);
			return await db.transaction(async (tx: any) => {
				// Snapshot the old price BEFORE the update so the log is accurate.
				const [before] = await tx
					.select({ price: products.price })
					.from(products)
					.where(eq(products.id, id))
					.limit(1);

				const [product] = await tx
					.update(products)
					.set(updates)
					.where(eq(products.id, id))
					.returning();

				// Append-only price-change history + audit trail when price changed.
				if (
					data.price !== undefined &&
					before &&
					String(before.price) !== updates.price
				) {
					await tx.insert(priceChangeHistory).values({
						product_id: id,
						price_field: "price",
						old_price: before.price ?? null,
						new_price: updates.price,
						changed_by: staffId,
						changed_by_uid: ctx.user.id ?? null,
						reason: priceChangeReason ?? null,
						approval_ref: approvalRef ?? null,
						source: "manual",
					});
					await logAudit(tx, {
						userId: staffId,
						action: "PRODUCT_PRICE_CHANGE",
						entityType: "products",
						entityId: id,
						oldValues: { price: before.price ?? null },
						newValues: { price: updates.price, reason: priceChangeReason ?? null },
					});
				}
				return product;
			});
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db
				.update(products)
				.set({ is_deleted: true })
				.where(eq(products.id, input.id));
			return { success: true };
		}),

	bulkDelete: protectedProcedure
		.input(z.object({ ids: z.array(z.number()) }))
		.mutation(async ({ input }) => {
			if (input.ids.length === 0) return { success: true, count: 0 };
			await db
				.update(products)
				.set({ is_deleted: true })
				.where(inArray(products.id, input.ids));
			return { success: true, count: input.ids.length };
		}),

	importBulk: protectedProcedure
		.input(
			z.object({
				products: z.array(
					z.object({
						name: z.string(),
						sku: z.string(),
						category: z.string(),
						base_procurement_price: z.number(),
						base_selling_price: z.number(),
					}),
				),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			if (input.products.length === 0) return { success: true, count: 0 };
			// Batch insert all products in a single query
			await db.insert(products).values(
				input.products.map((p) => ({
					name: p.name,
					sku: p.sku,
					description: p.name,
					base_procurement_price: p.base_procurement_price.toString(),
					base_selling_price: p.base_selling_price.toString(),
					price: p.base_selling_price.toString(),
					category: p.category,
					user_uid: ctx.user.id,
				})),
			);
			return { success: true, count: input.products.length };
		}),
});
