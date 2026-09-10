import { db } from "../packages/db/src/index";
import { customers, routeStops, deliveryRoutes } from "../packages/db/src/schema";
import { inArray, eq } from "drizzle-orm";

async function run() {
	console.log("--- CHECKING FOR MISSING FOREIGN KEY CUSTOMERS IN CURRENT ROUTE ---");

	const targetCustomerIds = [59, 72, 68, 69];

	const existingCustomers = await db
		.select({ id: customers.id, name: customers.name })
		.from(customers)
		.where(inArray(customers.id, targetCustomerIds));

	console.log("Customers found in database:");
	for (const c of existingCustomers) {
		console.log(`- Customer ID: ${c.id}, Name: ${c.name}`);
	}

	const foundIds = existingCustomers.map((c) => c.id);
	const missingIds = targetCustomerIds.filter((id) => !foundIds.includes(id));

	if (missingIds.length > 0) {
		console.log(`\n🚨 CRITICAL DIAGNOSIS: Missing Customer IDs found: [${missingIds.join(", ")}]!`);
		console.log("These customer IDs do NOT exist inside the 'customers' table.");
		console.log("This causes PostgreSQL to abort the trip_stops insert on a FOREIGN KEY VIOLATION constraint!");
	} else {
		console.log("\nAll customer IDs exist in the database! Checking other constraints...");
	}

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
