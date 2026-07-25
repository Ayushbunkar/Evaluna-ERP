import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { suppliers, purchases, transactions, products } from "@evaluna/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export const supplierRouter = router({
  getPortalStats: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      
      const posCount = await db.select({ count: count() }).from(purchases);
      const pendingDeliv = await db.select({ count: count() }).from(purchases).where(eq(purchases.status, "pending"));
      
      return {
        totalPOs: posCount[0]?.count || 0,
        pendingDeliveries: pendingDeliv[0]?.count || 0,
        invoicesSubmitted: 0,
        pendingPayment: 0,
        totalSupplied: 0,
        paymentDue: 0,
      };
    }),

  getPurchaseOrders: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select({
        id: purchases.id,
        grn_number: purchases.grn_number,
        total_amount: purchases.total_amount,
        status: purchases.status,
        created_at: purchases.created_at,
      })
      .from(purchases)
      .orderBy(desc(purchases.created_at))
      .limit(50);

      return results.map(r => ({
        po_number: `PO-${r.id}`,
        date: r.created_at?.toLocaleDateString() || "",
        items: 0,
        total_amount: Number(r.total_amount) || 0,
        delivery_date: "N/A",
        status: r.status,
      }));
    }),

  getGRN: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select({
        id: purchases.id,
        grn_number: purchases.grn_number,
        created_at: purchases.created_at,
        status: purchases.status,
      })
      .from(purchases)
      .where(eq(purchases.status, "received"))
      .orderBy(desc(purchases.created_at))
      .limit(50);

      return results.map(r => ({
        grn_number: r.grn_number || `GRN-${r.id}`,
        po_reference: `PO-${r.id}`,
        date: r.created_at?.toLocaleDateString() || "",
        items: 0,
        quantity: 0,
        verified_by: "N/A",
        status: r.status,
      }));
    }),

  getInvoices: protectedProcedure
    .input(z.object({}))
    .query(async () => {
      return [];
    }),

  getPayments: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select()
        .from(transactions)
        .where(eq(transactions.category, "purchase"))
        .orderBy(desc(transactions.created_at))
        .limit(50);

      return results.map(r => ({
        date: r.created_at?.toLocaleDateString() || "",
        reference: `PAY-${r.id}`,
        amount: Number(r.amount) || 0,
        payment_mode: r.payment_method_id ? "Bank/Card" : "Cash",
        bank: "N/A",
        status: r.status,
      }));
    }),

  getReturns: protectedProcedure
    .input(z.object({}))
    .query(async () => {
      return [];
    }),

  getProducts: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select()
        .from(products)
        .orderBy(desc(products.created_at))
        .limit(50);

      return results.map(r => ({
        product_code: r.sku || `PRD-${r.id}`,
        name: r.name,
        category: r.category || "General",
        unit_price: Number(r.price) || 0,
        moq: 0,
        lead_time: "N/A",
        availability: "Available",
      }));
    }),
});
