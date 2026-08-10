import { orders } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { db } from "./src/lib/db";

async function main() {
	try {
		await db.delete(orders).where(eq(orders.id, 208));
		console.log("Successfully deleted order 208");
	} catch (error: any) {
		console.error("Failed to delete order:");
		console.error(error.message);
	}
	process.exit(0);
}

main();
