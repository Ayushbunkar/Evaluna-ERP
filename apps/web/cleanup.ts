import { db } from "./src/lib/db/index";
import { sql } from "drizzle-orm";

const VILLAGES_DATA: { village: string; customers: { name: string; phone: string; notes?: string }[] }[] = [
	{
		village: "Birha Shyamkhedi",
		customers: [
			{ name: "Sunil Kushwaha", phone: "9770306801" },
			{ name: "Hari Singh Kushwaha", phone: "9981903908" },
			{ name: "Vinay Singh Mehar", phone: "6265839017" },
			{ name: "Ranjeet Malviya", phone: "9009086141" },
			{ name: "Sunil Mehar", phone: "6264803131" },
			{ name: "Rohit Malviya", phone: "9589533037" },
			{ name: "Kaluram Malviya", phone: "9752660978" },
		],
	},
	{
		village: "Bhamora",
		customers: [
			{ name: "Jaswant Narayan Singh", phone: "6264792563" },
			{ name: "Vinod Goswami", phone: "9770413874" },
		],
	},
	{
		village: "Sukla",
		customers: [
			{ name: "Raju Gurjar", phone: "9301091174", notes: "Mujhe udhar milta hai" },
		],
	},
	{
		village: "Dhanora",
		customers: [
			{ name: "Shubham Gour", phone: "6263653692" },
			{ name: "Kailash Gour", phone: "9754797124" },
		],
	},
	{
		village: "Kotra",
		customers: [
			{ name: "Rajkumar", phone: "7723815631" },
			{ name: "Jitendra Gour", phone: "9303064558" },
			{ name: "Pavan", phone: "6268953727" },
			{ name: "Kamal Gour – Siddhi Vinayak", phone: "9770862542" },
			{ name: "Abhishek / Kailash Gour", phone: "8871063054" },
		],
	},
	{
		village: "Jhirniya",
		customers: [
			{ name: "Suraj Gour", phone: "7692962636" },
			{ name: "Devendra Gour", phone: "9926354686" },
			{ name: "Arvind / Ravi Gour", phone: "7566986331" },
		],
	},
	{
		village: "Mithi Chhapri",
		customers: [
			{ name: "Ramsing Gour", phone: "9009613850" },
			{ name: "Rajesh Sharma", phone: "8889338145", notes: "No answer" },
		],
	},
	{
		village: "Jajankhedi",
		customers: [
			{ name: "Himmat Singh", phone: "9617141596" },
			{ name: "Arvind / Vinod Sahu", phone: "9993732944" },
			{ name: "Rajesh Gour", phone: "8435524169" },
		],
	},
	{
		village: "Baksi",
		customers: [
			{ name: "Sunil Sahu", phone: "7389076252" },
			{ name: "Sanju", phone: "9685217822" },
			{ name: "Shivcharan Gour", phone: "9752852603" },
			{ name: "Mahesh / Arpit Gour", phone: "7898340248" },
			{ name: "Vijay Gour", phone: "9399085615", notes: "No answer / Busy" },
		],
	},
	{
		village: "Ratanpur",
		customers: [
			{ name: "Naran Ji", phone: "9589266110" },
		],
	},
	{
		village: "11 Meel",
		customers: [
			{ name: "Ajab Singh Gurjar", phone: "9584845609", notes: "No answer" },
			{ name: "Prem Singh Ji", phone: "9981808489" },
		],
	},
	{
		village: "Kolukhedi",
		customers: [
			{ name: "Chandar", phone: "7607354256", notes: "No answer" },
			{ name: "Monu Rajput", phone: "9691615398", notes: "Dukan band hai" },
			{ name: "Ramkishan", phone: "9753607951", notes: "Bahar hai / No answer" },
		],
	},
	{
		village: "Parsora",
		customers: [
			{ name: "Vishnu", phone: "9691250810", notes: "No answer" },
			{ name: "Sandeep", phone: "9691226260", notes: "No answer" },
		],
	},
	{
		village: "Runaha",
		customers: [
			{ name: "Omkar", phone: "7509353567", notes: "No answer" },
			{ name: "Hemraj Sahu", phone: "7610190207" },
			{ name: "Ram Kirana Store", phone: "8959525955" },
			{ name: "Sahu Kirana Store", phone: "9399527768" },
			{ name: "Akash", phone: "9977103314" },
			{ name: "Dharmendra", phone: "7067367485", notes: "Der se" },
			{ name: "Lodhan Gour", phone: "7879522470", notes: "No order" },
			{ name: "Jyoti Kirana", phone: "9669272067" },
			{ name: "Tiwari Aata Chakki", phone: "9753751450", notes: "No orders" },
			{ name: "Abhishek Gour", phone: "7697332454" },
		],
	},
];

