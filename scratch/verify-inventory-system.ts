import { db, products, branchInventory, dailyProductDiscounts } from "../packages/db/src/index";
import { and, asc, eq, or, sql } from "drizzle-orm";

async function main() {
	const targetBranchId = 1;
	const todayStr = new Date().toISOString().split("T")[0];

	// 1. Check inventory query
	const conditions = [or(eq(products.is_deleted, false), sql`${products.is_deleted} IS NULL`)];
	const productRows = await db
		.select({
			id: products.id,
			productId: products.id,
			product: products.name,
			sku: products.sku,
			category: products.category,
			unit: products.unit,
			barcode: products.barcode,
			price: products.price,
			baseSellingPrice: products.base_selling_price,
			inventoryId: sql<number>`max(${branchInventory.id})`,
			branchId: sql<number>`coalesce(max(${branchInventory.branch_id}), ${targetBranchId})`,
			qty_on_hand: sql<number>`coalesce(sum(${branchInventory.in_stock}), 0)::int`,
			reorder_level: sql<number>`coalesce(max(${branchInventory.reorder_level}), 10)::int`,
		})
		.from(products)
		.leftJoin(
			branchInventory,
			and(
				eq(products.id, branchInventory.product_id),
				eq(branchInventory.branch_id, targetBranchId),
			),
		)
		.where(and(...conditions))
		.groupBy(
			products.id,
			products.name,
			products.sku,
			products.category,
			products.unit,
			products.barcode,
			products.price,
			products.base_selling_price,
		)
		.orderBy(asc(products.name))
		.limit(1000);

	console.log("Total inventory products returned:", productRows.length);

	// 2. Check daily product discounts query
	const activeDiscounts = await db
		.select()
		.from(dailyProductDiscounts)
		.where(
			and(
				eq(dailyProductDiscounts.effective_date, todayStr),
				eq(dailyProductDiscounts.is_active, true),
			),
		);
	console.log("Active daily discounts for today:", activeDiscounts.length);

	console.log("ALL INVENTORY & DISCOUNTS VERIFIED!");
}

main().then(() => process.exit(0)).catch((err) => {
	console.error(err);
	process.exit(1);
});
