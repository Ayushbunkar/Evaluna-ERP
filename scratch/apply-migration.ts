import { sql } from "drizzle-orm";
import { db } from "../packages/db/src/index";

async function main() {
	console.log("\n--- ALTERING DATABASE SCHEMA VIA RAW SQL ---");

	console.log("Altering 'user' table...");
	await db.execute(sql`
		ALTER TABLE "user" 
		ADD COLUMN IF NOT EXISTS "staff_id" integer UNIQUE,
		ADD COLUMN IF NOT EXISTS "branch_id" integer,
		ADD COLUMN IF NOT EXISTS "warehouse_id" integer,
		ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'PENDING' NOT NULL,
		ADD COLUMN IF NOT EXISTS "is_superadmin" boolean DEFAULT false NOT NULL,
		ADD COLUMN IF NOT EXISTS "force_password_change" boolean DEFAULT false NOT NULL;
	`);

	console.log("Altering 'roles' table...");
	await db.execute(sql`
		ALTER TABLE "roles"
		ADD COLUMN IF NOT EXISTS "permissions" jsonb DEFAULT '{}'::jsonb NOT NULL;
	`);

	console.log("Altering 'session' table...");
	await db.execute(sql`
		ALTER TABLE "session"
		ADD COLUMN IF NOT EXISTS "branch_id" integer,
		ADD COLUMN IF NOT EXISTS "warehouse_id" integer;
	`);

	console.log("Ensuring 'security_audit_log' table exists...");
	await db.execute(sql`
		CREATE TABLE IF NOT EXISTS "security_audit_log" (
			"id" serial PRIMARY KEY,
			"actor_id" text,
			"target_user_id" text,
			"action" varchar(50) NOT NULL,
			"description" text,
			"previous_value" jsonb,
			"new_value" jsonb,
			"ip_address" varchar(45),
			"user_agent" text,
			"created_at" timestamp DEFAULT now() NOT NULL,
			"reason" text
		);
	`);

	console.log("Ensuring rbac tables exist...");
	await db.execute(sql`
		CREATE TABLE IF NOT EXISTS "roles" (
			"id" serial PRIMARY KEY,
			"name" varchar(50) UNIQUE NOT NULL,
			"description" text,
			"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
			"created_at" timestamp DEFAULT now(),
			"updated_at" timestamp DEFAULT now()
		);
	`);

	console.log("Recreating user_roles table...");
	await db.execute(sql`DROP TABLE IF EXISTS "user_roles" CASCADE;`);
	await db.execute(sql`
		CREATE TABLE "user_roles" (
			"id" serial PRIMARY KEY,
			"user_id" text NOT NULL,
			"role_id" integer REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
			"assigned_at" timestamp DEFAULT now(),
			"created_at" timestamp DEFAULT now()
		);
	`);

	console.log("Recreating role_permissions table...");
	await db.execute(sql`DROP TABLE IF EXISTS "role_permissions" CASCADE;`);
	await db.execute(sql`
		CREATE TABLE "role_permissions" (
			"id" serial PRIMARY KEY,
			"role_name" varchar(50),
			"role_id" integer REFERENCES roles(id) ON DELETE CASCADE,
			"domain" varchar(50),
			"module" varchar(50),
			"action" varchar(20) NOT NULL,
			"is_allowed" boolean DEFAULT false,
			"permission_id" integer,
			"created_at" timestamp DEFAULT now(),
			"updated_at" timestamp DEFAULT now()
		);
	`);

	console.log("Database schema successfully updated!");
}

main()
	.catch(console.error)
	.finally(() => process.exit(0));
