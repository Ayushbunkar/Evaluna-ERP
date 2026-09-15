import { config } from "dotenv";
config({ path: "d:/Evaluna ERP/apps/web/.env" });

import {
	customers,
	deliveryRoutes,
	deliveryStops,
	deliveryTrips,
	gpsLogs,
	proofOfDeliveries,
	routeStops,
	tripCollections,
	tripStops,
} from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/index";

const RUNAHA_STOPS = [
	// 1. Birha Shyamkhedi
	{ name: "Sunil Kushwaha", phone: "9770306801", area: "Birha Shyamkhedi", note: "" },
	{ name: "Hari Singh Kushwaha", phone: "9981903908", area: "Birha Shyamkhedi", note: "" },
	{ name: "Vinay Singh Mehar", phone: "6265839017", area: "Birha Shyamkhedi", note: "" },
	{ name: "Ranjeet Malviya", phone: "9009086141", area: "Birha Shyamkhedi", note: "" },
	{ name: "Sunil Mehar", phone: "6264803131", area: "Birha Shyamkhedi", note: "" },
	{ name: "Rohit Malviya", phone: "9589533037", area: "Birha Shyamkhedi", note: "" },
	{ name: "Kaluram Malviya", phone: "9752660978", area: "Birha Shyamkhedi", note: "" },

	// 2. Bhamora
	{ name: "Jaswant Narayan Singh", phone: "6264792563", area: "Bhamora", note: "" },
	{ name: "Vinod Goswami", phone: "9770413874", area: "Bhamora", note: "" },

	// 3. Sukla
	{ name: "Raju Gurjar", phone: "9301091174", area: "Sukla", note: "Mujhe udhar milta hai" },

	// 4. Dhanora
	{ name: "Shubham Gour", phone: "6263653692", area: "Dhanora", note: "" },
	{ name: "Kailash Gour", phone: "9754797124", area: "Dhanora", note: "" },

	// 5. Kotra
	{ name: "Rajkumar", phone: "7723815631", area: "Kotra", note: "" },
	{ name: "Jitendra Gour", phone: "9303064558", area: "Kotra", note: "" },
	{ name: "Pavan", phone: "6268953727", area: "Kotra", note: "" },
	{ name: "Kamal Gour – Siddhi Vinayak", phone: "9770862542", area: "Kotra", note: "" },
	{ name: "Abhishek / Kailash Gour", phone: "8871063054", area: "Kotra", note: "Alt: 8120128807" },

	// 6. Jhirniya
	{ name: "Suraj Gour", phone: "7692962636", area: "Jhirniya", note: "" },
	{ name: "Devendra Gour", phone: "9926354686", area: "Jhirniya", note: "Alt: 7803090272" },
	{ name: "Arvind / Ravi Gour", phone: "7566986331", area: "Jhirniya", note: "Alt: 9343067208" },

	// 7. Mithi Chhapri
	{ name: "Ramsing Gour", phone: "9009613850", area: "Mithi Chhapri", note: "" },
	{ name: "Rajesh Sharma", phone: "8889338145", area: "Mithi Chhapri", note: "No answer" },

	// 8. Jajankhedi
	{ name: "Himmat Singh", phone: "9617141596", area: "Jajankhedi", note: "" },
	{ name: "Arvind / Vinod Sahu", phone: "9993732944", area: "Jajankhedi", note: "Alt: 7000128666" },
	{ name: "Rajesh Gour", phone: "8435524169", area: "Jajankhedi", note: "" },

	// 9. Baksi
	{ name: "Sunil Sahu", phone: "7389076252", area: "Baksi", note: "" },
	{ name: "Sanju", phone: "9685217822", area: "Baksi", note: "" },
	{ name: "Shivcharan Gour", phone: "9752852603", area: "Baksi", note: "" },
	{ name: "Mahesh / Arpit Gour", phone: "7898340248", area: "Baksi", note: "Alt: 9981462677" },
	{ name: "Vijay Gour", phone: "9399085615", area: "Baksi", note: "No answer / Busy" },

	// 10. Ratanpur
	{ name: "Naran Ji", phone: "9589266110", area: "Ratanpur", note: "" },

	// 11. 11 Meel
	{ name: "Ajab Singh Gurjar", phone: "9584845609", area: "11 Meel", note: "No answer" },
	{ name: "Prem Singh Ji", phone: "9981808489", area: "11 Meel", note: "" },

	// 12. Kolukhedi
	{ name: "Chandar", phone: "7607354256", area: "Kolukhedi", note: "No answer" },
	{ name: "Monu Rajput", phone: "9691615398", area: "Kolukhedi", note: "Dukan band hai" },
	{ name: "Ramkishan", phone: "9753607951", area: "Kolukhedi", note: "Bahar hai / No answer" },

	// 13. Parsora
	{ name: "Vishnu", phone: "9691250810", area: "Parsora", note: "No answer" },
	{ name: "Sandeep", phone: "9691226260", area: "Parsora", note: "No answer" },

	// 14. Runaha
	{ name: "Omkar", phone: "7509353567", area: "Runaha", note: "No answer" },
	{ name: "Hemraj Sahu", phone: "7610190207", area: "Runaha", note: "" },
	{ name: "Ram Kirana Store", phone: "8959525955", area: "Runaha", note: "" },
	{ name: "Sahu Kirana Store", phone: "9399527768", area: "Runaha", note: "" },
	{ name: "Akash", phone: "9977103314", area: "Runaha", note: "" },
	{ name: "Dharmendra", phone: "7067367485", area: "Runaha", note: "Der se" },
	{ name: "Lodhan Gour", phone: "7879522470", area: "Runaha", note: "No order" },
	{ name: "Jyoti Kirana", phone: "9669272067", area: "Runaha", note: "" },
	{ name: "Tiwari Aata Chakki", phone: "9753751450", area: "Runaha", note: "No orders" },
	{ name: "Abhishek Gour", phone: "7697332454", area: "Runaha", note: "" },
];

