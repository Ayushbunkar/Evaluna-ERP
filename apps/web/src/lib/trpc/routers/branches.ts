import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { branches, branchInventory, products } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

export const branchesRouter = router({
  /** List all branches */
  list: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      return ctx.db.select().from(branches);
    }),

  /** Create a new branch */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        is_headquarters: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Auto-generate code as BR-XXXX if not provided
      const code =
        input.code ??
        `BR-${Math.floor(1000 + Math.random() * 9000).toString()}`;

      const result = await ctx.db
        .insert(branches)
        .values({
          name: input.name,
          code,
          address: input.address ?? null,
          phone: input.phone ?? null,
          email: input.email ?? null,
          is_headquarters: input.is_headquarters ?? false,
        })
        .returning();

      return result[0];
    }),

  /** Get a branch by ID */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(branches)
        .where(eq(branches.id, input.id));

      if (!result[0]) {
        throw new Error("Branch not found");
      }

      return result[0];
    }),

  /** Update a branch */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, code, address, phone, email } = input;

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;

      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }

      const result = await ctx.db
        .update(branches)
        .set(updateData)
        .where(eq(branches.id, id))
        .returning();

      if (!result[0]) {
        throw new Error("Branch not found");
      }

      return result[0];
    }),

  /** Delete a branch */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(branches)
        .where(eq(branches.id, input.id))
        .returning();

      if (!result[0]) {
        throw new Error("Branch not found");
      }

      return result[0];
    }),

  /** Get branch inventory (joined with products) */
  getInventory: protectedProcedure
    .input(z.object({ branch_id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: branchInventory.id,
          branch_id: branchInventory.branch_id,
          product_id: branchInventory.product_id,
          in_stock: branchInventory.in_stock,
          reorder_level: branchInventory.reorder_level,
          created_at: branchInventory.created_at,
          product_name: products.name,
          product_sku: products.sku,
          product_price: products.price,
        })
        .from(branchInventory)
        .innerJoin(products, eq(branchInventory.product_id, products.id))
        .where(eq(branchInventory.branch_id, input.branch_id));
    }),
});
