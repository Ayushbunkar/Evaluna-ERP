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
  "putter",
  "picker",
  "biller",
  "sales_person",
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Numeric hierarchy — lower number = more powerful.
 * A user can do everything their level and BELOW can do.
 */
export const ROLE_LEVEL: Record<Role, number> = {
  admin:        0,
  manager:      1,
  auditor:      2,
  putter:       3,
  picker:       4,
  biller:       5,
  sales_person: 6,
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
  { domain: "pos", action: "read",    minRole: "sales_person" },
  { domain: "pos", action: "write",   minRole: "sales_person" },
  { domain: "pos", action: "delete",  minRole: "biller" },
  { domain: "pos", action: "approve", minRole: "manager" },

  // ── Inventory ─────────────────────────────────────────────────────────────
  { domain: "inventory", action: "read",    minRole: "auditor" },
  { domain: "inventory", action: "write",   minRole: "putter" },
  { domain: "inventory", action: "delete",  minRole: "manager" },
  { domain: "inventory", action: "approve", minRole: "manager" },

  // ── Purchases ─────────────────────────────────────────────────────────────
  { domain: "purchases", action: "read",    minRole: "auditor" },
  { domain: "purchases", action: "write",   minRole: "putter" },
  { domain: "purchases", action: "delete",  minRole: "manager" },
  { domain: "purchases", action: "approve", minRole: "manager" },

  // ── Suppliers ─────────────────────────────────────────────────────────────
  { domain: "suppliers", action: "read",    minRole: "auditor" },
  { domain: "suppliers", action: "write",   minRole: "manager" },
  { domain: "suppliers", action: "delete",  minRole: "manager" },
  { domain: "suppliers", action: "approve", minRole: "admin" },

  // ── Customers ─────────────────────────────────────────────────────────────
  { domain: "customers", action: "read",    minRole: "sales_person" },
  { domain: "customers", action: "write",   minRole: "biller" },
  { domain: "customers", action: "delete",  minRole: "manager" },
  { domain: "customers", action: "approve", minRole: "manager" },

  // ── Products ──────────────────────────────────────────────────────────────
  { domain: "products", action: "read",    minRole: "sales_person" },
  { domain: "products", action: "write",   minRole: "manager" },
  { domain: "products", action: "delete",  minRole: "manager" },
  { domain: "products", action: "approve", minRole: "admin" },

  // ── Staff ─────────────────────────────────────────────────────────────────
  { domain: "staff", action: "read",    minRole: "manager" },
  { domain: "staff", action: "write",   minRole: "manager" },
  { domain: "staff", action: "delete",  minRole: "admin" },
  { domain: "staff", action: "approve", minRole: "admin" },

  // ── Reports ───────────────────────────────────────────────────────────────
  { domain: "reports", action: "read",    minRole: "auditor" },
  { domain: "reports", action: "write",   minRole: "manager" },
  { domain: "reports", action: "delete",  minRole: "admin" },
  { domain: "reports", action: "approve", minRole: "admin" },

  // ── Accounting ────────────────────────────────────────────────────────────
  { domain: "accounting", action: "read",    minRole: "auditor" },
  { domain: "accounting", action: "write",   minRole: "manager" },
  { domain: "accounting", action: "delete",  minRole: "admin" },
  { domain: "accounting", action: "approve", minRole: "admin" },

  // ── Settings ──────────────────────────────────────────────────────────────
  { domain: "settings", action: "read",    minRole: "manager" },
  { domain: "settings", action: "write",   minRole: "admin" },
  { domain: "settings", action: "delete",  minRole: "admin" },
  { domain: "settings", action: "approve", minRole: "admin" },

  // ── Backups ───────────────────────────────────────────────────────────────
  { domain: "backups", action: "read",    minRole: "admin" },
  { domain: "backups", action: "write",   minRole: "admin" },
  { domain: "backups", action: "delete",  minRole: "admin" },
  { domain: "backups", action: "approve", minRole: "admin" },

  // ── Monitoring ────────────────────────────────────────────────────────────
  { domain: "monitoring", action: "read",    minRole: "auditor" },
  { domain: "monitoring", action: "write",   minRole: "admin" },
  { domain: "monitoring", action: "delete",  minRole: "admin" },
  { domain: "monitoring", action: "approve", minRole: "admin" },

  // ── Branches ──────────────────────────────────────────────────────────────
  { domain: "branches", action: "read",    minRole: "manager" },
  { domain: "branches", action: "write",   minRole: "admin" },
  { domain: "branches", action: "delete",  minRole: "admin" },
  { domain: "branches", action: "approve", minRole: "admin" },

  // ── Payroll ───────────────────────────────────────────────────────────────
  { domain: "payroll", action: "read",    minRole: "manager" },
  { domain: "payroll", action: "write",   minRole: "manager" },
  { domain: "payroll", action: "delete",  minRole: "admin" },
  { domain: "payroll", action: "approve", minRole: "admin" },

  // ── Marketing ─────────────────────────────────────────────────────────────
  { domain: "marketing", action: "read",    minRole: "auditor" },
  { domain: "marketing", action: "write",   minRole: "manager" },
  { domain: "marketing", action: "delete",  minRole: "manager" },
  { domain: "marketing", action: "approve", minRole: "admin" },

  // ── Warehouse ─────────────────────────────────────────────────────────────
  { domain: "warehouse", action: "read",    minRole: "picker" },
  { domain: "warehouse", action: "write",   minRole: "putter" },
  { domain: "warehouse", action: "delete",  minRole: "manager" },
  { domain: "warehouse", action: "approve", minRole: "manager" },

  // ── Notifications ─────────────────────────────────────────────────────────
  { domain: "notifications", action: "read",    minRole: "sales_person" },
  { domain: "notifications", action: "write",   minRole: "manager" },
  { domain: "notifications", action: "delete",  minRole: "admin" },
  { domain: "notifications", action: "approve", minRole: "admin" },

  // ── Imports ───────────────────────────────────────────────────────────────
  { domain: "imports", action: "read",    minRole: "manager" },
  { domain: "imports", action: "write",   minRole: "manager" },
  { domain: "imports", action: "delete",  minRole: "admin" },
  { domain: "imports", action: "approve", minRole: "admin" },

  // ── Loyalty ───────────────────────────────────────────────────────────────
  { domain: "loyalty", action: "read",    minRole: "biller" },
  { domain: "loyalty", action: "write",   minRole: "biller" },
  { domain: "loyalty", action: "delete",  minRole: "manager" },
  { domain: "loyalty", action: "approve", minRole: "manager" },
];

// ── Runtime Helpers ───────────────────────────────────────────────────────────

/**
 * Returns all permissions (domain.action strings) that a role inherits.
 * Uses numeric hierarchy: role with level <= seed.minRole.level gets the permission.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  const level = ROLE_LEVEL[role];
  return PERMISSION_MATRIX
    .filter((seed) => level <= ROLE_LEVEL[seed.minRole])
    .map((seed) => `${seed.domain}.${seed.action}` as Permission);
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
        rows.push({ role_name: role, domain: parsed.domain, action: parsed.action });
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
  { path: "/settings",            minRole: "sales_person" }, // Fine-grained inside
  { path: "/profile",             minRole: "sales_person" },
  { path: "/notifications",       minRole: "sales_person" },
  { path: "/sync",                minRole: "sales_person" },

  // Role Dashboards
  { path: "/admin",               minRole: "admin" },
  { path: "/manager",             minRole: "manager" },
  { path: "/auditor",             minRole: "auditor" },
  { path: "/putter",              minRole: "putter" },
  { path: "/picker",              minRole: "picker" },
  { path: "/biller",              minRole: "biller" },
  { path: "/sales",               minRole: "sales_person" },
];
