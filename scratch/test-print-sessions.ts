import { db } from "../packages/db/src/index";

async function run() {
	console.log("PRINTING ALL SESSIONS...");
	const sessions = await db.query.session.findMany({
		with: {
			user: true,
		},
		limit: 5,
	});

	console.log("SESSIONS IN DB:", JSON.stringify(sessions, null, 2));
	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
