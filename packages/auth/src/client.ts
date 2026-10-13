import { createAuthClient } from "better-auth/client";
import { emailOTPClient, twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	plugins: [twoFactorClient(), emailOTPClient()],
	basePath: (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/api/auth",
	advanced: {
		cookiePrefix: "evaluna",
	},
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
