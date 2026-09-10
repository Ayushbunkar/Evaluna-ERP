import { createAuth } from "../packages/auth/src/index";
import { db } from "../packages/db/src/index";

const auth = createAuth({
	db: db as any,
});

async function run() {
	console.log("TESTING GET SESSION API...");

	// Let's find an active session in the database
	const activeSession = await db.query.session.findFirst({
		with: {
			user: true,
		},
	});

	if (!activeSession) {
		console.log(
			"No active sessions found in the database. Please make sure you are logged in.",
		);
		process.exit(1);
	}

	console.log("Active Session Token:", activeSession.token);
	console.log("Session User:", activeSession.user.email);

	// Create real Headers object
	const headers = new Headers();
	headers.set("cookie", `evaluna.session_token=${activeSession.token}`);

	// Let's call the actual getSession API of Better Auth
	const res = await auth.api.getSession({
		headers,
	});

	console.log(
		"BETTER AUTH GET_SESSION RESPONSE:",
		JSON.stringify(res, null, 2),
	);
	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
