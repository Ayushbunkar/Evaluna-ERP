/**
 * Database client – auto-selects Neon/Postgres or PGlite.
 *
 * Uses createRequire so that dynamic selection works in Next.js ESM/Turbopack.
 * `db` is exported synchronously so better-auth can use it at import time.
 */
import { createRequire } from "node:module";
import * as schema from "./schema";

const _require = createRequire(import.meta.url);

const DATABASE_URL = process.env.DATABASE_URL;

function createDb() {
  if (DATABASE_URL) {
    const { drizzle } = _require("drizzle-orm/node-postgres");
    const { Pool } = _require("pg");
    const pool = new Pool({ connectionString: DATABASE_URL });
    return drizzle(pool, { schema });
  }

  // Local dev fallback — PGlite (embedded Postgres)
  const { PGlite } = _require("@electric-sql/pglite");
  const { drizzle } = _require("drizzle-orm/pglite");
  const g = globalThis as unknown as { _pglite?: InstanceType<typeof PGlite> };
  g._pglite ??= new PGlite("./data/pglite");
  return drizzle({ client: g._pglite, schema });
}

export const db = createDb();

// re-export pglite instance for any code that needs direct access
export const pglite =
  (globalThis as unknown as { _pglite?: unknown })._pglite ?? null;
