import { db } from "../packages/db/src/index";
import { staff, user, userRoles, roles } from "../packages/db/src/schema";
import { eq } from "drizzle-orm";

async function run() {
	console.log("--- SEEDING 5 REAL DELIVERY DRIVERS WITH ATTACHED SYSTEM ROLES ---");

	// 1. Find or insert the "driver" role in the 'roles' table first
	let [driverRole] = await db
		.select()
		.from(roles)
		.where(eq(roles.name, "driver"))
		.limit(1);

	if (!driverRole) {
		console.log("Creating 'driver' role in the roles table...");
		const [insertedRole] = await db
			.insert(roles)
			.values({
				name: "driver",
				description: "Delivery boy / Logistics driver",
				permissions: {},
			})
			.returning();
		driverRole = insertedRole;
	}

	const driversList = [
		{ name: "Driver / Delivery", email: "driver@evaluna.com", phone: "+91 98765 43210" },
		{ name: "Rajesh Kumar", email: "rajesh.driver@evaluna.com", phone: "+91 98234 56781" },
		{ name: "Amit Singh", email: "amit.driver@evaluna.com", phone: "+91 97654 32109" },
		{ name: "Vikram Rathore", email: "vikram.driver@evaluna.com", phone: "+91 91234 56789" },
		{ name: "Sunil Sharma", email: "sunil.driver@evaluna.com", phone: "+91 99887 76655" },
	];

	let seedCount = 0;

	for (const dr of driversList) {
		// 2. Check/Insert inside the auth 'user' table
		const [existingUser] = await db
			.select()
			.from(user)
			.where(eq(user.email, dr.email))
			.limit(1);

		let activeUserId;

		if (!existingUser) {
			console.log(`Seeding User: ${dr.name} (${dr.email})...`);
			const customId = `usr-drv-${Math.floor(100000 + Math.random() * 900000)}`;
			const [inserted] = await db.insert(user).values({
				id: customId,
				name: dr.name,
				email: dr.email,
				role: "driver",
				emailVerified: true,
			}).returning();
			activeUserId = inserted.id;
		} else {
			activeUserId = existingUser.id;
			await db.update(user).set({ role: "driver" }).where(eq(user.id, activeUserId));
		}

		// 3. Ensure they have a record in the 'user_roles' table!
		if (activeUserId && driverRole) {
			const [existingUserRole] = await db
				.select()
				.from(userRoles)
				.where(eq(userRoles.user_id, activeUserId))
				.limit(1);

			if (!existingUserRole) {
				console.log(`Linking role_id ${driverRole.id} to user ID: ${activeUserId}...`);
				await db.insert(userRoles).values({
					user_id: activeUserId,
					role_id: driverRole.id,
				});
			}
		}

		// 4. Check/Insert inside the HR 'staff' table
		const [existingStaff] = await db
			.select()
			.from(staff)
			.where(eq(staff.email, dr.email))
			.limit(1);

		if (!existingStaff) {
			console.log(`Seeding Staff: ${dr.name} (${dr.email})...`);
			await db.insert(staff).values({
				name: dr.name,
				email: dr.email,
				phone: dr.phone,
				role: "driver", // lowercase
				department: "Logistics",
				join_date: new Date(),
				salary: "25000.00", // Non-null salary constraint
				branch_id: 1, // Bhopal Main Warehouse
			});
			seedCount++;
		}
	}

	console.log(`\nRole Syncing Complete! Successfully seeded and linked 5 drivers with WMS & Auth Roles!`);
	process.exit(0);
}

run().catch((err) => {
	console.error("Seeding failed:", err);
	process.exit(1);
});
