import { relations } from "drizzle-orm";
import {
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
	branches,
	products,
	purchases,
	purchaseItems,
	suppliers,
} from "../schema";

// ── Purchase Requests ──────────────────────────────────────────────────────
export const purchaseRequests = pgTable(
	"purchase_requests",
	{
		id: serial("id").primaryKey(),
		request_number: varchar("request_number", { length: 50 }).notNull().unique(),
		branch_id: integer("branch_id").references(() => branches.id),
		department: varchar("department", { length: 100 }).default("Warehouse"),
		requested_by: varchar("requested_by", { length: 255 }).notNull(),
		priority: varchar("priority", { length: 20 }).default("medium"), // 'low', 'medium', 'high', 'urgent'
		status: varchar("status", { length: 30 }).default("draft"), // 'draft', 'pending_approval', 'approved', 'rejected', 'converted', 'cancelled'
		notes: text("notes"),
		required_by_date: timestamp("required_by_date"),
		approved_by: varchar("approved_by", { length: 255 }),
		approved_at: timestamp("approved_at"),
		rejection_reason: text("rejection_reason"),
		estimated_total: decimal("estimated_total", { precision: 12, scale: 2 }).default("0"),
		created_at: timestamp("created_at").defaultNow(),
		updated_at: timestamp("updated_at")
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(table) => ({
		branchIdx: index("idx_purchase_requests_branch").on(table.branch_id),
		statusIdx: index("idx_purchase_requests_status").on(table.status),
		reqNumIdx: index("idx_purchase_requests_num").on(table.request_number),
	}),
);

export const purchaseRequestsRelations = relations(purchaseRequests, ({ one, many }) => ({
	branch: one(branches, {
		fields: [purchaseRequests.branch_id],
		references: [branches.id],
	}),
	items: many(purchaseRequestItems),
}));

// ── Purchase Request Items ─────────────────────────────────────────────────
export const purchaseRequestItems = pgTable(
	"purchase_request_items",
	{
		id: serial("id").primaryKey(),
		request_id: integer("request_id")
			.references(() => purchaseRequests.id, { onDelete: "cascade" })
			.notNull(),
		product_id: integer("product_id")
			.references(() => products.id)
			.notNull(),
		quantity: decimal("quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),
		estimated_unit_cost: decimal("estimated_unit_cost", { precision: 10, scale: 2 }).default("0"),
		preferred_supplier_id: integer("preferred_supplier_id").references(() => suppliers.id),
		notes: text("notes"),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		reqIdIdx: index("idx_pr_items_request_id").on(table.request_id),
		prodIdIdx: index("idx_pr_items_product_id").on(table.product_id),
	}),
);

export const purchaseRequestItemsRelations = relations(purchaseRequestItems, ({ one }) => ({
	request: one(purchaseRequests, {
		fields: [purchaseRequestItems.request_id],
		references: [purchaseRequests.id],
	}),
	product: one(products, {
		fields: [purchaseRequestItems.product_id],
		references: [products.id],
	}),
	preferredSupplier: one(suppliers, {
		fields: [purchaseRequestItems.preferred_supplier_id],
		references: [suppliers.id],
	}),
}));

// ── Goods Receipt Notes (GRN) ───────────────────────────────────────────────
export const goodsReceiptNotes = pgTable(
	"goods_receipt_notes",
	{
		id: serial("id").primaryKey(),
		grn_number: varchar("grn_number", { length: 50 }).notNull().unique(),
		purchase_id: integer("purchase_id")
			.references(() => purchases.id)
			.notNull(),
		branch_id: integer("branch_id")
			.references(() => branches.id)
			.notNull(),
		received_by: varchar("received_by", { length: 255 }).notNull(),
		received_at: timestamp("received_at").defaultNow(),
		delivery_note_number: varchar("delivery_note_number", { length: 100 }),
		vehicle_number: varchar("vehicle_number", { length: 50 }),
		status: varchar("status", { length: 30 }).default("inspected"), // 'pending_inspection', 'inspected', 'partially_accepted', 'accepted', 'rejected'
		notes: text("notes"),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		purchaseIdx: index("idx_grn_purchase_id").on(table.purchase_id),
		branchIdx: index("idx_grn_branch_id").on(table.branch_id),
		statusIdx: index("idx_grn_status").on(table.status),
	}),
);

export const goodsReceiptNotesRelations = relations(goodsReceiptNotes, ({ one, many }) => ({
	purchase: one(purchases, {
		fields: [goodsReceiptNotes.purchase_id],
		references: [purchases.id],
	}),
	branch: one(branches, {
		fields: [goodsReceiptNotes.branch_id],
		references: [branches.id],
	}),
	items: many(goodsReceiptItems),
}));

