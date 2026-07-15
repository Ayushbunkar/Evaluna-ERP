import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/init";
import {
  branchLocations,
  pickLists,
  pickListItems,
  putLists,
  putListItems,
  batchStock,
  orders,
  orderItems,
  stockLedger,
  productBatches,
} from "@evaluna/db/schema";
import { eq, and, ilike, asc, sql } from "drizzle-orm";

export const warehouseRouter = router({
  // Location Management
  listLocations: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        branch_id: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let conditions = [];
      const branchId = input.branch_id || ctx.user.branch_id || 1;
      
      conditions.push(eq(branchLocations.branch_id, branchId));

      if (input.search) {
        conditions.push(ilike(branchLocations.name, `%${input.search}%`));
      }
      
      return ctx.db
        .select()
        .from(branchLocations)
        .where(and(...conditions))
        .orderBy(asc(branchLocations.name));
    }),

  createLocation: protectedProcedure
    .input(
      z.object({
        branch_id: z.number().optional(),
        name: z.string(),
        section: z.string().optional(),
        aisle: z.string().optional(),
        shelf: z.string().optional(),
        level: z.string().optional(),
        location_type: z.string().optional(),
        capacity: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const branchId = input.branch_id || ctx.user.branch_id || 1;
      const result = await ctx.db
        .insert(branchLocations)
        .values({
          branch_id: branchId,
          name: input.name,
          section: input.section,
          aisle: input.aisle,
          shelf: input.shelf,
          level: input.level,
          location_type: input.location_type || "storage",
          capacity: input.capacity || 0,
        })
        .returning();
      return result[0];
    }),

  updateLocation: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        section: z.string().optional(),
        aisle: z.string().optional(),
        shelf: z.string().optional(),
        level: z.string().optional(),
        location_type: z.string().optional(),
        capacity: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db
        .update(branchLocations)
        .set(data)
        .where(eq(branchLocations.id, id))
        .returning();
      return result[0];
    }),

  moveStock: protectedProcedure
    .input(
      z.object({
        source_location_id: z.number(),
        destination_location_id: z.number(),
        batch_id: z.number(),
        quantity: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // 1. Deduct from source
        const sourceStock = await tx
          .select()
          .from(batchStock)
          .where(
            and(
              eq(batchStock.location_id, input.source_location_id),
              eq(batchStock.batch_id, input.batch_id)
            )
          );

        if (sourceStock.length === 0 || sourceStock[0].quantity < input.quantity) {
          throw new Error("Insufficient stock in source location");
        }

        await tx
          .update(batchStock)
          .set({ quantity: sql`${batchStock.quantity} - ${input.quantity}` })
          .where(eq(batchStock.id, sourceStock[0].id));

        // 2. Add to destination
        const destStock = await tx
          .select()
          .from(batchStock)
          .where(
            and(
              eq(batchStock.location_id, input.destination_location_id),
              eq(batchStock.batch_id, input.batch_id)
            )
          );

        if (destStock.length > 0) {
          await tx
            .update(batchStock)
            .set({ quantity: sql`${batchStock.quantity} + ${input.quantity}` })
            .where(eq(batchStock.id, destStock[0].id));
        } else {
          await tx.insert(batchStock).values({
            location_id: input.destination_location_id,
            batch_id: input.batch_id,
            quantity: input.quantity,
          });
        }

        // Get product ID for ledger
        const [batch] = await tx.select().from(productBatches).where(eq(productBatches.id, input.batch_id));

        // 3. Ledger entries for audit
        if (batch) {
          await tx.insert(stockLedger).values([
            {
              product_id: batch.product_id,
              batch_id: input.batch_id,
              transaction_type: "transfer",
              quantity: -input.quantity,
              reference_type: "location_move_out",
              reference_id: input.source_location_id,
              unit_cost: "0",
              total_cost: "0",
              branch_id: ctx.user.branch_id || 1,
            },
            {
              product_id: batch.product_id,
              batch_id: input.batch_id,
              transaction_type: "transfer",
              quantity: input.quantity,
              reference_type: "location_move_in",
              reference_id: input.destination_location_id,
              unit_cost: "0",
              total_cost: "0",
              branch_id: ctx.user.branch_id || 1,
            }
          ]);
        }

        return { success: true };
      });
    }),
    
    locationHistory: protectedProcedure
    .input(z.object({ location_id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(stockLedger)
        .where(eq(stockLedger.reference_id, input.location_id))
        .orderBy(sql`${stockLedger.created_at} DESC`)
        .limit(50);
    }),

  getPickLists: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.select().from(pickLists);
    }),

  getPutLists: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.select().from(putLists);
    }),

  completePickItem: protectedProcedure
    .input(z.object({
      item_id: z.number(),
      quantity_picked: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(pickListItems)
        .set({ 
          status: "picked", 
          quantity_picked: input.quantity_picked,
          picked_at: new Date(),
        })
        .where(eq(pickListItems.id, input.item_id))
        .returning();
      return result[0];
    }),

  completePutItem: protectedProcedure
    .input(z.object({
      item_id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(putListItems)
        .set({ 
          status: "put", 
          put_at: new Date(),
        })
        .where(eq(putListItems.id, input.item_id))
        .returning();
      return result[0];
    }),

  // Putter Dashboard APIs
  getPutLists: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      let conditions = [];
      if (input?.status) {
        conditions.push(eq(putLists.status, input.status));
      }
      return ctx.db
        .select()
        .from(putLists)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(putLists.created_at))
        .limit(50);
    }),

  getPutaways: protectedProcedure
    .query(async ({ ctx }) => {
      // Mocked pending putaways or actual joined query
      return ctx.db
        .select()
        .from(putListItems)
        .where(eq(putListItems.status, 'pending'))
        .limit(50);
    }),

  receiveGRN: protectedProcedure
    .input(z.object({ grn_number: z.string(), items: z.array(z.object({ product_id: z.number(), quantity: z.number() })) }))
    .mutation(async ({ ctx, input }) => {
      // Mock logic for GRN receive
      return { success: true, grn: input.grn_number };
    }),

  completePutaway: protectedProcedure
    .input(z.object({ item_id: z.number(), location_id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Update putaway item status
      await ctx.db
        .update(putListItems)
        .set({ status: 'completed' })
        .where(eq(putListItems.id, input.item_id));
      return { success: true };
    }),
});