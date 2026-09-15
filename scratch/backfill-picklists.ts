import { and, eq, inArray, isNull, notInArray } from "drizzle-orm";
import { db } from "../packages/db/src/index";
import {
	orderItems,
	orders,
	pickListItems,
	pickLists,
} from "../packages/db/src/schema";

async function run() {
	console.log("--- BACKFILLING MISSING PICKLISTS FOR CONFIRMED ORDERS ---");

	// 1. Find all confirmed orders
	const confirmedOrders = await db.query.orders.findMany({
		where: inArray(orders.status, ["confirmed", "completed"]),
		with: {
			orderItems: true,
		},
	});

	console.log(
		`Found ${confirmedOrders.length} confirmed/completed orders in total.`,
	);

	let backfillCount = 0;

	for (const order of confirmedOrders) {
		// Check if a picklist already exists for this order
		const [existing] = await db
			.select()
			.from(pickLists)
			.where(eq(pickLists.order_id, order.id))
			.limit(1);

		if (!existing) {
			console.log(`Backfilling picklist for Order #${order.id}...`);

			// Insert pending picklist
			const [pl] = await db
				.insert(pickLists)
				.values({
					order_id: order.id,
					reference_type: "sale",
					reference_id: order.id,
					status: "pending",
					priority: "normal",
				})
				.returning();

			if (pl && order.orderItems && order.orderItems.length > 0) {
				await db.insert(pickListItems).values(
					order.orderItems.map((it) => ({
						pick_list_id: pl.id,
						product_id: it.product_id,
						quantity_ordered: it.quantity,
						quantity_picked: 0,
						status: "pending",
					})),
				);
			}
			backfillCount++;
		}
	}

	console.log(
		`\nBackfill Complete! Generated ${backfillCount} missing picklists.`,
	);
	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
