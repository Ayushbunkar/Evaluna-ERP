import { betterAuth } from "better-auth";
import type {} from "zod";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";

type DrizzleDb = Parameters<typeof drizzleAdapter>[0];

export interface AuthOptions {
  db: DrizzleDb;
  baseURL?: string;
  trustedOrigins?: string[];
  sessionExpiresIn?: number;  // seconds, default 86400 (24h)
}

export function createAuth({
  db,
  baseURL,
  trustedOrigins,
  sessionExpiresIn = 60 * 60 * 24 * 365,        // 1 year persistent sessions
}: AuthOptions) {
  return betterAuth({
    baseURL,
    trustedOrigins,
    database: drizzleAdapter(db, { provider: "pg" }),

    // ── Email & Password ────────────────────────────────────────────────────
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Enforce in ERP context via admin activation
      minPasswordLength: 8,
    },

    // ── Session ─────────────────────────────────────────────────────────────
    session: {
      expiresIn: sessionExpiresIn,
      updateAge: 60 * 60, // Refresh session token every 1 hour
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // Cache session for 5 minutes (reduces DB hits)
      },
    },

    // ── Rate Limiting ────────────────────────────────────────────────────────
    rateLimit: {
      window: 60,
      max: 10, // 10 login attempts per minute per IP
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
      // Always use secure cookies — app runs on HTTPS in Codespaces and production.
      // Non-secure cookies on HTTPS cause domain mismatch / cookie not sent bugs.
      useSecureCookies: true,
      generateId: () => crypto.randomUUID(),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
