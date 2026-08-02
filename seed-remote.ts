import { eq } from "drizzle-orm";
import { auth } from "./apps/web/src/lib/auth";
import { db } from "./apps/web/src/lib/db";
import { user } from "./packages/db/src/schema";

const USERS_TO_SEED = [
	{ name: "Super Admin", email: "admin@evaluna.com", role: "superadmin" },
	{ name: "Sales Manager", email: "sales@evaluna.com", role: "sales_person" },
	{ name: "Auditor Desk", email: "auditor@evaluna.com", role: "auditor" },
	{ name: "HR Manager", email: "hr@evaluna.com", role: "hr" },
	{ name: "Warehouse Picker", email: "picker@evaluna.com", role: "picker" },
	{ name: "Warehouse Putter", email: "putter@evaluna.com", role: "putter" },
	{ name: "Driver / Delivery", email: "driver@evaluna.com", role: "driver" },
	{ name: "Marketing Exec", email: "marketing@evaluna.com", role: "marketing" },
];

async function main() {
	console.log("Seeding remote database...");
	const password = "Password@123";

	for (const u of USERS_TO_SEED) {
		const existing = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, u.email))
			.limit(1);

		if (existing.length === 0) {
			console.log(`Creating user: ${u.email}`);
			const result = await auth.api.signUpEmail({
				body: {
					email: u.email,
					password: password,
					name: u.name,
				},
			});

			if (result) {
				await db
					.update(user)
					.set({ role: u.role } as any)
					.where(eq(user.email, u.email));
				console.log(`Updated role for ${u.email} to ${u.role}`);
			}
		} else {
			console.log(`User ${u.email} already exists. Updating role...`);
			await db
				.update(user)
				.set({ role: u.role } as any)
				.where(eq(user.email, u.email));
		}
	}

	console.log("Done seeding remote database!");
	process.exit(0);
}

main().catch(console.error);
