import { createAuth } from "../packages/auth/src/index";
import { db } from "../packages/db/src/index";

const auth = createAuth({
	db: db as any,
});

async function run() {
	console.log("TESTING PUTTER LOGIN...");

	// Try to get security profile for putter@evaluna.com first
	const { UserManagement } = require("../packages/db/src/index");
	const userRecord = await db.query.user.findFirst({
		where: (u, { eq }) => eq(u.email, "putter@evaluna.com"),
	});

	if (!userRecord) {
		console.log("Putter user not found!");
		process.exit(1);
	}

	console.log("Putter User ID:", userRecord.id);

	const profile = await UserManagement.getSecurityProfileByUserId(
		userRecord.id,
	);
	console.log("SECURITY PROFILE:", JSON.stringify(profile, null, 2));

	// Let's call the auth session getter manually
	const sessionGetter = auth.options.session?.getters?.data;
	if (sessionGetter) {
		const sessionData = await sessionGetter({ userId: userRecord.id });
		console.log("SESSION GETTER DATA:", JSON.stringify(sessionData, null, 2));
	} else {
		console.log("No session getter data function found!");
	}

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
