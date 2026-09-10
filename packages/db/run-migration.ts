import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dir, "../../.env") });

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

async function migrate() {
  console.log("Running reconciliation migration...");
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "driver_collected_amount" DECIMAL(10,2)`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_verified_amount" DECIMAL(10,2)`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_status" VARCHAR(50) DEFAULT 'pending_collection'`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "driver_id" INTEGER`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "driver_collected_at" TIMESTAMP`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_verified_by" INTEGER`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_verified_at" TIMESTAMP`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_notes" TEXT`;
  await sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "original_amount" DECIMAL(10,2)`;
  await sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "adjustment_amount" DECIMAL(10,2) DEFAULT 0`;
  await sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "reconciliation_status" VARCHAR(20) DEFAULT 'pending'`;
  console.log("Migration complete!");
  await sql.end();
  process.exit(0);
}

migrate().catch((e) => { console.error(e); process.exit(1); });
