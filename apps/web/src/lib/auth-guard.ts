import {
	roles as rolesTable,
	staff as staffTable,
	userRoles as userRolesTable,
	user as userTable,
} from "@evaluna/db/schema";
import { getPermissionsForRole } from "@evaluna/db";
import { and, desc, eq, get, isNotNull } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { getCanonicalDashboardRoute, type RoleName } from "./rbac-config";
import {
	type CachedSession,
	getCachedSession,
	setCachedSession,
} from "./session-cache";

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Defines the structure of the enriched user session cache object.
 * This mirrors the structure of TRPCContext.user.
 */
export type CachedSession = {
	userId: string;
	email: string;
	name: string;
	status: "PENDING" | "ACTIVE" | "INACTIVE" | "LOCKED" | "SUSPENDED";
	forcePasswordChange: boolean;
	isSuperadmin: boolean;
	branchId: number | null;
	warehouseId: number | null;
	staff: {
		id: number;
		name: string;
		staffCode: string;
		branchId: number | null;
	} | null;
	primaryRole: {
		name: string;
		dashboardRoute: string;
		permissions: string[];
	} | null;
	roles: {
		name: string;
		dashboardRoute: string;
		permissions: string[];
	}[];
	permissions: string[];
	canonicalDashboardRoute: string;
	expiresAt: Date;
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses the Better Auth session token from headers.
 * Better Auth uses "evaluna.session_token" due to our cookiePrefix.
 */
async function getSessionToken(): Promise<string | null> {
	const cookieStore = await cookies();
	const token =
		cookieStore.get("evaluna.session_token")?.value ||
		cookieStore.get("__Secure-evaluna.session_token")?.value ||
		cookieStore.get("better-auth.session_token")?.value ||
		cookieStore.get("__Secure-better-auth.session_token")?.value;

	return token || null;
}

/**
 * Gets the fully enriched auth user including roles, permissions, and staff data.
 * Uses LRU cache to avoid hammering the database.
 */
export async function getAuthUser(): Promise<CachedSession | null> {
	const token = await getSessionToken();
	if (!token) return null;

	// 1. Check in-memory cache
	const cached = getCachedSession(token);
	if (cached) {
		if (new Date() > cached.expiresAt) return null;

		// Check basic status on cached object before returning (faster)
		if (
			cached.status === "INACTIVE" ||
			cached.status === "LOCKED" ||
			cached.status === "SUSPENDED"
		) {
			return null;
		}

		return cached;
	}

	// 2. Fetch from Better Auth
	const reqHeaders = await headers();
	const authSession = await auth.api.getSession({
		headers: reqHeaders,
	});

	if (!authSession?.user || !authSession?.session) {
		console.error("[auth-guard] auth.api.getSession returned null!", {
			authSession,
		});
		return null;
	}

	// 3. Resolve user details, linked staff record, and roles in a single query
	const dbUser = await db.query.user.findFirst({
		where: eq(userTable.id, authSession.user.id),
		with: {
			staff: {
				columns: {
					id: true,
					name: true,
					staff_code: true,
					branch_id: true,
				},
			},
			userRoles: {
				columns: {}, // Only need the relation
				with: {
					role: {
						columns: {
							name: true,
							permissions: true,
						},
					},
				},
			},
		},
	});

	if (!dbUser) {
		console.error("[auth-guard] dbUser not found or query failed.");
		return null;
	}

	// 4. Enforce security checks on the live user record (Requirement 7)
	const now = new Date();
	if (
		dbUser.status === "INACTIVE" ||
		dbUser.status === "SUSPENDED" ||
		(dbUser.locked_until && new Date(dbUser.locked_until) > now)
	) {
		console.error(
			`[auth-guard] Login denied due to status: ${dbUser.status} / locked: ${dbUser.locked_until}`,
		);
		return null;
	}

	// 5. Resolve Roles, Permissions, and Dashboard Route (Requirements 4, 5, 8)
	const rolesList =
		dbUser.userRoles.map((ur) => ({
			name: ur.role.name as RoleName,
			permissions: getPermissionsForRole(ur.role.name as any) as string[],
			dashboardRoute: getCanonicalDashboardRoute(ur.role.name),
		})) ?? [];

	// Use a Set to aggregate unique permissions
	const aggregatedPermissions = new Set<string>();
	rolesList.forEach((role) => {
		role.permissions.forEach((p) => aggregatedPermissions.add(p));
	});

	// Super Admin bypass
	if (dbUser.is_superadmin) {
		rolesList.unshift({
			name: "Super Admin",
			permissions: [], // Permissions are implicitly all, but we don't need to load all of them
			dashboardRoute: getCanonicalDashboardRoute("Super Admin"),
		});
	}

	const primaryRole = rolesList[0] || null;
	const canonicalDashboardRoute = primaryRole?.dashboardRoute ?? "/dashboard";

	// 6. Build enriched session (CachedSession)
	const enriched: CachedSession = {
		userId: dbUser.id,
		email: dbUser.email,
		name: dbUser.name,
		status: dbUser.status as CachedSession["status"],
		forcePasswordChange: dbUser.force_password_change ?? false,
		isSuperadmin: dbUser.is_superadmin ?? false,
		branchId: dbUser.branch_id ?? null,
		warehouseId: dbUser.warehouse_id ?? null,
		staff: dbUser.staff
			? {
					id: dbUser.staff.id,
					name: dbUser.staff.name,
					staffCode: dbUser.staff.staff_code,
					branchId: dbUser.staff.branch_id ?? null,
				}
			: null,
		primaryRole: primaryRole,
		roles: rolesList,
		permissions: Array.from(aggregatedPermissions),
		canonicalDashboardRoute: canonicalDashboardRoute,
		expiresAt: authSession.session.expiresAt,
	};

	// 7. Cache and return
	setCachedSession(token, enriched);
	return enriched;
}
