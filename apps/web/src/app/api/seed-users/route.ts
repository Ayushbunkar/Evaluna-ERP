import { account, roles, user, userRoles } from "@evaluna/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const USERS_TO_SEED = [
	{ name: "Super Admin", email: "superadmin@evaluna.com", role: "super_admin" },
	{ name: "Admin", email: "admin@evaluna.com", role: "admin" },
	{ name: "Sales Manager", email: "sales@evaluna.com", role: "sales_person" },
	{ name: "Auditor Desk", email: "auditor@evaluna.com", role: "auditor" },
	{ name: "HR Manager", email: "hr@evaluna.com", role: "hr" },
	{ name: "Warehouse Picker", email: "picker@evaluna.com", role: "picker" },
	{ name: "Warehouse Putter", email: "putter@evaluna.com", role: "putter" },
	{ name: "Driver / Delivery", email: "driver@evaluna.com", role: "driver" },
	{ name: "Marketing Exec", email: "marketing@evaluna.com", role: "marketing" },
	{
		name: "Company Executive",
		email: "executive@evaluna.dev",
		role: "manager",
	},
	{ name: "Finance Manager", email: "finance@evaluna.dev", role: "finance" },
	{ name: "Warehouse Packer", email: "packer@evaluna.com", role: "packer" },
	{ name: "Biller Clerk", email: "billing@evaluna.com", role: "biller" },
];

export async function POST() {
	try {
		const password = "Password@123";
		// Verified scrypt hash string for "Password@123" under better-auth
		const scryptHash =
			"cf79ec0e6da8a75ed49c88fc5d2427bf:cf22e3896ddfcc9a4e7a09faf2083c81f5058958199a317364c27c21ce0cf4eab71d58af36711baeed57134e4167fd711e98d32ede04a335b52c1f3e32a05bb6";
		const created = [];
		const updated = [];

		for (const u of USERS_TO_SEED) {
			let userId = "";

			// 1. Check if user exists
			const [existingUser] = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, u.email))
				.limit(1);

			if (!existingUser) {
				// Create via better-auth
				const result = await auth.api.signUpEmail({
					body: {
						email: u.email,
						password: password,
						name: u.name,
					},
				});

				if (result?.user) {
					userId = result.user.id;
					created.push(u.email);
				}
			} else {
				userId = existingUser.id;
				updated.push(u.email);
			}

			if (userId) {
				// 2. Ensure User is ACTIVE and has no password change force
				await db
					.update(user)
					.set({
						status: "ACTIVE",
						force_password_change: false,
						is_superadmin: u.role === "super_admin",
					} as any)
					.where(eq(user.id, userId));

				// 3. Reset password in credential provider to "Password@123" scrypt hash
				await db
					.update(account)
					.set({ password: scryptHash })
					.where(
						and(
							eq(account.userId, userId),
							eq(account.providerId, "credential"),
						),
					);

				// 4. Resolve or Create Role
				let [roleRecord] = await db
					.select()
					.from(roles)
					.where(eq(roles.name, u.role))
					.limit(1);

				if (!roleRecord) {
					const [newRole] = await db
						.insert(roles)
						.values({
							name: u.role,
							description: `${u.name} Role`,
							permissions: {},
						})
						.returning();
					roleRecord = newRole;
				}

				// 5. Assign Role in user_roles table if not already assigned
				const [existingUserRole] = await db
					.select()
					.from(userRoles)
					.where(
						and(
							eq(userRoles.user_id, userId),
							eq(userRoles.role_id, roleRecord.id),
						),
					)
					.limit(1);

				if (!existingUserRole) {
					await db.insert(userRoles).values({
						user_id: userId,
						role_id: roleRecord.id,
					});
				}
			}
		}

		return NextResponse.json({
			success: true,
			message:
				"All role dashboards successfully seeded and connected to database!",
			created_count: created.length,
			updated_count: updated.length,
			credentials: {
				password: password,
				users: USERS_TO_SEED.map((x) => ({
					name: x.name,
					email: x.email,
					role: x.role,
				})),
			},
		});
	} catch (error: any) {
		console.error("Seed users error:", error);
		return NextResponse.json(
			{ success: false, error: error?.message ?? "Unknown error" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return POST();
}