async function seed() {
	console.log("Cleaning up any existing routes & trips...");
	try { await db.delete(proofOfDeliveries); } catch (e) {}
	try { await db.delete(gpsLogs); } catch (e) {}
	try { await db.delete(tripCollections); } catch (e) {}
	try { await db.delete(deliveryStops); } catch (e) {}
	try { await db.delete(tripStops); } catch (e) {}
	try { await db.delete(deliveryTrips); } catch (e) {}
	try { await db.delete(routeStops); } catch (e) {}
	try { await db.delete(deliveryRoutes); } catch (e) {}

	console.log("Creating Runaha Route...");
	const [route] = await db
		.insert(deliveryRoutes)
		.values({
			name: "Runaha Route",
			description:
				"Birha Shyamkhedi → Bhamora → Sukla → Dhanora → Kotra → Jhirniya → Mithi Chhapri → Jajankhedi → Baksi → Ratanpur → 11 Meel → Kolukhedi → Parsora → Runaha",
			branch_id: 1,
			priority: "high",
			is_active: true,
		})
		.returning();

	console.log("Route created with ID:", route.id);
	console.log("Provisioning 48 customer stops for Runaha Route...");

	let seq = 1;
	for (const s of RUNAHA_STOPS) {
		let cust = await db.query.customers.findFirst({
			where: eq(customers.phone, s.phone),
		});

		if (!cust) {
			const email = `cust_${s.phone}@evaluna.local`;
			const [newCust] = await db
				.insert(customers)
				.values({
					name: s.name,
					phone: s.phone,
					email: email,
					address: `${s.area}${s.note ? ` (${s.note})` : ""}`,
					branch_id: 1,
					user_uid: "manager",
					customer_code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
				})
				.returning();
			cust = newCust;
		} else {
			// Update customer address with area & note
			await db
				.update(customers)
				.set({
					name: s.name,
					address: `${s.area}${s.note ? ` (${s.note})` : ""}`,
				})
				.where(eq(customers.id, cust.id));
		}

		await db.insert(routeStops).values({
			route_id: route.id,
			customer_id: cust.id,
			sequence: seq++,
			notes: `${s.area}${s.note ? ` - ${s.note}` : ""}`,
		});
	}

	console.log("SUCCESS: Runaha Route created with all 48 customer stops cleanly!");
	process.exit(0);
}

seed().catch((err) => {
	console.error("Seed error:", err);
	process.exit(1);
});

