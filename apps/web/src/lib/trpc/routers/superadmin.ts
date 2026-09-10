import {
	billingInvoices,
	branches,
	companies,
	plans,
	purchases,
	suppliers,
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
		const [suppliersCount, outstandingDues, totalProcured] = await Promise.all([
			db.select({ count: count() }).from(suppliers),
			db.select({ total: sum(suppliers.outstanding_balance) }).from(suppliers),
			db.select({ total: sum(purchases.total_amount) }).from(purchases),
		]);

		const mrr = Number.parseFloat(outstandingDues[0]?.total || "0");
		const acv = Number.parseFloat(totalProcured[0]?.total || "0");
		const activeTenants = suppliersCount[0]?.count || 0;

		return {
			mrr,
			acv,
			activeTenants,
		};
	}),

	getBillingInvoices: superadminProcedure.query(async () => {
		const rows = await db
			.select({
				id: purchases.id,
				grnNumber: purchases.grn_number,
				supplierName: suppliers.name,
				totalAmount: purchases.total_amount,
				paymentStatus: purchases.payment_status,
				createdAt: purchases.created_at,
			})
			.from(purchases)
			.leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
			.orderBy(desc(purchases.created_at))
			.limit(50);

		return rows.map((r) => ({
			id: r.grnNumber || `BILL-${r.id}`,
			company: r.supplierName || "Unknown Supplier",
			amount: `₹${Number.parseFloat(r.totalAmount || "0").toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			status: r.paymentStatus ? r.paymentStatus.toUpperCase() : "UNPAID",
			date: r.createdAt
				? new Date(r.createdAt).toISOString().split("T")[0]
				: "N/A",
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
