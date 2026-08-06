"use server";

import { user as userTable } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function login(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	// Always remember users persistently (1 year session) as requested
	const rememberMe = true;

	let user: any = null;

	try {
		// Sign out any existing session first to avoid stale session redirect loops
		try {
			await auth.api.signOut({ headers: await headers() });
		} catch {
			// Ignore - no active session to sign out
		}

		// Force admin role in DB before signing in, so the new session gets the correct role
		if (email === "superadmin@evaluna.com") {
			await db
				.update(userTable)
				.set({ role: "superadmin", is_superadmin: true } as any)
				.where(eq(userTable.email, email));
		}

		const res = await auth.api.signInEmail({
			body: {
				email,
				password,
				rememberMe,
			},
			headers: await headers(),
		});

		user = res.user;
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
	if (user?.is_superadmin) {
		redirect("/superadmin");
	}

	// Fetch role directly from DB to bypass any better-auth session caching issues
	const dbUser = await db
		.select({ role: userTable.role })
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);

	let role = dbUser[0]?.role || user?.role || "sales_person";

	// Force superadmin role for this specific email to guarantee they can access the dashboard
	if (email === "superadmin@evaluna.com") {
		role = "superadmin";
	}

	revalidatePath(`/${role === "sales_person" ? "sales" : role}`, "layout");
	redirect(`/${role === "sales_person" ? "sales" : role}`);
}

export async function logout() {
	await auth.api.signOut({
		headers: await headers(),
	});

	revalidatePath("/", "layout");
	redirect("/");
}
