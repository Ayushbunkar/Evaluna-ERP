import { db } from "../packages/db/src/index";
import {
	employees,
	payroll,
	payrollAudit,
	staff,
	transactions,
} from "../packages/db/src/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";

async function main() {
	console.log("Starting fake employee cleanup...");

	const fakeEmails = [
		"pooja.sharma@evaluna.com",
		"suresh.kumar@evaluna.com",
		"rahul.yadav@evaluna.com",
		"vikram.patel@evaluna.com",
		"anita.verma@evaluna.com",
		"test.rahul.packing@evaluna.local",
	];

	// 1. Find fake staff IDs
	const fakeStaff = await db
		.select({ id: staff.id, name: staff.name, email: staff.email })
		.from(staff)
		.where(inArray(staff.email, fakeEmails));

	console.log("Found fake staff records:", fakeStaff.length);
	const fakeStaffIds = fakeStaff.map((s) => s.id);

	if (fakeStaffIds.length > 0) {
		const fakePayrolls = await db
			.select({ id: payroll.id })
			.from(payroll)
			.where(inArray(payroll.staff_id, fakeStaffIds));

		const fakePayrollIds = fakePayrolls.map((p) => p.id);
		console.log("Found fake payroll IDs:", fakePayrollIds);

		if (fakePayrollIds.length > 0) {
			for (const pid of fakePayrollIds) {
				await db.delete(payrollAudit).where(eq(payrollAudit.payrollId, pid));
				await db
					.delete(transactions)
					.where(
						and(
							eq(transactions.reference_type, "payroll"),
							eq(transactions.reference_id, pid),
						),
					);
				await db.delete(payroll).where(eq(payroll.id, pid));
			}
			console.log("Deleted fake payroll, audit, and transaction records.");
		}

		await db.delete(staff).where(inArray(staff.id, fakeStaffIds));
		console.log("Deleted fake staff records.");
	}

	// 2. Delete fake employees in employees table
	const fakeEmps = await db
		.select({ id: employees.id, email: employees.email })
		.from(employees)
		.where(
			or(
				sql`${employees.email} ILIKE '%@hotmail.com'`,
				sql`${employees.email} ILIKE '%@yahoo.com'`,
				inArray(employees.email, fakeEmails),
			),
		);

	console.log("Found fake employees count:", fakeEmps.length);
	if (fakeEmps.length > 0) {
		const empIds = fakeEmps.map((e) => e.id);
		for (const id of empIds) {
			try {
				await db.delete(employees).where(eq(employees.id, id));
			} catch (e) {
				console.log(`Could not delete emp #${id}:`, e);
			}
		}
		console.log("Cleaned up fake employees table records.");
	}

	console.log("Cleanup completed successfully!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Cleanup error:", err);
	process.exit(1);
});
