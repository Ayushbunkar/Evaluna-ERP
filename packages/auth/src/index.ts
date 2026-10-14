import { UserManagement } from "@evaluna/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { sendOTPEmailMessage, sendVerificationEmailMessage } from "./email";

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
			"https://www.evaluna-erp.com",
			"https://evalunaerp.vercel.app",
			"https://evaluna-erp-web.vercel.app",
			"https://evaluna.dev",
			process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
			process.env.NEXT_PUBLIC_VERCEL_URL
				? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
				: "",
			process.env.NEXT_PUBLIC_APP_URL || "",
			process.env.BASE_URL || "",
			...(trustedOrigins || []),
		].filter(Boolean),
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
				given_name: { type: "string", required: false },
				family_name: { type: "string", required: false },
				locale: { type: "string", required: false },
				date_of_birth: { type: "string", required: false },
				last_login_at: { type: "date", required: false },
				last_profile_sync_at: { type: "date", required: false },
			},
		},

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			minPasswordLength: 8,
			password: {
				hash: async (password: string) => {
					const { hashPassword } = await import("@evaluna/db");
					return hashPassword(password);
				},
				verify: async ({
					password,
					hash,
				}: {
					password: string;
					hash: string;
				}) => {
					if (!password || !hash) return false;
					if (
						hash.startsWith("$2a$") ||
						hash.startsWith("$2b$") ||
						hash.startsWith("$2y$")
					) {
						const { comparePassword } = await import("@evaluna/db");
						return comparePassword(password, hash);
					}
					const { verifyPassword } = await import("better-auth/crypto");
					return verifyPassword({ password, hash });
				},
			},
			hooks: {
				onSuccess: async ({ userId }: { userId: string }) => {
					// Load the full security profile, which includes role, status, permissions, and dashboard route (Requirement 5)
					const profile =
						await UserManagement.getSecurityProfileByUserId(userId);

					if (!profile) {
						throw new Error("USER_NOT_FOUND");
					}

					const isOrgAccount =
						profile.email?.endsWith("@evaluna.com") ||
						profile.email?.endsWith("@evaluna.dev");

					if (!isOrgAccount) {
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
					}
				},
			},
		},

		// ── Email Verification ──────────────────────────────────────────────────
		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			expiresIn: 60 * 60 * 24, // 24 hours
			sendVerificationEmail: async ({ user, url, token }) => {
				await sendVerificationEmailMessage({
					to: user.email,
					name: user.name,
					url,
					token,
				});
			},
		},

		// ── Social Providers ────────────────────────────────────────────────────
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID || "",
				clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
				scope: ["openid", "profile", "email"],
				mapProfileToUser: async (profile) => {
					// Strict email verification enforcement:
					// Reject any profile where email is missing or not verified by Google
					const isVerified = Boolean(
						profile.email_verified ||
							(profile as { verified_email?: boolean }).verified_email,
					);
					if (!isVerified) {
						throw new Error(
							"UNVERIFIED_EMAIL: Google account email is not verified.",
						);
					}
					const now = new Date();
					const name = profile.name || profile.email.split("@")[0];
					const givenName =
						(profile as any).given_name ||
						(name ? name.split(" ")[0] : undefined);
					const familyName =
						(profile as any).family_name ||
						(name && name.split(" ").length > 1
							? name.split(" ").slice(1).join(" ")
							: undefined);
					const locale = (profile as any).locale;

					return {
						name,
						email: profile.email.toLowerCase().trim(),
						image: profile.picture,
						emailVerified: true,
						given_name: givenName,
						family_name: familyName,
						locale,
						last_login_at: now,
						last_profile_sync_at: now,
					};
				},
			},
		},

		// ── Account Linking ─────────────────────────────────────────────────────
		account: {
			accountLinking: {
				enabled: true,
				trustedProviders: ["google"],
			},
		},

		// ── Database Lifecycle Hooks ───────────────────────────────────────────
		databaseHooks: {
			user: {
				create: {
					after: async (createdUser) => {
						try {
							// Ensure default customer role is always safely provisioned
							await UserManagement.assignRoleToUser(createdUser.id, "customer");
						} catch (error) {
							console.error(
								"[Auth] Failed to assign default customer role:",
								error,
							);
						}
					},
				},
			},
			session: {
				create: {
					after: async (createdSession) => {
						try {
							const { db, user: userTable } = await import("@evaluna/db");
							const { eq } = await import("drizzle-orm");
							await db
								.update(userTable)
								.set({ last_login_at: new Date() })
								.where(eq(userTable.id, createdSession.userId));
						} catch (error) {
							console.error(
								"[Auth] Failed to update user last_login_at on session creation:",
								error,
							);
						}
					},
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
					period: 300, // 5 minutes
					digits: 6,
					sendOTP: async ({ user, otp }) => {
						await sendOTPEmailMessage({
							to: user.email,
							name: user.name,
							otp,
							type: "two-factor",
						});
					},
				},
			}),
			emailOTP({
				otpLength: 6,
				expiresIn: 300, // 5 minutes
				sendVerificationOTP: async ({ email, otp, type }) => {
					await sendOTPEmailMessage({
						to: email,
						otp,
						type,
					});
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
