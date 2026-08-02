import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set!");
}

if (DATABASE_URL.startsWith('"') && DATABASE_URL.endsWith('"')) {
	console.warn("DATABASE_URL has quotes, stripping them");
}

const cleanUrl = DATABASE_URL.replace(/^"|"$/g, "");

const pool = new Pool({ connectionString: cleanUrl });
export const db = drizzle(pool, { schema });

// re-export pglite instance for any code that needs direct access (null for postgres mode)
export const pglite = null;
