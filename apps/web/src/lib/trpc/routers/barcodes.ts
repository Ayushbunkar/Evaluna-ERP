import { z } from "zod";
import { publicProcedure, router } from "@/lib/trpc/init";
import { productBarcodes } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";

export const barcodesRouter = router({
  listByProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      const barcodes = await ctx.db
        .select()
        .from(productBarcodes)
        .where(eq(productBarcodes.product_id, input.productId));

      return barcodes;
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
          ? ilike(productBarcodes.barcode, `%${input.search}%`)
          : undefined
      );

      const barcodes = await ctx.db
        .select()
        .from(productBarcodes)
        .where(where)
        .limit(input.limit || 50)
        .offset(input.offset || 0)
        .orderBy(productBarcodes.created_at);

      const total = await ctx.db
        .select({ count: productBarcodes.id })
        .from(productBarcodes)
        .where(where);

      return {
        barcodes,
        total: total[0]?.count || 0,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const barcode = await ctx.db
        .select()
        .from(productBarcodes)
        .where(eq(productBarcodes.id, input.id));

      return barcode[0];
    }),

  create: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement create barcode
    return { success: true };
  }),

  update: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement update barcode
    return { success: true };
  }),

  delete: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement delete barcode
    return { success: true };
  }),
});