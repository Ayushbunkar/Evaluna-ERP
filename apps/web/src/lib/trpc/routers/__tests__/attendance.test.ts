// @ts-nocheck
/**
 * Attendance & workforce tracking — backend-authoritative behaviour.
 *
 * These tests exercise the security-critical guarantees of the production
 * (geofenced) attendance layer, all enforced server-side and never trusting a
 * client claim:
 *   - No verified physical presence at a configured geofence ⇒ no attendance.
 *   - Presence is recomputed from raw GPS via haversine (outside → FORBIDDEN,
 *     no fence → PRECONDITION_FAILED, poor accuracy → BAD_REQUEST).
 *   - Event-based state machine rejects illegal transitions (CONFLICT).
 *   - One employee + one day = one active record (duplicate check-in → CONFLICT).
 *   - Breaks are separate events; check-out is blocked while on break; net
 *     working time = elapsed − breaks (server clock only).
 *   - Immutable audit: manual corrections APPEND a new event preserving the
 *     original value; audit_logs is never rewritten in place.
 *   - RBAC: self-service = attendance.read/write; verification/config =
 *     attendance.approve; customer has none.
 */
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { buildDDL, createTestDb, makeUser } from "./helpers";
import * as schema from "@/lib/db/schema";
import { getPermissionsForRole } from "@/lib/permissions";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const ATTENDANCE_TABLES = [
	schema.branches,
	schema.employees,
	schema.enhancedAttendance,
	schema.attendanceBreaks,
	schema.registeredDevices,
	schema.branchGeofences,
	schema.attendanceSettings,
	schema.auditLogs,
	schema.notifications,
];

const { attendanceRouter } = await import("../attendance");
const { createCallerFactory } = await import("../../init");

// Actors carry an explicit permissions[] array — requirePermission reads it.
const withPerms = (id: string, role: string) => ({
	...makeUser(id),
	role,
	permissions: getPermissionsForRole(role as any),
});

// A self-service worker: putter has attendance.read/write but NOT approve.
const worker = (n: number) => withPerms(`emp${n}`, "putter");
const hr = withPerms("hr", "hr");
const customer = withPerms("cust", "customer");

const as = (u: any) => createCallerFactory(attendanceRouter)({ user: u, db });

// Branch geofence centre (arbitrary real coords) + a far-away point.
const CENTER = { latitude: 12.9716, longitude: 77.5946 };
const FAR = { latitude: 13.0827, longitude: 80.2707 }; // ~290km away

beforeAll(async () => {
	await pg.exec(`
		CREATE TYPE employee_status AS ENUM ('active','inactive','on_leave','terminated');
		CREATE TYPE enhanced_attendance_status AS ENUM ('present','absent','half_day','late','leave','week_off','holiday','pending_approval','rejected','outside_geofence','gps_error','device_error','selfie_missing');
		CREATE TYPE break_type AS ENUM ('lunch','tea','personal','meeting','official_visit','custom');
	`);
	await pg.exec(buildDDL(ATTENDANCE_TABLES, false));
	await pg.exec(`INSERT INTO branches (id, name) VALUES (1, 'Main'), (2, 'NoFence');`);
	// One employee per scenario so each starts from a clean NOT_STARTED state.
	await pg.exec(`
		INSERT INTO employees (id, employee_code, first_name, last_name, email, hire_date, status) VALUES
		(1, 'E1', 'Emp', 'One',   'emp1@test.com', '2024-01-01', 'active'),
		(2, 'E2', 'Emp', 'Two',   'emp2@test.com', '2024-01-01', 'active'),
		(3, 'E3', 'Emp', 'Three', 'emp3@test.com', '2024-01-01', 'active'),
		(4, 'E4', 'Emp', 'Four',  'emp4@test.com', '2024-01-01', 'active'),
		(5, 'E5', 'Emp', 'Five',  'emp5@test.com', '2024-01-01', 'active'),
		(6, 'E6', 'Emp', 'Six',   'emp6@test.com', '2024-01-01', 'active'),
		(7, 'E7', 'Emp', 'Seven', 'emp7@test.com', '2024-01-01', 'active');
	`);
	// Active geofence for branch 1 only. Branch 2 deliberately has none.
	await pg.exec(`
		INSERT INTO branch_geofences (id, branch_id, latitude, longitude, radius, is_active)
		VALUES (1, 1, '${CENTER.latitude}', '${CENTER.longitude}', 100, true);
	`);
});

afterAll(async () => {
	await pg.close();
});

const gpsAt = (p: { latitude: number; longitude: number }, accuracy = 20) => ({
	latitude: p.latitude,
	longitude: p.longitude,
	accuracy,
});

describe("Geofence — authoritative presence (client claims never trusted)", () => {
	it("refuses check-in when no geofence is configured for the branch", async () => {
		await expect(
			as(worker(4)).checkIn({ branchId: 2, gps: gpsAt(CENTER), imageAttachmentId: 1 }),
		).rejects.toThrow(/no active geofence/i);
	});

	it("rejects check-in from OUTSIDE the geofence radius (FORBIDDEN)", async () => {
		await expect(
			as(worker(2)).checkIn({ branchId: 1, gps: gpsAt(FAR), imageAttachmentId: 1 }),
		).rejects.toThrow(/physical presence/i);
	});

	it("rejects check-in when GPS accuracy is too poor to trust", async () => {
		await expect(
			as(worker(3)).checkIn({ branchId: 1, gps: gpsAt(CENTER, 999), imageAttachmentId: 1 }),
		).rejects.toThrow(/accuracy too low/i);
	});

	it("requires a live photo when selfie capture is enabled", async () => {
		await expect(
			as(worker(2)).checkIn({ branchId: 1, gps: gpsAt(CENTER) }),
		).rejects.toThrow(/photo is required/i);
	});
});

