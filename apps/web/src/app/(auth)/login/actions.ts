"use server";

import { user as userTable } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_DASHBOARD_MAP, type Role } from "@/lib/permissions";

export async function login(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	// Always remember users persistently (1 year session) as requested
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
			redirect("/login?error=suspended");
		} else if (msg.includes("locked")) {
			redirect("/login?error=locked");
		}
		redirect("/login?error=invalid-credentials");
	}

	// Superadmins are globally scoped and get their own dashboard
	if (user?.is_superadmin || predefinedAccounts[email] === "superadmin") {
		redirect("/superadmin");
	}

	// Fetch role directly from DB to bypass any better-auth session caching issues
	const dbUser = await db
		.select({ role: userTable.role })
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);

	let role = dbUser[0]?.role || user?.role || "sales_person";

	// Force predefined role for test accounts
	if (predefinedAccounts[email]) {
		role = predefinedAccounts[email];
	}

	// Normalize roles for backward-compatibility mapping
	let normalizedRole = role;
	if (role === "superadmin") {
		normalizedRole = "super_admin";
	}

	// Map roles to their specific dashboard URL paths (Requirements 4 & 5)
	const destination = ROLE_DASHBOARD_MAP[normalizedRole as Role] ?? `/${normalizedRole}`;
	revalidatePath(destination, "layout");
	redirect(destination);
}

export async function logout() {
	await auth.api.signOut({
		headers: await headers(),
	});

	revalidatePath("/", "layout");
	redirect("/");
}
