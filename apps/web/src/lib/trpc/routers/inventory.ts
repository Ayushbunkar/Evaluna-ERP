import {
	branches,
	branchInventory,
	dailyProductDiscounts,
	productBarcodes,
	productBatches,
	productConversions,
	products,
	stockAdjustments,
} from "@evaluna/db/schema";
import { and, asc, count, desc, eq, ilike, lte, or, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { stockLedger } from "@/lib/db/schema";
import {
	protectedProcedure,
	publicProcedure,
	roleProcedure,
	router,
} from "@/lib/trpc/init";

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
			z
				.object({
					search: z.string().optional(),
					category: z.string().optional(),
					status: z.string().optional(),
					branchId: z.number().optional(),
					limit: z.number().optional(),
					offset: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { limit, offset, search, category, status, branchId } = input || {};
			const db = ctx.db;
			const targetBranchId = branchId || ctx.user?.branchId || 1;
			const todayStr = new Date().toISOString().split("T")[0];

			const conditions: any[] = [
				or(eq(products.is_deleted, false), sql`${products.is_deleted} IS NULL`),
			];
			if (search?.trim()) {
				const term = `%${search.trim().toLowerCase()}%`;
				conditions.push(
					or(
						ilike(products.name, term),
						ilike(products.sku, term),
						ilike(products.barcode, term),
						ilike(products.category, term),
					)!,
				);
			}
			if (category && category !== "all") {
				conditions.push(eq(products.category, category));
			}

			// Query all products with aggregated stock for the target branch
			const productRows = await db
				.select({
					id: products.id,
					productId: products.id,
					product: products.name,
					sku: products.sku,
					category: products.category,
					unit: products.unit,
					barcode: products.barcode,
					price: products.price,
					baseSellingPrice: products.base_selling_price,
					inventoryId: sql<number>`max(${branchInventory.id})`,
					branchId: sql<number>`coalesce(max(${branchInventory.branch_id}), ${targetBranchId})`,
					qty_on_hand: sql<number>`coalesce(sum(${branchInventory.in_stock}), 0)::int`,
					reorder_level: sql<number>`coalesce(max(${branchInventory.reorder_level}), 10)::int`,
				})
				.from(products)
				.leftJoin(
					branchInventory,
					and(
						eq(products.id, branchInventory.product_id),
						eq(branchInventory.branch_id, targetBranchId),
					),
				)
				.where(and(...conditions))
				.groupBy(
					products.id,
					products.name,
					products.sku,
					products.category,
					products.unit,
					products.barcode,
					products.price,
					products.base_selling_price,
				)
				.orderBy(asc(products.name))
				.limit(limit || 1000)
				.offset(offset || 0);

			// Fetch active daily discount offers for today
			const activeDiscounts = await db
				.select()
				.from(dailyProductDiscounts)
				.where(
					and(
						eq(dailyProductDiscounts.effective_date, todayStr),
						eq(dailyProductDiscounts.is_active, true),
					),
				);

			const discountMap = new Map<number, (typeof activeDiscounts)[0]>();
			for (const disc of activeDiscounts) {
				discountMap.set(disc.product_id, disc);
			}

			// Total matching count
			const countResult = await db
				.select({ val: count() })
				.from(products)
				.where(and(...conditions));

			const items = productRows.map((d) => {
				const originalPrice = Number.parseFloat(d.price || "0");
				const activeDiscount = discountMap.get(d.productId);
				const hasActiveOffer = !!activeDiscount && activeDiscount.is_active;
				const offerPrice = hasActiveOffer
					? Number.parseFloat(activeDiscount.discounted_price || "0")
					: originalPrice;
				const discountPercent =
					hasActiveOffer && originalPrice > 0
						? Number.parseFloat(
								activeDiscount.discount_percent ||
									(
										((originalPrice - offerPrice) / originalPrice) *
										100
									).toFixed(1),
							)
						: 0;

				let itemStatus = "in_stock";
				if ((d.qty_on_hand || 0) <= 0) {
					itemStatus = "out_of_stock";
				} else if ((d.qty_on_hand || 0) <= (d.reorder_level || 10)) {
					itemStatus = "low_stock";
				}

				return {
					id: d.inventoryId || d.productId,
					productId: d.productId,
					product: d.product || "Unknown",
					sku: d.sku || "N/A",
					category: d.category || "General",
					unit: d.unit || "Pcs",
					barcode: d.barcode || "",
					price: originalPrice,
					currentPrice: hasActiveOffer ? offerPrice : originalPrice,
					hasActiveOffer,
					offerPrice,
					discountPercent,
					offerReason: activeDiscount?.reason || null,
					branch: "Bhopal Main Warehouse",
					branchId: d.branchId || targetBranchId,
					qty_on_hand: d.qty_on_hand ?? 0,
					reorder_level: d.reorder_level ?? 10,
					status: itemStatus,
				};
			});

			const filteredItems =
				status && status !== "all"
					? items.filter((i) => {
							if (status === "on_offer") return i.hasActiveOffer;
							return i.status === status;
						})
					: items;

			return {
				items: filteredItems,
				total: Number(countResult[0]?.val) || 0,
			};
		}),

	updateStockAndPrice: publicProcedure
		.input(
			z.object({
				inventoryId: z.number().optional().nullable(),
				productId: z.number().optional().nullable(),
				branchId: z.number().optional().default(1),
				qtyOnHand: z.number().min(0),
				price: z.number().min(0),
				reason: z.string().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx) => {
				let prodId = input.productId;

				if (!prodId && input.inventoryId) {
					const [invRecord] = await tx
						.select()
						.from(branchInventory)
						.where(eq(branchInventory.id, input.inventoryId))
						.limit(1);
					if (invRecord?.product_id) {
						prodId = invRecord.product_id;
					} else {
						prodId = input.inventoryId;
					}
				}

				if (!prodId) {
					throw new Error("Product ID could not be determined for this item.");
				}

				const priceStr = input.price.toFixed(2);

				// 1. Update product price in `products` table (Syncs across Sales & Driver App)
				await tx
					.update(products)
					.set({
						price: priceStr,
						base_selling_price: priceStr,
					})
					.where(eq(products.id, prodId));

				// 2. Update physical stock in `branchInventory`
				const existing = input.inventoryId
					? await tx
							.select()
							.from(branchInventory)
							.where(eq(branchInventory.id, input.inventoryId))
							.limit(1)
					: await tx
							.select()
							.from(branchInventory)
							.where(
								and(
									eq(branchInventory.product_id, prodId),
									eq(branchInventory.branch_id, input.branchId),
								),
							)
							.limit(1);

				if (existing && existing.length > 0) {
					await tx
						.update(branchInventory)
						.set({
							in_stock: input.qtyOnHand,
						})
						.where(eq(branchInventory.id, existing[0].id));
				} else {
					await tx.insert(branchInventory).values({
						product_id: prodId,
						branch_id: input.branchId,
						in_stock: input.qtyOnHand,
					});
				}

				// 3. Log into stock_ledger for audit trailing
				await tx.insert(stockLedger).values({
					product_id: prodId,
					branch_id: input.branchId,
					transaction_type: "in",
					quantity: input.qtyOnHand,
					reference_type: "warehouse_stock_update",
					unit_cost: priceStr,
					total_cost: (input.price * input.qtyOnHand).toFixed(2),
				});

				return { success: true };
			});
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

	scanBarcode: roleProcedure([
		"admin",
		"manager",
		"auditor",
		"picker",
		"putter",
	])
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
			const branchId = input.branch_id;
			const branchFilter = branchId ? sql`WHERE bi.branch_id = ${branchId}` : sql``;

			const [
				[scalarStats],
				branchStockList,
				categoryDistRaw,
				recentMv,
				topMovingRaw,
				inventoryTrendRaw,
			] = await Promise.all([
				// 1. Consolidated scalar metrics in 1 single query
				db.execute<{
					total_products: number;
					inventory_value: number;
					low_stock_items: number;
					dead_stock: number;
					expiring_soon: number;
				}>(sql`
					SELECT
						(SELECT coalesce(count(*), 0)::int FROM products) AS total_products,
						coalesce(sum(bi.in_stock * p.price), 0)::numeric AS inventory_value,
						coalesce(count(*) filter (WHERE bi.in_stock > 0 AND bi.in_stock <= bi.reorder_level), 0)::int AS low_stock_items,
						coalesce(count(*) filter (WHERE bi.in_stock = 0), 0)::int AS dead_stock,
						(SELECT coalesce(count(*), 0)::int FROM product_batches WHERE expiry_date <= NOW() + INTERVAL '30 days') AS expiring_soon
					FROM branch_inventory bi
					LEFT JOIN products p ON bi.product_id = p.id
					${branchFilter}
				`),

				// 2. Branch distribution
				db
					.select({
						name: branches.name,
						stock: sum(branchInventory.in_stock),
						value: sum(sql`${branchInventory.in_stock} * ${products.price}`),
					})
					.from(branchInventory)
					.leftJoin(branches, eq(branchInventory.branch_id, branches.id))
					.leftJoin(products, eq(branchInventory.product_id, products.id))
					.groupBy(branches.id, branches.name)
					.limit(8),

				// 3. Category distribution
				db
					.select({
						name: products.category,
						count: count(),
						value: sum(sql`${branchInventory.in_stock} * ${products.price}`),
					})
					.from(branchInventory)
					.leftJoin(products, eq(branchInventory.product_id, products.id))
					.where(branchId ? eq(branchInventory.branch_id, branchId) : undefined)
					.groupBy(products.category)
					.orderBy(desc(count()))
					.limit(6),

				// 4. Recent movements
				db
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
					.limit(5),

				// 5. Top moving items
				db
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
					.limit(5),

				// 6. Inventory trend
				db
					.select({
						month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${stockLedger.created_at}), 'Mon')`,
						value: sql<string>`COALESCE(SUM(${stockLedger.total_cost}), 0)`,
					})
					.from(stockLedger)
					.where(sql`${stockLedger.created_at} >= NOW() - INTERVAL '6 months'`)
					.groupBy(sql`DATE_TRUNC('month', ${stockLedger.created_at})`)
					.orderBy(sql`DATE_TRUNC('month', ${stockLedger.created_at})`),
			]);

			const totalInvValue = Number(scalarStats?.inventory_value) || 1;
			const totalProductsCount = Number(scalarStats?.total_products) || 0;

			const categoryDistribution = categoryDistRaw
				.filter((c) => c.name)
				.map((c) => ({
					name: c.name || "Uncategorized",
					value: Number(c.value) || 0,
					count: Number(c.count) || 0,
				}));

			const abcAnalysis = [
				{
					class: "A",
					value: Math.round((totalInvValue * 0.8) / 1000) / 10,
					percentage: 80,
					items: Math.round(totalProductsCount * 0.2),
				},
				{
					class: "B",
					value: Math.round((totalInvValue * 0.15) / 1000) / 10,
					percentage: 15,
					items: Math.round(totalProductsCount * 0.3),
				},
				{
					class: "C",
					value: Math.round((totalInvValue * 0.05) / 1000) / 10,
					percentage: 5,
					items: Math.round(totalProductsCount * 0.5),
				},
			];

			const topMovingItems = topMovingRaw.map((t) => ({
				name: t.name || "Unknown",
				category: t.category || "N/A",
				turns: Number(t.totalOut) || 0,
			}));

			const inventoryTrend = inventoryTrendRaw.map((t) => ({
				month: t.month,
				value: Math.abs(Number(t.value)) || 0,
			}));

			return {
				inventoryValue: Number(scalarStats?.inventory_value) || 0,
				totalProducts: totalProductsCount,
				lowStockItems: Number(scalarStats?.low_stock_items) || 0,
				expiringSoon: Number(scalarStats?.expiring_soon) || 0,
				deadStock: Number(scalarStats?.dead_stock) || 0,
				stockAccuracy: totalProductsCount ? 100 : 0, // Default to 100% if products exist, else 0. Requires audit module for real calculation.
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
				where: input.branchId
					? eq(productConversions.branch_id, input.branchId)
					: undefined,
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
				createdAt: c.created_at
					? new Date(c.created_at).toISOString()
					: new Date().toISOString(),
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

	// ── Add New Item to Warehouse Stock ───────────────────────────────────────
	addItem: publicProcedure
		.input(
			z.object({
				name: z.string().min(2, "Item name must be at least 2 characters."),
				sku: z.string().optional(),
				price: z.number().min(0, "Price must be non-negative."),
				costPrice: z.number().optional(),
				unit: z.string().default("Pcs"),
				initialStock: z
					.number()
					.min(0, "Initial stock cannot be negative.")
					.default(0),
				binLocation: z.string().optional(),
				branchId: z.number().default(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const generatedSku =
				input.sku && input.sku.trim().length > 0
					? input.sku.trim()
					: `SKU-${Date.now().toString().slice(-6)}`;

			return await db.transaction(async (tx) => {
				// 1. Create product record
				const [newProd] = await tx
					.insert(products)
					.values({
						name: input.name.trim(),
						sku: generatedSku,
						price: input.price.toString(),
						user_uid: ctx.user.id,
						unit: input.unit || "Pcs",
					})
					.returning();

				if (!newProd) {
					throw new Error("Failed to create product record.");
				}

				// 2. Initialize stock balance in branchInventory
				const [newInv] = await tx
					.insert(branchInventory)
					.values({
						branch_id: input.branchId,
						product_id: newProd.id,
						in_stock: input.initialStock,
						reorder_level: 10,
					})
					.returning();

				// 3. Record initial stock ledger entry if stock > 0
				if (input.initialStock > 0) {
					await tx.insert(stockLedger).values({
						product_id: newProd.id,
						transaction_type: "in",
						quantity: input.initialStock,
						reference_type: "initial_stock",
						branch_id: input.branchId,
						unit_cost: (input.costPrice ?? input.price).toString(),
						total_cost: (
							(input.costPrice ?? input.price) * input.initialStock
						).toString(),
					});
				}

				return {
					success: true,
					product: newProd,
					inventory: newInv,
				};
			});
		}),
});
