import { UserManagement } from "@evaluna/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";

import type {} from "zod";

type DrizzleDb = Parameters<typeof drizzleAdapter>[0];

export interface AuthOptions {
	db: DrizzleDb;
	baseURL?: string;
	trustedOrigins?: string[];
	sessionExpiresIn?: number; // seconds, default 86400 (24h)
}

export function createAuth({
	db,
	baseURL,
	trustedOrigins,
	sessionExpiresIn = 60 * 60 * 24 * 30, // 30 days persistent sessions (reduced from 1 year for ERP security)
}: AuthOptions) {
	return betterAuth({
		secret:
			process.env.BETTER_AUTH_SECRET ||
			"evaluna_super_secret_fallback_key_1234567890",
		baseURL,
		trustedOrigins: [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
			"https://evaluna-erp.com",
			...(trustedOrigins || []),
		],
		database: drizzleAdapter(db, { provider: "pg" }),

		// ── User ────────────────────────────────────────────────────────────────
		user: {
			additionalFields: {
				staff_id: { type: "number", required: false }, // Links to staff/employee record
				branch_id: { type: "number", required: false },
				warehouse_id: { type: "number", required: false },
				status: { type: "string", defaultValue: "PENDING" }, // PENDING, ACTIVE, INACTIVE, LOCKED, SUSPENDED
				is_superadmin: { type: "boolean", defaultValue: false },
				force_password_change: { type: "boolean", defaultValue: false },
			},
		},

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false, // Enforce in ERP context via admin activation
			minPasswordLength: 8,
			password: {
				hash: async (password: string) => {
					const { hashPassword } = await import("@evaluna/db");
					return hashPassword(password);
				},
				verify: async ({ password, hash }: { password: string; hash: string }) => {
					const { comparePassword } = await import("@evaluna/db");
					return comparePassword(password, hash);
				},
			},
			async hash(password: string) {
				const { hashPassword } = await import("@evaluna/db");
				return hashPassword(password);
			},
			async verify({ password, hash }: { password: string; hash: string }) {
				const { comparePassword } = await import("@evaluna/db");
				return comparePassword(password, hash);
			},
			hooks: {
				onSuccess: async ({ userId }: { userId: string }) => {
					// Load the full security profile, which includes role, status, permissions, and dashboard route (Requirement 5)
					const profile =
						await UserManagement.getSecurityProfileByUserId(userId);

					if (!profile) {
						throw new Error("USER_NOT_FOUND");
					}

					// Check if account is Locked
					if (
						profile.lockedUntil &&
						new Date(profile.lockedUntil) > new Date()
					) {
						throw new Error(
							"ACCOUNT_LOCKED: Your account is temporarily locked due to too many failed login attempts.",
						);
					}

					// Check for general forbidden statuses
					if (
						profile.status === "INACTIVE" ||
						profile.status === "LOCKED" ||
						profile.status === "SUSPENDED"
					) {
						throw new Error(
							`ACCOUNT_STATUS_FORBIDDEN: Account status is ${profile.status}.`,
						);
					}
				},
			},
		},

		// ── Session ─────────────────────────────────────────────────────────────
		session: {
			expiresIn: sessionExpiresIn,
			updateAge: 60 * 60, // Refresh session token every 1 hour
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5, // Cache session for 5 minutes (reduces DB hits)
			},
			getters: {
				data: async ({ userId }: { userId: string }) => {
					// Use the repository function to fetch the complete security profile
					const profile =
						await UserManagement.getSecurityProfileByUserId(userId);
					if (!profile) {
						// Fallback for missing user record
						return {
							role: "customer",
							permissions: [],
							canonicalDashboard: "/customer/dashboard",
						};
					}

					// Attach role, permissions, and canonicalDashboard to the session payload
					return {
						role: profile.role,
						permissions: profile.permissions,
						canonicalDashboard: profile.canonicalDashboard,
					};
				},
			},
		},

		// ── Rate Limiting ────────────────────────────────────────────────────────
		rateLimit: {
			window: 60,
			max: 1000, // Increased to prevent 429s from aggressive session polling
			customRules: {
				"/sign-in": {
					window: 60,
					max: 10, // Keep login attempts strict
				},
				"/sign-up": {
					window: 60,
					max: 10,
				},
			},
		},

		// ── Plugins ──────────────────────────────────────────────────────────────
		plugins: [
			twoFactor({
				issuer: "Evaluna ERP",
				otpOptions: {
					period: 30,
					digits: 6,
				},
			}),
			nextCookies(), // ← MUST be last so Set-Cookie headers are forwarded correctly
		],

		// ── Advanced ─────────────────────────────────────────────────────────────
		advanced: {
			cookiePrefix: "evaluna",
			useSecureCookies: process.env.NODE_ENV === "production",
			generateId: () => crypto.randomUUID(),
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
