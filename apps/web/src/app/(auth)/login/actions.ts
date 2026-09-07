"use server";

import { user as userTable } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCanonicalDashboardRoute } from "@/lib/rbac-config";
import { UserManagement } from "@evaluna/db";
import { ROLE_DASHBOARD_MAP, type Role } from "@/lib/permissions";
import { invalidateCachedSession } from "@/lib/session-cache";

export async function login(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const rememberMe = true;

	const predefinedAccounts: Record<string, string> = {
		"superadmin@evaluna.com": "superadmin",
		"manager@evaluna.com": "manager",
		"picker@evaluna.com": "picker",
		"packer@evaluna.com": "packer",
		"checker@evaluna.com": "checker",
		"putter@evaluna.com": "putter",
		"driver@evaluna.com": "driver",
		"admin@evaluna.com": "admin",
		"hr@evaluna.com": "hr",
		"auditor@evaluna.com": "auditor",
		"sales@evaluna.com": "sales_person",
		"billing@evaluna.com": "billing",
	};

	let user:
		| Awaited<ReturnType<typeof auth.api.signInEmail>>["user"]
		| undefined;

	try {
		// Sign out any existing session first to avoid stale session redirect loops
		try {
			await auth.api.signOut({ headers: await headers() });
		} catch {
			// Ignore - no active session to sign out
		}

		// Auto-signup logic for test accounts
		if (predefinedAccounts[email] && password === "Password@123") {
			try {
				// Try to login first
				const res = await auth.api.signInEmail({
					body: { email, password, rememberMe },
					headers: await headers(),
				});
				user = res.user;
			} catch (err: any) {
				// If login fails (user doesn't exist), sign them up
				const res = await auth.api.signUpEmail({
					body: {
						email,
						password,
						name: predefinedAccounts[email].toUpperCase(),
					},
					headers: await headers(),
				});
				user = res.user;
			}

			// Force their role in DB
			await db
				.update(userTable)
				.set({
					role: predefinedAccounts[email],
					is_superadmin: predefinedAccounts[email] === "superadmin",
				} as any)
				.where(eq(userTable.email, email));
		} else {
			// Normal login for regular users
			const res = await auth.api.signInEmail({
				body: { email, password, rememberMe },
				headers: await headers(),
			});
			user = res.user;
		}
	} catch (err: any) {
		console.error("Login Server Action Error:", err);
		const msg = err.body?.message || "invalid-credentials";
		if (msg.includes("suspended")) {
			return { success: false, error: "suspended" };
		} else if (msg.includes("locked")) {
			return { success: false, error: "locked" };
		}
		return { success: false, error: "invalid-credentials" };
	}

	if (!user) {
		return { success: false, error: "invalid-credentials" };
	}

	// Superadmins are globally scoped and get their own dashboard
	if (user?.is_superadmin || predefinedAccounts[email] === "superadmin" || (user as any)?.role === "super_admin" || (user as any)?.role === "superadmin") {
		return { success: true, redirectUrl: "/superadmin" };
	}

	// Fetch role directly from DB security profile to bypass session caching issues
	const profile = await UserManagement.getSecurityProfileByUserId(user.id);
	let role = profile?.role || (user as any)?.role || "customer";

	// Force predefined role for test accounts
	if (predefinedAccounts[email]) {
		role = predefinedAccounts[email];
	}

	const destination = getCanonicalDashboardRoute(role);
	revalidatePath(destination, "layout");
	return { success: true, redirectUrl: destination };
}

export async function logout() {
	try {
		const cookieStore = await cookies();
		const token =
			cookieStore.get("evaluna.session_token")?.value ||
			cookieStore.get("__Secure-evaluna.session_token")?.value ||
			cookieStore.get("better-auth.session_token")?.value ||
			cookieStore.get("__Secure-better-auth.session_token")?.value;

		if (token) {
			invalidateCachedSession(token);
		}
	} catch (err) {
		console.error("Failed to invalidate cached session on logout:", err);
	}

	await auth.api.signOut({
		headers: await headers(),
	});

	revalidatePath("/", "layout");
	redirect("/");
}
