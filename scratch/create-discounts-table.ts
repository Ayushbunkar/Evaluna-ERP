import { sql } from "drizzle-orm";
import { db } from "../packages/db/src/index";

async function main() {
	console.log("Creating daily_product_discounts table if not exists...");
	await db.execute(sql`
		CREATE TABLE IF NOT EXISTS "daily_product_discounts" (
			"id" serial PRIMARY KEY,
			"product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
			"branch_id" integer REFERENCES "branches"("id") ON DELETE SET NULL,
			"original_price" numeric(10, 2) NOT NULL,
			"discounted_price" numeric(10, 2) NOT NULL,
			"discount_percent" numeric(5, 2),
			"discount_type" varchar(20) DEFAULT 'fixed_price',
			"discount_value" numeric(10, 2),
			"effective_date" date NOT NULL,
			"end_date" date,
			"reason" text NOT NULL,
			"notes" text,
			"is_active" boolean DEFAULT true,
			"created_by_uid" varchar(255),
			"created_at" timestamp DEFAULT now(),
			"updated_at" timestamp DEFAULT now()
		);
	`);

	await db.execute(sql`
		CREATE INDEX IF NOT EXISTS "idx_daily_disc_prod_date" ON "daily_product_discounts" ("product_id", "effective_date", "is_active");
	`);

	console.log("Table daily_product_discounts created successfully!");
}

main().then(() => process.exit(0)).catch((e) => {
	console.error(e);
	process.exit(1);
});
