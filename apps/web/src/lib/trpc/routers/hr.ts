import { staff, leaveApplications, enhancedAttendance, payroll, branches } from "@evaluna/db/schema";
import { count, desc, eq, sql, and, ilike } from "drizzle-orm";
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

	getAttendance: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z.object({
				branch_id: z.number().optional(),
				date: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db
				.select({
					id: enhancedAttendance.id,
					employeeId: enhancedAttendance.employeeId,
					employeeName: staff.name,
					date: enhancedAttendance.date,
					checkIn: enhancedAttendance.checkIn,
					checkOut: enhancedAttendance.checkOut,
					status: enhancedAttendance.status,
					workingHours: enhancedAttendance.workingHours,
					breakHours: enhancedAttendance.breakHours,
					lateMinutes: enhancedAttendance.lateMinutes,
					earlyExitMinutes: enhancedAttendance.earlyExitMinutes,
					overtimeMinutes: enhancedAttendance.overtimeMinutes,
					riskScore: enhancedAttendance.riskScore,
					isApproved: enhancedAttendance.isApproved,
				})
				.from(enhancedAttendance)
				.innerJoin(staff, eq(enhancedAttendance.employeeId, staff.id))
				.where(eq(staff.is_deleted, false));

			if (input.branch_id) {
				query = query.where(eq(staff.branch_id, input.branch_id));
			} else {
				// Use the authenticated user's branch if no branch_id is provided
				query = query.where(eq(staff.branch_id, ctx.user.branchId));
			}

			if (input.date) {
				query = query.where(eq(enhancedAttendance.date, input.date));
			} else {
				// Default to today if no date is provided
				query = query.where(eq(enhancedAttendance.date, sql`CURRENT_DATE`));
			}

			const results = await query.orderBy(desc(enhancedAttendance.createdAt)).limit(100);

			return results.map((r) => ({
				id: r.id,
				employee_id: r.employeeId,
				employee_name: r.employeeName || "Unknown",
				date: r.date?.toLocaleDateString() || "",
				check_in: r.checkIn?.toLocaleTimeString() || "",
				check_out: r.checkOut?.toLocaleTimeString() || "",
				status: r.status,
				working_hours: Number(r.workingHours) || 0,
				break_hours: Number(r.breakHours) || 0,
				late_minutes: r.lateMinutes || 0,
				early_exit_minutes: r.earlyExitMinutes || 0,
				overtime_minutes: r.overtimeMinutes || 0,
				risk_score: r.riskScore,
				is_approved: r.isApproved,
			}));
		}),

	getLeaveRequests: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db
				.select({
					id: leaveApplications.id,
					employeeName: staff.name,
					leaveType: leaveTypes.name,
					startDate: leaveApplications.startDate,
					endDate: leaveApplications.endDate,
					reason: leaveApplications.reason,
					status: leaveApplications.status,
					appliedAt: leaveApplications.appliedAt,
					approvedAt: leaveApplications.approvedAt,
					approvedBy: staffApproved.name,
				})
				.from(leaveApplications)
				.innerJoin(staff, eq(leaveApplications.employeeId, staff.id))
				.innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
				.leftJoin(staff as staffApproved, eq(leaveApplications.approvedBy, staffApproved.id))
				.where(eq(staff.is_deleted, false));

			if (input.branch_id) {
				query = query.where(eq(staff.branch_id, input.branch_id));
			} else {
				// Use the authenticated user's branch if no branch_id is provided
				query = query.where(eq(staff.branch_id, ctx.user.branchId));
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

	getSalaryStructure: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db
				.select({
					empId: staff.id,
					empName: staff.name,
					department: staff.department,
					salary: staff.salary,
				})
				.from(staff)
				.where(eq(staff.is_deleted, false));

			if (input.branch_id) {
				query = query.where(eq(staff.branch_id, input.branch_id));
			} else {
				// Use the authenticated user's branch if no branch_id is provided
				query = query.where(eq(staff.branch_id, ctx.user.branchId));
			}

			const results = await query.orderBy(desc(staff.createdAt)).limit(100);

			return results.map((r) => {
				const basic = Number(r.salary) * 0.5;
				const hra = Number(r.salary) * 0.2;
				const allowances = Number(r.salary) * 0.3;
				return {
					emp_name: r.empName || "Unknown",
					department: r.department || "General",
					basic,
					hra,
					allowances,
					deductions: 0,
					pf: 0,
					net_salary: Number(r.salary),
				};
			});
		}),

	getPayroll: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional(), month: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			let query = db
				.select({
					id: payroll.id,
					employeeName: staff.name,
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

	getPerformance: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			// Note: Performance table does not exist in the schema yet.
			// Return empty array until the performance table is implemented.
			return [];
		}),

	getRecruitment: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx, input }) => {
			// Note: Recruitment table does not exist in the schema yet.
			// Return empty array until the recruitment table is implemented.
			return [];
		}),
});