import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: "../../.env" });

export default defineConfig({
	dialect: "postgresql",
	schema: [
		"./src/schema.ts",
		"./src/auth-schema.ts",
		"./src/schema/delivery.ts",
		"./src/schema/finance.ts",
		"./src/schema/hrms.ts",
		"./src/schema/rbac.ts",
		"./src/schema/attendance-enhanced.ts",
	],
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
