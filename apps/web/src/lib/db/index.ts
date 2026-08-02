import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set!");
}

if (DATABASE_URL.startsWith('"') && DATABASE_URL.endsWith('"')) {
	console.warn("DATABASE_URL has quotes, stripping them");
}

const cleanUrl = DATABASE_URL.replace(/^"|"$/g, "");

const sql = neon(cleanUrl);
export const db = drizzle({ client: sql, schema });

// re-export pglite instance for any code that needs direct access (null for postgres mode)
export const pglite = null;
