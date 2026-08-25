import { payslipTemplate, generatedPayslip, employees, payroll, branches, staff } from "@evaluna/db/schema";
import { asc, desc, eq, and, sql, lt, gt, isNull, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";
import { TRPCError } from "@trpc/server";

export const payslipRouter = router({
  // Payslip Template Management
  getPayslipTemplates: roleProcedure(["admin", "hr", "manager"])
    .input(z.object({
      branchId: z.number().optional(),
      isDefault: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;
      let query = db
        .select({
          id: payslipTemplate.id,
          branchId: payslipTemplate.branchId,
          branchName: branches.name,
          name: payslipTemplate.name,
          isDefault: payslipTemplate.isDefault,
          templateConfig: payslipTemplate.templateConfig,
          createdAt: payslipTemplate.createdAt,
          updatedAt: payslipTemplate.updatedAt,
        })
        .from(payslipTemplate)
        .leftJoin(branches, eq(payslipTemplate.branchId, branches.id));

      if (input.branchId) {
        query = query.where(eq(payslipTemplate.branchId, input.branchId));
      }
      if (input.isDefault !== undefined) {
        query = query.where(eq(payslipTemplate.isDefault, input.isDefault));
      }

      const results = await query.orderBy(desc(payslipTemplate.createdAt));
      return results;
    }),

  createPayslipTemplate: roleProcedure(["admin", "hr"])
    .input(z.object({
      branchId: z.number(),
      name: z.string().max(100),
      isDefault: z.boolean().default(false),
      templateConfig: z.object({
        showEarningsBreakdown: z.boolean().default(true),
        showDeductionsBreakdown: z.boolean().default(true),
        showReimbursements: z.boolean().default(true),
        showYTD: z.boolean().default(true),
        logoUrl: z.string().url().optional().nullable(),
        footerText: z.string().max(500).optional().nullable(),
        customFields: z.array(
          z.object({
            label: z.string().max(100),
            valuePath: z.string().max(200),
            isCurrency: z.boolean().default(false),
          })
        ).default([]),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      // Validate branch exists
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, input.branchId))
        .limit(1);
      if (!branch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Branch not found" });
      }

      // If setting as default, unset other defaults for this branch
      if (input.isDefault) {
        await db
          .update(payslipTemplate)
          .set({ isDefault: false })
          .where(eq(payslipTemplate.branchId, input.branchId));
      }

      const [result] = await db
        .insert(payslipTemplate)
        .values({
          branchId: input.branchId,
          name: input.name,
          isDefault: input.isDefault,
          templateConfig: input.templateConfig,
        })
        .returning();

      return result;
    }),

  updatePayslipTemplate: roleProcedure(["admin", "hr"])
    .input(z.object({
      id: z.number(),
      name: z.string().max(100).optional(),
      isDefault: z.boolean().optional(),
      templateConfig: z.object({
        showEarningsBreakdown: z.boolean().optional(),
        showDeductionsBreakdown: z.boolean().optional(),
        showReimbursements: z.boolean().optional(),
        showYTD: z.boolean().optional(),
        logoUrl: z.string().url().optional().nullable(),
        footerText: z.string().max(500).optional().nullable(),
        customFields: z.array(
          z.object({
            label: z.string().max(100),
            valuePath: z.string().max(200),
            isCurrency: z.boolean().default(false),
          })
        ).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      const [existing] = await db
        .select()
        .from(payslipTemplate)
        .where(eq(payslipTemplate.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payslip template not found" });
      }

      // If setting as default, unset other defaults for this branch
      if (input.isDefault === true) {
        await db
          .update(payslipTemplate)
          .set({ isDefault: false })
          .where(
            and(
              eq(payslipTemplate.branchId, existing.branchId),
              eq(payslipTemplate.id, input.id).not()
            )
          );
      }

      const [result] = await db
        .update(payslipTemplate)
        .set({
          name: input.name,
          isDefault: input.isDefault,
          templateConfig: input.templateConfig,
          updatedAt: new Date(),
        })
        .where(eq(payslipTemplate.id, input.id))
        .returning();

      return result;
    }),

  deletePayslipTemplate: roleProcedure(["admin", "hr"])
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;
      const [existing] = await db
        .select()
        .from(payslipTemplate)
        .where(eq(payslipTemplate.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payslip template not found" });
      }

      // Check if template is being used
      const [usageCount] = await db
        .select({ count: sql`count(*)` })
        .from(generatedPayslip)
        .where(eq(generatedPayslip.templateId, input.id));

      if (Number(usageCount.count) > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete payslip template that is in use",
        });
      }

      await db.delete(payslipTemplate).where(eq(payslipTemplate.id, input.id));
      return { success: true };
    }),

  // Generated Payslip Management
  getGeneratedPayslips: roleProcedure(["admin", "hr", "manager", "employee"])
    .input(z.object({
      payrollId: z.number().optional(),
      employeeId: z.number().optional(),
      branchId: z.number().optional(),
      isPublished: z.boolean().optional(),
      month: z.string().optional(),
      year: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;
      let query = db
        .select({
          id: generatedPayslip.id,
          payrollId: generatedPayslip.payrollId,
          payrollMonth: payroll.month,
          payrollYear: payroll.year,
          employeeId: generatedPayslip.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employee_code,
          templateId: generatedPayslip.templateId,
          templateName: payslipTemplate.name,
          contentUrl: generatedPayslip.contentUrl,
          isPublished: generatedPayslip.isPublished,
          publishedAt: generatedPayslip.publishedAt,
          generatedAt: generatedPayslip.generatedAt,
        })
        .from(generatedPayslip)
        .innerJoin(employees, eq(generatedPayslip.employeeId, employees.id))
        .innerJoin(payroll, eq(generatedPayslip.payrollId, payroll.id))
        .leftJoin(payslipTemplate, eq(generatedPayslip.templateId, payslipTemplate.id));

      if (input.payrollId) {
        query = query.where(eq(generatedPayslip.payrollId, input.payrollId));
      }
      if (input.employeeId) {
        query = query.where(eq(generatedPayslip.employeeId, input.employeeId));
      }
      if (input.branchId) {
        // Join with payroll to get branch
        query = query
          .innerJoin(
            payroll.as("payrollBranch"),
            eq(generatedPayslip.payrollId, payrollBranch.id)
          )
          .where(eq(payrollBranch.branch_id, input.branchId));
      }
      if (input.isPublished !== undefined) {
        query = query.where(eq(generatedPayslip.isPublished, input.isPublished));
      }
      if (input.month) {
        query = query.where(eq(payroll.month, input.month));
      }
      if (input.year) {
        query = query.where(eq(payroll.year, input.year));
      }

      const results = await query.orderBy(desc(generatedPayslip.generatedAt));
      return results;
    }),

  generatePayslip: roleProcedure(["admin", "hr"])
    .input(z.object({
      payrollId: z.number(),
      employeeId: z.number(),
      templateId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      // Validate payroll exists and is approved/paid
      const [payrollRecord] = await db
        .select()
        .from(payroll)
        .where(eq(payroll.id, input.payrollId))
        .limit(1);

      if (!payrollRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payroll record not found" });
      }

      if (!["approved", "paid"].includes(payrollRecord.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only generate payslips for approved or paid payrolls",
        });
      }

      // Validate employee exists
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });
      }

      // Check if payslip already generated for this payroll/employee
      const [existing] = await db
        .select()
        .from(generatedPayslip)
        .where(
          and(
            eq(generatedPayslip.payrollId, input.payrollId),
            eq(generatedPayslip.employeeId, input.employeeId)
          )
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Payslip already generated for this employee and payroll",
        });
      }

      // Determine template to use
      let templateId = input.templateId;
      if (!templateId) {
        // Get staff record for employee to get branch_id
        const [staffRecord] = await db
          .select({ id: staff.id, branch_id: staff.branch_id })
          .from(staff)
          .where(eq(staff.employeeId, employee.id))
          .limit(1);

        if (!staffRecord) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Staff record not found for employee" });
        }

        // Get default template for employee's branch
        const [defaultTemplate] = await db
          .select({ id: payslipTemplate.id })
          .from(payslipTemplate)
          .where(
            and(
              eq(payslipTemplate.branchId, staffRecord.branch_id),
              eq(payslipTemplate.isDefault, true)
            )
          )
          .limit(1);

        if (!defaultTemplate) {
          // Get any template for the branch
          const [anyTemplate] = await db
            .select({ id: payslipTemplate.id })
            .from(payslipTemplate)
            .where(eq(payslipTemplate.branchId, staffRecord.branch_id))
            .limit(1);

          if (!anyTemplate) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "No payslip template found for employee's branch",
            });
          }

          templateId = anyTemplate.id;
        } else {
          templateId = defaultTemplate.id;
        }
      }

      // Validate template exists
      const [template] = await db
        .select()
        .from(payslipTemplate)
        .where(eq(payslipTemplate.id, templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payslip template not found" });
      }

      // Generate payslip content (in real implementation, this would generate PDF)
      // For now, we'll just create a placeholder
      const contentUrl = `generated-payslip-${input.payrollId}-${input.employeeId}.pdf`;

      const [result] = await db
        .insert(generatedPayslip)
        .values({
          payrollId: input.payrollId,
          employeeId: input.employeeId,
          templateId: templateId,
          contentUrl: contentUrl,
          isPublished: false,
        })
        .returning();

      return result;
    }),

  publishPayslip: roleProcedure(["admin", "hr"])
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      const [existing] = await db
        .select()
        .from(generatedPayslip)
        .where(eq(generatedPayslip.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Generated payslip not found" });
      }

      if (existing.isPublished) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payslip is already published",
        });
      }

      const [result] = await db
        .update(generatedPayslip)
        .set({
          isPublished: true,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(generatedPayslip.id, input.id))
        .returning();

      return result;
    }),

  // Employee Self-Service
  getMyPayslips: roleProcedure(["employee"])
    .input(z.object({
      month: z.string().optional(),
      year: z.string().optional(),
      limit: z.number().min(1).max(100).default(12),
    }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;

      // Get employee record for current user
      const [employee] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.userUid, ctx.user.id))
        .limit(1);

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employee record not found" });
      }

      let query = db
        .select({
          id: generatedPayslip.id,
          payrollId: generatedPayslip.payrollId,
          month: payroll.month,
          year: payroll.year,
          templateName: payslipTemplate.name,
          contentUrl: generatedPayslip.contentUrl,
          isPublished: generatedPayslip.isPublished,
          publishedAt: generatedPayslip.publishedAt,
          generatedAt: generatedPayslip.generatedAt,
        })
        .from(generatedPayslip)
        .innerJoin(employees, eq(generatedPayslip.employeeId, employees.id))
        .innerJoin(payroll, eq(generatedPayslip.payrollId, payroll.id))
        .innerJoin(payslipTemplate, eq(generatedPayslip.templateId, payslipTemplate.id))
        .where(eq(generatedPayslip.employeeId, employee.id))
        .where(eq(generatedPayslip.isPublished, true)); // Only show published payslips to employees

      if (input.month) {
        query = query.where(eq(payroll.month, input.month));
      }
      if (input.year) {
        query = query.where(eq(payroll.year, input.year));
      }

      const results = await query
        .orderBy(desc(generatedPayslip.generatedAt))
        .limit(input.limit);

      return results;
    }),
});