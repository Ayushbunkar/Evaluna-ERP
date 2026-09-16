import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import { db } from "../packages/db/src/index";
import { customers, routeStops, tripStops } from "../packages/db/src/schema";

interface ContactRow {
	name: string;
	phone: string;
	village: string;
}

function parseCSV(filePath: string): ContactRow[] {
	const content = fs.readFileSync(filePath, "utf-8");
	const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
	const results: ContactRow[] = [];

	// Skip header line 1: Customer Name,Contact Number,Village Name
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i]?.trim();
		if (!line) continue;

		// Split by comma
		const parts = line.split(",").map((p) => p.trim());
		if (parts.length >= 3) {
			const name = parts[0] || "";
			const phone = parts[1] || "";
			const village = parts.slice(2).join(", ") || "";
			if (name && (phone || village)) {
				results.push({ name, phone, village });
			}
		}
	}
	return results;
}

async function run() {
	const csvPath = path.resolve(__dirname, "../csv/Contacts.csv");
	console.log("Reading CSV from:", csvPath);
	const contactList = parseCSV(csvPath);
	console.log(`Found ${contactList.length} contacts in CSV.`);

	// 1. Alter phone column length if needed and drop not null on email
	try {
		await db.execute(sql`ALTER TABLE "customers" ALTER COLUMN "phone" TYPE VARCHAR(100);`);
		await db.execute(sql`ALTER TABLE "customers" ALTER COLUMN "email" DROP NOT NULL;`);
	} catch (e: any) {
		console.log("Schema notice:", e.message);
	}

	// 2. Prepare 271 clean customer records from CSV
	const toInsert: any[] = [];
	const seenEmails = new Set<string>();

	for (let idx = 0; idx < contactList.length; idx++) {
		const contact = contactList[idx];
		if (!contact) continue;

		const cleanPhone = contact.phone.trim();
		const cleanName = contact.name.trim();
		const cleanVillage = contact.village.trim();
		const address = cleanVillage ? `${cleanVillage}, Madhya Pradesh` : "Madhya Pradesh";
		const code = `CUST-${String(idx + 1).padStart(4, "0")}`;
		const phoneDigits = cleanPhone.replace(/[^0-9]/g, "");

		let email = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15)}.${phoneDigits.slice(0, 8) || idx + 1}@evaluna.local`;
		if (seenEmails.has(email)) {
			email = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15)}.${phoneDigits.slice(0, 8) || idx + 1}_${idx + 1}@evaluna.local`;
		}
		seenEmails.add(email);

		toInsert.push({
			name: cleanName,
			phone: cleanPhone,
			address: address,
			email: email,
			customer_code: code,
			branch_id: 1,
			user_uid: "1",
			status: "active",
			customer_type: "retail",
			loyalty_tier: "bronze",
		});
	}

	console.log(`Clearing old fake customer records...`);
	try {
		await db.execute(sql`
			UPDATE "orders" SET "customer_id" = NULL;
			DELETE FROM "trip_stops";
			DELETE FROM "route_stops";
			DELETE FROM "customers";
		`);
		console.log("Old fake customer data cleared.");
	} catch (e: any) {
		console.log("Standard delete failed, attempting CASCADE truncate:", e.message);
		await db.execute(sql`TRUNCATE TABLE "customers" CASCADE;`);
		console.log("Truncated customers CASCADE.");
	}

	// Batch insert in chunks of 50
	const chunkSize = 50;
	let insertedCount = 0;
	for (let i = 0; i < toInsert.length; i += chunkSize) {
		const chunk = toInsert.slice(i, i + chunkSize);
		await db.insert(customers).values(chunk);
		insertedCount += chunk.length;
		console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(toInsert.length / chunkSize)} (${insertedCount}/${toInsert.length})`);
	}

	const allCustomers = await db.select().from(customers);
	console.log(`Total customers now in database: ${allCustomers.length}`);

	// Distribute real customers to delivery routes
	const routesResult = await db.execute(sql`SELECT id, name FROM "delivery_routes";`);
	const routeRows = (routesResult.rows || routesResult) as any[];
	if (routeRows.length > 0 && allCustomers.length > 0) {
		let routeIdx = 0;
		const stops: any[] = [];
		for (let i = 0; i < allCustomers.length; i++) {
			const route = routeRows[routeIdx % routeRows.length];
			stops.push({
				route_id: route.id,
				customer_id: allCustomers[i].id,
				sequence: Math.floor(i / routeRows.length) + 1,
			});
			routeIdx++;
		}
		for (let i = 0; i < stops.length; i += 50) {
			await db.insert(routeStops).values(stops.slice(i, i + 50));
		}
		console.log(`Assigned ${stops.length} real customer stops across ${routeRows.length} delivery routes.`);
	}

	console.log(
		`\n========================================\nContacts CSV Import Summary:\n- Real Customers Imported: ${allCustomers.length}\n- Fake English Persons: REMOVED\n========================================`,
	);
}

run()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Fatal import error:", err);
		process.exit(1);
	});
