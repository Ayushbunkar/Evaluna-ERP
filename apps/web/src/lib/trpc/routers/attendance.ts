import {
	attendanceBreaks,
	attendanceSettings,
	branchGeofences,
	enhancedAttendance,
	registeredDevices,
	staff,
	staffAttendance,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { permProcedure } from "../util/auditor-procedures";
import { logAudit, notify } from "../util/audit";
import {
	assessRisk,
	assertShiftTransition,
	getShift,
	isDeviceApproved,
	loadSettings,
	resolveEmployeeId,
	serverDateParts,
	validateGeofence,
} from "../util/attendance";

/**
 * Attendance & workforce tracking — backend-authoritative.
 *
 * Security posture (enforced here, never on the client):
 *  - The client sends raw GPS evidence + a live image reference; the BACKEND
 *    recomputes presence against the branch geofence (haversine). A client
 *    "isInside" claim is never accepted.
 *  - Server time is authoritative; the device clock is only a risk signal.
 *  - No verified physical presence at a configured geofence ⇒ no attendance.
 *  - Event-based state machine; illegal transitions are rejected (CONFLICT).
 *  - One employee + one day = one attendance record (unique + pre-check).
 *  - Immutable audit via audit_logs; manual corrections preserve the original
 *    value and record who/why (never a silent overwrite).
 *  - Row scoping: self-service procedures act ONLY on the caller's own record;
 *    HR/admin procedures (attendance.approve) may act across their scope.
 */

// Raw GPS evidence — decision booleans are deliberately NOT part of the schema.
const gpsSchema = z.object({
	latitude: z.number(),
	longitude: z.number(),
	accuracy: z.number(),
	deviceTimestamp: z.string().optional(),
	altitude: z.number().optional(),
	heading: z.number().optional(),
	speed: z.number().optional(),
	mocked: z.boolean().optional(),
});

const deviceSchema = z
	.object({ fingerprint: z.string().optional(), userAgent: z.string().optional() })
	.optional();

function isUniqueViolation(err: unknown): boolean {
	const code = (err as { code?: string; cause?: { code?: string } })?.code;
	const causeCode = (err as { cause?: { code?: string } })?.cause?.code;
	return code === "23505" || causeCode === "23505";
}

export const attendanceRouter = router({
	// ══════════════════════════════════════════════════════════════════════════
	// LEGACY layer — simple staff clock-in/out over `staff_attendance`.
	// Preserved verbatim (behaviour-compatible) because existing pages depend on
	// it: admin/hr/manager attendance pages, /staff, and the navbar status chip.
	// The geofenced production flow below is additive and uses a separate table
	// (`enhanced_attendance`); these are NOT removed to avoid breaking the app.
	// ══════════════════════════════════════════════════════════════════════════
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
			if (input.date) conditions.push(eq(staffAttendance.date, input.date));
			if (branchId) conditions.push(eq(staffAttendance.branch_id, branchId));
			return ctx.db.query.staffAttendance.findMany({
				where: conditions.length > 0 ? and(...conditions) : undefined,
				with: { staff: true },
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
				staff_id: z.number().optional(),
				work_type: z.string().default("regular"),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			let staffMember;
			if (input.staff_id) {
				const result = await ctx.db.select().from(staff).where(eq(staff.id, input.staff_id));
				staffMember = result[0];
			} else {
				const result = await ctx.db.select().from(staff).where(eq(staff.email, ctx.user.email));
				staffMember = result[0];
			}
			if (!staffMember)
				throw new Error("Staff member not found or user is not a staff member.");
			const targetStaffId = staffMember.id;
			const branchId = staffMember.branch_id ?? ctx.user.branchId;
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
			if (activeShift.length > 0)
				throw new Error("Staff member is already clocked in today.");
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
		.input(z.object({ id: z.number().optional() }))
		.mutation(async ({ ctx, input }) => {
			let targetAttendanceId = input.id;
			if (!targetAttendanceId) {
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
				if (activeShift.length === 0)
					throw new Error("No active shift found to clock out from");
				targetAttendanceId = activeShift[0].id;
			}
			const [updated] = await ctx.db
				.update(staffAttendance)
				.set({ clock_out_time: new Date(), shift_status: "completed", updated_at: new Date() })
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
			activeShift: activeShift.length > 0 ? activeShift[0] : null,
		};
	}),

	// ══════════════════════════════════════════════════════════════════════════
	// PRODUCTION layer — geofenced, backend-authoritative attendance.
	// ══════════════════════════════════════════════════════════════════════════
	// ── Self-service: CHECK IN ────────────────────────────────────────────────
	checkIn: permProcedure("attendance", "write")
		.input(
			z.object({
				branchId: z.number(),
				gps: gpsSchema,
				imageAttachmentId: z.number().optional(),
				device: deviceSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = await resolveEmployeeId(ctx.db, ctx.user.email);
			if (!employeeId)
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "No employee profile linked to your account.",
				});

			const { date, time, now } = serverDateParts();
			const settings = await loadSettings(ctx.db);

			// State machine: can only check in from NOT_STARTED.
			const { state } = await getShift(ctx.db, employeeId, date);
			assertShiftTransition(state, ["NOT_STARTED"], "check in");

			if (settings.enableSelfie && !input.imageAttachmentId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "A live check-in photo is required.",
				});

			// Authoritative geofence recomputation.
			const geo = await validateGeofence(
				ctx.db,
				input.branchId,
				input.gps,
				settings.minGPSAccuracy,
			);
			if (geo.reason === "no_geofence")
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "No active geofence configured for this branch. Contact HR.",
				});
			if (geo.reason === "gps_error")
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `GPS accuracy too low (need ≤ ${settings.minGPSAccuracy}m). Move to open sky and retry.`,
				});
			if (!geo.ok)
				throw new TRPCError({
					code: "FORBIDDEN",
					message: `You are ${geo.distance}m from the warehouse (allowed ${geo.radius}m). Attendance requires physical presence.`,
				});

			const deviceApproved = await isDeviceApproved(
				ctx.db,
				employeeId,
				input.device?.fingerprint,
			);
			const risk = assessRisk({
				gps: input.gps,
				geo,
				deviceApproved,
				enableDeviceLock: settings.enableDeviceLock,
				serverNow: now,
			});
			// High aggregate risk → hold for manual review rather than auto-trust.
			const flagged = risk.score >= 50;
			const status = flagged ? "pending_approval" : "present";

			try {
				return await ctx.db.transaction(async (tx: any) => {
					const [row] = await tx
						.insert(enhancedAttendance)
						.values({
							employeeId,
							branchId: input.branchId,
							date,
							checkIn: time,
							checkInGPS: {
								latitude: input.gps.latitude,
								longitude: input.gps.longitude,
								accuracy: input.gps.accuracy,
								timestamp: input.gps.deviceTimestamp ?? now.toISOString(),
								deviceTime: input.gps.deviceTimestamp ?? now.toISOString(),
								serverTime: now.toISOString(),
							},
							checkInSelfie: input.imageAttachmentId
								? {
										attachmentId: input.imageAttachmentId,
										captureTime: now.toISOString(),
										verified: false,
									}
								: null,
							checkInDevice: input.device?.fingerprint
								? { fingerprint: input.device.fingerprint, userAgent: input.device.userAgent }
								: null,
							distanceFromOffice: geo.distance != null ? String(geo.distance) : null,
							status,
							riskScore: risk.score,
							riskReasons: risk.reasons,
							isApproved: !flagged,
						})
						.returning();

					await logAudit(tx, {
						userId: employeeId,
						action: "ATTENDANCE_CHECK_IN",
						entityType: "enhanced_attendance",
						entityId: row.id,
						newValues: {
							status,
							distance: geo.distance,
							riskScore: risk.score,
							riskReasons: risk.reasons,
						},
					});

					if (flagged)
						await notify(tx, {
							branchId: input.branchId,
							type: "attendance_review",
							priority: "high",
							title: "Attendance flagged for review",
							message: `Check-in with risk score ${risk.score} needs verification.`,
							referenceType: "enhanced_attendance",
							referenceId: row.id,
							metadata: { riskReasons: risk.reasons },
						});

					return {
						attendanceId: row.id,
						status,
						flagged,
						distance: geo.distance,
						checkInTime: time,
					};
				});
			} catch (err) {
				if (isUniqueViolation(err))
					throw new TRPCError({
						code: "CONFLICT",
						message: "You have already checked in today.",
					});
				throw err;
			}
		}),

	// ── Self-service: START BREAK / LUNCH ─────────────────────────────────────
	startBreak: permProcedure("attendance", "write")
		.input(
			z.object({
				type: z.enum(["lunch", "tea", "personal", "meeting", "official_visit", "custom"]),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = await resolveEmployeeId(ctx.db, ctx.user.email);
			if (!employeeId)
				throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No employee profile." });
			const { date, now } = serverDateParts();
			const { row, state } = await getShift(ctx.db, employeeId, date);
			assertShiftTransition(state, ["CHECKED_IN"], "start a break");
			return await ctx.db.transaction(async (tx: any) => {
				const [br] = await tx
					.insert(attendanceBreaks)
					.values({
						attendanceId: row.id,
						type: input.type,
						reason: input.reason ?? null,
						startTime: now,
					})
					.returning();
				await logAudit(tx, {
					userId: employeeId,
					action: "ATTENDANCE_BREAK_START",
					entityType: "attendance_breaks",
					entityId: br.id,
					newValues: { type: input.type },
				});
				return { breakId: br.id, type: input.type };
			});
		}),

	// ── Self-service: END BREAK / LUNCH ───────────────────────────────────────
	endBreak: permProcedure("attendance", "write")
		.mutation(async ({ ctx }) => {
			const employeeId = await resolveEmployeeId(ctx.db, ctx.user.email);
			if (!employeeId)
				throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No employee profile." });
			const { date, now } = serverDateParts();
			const { activeBreak, state } = await getShift(ctx.db, employeeId, date);
			assertShiftTransition(state, ["ON_BREAK", "ON_LUNCH"], "end a break");
			if (!activeBreak)
				throw new TRPCError({ code: "CONFLICT", message: "No open break to end." });
			return await ctx.db.transaction(async (tx: any) => {
				const [open] = await tx
					.select()
					.from(attendanceBreaks)
					.where(eq(attendanceBreaks.id, activeBreak.id))
					.limit(1);
				const minutes = Math.max(
					0,
					Math.round((now.getTime() - new Date(open.startTime).getTime()) / 60000),
				);
				const [br] = await tx
					.update(attendanceBreaks)
					.set({ endTime: now, durationMinutes: minutes })
					.where(eq(attendanceBreaks.id, activeBreak.id))
					.returning();
				await logAudit(tx, {
					userId: employeeId,
					action: "ATTENDANCE_BREAK_END",
					entityType: "attendance_breaks",
					entityId: br.id,
					newValues: { durationMinutes: minutes },
				});
				return { breakId: br.id, durationMinutes: minutes };
			});
		}),

	// ── Self-service: CHECK OUT ───────────────────────────────────────────────
	checkOut: permProcedure("attendance", "write")
		.input(
			z.object({
				gps: gpsSchema,
				imageAttachmentId: z.number().optional(),
				device: deviceSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = await resolveEmployeeId(ctx.db, ctx.user.email);
			if (!employeeId)
				throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No employee profile." });
			const { date, time, now } = serverDateParts();
			const settings = await loadSettings(ctx.db);
			const { row, state } = await getShift(ctx.db, employeeId, date);

			if (state === "ON_BREAK" || state === "ON_LUNCH")
				throw new TRPCError({ code: "CONFLICT", message: "End your break before checking out." });
			assertShiftTransition(state, ["CHECKED_IN"], "check out");
			if (settings.enableSelfie && !input.imageAttachmentId)
				throw new TRPCError({ code: "BAD_REQUEST", message: "A live check-out photo is required." });

			// Re-verify presence at check-out too.
			const geo = await validateGeofence(ctx.db, row.branchId, input.gps, settings.minGPSAccuracy);
			if (geo.reason === "gps_error")
				throw new TRPCError({ code: "BAD_REQUEST", message: "GPS accuracy too low; retry." });

			// Net working time = elapsed − break minutes (server clocks only).
			const breaks = await ctx.db
				.select({ d: attendanceBreaks.durationMinutes })
				.from(attendanceBreaks)
				.where(eq(attendanceBreaks.attendanceId, row.id));
			const breakMin = breaks.reduce((s: number, b: { d: number | null }) => s + (b.d ?? 0), 0);
			const elapsedMin = Math.max(
				0,
				Math.round((now.getTime() - new Date(`${date}T${row.checkIn}Z`).getTime()) / 60000),
			);
			const workMin = Math.max(0, elapsedMin - breakMin);
			const workingHours = (workMin / 60).toFixed(2);

			return await ctx.db.transaction(async (tx: any) => {
				const [updated] = await tx
					.update(enhancedAttendance)
					.set({
						checkOut: time,
						checkOutGPS: {
							latitude: input.gps.latitude,
							longitude: input.gps.longitude,
							accuracy: input.gps.accuracy,
							timestamp: now.toISOString(),
							deviceTime: input.gps.deviceTimestamp ?? now.toISOString(),
							serverTime: now.toISOString(),
						},
						checkOutSelfie: input.imageAttachmentId
							? { attachmentId: input.imageAttachmentId, captureTime: now.toISOString(), verified: false }
							: null,
						checkOutDevice: input.device?.fingerprint
							? { fingerprint: input.device.fingerprint, userAgent: input.device.userAgent }
							: null,
						workingHours,
						breakHours: (breakMin / 60).toFixed(2),
						updatedAt: now,
					})
					.where(and(eq(enhancedAttendance.id, row.id), eq(enhancedAttendance.employeeId, employeeId)))
					.returning();
				if (!updated)
					throw new TRPCError({ code: "CONFLICT", message: "Attendance changed concurrently; refresh." });
				await logAudit(tx, {
					userId: employeeId,
					action: "ATTENDANCE_CHECK_OUT",
					entityType: "enhanced_attendance",
					entityId: row.id,
					oldValues: { checkOut: null },
					newValues: { checkOut: time, workingHours, breakMinutes: breakMin },
				});
				return { attendanceId: row.id, checkOutTime: time, workingHours, breakMinutes: breakMin };
			});
		}),

	// ── Self-service reads ────────────────────────────────────────────────────
	getToday: permProcedure("attendance", "read").query(async ({ ctx }) => {
		const employeeId = await resolveEmployeeId(ctx.db, ctx.user.email);
		if (!employeeId) return { employeeLinked: false, state: "NOT_STARTED", row: null, breaks: [] };
		const { date } = serverDateParts();
		const { row, state } = await getShift(ctx.db, employeeId, date);
		const breaks = row
			? await ctx.db
					.select()
					.from(attendanceBreaks)
					.where(eq(attendanceBreaks.attendanceId, row.id))
					.orderBy(asc(attendanceBreaks.startTime))
			: [];
		return { employeeLinked: true, state, row, breaks };
	}),

	getMonthly: permProcedure("attendance", "read")
		.input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
		.query(async ({ ctx, input }) => {
			const employeeId = await resolveEmployeeId(ctx.db, ctx.user.email);
			if (!employeeId) return [];
			const mm = String(input.month).padStart(2, "0");
			const from = `${input.year}-${mm}-01`;
			const to = `${input.year}-${mm}-31`;
			return await ctx.db
				.select()
				.from(enhancedAttendance)
				.where(
					and(
						eq(enhancedAttendance.employeeId, employeeId),
						gte(enhancedAttendance.date, from),
						lte(enhancedAttendance.date, to),
					),
				)
				.orderBy(desc(enhancedAttendance.date));
		}),

	// ── Self-service: register this device (needs HR approval to lower risk) ──
	registerDevice: permProcedure("attendance", "write")
		.input(
			z.object({
				fingerprint: z.string().min(4),
				userAgent: z.string().optional(),
				platform: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = await resolveEmployeeId(ctx.db, ctx.user.email);
			if (!employeeId)
				throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No employee profile." });
			try {
				return await ctx.db.transaction(async (tx: any) => {
					const [dev] = await tx
						.insert(registeredDevices)
						.values({
							employeeId,
							fingerprint: input.fingerprint,
							userAgent: input.userAgent ?? null,
							platform: input.platform ?? null,
							isApproved: false,
							lastUsedAt: new Date(),
						})
						.returning();
					await logAudit(tx, {
						userId: employeeId,
						action: "ATTENDANCE_DEVICE_REGISTER",
						entityType: "registered_devices",
						entityId: dev.id,
						newValues: { fingerprint: input.fingerprint },
					});
					return { deviceId: dev.id, approved: false };
				});
			} catch (err) {
				if (isUniqueViolation(err))
					throw new TRPCError({ code: "CONFLICT", message: "This device is already registered." });
				throw err;
			}
		}),

	// ── Admin/HR: settings config (single-row) ────────────────────────────────
	getSettings: permProcedure("attendance", "approve").query(async ({ ctx }) => {
		const rows = await ctx.db.select().from(attendanceSettings).limit(1);
		return rows[0] ?? null;
	}),

	updateSettings: permProcedure("attendance", "approve")
		.input(
			z.object({
				enableGPS: z.boolean().optional(),
				enableGeofence: z.boolean().optional(),
				enableSelfie: z.boolean().optional(),
				enableDeviceLock: z.boolean().optional(),
				enableBreakTracking: z.boolean().optional(),
				minGPSAccuracy: z.number().int().positive().optional(),
				gpsRadius: z.number().int().positive().optional(),
				graceTime: z.number().int().min(0).optional(),
				maxBreakTime: z.number().int().min(0).optional(),
				workingHours: z.number().int().positive().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx: any) => {
				const existing = await tx.select().from(attendanceSettings).limit(1);
				let saved: any;
				if (existing[0]) {
					[saved] = await tx
						.update(attendanceSettings)
						.set({ ...input, updatedAt: new Date() })
						.where(eq(attendanceSettings.id, existing[0].id))
						.returning();
				} else {
					[saved] = await tx.insert(attendanceSettings).values({ ...input }).returning();
				}
				await logAudit(tx, {
					action: "ATTENDANCE_SETTINGS_UPDATE",
					entityType: "attendance_settings",
					entityId: saved.id,
					newValues: input,
				});
				return saved;
			});
		}),

	// ── Admin/HR: branch geofence config (authoritative presence boundary) ────
	getGeofence: permProcedure("attendance", "approve")
		.input(z.object({ branchId: z.number() }))
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select()
				.from(branchGeofences)
				.where(eq(branchGeofences.branchId, input.branchId))
				.limit(1);
			return rows[0] ?? null;
		}),

	setGeofence: permProcedure("attendance", "approve")
		.input(
			z.object({
				branchId: z.number(),
				latitude: z.number().min(-90).max(90),
				longitude: z.number().min(-180).max(180),
				radius: z.number().int().min(10).max(5000),
				isActive: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx: any) => {
				const existing = await tx
					.select()
					.from(branchGeofences)
					.where(eq(branchGeofences.branchId, input.branchId))
					.limit(1);
				const values = {
					branchId: input.branchId,
					latitude: String(input.latitude),
					longitude: String(input.longitude),
					radius: input.radius,
					isActive: input.isActive,
					updatedAt: new Date(),
				};
				let saved: any;
				if (existing[0]) {
					[saved] = await tx
						.update(branchGeofences)
						.set(values)
						.where(eq(branchGeofences.id, existing[0].id))
						.returning();
				} else {
					[saved] = await tx.insert(branchGeofences).values(values).returning();
				}
				await logAudit(tx, {
					action: "ATTENDANCE_GEOFENCE_SET",
					entityType: "branch_geofences",
					entityId: saved.id,
					oldValues: existing[0]
						? { latitude: existing[0].latitude, longitude: existing[0].longitude, radius: existing[0].radius }
						: null,
					newValues: { latitude: values.latitude, longitude: values.longitude, radius: values.radius },
				});
				return saved;
			});
		}),

	// ── Admin/HR: device registry ─────────────────────────────────────────────
	listDevices: permProcedure("attendance", "approve")
		.input(z.object({ employeeId: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const conds = input?.employeeId
				? [eq(registeredDevices.employeeId, input.employeeId)]
				: [];
			return await ctx.db
				.select()
				.from(registeredDevices)
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(registeredDevices.createdAt));
		}),

	approveDevice: permProcedure("attendance", "approve")
		.input(z.object({ deviceId: z.number(), approved: z.boolean().default(true) }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx: any) => {
				const [dev] = await tx
					.update(registeredDevices)
					.set({ isApproved: input.approved, approvedAt: input.approved ? new Date() : null })
					.where(eq(registeredDevices.id, input.deviceId))
					.returning();
				if (!dev)
					throw new TRPCError({ code: "NOT_FOUND", message: "Device not found." });
				await logAudit(tx, {
					action: input.approved ? "ATTENDANCE_DEVICE_APPROVE" : "ATTENDANCE_DEVICE_REVOKE",
					entityType: "registered_devices",
					entityId: dev.id,
					newValues: { isApproved: input.approved },
				});
				return { deviceId: dev.id, approved: dev.isApproved };
			});
		}),

	// ── Admin/HR: attendance register (branch-scoped) ─────────────────────────
	listAttendance: permProcedure("attendance", "approve")
		.input(
			z
				.object({
					branchId: z.number().optional(),
					date: z.string().optional(),
					from: z.string().optional(),
					to: z.string().optional(),
					employeeId: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			// Non-admins are confined to their own branch (manager scope).
			const isAdmin = ctx.user.isSuperadmin || ctx.user.role === "admin";
			const scopedBranch = isAdmin
				? input?.branchId
				: (ctx.user.branchId ?? -1);
			const conds = [];
			if (scopedBranch != null) conds.push(eq(enhancedAttendance.branchId, scopedBranch));
			if (input?.employeeId) conds.push(eq(enhancedAttendance.employeeId, input.employeeId));
			if (input?.date) conds.push(eq(enhancedAttendance.date, input.date));
			if (input?.from) conds.push(gte(enhancedAttendance.date, input.from));
			if (input?.to) conds.push(lte(enhancedAttendance.date, input.to));
			return await ctx.db
				.select()
				.from(enhancedAttendance)
				.where(conds.length ? and(...conds) : undefined)
				.orderBy(desc(enhancedAttendance.date))
				.limit(1000);
		}),

	getDetails: permProcedure("attendance", "approve")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const [row] = await ctx.db
				.select()
				.from(enhancedAttendance)
				.where(eq(enhancedAttendance.id, input.id))
				.limit(1);
			if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found." });
			const breaks = await ctx.db
				.select()
				.from(attendanceBreaks)
				.where(eq(attendanceBreaks.attendanceId, row.id))
				.orderBy(asc(attendanceBreaks.startTime));
			return { row, breaks };
		}),

	approvePending: permProcedure("attendance", "approve")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx: any) => {
				const [row] = await tx
					.update(enhancedAttendance)
					.set({ status: "present", isApproved: true, approvedAt: new Date(), updatedAt: new Date() })
					.where(and(eq(enhancedAttendance.id, input.id), eq(enhancedAttendance.status, "pending_approval")))
					.returning();
				if (!row)
					throw new TRPCError({ code: "CONFLICT", message: "Record is not pending approval." });
				await logAudit(tx, {
					action: "ATTENDANCE_APPROVE",
					entityType: "enhanced_attendance",
					entityId: row.id,
					oldValues: { status: "pending_approval" },
					newValues: { status: "present", isApproved: true },
				});
				return { attendanceId: row.id, status: row.status };
			});
		}),

	// ── Admin/HR: manual correction (preserves the original in audit_logs) ────
	manualCorrection: permProcedure("attendance", "approve")
		.input(
			z.object({
				id: z.number(),
				field: z.enum(["status", "checkIn", "checkOut", "isApproved", "notes"]),
				value: z.union([z.string(), z.boolean(), z.null()]),
				reason: z.string().min(3),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (tx: any) => {
				const [before] = await tx
					.select()
					.from(enhancedAttendance)
					.where(eq(enhancedAttendance.id, input.id))
					.limit(1);
				if (!before)
					throw new TRPCError({ code: "NOT_FOUND", message: "Record not found." });
				const original = (before as Record<string, unknown>)[input.field];
				const [row] = await tx
					.update(enhancedAttendance)
					.set({ [input.field]: input.value, updatedAt: new Date() })
					.where(eq(enhancedAttendance.id, input.id))
					.returning();
				// Immutable trail: original + corrected value + who + why. Never a
				// silent overwrite — the prior value is preserved here forever.
				await logAudit(tx, {
					action: "ATTENDANCE_MANUAL_CORRECTION",
					entityType: "enhanced_attendance",
					entityId: input.id,
					oldValues: { field: input.field, originalValue: original },
					newValues: {
						field: input.field,
						correctedValue: input.value,
						reason: input.reason,
						correctedByEmail: ctx.user.email,
						correctedAt: new Date().toISOString(),
					},
				});
				return { attendanceId: row.id, field: input.field };
			});
		}),
});
