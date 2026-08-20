import {
	attendanceBreaks,
	attendanceSettings,
	branchGeofences,
	employees,
	enhancedAttendance,
	haversineDistance,
	registeredDevices,
} from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";

/**
 * Backend-authoritative attendance logic.
 *
 * Golden rule: the frontend sends *evidence* (raw GPS lat/long/accuracy, a
 * device timestamp, a live-captured image reference, a device fingerprint).
 * The BACKEND decides. We never trust a client-sent boolean like
 * `isInsideWarehouse` / `attendanceValid` — those are recomputed here from the
 * branch geofence using haversine distance. Server time (`new Date()`) is the
 * only authoritative clock; the device timestamp is used solely as a *risk
 * signal* (clock drift), never as the source of truth.
 *
 * We do NOT claim to be 100% spoof-proof. GPS spoofing is mitigated by layered
 * signals (accuracy sanity, clock drift, mock-location flag, device binding);
 * a high aggregate risk score routes the record to MANUAL_REVIEW instead of
 * silently trusting or silently rejecting it.
 */

// biome-ignore lint/suspicious/noExplicitAny: drizzle db/tx handle
type DB = any;

/** Raw location evidence from the client. No decision booleans are accepted. */
export type GpsEvidence = {
	latitude: number;
	longitude: number;
	accuracy: number; // meters, from the Geolocation API
	deviceTimestamp?: string; // ISO; used only for clock-drift detection
	altitude?: number;
	heading?: number;
	speed?: number;
	mocked?: boolean; // Android may report a mock-location flag
};

/** Derived shift-lifecycle state. Distinct from the daily `status` enum. */
export type ShiftState =
	| "NOT_STARTED"
	| "CHECKED_IN"
	| "ON_BREAK"
	| "ON_LUNCH"
	| "COMPLETED";

export const ATTENDANCE_IMAGE_RETENTION_DAYS = Number(
	process.env.ATTENDANCE_IMAGE_RETENTION_DAYS ?? "30",
);

// ── Settings ────────────────────────────────────────────────────────────────

/**
 * Load attendance settings (single-row config). Falls back to safe, secure
 * defaults if unconfigured — geofence & selfie ON, so absence of config never
 * silently disables verification.
 */
export async function loadSettings(db: DB) {
	const rows = await db.select().from(attendanceSettings).limit(1);
	const s = rows[0];
	return {
		enableGPS: s?.enableGPS ?? true,
		enableGeofence: s?.enableGeofence ?? true,
		enableSelfie: s?.enableSelfie ?? true,
		enableDeviceLock: s?.enableDeviceLock ?? true,
		enableBreakTracking: s?.enableBreakTracking ?? true,
		minGPSAccuracy: s?.minGPSAccuracy ?? 50,
		graceTime: s?.graceTime ?? 10,
		maxBreakTime: s?.maxBreakTime ?? 60,
		workingHours: s?.workingHours ?? 8,
	};
}

// ── Geofence validation (authoritative) ──────────────────────────────────────

export type GeoResult = {
	ok: boolean;
	distance: number | null; // meters from the branch geofence centre
	radius: number | null;
	reason?: "no_geofence" | "outside_geofence" | "gps_error";
};

/**
 * Recompute presence from raw GPS against the branch geofence. NEVER trusts a
 * client claim of being inside. No verified geofence configured → we refuse
 * ("no verified physical presence = no attendance").
 */
export async function validateGeofence(
	db: DB,
	branchId: number,
	gps: GpsEvidence,
	minAccuracy: number,
): Promise<GeoResult> {
	if (gps.accuracy == null || gps.accuracy <= 0 || gps.accuracy > minAccuracy) {
		return { ok: false, distance: null, radius: null, reason: "gps_error" };
	}

	const rows = await db
		.select()
		.from(branchGeofences)
		.where(
			and(
				eq(branchGeofences.branchId, branchId),
				eq(branchGeofences.isActive, true),
			),
		)
		.limit(1);
	const fence = rows[0];
	if (!fence) {
		return { ok: false, distance: null, radius: null, reason: "no_geofence" };
	}

	const distance = haversineDistance(
		gps.latitude,
		gps.longitude,
		Number(fence.latitude),
		Number(fence.longitude),
	);
	const radius = fence.radius ?? 100;
	return {
		ok: distance <= radius,
		distance: Math.round(distance * 100) / 100,
		radius,
		reason: distance <= radius ? undefined : "outside_geofence",
	};
}

// ── Layered anti-spoof risk scoring (not a guarantee) ─────────────────────────

export type RiskAssessment = { score: number; reasons: string[] };

/**
 * Aggregate independent spoofing signals into a 0-100 score. This is
 * defence-in-depth, explicitly NOT a claim of bypass-proof detection.
 */
