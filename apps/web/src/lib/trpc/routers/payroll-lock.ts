import { payrollLock, payroll, employees } from "@evaluna/db/schema";
import { asc, desc, eq, and, sql, lt, gt, isNull, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";
import { TRPCError } from "@trpc/server";

export const payrollLockRouter = router({
  // Payroll Lock Management (Concurrency Control)
  getPayrollLocks: roleProcedure(["admin", "hr", "finance"])
    .input(z.object({
      payrollId: z.number().optional(),
      lockedBy: z.number().optional(),
      lockReason: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;
      let query = db
        .select({
          id: payrollLock.id,
          payrollId: payrollLock.payrollId,
          payrollMonth: payroll.month,
          payrollYear: payroll.year,
          lockedById: payrollLock.lockedBy,
          lockedByName: employeesLocked.name,
          lockedAt: payrollLock.lockedAt,
          expiresAt: payrollLock.expiresAt,
          lockReason: payrollLock.lockReason,
          createdAt: payrollLock.createdAt,
        })
        .from(payrollLock)
        .leftJoin(payroll, eq(payrollLock.payrollId, payroll.id))
        .leftJoin(employees as employeesLocked, eq(payrollLock.lockedBy, employeesLocked.id));

      if (input.payrollId) {
        query = query.where(eq(payrollLock.payrollId, input.payrollId));
      }
      if (input.lockedBy) {
        query = query.where(eq(payrollLock.lockedBy, input.lockedBy));
      }
      if (input.lockReason) {
        query = query.where(eq(payrollLock.lockReason, input.lockReason));
      }

      const results = await query.orderBy(desc(payrollLock.lockedAt));
      return results;
    }),

  acquirePayrollLock: roleProcedure(["admin", "hr", "finance"])
    .input(z.object({
      payrollId: z.number(),
      lockReason: z.enum(["calculation", "approval", "payment", "adjustment", "audit"]),
      durationMinutes: z.number().min(5).max(480).default(30), // 5 minutes to 8 hours
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      // Validate payroll exists
      const [payrollRecord] = await db
        .select()
        .from(payroll)
        .where(eq(payroll.id, input.payrollId))
        .limit(1);

      if (!payrollRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payroll record not found" });
      }

      // Check if payroll is already locked
      const [existingLock] = await db
        .select()
        .from(payrollLock)
        .where(eq(payrollLock.payrollId, input.payrollId))
        .limit(1);

      if (existingLock) {
        // Check if lock has expired
        const now = new Date();
        if (existingLock.expiresAt > now) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Payroll is already locked for ${existingLock.lockReason} by employee #${existingLock.lockedBy}`,
          });
        } else {
          // Lock has expired, remove it
          await db.delete(payrollLock).where(eq(payrollLock.id, existingLock.id));
        }
      }

      // Get locker from context (assuming ctx.user.id maps to employee)
      const [locker] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.userUid, ctx.user.id))
        .limit(1);

      if (!locker) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Employee record not found for user" });
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + input.durationMinutes);

      const [result] = await db
        .insert(payrollLock)
        .values({
          payrollId: input.payrollId,
          lockedBy: locker.id,
          lockedAt: new Date(),
          expiresAt: expiresAt,
          lockReason: input.lockReason,
        })
        .returning();

      return result;
    }),

  releasePayrollLock: roleProcedure(["admin", "hr", "finance"])
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      const [lock] = await db
        .select()
        .from(payrollLock)
        .where(eq(payrollLock.id, input.id))
        .limit(1);

      if (!lock) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payroll lock not found" });
      }

      // Verify the user releasing the lock is the one who acquired it (or admin/finance override)
      const [locker] = await db
        .select({ id: employees.id, userUid: employees.userUid })
        .from(employees)
        .where(eq(employees.id, lock.lockedBy))
        .limit(1);

      // In a more sophisticated system, we'd check if the current user is the locker or has override privileges
      // For now, we'll allow HR/finance/admin to release any lock

      await db.delete(payrollLock).where(eq(payrollLock.id, input.id));
      return { success: true };
    }),

  // Get lock status for a payroll
  getPayrollLockStatus: roleProcedure(["admin", "hr", "finance", "manager"])
    .input(z.object({
      payrollId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;

      const [lock] = await db
        .select({
          id: payrollLock.id,
          payrollId: payrollLock.payrollId,
          lockedById: payrollLock.lockedBy,
          lockedByName: employeesLocked.name,
          lockedAt: payrollLock.lockedAt,
          expiresAt: payrollLock.expiresAt,
          lockReason: payrollLock.lockReason,
          isExpired: sql`${payrollLock.expiresAt} < NOW()`,
        })
        .from(payrollLock)
        .leftJoin(employees as employeesLocked, eq(payrollLock.lockedBy, employeesLocked.id))
        .where(eq(payrollLock.payrollId, input.payrollId))
        .limit(1);

      if (!lock) {
        return { isLocked: false };
      }

      // Check if lock has expired
      const now = new Date();
      const isExpired = lock.expiresAt < now;

      return {
        isLocked: !isExpired,
        lock: isExpired ? null : {
          id: lock.id,
          payrollId: lock.payrollId,
          lockedById: lock.lockedById,
          lockedByName: lock.lockedByName,
          lockedAt: lock.lockedAt,
          expiresAt: lock.expiresAt,
          lockReason: lock.lockReason,
        }
      };
    }),

  // Clean up expired locks (would typically be called by a cron job)
  cleanupExpiredLocks: roleProcedure(["admin", "finance"])
    .mutation(async ({ ctx }) => {
      const db = ctx.db;

      const result = await db
        .delete(payrollLock)
        .where(lt(payrollLock.expiresAt, new Date()))
        .returning();

      return { cleanedUp: result.length };
    }),
});