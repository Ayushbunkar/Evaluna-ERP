"use server";

import { UserManagement } from "@evaluna/db";
import { roles, userRoles, user as userTable } from "@evaluna/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_DASHBOARD_MAP, type Role } from "@/lib/permissions";
import { getCanonicalDashboardRoute } from "@/lib/rbac-config";
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
		"verma.berasia@gmail.com": "customer",
		"patel.lalariya@gmail.com": "customer",
		"sharma.runaha@gmail.com": "customer",
		"choudhary.gunga@gmail.com": "customer",
		"bundela.harrakheda@gmail.com": "customer",
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
					is_superadmin:
						predefinedAccounts[email] === "superadmin" ||
						predefinedAccounts[email] === "super_admin",
				} as any)
				.where(eq(userTable.email, email));

			// Sync with RBAC tables to ensure Next.js middleware and auth-guard resolve the role successfully
			if (user) {
				const assignedRole =
					predefinedAccounts[email] === "superadmin"
						? "super_admin"
						: predefinedAccounts[email];

				// 1. Find or create the role record
				let [roleRecord] = await db
					.select()
					.from(roles)
					.where(eq(roles.name, assignedRole))
					.limit(1);

				if (!roleRecord) {
					const [newRole] = await db
						.insert(roles)
						.values({
							name: assignedRole,
							description: `${assignedRole.toUpperCase()} Role`,
							permissions: {},
						})
						.returning();
					roleRecord = newRole;
				}

				// 2. Assign role to user in user_roles table if not already assigned
				const [existingUserRole] = await db
					.select()
					.from(userRoles)
					.where(
						and(
							eq(userRoles.user_id, user.id),
							eq(userRoles.role_id, roleRecord.id),
						),
					)
					.limit(1);

				if (!existingUserRole) {
					await db.insert(userRoles).values({
						user_id: user.id,
						role_id: roleRecord.id,
					});
				}
			}
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
		}
		if (msg.includes("locked")) {
			return { success: false, error: "locked" };
		}
		return { success: false, error: "invalid-credentials" };
	}

	if (!user) {
		return { success: false, error: "invalid-credentials" };
	}

	// Superadmins are globally scoped and get their own dashboard
	if (
		user?.is_superadmin ||
		predefinedAccounts[email] === "superadmin" ||
		(user as any)?.role === "super_admin" ||
		(user as any)?.role === "superadmin"
	) {
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
