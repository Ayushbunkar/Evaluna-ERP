const { db } = require("../packages/db/src/db");
const { staff } = require("../packages/db/src/schema");
const { user } = require("../packages/db/src/auth-schema");
const { eq } = require("drizzle-orm");

async function main() {
	console.log("Fixing warehouse user role in database...");

	// 1. Update user table
	const [updatedUser] = await db
		.update(user)
		.set({ role: "Warehouse Operations" })
		.where(eq(user.email, "warehouse@evaluna.dev"))
		.returning();

	if (updatedUser) {
		console.log("Successfully updated user table:", updatedUser.email, "role set to:", updatedUser.role);
	} else {
		console.log("User warehouse@evaluna.dev not found in user table.");
	}

	// 2. Update staff table
	const [updatedStaff] = await db
		.update(staff)
		.set({ role: "Warehouse Operations" })
		.where(eq(staff.email, "warehouse@evaluna.dev"))
		.returning();

	if (updatedStaff) {
		console.log("Successfully updated staff table:", updatedStaff.email, "role set to:", updatedStaff.role);
	} else {
		console.log("User warehouse@evaluna.dev not found in staff table.");
	}

	process.exit(0);
}

main().catch((err) => {
	console.error("Failed to update role:", err);
	process.exit(1);
});
