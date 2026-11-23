import { createAuthClient } from "better-auth/client";
import { emailOTPClient, twoFactorClient } from "better-auth/client/plugins";

const browserOrigin =
	typeof globalThis !== "undefined" && "window" in globalThis
		? (globalThis as unknown as { window: { location: { origin: string } } })
				.window.location.origin
		: "";

export const authClient = createAuthClient({
	baseURL:
		browserOrigin ||
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.NEXT_PUBLIC_BASE_URL ||
		"",
	plugins: [twoFactorClient(), emailOTPClient()],
	basePath: (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/api/auth",
	advanced: {
		cookiePrefix: "evaluna",
	},
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
