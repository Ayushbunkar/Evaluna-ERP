import { db } from "@/lib/db";
import { z } from "zod";
import { protectedProcedure, router } from "../init";
import {
  orders, orderItems, customers, stockLedger, branchInventory, products,
  branchDamage, productBatches, suppliers, transactions, branches, loyaltyHistory
} from "@evaluna/db/schema";
import { eq, and, gte, lte, isNotNull, desc } from "drizzle-orm";

const reportInput = z.object({
  branch_id: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const reportsRouter = router({
  getSalesReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [];
      if (bId) conditions.push(eq(orders.branch_id, bId));
      if (input.startDate) conditions.push(gte(orders.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(orders.created_at, new Date(input.endDate)));

      return db.query.orders.findMany({
        where: and(...conditions),
        with: {
          orderItems: true,
          customer: true
        },
        orderBy: [desc(orders.created_at)]
      });
    }),

  getGstReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [];
      if (bId) conditions.push(eq(orders.branch_id, bId));
      if (input.startDate) conditions.push(gte(orders.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(orders.created_at, new Date(input.endDate)));

      const data = await db.query.orders.findMany({
        where: and(...conditions),
        columns: {
          id: true,
          cgst_amount: true,
          sgst_amount: true,
          igst_amount: true,
          total_amount: true,
          created_at: true
        }
      });
      return data;
    }),

  getProfitReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      
      const ordersConditions = [];
      if (bId) ordersConditions.push(eq(orders.branch_id, bId));
      if (input.startDate) ordersConditions.push(gte(orders.created_at, new Date(input.startDate)));
      if (input.endDate) ordersConditions.push(lte(orders.created_at, new Date(input.endDate)));

      const salesData = await db.query.orders.findMany({
        where: and(...ordersConditions),
        columns: { total_amount: true, discount_amount: true }
      });

      const ledgerConditions = [eq(stockLedger.transaction_type, 'out')];
      if (bId) ledgerConditions.push(eq(stockLedger.branch_id, bId));
      if (input.startDate) ledgerConditions.push(gte(stockLedger.created_at, new Date(input.startDate)));
      if (input.endDate) ledgerConditions.push(lte(stockLedger.created_at, new Date(input.endDate)));

      const cogsData = await db.query.stockLedger.findMany({
        where: and(...ledgerConditions),
        columns: { total_cost: true }
      });

      return { salesData, cogsData };
    }),

  getStockReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [];
      if (bId) conditions.push(eq(branchInventory.branch_id, bId));
      if (input.startDate) conditions.push(gte(branchInventory.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(branchInventory.created_at, new Date(input.endDate)));

      return db.query.branchInventory.findMany({
        where: and(...conditions),
        with: { product: true }
      });
    }),

  getLowStockReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [];
      if (bId) conditions.push(eq(branchInventory.branch_id, bId));
      
      // Note: branchInventory.in_stock <= branchInventory.reorder_level
      // can be evaluated by selecting all and filtering, or using sql in where.
      // Easiest is returning rows and letting frontend handle, but let's query it.
      
      const inventory = await db.query.branchInventory.findMany({
        where: and(...conditions),
        with: { product: true }
      });

      return inventory.filter(item => item.in_stock <= item.reorder_level);
    }),

  getDeadStockReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [];
      if (bId) conditions.push(eq(branchInventory.branch_id, bId));

      return db.query.branchInventory.findMany({
        where: and(...conditions),
        with: { product: true }
      });
    }),

  getDamageReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      // branchDamage doesn't have branch_id directly, it uses location_id.
      // we'll filter by dates for now, and optionally join location if branch_id is strictly required.
      const conditions = [];
      if (input.startDate) conditions.push(gte(branchDamage.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(branchDamage.created_at, new Date(input.endDate)));

      return db.query.branchDamage.findMany({
        where: and(...conditions),
        with: { product: true, batch: true }
      });
    }),

  getExpiryReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [isNotNull(productBatches.expiry_date)];
      if (bId) conditions.push(eq(productBatches.branch_id, bId));
      if (input.startDate) conditions.push(gte(productBatches.expiry_date, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(productBatches.expiry_date, new Date(input.endDate)));

      return db.query.productBatches.findMany({
        where: and(...conditions),
        with: { product: true }
      });
    }),

  getCustomerReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [];
      if (bId) conditions.push(eq(customers.branch_id, bId));
      if (input.startDate) conditions.push(gte(customers.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(customers.created_at, new Date(input.endDate)));

      return db.query.customers.findMany({
        where: and(...conditions),
        with: { orders: true }
      });
    }),

  getSupplierReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input }) => {
      const conditions = [];
      if (input.startDate) conditions.push(gte(suppliers.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(suppliers.created_at, new Date(input.endDate)));

      return db.query.suppliers.findMany({
        where: and(...conditions)
      });
    }),

  getCashBookReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [];
      if (bId) conditions.push(eq(transactions.branch_id, bId));
      if (input.startDate) conditions.push(gte(transactions.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(transactions.created_at, new Date(input.endDate)));

      return db.query.transactions.findMany({
        where: and(...conditions),
        orderBy: [desc(transactions.created_at)]
      });
    }),

  getBranchComparisonReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input }) => {
      const conditions = [];
      if (input.startDate) conditions.push(gte(branches.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(branches.created_at, new Date(input.endDate)));

      return db.query.branches.findMany({
        where: and(...conditions)
      });
    }),

  getCouponReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [isNotNull(orders.coupon_id)];
      if (bId) conditions.push(eq(orders.branch_id, bId));
      if (input.startDate) conditions.push(gte(orders.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(orders.created_at, new Date(input.endDate)));

      return db.query.orders.findMany({
        where: and(...conditions),
        with: { coupon: true }
      });
    }),

  getLoyaltyReport: protectedProcedure
    .input(reportInput)
    .query(async ({ input, ctx }) => {
      const bId = input.branch_id ?? ctx.user.branch_id;
      const conditions = [];
      if (bId) conditions.push(eq(loyaltyHistory.branch_id, bId));
      if (input.startDate) conditions.push(gte(loyaltyHistory.created_at, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(loyaltyHistory.created_at, new Date(input.endDate)));

      return db.query.loyaltyHistory.findMany({
        where: and(...conditions),
        with: { customer: true }
      });
    })
});
