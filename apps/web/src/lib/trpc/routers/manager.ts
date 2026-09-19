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
	leaveApplications,
	leaveTypes,
	orders,
	packages,
	pickLists,
	purchases,
	staff,
	stockAudits,
	tripCollections,
	tripStops,
	upcTasks,
	user,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, not, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "../init";
import { reverseGeocodeLocation } from "../util/attendance";
import { logAudit, resolveStaffId } from "../util/audit";

export const managerRouter = router({
	// ── 1. Centralized Dashboard Stats (Optimized SQL Aggregation) ─────────────
	getDashboardStats: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);
			const todayEnd = new Date();
			todayEnd.setHours(23, 59, 59, 999);

			const [res] = await db.execute<{
				total_employees: number;
				present_today: number;
				pending_approvals: number;
				on_leave_today: number;
				overdue_tasks: number;
				open_exceptions: number;
				cash_collected: number;
				online_collected: number;
				collections_count: number;
				pending_routes_count: number;
			}>(sql`
				SELECT
					(SELECT coalesce(count(*), 0)::int FROM staff) AS total_employees,
					(SELECT coalesce(count(*), 0)::int FROM attendance WHERE status = 'present' AND created_at >= ${todayStart.toISOString()} AND created_at <= ${todayEnd.toISOString()}) AS present_today,
					(SELECT coalesce(count(*) filter (WHERE status = 'pending'), 0)::int FROM approvals) AS pending_approvals,
					(SELECT coalesce(count(*) filter (WHERE reference_type = 'leave' AND status = 'approved'), 0)::int FROM approvals) AS on_leave_today,
					(SELECT coalesce(count(*), 0)::int FROM upc_tasks WHERE status != 'VERIFIED' AND due_at <= NOW()) AS overdue_tasks,
					(SELECT coalesce(count(*), 0)::int FROM audit_findings WHERE status != 'CLOSED') AS open_exceptions,
					(SELECT coalesce(sum(CASE WHEN lower(coalesce(payment_method, '')) LIKE '%cash%' THEN amount::numeric ELSE 0 END), 0)::float FROM trip_collections) AS cash_collected,
					(SELECT coalesce(sum(CASE WHEN lower(coalesce(payment_method, '')) NOT LIKE '%cash%' THEN amount::numeric ELSE 0 END), 0)::float FROM trip_collections) AS online_collected,
					(SELECT coalesce(count(*), 0)::int FROM trip_collections) AS collections_count,
					(SELECT coalesce(count(*), 0)::int FROM orders WHERE (status IN ('confirmed', 'processing', 'ready_for_dispatch') OR (status = 'completed' AND driver_id IS NULL)) AND driver_id IS NULL) AS pending_routes_count
			`);

			const totalEmployees = Number(res?.total_employees || 0);
			const presentToday = Number(res?.present_today || 0);
			const onLeaveToday = Number(res?.on_leave_today || 0);
			const pendingApprovals = Number(res?.pending_approvals || 0);
			const absentToday = Math.max(
				totalEmployees - presentToday - onLeaveToday,
				0,
			);

			const overdueTasks = Number(res?.overdue_tasks || 0);
			const openExceptions = Number(res?.open_exceptions || 0);

			const driverCashCollected = Number(res?.cash_collected || 0);
			const driverOnlineCollected = Number(res?.online_collected || 0);
			const totalDriverCollections =
				driverCashCollected + driverOnlineCollected;
			const pendingSettlements = Number(res?.collections_count || 0);

			const pendingRoutesCount = Number(res?.pending_routes_count || 0);

			return {
				totalEmployees,
				presentToday,
				absentToday,
				onLeaveToday,
				pendingApprovals,
				overdueTasks,
				openExceptions,
				teamWorkload: overdueTasks + pendingApprovals,
				pendingRoutesCount,
				driverCashCollected,
				driverOnlineCollected,
				totalDriverCollections,
				pendingSettlements,
			};
		}),

	// ── 2. My Team Section (Optimized DB Query) ────────────────────────────────
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
			const searchPattern = input?.search?.trim()
				? `%${input.search.trim().toLowerCase()}%`
				: undefined;

			// Query real staff from DB with server-side filters and limits
			const staffRows = await db
				.select({
					id: staff.id,
					branch_id: staff.branch_id,
					staff_code: staff.staff_code,
					name: staff.name,
					email: staff.email,
					phone: staff.phone,
					role: staff.role,
					join_date: staff.join_date,
					salary: staff.salary,
				})
				.from(staff)
				.where(
					and(
						eq(staff.is_deleted, false),
						input?.status ? eq(staff.status, input.status) : undefined,
						input?.role ? eq(staff.role, input.role) : undefined,
						not(ilike(staff.email, "%seed%")),
						not(ilike(staff.name, "%staff%")),
						not(ilike(staff.name, "%scot%")),
						not(ilike(staff.name, "%carleton%")),
						not(ilike(staff.name, "%wilbur%")),
						not(ilike(staff.name, "%linda%")),
						not(ilike(staff.name, "%bartoletti%")),
						not(ilike(staff.name, "%zulauf%")),
						not(ilike(staff.name, "%farrell%")),
						not(ilike(staff.name, "%russel%")),
						searchPattern
							? or(
									ilike(staff.name, searchPattern),
									ilike(staff.email, searchPattern),
									ilike(staff.staff_code, searchPattern),
								)
							: undefined,
					),
				)
				.orderBy(asc(staff.name))
				.limit(input?.limit ?? 50);

			return staffRows;
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

				if (approval.reference_type === "leave") {
					await tx
						.update(leaveApplications)
						.set({ managerApproved: true })
						.where(eq(leaveApplications.id, approval.reference_id))
						.returning();
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
			const targetDateStr =
				input?.date || new Date().toISOString().split("T")[0];

			// 1. Fetch enhanced attendance, breaks, and legacy records concurrently
			const [enhancedRows, allBreaks, legacyRows] = await Promise.all([
				db
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
					.where(eq(enhancedAttendance.date, targetDateStr as string)),
				db.select().from(attendanceBreaks),
				db.select().from(attendance),
			]);

			// 2. Extract and deduplicate all unique GPS coordinates across all rows
			const uniqueCoords = new Map<string, { lat: number; lng: number }>();
			for (const { att } of enhancedRows) {
				const rawNotes = att.notes || "";
				const gpsObj = att.checkInGPS as any;

				const lat =
					gpsObj?.latitude ??
					(rawNotes.match(/Lat:\s*([0-9.-]+)/)?.[1]
						? Number.parseFloat(rawNotes.match(/Lat:\s*([0-9.-]+)/)![1])
						: null);
				const lng =
					gpsObj?.longitude ??
					(rawNotes.match(/Long:\s*([0-9.-]+)/)?.[1]
						? Number.parseFloat(rawNotes.match(/Long:\s*([0-9.-]+)/)![1])
						: null);

				if (
					lat != null &&
					lng != null &&
					!Number.isNaN(lat) &&
					!Number.isNaN(lng)
				) {
					const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
					if (!uniqueCoords.has(key)) {
						uniqueCoords.set(key, { lat, lng });
					}
				}
			}

			// 3. Resolve reverse-geocoding for unique coordinates concurrently
			const resolvedPlaces = new Map<string, string | null>();
			await Promise.all(
				Array.from(uniqueCoords.entries()).map(async ([key, { lat, lng }]) => {
					try {
						const place = await reverseGeocodeLocation(lat, lng);
						resolvedPlaces.set(key, place);
					} catch {
						resolvedPlaces.set(key, null);
					}
				}),
			);

			// 4. Map production enhancedAttendance records synchronously
			const formattedEnhanced = enhancedRows.map(({ att, emp, usr, br }) => {
				const breaksForAtt = allBreaks.filter(
					(b) => b.attendanceId === att.id,
				);
				const totalBreakMinutes = breaksForAtt.reduce(
					(sum, b) => sum + (b.durationMinutes || 0),
					0,
				);
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

				const lat =
					gpsObj?.latitude ??
					(rawNotes.match(/Lat:\s*([0-9.-]+)/)?.[1]
						? Number.parseFloat(rawNotes.match(/Lat:\s*([0-9.-]+)/)![1])
						: null);
				const lng =
					gpsObj?.longitude ??
					(rawNotes.match(/Long:\s*([0-9.-]+)/)?.[1]
						? Number.parseFloat(rawNotes.match(/Long:\s*([0-9.-]+)/)![1])
						: null);

				if (
					lat != null &&
					lng != null &&
					!Number.isNaN(lat) &&
					!Number.isNaN(lng)
				) {
					const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
					const resolvedPlace = resolvedPlaces.get(key);
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

						const diffMs = endTime.getTime() - startTime.getTime();
						if (diffMs > 0) {
							const breakMs = totalBreakMinutes * 60 * 1000;
							const netMs = Math.max(0, diffMs - breakMs);
							const hours = Math.floor(netMs / (1000 * 60 * 60));
							const mins = Math.floor(
								(netMs % (1000 * 60 * 60)) / (1000 * 60),
							);
							workHoursStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
						}
					} catch {
						workHoursStr = "-";
					}
				}

				const checkInSelfieObj = att.checkInSelfie as any;
				const checkOutSelfieObj = att.checkOutSelfie as any;

				let selfieAttachmentId = null;
				if (
					typeof checkInSelfieObj === "object" &&
					checkInSelfieObj !== null
				) {
					selfieAttachmentId =
						checkInSelfieObj.attachmentId || checkInSelfieObj.id || null;
				} else if (
					typeof checkInSelfieObj === "number" ||
					typeof checkInSelfieObj === "string"
				) {
					selfieAttachmentId = Number(checkInSelfieObj) || null;
				}

				let checkOutSelfieAttachmentId = null;
				if (
					typeof checkOutSelfieObj === "object" &&
					checkOutSelfieObj !== null
				) {
					checkOutSelfieAttachmentId =
						checkOutSelfieObj.attachmentId || checkOutSelfieObj.id || null;
				} else if (
					typeof checkOutSelfieObj === "number" ||
					typeof checkOutSelfieObj === "string"
				) {
					checkOutSelfieAttachmentId = Number(checkOutSelfieObj) || null;
				}

				return {
					id: att.id,
					employeeId: att.employeeId || 1,
					employeeName,
					employeeEmail,
					employeeCode,
					checkIn: att.checkIn,
					checkOut: att.checkOut,
					status: activeBreak
						? `On Break (${activeBreak.type})`
						: att.status || "present",
					breakMinutes: totalBreakMinutes,
					breakCount: breaksForAtt.length,
					workHours: workHoursStr,
					notes: locationFormatted,
					selfieAttachmentId,
					checkOutSelfieAttachmentId,
					createdAt: att.createdAt,
					distance: att.distanceFromOffice,
				};
			});

			// 5. Map legacy records if any exist
			const formattedLegacy = legacyRows.map((l) => ({
				id: 10000 + l.id,
				employeeId: l.employeeId || 1,
				employeeName: `Staff #${l.employeeId}`,
				employeeEmail: "",
				employeeCode: `STAFF-${l.employeeId}`,
				checkIn: l.checkInTime
					? new Date(l.checkInTime).toLocaleTimeString()
					: null,
				checkOut: l.checkOutTime
					? new Date(l.checkOutTime).toLocaleTimeString()
					: null,
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
			.select({
				id: approvals.id,
				reference_id: approvals.reference_id,
				requested_by: approvals.requested_by,
				emp_name: staff.name,
				status: approvals.status,
				created_at: approvals.created_at,
				reason: leaveApplications.reason,
				start_date: leaveApplications.startDate,
				end_date: leaveApplications.endDate,
				leave_type: leaveTypes.name,
			})
			.from(approvals)
			.leftJoin(staff, eq(approvals.requested_by, staff.id))
			.leftJoin(
				leaveApplications,
				eq(approvals.reference_id, leaveApplications.id),
			)
			.leftJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
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

	// ── 12. Orders Awaiting Route/Driver Assignment ────────────────────────────
	getAwaitingDispatchOrders: protectedProcedure.query(async ({ ctx }) => {
		const { tripStops, deliveryTrips, customers } = require("@evaluna/db/schema");

		const assignedTrips = await db
			.select({ custId: tripStops.customer_id })
			.from(tripStops)
			.innerJoin(deliveryTrips, eq(deliveryTrips.id, tripStops.trip_id))
			.where(inArray(deliveryTrips.status, ["pending", "active"]));
		const assignedCustIds = new Set(
			assignedTrips.map((t) => t.custId).filter(Boolean),
		);

		const allOrdersList = await db
			.select({
				id: orders.id,
				customer_id: orders.customer_id,
				total_amount: orders.total_amount,
				status: orders.status,
				created_at: orders.created_at,
				customerName: customers.name,
				customerPhone: customers.phone,
				customerAddress: customers.address,
			})
			.from(orders)
			.leftJoin(customers, eq(orders.customer_id, customers.id))
			.orderBy(desc(orders.created_at))
			.limit(100);

		return allOrdersList.filter(
			(ord) => !ord.customer_id || !assignedCustIds.has(ord.customer_id),
		);
	}),
});
