import {
	branches,
	companies,
	customers,
	enhancedAttendance,
	payroll,
	staff,
	suppliers,
	transactions,
	user,
	bankAccounts,
	expenses,
} from "@evaluna/db/schema";
import { and, count, desc, eq, gte, ilike, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const adminRouter = router({
	getDashboardStats: roleProcedure(["admin", "super_admin"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId; // Use authenticated user's branch for scoping
			const isSuperadmin = ctx.user.isSuperadmin;

			const [
				totalCompanies,
				activeCompanies,
				totalUsers,
				totalEmployees,
				presentToday,
				onLeaveCount,
				payrollPendingCount,
				newHiresThisMonth,
				totalSuppliers,
				totalCustomers,
				totalBranches,
				monthlyRevenue,
				monthlyExpenses,
				recentActivities,
			] = await Promise.all([
				// Total companies
				db.select({ count: count() }).from(companies),

				// Active companies
				db
					.select({ count: count() })
					.from(companies)
					.where(eq(companies.status, "active")),

				// Total users
				db.select({ count: count() }).from(user),

				// Total employees
				db
					.select({ count: count() })
					.from(staff)
					.where(eq(staff.is_deleted, false)),

				// Present today
				db
					.select({ count: count() })
					.from(enhancedAttendance)
					.innerJoin(staff, eq(enhancedAttendance.employeeId, staff.id))
					.where(
						and(
							eq(enhancedAttendance.date, sql`CURRENT_DATE`),
							eq(enhancedAttendance.status, "present"),
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined,
						),
					),

				// On leave today
				db
					.select({ count: count() })
					.from(enhancedAttendance)
					.innerJoin(staff, eq(enhancedAttendance.employeeId, staff.id))
					.where(
						and(
							eq(enhancedAttendance.date, sql`CURRENT_DATE`),
							eq(enhancedAttendance.status, "leave"),
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined,
						),
					),

				// Payroll pending (this month)
				db
					.select({ count: count() })
					.from(payroll)
					.where(
						and(
							eq(payroll.month, sql`TO_CHAR(CURRENT_DATE, 'YYYY-MM')`),
							ne(payroll.status, "paid"),
							branchId ? eq(payroll.branch_id, branchId) : undefined,
						),
					),

				// New hires this month
				db
					.select({ count: count() })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							sql`${staff.join_date} >= DATE_TRUNC('month', CURRENT_DATE)`,
							sql`${staff.join_date} < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
							branchId ? eq(staff.branch_id, branchId) : undefined,
						),
					),

				// Total suppliers (suppliers table has no is_deleted column)
				db.select({ count: count() }).from(suppliers),

				// Total customers
				db
					.select({ count: count() })
					.from(customers)
					.where(eq(customers.is_deleted, false)),

				// Total branches
				db.select({ count: count() }).from(branches),

				// Monthly revenue (current month)
				db
					.select({
						total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.type, "in"),
							gte(
								transactions.created_at,
								sql`DATE_TRUNC('month', CURRENT_DATE)`,
							),
							branchId ? eq(transactions.branch_id, branchId) : undefined,
						),
					),

				// Monthly expenses (current month)
				db
					.select({
						total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
					})
					.from(expenses)
					.where(
						and(
							gte(expenses.created_at, sql`DATE_TRUNC('month', CURRENT_DATE)`),
							branchId ? eq(expenses.branch_id, branchId) : undefined,
						),
					),

				// Recent activities (combined from various sources)
				db
					.select({
						id: sql<string>`'emp-' || ${staff.id}`,
						type: sql<string>`'employee'`,
						description: sql<string>`${staff.name} || ' joined the company'`,
						timestamp: staff.join_date,
					})
					.from(staff)
					.where(eq(staff.is_deleted, false))
					.orderBy(desc(staff.join_date))
					.limit(5),
			]);

			const totalEmp = totalEmployees[0]?.count || 0;
			const present = presentToday[0]?.count || 0;
			const onLeave = onLeaveCount[0]?.count || 0;
			const payrollPending = payrollPendingCount[0]?.count || 0;
			const newHires = newHiresThisMonth[0]?.count || 0;
			const totalSup = totalSuppliers[0]?.count || 0;
			const totalCust = totalCustomers[0]?.count || 0;
			const totalBranchesVal = totalBranches[0]?.count || 0;
			const monthlyRev = monthlyRevenue[0]?.total || 0;
			const monthlyExp = monthlyExpenses[0]?.total || 0;

			// Process recent activities
			const activities = recentActivities.map((activity) => ({
				id: activity.id,
				type: activity.type,
				description: activity.description,
				timestamp: activity.timestamp
					? new Date(activity.timestamp).toLocaleString()
					: "",
			}));

			return {
				totalCompanies: totalCompanies[0]?.count || 0,
				activeCompanies: activeCompanies[0]?.count || 0,
				totalUsers: totalUsers[0]?.count || 0,
				totalEmployees: totalEmp,
				presentToday: present,
				onLeave: onLeave,
				payrollPending: payrollPending,
				newHiresThisMonth: newHires,
				totalSuppliers: totalSup,
				totalCustomers: totalCust,
				totalBranches: totalBranchesVal,
				monthlyRevenue: Number(monthlyRev),
				monthlyExpenses: Number(monthlyExp),
				netProfit: Number(monthlyRev) - Number(monthlyExp),
				recentActivities: activities,
			};
		}),

	getEmployees: roleProcedure(["admin", "super_admin", "hr", "manager"])
		.input(
			z.object({
				branch_id: z.number().optional(),
				search: z.string().optional(),
				department: z.string().optional(),
				status: z.enum(["active", "inactive"]).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const conditions = [eq(staff.is_deleted, false)];

			// Branch scoping: explicit input wins, otherwise fall back to the
			// authenticated user's branch. Users without a branch (e.g. superadmin)
			// see all branches.
			if (input.branch_id) {
				conditions.push(eq(staff.branch_id, input.branch_id));
			} else if (
				ctx.user.branchId !== null &&
				ctx.user.branchId !== undefined
			) {
				conditions.push(eq(staff.branch_id, ctx.user.branchId));
			}

			if (input.search) {
				const searchTerm = `%${input.search}%`;
				const searchCondition = or(
					ilike(staff.name, searchTerm),
					ilike(staff.staff_code, searchTerm),
					ilike(staff.email, searchTerm),
				);
				if (searchCondition) conditions.push(searchCondition);
			}

			if (input.department) {
				conditions.push(eq(staff.department, input.department));
			}

			if (input.status) {
				conditions.push(eq(staff.status, input.status));
			}

			const results = await db
				.select()
				.from(staff)
				.where(and(...conditions))
				.orderBy(desc(staff.created_at))
				.limit(100);

			return results.map((r) => ({
				id: r.id,
				emp_code: r.staff_code || `EMP-${r.id}`,
				name: r.name,
				department: r.department || "General",
				role: r.role || "Staff",
				phone: r.phone || "N/A",
				email: r.email || "N/A",
				branch_id: r.branch_id,
				join_date: r.join_date ? new Date(r.join_date).toLocaleDateString() : "",
				salary: Number(r.salary) || 0,
				status: r.status || "active",
			}));
		}),

	getSuppliers: roleProcedure(["admin", "super_admin"])
		.input(
			z.object({
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			// suppliers has no is_deleted / status columns — do not filter on them.
			const conditions = [];
			if (input.search) {
				const searchTerm = `%${input.search}%`;
				const searchCondition = or(
					ilike(suppliers.name, searchTerm),
					ilike(suppliers.supplier_code, searchTerm),
					ilike(suppliers.email, searchTerm),
				);
				if (searchCondition) conditions.push(searchCondition);
			}

			const results = await db
				.select()
				.from(suppliers)
				.where(conditions.length ? and(...conditions) : undefined)
				.orderBy(desc(suppliers.created_at))
				.limit(50);

			return results.map((r) => ({
				id: r.id,
				supplier_code: r.supplier_code || `SUP-${r.id}`,
				name: r.name,
				email: r.email || "N/A",
				phone: r.phone || "N/A",
				address: r.address || "N/A",
				gst_number: r.gst_number || "N/A",
				pan_number: r.pan_number || "N/A",
				category: r.supplier_category || "local",
				outstanding_balance: Number(r.outstanding_balance) || 0,
			}));
		}),

	getCustomers: roleProcedure(["admin", "super_admin"])
		.input(
			z.object({
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const conditions = [eq(customers.is_deleted, false)];
			if (input.search) {
				const searchTerm = `%${input.search}%`;
				const searchCondition = or(
					ilike(customers.name, searchTerm),
					ilike(customers.customer_code, searchTerm),
					ilike(customers.email, searchTerm),
					ilike(customers.phone, searchTerm),
				);
				if (searchCondition) conditions.push(searchCondition);
			}

			const results = await db
				.select()
				.from(customers)
				.where(and(...conditions))
				.orderBy(desc(customers.created_at))
				.limit(50);

			return results.map((r) => ({
				id: r.id,
				customer_code: r.customer_code || `CUST-${r.id}`,
				name: r.name,
				email: r.email || "N/A",
				phone: r.phone || "N/A",
				address: r.address || "N/A",
				customer_type: r.customer_type || "retail",
				credit_limit: Number(r.credit_limit) || 0,
				credit_used: Number(r.credit_used) || 0,
				status: r.status || "active",
			}));
		}),

	getFinancialSummary: roleProcedure(["admin", "super_admin", "finance"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId;
			const isSuperadmin = ctx.user.isSuperadmin;

			const [
				totalRevenue,
				totalExpenses,
				totalReceivables,
				totalPayables,
				cashBalance,
				bankBalance,
			] = await Promise.all([
				// Total revenue (all time)
				db
					.select({
						total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.type, "in"),
							branchId ? eq(transactions.branch_id, branchId) : undefined,
						),
					),

				// Total expenses (all time)
				db
					.select({
						total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
					})
					.from(expenses)
					.where(and(branchId ? eq(expenses.branch_id, branchId) : undefined)),

				// Total receivables
				db
					.select({
						total: sql<number>`COALESCE(SUM(${customers.credit_used}), 0)`,
					})
					.from(customers),

				// Total payables
				db
					.select({
						total: sql<number>`COALESCE(SUM(${suppliers.outstanding_balance}), 0)`,
					})
					.from(suppliers),

				// Cash balance (from transactions)
				db
					.select({
						total: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'in' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`,
					})
					.from(transactions)
					.where(
						and(branchId ? eq(transactions.branch_id, branchId) : undefined),
					),

				// Bank balance (from bank accounts)
				db
					.select({
						total: sql<number>`COALESCE(SUM(${bankAccounts.current_balance}), 0)`,
					})
					.from(bankAccounts)
					.where(
						and(
							eq(bankAccounts.is_deleted, false),
							eq(bankAccounts.status, "active"),
							branchId ? eq(bankAccounts.branch_id, branchId) : undefined,
						),
					),
			]);

			return {
				totalRevenue: Number(totalRevenue[0]?.total || 0),
				totalExpenses: Number(totalExpenses[0]?.total || 0),
				netProfit:
					Number(totalRevenue[0]?.total || 0) -
					Number(totalExpenses[0]?.total || 0),
				totalReceivables: Number(totalReceivables[0]?.total || 0),
				totalPayables: Number(totalPayables[0]?.total || 0),
				cashBalance: Number(cashBalance[0]?.total || 0),
				bankBalance: Number(bankBalance[0]?.total || 0),
			};
		}),
	getCompanies: roleProcedure(["admin", "super_admin"]).query(
		async ({ ctx }) => {
			const db = ctx.db;
			const companyRows = await db
				.select({
					id: companies.id,
					name: companies.name,
					address: companies.address,
					contact: companies.contact,
					gst_number: companies.gst_number,
					pan: companies.pan,
					status: companies.status,
					financial_year_start: companies.financial_year_start,
					financial_year_end: companies.financial_year_end,
					created_at: companies.created_at,
				})
				.from(companies)
				.orderBy(desc(companies.created_at));

			return companyRows.map((c) => ({
				id: c.id,
				name: c.name,
				address: c.address || "N/A",
				contact: c.contact || "N/A",
				gstNumber: c.gst_number || "N/A",
				pan: c.pan || "N/A",
				status: c.status || "active",
				financialYearStart: c.financial_year_start
					? new Date(c.financial_year_start).toLocaleDateString()
					: "N/A",
				financialYearEnd: c.financial_year_end
					? new Date(c.financial_year_end).toLocaleDateString()
					: "N/A",
				createdAt: c.created_at
					? new Date(c.created_at).toLocaleString()
					: "",
			}));
		},
	),
	getActivityLog: roleProcedure(["admin", "super_admin"]).query(
		async ({ ctx }) => {
			const db = ctx.db;
			// We'll combine activities from various sources: staff, suppliers, customers, companies, etc.
			const [
				staffActivities,
				supplierActivities,
				customerActivities,
				companyActivities,
			] = await Promise.all([
				// Staff activities (joins, updates)
				db
					.select({
						id: sql<string>`'staff-' || ${staff.id}`,
						type: sql<string>`'staff'`,
						description: sql<string>`${staff.name} || CASE WHEN ${staff.status} = 'active' THEN ' joined the company' ELSE ' status updated' END`,
						timestamp: staff.updated_at,
						userId: staff.id,
					})
					.from(staff)
					.where(eq(staff.is_deleted, false))
					.orderBy(desc(staff.updated_at))
					.limit(20),

				// Supplier activities (suppliers has no status/updated_at columns)
				db
					.select({
						id: sql<string>`'supplier-' || ${suppliers.id}`,
						type: sql<string>`'supplier'`,
						description: sql<string>`${suppliers.name} || ' added as supplier'`,
						timestamp: suppliers.created_at,
						userId: suppliers.id,
					})
					.from(suppliers)
					.orderBy(desc(suppliers.created_at))
					.limit(20),

				// Customer activities
				db
					.select({
						id: sql<string>`'customer-' || ${customers.id}`,
						type: sql<string>`'customer'`,
						description: sql<string>`${customers.name} || CASE WHEN ${customers.status} = 'active' THEN ' registered' ELSE ' status updated' END`,
						timestamp: customers.updated_at,
						userId: customers.id,
					})
					.from(customers)
					.where(eq(customers.is_deleted, false))
					.orderBy(desc(customers.updated_at))
					.limit(20),

				// Company activities (companies has no updated_at column)
				db
					.select({
						id: sql<string>`'company-' || ${companies.id}`,
						type: sql<string>`'company'`,
						description: sql<string>`${companies.name} || ' added'`,
						timestamp: companies.created_at,
						userId: companies.id,
					})
					.from(companies)
					.orderBy(desc(companies.created_at))
					.limit(20),
			]);

			// Combine and sort by timestamp descending
			const allActivities = [
				...staffActivities,
				...supplierActivities,
				...customerActivities,
				...companyActivities,
			]
				.filter((a) => a.timestamp) // Filter out null timestamps
				.sort(
					(a, b) =>
						new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
				)
				.slice(0, 50); // Limit to 50 most recent

			return allActivities.map((activity) => ({
				id: activity.id,
				type: activity.type,
				description: activity.description,
				timestamp: activity.timestamp
					? new Date(activity.timestamp).toLocaleString()
					: "",
			}));
		},
	),
});
