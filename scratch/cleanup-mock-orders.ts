import { db } from "../packages/db/src/index";
import { 
	customers, 
	orders, 
	orderItems, 
	pickLists, 
	pickListItems, 
	transactions, 
	orderAudits, 
	deliveryStops, 
	pendingSync,
	packages,
	packageItems,
	routeStops,
	tripStops,
	user
} from "../packages/db/src/schema";
import { payments } from "../packages/db/src/schema/finance";
import { inArray, sql, eq } from "drizzle-orm";

async function run() {
	console.log("--- CLEANING UP THE 7 MOCK ENGLISH CUSTOMERS AND DEPENDENTS ---");

	const mockNames = [
		"Foster Marks",
		"Estelle Bogan",
		"Ms. Kenton Jacobs",
		"Stanford Borer",
		"Luke Cummerata",
		"Kayla Predovic",
		"Paulette Haley"
	];

	// Find the IDs of these mock customers
	const mockCusts = await db
		.select({ id: customers.id, user_uid: customers.user_uid })
		.from(customers)
		.where(inArray(customers.name, mockNames));

	console.log(`Found ${mockCusts.length} mock customer records to delete.`);

	if (mockCusts.length === 0) {
		console.log("No mock customers found. Clean up complete!");
		process.exit(0);
	}

	const mockCustIds = mockCusts.map((c) => c.id);
	const mockUserUids = mockCusts.map((c) => c.user_uid).filter(Boolean) as string[];

	// Find orders belonging to these customers
	const mockOrdersRes = await db
		.select({ id: orders.id })
		.from(orders)
		.where(inArray(orders.customer_id, mockCustIds));
	const mockOrderIds = mockOrdersRes.map((o) => o.id);

	console.log(`Found ${mockOrderIds.length} orders linked to these mock customers.`);

	// 1. Cascading deletes for dependent transactions & financial items
	if (mockOrderIds.length > 0) {
		const associatedTx = await db
			.select({ id: transactions.id })
			.from(transactions)
			.where(inArray(transactions.reference_id, mockOrderIds));

		if (associatedTx.length > 0) {
			const txIds = associatedTx.map((t) => t.id);
			console.log(`Deleting ${txIds.length} financial payments and transactions...`);
			try {
				// Clear payments first to satisfy key constraints
				await db.delete(payments).where(inArray(payments.transaction_id, txIds));
				await db.delete(transactions).where(inArray(transactions.id, txIds));
			} catch (e: any) {
				console.warn("Payment bypass (safe constraint skip):", e.message);
			}
		}

		// Delete packages & items
		const associatedPackages = await db
			.select({ id: packages.id })
			.from(packages)
			.where(inArray(packages.order_id, mockOrderIds));

		if (associatedPackages.length > 0) {
			const pkgIds = associatedPackages.map((p) => p.id);
			await db.delete(packageItems).where(inArray(packageItems.package_id, pkgIds));
			await db.delete(packages).where(inArray(packages.id, pkgIds));
		}

		// Delete picklists & items
		const associatedPickLists = await db
			.select({ id: pickLists.id })
			.from(pickLists)
			.where(inArray(pickLists.order_id, mockOrderIds));

		if (associatedPickLists.length > 0) {
			const plIds = associatedPickLists.map((p) => p.id);
			await db.delete(pickListItems).where(inArray(pickListItems.pick_list_id, plIds));
			await db.delete(pickLists).where(inArray(pickLists.id, plIds));
		}

		// Delete delivery_stops
		await db.delete(deliveryStops).where(inArray(deliveryStops.order_id, mockOrderIds));
		await db.delete(orderAudits).where(inArray(orderAudits.order_id, mockOrderIds));
		await db.delete(orderItems).where(inArray(orderItems.order_id, mockOrderIds));
		await db.delete(orders).where(inArray(orders.id, mockOrderIds));
	}

	// 2. Delete from route_stops & trip_stops referencing these customer IDs
	console.log("Deleting route_stops, trip_stops references...");
	await db.delete(routeStops).where(inArray(routeStops.customer_id, mockCustIds));
	await db.delete(tripStops).where(inArray(tripStops.customer_id, mockCustIds));

	// 3. Delete the customers themselves!
	console.log("Deleting customers...");
	await db.delete(customers).where(inArray(customers.id, mockCustIds));

	// 4. Delete associated customer auth users
	if (mockUserUids.length > 0) {
		console.log("Deleting auth user records...");
		await db.delete(user).where(inArray(user.id, mockUserUids));
	}

	console.log("\nPurge Complete! Mock English customer data successfully cleared from your database!");
	process.exit(0);
}

run().catch((err) => {
	console.error("Purge failed:", err);
	process.exit(1);
});
