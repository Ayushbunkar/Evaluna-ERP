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
	"admin",
	"manager",
	"auditor",
	"hr",
	"finance",
	"marketing",
	"putter",
	"picker",
	"driver",
	"biller",
	"sales_person",
	"delivery_manager",
	"delivery_boy",
	"customer",
	"warehouse",
	"Warehouse Operations",
	"procurement",
	"Procurement",
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Numeric hierarchy — lower number = more powerful.
 * A user can do everything their level and BELOW can do.
 */
export const ROLE_LEVEL: Record<Role, number> = {
	admin: 0,
	manager: 1,
	auditor: 2,
	hr: 3,
	finance: 3,
	marketing: 4,
	putter: 5,
	picker: 6,
	warehouse: 5,
	"Warehouse Operations": 5,
	procurement: 5,
	Procurement: 5,
	driver: 7,
	biller: 8,
	sales_person: 9,
	delivery_manager: 10,
	delivery_boy: 11,
	// Customer self-service login. Bottom of the hierarchy and deliberately
	// absent from PERMISSION_MATRIX, so it inherits ZERO staff permissions.
	customer: 99,
};

// ── Permission Domains ────────────────────────────────────────────────────────
export const DOMAINS = [
	"pos",
	"inventory",
	"purchases",
	"suppliers",
	"customers",
	"products",
	"staff",
	"reports",
	"accounting",
	"finance",
	"settings",
	"backups",
	"monitoring",
	"branches",
	"payroll",
	"marketing",
	"warehouse",
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
	// read/write = employee self-service (own record only; row-scoped in code).
	// approve = HR/manager verification, manual correction, device approval,
	// geofence & settings config. delete reserved for admin.
	"attendance",
] as const;

export type Domain = (typeof DOMAINS)[number];
export type Action = "read" | "write" | "delete" | "approve";

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

	// ── Staff ─────────────────────────────────────────────────────────────────
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

	// ── Warehouse ─────────────────────────────────────────────────────────────
	{ domain: "warehouse", action: "read", minRole: "picker" },
	{ domain: "warehouse", action: "write", minRole: "putter" },
	{ domain: "warehouse", action: "delete", minRole: "manager" },
	{ domain: "warehouse", action: "approve", minRole: "manager" },

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
	{ path: "/admin", minRole: "admin" },
	{ path: "/manager", minRole: "manager" },
	{ path: "/auditor", minRole: "auditor" },
	{ path: "/hr", minRole: "hr" },
	{ path: "/marketing", minRole: "marketing" },
	{ path: "/putter", minRole: "putter" },
	{ path: "/picker", minRole: "picker" },
	{ path: "/driver", minRole: "driver" },
	{ path: "/biller", minRole: "biller" },
	{ path: "/sales", minRole: "sales_person" },
	{ path: "/customer", minRole: "customer" },
	{ path: "/warehouse", minRole: "warehouse" },
	{ path: "/dashboard/warehouse", minRole: "warehouse" },
	{ path: "/procurement", minRole: "procurement" },
	{ path: "/dashboard/procurement", minRole: "procurement" },
];
