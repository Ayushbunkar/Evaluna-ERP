import * as dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const tablesToClear = [
	// Orders & Fulfillment
	"order_items",
	"order_audits",
	"orders",
	"pick_list_items",
	"pick_lists",
	"pack_lists",
	"package_items",
	"packages",
	"put_list_items",
	"put_lists",
	"e_way_bills",
	"proof_of_deliveries",
	"delivery_stops",
	"delivery_trips",
	"delivery_routes",
	"route_stops",
	"trip_stops",
	"trip_collections",
	"gps_logs",
	"sales_return_items",
	"sales_returns",

	// Van Stock
	"van_stock_plan_items",
	"van_stock_plans",
	"van_stock_exceptions",
	"van_stock_audits",

	// Procurement
	"purchase_request_items",
	"purchase_requests",
	"purchase_items",
	"purchases",
	"purchase_return_items",
	"purchase_returns",
	"goods_receipt_items",
	"goods_receipt_notes",
	"receiving_inspections",
	"supplier_invoice_items",
	"supplier_invoices",
	"supplier_payment_allocations",
	"procurement_exceptions",

	// Products, Batches & Inventory
	"daily_product_discounts",
	"price_change_history",
	"branch_damage",
	"missing_stock_queue",
	"product_category_mapping",
	"product_barcodes",
	"product_batches",
	"batch_stock",
	"branch_inventory",
	"product_conversions",
	"product_categories",
	"products",

	// Stock Ledger & Audits
	"stock_ledger",
	"stock_transfers",
	"stock_adjustments",
	"stock_audit_items",
	"stock_audits",
	"audit_discrepancies",
	"audit_findings",
	"corrective_actions",
	"upc_tasks",
	"placement_verifications",
	"branch_health_snapshots",

	// Financial History & Ledger
	"transactions",
	"expenses",
	"payments",
	"payment_batch_item",
	"payment_batch",
	"journal_entry_lines",
	"journal_entries",
	"balance_snapshots",
	"account_transfers",
	"customer_ledger",
	"audit_logs",
	"coupons",

	// Notifications
	"notifications",
	"notification_queue",
	"payroll_notification",
];

const preservedTables = [
	"user",
	"account",
	"session",
	"verification",
	"staff",
	"employees",
	"roles",
	"permissions",
	"user_roles",
	"role_permissions",
	"customers",
	"suppliers",
	"companies",
	"branches",
	"branch_locations",
	"vehicles",
	"bank_accounts",
	"payment_methods",
	"tax_rates",
	"settings",
	"company_settings",
];

async function main() {
	const client = new Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();

	console.log("=== CHECKING EXISTING ROW COUNTS BEFORE CLEANUP ===");

	// Verify existing tables in DB
	const tablesRes = await client.query(
		"SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
	);
	const dbTables = new Set(tablesRes.rows.map((r) => r.table_name));

	const validTablesToClear = tablesToClear.filter((t) => dbTables.has(t));
	const validPreserved = preservedTables.filter((t) => dbTables.has(t));

	console.log(`Found ${validTablesToClear.length} tables to clear.`);

	for (const table of validTablesToClear) {
		const countRes = await client.query(`SELECT count(*)::int as count FROM "${table}"`);
		if (countRes.rows[0].count > 0) {
			console.log(`- ${table}: ${countRes.rows[0].count} records`);
		}
	}

	console.log("\n=== PRESERVED TABLES BEFORE CLEANUP ===");
	for (const table of validPreserved) {
		const countRes = await client.query(`SELECT count(*)::int as count FROM "${table}"`);
		console.log(`[PRESERVED] ${table}: ${countRes.rows[0].count} records`);
	}

	console.log("\n=== EXECUTING TRUNCATE WITH RESTART IDENTITY CASCADE ===");
	// Truncate all in a single command
	const truncateSql = `TRUNCATE TABLE ${validTablesToClear.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`;
	await client.query(truncateSql);
	console.log("Truncate successful!");

	console.log("\n=== VERIFYING COUNTS AFTER CLEANUP ===");
	let totalRemaining = 0;
	for (const table of validTablesToClear) {
		const countRes = await client.query(`SELECT count(*)::int as count FROM "${table}"`);
		const count = countRes.rows[0].count;
		totalRemaining += count;
		if (count > 0) {
			console.error(`ERROR: ${table} still has ${count} records!`);
		}
	}
	console.log(`Cleared tables verification: ${totalRemaining} records remaining across all target tables.`);

	console.log("\n=== VERIFYING PRESERVED TABLES AFTER CLEANUP ===");
	for (const table of validPreserved) {
		const countRes = await client.query(`SELECT count(*)::int as count FROM "${table}"`);
		console.log(`[INTACT] ${table}: ${countRes.rows[0].count} records`);
	}

	await client.end();
	console.log("\nDATABASE CLEANUP FINISHED SUCCESSFULLY!");
}

main().catch(console.error);
