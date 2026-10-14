import { createAuth } from "@evaluna/auth";
import { db } from "./db";

function resolveAuthBaseURL(): string | undefined {
	const envUrl = process.env.BETTER_AUTH_URL || process.env.BASE_URL;
	// In local development, respect localhost
	if (envUrl?.includes("localhost") || envUrl?.includes("127.0.0.1")) {
		return envUrl;
	}
	// If set to placeholder evaluna-erp.com or unset, fallback to active Vercel domain
	if (!envUrl || envUrl.includes("evaluna-erp.com")) {
		if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
			return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
		}
		if (process.env.VERCEL_URL) {
			return `https://${process.env.VERCEL_URL}`;
		}
		return "https://evalunaerp.vercel.app";
	}
	return envUrl;
}

export const auth = createAuth({
	db: db as any,
	baseURL: resolveAuthBaseURL(),
	sessionExpiresIn: 60 * 60 * 24 * 365, // 1 year persistent sessions
});
