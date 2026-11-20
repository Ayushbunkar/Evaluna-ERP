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
			await db.execute(
				sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`,
			);
		} catch (_) {}
		try {
			await db.execute(
				sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_storage_path TEXT`,
			);
		} catch (_) {}
		try {
			await db.execute(
				sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMP`,
			);
		} catch (_) {}
		try {
			await db.execute(
				sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_updated_by VARCHAR(255)`,
			);
		} catch (_) {}
		try {
			await db.execute(
				sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS original_quantity NUMERIC(10, 3)`,
			);
		} catch (_) {}
		try {
			await db.execute(
				sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS picked_quantity NUMERIC(10, 3)`,
			);
		} catch (_) {}
		hasEnsuredProductColumns = true;
	}
}

let hasEnsuredPickingExceptions = false;

/**
 * Idempotently ensures that the picking_exceptions table and its indices exist.
 * This prevents relational queries in orders.get and picker operations from failing on databases where
 * migrations have not been applied.
 */
export async function ensurePickingExceptionsTable(db: any): Promise<void> {
	if (hasEnsuredPickingExceptions) return;
	try {
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS picking_exceptions (
				id SERIAL PRIMARY KEY,
				pick_list_id INTEGER,
				pick_list_item_id INTEGER,
				order_id INTEGER,
				product_id INTEGER,
				branch_id INTEGER,
				location_id INTEGER,
				quantity_ordered NUMERIC(10, 3) NOT NULL DEFAULT 0,
				quantity_picked NUMERIC(10, 3) NOT NULL DEFAULT 0,
				quantity_damaged NUMERIC(10, 3) DEFAULT 0,
				quantity_missing NUMERIC(10, 3) DEFAULT 0,
				reason VARCHAR(100) NOT NULL DEFAULT 'SHORTAGE',
				remarks TEXT,
				photo_url TEXT,
				reported_by INTEGER,
				status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',
				manager_notes TEXT,
				resolved_by INTEGER,
				resolved_at TIMESTAMP,
				replacement_task_id INTEGER,
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW()
			)
		`);
		try {
			await db.execute(
				sql`CREATE INDEX IF NOT EXISTS idx_picking_exceptions_pick_list_id ON picking_exceptions(pick_list_id)`,
			);
		} catch (_) {}
		try {
			await db.execute(
				sql`CREATE INDEX IF NOT EXISTS idx_picking_exceptions_order_id ON picking_exceptions(order_id)`,
			);
		} catch (_) {}
		try {
			await db.execute(
				sql`CREATE INDEX IF NOT EXISTS idx_picking_exceptions_product_id ON picking_exceptions(product_id)`,
			);
		} catch (_) {}
		try {
			await db.execute(
				sql`CREATE INDEX IF NOT EXISTS idx_picking_exceptions_status ON picking_exceptions(status)`,
			);
		} catch (_) {}
		hasEnsuredPickingExceptions = true;
	} catch (e) {
		console.warn("[ensurePickingExceptionsTable] Notice:", e);
	}
}
