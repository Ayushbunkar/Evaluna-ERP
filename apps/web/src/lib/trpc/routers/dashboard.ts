import {
	branches,
	branchInventory,
	customers,
	orderItems,
	orders,
	paymentMethods,
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
			const yesterdayStart = startOfDay(subDays(now, 1));
			const yesterdayEnd = endOfDay(subDays(now, 1));

			// ── Branch filter conditions ────────────────────────────────────
			const txnBranchFilter = branch_id ? eq(transactions.branch_id, branch_id) : undefined;
			const orderBranchFilter = branch_id ? eq(orders.branch_id, branch_id) : undefined;
			const customerBranchFilter = branch_id ? eq(customers.branch_id, branch_id) : undefined;

			// ── Parallel KPI queries ─────────────────────────────────────────
			const [
				[todaySalesRow],
				[yesterdaySalesRow],
				[totalSalesRow],
				[todayExpensesRow],
				[totalExpensesRow],
				[todayBillsRow],
				[yesterdayBillsRow],
				[totalBillsRow],
				[totalCustomersRow],
				[totalProductsRow],
				[pendingOrdersRow],
				[activeStaffRow],
				[lowStockRow],
				[inventoryValueRow],
				[returnsRow],
				[readyOrdersRow],
				[totalCapacityRow],
				[usedCapacityRow],
			] = await Promise.all([
				// Today sales
				db.select({ total: sum(transactions.amount) }).from(transactions).where(
					and(eq(transactions.type, "in"), eq(transactions.category, "sale"),
						gte(transactions.created_at, todayStart), lte(transactions.created_at, todayEnd), txnBranchFilter),
				),
				// Yesterday sales (for trend)
				db.select({ total: sum(transactions.amount) }).from(transactions).where(
					and(eq(transactions.type, "in"), eq(transactions.category, "sale"),
						gte(transactions.created_at, yesterdayStart), lte(transactions.created_at, yesterdayEnd), txnBranchFilter),
				),
				// Total sales all time
				db.select({ total: sum(transactions.amount) }).from(transactions).where(
					and(eq(transactions.type, "in"), eq(transactions.category, "sale"), txnBranchFilter),
				),
				// Today expenses
				db.select({ total: sum(transactions.amount) }).from(transactions).where(
					and(eq(transactions.type, "out"), eq(transactions.category, "expense"),
						gte(transactions.created_at, todayStart), lte(transactions.created_at, todayEnd), txnBranchFilter),
				),
				// Total expenses
				db.select({ total: sum(transactions.amount) }).from(transactions).where(
					and(eq(transactions.type, "out"), eq(transactions.category, "expense"), txnBranchFilter),
				),
				// Today bills (completed orders)
				db.select({ total: count() }).from(orders).where(
					and(eq(orders.status, "completed"),
						gte(orders.created_at, todayStart), lte(orders.created_at, todayEnd), orderBranchFilter),
				),
				// Yesterday bills (for trend)
				db.select({ total: count() }).from(orders).where(
					and(eq(orders.status, "completed"),
						gte(orders.created_at, yesterdayStart), lte(orders.created_at, yesterdayEnd), orderBranchFilter),
				),
				// Total completed orders
				db.select({ total: count() }).from(orders).where(
					and(eq(orders.status, "completed"), orderBranchFilter),
				),
				// Total customers
				db.select({ total: count() }).from(customers).where(
					customerBranchFilter ? and(customerBranchFilter) : undefined,
				),
				// Total products
				db.select({ total: count() }).from(products),
				// Pending deliveries
				db.select({ total: count() }).from(orders).where(
					and(eq(orders.status, "pending"), orderBranchFilter),
				),
				// Active staff
				db.select({ total: count() }).from(staff).where(
					and(eq(staff.status, "active"), branch_id ? eq(staff.branch_id, branch_id) : undefined),
				),
				// Low stock count
				db.select({ total: count() }).from(branchInventory).where(
					and(lte(branchInventory.in_stock, branchInventory.reorder_level),
						branch_id ? eq(branchInventory.branch_id, branch_id) : undefined),
				),
				// Inventory value
				db.select({
					total: sql<string>`COALESCE(SUM(${branchInventory.in_stock} * ${products.price}), 0)`,
				}).from(branchInventory).leftJoin(products, eq(branchInventory.product_id, products.id))
					.where(branch_id ? eq(branchInventory.branch_id, branch_id) : undefined),
				// Returns (purchase returns or cancelled orders)
				db.select({ total: count() }).from(orders).where(
					and(eq(orders.status, "cancelled"), orderBranchFilter),
				),
				// Orders ready (completed today that haven't been dispatched yet — proxy: "completed" orders today)
				db.select({ total: count() }).from(orders).where(
					and(eq(orders.status, "completed"),
						gte(orders.created_at, todayStart), lte(orders.created_at, todayEnd), orderBranchFilter),
				),
				// Warehouse total capacity (sum of reorder_level as proxy for max capacity)
				db.select({ total: sum(branchInventory.reorder_level) }).from(branchInventory).where(
					branch_id ? eq(branchInventory.branch_id, branch_id) : undefined,
				),
				// Warehouse used (sum of in_stock)
				db.select({ total: sum(branchInventory.in_stock) }).from(branchInventory).where(
					branch_id ? eq(branchInventory.branch_id, branch_id) : undefined,
				),
			]);

			const todaySales = Number.parseFloat(todaySalesRow?.total ?? "0");
			const yesterdaySales = Number.parseFloat(yesterdaySalesRow?.total ?? "0");
			const totalSales = Number.parseFloat(totalSalesRow?.total ?? "0");
			const todayExpenses = Number.parseFloat(todayExpensesRow?.total ?? "0");
			const totalExpenses = Number.parseFloat(totalExpensesRow?.total ?? "0");
			const todayBills = todayBillsRow?.total ?? 0;
			const yesterdayBills = yesterdayBillsRow?.total ?? 0;
			const totalBills = totalBillsRow?.total ?? 0;
			const totalCustomers = totalCustomersRow?.total ?? 0;
			const totalProducts = totalProductsRow?.total ?? 0;
			const inventoryValue = Number.parseFloat(inventoryValueRow?.total ?? "0");
			const returnsCount = returnsRow?.total ?? 0;
			const readyOrders = readyOrdersRow?.total ?? 0;

			// ── Warehouse capacity % ─────────────────────────────────────────
			const totalCap = Number(totalCapacityRow?.total ?? 0);
			const usedCap = Number(usedCapacityRow?.total ?? 0);
			const warehouseCapacity = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;

			// ── Sales trend vs yesterday ─────────────────────────────────────
			const salesTrendPct = yesterdaySales > 0
				? ((todaySales - yesterdaySales) / yesterdaySales) * 100
				: todaySales > 0 ? 100 : 0;
			const billsTrendPct = Number(yesterdayBills) > 0
				? ((Number(todayBills) - Number(yesterdayBills)) / Number(yesterdayBills)) * 100
				: Number(todayBills) > 0 ? 100 : 0;

			// ── Revenue Trend: last 6 months ─────────────────────────────────
			const sixMonthsAgo = subMonths(now, 6);
			const revenueTrendRaw = await db
				.select({
					month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.created_at}), 'Mon YYYY')`,
					revenue: sql<string>`COALESCE(SUM(${orders.total_amount}), 0)`,
				})
				.from(orders)
				.where(and(gte(orders.created_at, sixMonthsAgo), orderBranchFilter))
				.groupBy(sql`DATE_TRUNC('month', ${orders.created_at})`)
				.orderBy(sql`DATE_TRUNC('month', ${orders.created_at})`);

			const revenueTrend = revenueTrendRaw.map((r) => ({
				month: r.month,
				revenue: Number(r.revenue),
				expenses: 0,
			}));

			// ── Branch Performance ────────────────────────────────────────────
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
					date: sql<string>`TO_CHAR(CAST(${transactions.created_at} AS DATE), 'DD Mon')`,
					inflow: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'in' THEN ${transactions.amount} ELSE 0 END), 0)`,
					outflow: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'out' THEN ${transactions.amount} ELSE 0 END), 0)`,
				})
				.from(transactions)
				.where(and(gte(transactions.created_at, sevenDaysAgo), txnBranchFilter))
				.groupBy(sql`CAST(${transactions.created_at} AS DATE)`)
				.orderBy(sql`CAST(${transactions.created_at} AS DATE)`);

			const cashFlowTrend = cashFlowRaw.map((c) => ({
				date: c.date,
				amount: Number(c.inflow) - Number(c.outflow),
				inflow: Number(c.inflow),
				outflow: Number(c.outflow),
			}));

			// ── Cash collection by payment method type ───────────────────────
			const cashCollectionRaw = await db
				.select({
					type: paymentMethods.payment_type,
					total: sum(transactions.amount),
				})
				.from(transactions)
				.leftJoin(paymentMethods, eq(transactions.payment_method_id, paymentMethods.id))
				.where(
					and(
						eq(transactions.type, "in"),
						gte(transactions.created_at, todayStart),
						lte(transactions.created_at, todayEnd),
						txnBranchFilter,
					),
				)
				.groupBy(paymentMethods.payment_type);

			const cashCollection = {
				cash: 0,
				card: 0,
				upi: 0,
				pending: Number(pendingOrdersRow?.total ?? 0),
			};
			for (const row of cashCollectionRaw) {
				const t = row.type ?? "cash";
				const v = Number(row.total ?? 0);
				if (t === "cash") cashCollection.cash += v;
				else if (t === "card") cashCollection.card += v;
				else if (t === "upi") cashCollection.upi += v;
			}

			// ── Top selling products today ────────────────────────────────────
			const topSellingRaw = await db
				.select({
					name: products.name,
					quantity: sql<string>`SUM(${orderItems.quantity})`,
					revenue: sql<string>`SUM(${orderItems.quantity} * ${orderItems.price})`,
				})
				.from(orderItems)
				.leftJoin(products, eq(orderItems.product_id, products.id))
				.leftJoin(orders, eq(orderItems.order_id, orders.id))
				.where(
					and(
						gte(orders.created_at, todayStart),
						lte(orders.created_at, todayEnd),
						orderBranchFilter,
					),
				)
				.groupBy(products.id, products.name)
				.orderBy(sql`SUM(${orderItems.quantity}) DESC`)
				.limit(5);

			const topSellingProducts = topSellingRaw.map((p) => ({
				name: p.name ?? "Unknown",
				quantity: Number(p.quantity),
				revenue: Number(p.revenue),
			}));

			// ── Staff performance: top staff by orders billed today ───────────
			const staffPerfRaw = await db
				.select({
					name: staff.name,
					role: staff.role,
				})
				.from(staff)
				.where(
					and(
						eq(staff.status, "active"),
						branch_id ? eq(staff.branch_id, branch_id) : undefined,
					),
				)
				.limit(5);

			const staffPerformance = staffPerfRaw.map((s) => ({
				name: s.name ?? "Staff",
				role: s.role ?? "—",
				sales: 0,
				bills: 0,
				rating: null,
			}));

			// ── Today's timeline from recent orders ───────────────────────────
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
				title: o.status === "pending" ? `Pending Order #${o.id}` : `Sale Completed #${o.id}`,
				message: `Amount: ₹${Number(o.amount).toFixed(2)}`,
				time: o.created_at ? format(new Date(o.created_at), "MMM d, h:mm a") : "N/A",
			}));

			// ── Low stock alerts ──────────────────────────────────────────────
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

			// ── Today's timeline from recent orders ───────────────────────────
			const timelineRaw = await db
				.select({
					id: orders.id,
					status: orders.status,
					amount: orders.total_amount,
					created_at: orders.created_at,
				})
				.from(orders)
				.where(
					and(
						gte(orders.created_at, todayStart),
						lte(orders.created_at, todayEnd),
						orderBranchFilter,
					),
				)
				.orderBy(desc(orders.created_at))
				.limit(10);

			const todayTimeline = timelineRaw.map((o) => ({
				id: o.id,
				title: `Order #${o.id} — ${o.status}`,
				amount: Number(o.amount),
				time: o.created_at ? format(new Date(o.created_at), "h:mm a") : "N/A",
			}));

			// ── Manager tasks: pending orders requiring approval ───────────────
			const managerTasksRaw = await db
				.select({
					id: orders.id,
					status: orders.status,
					amount: orders.total_amount,
					created_at: orders.created_at,
				})
				.from(orders)
				.where(
					and(
						eq(orders.status, "pending"),
						orderBranchFilter,
					),
				)
				.orderBy(desc(orders.created_at))
				.limit(10);

			const managerTasks = managerTasksRaw.map((o) => ({
				id: o.id,
				title: `Approve Order #${o.id} — ₹${Number(o.amount).toFixed(0)}`,
				status: "pending",
				priority: "high",
			}));

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
				warehouseCapacity,
				activeEmployees: activeStaffRow?.total ?? 0,
				lowStockCount: lowStockRow?.total ?? 0,
				inventoryValue,
				returnsCount,
				ordersReady: readyOrders,
				footfall: todayBills, // orders today as proxy for footfall

				// Calculated trends (real %)
				salesTrendPct: Math.round(salesTrendPct),
				salesTrendIsPositive: salesTrendPct >= 0,
				billsTrendPct: Math.round(billsTrendPct),
				billsTrendIsPositive: billsTrendPct >= 0,

				salesTrend: revenueTrend,
				revenueTrend,
				expenseTrend: [],
				cashFlowTrend,
				branchPerformance,

				recentNotifications: allNotifications,
				todayTimeline,
				topSellingProducts,
				staffPerformance,
				cashCollection,
				managerTasks,
			};
		}),

	listBranches: protectedProcedure.query(async () => {
		const allBranches = await db.select().from(branches);
		return allBranches;
	}),
});
