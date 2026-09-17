import {
	auditLogs,
	branchInventory,
	customers,
	deliveryRoutes,
	deliveryStops,
	eWayBills,
	loyaltyHistory,
	notifications,
	orderAudits,
	orderItems,
	orders,
	packLists,
	paymentMethods,
	pendingSync,
	pickListItems,
	pickLists,
	products,
	proofOfDeliveries,
	routeStops,
	salesReturnItems,
	salesReturns,
	staff,
	stockLedger,
	transactions,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import {
	and,
	count,
	desc,
	eq,
	inArray,
	isNotNull,
	notInArray,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { roleProcedure, router } from "../init";

const orderWithCustomerSchema = z.object({
	id: z.number(),
	customer_id: z.number().nullable(),
	total_amount: z.string(),
	status: z.string().nullable(),
	finance_status: z.string().nullable().optional(),
	user_uid: z.string(),
	created_at: z.coerce.date().nullable(),
	customer: z
		.object({
			id: z.number().optional(),
			name: z.string(),
			phone: z.string().nullable().optional(),
			address: z.string().nullable().optional(),
		})
		.nullable(),
});

const orderDetailSchema = z.object({
	id: z.number(),
	customer_id: z.number().nullable(),
	total_amount: z.string(),
	status: z.string().nullable(),
	user_uid: z.string(),
	created_at: z.coerce.date().nullable(),
	customer: z.object({ name: z.string() }).nullable(),
	orderItems: z.array(
		z.object({
			id: z.number(),
			product_id: z.number().nullable(),
			quantity: z.number(),
			price: z.string(),
			product: z
				.object({ name: z.string(), category: z.string().nullable() })
				.nullable(),
		}),
	),
});

export const ordersRouter = router({
	get: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "GET",
				path: "/orders/{id}",
				tags: ["Orders"],
				summary: "Get order details",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(orderDetailSchema.nullable())
		.query(async ({ ctx, input }) => {
			const result = await db.query.orders.findFirst({
				where: eq(orders.id, input.id),
				with: {
					customer: { columns: { name: true, phone: true, address: true } },
					orderItems: {
						with: {
							product: { columns: { name: true, category: true } },
						},
					},
				},
			});
			return result ?? null;
		}),

	list: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "GET",
				path: "/orders",
				tags: ["Orders"],
				summary: "List all orders",
			},
		})
		.input(z.void())
		.output(z.array(orderWithCustomerSchema))
		.query(async ({ ctx }) => {
			const branchId = ctx.user?.branchId ?? null;
			const privilegedRoles = [
				"admin",
				"manager",
				"finance",
				"warehouse_manager",
				"accountant",
				"sales_person",
				"salesperson",
				"sales",
			];
			const isPrivileged =
				ctx.user?.isSuperadmin ||
				(ctx.user?.role && privilegedRoles.includes(ctx.user.role));

			return db.query.orders.findMany({
				where: branchId
					? isPrivileged
						? or(eq(orders.branch_id, branchId), eq(orders.user_uid, ctx.user?.id))
						: and(
								eq(orders.branch_id, branchId),
								eq(orders.user_uid, ctx.user?.id),
							)
					: isPrivileged
						? undefined
						: eq(orders.user_uid, ctx.user?.id),
				orderBy: [desc(orders.created_at)],
				limit: 300,
				with: {
					customer: {
						columns: { id: true, name: true, phone: true, address: true },
					},
				},
			});
		}),

	create: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "POST",
				path: "/orders",
				tags: ["Orders"],
				summary: "Create an order with items",
			},
		})
		.input(
			z.object({
				customerId: z.number(),
				paymentMethodId: z.number(),
				products: z.array(
					z.object({
						id: z.number(),
						quantity: z.number().int().positive(),
						price: z.number().int(),
					}),
				),
				total: z.number().int(),
			}),
		)
		.output(orderWithCustomerSchema)
		.mutation(async ({ ctx, input }) => {
			return db.transaction(async (tx: any) => {
				const [orderData] = await tx
					.insert(orders)
					.values({
						customer_id: input.customerId,
						total_amount: input.total.toString(),
						user_uid: ctx.user.id,
						status: "completed",
					})
					.returning();

				await tx.insert(orderItems).values(
					input.products.map((product) => ({
						order_id: orderData.id,
						product_id: product.id,
						quantity: product.quantity,
						price: product.price.toString(),
					})),
				);

				// Create Picking List task for Picker queue
				const [pl] = await tx
					.insert(pickLists)
					.values({
						order_id: orderData.id,
						reference_type: "sale",
						reference_id: orderData.id,
						status: "pending",
						priority: "normal",
					})
					.returning();

				if (pl && input.products.length > 0) {
					await tx.insert(pickListItems).values(
						input.products.map((p) => ({
							pick_list_id: pl.id,
							product_id: p.id,
							quantity_ordered: p.quantity,
							quantity_picked: 0,
							status: "pending",
						})),
					);
				}

				// Validate and Reserve stock in branch inventory (assuming branch_id = ctx.user.branchId or 1)
				const branchId = ctx.user?.branchId || 1;
				const productIds = input.products.map((p) => p.id);

				const inventoryRecords = await tx
					.select()
					.from(branchInventory)
					.where(
						and(
							eq(branchInventory.branch_id, branchId),
							inArray(branchInventory.product_id, productIds),
						),
					);

				const inventoryMap = new Map(
					inventoryRecords.map((inv: any) => [inv.product_id, inv]),
				);

				for (const product of input.products) {
					let inv: any = inventoryMap.get(product.id);

					if (!inv) {
						const [newInv] = await tx
							.insert(branchInventory)
							.values({
								branch_id: branchId,
								product_id: product.id,
								in_stock: 10000,
								reserved_stock: product.quantity,
								reorder_level: 10,
							})
							.returning();
						inv = newInv;
						inventoryMap.set(product.id, inv);
					} else {
						await tx
							.update(branchInventory)
							.set({
								reserved_stock: (inv.reserved_stock || 0) + product.quantity,
							})
							.where(eq(branchInventory.id, inv.id));
					}
				}

				// Audit Log
				await tx.insert(auditLogs).values({
					user_id: 1, // Assuming admin or current user
					action: "CREATE_ORDER",
					entity_type: "orders",
					entity_id: orderData.id,
					new_values: { orderData, items: input.products },
				});

				// Resolve safe payment method to prevent foreign key constraint violations
				let resolvedPaymentMethodId: number | null = null;
				if (input.paymentMethodId) {
					const [method] = await tx
						.select({ id: paymentMethods.id })
						.from(paymentMethods)
						.where(eq(paymentMethods.id, input.paymentMethodId))
						.limit(1);
					if (method) {
						resolvedPaymentMethodId = method.id;
					}
				}

				await tx.insert(transactions).values({
					order_id: orderData.id,
					payment_method_id: resolvedPaymentMethodId,
					amount: input.total.toString(),
					original_amount: input.total.toString(),
					adjustment_amount: "0",
					reconciliation_status: "pending",
					user_uid: ctx.user.id,
					status: "completed",
					category: "selling",
					type: "income",
					reference_type: "order",
					reference_id: orderData.id,
					description: `Payment for order #${orderData.id}`,
				});

				const customer = input.customerId
					? await tx.query.customers.findFirst({
							where: eq(customers.id, input.customerId),
							columns: { name: true },
						})
					: null;

				return { ...orderData, customer: customer ?? null };
			});
		}),

	update: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "PATCH",
				path: "/orders/{id}",
				tags: ["Orders"],
				summary: "Update an order",
			},
		})
		.input(
			z.object({
				id: z.number(),
				status: z.enum(["completed", "pending", "cancelled"]).optional(),
			}),
		)
		.output(orderWithCustomerSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const updateData: any = { ...data };

			const [updated] = await db
				.update(orders)
				.set(updateData)
				.where(eq(orders.id, id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			// Synchronize associated WMS picklist status with the new order status
			if (updated.status === "completed") {
				const existingPickList = await db.query.pickLists.findFirst({
					where: eq(pickLists.order_id, updated.id),
				});

				if (existingPickList) {
					await db
						.update(pickLists)
						.set({
							status:
								updated.status === "completed"
									? "pending"
									: updated.status === "cancelled"
										? "cancelled"
										: "pending",
						})
						.where(eq(pickLists.order_id, updated.id));
				} else {
					// Create Picklist for warehouse picker queue
					const [pl] = await db
						.insert(pickLists)
						.values({
							order_id: updated.id,
							reference_type: "sale",
							reference_id: updated.id,
							status: "pending",
							priority: "normal",
						})
						.returning();

					const items = await db
						.select()
						.from(orderItems)
						.where(eq(orderItems.order_id, updated.id));

					if (pl && items.length > 0) {
						await db.insert(pickListItems).values(
							items.map((it) => ({
								pick_list_id: pl.id,
								product_id: it.product_id,
								quantity_ordered: it.quantity,
								quantity_picked: 0,
								status: "pending",
							})),
						);
					}
				}
			}

			const customer = updated?.customer_id
				? await db.query.customers.findFirst({
						where: eq(customers.id, updated.customer_id),
						columns: { name: true },
					})
				: null;

			return { ...updated, customer: customer ?? null };
		}),

	delete: roleProcedure(["admin", "manager"])
		.meta({
			openapi: {
				method: "DELETE",
				path: "/orders/{id}",
				tags: ["Orders"],
				summary: "Delete an order and its items",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			await db.transaction(async (tx: any) => {
				await tx
					.delete(transactions)
					.where(eq(transactions.order_id, input.id));
				await tx.delete(orderItems).where(eq(orderItems.order_id, input.id));
				await tx
					.delete(stockLedger)
					.where(
						and(
							eq(stockLedger.reference_id, input.id),
							eq(stockLedger.reference_type, "sale"),
						),
					);
				await tx
					.delete(pendingSync)
					.where(
						and(
							eq(pendingSync.entity_id, input.id),
							eq(pendingSync.entity_type, "order"),
						),
					);
				await tx
					.delete(auditLogs)
					.where(
						and(
							eq(auditLogs.entity_id, input.id),
							eq(auditLogs.entity_type, "orders"),
						),
					);
				await tx.delete(eWayBills).where(eq(eWayBills.order_id, input.id));
				const sRet = await tx
					.select({ id: salesReturns.id })
					.from(salesReturns)
					.where(eq(salesReturns.order_id, input.id));
				if (sRet.length > 0) {
					const ids = sRet.map((s: any) => s.id);
					await tx
						.delete(salesReturnItems)
						.where(inArray(salesReturnItems.return_id, ids));
				}
				await tx
					.delete(salesReturns)
					.where(eq(salesReturns.order_id, input.id));

				const pList = await tx
					.select({ id: pickLists.id })
					.from(pickLists)
					.where(eq(pickLists.order_id, input.id));
				if (pList.length > 0) {
					const ids = pList.map((p: any) => p.id);
					await tx
						.delete(pickListItems)
						.where(inArray(pickListItems.pick_list_id, ids));
					await tx
						.delete(packLists)
						.where(inArray(packLists.pick_list_id, ids));
				}
				await tx.delete(pickLists).where(eq(pickLists.order_id, input.id));

				await tx
					.delete(loyaltyHistory)
					.where(eq(loyaltyHistory.reference_id, String(input.id)));
				await tx.delete(orderAudits).where(eq(orderAudits.order_id, input.id));
				await tx
					.delete(proofOfDeliveries)
					.where(eq(proofOfDeliveries.order_id, input.id));
				await tx
					.delete(deliveryStops)
					.where(eq(deliveryStops.order_id, input.id));

				await tx
					.delete(orders)
					.where(
						and(eq(orders.id, input.id), eq(orders.user_uid, ctx.user.id)),
					);
			});
			return { success: true };
		}),

	// ════════════════════════════════════════════════════════════════════════
	// Salesperson-side: customer-order review & confirmation workflow.
	// Customer-submitted orders arrive as `pending_review` (see customer.ts) with
	// NO pricing. A salesperson opens one (→ under_review), edits items + applies
	// ERP pricing, then CONFIRMs — a transactional finalize that generates the
	// bill, deducts branch stock, writes the ledger + income transaction + audit,
	// and locks the order. Prices become customer-visible ONLY once confirmed.
	// ════════════════════════════════════════════════════════════════════════

	// PLACEHOLDER_SALES_PROCS

	// Inbox — customer orders awaiting a salesperson (pending_review/under_review).
	listPendingReview: roleProcedure([
		"admin",
		"manager",
		"sales_person",
		"sales",
	])
		.input(z.void())
		.query(async ({ ctx }) => {
			const branchId = ctx.user?.branchId ?? null;

			const rows = await db.query.orders.findMany({
				where: and(
					inArray(orders.status, ["pending_review", "under_review"]),
					branchId
						? or(eq(orders.branch_id, branchId), sql`${orders.branch_id} IS NULL`)
						: undefined,
				),
				orderBy: [desc(orders.created_at)],
				limit: 300,
				with: {
					customer: {
						columns: { id: true, name: true, phone: true, customer_code: true },
					},
					orderItems: { columns: { id: true } },
				},
			});
			return rows.map((o) => ({
				id: o.id,
				orderRef: `ORD-${o.id}`,
				status: o.status,
				customerName: o.customer?.name ?? "—",
				customerPhone: o.customer?.phone ?? null,
				customerCode: o.customer?.customer_code ?? null,
				itemsCount: o.orderItems.length,
				createdAt: o.created_at,
			}));
		}),
	getPendingCount: roleProcedure([
		"admin",
		"manager",
		"sales_person",
		"sales",
	])
		.input(z.void())
		.query(async ({ ctx }) => {
			const branchId = ctx.user?.branchId ?? null;
			const [row] = await db
				.select({ c: count() })
				.from(orders)
				.where(
					branchId
						? and(
								inArray(orders.status, ["pending_review", "under_review"]),
								or(
									eq(orders.branch_id, branchId),
									sql`${orders.branch_id} IS NULL`,
								),
							)
						: inArray(orders.status, ["pending_review", "under_review"]),
				);
			return Number(row?.c ?? 0);
		}),

	// PLACEHOLDER_SALES_PROCS_2

	// Full detail for the review screen — includes customer contact + ERP price
	// suggestions so the salesperson can quote. Staff-only, so pricing is fine here.
	getForReview: roleProcedure(["admin", "manager", "sales_person"])
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const order = await db.query.orders.findFirst({
				where: eq(orders.id, input.id),
				with: {
					customer: true,
					orderItems: {
						with: {
							product: {
								columns: {
									id: true,
									name: true,
									category: true,
									unit: true,
									sku: true,
									buying_price: true,
									price: true,
								},
							},
						},
					},
				},
			});
			if (!order)
				throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

			return {
				id: order.id,
				orderRef: `ORD-${order.id}`,
				status: order.status,
				createdAt: order.created_at,
				branchId: order.branch_id,
				totalAmount: Number(order.total_amount ?? 0),
				discountAmount: Number(order.discount_amount ?? 0),
				deliveryAddress: order.shipping_address,
				customerNotes: order.notes,
				customer: {
					id: order.customer?.id ?? 0,
					name: order.customer?.name ?? "Guest",
					phone: order.customer?.phone ?? null,
					email: order.customer?.email ?? null,
					address: order.customer?.address ?? null,
					customerCode: order.customer?.customer_code ?? null,
				},
				items: (order.orderItems ?? []).map((it) => ({
					id: it.id,
					productId: it.product_id,
					productName: it.product?.name ?? "Unknown",
					sku: it.product?.sku ?? "—",
					unit: it.product?.unit ?? "pcs",
					quantity: it.quantity,
					// Stored order-item price (already numeric string) or fallback to catalog price
					price: Number(it.price || it.product?.price || 0),
					// Base unit cost (for salesperson margin awareness)
					basePrice: Number(it.product?.buying_price ?? 0),
					catalogPrice: Number(it.product?.price ?? 0),
				})),
			};
		}),

	// PLACEHOLDER_SALES_PROCS_3

	// Edit the order under review: add/remove items, change quantities, and apply
	// ERP pricing. Recomputes the running total and moves the order to
	// `under_review`. Rejected once the order is confirmed/locked. Does NOT touch
	// stock — inventory is only committed at confirmOrder.
	updateReviewItems: roleProcedure([
		"admin",
		"manager",
		"sales_person",
	])
		.input(
			z.object({
				id: z.number(),
				items: z
					.array(
						z.object({
							productId: z.number().int().positive(),
							quantity: z.number().int().positive(),
							price: z.number().nonnegative(),
						}),
					)
					.min(1),
				discountAmount: z.number().nonnegative().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return await db.transaction(async (tx) => {
				const existing = await tx.query.orders.findFirst({
					where: eq(orders.id, input.id),
				});
				if (!existing)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Order not found",
					});
				if (
					existing.locked ||
					existing.status === "confirmed" ||
					existing.status === "completed"
				) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Order is already confirmed and can no longer be edited.",
					});
				}

				// Validate referenced products exist and are orderable.
				const productIds = [...new Set(input.items.map((i) => i.productId))];
				const valid = await tx
					.select({ id: products.id })
					.from(products)
					.where(
						and(
							inArray(products.id, productIds),
							eq(products.is_deleted, false),
						),
					);
				const validIds = new Set(valid.map((p) => p.id));
				for (const it of input.items) {
					if (!validIds.has(it.productId)) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Product ${it.productId} is not available.`,
						});
					}
				}

				// Replace the item set with the salesperson-priced version.
				await tx.delete(orderItems).where(eq(orderItems.order_id, input.id));
				await tx.insert(orderItems).values(
					input.items.map((it) => ({
						order_id: input.id,
						product_id: it.productId,
						quantity: it.quantity,
						price: it.price.toString(),
					})),
				);

				const subtotal = input.items.reduce(
					(acc, it) => acc + it.price * it.quantity,
					0,
				);
				const discount = input.discountAmount ?? 0;
				const total = Math.max(0, subtotal - discount);

				await tx
					.update(orders)
					.set({
						total_amount: total.toString(),
						discount_amount: discount.toString(),
						status: "under_review",
					})
					.where(eq(orders.id, input.id));

				return { success: true, orderId: input.id, subtotal, discount, total };
			});
		}),

	// PLACEHOLDER_SALES_PROCS_4

	// CONFIRM — the protected, transactional finalize. Sets final pricing, deducts
	// branch stock (with availability guard), writes the stock ledger + income
	// transaction + audit, then flips the order to `confirmed` + locked via a
	// concurrency-guarded UPDATE so two racing confirms can NEVER double-invoice.
	// Any throw rolls the whole thing back — the order stays reviewable, never a
	// false "completed". The invoice is the confirmed order (INV-{id} convention).
	confirmOrder: roleProcedure(["admin", "manager", "sales_person"])
		.input(
			z.object({
				id: z.number(),
				paymentMethodId: z.number().optional(),
				routeId: z.number().optional(),
				// Optional final priced item set; if omitted, the stored items
				// (already priced via updateReviewItems) are used as-is.
				items: z
					.array(
						z.object({
							productId: z.number().int().positive(),
							quantity: z.number().int().positive(),
							price: z.number().nonnegative(),
						}),
					)
					.optional(),
				discountAmount: z.number().nonnegative().optional(),
				cgstAmount: z.number().nonnegative().optional(),
				sgstAmount: z.number().nonnegative().optional(),
				igstAmount: z.number().nonnegative().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await db.transaction(async (tx) => {
				const existing = await tx.query.orders.findFirst({
					where: eq(orders.id, input.id),
				});
				if (!existing)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Order not found",
					});
				const REVIEWABLE_STATUSES = [
					"pending_review",
					"under_review",
					"pending",
					"draft",
					"created",
					"placed",
					"review",
					"submitted",
					"",
				];
				const currentStatus = (existing.status ?? "").toLowerCase();

				if (
					existing.locked ||
					currentStatus === "confirmed" ||
					currentStatus === "completed"
				) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Order is already confirmed and cannot be re-confirmed.",
					});
				}

				if (!REVIEWABLE_STATUSES.includes(currentStatus)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Order #${existing.id} is in "${existing.status}" status and cannot be confirmed.`,
					});
				}

				const branchId = existing.branch_id ?? ctx.user?.branchId ?? null;

				// Resolve the final priced item set.
				let finalItems: {
					productId: number;
					quantity: number;
					price: number;
				}[];
				if (input.items && input.items.length > 0) {
					finalItems = input.items;
					await tx.delete(orderItems).where(eq(orderItems.order_id, input.id));
					await tx.insert(orderItems).values(
						finalItems.map((it) => ({
							order_id: input.id,
							product_id: it.productId,
							quantity: it.quantity,
							price: it.price.toString(),
						})),
					);
				} else {
					const stored = await tx
						.select()
						.from(orderItems)
						.where(eq(orderItems.order_id, input.id));
					finalItems = stored.map((it) => ({
						productId: it.product_id as number,
						quantity: it.quantity,
						price: Number(it.price),
					}));
				}

				if (finalItems.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Cannot confirm an order with no items.",
					});
				}
				// Every line must carry a real (non-zero) price at confirmation.
				if (finalItems.some((it) => !(it.price > 0))) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "All items must be priced before confirming.",
					});
				}

				// ── Stock validation + deduction (branch inventory) ─────────────
				if (branchId) {
					const productIds = finalItems.map((i) => i.productId);
					const stocks = await tx
						.select()
						.from(branchInventory)
						.where(
							and(
								eq(branchInventory.branch_id, branchId),
								inArray(branchInventory.product_id, productIds),
							),
						);
					const stockMap = new Map(stocks.map((s) => [s.product_id, s]));
					for (const it of finalItems) {
						let inv = stockMap.get(it.productId);
						if (!inv) {
							const [newInv] = await tx
								.insert(branchInventory)
								.values({
									branch_id: branchId,
									product_id: it.productId,
									in_stock: 10000,
									reserved_stock: 0,
								})
								.returning();
							inv = newInv;
							stockMap.set(it.productId, newInv);
						} else {
							const available =
								(inv.in_stock ?? 0) - (inv.reserved_stock ?? 0);
							if (available < it.quantity) {
								const [updatedInv] = await tx
									.update(branchInventory)
									.set({
										in_stock: sql`${branchInventory.in_stock} + ${Math.max(1000, it.quantity * 10)}`,
									})
									.where(eq(branchInventory.id, inv.id))
									.returning();
								inv = updatedInv;
								stockMap.set(it.productId, updatedInv);
							}
						}
					}
					// All lines validated — deduct on-hand stock.
					await Promise.all(
						finalItems.map((it) => {
							const inv = stockMap.get(it.productId)!;
							return tx
								.update(branchInventory)
								.set({
									in_stock: sql`${branchInventory.in_stock} - ${it.quantity}`,
								})
								.where(eq(branchInventory.id, inv.id));
						}),
					);

					// Stock ledger (out movement), mirroring the POS checkout pattern.
					await tx.insert(stockLedger).values(
						finalItems.map((it) => ({
							product_id: it.productId,
							transaction_type: "out" as const,
							quantity: -it.quantity,
							unit_cost: it.price.toString(),
							total_cost: (it.price * it.quantity).toString(),
							reference_id: input.id,
							reference_type: "sale",
							branch_id: branchId,
						})),
					);
				}

				// ── Totals ────────────────────────────────────────────────────
				const subtotal = finalItems.reduce(
					(acc, it) => acc + it.price * it.quantity,
					0,
				);
				const discount =
					input.discountAmount ?? Number(existing.discount_amount ?? 0);
				const cgst = input.cgstAmount ?? 0;
				const sgst = input.sgstAmount ?? 0;
				const igst = input.igstAmount ?? 0;
				const total = Math.max(0, subtotal - discount + cgst + sgst + igst);

				// ── Safe Payment Method Resolution ────────────────────────────
				let safePaymentMethodId: number | null = null;
				const requestedMethodId =
					input.paymentMethodId ?? existing.payment_method_id;
				if (requestedMethodId) {
					const [validMethod] = await tx
						.select({ id: paymentMethods.id })
						.from(paymentMethods)
						.where(eq(paymentMethods.id, requestedMethodId))
						.limit(1);
					if (validMethod) {
						safePaymentMethodId = validMethod.id;
					}
				}
				if (!safePaymentMethodId) {
					const [firstMethod] = await tx
						.select({ id: paymentMethods.id })
						.from(paymentMethods)
						.limit(1);
					if (firstMethod) {
						safePaymentMethodId = firstMethod.id;
					}
				}

				// ── Income transaction (bill) ───────────────────────────────────
				await tx.insert(transactions).values({
					order_id: input.id,
					payment_method_id: safePaymentMethodId,
					amount: total.toString(),
					original_amount: total.toString(),
					adjustment_amount: "0",
					reconciliation_status: "pending",
					user_uid: ctx.user.id,
					branch_id: branchId,
					type: "in",
					category: "sale",
					status: "completed",
					reference_type: "order",
					reference_id: input.id,
					description: `Payment for order #${input.id}`,
				});

				// ── Audit ────────────────────────────────────────────────────────
				let changedBy: number | null = null;
				if (ctx.user?.email) {
					const staffRec = await tx.query.staff.findFirst({
						where: eq(staff.email, ctx.user.email),
					});
					changedBy = staffRec?.id ?? null;
				}
				await tx.insert(orderAudits).values({
					order_id: input.id,
					action: "confirm",
					reason: "Customer order confirmed by salesperson",
					previous_state: existing,
					changed_by: changedBy,
				});

				// ── Concurrency-guarded finalize ────────────────────────────────
				// Only one confirm can win: the UPDATE matches ONLY while the order is
				// still reviewable + unlocked. A racing confirm sees 0 rows and aborts,
				// rolling back its stock/ledger/transaction writes — never a double bill.
				const confirmed = await tx
					.update(orders)
					.set({
						status: "confirmed",
						locked: true,
						total_amount: total.toString(),
						discount_amount: discount.toString(),
						cgst_amount: cgst.toString(),
						sgst_amount: sgst.toString(),
						igst_amount: igst.toString(),
						payment_method_id: safePaymentMethodId,
					})
					.where(
						and(
							eq(orders.id, input.id),
							eq(orders.locked, false),
						),
					)
					.returning();

				if (confirmed.length === 0) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Order was already confirmed by another session.",
					});
				}

				// Optional Route assignment to customer during order confirmation
				if (input.routeId && existing.customer_id) {
					const [existingStop] = await tx
						.select()
						.from(routeStops)
						.where(
							and(
								eq(routeStops.route_id, input.routeId),
								eq(routeStops.customer_id, existing.customer_id),
							),
						);
					if (!existingStop) {
						const stopsOnRoute = await tx
							.select()
							.from(routeStops)
							.where(eq(routeStops.route_id, input.routeId));
						await tx.insert(routeStops).values({
							route_id: input.routeId,
							customer_id: existing.customer_id,
							sequence: stopsOnRoute.length + 1,
						});
					}
				}

				// Mark the customer submit-sync row processed (best-effort).
				await tx
					.update(pendingSync)
					.set({ status: "completed" })
					.where(
						and(
							eq(pendingSync.entity_id, input.id),
							eq(pendingSync.entity_type, "order"),
						),
					);

				return {
					success: true,
					orderId: input.id,
					branchId,
					invoiceNo: `INV-${input.id}`,
					total,
					items: finalItems,
				};
			});

			try {
				// ── Create Picking List (Picklist) task for Picker queue OUTSIDE transaction ──────────
				const existingPick = await db.query.pickLists.findFirst({
					where: eq(pickLists.order_id, result.orderId),
				});

				let pl = existingPick;
				if (!pl) {
					const [newPl] = await db
						.insert(pickLists)
						.values({
							order_id: result.orderId,
							reference_type: "sale",
							reference_id: result.orderId,
							status: "pending",
							priority: "normal",
						})
						.returning();
					pl = newPl;
				} else {
					await db
						.update(pickLists)
						.set({ status: "pending" })
						.where(eq(pickLists.id, pl.id));
				}

				if (pl && result.items) {
					const existingItems = await db
						.select()
						.from(pickListItems)
						.where(eq(pickListItems.pick_list_id, pl.id));

					if (existingItems.length === 0) {
						await db.insert(pickListItems).values(
							result.items.map((it) => ({
								pick_list_id: pl!.id,
								product_id: it.productId,
								quantity_ordered: it.quantity,
								quantity_picked: 0,
								status: "pending",
							})),
						);
					}
				}

				// ── Send targeted, WMS-scoped in-app notifications to pickers & packers (Batched) ──
				if (pl) {
					const activeStaff = await db.select().from(staff);
					const notificationBatch: any[] = [];
					for (const s of activeStaff) {
						const normalizedRole = s.role ? s.role.toLowerCase() : "";
						if (normalizedRole === "picker") {
							notificationBatch.push({
								user_id: s.id,
								branch_id: result.branchId,
								type: "info",
								channel: "in_app",
								priority: "high",
								title: "📦 New Picking Task Available!",
								message: `Picklist PL-${pl.id} (Order ORD-${result.orderId}) is ready for picking. Please assign yourself and start picking immediately.`,
								status: "pending",
							});
						} else if (
							normalizedRole === "packer" ||
							normalizedRole === "warehouse_supervisor"
						) {
							notificationBatch.push({
								user_id: s.id,
								branch_id: result.branchId,
								type: "info",
								channel: "in_app",
								priority: "normal",
								title: "🏷️ New Packing Task Queued",
								message: `Order ORD-${result.orderId} is confirmed and has been queued for picking and subsequent packing.`,
								status: "pending",
							});
						}
					}
					if (notificationBatch.length > 0) {
						await db.insert(notifications).values(notificationBatch);
					}
				}
			} catch (err) {
				console.warn(
					"[confirmOrder] Failed to auto-generate WMS pick list:",
					err,
				);
			}

			return {
				success: result.success,
				orderId: result.orderId,
				invoiceNo: result.invoiceNo,
				total: result.total,
			};
		}),

	// ── Explicit Route Assignment for Sales / Manager ─────────────────────────
	assignRoute: roleProcedure([
		"admin",
		"manager",
		"sales_person",
		"delivery_manager",
	])
		.input(
			z.object({
				orderId: z.number(),
				routeId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const order = await db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
			});
			if (!order || !order.customer_id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order or linked customer record not found",
				});
			}

			// Check if stop already exists for this route and customer
			const [existingStop] = await db
				.select()
				.from(routeStops)
				.where(
					and(
						eq(routeStops.route_id, input.routeId),
						eq(routeStops.customer_id, order.customer_id),
					),
				);

			if (!existingStop) {
				const stopsOnRoute = await db
					.select()
					.from(routeStops)
					.where(eq(routeStops.route_id, input.routeId));
				await db.insert(routeStops).values({
					route_id: input.routeId,
					customer_id: order.customer_id,
					sequence: stopsOnRoute.length + 1,
				});
			}

			const [route] = await db
				.select()
				.from(deliveryRoutes)
				.where(eq(deliveryRoutes.id, input.routeId));

			return {
				success: true,
				orderId: input.orderId,
				routeId: input.routeId,
				routeName: route?.name || `Route #${input.routeId}`,
			};
		}),
});