export function assessRisk(input: {
	gps: GpsEvidence;
	geo: GeoResult;
	deviceApproved: boolean;
	enableDeviceLock: boolean;
	serverNow: Date;
}): RiskAssessment {
	const reasons: string[] = [];
	let score = 0;

	if (input.gps.mocked) {
		score += 60;
		reasons.push("mock_location_flag");
	}
	// Impossibly perfect accuracy is a classic emulator/spoof tell.
	if (input.gps.accuracy > 0 && input.gps.accuracy < 1) {
		score += 20;
		reasons.push("suspiciously_precise_accuracy");
	}
	if (input.gps.deviceTimestamp) {
		const drift = Math.abs(
			input.serverNow.getTime() - new Date(input.gps.deviceTimestamp).getTime(),
		);
		if (drift > 5 * 60 * 1000) {
			score += 25;
			reasons.push("device_clock_drift");
		}
	}
	if (input.enableDeviceLock && !input.deviceApproved) {
		score += 30;
		reasons.push("unregistered_device");
	}
	if (input.geo.reason === "outside_geofence") {
		score += 40;
		reasons.push("outside_geofence");
	}
	return { score: Math.min(score, 100), reasons };
}

// ── Device binding ────────────────────────────────────────────────────────────

/** True if the fingerprint is a known, approved device for this employee. */
export async function isDeviceApproved(
	db: DB,
	employeeId: number,
	fingerprint: string | undefined,
): Promise<boolean> {
	if (!fingerprint) return false;
	const rows = await db
		.select({ id: registeredDevices.id, approved: registeredDevices.isApproved })
		.from(registeredDevices)
		.where(
			and(
				eq(registeredDevices.employeeId, employeeId),
				eq(registeredDevices.fingerprint, fingerprint),
			),
		)
		.limit(1);
	return rows[0]?.approved === true;
}

// ── Shift lifecycle state machine ─────────────────────────────────────────────
// The lifecycle is derived from persisted facts (checkIn/checkOut times + any
// open break), never from a client-sent state. Transitions are guarded so an
// employee cannot, e.g., check out without checking in or start a second break.

/**
 * Resolve today's attendance row + any open break for an employee and derive
 * the current shift state. `date` is an ISO yyyy-mm-dd string (server-derived).
 */
export async function getShift(db: DB, employeeId: number, date: string) {
	const rows = await db
		.select()
		.from(enhancedAttendance)
		.where(
			and(
				eq(enhancedAttendance.employeeId, employeeId),
				eq(enhancedAttendance.date, date),
			),
		)
		.limit(1);
	const row = rows[0] ?? null;

	let activeBreak: { id: number; type: string } | null = null;
	if (row) {
		const br = await db
			.select({ id: attendanceBreaks.id, type: attendanceBreaks.type })
			.from(attendanceBreaks)
			.where(
				and(
					eq(attendanceBreaks.attendanceId, row.id),
					isNull(attendanceBreaks.endTime),
				),
			)
			.limit(1);
		activeBreak = br[0] ?? null;
	}

	let state: ShiftState = "NOT_STARTED";
	if (row) {
		if (row.checkOut) state = "COMPLETED";
		else if (activeBreak)
			state = activeBreak.type === "lunch" ? "ON_LUNCH" : "ON_BREAK";
		else if (row.checkIn) state = "CHECKED_IN";
	}
	return { row, activeBreak, state };
}

/** Guard a shift transition; throws CONFLICT for an illegal move. */
export function assertShiftTransition(
	current: ShiftState,
	allowedFrom: ShiftState[],
	action: string,
): void {
	if (!allowedFrom.includes(current)) {
		throw new TRPCError({
			code: "CONFLICT",
			message: `Cannot ${action}: shift is "${current}" (allowed from: ${allowedFrom.join(", ")}).`,
		});
	}
}

/** Server-authoritative date key (yyyy-mm-dd) and HH:mm:ss time string. */
export function serverDateParts(now = new Date()) {
	const iso = now.toISOString();
	return { date: iso.slice(0, 10), time: iso.slice(11, 19), now };
}

/**
 * Resolve the `employees.id` for the logged-in user, bridged by email
 * (employees.email is unique). Returns null when the user has no employee
 * profile — the caller must refuse attendance in that case ("no verified
 * identity = no attendance").
 */
export async function resolveEmployeeId(
	db: DB,
	email: string | null | undefined,
): Promise<number | null> {
	if (!email) return null;
	const rows = await db
		.select({ id: employees.id })
		.from(employees)
		.where(eq(employees.email, email))
		.limit(1);
	return rows[0]?.id ?? null;
}

