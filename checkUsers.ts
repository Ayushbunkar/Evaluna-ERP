import { eq } from "drizzle-orm";
import { db } from "./packages/db/src/index";
import { staff } from "./packages/db/src/schema/hrms";

async function run() {
	const users = await db.select().from(staff);
	console.log(
		"Users before:",
		users.map((u) => ({ email: u.email, role: u.role })),
	);

	// Update all users to super_admin just so the user can test the dashboard
	await db.update(staff).set({ role: "super_admin" });

	const updated = await db.select().from(staff);
	console.log(
		"Users after:",
		updated.map((u) => ({ email: u.email, role: u.role })),
	);

	process.exit(0);
}
run();
