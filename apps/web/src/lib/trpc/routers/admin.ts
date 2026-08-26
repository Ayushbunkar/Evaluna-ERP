import {
  branches,
  companies,
  customer,
  customerGroups,
  employees,
  enhancedAttendance,
  leaveApplications,
  leaveTypes,
  orders,
  payroll,
  permissions,
  rolePermissions,
  roles,
  staff,
  suppliers,
  transactions,
  user,
} from "@evaluna/db/schema";
import { count, desc, eq, sum, sql, and, gte, lte, or } from "drizzle-orm";
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
              eq(enhancedAttendance.status, 'present'),
              eq(staff.is_deleted, false),
              branchId ? eq(staff.branch_id, branchId) : undefined
            )
          ),

        // On leave today
        db
          .select({ count: count() })
          .from(enhancedAttendance)
          .innerJoin(staff, eq(enhancedAttendance.employeeId, staff.id))
          .where(
            and(
              eq(enhancedAttendance.date, sql`CURRENT_DATE`),
              eq(enhancedAttendance.status, 'leave'),
              eq(staff.is_deleted, false),
              branchId ? eq(staff.branch_id, branchId) : undefined
            )
          ),

        // Payroll pending (this month)
        db
          .select({ count: count() })
          .from(payroll)
          .where(
            and(
              eq(payroll.month, sql`TO_CHAR(CURRENT_DATE, 'YYYY-MM')`),
              not(eq(payroll.status, 'paid')),
              branchId ? eq(payroll.branch_id, branchId) : undefined
            )
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
              branchId ? eq(staff.branch_id, branchId) : undefined
            )
          ),

        // Total suppliers
        db
          .select({ count: count() })
          .from(suppliers)
          .where(eq(suppliers.is_deleted, false)),

        // Total customers
        db
          .select({ count: count() })
          .from(customer)
          .where(eq(customer.is_deleted, false)),

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
              eq(transactions.type, 'in'),
              gte(transactions.created_at, sql`DATE_TRUNC('month', CURRENT_DATE)`),
              branchId ? eq(transactions.branch_id, branchId) : undefined
            )
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
              branchId ? eq(expenses.branch_id, branchId) : undefined
            )
          ),

        // Recent activities (combined from various sources)
        db
          .select({
            id: sql<string>`'emp-' || ${staff.id}`,
            type: sql<string>`'employee'`,
            description: sql<string>`${staff.name} joined the company`,
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
      totalBranchesVal = totalBranches[0]?.count || 0;
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
      let query = db
        .select()
        .from(staff)
        .where(eq(staff.is_deleted, false));

      if (input.branch_id) {
        query = query.where(eq(staff.branch_id, input.branch_id));
      } else {
        // Use the authenticated user's branch if no branch_id is provided
        query = query.where(eq(staff.branch_id, ctx.user.branchId));
      }

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        query = query.where(
          and(
            ilike(staff.name, searchTerm),
            ilike(staff.staff_code, searchTerm)
          )
        );
      }

      if (input.department) {
        query = query.where(eq(staff.department, input.department));
      }

      if (input.status) {
        query = query.where(eq(staff.status, input.status));
      }

      const results = await query.orderBy(desc(staff.created_at)).limit(100);

      return results.map((r) => ({
        id: r.id,
        emp_code: r.staff_code || `EMP-${r.id}`,
        name: r.name,
        department: r.department || "General",
        role: r.role || "Staff",
        phone: r.phone || "N/A",
        email: r.email || "N/A",
        join_date: r.join_date?.toLocaleDateString() || "",
        salary: Number(r.salary) || 0,
        status: r.status === "active" ? "Active" : "Inactive",
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
      let query = db
        .select()
        .from(suppliers)
        .where(eq(suppliers.is_deleted, false));

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        query = query.where(
          and(
            ilike(suppliers.name, searchTerm),
            ilike(suppliers.contact_person, searchTerm)
          )
        );
      }

      const results = await query.orderBy(desc(suppliers.created_at)).limit(50);

      return results.map((r) => ({
        id: r.id,
        supplier_code: r.supplier_code || `SUP-${r.id}`,
        name: r.name,
        contact_person: r.contact_person || "N/A",
        phone: r.phone || "N/A",
        email: r.email || "N/A",
        address: r.address || "N/A",
        city: r.city || "N/A",
        outstanding_balance: Number(r.outstanding_balance) || 0,
        status: r.status === "active" ? "Active" : "Inactive",
      }));
    }),

  getCustomers: roleProcedure(["admin", "super_admin"])
    .input(
      z.object({
        search: z.string().optional(),
        customer_group_id: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = ctx.db;
      let query = db
        .select()
        .from(customer)
        .where(eq(customer.is_deleted, false));

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        query = query.where(
          and(
            ilike(customer.name, searchTerm),
            ilike(customer.contact_person, searchTerm)
          )
        );
      }

      if (input.customer_group_id) {
        query = query.where(eq(customer.customer_group_id, input.customer_group_id));
      }

      const results = await query
        .orderBy(desc(customer.created_at))
        .limit(50);

      return results.map((r) => ({
        id: r.id,
        customer_code: r.customer_code || `CUST-${r.id}`,
        name: r.name,
        contact_person: r.contact_person || "N/A",
        phone: r.phone || "N/A",
        email: r.email || "N/A",
        address: r.address || "N/A",
        city: r.city || "N/A",
        credit_limit: Number(r.credit_limit) || 0,
        credit_used: Number(r.credit_used) || 0,
        status: r.status === "active" ? "Active" : "Inactive",
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
              eq(transactions.type, 'in'),
              branchId ? eq(transactions.branch_id, branchId) : undefined
            )
          ),

        // Total expenses (all time)
        db
          .select({
            total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
          })
          .from(expenses)
          .where(
            and(
              branchId ? eq(expenses.branch_id, branchId) : undefined
            )
          ),

        // Total receivables
        db
          .select({
            total: sql<number>`COALESCE(SUM(${customer.credit_used}), 0)`,
          })
          .from(customer),

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
            and(
              branchId ? eq(transactions.branch_id, branchId) : undefined
            )
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
              branchId ? eq(bankAccounts.branch_id, branchId) : undefined
            )
          ),
      ]);

      return {
        totalRevenue: Number(totalRevenue[0]?.total || 0),
        totalExpenses: Number(totalExpenses[0]?.total || 0),
        netProfit: Number(totalRevenue[0]?.total || 0) - Number(totalExpenses[0]?.total || 0),
        totalReceivables: Number(totalReceivables[0]?.total || 0),
        totalPayables: Number(totalPayables[0]?.total || 0),
        cashBalance: Number(cashBalance[0]?.total || 0),
        bankBalance: Number(bankBalance[0]?.total || 0),
      };
    }),
});