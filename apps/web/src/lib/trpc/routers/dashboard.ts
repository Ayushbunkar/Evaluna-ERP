import {
	branches,
	branchInventory,
	customers,
	orders,
	products,
	staff,
	transactions,
} from "@evaluna/db/schema";
import { endOfDay, format, startOfDay, subDays, subMonths } from "date-fns";
import { and, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
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

			// ── Execute KPI queries in parallel ─────────────────────────
			const [
				[todaySalesRow],
				[totalSalesRow],
				[todayExpensesRow],
				[totalExpensesRow],
				[todayBillsRow],
				[totalBillsRow],
				[totalCustomersRow],
				[totalProductsRow],
				[pendingOrdersRow],
				[activeStaffRow],
				[lowStockRow],
				[inventoryValueRow],
			] = await Promise.all([
				db
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
					),
				db
					.select({ total: sum(transactions.amount) })
					.from(transactions)
					.where(
						and(
							eq(transactions.type, "in"),
							eq(transactions.category, "sale"),
							txnBranchFilter,
						),
					),
				db
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
					),
				db
					.select({ total: sum(transactions.amount) })
					.from(transactions)
					.where(
						and(
							eq(transactions.type, "out"),
							eq(transactions.category, "expense"),
							txnBranchFilter,
						),
					),
				db
					.select({ total: count() })
					.from(orders)
					.where(
						and(
							eq(orders.status, "completed"),
							gte(orders.created_at, todayStart),
							lte(orders.created_at, todayEnd),
							orderBranchFilter,
						),
					),
				db
					.select({ total: count() })
					.from(orders)
					.where(and(eq(orders.status, "completed"), orderBranchFilter)),
				db
					.select({ total: count() })
					.from(customers)
					.where(customerBranchFilter ? and(customerBranchFilter) : undefined),
				db.select({ total: count() }).from(products),
				db
					.select({ total: count() })
					.from(orders)
					.where(and(eq(orders.status, "pending"), orderBranchFilter)),
				db
					.select({ total: count() })
					.from(staff)
					.where(
						and(
							eq(staff.status, "active"),
							branch_id ? eq(staff.branch_id, branch_id) : undefined,
						),
					),
				db
					.select({ total: count() })
					.from(branchInventory)
					.where(
						and(
							lte(branchInventory.in_stock, branchInventory.reorder_level),
							branch_id ? eq(branchInventory.branch_id, branch_id) : undefined,
						),
					),
				// Real inventory value
				db
					.select({
						total: sql<string>`COALESCE(SUM(${branchInventory.in_stock} * ${products.price}), 0)`,
					})
					.from(branchInventory)
					.leftJoin(products, eq(branchInventory.product_id, products.id))
					.where(branch_id ? eq(branchInventory.branch_id, branch_id) : undefined),
			]);

			const todaySales = Number.parseFloat(todaySalesRow?.total ?? "0");
			const totalSales = Number.parseFloat(totalSalesRow?.total ?? "0");
			const todayExpenses = Number.parseFloat(todayExpensesRow?.total ?? "0");
			const totalExpenses = Number.parseFloat(totalExpensesRow?.total ?? "0");
			const todayBills = todayBillsRow?.total ?? 0;
			const totalBills = totalBillsRow?.total ?? 0;
			const totalCustomers = totalCustomersRow?.total ?? 0;
			const totalProducts = totalProductsRow?.total ?? 0;
			const inventoryValue = Number.parseFloat(inventoryValueRow?.total ?? "0");

			// ── Revenue Trend: last 6 months ─────────────────────────────────
			const sixMonthsAgo = subMonths(now, 6);
			const revenueTrendRaw = await db
				.select({
					month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.created_at}), 'Mon YYYY')`,
					revenue: sql<string>`COALESCE(SUM(${orders.total_amount}), 0)`,
				})
				.from(orders)
				.where(
					and(
						gte(orders.created_at, sixMonthsAgo),
						orderBranchFilter,
					),
				)
				.groupBy(sql`DATE_TRUNC('month', ${orders.created_at})`)
				.orderBy(sql`DATE_TRUNC('month', ${orders.created_at})`);

			const revenueTrend = revenueTrendRaw.map((r) => ({
				month: r.month,
				revenue: Number(r.revenue),
				expenses: 0,
			}));

			// ── Branch Performance: sales per branch ──────────────────────────
			const branchPerfRaw = await db
				.select({
					name: branches.name,
					sales: sql<string>`COALESCE(SUM(${orders.total_amount}), 0)`,
					orders: sql<string>`COUNT(${orders.id})`,
				})
				.from(orders)
				.leftJoin(branches, eq(orders.branch_id, branches.id))
				.groupBy(branches.id, branches.name)
				.orderBy(sql`SUM(${orders.total_amount}) DESC`)
				.limit(6);

			const branchPerformance = branchPerfRaw.map((b) => ({
				name: b.name ?? "Unknown",
				sales: Number(b.sales),
				orders: Number(b.orders),
			}));

			// ── Cash Flow Trend: last 7 days ─────────────────────────────────
			const sevenDaysAgo = subDays(now, 7);
			const cashFlowRaw = await db
				.select({
					date: sql<string>`TO_CHAR(DATE(${transactions.created_at}), 'DD Mon')`,
					inflow: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'in' THEN ${transactions.amount} ELSE 0 END), 0)`,
					outflow: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'out' THEN ${transactions.amount} ELSE 0 END), 0)`,
				})
				.from(transactions)
				.where(
					and(
						gte(transactions.created_at, sevenDaysAgo),
						txnBranchFilter,
					),
				)
				.groupBy(sql`DATE(${transactions.created_at})`)
				.orderBy(sql`DATE(${transactions.created_at})`);

			const cashFlowTrend = cashFlowRaw.map((c) => ({
				date: c.date,
				amount: Number(c.inflow) - Number(c.outflow),
				inflow: Number(c.inflow),
				outflow: Number(c.outflow),
			}));

			// ── Recent Notifications from recent orders/activities ────────────
			const recentOrdersRaw = await db
				.select({
					id: orders.id,
					amount: orders.total_amount,
					status: orders.status,
					created_at: orders.created_at,
				})
				.from(orders)
				.where(orderBranchFilter ? and(orderBranchFilter) : undefined)
				.orderBy(desc(orders.created_at))
				.limit(5);

			const recentNotifications = recentOrdersRaw.map((o) => ({
				id: o.id,
				type: o.status === "pending" ? "approval" : "sale",
				title:
					o.status === "pending"
						? `Pending Order #${o.id}`
						: `Sale Completed #${o.id}`,
				message: `Amount: ₹${Number(o.amount).toFixed(2)}`,
				time: format(new Date(o.created_at), "MMM d, h:mm a"),
			}));

			// ── Low stock alerts for notifications ────────────────────────────
			const lowStockAlerts = await db
				.select({
					id: branchInventory.id,
					productName: products.name,
					inStock: branchInventory.in_stock,
					reorderLevel: branchInventory.reorder_level,
				})
				.from(branchInventory)
				.leftJoin(products, eq(branchInventory.product_id, products.id))
				.where(
					and(
						lte(branchInventory.in_stock, branchInventory.reorder_level),
						branch_id ? eq(branchInventory.branch_id, branch_id) : undefined,
					),
				)
				.limit(3);

			const alertNotifications = lowStockAlerts.map((a) => ({
				id: `low-${a.id}`,
				type: "low_stock",
				title: `Low Stock: ${a.productName ?? "Unknown"}`,
				message: `Only ${a.inStock} units left (reorder at ${a.reorderLevel})`,
				time: format(now, "h:mm a"),
			}));

			const allNotifications = [...alertNotifications, ...recentNotifications].slice(0, 8);

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
				inventoryValue,

				salesTrend: revenueTrend,
				revenueTrend,
				expenseTrend: [],
				cashFlowTrend,
				branchPerformance,

				recentNotifications: allNotifications,

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
