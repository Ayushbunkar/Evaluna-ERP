import { defineConfig } from "drizzle-kit";

// Use DATABASE_URL from environment (Codespaces secret / .env.local)
// Falls back to local PGlite only if DATABASE_URL is unset
const DATABASE_URL = process.env.DATABASE_URL;

export default DATABASE_URL
  ? defineConfig({
      dialect: "postgresql",
      schema: ["./src/lib/db/schema.ts", "./src/lib/db/auth-schema.ts"],
      dbCredentials: {
        url: DATABASE_URL,
      },
    })
  : defineConfig({
      dialect: "postgresql",
      driver: "pglite",
      schema: ["./src/lib/db/schema.ts", "./src/lib/db/auth-schema.ts"],
      dbCredentials: {
        url: "./data/pglite",
      },
    });
