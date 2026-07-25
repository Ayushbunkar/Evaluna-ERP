import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
export function createAuth({ db, baseURL, trustedOrigins }) {
    return betterAuth({
        baseURL,
        database: drizzleAdapter(db, { provider: "pg" }),
        emailAndPassword: { enabled: true },
        trustedOrigins,
        plugins: [nextCookies()],
    });
}
