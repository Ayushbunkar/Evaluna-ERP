import { eq } from "drizzle-orm";
import { db } from "./apps/web/src/lib/db";
import { roles, user, userRoles } from "./packages/db/src/schema";

async function run() {
	const userRecord = await db.query.user.findFirst({
		where: eq(user.email, "putter@evaluna.com"),
		with: {
			userRoles: {
				with: {
					role: true,
				},
			},
		},
	});

	console.log("USER RECORD:", JSON.stringify(userRecord, null, 2));
	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
