import { eq } from "drizzle-orm";
import {
	db,
	roles,
	user,
	userRoles,
	staff,
} from "../packages/db/src/index";
import { hashPassword } from "better-auth/crypto";

async function main() {
	console.log("Setting up loader@evaluna.com...");

	// 1. Ensure 'loader' role exists
	let loaderRole = await db
		.select()
		.from(roles)
		.where(eq(roles.name, "loader"))
		.limit(1);

	if (loaderRole.length === 0) {
		const [newRole] = await db
			.insert(roles)
			.values({
				name: "loader",
				description: "Warehouse Loader for Trip verification",
				permissions: {},
			})
			.returning();
		loaderRole = [newRole];
		console.log("Created loader role");
	}

	const roleId = loaderRole[0].id;

	// 2. Check if user loader@evaluna.com exists
	let existingUser = await db
		.select()
		.from(user)
		.where(eq(user.email, "loader@evaluna.com"))
		.limit(1);

	let userId: string;

	if (existingUser.length === 0) {
		const hashedPassword = await hashPassword("Password@123");
		const [newUser] = await db
			.insert(user)
			.values({
				id: "loader_user_id_100",
				email: "loader@evaluna.com",
				name: "LOADER",
				status: "ACTIVE",
				role: "loader",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any)
			.returning();
		userId = newUser.id;
		console.log("Created loader user record");
	} else {
		userId = existingUser[0].id;
		await db
			.update(user)
			.set({
				status: "ACTIVE",
				role: "loader",
			} as any)
			.where(eq(user.id, userId));
		console.log("Updated loader user status and role");
	}

	// 3. Ensure userRoles mapping
	const existingUserRole = await db
		.select()
		.from(userRoles)
		.where(eq(userRoles.user_id, userId))
		.limit(1);

	if (existingUserRole.length === 0) {
		await db.insert(userRoles).values({
			user_id: userId,
			role_id: roleId,
		});
		console.log("Linked user to loader role in user_roles");
	} else {
		await db
			.update(userRoles)
			.set({ role_id: roleId })
			.where(eq(userRoles.user_id, userId));
		console.log("Updated user_roles mapping to loader role");
	}

	// 4. Ensure staff record
	const existingStaff = await db
		.select()
		.from(staff)
		.where(eq(staff.email, "loader@evaluna.com"))
		.limit(1);

	if (existingStaff.length === 0) {
		await db.insert(staff).values({
			user_id: userId,
			name: "LOADER",
			email: "loader@evaluna.com",
			staff_code: "STF-LOADER",
			role: "loader",
			status: "ACTIVE",
		} as any);
		console.log("Created staff record for loader");
	} else {
		await db
			.update(staff)
			.set({
				user_id: userId,
				role: "loader",
				status: "ACTIVE",
			} as any)
			.where(eq(staff.id, existingStaff[0].id));
		console.log("Updated staff record for loader");
	}

	console.log("Loader account set up successfully!");
}

main()
	.catch(console.error)
	.finally(() => process.exit(0));
