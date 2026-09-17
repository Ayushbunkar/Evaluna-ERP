import {
	branchInventory,
	priceChangeHistory,
	products,
} from "@evaluna/db/schema";
import { and, asc, count, eq, ilike, inArray, isNotNull, or, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "@/lib/trpc/init";
import { logAudit, resolveStaffId } from "../util/audit";
import { permProcedure } from "../util/auditor-procedures";

export const productsRouter = router({
	getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
		// Run consolidated SQL aggregations directly in the database
		const [[productAgg], [lowStockAgg]] = await Promise.all([
			db
				.select({
					totalProducts: count(),
					activeProducts: sql<number>`coalesce(count(*) filter (where ${products.is_hidden} = false), 0)::int`,
					productsWithBarcodes: sql<number>`coalesce(count(*) filter (where ${products.barcode} is not null and trim(${products.barcode}) != ''), 0)::int`,
				})
				.from(products)
				.where(eq(products.is_deleted, false)),

			db
				.select({
					count: count(),
				})
				.from(
					db
						.select({
							id: products.id,
							totalStock: sql<number>`coalesce(sum(${branchInventory.in_stock}), 0)`,
						})
						.from(products)
						.leftJoin(branchInventory, eq(products.id, branchInventory.product_id))
						.where(eq(products.is_deleted, false))
						.groupBy(products.id)
						.having(sql`coalesce(sum(${branchInventory.in_stock}), 0) <= 10`)
						.as("low_stock_subquery"),
				),
		]);

		return {
			totalProducts: Number(productAgg?.totalProducts ?? 0),
			activeProducts: Number(productAgg?.activeProducts ?? 0),
			productsWithBarcodes: Number(productAgg?.productsWithBarcodes ?? 0),
			lowStockProducts: Number(lowStockAgg?.count ?? 0),
		};
	}),

	list: protectedProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					category: z.string().optional(),
					status: z.string().optional(),
					limit: z.number().int().min(1).max(500).optional(),
					offset: z.number().int().min(0).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const branchId = ctx.user?.branchId ?? null;
			const { search, category, status, limit, offset } = input || {};

			const conditions = [eq(products.is_deleted, false)];

			if (status === "active") {
				conditions.push(eq(products.is_hidden, false));
			} else if (status === "inactive") {
				conditions.push(eq(products.is_hidden, true));
			}

			if (category && category !== "all") {
				conditions.push(eq(products.category, category));
			}

			if (search?.trim()) {
				const term = `%${search.trim().toLowerCase()}%`;
				conditions.push(
					or(
						ilike(products.name, term),
						ilike(products.sku, term),
						ilike(products.barcode, term),
					)!,
				);
			}

			const inventoryJoinCondition = branchId
				? and(
						eq(products.id, branchInventory.product_id),
						eq(branchInventory.branch_id, branchId),
					)
				: eq(products.id, branchInventory.product_id);

			let query = db
				.select({
					id: products.id,
					name: products.name,
					sku: products.sku,
					category: products.category,
					baseProcurementPrice: products.base_procurement_price,
					baseSellingPrice: products.base_selling_price,
					visibilityLevel: products.visibility_level,
					isHidden: products.is_hidden,
					stock: sql<number>`coalesce(sum(${branchInventory.in_stock}), 0)::int`,
				})
				.from(products)
				.leftJoin(branchInventory, inventoryJoinCondition)
				.where(and(...conditions))
				.groupBy(
					products.id,
					products.name,
					products.sku,
					products.category,
					products.base_procurement_price,
					products.base_selling_price,
					products.visibility_level,
					products.is_hidden,
				)
				.orderBy(asc(products.name));

			if (limit !== undefined) {
				query = query.limit(limit) as any;
			}
			if (offset !== undefined) {
				query = query.offset(offset) as any;
			}

			const rows = await query;

			return rows.map((p) => {
				const bp = Number.parseFloat((p.baseProcurementPrice as string) || "0");
				const sp = Number.parseFloat((p.baseSellingPrice as string) || "0");
				return {
					id: p.id,
					name: p.name,
					sku: p.sku || "",
					category: p.category || "General",
					baseProcurementPrice: bp,
					baseSellingPrice: sp,
					margin: bp && sp ? Math.round(((sp - bp) / sp) * 100) : 0,
					visibilityLevel: p.visibilityLevel || "global",
					status: p.isHidden ? "inactive" : "active",
					stock: Number(p.stock) || 0,
				};
			});
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
						newValues: {
							price: updates.price,
							reason: priceChangeReason ?? null,
						},
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
