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

const ROUTE_2_VILLAGES: { village: string; customers: { name: string; phone: string; notes?: string }[] }[] = [
	{
		village: "Mankhyai Jod",
		customers: [
			{ name: "Mankhyai Jod Customer 1", phone: "9826000001" },
		],
	},
	{
		village: "Kulor",
		customers: [
			{ name: "Kulor Customer 1", phone: "9826000002" },
		],
	},
	{
		village: "Dungariya",
		customers: [
			{ name: "Dungariya Customer 1", phone: "9826000003" },
		],
	},
	{
		village: "Suhaya",
		customers: [
			{ name: "Suhaya Customer 1", phone: "9826000004" },
		],
	},
	{
		village: "Jamusar",
		customers: [
			{ name: "Jamusar Customer 1", phone: "9826000005" },
		],
	},
];

const ROUTE_3_VILLAGES: { village: string; customers: { name: string; phone: string; notes?: string }[] }[] = [
	{
		village: "Pipaliya Hasnabad",
		customers: [
			{ name: "Pipaliya Hasnabad Customer 1", phone: "9826000011" },
		],
	},
	{
		village: "Ramgarha",
		customers: [
			{ name: "Ramgarha Customer 1", phone: "9826000012" },
		],
	},
	{
		village: "Bhojapura Jod",
		customers: [
			{ name: "Bhojapura Jod Customer 1", phone: "9826000013" },
		],
	},
	{
		village: "Unchi Laloi",
		customers: [
			{ name: "Unchi Laloi Customer 1", phone: "9826000014" },
		],
	},
	{
		village: "Kadaiya Chabar",
		customers: [
			{ name: "Kadaiya Chabar Customer 1", phone: "9826000015" },
		],
	},
	{
		village: "Rampura",
		customers: [
			{ name: "Rampura Customer 1", phone: "9826000016" },
		],
	},
	{
		village: "Karanpura",
		customers: [
			{ name: "Karanpura Customer 1", phone: "9826000017" },
		],
	},
	{
		village: "Panchmukhi",
		customers: [
			{ name: "Panchmukhi Customer 1", phone: "9826000018" },
		],
	},
	{
		village: "Barkheda Hasan",
		customers: [
			{ name: "Barkheda Hasan Customer 1", phone: "9826000019" },
		],
	},
	{
		village: "Barkheda Barodi",
		customers: [
			{ name: "Barkheda Barodi Customer 1", phone: "9826000020" },
		],
	},
];

const ROUTE_4_VILLAGES: { village: string; customers: { name: string; phone: string; notes?: string }[] }[] = [
	{
		village: "Barkheda Barodi",
		customers: [
			{ name: "Barkheda Barodi Route 4 Customer", phone: "9826000021" },
		],
	},
	{
		village: "Arrawati",
		customers: [
			{ name: "Arrawati Customer 1", phone: "9826000022" },
		],
	},
	{
		village: "Pauua Nala",
		customers: [
			{ name: "Pauua Nala Customer 1", phone: "9826000023" },
		],
	},
	{
		village: "Dhamnoda",
		customers: [
			{ name: "Dhamnoda Customer 1", phone: "9826000024" },
		],
	},
	{
		village: "Dupadia",
		customers: [
			{ name: "Dupadia Customer 1", phone: "9826000025" },
		],
	},
	{
		village: "Pipaliya",
		customers: [
			{ name: "Pipaliya Customer 1", phone: "9826000026" },
		],
	},
	{
		village: "Salaiyya",
		customers: [
			{ name: "Salaiyya Customer 1", phone: "9826000027" },
		],
	},
	{
		village: "Lalariya",
		customers: [
			{ name: "Lalariya Customer 1", phone: "9826000028" },
		],
	},
];

