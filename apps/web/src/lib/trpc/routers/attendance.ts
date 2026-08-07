import { staff, staffAttendance } from "@evaluna/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const attendanceRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				branch_id: z.number().nullable().optional(),
				date: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const branchId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];

			if (input.date) {
				conditions.push(eq(staffAttendance.date, input.date));
			}
			if (branchId) {
				conditions.push(eq(staffAttendance.branch_id, branchId));
			}

			return ctx.db.query.staffAttendance.findMany({
				where: conditions.length > 0 ? and(...conditions) : undefined,
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
				staff_id: z.number().optional(), // Make optional for self-service
				work_type: z.string().default("regular"),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Find staff member: either by explicit staff_id or by logged-in user's email
			let staffMember;
			if (input.staff_id) {
				const result = await ctx.db.select().from(staff).where(eq(staff.id, input.staff_id));
				staffMember = result[0];
			} else {
				const result = await ctx.db.select().from(staff).where(eq(staff.email, ctx.user.email));
				staffMember = result[0];
			}

			if (!staffMember) {
				throw new Error("Staff member not found or user is not a staff member.");
			}

			const targetStaffId = staffMember.id;
			const branchId = staffMember.branch_id ?? ctx.user.branchId;

			// Ensure the staff member doesn't already have an active shift today
			const today = new Date().toISOString().split("T")[0];
			const activeShift = await ctx.db
				.select()
				.from(staffAttendance)
				.where(
					and(
						eq(staffAttendance.staff_id, targetStaffId),
						eq(staffAttendance.date, today),
						eq(staffAttendance.shift_status, "active"),
					),
				);

			if (activeShift.length > 0) {
				throw new Error("Staff member is already clocked in today.");
			}

			const [created] = await ctx.db
				.insert(staffAttendance)
				.values({
					staff_id: targetStaffId,
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
		.input(z.object({ id: z.number().optional() })) // Make optional for self-service
		.mutation(async ({ ctx, input }) => {
			let targetAttendanceId = input.id;
			
			if (!targetAttendanceId) {
				// Find current active shift for logged in user
				const result = await ctx.db.select().from(staff).where(eq(staff.email, ctx.user.email));
				const staffMember = result[0];
				if (!staffMember) throw new Error("Staff member not found");

				const today = new Date().toISOString().split("T")[0];
				const activeShift = await ctx.db
					.select()
					.from(staffAttendance)
					.where(
						and(
							eq(staffAttendance.staff_id, staffMember.id),
							eq(staffAttendance.date, today),
							eq(staffAttendance.shift_status, "active"),
						),
					);
				if (activeShift.length === 0) throw new Error("No active shift found to clock out from");
				targetAttendanceId = activeShift[0].id;
			}

			const [updated] = await ctx.db
				.update(staffAttendance)
				.set({
					clock_out_time: new Date(),
					shift_status: "completed",
					updated_at: new Date(),
				})
				.where(eq(staffAttendance.id, targetAttendanceId))
				.returning();

			return updated;
		}),

	myStatus: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db.select().from(staff).where(eq(staff.email, ctx.user.email));
		const staffMember = result[0];
		if (!staffMember) return null;

		const today = new Date().toISOString().split("T")[0];
		const activeShift = await ctx.db
			.select()
			.from(staffAttendance)
			.where(
				and(
					eq(staffAttendance.staff_id, staffMember.id),
					eq(staffAttendance.date, today),
					eq(staffAttendance.shift_status, "active"),
				),
			);
		
		return {
			staff: staffMember,
			activeShift: activeShift.length > 0 ? activeShift[0] : null
		};
	}),
});
