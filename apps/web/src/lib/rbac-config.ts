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
	"Super Admin": "/superadmin",
	Admin: "/admin",
	Manager: "/manager",
	HR: "/hr",
	Finance: "/finance",
	Procurement: "/procurement",
	"Warehouse Supervisor": "/warehouse",
	Putter: "/putter",
	Picker: "/picker",
	Packer: "/packer",
	Dispatcher: "/packing-dispatch",
	Auditor: "/auditor",
	Salesperson: "/sales",
	Customer: "/customer",
	Driver: "/driver",
	Biller: "/biller",
	"Delivery Manager": "/manager",
	"Delivery Boy": "/driver",
};

/**
 * Resolves the canonical dashboard route for a given role name.
 * @param roleName The name of the role.
 * @returns The canonical dashboard route.
 */
export function getCanonicalDashboardRoute(roleName: string): string {
	if (!roleName) return "/customer";
	const normalized = roleName.trim().toLowerCase();
	if (normalized === "superadmin" || normalized === "super_admin" || normalized === "super admin") return "/superadmin";
	if (normalized === "admin") return "/admin";
	if (normalized === "salesperson" || normalized === "sales_person" || normalized === "sales") return "/sales";
	if (normalized === "customer") return "/customer";
	
	return (
		(ROLE_DASHBOARD_MAP as Record<string, string>)[roleName] ?? "/customer"
	);
}
