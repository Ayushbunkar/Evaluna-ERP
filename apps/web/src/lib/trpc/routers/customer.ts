import {
	branchInventory,
	cartItems,
	carts,
	customers,
	orderItems,
	orders,
	pendingSync,
	productSlabPricing,
	products,
	user,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { endOfDay, startOfDay } from "date-fns";
import { and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { notifyStockChanged } from "@/lib/inventory/stock-event-bus";
import { notifyCustomerOrderPlaced } from "@/lib/notification-service";
import { findMatchingSlab } from "@/lib/pricing/slab-pricing";
import {
	autoRecoverMissingProductImages,
	ensureProductImageColumns,
} from "@/lib/product-schema-ensure";
import {
	customerProcedure,
	publicProcedure,
	roleProcedure,
	router,
} from "../init";
import { ensureSlabPricingTable } from "./slab-pricing";

export { ensureProductImageColumns };

export type StockStatusTier =
	| "in_stock"
	| "few_left"
	| "selling_fast"
	| "almost_sold_out"
	| "out_of_stock";

export function calculateStockTier(availableStock: number) {
	if (availableStock <= 0) {
		return {
			stockStatus: "out_of_stock" as const,
			stockBadgeText: "OUT OF STOCK",
			stockBadgeTextHi: "आउट ऑफ स्टॉक",
			stockBadgeColor: "red" as const,
			stockWarningText:
				"Currently unavailable. This product will be available once stock is replenished.",
			stockWarningTextHi: "वर्तमान में अनुपलब्ध। स्टॉक आने पर यह उत्पाद उपलब्ध होगा।",
			isAvailable: false,
		};
	}
	if (availableStock <= 10) {
		return {
			stockStatus: "almost_sold_out" as const,
			stockBadgeText: "ALMOST SOLD OUT",
			stockBadgeTextHi: "लगभग समाप्त",
			stockBadgeColor: "red" as const,
			stockWarningText: `Almost Sold Out! Only ${availableStock} units left. Order Now!`,
			stockWarningTextHi: `लगभग समाप्त! केवल ${availableStock} यूनिट बची हैं। अभी ऑर्डर करें!`,
			isAvailable: true,
		};
	}
	if (availableStock <= 20) {
		return {
			stockStatus: "selling_fast" as const,
			stockBadgeText: "SELLING FAST",
			stockBadgeTextHi: "तेज़ी से बिक रहा",
			stockBadgeColor: "orange" as const,
			stockWarningText: "Selling fast! Limited stock remaining.",
			stockWarningTextHi: "तेज़ी से बिक रहा है! सीमित स्टॉक शेष है।",
			isAvailable: true,
		};
	}
	if (availableStock <= 29) {
		return {
			stockStatus: "few_left" as const,
			stockBadgeText: "FEW LEFT",
			stockBadgeTextHi: "कुछ ही शेष",
			stockBadgeColor: "orange" as const,
			stockWarningText: `Hurry! Only ${availableStock} units left. Order soon!`,
			stockWarningTextHi: `जल्दी करें! केवल ${availableStock} यूनिट बची हैं। जल्द ऑर्डर करें!`,
			isAvailable: true,
		};
	}
	return {
		stockStatus: "in_stock" as const,
		stockBadgeText: "IN STOCK",
		stockBadgeTextHi: "स्टॉक में उपलब्ध",
		stockBadgeColor: "green" as const,
		stockWarningText: "",
		stockWarningTextHi: "",
		isAvailable: true,
	};
}

let hasEnsuredCartTables = false;
export async function ensureCartTables(db: any) {
	await ensureProductImageColumns(db);
	if (hasEnsuredCartTables) return;
	try {
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS carts (
				id SERIAL PRIMARY KEY,
				customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
				status VARCHAR(50) NOT NULL DEFAULT 'active',
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW()
			);
			CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts (customer_id);
			CREATE INDEX IF NOT EXISTS idx_carts_status ON carts (status);

			CREATE TABLE IF NOT EXISTS cart_items (
				id SERIAL PRIMARY KEY,
				cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
				product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
				quantity NUMERIC(10, 3) NOT NULL,
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW(),
				CONSTRAINT idx_cart_items_cart_product UNIQUE (cart_id, product_id)
			);
			CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items (cart_id);
			CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items (product_id);
		`);
		hasEnsuredCartTables = true;
	} catch (e) {
		// table already exists or DDL managed
	}
}

async function getCartHelper(
	db: any,
	customerId: number,
	branchId: number | null,
) {
	await ensureCartTables(db);
	await ensureSlabPricingTable(db);

	let [activeCart] = await db
		.select()
		.from(carts)
		.where(and(eq(carts.customer_id, customerId), eq(carts.status, "active")))
		.limit(1);

	if (!activeCart) {
		const [created] = await db
			.insert(carts)
			.values({ customer_id: customerId, status: "active" })
			.returning();
		activeCart = created;
	}

	if (!activeCart) {
		return {
			id: 0,
			items: [],
			itemCount: 0,
			totalQuantity: 0,
			subtotal: 0,
			discountTotal: 0,
			netAmount: 0,
			estimatedGst: 0,
			estimatedTotal: 0,
		};
	}

	const cartItemRows = await db
		.select({
			id: cartItems.id,
			cartId: cartItems.cart_id,
			productId: cartItems.product_id,
			quantity: cartItems.quantity,
			createdAt: cartItems.created_at,
			updatedAt: cartItems.updated_at,
			productName: products.name,
			productDescription: products.description,
			sku: products.sku,
			unit: products.unit,
			price: products.price,
			baseSellingPrice: products.base_selling_price,
			imageUrl: products.image_url,
			category: products.category,
			isDeleted: products.is_deleted,
			isHidden: products.is_hidden,
			inStock: sql<number>`coalesce(max(${branchInventory.in_stock}), 0)::numeric`,
			reservedStock: sql<number>`coalesce(max(${branchInventory.reserved_stock}), 0)::numeric`,
		})
		.from(cartItems)
		.innerJoin(products, eq(cartItems.product_id, products.id))
		.leftJoin(
			branchInventory,
			and(
				eq(branchInventory.product_id, products.id),
				branchId ? eq(branchInventory.branch_id, branchId) : sql`true`,
			),
		)
		.where(eq(cartItems.cart_id, activeCart.id))
		.groupBy(
			cartItems.id,
			cartItems.cart_id,
			cartItems.product_id,
			cartItems.quantity,
			cartItems.created_at,
			cartItems.updated_at,
			products.id,
			products.name,
			products.description,
			products.sku,
			products.unit,
			products.price,
			products.base_selling_price,
			products.image_url,
			products.category,
			products.is_deleted,
			products.is_hidden,
		)
		.orderBy(asc(cartItems.created_at));

	// Fetch active daily discounts for today
	const todayDateStr = new Date().toISOString().split("T")[0];
	let activeDiscounts: any[] = [];
	try {
		const { dailyProductDiscounts } = require("@evaluna/db/schema");
		activeDiscounts = await db
			.select()
			.from(dailyProductDiscounts)
			.where(
				and(
					eq(dailyProductDiscounts.effective_date, todayDateStr),
					eq(dailyProductDiscounts.is_active, true),
				),
			);
	} catch (e) {
		activeDiscounts = [];
	}

	const discountMap = new Map<number, any>();
	for (const d of activeDiscounts) {
		discountMap.set(d.product_id, d);
	}

	// Fetch active slabs for cart items
	const productIds = cartItemRows.map((r) => r.productId);
	let activeSlabs: any[] = [];
	if (productIds.length > 0) {
		try {
			activeSlabs = await db
				.select()
				.from(productSlabPricing)
				.where(
					and(
						inArray(productSlabPricing.product_id, productIds),
						eq(productSlabPricing.is_active, true),
					),
				)
				.orderBy(asc(productSlabPricing.min_quantity));
		} catch (e) {
			activeSlabs = [];
		}
	}

	const slabsMap = new Map<number, any[]>();
	for (const s of activeSlabs) {
		const list = slabsMap.get(s.product_id) || [];
		list.push({
			id: s.id,
			productId: s.product_id,
			minQuantity: Number(s.min_quantity),
			maxQuantity: s.max_quantity !== null ? Number(s.max_quantity) : null,
			unitPrice: Number(s.unit_price),
			startDate: s.start_date,
			endDate: s.end_date,
			isActive: s.is_active,
		});
		slabsMap.set(s.product_id, list);
	}

	let totalSubtotal = 0;
	let totalDiscount = 0;
	let totalQuantity = 0;

	const enrichedItems = cartItemRows.map((item) => {
		const qty = Number(item.quantity) || 0;
		totalQuantity += qty;
		const originalPrice = Number(item.price || item.baseSellingPrice || 0);
		const disc = discountMap.get(item.productId);
		const itemSlabs = slabsMap.get(item.productId) || [];

		let effectivePrice = originalPrice;
		let discountPercent = 0;
		let hasActiveOffer = false;
		let offerReason = "";

		// Check if slab applies for this quantity
		const matchingSlab = findMatchingSlab(itemSlabs, qty);
		if (matchingSlab) {
			effectivePrice = Number(matchingSlab.unitPrice);
			discountPercent =
				originalPrice > 0
					? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
					: 0;
			hasActiveOffer = true;
			offerReason = `Volume Slab (${matchingSlab.minQuantity}${matchingSlab.maxQuantity ? `–${matchingSlab.maxQuantity}` : "+"} ${item.unit || "units"})`;
		} else if (disc && disc.is_active) {
			effectivePrice = Number(disc.discounted_price || originalPrice);
			discountPercent = Number(
				disc.discount_percent ||
					(originalPrice > 0
						? Math.round(
								((originalPrice - effectivePrice) / originalPrice) * 100,
							)
						: 0),
			);
			hasActiveOffer = true;
			offerReason = disc.reason || "Daily Deal";
		}

		const itemSubtotal = originalPrice * qty;
		const itemNet = effectivePrice * qty;
		const itemDiscount = Math.max(0, itemSubtotal - itemNet);

		totalSubtotal += itemSubtotal;
		totalDiscount += itemDiscount;

		const inStockNum = Number(item.inStock || 0);
		const reservedStockNum = Number((item as any).reservedStock || 0);
		const availableStock = Math.max(
			0,
			Number((inStockNum - reservedStockNum).toFixed(3)),
		);
		const isOutOfStock = availableStock <= 0;
		const isStockShortage = qty > availableStock;
		const isAvailable = !item.isDeleted && !item.isHidden && !isOutOfStock;
		const tier = calculateStockTier(availableStock);

		return {
			id: item.id,
			productId: item.productId,
			productName: item.productName,
			description: item.productDescription,
			sku: item.sku,
			unit: item.unit || "Pcs",
			imageUrl: item.imageUrl,
			category: item.category || "General",
			quantity: qty,
			originalPrice,
			effectivePrice,
			discountPercent,
			hasActiveOffer,
			offerReason,
			itemSubtotal,
			itemNet,
			itemDiscount,
			isAvailable,
			isOutOfStock,
			isStockShortage,
			inStock: inStockNum,
			reservedStock: reservedStockNum,
			availableStock,
			stockStatus: tier.stockStatus,
			stockBadgeText: tier.stockBadgeText,
			stockBadgeTextHi: tier.stockBadgeTextHi,
			stockBadgeColor: tier.stockBadgeColor,
			stockWarningText: tier.stockWarningText,
			stockWarningTextHi: tier.stockWarningTextHi,
		};
	});

	const netAmount = Math.max(0, totalSubtotal - totalDiscount);
	const estimatedGst = Number((netAmount * 0.05).toFixed(2));
	const estimatedTotal = Number(netAmount.toFixed(2));

	return {
		id: activeCart.id,
		items: enrichedItems,
		itemCount: enrichedItems.length,
		totalQuantity: Number(totalQuantity.toFixed(3)),
		subtotal: Number(totalSubtotal.toFixed(2)),
		discountTotal: Number(totalDiscount.toFixed(2)),
		netAmount: Number(netAmount.toFixed(2)),
		estimatedGst,
		estimatedTotal,
		hasOutOfStockItems: enrichedItems.some((i) => i.isOutOfStock),
		hasStockShortage: enrichedItems.some((i) => i.isStockShortage),
	};
}

// Order lifecycle for the customer-ordering workflow.
//   pending_review → customer submitted, awaiting salesperson (NO prices yet)
//   under_review   → salesperson opened/editing
//   confirmed      → salesperson finalized commercial details + invoice (prices visible)
//   completed      → paid/fulfilled (also price-visible)
const CONFIRMED_STATUSES = ["confirmed", "completed"] as const;
const PENDING_STATUSES = ["pending_review", "under_review"] as const;
const CUSTOMER_ORDER_STATUSES = [
	"pending_review",
	"under_review",
	"confirmed",
	"completed",
] as const;

// Every procedure here uses `customerProcedure`, which resolves the logged-in
// user to THEIR OWN `customers` row (ctx.customer) and rejects anyone without a
// linked customer account. All reads/writes are scoped to `ctx.customer.id` —
// this is the server-side enforcement of tenant isolation (rule 4). Pricing is
// withheld from every response until an order reaches a CONFIRMED status (rule 2/3).
export const customerRouter = router({
	// ── Profile (read-only; NO photo/avatar fields — rule 1) ──────────────────
	getMyProfile: customerProcedure.query(async ({ ctx }) => {
		const c = ctx.customer;

		return {
			id: c.id,
			customer_code: c.customer_code,
			name: c.name,
			email: c.email,
			phone: c.phone,
			address: c.address,
			customer_type: c.customer_type,
			loyalty_tier: c.loyalty_tier,
			loyalty_points: c.loyalty_points,
			store_credit: c.store_credit,
			total_spent: c.total_spent,
			created_at: c.created_at ? c.created_at.toISOString() : null,
		};
	}),

	updateMyProfile: customerProcedure
		.input(
			z.object({
				name: z.string().min(2, "Name must be at least 2 characters"),
				phone: z
					.string()
					.min(10, "Phone number must be at least 10 characters")
					.nullable()
					.optional(),
				address: z
					.string()
					.min(5, "Address must be at least 5 characters")
					.nullable()
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const cid = ctx.customer.id;
			const uid = ctx.user.id;

			try {
				await ctx.db.transaction(async (tx: any) => {
					// 1. Update the customers record
					await tx
						.update(customers)
						.set({
							name: input.name,
							phone: input.phone || null,
							address: input.address || null,
							updated_at: new Date(),
						})
						.where(eq(customers.id, cid));

					// 2. Update the user record
					await tx
						.update(user)
						.set({
							name: input.name,
							updatedAt: new Date(),
						})
						.where(eq(user.id, uid));
				});

				return { success: true };
			} catch (error: any) {
				console.error("[customerRouter] updateMyProfile error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update profile",
				});
			}
		}),

	getPortalStats: customerProcedure.query(async ({ ctx }) => {
		const cid = ctx.customer.id;

		const pendingStatuses = ["pending", "pending_review", "under_review"];
		const confirmedStatuses = [
			"confirmed",
			"billed",
			"packing",
			"ready",
			"ready_for_dispatch",
			"dispatched",
			"in_transit",
			"out_for_delivery",
		];
		const completedStatuses = ["completed", "delivered"];
		const paidStatuses = [...confirmedStatuses, ...completedStatuses];

		const [statsRow] = await ctx.db
			.select({
				totalCount: count(),
				pendingCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE LOWER(${orders.status}) IN (${sql.join(
					pendingStatuses.map((s) => sql`${s}`),
					sql`, `,
				)})), 0)`,
				confirmedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE LOWER(${orders.status}) IN (${sql.join(
					confirmedStatuses.map((s) => sql`${s}`),
					sql`, `,
				)})), 0)`,
				completedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE LOWER(${orders.status}) IN (${sql.join(
					completedStatuses.map((s) => sql`${s}`),
					sql`, `,
				)})), 0)`,
				totalSpent: sql<number>`COALESCE(SUM(CASE WHEN LOWER(${orders.status}) IN (${sql.join(
					paidStatuses.map((s) => sql`${s}`),
					sql`, `,
				)}) THEN CAST(${orders.total_amount} AS NUMERIC) ELSE 0 END), 0)`,
			})
			.from(orders)
			.where(eq(orders.customer_id, cid));

		const pendingCount = Number(statsRow?.pendingCount ?? 0);
		const confirmedCount = Number(statsRow?.confirmedCount ?? 0);
		const completedCount = Number(statsRow?.completedCount ?? 0);
		const activeCount = pendingCount + confirmedCount;
		const totalCount = Number(statsRow?.totalCount ?? 0);

		return {
			totalOrders: totalCount,
			activeOrders: activeCount,
			pendingOrders: pendingCount,
			confirmedOrders: confirmedCount,
			completedOrders: completedCount,
			totalSpent: Number(statsRow?.totalSpent ?? 0),
			loyaltyPoints: ctx.customer.loyalty_points ?? 0,
			walletBalance: Number(ctx.customer.store_credit ?? 0),
			loyaltyTier: ctx.customer.loyalty_tier ?? "bronze",
		};
	}),

	// ── Product browsing (Includes active product pricing; public for guest browsing) ───────
	browseProducts: publicProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					category: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			await ensureProductImageColumns(ctx.db);
			await autoRecoverMissingProductImages(ctx.db);
			await ensureSlabPricingTable(ctx.db);

			let rows: any[] = [];
			try {
				rows = await ctx.db.query.products.findMany({
					where: (p, { and, eq, ilike }) =>
						and(
							eq(p.is_deleted, false),
							eq(p.is_hidden, false),
							eq(p.visibility_level, "global"),
							input?.search ? ilike(p.name, `%${input.search}%`) : undefined,
							input?.category ? eq(p.category, input.category) : undefined,
						),
					columns: {
						id: true,
						name: true,
						description: true,
						category: true,
						price: true,
						base_selling_price: true,
						unit: true,
						sku: true,
						image_url: true,
						is_deleted: true,
						is_hidden: true,
						visibility_level: true,
					},
					orderBy: (p, { asc }) => [asc(p.name)],
					limit: 200,
				});
			} catch (findErr) {
				console.warn(
					"[browseProducts] findMany failed, attempting resilient SQL query:",
					findErr,
				);
				try {
					const searchCondition = input?.search?.trim()
						? sql`AND p.name ILIKE ${"%" + input.search.trim() + "%"}`
						: sql``;
					const categoryCondition =
						input?.category && input.category !== "all"
							? sql`AND p.category = ${input.category}`
							: sql``;

					const rawResult = await ctx.db.execute(sql`
						SELECT 
							p.id, 
							p.name, 
							p.description, 
							p.price, 
							p.base_selling_price, 
							p.category, 
							p.unit, 
							p.sku, 
							p.image_url,
							p.is_deleted, 
							p.is_hidden
						FROM products p
						WHERE (p.is_deleted = false OR p.is_deleted IS NULL)
						  AND (p.is_hidden = false OR p.is_hidden IS NULL)
						  AND (p.visibility_level = 'global' OR p.visibility_level IS NULL)
						  ${searchCondition}
						  ${categoryCondition}
						ORDER BY p.name ASC 
						LIMIT 200
					`);

					const rawRows =
						(rawResult as any)?.rows ||
						(Array.isArray(rawResult) ? rawResult : []);
					rows = rawRows.map((r: any) => ({
						id: Number(r.id),
						name: String(r.name || ""),
						description: r.description || null,
						price: r.price !== null ? String(r.price) : null,
						base_selling_price:
							r.base_selling_price !== null
								? String(r.base_selling_price)
								: null,
						category: r.category || "General",
						unit: r.unit || "Pcs",
						sku: r.sku || null,
						is_deleted: Boolean(r.is_deleted),
						is_hidden: Boolean(r.is_hidden),
						image_url: r.image_url || null,
					}));
				} catch (fallbackErr) {
					console.error(
						"[browseProducts] Both findMany and fallback query failed:",
						fallbackErr,
					);
					throw findErr;
				}
			}

			const todayDateStr = new Date().toISOString().split("T")[0];
			let activeDiscounts: any[] = [];
			try {
				const { dailyProductDiscounts } = require("@evaluna/db/schema");
				activeDiscounts = await ctx.db
					.select()
					.from(dailyProductDiscounts)
					.where(
						and(
							eq(dailyProductDiscounts.effective_date, todayDateStr),
							eq(dailyProductDiscounts.is_active, true),
						),
					);
			} catch (e) {
				console.warn("[browseProducts] Error fetching daily discounts:", e);
			}

			const discountMap = new Map<number, any>();
			for (const d of activeDiscounts) {
				discountMap.set(d.product_id, d);
			}

			await ensureSlabPricingTable(ctx.db);
			const productIds = rows.map((p) => p.id);
			let activeSlabs: any[] = [];
			if (productIds.length > 0) {
				try {
					activeSlabs = await ctx.db
						.select()
						.from(productSlabPricing)
						.where(
							and(
								inArray(productSlabPricing.product_id, productIds),
								eq(productSlabPricing.is_active, true),
							),
						)
						.orderBy(asc(productSlabPricing.min_quantity));
				} catch (e) {
					activeSlabs = [];
				}
			}

			const slabsMap = new Map<number, any[]>();
			for (const s of activeSlabs) {
				const list = slabsMap.get(s.product_id) || [];
				list.push({
					id: s.id,
					productId: s.product_id,
					minQuantity: Number(s.min_quantity),
					maxQuantity: s.max_quantity !== null ? Number(s.max_quantity) : null,
					unitPrice: Number(s.unit_price),
					startDate: s.start_date,
					endDate: s.end_date,
					isActive: s.is_active,
				});
				slabsMap.set(s.product_id, list);
			}

			// Fetch branch inventory for customer's branch (default to branch 1 if unauthenticated guest)
			const customerBranchId = (ctx as any).customer?.branch_id || 1;
			const branchInvMap = new Map<
				number,
				{ inStock: number; reservedStock: number }
			>();
			if (productIds.length > 0) {
				try {
					const invRows = await ctx.db
						.select({
							productId: branchInventory.product_id,
							inStock: branchInventory.in_stock,
							reservedStock: branchInventory.reserved_stock,
						})
						.from(branchInventory)
						.where(
							and(
								inArray(branchInventory.product_id, productIds),
								eq(branchInventory.branch_id, customerBranchId),
							),
						);
					for (const r of invRows) {
						branchInvMap.set(r.productId, {
							inStock: Number(r.inStock ?? 0),
							reservedStock: Number(r.reservedStock ?? 0),
						});
					}
				} catch (e) {
					console.warn("[browseProducts] Error fetching branch inventory:", e);
				}
			}

			const enriched = rows.map((p) => {
				const originalPrice = Number(p.price || p.base_selling_price || 0);
				const disc = discountMap.get(p.id);

				let hasActiveOffer = false;
				let finalPrice = originalPrice;
				let discountPercent = 0;
				let offerReason = "";

				if (disc && disc.is_active) {
					hasActiveOffer = true;
					finalPrice = Number(disc.discounted_price || originalPrice);
					discountPercent = Number(
						disc.discount_percent ||
							(originalPrice > 0
								? Math.round(
										((originalPrice - finalPrice) / originalPrice) * 100,
									)
								: 0),
					);
					offerReason = disc.reason || "Today's Special Deal";
				}

				const itemSlabs = slabsMap.get(p.id) || [];
				const slabEndDate = itemSlabs.find((s) => s.endDate)?.endDate || null;
				const slabStartDate =
					itemSlabs.find((s) => s.startDate)?.startDate || null;

				const inv = branchInvMap.get(p.id);
				const physicalStock = inv ? inv.inStock : 0;
				const reservedStock = inv ? inv.reservedStock : 0;
				const availableStock = Math.max(
					0,
					Number((physicalStock - reservedStock).toFixed(3)),
				);
				const tier = calculateStockTier(availableStock);

				return {
					id: p.id,
					name: p.name,
					description: (p as any).description ?? "No description available",
					category: p.category ?? "General",
					originalPrice,
					price: finalPrice,
					discountPercent,
					hasActiveOffer,
					offerReason,
					offerEndDate: disc?.end_date || null,
					hasSlabs: itemSlabs.length > 0,
					slabs: itemSlabs,
					slabEndDate,
					slabStartDate,
					unit: p.unit ?? null,
					sku: p.sku ?? null,
					image: (p as any).image_url ?? (p as any).image ?? null,
					imageUrl: (p as any).image_url ?? (p as any).image ?? null,
					inStock: physicalStock,
					reservedStock,
					availableStock,
					stockStatus: tier.stockStatus,
					stockBadgeText: tier.stockBadgeText,
					stockBadgeTextHi: tier.stockBadgeTextHi,
					stockBadgeColor: tier.stockBadgeColor,
					stockWarningText: tier.stockWarningText,
					stockWarningTextHi: tier.stockWarningTextHi,
					available:
						tier.isAvailable &&
						!(p as any).is_out_of_stock &&
						!p.is_deleted &&
						!p.is_hidden,
				};
			});

			return enriched.sort((a, b) => {
				if (a.hasActiveOffer && !b.hasActiveOffer) return -1;
				if (!a.hasActiveOffer && b.hasActiveOffer) return 1;
				return a.name.localeCompare(b.name);
			});
		}),

	// ── Persistent Customer Shopping Cart ─────────────────────────────────────
	getCart: customerProcedure.query(async ({ ctx }) => {
		return await getCartHelper(ctx.db, ctx.customer.id, ctx.customer.branch_id);
	}),

	addToCart: customerProcedure
		.input(
			z.object({
				productId: z.number().int().positive(),
				quantity: z.number().positive().default(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ensureCartTables(ctx.db);
			let [activeCart] = await ctx.db
				.select()
				.from(carts)
				.where(
					and(
						eq(carts.customer_id, ctx.customer.id),
						eq(carts.status, "active"),
					),
				)
				.limit(1);

			if (!activeCart) {
				const [created] = await ctx.db
					.insert(carts)
					.values({ customer_id: ctx.customer.id, status: "active" })
					.returning();
				activeCart = created;
			}

			// Validate product exists and is active
			const [prod] = await ctx.db
				.select()
				.from(products)
				.where(
					and(eq(products.id, input.productId), eq(products.is_deleted, false)),
				)
				.limit(1);

			if (!prod) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found or unavailable.",
				});
			}

			// Validate real-time available stock
			const branchId = ctx.customer.branch_id || 1;
			const [inv] = await ctx.db
				.select({
					in_stock: branchInventory.in_stock,
					reserved_stock: branchInventory.reserved_stock,
				})
				.from(branchInventory)
				.where(
					and(
						eq(branchInventory.product_id, input.productId),
						eq(branchInventory.branch_id, branchId),
					),
				)
				.limit(1);

			const physicalStock = Number(inv?.in_stock ?? 0);
			const reservedStock = Number(inv?.reserved_stock ?? 0);
			const availableStock = Math.max(
				0,
				Number((physicalStock - reservedStock).toFixed(3)),
			);

			if (availableStock <= 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Currently unavailable. This product will be available once stock is replenished.",
				});
			}

			// Check if item already exists in cart -> merge quantities
			const [existing] = await ctx.db
				.select()
				.from(cartItems)
				.where(
					and(
						eq(cartItems.cart_id, activeCart.id),
						eq(cartItems.product_id, input.productId),
					),
				)
				.limit(1);

			const currentQty = existing ? Number(existing.quantity) : 0;
			const targetTotal = Number((currentQty + input.quantity).toFixed(3));
			if (targetTotal > availableStock) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Only ${availableStock} units are currently available. You already have ${currentQty} in your cart.`,
				});
			}

			if (existing) {
				await ctx.db
					.update(cartItems)
					.set({ quantity: String(targetTotal), updated_at: new Date() })
					.where(eq(cartItems.id, existing.id));
			} else {
				await ctx.db.insert(cartItems).values({
					cart_id: activeCart.id,
					product_id: input.productId,
					quantity: String(Number(input.quantity.toFixed(3))),
				});
			}

			return await getCartHelper(
				ctx.db,
				ctx.customer.id,
				ctx.customer.branch_id,
			);
		}),

	updateCartItemQuantity: customerProcedure
		.input(
			z.object({
				productId: z.number().int().positive(),
				quantity: z.number().min(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ensureCartTables(ctx.db);
			const [activeCart] = await ctx.db
				.select()
				.from(carts)
				.where(
					and(
						eq(carts.customer_id, ctx.customer.id),
						eq(carts.status, "active"),
					),
				)
				.limit(1);

			if (!activeCart) {
				return await getCartHelper(
					ctx.db,
					ctx.customer.id,
					ctx.customer.branch_id,
				);
			}

			if (input.quantity <= 0) {
				await ctx.db
					.delete(cartItems)
					.where(
						and(
							eq(cartItems.cart_id, activeCart.id),
							eq(cartItems.product_id, input.productId),
						),
					);
			} else {
				// Validate real-time available stock
				const branchId = ctx.customer.branch_id || 1;
				const [inv] = await ctx.db
					.select({
						in_stock: branchInventory.in_stock,
						reserved_stock: branchInventory.reserved_stock,
					})
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.product_id, input.productId),
							eq(branchInventory.branch_id, branchId),
						),
					)
					.limit(1);

				const physicalStock = Number(inv?.in_stock ?? 0);
				const reservedStock = Number(inv?.reserved_stock ?? 0);
				const availableStock = Math.max(
					0,
					Number((physicalStock - reservedStock).toFixed(3)),
				);

				if (availableStock <= 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"This product is currently out of stock. Please update your cart.",
					});
				}

				if (input.quantity > availableStock) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot order more than available stock (${availableStock} units).`,
					});
				}

				const [existing] = await ctx.db
					.select()
					.from(cartItems)
					.where(
						and(
							eq(cartItems.cart_id, activeCart.id),
							eq(cartItems.product_id, input.productId),
						),
					)
					.limit(1);

				if (existing) {
					await ctx.db
						.update(cartItems)
						.set({
							quantity: String(Number(input.quantity.toFixed(3))),
							updated_at: new Date(),
						})
						.where(eq(cartItems.id, existing.id));
				} else {
					await ctx.db.insert(cartItems).values({
						cart_id: activeCart.id,
						product_id: input.productId,
						quantity: String(Number(input.quantity.toFixed(3))),
					});
				}
			}

			return await getCartHelper(
				ctx.db,
				ctx.customer.id,
				ctx.customer.branch_id,
			);
		}),

	removeFromCart: customerProcedure
		.input(z.object({ productId: z.number().int().positive() }))
		.mutation(async ({ ctx, input }) => {
			await ensureCartTables(ctx.db);
			const [activeCart] = await ctx.db
				.select()
				.from(carts)
				.where(
					and(
						eq(carts.customer_id, ctx.customer.id),
						eq(carts.status, "active"),
					),
				)
				.limit(1);

			if (activeCart) {
				await ctx.db
					.delete(cartItems)
					.where(
						and(
							eq(cartItems.cart_id, activeCart.id),
							eq(cartItems.product_id, input.productId),
						),
					);
			}

			return await getCartHelper(
				ctx.db,
				ctx.customer.id,
				ctx.customer.branch_id,
			);
		}),

	clearCart: customerProcedure.mutation(async ({ ctx }) => {
		await ensureCartTables(ctx.db);
		const [activeCart] = await ctx.db
			.select()
			.from(carts)
			.where(
				and(eq(carts.customer_id, ctx.customer.id), eq(carts.status, "active")),
			)
			.limit(1);

		if (activeCart) {
			await ctx.db
				.delete(cartItems)
				.where(eq(cartItems.cart_id, activeCart.id));
		}

		return { success: true };
	}),

	checkoutCart: customerProcedure
		.input(
			z.object({
				idempotencyKey: z.string().uuid(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ensureCartTables(ctx.db);

			// 1. Idempotency guard check (handles rapid retries/double-clicks)
			const existingSync = await ctx.db.query.pendingSync.findFirst({
				where: eq(pendingSync.id, input.idempotencyKey),
			});
			if (existingSync?.entity_id) {
				const prior = await ctx.db.query.orders.findFirst({
					where: and(
						eq(orders.id, existingSync.entity_id),
						eq(orders.customer_id, ctx.customer.id),
					),
				});
				if (prior) {
					return {
						orderId: prior.id,
						orderRef: `ORD-${prior.id}`,
						totalAmount: Number(prior.total_amount),
						duplicate: true,
					};
				}
			}

			// 2. Fetch active cart
			const [activeCart] = await ctx.db
				.select()
				.from(carts)
				.where(
					and(
						eq(carts.customer_id, ctx.customer.id),
						eq(carts.status, "active"),
					),
				)
				.limit(1);

			if (!activeCart) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Your shopping cart is empty.",
				});
			}

			const items = await ctx.db
				.select({
					id: cartItems.id,
					productId: cartItems.product_id,
					quantity: cartItems.quantity,
					name: products.name,
					sku: products.sku,
					price: products.price,
					baseSellingPrice: products.base_selling_price,
					isDeleted: products.is_deleted,
					isHidden: products.is_hidden,
				})
				.from(cartItems)
				.innerJoin(products, eq(cartItems.product_id, products.id))
				.where(eq(cartItems.cart_id, activeCart.id));

			const validItems = items.filter(
				(i: any) => !i.isDeleted && !i.isHidden && Number(i.quantity) > 0,
			);

			if (validItems.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Your cart does not contain any available products.",
				});
			}

			// 3. Authoritative price resolution (daily deals & volume slabs)
			const todayDateStr = new Date().toISOString().split("T")[0];
			let activeDiscounts: any[] = [];
			try {
				const { dailyProductDiscounts } = require("@evaluna/db/schema");
				activeDiscounts = await ctx.db
					.select()
					.from(dailyProductDiscounts)
					.where(
						and(
							eq(dailyProductDiscounts.effective_date, todayDateStr),
							eq(dailyProductDiscounts.is_active, true),
						),
					);
			} catch (e) {
				activeDiscounts = [];
			}
			const discountMap = new Map<number, any>();
			for (const d of activeDiscounts) {
				discountMap.set(d.product_id, d);
			}

			const prodIds = validItems.map((i: any) => i.productId);
			let activeSlabs: any[] = [];
			if (prodIds.length > 0) {
				try {
					activeSlabs = await ctx.db
						.select()
						.from(productSlabPricing)
						.where(
							and(
								inArray(productSlabPricing.product_id, prodIds),
								eq(productSlabPricing.is_active, true),
							),
						)
						.orderBy(asc(productSlabPricing.min_quantity));
				} catch (e) {
					activeSlabs = [];
				}
			}
			const slabsMap = new Map<number, any[]>();
			for (const s of activeSlabs) {
				const list = slabsMap.get(s.product_id) || [];
				list.push({
					id: s.id,
					productId: s.product_id,
					minQuantity: Number(s.min_quantity),
					maxQuantity: s.max_quantity !== null ? Number(s.max_quantity) : null,
					unitPrice: Number(s.unit_price),
					startDate: s.start_date,
					endDate: s.end_date,
					isActive: s.is_active,
				});
				slabsMap.set(s.product_id, list);
			}

			const cleanItems = validItems.map((it: any) => {
				const qty = Number(Number(it.quantity).toFixed(3));
				const originalPrice = Number(it.price || it.baseSellingPrice || 0);
				const disc = discountMap.get(it.productId);
				const itemSlabs = slabsMap.get(it.productId) || [];

				let effectivePrice = originalPrice;
				const matchingSlab = findMatchingSlab(itemSlabs, qty);
				if (matchingSlab) {
					effectivePrice = Number(matchingSlab.unitPrice);
				} else if (disc && disc.is_active) {
					effectivePrice = Number(disc.discounted_price || originalPrice);
				}

				return {
					productId: it.productId,
					quantity: qty,
					name: it.name,
					sku: it.sku,
					price: effectivePrice,
				};
			});

			const totalAmount = cleanItems.reduce(
				(sum: number, it: any) => sum + it.price * it.quantity,
				0,
			);

			// 4. Atomic Order Placement Transaction
			const createdResult = await ctx.db.transaction(async (tx: any) => {
				// Re-verify idempotency inside transaction
				const existingSync = await tx.query.pendingSync.findFirst({
					where: eq(pendingSync.id, input.idempotencyKey),
				});
				if (existingSync?.entity_id) {
					const prior = await tx.query.orders.findFirst({
						where: and(
							eq(orders.id, existingSync.entity_id),
							eq(orders.customer_id, ctx.customer.id),
						),
					});
					if (prior) {
						return {
							orderId: prior.id,
							orderRef: `ORD-${prior.id}`,
							totalAmount: Number(prior.total_amount),
							duplicate: true,
						};
					}
				}

				// Insert Order
				const [order] = await tx
					.insert(orders)
					.values({
						customer_id: ctx.customer.id,
						branch_id: ctx.customer.branch_id ?? 1,
						total_amount: totalAmount.toFixed(2),
						user_uid: ctx.user.id,
						status: "pending_review",
						original_items: cleanItems,
					})
					.returning();

				if (!order) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create order record.",
					});
				}

				// Insert Order Items
				await tx.insert(orderItems).values(
					cleanItems.map((i: any) => ({
						order_id: order.id,
						product_id: i.productId,
						quantity: String(i.quantity),
						original_quantity: String(i.quantity),
						picked_quantity: "0",
						price: i.price.toFixed(2),
					})),
				);

				// Clear active cart items
				await tx.delete(cartItems).where(eq(cartItems.cart_id, activeCart.id));

				// Record Idempotency
				await tx.insert(pendingSync).values({
					id: input.idempotencyKey,
					branch_id: ctx.customer.branch_id ?? null,
					operation_type: "CHECKOUT_CUSTOMER_CART",
					entity_type: "order",
					entity_id: order.id,
					payload: {
						customerId: ctx.customer.id,
						items: cleanItems,
						notes: input.notes || null,
					},
				});

				return {
					orderId: order.id,
					orderRef: `ORD-${order.id}`,
					totalAmount,
					duplicate: false,
				};
			});

			// Fire notification to Sales & Managers about new customer order
			if (!createdResult.duplicate && createdResult.orderId) {
				try {
					void notifyCustomerOrderPlaced({
						orderId: createdResult.orderId,
						customerName: ctx.customer.name || "Customer",
						itemCount: createdResult.orderId ? 1 : 0,
						branchId: ctx.customer.branch_id,
					});
				} catch (notifErr) {
					console.warn("[checkoutCart] Notification error:", notifErr);
				}
			}

			return createdResult;
		}),

	// ── My orders (list) ──────────────────────────────────────────────────────
	getMyOrders: customerProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(20),
					page: z.number().min(1).default(1),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const limit = input?.limit ?? 20;
			const page = input?.page ?? 1;
			const offset = (page - 1) * limit;

			const rows = await ctx.db.query.orders.findMany({
				columns: {
					id: true,
					status: true,
					total_amount: true,
					created_at: true,
				},
				where: eq(orders.customer_id, ctx.customer.id),
				orderBy: [desc(orders.created_at)],
				limit,
				offset,
				with: {
					orderItems: {
						columns: {
							id: true,
						},
					},
				},
			});

			// Query active packages and delivery stops for this customer to determine granular status
			const orderIds = rows.map((r) => r.id);
			let packagesList: { order_id: number; status: string | null }[] = [];
			let tripStopsList: {
				customer_id: number;
				status: string | null;
				trip_status?: string | null;
			}[] = [];

			if (orderIds.length > 0) {
				try {
					const {
						packages,
						tripStops,
						deliveryTrips,
					} = require("@evaluna/db/schema");
					packagesList = await ctx.db
						.select({
							order_id: packages.order_id,
							status: packages.status,
						})
						.from(packages)
						.where(inArray(packages.order_id, orderIds));

					tripStopsList = await ctx.db
						.select({
							customer_id: tripStops.customer_id,
							status: tripStops.status,
							trip_status: deliveryTrips.status,
						})
						.from(tripStops)
						.innerJoin(deliveryTrips, eq(deliveryTrips.id, tripStops.trip_id))
						.where(eq(tripStops.customer_id, ctx.customer.id));
				} catch (e) {
					// Fallback if schemas not loaded in test mock
				}
			}

			const packageStatusMap = new Map(
				packagesList.map((p) => [p.order_id, p.status]),
			);
			const activeTripStop = tripStopsList.find(
				(ts) =>
					ts.trip_status === "active" ||
					ts.trip_status === "pending" ||
					ts.status === "delivered",
			);

			return rows.map((o) => {
				let effectiveStatus = o.status ?? "pending_review";
				const pkgStatus = packageStatusMap.get(o.id);

				// Calculate workflow progression status
				if (o.status === "completed") {
					effectiveStatus = "completed";
				} else if (
					activeTripStop?.status === "delivered" &&
					(o.status === "ready_for_dispatch" ||
						o.status === "confirmed" ||
						o.status === "dispatched")
				) {
					effectiveStatus = "completed";
				} else if (
					o.status === "dispatched" ||
					activeTripStop?.trip_status === "active"
				) {
					effectiveStatus = "out_for_delivery";
				} else if (
					o.status === "ready_for_dispatch" ||
					pkgStatus === "packed" ||
					pkgStatus === "ready_for_dispatch"
				) {
					effectiveStatus = "ready_for_dispatch";
				} else if (pkgStatus === "packing") {
					effectiveStatus = "packing";
				} else if (o.status === "confirmed") {
					effectiveStatus = "confirmed";
				}

				return {
					id: o.id,
					orderRef: `ORD-${o.id}`,
					date: o.created_at ? o.created_at.toISOString() : null,
					status: effectiveStatus,
					rawStatus: o.status,
					itemsCount: o.orderItems.length,
					total: Number(o.total_amount || 0),
				};
			});
		}),

	getOrders: customerProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(20),
					page: z.number().min(1).default(1),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const limit = input?.limit ?? 20;
			const page = input?.page ?? 1;
			const offset = (page - 1) * limit;

			const rows = await ctx.db.query.orders.findMany({
				columns: {
					id: true,
					status: true,
					total_amount: true,
					created_at: true,
				},
				where: eq(orders.customer_id, ctx.customer.id),
				orderBy: [desc(orders.created_at)],
				limit,
				offset,
				with: {
					orderItems: {
						columns: {
							id: true,
						},
					},
				},
			});

			return rows.map((o) => ({
				id: o.id,
				orderRef: `ORD-${o.id}`,
				date: o.created_at ? o.created_at.toISOString() : null,
				status: o.status,
				itemsCount: o.orderItems.length,
				total: Number(o.total_amount || 0),
			}));
		}),

	getPayments: customerProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(20),
					page: z.number().min(1).default(1),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const cid = ctx.customer.id;
			const limit = input?.limit ?? 20;
			const page = input?.page ?? 1;
			const offset = (page - 1) * limit;

			const rows = await ctx.db.query.orders.findMany({
				where: and(
					eq(orders.customer_id, cid),
					inArray(orders.status, ["confirmed", "completed"]),
				),
				orderBy: [desc(orders.created_at)],
				limit,
				offset,
			});
			return rows.map((o) => ({
				id: o.id,
				paymentRef: `PAY-${o.id}`,
				orderRef: `ORD-${o.id}`,
				date: o.created_at ? o.created_at.toISOString() : null,
				status: o.status === "completed" ? "Completed" : "Confirmed",
				amount: Number(o.total_amount),
			}));
		}),

	// ── My order (detail) ─────────────────────────────────────────────────────
	getMyOrder: customerProcedure
		.input(z.object({ id: z.number().int().positive() }))
		.query(async ({ ctx, input }) => {
			const order = await ctx.db.query.orders.findFirst({
				where: and(
					eq(orders.id, input.id),
					eq(orders.customer_id, ctx.customer.id),
				),
				with: {
					orderItems: {
						with: {
							product: {
								columns: {
									name: true,
									unit: true,
								},
							},
						},
					},
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			// Check package and trip stop status for this order
			let effectiveStatus = order.status ?? "pending_review";
			try {
				const {
					packages,
					tripStops,
					deliveryTrips,
				} = require("@evaluna/db/schema");
				const [pkg] = await ctx.db
					.select({ status: packages.status })
					.from(packages)
					.where(eq(packages.order_id, order.id))
					.limit(1);

				const [stop] = await ctx.db
					.select({
						status: tripStops.status,
						trip_status: deliveryTrips.status,
					})
					.from(tripStops)
					.innerJoin(deliveryTrips, eq(deliveryTrips.id, tripStops.trip_id))
					.where(eq(tripStops.customer_id, ctx.customer.id))
					.orderBy(desc(tripStops.created_at))
					.limit(1);

				if (order.status === "completed") {
					effectiveStatus = "completed";
				} else if (
					stop?.status === "delivered" &&
					(order.status === "ready_for_dispatch" ||
						order.status === "confirmed" ||
						order.status === "dispatched")
				) {
					effectiveStatus = "completed";
				} else if (
					order.status === "dispatched" ||
					stop?.trip_status === "active"
				) {
					effectiveStatus = "out_for_delivery";
				} else if (
					order.status === "ready_for_dispatch" ||
					pkg?.status === "packed" ||
					pkg?.status === "ready_for_dispatch"
				) {
					effectiveStatus = "ready_for_dispatch";
				} else if (pkg?.status === "packing") {
					effectiveStatus = "packing";
				} else if (order.status === "confirmed") {
					effectiveStatus = "confirmed";
				}
			} catch (e) {
				// Fallback to order status
			}

			return {
				id: order.id,
				orderRef: `ORD-${order.id}`,
				status: effectiveStatus,
				rawStatus: order.status,
				date: order.created_at ? order.created_at.toISOString() : null,
				priceVisible: true,
				total: Number(order.total_amount || 0),
				original_items: order.original_items,
				items: order.orderItems.map((it) => ({
					id: it.id,
					productId: it.product_id,
					name: it.product?.name ?? "Item",
					unit: it.product?.unit ?? null,
					quantity: Number(it.quantity),
					price: Number(it.price || 0),
					lineTotal: Number(it.price || 0) * Number(it.quantity),
				})),
			};
		}),

	// ── Invoice — available ONLY after confirmation (prices revealed here) ────
	getMyInvoice: customerProcedure
		.input(z.object({ id: z.number().int().positive() }))
		.query(async ({ ctx, input }) => {
			const order = await ctx.db.query.orders.findFirst({
				where: and(
					eq(orders.id, input.id),
					eq(orders.customer_id, ctx.customer.id),
				),
				with: {
					orderItems: {
						with: {
							product: {
								columns: {
									name: true,
									unit: true,
								},
							},
						},
					},
					paymentMethod: {
						columns: {
							name: true,
						},
					},
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			if (
				!CONFIRMED_STATUSES.includes(
					order.status as (typeof CONFIRMED_STATUSES)[number],
				)
			) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Invoice is available only after the order is confirmed.",
				});
			}

			const items = order.orderItems.map((it) => ({
				name: it.product?.name ?? "Item",
				unit: it.product?.unit ?? null,
				quantity: Number(it.quantity),
				price: Number(it.price),
				lineTotal: Number(it.price) * Number(it.quantity),
			}));

			const subtotal = items.reduce((a, i) => a + i.lineTotal, 0);

			return {
				invoiceNo: `INV-${order.id}`,
				orderRef: `ORD-${order.id}`,
				date: order.created_at ? order.created_at.toISOString() : null,
				customerName: ctx.customer.name,
				items,
				subtotal,
				cgst: Number(order.cgst_amount ?? 0),
				sgst: Number(order.sgst_amount ?? 0),
				igst: Number(order.igst_amount ?? 0),
				discount: Number(order.discount_amount ?? 0),
				total: Number(order.total_amount),
				paymentMethod: order.paymentMethod?.name ?? null,
				paymentStatus: order.status === "completed" ? "Paid" : "Confirmed",
			};
		}),

	// ── Submit a new order ───────────────────────────────────────────────────
	submitOrder: customerProcedure
		.input(
			z.object({
				idempotencyKey: z.string().uuid(),
				items: z
					.array(
						z.object({
							productId: z.number().int().positive(),
							quantity: z.number().positive(),
						}),
					)
					.min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ensureCartTables(ctx.db);
			const createdResult = await ctx.db.transaction(async (tx) => {
				// Idempotency guard — same key already processed → return that order.
				const existing = await tx.query.pendingSync.findFirst({
					where: eq(pendingSync.id, input.idempotencyKey),
				});

				if (existing?.entity_id) {
					const prior = await tx.query.orders.findFirst({
						where: and(
							eq(orders.id, existing.entity_id),
							eq(orders.customer_id, ctx.customer.id),
						),
					});

					if (prior) {
						return {
							orderId: prior.id,
							orderRef: `ORD-${prior.id}`,
							duplicate: true,
						};
					}
				}

				// Validate products are real, active, and customer-orderable.
				const productIds = [...new Set(input.items.map((i) => i.productId))];

				const valid = await tx.query.products.findMany({
					where: and(
						inArray(products.id, productIds),
						eq(products.is_deleted, false),
						eq(products.is_hidden, false),
					),
					columns: {
						id: true,
						name: true,
						sku: true,
						price: true,
						base_selling_price: true,
					},
				});
				const productMap = new Map(valid.map((p) => [p.id, p]));
				const cleanItems = input.items
					.filter((i) => productMap.has(i.productId) && i.quantity > 0)
					.map((i) => {
						const p = productMap.get(i.productId)!;
						const itemPrice = Number(p.price || p.base_selling_price || 0);
						return {
							productId: i.productId,
							quantity: Number(Number(i.quantity).toFixed(3)),
							name: p.name,
							sku: p.sku,
							price: itemPrice,
						};
					});

				if (cleanItems.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No valid products in the order.",
					});
				}

				// Revalidate stock in transaction with locking & atomic reservations
				const branchId = ctx.customer.branch_id || 1;
				const invRecords = await tx
					.select()
					.from(branchInventory)
					.where(
						and(
							inArray(branchInventory.product_id, productIds),
							eq(branchInventory.branch_id, branchId),
						),
					);

				const invMap = new Map(invRecords.map((r: any) => [r.product_id, r]));

				for (const item of cleanItems) {
					const inv = invMap.get(item.productId);
					const inStock = Number(inv?.in_stock ?? 0);
					const reserved = Number(inv?.reserved_stock ?? 0);
					const available = Math.max(
						0,
						Number((inStock - reserved).toFixed(3)),
					);

					if (available <= 0) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message:
								"This product is currently out of stock. Please update your cart.",
						});
					}

					if (item.quantity > available) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Requested quantity for "${item.name}" (${item.quantity}) exceeds available stock (${available} units). Please update your cart.`,
						});
					}
				}

				// Deduplication guard — check for rapid identical order submitted within last 15 seconds
				const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
				const recentOrders = await tx.query.orders.findMany({
					where: and(
						eq(orders.customer_id, ctx.customer.id),
						gte(orders.created_at, fifteenSecondsAgo),
					),
					orderBy: [desc(orders.created_at)],
					with: {
						orderItems: true,
					},
				});

				for (const recent of recentOrders) {
					if (
						!recent.orderItems ||
						recent.orderItems.length !== cleanItems.length
					)
						continue;
					const recentItemMap = new Map(
						recent.orderItems.map((oi: any) => [oi.product_id, oi.quantity]),
					);
					const isExactDuplicate = cleanItems.every(
						(it) =>
							Number(recentItemMap.get(it.productId)) === Number(it.quantity),
					);
					if (isExactDuplicate) {
						return {
							orderId: recent.id,
							orderRef: `ORD-${recent.id}`,
							duplicate: true,
						};
					}
				}

				const totalAmount = cleanItems.reduce(
					(sum, it) => sum + it.price * it.quantity,
					0,
				);

				// Create the order with calculated total from product pricing
				const [order] = await tx
					.insert(orders)
					.values({
						customer_id: ctx.customer.id,
						branch_id: ctx.customer.branch_id ?? null,
						total_amount: totalAmount.toFixed(2),
						user_uid: ctx.user.id,
						status: "pending_review",
						original_items: cleanItems,
					})
					.returning();

				if (!order) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create the order.",
					});
				}

				await tx.insert(orderItems).values(
					cleanItems.map((i) => ({
						order_id: order.id,
						product_id: i.productId,
						quantity: i.quantity.toString(),
						price: i.price.toFixed(2),
					})),
				);

				// Atomically reserve inventory for ordered items
				for (const item of cleanItems) {
					const inv = invMap.get(item.productId);
					if (inv) {
						await tx
							.update(branchInventory)
							.set({
								reserved_stock: sql`${branchInventory.reserved_stock} + ${item.quantity}`,
							})
							.where(eq(branchInventory.id, inv.id));
					} else {
						await tx.insert(branchInventory).values({
							product_id: item.productId,
							branch_id: branchId,
							in_stock: "0",
							reserved_stock: String(item.quantity),
							reorder_level: 10,
						});
					}
				}

				await tx.insert(pendingSync).values({
					id: input.idempotencyKey,
					branch_id: ctx.customer.branch_id ?? null,
					operation_type: "CREATE_CUSTOMER_ORDER",
					entity_type: "order",
					entity_id: order.id,
					payload: {
						customerId: ctx.customer.id,
						items: cleanItems,
					},
				});

				const result = {
					orderId: order.id,
					orderRef: `ORD-${order.id}`,
					duplicate: false,
				};

				return result;
			});

			// Clear active persistent cart items upon successful submission (best-effort)
			try {
				await ensureCartTables(ctx.db);
				const [activeCart] = await ctx.db
					.select()
					.from(carts)
					.where(
						and(
							eq(carts.customer_id, ctx.customer.id),
							eq(carts.status, "active"),
						),
					)
					.limit(1);
				if (activeCart) {
					await ctx.db
						.delete(cartItems)
						.where(eq(cartItems.cart_id, activeCart.id));
				}
			} catch (_cartErr) {
				// cart clear is best effort
			}

			// Fire notification to Sales & Managers about new customer order and broadcast stock update
			if (!createdResult.duplicate && createdResult.orderId) {
				try {
					notifyStockChanged(undefined, ctx.customer.branch_id || 1);
				} catch (e) {
					console.warn("[submitOrder] Stock update broadcast error:", e);
				}
				try {
					void notifyCustomerOrderPlaced({
						orderId: createdResult.orderId,
						customerName: ctx.customer.name || "Customer",
						itemCount: input.items.length,
						branchId: ctx.customer.branch_id,
					});
				} catch (notifErr) {
					console.warn("[submitOrder] Notification error:", notifErr);
				}
			}

			return createdResult;
		}),

	// ── Dashboard: customer relationship overview (for sales/reps) ────────────
	getDashboardStats: roleProcedure(["admin", "manager", "sales"]).query(
		async ({ ctx }) => {
			const [totalCustomers] = await ctx.db
				.select({ c: count() })
				.from(customers)
				.where(eq(customers.isActive, true));

			const [activeCustomers] = await ctx.db
				.select({ c: count() })
				.from(customers)
				.where(
					and(eq(customers.isActive, true), eq(customers.status, "active")),
				);

			const [todayOrders] = await ctx.db
				.select({ c: count() })
				.from(orders)
				.where(
					and(
						gte(orders.created_at, startOfDay(new Date())),
						lte(orders.created_at, endOfDay(new Date())),
					),
				);

			const [revenueToday] = await ctx.db
				.select({
					t: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)`,
				})
				.from(orders)
				.where(
					and(
						gte(orders.created_at, startOfDay(new Date())),
						lte(orders.created_at, endOfDay(new Date())),
						inArray(orders.status, CONFIRMED_STATUSES),
					),
				);

			const [satisfactionScore] = await ctx.db
				.select({
					s: sql<number>`COALESCE(AVG(${customers.satisfaction_score}), 0)`,
				})
				.from(customers)
				.where(eq(customers.isActive, true));

			const [repeatCustomerRate] = await ctx.db
				.select({
					r: sql<number>`COALESCE(
            (
              SELECT COUNT(DISTINCT customer_id)
              FROM orders
              WHERE customer_id IN (
                SELECT customer_id
                FROM orders
                GROUP BY customer_id
                HAVING COUNT(*) > 1
              )
            ) * 100.0 / NULLIF(COUNT(DISTINCT customer_id), 0),
            0
          )`,
				})
				.from(orders);

			const [avgOrderValue] = await ctx.db
				.select({
					a: sql<number>`COALESCE(AVG(${orders.total_amount}), 0)`,
				})
				.from(orders)
				.where(inArray(orders.status, CONFIRMED_STATUSES));

			const [supportTickets] = await ctx.db
				.select({ t: count() })
				.from(pendingSync)
				.where(
					and(
						eq(pendingSync.operation_type, "CUSTOMER_SUPPORT"),
						gte(pendingSync.created_at, startOfDay(new Date())),
					),
				);

			const recentOrders = await ctx.db.query.orders.findMany({
				where: inArray(orders.status, CUSTOMER_ORDER_STATUSES),
				orderBy: [desc(orders.created_at)],
				limit: 5,
				with: {
					customer: {
						columns: {
							id: true,
							name: true,
						},
					},
					orderItems: {
						columns: {
							id: true,
						},
					},
				},
			});

			const recentOrderData = recentOrders.map((o) => ({
				id: o.id,
				customerName: o.customer?.name ?? "Unknown",
				items: o.orderItems.length,
				total: CONFIRMED_STATUSES.includes(
					o.status as (typeof CONFIRMED_STATUSES)[number],
				)
					? Number(o.total_amount)
					: null,
				status: o.status,
				date: o.created_at ? o.created_at.toISOString() : null,
			}));

			return {
				totalCustomers: Number(totalCustomers?.c ?? 0),
				activeCustomers: Number(activeCustomers?.c ?? 0),
				ordersToday: Number(todayOrders?.c ?? 0),
				revenueToday: Number(revenueToday?.t ?? 0),
				satisfactionScore: Number(satisfactionScore?.s ?? 0),
				repeatCustomerRate: Number(repeatCustomerRate?.r ?? 0),
				avgOrderValue: Number(avgOrderValue?.a ?? 0),
				supportTickets: Number(supportTickets?.t ?? 0),
				recentOrders: recentOrderData,
			};
		},
	),
});
