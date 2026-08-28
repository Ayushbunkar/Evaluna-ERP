import {
	employees,
	payroll,
	payrollEnhanced,
	salaryStructure,
	statutoryDeductionConfig,
} from "@evaluna/db/schema";
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

export const payrollEnhancedRouter = router({
	// Enhanced Payroll Details
	getPayrollEnhanced: roleProcedure(["admin", "hr", "finance", "manager"])
		.input(
			z.object({
				payrollId: z.number(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const [enhanced] = await db
				.select({
					id: payrollEnhanced.id,
					payrollId: payrollEnhanced.payrollId,
					payrollMonth: payroll.month,
					payrollYear: payroll.year,
					employeeId: payroll.employee_id,
					employeeName: employees.name,
					employeeCode: employees.employee_code,
					earnings: payrollEnhanced.earnings,
					deductionsDetail: payrollEnhanced.deductionsDetail,
					reimbursements: payrollEnhanced.reimbursements,
					loansAndAdvances: payrollEnhanced.loansAndAdvances,
					netPayable: payrollEnhanced.netPayable,
					calculationNotes: payrollEnhanced.calculationNotes,
					createdAt: payrollEnhanced.createdAt,
					updatedAt: payrollEnhanced.updatedAt,
				})
				.from(payrollEnhanced)
				.innerJoin(payroll, eq(payrollEnhanced.payrollId, payroll.id))
				.innerJoin(employees, eq(payroll.employee_id, employees.id))
				.where(eq(payrollEnhanced.payrollId, input.payrollId))
				.limit(1);

			if (!enhanced) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Enhanced payroll record not found",
				});
			}

			return enhanced;
		}),

	// This would typically be called internally during payroll calculation
	createPayrollEnhanced: roleProcedure(["admin", "hr"])
		.input(
			z.object({
				payrollId: z.number(),
				earnings: z.record(
					z.object({
						amount: z.string(),
						isTaxable: z.boolean(),
					}),
				),
				deductionsDetail: z.record(
					z.object({
						amount: z.string(),
						isPreTax: z.boolean(),
						statutoryType: z.string().optional().nullable(),
					}),
				),
				reimbursements: z.record(z.string()),
				loansAndAdvances: z.record(
					z.object({
						amount: z.string(),
						loanId: z.number().optional().nullable(),
					}),
				),
				netPayable: z.number(),
				calculationNotes: z.string().optional(),
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

			// Check if enhanced record already exists
			const [existing] = await db
				.select()
				.from(payrollEnhanced)
				.where(eq(payrollEnhanced.payrollId, input.payrollId))
				.limit(1);

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Enhanced payroll record already exists for this payroll",
				});
			}

			const [result] = await db
				.insert(payrollEnhanced)
				.values({
					payrollId: input.payrollId,
					earnings: input.earnings,
					deductionsDetail: input.deductionsDetail,
					reimbursements: input.reimbursements,
					loansAndAdvances: input.loansAndAdvances,
					netPayable: input.netPayable,
					calculationNotes: input.calculationNotes,
				})
				.returning();

			return result;
		}),

	updatePayrollEnhanced: roleProcedure(["admin", "hr"])
		.input(
			z.object({
				payrollId: z.number(),
				earnings: z
					.record(
						z.object({
							amount: z.string(),
							isTaxable: z.boolean(),
						}),
					)
					.optional(),
				deductionsDetail: z
					.record(
						z.object({
							amount: z.string(),
							isPreTax: z.boolean(),
							statutoryType: z.string().optional().nullable(),
						}),
					)
					.optional(),
				reimbursements: z.record(z.string()).optional(),
				loansAndAdvances: z
					.record(
						z.object({
							amount: z.string(),
							loanId: z.number().optional().nullable(),
						}),
					)
					.optional(),
				netPayable: z.number().optional(),
				calculationNotes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			const [existing] = await db
				.select()
				.from(payrollEnhanced)
				.where(eq(payrollEnhanced.payrollId, input.payrollId))
				.limit(1);

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Enhanced payroll record not found",
				});
			}

			const [result] = await db
				.update(payrollEnhanced)
				.set({
					earnings: input.earnings,
					deductionsDetail: input.deductionsDetail,
					reimbursements: input.reimbursements,
					loansAndAdvances: input.loansAndAdvances,
					netPayable: input.netPayable,
					calculationNotes: input.calculationNotes,
					updatedAt: new Date(),
				})
				.where(eq(payrollEnhanced.payrollId, input.payrollId))
				.returning();

			return result;
		}),

	// Get payslip data for employee (combines payroll and enhanced data)
	getEmployeePayslipData: roleProcedure(["employee"])
		.input(
			z.object({
				payrollId: z.number(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			// Get employee record for current user
			const [employee] = await db
				.select({ id: employees.id })
				.from(employees)
				.where(eq(employees.userUid, ctx.user.id))
				.limit(1);

			if (!employee) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Employee record not found",
				});
			}

			const [payslipData] = await db
				.select({
					payrollId: payroll.id,
					month: payroll.month,
					year: payroll.year,
					baseSalary: payroll.base_salary,
					overtimePay: payroll.overtime_pay,
					bonus: payroll.bonus,
					deductions: payroll.deductions,
					advanceDeduction: payroll.advance_deduction,
					netPayable: payroll.net_payable,
					status: payroll.status,
					paymentDate: payroll.payment_date,
					enhancedEarnings: payrollEnhanced.earnings,
					enhancedDeductions: payrollEnhanced.deductionsDetail,
					reimbursements: payrollEnhanced.reimbursements,
					loansAndAdvances: payrollEnhanced.loansAndAdvances,
					calculationNotes: payrollEnhanced.calculationNotes,
				})
				.from(payroll)
				.leftJoin(payrollEnhanced, eq(payrollEnhanced.payrollId, payroll.id))
				.where(
					and(
						eq(payroll.id, input.payrollId),
						eq(payroll.employee_id, employee.id),
					),
				)
				.limit(1);

			if (!payslipData) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payslip data not found",
				});
			}

			return payslipData;
		}),

	// Get statutory deductions applicable to a payroll/branch
	getApplicableStatutoryDeductions: roleProcedure(["admin", "hr", "finance"])
		.input(
			z.object({
				branchId: z.number(),
				payrollDate: z.date(), // Date to check which statutory config is effective
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;

			const [config] = await db
				.select()
				.from(statutoryDeductionConfig)
				.where(
					and(
						eq(statutoryDeductionConfig.branchId, input.branchId),
						lte(statutoryDeductionConfig.effectiveFrom, input.payrollDate),
						// EffectiveTo is null means it's still effective
						or(
							isNull(statutoryDeductionConfig.effectiveTo),
							gte(statutoryDeductionConfig.effectiveTo, input.payrollDate),
						),
					),
				)
				.orderBy(desc(statutoryDeductionConfig.effectiveFrom))
				.limit(1);

			if (!config) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message:
						"No statutory deduction configuration found for branch and date",
				});
			}

			return config;
		}),
});
