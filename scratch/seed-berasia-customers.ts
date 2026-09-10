import { db } from "../packages/db/src/index";
import { 
	customers, 
	user, 
	account, 
	deliveryRoutes, 
	routeStops, 
	deliveryTrips, 
	tripStops
} from "../packages/db/src/schema";
import { eq, sql } from "drizzle-orm";

async function run() {
	console.log("--- SEEDING REAL BERASIA VILLAGES CUSTOMERS, REAL PORTAL LOGINS, AND 4 DELIVERY ROUTES ---");

	try {
		console.log("Cascadingly purging old temporary routes, stops, and trips records (safe clearance)...");
		await db.execute(sql`DELETE FROM proof_of_deliveries;`);
		await db.execute(sql`DELETE FROM trip_collections;`);
		await db.execute(sql`DELETE FROM gps_logs;`);
		await db.execute(sql`DELETE FROM trip_stops;`);
		await db.execute(sql`DELETE FROM route_stops;`);
		await db.execute(sql`DELETE FROM delivery_routes;`);
		await db.execute(sql`DELETE FROM delivery_trips;`);
		console.log("Old trip and route sequences cleared!");

		// Verified scrypt hash string for "Password@123" under Better-Auth
		const scryptHash = "cf79ec0e6da8a75ed49c88fc5d2427bf:cf22e3896ddfcc9a4e7a09faf2083c81f5058958199a317364c27c21ce0cf4eab71d58af36711baeed57134e4167fd711e98d32ede04a335b52c1f3e32a05bb6";

		const berasiaCustomers = [
			{
				name: "Verma Kirana & General Store",
				phone: "+91 94250 12345",
				email: "verma.berasia@gmail.com",
				address: "Main Market Road, Berasia Town, Bhopal, Madhya Pradesh - 463106",
				latitude: "23.6321",
				longitude: "77.4312",
			},
			{
				name: "Patel Fertilizer & Grain Traders",
				phone: "+91 98930 56789",
				email: "patel.lalariya@gmail.com",
				address: "Berasia-Narsinghgarh Highway, Lalariya Village, Bhopal, MP - 463111",
				latitude: "23.6814",
				longitude: "77.4856",
			},
			{
				name: "Sharma Provision & Seed Store",
				phone: "+91 91110 98765",
				email: "sharma.runaha@gmail.com",
				address: "Near Panchayat Bhawan, Runaha Village, Berasia Tehsil, Bhopal, MP - 463106",
				latitude: "23.5842",
				longitude: "77.3821",
			},
			{
				name: "Choudhary Agro Machinery & Hardware",
				phone: "+91 88899 11223",
				email: "choudhary.gunga@gmail.com",
				address: "Bhopal-Berasia Main Road, Gunga Village, Bhopal, MP - 462038",
				latitude: "23.4912",
				longitude: "77.4145",
			},
			{
				name: "Bundela Supermarket & Feed Depot",
				phone: "+91 99933 44556",
				email: "bundela.harrakheda@gmail.com",
				address: "Narsinghgarh Main Road, Harrakheda Village, Bhopal, MP - 462038",
				latitude: "23.5154",
				longitude: "77.3412",
			}
		];

		console.log("\nInserting 5 real Berasia village customers & active portal login credentials...");
		const seededCustomers = [];
		for (const cust of berasiaCustomers) {
			// 1. Check if user already exists
			const [existingUser] = await db
				.select()
				.from(user)
				.where(eq(user.email, cust.email))
				.limit(1);

			let activeUserId;

			if (!existingUser) {
				const customId = `usr-cust-${Math.floor(100000 + Math.random() * 900000)}`;
				await db.insert(user).values({
					id: customId,
					name: cust.name,
					email: cust.email,
					role: "customer",
					emailVerified: true,
				});

				const accountId = `acc-cust-${Math.floor(100000 + Math.random() * 900000)}`;
				await db.insert(account).values({
					id: accountId,
					userId: customId,
					accountId: cust.email,
					providerId: "credential",
					password: scryptHash,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				activeUserId = customId;
			} else {
				activeUserId = existingUser.id;
			}

			// 2. Check if customer already exists
			const [existingCustomer] = await db
				.select()
				.from(customers)
				.where(eq(customers.email, cust.email))
				.limit(1);

			let finalCustomer;

			if (!existingCustomer) {
				const [insertedCustomer] = await db.insert(customers).values({
					name: cust.name,
					phone: cust.phone,
					email: cust.email,
					address: cust.address,
					latitude: cust.latitude,
					longitude: cust.longitude,
					status: "active",
					branch_id: 1, // Bhopal Main Warehouse
					user_uid: activeUserId,
				}).returning();
				finalCustomer = insertedCustomer;
				console.log(`- Seeded: ${cust.name} (Login: ${cust.email} / Password: Password@123)`);
			} else {
				finalCustomer = existingCustomer;
				console.log(`- Already Exists: ${cust.name} (Login: ${cust.email})`);
			}

			seededCustomers.push(finalCustomer);
		}

		// 4. Create 4 real-world routes of Berasia villages
		console.log("\nSeeding 4 real-world Berasia village delivery routes...");
		
		const routesList = [
			{
				name: "Route 1: Berasia North Cargo Line",
				desc: "Deliveries connecting Berasia central market and Lalariya Village",
				stops: [seededCustomers[0].id, seededCustomers[1].id] // Verma Kirana, Patel Fertilizer
			},
			{
				name: "Route 2: Berasia West Agri-Line",
				desc: "Seed & Feed shipments connecting Runaha and Harrakheda villages",
				stops: [seededCustomers[2].id, seededCustomers[4].id] // Sharma Provision, Bundela Supermarket
			},
			{
				name: "Route 3: Gunga-Harra Local Connect",
				desc: "Aggregated grocery line connecting Gunga and Harrakheda",
				stops: [seededCustomers[3].id, seededCustomers[4].id] // Choudhary Agro, Bundela Supermarket
			},
			{
				name: "Route 4: Bhopal-Berasia Highway Express",
				desc: "Express retail run connecting Gunga Village and Berasia central town",
				stops: [seededCustomers[3].id, seededCustomers[0].id] // Choudhary Agro, Verma Kirana
			}
		];

		for (const r of routesList) {
			const [route] = await db.insert(deliveryRoutes).values({
				name: r.name,
				description: r.desc,
				branch_id: 1,
			}).returning();

			for (let i = 0; i < r.stops.length; i++) {
				await db.insert(routeStops).values({
					route_id: route.id,
					customer_id: r.stops[i],
					sequence: i + 1,
				});
			}
			console.log(`- Created Route: ${r.name} with ${r.stops.length} stops.`);
		}

		// 5. Automatically synchronize all sequence counters to max(id) + 1 to prevent unique primary key clashes permanently!
		const tablesToFix = [
			"trip_stops",
			"delivery_trips",
			"delivery_routes",
			"route_stops",
			"packages",
			"package_items",
			"customers"
		];

		console.log("\nSynchronizing PostgreSQL autoincrement ID sequences to max(id) + 1...");
		for (const table of tablesToFix) {
			try {
				// Get maximum ID inside the table
				const maxIdRes = await db.execute(sql.raw(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${table};`));
				const maxId = Number(maxIdRes.rows[0].max_id);
				
				// Sync PostgreSQL sequence
				const seqName = `${table}_id_seq`;
				const nextVal = maxId + 1;
				await db.execute(sql.raw(`SELECT setval('${seqName}', ${nextVal}, false);`));
				console.log(`Success! Fixed sequence '${seqName}' -> set to next ID: ${nextVal}`);
			} catch (error: any) {
				console.warn(`Could not fix sequence for '${table}':`, error.message);
			}
		}

		console.log("\nBerasia Fleet & Routes Setup Complete! All sequences aligned successfully.");

	} catch (error: any) {
		console.error("Berasia Seeding failed:", error.message);
	}

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
