import { products } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "@/lib/trpc/init";

export const productsRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		// Basic RBAC: If not admin, maybe filter by visibility. For now, fetch all active products.
		// In a full implementation, we would check ctx.user.role here.
		const allProducts = await db
			.select()
			.from(products)
			.where(eq(products.is_deleted, false));

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
			stock: 100, // TODO: Pull from inventory stock view
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

	update: protectedProcedure
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
			}),
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const updates: any = { ...data };
			if (data.price !== undefined) updates.price = data.price.toString();

			const [product] = await db
				.update(products)
				.set(updates)
				.where(eq(products.id, id))
				.returning();
			return product;
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
			for (const id of input.ids) {
				await db
					.update(products)
					.set({ is_deleted: true })
					.where(eq(products.id, id));
			}
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
			// In a real scenario, this would use a bulk insert db.insert(products).values(arrayOfObjects)
			let count = 0;
			for (const p of input.products) {
				await db.insert(products).values({
					name: p.name,
					sku: p.sku,
					description: p.name,
					base_procurement_price: p.base_procurement_price.toString(),
					base_selling_price: p.base_selling_price.toString(),
					price: p.base_selling_price.toString(),
					category: p.category,
					user_uid: ctx.user.id,
				});
				count++;
			}
			return { success: true, count };
		}),
});
