import { db } from "../packages/db/src/index";
import { user, staff } from "../packages/db/src/schema";
import { eq, or } from "drizzle-orm";

async function run() {
	console.log("TESTING LIST DRIVERS QUERY...");

	const users = await db.query.user.findMany({
		where: (u, { eq, or }) =>
			or(
				eq(u.role, "delivery"),
				eq(u.role, "driver"),
				eq(u.role, "delivery_boy"),
			),
		columns: { id: true, name: true, email: true, role: true, image: true },
	});

	console.log(`Found ${users.length} drivers in user table.`);
	for (const u of users) {
		console.log(`- User: ${u.name} (${u.email}), Role: ${u.role}`);
	}

	const staffMembers = await db.query.staff.findMany({
		where: (s, { eq, or }) =>
			or(
				eq(s.role, "delivery"),
				eq(s.role, "driver"),
				eq(s.role, "delivery_boy"),
			),
		columns: { id: true, name: true, email: true, role: true },
	});

	console.log(`\nFound ${staffMembers.length} drivers in staff table.`);
	for (const s of staffMembers) {
		console.log(`- Staff: ${s.name} (${s.email}), Role: ${s.role}`);
	}

	const merged = new Map();
	for (const u of users) {
		merged.set(u.email.toLowerCase(), {
			id: u.id,
			name: u.name,
			email: u.email,
			role: u.role,
			image: u.image,
		});
	}
	for (const s of staffMembers) {
		if (s.email && !merged.has(s.email.toLowerCase())) {
			merged.set(s.email.toLowerCase(), {
				id: String(s.id),
				name: s.name,
				email: s.email,
				role: s.role,
				image: null,
			});
		}
	}

	const finalResult = Array.from(merged.values());
	console.log(`\nMerged Distinct Drivers Count: ${finalResult.length}`);
	for (const r of finalResult) {
		console.log(`- Driver: ${r.name} (${r.email}), ID: ${r.id}, Role: ${r.role}`);
	}

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
