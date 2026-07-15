import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { db } from "@/lib/db";
import {
  branches,
  branchInventory,
  orders,
  transactions,
  customers,
  products,
} from "@evaluna/db/schema";
import { eq, and, gte, lte, count, sql, sum, desc } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";

export const dashboardRouter = router({
  getKpis: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      const { branch_id } = input;
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      // ── Helper: build branch filter conditions ────────────────────────
      const txnBranchFilter = branch_id
        ? eq(transactions.branch_id, branch_id)
        : undefined;
      const orderBranchFilter = branch_id
        ? eq(orders.branch_id, branch_id)
        : undefined;
      const customerBranchFilter = branch_id
        ? eq(customers.branch_id, branch_id)
        : undefined;

      // ── Today Sales ──────────────────────────────────────────────────
      const [todaySalesRow] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, "in"),
            eq(transactions.category, "sale"),
            gte(transactions.created_at, todayStart),
            lte(transactions.created_at, todayEnd),
            txnBranchFilter
          )
        );

      // ── Total Sales ──────────────────────────────────────────────────
      const [totalSalesRow] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, "in"),
            eq(transactions.category, "sale"),
            txnBranchFilter
          )
        );

      // ── Today Expenses ───────────────────────────────────────────────
      const [todayExpensesRow] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, "out"),
            eq(transactions.category, "expense"),
            gte(transactions.created_at, todayStart),
            lte(transactions.created_at, todayEnd),
            txnBranchFilter
          )
        );

      // ── Total Expenses ───────────────────────────────────────────────
      const [totalExpensesRow] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, "out"),
            eq(transactions.category, "expense"),
            txnBranchFilter
          )
        );

      // ── Today Bills (completed orders today) ─────────────────────────
      const [todayBillsRow] = await db
        .select({ total: count() })
        .from(orders)
        .where(
          and(
            eq(orders.status, "completed"),
            gte(orders.created_at, todayStart),
            lte(orders.created_at, todayEnd),
            orderBranchFilter
          )
        );

      // ── Total Bills (all completed orders) ───────────────────────────
      const [totalBillsRow] = await db
        .select({ total: count() })
        .from(orders)
        .where(and(eq(orders.status, "completed"), orderBranchFilter));

      // ── Total Customers ──────────────────────────────────────────────
      const [totalCustomersRow] = await db
        .select({ total: count() })
        .from(customers)
        .where(customerBranchFilter ? and(customerBranchFilter) : undefined);

      // ── Total Products ───────────────────────────────────────────────
      const [totalProductsRow] = await db
        .select({ total: count() })
        .from(products);

      // ── Parse numeric values ─────────────────────────────────────────
      const todaySales = parseFloat(todaySalesRow?.total ?? "0");
      const totalSales = parseFloat(totalSalesRow?.total ?? "0");
      const todayExpenses = parseFloat(todayExpensesRow?.total ?? "0");
      const totalExpenses = parseFloat(totalExpensesRow?.total ?? "0");
      const todayBills = todayBillsRow?.total ?? 0;
      const totalBills = totalBillsRow?.total ?? 0;
      const totalCustomers = totalCustomersRow?.total ?? 0;
      const totalProducts = totalProductsRow?.total ?? 0;

      return {
        todaySales,
        totalSales,
        todayExpenses,
        totalExpenses,
        todayProfit: todaySales - todayExpenses,
        totalProfit: totalSales - totalExpenses,
        todayBills,
        totalBills,
        totalCustomers,
        cashBalance: totalSales - totalExpenses,
        totalProducts,
      };
    }),

  listBranches: protectedProcedure.query(async () => {
    const allBranches = await db.select().from(branches);
    return allBranches;
  }),
});
