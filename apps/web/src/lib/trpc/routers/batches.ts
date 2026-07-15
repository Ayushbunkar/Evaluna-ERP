import { z } from "zod";
import { publicProcedure, router } from "@/lib/trpc/init";
import { productBatches } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";

export const batchesRouter = router({
  listByProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      const batches = await ctx.db
        .select()
        .from(productBatches)
        .where(eq(productBatches.product_id, input.productId));

      return batches;
    }),

  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = and(
        input.search
          ? ilike(productBatches.batch_number, `%${input.search}%`)
          : undefined
      );

      const batches = await ctx.db
        .select()
        .from(productBatches)
        .where(where)
        .limit(input.limit || 50)
        .offset(input.offset || 0)
        .orderBy(productBatches.created_at);

      const total = await ctx.db
        .select({ count: productBatches.id })
        .from(productBatches)
        .where(where);

      return {
        batches,
        total: total[0]?.count || 0,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const batch = await ctx.db
        .select()
        .from(productBatches)
        .where(eq(productBatches.id, input.id));

      return batch[0];
    }),

  create: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement create batch
    return { success: true };
  }),

  update: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement update batch
    return { success: true };
  }),

  delete: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement delete batch
    return { success: true };
  }),
});