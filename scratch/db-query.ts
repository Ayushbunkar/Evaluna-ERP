import { db } from "../packages/db/src/index";
import { sql } from "drizzle-orm";

async function run() {
	console.log("INSPECTING UNIQUE INDEXES AND CONSTRAINTS ON 'trip_stops' TABLE...");

	const result = await db.execute(sql`
		SELECT 
			conname AS constraint_name, 
			pg_get_constraintdef(c.oid) AS constraint_definition
		FROM pg_constraint c
		JOIN pg_class t ON c.conrelid = t.oid
		WHERE t.relname = 'trip_stops';
	`);

	console.log("Constraints found:");
	console.log(JSON.stringify(result.rows, null, 2));

	const indexes = await db.execute(sql`
		SELECT
			schemaname,
			tablename,
			indexname,
			indexdef
		FROM pg_indexes
		WHERE tablename = 'trip_stops';
	`);

	console.log("\nIndexes found:");
	console.log(JSON.stringify(indexes.rows, null, 2));

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
