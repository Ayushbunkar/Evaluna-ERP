import { z } from "zod";
import { publicProcedure, router } from "@/lib/trpc/init";
import { productCategories } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";

export const categoriesRouter = router({
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
          ? ilike(productCategories.name, `%${input.search}%`)
          : undefined
      );

      const categories = await ctx.db
        .select()
        .from(productCategories)
        .where(where)
        .limit(input.limit || 50)
        .offset(input.offset || 0)
        .orderBy(productCategories.name);

      const total = await ctx.db
        .select({ count: productCategories.id })
        .from(productCategories)
        .where(where);

      return {
        categories,
        total: total[0]?.count || 0,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, input.id));

      return category[0];
    }),

  create: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement create category
    return { success: true };
  }),

  update: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement update category
    return { success: true };
  }),

  delete: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement delete category
    return { success: true };
  }),
});