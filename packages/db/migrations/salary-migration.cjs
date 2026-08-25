/**
 * Salary Management — additive schema migration for enhanced payroll system.
 *
 * Idempotent and additive-only: uses CREATE TABLE IF NOT EXISTS, CREATE INDEX
 * IF NOT EXISTS, and guarded ADD CONSTRAINT (ignored if already present). It
 * never drops or alters existing columns, so it is safe to run against a shared
 * database. Mirrors packages/db/src/schema/salary.ts.
 *
 * Run: node packages/db/migrations/salary-migration.cjs
 */
const path = require("node:path");
const dotenv = require("dotenv");
const pg = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const TABLES = [
	`CREATE TABLE IF NOT EXISTS "salary_structure" (
    "id" serial PRIMARY KEY NOT NULL,
    "employee_id" integer,
    "effective_from" date NOT NULL,
    "effective_to" date,
    "component_type" varchar(20) NOT NULL,
    "category" varchar(30) NOT NULL,
    "component_name" varchar(100) NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "salary_change_request" (
    "id" serial PRIMARY KEY NOT NULL,
    "employee_id" integer NOT NULL,
    "requested_by" integer NOT NULL,
    "effective_from" date NOT NULL,
    "changes" jsonb NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "approved_by" integer,
    "approved_at" timestamp,
    "comments" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "statutory_deduction_config" (
    "id" serial PRIMARY KEY NOT NULL,
    "branch_id" integer NOT NULL,
    "effective_from" date NOT NULL,
    "effective_to" date,
    "pf_rate" numeric(5,4) DEFAULT '0.12' NOT NULL,
    "esi_rate" numeric(5,4) DEFAULT '0.0075' NOT NULL,
    "professional_tax_slabs" jsonb NOT NULL,
    "tds_config" jsonb,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "payroll_enhanced" (
    "id" serial PRIMARY KEY NOT NULL,
    "payroll_id" integer NOT NULL UNIQUE,
    "earnings" jsonb NOT NULL,
    "deductions_detail" jsonb NOT NULL,
    "reimbursements" jsonb NOT NULL,
    "loans_and_advances" jsonb NOT NULL,
    "net_payable" numeric(10,2) NOT NULL,
    "calculation_notes" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "payroll_lock" (
    "id" serial PRIMARY KEY NOT NULL,
    "payroll_id" integer NOT NULL UNIQUE,
    "locked_by" integer NOT NULL,
    "locked_at" timestamp DEFAULT now(),
    "expires_at" timestamp NOT NULL,
    "lock_reason" varchar(50) NOT NULL
  );`,
	`CREATE TABLE IF NOT EXISTS "payment_batch" (
    "id" serial PRIMARY KEY NOT NULL,
    "batch_number" varchar(50) NOT NULL UNIQUE,
    "branch_id" integer NOT NULL,
    "payment_date" date NOT NULL,
    "status" varchar(20) DEFAULT 'created' NOT NULL,
    "total_amount" numeric(15,2) NOT NULL,
    "total_count" integer NOT NULL,
    "created_by" integer NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "payment_batch_item" (
    "id" serial PRIMARY KEY NOT NULL,
    "batch_id" integer NOT NULL,
    "payroll_id" integer NOT NULL,
    "employee_id" integer NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "payment_method_id" integer,
    "processed_at" timestamp,
    "failure_reason" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "payslip_template" (
    "id" serial PRIMARY KEY NOT NULL,
    "branch_id" integer NOT NULL,
    "name" varchar(100) NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "template_config" jsonb,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "generated_payslip" (
    "id" serial PRIMARY KEY NOT NULL,
    "payroll_id" integer NOT NULL UNIQUE,
    "employee_id" integer NOT NULL,
    "template_id" integer,
    "content_url" varchar(500),
    "is_published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp,
    "generated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "payroll_variance" (
    "id" serial PRIMARY KEY NOT NULL,
    "payroll_id" integer NOT NULL,
    "variance_type" varchar(50) NOT NULL,
    "severity" varchar(20) DEFAULT 'medium' NOT NULL,
    "description" text NOT NULL,
    "expected_value" numeric(15,2),
    "actual_value" numeric(15,2),
    "variance_amount" numeric(15,2),
    "variance_percentage" numeric(5,2),
    "is_resolved" boolean DEFAULT false NOT NULL,
    "resolved_by" integer,
    "resolved_at" timestamp,
    "resolution_notes" text,
    "detected_at" timestamp DEFAULT now(),
    "created_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "payroll_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "payroll_id" integer,
    "action" varchar(50) NOT NULL,
    "entity_type" varchar(30) NOT NULL,
    "entity_id" integer,
    "old_values" jsonb,
    "new_values" jsonb,
    "changed_by" integer NOT NULL,
    "changed_at" timestamp DEFAULT now(),
    "ip_address" varchar(45),
    "user_agent" text
  );`,
	`CREATE TABLE IF NOT EXISTS "notification_template" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(100) NOT NULL UNIQUE,
    "module" varchar(50) DEFAULT 'payroll' NOT NULL,
    "event_type" varchar(50) NOT NULL,
    "subject" varchar(200),
    "body" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "payroll_notification" (
    "id" serial PRIMARY KEY NOT NULL,
    "payroll_id" integer,
    "employee_id" integer,
    "template_id" integer,
    "channel" varchar(20) NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "sent_at" timestamp,
    "read_at" timestamp,
    "external_id" varchar(100),
    "error_message" text,
    "created_at" timestamp DEFAULT now()
  );`,
];

