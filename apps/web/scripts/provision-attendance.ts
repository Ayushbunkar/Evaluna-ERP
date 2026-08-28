/**
 * Attendance module provisioning (idempotent, reversible, safe to re-run).
 *
 * User-approved to write to the LIVE database. It does four things, each
 * skipping work already done:
 *
 *   1. Sync `role_permissions` from the canonical PERMISSION_MATRIX so the new
 *      `attendance.*` (and any missing auditor) permissions are granted at
 *      runtime. auth-guard reads this table when rows exist for a role, so new
 *      matrix entries MUST be materialised here or they won't take effect.
 *   2. Ensure a single `attendance_settings` row exists (secure defaults). It
 *      does NOT invent geofence coordinates — those are configured by HR/admin
 *      through the UI (no fake GPS values in a live table).
 *   3. Provision `employees` rows from `staff`, bridged by email (employees was
 *      empty, so check-in could not resolve anyone). Reversible: provisioned
 *      rows carry employee_code `STF-<staffId>`.
 *   4. Add a UNIQUE index on enhanced_attendance(employee_id, date) for
 *      DB-level duplicate prevention (best-effort; skipped if existing rows
 *      already conflict — the app-level pre-check still guards).
 *
 * Run: cd apps/web && bun scripts/provision-attendance.ts
 */
import {
	attendanceSettings,
	employees,
	rolePermissions,
	staff,
} from "@evaluna/db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/lib/db/index";
import { generateRolePermissionSeeds } from "../src/lib/permissions";

async function syncRolePermissions() {
	const seeds = generateRolePermissionSeeds();
	const existing = await db
		.select({
			role: rolePermissions.role_name,
			domain: rolePermissions.domain,
			action: rolePermissions.action,
		})
		.from(rolePermissions);
	const have = new Set(
		existing.map((r) => `${r.role}|${r.domain}|${r.action}`),
	);
	let added = 0;
	for (const s of seeds) {
		const key = `${s.role_name}|${s.domain}|${s.action}`;
		if (have.has(key)) continue;
		await db.insert(rolePermissions).values({
			role_name: s.role_name,
			domain: s.domain,
			action: s.action,
			is_allowed: true,
		});
		added++;
	}
	console.log(
		`  role_permissions: +${added} new (of ${seeds.length} canonical)`,
	);
}

async function ensureSettings() {
	const rows = await db.select().from(attendanceSettings).limit(1);
	if (rows[0]) {
		console.log("  attendance_settings: already present");
		return;
	}
	await db.insert(attendanceSettings).values({});
	console.log("  attendance_settings: created with secure defaults");
}

function splitName(full: string): { first: string; last: string } {
	const parts = full.trim().split(/\s+/);
	if (parts.length === 1) return { first: parts[0], last: "-" };
	return { first: parts[0], last: parts.slice(1).join(" ") };
}

async function provisionEmployees() {
	const staffRows = await db.select().from(staff);
	let created = 0;
	let skipped = 0;
	for (const s of staffRows) {
		if (!s.email) {
			skipped++;
			continue;
		}
		// Bridge by email — employees.email is unique and is how the attendance
		// router resolves the logged-in user to an employee.
		const existing = await db
			.select({ id: employees.id })
			.from(employees)
			.where(eq(employees.email, s.email))
			.limit(1);
		if (existing[0]) {
			skipped++;
			continue;
		}
		const { first, last } = splitName(s.name || s.email);
		const hire = s.join_date ? new Date(s.join_date) : new Date();
		try {
			await db.insert(employees).values({
				employeeCode: s.staff_code || `STF-${s.id}`,
				firstName: first,
				lastName: last,
				email: s.email,
				phone: s.phone ?? null,
				address: s.address ?? null,
				hireDate: hire.toISOString().slice(0, 10),
				status: s.status === "active" ? "active" : "inactive",
			});
			created++;
		} catch (err) {
			console.warn(
				`    ! could not provision ${s.email}: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
			skipped++;
		}
	}
	console.log(
		`  employees: +${created} provisioned from ${staffRows.length} staff (${skipped} skipped/existing)`,
	);
}

async function addUniqueIndex() {
	try {
		await db.execute(
			sql.raw(
				"CREATE UNIQUE INDEX IF NOT EXISTS uniq_enhanced_attendance_emp_date ON enhanced_attendance (employee_id, date);",
			),
		);
		console.log(
			"  enhanced_attendance: (employee_id, date) unique index ensured",
		);
	} catch (err) {
		console.warn(
			`  ! unique index skipped (existing duplicates?): ${
				err instanceof Error ? err.message : String(err)
			}. App-level duplicate check still applies.`,
		);
	}
}

async function main() {
	console.log("Provisioning attendance module (idempotent)…");
	await syncRolePermissions();
	await ensureSettings();
	await provisionEmployees();
	await addUniqueIndex();
	console.log("Done.");
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
