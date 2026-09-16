import {
	approvals,
	branches,
	employees,
	enhancedAttendance,
	leaveApplications,
	leaveTypes,
	payroll,
	staff,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import {
	aliasedTable,
	and,
	count,
	desc,
	eq,
	gte,
	ilike,
	lte,
	ne,
	not,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, roleProcedure, router } from "../init";

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
				avgSalaryData,
			] = await Promise.all([
				db
					.select({ count: count() })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined,
						),
					),
				db
					.select({ count: count() })
					.from(enhancedAttendance)
					.innerJoin(employees, eq(enhancedAttendance.employeeId, employees.id))
					.innerJoin(staff, eq(employees.email, staff.email))
					.where(
						and(
							eq(enhancedAttendance.date, sql`CURRENT_DATE`),
							eq(enhancedAttendance.status, "present"),
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined,
						),
					),
				db
					.select({ count: count() })
					.from(enhancedAttendance)
					.innerJoin(employees, eq(enhancedAttendance.employeeId, employees.id))
					.innerJoin(staff, eq(employees.email, staff.email))
					.where(
						and(
							eq(enhancedAttendance.date, sql`CURRENT_DATE`),
							eq(enhancedAttendance.status, "leave"),
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined,
						),
					),
				db
					.select({ count: count() })
					.from(payroll)
					.where(
						and(
							eq(payroll.month, sql`TO_CHAR(CURRENT_DATE, 'YYYY-MM')`),
							not(eq(payroll.status, "paid")),
							branchId ? eq(payroll.branch_id, branchId) : undefined,
						),
					),
				db
					.select({ count: count() })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							sql`${staff.join_date} >= DATE_TRUNC('month', CURRENT_DATE)`,
							sql`${staff.join_date} < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
							branchId ? eq(staff.branch_id, branchId) : undefined,
						),
					),
				db
					.select({ avg: sql<number>`AVG(${staff.salary})` })
					.from(staff)
					.where(
						and(
							eq(staff.is_deleted, false),
							branchId ? eq(staff.branch_id, branchId) : undefined,
						),
					),
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
					.select()
					.from(staff)
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
			if (input.status === "approved" && !leave.managerApproved) {
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
					date: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const db = ctx.db;
			try {
				let query = db
					.select({
						id: enhancedAttendance.id,
						date: enhancedAttendance.date,
						checkIn: enhancedAttendance.checkIn,
						checkOut: enhancedAttendance.checkOut,
						status: enhancedAttendance.status,
						notes: enhancedAttendance.notes,
						empFirstName: employees.firstName,
						empLastName: employees.lastName,
						staffName: staff.name,
					})
					.from(enhancedAttendance)
					.leftJoin(employees, eq(enhancedAttendance.employeeId, employees.id))
					.leftJoin(staff, eq(employees.email, staff.email));

				if (input?.branch_id) {
					query = query.where(
						or(
							eq(enhancedAttendance.branchId, input.branch_id),
							eq(staff.branch_id, input.branch_id),
						),
					);
				} else if (ctx.user.branchId) {
					query = query.where(
						or(
							eq(enhancedAttendance.branchId, ctx.user.branchId),
							eq(staff.branch_id, ctx.user.branchId),
						),
					);
				}

				if (input?.date) {
					query = query.where(eq(enhancedAttendance.date, input.date));
				}

				const results = await query
					.orderBy(desc(enhancedAttendance.date), desc(enhancedAttendance.id))
					.limit(100);

				return results.map((r) => {
					let checkInStr = "N/A";
					let checkOutStr = "N/A";

					if (r.checkIn) {
						try {
							const d = r.date || new Date().toISOString().split("T")[0];
							const dt = new Date(`${d}T${r.checkIn}`);
							if (!isNaN(dt.getTime())) {
								checkInStr = dt.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								});
							} else {
								checkInStr = String(r.checkIn);
							}
						} catch {
							checkInStr = String(r.checkIn);
						}
					}

					if (r.checkOut) {
						try {
							const d = r.date || new Date().toISOString().split("T")[0];
							const dt = new Date(`${d}T${r.checkOut}`);
							if (!isNaN(dt.getTime())) {
								checkOutStr = dt.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								});
							} else {
								checkOutStr = String(r.checkOut);
							}
						} catch {
							checkOutStr = String(r.checkOut);
						}
					}

					const empName =
						[r.empFirstName, r.empLastName].filter(Boolean).join(" ") ||
						r.staffName ||
						`Staff Member #${r.id}`;

					return {
						id: r.id,
						date: r.date
							? new Date(r.date).toLocaleDateString()
							: new Date().toLocaleDateString(),
						employee_name: empName,
						check_in: checkInStr,
						check_out: checkOutStr,
						status: r.status || "present",
					};
				});
			} catch (err) {
				console.error("Error in getAttendanceRecords:", err);
				return [];
			}
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
					date: input.date,
					status: input.status,
					notes: input.reason || `Marked ${input.status} by HR`,
					checkIn: null,
					checkOut: null,
					workingHours: 0,
					breakHours: 0,
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
