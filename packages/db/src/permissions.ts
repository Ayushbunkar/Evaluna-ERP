/**
 * Evaluna ERP — Permission Architecture
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Single source of truth for:
 *   - Role definitions & hierarchy levels
 *   - Permission domains & actions
 *   - Static permission matrix (seeded into role_permissions table)
 *   - Runtime helpers used by middleware, TRPC, and UI gates
 *
 * Import this from BOTH server and client code.
 */

// ── Role Definitions ──────────────────────────────────────────────────────────
export const ROLES = [
	"super_admin", // New highest level role
	"admin",
	"manager",
	"auditor",
	"hr",
	"finance",
	"marketing",
	"warehouse_supervisor", // Consolidated role
	"putter",
	"picker",
	"packer", // New role
	"dispatcher", // New role
	"procurement",
	"driver",
	"biller",
	"sales_person",
	"delivery_manager",
	"delivery_boy",
	"customer",
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Numeric hierarchy — lower number = more powerful.
 * A user can do everything their level and BELOW can do.
 * Levels adjusted for new hierarchy: super_admin (0) > admin (1) > manager (2)
 */
export const ROLE_LEVEL: Record<Role, number> = {
	super_admin: 0,
	admin: 1,
	manager: 2,
	auditor: 3,
	hr: 4,
	finance: 4,
	marketing: 5,
	warehouse_supervisor: 6,
	putter: 7,
	picker: 7,
	packer: 7,
	dispatcher: 7,
	procurement: 8,
	driver: 9,
	biller: 10,
	sales_person: 11,
	delivery_manager: 12,
	delivery_boy: 13,
	// Customer self-service login. Bottom of the hierarchy.
	customer: 99,
};

// ── Role Dashboard Mapping ──────────────────────────────────────────────────
// Canonical mapping for automatic redirection after login (Requirement 4 & 5)
export const ROLE_DASHBOARD_MAP: Record<Role, string> = {
	super_admin: "/superadmin",
	admin: "/admin/dashboard",
	manager: "/manager",
	auditor: "/auditor",
	hr: "/hr",
	finance: "/finance",
	marketing: "/marketing",
	warehouse_supervisor: "/dashboard/warehouse/supervisor",
	putter: "/dashboard/warehouse/put-away",
	picker: "/dashboard/warehouse/picking",
	packer: "/dashboard/warehouse/packing",
	dispatcher: "/dashboard/warehouse/packing-dispatch",
	procurement: "/dashboard/procurement",
	driver: "/driver",
	biller: "/dashboard/pos", // Assuming biller is the POS operator
	sales_person: "/sales",
	delivery_manager: "/delivery/manager",
	delivery_boy: "/delivery/dashboard",
	customer: "/customer/dashboard",
};

// ── Permission Domains ────────────────────────────────────────────────────────
export const DOMAINS = [
	"pos",
	"inventory",
	"purchases",
	"suppliers",
	"customers",
	"products",
	"staff", // Employee profile management (HR-related)
	"users", // URCAM: User account/credential/status management
	"roles", // URCAM: Role and permission management
	"reports",
	"accounting",
	"finance",
	"settings",
	"backups",
	"monitoring",
	"branches",
	"payroll",
	"marketing",
	"warehouse_ops", // Consolidated warehouse operations domain
	"notifications",
	"imports",
	"loyalty",
	// ── Auditor (internal control / verification) domains ──────────────────────
	"upc",
	"audit",
	"inventory_audit",
	"placement",
	"pricing_audit",
	"route_audit",
	"audit_tasks",
	// ── Attendance & workforce tracking ────────────────────────────────────────
	"attendance",
] as const;

export type Domain = (typeof DOMAINS)[number];
export type Action =
	| "read"
	| "write"
	| "delete"
	| "approve"
	| "lock"
	| "reset_password"
	| "session_revoke"
	| "change_role";

export type Permission = `${Domain}.${Action}`;

// ── Static Permission Matrix ──────────────────────────────────────────────────
// Each entry: [domain, action, minimum_role_required_to_have_this_permission]
// Because of inheritance, any role at or above the level also gets this permission.
type PermissionSeed = { domain: Domain; action: Action; minRole: Role };

export const PERMISSION_MATRIX: PermissionSeed[] = [
	// ── POS ──────────────────────────────────────────────────────────────────
	{ domain: "pos", action: "read", minRole: "sales_person" },
	{ domain: "pos", action: "write", minRole: "sales_person" },
	{ domain: "pos", action: "delete", minRole: "biller" },
	{ domain: "pos", action: "approve", minRole: "manager" },

	// ── Inventory ─────────────────────────────────────────────────────────────
	{ domain: "inventory", action: "read", minRole: "auditor" },
	{ domain: "inventory", action: "write", minRole: "putter" },
	{ domain: "inventory", action: "delete", minRole: "manager" },
	{ domain: "inventory", action: "approve", minRole: "manager" },

	// ── Purchases ─────────────────────────────────────────────────────────────
	{ domain: "purchases", action: "read", minRole: "auditor" },
	{ domain: "purchases", action: "write", minRole: "putter" },
	{ domain: "purchases", action: "delete", minRole: "manager" },
	{ domain: "purchases", action: "approve", minRole: "manager" },

	// ── Suppliers ─────────────────────────────────────────────────────────────
	{ domain: "suppliers", action: "read", minRole: "auditor" },
	{ domain: "suppliers", action: "write", minRole: "manager" },
	{ domain: "suppliers", action: "delete", minRole: "manager" },
	{ domain: "suppliers", action: "approve", minRole: "admin" },

	// ── Customers ─────────────────────────────────────────────────────────────
	{ domain: "customers", action: "read", minRole: "sales_person" },
	{ domain: "customers", action: "write", minRole: "biller" },
	{ domain: "customers", action: "delete", minRole: "manager" },
	{ domain: "customers", action: "approve", minRole: "manager" },

	// ── Products ──────────────────────────────────────────────────────────────
	{ domain: "products", action: "read", minRole: "sales_person" },
	{ domain: "products", action: "write", minRole: "manager" },
	{ domain: "products", action: "delete", minRole: "manager" },
	{ domain: "products", action: "approve", minRole: "admin" },

	// ── Users (URCAM: Account/Credential/Status Management) ─────────────────────
	{ domain: "users", action: "read", minRole: "manager" }, // View user list
	{ domain: "users", action: "write", minRole: "admin" }, // Create/Edit users
	{ domain: "users", action: "delete", minRole: "super_admin" }, // Only Super Admin can fully delete an account
	{ domain: "users", action: "lock", minRole: "admin" }, // Lock/Unlock user accounts (status change)
	{ domain: "users", action: "reset_password", minRole: "admin" }, // Reset passwords
	{ domain: "users", action: "session_revoke", minRole: "admin" }, // Revoke all sessions
	{ domain: "users", action: "change_role", minRole: "super_admin" }, // Critical: Only Super Admin can change roles

	// ── Roles (URCAM: Role/Permission Management) ───────────────────────────────
	{ domain: "roles", action: "read", minRole: "manager" }, // View roles/permissions
	{ domain: "roles", action: "write", minRole: "super_admin" }, // Create/Edit role definitions (permissions)
	{ domain: "roles", action: "delete", minRole: "super_admin" }, // Delete roles

	// ── Staff (Employee Profile Management - HR related) ────────────────────────
	{ domain: "staff", action: "read", minRole: "manager" },
	{ domain: "staff", action: "write", minRole: "manager" },
	{ domain: "staff", action: "delete", minRole: "admin" },
	{ domain: "staff", action: "approve", minRole: "admin" },

	// ── Reports ───────────────────────────────────────────────────────────────
	{ domain: "reports", action: "read", minRole: "auditor" },
	{ domain: "reports", action: "write", minRole: "manager" },
	{ domain: "reports", action: "delete", minRole: "admin" },
	{ domain: "reports", action: "approve", minRole: "admin" },

	// ── Accounting ────────────────────────────────────────────────────────────
	{ domain: "accounting", action: "read", minRole: "auditor" },
	{ domain: "accounting", action: "write", minRole: "manager" },
	{ domain: "accounting", action: "delete", minRole: "admin" },
	{ domain: "accounting", action: "approve", minRole: "admin" },

	// ── Finance ───────────────────────────────────────────────────────────────
	// Payments, bank accounts, transfers, petty cash, reimbursement payouts.
	{ domain: "finance", action: "read", minRole: "auditor" },
	{ domain: "finance", action: "write", minRole: "manager" },
	{ domain: "finance", action: "delete", minRole: "admin" },
	{ domain: "finance", action: "approve", minRole: "manager" },

	// ── Settings ──────────────────────────────────────────────────────────────
	{ domain: "settings", action: "read", minRole: "manager" },
	{ domain: "settings", action: "write", minRole: "admin" },
	{ domain: "settings", action: "delete", minRole: "admin" },
	{ domain: "settings", action: "approve", minRole: "admin" },

	// ── Backups ───────────────────────────────────────────────────────────────
	{ domain: "backups", action: "read", minRole: "admin" },
	{ domain: "backups", action: "write", minRole: "admin" },
	{ domain: "backups", action: "delete", minRole: "admin" },
	{ domain: "backups", action: "approve", minRole: "admin" },

	// ── Monitoring ────────────────────────────────────────────────────────────
	{ domain: "monitoring", action: "read", minRole: "auditor" },
	{ domain: "monitoring", action: "write", minRole: "admin" },
	{ domain: "monitoring", action: "delete", minRole: "admin" },
	{ domain: "monitoring", action: "approve", minRole: "admin" },

	// ── Branches ──────────────────────────────────────────────────────────────
	{ domain: "branches", action: "read", minRole: "manager" },
	{ domain: "branches", action: "write", minRole: "admin" },
	{ domain: "branches", action: "delete", minRole: "admin" },
	{ domain: "branches", action: "approve", minRole: "admin" },

	// ── Payroll ───────────────────────────────────────────────────────────────
	{ domain: "payroll", action: "read", minRole: "manager" },
	{ domain: "payroll", action: "write", minRole: "manager" },
	{ domain: "payroll", action: "delete", minRole: "admin" },
	{ domain: "payroll", action: "approve", minRole: "admin" },

	// ── Marketing ─────────────────────────────────────────────────────────────
	{ domain: "marketing", action: "read", minRole: "auditor" },
	{ domain: "marketing", action: "write", minRole: "manager" },
	{ domain: "marketing", action: "delete", minRole: "manager" },
	{ domain: "marketing", action: "approve", minRole: "admin" },

	// ── Warehouse Operations (Picking, Packing, Putaway, Dispatch) ──────────────
	{ domain: "warehouse_ops", action: "read", minRole: "picker" },
	{ domain: "warehouse_ops", action: "write", minRole: "putter" }, // Putters/Pickers need to write stock/task status
	{ domain: "warehouse_ops", action: "delete", minRole: "manager" },
	{ domain: "warehouse_ops", action: "approve", minRole: "manager" }, // Approving inventory adjustments/transfers

	// ── Notifications ─────────────────────────────────────────────────────────
	{ domain: "notifications", action: "read", minRole: "sales_person" },
	{ domain: "notifications", action: "write", minRole: "manager" },
	{ domain: "notifications", action: "delete", minRole: "admin" },
	{ domain: "notifications", action: "approve", minRole: "admin" },

	// ── Imports ───────────────────────────────────────────────────────────────
	{ domain: "imports", action: "read", minRole: "manager" },
	{ domain: "imports", action: "write", minRole: "manager" },
	{ domain: "imports", action: "delete", minRole: "admin" },
	{ domain: "imports", action: "approve", minRole: "admin" },

	// ── Loyalty ───────────────────────────────────────────────────────────────
	{ domain: "loyalty", action: "read", minRole: "biller" },
	{ domain: "loyalty", action: "write", minRole: "biller" },
	{ domain: "loyalty", action: "delete", minRole: "manager" },
	{ domain: "loyalty", action: "approve", minRole: "manager" },

	// ══ Auditor domains ═════════════════════════════════════════════════════
	// Granted to auditor and above (admin/manager inherit). Roles below auditor
	// (hr, putter, picker, …) get NONE of these. Actions map granular verbs:
	//   write = create/generate/assign/flag ; approve = verify/resolve.
	// Note: auditor is deliberately NOT given products.write/accounting.write —
	// pricing and financial records stay with manager/admin.

	// Inventory inspection / cycle count / discrepancy handling
	{ domain: "inventory_audit", action: "read", minRole: "auditor" },
	{ domain: "inventory_audit", action: "write", minRole: "auditor" },
	{ domain: "inventory_audit", action: "approve", minRole: "auditor" },

	// Audit findings + corrective actions
	{ domain: "audit", action: "read", minRole: "auditor" },
	{ domain: "audit", action: "write", minRole: "auditor" },
	{ domain: "audit", action: "approve", minRole: "auditor" },

	// UPC verification / generation / task assignment
	{ domain: "upc", action: "read", minRole: "auditor" },
	{ domain: "upc", action: "write", minRole: "auditor" },
	{ domain: "upc", action: "approve", minRole: "auditor" },

	// Stock placement verification
	{ domain: "placement", action: "read", minRole: "auditor" },
	{ domain: "placement", action: "write", minRole: "auditor" },
	{ domain: "placement", action: "approve", minRole: "auditor" },

	// Price-change review (flag only — never edits the price record)
	{ domain: "pricing_audit", action: "read", minRole: "auditor" },
	{ domain: "pricing_audit", action: "write", minRole: "auditor" },

	// Route execution audit
	{ domain: "route_audit", action: "read", minRole: "auditor" },
	{ domain: "route_audit", action: "write", minRole: "auditor" },

	// Auditor task feed
	{ domain: "audit_tasks", action: "read", minRole: "auditor" },
	{ domain: "audit_tasks", action: "write", minRole: "auditor" },

	// ══ Attendance & workforce tracking ═════════════════════════════════════
	// Self-service check-in/out/break is available to EVERY staff role
	// (delivery_boy is the lowest staff level; customer is excluded by design).
	// Row-level scoping ("own record only") is enforced in the procedures, not
	// here — the matrix only grants the capability.
	{ domain: "attendance", action: "read", minRole: "delivery_boy" },
	{ domain: "attendance", action: "write", minRole: "delivery_boy" },
	// Verification, manual correction, device approval, geofence & settings
	// config — HR and above (hr, auditor, manager, admin via inheritance).
	{ domain: "attendance", action: "approve", minRole: "hr" },
	{ domain: "attendance", action: "delete", minRole: "admin" },
];

// ── Runtime Helpers ───────────────────────────────────────────────────────────

/**
 * Returns all permissions (domain.action strings) that a role inherits.
 * Uses numeric hierarchy: role with level <= seed.minRole.level gets the permission.
 */
export function getPermissionsForRole(role: Role): Permission[] {
	const level = ROLE_LEVEL[role];
	return PERMISSION_MATRIX.filter(
		(seed) => level <= ROLE_LEVEL[seed.minRole],
	).map((seed) => `${seed.domain}.${seed.action}` as Permission);
}

/**
 * Returns true if the given role has a specific domain.action permission.
 */
export function roleHasPermission(
	role: Role,
	domain: Domain,
	action: Action,
): boolean {
	const seed = PERMISSION_MATRIX.find(
		(s) => s.domain === domain && s.action === action,
	);
	if (!seed) return false;
	return ROLE_LEVEL[role] <= ROLE_LEVEL[seed.minRole];
}

/**
 * Returns true if roleA is at least as powerful as roleB.
 * e.g. isAtLeastRole("manager", "auditor") → true
 */
export function isAtLeastRole(userRole: Role, requiredRole: Role): boolean {
	return ROLE_LEVEL[userRole] <= ROLE_LEVEL[requiredRole];
}

/**
 * Parse a permission string "domain.action" into typed parts.
 */
export function parsePermission(
	p: string,
): { domain: Domain; action: Action } | null {
	const [domain, action] = p.split(".");
	if (
		DOMAINS.includes(domain as Domain) &&
		action &&
		["read", "write", "delete", "approve"].includes(action)
	) {
		return { domain: domain as Domain, action: action as Action };
	}
	return null;
}

/**
 * Generates the full seed rows for the role_permissions table.
 * Call this during DB seed / migration.
 */
export function generateRolePermissionSeeds(): Array<{
	role_name: string;
	domain: string;
	action: string;
}> {
	const rows: Array<{ role_name: string; domain: string; action: string }> = [];
	for (const role of ROLES) {
		const perms = getPermissionsForRole(role);
		for (const perm of perms) {
			const parsed = parsePermission(perm);
			if (parsed) {
				rows.push({
					role_name: role,
					domain: parsed.domain,
					action: parsed.action,
				});
			}
		}
	}
	return rows;
}

// ── Route Permission Map ──────────────────────────────────────────────────────
// Maps URL path prefixes to the minimum role allowed.
// Used by middleware.ts for coarse-grained route protection.
export const ROUTE_ROLE_MAP: Array<{ path: string; minRole: Role }> = [
	// Shared Routes
	{ path: "/settings", minRole: "sales_person" }, // Fine-grained inside
	{ path: "/profile", minRole: "sales_person" },
	{ path: "/notifications", minRole: "sales_person" },
	{ path: "/attendance", minRole: "delivery_boy" }, // self-service; all staff, not customers
	{ path: "/sync", minRole: "sales_person" },

	// Role Dashboards
	{ path: "/superadmin", minRole: "super_admin" },
	{ path: "/admin/companies", minRole: "super_admin" },
	{ path: "/admin", minRole: "admin" }, // Note: Both super_admin (0) and admin (1) can access the /admin prefix
	{ path: "/manager", minRole: "manager" },
	{ path: "/auditor", minRole: "auditor" },
	{ path: "/hr", minRole: "hr" },
	{ path: "/finance", minRole: "finance" },
	{ path: "/marketing", minRole: "marketing" },
	{ path: "/putter", minRole: "putter" },
	{ path: "/picker", minRole: "picker" },
	{ path: "/packer", minRole: "packer" },
	{ path: "/dispatcher", minRole: "dispatcher" },
	{ path: "/driver", minRole: "driver" },
	{ path: "/biller", minRole: "biller" },
	{ path: "/sales", minRole: "sales_person" },
	{ path: "/customer", minRole: "customer" },
	{ path: "/procurement", minRole: "procurement" },
	// Consolidated Warehouse Routes
	{ path: "/dashboard/warehouse", minRole: "warehouse_supervisor" },
];
