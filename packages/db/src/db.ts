import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";

const client = new PGlite("../../apps/web/data/pglite");

export const db = drizzle(client, { schema: { ...schema, ...authSchema } });