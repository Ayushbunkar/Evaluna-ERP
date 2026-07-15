import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./index";
import { eq, and, ilike } from "drizzle-orm";
import * as schema from "@evaluna/db/schema";

// Validation Schemas
const barcodeFormSchema = z.object({
  product_id: z.number(),
  barcode: z.string().min(1, "Barcode is required"),
  barcode_type: z.string().optional(),
  is_weighted: z.boolean().optional(),
  weight_per_unit: z.string().optional(),
});

// Barcodes Router
export const barcodesRouter = router({
  // List all barcodes for a product
  listByProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      const barcodes = await ctx.db
        .select()
        .from(schema.productBarcodes)
        .where(eq(schema.productBarcodes.product_id, input.productId));

      return barcodes;
    }),

  // List all barcodes with pagination
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
          ? ilike(schema.productBarcodes.barcode, `%${input.search}%`)
          : undefined
      );

      const barcodes = await ctx.db
        .select()
        .from(schema.productBarcodes)
        .where(where)
        .limit(input.limit || 50)
        .offset(input.offset || 0)
        .orderBy(schema.productBarcodes.created_at);

      const total = await ctx.db
        .select({ count: schema.productBarcodes.id })
        .from(schema.productBarcodes)
        .where(where);

      return {
        barcodes,
        total: total[0]?.count || 0,
      };
    }),

  // Get barcode by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const barcode = await ctx.db
        .select()
        .from(schema.productBarcodes)
        .where(eq(schema.productBarcodes.id, input.id));

      return barcode[0];
    }),

  // Get barcode by barcode value
  getByBarcode: publicProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ ctx, input }) => {
      const barcode = await ctx.db
        .select()
        .from(schema.productBarcodes)
        .where(eq(schema.productBarcodes.barcode, input.barcode));

      return barcode[0];
    }),

  // Create barcode
  create: protectedProcedure
    .input(barcodeFormSchema)
    .mutation(async ({ ctx, input }) => {
      const [barcode] = await ctx.db
        .insert(schema.productBarcodes)
        .values({
          product_id: input.product_id,
          barcode: input.barcode,
          barcode_type: input.barcode_type || "EAN-13",
          is_weighted: input.is_weighted || false,
          weight_per_unit: input.weight_per_unit,
        })
        .returning();

      return barcode;
    }),

  // Update barcode
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: barcodeFormSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [barcode] = await ctx.db
        .update(schema.productBarcodes)
        .set({
          barcode: input.data.barcode,
          barcode_type: input.data.barcode_type,
          is_weighted: input.data.is_weighted,
          weight_per_unit: input.data.weight_per_unit,
        })
        .where(eq(schema.productBarcodes.id, input.id))
        .returning();

      return barcode;
    }),

  // Delete barcode
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(schema.productBarcodes)
        .where(eq(schema.productBarcodes.id, input.id));

      return { success: true };
    }),

  // Generate QR code for barcode
  generateQrCode: publicProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ input }) => {
      // In production, this would generate a QR code image
      // For now, return the barcode data
      return {
        barcode: input.barcode,
        qr_code_url: `/api/qrcode?data=${encodeURIComponent(input.barcode)}`,
      };
    }),
});