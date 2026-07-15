import { protectedProcedure, router } from "../init";
import { z } from "zod";
import { db } from "@/lib/db";
import { suppliers, transactions, purchases } from "@evaluna/db/schema";
import { count, eq, and, desc } from "drizzle-orm";

export const suppliersRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      gst_number: z.string().optional(),
      pan_number: z.string().optional(),
      supplier_category: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const code = `SUPP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newSupplier = await db.insert(suppliers).values({
        ...input,
        supplier_code: code
      }).returning();
      return newSupplier[0];
    }),
    
  list: protectedProcedure
    .input(z.void())
    .query(async () => {
      return await db.select().from(suppliers);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const supplier = await db.query.suppliers.findFirst({
        where: eq(suppliers.id, input.id),
      });

      if (!supplier) throw new Error("Supplier not found");

      const ledger = await db.query.transactions.findMany({
        where: and(
          eq(transactions.reference_type, 'supplier_payment'),
          eq(transactions.reference_id, input.id)
        ),
        orderBy: [desc(transactions.created_at)]
      });

      const purchaseHistory = await db.query.purchases.findMany({
        where: eq(purchases.supplier_id, input.id),
        orderBy: [desc(purchases.created_at)]
      });

      return { supplier, ledger, purchaseHistory };
    }),

  paySupplier: protectedProcedure
    .input(z.object({
      supplier_id: z.number(),
      amount: z.number().positive(),
      description: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const supplier = await db.query.suppliers.findFirst({
        where: eq(suppliers.id, input.supplier_id)
      });

      if (!supplier) throw new Error("Supplier not found");

      // Log transaction
      await db.insert(transactions).values({
        type: 'out',
        amount: input.amount.toString(),
        category: 'supplier_payment',
        description: input.description,
        reference_type: 'supplier_payment',
        reference_id: input.supplier_id,
        user_uid: ctx.user.id
      });

      // Decrement outstanding balance
      const currentBalance = parseFloat(supplier.outstanding_balance || "0");
      const newBalance = currentBalance - input.amount;

      await db.update(suppliers)
        .set({ outstanding_balance: newBalance.toString() })
        .where(eq(suppliers.id, input.supplier_id));

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      gst_number: z.string().optional(),
      pan_number: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updatedSupplier = await db
        .update(suppliers)
        .set(data)
        .where(eq(suppliers.id, id))
        .returning();
      return updatedSupplier[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(suppliers).where(eq(suppliers.id, input.id));
      return { id: input.id };
    }),
});
