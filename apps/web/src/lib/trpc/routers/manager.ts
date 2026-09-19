import {
	approvals,
	attendance,
	attendanceBreaks,
	auditFindings,
	auditLogs,
	branches,
	correctiveActions,
	customers,
	deliveryTrips,
	departments,
	eWayBills,
	employeeExpenses,
	employees,
	enhancedAttendance,
	leaveApplications,
	leaveTypes,
	orderItems,
	orders,
	packages,
	payroll,
	pickLists,
	priceChangeHistory,
	products,
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

	// ── 13. E-Way Bills Management ──────────────────────────────────────────
	getEWayBills: protectedProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const rows = await db
				.select({
					id: eWayBills.id,
					order_id: eWayBills.order_id,
					e_way_bill_no: eWayBills.e_way_bill_no,
					vehicle_no: eWayBills.vehicle_no,
					mode_of_transport: eWayBills.mode_of_transport,
					transporter_name: eWayBills.transporter_name,
					status: eWayBills.status,
					valid_until: eWayBills.valid_until,
					created_at: eWayBills.created_at,
					cancelled_at: eWayBills.cancelled_at,
					cancellation_reason: eWayBills.cancellation_reason,
					order_total: orders.total_amount,
					customer_name: customers.name,
					creator_name: staff.name,
				})
				.from(eWayBills)
				.leftJoin(orders, eq(eWayBills.order_id, orders.id))
				.leftJoin(customers, eq(orders.customer_id, customers.id))
				.leftJoin(staff, eq(eWayBills.created_by, staff.id))
				.orderBy(desc(eWayBills.created_at));

			return rows.filter((r) => {
				if (input?.status && input.status !== "all" && r.status !== input.status) {
					return false;
				}
				if (input?.search) {
					const q = input.search.toLowerCase();
					return (
						r.e_way_bill_no.toLowerCase().includes(q) ||
						(r.vehicle_no && r.vehicle_no.toLowerCase().includes(q)) ||
						(r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
						(r.transporter_name && r.transporter_name.toLowerCase().includes(q))
					);
				}
				return true;
			});
		}),

	generateEWayBill: protectedProcedure
		.input(
			z.object({
				orderId: z.number(),
				vehicleNo: z.string().min(4),
				modeOfTransport: z.enum(["road", "rail", "air", "ship"]).default("road"),
				transporterName: z.string().optional(),
				transporterId: z.string().optional(),
				approxDistanceKm: z.number().default(50),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const [order] = await db
				.select()
				.from(orders)
				.where(eq(orders.id, input.orderId))
				.limit(1);

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Order #${input.orderId} not found.`,
				});
			}

			const ewbNo = `EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
			const validUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

			const [bill] = await db
				.insert(eWayBills)
				.values({
					order_id: order.id,
					e_way_bill_no: ewbNo,
					vehicle_no: input.vehicleNo.toUpperCase().trim(),
					mode_of_transport: input.modeOfTransport,
					transporter_name: input.transporterName || "Self Delivery",
					transporter_id: input.transporterId,
					status: "generated",
					valid_until: validUntil,
					created_by: staffId ?? 1,
					created_at: new Date(),
				})
				.returning();

			// Update order reference
			await db
				.update(orders)
				.set({ e_way_bill_no: ewbNo })
				.where(eq(orders.id, order.id));

			await logAudit(db, {
				userId: staffId,
				action: "EWAY_BILL_GENERATED",
				entityType: "orders",
				entityId: order.id,
			});

			return bill;
		}),

	cancelEWayBill: protectedProcedure
		.input(
			z.object({
				eWayBillId: z.number(),
				reason: z.string().min(5),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const [updated] = await db
				.update(eWayBills)
				.set({
					status: "cancelled",
					cancelled_at: new Date(),
					cancellation_reason: input.reason,
				})
				.where(eq(eWayBills.id, input.eWayBillId))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "E-Way bill not found.",
				});
			}

			await logAudit(db, {
				userId: staffId,
				action: "EWAY_BILL_CANCELLED",
				entityType: "e_way_bills",
				entityId: input.eWayBillId,
			});

			return updated;
		}),

	// ── 14. Sales & Driver Commissions ──────────────────────────────────────
	getCommissions: protectedProcedure
		.input(
			z
				.object({
					role: z.string().optional(),
					month: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const staffList = await db
				.select({
					id: staff.id,
					name: staff.name,
					role: staff.role,
					email: staff.email,
					salary: staff.salary,
				})
				.from(staff)
				.where(eq(staff.is_deleted, false));

			const [orderRows, tripCollRows] = await Promise.all([
				db
					.select({
						id: orders.id,
						driver_id: orders.driver_id,
						total_amount: orders.total_amount,
						created_at: orders.created_at,
						status: orders.status,
					})
					.from(orders)
					.where(eq(orders.status, "completed")),
				db
					.select({
						id: tripCollections.id,
						collected_by: tripCollections.collected_by,
						amount: tripCollections.amount,
						collected_at: tripCollections.collected_at,
					})
					.from(tripCollections),
			]);

			return staffList.map((st) => {
				const isDriver = st.role?.toLowerCase().includes("driver");
				const isSales =
					st.role?.toLowerCase().includes("sales") ||
					st.role?.toLowerCase().includes("manager");

				let salesVolume = 0;
				let commissionRate = isSales ? 2.5 : isDriver ? 1.0 : 0.5; // percentage

				if (isDriver) {
					const staffCollections = tripCollRows.filter(
						(c) => c.collected_by === st.id,
					);
					salesVolume = staffCollections.reduce(
						(acc, c) => acc + Number(c.amount || 0),
						0,
					);
				} else {
					// Attributed sales
					salesVolume = orderRows.reduce(
						(acc, o) => acc + Number(o.total_amount || 0),
						0,
					) / (staffList.length || 1);
				}

				const earnedCommission = Math.round((salesVolume * commissionRate) / 100);

				return {
					staffId: st.id,
					name: st.name,
					role: st.role,
					email: st.email,
					baseSalary: Number(st.salary || 25000),
					salesVolume: Math.round(salesVolume),
					commissionRate,
					earnedCommission,
					totalPayout: Number(st.salary || 25000) + earnedCommission,
					status: earnedCommission > 0 ? "Pending Payout" : "Settled",
				};
			});
		}),

	// ── 15. Customer Credit Limits & Credit Holds ───────────────────────────
	getCreditLimits: protectedProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					onlyHeld: z.boolean().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const customerRows = await db
				.select({
					id: customers.id,
					name: customers.name,
					customer_code: customers.customer_code,
					phone: customers.phone,
					email: customers.email,
					credit_limit: customers.credit_limit,
					credit_used: customers.credit_used,
					credit_hold: customers.credit_hold,
					payment_terms: customers.payment_terms,
					customer_type: customers.customer_type,
					status: customers.status,
				})
				.from(customers)
				.where(eq(customers.is_deleted, false))
				.orderBy(desc(customers.credit_hold), asc(customers.name));

			return customerRows.filter((c) => {
				if (input?.onlyHeld && !c.credit_hold) return false;
				if (input?.search) {
					const q = input.search.toLowerCase();
					return (
						c.name.toLowerCase().includes(q) ||
						(c.customer_code && c.customer_code.toLowerCase().includes(q)) ||
						(c.phone && c.phone.toLowerCase().includes(q))
					);
				}
				return true;
			});
		}),

	updateCreditLimit: protectedProcedure
		.input(
			z.object({
				customerId: z.number(),
				creditLimit: z.number().min(0),
				creditHold: z.boolean(),
				paymentTerms: z.number().min(0).max(365),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const [updated] = await db
				.update(customers)
				.set({
					credit_limit: input.creditLimit.toString(),
					credit_hold: input.creditHold,
					payment_terms: input.paymentTerms,
				})
				.where(eq(customers.id, input.customerId))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Customer not found.",
				});
			}

			await logAudit(db, {
				userId: staffId,
				action: "CUSTOMER_CREDIT_LIMIT_UPDATED",
				entityType: "customers",
				entityId: input.customerId,
			});

			return updated;
		}),

	// ── 16. Price Change Audit & Approval ───────────────────────────────────
	getPriceReviews: protectedProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const rows = await db
				.select({
					id: priceChangeHistory.id,
					product_id: priceChangeHistory.product_id,
					product_name: products.name,
					sku: products.sku,
					price_field: priceChangeHistory.price_field,
					old_price: priceChangeHistory.old_price,
					new_price: priceChangeHistory.new_price,
					changed_by: staff.name,
					reason: priceChangeHistory.reason,
					approval_ref: priceChangeHistory.approval_ref,
					source: priceChangeHistory.source,
					created_at: priceChangeHistory.created_at,
				})
				.from(priceChangeHistory)
				.leftJoin(products, eq(priceChangeHistory.product_id, products.id))
				.leftJoin(staff, eq(priceChangeHistory.changed_by, staff.id))
				.orderBy(desc(priceChangeHistory.created_at))
				.limit(100);

			return rows;
		}),

	logPriceReview: protectedProcedure
		.input(
			z.object({
				productId: z.number(),
				priceField: z.enum(["price", "base_selling_price", "base_procurement_price"]),
				oldPrice: z.number(),
				newPrice: z.number(),
				reason: z.string().min(3),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const [logged] = await db
				.insert(priceChangeHistory)
				.values({
					product_id: input.productId,
					price_field: input.priceField,
					old_price: input.oldPrice.toString(),
					new_price: input.newPrice.toString(),
					changed_by: staffId ?? 1,
					reason: input.reason,
					source: "manager_review",
					created_at: new Date(),
				})
				.returning();

			// Update product price
			const updateData: Record<string, string> = {};
			updateData[input.priceField] = input.newPrice.toString();
			await db.update(products).set(updateData).where(eq(products.id, input.productId));

			await logAudit(db, {
				userId: staffId,
				action: "PRICE_CHANGE_LOGGED",
				entityType: "products",
				entityId: input.productId,
			});

			return logged;
		}),

	// ── 17. Escalations & Hold Bills Management ──────────────────────────────
	getEscalations: protectedProcedure.query(async ({ ctx }) => {
		const [findings, heldOrders] = await Promise.all([
			db
				.select({
					id: auditFindings.id,
					severity: auditFindings.severity,
					title: auditFindings.title,
					description: auditFindings.description,
					status: auditFindings.status,
					finding_type: auditFindings.finding_type,
					created_at: auditFindings.created_at,
				})
				.from(auditFindings)
				.orderBy(desc(auditFindings.created_at)),
			db
				.select({
					id: orders.id,
					customer_name: customers.name,
					customer_phone: customers.phone,
					total_amount: orders.total_amount,
					status: orders.status,
					created_at: orders.created_at,
					discount_reason: orders.discount_reason,
				})
				.from(orders)
				.leftJoin(customers, eq(orders.customer_id, customers.id))
				.where(or(eq(orders.status, "suspended"), eq(orders.status, "pending")))
				.orderBy(desc(orders.created_at)),
		]);

		return {
			findings,
			heldOrders,
		};
	}),

	resolveEscalation: protectedProcedure
		.input(
			z.object({
				findingId: z.number(),
				resolution: z.string().min(3),
				status: z.enum(["RESOLVED", "CLOSED", "UNDER_REVIEW"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const [updated] = await db
				.update(auditFindings)
				.set({
					status: input.status,
					resolved_by: staffId ?? 1,
					resolved_at: new Date(),
					description: sql`concat(${auditFindings.description}, ' [Resolution: ', ${input.resolution}, ']')`,
				})
				.where(eq(auditFindings.id, input.findingId))
				.returning();

			return updated;
		}),

	releaseHoldOrder: protectedProcedure
		.input(
			z.object({
				orderId: z.number(),
				action: z.enum(["approve", "cancel"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const [order] = await db
				.update(orders)
				.set({
					status: input.action === "approve" ? "confirmed" : "cancelled",
				})
				.where(eq(orders.id, input.orderId))
				.returning();

			await logAudit(db, {
				userId: staffId,
				action: `HOLD_ORDER_${input.action.toUpperCase()}`,
				entityType: "orders",
				entityId: input.orderId,
			});

			return order;
		}),

	// ── 18. Payroll Approvals ───────────────────────────────────────────────
	getPayrollApprovals: protectedProcedure
		.input(
			z
				.object({
					month: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const currentMonth =
				input?.month || new Date().toISOString().substring(0, 7);

			const [staffMembers, payrollRows] = await Promise.all([
				db
					.select({
						id: staff.id,
						name: staff.name,
						staff_code: staff.staff_code,
						role: staff.role,
						salary: staff.salary,
						join_date: staff.join_date,
					})
					.from(staff)
					.where(eq(staff.is_deleted, false)),
				db
					.select()
					.from(payroll)
					.where(eq(payroll.month, currentMonth)),
			]);

			return staffMembers.map((s) => {
				const pr = payrollRows.find((p) => p.staff_id === s.id);
				const base = Number(pr?.base_salary || s.salary || 25000);
				const ot = Number(pr?.overtime_pay || 0);
				const bonus = Number(pr?.bonus || 0);
				const ded = Number(pr?.deductions || 0);
				const net = Number(pr?.net_payable || base + ot + bonus - ded);
				const status = pr?.status || "pending_approval";

				return {
					id: pr?.id ?? null,
					staffId: s.id,
					name: s.name,
					staffCode: s.staff_code,
					role: s.role,
					month: currentMonth,
					baseSalary: base,
					overtimePay: ot,
					bonus,
					deductions: ded,
					netPayable: net,
					status,
					paymentDate: pr?.payment_date,
				};
			});
		}),

	approvePayroll: protectedProcedure
		.input(
			z.object({
				staffId: z.number(),
				month: z.string(),
				baseSalary: z.number(),
				overtimePay: z.number().default(0),
				bonus: z.number().default(0),
				deductions: z.number().default(0),
				decision: z.enum(["approved", "rejected", "paid"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const staffId = await resolveStaffId(db, ctx.user.email);
			const net = input.baseSalary + input.overtimePay + input.bonus - input.deductions;

			const existing = await db
				.select()
				.from(payroll)
				.where(
					and(
						eq(payroll.staff_id, input.staffId),
						eq(payroll.month, input.month),
					),
				)
				.limit(1);

			if (existing.length > 0) {
				const [updated] = await db
					.update(payroll)
					.set({
						base_salary: input.baseSalary.toString(),
						overtime_pay: input.overtimePay.toString(),
						bonus: input.bonus.toString(),
						deductions: input.deductions.toString(),
						net_payable: net.toString(),
						status: input.decision,
						payment_date: input.decision === "paid" ? new Date() : undefined,
						updated_at: new Date(),
					})
					.where(eq(payroll.id, existing[0].id))
					.returning();
				return updated;
			}

			const [created] = await db
				.insert(payroll)
				.values({
					staff_id: input.staffId,
					month: input.month,
					base_salary: input.baseSalary.toString(),
					overtime_pay: input.overtimePay.toString(),
					bonus: input.bonus.toString(),
					deductions: input.deductions.toString(),
					net_payable: net.toString(),
					status: input.decision,
					payment_date: input.decision === "paid" ? new Date() : undefined,
					created_at: new Date(),
				})
				.returning();

			await logAudit(db, {
				userId: staffId,
				action: `PAYROLL_${input.decision.toUpperCase()}`,
				entityType: "payroll",
				entityId: created.id,
			});

			return created;
		}),
});

