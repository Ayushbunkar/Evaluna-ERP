import { createAuth } from "@evaluna/auth";
import { db } from "./db";
import { serverUrls } from "@evaluna/env/server";

// We use the configured createAuth from our internal @evaluna/auth package
export const auth = createAuth({
  db: db as any,
  baseURL: serverUrls.betterAuthUrl,
  // Base timeouts; these can be dynamically adjusted or overriden if needed
  sessionExpiresIn: 60 * 60 * 24, // 24 hours
  rememberMeExpiresIn: 60 * 60 * 24 * 30, // 30 days
});
