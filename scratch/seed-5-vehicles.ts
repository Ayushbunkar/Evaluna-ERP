import { db } from "../packages/db/src/index";
import { vehicles } from "../packages/db/src/schema/delivery";
import { eq } from "drizzle-orm";

async function run() {
	console.log("--- SEEDING 5 REAL SERVICE VEHICLES INTO THE FLEET ---");

	const fleetList = [
		{ name: "Tata Ace Gold (Chota Hathi)", reg: "MP04AB1234", type: "van", capacity: "1000" },
		{ name: "Mahindra Supro Cargo", reg: "MP04CD5678", type: "van", capacity: "850" },
		{ name: "Maruti Super Carry", reg: "MP04EF9012", type: "van", capacity: "750" },
		{ name: "Ashok Leyland Dost", reg: "MP04GH3456", type: "truck", capacity: "1500" },
		{ name: "Eicher Pro 2049", reg: "MP04IJ7890", type: "truck", capacity: "3500" },
	];

	let seedCount = 0;

	for (const v of fleetList) {
		// Check if vehicle registration already exists
		const [existing] = await db
			.select()
			.from(vehicles)
			.where(eq(vehicles.registration_number, v.reg))
			.limit(1);

		if (!existing) {
			console.log(`Seeding Fleet Vehicle: ${v.name} [${v.reg}]...`);
			await db.insert(vehicles).values({
				name: v.name,
				registration_number: v.reg,
				type: v.type,
				capacity_kg: v.capacity,
				status: "available",
				branch_id: 1, // Bhopal Main Warehouse
			});
			seedCount++;
		}
	}

	console.log(`\nFleet Setup Complete! Successfully seeded ${seedCount} professional logistics vehicles.`);
	process.exit(0);
}

run().catch((err) => {
	console.error("Vehicle seeding failed:", err);
	process.exit(1);
});
