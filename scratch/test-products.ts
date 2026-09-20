import { db, products, branchInventory, dailyProductDiscounts } from "../packages/db/src/index";
import { eq, or, sql } from "drizzle-orm";

async function main() {
	const allProducts = await db.select().from(products);
	console.log("Total products in DB:", allProducts.length);
	if (allProducts.length > 0) {
		console.log("Sample product is_deleted:", allProducts[0].is_deleted, "is_hidden:", allProducts[0].is_hidden);
	}

	const branchInv = await db.select().from(branchInventory);
	console.log("Total branch inventory records:", branchInv.length);

	const discounts = await db.select().from(dailyProductDiscounts);
	console.log("Total daily product discounts:", discounts.length);
}

main().then(() => process.exit(0)).catch((e) => {
	console.error(e);
	process.exit(1);
});
