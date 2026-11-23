import { db } from "../apps/web/src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
	console.log("Creating van stock planning and dispatch workflow tables...");

	await db.execute(sql`
		CREATE TABLE IF NOT EXISTS van_stock_plans (
			id SERIAL PRIMARY KEY,
			plan_code VARCHAR(50) NOT NULL UNIQUE,
			vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
			driver_id VARCHAR(255),
			branch_id INTEGER NOT NULL REFERENCES branches(id),
			dispatch_date DATE NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
			revision INTEGER NOT NULL DEFAULT 1,
			notes TEXT,
			special_instructions TEXT,
			created_by_id VARCHAR(255) NOT NULL,
			created_by_name VARCHAR(255),
			assigned_picker_id VARCHAR(255),
			picked_at TIMESTAMP,
			assigned_packer_id VARCHAR(255),
			packed_at TIMESTAMP,
			verified_by_id VARCHAR(255),
			verified_at TIMESTAMP,
			verification_notes TEXT,
			assigned_loader_id VARCHAR(255),
			loaded_at TIMESTAMP,
			loading_notes TEXT,
			loading_checklist JSONB,
			dispatched_by_id VARCHAR(255),
			dispatched_at TIMESTAMP,
			dispatch_reference VARCHAR(100) UNIQUE,
			driver_return_notes TEXT,
			returned_at TIMESTAMP,
			return_verified_by_id VARCHAR(255),
			return_verified_at TIMESTAMP,
			return_verification_notes TEXT,
			rejection_reason TEXT,
			rejection_stage VARCHAR(50),
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_van_stock_plans_status ON van_stock_plans(status);
		CREATE INDEX IF NOT EXISTS idx_van_stock_plans_vehicle ON van_stock_plans(vehicle_id);
		CREATE INDEX IF NOT EXISTS idx_van_stock_plans_branch ON van_stock_plans(branch_id);
		CREATE INDEX IF NOT EXISTS idx_van_stock_plans_driver ON van_stock_plans(driver_id);
		CREATE INDEX IF NOT EXISTS idx_van_stock_plans_date ON van_stock_plans(dispatch_date);

		CREATE TABLE IF NOT EXISTS van_stock_plan_items (
			id SERIAL PRIMARY KEY,
			plan_id INTEGER NOT NULL REFERENCES van_stock_plans(id) ON DELETE CASCADE,
			product_id INTEGER NOT NULL REFERENCES products(id),
			is_additional BOOLEAN NOT NULL DEFAULT FALSE,
			additional_reason TEXT,
			planned_quantity DECIMAL(10, 3) NOT NULL,
			picked_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
			picking_shortage DECIMAL(10, 3) NOT NULL DEFAULT 0,
			picking_notes TEXT,
			packed_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
			packing_damaged DECIMAL(10, 3) NOT NULL DEFAULT 0,
			packing_status VARCHAR(50) DEFAULT 'pending',
			packing_notes TEXT,
			verified_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
			verification_notes TEXT,
			loaded_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
			loading_status VARCHAR(50) DEFAULT 'pending',
			loading_notes TEXT,
			delivered_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
			returned_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
			damaged_return_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
			return_reason_code VARCHAR(100),
			return_notes TEXT,
			verified_return_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_van_plan_items_plan_id ON van_stock_plan_items(plan_id);
		CREATE INDEX IF NOT EXISTS idx_van_plan_items_product_id ON van_stock_plan_items(product_id);

		CREATE TABLE IF NOT EXISTS van_stock_exceptions (
			id SERIAL PRIMARY KEY,
			plan_id INTEGER NOT NULL REFERENCES van_stock_plans(id) ON DELETE CASCADE,
			product_id INTEGER NOT NULL REFERENCES products(id),
			stage VARCHAR(50) NOT NULL,
			requested_by_id VARCHAR(255) NOT NULL,
			requested_by_name VARCHAR(255),
			quantity DECIMAL(10, 3) NOT NULL,
			reason TEXT NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
			reviewed_by_id VARCHAR(255),
			reviewed_by_name VARCHAR(255),
			review_notes TEXT,
			reviewed_at TIMESTAMP,
			created_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_van_exceptions_plan_id ON van_stock_exceptions(plan_id);
		CREATE INDEX IF NOT EXISTS idx_van_exceptions_status ON van_stock_exceptions(status);

		CREATE TABLE IF NOT EXISTS van_stock_audits (
			id SERIAL PRIMARY KEY,
			plan_id INTEGER NOT NULL REFERENCES van_stock_plans(id) ON DELETE CASCADE,
			actor_id VARCHAR(255) NOT NULL,
			actor_name VARCHAR(255) NOT NULL,
			actor_role VARCHAR(100) NOT NULL,
			stage VARCHAR(50) NOT NULL,
			action VARCHAR(100) NOT NULL,
			previous_status VARCHAR(50),
			new_status VARCHAR(50) NOT NULL,
			revision INTEGER NOT NULL DEFAULT 1,
			reason TEXT,
			notes TEXT,
			metadata JSONB,
			created_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_van_audits_plan_id ON van_stock_audits(plan_id);
		CREATE INDEX IF NOT EXISTS idx_van_audits_created_at ON van_stock_audits(created_at);
	`);

	console.log("Successfully created van stock tables and indexes!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
