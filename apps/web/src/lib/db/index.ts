import * as schema from "./schema";

// Use Neon/Postgres if DATABASE_URL is set, otherwise fall back to local PGlite
const DATABASE_URL = process.env.DATABASE_URL;

let db: any;

if (DATABASE_URL) {
  // Cloud / production: connect to Neon (or any Postgres)
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: DATABASE_URL });
  db = drizzle(pool, { schema });
} else {
  // Local dev fallback: PGlite (embedded SQLite-like Postgres)
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");

  const globalForPGlite = globalThis as unknown as {
    pglite: InstanceType<typeof PGlite> | undefined;
  };
  globalForPGlite.pglite ??= new PGlite("./data/pglite");
  db = drizzle({ client: globalForPGlite.pglite, schema });
}

export { db };
