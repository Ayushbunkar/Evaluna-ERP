import {
	billingInvoices,
	branches,
	companies,
	plans,
	user,
} from "@evaluna/db/schema";
import { count, desc, eq, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { router, superadminProcedure } from "../init";

export const superadminRouter = router({
	getDashboardStats: superadminProcedure.query(async () => {
		const [
			totalCompaniesResult,
			activeCompaniesResult,
			totalUsersResult,
			totalBranchesResult,
			revenueResult,
		] = await Promise.all([
			db.select({ count: count() }).from(companies),
			db
				.select({ count: count() })
				.from(companies)
				.where(eq(companies.status, "active")),
			db.select({ count: count() }).from(user),
			db.select({ count: count() }).from(branches),
			db
				.select({ total: sum(billingInvoices.amount) })
				.from(billingInvoices)
				.where(eq(billingInvoices.status, "paid")),
		]);

		return {
			totalCompanies: totalCompaniesResult[0].count,
			activeCompanies: activeCompaniesResult[0].count,
			totalUsers: totalUsersResult[0].count,
			totalBranches: totalBranchesResult[0].count,
			revenue: Number.parseFloat(revenueResult[0].total || "0"),
			monthlyGrowth: "0%",
		};
	}),

	getCompanies: superadminProcedure.query(async () => {
		return db.select().from(companies).orderBy(desc(companies.created_at));
	}),

	createCompany: superadminProcedure
		.input(z.object({ name: z.string(), address: z.string().optional() }))
		.mutation(async ({ input }) => {
			const result = await db
				.insert(companies)
				.values({
					name: input.name,
					address: input.address,
				})
				.returning();
			return result[0];
		}),

	getPlans: superadminProcedure.query(async () => {
		return db.select().from(plans).orderBy(plans.price);
	}),

	getBillingStats: superadminProcedure.query(async () => {
		const [activeTenantsRes, paidInvoicesRes] = await Promise.all([
			db.select({ count: count() }).from(companies).where(eq(companies.status, "active")),
			db
				.select({ total: sum(billingInvoices.amount) })
				.from(billingInvoices)
				.where(eq(billingInvoices.status, "paid")),
		]);

		const mrr = Number.parseFloat(paidInvoicesRes[0]?.total || "0");
		const acv = mrr * 12;

		return {
			mrr,
			acv,
			activeTenants: activeTenantsRes[0]?.count || 0,
		};
	}),

	getBillingInvoices: superadminProcedure.query(async () => {
		const rows = await db
			.select({
				id: billingInvoices.id,
				companyName: companies.name,
				amount: billingInvoices.amount,
				currency: billingInvoices.currency,
				status: billingInvoices.status,
				createdAt: billingInvoices.created_at,
			})
			.from(billingInvoices)
			.leftJoin(companies, eq(billingInvoices.company_id, companies.id))
			.orderBy(desc(billingInvoices.created_at))
			.limit(50);

		return rows.map((r) => ({
			id: `INV-${r.id}`,
			company: r.companyName || "Unknown Company",
			amount: `₹${Number.parseFloat(r.amount || "0").toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "Open",
			date: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "N/A",
		}));
	}),

	getSystemHealth: superadminProcedure.query(async () => {
		return {
			cpuUsage: 0,
			memoryUsage: 0,
			databaseLatency: "0ms",
			storageUsed: "0 GB",
			serverStatus: "Online",
			uptime: "0%",
		};
	}),
});
