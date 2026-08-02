import {
	branches,
	branchInventory,
	productBatches,
	productConversions,
	products,
} from "@evaluna/db/schema";
import { and, count, desc, eq, lte, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { stockLedger } from "@/lib/db/schema";
import { publicProcedure, roleProcedure, router } from "@/lib/trpc/init";

export const inventoryRouter = router({
	listByProduct: publicProcedure
		.input(
			z.object({ productId: z.number(), locationId: z.number().optional() }),
		)
		.query(async ({ ctx, input }) => {
			const ledger = await ctx.db
				.select()
				.from(stockLedger)
				.where(
					and(
						input.productId
							? eq(stockLedger.product_id, input.productId)
							: undefined,
						input.locationId
							? eq(stockLedger.reference_id, input.locationId)
							: undefined,
					),
				)
				.orderBy(desc(stockLedger.created_at))
				.limit(100);

			return ledger;
		}),

	list: publicProcedure
		.input(
			z.object({
				search: z.string().optional(),
				limit: z.number().optional(),
				offset: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { limit, offset } = input || {};
			const db = ctx.db;

			const data = await db
				.select({
					id: branchInventory.id,
					product: products.name,
					sku: products.sku,
					branch: branches.name,
					qty_on_hand: branchInventory.in_stock,
					reorder_level: branchInventory.reorder_level,
					status: sql<string>`
          CASE
            WHEN ${branchInventory.in_stock} <= 0 THEN 'out_of_stock'
            WHEN ${branchInventory.in_stock} <= ${branchInventory.reorder_level} THEN 'low_stock'
            ELSE 'in_stock'
          END
        `,
				})
				.from(branchInventory)
				.leftJoin(products, eq(branchInventory.product_id, products.id))
				.leftJoin(branches, eq(branchInventory.branch_id, branches.id))
				.limit(limit || 50)
				.offset(offset || 0);

			const countResult = await db
				.select({ val: count() })
				.from(branchInventory);

			return {
				items: data.map((d) => ({
					...d,
					product: d.product || "Unknown",
					sku: d.sku || "N/A",
					branch: d.branch || "Unknown",
				})),
				total: Number(countResult[0]?.val) || 0,
			};
		}),

	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const [ledger] = await ctx.db
				.select()
				.from(stockLedger)
				.where(eq(stockLedger.id, input.id));

			if (!ledger) {
				throw new Error("Ledger not found");
			}

			return ledger;
		}),

	convertPackToLoose: roleProcedure(["admin", "manager", "picker", "putter"])
		.input(
			z.object({
				packProductId: z.number(),
				packsToConvert: z.number().min(1),
				branchId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx) => {
				// 1. Get the pack product
				const [pack] = await tx
					.select()
					.from(products)
					.where(eq(products.id, input.packProductId));
				if (!pack?.is_pack || !pack.loose_product_id) {
					throw new Error("Invalid pack product selected for conversion.");
				}

				const looseProductId = pack.loose_product_id;
				const unitsPerPack = pack.units_per_pack || 1;
				const looseYielded = input.packsToConvert * unitsPerPack;

				// 2. Decrease pack inventory
				const packStock = await tx
					.select()
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.branch_id, input.branchId),
							eq(branchInventory.product_id, pack.id),
						),
					);
				if (packStock.length > 0) {
					await tx
						.update(branchInventory)
						.set({
							in_stock: sql`${branchInventory.in_stock} - ${input.packsToConvert}`,
						})
						.where(eq(branchInventory.id, packStock[0].id));
				} else {
					throw new Error(
						"No inventory found for the pack product in this branch.",
					);
				}

				// 3. Increase loose inventory
				const looseStock = await tx
					.select()
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.branch_id, input.branchId),
							eq(branchInventory.product_id, looseProductId),
						),
					);
				if (looseStock.length > 0) {
					await tx
						.update(branchInventory)
						.set({
							in_stock: sql`${branchInventory.in_stock} + ${looseYielded}`,
						})
						.where(eq(branchInventory.id, looseStock[0].id));
				} else {
					await tx.insert(branchInventory).values({
						branch_id: input.branchId,
						product_id: looseProductId,
						in_stock: looseYielded,
					});
				}

				// 4. Log conversion
				await tx.insert(productConversions).values({
					branch_id: input.branchId,
					pack_product_id: pack.id,
					loose_product_id: looseProductId,
					packs_converted: input.packsToConvert,
					loose_yielded: looseYielded,
					converted_by: parseInt(ctx.user.id) || null,
				});

				// 5. Ledger entries
				await tx.insert(stockLedger).values([
					{
						product_id: pack.id,
						transaction_type: "out",
						quantity: -input.packsToConvert,
						reference_type: "conversion",
						branch_id: input.branchId,
						unit_cost: "0",
						total_cost: "0",
					},
					{
						product_id: looseProductId,
						transaction_type: "in",
						quantity: looseYielded,
						reference_type: "conversion",
						branch_id: input.branchId,
						unit_cost: "0",
						total_cost: "0",
					},
				]);

				return { success: true, looseYielded };
			});
		}),

	create: publicProcedure.mutation(async ({ ctx }) => {
		// TODO: Implement create inventory entry
		return { success: true };
	}),

	update: publicProcedure.mutation(async ({ ctx }) => {
		// TODO: Implement update inventory entry
		return { success: true };
	}),

	delete: publicProcedure.mutation(async ({ ctx }) => {
		// TODO: Implement delete inventory entry
		return { success: true };
	}),

	getDashboardStats: roleProcedure(["admin", "manager", "auditor"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const totalProds = await db.select({ count: count() }).from(products);

			const invStats = await db
				.select({
					value: sum(sql`${branchInventory.in_stock} * ${products.price}`),
				})
				.from(branchInventory)
				.leftJoin(products, eq(branchInventory.product_id, products.id));

			const lowStock = await db
				.select({ count: count() })
				.from(branchInventory)
				.where(
					sql`${branchInventory.in_stock} > 0 AND ${branchInventory.in_stock} <= ${branchInventory.reorder_level}`,
				);

			const expDate = new Date();
			expDate.setDate(expDate.getDate() + 30);
			const expiring = await db
				.select({ count: count() })
				.from(productBatches)
				.where(lte(productBatches.expiry_date, expDate));

			const deadStock = await db
				.select({ count: count() })
				.from(branchInventory)
				.where(eq(branchInventory.in_stock, 0));

			const branchStockList = await db
				.select({
					name: branches.name,
					stock: sum(branchInventory.in_stock),
				})
				.from(branchInventory)
				.leftJoin(branches, eq(branchInventory.branch_id, branches.id))
				.groupBy(branches.name)
				.limit(5);

			const recentMv = await db
				.select({
					id: stockLedger.id,
					type: stockLedger.transaction_type,
					product: products.name,
					qty: stockLedger.quantity,
					time: stockLedger.created_at,
				})
				.from(stockLedger)
				.leftJoin(products, eq(stockLedger.product_id, products.id))
				.orderBy(desc(stockLedger.created_at))
				.limit(5);

			return {
				inventoryValue: Number(invStats[0]?.value) || 0,
				totalProducts: totalProds[0]?.count || 0,
				lowStockItems: lowStock[0]?.count || 0,
				expiringSoon: expiring[0]?.count || 0,
				deadStock: deadStock[0]?.count || 0,
				stockAccuracy: 98.4,
				averageStockDays: 45,

				inventoryTrend: [],
				categoryDistribution: [],
				abcAnalysis: [],
				warehouseDistribution: branchStockList.map((b) => ({
					name: b.name || "Unknown",
					stock: Number(b.stock) || 0,
				})),
				topMovingItems: [],
				recentMovements: recentMv.map((m) => ({
					id: m.id,
					type: m.type,
					product: m.product || "Unknown",
					qty: m.qty,
					time: m.time?.toLocaleString() || "N/A",
				})),
			};
		}),
});
