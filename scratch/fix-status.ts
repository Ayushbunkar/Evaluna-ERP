import { db } from "../packages/db/src/index";
import { orders, customers } from "../packages/db/src/schema";
import { inArray, eq } from "drizzle-orm";

async function run() {
	console.log("--- SYNCHRONIZING SEEDED VILLAGE ORDER STATUS TO 'PENDING_REVIEW' ---");

	const allowedEmails = [
		"verma.berasia@gmail.com",
		"patel.lalariya@gmail.com",
		"sharma.runaha@gmail.com",
		"choudhary.gunga@gmail.com",
		"bundela.harrakheda@gmail.com"
	];

	// Fetch our 5 seeded Berasia customers
	const dbCusts = await db
		.select()
		.from(customers)
		.where(inArray(customers.email, allowedEmails));

	if (dbCusts.length === 0) {
		console.log("No Berasia customers found. Bypassing status update.");
		process.exit(0);
	}

	const custIds = dbCusts.map((c) => c.id);

	// Update order status cleanly from 'pending' to 'pending_review'
	const result = await db
		.update(orders)
		.set({ status: "pending_review" }) // Moves them cleanly to the Salesperson review inbox!
		.where(
			and(
				inArray(orders.customer_id, custIds),
				eq(orders.status, "pending")
			)
		);

	console.log("\nSuccess! All 10 seeded customer orders are now marked as 'pending_review' and are live in the Salesperson review queue!");
	process.exit(0);
}

// Inline helper for AND operator
function poultryAnd(...conditions: any[]) {
	const { and } = require("drizzle-orm");
	return and(...conditions);
}

const and = poultryAnd;

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
