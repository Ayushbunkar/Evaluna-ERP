import { z } from "zod";
import { protectedProcedure, router } from "../init";
import {
  stockTransfers,
  branchInventory,
  stockLedger,
  products,
} from "@evaluna/db/schema";
import { eq, and } from "drizzle-orm";

export const transfersRouter = router({
  /** List all stock transfers */
  list: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      return ctx.db.select().from(stockTransfers);
    }),

  /** Create a new inter-branch stock transfer */
  create: protectedProcedure
    .input(
      z.object({
        from_branch_id: z.number(),
        to_branch_id: z.number(),
        product_id: z.number(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { from_branch_id, to_branch_id, product_id, quantity } = input;

      // Look up the sender's inventory row
      const senderInventory = await ctx.db
        .select()
        .from(branchInventory)
        .where(
          and(
            eq(branchInventory.branch_id, from_branch_id),
            eq(branchInventory.product_id, product_id)
          )
        );

      if (!senderInventory[0] || senderInventory[0].in_stock < quantity) {
        throw new Error("Insufficient stock at the source branch");
      }

      // Deduct stock from sender branch immediately
      await ctx.db
        .update(branchInventory)
        .set({ in_stock: senderInventory[0].in_stock - quantity })
        .where(eq(branchInventory.id, senderInventory[0].id));

      // Create the transfer record with status 'in_transit'
      const transfer = await ctx.db
        .insert(stockTransfers)
        .values({
          from_branch_id,
          to_branch_id,
          product_id,
          quantity,
          status: "in_transit",
        })
        .returning();

      // Insert stock ledger entry for the sender (type='out', reference_type='transfer')
      await ctx.db.insert(stockLedger).values({
        branch_id: from_branch_id,
        product_id,
        transaction_type: "out",
        quantity: -quantity,
        unit_cost: "0",
        total_cost: "0",
        reference_id: transfer[0].id,
        reference_type: "transfer",
      });

      return transfer[0];
    }),

  /** Receive a pending / in-transit transfer */
  receive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Fetch the transfer
      const transfer = await ctx.db
        .select()
        .from(stockTransfers)
        .where(eq(stockTransfers.id, input.id));

      if (!transfer[0]) {
        throw new Error("Transfer not found");
      }

      if (transfer[0].status !== "in_transit" && transfer[0].status !== "pending") {
        throw new Error(`Cannot receive a transfer with status '${transfer[0].status}'`);
      }

      const { to_branch_id, product_id, quantity } = transfer[0];

      // Update transfer status to 'received'
      await ctx.db
        .update(stockTransfers)
        .set({ status: "received" })
        .where(eq(stockTransfers.id, input.id));

      // Add stock to receiver's branch inventory
      const receiverInventory = await ctx.db
        .select()
        .from(branchInventory)
        .where(
          and(
            eq(branchInventory.branch_id, to_branch_id),
            eq(branchInventory.product_id, product_id)
          )
        );

      if (receiverInventory[0]) {
        await ctx.db
          .update(branchInventory)
          .set({ in_stock: receiverInventory[0].in_stock + quantity })
          .where(eq(branchInventory.id, receiverInventory[0].id));
      } else {
        await ctx.db.insert(branchInventory).values({
          branch_id: to_branch_id,
          product_id,
          in_stock: quantity,
          reorder_level: 10,
        });
      }

      // Insert stock ledger entry for the receiver (type='in', reference_type='transfer')
      await ctx.db.insert(stockLedger).values({
        branch_id: to_branch_id,
        product_id,
        transaction_type: "in",
        quantity,
        unit_cost: "0",
        total_cost: "0",
        reference_id: transfer[0].id,
        reference_type: "transfer",
      });

      return { success: true, id: input.id };
    }),

  /** Cancel a pending / in-transit transfer and return stock to sender */
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Fetch the transfer
      const transfer = await ctx.db
        .select()
        .from(stockTransfers)
        .where(eq(stockTransfers.id, input.id));

      if (!transfer[0]) {
        throw new Error("Transfer not found");
      }

      if (transfer[0].status !== "in_transit" && transfer[0].status !== "pending") {
        throw new Error(`Cannot cancel a transfer with status '${transfer[0].status}'`);
      }

      const { from_branch_id, product_id, quantity } = transfer[0];

      // Update transfer status to 'cancelled'
      await ctx.db
        .update(stockTransfers)
        .set({ status: "cancelled" })
        .where(eq(stockTransfers.id, input.id));

      // Return stock to sender's branch inventory
      const senderInventory = await ctx.db
        .select()
        .from(branchInventory)
        .where(
          and(
            eq(branchInventory.branch_id, from_branch_id),
            eq(branchInventory.product_id, product_id)
          )
        );

      if (senderInventory[0]) {
        await ctx.db
          .update(branchInventory)
          .set({ in_stock: senderInventory[0].in_stock + quantity })
          .where(eq(branchInventory.id, senderInventory[0].id));
      } else {
        // Edge case: row was deleted; re-create it
        await ctx.db.insert(branchInventory).values({
          branch_id: from_branch_id,
          product_id,
          in_stock: quantity,
          reorder_level: 10,
        });
      }

      return { success: true, id: input.id };
    }),
});
