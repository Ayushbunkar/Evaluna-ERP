import {
  orders,
  transactions,
  staff,
} from "@evaluna/db/schema";
import { format, startOfToday, subHours } from "date-fns";
import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "../init";

export const billerRouter = router({
  dashboardOverview: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const { branch_id } = input;
      const today = startOfToday();

      // ── Branch filter conditions ────────────────────────────────────
      const txnBranchFilter = branch_id
        ? eq(transactions.branch_id, branch_id)
        : undefined;
      const orderBranchFilter = branch_id
        ? eq(orders.branch_id, branch_id)
        : undefined;

      // ── Parallel queries for dashboard overview ─────────────────────
      const [
        todaySalesRow,
        todayBillsRow,
        avgBillRow,
        activeCashiersRow,
        pendingBillsRow,
        recentTransactionsRaw,
      ] = await Promise.all([
        // Today sales total
        db
          .select({ total: sql<string>`COALESCE(SUM(${orders.total_amount}), 0)` })
          .from(orders)
          .where(
            and(
              gte(orders.created_at, today),
              orderBranchFilter,
            ),
          ),

        // Today bills count
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(orders)
          .where(
            and(
              gte(orders.created_at, today),
              orderBranchFilter,
            ),
          ),

        // Average bill value today
        db
          .select({
            avg: sql<string>`COALESCE(AVG(${orders.total_amount}), 0)`,
          })
          .from(orders)
          .where(
            and(
              gte(orders.created_at, today),
              orderBranchFilter,
            ),
          ),

        // Active cashiers (staff who processed transactions today)
        db
          .select({ count: sql<number>`COUNT(DISTINCT ${transactions.user_uid})` })
          .from(transactions)
          .where(
            and(
              gte(transactions.created_at, today),
              eq(transactions.type, "in"),
              eq(transactions.category, "sale"),
              txnBranchFilter,
            ),
          ),

        // Pending bills (orders awaiting confirmation)
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(orders)
          .where(
            and(
              inArray(orders.status, ["pending_review", "under_review"]),
              orderBranchFilter,
            ),
          ),

        // Recent transactions for activity feed
        db
          .select({
            id: orders.id,
            amount: orders.total_amount,
            status: orders.status,
            created_at: orders.created_at,
            cashierName: staff.name,
          })
          .from(orders)
          .leftJoin(staff, eq(orders.user_uid, staff.id))
          .where(
            and(
              gte(orders.created_at, today),
              orderBranchFilter,
            ),
          )
          .orderBy(desc(orders.created_at))
          .limit(10),
      ]);

      const totalSales = Number.parseFloat(todaySalesRow?.total ?? "0");
      const totalBills = todayBillsRow?.count ?? 0;
      const avgBillValue = Number.parseFloat(avgBillRow?.avg ?? "0");
      const activeCashiers = activeCashiersRow?.count ?? 0;
      const pendingBills = pendingBillsRow?.count ?? 0;

      // Format recent transactions for activity feed
      const recentActivities = recentTransactionsRaw.map((t) => ({
        id: t.id,
        title:
          t.status === "completed"
            ? `Sale Completed #${t.id}`
            : t.status === "pending_review"
              ? `Pending Review #${t.id}`
              : `Order #${t.id}`,
        description:
          t.status === "completed"
            ? `₹${Number.parseFloat(t.amount ?? "0").toFixed(2)}`
            : `Awaiting confirmation`,
        time: t.created_at
          ? format(new Date(t.created_at), "hh:mm a")
          : "N/A",
        cashier: t.cashierName || "Unknown",
      }));

      return {
        metrics: {
          totalSales,
          totalBills,
          avgBillValue,
          activeCashiers,
          pendingBills,
        },
        recentActivities,
      };
    }),
});