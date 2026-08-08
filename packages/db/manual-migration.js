import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "packages" (
        "id" serial PRIMARY KEY NOT NULL,
        "order_id" integer NOT NULL,
        "pick_list_id" integer,
        "package_number" varchar(100) NOT NULL,
        "status" varchar(50) DEFAULT 'packing',
        "packed_by" integer,
        "checked_by" integer,
        "packed_at" timestamp,
        "checked_at" timestamp,
        "weight" numeric(10, 2),
        "dimensions" varchar(100),
        "notes" text,
        "created_at" timestamp DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "package_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "package_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `);

    try { await client.query(`ALTER TABLE "packages" ADD CONSTRAINT "packages_package_number_unique" UNIQUE("package_number");`); } catch (e) {}
    try { await client.query(`ALTER TABLE "packages" ADD CONSTRAINT "packages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id");`); } catch (e) {}
    try { await client.query(`ALTER TABLE "packages" ADD CONSTRAINT "packages_pick_list_id_pick_lists_id_fk" FOREIGN KEY ("pick_list_id") REFERENCES "pick_lists"("id");`); } catch (e) {}
    try { await client.query(`ALTER TABLE "packages" ADD CONSTRAINT "packages_packed_by_staff_id_fk" FOREIGN KEY ("packed_by") REFERENCES "staff"("id");`); } catch (e) {}
    try { await client.query(`ALTER TABLE "packages" ADD CONSTRAINT "packages_checked_by_staff_id_fk" FOREIGN KEY ("checked_by") REFERENCES "staff"("id");`); } catch (e) {}
    try { await client.query(`ALTER TABLE "package_items" ADD CONSTRAINT "package_items_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "packages"("id");`); } catch (e) {}
    try { await client.query(`ALTER TABLE "package_items" ADD CONSTRAINT "package_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id");`); } catch (e) {}

    await client.query('COMMIT');
    console.log("Migration successful");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", e);
  } finally {
    client.release();
  }
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
