/**
 * Database client – auto-selects Neon/Postgres or PGlite.
 *
 * Uses createRequire so that dynamic selection works in Next.js ESM/Turbopack.
 * `db` is exported synchronously so better-auth can use it at import time.
 */
import { createRequire } from "node:module";
import * as schema from "./schema";

const _require = createRequire(import.meta.url);

function createDb() {
  const fs = _require("fs");
  const path = _require("path");
  
  let DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    const envPaths = [
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), "../../.env"),
      path.join(process.cwd(), ".env")
    ];
    for (const file of envPaths) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, "utf8");
        const match = content.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
        if (match) {
          DATABASE_URL = match[1];
          break;
        }
      }
    }
  }

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not set! Checked .env and .env.local");
  }
  
  if (DATABASE_URL.startsWith('"') && DATABASE_URL.endsWith('"')) {
      console.warn("DATABASE_URL has quotes, stripping them");
  }
  
  const cleanUrl = DATABASE_URL.replace(/^"|"$/g, '');

  const { drizzle } = _require("drizzle-orm/node-postgres");
  const { Pool } = _require("pg");
  const pool = new Pool({ connectionString: cleanUrl });
  return drizzle(pool, { schema });
}

export const db = createDb();

// re-export pglite instance for any code that needs direct access
export const pglite = null;
