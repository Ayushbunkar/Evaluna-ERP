import { db } from "../packages/db/src/index";
import { orders, pickLists } from "../packages/db/src/schema";
import { isNull, inArray, eq } from "drizzle-orm";

async function run() {
	console.log("--- CLEANING UP PICKER DASHBOARD TASK QUEUE (SAFE UPDATE) ---");

	// Find all mock orders (where original_items is null)
	const mockOrders = await db
		.select({ id: orders.id })
		.from(orders)
		.where(isNull(orders.original_items));

	console.log(`Found ${mockOrders.length} mock orders.`);

	if (mockOrders.length === 0) {
		console.log("No mock orders found. Clean up complete!");
		process.exit(0);
	}

	const mockOrderIds = mockOrders.map((o) => o.id);

	// Safe Update: Move all mock picklists to 'completed' so they disappear from the pending picking queue
	const result = await db
		.update(pickLists)
		.set({ status: "completed" }) // Marks them completed, clearing the pending queue instantly!
		.where(inArray(pickLists.order_id, mockOrderIds));

	console.log(`\nSuccess! Cleaned up the Picker queue. All mock order picking tasks have been cleared!`);
	console.log(`Only real, customer-submitted orders will now show in the Pending Picking Queue.`);
	process.exit(0);
}

run().catch((err) => {
	console.error("Queue cleanup failed:", err);
	process.exit(1);
});
