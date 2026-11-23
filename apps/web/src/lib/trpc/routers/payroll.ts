import { user } from "@evaluna/db";
import {
	employees,
	enhancedAttendance,
	leaveApplications,
	leaveTypes,
	notifications,
	overtime,
	payroll,
	payrollAudit,
	staff,
	transactions,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { z } from "zod";
import {
	calculatePayroll,
	getDaysInMonth,
	summarizeWorkRecords,
} from "@/lib/payroll-engine";
import { roleProcedure, router, type TRPCContext } from "../init";

async function syncActiveStaffPayroll(
	db: TRPCContext["db"],
	targetMonth: string,
	branchId?: number | null,
) {
	try {
		const staffConditions = [
			eq(staff.is_deleted, false),
			eq(staff.status, "active"),
		];
		if (branchId) {
			staffConditions.push(eq(staff.branch_id, branchId));
		}

		const activeStaff = await db.query.staff.findMany({
			where: and(...staffConditions),
		});

		if (!activeStaff.length) return;

		const staffIds = activeStaff.map((s) => s.id);
		const existingPayrolls = await db.query.payroll.findMany({
			where: and(
				inArray(payroll.staff_id, staffIds),
				eq(payroll.month, targetMonth),
			),
			columns: { staff_id: true },
		});

		const existingStaffIds = new Set(existingPayrolls.map((p) => p.staff_id));
		const missingStaff = activeStaff.filter((s) => !existingStaffIds.has(s.id));

		if (!missingStaff.length) return;

		const daysInMonth = getDaysInMonth(targetMonth);
		const startDate = `${targetMonth}-01`;
		const endDate = `${targetMonth}-${String(daysInMonth).padStart(2, "0")}`;

		for (const staffMember of missingStaff) {
			// Locate or synchronize linked employee record in employees table
			let [employeeRecord] = await db
				.select()
				.from(employees)
				.where(eq(employees.email, staffMember.email))
				.limit(1);

			if (!employeeRecord) {
				[employeeRecord] = await db
					.insert(employees)
					.values({
						employeeCode: staffMember.staff_code || `EMP-${staffMember.id}`,
						firstName: staffMember.name.split(" ")[0] || "Staff",
						lastName:
							staffMember.name.split(" ").slice(1).join(" ") || "Member",
						email: staffMember.email,
						hireDate: staffMember.join_date
							? (new Date(staffMember.join_date).toISOString().split("T")[0] ??
								`${targetMonth}-01`)
							: `${targetMonth}-01`,
						status: "active",
						userUid: `sync-${staffMember.id}`,
					})
					.returning();
			}

			// Fetch attendance records
			const attendanceRows = await db
				.select({
					date: enhancedAttendance.date,
					status: enhancedAttendance.status,
					workingHours: enhancedAttendance.workingHours,
					overtimeMinutes: enhancedAttendance.overtimeMinutes,
				})
				.from(enhancedAttendance)
				.where(
					and(
						eq(enhancedAttendance.employeeId, employeeRecord.id),
						gte(enhancedAttendance.date, startDate),
						lte(enhancedAttendance.date, endDate),
					),
				);

			// Fetch approved leaves
			const leaveRows = await db
				.select({
					startDate: leaveApplications.startDate,
					endDate: leaveApplications.endDate,
					isPaid: leaveTypes.isPaid,
					status: leaveApplications.status,
				})
				.from(leaveApplications)
				.leftJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
				.where(
					and(
						eq(leaveApplications.employeeId, employeeRecord.id),
						eq(leaveApplications.status, "approved"),
						lte(leaveApplications.startDate, endDate),
						gte(leaveApplications.endDate, startDate),
					),
				);

			// Fetch approved overtime
			const overtimeRows = await db
				.select({
					date: overtime.date,
					hours: overtime.hours,
					status: overtime.status,
				})
				.from(overtime)
				.where(
					and(
						eq(overtime.staffId, staffMember.id),
						eq(overtime.status, "approved"),
						gte(overtime.date, startDate),
						lte(overtime.date, endDate),
					),
				);

			const workSummary = summarizeWorkRecords({
				month: targetMonth,
				attendanceRecords: attendanceRows.map((r) => ({
					status: r.status,
					isHalfDay:
						r.workingHours !== null &&
						Number(r.workingHours) > 0 &&
						Number(r.workingHours) < 5,
					overtimeMinutes: r.overtimeMinutes ?? 0,
				})),
				leaveRecords: leaveRows.map((l) => ({
					startDate: l.startDate,
					endDate: l.endDate,
					isPaid: Boolean(l.isPaid),
					status: l.status,
				})),
				overtimeRecords: overtimeRows.map((o) => ({
					date: o.date,
					hours: o.hours,
					status: o.status,
				})),
				totalDaysInMonth: daysInMonth,
			});

			const computed = calculatePayroll({
				baseSalary: Number(staffMember.salary || 0),
				payType: "monthly",
				summary: workSummary,
			});

			await db.insert(payroll).values({
				staff_id: staffMember.id,
				branch_id: staffMember.branch_id,
				month: targetMonth,
				base_salary: String(computed.baseSalary),
				overtime_pay: String(computed.overtimePay),
				bonus: "0.00",
				deductions: String(computed.deductions),
				advance_deduction: "0.00",
				net_payable: String(computed.finalAmount),
				status: "hr_review",
				pay_type: computed.payType,
				working_days: computed.workingDays,
				present_days: String(computed.presentDays),
				half_days: computed.halfDays,
				paid_leave_days: String(computed.paidLeaveDays),
				unpaid_leave_days: String(computed.unpaidLeaveDays),
				absent_days: String(computed.absentDays),
				overtime_hours: String(computed.overtimeHours),
				system_calculated_amount: String(computed.systemCalculatedAmount),
				adjustment_amount: "0.00",
				adjustment_reason: null,
				is_locked: false,
			});
		}
	} catch (err) {
		console.error("Error auto-syncing monthly payroll records:", err);
	}
}

export const payrollRouter = router({
	list: roleProcedure([
		"admin",
		"hr",
		"manager",
		"finance",
		"super_admin",
		"auditor",
	])
		.input(
			z.object({
				branch_id: z.number().nullable().optional(),
				month: z.string().optional(),
				status: z.string().optional(),
				team: z.string().optional(),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const targetMonth =
				input.month || new Date().toISOString().substring(0, 7);
			const branchId = input.branch_id ?? ctx.user.branchId;

			// Ensure all active, non-deleted staff automatically have a payroll entry for this month
			await syncActiveStaffPayroll(ctx.db, targetMonth, branchId);

			const conditions = [];

			if (input.month) {
				conditions.push(eq(payroll.month, input.month));
			}
			if (branchId) {
				conditions.push(eq(payroll.branch_id, branchId));
			}
			if (input.status) {
				conditions.push(eq(payroll.status, input.status));
			}

			// Role-based visibility restrictions:
			// Finance by default focuses on manager_approved, paid, locked unless explicit filter
			const role = (ctx.user.role || "").toLowerCase();
			if (role === "finance" && !input.status) {
				conditions.push(
					inArray(payroll.status, ["manager_approved", "paid", "locked"]),
				);
			}

			let records = await ctx.db.query.payroll.findMany({
				where: conditions.length > 0 ? and(...conditions) : undefined,
				with: {
					staff: true,
					paymentMethod: true,
				},
				orderBy: [desc(payroll.created_at)],
			});

			// Filter out any deleted or non-active staff
			records = records.filter(
				(r) => r.staff && !r.staff.is_deleted && r.staff.status === "active",
			);

			// Fetch profile photos from user table for matching emails
			const emails = records
				.map((r) => r.staff?.email)
				.filter((e): e is string => Boolean(e));

			if (emails.length > 0) {
				const userRows = await ctx.db
					.select({ email: user.email, image: user.image })
					.from(user)
					.where(inArray(user.email, emails));

				const imageMap = new Map<string, string | null>();
				for (const u of userRows) {
					if (u.email && u.image) {
						imageMap.set(u.email.toLowerCase(), u.image);
					}
				}

				records = records.map((r) => ({
					...r,
					staff: r.staff
						? {
								...r.staff,
								userImage:
									imageMap.get(r.staff.email?.toLowerCase() || "") || null,
							}
						: r.staff,
				}));
			}

			// Filter in-memory for team/department and search query if provided
			if (input.team && input.team !== "all") {
				records = records.filter(
					(r) =>
						(r.staff?.department || "General").toLowerCase() ===
						input.team?.toLowerCase(),
				);
			}

			if (input.search?.trim()) {
				const q = input.search.trim().toLowerCase();
				records = records.filter(
					(r) =>
						r.staff?.name.toLowerCase().includes(q) ||
						r.staff?.staff_code?.toLowerCase().includes(q) ||
						r.staff?.role?.toLowerCase().includes(q),
				);
			}

			return records;
		}),

	getById: roleProcedure([
		"admin",
		"hr",
		"manager",
		"finance",
		"super_admin",
		"auditor",
	])
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const record = await ctx.db.query.payroll.findFirst({
				where: eq(payroll.id, input.id),
				with: {
					staff: true,
					paymentMethod: true,
				},
			});

			if (!record) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll record not found",
				});
			}

			const audits = await ctx.db
				.select()
				.from(payrollAudit)
				.where(eq(payrollAudit.payrollId, input.id))
				.orderBy(desc(payrollAudit.changedAt));

			return {
				...record,
				audits,
			};
		}),

	getSummaryStats: roleProcedure([
		"admin",
		"hr",
		"manager",
		"finance",
		"super_admin",
		"auditor",
	])
		.input(
			z.object({
				month: z.string().optional(),
				branch_id: z.number().nullable().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const targetMonth =
				input.month || new Date().toISOString().substring(0, 7);
			const branchId = input.branch_id ?? ctx.user.branchId;

			await syncActiveStaffPayroll(ctx.db, targetMonth, branchId);

			const conditions = [];

			if (input.month) {
				conditions.push(eq(payroll.month, input.month));
			}
			if (branchId) {
				conditions.push(eq(payroll.branch_id, branchId));
			}

			let records = await ctx.db.query.payroll.findMany({
				where: conditions.length > 0 ? and(...conditions) : undefined,
				with: { staff: true },
			});

			records = records.filter(
				(r) => r.staff && !r.staff.is_deleted && r.staff.status === "active",
			);

			const totalEmployees = records.length;
			let totalGross = 0;
			let totalDeductions = 0;
			let totalNetPay = 0;
			let totalAdjustments = 0;

			const statusCounts: Record<string, number> = {
				draft: 0,
				hr_review: 0,
				submitted_to_manager: 0,
				returned_to_hr: 0,
				manager_approved: 0,
				paid: 0,
				locked: 0,
			};

			for (const r of records) {
				const gross =
					Number(r.base_salary) +
					Number(r.overtime_pay || 0) +
					Number(r.bonus || 0);
				const ded =
					Number(r.deductions || 0) + Number(r.advance_deduction || 0);
				const net = Number(r.net_payable);
				const adj = Number(r.adjustment_amount || 0);

				totalGross += gross;
				totalDeductions += ded;
				totalNetPay += net;
				totalAdjustments += adj;

				const st = r.status || "draft";
				statusCounts[st] = (statusCounts[st] || 0) + 1;
			}

			return {
				totalEmployees,
				totalGross,
				totalDeductions,
				totalNetPay,
				totalAdjustments,
				statusCounts,
			};
		}),

	generate: roleProcedure(["admin", "hr", "super_admin"])
		.input(
			z.object({
				branch_id: z.number().nullable().optional(),
				month: z.string(), // YYYY-MM
				pay_type: z.enum(["monthly", "daily", "hourly"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const branchId = input.branch_id ?? ctx.user.branchId;
			const staffConditions = [eq(staff.is_deleted, false)];

			if (branchId) {
				staffConditions.push(eq(staff.branch_id, branchId));
			}
			staffConditions.push(eq(staff.status, "active"));

			const activeStaff = await ctx.db.query.staff.findMany({
				where: and(...staffConditions),
			});

			if (!activeStaff.length) {
				return { generated: 0, skipped: 0 };
			}

			// Batch-check existing payroll records to prevent duplicates
			const staffIds = activeStaff.map((s) => s.id);
			const existingPayrolls = await ctx.db.query.payroll.findMany({
				where: and(
					inArray(payroll.staff_id, staffIds),
					eq(payroll.month, input.month),
				),
			});

			const existingStaffIds = new Set(existingPayrolls.map((p) => p.staff_id));
			const newStaffList = activeStaff.filter(
				(e) => !existingStaffIds.has(e.id),
			);

			if (!newStaffList.length) {
				return { generated: 0, skipped: existingPayrolls.length };
			}

			// Month date bounds
			const daysInMonth = getDaysInMonth(input.month);
			const startDate = `${input.month}-01`;
			const endDate = `${input.month}-${String(daysInMonth).padStart(2, "0")}`;

			let generatedCount = 0;

			for (const staffMember of newStaffList) {
				// 1. Locate or synchronize linked employee record in employees table
				let [employeeRecord] = await ctx.db
					.select()
					.from(employees)
					.where(eq(employees.email, staffMember.email))
					.limit(1);

				if (!employeeRecord) {
					[employeeRecord] = await ctx.db
						.insert(employees)
						.values({
							employeeCode: staffMember.staff_code || `EMP-${staffMember.id}`,
							firstName: staffMember.name.split(" ")[0] || "Staff",
							lastName:
								staffMember.name.split(" ").slice(1).join(" ") || "Member",
							email: staffMember.email,
							hireDate: staffMember.join_date
								? (new Date(staffMember.join_date)
										.toISOString()
										.split("T")[0] ?? `${input.month}-01`)
								: `${input.month}-01`,
							status: "active",
							userUid: `sync-${staffMember.id}`,
						})
						.returning();
				}

				// 2. Fetch real attendance records for this month
				const attendanceRows = await ctx.db
					.select({
						date: enhancedAttendance.date,
						status: enhancedAttendance.status,
						workingHours: enhancedAttendance.workingHours,
						overtimeMinutes: enhancedAttendance.overtimeMinutes,
					})
					.from(enhancedAttendance)
					.where(
						and(
							eq(enhancedAttendance.employeeId, employeeRecord.id),
							gte(enhancedAttendance.date, startDate),
							lte(enhancedAttendance.date, endDate),
						),
					);

				// 3. Fetch approved leaves for this month
				const leaveRows = await ctx.db
					.select({
						startDate: leaveApplications.startDate,
						endDate: leaveApplications.endDate,
						isPaid: leaveTypes.isPaid,
						status: leaveApplications.status,
					})
					.from(leaveApplications)
					.leftJoin(
						leaveTypes,
						eq(leaveApplications.leaveTypeId, leaveTypes.id),
					)
					.where(
						and(
							eq(leaveApplications.employeeId, employeeRecord.id),
							or(
								eq(leaveApplications.status, "approved"),
								eq(leaveApplications.managerApproved, true),
							),
							lte(leaveApplications.startDate, endDate),
							gte(leaveApplications.endDate, startDate),
						),
					);

				// 4. Fetch approved overtime records from overtime table
				const overtimeRows = await ctx.db
					.select({
						date: overtime.date,
						hours: overtime.hours,
						status: overtime.status,
					})
					.from(overtime)
					.where(
						and(
							eq(overtime.employeeId, employeeRecord.id),
							gte(overtime.date, startDate),
							lte(overtime.date, endDate),
							or(eq(overtime.status, "approved"), eq(overtime.status, "paid")),
						),
					);

				// 5. Run authoritative payroll calculation engine
				const summary = summarizeWorkRecords({
					month: input.month,
					attendanceRecords: attendanceRows,
					leaveRecords: leaveRows.map((l) => ({
						startDate: l.startDate,
						endDate: l.endDate,
						isPaid: Boolean(l.isPaid),
						status: l.status,
					})),
					overtimeRecords: overtimeRows,
					totalDaysInMonth: daysInMonth,
				});

				const baseSalaryVal = Number(staffMember.salary || 25000);
				const calc = calculatePayroll({
					baseSalary: baseSalaryVal,
					payType: input.pay_type || "monthly",
					summary,
				});

				// 6. Insert new payroll record
				const [newPayroll] = await ctx.db
					.insert(payroll)
					.values({
						staff_id: staffMember.id,
						branch_id: staffMember.branch_id,
						month: input.month,
						base_salary: String(calc.baseSalary),
						overtime_pay: String(calc.overtimePay),
						bonus: "0.00",
						deductions: String(calc.deductions),
						advance_deduction: "0.00",
						net_payable: String(calc.finalAmount),
						status: "hr_review",
						pay_type: calc.payType,
						working_days: calc.workingDays,
						present_days: String(calc.presentDays),
						half_days: calc.halfDays,
						paid_leave_days: String(calc.paidLeaveDays),
						unpaid_leave_days: String(calc.unpaidLeaveDays),
						absent_days: String(calc.absentDays),
						overtime_hours: String(calc.overtimeHours),
						system_calculated_amount: String(calc.systemCalculatedAmount),
						adjustment_amount: "0.00",
						adjustment_reason: null,
						is_locked: false,
					})
					.returning();

				// 7. Insert initial audit trail
				await ctx.db.insert(payrollAudit).values({
					payrollId: newPayroll.id,
					action: "salary_calculation",
					entityType: "payroll",
					entityId: newPayroll.id,
					fieldChanged: "system_calculated_amount",
					newValues: {
						systemCalculatedAmount: calc.systemCalculatedAmount,
						presentDays: calc.presentDays,
						halfDays: calc.halfDays,
						overtimeHours: calc.overtimeHours,
						baseSalary: calc.baseSalary,
					},
					changedByName: ctx.user?.name || "System",
					role: ctx.user?.role || "system",
					reason:
						"Initial automated calculation from attendance and leave records",
				});

				generatedCount += 1;
			}

			return { generated: generatedCount, skipped: existingPayrolls.length };
		}),

	adjust: roleProcedure(["admin", "hr", "super_admin"])
		.input(
			z.object({
				id: z.number(),
				adjustedAmount: z.number().min(0, "Amount must be non-negative"),
				reason: z
					.string()
					.min(3, "A mandatory reason of at least 3 characters is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.payroll.findFirst({
				where: eq(payroll.id, input.id),
				with: { staff: true },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll record not found",
				});
			}

			if (existing.is_locked || existing.status === "paid") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Locked or paid payroll cannot be modified",
				});
			}

			if (
				!["draft", "hr_review", "returned_to_hr"].includes(
					existing.status || "",
				)
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Payroll in status '${existing.status}' cannot be adjusted by HR. It must be in HR Review or Returned state.`,
				});
			}

			const systemCalc = Number(
				existing.system_calculated_amount || existing.base_salary,
			);
			const diff = Math.round((input.adjustedAmount - systemCalc) * 100) / 100;
			const oldNet = existing.net_payable;

			const [updated] = await ctx.db
				.update(payroll)
				.set({
					adjustment_amount: String(diff),
					adjustment_reason: input.reason.trim(),
					net_payable: String(input.adjustedAmount),
					status: "hr_review", // Ensures it stays in HR review after adjustment
					updated_at: new Date(),
				})
				.where(eq(payroll.id, input.id))
				.returning();

			// Permanent Immutable Audit Trail
			await ctx.db.insert(payrollAudit).values({
				payrollId: existing.id,
				action: "adjustment",
				entityType: "payroll",
				entityId: existing.id,
				fieldChanged: "net_payable",
				oldValues: {
					netPayable: oldNet,
					systemCalculatedAmount: systemCalc,
				},
				newValues: {
					netPayable: input.adjustedAmount,
					adjustmentAmount: diff,
				},
				changedByName: ctx.user?.name || "HR Officer",
				role: ctx.user?.role || "hr",
				reason: input.reason.trim(),
			});

			return updated;
		}),

	submitToManager: roleProcedure(["admin", "hr", "super_admin"])
		.input(
			z.object({
				month: z.string().optional(),
				branch_id: z.number().nullable().optional(),
				ids: z.array(z.number()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const branchId = input.branch_id ?? ctx.user.branchId;
			const conditions = [
				inArray(payroll.status, ["draft", "hr_review", "returned_to_hr"]),
			];

			if (input.month) {
				conditions.push(eq(payroll.month, input.month));
			}
			if (branchId) {
				conditions.push(eq(payroll.branch_id, branchId));
			}
			if (input.ids?.length) {
				conditions.push(inArray(payroll.id, input.ids));
			}

			const candidates = await ctx.db.query.payroll.findMany({
				where: and(...conditions),
				with: { staff: true },
			});

			if (!candidates.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No payroll records in editable HR state found to submit",
				});
			}

			// Validate that every record with manual adjustment has an explicit reason
			for (const c of candidates) {
				const adj = Number(c.adjustment_amount || 0);
				if (adj !== 0 && !c.adjustment_reason?.trim()) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot submit payroll for ${c.staff?.name || c.staff_id}: Manual adjustment requires an explanation reason`,
					});
				}
			}

			const candidateIds = candidates.map((c) => c.id);
			const submitterName = ctx.user?.name || "HR Officer";
			const now = new Date();

			await ctx.db
				.update(payroll)
				.set({
					status: "submitted_to_manager",
					submitted_by: submitterName,
					submitted_at: now,
					updated_at: now,
				})
				.where(inArray(payroll.id, candidateIds));

			// Log audit entries
			for (const c of candidates) {
				await ctx.db.insert(payrollAudit).values({
					payrollId: c.id,
					action: "submitted_to_manager",
					entityType: "payroll",
					entityId: c.id,
					fieldChanged: "status",
					oldValues: { status: c.status },
					newValues: { status: "submitted_to_manager" },
					changedByName: submitterName,
					role: ctx.user?.role || "hr",
					reason:
						"HR finalized review and submitted payroll to Manager for authorization",
				});
			}

			// Send in-app notification to Manager
			const notifBranchId = candidates[0]?.branch_id ?? branchId ?? null;
			await ctx.db.insert(notifications).values({
				branch_id: notifBranchId,
				type: "payroll",
				channel: "in_app",
				title: "Payroll Submitted for Approval",
				message: `${candidates.length} payroll record(s) submitted by ${submitterName} for monthly review.`,
				priority: "high",
			});

			return { submittedCount: candidates.length };
		}),

	managerApprove: roleProcedure(["admin", "manager", "super_admin"])
		.input(
			z.object({
				id: z.number().optional(),
				ids: z.array(z.number()).optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const conditions = [eq(payroll.status, "submitted_to_manager")];

			if (input.id) {
				conditions.push(eq(payroll.id, input.id));
			} else if (input.ids?.length) {
				conditions.push(inArray(payroll.id, input.ids));
			} else {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Specific payroll id or ids must be provided for approval",
				});
			}

			const candidates = await ctx.db.query.payroll.findMany({
				where: and(...conditions),
				with: { staff: true },
			});

			if (!candidates.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"No submitted payroll records found awaiting manager approval",
				});
			}

			const approverName = ctx.user?.name || "Manager";
			const now = new Date();
			const candidateIds = candidates.map((c) => c.id);

			await ctx.db
				.update(payroll)
				.set({
					status: "manager_approved",
					approved_by: approverName,
					approved_at: now,
					notes: input.notes || undefined,
					updated_at: now,
				})
				.where(inArray(payroll.id, candidateIds));

			for (const c of candidates) {
				await ctx.db.insert(payrollAudit).values({
					payrollId: c.id,
					action: "manager_approved",
					entityType: "payroll",
					entityId: c.id,
					fieldChanged: "status",
					oldValues: { status: c.status },
					newValues: { status: "manager_approved" },
					changedByName: approverName,
					role: ctx.user?.role || "manager",
					reason:
						input.notes ||
						"Manager approved payroll details and routed to Finance",
				});
			}

			// In-app notification to Finance
			const notifBranchId = candidates[0]?.branch_id ?? null;
			await ctx.db.insert(notifications).values({
				branch_id: notifBranchId,
				type: "payroll",
				channel: "in_app",
				title: "Payroll Approved for Payment",
				message: `${candidates.length} payroll record(s) approved by ${approverName} and routed to Finance for disbursement.`,
				priority: "high",
			});

			return { approvedCount: candidates.length };
		}),

	managerReturn: roleProcedure(["admin", "manager", "super_admin"])
		.input(
			z.object({
				id: z.number().optional(),
				ids: z.array(z.number()).optional(),
				reason: z
					.string()
					.min(
						3,
						"A mandatory explanation reason is required when sending back payroll",
					),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const conditions = [eq(payroll.status, "submitted_to_manager")];

			if (input.id) {
				conditions.push(eq(payroll.id, input.id));
			} else if (input.ids?.length) {
				conditions.push(inArray(payroll.id, input.ids));
			} else {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Specific payroll id or ids must be provided",
				});
			}

			const candidates = await ctx.db.query.payroll.findMany({
				where: and(...conditions),
				with: { staff: true },
			});

			if (!candidates.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No submitted payroll records found to return",
				});
			}

			const managerName = ctx.user?.name || "Manager";
			const candidateIds = candidates.map((c) => c.id);
			const now = new Date();

			await ctx.db
				.update(payroll)
				.set({
					status: "returned_to_hr",
					return_reason: input.reason.trim(),
					updated_at: now,
				})
				.where(inArray(payroll.id, candidateIds));

			for (const c of candidates) {
				await ctx.db.insert(payrollAudit).values({
					payrollId: c.id,
					action: "returned_to_hr",
					entityType: "payroll",
					entityId: c.id,
					fieldChanged: "status",
					oldValues: { status: c.status },
					newValues: { status: "returned_to_hr" },
					changedByName: managerName,
					role: ctx.user?.role || "manager",
					reason: input.reason.trim(),
				});
			}

			// In-app notification to HR
			const notifBranchId = candidates[0]?.branch_id ?? null;
			await ctx.db.insert(notifications).values({
				branch_id: notifBranchId,
				type: "payroll",
				channel: "in_app",
				title: "Payroll Returned by Manager",
				message: `Payroll returned by ${managerName} for revision: "${input.reason.trim()}"`,
				priority: "high",
			});

			return { returnedCount: candidates.length };
		}),

	markPaid: roleProcedure(["admin", "finance", "super_admin"])
		.input(
			z.object({
				id: z.number(),
				payment_method_id: z.number(),
				transaction_reference: z
					.string()
					.min(2, "Transaction / UTR number is mandatory for payment record"),
				payment_date: z.string().optional(),
				notes: z.string().optional(),
				payment_proof_url: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const record = await ctx.db.query.payroll.findFirst({
				where: eq(payroll.id, input.id),
				with: { staff: true },
			});

			if (!record) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll record not found",
				});
			}

			if (record.is_locked || record.status === "paid") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This payroll record is already paid and locked",
				});
			}

			if (record.status !== "manager_approved") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Only manager-approved payroll can be paid. Current status is '${record.status}'.`,
				});
			}

			const payDate = input.payment_date
				? new Date(input.payment_date)
				: new Date();
			const financeUser = ctx.user?.name || "Finance Officer";

			return await ctx.db.transaction(async (tx) => {
				// Mark as paid and lock permanently
				const [paidRecord] = await tx
					.update(payroll)
					.set({
						status: "paid",
						is_locked: true,
						payment_date: payDate,
						payment_method_id: input.payment_method_id,
						transaction_reference: input.transaction_reference.trim(),
						payment_proof_url: input.payment_proof_url || null,
						notes: input.notes || record.notes,
						updated_at: new Date(),
					})
					.where(eq(payroll.id, input.id))
					.returning();

				// Record financial disbursement transaction
				await tx.insert(transactions).values({
					amount: record.net_payable,
					type: "out",
					category: "expense",
					reference_type: "payroll",
					reference_id: paidRecord.id,
					payment_method_id: input.payment_method_id,
					branch_id: record.branch_id,
					user_uid: ctx.user.id,
					status: "success",
					description: `Salary disbursement for ${record.staff?.name || record.staff_id} (${record.month}) — UTR: ${input.transaction_reference.trim()}`,
				});

				// Immutable Audit Trail
				await tx.insert(payrollAudit).values({
					payrollId: paidRecord.id,
					action: "paid",
					entityType: "payroll",
					entityId: paidRecord.id,
					fieldChanged: "status",
					oldValues: { status: "manager_approved" },
					newValues: {
						status: "paid",
						isLocked: true,
						transactionReference: input.transaction_reference.trim(),
						paymentMethodId: input.payment_method_id,
					},
					changedByName: financeUser,
					role: ctx.user?.role || "finance",
					reason: `Disbursement completed via payment method #${input.payment_method_id} with UTR: ${input.transaction_reference.trim()}`,
				});

				// Automatic Payslip Generation upon successful payment/disbursement
				try {
					let empId = record.staff?.employeeId;
					if (!empId && record.staff_id) {
						const [empObj] = await tx
							.select({ id: employees.id })
							.from(employees)
							.where(eq(employees.id, record.staff_id))
							.limit(1);
						if (empObj) empId = empObj.id;
					}

					if (empId) {
						const [existingPayslip] = await tx
							.select()
							.from(generatedPayslip)
							.where(
								and(
									eq(generatedPayslip.payrollId, paidRecord.id),
									eq(generatedPayslip.employeeId, empId),
								),
							)
							.limit(1);

						if (!existingPayslip) {
							const contentUrl = `generated-payslip-${paidRecord.id}-${empId}.pdf`;
							await tx.insert(generatedPayslip).values({
								payrollId: paidRecord.id,
								employeeId: empId,
								templateId: null,
								contentUrl: contentUrl,
								isPublished: true,
								publishedAt: payDate,
								generatedAt: new Date(),
							});
						}
					}
				} catch (payslipErr) {
					console.error("Automatic payslip generation error:", payslipErr);
				}

				// Notification to HR & Manager
				await tx.insert(notifications).values({
					branch_id: record.branch_id,
					type: "payroll",
					channel: "in_app",
					title: "Payroll Payment & Payslip Completed",
					message: `Salary of ₹${Number(record.net_payable).toLocaleString("en-IN")} disbursed to ${record.staff?.name || "Staff"} (Ref: ${input.transaction_reference.trim()}). Official Payslip generated and published to HR Archive.`,
					priority: "normal",
				});

				return paidRecord;
			});
		}),

	getAuditHistory: roleProcedure([
		"admin",
		"hr",
		"manager",
		"finance",
		"super_admin",
		"auditor",
	])
		.input(z.object({ payrollId: z.number() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select()
				.from(payrollAudit)
				.where(eq(payrollAudit.payrollId, input.payrollId))
				.orderBy(desc(payrollAudit.changedAt));
		}),
});
