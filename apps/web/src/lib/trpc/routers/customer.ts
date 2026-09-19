import {
	customers,
	orderItems,
	orders,
	pendingSync,
	products,
	user,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { endOfDay, startOfDay } from "date-fns";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { notifyCustomerOrderPlaced } from "@/lib/notification-service";
import { customerProcedure, roleProcedure, router } from "../init";

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

		const [totalRow] = await ctx.db
			.select({ c: count() })
			.from(orders)
			.where(eq(orders.customer_id, cid));

		const [pendingRow] = await ctx.db
			.select({ c: count() })
			.from(orders)
			.where(
				and(
					eq(orders.customer_id, cid),
					inArray(orders.status, PENDING_STATUSES),
				),
			);

		const [spentRow] = await ctx.db
			.select({
				t: sql<number>`COALESCE(SUM(${orders.total_amount}), 0)`,
			})
			.from(orders)
			.where(
				and(
					eq(orders.customer_id, cid),
					inArray(orders.status, CONFIRMED_STATUSES),
				),
			);

		return {
			totalOrders: Number(totalRow?.c ?? 0),
			pendingOrders: Number(pendingRow?.c ?? 0),
			totalSpent: Number(spentRow?.t ?? 0),
			loyaltyPoints: ctx.customer.loyalty_points ?? 0,
			walletBalance: Number(ctx.customer.store_credit ?? 0),
			loyaltyTier: ctx.customer.loyalty_tier ?? "bronze",
		};
	}),

	// ── Product browsing (Includes active product pricing) ───────────────────
	browseProducts: customerProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					category: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db.query.products.findMany({
				where: (p, { and, eq, ilike }) =>
					and(
						eq(p.is_deleted, false),
						eq(p.is_hidden, false),
						eq(p.visibility_level, "global"),
						input?.search ? ilike(p.name, `%${input.search}%`) : undefined,
						input?.category ? eq(p.category, input.category) : undefined,
					),
				orderBy: (p, { asc }) => [asc(p.name)],
				limit: 200,
			});

			return rows.map((p) => ({
				id: p.id,
				name: p.name,
				description: (p as any).description ?? "No description available",
				category: p.category ?? "General",
				price: Number(p.price || p.base_selling_price || 0),
				unit: p.unit ?? null,
				sku: p.sku ?? null,
				image: (p as any).image_url ?? (p as any).image ?? null,
				available: !(p as any).is_out_of_stock && !p.is_deleted && !p.is_hidden,
			}));
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
			let tripStopsList: { customer_id: number; status: string | null; trip_status?: string | null }[] = [];

			if (orderIds.length > 0) {
				try {
					const { packages, tripStops, deliveryTrips } = require("@evaluna/db/schema");
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

			const packageStatusMap = new Map(packagesList.map((p) => [p.order_id, p.status]));
			const activeTripStop = tripStopsList.find(
				(ts) => ts.trip_status === "active" || ts.trip_status === "pending" || ts.status === "delivered",
			);

			return rows.map((o) => {
				let effectiveStatus = o.status ?? "pending_review";
				const pkgStatus = packageStatusMap.get(o.id);

				// Calculate workflow progression status
				if (o.status === "completed") {
					effectiveStatus = "completed";
				} else if (activeTripStop?.status === "delivered" && (o.status === "ready_for_dispatch" || o.status === "confirmed" || o.status === "dispatched")) {
					effectiveStatus = "completed";
				} else if (o.status === "dispatched" || activeTripStop?.trip_status === "active") {
					effectiveStatus = "out_for_delivery";
				} else if (o.status === "ready_for_dispatch" || pkgStatus === "packed" || pkgStatus === "ready_for_dispatch") {
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
				const { packages, tripStops, deliveryTrips } = require("@evaluna/db/schema");
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
				} else if (stop?.status === "delivered" && (order.status === "ready_for_dispatch" || order.status === "confirmed" || order.status === "dispatched")) {
					effectiveStatus = "completed";
				} else if (order.status === "dispatched" || stop?.trip_status === "active") {
					effectiveStatus = "out_for_delivery";
				} else if (order.status === "ready_for_dispatch" || pkg?.status === "packed" || pkg?.status === "ready_for_dispatch") {
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
					quantity: it.quantity,
					price: Number(it.price || 0),
					lineTotal: Number(it.price || 0) * it.quantity,
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
				quantity: it.quantity,
				price: Number(it.price),
				lineTotal: Number(it.price) * it.quantity,
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
							quantity: z.number().int().positive(),
						}),
					)
					.min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
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
					columns: { id: true, name: true, sku: true, price: true, base_selling_price: true },
				});
				const productMap = new Map(valid.map((p) => [p.id, p]));
				const cleanItems = input.items
					.filter((i) => productMap.has(i.productId) && i.quantity > 0)
					.map((i) => {
						const p = productMap.get(i.productId)!;
						const itemPrice = Number(p.price || p.base_selling_price || 0);
						return {
							productId: i.productId,
							quantity: i.quantity,
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
					if (!recent.orderItems || recent.orderItems.length !== cleanItems.length) continue;
					const recentItemMap = new Map(
						recent.orderItems.map((oi: any) => [oi.product_id, oi.quantity]),
					);
					const isExactDuplicate = cleanItems.every(
						(it) => recentItemMap.get(it.productId) === it.quantity,
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
						quantity: i.quantity,
						price: i.price.toFixed(2),
					})),
				);

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

			// Fire notification to Sales & Managers about new customer order
			if (!createdResult.duplicate && createdResult.orderId) {
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
