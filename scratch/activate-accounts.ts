import { eq } from "drizzle-orm";
import { db } from "../packages/db/src/index";
import { user, roles, userRoles, rolePermissions } from "../packages/db/src/index";
import { generateRolePermissionSeeds } from "../packages/db/src/permissions";

const ROLE_MAPPINGS: Record<string, string> = {
	"admin@evaluna.com": "super_admin",
	"superadmin@evaluna.com": "super_admin",
	"executive@evaluna.dev": "admin",
	"finance@evaluna.dev": "finance",
	"products@evaluna.dev": "manager",
	"inventory@evaluna.dev": "warehouse_supervisor",
	"dispatch@evaluna.dev": "dispatcher",
	"customer@evaluna.dev": "customer",
	"manager@evaluna.com": "manager",
	"warehouse@evaluna.dev": "warehouse_supervisor",
	"checker@evaluna.com": "auditor",
	"procurement@evaluna.dev": "procurement",
	"putter@evaluna.com": "putter",
	"billing@evaluna.com": "biller",
	"packer@evaluna.com": "packer",
	"sales@evaluna.com": "sales_person",
	"picker@evaluna.com": "picker",
	"auditor@evaluna.com": "auditor",
	"hr@evaluna.com": "hr",
	"driver@evaluna.com": "driver",
	"marketing@evaluna.com": "marketing",
};

const STANDARD_ROLES = [
	{ name: "super_admin", description: "Super Administrator with cross-company permissions" },
	{ name: "admin", description: "Company Administrator with local company permissions" },
	{ name: "manager", description: "General Manager with operational oversight" },
	{ name: "auditor", description: "Internal Auditor with cycle count and pricing review access" },
	{ name: "hr", description: "HR Manager overseeing attendance and payroll" },
	{ name: "finance", description: "Financial Accountant managing transactions and bank accounts" },
	{ name: "marketing", description: "Marketing Coordinator driving sales campaigns" },
	{ name: "warehouse_supervisor", description: "Warehouse Supervisor overseeing putaway and picking" },
	{ name: "putter", description: "Warehouse Putter executing stock placement" },
	{ name: "picker", description: "Warehouse Picker executing stock selection" },
	{ name: "packer", description: "Warehouse Packer executing parcel boxing" },
	{ name: "dispatcher", description: "Warehouse Dispatcher executing courier handoff" },
	{ name: "procurement", description: "Procurement Manager driving supplier purchase orders" },
	{ name: "driver", description: "Logistics Driver executing delivery routes" },
	{ name: "biller", description: "Point of Sale (POS) Operator" },
	{ name: "sales_person", description: "Sales Representative" },
	{ name: "customer", description: "Customer Self-Service login" },
];

async function main() {
	console.log("\n--- ACTIVATING ACCOUNTS & SEEDING RBAC STRUCTURES ---");

	// 1. Seed Roles table
	console.log("Seeding standard roles...");
	for (const roleDef of STANDARD_ROLES) {
		const existingRole = await db
			.select()
			.from(roles)
			.where(eq(roles.name, roleDef.name))
			.limit(1);

		if (existingRole.length === 0) {
			await db.insert(roles).values({
				name: roleDef.name,
				description: roleDef.description,
				permissions: {},
			});
			console.log(`Created role: ${roleDef.name}`);
		}
	}

	// 2. Seed Role Permissions table (Unified static permission matrix)
	console.log("Seeding unified role permissions...");
	const permissionRows = generateRolePermissionSeeds();
	const allRoles = await db.select().from(roles);

	for (const row of permissionRows) {
		const roleRecord = allRoles.find((r) => r.name === row.role_name);
		if (!roleRecord) continue;

		const existingPerm = await db
			.select()
			.from(rolePermissions)
			.where(
				eq(rolePermissions.role_name, row.role_name) &&
				eq(rolePermissions.domain, row.domain) &&
				eq(rolePermissions.action, row.action)
			)
			.limit(1);

		if (existingPerm.length === 0) {
			await db.insert(rolePermissions).values({
				role_name: row.role_name,
				role_id: roleRecord.id,
				domain: row.domain,
				module: row.domain, // Back-compat module column
				action: row.action,
				is_allowed: true,
			});
		}
	}
	console.log(`Seeded ${permissionRows.length} role-permission mappings.`);

	// 3. Update User Statuses to ACTIVE and Link Roles
	console.log("Activating user accounts and mapping roles...");
	const dbUsers = await db.select().from(user);

	for (const dbUser of dbUsers) {
		const expectedRole = ROLE_MAPPINGS[dbUser.email.toLowerCase()];
		if (!expectedRole) {
			console.log(`No expected role mapping for email: ${dbUser.email}`);
			continue;
		}

		const roleRecord = allRoles.find((r) => r.name === expectedRole);
		if (!roleRecord) {
			console.log(`Could not find seeded role for: ${expectedRole}`);
			continue;
		}

		// Update user record status to ACTIVE and save legacy role column if applicable
		await db
			.update(user)
			.set({
				status: "ACTIVE",
				role: expectedRole, // Back-compat column if better-auth or custom setup uses it
			} as any)
			.where(eq(user.id, dbUser.id));

		// Check if user role mapping exists in user_roles
		const existingUserRole = await db
			.select()
			.from(userRoles)
			.where(eq(userRoles.user_id, dbUser.id))
			.limit(1);

		if (existingUserRole.length === 0) {
			await db.insert(userRoles).values({
				user_id: dbUser.id,
				role_id: roleRecord.id,
			});
		} else {
			await db
				.update(userRoles)
				.set({ role_id: roleRecord.id })
				.where(eq(userRoles.user_id, dbUser.id));
		}

		console.log(`Activated and mapped ${dbUser.email} -> ${expectedRole}`);
	}

	console.log("\nSeeding & Activation Complete! All accounts are now fully ACTIVE with correct roles!");
}

main()
	.catch(console.error)
	.finally(() => process.exit(0));
