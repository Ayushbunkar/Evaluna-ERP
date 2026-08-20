import {
	attendance,
	departments,
	designations,
	employeeShifts,
	employees,
	holidays,
	leaveApplications,
	leaveTypes,
	overtime,
	shifts,
	weekOffs,
} from "@evaluna/db/schema/hrms";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, roleProcedure, router } from "../init";

export const hrmsRouter = router({
	// Employee Management
	getEmployees: roleProcedure(["admin", "manager", "hr", "auditor"])
		.input(
			z.object({
				search: z.string().optional(),
				departmentId: z.number().optional(),
				status: z.string().optional(),
				limit: z.number().default(50),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			const whereClause = [];

			if (input.search) {
				whereClause.push(
					or(
						sql`${employees.firstName} ILIKE ${`%${input.search}%`}`,
						sql`${employees.lastName} ILIKE ${`%${input.search}%`}`,
						sql`${employees.email} ILIKE ${`%${input.search}%`}`,
						sql`${employees.employeeCode} ILIKE ${`%${input.search}%`}`,
					),
				);
			}

			if (input.departmentId) {
				whereClause.push(eq(employees.departmentId, input.departmentId));
			}

			if (input.status) {
				whereClause.push(eq(employees.status, input.status as any));
			}

			const results = await db.query.employees.findMany({
				where: whereClause.length > 0 ? and(...whereClause) : undefined,
				with: {
					department: true,
					designation: true,
					manager: true,
				},
				limit: input.limit,
				offset: input.offset,
				orderBy: (employees, { asc }) => [asc(employees.firstName)],
			});

			const total = await db
				.select({ count: count() })
				.from(employees)
				.where(whereClause.length > 0 ? and(...whereClause) : undefined)
				.then((res) => res[0]?.count || 0);

			return {
				items: results,
				total,
				page: input.offset / input.limit + 1,
				pageSize: input.limit,
				totalPages: Math.ceil(total / input.limit),
			};
		}),

	getEmployeeById: roleProcedure(["admin", "manager", "hr", "auditor"])
		.input(z.number())
		.query(async ({ input }) => {
			return await db.query.employees.findFirst({
				where: eq(employees.id, input),
				with: {
					department: true,
					designation: true,
					manager: true,
				},
			});
		}),

	// Attendance Management
	checkIn: protectedProcedure
		.input(
			z.object({
				location: z.string().optional(),
				ipAddress: z.string().optional(),
				deviceInfo: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not found",
				});
			}

			const today = new Date();
			const date = today.toISOString().split("T")[0];

			// Check if already checked in today
			const existing = await db.query.attendance.findFirst({
				where: and(
					eq(attendance.employeeId, Number(employeeId)),
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
					eq(weekOffs.employeeId, Number(employeeId)),
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
					employeeId: Number(employeeId),
					date: date as any,
					checkIn: today.toTimeString().split(" ")[0],
					status: status as any,
					location: input.location,
					ipAddress: input.ipAddress,
					deviceInfo: input.deviceInfo,
				})
				.returning();

			return record;
		}),

	checkOut: protectedProcedure
		.input(
			z.object({
				location: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not found",
				});
			}

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
						eq(attendance.employeeId, Number(employeeId)),
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

	getDailyAttendance: roleProcedure(["admin", "manager", "hr", "auditor"])
		.input(
			z.object({
				date: z.date().optional(),
				departmentId: z.number().optional(),
			}),
		)
		.query(async ({ input }) => {
			const date = input.date
				? input.date.toISOString().split("T")[0]
				: new Date().toISOString().split("T")[0];

			const whereClause = [eq(attendance.date, date)];

			if (input.departmentId) {
				whereClause.push(eq(employees.departmentId, input.departmentId));
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

	getAttendanceStatus: protectedProcedure
		.input(
			z.object({
				date: z.date().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not found",
				});
			}

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
					eq(weekOffs.employeeId, Number(employeeId)),
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
					eq(attendance.employeeId, Number(employeeId)),
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

	// Leave Management
	getLeaveTypes: roleProcedure(["admin", "manager", "hr", "auditor"]).query(
		async () => {
			return await db.query.leaveTypes.findMany({
				orderBy: (leaveTypes, { asc }) => [asc(leaveTypes.name)],
			});
		},
	),

	applyLeave: protectedProcedure
		.input(
			z.object({
				leaveTypeId: z.number(),
				startDate: z.date(),
				endDate: z.date(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not found",
				});
			}

			// Check if dates are valid
			if (input.startDate > input.endDate) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "End date must be after start date",
				});
			}

			const [application] = await db
				.insert(leaveApplications)
				.values({
					employeeId: Number(employeeId),
					leaveTypeId: input.leaveTypeId,
					startDate: input.startDate.toISOString().split("T")[0],
					endDate: input.endDate.toISOString().split("T")[0],
					reason: input.reason,
					status: "pending" as any,
				})
				.returning();

			return application;
		}),

	getEmployeeLeaves: protectedProcedure
		.input(
			z.object({
				status: z.string().optional(),
				year: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not found",
				});
			}

			const whereClause = [
				eq(leaveApplications.employeeId, Number(employeeId)),
			];

			if (input.status) {
				whereClause.push(eq(leaveApplications.status, input.status as any));
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
				orderBy: (leaveApplications, { desc }) => [
					desc(leaveApplications.startDate),
				],
			});
		}),

	// Dashboard Stats
	getDashboardStats: roleProcedure(["admin", "manager", "hr", "auditor"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const today = new Date().toISOString().split("T")[0];

			const [totalEmployees, presentToday, onLeave, pendingApprovals] =
				await Promise.all([
					db.select({ count: count() }).from(employees),
					db
						.select({ count: count() })
						.from(attendance)
						.where(
							and(eq(attendance.date, today), eq(attendance.status, "present")),
						),
					db
						.select({ count: count() })
						.from(leaveApplications)
						.where(
							and(
								eq(leaveApplications.status, "approved"),
								sql`${leaveApplications.startDate} <= ${today} AND ${leaveApplications.endDate} >= ${today}`,
							),
						),
					db
						.select({ count: count() })
						.from(leaveApplications)
						.where(eq(leaveApplications.status, "pending")),
				]);

			return {
				totalEmployees: totalEmployees[0]?.count || 0,
				presentToday: presentToday[0]?.count || 0,
				onLeave: onLeave[0]?.count || 0,
				pendingApprovals: pendingApprovals[0]?.count || 0,
				payrollPending: 0,
				newHiresThisMonth: 0,
				attritionRate: 0,
				openPositions: 0,
				avgSalary: 0,
			};
		}),
});
