
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/init";
import { db } from "@/lib/db";
import { products } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

export const productsRouter = router({
  list: publicProcedure.query(async () => {
    return await db.select().from(products);
  }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number(),
      category: z.string().optional(),
      barcode: z.string().optional(),
      sku: z.string().optional(),
      unit: z.string().optional(),
      is_pack: z.boolean().default(false),
      loose_product_id: z.number().optional().nullable(),
      units_per_pack: z.number().optional().nullable(),
      is_weighted: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const [product] = await db.insert(products).values({
        name: input.name,
        description: input.description,
        price: input.price.toString(),
        user_uid: ctx.user.id,
        category: input.category,
        barcode: input.barcode,
        sku: input.sku,
        unit: input.unit,
        is_pack: input.is_pack,
        loose_product_id: input.loose_product_id,
        units_per_pack: input.units_per_pack,
        is_weighted: input.is_weighted,
      }).returning();
      return product;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      category: z.string().optional(),
      barcode: z.string().optional(),
      sku: z.string().optional(),
      unit: z.string().optional(),
      is_pack: z.boolean().optional(),
      loose_product_id: z.number().optional().nullable(),
      units_per_pack: z.number().optional().nullable(),
      is_weighted: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updates: any = { ...data };
      if (data.price !== undefined) updates.price = data.price.toString();

      const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
      return product;
    }),
    
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),
});
