/**
 * Finance & Accounts — additive schema migration.
 *
 * Idempotent and additive-only: uses CREATE TABLE IF NOT EXISTS, CREATE INDEX
 * IF NOT EXISTS, and guarded ADD CONSTRAINT (ignored if already present). It
 * never drops or alters existing columns, so it is safe to run against a shared
 * database. Mirrors packages/db/src/schema/finance.ts.
 *
 * Run: node packages/db/migrations/finance-migration.cjs
 */
const path = require("node:path");
const dotenv = require("dotenv");
const pg = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const TABLES = [
	`CREATE TABLE IF NOT EXISTS "bank_accounts" (
    "id" serial PRIMARY KEY NOT NULL,
    "branch_id" integer,
    "account_name" varchar(255) NOT NULL,
    "account_type" varchar(20) DEFAULT 'bank' NOT NULL,
    "bank_name" varchar(150),
    "account_number" varchar(50),
    "account_number_masked" varchar(50),
    "ifsc" varchar(20),
    "ledger_account_id" integer,
    "opening_balance" numeric(15,2) DEFAULT '0' NOT NULL,
    "current_balance" numeric(15,2) DEFAULT '0' NOT NULL,
    "currency" varchar(10) DEFAULT 'INR' NOT NULL,
    "status" varchar(20) DEFAULT 'active' NOT NULL,
    "notes" text,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "payment_categories" (
    "id" serial PRIMARY KEY NOT NULL,
    "branch_id" integer,
    "name" varchar(100) NOT NULL,
    "parent_id" integer,
    "kind" varchar(20) DEFAULT 'expense' NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_system" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "attachments" (
    "id" serial PRIMARY KEY NOT NULL,
    "branch_id" integer,
    "entity_type" varchar(50) NOT NULL,
    "entity_id" integer,
    "file_name" varchar(255) NOT NULL,
    "stored_name" varchar(255) NOT NULL,
    "mime_type" varchar(100) NOT NULL,
    "file_size" integer DEFAULT 0 NOT NULL,
    "storage_path" varchar(500) NOT NULL,
    "uploaded_by" varchar(255) NOT NULL,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp,
    "created_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "payments" (
    "id" serial PRIMARY KEY NOT NULL,
    "branch_id" integer,
    "payment_number" varchar(50) NOT NULL UNIQUE,
    "payment_type" varchar(20) DEFAULT 'expense' NOT NULL,
    "category_id" integer,
    "custom_category_name" varchar(150),
    "amount" numeric(15,2) NOT NULL,
    "currency" varchar(10) DEFAULT 'INR' NOT NULL,
    "payment_date" timestamp DEFAULT now() NOT NULL,
    "payment_method_id" integer,
    "bank_account_id" integer,
    "paid_by" varchar(255),
    "staff_id" integer,
    "vendor_id" integer,
    "customer_id" integer,
    "department" varchar(100),
    "project" varchar(100),
    "location" varchar(150),
    "description" text,
    "reference_number" varchar(100),
    "receipt_attachment_id" integer,
    "notes" text,
    "tax_amount" numeric(15,2) DEFAULT '0',
    "status" varchar(20) DEFAULT 'completed' NOT NULL,
    "transaction_id" integer,
    "source" varchar(30) DEFAULT 'payment',
    "created_by" varchar(255) NOT NULL,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "employee_expenses" (
    "id" serial PRIMARY KEY NOT NULL,
    "branch_id" integer,
    "expense_number" varchar(50) NOT NULL UNIQUE,
    "staff_id" integer NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "category_id" integer,
    "custom_category_name" varchar(150),
    "expense_date" timestamp DEFAULT now() NOT NULL,
    "description" text,
    "business_purpose" text,
    "payment_method" varchar(50),
    "vendor_id" integer,
    "project" varchar(100),
    "department" varchar(100),
    "receipt_attachment_id" integer,
    "status" varchar(20) DEFAULT 'draft' NOT NULL,
    "submitted_at" timestamp,
    "reviewed_by" integer,
    "reviewed_at" timestamp,
    "review_notes" text,
    "paid_at" timestamp,
    "payment_id" integer,
    "created_by" varchar(255) NOT NULL,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );`,
	`CREATE TABLE IF NOT EXISTS "account_transfers" (
    "id" serial PRIMARY KEY NOT NULL,
    "branch_id" integer,
    "transfer_number" varchar(50) NOT NULL UNIQUE,
    "from_account_id" integer NOT NULL,
    "to_account_id" integer NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "transfer_date" timestamp DEFAULT now() NOT NULL,
    "description" text,
    "reference_number" varchar(100),
    "from_transaction_id" integer,
    "to_transaction_id" integer,
    "status" varchar(20) DEFAULT 'completed' NOT NULL,
    "created_by" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now()
  );`,
	// PLACEHOLDER_TABLES
];

