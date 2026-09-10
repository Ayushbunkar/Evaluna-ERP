import { db } from "../packages/db/src/index";

async function run() {
	console.log("TESTING DYNAMIC PICKLIST ITEMS RETRIEVAL...");
	
	const list = await db.query.pickLists.findFirst({
		where: (pl, { ne, eq }) => eq(pl.id, 7), // Let's check PL-7 or above!
		with: {
			pickListItems: {
				with: {
					product: true,
				},
			},
		},
	});

	if (!list) {
		console.log("No picklist with ID 7 found. Let's find any picklist that has multiple items:");
		const allLists = await db.query.pickLists.findMany({
			with: {
				pickListItems: {
					with: {
						product: true,
					},
				},
			},
			limit: 10,
		});
		
		for (const pl of allLists) {
			console.log(`Picklist PL-${pl.id} (Order ORD-${pl.order_id}) has ${pl.pickListItems.length} items.`);
		}
	} else {
		console.log(`Picklist PL-${list.id} (Order ORD-${list.order_id}) has ${list.pickListItems.length} items:`);
		for (const item of list.pickListItems) {
			console.log(`- ${item.product?.name}: Qty Ordered: ${item.quantity_ordered}`);
		}
	}

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
