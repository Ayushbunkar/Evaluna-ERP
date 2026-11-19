import { sql } from "drizzle-orm";

let hasEnsuredProductColumns = false;

/**
 * Idempotently ensures that the product image management and order item quantity
 * schema columns exist on the database. This prevents queries from failing when
 * remote production databases have not yet run migration scripts.
 */
export async function ensureProductImageColumns(db: any): Promise<void> {
	if (hasEnsuredProductColumns) return;
	try {
		await db.execute(sql`
			ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
			ALTER TABLE products ADD COLUMN IF NOT EXISTS image_storage_path TEXT;
			ALTER TABLE products ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMP;
			ALTER TABLE products ADD COLUMN IF NOT EXISTS image_updated_by VARCHAR(255);
			ALTER TABLE order_items ADD COLUMN IF NOT EXISTS original_quantity NUMERIC(10, 3);
			ALTER TABLE order_items ADD COLUMN IF NOT EXISTS picked_quantity NUMERIC(10, 3);
		`);
		hasEnsuredProductColumns = true;
	} catch (e) {
		// If multi-statement DDL fails on some connection poolers, execute statements individually
		try {
			await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`);
		} catch (_) {}
		try {
			await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_storage_path TEXT`);
		} catch (_) {}
		try {
			await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMP`);
		} catch (_) {}
		try {
			await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_updated_by VARCHAR(255)`);
		} catch (_) {}
		try {
			await db.execute(sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS original_quantity NUMERIC(10, 3)`);
		} catch (_) {}
		try {
			await db.execute(sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS picked_quantity NUMERIC(10, 3)`);
		} catch (_) {}
		hasEnsuredProductColumns = true;
	}
}
