import { db } from "../lib/db";
import { deliveryTrips, tripStops } from "@evaluna/db/schema";

async function main() {
	const trips = await db.select().from(deliveryTrips);
	console.log("=== DB TRIPS ===");
	console.log("Count:", trips.length);
	for (const t of trips) {
		console.log(`Trip #${t.id}: status=${t.status}, driver_id=${t.driver_id}, vehicle_id=${t.vehicle_id}, route_id=${t.route_id}`);
	}

	const stops = await db.select().from(tripStops);
	console.log("=== DB STOPS ===");
	console.log("Count:", stops.length);
	for (const s of stops.slice(0, 15)) {
		console.log(`Stop #${s.id}: trip_id=${s.trip_id}, customer_id=${s.customer_id}, status=${s.status}`);
	}

	process.exit(0);
}

main().catch(console.error);
