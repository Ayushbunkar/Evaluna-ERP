/**
 * Additive-only DDL for the Auditor role tables.
 *
 * Why not `drizzle-kit push`? Push wants to add a pre-existing unrelated
 * unique constraint (`payments_payment_number_unique`) and prompts to TRUNCATE
 * `payments` — destructive and out of scope. This script applies ONLY the new
 * auditor tables/indexes with IF NOT EXISTS, so it is idempotent and touches no
 * existing data.
 *
 * Run: cd apps/web && bun scripts/apply-auditor-schema.ts
 */
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db/index";

const STATEMENTS: { label: string; sql: string }[] = [
	{
		label: "upc_tasks",
		sql: `
CREATE TABLE IF NOT EXISTS upc_tasks (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id),
  branch_id integer REFERENCES branches(id),
  task_type varchar(20) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'PENDING',
  assigned_to integer REFERENCES staff(id),
  created_by integer REFERENCES staff(id),
  verified_by integer REFERENCES staff(id),
  upc_value varchar(64),
  upc_source varchar(20),
  due_at timestamp,
  notes text,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  completed_at timestamp,
  verified_at timestamp
);`,
	},
	{
		label: "audit_findings",
		sql: `
CREATE TABLE IF NOT EXISTS audit_findings (
  id serial PRIMARY KEY,
  branch_id integer REFERENCES branches(id),
  finding_type varchar(20) NOT NULL,
  severity varchar(10) NOT NULL DEFAULT 'MEDIUM',
  status varchar(30) NOT NULL DEFAULT 'OPEN',
  title varchar(255) NOT NULL,
  description text,
  reference_type varchar(50),
  reference_id integer,
  raised_by integer REFERENCES staff(id),
  assigned_to integer REFERENCES staff(id),
  resolved_by integer REFERENCES staff(id),
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  resolved_at timestamp
);`,
	},
	{
		label: "corrective_actions",
		sql: `
CREATE TABLE IF NOT EXISTS corrective_actions (
  id serial PRIMARY KEY,
  finding_id integer NOT NULL REFERENCES audit_findings(id),
  description text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'PENDING',
  assigned_to integer REFERENCES staff(id),
  completed_by integer REFERENCES staff(id),
  due_at timestamp,
  completed_at timestamp,
  created_at timestamp DEFAULT NOW()
);`,
	},
	{
		label: "price_change_history",
		sql: `
CREATE TABLE IF NOT EXISTS price_change_history (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id),
  price_field varchar(40) NOT NULL,
  old_price numeric(10,2),
  new_price numeric(10,2),
  changed_by integer REFERENCES staff(id),
  changed_by_uid varchar(255),
  reason text,
  approval_ref varchar(100),
  source varchar(50),
  created_at timestamp DEFAULT NOW()
);`,
	},
	{
		label: "receiving_inspections",
		sql: `
CREATE TABLE IF NOT EXISTS receiving_inspections (
  id serial PRIMARY KEY,
  purchase_id integer REFERENCES purchases(id),
  product_id integer NOT NULL REFERENCES products(id),
  branch_id integer REFERENCES branches(id),
  expected_qty integer,
  received_qty integer,
  condition varchar(20),
  upc_status varchar(20),
  status varchar(20) NOT NULL DEFAULT 'PENDING',
  inspected_by integer REFERENCES staff(id),
  notes text,
  created_at timestamp DEFAULT NOW(),
  verified_at timestamp
);`,
	},
	{
		label: "placement_verifications",
		sql: `
CREATE TABLE IF NOT EXISTS placement_verifications (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id),
  batch_id integer REFERENCES product_batches(id),
  location_id integer REFERENCES branch_locations(id),
  branch_id integer REFERENCES branches(id),
  status varchar(30) NOT NULL DEFAULT 'AWAITING_PLACEMENT',
  placed_by integer REFERENCES staff(id),
  verified_by integer REFERENCES staff(id),
  notes text,
  created_at timestamp DEFAULT NOW(),
  verified_at timestamp
);`,
	},
	// ── Indexes ────────────────────────────────────────────────────────────────
	{
		label: "idx_upc_tasks_product",
		sql: `CREATE INDEX IF NOT EXISTS idx_upc_tasks_product ON upc_tasks (product_id);`,
	},
	{
		label: "idx_upc_tasks_status",
		sql: `CREATE INDEX IF NOT EXISTS idx_upc_tasks_status ON upc_tasks (status);`,
	},
	{
		label: "idx_audit_findings_status",
		sql: `CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings (status);`,
	},
	{
		label: "idx_audit_findings_type",
		sql: `CREATE INDEX IF NOT EXISTS idx_audit_findings_type ON audit_findings (finding_type);`,
	},
	{
		label: "idx_price_hist_product",
		sql: `CREATE INDEX IF NOT EXISTS idx_price_hist_product ON price_change_history (product_id);`,
	},
	{
		label: "idx_recv_insp_status",
		sql: `CREATE INDEX IF NOT EXISTS idx_recv_insp_status ON receiving_inspections (status);`,
	},
	{
		label: "idx_placement_status",
		sql: `CREATE INDEX IF NOT EXISTS idx_placement_status ON placement_verifications (status);`,
	},
	{
		// DB-level guarantee: no two products may share an active UPC.
		label: "uniq_active_upc (partial unique)",
		sql: `CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_upc ON product_barcodes (barcode) WHERE barcode_type = 'UPC';`,
	},
];

async function main() {
	let ok = 0;
	const failures: { label: string; message: string }[] = [];

	for (const stmt of STATEMENTS) {
		try {
			await db.execute(sql.raw(stmt.sql));
			console.log(`  ✓ ${stmt.label}`);
			ok++;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`  ✗ ${stmt.label}: ${message}`);
			failures.push({ label: stmt.label, message });
		}
	}

	console.log(`\n${ok}/${STATEMENTS.length} statements applied.`);
	if (failures.length) {
		console.error("Failures:", failures);
		process.exit(1);
	}
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
