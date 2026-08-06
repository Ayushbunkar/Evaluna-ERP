import {
	auditLogs,
	branchInventory,
	customers,
	orderItems,
	orders,
	transactions,
	stockLedger,
	pendingSync,
	eWayBills,
	salesReturns,
	loyaltyHistory,
	orderAudits,
	proofOfDeliveries,
	pickLists,
	deliveryStops,
} from "@evaluna/db/schema";
import { and, eq, inArray } from "drizzle-orm";
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
				total_amount: z.number().int().optional(),
				status: z.enum(["completed", "pending", "cancelled"]).optional(),
			}),
		)
		.output(orderWithCustomerSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const updateData: any = { ...data, user_uid: ctx.user.id };
			if (data.total_amount !== undefined)
				updateData.total_amount = data.total_amount.toString();

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

	delete: roleProcedure(["admin", "manager", "auditor", "sales_person"])
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
				await tx.delete(transactions).where(eq(transactions.order_id, input.id));
				await tx.delete(orderItems).where(eq(orderItems.order_id, input.id));
				await tx.delete(stockLedger).where(and(eq(stockLedger.reference_id, input.id), eq(stockLedger.reference_type, 'sale')));
				await tx.delete(pendingSync).where(and(eq(pendingSync.entity_id, input.id), eq(pendingSync.entity_type, 'order')));
				await tx.delete(auditLogs).where(and(eq(auditLogs.entity_id, input.id), eq(auditLogs.entity_type, 'orders')));
				await tx.delete(eWayBills).where(eq(eWayBills.order_id, input.id));
				await tx.delete(salesReturns).where(eq(salesReturns.order_id, input.id));
				await tx.delete(loyaltyHistory).where(eq(loyaltyHistory.order_id, input.id));
				await tx.delete(orderAudits).where(eq(orderAudits.order_id, input.id));
				await tx.delete(proofOfDeliveries).where(eq(proofOfDeliveries.order_id, input.id));
				await tx.delete(pickLists).where(eq(pickLists.order_id, input.id));
				await tx.delete(deliveryStops).where(eq(deliveryStops.order_id, input.id));
				
				await tx
					.delete(orders)
					.where(
						and(eq(orders.id, input.id), eq(orders.user_uid, ctx.user.id)),
					);
			});
			return { success: true };
		}),
});
