import { db } from "../lib/db";
import { deliveryTrips, tripStops, user, staff } from "@evaluna/db/schema";
import { eq, or } from "drizzle-orm";

async function main() {
	const trip50 = await db.query.deliveryTrips.findFirst({
		where: eq(deliveryTrips.id, 50),
		with: { stops: true },
	});
	console.log("=== TRIP 50 ===");
	console.log(JSON.stringify(trip50, null, 2));

	const driverIdInTrip = trip50?.driver_id;
	console.log("=== DRIVER ID IN TRIP 50 ===", driverIdInTrip);

	if (driverIdInTrip) {
		const u = await db.query.user.findFirst({
			where: or(
				eq(user.id, driverIdInTrip),
				eq(user.email, driverIdInTrip),
				eq(user.name, driverIdInTrip)
			),
		});
		console.log("=== USER TABLE RECORD ===", u);

		const s = await db.query.staff.findFirst({
			where: or(
				eq(staff.email, driverIdInTrip),
				eq(staff.name, driverIdInTrip)
			),
		});
		console.log("=== STAFF TABLE RECORD ===", s);
	}

	const allUsers = await db.query.user.findMany();
	console.log("=== ALL USERS ===");
	console.log(allUsers.map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role, staff_id: u.staff_id })));

	const allStaff = await db.query.staff.findMany();
	console.log("=== ALL STAFF ===");
	console.log(allStaff.map((s: any) => ({ id: s.id, staff_code: s.staff_code, name: s.name, email: s.email, role: s.role })));

	process.exit(0);
}

main().catch(console.error);
