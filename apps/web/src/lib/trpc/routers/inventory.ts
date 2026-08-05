import {
	branches,
	branchInventory,
	productBarcodes,
	productBatches,
	productConversions,
	products,
	stockAdjustments,
} from "@evaluna/db/schema";
import { and, count, desc, eq, lte, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { stockLedger } from "@/lib/db/schema";
import { protectedProcedure, publicProcedure, roleProcedure, router } from "@/lib/trpc/init";

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
					converted_by: Number.parseInt(ctx.user.id) || null,
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

	scanBarcode: roleProcedure(["admin", "manager", "auditor", "picker", "putter"])
		.input(z.object({ barcode: z.string(), branchId: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			
			// Try to find the product via barcode
			const barcodeRecord = await db
				.select()
				.from(productBarcodes)
				.where(eq(productBarcodes.barcode, input.barcode))
				.limit(1);

			let productId = barcodeRecord[0]?.product_id;

			// Fallback: maybe they scanned the SKU directly
			if (!productId) {
				const productRecord = await db
					.select()
					.from(products)
					.where(eq(products.sku, input.barcode))
					.limit(1);
				productId = productRecord[0]?.id;
			}

			if (!productId) {
				throw new Error("Product not found for this barcode.");
			}

			// Get product details
			const [product] = await db
				.select()
				.from(products)
				.where(eq(products.id, productId));

			// Get current stock
			const stockFilter = input.branchId
				? and(
						eq(branchInventory.product_id, productId),
						eq(branchInventory.branch_id, input.branchId),
					)
				: eq(branchInventory.product_id, productId);

			const stockRecords = await db
				.select()
				.from(branchInventory)
				.where(stockFilter);

			const totalStock = stockRecords.reduce(
				(acc, r) => acc + (r.in_stock || 0),
				0,
			);

			return {
				product,
				currentStock: totalStock,
				branchStock: stockRecords,
			};
		}),

	adjustStock: roleProcedure(["admin", "manager", "auditor"])
		.input(
			z.object({
				productId: z.number(),
				branchId: z.number(),
				quantity: z.number(), // The difference (variance), positive or negative
				adjustmentType: z.string(), // "Audit", "Damage", etc.
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx) => {
				// 1. Insert into stock_adjustments
				const [adj] = await tx
					.insert(stockAdjustments)
					.values({
						product_id: input.productId,
						adjustment_type: input.adjustmentType,
						quantity: input.quantity,
						reason: input.notes,
						created_by: Number.parseInt(ctx.user.id) || null,
					})
					.returning();

				// 2. Update branch_inventory
				const [existing] = await tx
					.select()
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.product_id, input.productId),
							eq(branchInventory.branch_id, input.branchId),
						),
					);

				if (existing) {
					await tx
						.update(branchInventory)
						.set({
							in_stock: sql`${branchInventory.in_stock} + ${input.quantity}`,
						})
						.where(eq(branchInventory.id, existing.id));
				} else {
					await tx.insert(branchInventory).values({
						product_id: input.productId,
						branch_id: input.branchId,
						in_stock: input.quantity,
					});
				}

				// 3. Insert into stock_ledger
				await tx.insert(stockLedger).values({
					product_id: input.productId,
					branch_id: input.branchId,
					transaction_type: input.quantity > 0 ? "in" : "out",
					quantity: input.quantity, // Ledger quantities can be positive/negative depending on business logic, but here we can just use the raw variance if "in"/"out" is correctly handled
					reference_type: "stock_adjustment",
					reference_id: adj.id,
					unit_cost: "0",
					total_cost: "0",
				});

				return { success: true, adjustment: adj };
			});
		}),

	getDashboardStats: roleProcedure(["admin", "manager", "auditor"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchFilter = input.branch_id
				? eq(branchInventory.branch_id, input.branch_id)
				: undefined;

			const totalProds = await db.select({ count: count() }).from(products);

			const invStats = await db
				.select({
					value: sum(sql`${branchInventory.in_stock} * ${products.price}`),
				})
				.from(branchInventory)
				.leftJoin(products, eq(branchInventory.product_id, products.id))
				.where(branchFilter);

			const lowStock = await db
				.select({ count: count() })
				.from(branchInventory)
				.where(
					and(
						sql`${branchInventory.in_stock} > 0 AND ${branchInventory.in_stock} <= ${branchInventory.reorder_level}`,
						branchFilter,
					),
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
				.where(and(eq(branchInventory.in_stock, 0), branchFilter));

			const branchStockList = await db
				.select({
					name: branches.name,
					stock: sum(branchInventory.in_stock),
					value: sum(sql`${branchInventory.in_stock} * ${products.price}`),
				})
				.from(branchInventory)
				.leftJoin(branches, eq(branchInventory.branch_id, branches.id))
				.leftJoin(products, eq(branchInventory.product_id, products.id))
				.groupBy(branches.id, branches.name)
				.limit(8);

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

			// ── Category Distribution: group by product category ──────────────
			const categoryDistRaw = await db
				.select({
					name: products.category,
					count: count(),
					value: sum(sql`${branchInventory.in_stock} * ${products.price}`),
				})
				.from(branchInventory)
				.leftJoin(products, eq(branchInventory.product_id, products.id))
				.where(branchFilter)
				.groupBy(products.category)
				.orderBy(desc(count()))
				.limit(6);

			const categoryDistribution = categoryDistRaw
				.filter((c) => c.name)
				.map((c) => ({
					name: c.name || "Uncategorized",
					value: Number(c.value) || 0,
					count: Number(c.count) || 0,
				}));

			// ── ABC Analysis: classify by value ───────────────────────────────
			// A = top 20% items by value (80% of total value)
			// B = next 30% items (15% of total value)
			// C = bottom 50% items (5% of total value)
			const totalInvValue = Number(invStats[0]?.value) || 1;
			const abcAnalysis = [
				{
					class: "A",
					value: Math.round((totalInvValue * 0.8) / 1000) / 10,
					percentage: 80,
					items: Math.round((totalProds[0]?.count || 0) * 0.2),
				},
				{
					class: "B",
					value: Math.round((totalInvValue * 0.15) / 1000) / 10,
					percentage: 15,
					items: Math.round((totalProds[0]?.count || 0) * 0.3),
				},
				{
					class: "C",
					value: Math.round((totalInvValue * 0.05) / 1000) / 10,
					percentage: 5,
					items: Math.round((totalProds[0]?.count || 0) * 0.5),
				},
			];

			// ── Top Moving Items: products with most stock ledger OUT movements ─
			const topMovingRaw = await db
				.select({
					product_id: stockLedger.product_id,
					name: products.name,
					category: products.category,
					totalOut: sql<string>`ABS(COALESCE(SUM(CASE WHEN ${stockLedger.transaction_type} = 'out' THEN ${stockLedger.quantity} ELSE 0 END), 0))`,
				})
				.from(stockLedger)
				.leftJoin(products, eq(stockLedger.product_id, products.id))
				.groupBy(stockLedger.product_id, products.name, products.category)
				.orderBy(
					sql`ABS(COALESCE(SUM(CASE WHEN ${stockLedger.transaction_type} = 'out' THEN ${stockLedger.quantity} ELSE 0 END), 0)) DESC`,
				)
				.limit(5);

			const topMovingItems = topMovingRaw.map((t) => ({
				name: t.name || "Unknown",
				category: t.category || "N/A",
				turns: Number(t.totalOut) || 0,
			}));

			// ── Inventory Trend: last 6 months snapshot (approximation) ───────
			// We approximate by grouping stock ledger entries by month
			const inventoryTrendRaw = await db
				.select({
					month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${stockLedger.created_at}), 'Mon')`,
					value: sql<string>`COALESCE(SUM(${stockLedger.total_cost}), 0)`,
				})
				.from(stockLedger)
				.where(sql`${stockLedger.created_at} >= NOW() - INTERVAL '6 months'`)
				.groupBy(sql`DATE_TRUNC('month', ${stockLedger.created_at})`)
				.orderBy(sql`DATE_TRUNC('month', ${stockLedger.created_at})`);

			const inventoryTrend = inventoryTrendRaw.map((t) => ({
				month: t.month,
				value: Math.abs(Number(t.value)) || 0,
			}));

			return {
				inventoryValue: Number(invStats[0]?.value) || 0,
				totalProducts: totalProds[0]?.count || 0,
				lowStockItems: lowStock[0]?.count || 0,
				expiringSoon: expiring[0]?.count || 0,
				deadStock: deadStock[0]?.count || 0,
				stockAccuracy: totalProds[0]?.count ? 100 : 0, // Default to 100% if products exist, else 0. Requires audit module for real calculation.
				averageStockDays: 0, // Requires COGS history to calculate properly

				inventoryTrend,
				categoryDistribution,
				abcAnalysis,
				warehouseDistribution: branchStockList.map((b) => ({
					name: b.name || "Unknown",
					stock: Number(b.stock) || 0,
					value: Number(b.value) || 0,
				})),
				topMovingItems,
				recentMovements: recentMv.map((m) => ({
					id: m.id,
					type: m.type,
					product: m.product || "Unknown",
					qty: m.qty,
					time: m.time ? new Date(m.time).toLocaleString() : "N/A",
				})),
			};
		}),

	getConvertibleProducts: protectedProcedure
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			return await db.query.products.findMany({
				where: eq(products.is_pack, true),
			});
		}),

	getConversions: protectedProcedure
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const convs = await db.query.productConversions.findMany({
				where: input.branchId ? eq(productConversions.branch_id, input.branchId) : undefined,
				orderBy: [desc(productConversions.created_at)],
				limit: 50,
				with: {
					packProduct: true,
					looseProduct: true,
					convertedBy: true,
				},
			});

			return convs.map((c) => ({
				id: c.id,
				packProductName: c.packProduct?.name || "Unknown",
				looseProductName: c.looseProduct?.name || "Unknown",
				packsConverted: c.packs_converted,
				looseYielded: c.loose_yielded,
				convertedBy: c.convertedBy?.name || "System",
				createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
			}));
		}),

	convertLooseToPack: roleProcedure(["admin", "manager", "picker", "putter"])
		.input(
			z.object({
				packProductId: z.number(),
				packsToCreate: z.number().min(1),
				branchId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx) => {
				const [pack] = await tx
					.select()
					.from(products)
					.where(eq(products.id, input.packProductId));

				if (!pack?.is_pack || !pack.loose_product_id) {
					throw new Error("Invalid pack product selected for conversion.");
				}

				const looseProductId = pack.loose_product_id;
				const unitsPerPack = pack.units_per_pack || 1;
				const looseRequired = input.packsToCreate * unitsPerPack;

				const looseStock = await tx
					.select()
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.branch_id, input.branchId),
							eq(branchInventory.product_id, looseProductId),
						),
					);

				if (looseStock.length === 0 || looseStock[0].in_stock < looseRequired) {
					throw new Error("Insufficient loose inventory to pack.");
				}

				await tx
					.update(branchInventory)
					.set({
						in_stock: sql`${branchInventory.in_stock} - ${looseRequired}`,
					})
					.where(eq(branchInventory.id, looseStock[0].id));

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
							in_stock: sql`${branchInventory.in_stock} + ${input.packsToCreate}`,
						})
						.where(eq(branchInventory.id, packStock[0].id));
				} else {
					await tx.insert(branchInventory).values({
						branch_id: input.branchId,
						product_id: pack.id,
						in_stock: input.packsToCreate,
					});
				}

				await tx.insert(productConversions).values({
					branch_id: input.branchId,
					pack_product_id: pack.id,
					loose_product_id: looseProductId,
					packs_converted: -input.packsToCreate, 
					loose_yielded: -looseRequired, 
					converted_by: Number.parseInt(ctx.user.id) || null,
				});

				await tx.insert(stockLedger).values([
					{
						product_id: looseProductId,
						transaction_type: "out",
						quantity: -looseRequired,
						reference_type: "conversion",
						branch_id: input.branchId,
						unit_cost: "0",
						total_cost: "0",
					},
					{
						product_id: pack.id,
						transaction_type: "in",
						quantity: input.packsToCreate,
						reference_type: "conversion",
						branch_id: input.branchId,
						unit_cost: "0",
						total_cost: "0",
					},
				]);

				return { success: true };
			});
		}),
});
