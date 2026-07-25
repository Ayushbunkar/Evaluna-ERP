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
        todayOrders: todayBills,
        totalBills,
        totalCustomers,
        cashBalance: totalSales - totalExpenses,
        totalProducts,
        // Mock data for Company Admin Dashboard KPIs
        pendingDeliveries: 12,
        warehouseCapacity: 84, // percentage
        activeEmployees: 45,
        lowStockCount: 8,
        
        // Mock Widgets Data
        salesTrend: [
          { name: "Mon", value: 4000 },
          { name: "Tue", value: 3000 },
          { name: "Wed", value: 2000 },
          { name: "Thu", value: 2780 },
          { name: "Fri", value: 1890 },
          { name: "Sat", value: 2390 },
          { name: "Sun", value: 3490 },
        ],
        revenueTrend: [
          { month: "Jan", revenue: 4000 },
          { month: "Feb", revenue: 3000 },
          { month: "Mar", revenue: 5000 },
          { month: "Apr", revenue: 4780 },
          { month: "May", revenue: 5890 },
          { month: "Jun", revenue: 4390 },
        ],
        expenseTrend: [
          { month: "Jan", expense: 2400 },
          { month: "Feb", expense: 1398 },
          { month: "Mar", expense: 9800 },
          { month: "Apr", expense: 3908 },
          { month: "May", expense: 4800 },
          { month: "Jun", expense: 3800 },
        ],
        cashFlowTrend: [
          { date: "01", amount: 400 },
          { date: "02", amount: 300 },
          { date: "03", amount: 500 },
          { date: "04", amount: -200 },
          { date: "05", amount: 200 },
          { date: "06", amount: 600 },
          { date: "07", amount: 800 },
        ],
        branchPerformance: [
          { name: "Main Branch", sales: 12500, target: 15000 },
          { name: "North Store", sales: 8400, target: 10000 },
          { name: "South Mall", sales: 10200, target: 12000 },
        ],
        inventoryValue: 125400.50,
        
        // Mock Notifications (Reused for Realtime Alerts)
        recentNotifications: [
          { id: 1, type: "low_stock", title: "Low Stock Alert", message: "Paracetamol 500mg is below minimum threshold.", time: "10 mins ago" },
          { id: 2, type: "approval", title: "Pending Approval", message: "PO-2023-089 requires your approval.", time: "1 hour ago" },
          { id: 3, type: "sale", title: "Large Sale", message: "Invoice INV-0045 for $2,450 completed.", time: "2 hours ago" },
          { id: 4, type: "delivery", title: "Delivery Dispatched", message: "Order #4456 is on the way.", time: "5 hours ago" },
        ],
        
        // Mock data for Branch Manager Dashboard
        footfall: 342,
        ordersReady: 8,
        returnsCount: 3,
        todayTimeline: [
          { id: 1, time: "09:00 AM", title: "Store Opened", type: "system" },
          { id: 2, time: "10:30 AM", title: "Inventory Delivery Arrived", type: "delivery" },
          { id: 3, time: "12:15 PM", title: "Peak Hour Started", type: "alert" },
          { id: 4, time: "02:00 PM", title: "Cash Collection Handover", type: "finance" },
          { id: 5, time: "04:30 PM", title: "Staff Shift Change", type: "staff" },
        ],
        topSellingProducts: [
          { name: "Paracetamol 500mg", quantity: 145, revenue: 1450 },
          { name: "Amoxicillin 250mg", quantity: 98, revenue: 1960 },
          { name: "Vitamin C Supplements", quantity: 84, revenue: 1260 },
          { name: "Cough Syrup", quantity: 65, revenue: 845 },
        ],
        staffPerformance: [
          { name: "Alice Johnson", role: "Cashier", sales: 4500, rating: 4.8 },
          { name: "Bob Smith", role: "Sales Rep", sales: 3800, rating: 4.5 },
          { name: "Charlie Davis", role: "Pharmacist", sales: 5200, rating: 4.9 },
        ],
        cashCollection: {
          cash: 4500,
          card: 8200,
          upi: 5400,
          pending: 1200
        },
        managerTasks: [
          { id: 1, title: "Review EOD Report", status: "pending", priority: "high" },
          { id: 2, title: "Approve Staff Leaves", status: "completed", priority: "medium" },
          { id: 3, title: "Audit Schedule Setup", status: "pending", priority: "low" },
          { id: 4, title: "Supplier Payment", status: "pending", priority: "high" },
        ]
      };
    }),

  listBranches: protectedProcedure.query(async () => {
    const allBranches = await db.select().from(branches);
    return allBranches;
  }),
});
