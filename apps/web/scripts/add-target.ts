import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

async function main() {
	try {
		await db.execute(
			sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS monthly_sales_target numeric(10,2) DEFAULT '0';`,
		);
		console.log("Column added successfully.");
		process.exit(0);
	} catch (e) {
		console.error("Failed to add column:", e);
		process.exit(1);
	}
}

main();
