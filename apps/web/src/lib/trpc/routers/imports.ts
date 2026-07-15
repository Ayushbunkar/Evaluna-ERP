import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { db } from "@/lib/db";
import { products, importJobs } from "@evaluna/db/schema";
import { eq, inArray } from "drizzle-orm";

export const importsRouter = router({
  validateImport: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      rows: z.array(z.any()),
    }))
    .mutation(async ({ input }) => {
      const { entityType, rows } = input;
      const validRows: any[] = [];
      const errorRows: { rowData: any; errorString: string }[] = [];

      if (entityType === "product") {
        const rowBarcodes = rows
          .map(r => r.barcode)
          .filter(b => typeof b === "string" && b.trim() !== "");

        let existingBarcodes: string[] = [];
        if (rowBarcodes.length > 0) {
          const existing = await db
            .select({ barcode: products.barcode })
            .from(products)
            .where(inArray(products.barcode, rowBarcodes));
          existingBarcodes = existing.map(e => e.barcode).filter(Boolean) as string[];
        }

        for (const row of rows) {
          const errors: string[] = [];
          if (!row.name || typeof row.name !== "string" || row.name.trim() === "") {
            errors.push("Missing or invalid name");
          }
          if (row.price === undefined || row.price === null || isNaN(Number(row.price))) {
            errors.push("Missing or invalid price");
          }
          if (row.barcode && existingBarcodes.includes(row.barcode)) {
            errors.push("Barcode already exists in DB");
          }

          if (errors.length > 0) {
            errorRows.push({ rowData: row, errorString: errors.join(", ") });
          } else {
            validRows.push(row);
          }
        }
      } else {
        // Fallback for other entities
        for (const row of rows) {
          validRows.push(row);
        }
      }

      return { validRows, errorRows };
    }),

  executeImport: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      validRows: z.array(z.any()),
    }))
    .mutation(async ({ input, ctx }) => {
      const { entityType, validRows } = input;

      if (validRows.length === 0) return { success: true, count: 0 };

      if (entityType === "product") {
        const values = validRows.map(row => ({
          name: String(row.name),
          price: String(row.price),
          barcode: row.barcode ? String(row.barcode) : null,
          category: row.category ? String(row.category) : null,
          description: row.description ? String(row.description) : null,
          user_uid: ctx.user.id,
        }));

        await db.insert(products).values(values).onConflictDoNothing();
      }

      return { success: true, count: validRows.length };
    }),

  getTemplate: protectedProcedure
    .input(z.object({
      entityType: z.string(),
    }))
    .query(({ input }) => {
      if (input.entityType === "product") {
        return ["name", "price", "barcode", "category", "description"];
      }
      return [];
    }),
});
