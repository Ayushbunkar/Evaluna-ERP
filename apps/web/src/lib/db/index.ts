import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set!");
}

if (DATABASE_URL.startsWith('"') && DATABASE_URL.endsWith('"')) {
	console.warn("DATABASE_URL has quotes, stripping them");
}

const cleanUrl = DATABASE_URL.replace(/^"|"$/g, "");

// Use postgres.js for full transaction support (better than neon-http for full ERPs)
const sql = postgres(cleanUrl, { prepare: false });
export const db = drizzle(sql, { schema });

// re-export pglite instance for any code that needs direct access (null for postgres mode)
export const pglite = null;
