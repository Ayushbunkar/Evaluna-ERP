import { productSlabPricing, products } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
	calculateEffectivePrice,
	type PricingSlab,
	validateSlabs,
} from "@/lib/pricing/slab-pricing";
import { protectedProcedure, publicProcedure, router } from "../init";

let hasEnsuredTable = false;

export async function ensureSlabPricingTable(db: any) {
	if (hasEnsuredTable) return;
	try {
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS product_slab_pricing (
				id SERIAL PRIMARY KEY,
				product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
				min_quantity NUMERIC(10, 3) NOT NULL,
				max_quantity NUMERIC(10, 3),
				unit_price NUMERIC(10, 2) NOT NULL,
				start_date VARCHAR(20),
				end_date VARCHAR(20),
				is_active BOOLEAN NOT NULL DEFAULT TRUE,
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW()
			);
			CREATE INDEX IF NOT EXISTS idx_product_slab_product_id ON product_slab_pricing (product_id);
			CREATE INDEX IF NOT EXISTS idx_product_slab_active ON product_slab_pricing (is_active);
			CREATE INDEX IF NOT EXISTS idx_product_slab_end_date ON product_slab_pricing (end_date);
		`);
		hasEnsuredTable = true;
	} catch (e) {
		// table already exists or DDL managed
	}
}

export const slabPricingRouter = router({
	/**
	 * Get slab pricing configured for a specific product
	 */
	getByProductId: publicProcedure
		.input(z.object({ productId: z.number() }))
		.query(async ({ ctx, input }) => {
			await ensureSlabPricingTable(ctx.db);

			const product = await ctx.db.query.products.findFirst({
				where: eq(products.id, input.productId),
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found.",
				});
			}

			const rawSlabs = await ctx.db
				.select()
				.from(productSlabPricing)
				.where(
					and(
						eq(productSlabPricing.product_id, input.productId),
						eq(productSlabPricing.is_active, true),
					),
				)
				.orderBy(asc(productSlabPricing.min_quantity));

			const slabs: PricingSlab[] = rawSlabs.map((s) => ({
				id: s.id,
				productId: s.product_id,
				minQuantity: Number(s.min_quantity),
				maxQuantity: s.max_quantity !== null ? Number(s.max_quantity) : null,
				unitPrice: Number(s.unit_price),
				startDate: s.start_date,
				endDate: s.end_date,
				isActive: s.is_active,
			}));

			const firstWithDates = slabs.find((s) => s.startDate || s.endDate);

			return {
				productId: input.productId,
				productName: product.name,
				sku: product.sku,
				regularPrice: Number(product.price || product.base_selling_price || 0),
				isEnabled: slabs.length > 0,
				startDate: firstWithDates?.startDate || null,
				endDate: firstWithDates?.endDate || null,
				slabs,
			};
		}),

	/**
	 * Save / Replace slab pricing for an individual product
	 */
	saveProductSlabs: protectedProcedure
		.input(
			z.object({
				productId: z.number(),
				isEnabled: z.boolean(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				slabs: z.array(
					z.object({
						minQuantity: z.number().min(0.001, "Min quantity must be positive"),
						maxQuantity: z.number().nullable().optional(),
						unitPrice: z.number().min(0.01, "Unit price must be positive"),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ensureSlabPricingTable(ctx.db);

			const product = await ctx.db.query.products.findFirst({
				where: eq(products.id, input.productId),
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found.",
				});
			}

			if (input.isEnabled && input.slabs.length > 0) {
				const validation = validateSlabs(input.slabs);
				if (!validation.valid) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: validation.error || "Invalid quantity slab intervals.",
					});
				}
			}

			return await ctx.db.transaction(async (tx) => {
				// Delete existing slabs for this product
				await tx
					.delete(productSlabPricing)
					.where(eq(productSlabPricing.product_id, input.productId));

				if (input.isEnabled && input.slabs.length > 0) {
					const sorted = [...input.slabs].sort(
						(a, b) => a.minQuantity - b.minQuantity,
					);

					for (const slab of sorted) {
						await tx.insert(productSlabPricing).values({
							product_id: input.productId,
							min_quantity: String(slab.minQuantity),
							max_quantity:
								slab.maxQuantity !== null && slab.maxQuantity !== undefined
									? String(slab.maxQuantity)
									: null,
							unit_price: Number(slab.unitPrice).toFixed(2),
							start_date: input.startDate || null,
							end_date: input.endDate || null,
							is_active: true,
						});
					}
				}

				return {
					success: true,
					count: input.isEnabled ? input.slabs.length : 0,
					isEnabled: input.isEnabled && input.slabs.length > 0,
				};
			});
		}),

	/**
	 * Bulk configure slabs for multiple products
	 */
	bulkSaveProductSlabs: protectedProcedure
		.input(
			z.object({
				productIds: z.array(z.number()).min(1),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				slabs: z.array(
					z.object({
						minQuantity: z.number().min(0.001),
						maxQuantity: z.number().nullable().optional(),
						unitPrice: z.number().min(0.01),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ensureSlabPricingTable(ctx.db);

			const validation = validateSlabs(input.slabs);
			if (!validation.valid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: validation.error || "Invalid quantity slab intervals.",
				});
			}

			return await ctx.db.transaction(async (tx) => {
				// Remove old slabs for these products
				await tx
					.delete(productSlabPricing)
					.where(inArray(productSlabPricing.product_id, input.productIds));

				const sorted = [...input.slabs].sort(
					(a, b) => a.minQuantity - b.minQuantity,
				);

				for (const pid of input.productIds) {
					for (const slab of sorted) {
						await tx.insert(productSlabPricing).values({
							product_id: pid,
							min_quantity: String(slab.minQuantity),
							max_quantity:
								slab.maxQuantity !== null && slab.maxQuantity !== undefined
									? String(slab.maxQuantity)
									: null,
							unit_price: Number(slab.unitPrice).toFixed(2),
							start_date: input.startDate || null,
							end_date: input.endDate || null,
							is_active: true,
						});
					}
				}

				return {
					success: true,
					productsUpdated: input.productIds.length,
				};
			});
		}),

	/**
	 * Calculate effective price for a line quantity
	 */
	calculatePrice: publicProcedure
		.input(
			z.object({
				productId: z.number(),
				quantity: z.number().min(0.001),
				date: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			await ensureSlabPricingTable(ctx.db);

			const product = await ctx.db.query.products.findFirst({
				where: eq(products.id, input.productId),
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found.",
				});
			}

			const regularPrice = Number(product.price || product.base_selling_price || 0);

			const rawSlabs = await ctx.db
				.select()
				.from(productSlabPricing)
				.where(
					and(
						eq(productSlabPricing.product_id, input.productId),
						eq(productSlabPricing.is_active, true),
					),
				)
				.orderBy(asc(productSlabPricing.min_quantity));

			const slabs: PricingSlab[] = rawSlabs.map((s) => ({
				id: s.id,
				productId: s.product_id,
				minQuantity: Number(s.min_quantity),
				maxQuantity: s.max_quantity !== null ? Number(s.max_quantity) : null,
				unitPrice: Number(s.unit_price),
				startDate: s.start_date,
				endDate: s.end_date,
				isActive: s.is_active,
			}));

			return calculateEffectivePrice({
				regularPrice,
				slabs,
				quantity: input.quantity,
				targetDate: input.date,
			});
		}),
});
