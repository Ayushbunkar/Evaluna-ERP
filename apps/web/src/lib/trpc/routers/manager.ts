import {
	approvals,
	attendance,
	attendanceBreaks,
	auditFindings,
	auditLogs,
	branches,
	correctiveActions,
	deliveryTrips,
	departments,
	employeeExpenses,
	employees,
	enhancedAttendance,
	orders,
	packages,
	pickLists,
	purchases,
	staff,
	stockAudits,
	upcTasks,
	user,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, lte, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "../init";
import { reverseGeocodeLocation } from "../util/attendance";
import { logAudit, resolveStaffId } from "../util/audit";

export const managerRouter = router({
	// ── 1. Centralized Dashboard Stats ──────────────────────────────────────────
	getDashboardStats: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);
			const todayEnd = new Date();
			todayEnd.setHours(23, 59, 59, 999);

			// Query core numbers
			const staffList = await db.select().from(staff);
			const todayAttendance = await db
				.select()
				.from(attendance)
				.where(
					and(
						gte(attendance.createdAt, todayStart),
						lte(attendance.createdAt, todayEnd),
					),
				);

			const pendingApprovalsList = await db
				.select()
				.from(approvals)
				.where(eq(approvals.status, "pending"));

			const activeLeaves = await db
				.select()
				.from(approvals)
				.where(
					and(
						eq(approvals.reference_type, "leave"),
						eq(approvals.status, "approved"),
					),
				);

			const totalEmployees = staffList.length;
			const presentToday = todayAttendance.filter(
				(a) => a.status === "present",
			).length;
			const onLeaveToday = activeLeaves.length;
			const absentToday = Math.max(
				totalEmployees - presentToday - onLeaveToday,
				0,
			);
			const pendingApprovals = pendingApprovalsList.length;

			// Overdue UPC Tasks count
			const openUpc = await db
				.select()
				.from(upcTasks)
				.where(
					and(
						ne(upcTasks.status, "VERIFIED"),
						lte(upcTasks.due_at, new Date()),
					),
				);
			const overdueTasks = openUpc.length;

			// Exceptions count from open audit findings
			const openFindings = await db
				.select()
				.from(auditFindings)
				.where(ne(auditFindings.status, "CLOSED"));
			const openExceptions = openFindings.length;

			// Calculate driver collections (cash vs online)
			const { tripCollections } = require("@evaluna/db/schema");
			const collectionsList = await db.select().from(tripCollections);
			let driverCashCollected = 0;
			let driverOnlineCollected = 0;
			for (const col of collectionsList) {
				const amt = Number(col.amount || 0);
				if (col.payment_method?.toLowerCase().includes("cash")) {
					driverCashCollected += amt;
				} else {
					driverOnlineCollected += amt;
				}
			}

			return {
				totalEmployees,
				presentToday,
				absentToday,
				onLeaveToday,
				pendingApprovals,
				overdueTasks,
				openExceptions,
				teamWorkload: overdueTasks + pendingApprovals,
				driverCashCollected,
				driverOnlineCollected,
				totalDriverCollections: driverCashCollected + driverOnlineCollected,
				pendingSettlements: collectionsList.length,
			};
		}),

	// ── 2. My Team Section ──────────────────────────────────────────────────────
	getEmployees: protectedProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					role: z.string().optional(),
					status: z.string().optional(),
					limit: z.number().default(50),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const [allStaff, allUsers] = await Promise.all([
				db.select().from(staff),
				db.select().from(user),
			]);

			// Format real system users into staff format
			const realUsersFormatted = allUsers.map((u, i) => ({
				id: 1000 + i + 1,
				branch_id: 1,
				staff_code: `USR-${u.id.slice(0, 6).toUpperCase()}`,
				name: u.name || u.email.split("@")[0],
				email: u.email,
				phone: null,
				role: u.role || "staff",
				join_date: u.createdAt,
				salary: "30000",
			}));

			// Filter out known fake seed staff names like staff1, Scot Farrell, Carleton Zulauf, etc.
			const isFakeName = (name: string | null) => {
				if (!name) return true;
				const n = name.toLowerCase();
				return (
					n.startsWith("staff") ||
					n.includes("scot") ||
					n.includes("carleton") ||
					n.includes("wilbur") ||
					n.includes("linda") ||
					n.includes("bartoletti") ||
					n.includes("zulauf") ||
					n.includes("farrell") ||
					n.includes("russel")
				);
			};

			const cleanStaff = allStaff.filter((s) => !isFakeName(s.name));

			// Real system users come first!
			const combined = [...realUsersFormatted, ...cleanStaff];

			return combined
				.filter((s) => {
					if (
						input?.search &&
						!s.name?.toLowerCase().includes(input.search.toLowerCase())
					) {
						return false;
					}
					if (input?.role && s.role !== input.role) {
						return false;
					}
					return true;
				})
				.slice(0, input?.limit ?? 50);
		}),

	getEmployeeDetail: protectedProcedure
		.input(z.object({ staffId: z.number() }))
		.query(async ({ ctx, input }) => {
			const [employee] = await db
				.select()
				.from(staff)
				.where(eq(staff.id, input.staffId))
				.limit(1);

			if (!employee) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Employee not found.",
				});
			}

			// Query leave requests
			const leaves = await db
				.select()
				.from(approvals)
				.where(
					and(
						eq(approvals.reference_type, "leave"),
						eq(approvals.requested_by, input.staffId),
					),
				);

			// Query assigned tasks
			const assignedTasks = await db
				.select()
				.from(upcTasks)
				.where(eq(upcTasks.assigned_to, input.staffId));

			// Query expense claims
			const expenses = await db
				.select()
				.from(employeeExpenses)
				.where(eq(employeeExpenses.staff_id, input.staffId));

			return {
				employee,
				leaves,
				tasks: assignedTasks,
				expenses,
			};
		}),

	// ── 3. Centralized Tasks ────────────────────────────────────────────────────
	getTasks: protectedProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const upcList = await db.select().from(upcTasks);
			return upcList.filter((t) => {
				if (input?.status && t.status !== input.status) return false;
				return true;
			});
		}),

	createTask: protectedProcedure
		.input(
			z.object({
				productId: z.number(),
				taskType: z.enum(["generate", "verify"]),
				dueAt: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const [task] = await db
				.insert(upcTasks)
				.values({
					product_id: input.productId,
					task_type: input.taskType,
					status: "PENDING",
					due_at: new Date(input.dueAt),
					created_by: staffId ?? 1,
					created_at: new Date(),
					updated_at: new Date(),
				})
				.returning();

			return task;
		}),

	assignTask: protectedProcedure
		.input(
			z.object({
				taskId: z.number(),
				assignedTo: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [task] = await db
				.update(upcTasks)
				.set({
					assigned_to: input.assignedTo,
					status: "ASSIGNED",
					updated_at: new Date(),
				})
				.where(eq(upcTasks.id, input.taskId))
				.returning();

			if (!task) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Task not found.",
				});
			}

			return task;
		}),

	// ── 4. centralized Approvals Inbox ──────────────────────────────────────────
	getApprovals: protectedProcedure
		.input(z.object({ status: z.string().default("pending") }))
		.query(async ({ ctx, input }) => {
			return await db
				.select()
				.from(approvals)
				.where(eq(approvals.status, input.status));
		}),

	reviewApproval: protectedProcedure
		.input(
			z.object({
				approvalId: z.number(),
				decision: z.enum(["approved", "rejected"]),
				comments: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);

			// Verify separation of duties: manager cannot approve their own requests
			const [approval] = await db
				.select()
				.from(approvals)
				.where(eq(approvals.id, input.approvalId))
				.limit(1);

			if (!approval) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Approval request not found.",
				});
			}

			if (staffId && approval.requested_by === staffId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Conflict of Interest: You are not authorized to approve your own requests.",
				});
			}

			return await db.transaction(async (tx) => {
				const [updated] = await tx
					.update(approvals)
					.set({
						status: input.decision,
						approved_by: staffId,
						comments: input.comments,
						resolved_at: new Date(),
					})
					.where(eq(approvals.id, input.approvalId))
					.returning();

				// 1. Cascade update to leave or purchases or sales return statuses if required
				if (approval.reference_type === "purchase") {
					await tx
						.update(purchases)
						.set({
							status: input.decision === "approved" ? "approved" : "cancelled",
						})
						.where(eq(purchases.id, approval.reference_id));
				}

				// 2. Write compliance audit logs
				await logAudit(tx, {
					userId: staffId,
					action: `APPROVAL_DECISION_${input.decision.toUpperCase()}`,
					entityType: "approvals",
					entityId: input.approvalId,
				});

				return updated;
			});
		}),

	// ── 5. Attendance Feed ──────────────────────────────────────────────────────
	getAttendance: protectedProcedure
		.input(z.object({ date: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const targetDateStr = input?.date || new Date().toISOString().split("T")[0];

			// 1. Query production enhancedAttendance records with Employee details & Branch Location
			const enhancedRows = await db
				.select({
					att: enhancedAttendance,
					emp: employees,
					usr: user,
					br: branches,
				})
				.from(enhancedAttendance)
				.leftJoin(employees, eq(enhancedAttendance.employeeId, employees.id))
				.leftJoin(user, eq(employees.userUid, user.id))
				.leftJoin(branches, eq(enhancedAttendance.branchId, branches.id))
				.where(eq(enhancedAttendance.date, targetDateStr as string));

			// 2. Query all breaks for calculate break duration
			const allBreaks = await db.select().from(attendanceBreaks);

			// Map production enhancedAttendance records for Manager roll
			const formattedEnhanced = await Promise.all(
				enhancedRows.map(async ({ att, emp, usr, br }) => {
					const breaksForAtt = allBreaks.filter((b) => b.attendanceId === att.id);
					const totalBreakMinutes = breaksForAtt.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
					const activeBreak = breaksForAtt.find((b) => !b.endTime);

					const employeeName = emp
						? `${emp.firstName} ${emp.lastName}`.trim()
						: usr?.name || `Staff #${att.employeeId}`;
					const employeeEmail = emp?.email || usr?.email || "";
					const employeeCode = emp?.employeeCode || `STAFF-${att.employeeId}`;

					// Extract GPS coordinates if available in notes or checkInGPS
					const rawNotes = att.notes || "";
					let locationFormatted = rawNotes;
					const gpsObj = att.checkInGPS as any;

					const lat = gpsObj?.latitude ?? (rawNotes.match(/Lat:\s*([0-9.-]+)/)?.[1] ? parseFloat(rawNotes.match(/Lat:\s*([0-9.-]+)/)![1]) : null);
					const lng = gpsObj?.longitude ?? (rawNotes.match(/Long:\s*([0-9.-]+)/)?.[1] ? parseFloat(rawNotes.match(/Long:\s*([0-9.-]+)/)![1]) : null);

					if (lat != null && lng != null) {
						const resolvedPlace = await reverseGeocodeLocation(lat, lng);
						if (resolvedPlace) {
							locationFormatted = `${resolvedPlace} (Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)})`;
						} else {
							const branchLocationName = br ? br.name : "Selected Branch";
							locationFormatted = `${branchLocationName} — Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)}`;
						}
					} else if (!locationFormatted) {
						locationFormatted = br ? br.name : "Authorized Location";
					}

					// Work Hours Calculation (checkIn to checkOut or current time, minus break time)
					let workHoursStr = "-";
					if (att.checkIn) {
						try {
							const datePart = att.date || targetDateStr;
							const startTime = new Date(`${datePart}T${att.checkIn}`);
							const endTime = att.checkOut
								? new Date(`${datePart}T${att.checkOut}`)
								: new Date();

							let diffMs = endTime.getTime() - startTime.getTime();
							if (diffMs > 0) {
								const breakMs = totalBreakMinutes * 60 * 1000;
								const netMs = Math.max(0, diffMs - breakMs);
								const hours = Math.floor(netMs / (1000 * 60 * 60));
								const mins = Math.floor((netMs % (1000 * 60 * 60)) / (1000 * 60));
								workHoursStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
							}
						} catch {
							workHoursStr = "-";
						}
					}

					const checkInSelfieObj = att.checkInSelfie as any;
					const checkOutSelfieObj = att.checkOutSelfie as any;
					const selfieAttachmentId = checkInSelfieObj?.attachmentId || null;
					const checkOutSelfieAttachmentId = checkOutSelfieObj?.attachmentId || null;

					return {
						id: att.id,
						employeeId: att.employeeId || 1,
						employeeName,
						employeeEmail,
						employeeCode,
						checkIn: att.checkIn,
						checkOut: att.checkOut,
						status: activeBreak ? `On Break (${activeBreak.type})` : (att.status || "present"),
						breakMinutes: totalBreakMinutes,
						breakCount: breaksForAtt.length,
						workHours: workHoursStr,
						notes: locationFormatted,
						selfieAttachmentId,
						checkOutSelfieAttachmentId,
						createdAt: att.createdAt,
						distance: att.distanceFromOffice,
					};
				}),
			);

			// Map legacy records if any exist
			const legacyRows = await db.select().from(attendance);
			const formattedLegacy = legacyRows.map((l) => ({
				id: 10000 + l.id,
				employeeId: l.employeeId || 1,
				employeeName: `Staff #${l.employeeId}`,
				employeeEmail: "",
				employeeCode: `STAFF-${l.employeeId}`,
				checkIn: l.checkInTime ? new Date(l.checkInTime).toLocaleTimeString() : null,
				checkOut: l.checkOutTime ? new Date(l.checkOutTime).toLocaleTimeString() : null,
				status: l.status || "present",
				breakMinutes: 0,
				breakCount: 0,
				notes: null,
				createdAt: l.createdAt,
				distance: null,
			}));

			return [...formattedEnhanced, ...formattedLegacy];
		}),

	// ── 6. Leave Balance & Management ───────────────────────────────────────────
	getLeaveRequests: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(approvals)
			.where(eq(approvals.reference_type, "leave"));
	}),

	// ── 7. Expenses ─────────────────────────────────────────────────────────────
	getExpenses: protectedProcedure.query(async ({ ctx }) => {
		return await db.select().from(employeeExpenses);
	}),

	// ── 8. Team Performance ─────────────────────────────────────────────────────
	getPerformance: protectedProcedure.query(async ({ ctx }) => {
		const [allStaff, allTasks, allAttendance] = await Promise.all([
			db.select().from(staff).where(eq(staff.email, ctx.user.email)),
			db.select().from(upcTasks),
			db.select().from(attendance),
		]);

		return allStaff.map((s) => {
			const staffTasks = allTasks.filter((t) => t.assigned_to === s.id);
			const completed = staffTasks.filter(
				(t) => t.status === "VERIFIED",
			).length;
			const total = staffTasks.length;
			const completionRate =
				total > 0 ? Math.round((completed / total) * 100) : 100;

			return {
				id: s.id,
				name: s.name,
				role: s.role,
				totalTasks: total,
				completedTasks: completed,
				completionRate,
				attendanceStreak: allAttendance.filter(
					(a) => a.employeeId === s.id && a.status === "present",
				).length,
			};
		});
	}),

	// ── 9. Team Workload ────────────────────────────────────────────────────────
	getWorkload: protectedProcedure.query(async ({ ctx }) => {
		const [allStaff, allTasks] = await Promise.all([
			db.select().from(staff).where(eq(staff.email, ctx.user.email)),
			db.select().from(upcTasks),
		]);

		return allStaff.map((s) => {
			const staffTasks = allTasks.filter((t) => t.assigned_to === s.id);
			return {
				id: s.id,
				name: s.name,
				role: s.role,
				assigned: staffTasks.filter(
					(t) => t.status === "PENDING" || t.status === "ASSIGNED",
				).length,
				inProgress: staffTasks.filter((t) => t.status === "IN_PROGRESS").length,
				completed: staffTasks.filter((t) => t.status === "VERIFIED").length,
				overdue: staffTasks.filter(
					(t) =>
						t.status !== "VERIFIED" &&
						t.due_at &&
						new Date(t.due_at) < new Date(),
				).length,
			};
		});
	}),

	// ── 10. Operational Exceptions Center ───────────────────────────────────────
	getExceptions: protectedProcedure.query(async ({ ctx }) => {
		const findings = await db.select().from(auditFindings);
		return findings.map((f) => ({
			id: f.id,
			severity: f.severity,
			title: f.title,
			description: f.description,
			status: f.status,
			created_at: f.created_at,
		}));
	}),

	// ── 11. Activity Log Timeline ───────────────────────────────────────────────
	getActivity: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(auditLogs)
			.orderBy(desc(auditLogs.created_at))
			.limit(100);
	}),
});
