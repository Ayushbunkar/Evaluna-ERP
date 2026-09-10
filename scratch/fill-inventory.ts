import { and, eq } from "drizzle-orm";
import { db } from "../packages/db/src/index";
import { branches, branchInventory, products } from "../packages/db/src/schema";

async function run() {
	console.log("--- FILLING ALL BRANCH INVENTORY ITEMS TO 20 STOCK EACH ---");

	// 1. Fetch all branches
	const allBranches = await db.select().from(branches);
	console.log(`Found ${allBranches.length} branches.`);

	// 2. Fetch all products
	const allProducts = await db.select().from(products);
	console.log(`Found ${allProducts.length} products.`);

	let updateCount = 0;
	let insertCount = 0;

	for (const branch of allBranches) {
		console.log(
			`Processing inventory for branch: ${branch.name} (ID: ${branch.id})...`,
		);

		for (const product of allProducts) {
			// Check if record exists
			const [existing] = await db
				.select()
				.from(branchInventory)
				.where(
					and(
						eq(branchInventory.branch_id, branch.id),
						eq(branchInventory.product_id, product.id),
					),
				)
				.limit(1);

			if (existing) {
				// Update to 20 stock and 0 reserved
				await db
					.update(branchInventory)
					.set({
						in_stock: 20,
						reserved_stock: 0,
					})
					.where(eq(branchInventory.id, existing.id));
				updateCount++;
			} else {
				// Insert new record with 20 stock
				await db.insert(branchInventory).values({
					branch_id: branch.id,
					product_id: product.id,
					in_stock: 20,
					reserved_stock: 0,
					reorder_level: 5,
				});
				insertCount++;
			}
		}
	}

	console.log("\nInventory Refill Complete!");
	console.log(`- Updated existing records: ${updateCount}`);
	console.log(`- Inserted new records: ${insertCount}`);
	console.log(
		"- Every item in every branch is now filled with exactly 20 units in stock!",
	);

	process.exit(0);
}

run().catch((err) => {
	console.error("Failed to refill inventory:", err);
	process.exit(1);
});
