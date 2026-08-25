import { paymentBatch, paymentBatchItem, payroll, employees, branches, paymentMethods } from "@evaluna/db/schema";
import { asc, desc, eq, and, sql, lt, gt, isNull, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";
import { TRPCError } from "@trpc/server";

export const paymentBatchRouter = router({
  // Payment Batch Management
  getPaymentBatches: roleProcedure(["admin", "hr", "finance", "manager"])
    .input(z.object({
      branchId: z.number().optional(),
      status: z.enum(["created", "processing", "completed", "failed", "reconciled"]).optional(),
      paymentDateFrom: z.string().optional(),
      paymentDateTo: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;
      let query = db
        .select({
          id: paymentBatch.id,
          batchNumber: paymentBatch.batchNumber,
          branchId: paymentBatch.branchId,
          branchName: branches.name,
          paymentDate: paymentBatch.paymentDate,
          status: paymentBatch.status,
          totalAmount: paymentBatch.totalAmount,
          totalCount: paymentBatch.totalCount,
          createdByName: employeesCreated.name,
          createdAt: paymentBatch.createdAt,
          updatedAt: paymentBatch.updatedAt,
        })
        .from(paymentBatch)
        .leftJoin(branches, eq(paymentBatch.branchId, branches.id))
        .leftJoin(employees as employeesCreated, eq(paymentBatch.createdBy, employeesCreated.id));

      if (input.branchId) {
        query = query.where(eq(paymentBatch.branchId, input.branchId));
      }
      if (input.status) {
        query = query.where(eq(paymentBatch.status, input.status));
      }
      if (input.paymentDateFrom) {
        query = query.where(gte(paymentBatch.paymentDate, input.paymentDateFrom));
      }
      if (input.paymentDateTo) {
        query = query.where(lte(paymentBatch.paymentDate, input.paymentDateTo));
      }

      const results = await query.orderBy(desc(paymentBatch.createdAt));
      return results;
    }),

  createPaymentBatch: roleProcedure(["admin", "hr", "finance"])
    .input(z.object({
      branchId: z.number(),
      batchNumber: z.string().max(50),
      paymentDate: z.date(),
      payrollIds: z.array(z.number()).min(1),
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

      // Check if batch number already exists
      const [existingBatch] = await db
        .select({ id: paymentBatch.id })
        .from(paymentBatch)
        .where(eq(paymentBatch.batchNumber, input.batchNumber))
        .limit(1);

      if (existingBatch) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Payment batch number already exists",
        });
      }

      // Validate payrolls exist and are approved/paid
      const validPayrolls = await db
        .select({ id: payroll.id, amount: payroll.net_payable, employeeId: payroll.staff_id })
        .from(payroll)
        .where(
          and(
            inArray(payroll.id, input.payrollIds),
            // In a real system, we'd check status is approved/paid
            // For now, we'll assume they're valid
            eq(payroll.status, "approved") // or "paid"
          )
        );

      if (validPayrolls.length !== input.payrollIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more payrolls are not valid for payment (not approved/paid)",
        });
      }

      // Calculate total
      const totalAmount = validPayrolls.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalCount = validPayrolls.length;

      // Get creator from context (assuming ctx.user.id maps to employee)
      const [creator] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.userUid, ctx.user.id))
        .limit(1);

      if (!creator) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Employee record not found for user" });
      }

      await db.transaction(async (tx) => {
        // Create payment batch
        const [batch] = await tx
          .insert(paymentBatch)
          .values({
            branchId: input.branchId,
            batchNumber: input.batchNumber,
            paymentDate: input.paymentDate,
            status: "created",
            totalAmount: totalAmount,
            totalCount: totalCount,
            createdBy: creator.id,
          })
          .returning();

        // Create payment batch items
        const batchItems = validPayrolls.map((payroll) => ({
          batchId: batch.id,
          payrollId: payroll.id,
          employeeId: payroll.employeeId,
          amount: payroll.amount,
          status: "pending",
        }));

        if (batchItems.length > 0) {
          await tx.insert(paymentBatchItem).values(batchItems);
        }
      });

      return { success: true };
    }),

  getPaymentBatchItems: roleProcedure(["admin", "hr", "finance", "manager"])
    .input(z.object({
      batchId: z.number(),
      status: z.enum(["pending", "processed", "failed", "reconciled"]).optional(),
      employeeId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;
      let query = db
        .select({
          id: paymentBatchItem.id,
          batchId: paymentBatchItem.batchId,
          payrollId: paymentBatchItem.payrollId,
          payrollMonth: payroll.month,
          payrollYear: payroll.year,
          employeeId: paymentBatchItem.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employee_code,
          amount: paymentBatchItem.amount,
          status: paymentBatchItem.status,
          paymentMethodId: paymentBatchItem.paymentMethodId,
          paymentMethodName: paymentMethods.name,
          processedAt: paymentBatchItem.processedAt,
          failureReason: paymentBatchItem.failureReason,
          createdAt: paymentBatchItem.createdAt,
          updatedAt: paymentBatchItem.updatedAt,
        })
        .from(paymentBatchItem)
        .innerJoin(payroll, eq(paymentBatchItem.payrollId, payroll.id))
        .innerJoin(employees, eq(paymentBatchItem.employeeId, employees.id))
        .leftJoin(paymentMethods, eq(paymentBatchItem.paymentMethodId, paymentMethods.id))
        .where(eq(paymentBatchItem.batchId, input.batchId));

      if (input.status) {
        query = query.where(eq(paymentBatchItem.status, input.status));
      }
      if (input.employeeId) {
        query = query.where(eq(paymentBatchItem.employeeId, input.employeeId));
      }

      const results = await query.orderBy(asc(paymentBatchItem.createdAt));
      return results;
    }),

  processPaymentBatchItem: roleProcedure(["admin", "hr", "finance"])
    .input(z.object({
      id: z.number(),
      paymentMethodId: z.number().optional(),
      processed: z.boolean(),
      failureReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      const [item] = await db
        .select()
        .from(paymentBatchItem)
        .where(eq(paymentBatchItem.id, input.id))
        .limit(1);

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment batch item not found" });
      }

      if (item.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot process item with status '${item.status}'`,
        });
      }

      const [result] = await db
        .update(paymentBatchItem)
        .set({
          status: input.processed ? "processed" : "failed",
          paymentMethodId: input.paymentMethodId,
          processedAt: input.processed ? new Date() : null,
          failureReason: input.failureReason,
          updatedAt: new Date(),
        })
        .where(eq(paymentBatchItem.id, input.id))
        .returning();

      return result;
    }),

  completePaymentBatch: roleProcedure(["admin", "hr", "finance"])
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      const [batch] = await db
        .select()
        .from(paymentBatch)
        .where(eq(paymentBatch.id, input.id))
        .limit(1);

      if (!batch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment batch not found" });
      }

      if (batch.status !== "created") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot complete batch with status '${batch.status}'`,
        });
      }

      // Check if all items are processed
      const [pendingCount] = await db
        .select({ count: sql`count(*)` })
        .from(paymentBatchItem)
        .where(
          and(
            eq(paymentBatchItem.batchId, input.id),
            eq(paymentBatchItem.status, "pending")
          )
        );

      if (Number(pendingCount.count) > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot complete batch: some items are still pending",
        });
      }

      const [result] = await db
        .update(paymentBatch)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(paymentBatch.id, input.id))
        .returning();

      return result;
    }),

  reconcilePaymentBatch: roleProcedure(["admin", "finance"])
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      const [batch] = await db
        .select()
        .from(paymentBatch)
        .where(eq(paymentBatch.id, input.id))
        .limit(1);

      if (!batch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment batch not found" });
      }

      if (batch.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reconcile batch with status '${batch.status}'`,
        });
      }

      const [result] = await db
        .update(paymentBatch)
        .set({
          status: "reconciled",
          updatedAt: new Date(),
        })
        .where(eq(paymentBatch.id, input.id))
        .returning();

      return result;
    }),

  // Employee Self-Service for Payments
  getMyPaymentHistory: roleProcedure(["employee"])
    .input(z.object({
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

      const results = await db
        .select({
          id: paymentBatchItem.id,
          batchNumber: paymentBatch.batchNumber,
          paymentDate: paymentBatch.paymentDate,
          amount: paymentBatchItem.amount,
          status: paymentBatchItem.status,
          paymentMethodName: paymentMethods.name,
          processedAt: paymentBatchItem.processedAt,
          createdAt: paymentBatchItem.createdAt,
        })
        .from(paymentBatchItem)
        .innerJoin(paymentBatch, eq(paymentBatchItem.batchId, paymentBatch.id))
        .innerJoin(paymentMethods, eq(paymentBatchItem.paymentMethodId, paymentMethods.id))
        .where(eq(paymentBatchItem.employeeId, employee.id))
        .orderBy(desc(paymentBatch.paymentDate))
        .limit(input.limit);

      return results;
    }),
});