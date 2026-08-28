import { employees, payroll, payrollVariance } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	inArray,
	isNull,
	lt,
	lte,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const payrollVarianceRouter = router({
	// Payroll Variance Detection
	getPayrollVariances: roleProcedure([
		"admin",
		"hr",
		"finance",
		"manager",
		"auditor",
	])
		.input(
			z.object({
				payrollId: z.number().optional(),
				varianceType: z.string().optional(),
				severity: z.enum(["low", "medium", "high", "critical"]).optional(),
				isResolved: z.boolean().optional(),
				detectedFrom: z.string().optional(),
				detectedTo: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db
				.select({
					id: payrollVariance.id,
					payrollId: payrollVariance.payrollId,
					payrollMonth: payroll.month,
					payrollYear: payroll.year,
					varianceType: payrollVariance.varianceType,
					severity: payrollVariance.severity,
					description: payrollVariance.description,
					expectedValue: payrollVariance.expectedValue,
					actualValue: payrollVariance.actualValue,
					varianceAmount: payrollVariance.varianceAmount,
					variancePercentage: payrollVariance.variancePercentage,
					isResolved: payrollVariance.isResolved,
					resolvedByName: employeesResolved.name,
					resolvedAt: payrollVariance.resolvedAt,
					resolutionNotes: payrollVariance.resolutionNotes,
					detectedAt: payrollVariance.detectedAt,
					createdAt: payrollVariance.createdAt,
				})
				.from(payrollVariance)
				.leftJoin(payroll, eq(payrollVariance.payrollId, payroll.id))
				.leftJoin(
					employees as employeesResolved,
					eq(payrollVariance.resolvedBy, employeesResolved.id),
				);

			if (input.payrollId) {
				query = query.where(eq(payrollVariance.payrollId, input.payrollId));
			}
			if (input.varianceType) {
				query = query.where(
					eq(payrollVariance.varianceType, input.varianceType),
				);
			}
			if (input.severity) {
				query = query.where(eq(payrollVariance.severity, input.severity));
			}
			if (input.isResolved !== undefined) {
				query = query.where(eq(payrollVariance.isResolved, input.isResolved));
			}
			if (input.detectedFrom) {
				query = query.where(
					gte(payrollVariance.detectedAt, input.detectedFrom),
				);
			}
			if (input.detectedTo) {
				query = query.where(lte(payrollVariance.detectedAt, input.detectedTo));
			}

			const results = await query.orderBy(desc(payrollVariance.detectedAt));
			return results;
		}),

	createPayrollVariance: roleProcedure(["admin", "hr", "finance"])
		.input(
			z.object({
				payrollId: z.number(),
				varianceType: z.string().max(50),
				severity: z
					.enum(["low", "medium", "high", "critical"])
					.default("medium"),
				description: z.string().max(500),
				expectedValue: z.number().optional(),
				actualValue: z.number().optional(),
				varianceAmount: z.number().optional(),
				variancePercentage: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// Validate payroll exists
			const [payrollRecord] = await db
				.select()
				.from(payroll)
				.where(eq(payroll.id, input.payrollId))
				.limit(1);

			if (!payrollRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll record not found",
				});
			}

			// Calculate missing values if not provided
			let expectedValue = input.expectedValue;
			let actualValue = input.actualValue;
			let varianceAmount = input.varianceAmount;
			let variancePercentage = input.variancePercentage;

			if (
				expectedValue === undefined &&
				actualValue !== undefined &&
				varianceAmount !== undefined
			) {
				expectedValue = actualValue + varianceAmount;
			} else if (
				actualValue === undefined &&
				expectedValue !== undefined &&
				varianceAmount !== undefined
			) {
				actualValue = expectedValue - varianceAmount;
			} else if (
				varianceAmount === undefined &&
				expectedValue !== undefined &&
				actualValue !== undefined
			) {
				varianceAmount = actualValue - expectedValue;
			}

			if (
				varianceAmount !== undefined &&
				expectedValue !== undefined &&
				expectedValue !== 0
			) {
				variancePercentage = (varianceAmount / expectedValue) * 100;
			}

			const [result] = await db
				.insert(payrollVariance)
				.values({
					payrollId: input.payrollId,
					varianceType: input.varianceType,
					severity: input.severity,
					description: input.description,
					expectedValue: expectedValue,
					actualValue: actualValue,
					varianceAmount: varianceAmount,
					variancePercentage: variancePercentage,
					isResolved: false,
				})
				.returning();

			return result;
		}),

	resolvePayrollVariance: roleProcedure(["admin", "hr", "finance", "auditor"])
		.input(
			z.object({
				id: z.number(),
				resolvedBy: z.number().optional(),
				resolutionNotes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			const [variance] = await db
				.select()
				.from(payrollVariance)
				.where(eq(payrollVariance.id, input.id))
				.limit(1);

			if (!variance) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll variance not found",
				});
			}

			if (variance.isResolved) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Payroll variance is already resolved",
				});
			}

			// Get resolver from context (assuming ctx.user.id maps to employee)
			const [resolver] = await db
				.select({ id: employees.id })
				.from(employees)
				.where(eq(employees.userUid, ctx.user.id))
				.limit(1);

			const resolverId = input.resolvedBy ?? (resolver ? resolver.id : null);

			if (!resolverId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Resolver not found",
				});
			}

			const [result] = await db
				.update(payrollVariance)
				.set({
					isResolved: true,
					resolvedBy: resolverId,
					resolvedAt: new Date(),
					resolutionNotes: input.resolutionNotes,
					updatedAt: new Date(),
				})
				.where(eq(payrollVariance.id, input.id))
				.returning();

			return result;
		}),

	// Variance Analysis and Reporting
	getVarianceSummary: roleProcedure(["admin", "hr", "finance"])
		.input(
			z.object({
				month: z.string().optional(),
				year: z.string().optional(),
				branchId: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			// This would typically involve more complex aggregations
			// For now, we'll return basic counts by severity and type
			let query = db
				.select({
					varianceType: payrollVariance.varianceType,
					severity: payrollVariance.severity,
					count: sql`count(*)`,
					totalVarianceAmount: sql`sum(${payrollVariance.varianceAmount})`,
				})
				.from(payrollVariance)
				.leftJoin(payroll, eq(payrollVariance.payrollId, payroll.id))
				.groupBy(payrollVariance.varianceType, payrollVariance.severity);

			if (input.month) {
				query = query.where(eq(payroll.month, input.month));
			}
			if (input.year) {
				query = query.where(eq(payroll.year, input.year));
			}
			if (input.branchId) {
				query = query.where(eq(payroll.branch_id, input.branchId));
			}

			const results = await query;
			return results;
		}),
});
