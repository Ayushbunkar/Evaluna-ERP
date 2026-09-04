// apps/web/src/lib/rbac-config.ts

/**
 * Centralized list of all valid ERP Role Names.
 * This should match the role names used in the `roles` database table.
 */
export const ROLE_NAMES = [
	"Super Admin",
	"Admin",
	"Manager",
	"HR",
	"Finance",
	"Procurement",
	"Warehouse Supervisor",
	"Putter",
	"Picker",
	"Packer",
	"Dispatcher",
	"Auditor",
	"Salesperson",
	"Customer",
	"Driver",
	"Biller",
	"Delivery Manager",
	"Delivery Boy",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

/**
 * Centralized mapping of Role Name to Canonical Dashboard Route (Requirement 4).
 */
export const ROLE_DASHBOARD_MAP: Record<RoleName, string> = {
	"Super Admin": "/admin",
	Admin: "/admin",
	Manager: "/manager",
	HR: "/hr",
	Finance: "/finance",
	Procurement: "/dashboard/procurement",
	"Warehouse Supervisor": "/dashboard/warehouse",
	Putter: "/dashboard/warehouse/put-away",
	Picker: "/dashboard/warehouse/picking",
	Packer: "/dashboard/warehouse/packing",
	Dispatcher: "/dashboard/warehouse/packing-dispatch",
	Auditor: "/auditor",
	Salesperson: "/sales",
	Customer: "/customer",
	Driver: "/driver",
	Biller: "/biller",
	"Delivery Manager": "/delivery/manager",
	"Delivery Boy": "/delivery/boy",
};

/**
 * Resolves the canonical dashboard route for a given role name.
 * @param roleName The name of the role.
 * @returns The canonical dashboard route.
 */
export function getCanonicalDashboardRoute(roleName: string): string {
	// Use the explicit map, or fall back to a default
	return (
		(ROLE_DASHBOARD_MAP as Record<string, string>)[roleName] ?? "/dashboard"
	);
}
