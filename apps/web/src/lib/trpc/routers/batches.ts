import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
	branches,
	productBatches,
	products,
	stockLedger,
	branchInventory,
} from "@evaluna/db/schema";
import { protectedProcedure, router } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";

export const batchesRouter = router({
	// ── 1. Batch & Expiry Command Center Statistics ─────────────────────────
	getStats: protectedProcedure
		.input(
			z.object({
				branchId: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const bId = input.branchId || ctx.user?.branchId || 1;
			const now = new Date();
			const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
			const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
			const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

			const branchCond = eq(productBatches.branch_id, bId);

			const allBatches = await db
				.select({
					id: productBatches.id,
					quantity: productBatches.quantity,
					mrp: productBatches.mrp,
					selling_price: productBatches.selling_price,
					purchase_price: productBatches.purchase_price,
					expiry_date: productBatches.expiry_date,
				})
				.from(productBatches)
				.where(branchCond);

			let totalBatches = allBatches.length;
			let totalQuantity = 0;
			let totalInventoryValue = 0;
			let expiredCount = 0;
			let expiredValue = 0;
			let critical30DaysCount = 0;
			let critical30DaysValue = 0;
			let warning60DaysCount = 0;
			let notice90DaysCount = 0;
			let healthyCount = 0;

			for (const b of allBatches) {
				const qty = Number(b.quantity || 0);
				const cost = Number(b.purchase_price || b.selling_price || 0);
				const val = qty * cost;
				totalQuantity += qty;
				totalInventoryValue += val;

				if (b.expiry_date) {
					const exp = new Date(b.expiry_date);
					if (exp < now) {
						expiredCount++;
						expiredValue += val;
					} else if (exp <= in30Days) {
						critical30DaysCount++;
						critical30DaysValue += val;
					} else if (exp <= in60Days) {
						warning60DaysCount++;
					} else if (exp <= in90Days) {
						notice90DaysCount++;
					} else {
						healthyCount++;
					}
				} else {
					healthyCount++;
				}
			}

			return {
				totalBatches,
				totalQuantity: Math.round(totalQuantity * 100) / 100,
				totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
				expiredCount,
				expiredValue: Math.round(expiredValue * 100) / 100,
				critical30DaysCount,
				critical30DaysValue: Math.round(critical30DaysValue * 100) / 100,
				warning60DaysCount,
				notice90DaysCount,
				healthyCount,
			};
		}),

	// ── 2. Real-Time Multi-Warehouse Batch Listing with FEFO Sorting ─────────
	list: protectedProcedure
		.input(
			z.object({
				branchId: z.number().optional(),
				search: z.string().optional(),
				status: z
					.enum(["all", "expired", "critical_30", "warning_60", "healthy"])
					.optional()
					.default("all"),
				sortBy: z.enum(["expiry_asc", "expiry_desc", "qty_desc", "newest"]).optional().default("expiry_asc"),
				limit: z.number().min(1).max(500).optional().default(50),
				offset: z.number().min(0).optional().default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const bId = input.branchId || ctx.user?.branchId || 1;
			const now = new Date();
			const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
			const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

			const conditions: any[] = [eq(productBatches.branch_id, bId)];

			if (input.search && input.search.trim()) {
				const term = `%${input.search.trim()}%`;
				conditions.push(
					or(
						ilike(productBatches.batch_number, term),
						ilike(productBatches.location, term),
						ilike(products.name, term),
						ilike(products.sku, term),
						ilike(products.barcode, term),
					),
				);
			}

			if (input.status === "expired") {
				conditions.push(
					and(isNotNull(productBatches.expiry_date), lte(productBatches.expiry_date, now)),
				);
			} else if (input.status === "critical_30") {
				conditions.push(
					and(
						isNotNull(productBatches.expiry_date),
						gte(productBatches.expiry_date, now),
						lte(productBatches.expiry_date, in30Days),
					),
				);
			} else if (input.status === "warning_60") {
				conditions.push(
					and(
						isNotNull(productBatches.expiry_date),
						gte(productBatches.expiry_date, in30Days),
						lte(productBatches.expiry_date, in60Days),
					),
				);
			} else if (input.status === "healthy") {
				conditions.push(
					or(
						isNull(productBatches.expiry_date),
						gte(productBatches.expiry_date, in60Days),
					),
				);
			}

			// Order FEFO (First Expired First Out) by default
			let orderByClause: any = asc(productBatches.expiry_date);
			if (input.sortBy === "expiry_desc") {
				orderByClause = desc(productBatches.expiry_date);
			} else if (input.sortBy === "qty_desc") {
				orderByClause = desc(productBatches.quantity);
			} else if (input.sortBy === "newest") {
				orderByClause = desc(productBatches.created_at);
			}

			const rows = await db
				.select({
					batch: productBatches,
					productName: products.name,
					productSku: products.sku,
					productBarcode: products.barcode,
					productUnit: products.unit,
				})
				.from(productBatches)
				.innerJoin(products, eq(productBatches.product_id, products.id))
				.where(and(...conditions))
				.orderBy(orderByClause)
				.limit(input.limit)
				.offset(input.offset);

			const items = rows.map((r) => {
				const b = r.batch;
				const qty = Number(b.quantity || 0);
				const exp = b.expiry_date ? new Date(b.expiry_date) : null;
				let daysToExpiry: number | null = null;
				let expiryStatus: "expired" | "critical" | "warning" | "healthy" = "healthy";

				if (exp) {
					const diffMs = exp.getTime() - now.getTime();
					daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
					if (daysToExpiry < 0) {
						expiryStatus = "expired";
					} else if (daysToExpiry <= 30) {
						expiryStatus = "critical";
					} else if (daysToExpiry <= 60) {
						expiryStatus = "warning";
					} else {
						expiryStatus = "healthy";
					}
				}

				return {
					id: b.id,
					productId: b.product_id,
					productName: r.productName,
					productSku: r.productSku || "",
					productBarcode: r.productBarcode || "",
					productUnit: r.productUnit || "pcs",
					batchNumber: b.batch_number,
					quantity: qty,
					mrp: Number(b.mrp || 0),
					sellingPrice: Number(b.selling_price || 0),
					purchasePrice: Number(b.purchase_price || 0),
					manufactureDate: b.manufacture_date,
					expiryDate: b.expiry_date,
					daysToExpiry,
					expiryStatus,
					location: b.location || "General Storage",
					branchId: b.branch_id,
					createdAt: b.created_at,
				};
			});

			return {
				batches: items,
				total: items.length,
			};
		}),

	// ── 3. FEFO Recommendation Engine for Dispatch & POS ────────────────────
	getFEFORecommendations: protectedProcedure
		.input(
			z.object({
				productId: z.number(),
				branchId: z.number().optional(),
				requiredQty: z.number().min(0.01).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const bId = input.branchId || ctx.user?.branchId || 1;
			const now = new Date();

			// FEFO: Pick active batches with stock > 0, ordered by expiry_date ascending
			const batches = await db
				.select({
					batch: productBatches,
					productName: products.name,
					productSku: products.sku,
				})
				.from(productBatches)
				.innerJoin(products, eq(productBatches.product_id, products.id))
				.where(
					and(
						eq(productBatches.product_id, input.productId),
						eq(productBatches.branch_id, bId),
						sql`CAST(${productBatches.quantity} AS numeric) > 0`,
					),
				)
				.orderBy(asc(productBatches.expiry_date), asc(productBatches.created_at));

			let remainingNeeded = input.requiredQty ?? 0;
			const recommendations = batches.map((r, idx) => {
				const b = r.batch;
				const available = Number(b.quantity || 0);
				const exp = b.expiry_date ? new Date(b.expiry_date) : null;
				const isExpired = exp ? exp < now : false;

				let allocatedQty = 0;
				if (remainingNeeded > 0) {
					allocatedQty = Math.min(available, remainingNeeded);
					remainingNeeded -= allocatedQty;
				}

				return {
					priorityOrder: idx + 1,
					batchId: b.id,
					batchNumber: b.batch_number,
					availableQty: available,
					allocatedQty,
					mrp: Number(b.mrp || 0),
					sellingPrice: Number(b.selling_price || 0),
					location: b.location || "Storage",
					expiryDate: b.expiry_date,
					isExpired,
					isPrimaryPick: idx === 0,
				};
			});

			return {
				productId: input.productId,
				batches: recommendations,
				fulfilled: remainingNeeded <= 0,
				shortfall: Math.max(0, remainingNeeded),
			};
		}),

	// ── 4. Create New Batch (with barcode, location & shelf-life calculation) ─
	create: protectedProcedure
		.input(
			z.object({
				productId: z.number(),
				branchId: z.number().optional(),
				batchNumber: z.string().min(1, "Batch number is required"),
				quantity: z.number().min(0, "Quantity must be positive"),
				mrp: z.number().min(0),
				sellingPrice: z.number().min(0),
				purchasePrice: z.number().min(0),
				location: z.string().optional(),
				manufactureDate: z.string().or(z.date()).optional(),
				expiryDate: z.string().or(z.date()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const bId = input.branchId || ctx.user?.branchId || 1;

			// Verify product exists
			const [prod] = await db
				.select()
				.from(products)
				.where(eq(products.id, input.productId));

			if (!prod) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found.",
				});
			}

			// Check duplicate batch number in same branch
			const existing = await db
				.select()
				.from(productBatches)
				.where(
					and(
						eq(productBatches.product_id, input.productId),
						eq(productBatches.branch_id, bId),
						eq(productBatches.batch_number, input.batchNumber.trim()),
					),
				);

			if (existing.length > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Batch "${input.batchNumber.trim()}" already exists for this product in this warehouse.`,
				});
			}

			const mDate = input.manufactureDate ? new Date(input.manufactureDate) : null;
			const eDate = input.expiryDate ? new Date(input.expiryDate) : null;

			const [newBatch] = await db
				.insert(productBatches)
				.values({
					product_id: input.productId,
					branch_id: bId,
					batch_number: input.batchNumber.trim(),
					quantity: input.quantity.toString(),
					mrp: input.mrp.toString(),
					selling_price: input.sellingPrice.toString(),
					purchase_price: input.purchasePrice.toString(),
					location: input.location?.trim() || "Main Storage",
					manufacture_date: mDate,
					expiry_date: eDate,
				})
				.returning();

			// Also update branch inventory stock if quantity > 0
			if (input.quantity > 0) {
				const [inv] = await db
					.select()
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.branch_id, bId),
							eq(branchInventory.product_id, input.productId),
						),
					);

				if (inv) {
					const newStock = Number(inv.in_stock || 0) + input.quantity;
					await db
						.update(branchInventory)
						.set({ in_stock: newStock.toString(), updated_at: new Date() })
						.where(eq(branchInventory.id, inv.id));
				} else {
					await db.insert(branchInventory).values({
						branch_id: bId,
						product_id: input.productId,
						in_stock: input.quantity.toString(),
					});
				}

				// Post initial FIFO ledger entry
				await db.insert(stockLedger).values({
					branch_id: bId,
					product_id: input.productId,
					batch_id: newBatch.id,
					transaction_type: "PURCHASE",
					quantity: input.quantity.toString(),
					remaining_quantity: input.quantity.toString(),
					unit_cost: input.purchasePrice.toString(),
				});
			}

			return {
				success: true,
				batch: newBatch,
			};
		}),

	// ── 5. Relocate / Adjust Batch Stock & Bin Location ──────────────────────
	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				location: z.string().optional(),
				mrp: z.number().optional(),
				sellingPrice: z.number().optional(),
				expiryDate: z.string().or(z.date()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const updateData: any = {};
			if (input.location !== undefined) updateData.location = input.location.trim();
			if (input.mrp !== undefined) updateData.mrp = input.mrp.toString();
			if (input.sellingPrice !== undefined)
				updateData.selling_price = input.sellingPrice.toString();
			if (input.expiryDate !== undefined)
				updateData.expiry_date = new Date(input.expiryDate);

			const [updated] = await db
				.update(productBatches)
				.set(updateData)
				.where(eq(productBatches.id, input.id))
				.returning();

			return { success: true, batch: updated };
		}),

	// ── 6. Get Single Batch Details ──────────────────────────────────────────
	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const [row] = await db
				.select({
					batch: productBatches,
					product: products,
					branch: branches,
				})
				.from(productBatches)
				.leftJoin(products, eq(productBatches.product_id, products.id))
				.leftJoin(branches, eq(productBatches.branch_id, branches.id))
				.where(eq(productBatches.id, input.id));

			if (!row) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Batch record not found.",
				});
			}

			return {
				...row.batch,
				product: row.product,
				branch: row.branch,
			};
		}),

	// ── 7. List Batches by Product (for POS/Sales Modal dropdown) ────────────
	listByProduct: protectedProcedure
		.input(
			z.object({
				productId: z.number(),
				branchId: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const bId = input.branchId || ctx.user?.branchId || 1;

			const rows = await db
				.select()
				.from(productBatches)
				.where(
					and(
						eq(productBatches.product_id, input.productId),
						eq(productBatches.branch_id, bId),
					),
				)
				.orderBy(asc(productBatches.expiry_date));

			return rows;
		}),
});
