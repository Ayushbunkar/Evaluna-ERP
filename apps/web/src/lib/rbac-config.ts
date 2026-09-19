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
	"Marketing",
	"Procurement",
	"Warehouse Supervisor",
	"Putter",
	"Picker",
	"Packer",
	"Loader",
	"Auditor",
	"Salesperson",
	"Customer",
	"Driver",
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
	Marketing: "/marketing",
	Procurement: "/procurement",
	"Warehouse Supervisor": "/warehouse",
	Putter: "/putter",
	Picker: "/picker",
	Packer: "/packer",
	Loader: "/loader",
	Auditor: "/auditor",
	Salesperson: "/sales",
	Customer: "/customer",
	Driver: "/driver",
};

/**
 * Resolves the canonical dashboard route for a given role name.
 * @param roleName The name of the role.
 * @returns The canonical dashboard route.
 */
export function getCanonicalDashboardRoute(roleName: string): string {
	if (!roleName) return "/customer";
	const normalized = roleName.trim().replace(/_/g, " ").toLowerCase();

	const roleDashboardMap: Record<string, string> = {
		superadmin: "/superadmin",
		"super admin": "/superadmin",
		admin: "/admin",
		manager: "/manager",
		auditor: "/auditor",
		hr: "/hr",
		finance: "/finance",
		marketing: "/marketing",
		putter: "/putter",
		picker: "/picker",
		driver: "/driver",
		"delivery boy": "/driver",
		deliveryboy: "/driver",
		biller: "/sales",
		billing: "/sales",
		cashier: "/sales",
		checker: "/checker",
		packer: "/packer",
		loader: "/loader",
		dispatcher: "/packer",
		dispatch: "/packer",
		salesperson: "/sales",
		sales: "/sales",
		"sales person": "/sales",
		"delivery manager": "/manager",
		customer: "/customer",
		warehouse: "/warehouse",
		"warehouse supervisor": "/warehouse",
		"warehouse operations": "/warehouse",
		procurement: "/procurement",
	};

	return roleDashboardMap[normalized] ?? "/customer";
}

