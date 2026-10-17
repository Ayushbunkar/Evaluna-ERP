"use server";

import { UserManagement } from "@evaluna/db";
import { customers, user as userTable } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface SignupResponse {
	success: boolean;
	waitingForVerification?: boolean;
	email?: string;
	error?: string;
	isAlreadyRegistered?: boolean;
}

export async function signupAction(formData: FormData): Promise<SignupResponse> {
	const name = ((formData.get("name") as string) || "").trim();
	const rawEmail = formData.get("email") as string;
	const password = formData.get("password") as string;
	const email = (rawEmail || "").toLowerCase().trim();

	// Server-side validation
	if (!name || name.length < 2) {
		return { success: false, error: "Please provide a valid name (at least 2 characters)." };
	}
	if (!email || !email.includes("@")) {
		return { success: false, error: "Please provide a valid email address." };
	}
	if (!password || password.length < 8) {
		return { success: false, error: "Password must be at least 8 characters." };
	}

	let reqHeaders: Headers;
	try {
		reqHeaders = await headers();
	} catch {
		reqHeaders = new Headers();
	}

	try {
		// 1. Check if user already exists
		const [existingUser] = await db
			.select({
				id: userTable.id,
				email: userTable.email,
				emailVerified: userTable.emailVerified,
				status: userTable.status,
			})
			.from(userTable)
			.where(eq(userTable.email, email))
			.limit(1);

		if (existingUser) {
			// If already verified, direct to login
			if (existingUser.emailVerified || existingUser.status === "ACTIVE") {
				return {
					success: false,
					isAlreadyRegistered: true,
					error: "An account with this email already exists and is verified. Please log in instead.",
				};
			}

			// If registered but pending email verification, re-dispatch verification email
			try {
				await auth.api.sendVerificationEmail({
					body: {
						email,
						callbackURL: "/customer",
					},
					headers: reqHeaders,
				});
			} catch (sendErr) {
				console.warn("[signupAction] Resend verification link note:", sendErr);
			}

			return {
				success: true,
				waitingForVerification: true,
				email,
			};
		}

		// 2. Sign out any existing session before signup
		try {
			await auth.api.signOut({ headers: reqHeaders });
		} catch {}

		// 3. Register user with Better Auth
		const res = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name,
				callbackURL: "/customer",
			},
			headers: reqHeaders,
		});

		const user = res.user;

		if (user) {
			// Assign role "customer"
			try {
				await UserManagement.assignRoleToUser(user.id, "customer");
			} catch (roleErr) {
				console.warn("[signupAction] Assign customer role note:", roleErr);
			}

			// Enforce pending status until email verification is complete
			await db
				.update(userTable)
				.set({
					is_superadmin: false,
					status: "PENDING",
					emailVerified: false,
				} as any)
				.where(eq(userTable.id, user.id));

			// Check / Create Customer Record
			const [existingCustomer] = await db
				.select()
				.from(customers)
				.where(eq(customers.email, email))
				.limit(1);

			if (!existingCustomer) {
				const customerCode = `CUST-${Date.now()}`;
				await db.insert(customers).values({
					name: name || email.split("@")[0],
					email,
					user_uid: user.id,
					customer_code: customerCode,
					status: "active",
					is_deleted: false,
					branch_id: 1, // Default branch
				});
			} else {
				await db
					.update(customers)
					.set({ user_uid: user.id })
					.where(eq(customers.email, email));
			}

			// Clear unverified session
			try {
				await auth.api.signOut({ headers: reqHeaders });
			} catch {}

			return {
				success: true,
				waitingForVerification: true,
				email,
			};
		}

		return {
			success: false,
			error: "Could not create user account. Please try again.",
		};
	} catch (error: any) {
		console.error("Signup Server Action Error:", error);
		const errStr = String(
			error?.body?.message || error?.message || "",
		).toLowerCase();

		if (
			errStr.includes("already exists") ||
			errStr.includes("duplicate") ||
			errStr.includes("in use")
		) {
			return {
				success: false,
				isAlreadyRegistered: true,
				error: "An account with this email already exists. Please log in instead.",
			};
		}

		return {
			success: false,
			error:
				error?.body?.message ||
				error?.message ||
				"Registration failed. Please verify your details and try again.",
		};
	}
}

export async function resendVerificationEmailAction(email: string) {
	const normalizedEmail = (email || "").toLowerCase().trim();
	if (!normalizedEmail || !normalizedEmail.includes("@")) {
		return {
			success: false,
			error: "Please provide a valid email address.",
		};
	}

	try {
		let reqHeaders: Headers;
		try {
			reqHeaders = await headers();
		} catch {
			reqHeaders = new Headers();
		}

		await auth.api.sendVerificationEmail({
			body: {
				email: normalizedEmail,
				callbackURL: "/customer",
			},
			headers: reqHeaders,
		});

		return { success: true };
	} catch (err: any) {
		console.error("[resendVerificationEmailAction] Error:", err);
		return {
			success: false,
			error: err?.message || "Failed to resend verification email. Please try again.",
		};
	}
}

export const signup = signupAction;

