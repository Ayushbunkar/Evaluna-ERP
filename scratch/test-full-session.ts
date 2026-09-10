import * as crypto from "crypto";
import { createAuth } from "../packages/auth/src/index";
import { db } from "../packages/db/src/index";

const auth = createAuth({
	db: db as any,
});

async function run() {
	console.log("CREATING FRESH SESSION AND RETRIEVING...");

	const putterUser = await db.query.user.findFirst({
		where: (u, { eq }) => eq(u.email, "putter@evaluna.com"),
	});

	if (!putterUser) {
		console.log("Putter user not found!");
		process.exit(1);
	}

	const token = "test_token_putter_1234567890";
	const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

	// Clean up any old test sessions
	await db
		.delete(require("../packages/db/src/schema").session)
		.where(
			require("drizzle-orm").eq(
				require("../packages/db/src/schema").session.token,
				hashedToken,
			),
		);

	await db.insert(require("../packages/db/src/schema").session).values({
		id: "test_session_id",
		userId: putterUser.id,
		token: hashedToken, // Use SHA-256 hashed token for Better Auth v1
		expiresAt,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	console.log("Created test session in DB with hashed token. Fetching...");

	const headers = new Headers();
	headers.set("cookie", `evaluna.session_token=${token}`);

	const res = await auth.api.getSession({
		headers,
	});

	console.log(
		"BETTER AUTH GET_SESSION RESPONSE:",
		JSON.stringify(res, null, 2),
	);

	// Clean up
	await db
		.delete(require("../packages/db/src/schema").session)
		.where(
			require("drizzle-orm").eq(
				require("../packages/db/src/schema").session.token,
				hashedToken,
			),
		);

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
