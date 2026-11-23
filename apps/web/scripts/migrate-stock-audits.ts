import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Applying stock_audits schema migration to Postgres...");

  await db.execute(sql`
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "audit_number" VARCHAR(50);
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "title" VARCHAR(255);
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) DEFAULT 'medium';
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "counting_method" VARCHAR(20) DEFAULT 'blind';
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "assigned_by" INTEGER REFERENCES staff(id);
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "assigned_at" TIMESTAMP;
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP;
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "audit_type" VARCHAR(50) DEFAULT 'physical_count';
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "location_name" VARCHAR(255);
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMP;
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "review_notes" TEXT;
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "reconciled_by" INTEGER REFERENCES staff(id);
    ALTER TABLE "stock_audits" ADD COLUMN IF NOT EXISTS "reconciled_at" TIMESTAMP;

    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "recount_qty" INTEGER;
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "recount_by" INTEGER REFERENCES staff(id);
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "recount_notes" TEXT;
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "recount_requested_at" TIMESTAMP;
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "final_accepted_qty" INTEGER;
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "variance_qty" INTEGER;
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "adjustment_status" VARCHAR(30) DEFAULT 'none';
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "adjustment_id" INTEGER REFERENCES stock_adjustments(id);
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "discrepancy_reason" VARCHAR(100);
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "remarks" TEXT;
    ALTER TABLE "stock_audit_items" ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP;

    ALTER TABLE "audit_discrepancies" ADD COLUMN IF NOT EXISTS "variance_value" DECIMAL(10, 2);
    ALTER TABLE "audit_discrepancies" ADD COLUMN IF NOT EXISTS "investigation_notes" TEXT;
  `);

  console.log("Successfully migrated stock_audits and stock_audit_items tables in Postgres!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
