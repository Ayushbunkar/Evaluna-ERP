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
		minGPSAccuracy: s?.minGPSAccuracy ?? 500,
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
	const radius = (fence.radius ?? 100) + Math.min(gps.accuracy || 0, 50);
	const isInside = distance <= radius;
	return {
		ok: isInside,
		distance: Math.round(distance * 100) / 100,
		radius: fence.radius ?? 100,
		reason: isInside ? undefined : "outside_geofence",
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
		.select({
			id: registeredDevices.id,
			approved: registeredDevices.isApproved,
		})
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
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");
	return {
		date: `${year}-${month}-${day}`,
		time: `${hours}:${minutes}:${seconds}`,
		now,
	};
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
	userId?: string | null,
): Promise<number | null> {
	if (!email && !userId) return null;
	if (email) {
		const rows = await db
			.select({ id: employees.id })
			.from(employees)
			.where(eq(employees.email, email))
			.limit(1);
		if (rows[0]?.id) return rows[0].id;
	}
	if (userId) {
		const rows = await db
			.select({ id: employees.id })
			.from(employees)
			.where(eq(employees.userUid, userId))
			.limit(1);
		if (rows[0]?.id) return rows[0].id;
	}
	return null;
}

/** Cache to avoid hitting Nominatim rate limits for identical coordinates */
/** Cache to avoid hitting Nominatim rate limits for identical coordinates */
const geoCache = new Map<string, string>();
const inFlightGeoRequests = new Map<string, Promise<string | null>>();

/**
 * Perform reverse geocoding via OpenStreetMap Nominatim to resolve
 * actual human-readable location address (street/area, city, state) from lat/long.
 * Includes timeout and coordinate deduplication.
 */
export async function reverseGeocodeLocation(
	lat: number,
	lng: number,
): Promise<string | null> {
	if (
		lat == null ||
		lng == null ||
		Number.isNaN(lat) ||
		Number.isNaN(lng) ||
		lat < -90 ||
		lat > 90 ||
		lng < -180 ||
		lng > 180
	) {
		return null;
	}

	const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
	if (geoCache.has(key)) {
		return geoCache.get(key) || null;
	}

	if (inFlightGeoRequests.has(key)) {
		return inFlightGeoRequests.get(key)!;
	}

	const requestPromise = (async () => {
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
				{
					headers: {
						"User-Agent": "EvalunaERP-Attendance/1.0 (internal-app)",
					},
					signal: AbortSignal.timeout(1500), // 1.5s max timeout to prevent page blocking
				},
			);
			if (!res.ok) return null;
			const data = (await res.json()) as any;
			if (!data || !data.address) return null;

			const addr = data.address;
			const nameParts = [
				data.name ||
					addr.suburb ||
					addr.neighbourhood ||
					addr.road ||
					addr.residential,
				addr.city || addr.town || addr.village || addr.county || addr.district,
				addr.state,
			].filter(Boolean);

			const formattedName =
				nameParts.length > 0 ? nameParts.join(", ") : data.display_name;
			if (formattedName) {
				geoCache.set(key, formattedName);
				return formattedName;
			}
		} catch (err) {
			// Fail silently and return null; will use branch/default coordinate fallback
		} finally {
			inFlightGeoRequests.delete(key);
		}
		return null;
	})();

	inFlightGeoRequests.set(key, requestPromise);
	return requestPromise;
}