// ── Goods Receipt Items ────────────────────────────────────────────────────
export const goodsReceiptItems = pgTable(
	"goods_receipt_items",
	{
		id: serial("id").primaryKey(),
		grn_id: integer("grn_id")
			.references(() => goodsReceiptNotes.id, { onDelete: "cascade" })
			.notNull(),
		purchase_item_id: integer("purchase_item_id").references(() => purchaseItems.id),
		product_id: integer("product_id")
			.references(() => products.id)
			.notNull(),
		ordered_quantity: decimal("ordered_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),
		received_quantity: decimal("received_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),
		accepted_quantity: decimal("accepted_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		rejected_quantity: decimal("rejected_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		damaged_quantity: decimal("damaged_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		shortage_quantity: decimal("shortage_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.default("0")
			.notNull(),
		unit_cost: decimal("unit_cost", { precision: 10, scale: 2 }).default("0"),
		batch_number: varchar("batch_number", { length: 100 }),
		expiry_date: timestamp("expiry_date"),
		inspection_status: varchar("inspection_status", { length: 30 }).default("passed"), // 'passed', 'failed', 'conditional'
		inspection_notes: text("inspection_notes"),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		grnIdIdx: index("idx_grn_items_grn_id").on(table.grn_id),
		prodIdIdx: index("idx_grn_items_product_id").on(table.product_id),
	}),
);

export const goodsReceiptItemsRelations = relations(goodsReceiptItems, ({ one }) => ({
	grn: one(goodsReceiptNotes, {
		fields: [goodsReceiptItems.grn_id],
		references: [goodsReceiptNotes.id],
	}),
	purchaseItem: one(purchaseItems, {
		fields: [goodsReceiptItems.purchase_item_id],
		references: [purchaseItems.id],
	}),
	product: one(products, {
		fields: [goodsReceiptItems.product_id],
		references: [products.id],
	}),
}));

// ── Supplier Invoices ──────────────────────────────────────────────────────
export const supplierInvoices = pgTable(
	"supplier_invoices",
	{
		id: serial("id").primaryKey(),
		invoice_number: varchar("invoice_number", { length: 100 }).notNull(), // Supplier's bill number
		supplier_id: integer("supplier_id")
			.references(() => suppliers.id)
			.notNull(),
		purchase_id: integer("purchase_id")
			.references(() => purchases.id)
			.notNull(),
		branch_id: integer("branch_id").references(() => branches.id),
		invoice_date: timestamp("invoice_date").notNull(),
		due_date: timestamp("due_date"),
		subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
		tax_amount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
		total_amount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
		amount_paid: decimal("amount_paid", { precision: 12, scale: 2 }).default("0"),
		outstanding_amount: decimal("outstanding_amount", { precision: 12, scale: 2 }).notNull(),
		matching_status: varchar("matching_status", { length: 30 }).default("pending"), // 'pending', 'matched', 'quantity_mismatch', 'price_mismatch', 'total_mismatch', 'variance_approved'
		status: varchar("status", { length: 30 }).default("draft"), // 'draft', 'verified', 'approved_for_payment', 'partially_paid', 'paid', 'cancelled', 'disputed'
		payment_status: varchar("payment_status", { length: 20 }).default("unpaid"), // 'unpaid', 'partially_paid', 'paid'
		verified_by: varchar("verified_by", { length: 255 }),
		verified_at: timestamp("verified_at"),
		approved_by: varchar("approved_by", { length: 255 }),
		approved_at: timestamp("approved_at"),
		discrepancy_notes: text("discrepancy_notes"),
		document_url: text("document_url"),
		created_at: timestamp("created_at").defaultNow(),
		updated_at: timestamp("updated_at")
			.defaultNow()
			.$onUpdateFn(() => new Date()),
	},
	(table) => ({
		supplierIdIdx: index("idx_supplier_inv_supplier").on(table.supplier_id),
		purchaseIdIdx: index("idx_supplier_inv_purchase").on(table.purchase_id),
		matchStatusIdx: index("idx_supplier_inv_matching").on(table.matching_status),
		statusIdx: index("idx_supplier_inv_status").on(table.status),
		invNumSupplierIdx: index("idx_supplier_inv_num_sup").on(table.supplier_id, table.invoice_number),
	}),
);

export const supplierInvoicesRelations = relations(supplierInvoices, ({ one, many }) => ({
	supplier: one(suppliers, {
		fields: [supplierInvoices.supplier_id],
		references: [suppliers.id],
	}),
	purchase: one(purchases, {
		fields: [supplierInvoices.purchase_id],
		references: [purchases.id],
	}),
	branch: one(branches, {
		fields: [supplierInvoices.branch_id],
		references: [branches.id],
	}),
	items: many(supplierInvoiceItems),
	allocations: many(supplierPaymentAllocations),
}));

// ── Supplier Invoice Items ─────────────────────────────────────────────────
export const supplierInvoiceItems = pgTable(
	"supplier_invoice_items",
	{
		id: serial("id").primaryKey(),
		invoice_id: integer("invoice_id")
			.references(() => supplierInvoices.id, { onDelete: "cascade" })
			.notNull(),
		purchase_item_id: integer("purchase_item_id").references(() => purchaseItems.id),
		product_id: integer("product_id")
			.references(() => products.id)
			.notNull(),
		billed_quantity: decimal("billed_quantity", { precision: 10, scale: 3 })
			.$type<number | string>()
			.notNull(),
		unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
		tax_rate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
		tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
		line_total: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
		po_quantity: decimal("po_quantity", { precision: 10, scale: 3 }),
		grn_quantity: decimal("grn_quantity", { precision: 10, scale: 3 }),
		price_variance: decimal("price_variance", { precision: 10, scale: 2 }).default("0"),
		quantity_variance: decimal("quantity_variance", { precision: 10, scale: 3 }).default("0"),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		invIdIdx: index("idx_inv_items_invoice_id").on(table.invoice_id),
		prodIdIdx: index("idx_inv_items_product_id").on(table.product_id),
	}),
);

export const supplierInvoiceItemsRelations = relations(supplierInvoiceItems, ({ one }) => ({
	invoice: one(supplierInvoices, {
		fields: [supplierInvoiceItems.invoice_id],
		references: [supplierInvoices.id],
	}),
	purchaseItem: one(purchaseItems, {
		fields: [supplierInvoiceItems.purchase_item_id],
		references: [purchaseItems.id],
	}),
	product: one(products, {
		fields: [supplierInvoiceItems.product_id],
		references: [products.id],
	}),
}));

// ── Supplier Payment Allocations ───────────────────────────────────────────
export const supplierPaymentAllocations = pgTable(
	"supplier_payment_allocations",
	{
		id: serial("id").primaryKey(),
		payment_id: integer("payment_id"), // links to payments.id in finance schema
		invoice_id: integer("invoice_id")
			.references(() => supplierInvoices.id)
			.notNull(),
		purchase_id: integer("purchase_id").references(() => purchases.id),
		allocated_amount: decimal("allocated_amount", { precision: 12, scale: 2 }).notNull(),
		payment_date: timestamp("payment_date").defaultNow(),
		reference_number: varchar("reference_number", { length: 100 }),
		payment_mode: varchar("payment_mode", { length: 50 }).default("bank_transfer"),
		notes: text("notes"),
		created_by: varchar("created_by", { length: 255 }),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		invIdIdx: index("idx_pay_alloc_invoice_id").on(table.invoice_id),
		purchaseIdIdx: index("idx_pay_alloc_purchase_id").on(table.purchase_id),
		paymentIdIdx: index("idx_pay_alloc_payment_id").on(table.payment_id),
	}),
);

export const supplierPaymentAllocationsRelations = relations(supplierPaymentAllocations, ({ one }) => ({
	invoice: one(supplierInvoices, {
		fields: [supplierPaymentAllocations.invoice_id],
		references: [supplierInvoices.id],
	}),
	purchase: one(purchases, {
		fields: [supplierPaymentAllocations.purchase_id],
		references: [purchases.id],
	}),
}));

// ── Procurement Exceptions ─────────────────────────────────────────────────
export const procurementExceptions = pgTable(
	"procurement_exceptions",
	{
		id: serial("id").primaryKey(),
		purchase_id: integer("purchase_id").references(() => purchases.id),
		grn_id: integer("grn_id").references(() => goodsReceiptNotes.id),
		invoice_id: integer("invoice_id").references(() => supplierInvoices.id),
		exception_type: varchar("exception_type", { length: 50 }).notNull(), // 'shortage', 'damage', 'price_variance', 'unauthorized_item', 'duplicate_bill'
		severity: varchar("severity", { length: 20 }).default("medium"), // 'low', 'medium', 'high', 'critical'
		description: text("description").notNull(),
		status: varchar("status", { length: 30 }).default("open"), // 'open', 'under_investigation', 'resolved', 'waived'
		resolution_notes: text("resolution_notes"),
		resolved_by: varchar("resolved_by", { length: 255 }),
		resolved_at: timestamp("resolved_at"),
		created_at: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		purchaseIdIdx: index("idx_proc_exc_purchase_id").on(table.purchase_id),
		statusIdx: index("idx_proc_exc_status").on(table.status),
		typeIdx: index("idx_proc_exc_type").on(table.exception_type),
	}),
);

export const procurementExceptionsRelations = relations(procurementExceptions, ({ one }) => ({
	purchase: one(purchases, {
		fields: [procurementExceptions.purchase_id],
		references: [purchases.id],
	}),
	grn: one(goodsReceiptNotes, {
		fields: [procurementExceptions.grn_id],
		references: [goodsReceiptNotes.id],
	}),
	invoice: one(supplierInvoices, {
		fields: [procurementExceptions.invoice_id],
		references: [supplierInvoices.id],
	}),
}));
