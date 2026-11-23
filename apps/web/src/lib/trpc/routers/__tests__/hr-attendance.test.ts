// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import * as schema from "@/lib/db/schema";
import { getPermissionsForRole } from "@/lib/permissions";
import { buildDDL, createTestDb, makeUser } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const TABLES = [
	schema.staff,
	schema.user,
	schema.branches,
	schema.departments,
	schema.designations,
	schema.employees,
	schema.shifts,
	schema.employeeShifts,
	schema.enhancedAttendance,
	schema.attendanceBreaks,
	schema.leaveTypes,
	schema.leaveApplications,
	schema.holidays,
	schema.weekOffs,
	schema.auditLogs,
	schema.approvals,
	schema.payroll,
];

const { hrRouter } = await import("../hr");
const { createCallerFactory } = await import("../../init");

const withPerms = (id: string, role: string) => ({
	...makeUser(id),
	role,
	permissions: getPermissionsForRole(role as any),
});

const hrUser = withPerms("hr-admin", "hr");
const caller = createCallerFactory(hrRouter)({ user: hrUser, db });

beforeAll(async () => {
	await pg.exec(`
		CREATE TYPE employee_status AS ENUM ('active','inactive','on_leave','terminated');
		CREATE TYPE enhanced_attendance_status AS ENUM ('present','absent','half_day','late','leave','week_off','holiday','pending_approval','rejected','outside_geofence','gps_error','device_error','selfie_missing');
		CREATE TYPE break_type AS ENUM ('lunch','tea','personal','meeting','official_visit','custom');
		CREATE TYPE leave_status AS ENUM ('pending','approved','rejected','cancelled');
	`);
	await pg.exec(buildDDL(TABLES, false));

	await pg.exec(`
		INSERT INTO branches (id, name) VALUES (1, 'Main Warehouse');

		INSERT INTO departments (id, name, code) VALUES (1, 'Operations', 'OPS');

		INSERT INTO shifts (id, name, start_time, end_time, grace_time, is_active)
		VALUES (1, 'General Shift', '09:30:00', '18:30:00', 15, true);

		INSERT INTO staff (id, name, email, staff_code, role, department, branch_id, join_date, salary, is_deleted)
		VALUES 
			(101, 'Rohan Verma', 'rohan@test.com', 'EMP-101', 'staff', 'Operations', 1, NOW(), 25000, false),
			(102, 'Priya Sharma', 'priya@test.com', 'EMP-102', 'staff', 'Operations', 1, NOW(), 28000, false);

		INSERT INTO "user" (id, name, email, email_verified, image, staff_id)
		VALUES 
			('u-101', 'Rohan Verma', 'rohan@test.com', true, 'https://cdn.evaluna.erp/photos/rohan.jpg', 101),
			('u-102', 'Priya Sharma', 'priya@test.com', true, NULL, 102);

		INSERT INTO employees (id, employee_code, first_name, last_name, email, hire_date, status)
		VALUES 
			(1, 'EMP-101', 'Rohan', 'Verma', 'rohan@test.com', '2024-01-01', 'active'),
			(2, 'EMP-102', 'Priya', 'Sharma', 'priya@test.com', '2024-01-01', 'active');
	`);
});

afterAll(async () => {
	await pg.close();
});

describe("HR Attendance Router — End-to-End Tests", () => {
	it("retrieves attendance records with canonical profile photo reuse and no duplicate image", async () => {
		const records = await caller.getAttendanceRecords({ date: "2026-09-30" });
		expect(records).toBeDefined();
		expect(records.length).toBe(2);

		const rohan = records.find((r) => r.staffId === 101);
		expect(rohan).toBeDefined();
		expect(rohan.name).toBe("Rohan Verma");
		// Verification of Canonical Photo from user.image:
		expect(rohan.photoUrl).toBe("https://cdn.evaluna.erp/photos/rohan.jpg");
		expect(rohan.status).toBe("ABSENT"); // No check-in yet on test date
	});

	it("adjusts attendance with mandatory reason, preserving original punch and logging audit trail", async () => {
		// Manager/HR adjusts attendance for Rohan
		const adjustmentResult = await caller.adjustAttendance({
			staffId: 101,
			date: "2026-09-30",
			checkIn: "09:30:00",
			checkOut: "18:30:00",
			adjustmentCategory: "biometric_malfunction",
			adjustmentReason: "Biometric scanner failed to boot; verified presence via CCTV.",
		});

		expect(adjustmentResult.success).toBe(true);
		expect(adjustmentResult.isAdjusted).toBe(true);

		// Read back records
		const records = await caller.getAttendanceRecords({ date: "2026-09-30" });
		const rohan = records.find((r) => r.staffId === 101);
		expect(rohan).toBeDefined();
		expect(rohan.isAdjusted).toBe(true);
		expect(rohan.checkInFormatted).toBe("09:30 AM");
		expect(rohan.checkOutFormatted).toBe("06:30 PM");
		expect(rohan.status).toBe("FULL_DAY");
		expect(rohan.adjustmentCategory).toBe("biometric_malfunction");
		expect(rohan.adjustmentReason).toContain("Biometric scanner failed");
	});

	it("prevents adjustment with empty or too-short reason", async () => {
		expect(
			caller.adjustAttendance({
				staffId: 101,
				date: "2026-09-30",
				checkIn: "09:30:00",
				adjustmentCategory: "other",
				adjustmentReason: "no", // Less than 3 chars
			}),
		).rejects.toThrow();
	});

	it("generates monthly summary with daily status matrix", async () => {
		const summary = await caller.getMonthlySummary({
			year: 2026,
			month: 9,
		});

		expect(summary).toBeDefined();
		expect(summary.daysInMonth).toBe(30);
		expect(summary.employeeSummaries.length).toBe(2);

		const rohan = summary.employeeSummaries.find((s) => s.staffId === 101);
		expect(rohan).toBeDefined();
		expect(rohan.dailyMatrix.length).toBe(30);
		// Day 30 was adjusted to present
		const day30 = rohan.dailyMatrix.find((d) => d.day === 30);
		expect(day30).toBeDefined();
		expect(day30.code).toBe("P");
		expect(day30.isAdjusted).toBe(true);
	});

	it("generates adjustments audit report for export", async () => {
		const report = await caller.getAttendanceReports({
			reportType: "adjustments",
			date: "2026-09-30",
		});

		expect(report.type).toBe("adjustments");
		expect(report.rows.length).toBeGreaterThan(0);
		const row = report.rows[0];
		expect(row.name).toBe("Rohan Verma");
		expect(row.category).toBe("biometric_malfunction");
		expect(row.reason).toContain("CCTV");
	});
});