async function run() {
	console.log("Setting up Delivery Routes (Runaha, Suhaya, Barkheda, Salaiyra)...");

	// 1. Ensure or update Route 1: Runaha Route
	const route1Name = "Runaha Route";
	const route1Desc = "Birha Shyamkhedi → Bhamora → Sukla → Dhanora → Kotra → Jhirniya → Mithi Chhapri → Jajankhedi → Baksi → Ratanpur → 11 Meel → Kolukhedi → Parsora → Runaha";

	let route1 = (await db.execute(sql`SELECT id FROM delivery_routes WHERE name = ${route1Name} LIMIT 1`))[0];
	if (!route1) {
		const newR = await db.execute(sql`
			INSERT INTO delivery_routes (name, description, branch_id)
			VALUES (${route1Name}, ${route1Desc}, 1)
			RETURNING id
		`);
		route1 = newR[0];
	} else {
		await db.execute(sql`
			UPDATE delivery_routes
			SET description = ${route1Desc}
			WHERE id = ${route1.id}
		`);
	}

	const route1Id = route1.id;
	await db.execute(sql`DELETE FROM route_stops WHERE route_id = ${route1Id}`);

	let seq1 = 1;
	for (const v of VILLAGES_DATA) {
		for (const c of v.customers) {
			const cleanPhone = c.phone.replace(/\D/g, "");
			const villageAddr = `${v.village}, Madhya Pradesh`;

			let existingCust = (await db.execute(sql`
				SELECT id FROM customers
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
				await db.execute(sql`
					UPDATE customers
					SET address = ${villageAddr}, name = ${c.name}
					WHERE id = ${customerId}
				`);
			}

			await db.execute(sql`
				INSERT INTO route_stops (route_id, customer_id, sequence, notes)
				VALUES (${route1Id}, ${customerId}, ${seq1}, ${c.notes ?? null})
			`);
			seq1++;
		}
	}

	// 2. Ensure or update Route 2: Suhaya Route
	const route2Name = "Suhaya Route";
	const route2Desc = "Mankhyai Jod → Kulor → Dungariya → Suhaya → Jamusar";

	let route2 = (await db.execute(sql`SELECT id FROM delivery_routes WHERE name = ${route2Name} OR name ILIKE '%Suhaya%' LIMIT 1`))[0];
	if (!route2) {
		const newR2 = await db.execute(sql`
			INSERT INTO delivery_routes (name, description, branch_id)
			VALUES (${route2Name}, ${route2Desc}, 1)
			RETURNING id
		`);
		route2 = newR2[0];
	} else {
		await db.execute(sql`
			UPDATE delivery_routes
			SET name = ${route2Name}, description = ${route2Desc}
			WHERE id = ${route2.id}
		`);
	}

	const route2Id = route2.id;
	await db.execute(sql`DELETE FROM route_stops WHERE route_id = ${route2Id}`);

	let seq2 = 1;
	for (const v of ROUTE_2_VILLAGES) {
		for (const c of v.customers) {
			const cleanPhone = c.phone.replace(/\D/g, "");
			const villageAddr = `${v.village}, Madhya Pradesh`;

			let existingCust = (await db.execute(sql`
				SELECT id FROM customers
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
				await db.execute(sql`
					UPDATE customers
					SET address = ${villageAddr}, name = ${c.name}
					WHERE id = ${customerId}
				`);
			}

			await db.execute(sql`
				INSERT INTO route_stops (route_id, customer_id, sequence, notes)
				VALUES (${route2Id}, ${customerId}, ${seq2}, ${c.notes ?? null})
			`);
			seq2++;
		}
	}

	// 3. Ensure or update Route 3: Barkheda Route
	const route3Name = "Barkheda Route";
	const route3Desc = "Pipaliya Hasnabad → Ramgarha → Bhojapura Jod → Unchi Laloi → Kadaiya Chabar → Rampura → Karanpura → Panchmukhi → Barkheda Hasan → Barkheda Barodi";

	let route3 = (await db.execute(sql`SELECT id FROM delivery_routes WHERE name = ${route3Name} OR name ILIKE '%Barkheda%' LIMIT 1`))[0];
	if (!route3) {
		const newR3 = await db.execute(sql`
			INSERT INTO delivery_routes (name, description, branch_id)
			VALUES (${route3Name}, ${route3Desc}, 1)
			RETURNING id
		`);
		route3 = newR3[0];
	} else {
		await db.execute(sql`
			UPDATE delivery_routes
			SET name = ${route3Name}, description = ${route3Desc}
			WHERE id = ${route3.id}
		`);
	}

	const route3Id = route3.id;
	await db.execute(sql`DELETE FROM route_stops WHERE route_id = ${route3Id}`);

	let seq3 = 1;
	for (const v of ROUTE_3_VILLAGES) {
		for (const c of v.customers) {
			const cleanPhone = c.phone.replace(/\D/g, "");
			const villageAddr = `${v.village}, Madhya Pradesh`;

			let existingCust = (await db.execute(sql`
				SELECT id FROM customers
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
				await db.execute(sql`
					UPDATE customers
					SET address = ${villageAddr}, name = ${c.name}
					WHERE id = ${customerId}
				`);
			}

			await db.execute(sql`
				INSERT INTO route_stops (route_id, customer_id, sequence, notes)
				VALUES (${route3Id}, ${customerId}, ${seq3}, ${c.notes ?? null})
			`);
			seq3++;
		}
	}

	// 4. Ensure or update Route 4: Salaiyra Route
	const route4Name = "Salaiyra Route";
	const route4Desc = "Barkheda Barodi → Arrawati → Pauua Nala → Dhamnoda → Dupadia → Pipaliya → Salaiyya → Lalariya";

	let route4 = (await db.execute(sql`SELECT id FROM delivery_routes WHERE name = ${route4Name} OR name ILIKE '%Salaiyra%' OR name ILIKE '%Salaiyya%' LIMIT 1`))[0];
	if (!route4) {
		const newR4 = await db.execute(sql`
			INSERT INTO delivery_routes (name, description, branch_id)
			VALUES (${route4Name}, ${route4Desc}, 1)
			RETURNING id
		`);
		route4 = newR4[0];
	} else {
		await db.execute(sql`
			UPDATE delivery_routes
			SET name = ${route4Name}, description = ${route4Desc}
			WHERE id = ${route4.id}
		`);
	}

	const route4Id = route4.id;
	await db.execute(sql`DELETE FROM route_stops WHERE route_id = ${route4Id}`);

	let seq4 = 1;
	for (const v of ROUTE_4_VILLAGES) {
		for (const c of v.customers) {
			const cleanPhone = c.phone.replace(/\D/g, "");
			const villageAddr = `${v.village}, Madhya Pradesh`;

			let existingCust = (await db.execute(sql`
				SELECT id FROM customers
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
				await db.execute(sql`
					UPDATE customers
					SET address = ${villageAddr}, name = ${c.name}
					WHERE id = ${customerId}
				`);
			}

			await db.execute(sql`
				INSERT INTO route_stops (route_id, customer_id, sequence, notes)
				VALUES (${route4Id}, ${customerId}, ${seq4}, ${c.notes ?? null})
			`);
			seq4++;
		}
	}

	console.log("Successfully configured Route 1 (Runaha Route), Route 2 (Suhaya Route), Route 3 (Barkheda Route), and Route 4 (Salaiyra Route).");

	const finalRoutes = await db.execute(sql`SELECT id, name, description FROM delivery_routes ORDER BY id ASC`);
	console.log("All Delivery Routes in DB:", finalRoutes);

	process.exit(0);
}
run().catch((err) => {
	console.error(err);
	process.exit(1);
});
