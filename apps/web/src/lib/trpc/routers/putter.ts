import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { putLists, purchases, suppliers, branchDamage, products, staff } from "@evaluna/db/schema";
import { eq, desc, and, count } from "drizzle-orm";

export const putterRouter = router({
  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      
      const receivingCount = await db.select({ count: count() }).from(purchases).where(eq(purchases.status, "pending"));
      const putAwayCount = await db.select({ count: count() }).from(putLists).where(eq(putLists.status, "pending"));
      const damageCount = await db.select({ count: count() }).from(branchDamage).where(eq(branchDamage.status, "reported"));

      return {
        itemsToReceive: receivingCount[0]?.count || 0,
        putAwayQueue: putAwayCount[0]?.count || 0,
        missingStock: 0,
        damageReports: damageCount[0]?.count || 0,
        saleReturns: 0,
        efficiencyPct: 100,
        recentActivity: []
      };
    }),

  getReceiving: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select({
        id: purchases.id,
        grn_number: purchases.grn_number,
        supplier: suppliers.name,
        created_at: purchases.created_at,
        status: purchases.status,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
      .orderBy(desc(purchases.created_at))
      .limit(50);

      return results.map(r => ({
        id: r.grn_number || `PUR-${r.id}`,
        supplier: r.supplier || "Unknown",
        products: 0,
        qty: 0,
        po_ref: `PO-${r.id}`,
        received_by: "N/A",
        date: r.created_at?.toLocaleDateString() || "",
        status: r.status
      }));
    }),

  getPutAwayTasks: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select({
        id: putLists.id,
        status: putLists.status,
      })
      .from(putLists)
      .where(eq(putLists.status, "pending"))
      .orderBy(desc(putLists.id))
      .limit(50);

      return results.map(r => ({
        id: `PA-${r.id}`,
        product: "Various",
        sku: "N/A",
        qty: 0,
        from: "Receiving Bay",
        to_location: "Warehouse",
        status: r.status,
      }));
    }),

  getMissingStock: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async () => {
      return [];
    }),

  getSaleReturns: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async () => {
      return [];
    }),

  getDamageReports: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select({
        id: branchDamage.id,
        product: products.name,
        quantity: branchDamage.quantity,
        reason: branchDamage.reason,
        status: branchDamage.status,
        created_at: branchDamage.created_at,
        reported_by: staff.name,
      })
      .from(branchDamage)
      .leftJoin(products, eq(branchDamage.product_id, products.id))
      .leftJoin(staff, eq(branchDamage.reported_by, staff.id))
      .orderBy(desc(branchDamage.created_at))
      .limit(50);

      return results.map(r => ({
        id: `DAM-${r.id}`,
        product: r.product || "Unknown",
        qty_damaged: r.quantity,
        damage_type: r.reason || "Unknown",
        severity: "Medium",
        location: "Warehouse",
        raised_by: r.reported_by || "Unknown",
        date: r.created_at?.toLocaleDateString() || "",
      }));
    }),

  getCompleted: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select({
        id: putLists.id,
        status: putLists.status,
      })
      .from(putLists)
      .where(eq(putLists.status, "completed"))
      .orderBy(desc(putLists.id))
      .limit(50);

      return results.map(r => ({
        id: `PA-${r.id}`,
        product: "Various",
        qty: 0,
        location: "Warehouse",
        completed_by: "Unknown",
        time_taken: "N/A",
        date: "N/A",
      }));
    }),

  getReports: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async () => {
      return [];
    }),
});
