import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./index";
import { eq, and, ilike } from "drizzle-orm";
import * as schema from "@evaluna/db/schema";

// Validation Schemas
const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  parent_id: z.number().optional(),
  image_url: z.string().optional(),
});

// Categories Router
export const categoriesRouter = router({
  // List all categories
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
          ? ilike(schema.productCategories.name, `%${input.search}%`)
          : undefined
      );

      const categories = await ctx.db
        .select()
        .from(schema.productCategories)
        .where(where)
        .limit(input.limit || 50)
        .offset(input.offset || 0)
        .orderBy(schema.productCategories.name);

      const total = await ctx.db
        .select({ count: schema.productCategories.id })
        .from(schema.productCategories)
        .where(where);

      return {
        categories,
        total: total[0]?.count || 0,
      };
    }),

  // Get category by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db
        .select()
        .from(schema.productCategories)
        .where(eq(schema.productCategories.id, input.id));

      return category[0];
    }),

  // Get category by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db
        .select()
        .from(schema.productCategories)
        .where(eq(schema.productCategories.slug, input.slug));

      return category[0];
    }),

  // Create category
  create: protectedProcedure
    .input(categoryFormSchema)
    .mutation(async ({ ctx, input }) => {
      const [category] = await ctx.db
        .insert(schema.productCategories)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description,
          parent_id: input.parent_id,
          image_url: input.image_url,
        })
        .returning();

      return category;
    }),

  // Update category
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: categoryFormSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [category] = await ctx.db
        .update(schema.productCategories)
        .set({
          name: input.data.name,
          slug: input.data.slug,
          description: input.data.description,
          parent_id: input.data.parent_id,
          image_url: input.data.image_url,
        })
        .where(eq(schema.productCategories.id, input.id))
        .returning();

      return category;
    }),

  // Delete category
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(schema.productCategories)
        .where(eq(schema.productCategories.id, input.id));

      return { success: true };
    }),

  // Get category tree (hierarchical)
  getTree: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db
      .select()
      .from(schema.productCategories)
      .orderBy(schema.productCategories.name);

    const categoryMap = new Map<number, any>();
    const roots: any[] = [];

    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(cat);
        }
      } else {
        roots.push(cat);
      }
    });

    return roots;
  }),

  // Get products by category
  getProductsByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ ctx, input }) => {
      const products = await ctx.db
        .select()
        .from(schema.products)
        .innerJoin(
          schema.productCategoryMapping,
          eq(schema.products.id, schema.productCategoryMapping.product_id)
        )
        .where(
          eq(schema.productCategoryMapping.category_id, input.categoryId)
        );

      return products.map((p) => p.products);
    }),
});