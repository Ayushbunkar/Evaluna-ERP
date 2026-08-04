import { z } from "zod";
import { router, procedure } from "../../trpc";
import { db } from "@evaluna/db";
import { shifts, employeeShifts, employees } from "@evaluna/db/src/schema/hrms";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const shiftsRouter = router({
  // Shifts
  list: procedure.query(async () => {
    return await db.query.shifts.findMany({
      orderBy: (shifts, { asc }) => [asc(shifts.name)],
    });
  }),

  create: procedure
    .input(
      z.object({
        name: z.string().min(1),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
        graceTime: z.number().default(10),
        lunchDuration: z.number().default(45),
        teaBreakDuration: z.number().default(15),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      const [shift] = await db
        .insert(shifts)
        .values(input)
        .returning();

      return shift;
    }),

  update: procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).optional(),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).optional(),
        graceTime: z.number().optional(),
        lunchDuration: z.number().optional(),
        teaBreakDuration: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [shift] = await db
        .update(shifts)
        .set(input)
        .where(eq(shifts.id, input.id))
        .returning();

      if (!shift) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shift not found",
        });
      }

      return shift;
    }),

  // Employee Shifts
  assignShift: procedure
    .input(
      z.object({
        employeeId: z.number(),
        shiftId: z.number(),
        effectiveFrom: z.date(),
        effectiveTo: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [assignment] = await db
        .insert(employeeShifts)
        .values(input)
        .returning();

      return assignment;
    }),

  getEmployeeShifts: procedure
    .input(
      z.object({
        employeeId: z.number(),
        date: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      const date = input.date || new Date();
      const dateStr = date.toISOString().split("T")[0];

      return await db.query.employeeShifts.findMany({
        where: and(
          eq(employeeShifts.employeeId, input.employeeId),
          sql`${employeeShifts.effectiveFrom} <= ${dateStr} AND (${employeeShifts.effectiveTo} >= ${dateStr} OR ${employeeShifts.effectiveTo} IS NULL)`,
        ),
        with: {
          shift: true,
        },
        orderBy: (employeeShifts, { desc }) => [desc(employeeShifts.effectiveFrom)],
      });
    }),

  getCurrentShift: procedure
    .input(
      z.object({
        employeeId: z.number(),
        date: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      const date = input.date || new Date();
      const dateStr = date.toISOString().split("T")[0];

      const assignment = await db.query.employeeShifts.findFirst({
        where: and(
          eq(employeeShifts.employeeId, input.employeeId),
          sql`${employeeShifts.effectiveFrom} <= ${dateStr} AND (${employeeShifts.effectiveTo} >= ${dateStr} OR ${employeeShifts.effectiveTo} IS NULL)`,
        ),
        with: {
          shift: true,
        },
        orderBy: (employeeShifts, { desc }) => [desc(employeeShifts.effectiveFrom)],
      });

      return assignment?.shift;
    }),
});