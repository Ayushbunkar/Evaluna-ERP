import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCanonicalDashboardRoute } from "@/lib/rbac-config";
import {
	createTrustedDeviceToken,
	TRUST_DURATION_DAYS,
	TRUST_DURATION_SECONDS,
	TRUSTED_DEVICE_COOKIE_NAME,
} from "@/lib/trusted-device";
import { UserManagement } from "@evaluna/db";
import { account as accountTable, customers, user as userTable } from "@evaluna/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			console.warn("[OAuth Success] No active session found, redirecting to login");
			return NextResponse.redirect(new URL("/login", request.url));
		}

		const userId = session.user.id;
		const userEmail = (session.user.email || "").toLowerCase().trim();

		// Security barrier: Verify that this session actually originated from a social/OAuth provider
		const [oauthAccount] = await db
			.select()
			.from(accountTable)
			.where(
				and(
					eq(accountTable.userId, userId),
					ne(accountTable.providerId, "credential"),
				),
			)
			.limit(1);

		if (!oauthAccount) {
			console.warn(
				"[OAuth Success] Blocked non-OAuth session from claiming OAuth 2FA bypass:",
				userId,
			);
			return NextResponse.redirect(new URL("/login?step=2fa&email=" + encodeURIComponent(userEmail), request.url));
		}

		// Fetch current role from security profile
		let profile = await UserManagement.getSecurityProfileByUserId(userId);
		let resolvedRole = profile?.role;

		// If no role is assigned yet, default new Google users to "customer"
		if (!resolvedRole || resolvedRole === "user") {
			try {
				await UserManagement.assignRoleToUser(userId, "customer");
				resolvedRole = "customer";
				profile = await UserManagement.getSecurityProfileByUserId(userId);
			} catch (assignErr) {
				console.error("[OAuth Success] Failed assigning default customer role:", assignErr);
				resolvedRole = "customer";
			}
		}

		// Ensure user status is ACTIVE and emailVerified is true in database
		try {
			await db
				.update(userTable)
				.set({
					status: "ACTIVE",
					emailVerified: true,
					last_login_at: new Date(),
				} as any)
				.where(eq(userTable.id, userId));
		} catch (dbErr) {
			console.error("[OAuth Success] Failed updating user active state:", dbErr);
		}

		// Ensure linked customer account profile exists for instant customer dashboard access
		try {
			const existingCustomer = await db
				.select()
				.from(customers)
				.where(eq(customers.email, userEmail))
				.limit(1);

			if (existingCustomer.length === 0) {
				const customerCode = `CUST-${Date.now()}`;
				await db.insert(customers).values({
					name: session.user.name || userEmail.split("@")[0],
					email: userEmail,
					user_uid: userId,
					customer_code: customerCode,
					status: "active",
					is_deleted: false,
					branch_id: 1, // Default branch
				});
			} else if (!existingCustomer[0]?.user_uid) {
				await db
					.update(customers)
					.set({ user_uid: userId })
					.where(eq(customers.email, userEmail));
			}
		} catch (custErr) {
			console.error("[OAuth Success] Linked customer profile check:", custErr);
		}

		// Calculate canonical dashboard destination based on assigned role
		const targetRole = profile?.role || resolvedRole || "customer";
		const destination = getCanonicalDashboardRoute(targetRole);

		const response = NextResponse.redirect(new URL(destination, request.url));

		// Set 2FA verified flag (Google accounts are pre-authenticated with verified emails)
		const isProd = process.env.NODE_ENV === "production";
		response.cookies.set("evaluna_2fa_verified", "true", {
			httpOnly: true,
			secure: isProd,
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});

		// Trust this device for 3 days
		const trustedToken = createTrustedDeviceToken(userId, TRUST_DURATION_DAYS);
		response.cookies.set(TRUSTED_DEVICE_COOKIE_NAME, trustedToken, {
			httpOnly: true,
			secure: isProd,
			sameSite: "lax",
			path: "/",
			maxAge: TRUST_DURATION_SECONDS,
		});

		return response;
	} catch (error) {
		console.error("[OAuth Success] Error handling OAuth callback:", error);
		return NextResponse.redirect(new URL("/customer", request.url));
	}
}
