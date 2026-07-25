import { z } from "zod";
import { publicProcedure, router } from "@/lib/trpc/init";
import {
  stockAudits,
  stockAuditItems,
  auditDiscrepancies,
  missingStockQueue,
  warehouseLocations,
  products,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const auditRouter = router({
  create: publicProcedure
    .input(
      z.object({
        warehouse_id: z.number(),
        auditor_id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(stockAudits)
        .values({
          warehouse_id: input.warehouse_id,
          auditor_id: input.auditor_id,
          status: "planned",
        })
        .returning();
      return result[0];
    }),

  addCount: publicProcedure
    .input(
      z.object({
        audit_id: z.number(),
        product_id: z.number(),
        location_id: z.number().optional(),
        expected_qty: z.number(),
        counted_qty: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let status = "match";
      if (input.counted_qty !== input.expected_qty) {
        status = "mismatch";
      }

      const result = await ctx.db
        .insert(stockAuditItems)
        .values({
          audit_id: input.audit_id,
          product_id: input.product_id,
          location_id: input.location_id,
          expected_qty: input.expected_qty,
          counted_qty: input.counted_qty,
          status,
        })
        .returning();

      // If missing stock, add to discrepancy and missing queue
      if (input.counted_qty < input.expected_qty) {
        await ctx.db.insert(auditDiscrepancies).values({
          audit_item_id: result[0].id,
          discrepancy_type: "missing",
          quantity: input.expected_qty - input.counted_qty,
        });

        await ctx.db.insert(missingStockQueue).values({
          product_id: input.product_id,
          audit_id: input.audit_id,
          quantity: input.expected_qty - input.counted_qty,
          status: "missing",
        });
      }

      return result[0];
    }),

  reportDamageOrExpiry: publicProcedure
    .input(
      z.object({
        audit_item_id: z.number(),
        type: z.enum(["damage", "expiry", "pna"]),
        quantity: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(auditDiscrepancies)
        .values({
          audit_item_id: input.audit_item_id,
          discrepancy_type: input.type,
          quantity: input.quantity,
          reason: input.reason,
        })
        .returning();
      return result[0];
    }),

  listEscalations: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(auditDiscrepancies)
      .where(eq(auditDiscrepancies.resolution_status, "pending"));
  }),

  resolveDiscrepancy: publicProcedure
    .input(
      z.object({
        discrepancy_id: z.number(),
        status: z.enum(["approved", "rejected"]),
        resolver_id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(auditDiscrepancies)
        .set({
          resolution_status: input.status,
          resolved_by: input.resolver_id,
          resolved_at: new Date(),
        })
        .where(eq(auditDiscrepancies.id, input.discrepancy_id))
        .returning();
      return result[0];
    }),
});
