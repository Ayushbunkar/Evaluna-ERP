import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { staffAttendance, staff } from "@evaluna/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export const attendanceRouter = router({
  list: protectedProcedure
    .input(z.object({ branch_id: z.number().nullable().optional(), date: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const branchId = input.branch_id ?? ctx.user.branch_id;
      // Get all attendance for today by default, or specified date
      const queryDate = input.date ?? new Date().toISOString().split("T")[0];

      let conditions = [eq(staffAttendance.date, queryDate)];
      if (branchId) {
        conditions.push(eq(staffAttendance.branch_id, branchId));
      }

      return ctx.db.query.staffAttendance.findMany({
        where: and(...conditions),
        with: {
          staff: true,
        },
        orderBy: [desc(staffAttendance.clock_in_time)],
      });
    }),

  history: protectedProcedure
    .input(z.object({ staff_id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.staffAttendance.findMany({
        where: eq(staffAttendance.staff_id, input.staff_id),
        orderBy: [desc(staffAttendance.date)],
      });
    }),

  clockIn: protectedProcedure
    .input(
      z.object({
        staff_id: z.number(),
        work_type: z.string().default("regular"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure the staff member doesn't already have an active shift today
      const today = new Date().toISOString().split("T")[0];
      const activeShift = await ctx.db
        .select()
        .from(staffAttendance)
        .where(
          and(
            eq(staffAttendance.staff_id, input.staff_id),
            eq(staffAttendance.date, today),
            eq(staffAttendance.shift_status, "active")
          )
        );

      if (activeShift.length > 0) {
        throw new Error("Staff member is already clocked in today.");
      }

      // We need to get the staff's branch_id to associate the shift
      const staffMember = await ctx.db
        .select()
        .from(staff)
        .where(eq(staff.id, input.staff_id));

      if (staffMember.length === 0) {
        throw new Error("Staff member not found.");
      }

      const branchId = staffMember[0].branch_id ?? ctx.user.branch_id;

      const [created] = await ctx.db
        .insert(staffAttendance)
        .values({
          staff_id: input.staff_id,
          branch_id: branchId,
          date: today,
          clock_in_time: new Date(),
          work_type: input.work_type,
          notes: input.notes,
          shift_status: "active",
        })
        .returning();

      return created;
    }),

  clockOut: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(staffAttendance)
        .set({
          clock_out_time: new Date(),
          shift_status: "completed",
          updated_at: new Date(),
        })
        .where(eq(staffAttendance.id, input.id))
        .returning();

      return updated;
    }),
});