const INDEXES = [
	`CREATE INDEX IF NOT EXISTS "idx_salary_structure_employee" ON "salary_structure" ("employee_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_salary_structure_active" ON "salary_structure" ("is_active");`,
	`CREATE INDEX IF NOT EXISTS "idx_salary_change_request_employee" ON "salary_change_request" ("employee_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_salary_change_request_status" ON "salary_change_request" ("status");`,
	`CREATE INDEX IF NOT EXISTS "idx_statutory_deduction_branch" ON "statutory_deduction_config" ("branch_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_enhanced_payroll" ON "payroll_enhanced" ("payroll_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_lock_payroll" ON "payroll_lock" ("payroll_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_lock_expires" ON "payroll_lock" ("expires_at");`,
	`CREATE INDEX IF NOT EXISTS "idx_payment_batch_branch" ON "payment_batch" ("branch_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payment_batch_status" ON "payment_batch" ("status");`,
	`CREATE INDEX IF NOT EXISTS "idx_payment_batch_item_batch" ON "payment_batch_item" ("batch_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payment_batch_item_payroll" ON "payment_batch_item" ("payroll_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payment_batch_item_employee" ON "payment_batch_item" ("employee_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payslip_template_branch" ON "payslip_template" ("branch_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_generated_payslip_payroll" ON "generated_payslip" ("payroll_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_generated_payslip_employee" ON "generated_payslip" ("employee_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_variance_payroll" ON "payroll_variance" ("payroll_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_variance_severity" ON "payroll_variance" ("severity");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_audit_payroll" ON "payroll_audit" ("payroll_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_audit_changed_by" ON "payroll_audit" ("changed_by");`,
	`CREATE INDEX IF NOT EXISTS "idx_notification_template_module" ON "notification_template" ("module");`,
	`CREATE INDEX IF NOT EXISTS "idx_notification_template_event" ON "notification_template" ("event_type");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_notification_payroll" ON "payroll_notification" ("payroll_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_notification_employee" ON "payroll_notification" ("employee_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payroll_notification_status" ON "payroll_notification" ("status");`,
];

