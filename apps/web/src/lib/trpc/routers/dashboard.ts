import {
	branches,
	branchInventory,
	customers,
	orders,
	products,
	transactions,
} from "@evaluna/db/schema";
import { endOfDay, startOfDay } from "date-fns";
import { and, count, eq, gte, lte, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "../init";

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
						txnBranchFilter,
					),
				);

			// ── Total Sales ──────────────────────────────────────────────────
			const [totalSalesRow] = await db
				.select({ total: sum(transactions.amount) })
				.from(transactions)
				.where(
					and(
						eq(transactions.type, "in"),
						eq(transactions.category, "sale"),
						txnBranchFilter,
					),
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
						txnBranchFilter,
					),
				);

			// ── Total Expenses ───────────────────────────────────────────────
			const [totalExpensesRow] = await db
				.select({ total: sum(transactions.amount) })
				.from(transactions)
				.where(
					and(
						eq(transactions.type, "out"),
						eq(transactions.category, "expense"),
						txnBranchFilter,
					),
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
						orderBranchFilter,
					),
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

			// ── Additional KPI Queries ───────────────────────────────────────
			// pendingDeliveries (orders not completed or cancelled)
			const [pendingOrdersRow] = await db
				.select({ total: count() })
				.from(orders)
				.where(and(eq(orders.status, "pending"), orderBranchFilter));

			// activeEmployees (staff with status active)
			const [activeStaffRow] = await db
				.select({ total: count() })
				.from(staff)
				.where(
					and(
						eq(staff.status, "active"),
						branch_id ? eq(staff.branch_id, branch_id) : undefined,
					),
				);

			// lowStockCount
			const [lowStockRow] = await db
				.select({ total: count() })
				.from(branchInventory)
				.where(
					and(
						lte(branchInventory.in_stock, branchInventory.reorder_level),
						branch_id ? eq(branchInventory.branch_id, branch_id) : undefined,
					),
				);

			const todaySales = Number.parseFloat(todaySalesRow?.total ?? "0");
			const totalSales = Number.parseFloat(totalSalesRow?.total ?? "0");
			const todayExpenses = Number.parseFloat(todayExpensesRow?.total ?? "0");
			const totalExpenses = Number.parseFloat(totalExpensesRow?.total ?? "0");
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
				pendingDeliveries: pendingOrdersRow?.total ?? 0,
				warehouseCapacity: 0,
				activeEmployees: activeStaffRow?.total ?? 0,
				lowStockCount: lowStockRow?.total ?? 0,

				salesTrend: [],
				revenueTrend: [],
				expenseTrend: [],
				cashFlowTrend: [],
				branchPerformance: [],
				inventoryValue: 0,

				recentNotifications: [],

				footfall: 0,
				ordersReady: 0,
				returnsCount: 0,
				todayTimeline: [],
				topSellingProducts: [],
				staffPerformance: [],
				cashCollection: {
					cash: 0,
					card: 0,
					upi: 0,
					pending: 0,
				},
				managerTasks: [],
			};
		}),

	listBranches: protectedProcedure.query(async () => {
		const allBranches = await db.select().from(branches);
		return allBranches;
	}),
});
