import { db } from "../lib/db";
import { deliveryTrips, tripStops, user, staff } from "@evaluna/db/schema";
import { eq, or, desc, inArray, sql } from "drizzle-orm";

async function main() {
	const currentUser = {
		id: "5fed06bd-f6e4-4044-a114-f63129959477",
		name: "newdriver",
		email: "newdriver@evaluna.com",
		staffId: 142,
	};

	const ids = new Set<string>();
	const addSafe = (val: any) => {
		if (val !== undefined && val !== null && String(val).trim()) {
			const str = String(val).trim();
			ids.add(str);
			ids.add(str.toLowerCase());
		}
	};

	addSafe(currentUser.id);
	addSafe(currentUser.email);
	addSafe(currentUser.name);
	addSafe(currentUser.staffId);

	// Look up in staff table
	const staffList = await db.query.staff.findMany({
		where: or(
			eq(staff.id, 142),
			eq(staff.email, "newdriver@evaluna.com"),
			eq(staff.name, "newdriver")
		)
	});
	for (const s of staffList) {
		addSafe(s.id);
		addSafe(s.staff_code);
		addSafe(s.email);
		addSafe(s.name);
	}

	const driverIds = Array.from(ids);
	console.log("Resolved driverIds:", driverIds);

	const trips = await db.query.deliveryTrips.findMany({
		where: inArray(deliveryTrips.driver_id, driverIds),
		with: { stops: true },
	});
	console.log("Matched trips for driverIds:", trips.map(t => ({ id: t.id, driver_id: t.driver_id, status: t.status, stops: t.stops?.length })));

	process.exit(0);
}

main().catch(console.error);
