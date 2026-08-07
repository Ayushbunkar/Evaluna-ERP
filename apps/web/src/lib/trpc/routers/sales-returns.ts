import {
	auditLogs,
	branchInventory,
	customers,
	orderItems,
	orders,
	products,
	salesReturnItems,
	salesReturns,
	transactions,
} from "@evaluna/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { roleProcedure, router } from "../init";

const salesReturnItemSchema = z.object({
	productId: z.number(),
	quantity: z.number().int().positive(),
	price: z.number(),
	refundAmount: z.number(),
});

export const salesReturnsRouter = router({
	list: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "GET",
				path: "/sales-returns",
				tags: ["Sales Returns"],
				summary: "List all sales returns",
			},
		})
		.input(z.void())
		.output(z.any())
		.query(async ({ ctx }) => {
			const returns = await db.query.salesReturns.findMany({
				where: eq(salesReturns.user_uid, ctx.user.id),
				with: {
					customer: {
						columns: { name: true },
					},
					order: {
						columns: { id: true, total_amount: true },
					},
				},
				orderBy: [desc(salesReturns.created_at)],
			});
			return returns;
		}),

	getById: roleProcedure(["admin", "manager", "auditor", "sales_person"])
		.meta({
			openapi: {
				method: "GET",
				path: "/sales-returns/{id}",
				tags: ["Sales Returns"],
				summary: "Get sales return details by ID",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(z.any())
		.query(async ({ ctx, input }) => {
			const returnData = await db.query.salesReturns.findFirst({
				where: and(
					eq(salesReturns.id, input.id),
					eq(salesReturns.user_uid, ctx.user.id),
				),
				with: {
					customer: { columns: { name: true } },
					order: { columns: { id: true, total_amount: true } },
					returnItems: {
						with: {
							product: { columns: { name: true, sku: true } },
						},
					},
				},
			});
			return returnData ?? null;
		}),

	create: roleProcedure(["admin", "manager", "sales_person"])
		.meta({
			openapi: {
				method: "POST",
				path: "/sales-returns",
				tags: ["Sales Returns"],
				summary: "Create a new sales return",
			},
		})
		.input(
			z.object({
				orderId: z.number(),
				customerId: z.number().nullable(),
				items: z.array(salesReturnItemSchema),
				totalAmount: z.number(),
				cgstAmount: z.number().default(0),
				sgstAmount: z.number().default(0),
				igstAmount: z.number().default(0),
			}),
		)
		.output(z.any())
		.mutation(async ({ ctx, input }) => {
			return db.transaction(async (tx: any) => {
				// 1. Create the sales return record
				const [newReturn] = await tx
					.insert(salesReturns)
					.values({
						order_id: input.orderId,
						customer_id: input.customerId,
						total_amount: input.totalAmount.toString(),
						cgst_amount: input.cgstAmount.toString(),
						sgst_amount: input.sgstAmount.toString(),
						igst_amount: input.igstAmount.toString(),
						status: "pending",
						user_uid: ctx.user.id,
						branch_id: ctx.user.branchId || 1, // Assuming branch context is available or default to 1
					})
					.returning();

				// 2. Insert items
				await tx.insert(salesReturnItems).values(
					input.items.map((item: any) => ({
						return_id: newReturn.id,
						product_id: item.productId,
						quantity: item.quantity,
						price: item.price.toString(),
						refund_amount: item.refundAmount.toString(),
					})),
				);

				// 3. Log Audit
				await tx.insert(auditLogs).values({
					entity_type: "sales_returns",
					entity_id: newReturn.id,
					action: "CREATE_SALES_RETURN",
					changes: JSON.stringify(input),
					user_uid: ctx.user.id,
				});

				return newReturn;
			});
		}),

	process: roleProcedure(["admin", "manager"])
		.meta({
			openapi: {
				method: "POST",
				path: "/sales-returns/{id}/process",
				tags: ["Sales Returns"],
				summary: "Process a pending sales return",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(z.any())
		.mutation(async ({ ctx, input }) => {
			return db.transaction(async (tx: any) => {
				// 1. Get the return data
				const returnData = await tx.query.salesReturns.findFirst({
					where: eq(salesReturns.id, input.id),
					with: { returnItems: true },
				});

				if (!returnData) {
					throw new Error("Sales Return not found");
				}
				if (returnData.status !== "pending") {
					throw new Error("Only pending returns can be processed");
				}

				// 2. Update status to processed
				const [updatedReturn] = await tx
					.update(salesReturns)
					.set({ status: "processed" })
					.where(eq(salesReturns.id, input.id))
					.returning();

				// 3. Restore stock logic
				const branchId = returnData.branch_id || ctx.user.branchId || 1;
				const items = returnData.returnItems;
				
				for (const item of items) {
					const inventory = await tx.query.branchInventory.findFirst({
						where: and(
							eq(branchInventory.branch_id, branchId),
							eq(branchInventory.product_id, item.product_id),
						),
					});
					
					if (inventory) {
						await tx
							.update(branchInventory)
							.set({ in_stock: inventory.in_stock + item.quantity })
							.where(eq(branchInventory.id, inventory.id));
					} else {
						await tx.insert(branchInventory).values({
							branch_id: branchId,
							product_id: item.product_id,
							in_stock: item.quantity,
							reorder_level: 10,
						});
					}
				}

				// 4. Financial Transaction (Refund/Expense)
				await tx.insert(transactions).values({
					branch_id: branchId,
					type: "out",
					category: "refund",
					amount: returnData.total_amount,
					description: `Refund for Sales Return #${updatedReturn.id}`,
					user_uid: ctx.user.id,
					// You would ideally link this to the appropriate payment method used for the refund
				});

				// 5. Log Audit
				await tx.insert(auditLogs).values({
					entity_type: "sales_returns",
					entity_id: updatedReturn.id,
					action: "PROCESS_SALES_RETURN",
					changes: JSON.stringify({ status: "processed" }),
					user_uid: ctx.user.id,
				});

				return updatedReturn;
			});
		}),
});
