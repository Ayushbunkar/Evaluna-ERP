import { staff, leaveApplications, leaveTypes, employees, enhancedAttendance, payroll, branches } from "@evaluna/db/schema";
import { count, desc, eq, sql, and, ilike, or, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const hrRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId; // Use authenticated user's branch for scoping

			const [
				totalEmployees,
				presentToday,
				onLeaveCount,
				payrollPendingCount,
				newHiresThisMonth,
				avgSalaryData
			] = await Promise.all([
				db.select({ count: count() })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined
						)
					),
				db.select({ count: count() })
					.from(enhancedAttendance)
					.innerJoin(staff, eq(enhancedAttendance.employeeId, staff.id))
					.where(
						and(
							eq(enhancedAttendance.date, sql`CURRENT_DATE`),
							eq(enhancedAttendance.status, 'present'),
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined
						)
					),
				db.select({ count: count() })
					.from(enhancedAttendance)
					.innerJoin(staff, eq(enhancedAttendance.employeeId, staff.id))
					.where(
						and(
							eq(enhancedAttendance.date, sql`CURRENT_DATE`),
							eq(enhancedAttendance.status, 'leave'),
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined
						)
					),
				db.select({ count: count() })
					.from(payroll)
					.where(
						and(
							eq(payroll.month, sql`TO_CHAR(CURRENT_DATE, 'YYYY-MM')`),
							not(eq(payroll.status, 'paid')),
							branchId ? eq(payroll.branch_id, branchId) : undefined
						)
					),
				db.select({ count: count() })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							sql`${staff.join_date} >= DATE_TRUNC('month', CURRENT_DATE)`,
							sql`${staff.join_date} < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
							branchId ? eq(staff.branch_id, branchId) : undefined
						)
					),
				db.select({ avg: sql<number>`AVG(${staff.salary})` })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined
						)
					)
			]);

			const totalEmp = totalEmployees[0]?.count || 0;
			const present = presentToday[0]?.count || 0;
			const onLeave = onLeaveCount[0]?.count || 0;
			const payrollPending = payrollPendingCount[0]?.count || 0;
			const newHires = newHiresThisMonth[0]?.count || 0;
			const avgSalary = avgSalaryData[0]?.avg || 0;

			// Attrition rate: we don't have historical termination data, so set to 0
			// In a real system, we would calculate based on terminations over a period
			const attritionRate = 0;
			// Open positions: we don't have a job openings table, so set to 0
			const openPositions = 0;

			return {
				totalEmployees: totalEmp,
				presentToday: present,
				onLeave: onLeave,
				payrollPending: payrollPending,
				newHiresThisMonth: newHires,
				attritionRate,
				openPositions,
				avgSalary: Number(avgSalary),
			};
		}),

	getEmployees: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z.object({
				branch_id: z.number().optional(),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db
				.select()
				.from(staff)
				.where(eq(staff.is_deleted, false));

			if (input.branch_id) {
				query = query.where(eq(staff.branch_id, input.branch_id));
			} else {
				// Use the authenticated user's branch if no branch_id is provided
				query = query.where(eq(staff.branch_id, ctx.user.branchId));
			}

			if (input.search) {
				const searchTerm = `%${input.search}%`;
				query = query.where(
					and(
						ilike(staff.name, searchTerm),
						ilike(staff.staff_code, searchTerm)
					)
				);
			}

			const results = await query.orderBy(desc(staff.created_at)).limit(100);

			return results.map((r) => ({
				id: r.id,
				emp_code: r.staff_code || `EMP-${r.id}`,
				name: r.name,
				department: r.department || "General",
				role: r.role || "Staff",
				phone: r.phone || "N/A",
				email: r.email || "N/A",
				join_date: r.join_date?.toLocaleDateString() || "",
				salary: Number(r.salary) || 0,
				status: r.status === "active" ? "Active" : "Inactive",
			}));
		}),

	getLeaveRequests: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db
				.select({
					id: leaveApplications.id,
					employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
					leaveType: leaveTypes.name,
					startDate: leaveApplications.startDate,
					endDate: leaveApplications.endDate,
					reason: leaveApplications.reason,
					status: leaveApplications.status,
					appliedAt: leaveApplications.appliedAt,
					approvedAt: leaveApplications.approvedAt,
					approvedBy: sql<string>`${employees_approved.firstName} || ' ' || ${employees_approved.lastName}`,
				})
				.from(leaveApplications)
				.innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
				.innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
				.leftJoin(employees as employees_approved, eq(leaveApplications.approvedBy, employees_approved.id))
				.where(eq(employees.status, 'active'));

			if (input.branch_id) {
				query = query.where(eq(employees.branchId, input.branch_id));
			} else {
				// Use the authenticated user's branch if no branch_id is provided
				query = query.where(eq(employees.branchId, ctx.user.branchId));
			}

			const results = await query.orderBy(desc(leaveApplications.createdAt)).limit(50);

			return results.map((r) => ({
				id: r.id,
				emp_name: r.employeeName || "Unknown",
				leave_type: r.leaveType || "Unknown",
				start_date: r.startDate?.toLocaleDateString() || "",
				end_date: r.endDate?.toLocaleDateString() || "",
				reason: r.reason || "",
				status: r.status,
				applied_at: r.appliedAt?.toLocaleDateString() || "",
				approved_at: r.approvedAt?.toLocaleDateString() || "",
				approved_by: r.approvedBy || "Unknown",
			}));
		}),

	createLeaveRequest: roleProcedure(["admin", "manager", "hr"])
		.input(
			z.object({
				employeeId: z.number(),
				leaveTypeId: z.number(),
				startDate: z.date(),
				endDate: z.date(),
				reason: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// Validate that the employee exists and is active
			const employee = await db
				.select()
				.from(employees)
				.where(
					and(
						eq(employees.id, input.employeeId),
						eq(employees.status, 'active')
					)
				)
				.limit(1);

			if (!employee.length) {
				throw new Error("Employee not found or inactive");
			}

			// Validate that the leave type exists
			const leaveType = await db
				.select()
				.from(leaveTypes)
				.where(eq(leaveTypes.id, input.leaveTypeId))
				.limit(1);

			if (!leaveType.length) {
				throw new Error("Leave type not found");
			}

			// Validate dates
			if (input.startDate > input.endDate) {
				throw new Error("Start date must be before or equal to end date");
			}

			// Check for overlapping leave requests
			const overlappingLeave = await db
				.select({ count: count() })
				.from(leaveApplications)
				.where(
					and(
						eq(leaveApplications.employeeId, input.employeeId),
						eq(leaveApplications.status, 'pending'), // Only check pending leaves
						or(
							and(
								gte(leaveApplications.startDate, input.startDate),
								lte(leaveApplications.startDate, input.endDate)
							),
							and(
								gte(leaveApplications.endDate, input.startDate),
								lte(leaveApplications.endDate, input.endDate)
							),
							and(
								lte(leaveApplications.startDate, input.startDate),
								gte(leaveApplications.endDate, input.endDate)
							)
						)
					)
				);

			if (overlappingLeave[0]?.count > 0) {
				throw new Error("Leave request overlaps with existing pending leave");
			}

			// Create the leave request
			const [result] = await db
				.insert(leaveApplications)
				.values({
					employeeId: input.employeeId,
					leaveTypeId: input.leaveTypeId,
					startDate: input.startDate,
					endDate: input.endDate,
					reason: input.reason,
					status: 'pending',
				})
				.returning();

			return {
				id: result.id,
				message: "Leave request created successfully",
			};
		}),

	updateLeaveRequest: roleProcedure(["admin", "manager", "hr"])
		.input(
			z.object({
				leaveId: z.number(),
				status: z.enum(['approved', 'rejected', 'cancelled']),
				approvedBy: z.number(), // ID of the approver (HR/manager)
				approvedAt: z.date().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// Get the leave request
			const leaveRequest = await db
				.select({
					id: leaveApplications.id,
					employeeId: leaveApplications.employeeId,
					status: leaveApplications.status,
					startDate: leaveApplications.startDate,
					endDate: leaveApplications.endDate,
				})
				.from(leaveApplications)
				.where(eq(leaveApplications.id, input.leaveId))
				.limit(1);

			if (!leaveRequest.length) {
				throw new Error("Leave request not found");
			}

			const leave = leaveRequest[0];

			// Validate that the leave request is in a state that can be updated
			if (leave.status !== 'pending') {
				throw new Error("Only pending leave requests can be updated");
			}

			// Validate that the approver exists and is active
			const approver = await db
				.select()
				.from(employees)
				.where(
					and(
						eq(employees.id, input.approvedBy),
						eq(employees.status, 'active')
					)
				)
				.limit(1);

			if (!approver.length) {
				throw new Error("Approver not found or inactive");
			}

			// Update the leave request
			const [result] = await db
				.update(leaveApplications)
				.set({
					status: input.status,
					approvedBy: input.approvedBy,
					approvedAt: input.approvedAt ?? new Date(),
				})
				.where(eq(leaveApplications.id, input.leaveId))
				.returning();

			// If leave is approved, create attendance records for the leave period
			if (input.status === 'approved') {
				await createAttendanceForLeavePeriod(
					db,
					leave.employeeId,
					leave.startDate,
					leave.endDate
				);
			}

			return {
				id: result.id,
				message: `Leave request ${input.status} successfully`,
			};
		}),

	deleteLeaveRequest: roleProcedure(["admin", "manager", "hr"])
		.input(z.object({ leaveId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// Check if leave request exists and is pending (can only delete pending requests)
			const leaveRequest = await db
				.select({
					id: leaveApplications.id,
					status: leaveApplications.status,
				})
				.from(leaveApplications)
				.where(eq(leaveApplications.id, input.leaveId))
				.limit(1);

			if (!leaveRequest.length) {
				throw new Error("Leave request not found");
			}

			if (leaveRequest[0].status !== 'pending') {
				throw new Error("Only pending leave requests can be deleted");
			}

			// Delete the leave request
			await db
				.delete(leaveApplications)
				.where(eq(leaveApplications.id, input.leaveId));

			return {
				message: "Leave request deleted successfully",
			};
		}),

	getPayroll: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional(), month: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db
				.select({
					id: payroll.id,
					employeeName: sql<string>`${staff.name}`,
					month: payroll.month,
					baseSalary: payroll.base_salary,
					overtimePay: payroll.overtime_pay,
					bonus: payroll.bonus,
					deductions: payroll.deductions,
					advanceDeduction: payroll.advance_deduction,
					netPayable: payroll.net_payable,
					status: payroll.status,
					paymentDate: payroll.payment_date,
				})
				.from(payroll)
				.innerJoin(staff, eq(payroll.staff_id, staff.id))
				.where(eq(staff.is_deleted, false));

			if (input.branch_id) {
				query = query.where(eq(staff.branch_id, input.branch_id));
			} else {
				// Use the authenticated user's branch if no branch_id is provided
				query = query.where(eq(staff.branch_id, ctx.user.branchId));
			}

			if (input.month) {
				query = query.where(eq(payroll.month, input.month));
			} else {
				// Default to current month if no month is provided
				query = query.where(eq(payroll.month, sql`TO_CHAR(CURRENT_DATE, 'YYYY-MM')`));
			}

			const results = await query.orderBy(desc(payroll.createdAt)).limit(50);

			return results.map((r) => ({
				id: r.id,
				employee_name: r.employeeName || "Unknown",
				month: r.month,
				base_salary: Number(r.baseSalary) || 0,
				overtime_pay: Number(r.overtimePay) || 0,
				bonus: Number(r.bonus) || 0,
				deductions: Number(r.deductions) || 0,
				advance_deduction: Number(r.advanceDeduction) || 0,
				net_payable: Number(r.netPayable) || 0,
				status: r.status,
				payment_date: r.paymentDate?.toLocaleDateString() || "",
			}));
		}),

	// TODO: Add payroll processing procedures in a follow-up implementation
});

/**
 * Helper function to create attendance records for a leave period
 */
async function createAttendanceForLeavePeriod(
	db: any,
	employeeId: number,
	startDate: Date,
	endDate: Date
) {
	const currentDate = new Date(startDate);
	const endDateObj = new Date(endDate);

	while (currentDate <= endDateObj) {
		// Skip weekends if needed (this depends on company policy)
		// For now, we'll mark all days as leave
		const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

		// Check if attendance record already exists for this date
		const existingAttendance = await db
			.select()
			.from(enhancedAttendance)
			.where(
				and(
					eq(enhancedAttendance.employeeId, employeeId),
					eq(enhancedAttendance.date, dateString)
				)
			)
			.limit(1);

		if (!existingAttendance.length) {
			// Create new attendance record
			await db
				.insert(enhancedAttendance)
				.values({
					employeeId: employeeId,
					date: dateString,
					status: 'leave',
					checkIn: null,
					checkOut: null,
					workingHours: 0,
					breakHours: 0,
					lateMinutes: 0,
					earlyExitMinutes: 0,
					overtimeMinutes: 0,
					riskScore: 0,
					isApproved: true, // Leave is approved by definition
				});
		} else {
			// Update existing record to mark as leave
			await db
				.update(enhancedAttendance)
				.set({
					status: 'leave',
					isApproved: true,
				})
				.where(
					and(
						eq(enhancedAttendance.employeeId, employeeId),
						eq(enhancedAttendance.date, dateString)
					)
				);
		}

		// Increment date by 1 day
		currentDate.setDate(currentDate.getDate() + 1);
	}
}