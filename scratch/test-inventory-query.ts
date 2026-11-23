import { db, products, branchInventory, dailyProductDiscounts } from "../packages/db/src/index";
import { and, eq, or, sql, asc } from "drizzle-orm";

async function main() {
	const targetBranchId = 1;
	const conditions: any[] = [or(eq(products.is_deleted, false), sql`${products.is_deleted} IS NULL`)];

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

	console.log("Successfully fetched products via inventory query:", productRows.length);
	console.log("First product:", productRows[0]);
}

main().then(() => process.exit(0)).catch((e) => {
	console.error(e);
	process.exit(1);
});
