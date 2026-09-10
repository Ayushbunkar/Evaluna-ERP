import { db } from "../packages/db/src/index";
import { customers, orders, orderItems } from "../packages/db/src/schema";
import { eq, inArray } from "drizzle-orm";

async function run() {
	console.log("--- SEEDING 2 REALISTIC PENDING ORDERS FOR EACH OF THE 5 BERASIA CUSTOMERS ---");

	const allowedEmails = [
		"verma.berasia@gmail.com",
		"patel.lalariya@gmail.com",
		"sharma.runaha@gmail.com",
		"choudhary.gunga@gmail.com",
		"bundela.harrakheda@gmail.com"
	];

	// Fetch our 5 seeded Berasia customers cleanly using inArray
	const dbCusts = await db
		.select()
		.from(customers)
		.where(inArray(customers.email, allowedEmails));

	console.log(`Found ${dbCusts.length} active Berasia customer records in database.`);

	if (dbCusts.length === 0) {
		console.log("No Berasia customers found. Please seed customers first!");
		process.exit(1);
	}

	// First 5 real-world products in Bhopal Main database (with prices)
	const productsList = [
		{ id: 1, name: "Farari Spicy Namkeen (फरारतीखा नमकीन)", price: 63.00, sku: "SKU-FARARI" },
		{ id: 2, name: "Sprite (स्प्राइट) Rs 20", price: 485.00, sku: "SKU-SPRITE" },
		{ id: 3, name: "Maaza (माजा) 600 ml", price: 705.00, sku: "SKU-MAAZA" },
		{ id: 4, name: "Bharat Zarda Green (भारत जर्दा हरा) Rs 10", price: 43.00, sku: "SKU-ZARDA10" },
		{ id: 5, name: "Bharat Zarda Green (भारत जर्दा हरा) Rs 5", price: 43.00, sku: "SKU-ZARDA5" }
	];

	let orderCount = 0;

	for (const cust of dbCusts) {
		console.log(`\nSeeding 2 orders for: ${cust.name}...`);

		// Order #1 details
		const items1 = [
			{ productId: productsList[0].id, name: productsList[0].name, quantity: 5, price: productsList[0].price, sku: productsList[0].sku },
			{ productId: productsList[3].id, name: productsList[3].name, quantity: 10, price: productsList[3].price, sku: productsList[3].sku }
		];
		const total1 = items1.reduce((sum, item) => sum + (item.price * item.quantity), 0);

		const [o1] = await db.insert(orders).values({
			customer_id: cust.id,
			branch_id: 1, // Bhopal Main Warehouse
			status: "pending", // Appears in salesperson's inbox!
			total_amount: total1.toString(),
			original_items: items1, // Enables discrepancy comparative analysis
			user_uid: cust.user_uid,
			created_at: new Date(),
			updated_at: new Date(),
		}).returning();

		if (o1) {
			for (const it of items1) {
				await db.insert(orderItems).values({
					order_id: o1.id,
					product_id: it.productId,
					quantity: it.quantity,
					price: it.price.toString(),
				});
			}
		}

		// Order #2 details
		const items2 = [
			{ productId: productsList[1].id, name: productsList[1].name, quantity: 2, price: productsList[1].price, sku: productsList[1].sku },
			{ productId: productsList[2].id, name: productsList[2].name, quantity: 1, price: productsList[2].price, sku: productsList[2].sku },
			{ productId: productsList[4].id, name: productsList[4].name, quantity: 15, price: productsList[4].price, sku: productsList[4].sku }
		];
		const total2 = items2.reduce((sum, item) => sum + (item.price * item.quantity), 0);

		const [o2] = await db.insert(orders).values({
			customer_id: cust.id,
			branch_id: 1, // Bhopal Main Warehouse
			status: "pending",
			total_amount: total2.toString(),
			original_items: items2,
			user_uid: cust.user_uid,
			created_at: new Date(),
			updated_at: new Date(),
		}).returning();

		if (o2) {
			for (const it of items2) {
				await db.insert(orderItems).values({
					order_id: o2.id,
					product_id: it.productId,
					quantity: it.quantity,
					price: it.price.toString(),
				});
			}
		}

		orderCount += 2;
		console.log(`- Seeded Order #${o1.id} (Amount: ₹${total1}) & Order #${o2.id} (Amount: ₹${total2})`);
	}

	// Reset sequences safely to prevent unique constraint clashes on orders
	try {
		const { sql } = require("drizzle-orm");
		const maxOrderRes = await db.execute(sql`SELECT COALESCE(MAX(id), 0) as max_id FROM orders;`);
		const maxOrderId = Number(maxOrderRes.rows[0].max_id);
		await db.execute(sql.raw(`SELECT setval('orders_id_seq', ${maxOrderId + 1}, false);`));
		console.log(`\nSuccess! Reset sequence 'orders_id_seq' -> set to next ID: ${maxOrderId + 1}`);
	} catch (e) {}

	console.log(`\nSeeding Complete! Successfully generated ${orderCount} live pending customer orders!`);
	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
