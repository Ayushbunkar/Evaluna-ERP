import { z } from "zod";
import { router, procedure } from "../../trpc";
import { db } from "@evaluna/db";
import { attendance, employees, holidays, weekOffs } from "@evaluna/db/src/schema/hrms";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const attendanceRouter = router({
  checkIn: procedure
    .input(
      z.object({
        employeeId: z.number(),
        location: z.string().optional(),
        ipAddress: z.string().optional(),
        deviceInfo: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const today = new Date();
      const date = today.toISOString().split("T")[0];

      // Check if already checked in today
      const existing = await db.query.attendance.findFirst({
        where: and(
          eq(attendance.employeeId, input.employeeId),
          eq(attendance.date, date),
          isNull(attendance.checkOut),
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already checked in today",
        });
      }

      // Check if it's a holiday
      const holiday = await db.query.holidays.findFirst({
        where: eq(holidays.date, date),
      });

      // Check if it's a week off
      const weekOff = await db.query.weekOffs.findFirst({
        where: and(
          eq(weekOffs.employeeId, input.employeeId),
          eq(weekOffs.weekday, today.getDay()),
          sql`${weekOffs.effectiveFrom} <= ${date} AND (${weekOffs.effectiveTo} >= ${date} OR ${weekOffs.effectiveTo} IS NULL)`,
        ),
      });

      let status = "present";
      if (holiday) {
        status = "holiday";
      } else if (weekOff) {
        status = "week_off";
      }

      const [record] = await db
        .insert(attendance)
        .values({
          employeeId: input.employeeId,
          date: date,
          checkIn: today.toTimeString().split(" ")[0],
          status: status,
          location: input.location,
          ipAddress: input.ipAddress,
          deviceInfo: input.deviceInfo,
        })
        .returning();

      return record;
    }),

  checkOut: procedure
    .input(
      z.object({
        employeeId: z.number(),
        location: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const today = new Date();
      const date = today.toISOString().split("T")[0];

      const [record] = await db
        .update(attendance)
        .set({
          checkOut: today.toTimeString().split(" ")[0],
          location: input.location,
        })
        .where(
          and(
            eq(attendance.employeeId, input.employeeId),
            eq(attendance.date, date),
            isNull(attendance.checkOut),
          ),
        )
        .returning();

      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active check-in found",
        });
      }

      return record;
    }),

  startBreak: procedure
    .input(
      z.object({
        employeeId: z.number(),
        breakType: z.enum(["lunch", "tea"]),
      }),
    )
    .mutation(async ({ input }) => {
      const today = new Date();
      const date = today.toISOString().split("T")[0];
      const timeField = input.breakType === "lunch" ? "lunchStart" : "teaBreakStart";

      const [record] = await db
        .update(attendance)
        .set({
          [timeField]: today.toTimeString().split(" ")[0],
        })
        .where(
          and(
            eq(attendance.employeeId, input.employeeId),
            eq(attendance.date, date),
            isNull(attendance[timeField]),
          ),
        )
        .returning();

      if (!record) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Break already started or no check-in found`,
        });
      }

      return record;
    }),

  endBreak: procedure
    .input(
      z.object({
        employeeId: z.number(),
        breakType: z.enum(["lunch", "tea"]),
      }),
    )
    .mutation(async ({ input }) => {
      const today = new Date();
      const date = today.toISOString().split("T")[0];
      const startField = input.breakType === "lunch" ? "lunchStart" : "teaBreakStart";
      const endField = input.breakType === "lunch" ? "lunchEnd" : "teaBreakEnd";

      const [record] = await db
        .update(attendance)
        .set({
          [endField]: today.toTimeString().split(" ")[0],
        })
        .where(
          and(
            eq(attendance.employeeId, input.employeeId),
            eq(attendance.date, date),
            isNull(attendance[endField]),
            isNull(attendance.checkOut),
          ),
        )
        .returning();

      if (!record) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Break not started or already ended`,
        });
      }

      return record;
    }),

  getDaily: procedure
    .input(
      z.object({
        date: z.date().optional(),
        employeeId: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const date = input.date
        ? input.date.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const whereClause = [eq(attendance.date, date)];

      if (input.employeeId) {
        whereClause.push(eq(attendance.employeeId, input.employeeId));
      }

      return await db.query.attendance.findMany({
        where: and(...whereClause),
        with: {
          employee: {
            with: {
              department: true,
              designation: true,
            },
          },
        },
        orderBy: (attendance, { asc }) => [asc(attendance.employeeId)],
      });
    }),

  getMonthly: procedure
    .input(
      z.object({
        month: z.number(),
        year: z.number(),
        employeeId: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const startDate = `${input.year}-${input.month.toString().padStart(2, "0")}-01`;
      const endDate = `${input.year}-${input.month.toString().padStart(2, "0")}-31`;

      const whereClause = [
        sql`${attendance.date} >= ${startDate}`,
        sql`${attendance.date} <= ${endDate}`,
      ];

      if (input.employeeId) {
        whereClause.push(eq(attendance.employeeId, input.employeeId));
      }

      return await db.query.attendance.findMany({
        where: and(...whereClause),
        with: {
          employee: {
            with: {
              department: true,
              designation: true,
            },
          },
        },
        orderBy: (attendance, { asc }) => [asc(attendance.date), asc(attendance.employeeId)],
      });
    }),

  getStatus: procedure
    .input(
      z.object({
        employeeId: z.number(),
        date: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      const date = input.date
        ? input.date.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      // Check holiday
      const holiday = await db.query.holidays.findFirst({
        where: eq(holidays.date, date),
      });

      if (holiday) {
        return { status: "holiday", name: holiday.name };
      }

      // Check week off
      const weekOff = await db.query.weekOffs.findFirst({
        where: and(
          eq(weekOffs.employeeId, input.employeeId),
          eq(weekOffs.weekday, new Date(date).getDay()),
          sql`${weekOffs.effectiveFrom} <= ${date} AND (${weekOffs.effectiveTo} >= ${date} OR ${weekOffs.effectiveTo} IS NULL)`,
        ),
      });

      if (weekOff) {
        return { status: "week_off" };
      }

      // Check attendance
      const attendanceRecord = await db.query.attendance.findFirst({
        where: and(
          eq(attendance.employeeId, input.employeeId),
          eq(attendance.date, date),
        ),
      });

      if (attendanceRecord) {
        return {
          status: attendanceRecord.status,
          checkIn: attendanceRecord.checkIn,
          checkOut: attendanceRecord.checkOut,
          lunchStart: attendanceRecord.lunchStart,
          lunchEnd: attendanceRecord.lunchEnd,
        };
      }

      return { status: "absent" };
    }),
});