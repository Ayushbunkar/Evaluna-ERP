import { db } from "../apps/web/src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
	console.log("Checking procurement tables...");

	// 1. purchase_requests
	await db.execute(sql.raw(`
		CREATE TABLE IF NOT EXISTS "purchase_requests" (
			"id" serial PRIMARY KEY NOT NULL,
			"request_number" varchar(50) NOT NULL UNIQUE,
			"branch_id" integer REFERENCES "branches"("id"),
			"department" varchar(100) DEFAULT 'Warehouse',
			"requested_by" varchar(255) NOT NULL,
			"priority" varchar(20) DEFAULT 'medium',
			"status" varchar(30) DEFAULT 'draft',
			"notes" text,
			"required_by_date" timestamp,
			"approved_by" varchar(255),
			"approved_at" timestamp,
			"rejection_reason" text,
			"estimated_total" decimal(12, 2) DEFAULT '0',
			"created_at" timestamp DEFAULT now(),
			"updated_at" timestamp DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS "idx_purchase_requests_branch" ON "purchase_requests" ("branch_id");
		CREATE INDEX IF NOT EXISTS "idx_purchase_requests_status" ON "purchase_requests" ("status");
		CREATE INDEX IF NOT EXISTS "idx_purchase_requests_num" ON "purchase_requests" ("request_number");
	`));
	console.log("purchase_requests ensured.");

	// 2. purchase_request_items
	await db.execute(sql.raw(`
		CREATE TABLE IF NOT EXISTS "purchase_request_items" (
			"id" serial PRIMARY KEY NOT NULL,
			"request_id" integer NOT NULL REFERENCES "purchase_requests"("id") ON DELETE CASCADE,
			"product_id" integer NOT NULL REFERENCES "products"("id"),
			"quantity" decimal(10, 3) NOT NULL,
			"estimated_unit_cost" decimal(10, 2) DEFAULT '0',
			"preferred_supplier_id" integer REFERENCES "suppliers"("id"),
			"notes" text,
			"created_at" timestamp DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS "idx_pr_items_request_id" ON "purchase_request_items" ("request_id");
		CREATE INDEX IF NOT EXISTS "idx_pr_items_product_id" ON "purchase_request_items" ("product_id");
	`));
	console.log("purchase_request_items ensured.");

	// 3. goods_receipt_notes
	await db.execute(sql.raw(`
		CREATE TABLE IF NOT EXISTS "goods_receipt_notes" (
			"id" serial PRIMARY KEY NOT NULL,
			"grn_number" varchar(50) NOT NULL UNIQUE,
			"purchase_id" integer NOT NULL REFERENCES "purchases"("id"),
			"branch_id" integer NOT NULL REFERENCES "branches"("id"),
			"received_by" varchar(255) NOT NULL,
			"received_at" timestamp DEFAULT now(),
			"delivery_note_number" varchar(100),
			"vehicle_number" varchar(50),
			"status" varchar(30) DEFAULT 'inspected',
			"notes" text,
			"created_at" timestamp DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS "idx_grn_purchase_id" ON "goods_receipt_notes" ("purchase_id");
		CREATE INDEX IF NOT EXISTS "idx_grn_branch_id" ON "goods_receipt_notes" ("branch_id");
		CREATE INDEX IF NOT EXISTS "idx_grn_status" ON "goods_receipt_notes" ("status");
	`));
	console.log("goods_receipt_notes ensured.");

	// 4. goods_receipt_items
	await db.execute(sql.raw(`
		CREATE TABLE IF NOT EXISTS "goods_receipt_items" (
			"id" serial PRIMARY KEY NOT NULL,
			"grn_id" integer NOT NULL REFERENCES "goods_receipt_notes"("id") ON DELETE CASCADE,
			"purchase_item_id" integer REFERENCES "purchase_items"("id"),
			"product_id" integer NOT NULL REFERENCES "products"("id"),
			"ordered_quantity" decimal(10, 3) NOT NULL,
			"received_quantity" decimal(10, 3) NOT NULL,
			"accepted_quantity" decimal(10, 3) DEFAULT '0' NOT NULL,
			"rejected_quantity" decimal(10, 3) DEFAULT '0' NOT NULL,
			"damaged_quantity" decimal(10, 3) DEFAULT '0' NOT NULL,
			"shortage_quantity" decimal(10, 3) DEFAULT '0' NOT NULL,
			"unit_cost" decimal(10, 2) DEFAULT '0',
			"batch_number" varchar(100),
			"expiry_date" timestamp,
			"inspection_status" varchar(30) DEFAULT 'passed',
			"inspection_notes" text,
			"created_at" timestamp DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS "idx_grn_items_grn_id" ON "goods_receipt_items" ("grn_id");
		CREATE INDEX IF NOT EXISTS "idx_grn_items_product_id" ON "goods_receipt_items" ("product_id");
	`));
	console.log("goods_receipt_items ensured.");

	// 5. supplier_invoices
	await db.execute(sql.raw(`
		CREATE TABLE IF NOT EXISTS "supplier_invoices" (
			"id" serial PRIMARY KEY NOT NULL,
			"invoice_number" varchar(100) NOT NULL,
			"supplier_id" integer NOT NULL REFERENCES "suppliers"("id"),
			"purchase_id" integer NOT NULL REFERENCES "purchases"("id"),
			"branch_id" integer REFERENCES "branches"("id"),
			"invoice_date" timestamp NOT NULL,
			"due_date" timestamp,
			"subtotal" decimal(12, 2) NOT NULL,
			"tax_amount" decimal(12, 2) DEFAULT '0',
			"total_amount" decimal(12, 2) NOT NULL,
			"amount_paid" decimal(12, 2) DEFAULT '0',
			"outstanding_amount" decimal(12, 2) NOT NULL,
			"matching_status" varchar(30) DEFAULT 'pending',
			"status" varchar(30) DEFAULT 'draft',
			"payment_status" varchar(20) DEFAULT 'unpaid',
			"verified_by" varchar(255),
			"verified_at" timestamp,
			"approved_by" varchar(255),
			"approved_at" timestamp,
			"discrepancy_notes" text,
			"document_url" text,
			"created_at" timestamp DEFAULT now(),
			"updated_at" timestamp DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS "idx_supplier_inv_supplier" ON "supplier_invoices" ("supplier_id");
		CREATE INDEX IF NOT EXISTS "idx_supplier_inv_purchase" ON "supplier_invoices" ("purchase_id");
		CREATE INDEX IF NOT EXISTS "idx_supplier_inv_matching" ON "supplier_invoices" ("matching_status");
		CREATE INDEX IF NOT EXISTS "idx_supplier_inv_status" ON "supplier_invoices" ("status");
		CREATE INDEX IF NOT EXISTS "idx_supplier_inv_num_sup" ON "supplier_invoices" ("supplier_id", "invoice_number");
	`));
	console.log("supplier_invoices ensured.");

	// 6. supplier_invoice_items
	await db.execute(sql.raw(`
		CREATE TABLE IF NOT EXISTS "supplier_invoice_items" (
			"id" serial PRIMARY KEY NOT NULL,
			"invoice_id" integer NOT NULL REFERENCES "supplier_invoices"("id") ON DELETE CASCADE,
			"purchase_item_id" integer REFERENCES "purchase_items"("id"),
			"product_id" integer NOT NULL REFERENCES "products"("id"),
			"billed_quantity" decimal(10, 3) NOT NULL,
			"unit_price" decimal(10, 2) NOT NULL,
			"tax_rate" decimal(5, 2) DEFAULT '0',
			"tax_amount" decimal(10, 2) DEFAULT '0',
			"line_total" decimal(12, 2) NOT NULL,
			"po_quantity" decimal(10, 3),
			"grn_quantity" decimal(10, 3),
			"price_variance" decimal(10, 2) DEFAULT '0',
			"quantity_variance" decimal(10, 3) DEFAULT '0',
			"created_at" timestamp DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS "idx_inv_items_invoice_id" ON "supplier_invoice_items" ("invoice_id");
		CREATE INDEX IF NOT EXISTS "idx_inv_items_product_id" ON "supplier_invoice_items" ("product_id");
	`));
	console.log("supplier_invoice_items ensured.");

	// 7. supplier_payment_allocations
	await db.execute(sql.raw(`
		CREATE TABLE IF NOT EXISTS "supplier_payment_allocations" (
			"id" serial PRIMARY KEY NOT NULL,
			"payment_id" integer,
			"invoice_id" integer NOT NULL REFERENCES "supplier_invoices"("id"),
			"purchase_id" integer REFERENCES "purchases"("id"),
			"allocated_amount" decimal(12, 2) NOT NULL,
			"payment_date" timestamp DEFAULT now(),
			"reference_number" varchar(100),
			"payment_mode" varchar(50) DEFAULT 'bank_transfer',
			"notes" text,
			"created_by" varchar(255),
			"created_at" timestamp DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS "idx_pay_alloc_invoice_id" ON "supplier_payment_allocations" ("invoice_id");
		CREATE INDEX IF NOT EXISTS "idx_pay_alloc_purchase_id" ON "supplier_payment_allocations" ("purchase_id");
		CREATE INDEX IF NOT EXISTS "idx_pay_alloc_payment_id" ON "supplier_payment_allocations" ("payment_id");
	`));
	console.log("supplier_payment_allocations ensured.");

	// 8. procurement_exceptions
	await db.execute(sql.raw(`
		CREATE TABLE IF NOT EXISTS "procurement_exceptions" (
			"id" serial PRIMARY KEY NOT NULL,
			"purchase_id" integer REFERENCES "purchases"("id"),
			"grn_id" integer REFERENCES "goods_receipt_notes"("id"),
			"invoice_id" integer REFERENCES "supplier_invoices"("id"),
			"exception_type" varchar(50) NOT NULL,
			"severity" varchar(20) DEFAULT 'medium',
			"description" text NOT NULL,
			"status" varchar(30) DEFAULT 'open',
			"resolution_notes" text,
			"resolved_by" varchar(255),
			"resolved_at" timestamp,
			"created_at" timestamp DEFAULT now()
		);
		CREATE INDEX IF NOT EXISTS "idx_proc_exc_purchase_id" ON "procurement_exceptions" ("purchase_id");
		CREATE INDEX IF NOT EXISTS "idx_proc_exc_status" ON "procurement_exceptions" ("status");
		CREATE INDEX IF NOT EXISTS "idx_proc_exc_type" ON "procurement_exceptions" ("exception_type");
	`));
	console.log("procurement_exceptions ensured.");

	console.log("All procurement tables ensured successfully!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Migration error:", err);
	process.exit(1);
});
