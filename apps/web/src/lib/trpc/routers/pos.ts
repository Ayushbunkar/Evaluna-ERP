import { z } from "zod";
import { router, protectedProcedure } from "@/lib/trpc/init";
import { 
  orders, 
  orderItems, 
  transactions, 
  stockLedger, 
  coupons, 
  orderAudits,
  branchInventory,
  pendingSync
} from "@evaluna/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const posRouter = router({
  catalog: protectedProcedure.query(async ({ ctx }) => {
    // Highly cached, lightweight product listing for offline sync
    const catalog = await ctx.db.query.products.findMany({
      with: {
        productBatches: true,
      }
    });
    return catalog;
  }),

  checkout: protectedProcedure
    .input(z.object({
      customerId: z.number().optional(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number(),
        price: z.string(),
      })),
      payments: z.array(z.object({
        methodId: z.number(),
        amount: z.string(),
      })),
      discountAmount: z.string().optional(),
      discountReason: z.string().optional(),
      otherCharges: z.string().optional(),
      otherChargesReason: z.string().optional(),
      couponId: z.number().optional(),
      isOfflineSync: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Calculate totals
        const subtotal = input.items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
        const discount = parseFloat(input.discountAmount || "0");
        const extra = parseFloat(input.otherCharges || "0");
        const total = subtotal - discount + extra;

        const paid = input.payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        const status = paid >= total ? "completed" : "pending";

        // 1. Create Order
        const [order] = await tx.insert(orders).values({
          customer_id: input.customerId,
          total_amount: total.toString(),
          discount_amount: discount.toString(),
          discount_reason: input.discountReason,
          other_charges: extra.toString(),
          other_charges_reason: input.otherChargesReason,
          coupon_id: input.couponId,
          is_offline_sync: input.isOfflineSync,
          user_uid: ctx.user.id,
          branch_id: ctx.user.branch_id,
          status,
        }).returning();

        // 2. Insert Order Items & Deduct Stock
        for (const item of input.items) {
          await tx.insert(orderItems).values({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
          });

          if (status === "completed") {
            // Deduct stock
            await tx.insert(stockLedger).values({
              product_id: item.productId,
              transaction_type: "out",
              quantity: -item.quantity,
              unit_cost: item.price,
              total_cost: (parseFloat(item.price) * item.quantity).toString(),
              reference_id: order.id,
              reference_type: "sale",
              branch_id: ctx.user.branch_id,
            });

            // Update branch inventory
            if (ctx.user.branch_id) {
              const existingStock = await tx.select().from(branchInventory).where(
                and(
                  eq(branchInventory.branch_id, ctx.user.branch_id),
                  eq(branchInventory.product_id, item.productId)
                )
              );
              
              if (existingStock.length > 0) {
                await tx.update(branchInventory)
                  .set({ in_stock: sql`${branchInventory.in_stock} - ${item.quantity}` })
                  .where(eq(branchInventory.id, existingStock[0].id));
              }
            }
          }
        }

        // 3. Process Payments (Split Payments Supported)
        for (const payment of input.payments) {
          await tx.insert(transactions).values({
            order_id: order.id,
            payment_method_id: payment.methodId,
            amount: payment.amount,
            user_uid: ctx.user.id,
            branch_id: ctx.user.branch_id,
            type: "credit",
            status: "success",
          });
        }

        // 4. Update Coupon Usage
        if (input.couponId) {
          await tx.update(coupons)
            .set({ usage_count: sql`${coupons.usage_count} + 1` })
            .where(eq(coupons.id, input.couponId));
        }

        // 5. Queue for Sync
        await tx.insert(pendingSync).values({
          id: crypto.randomUUID(),
          branch_id: ctx.user.branch_id,
          operation_type: "CREATE_ORDER",
          entity_type: "order",
          entity_id: order.id,
          payload: {
            order,
            items: input.items,
            payments: input.payments
          }
        });

        return order;
      });
    }),

  suspendCart: protectedProcedure
    .input(z.object({
      customerId: z.number().optional(),
      items: z.any(), // cart state
      total: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Creates a suspended order that can be retrieved later
      const [order] = await ctx.db.insert(orders).values({
        customer_id: input.customerId,
        total_amount: input.total,
        status: "suspended",
        user_uid: ctx.user.id,
      }).returning();
      return order;
    }),

  editOrder: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      newTotal: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Note: In real app, check if role is Manager/Admin
      const existingOrder = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId)
      });
      if (!existingOrder) throw new Error("Order not found");

      await ctx.db.transaction(async (tx) => {
        // 1. Audit Log
        await tx.insert(orderAudits).values({
          order_id: input.orderId,
          action: "edit",
          reason: input.reason,
          previous_state: existingOrder,
          changed_by: 1, // Mocked staff id
        });

        // 2. Update Order
        await tx.update(orders)
          .set({ total_amount: input.newTotal })
          .where(eq(orders.id, input.orderId));
      });
      return { success: true };
    }),
});
