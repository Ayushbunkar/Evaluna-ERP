import {
	auditLogs,
	branchInventory,
	customers,
	deliveryStops,
	eWayBills,
	loyaltyHistory,
	orderAudits,
	orderItems,
	orders,
	packLists,
	pendingSync,
	pickListItems,
	pickLists,
	products,
	proofOfDeliveries,
	salesReturnItems,
	salesReturns,
	staff,
	stockLedger,
	transactions,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { roleProcedure, router } from "../init";

const orderWithCustomerSchema = z.object({
	id: z.number(),
	customer_id: z.number().nullable(),
	total_amount: z.string(),
	status: z.string().nullable(),
	user_uid: z.string(),
	created_at: z.coerce.date().nullable(),
	customer: z.object({ name: z.string() }).nullable(),
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
				where: and(eq(orders.id, input.id), eq(orders.user_uid, ctx.user.id)),
				with: {
					customer: { columns: { name: true } },
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
			return db.query.orders.findMany({
				where: eq(orders.user_uid, ctx.user.id),
				with: {
					customer: {
						columns: { name: true },
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
					const inv: any = inventoryMap.get(product.id) || {};

					if (!inv) {
						throw new Error(
							`Product ID ${product.id} not found in inventory for branch ${branchId}`,
						);
					}

					const availableStock =
						((inv as any).in_stock ?? (inv as any).quantity ?? 0) -
						(inv.reserved_stock || 0);
					if (availableStock < product.quantity) {
						throw new Error(
							`Insufficient stock for Product ID ${product.id}. Available: ${availableStock}, Requested: ${product.quantity}`,
						);
					}

					await tx
						.update(branchInventory)
						.set({
							reserved_stock: (inv.reserved_stock || 0) + product.quantity,
						})
						.where(eq(branchInventory.id, inv.id));
				}

				// Audit Log
				await tx.insert(auditLogs).values({
					user_id: 1, // Assuming admin or current user
					action: "CREATE_ORDER",
					entity_type: "orders",
					entity_id: orderData.id,
					new_values: { orderData, items: input.products },
				});

				await tx.insert(transactions).values({
					order_id: orderData.id,
					payment_method_id: input.paymentMethodId,
					amount: input.total.toString(),
					user_uid: ctx.user.id,
					status: "completed",
					category: "selling",
					type: "income",
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
			const updateData: any = { ...data, user_uid: ctx.user.id };

			const [updated] = await db
				.update(orders)
				.set(updateData)
				.where(and(eq(orders.id, id), eq(orders.user_uid, ctx.user.id)))
				.returning();

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
		"biller",
	])
		.input(z.void())
		.query(async ({ ctx }) => {
			const branchId = ctx.user?.branchId ?? null;
			const rows = await db.query.orders.findMany({
				where: branchId
					? and(
							inArray(orders.status, ["pending_review", "under_review"]),
							eq(orders.branch_id, branchId),
						)
					: inArray(orders.status, ["pending_review", "under_review"]),
				orderBy: [desc(orders.created_at)],
				limit: 200,
				with: {
					customer: {
						columns: { name: true, phone: true, customer_code: true },
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

	// PLACEHOLDER_SALES_PROCS_2

	// Full detail for the review screen — includes customer contact + ERP price
	// suggestions so the salesperson can quote. Staff-only, so pricing is fine here.
	getForReview: roleProcedure(["admin", "manager", "sales_person", "biller"])
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
									base_selling_price: true,
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
				locked: order.locked ?? false,
				createdAt: order.created_at,
				totalAmount: order.total_amount,
				discountAmount: order.discount_amount,
				customer: order.customer
					? {
							id: order.customer.id,
							name: order.customer.name,
							phone: order.customer.phone,
							email: order.customer.email,
							address: order.customer.address,
							customerCode: order.customer.customer_code,
						}
					: null,
				items: order.orderItems.map((it) => ({
					id: it.id,
					productId: it.product_id,
					name: it.product?.name ?? "Item",
					category: it.product?.category ?? null,
					unit: it.product?.unit ?? null,
					sku: it.product?.sku ?? null,
					quantity: it.quantity,
					price: it.price,
					// ERP-suggested unit price to help the salesperson quote.
					suggestedPrice:
						it.product?.base_selling_price ?? it.product?.price ?? null,
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
		"biller",
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
	confirmOrder: roleProcedure(["admin", "manager", "sales_person", "biller"])
		.input(
			z.object({
				id: z.number(),
				paymentMethodId: z.number().optional(),
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
					!["pending_review", "under_review"].includes(existing.status ?? "")
				) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Order is not in a reviewable state (already confirmed?).",
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
						const inv = stockMap.get(it.productId);
						const available = inv
							? (inv.in_stock ?? 0) - (inv.reserved_stock ?? 0)
							: 0;
						if (!inv || available < it.quantity) {
							throw new TRPCError({
								code: "CONFLICT",
								message: `Insufficient stock for product ${it.productId}. Available: ${available}, needed: ${it.quantity}.`,
							});
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

				// ── Income transaction (bill) ───────────────────────────────────
				await tx.insert(transactions).values({
					order_id: input.id,
					payment_method_id:
						input.paymentMethodId ?? existing.payment_method_id ?? null,
					amount: total.toString(),
					user_uid: ctx.user.id,
					branch_id: branchId,
					type: "in",
					category: "sale",
					status: "completed",
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
						payment_method_id:
							input.paymentMethodId ?? existing.payment_method_id ?? null,
					})
					.where(
						and(
							eq(orders.id, input.id),
							inArray(orders.status, ["pending_review", "under_review"]),
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
					invoiceNo: `INV-${input.id}`,
					total,
				};
			});
		}),
});
