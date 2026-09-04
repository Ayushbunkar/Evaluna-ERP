import { db } from "../packages/db/src/index";
import { user } from "../packages/db/src/index";

async function main() {
	const users = await db.select().from(user);
	console.log("\n--- REGISTERED AUTH USERS IN DATABASE ---");
	console.table(
		users.map((u) => ({
			id: u.id,
			name: u.name,
			email: u.email,
			role: u.role || u.roleName,
			status: u.status || "ACTIVE",
		}))
	);
}
main()
	.catch(console.error)
	.finally(() => process.exit(0));
