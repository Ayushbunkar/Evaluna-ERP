import {
	approvals,
	attachments,
	attendanceBreaks,
	auditLogs,
	branches,
	departments,
	designations,
	employeeShifts,
	employees,
	enhancedAttendance,
	holidays,
	leaveApplications,
	leaveTypes,
	payroll,
	shifts,
	staff,
	user,
	weekOffs,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import {
	aliasedTable,
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNull,
	lte,
	ne,
	not,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import {
	ADJUSTMENT_CATEGORIES,
	DEFAULT_SHIFT_RULE,
	evaluateAttendance,
	formatTime12h,
	minutesToFormattedHours,
	timeStringToMinutes,
} from "@/lib/attendance-engine";
import { protectedProcedure, roleProcedure, router } from "../init";
import { logAudit, resolveStaffId } from "../util/audit";

export const hrRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const branchId = ctx.user.branchId; // Use authenticated user's branch for scoping

			const [counts] = await db.execute<{
				total_employees: number;
				present_today: number;
				on_leave: number;
				payroll_pending: number;
				new_hires: number;
				avg_salary: string;
			}>(sql`
				SELECT
					(SELECT coalesce(count(*), 0)::int FROM staff WHERE is_deleted = false ${branchId ? sql`AND branch_id = ${branchId}` : sql``}) AS total_employees,
					(SELECT coalesce(count(*), 0)::int FROM enhanced_attendance ea
					 INNER JOIN employees e ON ea.employee_id = e.id
					 INNER JOIN staff s ON e.email = s.email
					 WHERE ea.date = CURRENT_DATE AND ea.status = 'present' AND s.is_deleted = false ${branchId ? sql`AND s.branch_id = ${branchId}` : sql``}) AS present_today,
					(SELECT coalesce(count(*), 0)::int FROM enhanced_attendance ea
					 INNER JOIN employees e ON ea.employee_id = e.id
					 INNER JOIN staff s ON e.email = s.email
					 WHERE ea.date = CURRENT_DATE AND ea.status = 'leave' AND s.is_deleted = false ${branchId ? sql`AND s.branch_id = ${branchId}` : sql``}) AS on_leave,
					(SELECT coalesce(count(*), 0)::int FROM payroll WHERE month = TO_CHAR(CURRENT_DATE, 'YYYY-MM') AND status != 'paid' ${branchId ? sql`AND branch_id = ${branchId}` : sql``}) AS payroll_pending,
					(SELECT coalesce(count(*), 0)::int FROM staff WHERE is_deleted = false AND join_date >= DATE_TRUNC('month', CURRENT_DATE) AND join_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' ${branchId ? sql`AND branch_id = ${branchId}` : sql``}) AS new_hires,
					(SELECT coalesce(avg(salary), 0) FROM staff WHERE is_deleted = false ${branchId ? sql`AND branch_id = ${branchId}` : sql``}) AS avg_salary
			`);

			const totalEmp = Number(counts?.total_employees || 0);
			const present = Number(counts?.present_today || 0);
			const onLeave = Number(counts?.on_leave || 0);
			const payrollPending = Number(counts?.payroll_pending || 0);
			const newHires = Number(counts?.new_hires || 0);
			const avgSalary = Number(counts?.avg_salary || 0);

			const attritionRate = 0;
			const openPositions = 0;

			return {
				totalEmployees: totalEmp,
				presentToday: present,
				onLeave: onLeave,
				payrollPending: payrollPending,
				newHiresThisMonth: newHires,
				attritionRate,
				openPositions,
				avgSalary,
			};
		}),

	getEmployees: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			try {
				const isSuperAdmin = Boolean(
					ctx.user.isSuperadmin || ctx.user.role === "super_admin",
				);
				const effectiveBranchId = isSuperAdmin
					? input?.branch_id
					: ctx.user.branchId
						? Number(ctx.user.branchId)
						: input?.branch_id;

				const conditions = [eq(staff.is_deleted, false)];
				if (effectiveBranchId !== undefined && effectiveBranchId !== null) {
					conditions.push(eq(staff.branch_id, effectiveBranchId));
				}

				if (input?.search?.trim()) {
					const searchTerm = `%${input.search.trim()}%`;
					conditions.push(
						or(
							ilike(staff.name, searchTerm),
							ilike(staff.staff_code, searchTerm),
							ilike(staff.email, searchTerm),
							ilike(staff.phone, searchTerm),
						)!,
					);
				}

				const results = await db
					.select({
						id: staff.id,
						staff_code: staff.staff_code,
						name: staff.name,
						department: staff.department,
						role: staff.role,
						phone: staff.phone,
						email: staff.email,
						join_date: staff.join_date,
						salary: staff.salary,
						status: staff.status,
						branch_id: staff.branch_id,
						userImage: user.image,
					})
					.from(staff)
					.leftJoin(user, eq(staff.email, user.email))
					.where(and(...conditions))
					.orderBy(desc(staff.created_at))
					.limit(100);

				return results.map((r) => ({
					id: r.id,
					emp_code: r.staff_code || `EMP-${r.id}`,
					name: r.name,
					department: r.department || "General",
					role: r.role || "Staff",
					phone: r.phone || "N/A",
					email: r.email || "N/A",
					join_date: r.join_date
						? new Date(r.join_date).toLocaleDateString()
						: "",
					salary: Number(r.salary) || 0,
					status: r.status || "active",
					branch_id: r.branch_id,
					image: r.userImage || null,
					userImage: r.userImage || null,
				}));
			} catch (err: any) {
				console.error("Error in getEmployees:", err);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch employees",
				});
			}
		}),

	getLeaveRequests: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			try {
				const employeesApproved = aliasedTable(employees, "employees_approved");

				let query = db
					.select({
						id: leaveApplications.id,
						employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
						leaveType: leaveTypes.name,
						startDate: leaveApplications.startDate,
						endDate: leaveApplications.endDate,
						reason: leaveApplications.reason,
						status: leaveApplications.status,
						managerApproved: leaveApplications.managerApproved,
						appliedAt: leaveApplications.createdAt,
						approvedAt: leaveApplications.approvedAt,
						approvedBy: sql<string>`COALESCE(${employeesApproved.firstName} || ' ' || ${employeesApproved.lastName}, 'N/A')`,
					})
					.from(leaveApplications)
					.leftJoin(employees, eq(leaveApplications.employeeId, employees.id))
					.leftJoin(
						leaveTypes,
						eq(leaveApplications.leaveTypeId, leaveTypes.id),
					)
					.leftJoin(
						employeesApproved,
						eq(leaveApplications.approvedBy, employeesApproved.id),
					)
					.leftJoin(staff, eq(employees.email, staff.email));

				if (input?.branch_id) {
					query = query.where(eq(staff.branch_id, input.branch_id));
				} else if (ctx.user.branchId) {
					query = query.where(eq(staff.branch_id, ctx.user.branchId));
				}

				const results = await query
					.orderBy(desc(leaveApplications.createdAt))
					.limit(50);

				return results.map((r) => ({
					id: r.id,
					emp_name: r.employeeName || "Unknown",
					leave_type: r.leaveType || "General Leave",
					start_date: r.startDate
						? new Date(r.startDate).toLocaleDateString()
						: "",
					end_date: r.endDate ? new Date(r.endDate).toLocaleDateString() : "",
					reason: r.reason || "",
					status: r.status || "pending",
					manager_approved: Boolean(r.managerApproved),
					applied_at: r.appliedAt
						? new Date(r.appliedAt).toLocaleDateString()
						: "",
					approved_at: r.approvedAt
						? new Date(r.approvedAt).toLocaleDateString()
						: "",
					approved_by: r.approvedBy || "N/A",
				}));
			} catch (err) {
				console.error("Error fetching leave requests:", err);
				return [];
			}
		}),

	getLeaveTypes: roleProcedure(["admin", "manager", "auditor", "hr"]).query(
		async ({ ctx }) => {
			const db = ctx.db;
			let types = await db.select().from(leaveTypes);
			if (types.length === 0) {
				// Seed default leave types if table is empty
				await db.insert(leaveTypes).values([
					{ name: "Casual Leave", code: "CL", maxDays: 12, isPaid: true },
					{ name: "Sick Leave", code: "SL", maxDays: 10, isPaid: true },
					{
						name: "Earned / Annual Leave",
						code: "EL",
						maxDays: 15,
						isPaid: true,
					},
					{
						name: "Maternity / Paternity Leave",
						code: "ML",
						maxDays: 90,
						isPaid: true,
					},
					{
						name: "Unpaid / Loss of Pay",
						code: "LOP",
						maxDays: 30,
						isPaid: false,
					},
				]);
				types = await db.select().from(leaveTypes);
			}
			return types;
		},
	),

	createLeaveRequest: roleProcedure(["admin", "manager", "hr"])
		.input(
			z.object({
				employeeId: z.number(),
				leaveTypeId: z.number(),
				startDate: z.string(), // YYYY-MM-DD
				endDate: z.string(), // YYYY-MM-DD
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;
			const startDateObj = new Date(input.startDate);
			const endDateObj = new Date(input.endDate);

			if (startDateObj > endDateObj) {
				throw new Error("Start date must be before or equal to end date");
			}

			// Sync staff -> employee to satisfy foreign keys
			const [staffRecord] = await db
				.select()
				.from(staff)
				.where(eq(staff.id, input.employeeId))
				.limit(1);

			if (!staffRecord) throw new Error("Staff not found");

			let [employeeRecord] = await db
				.select()
				.from(employees)
				.where(eq(employees.email, staffRecord.email))
				.limit(1);

			if (!employeeRecord) {
				[employeeRecord] = await db
					.insert(employees)
					.values({
						employeeCode: staffRecord.staff_code || `EMP-${Date.now()}`,
						firstName: staffRecord.name.split(" ")[0] || "Unknown",
						lastName:
							staffRecord.name.split(" ").slice(1).join(" ") || "Employee",
						email: staffRecord.email,
						hireDate: staffRecord.join_date
							? new Date(staffRecord.join_date).toISOString().split("T")[0]
							: new Date().toISOString().split("T")[0],
						status: staffRecord.status === "active" ? "active" : "inactive",
						userUid: `sync-${staffRecord.id}`,
					})
					.returning();
			}

			// Create the leave request in leave_applications
			const [result] = await db
				.insert(leaveApplications)
				.values({
					employeeId: employeeRecord.id,
					leaveTypeId: input.leaveTypeId,
					startDate: input.startDate,
					endDate: input.endDate,
					reason: input.reason || "Applied via HR System",
					status: "pending",
				})
				.returning();

			// Also create pending entry in approvals table for manager/HR inbox visibility
			await db.insert(approvals).values({
				reference_type: "leave",
				reference_id: result.id,
				requested_by: staffRecord.id, // approvals likely uses staff id
				status: "pending",
				created_at: new Date(),
			});

			return {
				id: result.id,
				message: "Leave request created successfully",
			};
		}),

	updateLeaveRequest: roleProcedure(["admin", "manager", "hr"])
		.input(
			z.object({
				leaveId: z.number(),
				status: z.enum(["approved", "rejected", "cancelled"]),
				approvedBy: z.number().optional(), // ID of the approver (HR/manager)
				approvedAt: z.date().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// Get the leave request
			const leaveRequest = await db
				.select({
					id: leaveApplications.id,
					employeeId: leaveApplications.employeeId,
					status: leaveApplications.status,
					managerApproved: leaveApplications.managerApproved,
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

			// Ensure manager has approved before HR can approve
			const isManager = ctx.user.role === "manager";
			const isAdmin =
				ctx.user.role === "admin" ||
				ctx.user.role === "super_admin" ||
				Boolean(ctx.user.isSuperadmin);

			if (
				input.status === "approved" &&
				!leave.managerApproved &&
				!isAdmin &&
				!isManager
			) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message:
						"Manager approval required before HR can approve this leave request.",
				});
			}

			// Validate that the leave request is in a state that can be updated
			if (leave.status !== "pending") {
				throw new Error("Only pending leave requests can be updated");
			}

			let approverId = input.approvedBy;
			if (!approverId) {
				// Find staff record for current user
				const [staffMember] = await db
					.select()
					.from(staff)
					.where(eq(staff.email, ctx.user.email))
					.limit(1);

				if (staffMember) {
					// Get or sync employee record for this staff
					let [employeeRecord] = await db
						.select()
						.from(employees)
						.where(eq(employees.email, staffMember.email))
						.limit(1);

					if (!employeeRecord) {
						[employeeRecord] = await db
							.insert(employees)
							.values({
								employeeCode: staffMember.staff_code || `EMP-${Date.now()}`,
								firstName: staffMember.name.split(" ")[0] || "Unknown",
								lastName:
									staffMember.name.split(" ").slice(1).join(" ") || "Employee",
								email: staffMember.email,
								hireDate: staffMember.join_date
									? new Date(staffMember.join_date).toISOString().split("T")[0]
									: new Date().toISOString().split("T")[0],
								status: staffMember.status === "active" ? "active" : "inactive",
								userUid: `sync-${staffMember.id}`,
							})
							.returning();
					}
					approverId = employeeRecord.id;
				} else {
					approverId = 1; // Fallback
				}
			}

			// Update the leave request
			const [result] = await db
				.update(leaveApplications)
				.set({
					status: input.status,
					managerApproved:
						input.status === "approved" ? true : leave.managerApproved,
					approvedBy: approverId,
					approvedAt: input.approvedAt ?? new Date(),
				})
				.where(eq(leaveApplications.id, input.leaveId))
				.returning();

			// If leave is approved, create attendance records for the leave period
			if (input.status === "approved") {
				await createAttendanceForLeavePeriod(
					db,
					leave.employeeId,
					leave.startDate,
					leave.endDate,
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

			if (leaveRequest[0].status !== "pending") {
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
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					month: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			try {
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

				if (input?.branch_id) {
					query = query.where(eq(staff.branch_id, input.branch_id));
				} else if (ctx.user.branchId) {
					// Use the authenticated user's branch if no branch_id is provided
					query = query.where(eq(staff.branch_id, ctx.user.branchId));
				}

				if (input?.month) {
					query = query.where(eq(payroll.month, input.month));
				}

				const results = await query.orderBy(desc(payroll.created_at)).limit(50);

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
					payment_date: r.paymentDate
						? new Date(r.paymentDate).toLocaleDateString()
						: "",
				}));
			} catch (err) {
				console.error("Error in getPayroll:", err);
				return [];
			}
		}),

	getAttendanceRecords: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					department: z.string().optional(),
					date: z.string().optional(),
					search: z.string().optional(),
					status: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			try {
				const targetDate =
					input?.date || new Date().toISOString().split("T")[0];
				const isSuperAdmin = Boolean(
					ctx.user.isSuperadmin ||
						(ctx.user as any).role === "super_admin" ||
						(ctx.user as any).roles?.includes("super_admin"),
				);
				const effectiveBranchId = isSuperAdmin
					? input?.branch_id
					: ctx.user.branchId
						? Number(ctx.user.branchId)
						: input?.branch_id;

				// 1. Check holiday on targetDate
				const [holiday] = await db
					.select()
					.from(holidays)
					.where(eq(holidays.date, targetDate))
					.limit(1);

				// 2. Fetch default active shift
				const defaultShifts = await db
					.select()
					.from(shifts)
					.where(eq(shifts.isActive, true))
					.limit(1);
				const defaultShift = defaultShifts[0] || null;

				// 3. Build staff conditions
				const conditions = [eq(staff.is_deleted, false)];
				if (effectiveBranchId != null) {
					conditions.push(eq(staff.branch_id, effectiveBranchId));
				}
				if (input?.department && input.department !== "all") {
					conditions.push(eq(staff.department, input.department));
				}
				if (input?.search?.trim()) {
					const searchTerm = `%${input.search.trim().toLowerCase()}%`;
					conditions.push(
						or(
							ilike(staff.name, searchTerm),
							ilike(staff.email, searchTerm),
							ilike(staff.staff_code, searchTerm),
						)!,
					);
				}

				// 4. Query staff with canonical user photo, employee link, attendance on target date, and shift
				const rows = await db
					.select({
						staffId: staff.id,
						staffName: staff.name,
						staffEmail: staff.email,
						staffCode: staff.staff_code,
						staffDepartment: staff.department,
						staffRole: staff.role,
						branchId: staff.branch_id,
						userImage: user.image, // CANONICAL PHOTO ONLY (no duplicate storage)
						employeeId: employees.id,
						attendanceId: enhancedAttendance.id,
						attendanceDate: enhancedAttendance.date,
						checkIn: enhancedAttendance.checkIn,
						checkOut: enhancedAttendance.checkOut,
						checkInSelfie: enhancedAttendance.checkInSelfie,
						checkOutSelfie: enhancedAttendance.checkOutSelfie,
						dbStatus: enhancedAttendance.status,
						workingHours: enhancedAttendance.workingHours,
						breakHours: enhancedAttendance.breakHours,
						lateMinutes: enhancedAttendance.lateMinutes,
						earlyExitMinutes: enhancedAttendance.earlyExitMinutes,
						isAdjusted: enhancedAttendance.isAdjusted,
						originalCheckIn: enhancedAttendance.originalCheckIn,
						originalCheckOut: enhancedAttendance.originalCheckOut,
						adjustmentReason: enhancedAttendance.adjustmentReason,
						adjustmentCategory: enhancedAttendance.adjustmentCategory,
						adjustedBy: enhancedAttendance.adjustedBy,
						adjustedAt: enhancedAttendance.adjustedAt,
						isApproved: enhancedAttendance.isApproved,
						notes: enhancedAttendance.notes,
						shiftName: shifts.name,
						shiftStartTime: shifts.startTime,
						shiftEndTime: shifts.endTime,
						shiftGraceTime: shifts.graceTime,
						shiftLunchDuration: shifts.lunchDuration,
					})
					.from(staff)
					.leftJoin(employees, eq(staff.email, employees.email))
					.leftJoin(
						user,
						or(eq(staff.email, user.email), eq(user.staff_id, staff.id)),
					)
					.leftJoin(
						enhancedAttendance,
						and(
							eq(enhancedAttendance.employeeId, employees.id),
							eq(enhancedAttendance.date, targetDate),
						),
					)
					.leftJoin(
						employeeShifts,
						and(
							eq(employeeShifts.employeeId, employees.id),
							lte(employeeShifts.effectiveFrom, targetDate),
							or(
								isNull(employeeShifts.effectiveTo),
								gte(employeeShifts.effectiveTo, targetDate),
							),
						),
					)
					.leftJoin(shifts, eq(shifts.id, employeeShifts.shiftId))
					.where(and(...conditions))
					.orderBy(staff.name);

				// Extract and resolve selfie attachment IDs concurrently
				const attachmentIds = new Set<number>();
				for (const r of rows) {
					const checkInSelfieObj = r.checkInSelfie as any;
					const checkOutSelfieObj = r.checkOutSelfie as any;
					const inId =
						typeof checkInSelfieObj === "object" && checkInSelfieObj !== null
							? checkInSelfieObj.attachmentId || checkInSelfieObj.id || null
							: typeof checkInSelfieObj === "number" ||
									typeof checkInSelfieObj === "string"
								? Number(checkInSelfieObj) || null
								: null;
					const outId =
						typeof checkOutSelfieObj === "object" && checkOutSelfieObj !== null
							? checkOutSelfieObj.attachmentId || checkOutSelfieObj.id || null
							: typeof checkOutSelfieObj === "number" ||
									typeof checkOutSelfieObj === "string"
								? Number(checkOutSelfieObj) || null
								: null;

					if (inId && !Number.isNaN(inId)) attachmentIds.add(inId);
					if (outId && !Number.isNaN(outId)) attachmentIds.add(outId);
				}

				const attachmentDataMap = new Map<number, string>();
				if (attachmentIds.size > 0) {
					const attachmentRecords = await db
						.select({
							id: attachments.id,
							file_data: attachments.file_data,
							mime_type: attachments.mime_type,
						})
						.from(attachments)
						.where(inArray(attachments.id, Array.from(attachmentIds)));

					for (const rec of attachmentRecords) {
						if (rec.file_data) {
							const mime = rec.mime_type || "image/jpeg";
							attachmentDataMap.set(
								rec.id,
								`data:${mime};base64,${rec.file_data}`,
							);
						}
					}
				}

				// 5. Query approved leave applications on target date
				const leavesOnDate = await db
					.select({
						employeeId: leaveApplications.employeeId,
						leaveTypeName: leaveTypes.name,
					})
					.from(leaveApplications)
					.leftJoin(
						leaveTypes,
						eq(leaveApplications.leaveTypeId, leaveTypes.id),
					)
					.where(
						and(
							lte(leaveApplications.startDate, targetDate),
							gte(leaveApplications.endDate, targetDate),
							eq(leaveApplications.status, "approved"),
						),
					);

				const leaveMap = new Map<number, string>();
				for (const l of leavesOnDate) {
					if (l.employeeId) {
						leaveMap.set(l.employeeId, l.leaveTypeName || "Approved Leave");
					}
				}

				// Weekly off check (e.g. Sunday)
				const targetDayOfWeek = new Date(targetDate).getDay();
				const isSunday = targetDayOfWeek === 0;

				// 6. Evaluate each record using the centralized attendance engine
				const evaluatedRecords = rows.map((r: any) => {
					const hasLeave = r.employeeId ? leaveMap.has(r.employeeId) : false;
					const leaveType = r.employeeId
						? leaveMap.get(r.employeeId) || null
						: null;

					const shiftRule = {
						name: r.shiftName || defaultShift?.name || DEFAULT_SHIFT_RULE.name,
						startTime:
							r.shiftStartTime ||
							defaultShift?.startTime ||
							DEFAULT_SHIFT_RULE.startTime,
						endTime:
							r.shiftEndTime ||
							defaultShift?.endTime ||
							DEFAULT_SHIFT_RULE.endTime,
						graceTimeMinutes:
							r.shiftGraceTime ??
							defaultShift?.graceTime ??
							DEFAULT_SHIFT_RULE.graceTimeMinutes,
						minFullDayMinutes: DEFAULT_SHIFT_RULE.minFullDayMinutes,
						minHalfDayMinutes: DEFAULT_SHIFT_RULE.minHalfDayMinutes,
					};

					const evalResult = evaluateAttendance({
						date: targetDate,
						checkIn: r.checkIn,
						checkOut: r.checkOut,
						breakMinutes: r.breakHours
							? Math.round(Number(r.breakHours) * 60)
							: 0,
						shift: shiftRule,
						isLeave: hasLeave,
						leaveType,
						isHoliday: Boolean(holiday),
						holidayName: holiday?.name,
						isWeeklyOff: isSunday,
						isAdjusted: Boolean(r.isAdjusted),
						isApproved: r.isApproved !== false,
					});

					const empCode =
						r.staffCode ||
						(r.employeeId ? `EMP-${r.employeeId}` : `STAFF-${r.staffId}`);
					const checkInFmt = r.checkIn ? formatTime12h(r.checkIn) : null;
					const checkOutFmt = r.checkOut ? formatTime12h(r.checkOut) : null;
					const origCheckInFmt = r.originalCheckIn
						? formatTime12h(r.originalCheckIn)
						: null;
					const origCheckOutFmt = r.originalCheckOut
						? formatTime12h(r.originalCheckOut)
						: null;

					const shiftTimings = `${formatTime12h(shiftRule.startTime)} - ${formatTime12h(shiftRule.endTime)}`;

					const checkInSelfieObj = r.checkInSelfie as any;
					const checkOutSelfieObj = r.checkOutSelfie as any;
					const selfieAttachmentId =
						typeof checkInSelfieObj === "object" && checkInSelfieObj !== null
							? checkInSelfieObj.attachmentId || checkInSelfieObj.id || null
							: typeof checkInSelfieObj === "number" ||
									typeof checkInSelfieObj === "string"
								? Number(checkInSelfieObj) || null
								: null;
					const checkOutSelfieAttachmentId =
						typeof checkOutSelfieObj === "object" && checkOutSelfieObj !== null
							? checkOutSelfieObj.attachmentId || checkOutSelfieObj.id || null
							: typeof checkOutSelfieObj === "number" ||
									typeof checkOutSelfieObj === "string"
								? Number(checkOutSelfieObj) || null
								: null;

					const checkInSelfieUrl = selfieAttachmentId
						? attachmentDataMap.get(selfieAttachmentId) ||
							`/api/attendance/attachments/${selfieAttachmentId}`
						: null;
					const checkOutSelfieUrl = checkOutSelfieAttachmentId
						? attachmentDataMap.get(checkOutSelfieAttachmentId) ||
							`/api/attendance/attachments/${checkOutSelfieAttachmentId}`
						: null;

					return {
						id: r.attendanceId,
						staffId: r.staffId,
						employeeId: r.employeeId || r.staffId,
						name: r.staffName,
						emp_name: r.staffName, // reports page compatibility
						employee_name: r.staffName, // backward compatibility
						email: r.staffEmail,
						employeeCode: empCode,
						department: r.staffDepartment || "General",
						role: r.staffRole || "Staff",
						photoUrl: r.userImage || null, // CANONICAL PROFILE PHOTO
						date: targetDate,
						checkIn: r.checkIn,
						check_in: checkInFmt, // backward compatibility
						checkInFormatted: checkInFmt,
						checkOut: r.checkOut,
						check_out: checkOutFmt, // backward compatibility
						checkOutFormatted: checkOutFmt,
						selfieAttachmentId,
						checkOutSelfieAttachmentId,
						checkInSelfieUrl,
						checkOutSelfieUrl,
						workingMinutes: evalResult.workingMinutes,
						workingHours: Number((evalResult.workingMinutes / 60).toFixed(2)),
						workingHoursFormatted: evalResult.workingHoursFormatted,
						breakHours: r.breakHours ? Number(r.breakHours) : 0,
						status: evalResult.status,
						statusLabel: evalResult.statusLabel,
						dbStatus: evalResult.dbStatus,
						isLate: evalResult.isLate,
						lateMinutes: evalResult.lateMinutes,
						isEarlyDeparture: evalResult.isEarlyDeparture,
						earlyDepartureMinutes: evalResult.earlyDepartureMinutes,
						isAdjusted: Boolean(r.isAdjusted),
						originalCheckIn: r.originalCheckIn,
						originalCheckInFormatted: origCheckInFmt,
						originalCheckOut: r.originalCheckOut,
						originalCheckOutFormatted: origCheckOutFmt,
						adjustmentCategory: r.adjustmentCategory,
						adjustmentReason: r.adjustmentReason,
						adjustedBy: r.adjustedBy,
						adjustedAt: r.adjustedAt,
						isApproved: evalResult.isApproved,
						shiftName: shiftRule.name,
						shiftTimings,
						notes: r.notes,
					};
				});

				// Optional filter by status
				if (input?.status && input.status !== "all") {
					const s = input.status.toUpperCase();
					return evaluatedRecords.filter((rec: any) => {
						if (s === "PRESENT")
							return (
								rec.status === "FULL_DAY" ||
								rec.status === "LATE" ||
								rec.status === "EARLY_DEPARTURE"
							);
						if (s === "ABSENT") return rec.status === "ABSENT";
						if (s === "LATE") return rec.isLate;
						if (s === "HALF_DAY") return rec.status === "HALF_DAY";
						if (s === "LEAVE") return rec.status === "LEAVE";
						if (s === "ADJUSTED") return rec.isAdjusted;
						if (s === "INCOMPLETE") return rec.status === "INCOMPLETE";
						return rec.status === s;
					});
				}

				return evaluatedRecords;
			} catch (err) {
				console.error("Error in getAttendanceRecords:", err);
				return [];
			}
		}),

	getAttendanceSummary: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z
				.object({
					branch_id: z.number().optional(),
					department: z.string().optional(),
					date: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const targetDate = input?.date || new Date().toISOString().split("T")[0];
			const isSuperAdmin = Boolean(
				ctx.user.isSuperadmin ||
					(ctx.user as any).role === "super_admin" ||
					(ctx.user as any).roles?.includes("super_admin"),
			);
			const effectiveBranchId = isSuperAdmin
				? input?.branch_id
				: ctx.user.branchId
					? Number(ctx.user.branchId)
					: input?.branch_id;

			const conditions = [eq(staff.is_deleted, false)];
			if (effectiveBranchId != null) {
				conditions.push(eq(staff.branch_id, effectiveBranchId));
			}
			if (input?.department && input.department !== "all") {
				conditions.push(eq(staff.department, input.department));
			}

			const staffList = await db
				.select({ id: staff.id, email: staff.email })
				.from(staff)
				.where(and(...conditions));

			const totalStaff = staffList.length;

			const attRows = await db
				.select({
					id: enhancedAttendance.id,
					status: enhancedAttendance.status,
					lateMinutes: enhancedAttendance.lateMinutes,
					earlyExitMinutes: enhancedAttendance.earlyExitMinutes,
					checkIn: enhancedAttendance.checkIn,
					checkOut: enhancedAttendance.checkOut,
					isAdjusted: enhancedAttendance.isAdjusted,
				})
				.from(enhancedAttendance)
				.where(eq(enhancedAttendance.date, targetDate));

			const presentCount = attRows.filter(
				(r: any) =>
					r.status === "present" ||
					r.status === "half_day" ||
					r.status === "late",
			).length;
			const lateCount = attRows.filter(
				(r: any) => (r.lateMinutes && r.lateMinutes > 0) || r.status === "late",
			).length;
			const halfDayCount = attRows.filter(
				(r: any) => r.status === "half_day",
			).length;
			const leaveCount = attRows.filter(
				(r: any) => r.status === "leave",
			).length;
			const adjustedCount = attRows.filter((r: any) => r.isAdjusted).length;
			const incompleteCount = attRows.filter(
				(r: any) => r.checkIn && !r.checkOut,
			).length;
			const absentCount = Math.max(0, totalStaff - presentCount - leaveCount);

			return {
				totalEmployees: totalStaff,
				presentCount,
				lateCount,
				halfDayCount,
				absentCount,
				leaveCount,
				adjustedCount,
				incompleteCount,
				targetDate,
			};
		}),

	adjustAttendance: roleProcedure(["admin", "manager", "hr"])
		.input(
			z.object({
				staffId: z.number(),
				employeeId: z.number().optional(),
				date: z.string(), // YYYY-MM-DD
				checkIn: z.string().nullable().optional(),
				checkOut: z.string().nullable().optional(),
				status: z
					.enum([
						"present",
						"half_day",
						"absent",
						"leave",
						"holiday",
						"week_off",
					])
					.optional(),
				adjustmentCategory: z.enum([
					"biometric_malfunction",
					"network_outage",
					"official_duty",
					"manager_approval",
					"forgot_punch",
					"system_recovery",
					"other",
				]),
				adjustmentReason: z
					.string()
					.min(3, "Adjustment reason is mandatory (minimum 3 characters)."),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// 1. Locate staff record
			const [staffRecord] = await db
				.select()
				.from(staff)
				.where(eq(staff.id, input.staffId))
				.limit(1);

			if (!staffRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Staff member not found.",
				});
			}

			// 2. Auto-sync or find employee record to satisfy foreign key
			let [employeeRecord] = await db
				.select()
				.from(employees)
				.where(eq(employees.email, staffRecord.email))
				.limit(1);

			if (!employeeRecord) {
				[employeeRecord] = await db
					.insert(employees)
					.values({
						employeeCode: staffRecord.staff_code || `EMP-${staffRecord.id}`,
						firstName: staffRecord.name.split(" ")[0] || "Unknown",
						lastName:
							staffRecord.name.split(" ").slice(1).join(" ") || "Employee",
						email: staffRecord.email,
						hireDate: staffRecord.join_date
							? new Date(staffRecord.join_date).toISOString().split("T")[0]
							: new Date().toISOString().split("T")[0],
						status: staffRecord.status === "active" ? "active" : "inactive",
						userUid: `sync-${staffRecord.id}`,
					})
					.returning();
			}

			const realEmployeeId = employeeRecord.id;
			const approverStaffId = await resolveStaffId(db, ctx.user.email);

			// 3. Find existing attendance record
			const [existing] = await db
				.select()
				.from(enhancedAttendance)
				.where(
					and(
						eq(enhancedAttendance.employeeId, realEmployeeId),
						eq(enhancedAttendance.date, input.date),
					),
				)
				.limit(1);

			// Determine new check-in/out and calculate status engine output
			const cleanCheckIn =
				input.checkIn !== undefined
					? input.checkIn
					: (existing?.checkIn ?? null);
			const cleanCheckOut =
				input.checkOut !== undefined
					? input.checkOut
					: (existing?.checkOut ?? null);

			const evalResult = evaluateAttendance({
				date: input.date,
				checkIn: cleanCheckIn,
				checkOut: cleanCheckOut,
				isAdjusted: true,
			});

			const finalDbStatus = input.status || evalResult.dbStatus;
			const workingHours = (evalResult.workingMinutes / 60).toFixed(2);

			let updatedRow: any;

			if (existing) {
				// Preserve original punches immutably
				const originalCheckIn = existing.originalCheckIn || existing.checkIn;
				const originalCheckOut = existing.originalCheckOut || existing.checkOut;

				[updatedRow] = await db
					.update(enhancedAttendance)
					.set({
						checkIn: cleanCheckIn,
						checkOut: cleanCheckOut,
						originalCheckIn,
						originalCheckOut,
						isAdjusted: true,
						adjustmentCategory: input.adjustmentCategory,
						adjustmentReason: input.adjustmentReason,
						adjustedBy: realEmployeeId,
						adjustedAt: new Date(),
						status: finalDbStatus,
						workingHours,
						lateMinutes: evalResult.lateMinutes,
						earlyExitMinutes: evalResult.earlyDepartureMinutes,
						notes: `Adjusted by ${ctx.user.name || ctx.user.email} (${input.adjustmentCategory}): ${input.adjustmentReason}`,
						isApproved: true,
						updatedAt: new Date(),
					})
					.where(eq(enhancedAttendance.id, existing.id))
					.returning();

				// Write immutable audit log
				await logAudit(db, {
					userId: approverStaffId,
					action: "ATTENDANCE_MANUAL_ADJUSTMENT",
					entityType: "enhanced_attendance",
					entityId: existing.id,
					oldValues: {
						checkIn: existing.checkIn,
						checkOut: existing.checkOut,
						status: existing.status,
						isAdjusted: existing.isAdjusted,
					},
					newValues: {
						checkIn: cleanCheckIn,
						checkOut: cleanCheckOut,
						status: finalDbStatus,
						adjustmentCategory: input.adjustmentCategory,
						adjustmentReason: input.adjustmentReason,
						adjustedBy: ctx.user.email,
						adjustedAt: new Date().toISOString(),
					},
				});
			} else {
				// Missing check-in / system failure case: create new record
				[updatedRow] = await db
					.insert(enhancedAttendance)
					.values({
						employeeId: realEmployeeId,
						branchId: staffRecord.branch_id || ctx.user.branchId || 1,
						date: input.date,
						checkIn: cleanCheckIn,
						checkOut: cleanCheckOut,
						originalCheckIn: null,
						originalCheckOut: null,
						isAdjusted: true,
						adjustmentCategory: input.adjustmentCategory,
						adjustmentReason: input.adjustmentReason,
						adjustedBy: realEmployeeId,
						adjustedAt: new Date(),
						status: finalDbStatus,
						workingHours,
						breakHours: "0",
						lateMinutes: evalResult.lateMinutes,
						earlyExitMinutes: evalResult.earlyDepartureMinutes,
						overtimeMinutes: 0,
						riskScore: 0,
						isApproved: true,
						notes: `Manual recovery by ${ctx.user.name || ctx.user.email} (${input.adjustmentCategory}): ${input.adjustmentReason}`,
					})
					.returning();

				await logAudit(db, {
					userId: approverStaffId,
					action: "ATTENDANCE_SYSTEM_RECOVERY_INSERT",
					entityType: "enhanced_attendance",
					entityId: updatedRow.id,
					newValues: {
						checkIn: cleanCheckIn,
						checkOut: cleanCheckOut,
						status: finalDbStatus,
						adjustmentCategory: input.adjustmentCategory,
						adjustmentReason: input.adjustmentReason,
						adjustedBy: ctx.user.email,
					},
				});
			}

			return {
				success: true,
				attendanceId: updatedRow.id,
				isAdjusted: true,
				status: updatedRow.status,
			};
		}),

	getAttendanceDetail: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z.object({
				attendanceId: z.number().optional(),
				staffId: z.number().optional(),
				date: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const targetDate = input.date || new Date().toISOString().split("T")[0];

			let attendanceRow: any = null;
			let staffRow: any = null;

			if (input.attendanceId) {
				const res = await db
					.select()
					.from(enhancedAttendance)
					.where(eq(enhancedAttendance.id, input.attendanceId))
					.limit(1);
				attendanceRow = res[0] || null;
			}

			if (input.staffId) {
				const res = await db
					.select()
					.from(staff)
					.where(eq(staff.id, input.staffId))
					.limit(1);
				staffRow = res[0] || null;
			}

			if (attendanceRow && !staffRow) {
				const [emp] = await db
					.select()
					.from(employees)
					.where(eq(employees.id, attendanceRow.employeeId))
					.limit(1);
				if (emp) {
					const [st] = await db
						.select()
						.from(staff)
						.where(eq(staff.email, emp.email))
						.limit(1);
					staffRow = st || null;
				}
			}

			// If attendanceRow is not yet found but staffId is present, query by employeeId + date
			if (!attendanceRow && staffRow) {
				const [emp] = await db
					.select()
					.from(employees)
					.where(eq(employees.email, staffRow.email))
					.limit(1);
				if (emp) {
					const [att] = await db
						.select()
						.from(enhancedAttendance)
						.where(
							and(
								eq(enhancedAttendance.employeeId, emp.id),
								eq(enhancedAttendance.date, targetDate),
							),
						)
						.limit(1);
					attendanceRow = att || null;
				}
			}

			// Fetch canonical photo from user table
			let canonicalPhoto: string | null = null;
			if (staffRow) {
				const [userRec] = await db
					.select({ image: user.image })
					.from(user)
					.where(
						or(eq(user.email, staffRow.email), eq(user.staff_id, staffRow.id)),
					)
					.limit(1);
				canonicalPhoto = userRec?.image || null;
			}

			// Fetch breaks if attendance exists
			const breaks = attendanceRow
				? await db
						.select()
						.from(attendanceBreaks)
						.where(eq(attendanceBreaks.attendanceId, attendanceRow.id))
						.orderBy(asc(attendanceBreaks.startTime))
				: [];

			// Fetch audit trail for manual corrections or adjustments
			const auditTrail = attendanceRow
				? await db
						.select()
						.from(auditLogs)
						.where(
							and(
								eq(auditLogs.entity_type, "enhanced_attendance"),
								eq(auditLogs.entity_id, attendanceRow.id),
							),
						)
						.orderBy(desc(auditLogs.created_at))
						.limit(10)
				: [];

			return {
				staff: staffRow
					? {
							id: staffRow.id,
							name: staffRow.name,
							email: staffRow.email,
							code: staffRow.staff_code,
							department: staffRow.department || "General",
							role: staffRow.role,
							phone: staffRow.phone,
							photoUrl: canonicalPhoto,
						}
					: null,
				attendance: attendanceRow,
				breaks,
				auditTrail,
			};
		}),

	getMonthlySummary: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z.object({
				year: z.number(),
				month: z.number().min(1).max(12),
				branchId: z.number().optional(),
				department: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const isSuperAdmin = Boolean(
				ctx.user.isSuperadmin ||
					(ctx.user as any).role === "super_admin" ||
					(ctx.user as any).roles?.includes("super_admin"),
			);
			const effectiveBranchId = isSuperAdmin
				? input.branchId
				: ctx.user.branchId
					? Number(ctx.user.branchId)
					: input.branchId;

			const monthStr = String(input.month).padStart(2, "0");
			const fromDate = `${input.year}-${monthStr}-01`;
			const lastDay = new Date(input.year, input.month, 0).getDate();
			const toDate = `${input.year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

			const staffConditions = [eq(staff.is_deleted, false)];
			if (effectiveBranchId != null) {
				staffConditions.push(eq(staff.branch_id, effectiveBranchId));
			}
			if (input.department && input.department !== "all") {
				staffConditions.push(eq(staff.department, input.department));
			}

			const allStaff = await db
				.select({
					id: staff.id,
					name: staff.name,
					email: staff.email,
					code: staff.staff_code,
					department: staff.department,
					photoUrl: user.image, // CANONICAL PHOTO ONLY
				})
				.from(staff)
				.leftJoin(
					user,
					or(eq(staff.email, user.email), eq(user.staff_id, staff.id)),
				)
				.where(and(...staffConditions))
				.orderBy(staff.name);

			const allEmployees = await db.select().from(employees);
			const emailToEmpMap = new Map<string, number>();
			for (const e of allEmployees) {
				if (e.email && e.id) emailToEmpMap.set(e.email, e.id);
			}

			// Fetch all attendance records in this month
			const monthlyAttendance = await db
				.select()
				.from(enhancedAttendance)
				.where(
					and(
						gte(enhancedAttendance.date, fromDate),
						lte(enhancedAttendance.date, toDate),
					),
				);

			// Fetch holidays in month
			const monthlyHolidays = await db
				.select()
				.from(holidays)
				.where(and(gte(holidays.date, fromDate), lte(holidays.date, toDate)));
			const holidayDates = new Set(monthlyHolidays.map((h: any) => h.date));

			// Fetch leaves in month
			const monthlyLeaves = await db
				.select({
					employeeId: leaveApplications.employeeId,
					startDate: leaveApplications.startDate,
					endDate: leaveApplications.endDate,
				})
				.from(leaveApplications)
				.where(
					and(
						lte(leaveApplications.startDate, toDate),
						gte(leaveApplications.endDate, fromDate),
						eq(leaveApplications.status, "approved"),
					),
				);

			const todayStr = new Date().toISOString().split("T")[0];

			// Group attendance by employeeId -> date -> record
			const attMap = new Map<number, Map<string, any>>();
			for (const att of monthlyAttendance) {
				if (!att.employeeId) continue;
				if (!attMap.has(att.employeeId)) attMap.set(att.employeeId, new Map());
				attMap.get(att.employeeId)!.set(att.date, att);
			}

			const employeeSummaries = allStaff.map((st: any) => {
				const empId = st.email ? emailToEmpMap.get(st.email) : null;
				const empAttMap = empId ? attMap.get(empId) : null;

				let presentDays = 0;
				let halfDays = 0;
				let lateDays = 0;
				let absentDays = 0;
				let leaveDays = 0;
				let holidayDays = 0;
				let weekOffDays = 0;
				let incompleteDays = 0;
				let adjustedDays = 0;
				let totalWorkingMinutes = 0;

				const dailyMatrix: Array<{
					day: number;
					date: string;
					code: string;
					statusLabel: string;
					isAdjusted: boolean;
				}> = [];

				for (let d = 1; d <= lastDay; d++) {
					const dateStr = `${input.year}-${monthStr}-${String(d).padStart(2, "0")}`;
					const dayOfWeek = new Date(dateStr).getDay();
					const isSunday = dayOfWeek === 0;
					const isPast = dateStr <= todayStr;

					const attRecord = empAttMap ? empAttMap.get(dateStr) : null;

					// Check leave
					const onLeave =
						empId &&
						monthlyLeaves.some(
							(l: any) =>
								l.employeeId === empId &&
								l.startDate <= dateStr &&
								l.endDate >= dateStr,
						);

					let code = "A";
					let statusLabel = "Absent";
					const isAdjusted = Boolean(attRecord?.isAdjusted);

					if (onLeave) {
						code = "LV";
						statusLabel = "Leave";
						leaveDays++;
					} else if (holidayDates.has(dateStr)) {
						code = "H";
						statusLabel = "Holiday";
						holidayDays++;
					} else if (isSunday) {
						code = "WO";
						statusLabel = "Weekly Off";
						weekOffDays++;
					} else if (attRecord) {
						if (attRecord.isAdjusted) adjustedDays++;
						if (
							attRecord.checkIn &&
							!attRecord.checkOut &&
							dateStr < todayStr
						) {
							code = "INC";
							statusLabel = "Incomplete";
							incompleteDays++;
						} else if (
							attRecord.status === "half_day" ||
							(attRecord.workingHours &&
								Number(attRecord.workingHours) >= 4 &&
								Number(attRecord.workingHours) < 8)
						) {
							code = "HD";
							statusLabel = "Half Day";
							halfDays++;
							totalWorkingMinutes += Math.round(
								Number(attRecord.workingHours || 4) * 60,
							);
						} else if (
							attRecord.status === "present" ||
							attRecord.status === "late" ||
							(attRecord.workingHours && Number(attRecord.workingHours) >= 8)
						) {
							if (
								(attRecord.lateMinutes && attRecord.lateMinutes > 0) ||
								attRecord.status === "late"
							) {
								code = "L";
								statusLabel = "Late (Full Day)";
								lateDays++;
							} else {
								code = "P";
								statusLabel = "Present";
							}
							presentDays++;
							totalWorkingMinutes += Math.round(
								Number(attRecord.workingHours || 8) * 60,
							);
						} else {
							code = "A";
							statusLabel = "Absent";
							if (isPast) absentDays++;
						}
					} else {
						if (isPast) absentDays++;
						code = isPast ? "A" : "-";
						statusLabel = isPast ? "Absent" : "Upcoming";
					}

					dailyMatrix.push({
						day: d,
						date: dateStr,
						code,
						statusLabel,
						isAdjusted,
					});
				}

				return {
					staffId: st.id,
					name: st.name,
					email: st.email,
					code: st.code || `EMP-${st.id}`,
					department: st.department || "General",
					photoUrl: st.photoUrl || null, // CANONICAL PHOTO ONLY
					totalDays: lastDay,
					presentDays,
					halfDays,
					lateDays,
					absentDays,
					leaveDays,
					holidayDays,
					weekOffDays,
					incompleteDays,
					adjustedDays,
					totalWorkingHoursFormatted:
						minutesToFormattedHours(totalWorkingMinutes),
					dailyMatrix,
				};
			});

			return {
				year: input.year,
				month: input.month,
				daysInMonth: lastDay,
				employeeSummaries,
			};
		}),

	getShifts: roleProcedure(["admin", "manager", "auditor", "hr"]).query(
		async ({ ctx }) => {
			return await ctx.db
				.select()
				.from(shifts)
				.where(eq(shifts.isActive, true))
				.orderBy(shifts.name);
		},
	),

	getAttendanceReports: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z.object({
				reportType: z.enum(["daily", "monthly", "adjustments", "exceptions"]),
				date: z.string().optional(),
				month: z.number().optional(),
				year: z.number().optional(),
				branchId: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			const targetDate = input.date || new Date().toISOString().split("T")[0];

			if (input.reportType === "adjustments") {
				// Query all records that have been adjusted
				const adjustedRows = await db
					.select({
						id: enhancedAttendance.id,
						date: enhancedAttendance.date,
						checkIn: enhancedAttendance.checkIn,
						checkOut: enhancedAttendance.checkOut,
						originalCheckIn: enhancedAttendance.originalCheckIn,
						originalCheckOut: enhancedAttendance.originalCheckOut,
						adjustmentCategory: enhancedAttendance.adjustmentCategory,
						adjustmentReason: enhancedAttendance.adjustmentReason,
						adjustedAt: enhancedAttendance.adjustedAt,
						status: enhancedAttendance.status,
						notes: enhancedAttendance.notes,
						staffName: staff.name,
						staffCode: staff.staff_code,
						department: staff.department,
					})
					.from(enhancedAttendance)
					.innerJoin(employees, eq(enhancedAttendance.employeeId, employees.id))
					.innerJoin(staff, eq(employees.email, staff.email))
					.where(eq(enhancedAttendance.isAdjusted, true))
					.orderBy(desc(enhancedAttendance.adjustedAt))
					.limit(500);

				return {
					type: "adjustments",
					title: "Attendance Adjustments & System Recovery Audit Report",
					rows: adjustedRows.map((r: any) => ({
						id: r.id,
						name: r.staffName,
						code: r.staffCode,
						department: r.department,
						date: r.date,
						originalCheckIn: formatTime12h(r.originalCheckIn),
						originalCheckOut: formatTime12h(r.originalCheckOut),
						adjustedCheckIn: formatTime12h(r.checkIn),
						adjustedCheckOut: formatTime12h(r.checkOut),
						category: r.adjustmentCategory || "N/A",
						reason: r.adjustmentReason || "N/A",
						status: r.status,
						adjustedAt: r.adjustedAt
							? new Date(r.adjustedAt).toLocaleString()
							: "N/A",
					})),
				};
			}

			if (input.reportType === "exceptions") {
				// Query missing check-outs
				const exceptions = await db
					.select({
						id: enhancedAttendance.id,
						date: enhancedAttendance.date,
						checkIn: enhancedAttendance.checkIn,
						staffName: staff.name,
						staffCode: staff.staff_code,
						department: staff.department,
						status: enhancedAttendance.status,
					})
					.from(enhancedAttendance)
					.innerJoin(employees, eq(enhancedAttendance.employeeId, employees.id))
					.innerJoin(staff, eq(employees.email, staff.email))
					.where(
						and(
							isNull(enhancedAttendance.checkOut),
							lte(enhancedAttendance.date, targetDate),
						),
					)
					.orderBy(desc(enhancedAttendance.date))
					.limit(200);

				return {
					type: "exceptions",
					title: "Missing Check-Out & Anomaly Exceptions Report",
					rows: exceptions.map((e: any) => ({
						id: e.id,
						name: e.staffName,
						code: e.staffCode,
						department: e.department,
						date: e.date,
						checkIn: formatTime12h(e.checkIn),
						issue: "Missing Check-out Punch",
						status: e.status,
					})),
				};
			}

			// Default: Daily register
			return {
				type: "daily",
				title: `Daily Attendance Roll Report (${targetDate})`,
				date: targetDate,
			};
		}),

	markEmployeeOff: roleProcedure(["admin", "manager", "hr"])
		.input(
			z.object({
				employeeId: z.number(),
				date: z.string(), // YYYY-MM-DD
				status: z
					.enum(["leave", "holiday", "absent", "week_off"])
					.default("leave"),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const db = ctx.db;

			// Sync staff -> employee to satisfy foreign keys
			const [staffRecord] = await db
				.select()
				.from(staff)
				.where(eq(staff.id, input.employeeId))
				.limit(1);

			if (!staffRecord) throw new Error("Staff not found");

			let [employeeRecord] = await db
				.select()
				.from(employees)
				.where(eq(employees.email, staffRecord.email))
				.limit(1);

			if (!employeeRecord) {
				[employeeRecord] = await db
					.insert(employees)
					.values({
						employeeCode: staffRecord.staff_code || `EMP-${Date.now()}`,
						firstName: staffRecord.name.split(" ")[0] || "Unknown",
						lastName:
							staffRecord.name.split(" ").slice(1).join(" ") || "Employee",
						email: staffRecord.email,
						hireDate: staffRecord.join_date
							? new Date(staffRecord.join_date).toISOString().split("T")[0]
							: new Date().toISOString().split("T")[0],
						status: staffRecord.status === "active" ? "active" : "inactive",
						userUid: `sync-${staffRecord.id}`,
					})
					.returning();
			}

			const realEmployeeId = employeeRecord.id;

			const existing = await db
				.select()
				.from(enhancedAttendance)
				.where(
					and(
						eq(enhancedAttendance.employeeId, realEmployeeId),
						eq(enhancedAttendance.date, input.date),
					),
				)
				.limit(1);

			if (existing.length > 0) {
				const [updated] = await db
					.update(enhancedAttendance)
					.set({
						status: input.status,
						notes: input.reason || `Marked ${input.status} by HR`,
						isApproved: true,
					})
					.where(eq(enhancedAttendance.id, existing[0].id))
					.returning();
				return updated;
			}
			const [inserted] = await db
				.insert(enhancedAttendance)
				.values({
					employeeId: realEmployeeId,
					branchId: staffRecord.branch_id || ctx.user.branchId || 1,
					date: input.date,
					status: input.status,
					notes: input.reason || `Marked ${input.status} by HR`,
					checkIn: null,
					checkOut: null,
					workingHours: "0",
					breakHours: "0",
					lateMinutes: 0,
					earlyExitMinutes: 0,
					overtimeMinutes: 0,
					riskScore: 0,
					isApproved: true,
				})
				.returning();
			return inserted;
		}),
});

/**
 * Helper function to create attendance records for a leave period
 */
async function createAttendanceForLeavePeriod(
	db: any,
	employeeId: number,
	startDate: Date,
	endDate: Date,
) {
	const currentDate = new Date(startDate);
	const endDateObj = new Date(endDate);

	while (currentDate <= endDateObj) {
		// Skip weekends if needed (this depends on company policy)
		// For now, we'll mark all days as leave
		const dateString = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format

		// Check if attendance record already exists for this date
		const existingAttendance = await db
			.select()
			.from(enhancedAttendance)
			.where(
				and(
					eq(enhancedAttendance.employeeId, employeeId),
					eq(enhancedAttendance.date, dateString),
				),
			)
			.limit(1);

		if (!existingAttendance.length) {
			// Create new attendance record
			await db.insert(enhancedAttendance).values({
				employeeId: employeeId,
				date: dateString,
				status: "leave",
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
					status: "leave",
					isApproved: true,
				})
				.where(
					and(
						eq(enhancedAttendance.employeeId, employeeId),
						eq(enhancedAttendance.date, dateString),
					),
				);
		}

		// Increment date by 1 day
		currentDate.setDate(currentDate.getDate() + 1);
	}
}
