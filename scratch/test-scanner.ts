import { db } from "../packages/db/src/index";
import { deliveryTrips, tripStops } from "../packages/db/src/schema/delivery";
import { sql } from "drizzle-orm";

async function run() {
	console.log("SIMULATING TRANSACTIONAL TRIP CREATION TO CAPTURE DEEP POSTGRES EXCEPTION...");

	try {
		await db.transaction(async (tx) => {
			// 1. Create a dummy trip inside transaction
			const [trip] = await tx
				.insert(deliveryTrips)
				.values({
					driver_id: "driver@evaluna.com",
					vehicle_id: null,
					status: "pending",
				})
				.returning();

			console.log(`Generated Trip ID inside transaction: ${trip.id}`);

			// 2. Try to insert the 4 stops that failed
			await tx
				.insert(tripStops)
				.values([
					{ trip_id: trip.id, customer_id: 59, sequence: 1, status: "pending" },
					{ trip_id: trip.id, customer_id: 72, sequence: 2, status: "pending" },
					{ trip_id: trip.id, customer_id: 68, sequence: 3, status: "pending" },
					{ trip_id: trip.id, customer_id: 69, sequence: 4, status: "pending" },
				]);

			console.log("Transaction insert succeeded programmatically!");
		});
	} catch (e: any) {
		console.error("\n🚨 [CAPTURE EXCEPTION DETAILS] 🚨\n");
		console.error("Error Code:", e.code);
		console.error("Error Message:", e.message);
		console.error("Error Detail:", e.detail);
		console.error("Error Constraint:", e.constraint);
		console.error("Error Table:", e.table);
		console.error("Full Error Object:", e);
	}

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
