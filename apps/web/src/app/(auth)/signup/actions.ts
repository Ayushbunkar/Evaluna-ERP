"use server";

import { UserManagement } from "@evaluna/db";
import { customers, user as userTable } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function signup(formData: FormData) {
	const name = ((formData.get("name") as string) || "").trim();
	const rawEmail = formData.get("email") as string;
	const password = formData.get("password") as string;
	const email = (rawEmail || "").toLowerCase().trim();

	// Server-side validation
	if (!email || !email.includes("@")) {
		redirect("/signup?error=invalid-email");
	}
	if (!password || password.length < 8) {
		redirect("/signup?error=weak-password");
	}

	let user: any = null;

	try {
		// Sign out any existing session first
		try {
			await auth.api.signOut({ headers: await headers() });
		} catch {
			// Ignore - no active session to sign out
		}

		const res = await auth.api.signUpEmail({
			body: { email, password, name },
			headers: await headers(),
		});
		user = res.user;

		if (user) {
			// Always enforce only "customer" role for self-service guest registration
			await UserManagement.assignRoleToUser(user.id, "customer");
			await db
				.update(userTable)
				.set({
					is_superadmin: false,
					status: "PENDING", // Pending email verification
					emailVerified: false,
				} as any)
				.where(eq(userTable.id, user.id));

			// Check if a customer row already exists for this email
			const existingCustomer = await db
				.select()
				.from(customers)
				.where(eq(customers.email, email))
				.limit(1);

			if (existingCustomer.length === 0) {
				const customerCode = `CUST-${Date.now()}`;
				// Create the linked customer account record
				await db.insert(customers).values({
					name: name || email.split("@")[0],
					email: email,
					user_uid: user.id,
					customer_code: customerCode,
					status: "active",
					is_deleted: false,
					branch_id: 1, // Default branch
				});
			} else {
				// Link the existing customer record to the newly authenticated user profile
				await db
					.update(customers)
					.set({
						user_uid: user.id,
					})
					.where(eq(customers.email, email));
			}

			// Clear any active session created before verification is completed
			try {
				await auth.api.signOut({ headers: await headers() });
			} catch {}
		}
	} catch (error: any) {
		console.error("Signup Server Action Error:", error);
		const errStr = String(
			error?.body?.message || error?.message || "",
		).toLowerCase();
		if (errStr.includes("already exists") || errStr.includes("duplicate")) {
			redirect("/signup?error=email-exists");
		}
		redirect("/signup?error=signup-failed");
	}

	// Redirect newly registered user to verify email instruction screen
	redirect(`/verify-email?email=${encodeURIComponent(email)}&sent=true`);
}
