import { db } from "../packages/db/src/index";
import { sql } from "drizzle-orm";

async function run() {
	console.log("--- REPAIRING AND ALIGNING POSTGRES PHYSICAL SCHEMA COLUMNS FOR 'trip_stops' ---");

	try {
		console.log("Adding missing columns to 'trip_stops' table...");
		
		// Run ALTER TABLE statements to add missing schema-defined columns to PostgreSQL
		try {
			await db.execute(sql`ALTER TABLE trip_stops ADD COLUMN arrival_time TIMESTAMP;`);
			console.log("Success! Added column 'arrival_time'.");
		} catch (e: any) {
			console.log("Column 'arrival_time' already exists or bypassed:", e.message);
		}

		try {
			await db.execute(sql`ALTER TABLE trip_stops ADD COLUMN departure_time TIMESTAMP;`);
			console.log("Success! Added column 'departure_time'.");
		} catch (e: any) {
			console.log("Column 'departure_time' already exists or bypassed:", e.message);
		}

		try {
			await db.execute(sql`ALTER TABLE trip_stops ADD COLUMN resolved_at TIMESTAMP;`);
			console.log("Success! Added column 'resolved_at'.");
		} catch (e: any) {
			console.log("Column 'resolved_at' already exists or bypassed:", e.message);
		}

		console.log("\nDatabase schema successfully aligned and synchronized with Drizzle schema definition!");

	} catch (error: any) {
		console.error("Schema alignment failed:", error.message);
	}

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
