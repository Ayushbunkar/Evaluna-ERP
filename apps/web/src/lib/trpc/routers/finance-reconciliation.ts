import { and, desc, eq, not } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, transactions } from "@/lib/db/schema";
import { protectedProcedure, roleProcedure, router } from "../init";

export const financeReconciliationRouter = router({
	getPendingReconciliations: roleProcedure(["admin", "finance", "manager", "auditor"])
		.query(async () => {
			return await db.query.orders.findMany({
				where: not(eq(orders.finance_status, "reconciled")),
				orderBy: [desc(orders.created_at)],
				with: {
					customer: true,
					paymentMethod: true,
				},
			});
		}),

	getAllOrders: roleProcedure(["admin", "finance", "manager", "auditor"])
		.query(async () => {
			return await db.query.orders.findMany({
				orderBy: [desc(orders.created_at)],
				limit: 200,
				with: {
					customer: true,
					paymentMethod: true,
				},
			});
		}),

	driverSubmitCollection: roleProcedure(["driver", "admin", "manager"])
		.input(
			z.object({
				orderId: z.number(),
				collectedAmount: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(orders)
				.set({
					driver_collected_amount: input.collectedAmount,
					finance_status: "finance_submitted",
					driver_collected_at: new Date(),
				})
				.where(eq(orders.id, input.orderId))
				.returning();
			return updated;
		}),

	financeVerifyCollection: roleProcedure(["admin", "finance", "manager"])
		.input(
			z.object({
				orderId: z.number(),
				verifiedAmount: z.string(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [order] = await db
				.select()
				.from(orders)
				.where(eq(orders.id, input.orderId));

			if (!order) throw new Error("Order not found");

			const originalAmount = parseFloat(order.total_amount);
			const verifiedAmount = parseFloat(input.verifiedAmount);
			const diff = verifiedAmount - originalAmount;

			// Update Order with finance verification
			const [updatedOrder] = await db
				.update(orders)
				.set({
					finance_verified_amount: input.verifiedAmount,
					finance_status: "reconciled",
					finance_verified_at: new Date(),
					finance_notes: input.notes || null,
				})
				.where(eq(orders.id, input.orderId))
				.returning();

			// Find and update the transaction for this order — keeps user_uid intact
			// so salesperson-scoped Cash Book automatically reflects the update
			const [transaction] = await db
				.select()
				.from(transactions)
				.where(
					and(
						eq(transactions.order_id, input.orderId),
						eq(transactions.reference_type, "order"),
					),
				);

			if (transaction) {
				await db
					.update(transactions)
					.set({
						original_amount: transaction.original_amount ?? transaction.amount,
						amount: input.verifiedAmount,
						adjustment_amount: diff.toString(),
						reconciliation_status: "reconciled",
					})
					.where(eq(transactions.id, transaction.id));
			}

			return updatedOrder;
		}),
});
