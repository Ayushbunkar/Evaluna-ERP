import { z } from "zod";
import { router, procedure } from "../../trpc";
import { db } from "@evaluna/db";
import { leaveApplications, leaveTypes, employees } from "@evaluna/db/src/schema/hrms";
import { eq, and, or, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const leaveRouter = router({
  // Leave Types
  getLeaveTypes: procedure.query(async () => {
    return await db.query.leaveTypes.findMany({
      orderBy: (leaveTypes, { asc }) => [asc(leaveTypes.name)],
    });
  }),

  createLeaveType: procedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        description: z.string().optional(),
        isPaid: z.boolean().default(true),
        maxDays: z.number().default(24),
        carryForward: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      const [leaveType] = await db
        .insert(leaveTypes)
        .values(input)
        .returning();

      return leaveType;
    }),

  // Leave Applications
  applyLeave: procedure
    .input(
      z.object({
        employeeId: z.number(),
        leaveTypeId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if dates are valid
      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date",
        });
      }

      // Check leave balance
      const leaveType = await db.query.leaveTypes.findFirst({
        where: eq(leaveTypes.id, input.leaveTypeId),
      });

      if (!leaveType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Leave type not found",
        });
      }

      // Calculate days
      const days = Math.ceil(
        (input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

      // Check if employee has enough balance
      // (This would be more complex in a real system with leave balance tracking)

      const [application] = await db
        .insert(leaveApplications)
        .values({
          employeeId: input.employeeId,
          leaveTypeId: input.leaveTypeId,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
          status: "pending",
        })
        .returning();

      return application;
    }),

  approveLeave: procedure
    .input(
      z.object({
        id: z.number(),
        approvedBy: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const [application] = await db
        .update(leaveApplications)
        .set({
          status: "approved",
          approvedBy: input.approvedBy,
          approvedAt: new Date(),
        })
        .where(
          and(
            eq(leaveApplications.id, input.id),
            eq(leaveApplications.status, "pending"),
          ),
        )
        .returning();

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Leave application not found or already processed",
        });
      }

      return application;
    }),

  rejectLeave: procedure
    .input(
      z.object({
        id: z.number(),
        approvedBy: z.number(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [application] = await db
        .update(leaveApplications)
        .set({
          status: "rejected",
          approvedBy: input.approvedBy,
          approvedAt: new Date(),
        })
        .where(
          and(
            eq(leaveApplications.id, input.id),
            eq(leaveApplications.status, "pending"),
          ),
        )
        .returning();

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Leave application not found or already processed",
        });
      }

      return application;
    }),

  getEmployeeLeaves: procedure
    .input(
      z.object({
        employeeId: z.number(),
        status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
        year: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const whereClause = [eq(leaveApplications.employeeId, input.employeeId)];

      if (input.status) {
        whereClause.push(eq(leaveApplications.status, input.status));
      }

      if (input.year) {
        whereClause.push(
          sql`EXTRACT(YEAR FROM ${leaveApplications.startDate}) = ${input.year}`,
        );
      }

      return await db.query.leaveApplications.findMany({
        where: and(...whereClause),
        with: {
          leaveType: true,
          approvedByEmployee: true,
        },
        orderBy: (leaveApplications, { desc }) => [desc(leaveApplications.startDate)],
      });
    }),

  getTeamLeaves: procedure
    .input(
      z.object({
        managerId: z.number(),
        status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
        year: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      // Get all employees reporting to this manager
      const team = await db.query.employees.findMany({
        where: eq(employees.managerId, input.managerId),
        columns: {
          id: true,
        },
      });

      const employeeIds = team.map((emp) => emp.id);

      if (employeeIds.length === 0) {
        return [];
      }

      const whereClause = [or(...employeeIds.map((id) => eq(leaveApplications.employeeId, id)))];

      if (input.status) {
        whereClause.push(eq(leaveApplications.status, input.status));
      }

      if (input.year) {
        whereClause.push(
          sql`EXTRACT(YEAR FROM ${leaveApplications.startDate}) = ${input.year}`,
        );
      }

      return await db.query.leaveApplications.findMany({
        where: and(...whereClause),
        with: {
          employee: {
            with: {
              department: true,
              designation: true,
            },
          },
          leaveType: true,
        },
        orderBy: (leaveApplications, { desc }) => [desc(leaveApplications.startDate)],
      });
    }),

  getLeaveBalance: procedure
    .input(
      z.object({
        employeeId: z.number(),
        year: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const year = input.year || new Date().getFullYear();
      const leaveTypes = await db.query.leaveTypes.findMany();

      const balancePromises = leaveTypes.map(async (type) => {
        // Get approved leaves for this type
        const approvedLeaves = await db
          .select({
            days: sql`SUM(EXTRACT(DAY FROM ${leaveApplications.endDate} - ${leaveApplications.startDate}) + 1)`.mapWith(Number),
          })
          .from(leaveApplications)
          .where(
            and(
              eq(leaveApplications.employeeId, input.employeeId),
              eq(leaveApplications.leaveTypeId, type.id),
              eq(leaveApplications.status, "approved"),
              sql`EXTRACT(YEAR FROM ${leaveApplications.startDate}) = ${year}`,
            ),
          )
          .then((res) => res[0]?.days || 0);

        return {
          leaveType: type,
          total: type.maxDays,
          used: approvedLeaves,
          remaining: type.maxDays - approvedLeaves,
        };
      });

      return await Promise.all(balancePromises);
    }),
});