async function run() {
	console.log("Setting up Runaha Route and stops accurately...");

	// 1. Ensure or update Runaha Route
	const routeName = "Runaha Route";
	const routeDesc = "Birha Shyamkhedi → Bhamora → Sukla → Dhanora → Kotra → Jhirniya → Mithi Chhapri → Jajankhedi → Baksi → Ratanpur → 11 Meel → Kolukhedi → Parsora → Runaha";

	let route = (await db.execute(sql`SELECT id FROM delivery_routes WHERE name = ${routeName} LIMIT 1`))[0];
	if (!route) {
		const newR = await db.execute(sql`
			INSERT INTO delivery_routes (name, description, branch_id)
			VALUES (${routeName}, ${routeDesc}, 1)
			RETURNING id
		`);
		route = newR[0];
	} else {
		await db.execute(sql`
			UPDATE delivery_routes
			SET description = ${routeDesc}
			WHERE id = ${route.id}
		`);
	}

	const routeId = route.id;

	// 2. Clear old stops for this route so we populate the exact 14-village sequence cleanly
	await db.execute(sql`DELETE FROM route_stops WHERE route_id = ${routeId}`);

	// 3. Clear transient custom trips and stops if needed
	await db.execute(sql`DELETE FROM trip_stops WHERE trip_id IN (SELECT id FROM delivery_trips WHERE route_id IN (SELECT id FROM delivery_routes WHERE name LIKE 'Trip %'))`);
	await db.execute(sql`DELETE FROM delivery_trips WHERE route_id IN (SELECT id FROM delivery_routes WHERE name LIKE 'Trip %')`);
	await db.execute(sql`DELETE FROM route_stops WHERE route_id IN (SELECT id FROM delivery_routes WHERE name LIKE 'Trip %')`);
	await db.execute(sql`DELETE FROM delivery_routes WHERE name LIKE 'Trip %'`);

	let sequence = 1;
	let totalStopsAdded = 0;

	for (const v of VILLAGES_DATA) {
		for (const c of v.customers) {
			const cleanPhone = c.phone.replace(/\D/g, "");
			const villageAddr = `${v.village}, Madhya Pradesh`;

			// Find existing customer by phone or name
			let existingCust = (await db.execute(sql`
				SELECT id, name, phone, address FROM customers
				WHERE phone = ${cleanPhone} OR name ILIKE ${c.name}
				LIMIT 1
			`))[0];

			let customerId = existingCust?.id;

			if (!customerId) {
				const custCode = `CUST-${cleanPhone || Date.now()}`;
				const email = `cust_${cleanPhone}@evaluna.local`;
				const userUid = `usr_cust_${cleanPhone || Date.now()}`;
				const inserted = await db.execute(sql`
					INSERT INTO customers (name, phone, address, email, user_uid, customer_code, branch_id, status, is_deleted)
					VALUES (${c.name}, ${cleanPhone}, ${villageAddr}, ${email}, ${userUid}, ${custCode}, 1, 'active', false)
					RETURNING id
				`);
				customerId = inserted[0]?.id;
			} else {
				// Update customer's address to indicate village location if generic
				await db.execute(sql`
					UPDATE customers
					SET address = ${villageAddr}, name = ${c.name}
					WHERE id = ${customerId}
				`);
			}

			// Insert route stop with exact sequence
			await db.execute(sql`
				INSERT INTO route_stops (route_id, customer_id, sequence, notes)
				VALUES (${routeId}, ${customerId}, ${sequence}, ${c.notes ?? null})
			`);

			sequence++;
			totalStopsAdded++;
		}
	}

	console.log(`Successfully configured ${routeName} with ${totalStopsAdded} stops across 14 villages.`);
	
	const finalRoutes = await db.execute(sql`SELECT id, name, description FROM delivery_routes`);
	console.log("All Delivery Routes in DB:", finalRoutes);
	
	const finalStops = await db.execute(sql`
		SELECT rs.sequence, rs.notes, c.name, c.phone, c.address
		FROM route_stops rs
		JOIN customers c ON c.id = rs.customer_id
		WHERE rs.route_id = ${routeId}
		ORDER BY rs.sequence ASC
	`);
	console.log(`Configured Stops for Runaha Route (${finalStops.length}):`, finalStops);

	process.exit(0);
}
run().catch((err) => {
	console.error(err);
	process.exit(1);
});
