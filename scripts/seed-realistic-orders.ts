import { db } from "../apps/web/src/lib/db";
import {
	customers,
	orderItems,
	orders,
	products,
	transactions,
	user,
} from "../packages/db/src/schema";

async function main() {
	console.log("Seeding realistic sample orders for imported contacts & products...");

	const allCusts = await db.select().from(customers).limit(100);
	const allProds = await db.select().from(products).limit(50);
	const salesUser = await db.query.user.findFirst({
		where: (u, { eq }) => eq(u.email, "sales@evaluna.com"),
	});

	const userId = salesUser?.id || "sales-system-user";

	if (allCusts.length === 0 || allProds.length === 0) {
		console.error("Customers or products not found in database.");
		process.exit(1);
	}

	console.log(`Found ${allCusts.length} customers and ${allProds.length} products to create orders with.`);

	const statuses = ["completed", "completed", "pending", "confirmed", "under_review", "pending_review"];

	let orderCount = 0;

	for (let i = 0; i < Math.min(allCusts.length, 35); i++) {
		const customer = allCusts[i];
		const numItems = (i % 4) + 1;
		const status = statuses[i % statuses.length];

		// Pick random products
		const selectedProducts: Array<{
			id: number;
			name: string;
			price: number;
			qty: number;
		}> = [];

		for (let j = 0; j < numItems; j++) {
			const prod = allProds[(i * 3 + j) % allProds.length];
			const price = Number.parseFloat(prod.price || "100") || 100;
			const qty = (j + 1) * 2;
			selectedProducts.push({
				id: prod.id,
				name: prod.name,
				price,
				qty,
			});
		}

		const total = selectedProducts.reduce(
			(acc, cur) => acc + cur.price * cur.qty,
			0,
		);

		const [createdOrder] = await db
			.insert(orders)
			.values({
				customer_id: customer.id,
				branch_id: 1, // Bhopal Main Warehouse
				status: status,
				finance_status: status === "completed" ? "paid" : "pending",
				total_amount: total.toFixed(2),
				user_uid: userId,
				original_items: selectedProducts.map((p) => ({
					productId: p.id,
					name: p.name,
					quantity: p.qty,
					price: p.price,
				})),
				created_at: new Date(Date.now() - i * 3600 * 1000 * 4), // Staggered timestamps
				updated_at: new Date(Date.now() - i * 3600 * 1000 * 4),
			})
			.returning();

		if (createdOrder) {
			for (const p of selectedProducts) {
				await db.insert(orderItems).values({
					order_id: createdOrder.id,
					product_id: p.id,
					quantity: p.qty,
					price: p.price.toFixed(2),
				});
			}

			// Add a transaction record for completed orders
			if (status === "completed") {
				await db.insert(transactions).values({
					order_id: createdOrder.id,
					user_uid: userId,
					type: "in",
					amount: total.toFixed(2),
					original_amount: total.toFixed(2),
					description: `Payment for Order #${createdOrder.id} - ${customer.name}`,
					category: "sale",
					reference_type: "order",
					reference_id: createdOrder.id.toString(),
					status: "completed",
					reconciliation_status: "reconciled",
					created_at: createdOrder.created_at || new Date(),
				});
			}

			orderCount++;
		}
	}

	console.log(`Successfully seeded ${orderCount} realistic orders with items and transactions!`);
	process.exit(0);
}

main().catch((err) => {
	console.error("Seeding failed:", err);
	process.exit(1);
});
