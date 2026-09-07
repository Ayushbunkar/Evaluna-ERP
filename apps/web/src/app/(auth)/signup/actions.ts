"use server";

import { user as userTable, customers } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { UserManagement } from "@evaluna/db";

export async function signup(formData: FormData) {
	const name = formData.get("name") as string;
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

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
					name: name,
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
		}
	} catch (error: any) {
		console.error("Signup Server Action Error:", error);
		redirect("/signup?error=signup-failed");
	}

	// Always redirect to the Customer Portal after self-registration
	const role = "customer";
	revalidatePath(`/${role}`, "layout");
	redirect(`/${role}`);
}
