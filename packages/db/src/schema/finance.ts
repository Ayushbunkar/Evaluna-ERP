/**
 * Finance & Accounts module schema.
 *
 * NEW tables only. This module intentionally REUSES the existing accounting core
 * (`accounts`, `journal_entries`, `journal_entry_lines`, `financial_years`),
 * `transactions`, `payment_methods`, `expenses`, `suppliers` (vendors),
 * `customers`, `orders` (sales invoices), `purchases` (bills), `payroll`,
 * `staff` and `audit_logs` defined in ../schema.ts — it does not redefine them.
 *
 * Conventions follow ../schema.ts: serial PK, snake_case columns, decimal money
 * (precision 15,2 to match journal_entry_lines), varchar+comment instead of
 * pgEnum, created_at/updated_at timestamps, soft-delete via is_deleted/deleted_at,
 * and a branch_id FK on every table for branch-level tenant scoping.
 */
import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import {
	accounts,
	branches,
	customers,
	paymentMethods,
	staff,
	suppliers,
	transactions,
} from "../schema";

// ── Bank / Cash Accounts ──────────────────────────────────────────────────────
// Company money containers. account_type "petty_cash" is used for petty-cash boxes,
// so petty cash reuses this table + payments rather than a parallel structure.
export const bankAccounts = pgTable(
	"bank_accounts",
	{
		id: serial("id").primaryKey(),
		branch_id: integer("branch_id").references(() => branches.id),
		account_name: varchar("account_name", { length: 255 }).notNull(),
		account_type: varchar("account_type", { length: 20 })
			.notNull()
			.default("bank"), // bank, cash, card, wallet, petty_cash
		bank_name: varchar("bank_name", { length: 150 }),
		account_number: varchar("account_number", { length: 50 }), // sensitive — full number, never exposed in list views
		account_number_masked: varchar("account_number_masked", { length: 50 }),
		ifsc: varchar("ifsc", { length: 20 }),
		ledger_account_id: integer("ledger_account_id").references(
			() => accounts.id,
		), // link to chart of accounts
		opening_balance: decimal("opening_balance", { precision: 15, scale: 2 })
			.notNull()
			.default("0"),
		current_balance: decimal("current_balance", { precision: 15, scale: 2 })
			.notNull()
			.default("0"),
		currency: varchar("currency", { length: 10 }).notNull().default("INR"),
		status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive
		notes: text("notes"),
		is_deleted: boolean("is_deleted").default(false),
		deleted_at: timestamp("deleted_at"),
		created_at: timestamp("created_at").defaultNow(),
		updated_at: timestamp("updated_at")
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(table) => ({
		branchIdx: index("idx_bank_accounts_branch").on(table.branch_id),
		typeIdx: index("idx_bank_accounts_type").on(table.account_type),
	}),
);

// ── Payment Categories ──────────────────────────────────────────────────────
// Configurable master data so users never wait for a developer to add a category.
export const paymentCategories = pgTable(
	"payment_categories",
	{
		id: serial("id").primaryKey(),
		branch_id: integer("branch_id").references(() => branches.id),
		name: varchar("name", { length: 100 }).notNull(),
		parent_id: integer("parent_id"), // recursive for sub-categories
		kind: varchar("kind", { length: 20 }).notNull().default("expense"), // expense, income
		is_active: boolean("is_active").notNull().default(true),
		is_system: boolean("is_system").notNull().default(false), // seeded defaults (e.g. Other/Misc)
		created_at: timestamp("created_at").defaultNow(),
		updated_at: timestamp("updated_at")
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(table) => ({
		branchIdx: index("idx_payment_categories_branch").on(table.branch_id),
	}),
);

// ── Attachments (secure file storage) ────────────────────────────────────────
// Generic, polymorphic attachment registry. Files live on disk under a private
// uploads dir; only metadata + a relative storage_path are stored here.
export const attachments = pgTable(
	"attachments",
	{
		id: serial("id").primaryKey(),
		branch_id: integer("branch_id").references(() => branches.id),
		entity_type: varchar("entity_type", { length: 50 }).notNull(), // payment, employee_expense, ...
		entity_id: integer("entity_id"), // nullable until linked to a record
		file_name: varchar("file_name", { length: 255 }).notNull(), // original client filename (display only)
		stored_name: varchar("stored_name", { length: 255 }).notNull(), // safe generated on-disk name
		mime_type: varchar("mime_type", { length: 100 }).notNull(),
		file_size: integer("file_size").notNull().default(0), // bytes
		storage_path: varchar("storage_path", { length: 500 }).notNull(), // relative path inside uploads root
		uploaded_by: varchar("uploaded_by", { length: 255 }).notNull(),
		is_deleted: boolean("is_deleted").default(false),
		deleted_at: timestamp("deleted_at"),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		entityIdx: index("idx_attachments_entity").on(
			table.entity_type,
			table.entity_id,
		),
		branchIdx: index("idx_attachments_branch").on(table.branch_id),
	}),
);

// ── Payments ──────────────────────────────────────────────────────────────────
// The core, flexible payment record for ANY legitimate company payment
// (petrol, diesel, food, courier, vendor payment, reimbursement, misc, …).
export const payments = pgTable(
	"payments",
	{
		id: serial("id").primaryKey(),
		branch_id: integer("branch_id").references(() => branches.id),
		payment_number: varchar("payment_number", { length: 50 })
			.notNull()
			.unique(),
		payment_type: varchar("payment_type", { length: 20 })
			.notNull()
			.default("expense"), // expense, income, payment, receipt, refund
		category_id: integer("category_id").references(() => paymentCategories.id),
		custom_category_name: varchar("custom_category_name", { length: 150 }), // for Other / Miscellaneous
		amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
		currency: varchar("currency", { length: 10 }).notNull().default("INR"),
		payment_date: timestamp("payment_date").notNull().defaultNow(),
		payment_method_id: integer("payment_method_id").references(
			() => paymentMethods.id,
		),
		bank_account_id: integer("bank_account_id").references(
			() => bankAccounts.id,
		),
		paid_by: varchar("paid_by", { length: 255 }), // free-text person who paid
		staff_id: integer("staff_id").references(() => staff.id),
		vendor_id: integer("vendor_id").references(() => suppliers.id),
		customer_id: integer("customer_id").references(() => customers.id),
		department: varchar("department", { length: 100 }),
		project: varchar("project", { length: 100 }),
		location: varchar("location", { length: 150 }),
		description: text("description"),
		reference_number: varchar("reference_number", { length: 100 }),
		receipt_attachment_id: integer("receipt_attachment_id"),
		notes: text("notes"),
		tax_amount: decimal("tax_amount", { precision: 15, scale: 2 }).default("0"),
		status: varchar("status", { length: 20 }).notNull().default("completed"), // draft, completed, void
		transaction_id: integer("transaction_id").references(() => transactions.id),
		source: varchar("source", { length: 30 }).default("payment"), // payment, employee_expense, transfer
		created_by: varchar("created_by", { length: 255 }).notNull(),
		is_deleted: boolean("is_deleted").default(false),
		deleted_at: timestamp("deleted_at"),
		created_at: timestamp("created_at").defaultNow(),
		updated_at: timestamp("updated_at")
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(table) => ({
		branchIdx: index("idx_payments_branch").on(table.branch_id),
		dateIdx: index("idx_payments_date").on(table.payment_date),
		typeIdx: index("idx_payments_type").on(table.payment_type),
		categoryIdx: index("idx_payments_category").on(table.category_id),
		statusIdx: index("idx_payments_status").on(table.status),
		bankIdx: index("idx_payments_bank_account").on(table.bank_account_id),
	}),
);

// ── Employee Expenses (reimbursement workflow) ────────────────────────────────
// Submit → review → approve/reject → process → pay. Links to `staff` (the
// payroll-linked, branch-scoped people table that carries bank/IFSC/PAN).
export const employeeExpenses = pgTable(
	"employee_expenses",
	{
		id: serial("id").primaryKey(),
		branch_id: integer("branch_id").references(() => branches.id),
		expense_number: varchar("expense_number", { length: 50 })
			.notNull()
			.unique(),
		staff_id: integer("staff_id")
			.references(() => staff.id)
			.notNull(), // submitter
		amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
		category_id: integer("category_id").references(() => paymentCategories.id),
		custom_category_name: varchar("custom_category_name", { length: 150 }),
		expense_date: timestamp("expense_date").notNull().defaultNow(),
		description: text("description"),
		business_purpose: text("business_purpose"),
		payment_method: varchar("payment_method", { length: 50 }),
		vendor_id: integer("vendor_id").references(() => suppliers.id),
		project: varchar("project", { length: 100 }),
		department: varchar("department", { length: 100 }),
		receipt_attachment_id: integer("receipt_attachment_id"),
		status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, submitted, under_review, approved, rejected, processing, paid, cancelled
		submitted_at: timestamp("submitted_at"),
		reviewed_by: integer("reviewed_by").references(() => staff.id),
		reviewed_at: timestamp("reviewed_at"),
		review_notes: text("review_notes"),
		paid_at: timestamp("paid_at"),
		payment_id: integer("payment_id").references(() => payments.id),
		created_by: varchar("created_by", { length: 255 }).notNull(),
		is_deleted: boolean("is_deleted").default(false),
		deleted_at: timestamp("deleted_at"),
		created_at: timestamp("created_at").defaultNow(),
		updated_at: timestamp("updated_at")
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(table) => ({
		branchIdx: index("idx_emp_expenses_branch").on(table.branch_id),
		staffIdx: index("idx_emp_expenses_staff").on(table.staff_id),
		statusIdx: index("idx_emp_expenses_status").on(table.status),
	}),
);

// ── Account Transfers ─────────────────────────────────────────────────────────
// Money moved between two company bank/cash accounts. Both sides post a
// transaction and adjust balances atomically inside a single DB transaction.
export const accountTransfers = pgTable(
	"account_transfers",
	{
		id: serial("id").primaryKey(),
		branch_id: integer("branch_id").references(() => branches.id),
		transfer_number: varchar("transfer_number", { length: 50 })
			.notNull()
			.unique(),
		from_account_id: integer("from_account_id")
			.references(() => bankAccounts.id)
			.notNull(),
		to_account_id: integer("to_account_id")
			.references(() => bankAccounts.id)
			.notNull(),
		amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
		transfer_date: timestamp("transfer_date").notNull().defaultNow(),
		description: text("description"),
		reference_number: varchar("reference_number", { length: 100 }),
		from_transaction_id: integer("from_transaction_id").references(
			() => transactions.id,
		),
		to_transaction_id: integer("to_transaction_id").references(
			() => transactions.id,
		),
		status: varchar("status", { length: 20 }).notNull().default("completed"),
		created_by: varchar("created_by", { length: 255 }).notNull(),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		branchIdx: index("idx_transfers_branch").on(table.branch_id),
	}),
);

// ── Relations ─────────────────────────────────────────────────────────────────
export const bankAccountsRelations = relations(
	bankAccounts,
	({ one, many }) => ({
		ledgerAccount: one(accounts, {
			fields: [bankAccounts.ledger_account_id],
			references: [accounts.id],
		}),
		payments: many(payments),
	}),
);

export const paymentCategoriesRelations = relations(
	paymentCategories,
	({ one, many }) => ({
		parent: one(paymentCategories, {
			fields: [paymentCategories.parent_id],
			references: [paymentCategories.id],
		}),
		payments: many(payments),
	}),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
	category: one(paymentCategories, {
		fields: [payments.category_id],
		references: [paymentCategories.id],
	}),
	bankAccount: one(bankAccounts, {
		fields: [payments.bank_account_id],
		references: [bankAccounts.id],
	}),
	paymentMethod: one(paymentMethods, {
		fields: [payments.payment_method_id],
		references: [paymentMethods.id],
	}),
	vendor: one(suppliers, {
		fields: [payments.vendor_id],
		references: [suppliers.id],
	}),
	customer: one(customers, {
		fields: [payments.customer_id],
		references: [customers.id],
	}),
	staffMember: one(staff, {
		fields: [payments.staff_id],
		references: [staff.id],
	}),
}));

export const employeeExpensesRelations = relations(
	employeeExpenses,
	({ one }) => ({
		staffMember: one(staff, {
			fields: [employeeExpenses.staff_id],
			references: [staff.id],
		}),
		category: one(paymentCategories, {
			fields: [employeeExpenses.category_id],
			references: [paymentCategories.id],
		}),
		payment: one(payments, {
			fields: [employeeExpenses.payment_id],
			references: [payments.id],
		}),
	}),
);