// Foreign keys applied best-effort; ignored if they already exist.
const CONSTRAINTS = [
	`ALTER TABLE "salary_structure" ADD CONSTRAINT "salary_structure_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");`,
	`ALTER TABLE "salary_change_request" ADD CONSTRAINT "salary_change_request_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");`,
	`ALTER TABLE "salary_change_request" ADD CONSTRAINT "salary_change_request_requested_by_fk" FOREIGN KEY ("requested_by") REFERENCES "employees"("id");`,
	`ALTER TABLE "salary_change_request" ADD CONSTRAINT "salary_change_request_approved_by_fk" FOREIGN KEY ("approved_by") REFERENCES "employees"("id");`,
	`ALTER TABLE "statutory_deduction_config" ADD CONSTRAINT "statutory_deduction_config_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id");`,
	`ALTER TABLE "payroll_enhanced" ADD CONSTRAINT "payroll_enhanced_payroll_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "payroll"("id");`,
	`ALTER TABLE "payroll_lock" ADD CONSTRAINT "payroll_lock_payroll_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "payroll"("id");`,
	`ALTER TABLE "payroll_lock" ADD CONSTRAINT "payroll_lock_locked_by_fk" FOREIGN KEY ("locked_by") REFERENCES "employees"("id");`,
	`ALTER TABLE "payment_batch" ADD CONSTRAINT "payment_batch_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id");`,
	`ALTER TABLE "payment_batch" ADD CONSTRAINT "payment_batch_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "employees"("id");`,
	`ALTER TABLE "payment_batch_item" ADD CONSTRAINT "payment_batch_item_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "payment_batch"("id");`,
	`ALTER TABLE "payment_batch_item" ADD CONSTRAINT "payment_batch_item_payroll_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "payroll"("id");`,
	`ALTER TABLE "payment_batch_item" ADD CONSTRAINT "payment_batch_item_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");`,
	`ALTER TABLE "payment_batch_item" ADD CONSTRAINT "payment_batch_item_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id");`,
	`ALTER TABLE "payslip_template" ADD CONSTRAINT "payslip_template_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id");`,
	`ALTER TABLE "generated_payslip" ADD CONSTRAINT "generated_payslip_payroll_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "payroll"("id");`,
	`ALTER TABLE "generated_payslip" ADD CONSTRAINT "generated_payslip_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");`,
	`ALTER TABLE "generated_payslip" ADD CONSTRAINT "generated_payslip_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "payslip_template"("id");`,
	`ALTER TABLE "payroll_variance" ADD CONSTRAINT "payroll_variance_payroll_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "payroll"("id");`,
	`ALTER TABLE "payroll_variance" ADD CONSTRAINT "payroll_variance_resolved_by_fk" FOREIGN KEY ("resolved_by") REFERENCES "employees"("id");`,
	`ALTER TABLE "payroll_audit" ADD CONSTRAINT "payroll_audit_payroll_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "payroll"("id");`,
	`ALTER TABLE "payroll_audit" ADD CONSTRAINT "payroll_audit_changed_by_fk" FOREIGN KEY ("changed_by") REFERENCES "employees"("id");`,
	`ALTER TABLE "payroll_notification" ADD CONSTRAINT "payroll_notification_payroll_id_fk" FOREIGN KEY ("payroll_id") REFERENCES "payroll"("id");`,
	`ALTER TABLE "payroll_notification" ADD CONSTRAINT "payroll_notification_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");`,
	`ALTER TABLE "payroll_notification" ADD CONSTRAINT "payroll_notification_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "notification_template"("id");`,
];

async function migrate() {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}
	const client = await pool.connect();
	try {
		for (const stmt of TABLES) await client.query(stmt);
		for (const stmt of INDEXES) await client.query(stmt);
		for (const stmt of CONSTRAINTS) {
			try {
				await client.query(stmt);
			} catch (e) {
				if (!String(e.message || "").includes("already exists")) {
					console.warn("constraint skipped:", e.message);
				}
			}
		}
		console.log("Salary migration successful: 13 tables ensured.");
	} finally {
		client.release();
	}
}

migrate()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error("Salary migration failed:", e);
		process.exit(1);
	});