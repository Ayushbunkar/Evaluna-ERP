import {
	branchInventory,
	coupons,
	dailyProductDiscounts,
	orderAudits,
	orderItems,
	orders,
	paymentMethods,
	pendingSync,
	pickListItems,
	pickLists,
	products,
	staff,
	stockLedger,
	transactions,
} from "@evaluna/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "@/lib/trpc/init";

export const posRouter = router({
	catalog: protectedProcedure.query(async ({ ctx }) => {
		const todayStr = new Date().toISOString().split("T")[0];

		// Lightweight product listing for offline sync with today's active daily discount offers
		const [catalog, activeDiscounts] = await Promise.all([
			ctx.db.query.products.findMany({
				where: eq(products.is_deleted, false),
				with: {
					productBatches: true,
				},
			}),
			ctx.db
				.select()
				.from(dailyProductDiscounts)
				.where(
					and(
						eq(dailyProductDiscounts.effective_date, todayStr),
						eq(dailyProductDiscounts.is_active, true),
					),
				),
		]);

		const discountMap = new Map<number, (typeof activeDiscounts)[0]>();
		for (const d of activeDiscounts) {
			discountMap.set(d.product_id, d);
		}

		return catalog.map((item) => {
			const activeOffer = discountMap.get(item.id);
			const originalPrice = Number.parseFloat(item.price || "0");
			const hasOffer = !!activeOffer && activeOffer.is_active;
			const offerPrice = hasOffer
				? Number.parseFloat(activeOffer.discounted_price || "0")
				: originalPrice;

			return {
				...item,
				originalPrice: originalPrice.toFixed(2),
				offerPrice: offerPrice.toFixed(2),
				hasDailyOffer: hasOffer,
				dailyOfferReason: activeOffer?.reason || null,
				dailyOfferPercent: activeOffer?.discount_percent
					? Number.parseFloat(activeOffer.discount_percent)
					: hasOffer && originalPrice > 0
						? Number.parseFloat(
								(((originalPrice - offerPrice) / originalPrice) * 100).toFixed(1),
							)
						: 0,
			};
		});
	}),

	checkout: protectedProcedure
		.input(
			z.object({
				customerId: z.number().optional(),
				items: z.array(
					z.object({
						productId: z.number(),
						quantity: z.number(),
						price: z.string(),
					}),
				),
				payments: z.array(
					z.object({
						methodId: z.number(),
						amount: z.string(),
					}),
				),
				discountAmount: z.string().optional(),
				discountReason: z.string().optional(),
				otherCharges: z.string().optional(),
				otherChargesReason: z.string().optional(),
				couponId: z.number().optional(),
				isOfflineSync: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx) => {
				const effectiveBranchId = ctx.user.branchId || 1;

				// Calculate totals
				const subtotal = input.items.reduce(
					(acc, item) => acc + Number.parseFloat(item.price) * item.quantity,
					0,
				);
				const discount = Number.parseFloat(input.discountAmount || "0");
				const extra = Number.parseFloat(input.otherCharges || "0");
				const total = Math.max(0, subtotal - discount + extra);
				const status = "completed";

				// 1. Create Order
				const [order] = await tx
					.insert(orders)
					.values({
						customer_id: input.customerId,
						total_amount: total.toString(),
						discount_amount: discount.toString(),
						discount_reason: input.discountReason,
						other_charges: extra.toString(),
						other_charges_reason: input.otherChargesReason,
						coupon_id: input.couponId,
						is_offline_sync: input.isOfflineSync,
						user_uid: ctx.user.id,
						branch_id: effectiveBranchId,
						status,
						finance_status: "reconciled",
					})
					.returning();

				// 2. Batch insert Order Items
				const itemsToInsert = input.items.map((item) => ({
					order_id: order.id,
					product_id: item.productId,
					quantity: item.quantity,
					price: item.price,
				}));

				await tx.insert(orderItems).values(itemsToInsert);

				// Create Picking List task for Picker queue
				const [pl] = await tx
					.insert(pickLists)
					.values({
						order_id: order.id,
						reference_type: "sale",
						reference_id: order.id,
						status: "pending",
						priority: "normal",
					})
					.returning();

				if (pl && input.items.length > 0) {
					await tx.insert(pickListItems).values(
						input.items.map((item) => ({
							pick_list_id: pl.id,
							product_id: item.productId,
							quantity_ordered: item.quantity,
							quantity_picked: 0,
							status: "pending",
						})),
					);
				}

				if (status === "completed") {
					// Batch insert stock ledger
					const ledgerEntries = input.items.map((item) => ({
						product_id: item.productId,
						transaction_type: "out" as const,
						quantity: -item.quantity,
						unit_cost: item.price,
						total_cost: (
							Number.parseFloat(item.price) * item.quantity
						).toString(),
						reference_id: order.id,
						reference_type: "sale",
						branch_id: effectiveBranchId,
					}));

					if (ledgerEntries.length > 0) {
						await tx.insert(stockLedger).values(ledgerEntries);
					}

					// Update branch inventory with auto-provisioning
					if (effectiveBranchId && input.items.length > 0) {
						const productIds = input.items.map((item) => item.productId);
						const existingStocks = await tx
							.select()
							.from(branchInventory)
							.where(
								and(
									eq(branchInventory.branch_id, effectiveBranchId),
									inArray(branchInventory.product_id, productIds),
								),
							);

						const stockMap = new Map(
							existingStocks.map((s) => [s.product_id, s]),
						);

						for (const item of input.items) {
							const existing = stockMap.get(item.productId);
							if (!existing) {
								await tx.insert(branchInventory).values({
									branch_id: effectiveBranchId,
									product_id: item.productId,
									in_stock: 10000,
									reserved_stock: 0,
								});
							} else {
								await tx
									.update(branchInventory)
									.set({
										in_stock: sql`${branchInventory.in_stock} - ${item.quantity}`,
									})
									.where(eq(branchInventory.id, existing.id));
							}
						}
					}
				}

				// 3. Process Payments (Split Payments Supported, Safe Method ID Lookup)
				const validMethods = await tx.select({ id: paymentMethods.id }).from(paymentMethods);
				const validMethodIds = new Set(validMethods.map((m) => m.id));
				const fallbackMethodId = validMethods.length > 0 ? validMethods[0].id : null;

				const paymentsToInsert = input.payments.map((payment) => ({
					order_id: order.id,
					payment_method_id: validMethodIds.has(payment.methodId)
						? payment.methodId
						: fallbackMethodId,
					amount: payment.amount,
					original_amount: payment.amount, // preserve original sales amount
					adjustment_amount: "0",
					reconciliation_status: "pending",
					user_uid: ctx.user.id,
					branch_id: effectiveBranchId,
					type: "in" as const,
					category: "sale" as const,
					status: "completed" as const,
					reference_type: "order",
					reference_id: order.id,
				}));

				if (paymentsToInsert.length > 0) {
					await tx.insert(transactions).values(paymentsToInsert);
				}

				// 4. Update Coupon Usage
				if (input.couponId) {
					await tx
						.update(coupons)
						.set({ usage_count: sql`${coupons.usage_count} + 1` })
						.where(eq(coupons.id, input.couponId));
				}

				// 5. Queue for Sync
				await tx.insert(pendingSync).values({
					id: crypto.randomUUID(),
					branch_id: effectiveBranchId,
					operation_type: "CREATE_ORDER",
					entity_type: "order",
					entity_id: order.id,
					payload: {
						order,
						items: input.items,
						payments: input.payments,
					},
				});

				return order;
			});
		}),

	suspendCart: protectedProcedure
		.input(
			z.object({
				customerId: z.number().optional(),
				items: z.any(), // cart state
				total: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Creates a suspended order that can be retrieved later
			const [order] = await ctx.db
				.insert(orders)
				.values({
					customer_id: input.customerId,
					total_amount: input.total,
					status: "suspended",
					user_uid: ctx.user.id,
					branch_id: ctx.user.branchId,
				})
				.returning();

			// Insert items
			for (const item of input.items) {
				await ctx.db.insert(orderItems).values({
					order_id: order.id,
					product_id: item.id || item.productId,
					quantity: item.qty || item.quantity,
					price: item.price.toString(),
				});
			}

			return order;
		}),

	editOrder: protectedProcedure
		.input(
			z.object({
				orderId: z.number(),
				newTotal: z.string(),
				reason: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Note: In real app, check if role is Manager/Admin
			const existingOrder = await ctx.db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
			});
			if (!existingOrder) throw new Error("Order not found");

			await ctx.db.transaction(async (tx) => {
				// 1. Audit Log
				let staffId = 1;
				if (ctx.user?.email) {
					const staffRec = await tx.query.staff.findFirst({
						where: eq(staff.email, ctx.user.email),
					});
					if (staffRec) staffId = staffRec.id;
				}

				await tx.insert(orderAudits).values({
					order_id: input.orderId,
					action: "edit",
					reason: input.reason,
					previous_state: existingOrder,
					changed_by: staffId,
				});

				// 2. Update Order
				await tx
					.update(orders)
					.set({ total_amount: input.newTotal })
					.where(eq(orders.id, input.orderId));
			});
			return { success: true };
		}),
});
