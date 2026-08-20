import { PGlite } from "@electric-sql/pglite";
import { getTableName } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";

// FK-safe order: referenced tables before referencing tables
const TABLES: PgTable[] = [
	schema.products,
	schema.customers,
	schema.paymentMethods,
	schema.orders,
	schema.orderItems,
	schema.transactions,
];

function sqlLiteral(value: unknown): string | null {
	if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
	if (typeof value === "number") return String(value);
	if (typeof value === "boolean") return value ? "true" : "false";
	return null; // sql`` objects / arrays / null → let the app or NULL handle it
}

function tableToDDL(table: PgTable, includeFks = true): string {
	const { name, columns, foreignKeys } = getTableConfig(table);

	const colDefs = columns.map((col) => {
		const sqlType = col.getSQLType();
		const isSerial = sqlType === "serial";
		const parts: string[] = [col.name, sqlType];

		if (col.primary) parts.push("PRIMARY KEY");
		if (col.notNull && !isSerial) parts.push("NOT NULL");
		if (col.isUnique) parts.push("UNIQUE");
		if (col.hasDefault && !isSerial) {
			if (sqlType.startsWith("timestamp")) {
				parts.push("DEFAULT NOW()");
			} else {
				const lit = sqlLiteral((col as { default?: unknown }).default);
				if (lit !== null) parts.push(`DEFAULT ${lit}`);
			}
		}

		return parts.join(" ");
	});

	const fkDefs = includeFks
		? foreignKeys.map((fk) => {
				const ref = fk.reference();
				const col = ref.columns[0].name;
				const refTable = getTableName(ref.foreignColumns[0].table);
				const refCol = ref.foreignColumns[0].name;
				return `FOREIGN KEY (${col}) REFERENCES ${refTable}(${refCol})`;
			})
		: [];

	return `CREATE TABLE IF NOT EXISTS ${name} (\n  ${[...colDefs, ...fkDefs].join(",\n  ")}\n);`;
}

/** Build CREATE TABLE DDL for an explicit set of tables. */
export function buildDDL(tables: PgTable[], includeFks = true): string {
	return tables.map((t) => tableToDDL(t, includeFks)).join("\n\n");
}

// Base tables for the original router tests. FKs are skipped for the same
// reason as the finance set: `branches` (and the branches↔staff cycle) is not
// part of this list, so inline FK constraints would reference a missing table.
// These tests assert app-level behavior (ownership, validation), not DB-level
// referential integrity.
export const SCHEMA_DDL = buildDDL(TABLES, false);

// Finance vertical slice needs its own tables plus the core tables they touch.
// FKs are skipped: `branches.manager_id → staff.id` and `staff.branch_id →
// branches.id` form a cycle that can't be satisfied by inline CREATE TABLE
// ordering, and referential enforcement isn't what these tests exercise
// (branch isolation is enforced in app code via WHERE clauses, not FKs).
const FINANCE_TABLES: PgTable[] = [
	schema.branches,
	schema.staff,
	schema.suppliers,
	schema.customers,
	schema.paymentMethods,
	schema.accounts,
	schema.transactions,
	schema.auditLogs,
	schema.bankAccounts,
	schema.paymentCategories,
	schema.attachments,
	schema.payments,
	schema.employeeExpenses,
	schema.accountTransfers,
];

export const FINANCE_SCHEMA_DDL = buildDDL(FINANCE_TABLES, false);

export function createTestDb() {
	const pg = new PGlite();
	const db = drizzle({ client: pg, schema });
	return { pg, db };
}

export function makeUser(id: string) {
	return {
		id,
		name: "Test",
		email: `${id}@test.com`,
		// BaseUser fields the current procedures authorize against. Default to an
		// active admin so protectedProcedure/roleProcedure pass; tests that assert
		// isolation do so at the data layer (user_uid / branch filters), not role.
		role: "admin",
		branchId: null,
		isSuperadmin: false,
		isActive: true,
		permissions: [] as string[],
		// Legacy Better-Auth fields kept for any test that still reads them.
		emailVerified: false,
		image: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

/**
 * Context user (BaseUser shape) for finance routers, which authorize via
 * role/branchId/permissions rather than the Better-Auth session user above.
 */
export function makeFinanceUser(
	overrides: Partial<{
		id: string;
		name: string;
		email: string;
		role: string;
		branchId: number | null;
		isSuperadmin: boolean;
		isActive: boolean;
		permissions: string[];
	}> = {},
) {
	return {
		id: overrides.id ?? "fin-user-1",
		name: overrides.name ?? "Finance User",
		email: overrides.email ?? "fin@test.com",
		role: overrides.role ?? "manager",
		branchId: overrides.branchId === undefined ? 1 : overrides.branchId,
		isSuperadmin: overrides.isSuperadmin ?? false,
		isActive: overrides.isActive ?? true,
		permissions: overrides.permissions ?? [],
	};
}
