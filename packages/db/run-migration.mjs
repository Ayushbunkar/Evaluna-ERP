import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sqls = [
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "driver_collected_amount" DECIMAL(10,2)`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_verified_amount" DECIMAL(10,2)`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_status" VARCHAR(50) DEFAULT 'pending_collection'`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "driver_id" INTEGER`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "driver_collected_at" TIMESTAMP`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_verified_by" INTEGER`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_verified_at" TIMESTAMP`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finance_notes" TEXT`,
  `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "original_amount" DECIMAL(10,2)`,
  `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "adjustment_amount" DECIMAL(10,2) DEFAULT 0`,
  `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "reconciliation_status" VARCHAR(20) DEFAULT 'pending'`,
];

const client = await pool.connect();
try {
  for (const sql of sqls) {
    await client.query(sql);
    console.log("OK:", sql.substring(0, 60));
  }
  console.log("Migration complete!");
} finally {
  client.release();
  await pool.end();
}
