import { rolePermissions, user as userTable } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import type { Permission, Role } from "./permissions";
import {
	type CachedSession,
	getCachedSession,
	setCachedSession,
} from "./session-cache";

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
 * Gets the fully enriched auth user including role and permissions.
 * Uses LRU cache to avoid hammering the database.
 */
export async function getAuthUser(): Promise<CachedSession | null> {
	const token = await getSessionToken();
	if (!token) return null;

	// 1. Check in-memory cache
	const cached = getCachedSession(token);
	if (cached) {
		if (new Date() > cached.expiresAt) return null;
		if (!cached.isActive) return null;
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

	// 3. Resolve user details directly from our extended user table
	const dbUser = await db.query.user.findFirst({
		where: eq(userTable.id, authSession.user.id),
	});

	if (!dbUser?.is_active) {
		console.error("[auth-guard] dbUser is inactive or null!", { dbUser });
		return null; // Suspended or missing
	}

	const role = (dbUser.role || "sales_person") as Role;

	// 4. Resolve permissions from the DB (or could use static permissions map)
	// For maximum flexibility, we read the static map for now, but in a real
	// system you might query rolePermissions table if it was dynamic.
	// We'll query it to ensure it matches the DB state if admins edited it.
	const permsRows = await db
		.select()
		.from(rolePermissions)
		.where(eq(rolePermissions.role_name, role));
	const permissions = permsRows.map(
		(r) => `${r.domain}.${r.action}` as Permission,
	);

	// 5. Build enriched session
	const enriched: CachedSession = {
		userId: dbUser.id,
		email: dbUser.email,
		name: dbUser.name,
		role: role,
		branchId: dbUser.branch_id ?? null,
		isSuperadmin: dbUser.is_superadmin ?? false,
		isActive: dbUser.is_active ?? true,
		permissions: permissions,
		expiresAt: authSession.session.expiresAt,
	};

	// 6. Cache and return
	setCachedSession(token, enriched);
	return enriched;
}
