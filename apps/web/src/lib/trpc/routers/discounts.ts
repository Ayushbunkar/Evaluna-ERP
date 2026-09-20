import {
	branchInventory,
	dailyProductDiscounts,
	priceChangeHistory,
	products,
} from "@evaluna/db/schema";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "@/lib/trpc/init";
import { resolveStaffId } from "../util/audit";

export const discountsRouter = router({
	/**
	 * List all products along with any daily discount/offer for a given date.
	 */
	listDailyOffers: protectedProcedure
		.input(
			z
				.object({
					date: z.string().optional(), // 'YYYY-MM-DD', default today
					search: z.string().optional(),
					category: z.string().optional(),
					status: z.enum(["all", "active", "no_offer"]).optional(),
					branchId: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const targetDate =
				input?.date || new Date().toISOString().split("T")[0];
			const search = input?.search?.trim()?.toLowerCase();
			const category = input?.category;
			const branchId = input?.branchId || ctx.user?.branchId || 1;

			// Fetch all active products
			const prodConditions = [
				or(eq(products.is_deleted, false), sql`${products.is_deleted} IS NULL`),
			];
			if (search) {
				const term = `%${search}%`;
				prodConditions.push(
					or(
						ilike(products.name, term),
						ilike(products.sku, term),
						ilike(products.barcode, term),
						ilike(products.category, term),
					)!,
				);
			}
			if (category && category !== "all") {
				prodConditions.push(eq(products.category, category));
			}

			const productRows = await db
				.select({
					id: products.id,
					name: products.name,
					sku: products.sku,
					category: products.category,
					price: products.price,
					baseSellingPrice: products.base_selling_price,
					unit: products.unit,
					barcode: products.barcode,
					stock: sql<number>`coalesce(sum(${branchInventory.in_stock}), 0)::int`,
				})
				.from(products)
				.leftJoin(
					branchInventory,
					and(
						eq(products.id, branchInventory.product_id),
						eq(branchInventory.branch_id, branchId),
					),
				)
				.where(and(...prodConditions))
				.groupBy(
					products.id,
					products.name,
					products.sku,
					products.category,
					products.price,
					products.base_selling_price,
					products.unit,
					products.barcode,
				)
				.orderBy(asc(products.name));

			// Fetch daily discounts active for targetDate
			const discountRows = await db
				.select()
				.from(dailyProductDiscounts)
				.where(
					and(
						eq(dailyProductDiscounts.effective_date, targetDate),
						eq(dailyProductDiscounts.is_active, true),
					),
				);

			const discountMap = new Map<number, (typeof discountRows)[0]>();
			for (const disc of discountRows) {
				discountMap.set(disc.product_id, disc);
			}

			return productRows.map((p) => {
				const originalPriceNum = Number.parseFloat(p.price || "0");
				const activeDiscount = discountMap.get(p.id);

				const hasActiveOffer = !!activeDiscount && activeDiscount.is_active;
				const offerPriceNum = hasActiveOffer
					? Number.parseFloat(activeDiscount.discounted_price || "0")
					: originalPriceNum;
				const discountPercent =
					hasActiveOffer && originalPriceNum > 0
						? Number.parseFloat(
								activeDiscount.discount_percent ||
									(
										((originalPriceNum - offerPriceNum) / originalPriceNum) *
										100
									).toFixed(1),
							)
						: 0;

				return {
					id: p.id,
					name: p.name,
					sku: p.sku || "N/A",
					category: p.category || "General",
					originalPrice: originalPriceNum,
					currentPrice: hasActiveOffer ? offerPriceNum : originalPriceNum,
					unit: p.unit || "Pcs",
					barcode: p.barcode || "",
					stock: p.stock || 0,
					hasActiveOffer,
					offer: activeDiscount
						? {
								id: activeDiscount.id,
								discountedPrice: offerPriceNum,
								discountPercent,
								discountType: activeDiscount.discount_type || "fixed_price",
								discountValue: activeDiscount.discount_value
									? Number.parseFloat(activeDiscount.discount_value)
									: 0,
								effectiveDate: activeDiscount.effective_date,
								endDate: activeDiscount.end_date,
								reason: activeDiscount.reason,
								notes: activeDiscount.notes,
								isActive: activeDiscount.is_active,
							}
						: null,
				};
			});
		}),

	/**
	 * Get summary metrics for daily offers on a specific date.
	 */
	getDailyOfferStats: protectedProcedure
		.input(
			z
				.object({
					date: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const targetDate =
				input?.date || new Date().toISOString().split("T")[0];

			const activeOffers = await db
				.select({
					id: dailyProductDiscounts.id,
					originalPrice: dailyProductDiscounts.original_price,
					discountedPrice: dailyProductDiscounts.discounted_price,
					discountPercent: dailyProductDiscounts.discount_percent,
				})
				.from(dailyProductDiscounts)
				.where(
					and(
						eq(dailyProductDiscounts.effective_date, targetDate),
						eq(dailyProductDiscounts.is_active, true),
					),
				);

			const totalOffers = activeOffers.length;
			let totalSavingsPerUnit = 0;
			let sumPercent = 0;

			for (const off of activeOffers) {
				const orig = Number.parseFloat(off.originalPrice || "0");
				const disc = Number.parseFloat(off.discountedPrice || "0");
				totalSavingsPerUnit += Math.max(0, orig - disc);
				sumPercent += Number.parseFloat(off.discountPercent || "0");
			}

			const avgDiscountPercent =
				totalOffers > 0 ? (sumPercent / totalOffers).toFixed(1) : "0";

			return {
				date: targetDate,
				totalActiveOffers: totalOffers,
				avgDiscountPercent: Number.parseFloat(avgDiscountPercent),
				totalSavingsPerUnit: Number.parseFloat(totalSavingsPerUnit.toFixed(2)),
			};
		}),

	/**
	 * Set or update a daily discount offer for a product on a specific date with mandatory reason.
	 */
	setDailyOffer: protectedProcedure
		.input(
			z.object({
				productId: z.number(),
				branchId: z.number().optional().default(1),
				effectiveDate: z.string(), // 'YYYY-MM-DD'
				endDate: z.string().optional().nullable(),
				discountType: z
					.enum(["fixed_price", "percentage", "flat_off"])
					.default("fixed_price"),
				discountValue: z.number().min(0),
				offerPrice: z.number().min(0),
				reason: z.string().min(2, "Reason is required to set discount offer"),
				notes: z.string().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const {
				productId,
				branchId,
				effectiveDate,
				endDate,
				discountType,
				discountValue,
				offerPrice,
				reason,
				notes,
			} = input;

			return await db.transaction(async (tx) => {
				// 1. Fetch current product base price
				const [product] = await tx
					.select({
						id: products.id,
						name: products.name,
						price: products.price,
						baseSellingPrice: products.base_selling_price,
					})
					.from(products)
					.where(eq(products.id, productId))
					.limit(1);

				if (!product) {
					throw new Error("Product not found");
				}

				const originalPriceNum = Number.parseFloat(product.price || "0");
				const discountPercent =
					originalPriceNum > 0
						? Math.max(
								0,
								((originalPriceNum - offerPrice) / originalPriceNum) * 100,
							)
						: 0;

				// 2. Check if an offer already exists for this product and date
				const [existingOffer] = await tx
					.select()
					.from(dailyProductDiscounts)
					.where(
						and(
							eq(dailyProductDiscounts.product_id, productId),
							eq(dailyProductDiscounts.effective_date, effectiveDate),
						),
					)
					.limit(1);

				let savedOffer;
				if (existingOffer) {
					const [updated] = await tx
						.update(dailyProductDiscounts)
						.set({
							branch_id: branchId,
							original_price: originalPriceNum.toFixed(2),
							discounted_price: offerPrice.toFixed(2),
							discount_percent: discountPercent.toFixed(2),
							discount_type: discountType,
							discount_value: discountValue.toFixed(2),
							end_date: endDate || null,
							reason,
							notes: notes || null,
							is_active: true,
							created_by_uid: ctx.user.id,
						})
						.where(eq(dailyProductDiscounts.id, existingOffer.id))
						.returning();
					savedOffer = updated;
				} else {
					const [inserted] = await tx
						.insert(dailyProductDiscounts)
						.values({
							product_id: productId,
							branch_id: branchId,
							original_price: originalPriceNum.toFixed(2),
							discounted_price: offerPrice.toFixed(2),
							discount_percent: discountPercent.toFixed(2),
							discount_type: discountType,
							discount_value: discountValue.toFixed(2),
							effective_date: effectiveDate,
							end_date: endDate || null,
							reason,
							notes: notes || null,
							is_active: true,
							created_by_uid: ctx.user.id,
						})
						.returning();
					savedOffer = inserted;
				}

				// 3. Log into price change audit log
				try {
					const staffId = await resolveStaffId(tx, ctx.user.email);
					await tx.insert(priceChangeHistory).values({
						product_id: productId,
						price_field: "daily_offer_price",
						old_price: originalPriceNum.toFixed(2),
						new_price: offerPrice.toFixed(2),
						changed_by: staffId,
						changed_by_uid: ctx.user.id ?? null,
						reason: `[Daily Offer - ${effectiveDate}] ${reason}`,
						source: "warehouse_manager",
					});
				} catch (e) {
					console.warn("Failed to log priceChangeHistory:", e);
				}

				return savedOffer;
			});
		}),

	/**
	 * Remove / Deactivate a daily offer for a product
	 */
	removeDailyOffer: protectedProcedure
		.input(
			z.object({
				offerId: z.number().optional(),
				productId: z.number().optional(),
				date: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { offerId, productId, date } = input;

			if (offerId) {
				await db
					.update(dailyProductDiscounts)
					.set({ is_active: false })
					.where(eq(dailyProductDiscounts.id, offerId));
			} else if (productId && date) {
				await db
					.update(dailyProductDiscounts)
					.set({ is_active: false })
					.where(
						and(
							eq(dailyProductDiscounts.product_id, productId),
							eq(dailyProductDiscounts.effective_date, date),
						),
					);
			} else {
				throw new Error("offerId or productId + date must be provided");
			}

			return { success: true };
		}),
});
