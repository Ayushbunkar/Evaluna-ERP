
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/init";
import { db } from "@/lib/db";
import { products } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

export const productsRouter = router({
  list: publicProcedure.query(async () => {
    return [
      { id: 1, name: "Tata Salt 1kg", sku: "GRO-TS-001", category: "Groceries", price: 28, cost: 20, supplier: "Tata Consumer Products" },
      { id: 2, name: "Aashirvaad Atta 5kg", sku: "GRO-AA-005", category: "Groceries", price: 250, cost: 200, supplier: "ITC Limited" },
      { id: 3, name: "Amul Butter 500g", sku: "DAI-AB-500", category: "Dairy", price: 275, cost: 230, supplier: "GCMMF (Amul)" },
      { id: 4, name: "Maggi Noodles 140g", sku: "SNA-MN-140", category: "Snacks", price: 30, cost: 24, supplier: "Nestle India" },
      { id: 5, name: "Surf Excel 2kg", sku: "CLE-SE-002", category: "Cleaning", price: 420, cost: 340, supplier: "Hindustan Unilever" },
      { id: 6, name: "Parle-G 800g", sku: "SNA-PG-800", category: "Snacks", price: 80, cost: 60, supplier: "Parle Products" },
      { id: 7, name: "Red Label Tea 250g", sku: "BEV-RL-250", category: "Beverages", price: 140, cost: 105, supplier: "Hindustan Unilever" },
      { id: 8, name: "Dabur Honey 1kg", sku: "GRO-DH-001", category: "Groceries", price: 430, cost: 320, supplier: "Dabur India" },
    ];
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