describe("Check-in / break / check-out lifecycle", () => {
	it("checks in successfully INSIDE the geofence and logs an immutable event", async () => {
		const res = await as(worker(1)).checkIn({
			branchId: 1,
			gps: gpsAt(CENTER),
			imageAttachmentId: 11,
		});
		expect(res.status).toBe("present");
		expect(res.flagged).toBe(false);
		const log = await pg.query(
			`SELECT * FROM audit_logs WHERE action = 'ATTENDANCE_CHECK_IN' AND entity_id = ${res.attendanceId}`,
		);
		expect(log.rows.length).toBe(1);
	});

	it("blocks check-out while an employee is still on break", async () => {
		await as(worker(1)).startBreak({ type: "tea" });
		await expect(
			as(worker(1)).checkOut({ gps: gpsAt(CENTER), imageAttachmentId: 12 }),
		).rejects.toThrow(/end your break/i);
	});

	it("ends the break and checks out, netting working time of elapsed − breaks", async () => {
		const ended = await as(worker(1)).endBreak();
		expect(ended.durationMinutes).toBeGreaterThanOrEqual(0);
		const out = await as(worker(1)).checkOut({ gps: gpsAt(CENTER), imageAttachmentId: 12 });
		expect(out.checkOutTime).toBeTruthy();
		expect(Number(out.workingHours)).toBeGreaterThanOrEqual(0);
	});
});

describe("Duplicate prevention — one employee + one day = one record", () => {
	it("rejects a second check-in on the same day (CONFLICT)", async () => {
		await as(worker(5)).checkIn({ branchId: 1, gps: gpsAt(CENTER), imageAttachmentId: 51 });
		await expect(
			as(worker(5)).checkIn({ branchId: 1, gps: gpsAt(CENTER), imageAttachmentId: 52 }),
		).rejects.toThrow(/shift is|already checked in/i);
	});
});

describe("State machine — illegal transitions rejected", () => {
	it("cannot check out before checking in", async () => {
		await expect(
			as(worker(6)).checkOut({ gps: gpsAt(CENTER), imageAttachmentId: 61 }),
		).rejects.toThrow(/cannot check out/i);
	});

	it("cannot start a break before checking in", async () => {
		await expect(as(worker(6)).startBreak({ type: "tea" })).rejects.toThrow(
			/cannot start a break/i,
		);
	});

	it("cannot end a break when none is open", async () => {
		await expect(as(worker(6)).endBreak()).rejects.toThrow(/cannot end a break/i);
	});
});

describe("Immutable audit — manual correction appends, never overwrites", () => {
	it("preserves the original value and records who/why as a NEW event", async () => {
		const ci = await as(worker(7)).checkIn({
			branchId: 1,
			gps: gpsAt(CENTER),
			imageAttachmentId: 71,
		});
		const before = await pg.query(`SELECT COUNT(*)::int AS n FROM audit_logs`);
		const beforeCount = before.rows[0].n;

		await as(hr).manualCorrection({
			id: ci.attendanceId,
			field: "status",
			value: "half_day",
			reason: "Left early — approved by manager",
		});

		// Row reflects the correction.
		const row = await pg.query(
			`SELECT status FROM enhanced_attendance WHERE id = ${ci.attendanceId}`,
		);
		expect(row.rows[0].status).toBe("half_day");

		// Audit log APPENDED (count grew by exactly one), original preserved.
		const after = await pg.query(`SELECT COUNT(*)::int AS n FROM audit_logs`);
		expect(after.rows[0].n).toBe(beforeCount + 1);

		const corr = await pg.query(
			`SELECT old_values, new_values FROM audit_logs
			 WHERE action = 'ATTENDANCE_MANUAL_CORRECTION' AND entity_id = ${ci.attendanceId}`,
		);
		expect(corr.rows.length).toBe(1);
		expect(corr.rows[0].old_values.originalValue).toBe("present");
		expect(corr.rows[0].new_values.correctedValue).toBe("half_day");
		expect(corr.rows[0].new_values.reason).toMatch(/approved by manager/i);

		// The original CHECK_IN event is still intact (never rewritten).
		const ciLog = await pg.query(
			`SELECT * FROM audit_logs WHERE action = 'ATTENDANCE_CHECK_IN' AND entity_id = ${ci.attendanceId}`,
		);
		expect(ciLog.rows.length).toBe(1);
	});
});

describe("RBAC — capability gating (frontend hiding is never the boundary)", () => {
	it("FORBIDS a self-service worker from reading admin settings (needs approve)", async () => {
		await expect(as(worker(1)).getSettings()).rejects.toThrow(/permission/i);
	});

	it("FORBIDS a self-service worker from manual correction (needs approve)", async () => {
		await expect(
			as(worker(1)).manualCorrection({ id: 1, field: "notes", value: "x", reason: "nope" }),
		).rejects.toThrow(/permission/i);
	});

	it("ALLOWS HR to read settings (has attendance.approve)", async () => {
		await expect(as(hr).getSettings()).resolves.toBeDefined();
	});

	it("FORBIDS a customer from even reading their own attendance (no attendance.read)", async () => {
		await expect(as(customer).getToday()).rejects.toThrow(/permission/i);
	});

	it("ALLOWS a worker to read today's own status", async () => {
		const today = await as(worker(1)).getToday();
		expect(today.employeeLinked).toBe(true);
	});
});
