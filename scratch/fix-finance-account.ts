import { eq } from "drizzle-orm";
import { db, user, userRoles, roles, staff } from "../packages/db/src/index";

async function main() {
	console.log("Fixing finance@evaluna.dev account in database...");

	// 1. Get or create role
	let [roleRecord] = await db
		.select()
		.from(roles)
		.where(eq(roles.name, "finance"))
		.limit(1);

	if (!roleRecord) {
		const [newRole] = await db
			.insert(roles)
			.values({
				name: "finance",
				description: "Finance Role",
				permissions: {},
			})
			.returning();
		roleRecord = newRole;
		console.log("Created finance role:", roleRecord.id);
	}

	// 2. Find user
	const [u] = await db
		.select()
		.from(user)
		.where(eq(user.email, "finance@evaluna.dev"))
		.limit(1);

	if (u) {
		await db
			.update(user)
			.set({
				role: "finance",
				status: "ACTIVE",
			} as any)
			.where(eq(user.id, u.id));

		const [existingUR] = await db
			.select()
			.from(userRoles)
			.where(eq(userRoles.user_id, u.id))
			.limit(1);

		if (!existingUR) {
			await db.insert(userRoles).values({
				user_id: u.id,
				role_id: roleRecord.id,
			});
		} else {
			await db
				.update(userRoles)
				.set({ role_id: roleRecord.id })
				.where(eq(userRoles.user_id, u.id));
		}
		console.log("Updated user finance@evaluna.dev to role finance (id:", roleRecord.id, ")");
	} else {
		console.log("User finance@evaluna.dev not found yet in database. It will auto-signup on first login.");
	}
}

main().then(() => process.exit(0)).catch((err) => {
	console.error(err);
	process.exit(1);
});
