import { z } from "zod";
import { router } from "../init";
import { superadminProcedure } from "@evaluna/api";
import { db } from "@/lib/db";
import { 
  companies, 
  plans, 
  subscriptions, 
  user,
  billingInvoices,
  branches,
} from "@evaluna/db/schema";
import { count, eq, sql, desc, sum } from "drizzle-orm";

export const superadminRouter = router({
  getDashboardStats: superadminProcedure.query(async () => {
    const [
      totalCompaniesResult,
      totalUsersResult,
      totalBranchesResult,
      revenueResult
    ] = await Promise.all([
      db.select({ count: count() }).from(companies),
      db.select({ count: count() }).from(user),
      db.select({ count: count() }).from(branches),
      db.select({ total: sum(billingInvoices.amount) }).from(billingInvoices).where(eq(billingInvoices.status, "paid"))
    ]);

    return {
      totalCompanies: totalCompaniesResult[0].count,
      activeCompanies: totalCompaniesResult[0].count, // mock logic
      totalUsers: totalUsersResult[0].count,
      totalBranches: totalBranchesResult[0].count,
      revenue: parseFloat(revenueResult[0].total || "0"),
      monthlyGrowth: "+15%", // mock
    };
  }),

  getCompanies: superadminProcedure.query(async () => {
    return db.select().from(companies).orderBy(desc(companies.created_at));
  }),

  createCompany: superadminProcedure
    .input(z.object({ name: z.string(), address: z.string().optional() }))
    .mutation(async ({ input }) => {
      const result = await db.insert(companies).values({
        name: input.name,
        address: input.address,
      }).returning();
      return result[0];
    }),

  getPlans: superadminProcedure.query(async () => {
    return db.select().from(plans).orderBy(plans.price);
  }),

  getSystemHealth: superadminProcedure.query(async () => {
    // Return mock data for frontend Bento layout until a real monitoring agent is connected
    return {
      cpuUsage: 45,
      memoryUsage: 62,
      databaseLatency: "24ms",
      storageUsed: "124 GB",
      serverStatus: "Online",
      uptime: "99.99%",
    };
  }),
});
