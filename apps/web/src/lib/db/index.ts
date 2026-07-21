/**
 * Database client for the web app.
 * Uses Neon/Postgres when DATABASE_URL is set (Codespaces / production),
 * otherwise falls back to local PGlite for purely-local development.
 *
 * IMPORTANT: This file must export `db` synchronously so that better-auth
 * can use it at module-initialisation time.
 */
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

function createDb() {
  if (DATABASE_URL) {
    // Cloud / production path – use standard pg Pool (connects lazily)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/node-postgres");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: DATABASE_URL });
    return drizzle(pool, { schema });
  }

  // Local dev fallback – PGlite (embedded Postgres)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/pglite");

  const g = globalThis as unknown as { _pglite?: InstanceType<typeof PGlite> };
  g._pglite ??= new PGlite("./data/pglite");
  return drizzle({ client: g._pglite, schema });
}

export const db = createDb();
