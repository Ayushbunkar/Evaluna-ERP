import { createAuth } from "@evaluna/auth";
import { db } from "./db";

// Do NOT hardcode baseURL — better-auth will auto-detect it from each request.
// Hardcoding "http://localhost:3001" causes cookie domain mismatch in Codespaces
// (browser is on https://CODESPACE.app.github.dev but cookies get set for localhost).
export const auth = createAuth({
  db: db as any,
  sessionExpiresIn: 60 * 60 * 24 * 365, // 1 year persistent sessions
});
