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
import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "@/lib/trpc/init";

export const posRouter = router({
	catalog: protectedProcedure.query(async ({ ctx }) => {
		const targetBranchId = ctx.user?.branchId || 1;
		const todayStr = new Date().toISOString().split("T")[0];

		// Fetch full products catalog (up to 1000 items) with branch inventory stock and today's active daily discounts
		const [catalog, activeDiscounts] = await Promise.all([
			ctx.db
				.select({
					id: products.id,
					name: products.name,
					sku: products.sku,
					category: products.category,
					unit: products.unit,
					barcode: products.barcode,
					price: products.price,
					baseSellingPrice: products.base_selling_price,
					description: products.description,
					is_weighted: products.is_weighted,
					is_taxable: products.taxable,
					qty_on_hand: sql<number>`coalesce(sum(${branchInventory.in_stock}), 0)::numeric`,
					reorder_level: sql<number>`coalesce(max(${branchInventory.reorder_level}), 10)::int`,
				})
				.from(products)
				.leftJoin(
					branchInventory,
					and(
						eq(products.id, branchInventory.product_id),
						eq(branchInventory.branch_id, targetBranchId),
					),
				)
				.where(
					and(
						or(eq(products.is_deleted, false), isNull(products.is_deleted)),
						or(eq(products.is_hidden, false), isNull(products.is_hidden)),
					),
				)
				.groupBy(
					products.id,
					products.name,
					products.sku,
					products.category,
					products.unit,
					products.barcode,
					products.price,
					products.base_selling_price,
					products.description,
					products.is_weighted,
					products.taxable,
				)
				.orderBy(asc(products.name))
				.limit(1000),
			ctx.db
				.select()
				.from(dailyProductDiscounts)
				.where(
					and(
						eq(dailyProductDiscounts.effective_date, todayStr),
						eq(dailyProductDiscounts.is_active, true),
					),
				)
				.catch(
					() =>
						[] as {
							product_id: number;
							is_active: boolean;
							discounted_price: string | null;
							reason: string;
							discount_percent: string | null;
						}[],
				),
		]);

		const discountMap = new Map<number, (typeof activeDiscounts)[0]>();
		for (const d of activeDiscounts) {
			discountMap.set(d.product_id, d);
		}

		return catalog.map((item) => {
			const activeOffer = discountMap.get(item.id);
			const rawPriceStr = item.price || item.baseSellingPrice || "0";
			const originalPrice = Number.parseFloat(rawPriceStr);
			const hasOffer = !!activeOffer && activeOffer.is_active;
			const offerPrice = hasOffer
				? Number.parseFloat(activeOffer.discounted_price || "0")
				: originalPrice;
			const currentStock = Number(item.qty_on_hand || 0);
			const minThreshold = Number(item.reorder_level ?? 10);
			const isOutOfStock = currentStock <= 0;
			const isLowStock = !isOutOfStock && currentStock <= minThreshold;

			return {
				...item,
				price: originalPrice.toFixed(2),
				originalPrice: originalPrice.toFixed(2),
				offerPrice: offerPrice.toFixed(2),
				hasDailyOffer: hasOffer,
				dailyOfferReason: activeOffer?.reason || null,
				dailyOfferPercent: activeOffer?.discount_percent
					? Number.parseFloat(activeOffer.discount_percent)
					: hasOffer && originalPrice > 0
						? Number.parseFloat(
								(((originalPrice - offerPrice) / originalPrice) * 100).toFixed(
									1,
								),
							)
						: 0,
				qty_on_hand: currentStock,
				reorder_level: minThreshold,
				isOutOfStock,
				isLowStock,
				stockStatus: isOutOfStock
					? "out_of_stock"
					: isLowStock
						? "low_stock"
						: "in_stock",
			};
		});
	}),

	checkout: protectedProcedure
		.input(
			z.object({
				customerId: z.number().optional(),
				existingOrderId: z.number().optional(),
				branchId: z.number().optional(),
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
				customBillDate: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx) => {
				const userId = ctx.user.id || (ctx.user as any).userId;
				const effectiveBranchId =
					input.branchId ||
					ctx.user.branchId ||
					(ctx.user as any)?.branch_id ||
					1;

				// Calculate totals
				const subtotal = input.items.reduce(
					(acc, item) => acc + Number.parseFloat(item.price) * item.quantity,
					0,
				);
				const discount = Number.parseFloat(input.discountAmount || "0");
				const extra = Number.parseFloat(input.otherCharges || "0");
				const total = Math.max(0, subtotal - discount + extra);
				const status = "confirmed";

				// Strict Inventory Check: verify items do not exceed available stock
				if (effectiveBranchId && !input.isOfflineSync && input.items.length > 0) {
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
						existingStocks.map((s) => [s.product_id, Number(s.in_stock || 0)]),
					);

					for (const item of input.items) {
						if (stockMap.has(item.productId)) {
							const available = stockMap.get(item.productId) ?? 0;
							if (item.quantity > available) {
								throw new TRPCError({
									code: "BAD_REQUEST",
									message: `Cannot place order: item #${item.productId} quantity (${item.quantity}) exceeds available stock (${available})!`,
								});
							}
						}
					}
				}

				// Custom backdate handling if sales person selected a custom bill date
				const createdAtDate = input.customBillDate
					? new Date(`${input.customBillDate}T12:00:00.000Z`)
					: undefined;

				// 1. Create or Update Order (preserving sequential order ID if resuming held bill)
				let order: any;
				if (input.existingOrderId) {
					await tx
						.delete(orderItems)
						.where(eq(orderItems.order_id, input.existingOrderId));
					await tx
						.delete(pickLists)
						.where(eq(pickLists.order_id, input.existingOrderId));

					const [updated] = await tx
						.update(orders)
						.set({
							customer_id: input.customerId,
							total_amount: total.toString(),
							discount_amount: discount.toString(),
							discount_reason: input.discountReason,
							other_charges: extra.toString(),
							other_charges_reason: input.otherChargesReason,
							coupon_id: input.couponId,
							is_offline_sync: input.isOfflineSync,
							user_uid: userId,
							branch_id: effectiveBranchId,
							status,
							finance_status: input.payments && input.payments.length > 0 ? "paid" : "pending",
							created_at: createdAtDate || new Date(),
						})
						.where(eq(orders.id, input.existingOrderId))
						.returning();
					order = updated;
				} else {
					const [created] = await tx
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
							user_uid: userId,
							branch_id: effectiveBranchId,
							status,
							finance_status: input.payments && input.payments.length > 0 ? "paid" : "pending",
							created_at: createdAtDate,
						})
						.returning();
					order = created;
				}

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



				// Deduct stock and record in stock ledger for all billed items
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

				// Update branch inventory with accurate auto-provisioning
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
								in_stock: -item.quantity,
								reserved_stock: 0,
								reorder_level: 10,
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
					user_uid: userId,
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
			const userId = ctx.user.id || (ctx.user as any).userId;
			// Creates a suspended order that can be retrieved later
			const [order] = await ctx.db
				.insert(orders)
				.values({
					customer_id: input.customerId,
					total_amount: input.total,
					status: "suspended",
					user_uid: userId,
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
