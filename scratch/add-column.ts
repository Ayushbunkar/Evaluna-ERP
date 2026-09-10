import { sql } from "drizzle-orm";
import { db } from "../packages/db/src/index";

async function run() {
	console.log("ADDING COLUMN original_items TO orders TABLE...");
	try {
		await db.execute(
			sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_items JSONB;`,
		);
		console.log("Column original_items successfully added!");
	} catch (err) {
		console.error("Error adding column:", err);
	}
	process.exit(0);
}

run();
