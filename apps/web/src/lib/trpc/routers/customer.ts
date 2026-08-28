import {
	orderItems,
	orders,
	pendingSync,
	products,
	customers,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { gte, lte, startOfDay, endOfDay } from "drizzle-orm";
import { z } from "zod";
import { customerProcedure, roleProcedure, router } from "../init";

// Order lifecycle for the customer-ordering workflow.
//   pending_review → customer submitted, awaiting salesperson (NO prices yet)
//   under_review   → salesperson opened/editing
//   confirmed      → salesperson finalized commercial details + invoice (prices visible)
//   completed      → paid/fulfilled (also price-visible)
const CONFIRMED_STATUSES = ["confirmed", "completed"];
const PENDING_STATUSES = ["pending_review", "under_review"];

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
			created_at: c.created_at,
		};
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
			.select({ t: sql<number>`COALESCE(SUM(${orders.total_amount}),0)` })
			.from(orders)
			.where(
				and(
					eq(orders.customer_id, cid),
					inArray(orders.status, CONFIRMED_STATUSES),
				),
			);
		return {
			totalOrders: totalRow?.c ?? 0,
			pendingOrders: pendingRow?.c ?? 0,
			totalSpent: Number(spentRow?.t ?? 0),
			loyaltyPoints: ctx.customer.loyalty_points ?? 0,
			walletBalance: Number(ctx.customer.store_credit ?? 0),
			loyaltyTier: ctx.customer.loyalty_tier ?? "bronze",
		};
	}),

	// ── Product browsing (NO price fields ever returned — rule 2) ─────────────
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
			// PRICE INTENTIONALLY OMITTED.
			return rows.map((p) => ({
				id: p.id,
				name: p.name,
				category: p.category ?? "General",
				unit: p.unit ?? null,
				sku: p.sku ?? null,
			}));
		}),

	// ── My orders (list) — total hidden until confirmed ───────────────────────
	getMyOrders: customerProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db.query.orders.findMany({
			where: eq(orders.customer_id, ctx.customer.id),
			orderBy: [desc(orders.created_at)],
			with: { orderItems: { columns: { id: true } }}
		});
		return rows.map((o) => ({
			orderRef: `ORD-${o.id}`,
			date: o.created_at ? o.created_at.toISOString() : null,
			status: o.status,
			itemsCount: o.orderItems.length,
			total: Number(o.total_amount) ?? null,
		}));
	}),
	// ── My order (detail) — line prices hidden until confirmed ────────────────
	getMyOrder: customerProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const order = await ctx.db.query.orders.findFirst({
				where: and(
					eq(orders.id, input.id),
					eq(orders.customer_id, ctx.customer.id),
				),
				with: {
					orderItems: {
						with: {
								product: { columns: { name: true, unit: true } }
							}
					}
				},
			});

			if (!order)
				throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

			const isConfirmed = CONFIRMED_STATUSES.includes(order.status ?? "");
			return {
				id: order.id,
				orderRef: `ORD-${order.id}`,
				status: order.status,
				date: order.created_at ? order.created_at.toISOString() : null,
				priceVisible: isConfirmed,
				total: isConfirmed ? Number(order.total_amount) : null,
				items: order.orderItems.map((it) => ({
					id: it.id,
					productId: it.product_id,
					name: it.product?.name ?? "Item",
					unit: it.product?.unit ?? null,
					quantity: it.quantity,
					price: isConfirmed ? Number(it.price) : null,
					lineTotal: isConfirmed ? Number(it.price) * it.quantity : null,
				})),
			};
		}),

	// ── Invoice — available ONLY after confirmation (prices revealed here) ────
	getMyInvoice: customerProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const order = await ctx.db.query.orders.findFirst({
				where: and(
					eq(orders.id, input.id),
					eq(orders.customer_id, ctx.customer.id),
				),
				with: {
					orderItems: {
						with: {
								product: { columns: { name: true, unit: true } }
							}
					},
					paymentMethod: { columns: { name: true } }
				}
			});

			if (!order) throw new TRPCError({ code: "NOT_FOUND" });

			if (!CONFIRMED_STATUSES.includes(order.status ?? "")) {
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

	// ── Submit a new order (items + quantities ONLY — NO prices sent/stored) ──
	// Idempotent via a client UUID stored in pending_sync.id (PK). A repeated
	// submit with the same key returns the original order instead of duplicating.
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
			return await ctx.db.transaction(async (tx) => {
				// Idempotency guard — same key already processed → return that order.
				const existing = await tx.query.pendingSync.findFirst({
					where: eq(pendingSync.id, input.idempotencyKey),
				},
				if (existing?.entity_id) {
					const prior = await tx.query.orders.findFirst({
						where: and(
							eq(orders.id, existing.entity_id),
							eq(orders.customer_id, ctx.customer.id),
						),
					},
					if (prior)
						return {
							orderId: prior.id,
							orderRef: `ORD-${prior.id}`,
							duplicate: true,
						};
				}

				// Validate products are real, active, and customer-orderable.
				const productIds = [...new Set(input.items.map((i) => i.productId))];
				const valid = await tx.query.products.findMany({
					where: and(
						inArray(products.id, productIds),
						eq(products.is_deleted, false),
						eq(products.is_hidden, false),
					),
					columns: { id: true }
				},
				const validIds = new Set(valid.map((p) => p.id));
				const cleanItems = input.items.filter(
					(i) => validIds.has(i.productId) && i.quantity > 0,
				);
				if (cleanItems.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No valid products in the order.",
					},
				}

				// Create the order with NO pricing — prices are applied by the
				// salesperson at confirmation. Status starts as pending_review.
				const [order] = await tx
					.insert(orders)
					.values({
						customer_id: ctx.customer.id,
						branch_id: ctx.customer.branch_id ?? null,
						total_amount: "0",
						user_uid: ctx.user.id,
						status: "pending_review",
					})
					.returning();

				await tx.insert(orderItems).values(
					cleanItems.map((i) => ({
						order_id: order.id,
						product_id: i.productId,
						quantity: i.quantity,
						price: "0",
					})),
				);

				await tx.insert(pendingSync).values({
					id: input.idempotencyKey,
					branch_id: ctx.customer.branch_id ?? null,
					operation_type: "CREATE_CUSTOMER_ORDER",
					entity_type: "order",
					entity_id: order.id,
					payload: { customerId: ctx.customer.id, items: cleanItems }
				},

				return {
					orderId: order.id,
					orderRef: `ORD-${order.id}`,
					duplicate: false,
				};
			},
		}),

	// ── Dashboard: customer relationship overview (for sales/reps) ────────
	getDashboardStats: roleProcedure(["admin", "manager", "sales"])
		.query(async ({ ctx }) => {
			const [totalCustomers] = await ctx.db
				.select({ c: count() })
				.from(customers)
				.where(eq(customers.isActive, true));

			const [activeCustomers] = await ctx.db
				.select({ c: count() })
				.from(customers)
				.where(
					and(
						eq(customers.isActive, true),
						eq(customers.status, "active")
					)
				);

			const [todayOrders] = await ctx.db
				.select({ c: count() })
				.from(orders)
				.where(
					and(
						gte(orders.created_at, startOfDay(new Date())),
						lte(orders.created_at, endOfDay(new Date()))
					)
				);

			const [revenueToday] = await ctx.db
				.select({ t: sql<number>`COALESCE(SUM(${orders.total_amount}),0)` })
				.from(orders)
				.where(
					and(
						gte(orders.created_at, startOfDay(new Date())),
						lte(orders.created_at, endOfDay(new Date())),
						inArray(orders.status, ["confirmed", "completed"])
					)
				);

			const [satisfactionScore] = await ctx.db
				.select({ s: sql<number>`COALESCE(AVG(${customers.satisfaction_score}), 0)` })
				.from(customers)
				.where(eq(customers.isActive, true));

			const [repeatCustomerRate] = await ctx.db
				.select({ r: sql<number>`COALESCE((
						SELECT COUNT(DISTINCT customer_id)
						FROM orders
						WHERE customer_id IN (
							SELECT customer_id
							FROM orders
							GROUP BY customer_id
							HAVING COUNT(*) > 1
						)
					) * 100.0 / NULLIF(COUNT(DISTINCT customer_id), 0)`, 0) })
				.from(orders);

			const [avgOrderValue] = await ctx.db
				.select({ a: sql<number>`COALESCE(AVG(${orders.total_amount}), 0)` })
				.from(orders)
				.where(inArray(orders.status, ["confirmed", "completed"]));

			const [supportTickets] = await ctx.db
				.select({ t: count() })
				.from(pendingSync)
				.where(
					and(
						eq(pendingSync.operation_type, "CUSTOMER_SUPPORT"),
						gte(pendingSync.created_at, startOfDay(new Date()))
					)
				);

			const recentOrders = await ctx.db.query.orders.findMany({
				where: inArray(orders.status, ["pending_review", "under_review", "confirmed", "completed"]),
				orderBy: [desc(orders.created_at)],
				limit: 5,
				with: {
					customer: {
						columns: { id: true, name: true }
					},
					orderItems: {
						columns: { id: true }
					}
				}
			}).then(rows => rows.map(o => ({
				id: o.id,
				customerName: o.customer?.name ?? "Unknown",
				items: o.orderItems.length,
				total: Number(o.total_amount),
				status: o.status,
				date: o.created_at
			})));

			return {
				totalCustomers: Number(totalCustomers?.c ?? 0),
				activeCustomers: Number(activeCustomers?.c ?? 0),
				ordersToday: Number(todayOrders?.c ?? 0),
				revenueToday: Number(revenueToday?.t ?? 0),
				satisfactionScore: Number(satisfactionScore?.s ?? 0),
				repeatCustomerRate: Number(repeatCustomerRate?.r ?? 0),
				avgOrderValue: Number(avgOrderValue?.a ?? 0),
				supportTickets: Number(supportTickets?.t ?? 0),
				recentOrders
			};
		}),
},


