import { desc } from "drizzle-orm";
import { db } from "../apps/web/src/lib/db/index.js";
import { transactions } from "../packages/db/src/schema/index.js";

async function main() {
	const tx = await db
		.select()
		.from(transactions)
		.orderBy(desc(transactions.created_at))
		.limit(5);
	console.log(tx);
	process.exit(0);
}
main();