const INDEXES = [
	`CREATE INDEX IF NOT EXISTS "idx_bank_accounts_branch" ON "bank_accounts" ("branch_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_bank_accounts_type" ON "bank_accounts" ("account_type");`,
	`CREATE INDEX IF NOT EXISTS "idx_payment_categories_branch" ON "payment_categories" ("branch_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_attachments_entity" ON "attachments" ("entity_type","entity_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_attachments_branch" ON "attachments" ("branch_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payments_branch" ON "payments" ("branch_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payments_date" ON "payments" ("payment_date");`,
	`CREATE INDEX IF NOT EXISTS "idx_payments_type" ON "payments" ("payment_type");`,
	`CREATE INDEX IF NOT EXISTS "idx_payments_category" ON "payments" ("category_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments" ("status");`,
	`CREATE INDEX IF NOT EXISTS "idx_payments_bank_account" ON "payments" ("bank_account_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_emp_expenses_branch" ON "employee_expenses" ("branch_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_emp_expenses_staff" ON "employee_expenses" ("staff_id");`,
	`CREATE INDEX IF NOT EXISTS "idx_emp_expenses_status" ON "employee_expenses" ("status");`,
	`CREATE INDEX IF NOT EXISTS "idx_transfers_branch" ON "account_transfers" ("branch_id");`,
];

// Foreign keys applied best-effort; ignored if they already exist.
const CONSTRAINTS = [
	`ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id");`,
	`ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_ledger_account_id_fk" FOREIGN KEY ("ledger_account_id") REFERENCES "accounts"("id");`,
	`ALTER TABLE "payment_categories" ADD CONSTRAINT "payment_categories_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id");`,
	`ALTER TABLE "attachments" ADD CONSTRAINT "attachments_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id");`,
	`ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id");`,
	`ALTER TABLE "payments" ADD CONSTRAINT "payments_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "payment_categories"("id");`,
	`ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id");`,
	`ALTER TABLE "payments" ADD CONSTRAINT "payments_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id");`,
	`ALTER TABLE "payments" ADD CONSTRAINT "payments_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "staff"("id");`,
	`ALTER TABLE "payments" ADD CONSTRAINT "payments_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id");`,
	`ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");`,
	`ALTER TABLE "payments" ADD CONSTRAINT "payments_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id");`,
	`ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id");`,
	`ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "staff"("id");`,
	`ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "payment_categories"("id");`,
	`ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id");`,
	`ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_reviewed_by_fk" FOREIGN KEY ("reviewed_by") REFERENCES "staff"("id");`,
	`ALTER TABLE "employee_expenses" ADD CONSTRAINT "employee_expenses_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "payments"("id");`,
	`ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id");`,
	`ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_from_account_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "bank_accounts"("id");`,
	`ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_to_account_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "bank_accounts"("id");`,
	`ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_from_tx_fk" FOREIGN KEY ("from_transaction_id") REFERENCES "transactions"("id");`,
	`ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_to_tx_fk" FOREIGN KEY ("to_transaction_id") REFERENCES "transactions"("id");`,
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
		console.log("Finance migration successful: 6 tables ensured.");
	} finally {
		client.release();
	}
}

migrate()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error("Finance migration failed:", e);
		process.exit(1);
	});
