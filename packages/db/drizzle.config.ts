import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  driver: "pglite",
  schema: "./src/schema.ts",
  dbCredentials: {
    url: "../../apps/web/data/pglite",
  },
});
