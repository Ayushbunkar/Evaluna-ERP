import { db } from "./src/lib/db/index";
import { deliveryTrips, tripStops, deliveryStops, gpsLogs, proofOfDeliveries, tripCollections, orders } from "@evaluna/db/schema";
import { eq, isNotNull } from "drizzle-orm";

async function run() {
  console.log("Clearing all delivery trips and unlinking orders...");
  await db.delete(proofOfDeliveries);
  await db.delete(gpsLogs);
  await db.delete(tripCollections);
  await db.delete(deliveryStops);
  await db.delete(tripStops);
  await db.delete(deliveryTrips);
  
  await db.update(orders).set({ driver_id: null, status: "confirmed" }).where(isNotNull(orders.driver_id));
  
  console.log("Successfully cleared all delivery trips!");
  process.exit(0);
}

run().catch((e) => {
  console.error("Error clearing trips:", e);
  process.exit(1);
});
