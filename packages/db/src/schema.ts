import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  jsonb,
  customType,
  date,
  index,
} from "drizzle-orm/pg-core";

// Re-export Better Auth tables so drizzle-kit picks them up
export {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
} from "./auth-schema";

// Custom bytea type for PGLite compatibility
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// ── Products ────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }),
  hsn: varchar("hsn", { length: 8 }),
  taxable: boolean("taxable").default(true),
  barcode: varchar("barcode", { length: 255 }),
  sku: varchar("sku", { length: 255 }),
  unit: varchar("unit", { length: 50 }),
  is_pack: boolean("is_pack").default(false),
  loose_product_id: integer("loose_product_id"), // Soft reference to avoid circular initialisation issue, but functionally points to products.id
  units_per_pack: integer("units_per_pack"),
  is_weighted: boolean("is_weighted").default(false), // true for scale items
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  barcodeIdx: index("idx_products_barcode").on(table.barcode),
  categoryIdx: index("idx_products_category").on(table.category),
}));

// ── Customers ───────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  branch_id: integer("branch_id").references(() => branches.id),
  id: serial("id").primaryKey(),
  customer_code: varchar("customer_code", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  gst_number: varchar("gst_number", { length: 15 }),
  pan_number: varchar("pan_number", { length: 10 }),
  credit_limit: decimal("credit_limit", { precision: 10, scale: 2 }).default("0"),
  store_credit: decimal("store_credit", { precision: 10, scale: 2 }).default("0"),
  payment_terms: integer("payment_terms").default(30),
  customer_type: varchar("customer_type", { length: 20 }).default("retail"),
  loyalty_tier: varchar("loyalty_tier", { length: 20 }).default("bronze"),
  loyalty_points: integer("loyalty_points").default(0),
  tier_override: boolean("tier_override").default(false),
  total_spent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  marketing_opt_in: boolean("marketing_opt_in").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Orders ──────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  branch_id: integer("branch_id").references(() => branches.id),
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").references(() => customers.id),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  cgst_amount: decimal("cgst_amount", { precision: 10, scale: 2 }).default("0"),
  sgst_amount: decimal("sgst_amount", { precision: 10, scale: 2 }).default("0"),
  igst_amount: decimal("igst_amount", { precision: 10, scale: 2 }).default("0"),
  discount_amount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  discount_reason: text("discount_reason"),
  other_charges: decimal("other_charges", { precision: 10, scale: 2 }).default("0"),
  other_charges_reason: text("other_charges_reason"),
  coupon_id: integer("coupon_id"), // Will reference coupons.id but adding soft reference to avoid circular deps if needed
  is_offline_sync: boolean("is_offline_sync").default(false),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, completed, suspended, cancelled
  payment_method_id: integer("payment_method_id").references(() => paymentMethods.id),
  e_way_bill_no: varchar("e_way_bill_no", { length: 50 }),
  gst_breakdown: jsonb("gst_breakdown"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_orders_created_at").on(table.created_at),
}));

// ── Order Items ─────────────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => orders.id),
  product_id: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cgst_rate: decimal("cgst_rate", { precision: 5, scale: 2 }),
  sgst_rate: decimal("sgst_rate", { precision: 5, scale: 2 }),
  igst_rate: decimal("igst_rate", { precision: 5, scale: 2 }),
  cgst_amount: decimal("cgst_amount", { precision: 10, scale: 2 }).default("0"),
  sgst_amount: decimal("sgst_amount", { precision: 10, scale: 2 }).default("0"),
  igst_amount: decimal("igst_amount", { precision: 10, scale: 2 }).default("0"),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Payment Methods ─────────────────────────────────────────────────────────
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  payment_type: varchar("payment_type", { length: 20 }).default("cash"),
  bank_name: varchar("bank_name", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Transactions ────────────────────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  branch_id: integer("branch_id").references(() => branches.id),
  id: serial("id").primaryKey(),
  description: text("description"),
  order_id: integer("order_id").references(() => orders.id), // Legacy/specific reference
  payment_method_id: integer("payment_method_id").references(() => paymentMethods.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }), // "in" or "out"
  category: varchar("category", { length: 100 }), // "sale", "expense", "purchase", "manual"
  status: varchar("status", { length: 20 }),
  reference_id: integer("reference_id"), // Polymorphic relation ID
  reference_type: varchar("reference_type", { length: 50 }), // 'order', 'expense', 'purchase', 'manual'
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_transactions_created_at").on(table.created_at),
}));

// ── Relations ───────────────────────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customer_id],
    references: [customers.id],
  }),
  orderItems: many(orderItems),
  paymentMethod: one(paymentMethods, {
    fields: [orders.payment_method_id],
    references: [paymentMethods.id],
  }),
  coupon: one(coupons, {
    fields: [orders.coupon_id],
    references: [coupons.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.order_id],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.product_id],
    references: [products.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  order: one(orders, {
    fields: [transactions.order_id],
    references: [orders.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [transactions.payment_method_id],
    references: [paymentMethods.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));


export const branchInventory = pgTable("branch_inventory", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  in_stock: integer("in_stock").notNull().default(0),
  reorder_level: integer("reorder_level").notNull().default(10),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  branchProductIdx: index("idx_branch_inv_branch_product").on(table.branch_id, table.product_id),
}));

export const branchInventoryRelations = relations(branchInventory, ({ one }) => ({
  branch: one(branches, {
    fields: [branchInventory.branch_id],
    references: [branches.id],
  }),
  product: one(products, {
    fields: [branchInventory.product_id],
    references: [products.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  transactions: many(transactions),
  orders: many(orders),
}));

// ── Suppliers ───────────────────────────────────────────────────────────────
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  supplier_code: varchar("supplier_code", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  gst_number: varchar("gst_number", { length: 15 }),
  pan_number: varchar("pan_number", { length: 10 }),
  outstanding_balance: decimal("outstanding_balance", { precision: 12, scale: 2 }).default("0"),
  supplier_category: varchar("supplier_category", { length: 20 }).default("local"),
  created_at: timestamp("created_at").defaultNow(),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}));

// ── Staff ─────────────────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  branch_id: integer("branch_id").references((): any => branches.id),
  id: serial("id").primaryKey(),
  staff_code: varchar("staff_code", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  role: varchar("role", { length: 50 }).notNull(),
  department: varchar("department", { length: 50 }),
  join_date: timestamp("join_date").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  pf_number: varchar("pf_number", { length: 50 }),
  pan: varchar("pan", { length: 10 }),
  aadhaar: varchar("aadhaar", { length: 12 }),
  bank_account: varchar("bank_account", { length: 50 }),
  bank_name: varchar("bank_name", { length: 100 }),
  ifsc: varchar("ifsc", { length: 11 }),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const staffRelations = relations(staff, ({ many }) => ({
  userRoles: many(userRoles),
  stockAdjustments: many(stockAdjustments),
  stockTransfers: many(stockTransfers),
  eWayBills: many(eWayBills),
}));

// ── Roles ─────────────────────────────────────────────────────────────────────
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default({}),
  created_at: timestamp("created_at").defaultNow(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

// ── User Roles ────────────────────────────────────────────────────────────────
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => staff.id).notNull(),
  role_id: integer("role_id").references(() => roles.id).notNull(),
  assigned_at: timestamp("assigned_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(staff, {
    fields: [userRoles.user_id],
    references: [staff.id],
  }),
  role: one(roles, {
    fields: [userRoles.role_id],
    references: [roles.id],
  }),
}));


// ── Stock Adjustments ─────────────────────────────────────────────────────────
export const stockAdjustments = pgTable("stock_adjustments", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  adjustment_type: varchar("adjustment_type", { length: 20 }).notNull(),
  reference_document: varchar("reference_document", { length: 255 }),
  created_by: integer("created_by").references(() => staff.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one }) => ({
  product: one(products, {
    fields: [stockAdjustments.product_id],
    references: [products.id],
  }),
  createdBy: one(staff, {
    fields: [stockAdjustments.created_by],
    references: [staff.id],
  }),
}));

// ── Branches ────────────────────────────────────────────────────────────────
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  manager_id: integer("manager_id").references((): any => staff.id),
  is_headquarters: boolean("is_headquarters").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const branchesRelations = relations(branches, ({ many }) => ({
  stockTransfersFrom: many(stockTransfers),
  stockTransfersTo: many(stockTransfers),
}));

// ── Stock Transfers ───────────────────────────────────────────────────────────
export const stockTransfers = pgTable("stock_transfers", {
  id: serial("id").primaryKey(),
  from_branch_id: integer("from_branch_id").references(() => branches.id).notNull(),
  to_branch_id: integer("to_branch_id").references(() => branches.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  created_at: timestamp("created_at").defaultNow(),
});

export const stockTransfersRelations = relations(stockTransfers, ({ one }) => ({
  fromBranch: one(branches, {
    fields: [stockTransfers.from_branch_id],
    references: [branches.id],
  }),
  toBranch: one(branches, {
    fields: [stockTransfers.to_branch_id],
    references: [branches.id],
  }),
  product: one(products, {
    fields: [stockTransfers.product_id],
    references: [products.id],
  }),
}));

// ── Tax Rates ─────────────────────────────────────────────────────────────────
export const taxRates = pgTable("tax_rates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  tax_type: varchar("tax_type", { length: 10 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const taxRatesRelations = relations(taxRates, ({ many }) => ({
  orderItems: many(orderItems),
}));

// ── Companies ─────────────────────────────────────────────────────────────────
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  contact: varchar("contact", { length: 20 }),
  gst_number: varchar("gst_number", { length: 15 }),
  pan: varchar("pan", { length: 10 }),
  financial_year_start: timestamp("financial_year_start"),
  financial_year_end: timestamp("financial_year_end"),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  userCompanies: many(userCompanies),
}));

// ── User Companies ─────────────────────────────────────────────────────────────
export const userCompanies = pgTable("user_companies", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => staff.id).notNull(),
  company_id: integer("company_id").references(() => companies.id).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  permissions: jsonb("permissions").notNull().default({}),
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const userCompaniesRelations = relations(userCompanies, ({ one }) => ({
  user: one(staff, {
    fields: [userCompanies.user_id],
    references: [staff.id],
  }),
  company: one(companies, {
    fields: [userCompanies.company_id],
    references: [companies.id],
  }),
}));

// ── E-way Bills ────────────────────────────────────────────────────────────────
export const eWayBills = pgTable("e_way_bills", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => orders.id).notNull(),
  e_way_bill_no: varchar("e_way_bill_no", { length: 50 }).notNull().unique(),
  generated_at: timestamp("generated_at").defaultNow(),
  expires_at: timestamp("expires_at"),
  status: varchar("status", { length: 20 }).default("active"),
  created_by: integer("created_by").references(() => staff.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const eWayBillsRelations = relations(eWayBills, ({ one }) => ({
  order: one(orders, {
    fields: [eWayBills.order_id],
    references: [orders.id],
  }),
   createdBy: one(staff, {
     fields: [eWayBills.created_by],
     references: [staff.id],
   }),
}));

// ── Notifications (Extended Phase 40) ──────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id),
  user_id: integer("user_id").references(() => staff.id),
  // Alert type: low_stock | expiry | damage | purchase | sale | payment_due | birthday | loyalty | campaign | info | warning | error
  type: varchar("type", { length: 50 }).default("info").notNull(),
  // Channel: in_app | email | sms | whatsapp | push
  channel: varchar("channel", { length: 20 }).default("in_app").notNull(),
  priority: varchar("priority", { length: 10 }).default("normal"), // low | normal | high | critical
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  // Template-generated metadata
  template_id: integer("template_id"),
  metadata: jsonb("metadata"), // { product_id, order_id, customer_id, etc. }
  // Read state
  is_read: boolean("is_read").default(false),
  read_by: varchar("read_by", { length: 255 }),
  read_at: timestamp("read_at"),
  // Scheduling / Delivery
  scheduled_at: timestamp("scheduled_at"),
  sent_at: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default("pending"), // pending | sent | delivered | failed
  // Retry logic
  retry_count: integer("retry_count").default(0),
  last_error: text("last_error"),
  // Reference for deep linking
  reference_type: varchar("reference_type", { length: 50 }),
  reference_id: integer("reference_id"),
  created_at: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(staff, {
    fields: [notifications.user_id],
    references: [staff.id],
  }),
}));

// ── Notification Templates ──────────────────────────────────────────────────────
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  // Alert type it belongs to
  type: varchar("type", { length: 50 }).notNull(),
  channel: varchar("channel", { length: 20 }).default("in_app").notNull(),
  subject: varchar("subject", { length: 255 }), // For email
  // Handlebars-style template: "Hello {{customer_name}}, your order #{{order_id}} is ready."
  body: text("body").notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Notification Preferences ────────────────────────────────────────────────────
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => staff.id).notNull(),
  // Which alert types are enabled
  type: varchar("type", { length: 50 }).notNull(),
  // Which channels are enabled for this type
  email_enabled: boolean("email_enabled").default(true),
  sms_enabled: boolean("sms_enabled").default(false),
  whatsapp_enabled: boolean("whatsapp_enabled").default(false),
  push_enabled: boolean("push_enabled").default(true),
  in_app_enabled: boolean("in_app_enabled").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(staff, {
    fields: [notificationPreferences.user_id],
    references: [staff.id],
  }),
}));

// ── Notification Queue ──────────────────────────────────────────────────────────
export const notificationQueue = pgTable("notification_queue", {
  id: serial("id").primaryKey(),
  notification_id: integer("notification_id").references(() => notifications.id),
  channel: varchar("channel", { length: 20 }).notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(), // email/phone/device_token
  payload: jsonb("payload").notNull(), // full rendered message payload
  status: varchar("status", { length: 20 }).default("queued"), // queued | processing | sent | failed
  retry_count: integer("retry_count").default(0),
  next_retry_at: timestamp("next_retry_at"),
  last_error: text("last_error"),
  created_at: timestamp("created_at").defaultNow(),
  processed_at: timestamp("processed_at"),
});

export const notificationQueueRelations = relations(notificationQueue, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationQueue.notification_id],
    references: [notifications.id],
  }),
}));

// ── Purchases ─────────────────────────────────────────────────────────────────
export const purchases = pgTable("purchases", {
  branch_id: integer("branch_id").references(() => branches.id),
  id: serial("id").primaryKey(),
  grn_number: varchar("grn_number", { length: 50 }).unique(),
  supplier_id: integer("supplier_id").references(() => suppliers.id).notNull(),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  cgst_amount: decimal("cgst_amount", { precision: 10, scale: 2 }).default("0"),
  sgst_amount: decimal("sgst_amount", { precision: 10, scale: 2 }).default("0"),
  igst_amount: decimal("igst_amount", { precision: 10, scale: 2 }).default("0"),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  amount_paid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  payment_status: varchar("payment_status", { length: 20 }).default("unpaid"), // unpaid, partial, paid
  created_at: timestamp("created_at").defaultNow(),
});

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplier_id],
    references: [suppliers.id],
  }),
  purchaseItems: many(purchaseItems),
}));

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchase_id: integer("purchase_id").references(() => purchases.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cgst_rate: decimal("cgst_rate", { precision: 5, scale: 2 }),
  sgst_rate: decimal("sgst_rate", { precision: 5, scale: 2 }),
  igst_rate: decimal("igst_rate", { precision: 5, scale: 2 }),
  cgst_amount: decimal("cgst_amount", { precision: 10, scale: 2 }).default("0"),
  sgst_amount: decimal("sgst_amount", { precision: 10, scale: 2 }).default("0"),
  igst_amount: decimal("igst_amount", { precision: 10, scale: 2 }).default("0"),
  created_at: timestamp("created_at").defaultNow(),
});

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchase_id],
    references: [purchases.id],
  }),
  product: one(products, {
    fields: [purchaseItems.product_id],
    references: [products.id],
  }),
}));

// ── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  branch_id: integer("branch_id").references(() => branches.id),
  id: serial("id").primaryKey(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expense_category: varchar("expense_category", { length: 50 }),
  payment_method_id: integer("payment_method_id").references(() => paymentMethods.id),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const expensesRelations = relations(expenses, ({ one }) => ({
  paymentMethod: one(paymentMethods, {
    fields: [expenses.payment_method_id],
    references: [paymentMethods.id],
  }),
}));

// ── Product Categories (Phase 7) ──────────────────────────────────────────────
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  parent_id: integer("parent_id"),
  image_url: varchar("image_url", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const productCategoryMapping = pgTable("product_category_mapping", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  category_id: integer("category_id").references(() => productCategories.id).notNull(),
  is_primary: boolean("is_primary").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const productCategoriesRelations = relations(productCategories, ({ many, one }) => ({
  children: many(productCategories),
  parent: one(productCategories, {
    fields: [productCategories.parent_id],
    references: [productCategories.id],
  }),
  categoryMappings: many(productCategoryMapping),
}));

export const productCategoryMappingRelations = relations(productCategoryMapping, ({ one }) => ({
  product: one(products, {
    fields: [productCategoryMapping.product_id],
    references: [products.id],
  }),
  category: one(productCategories, {
    fields: [productCategoryMapping.category_id],
    references: [productCategories.id],
  }),
}));

// ── Product Barcodes (Phase 7) ────────────────────────────────────────────────
export const productBarcodes = pgTable("product_barcodes", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  barcode: varchar("barcode", { length: 50 }).notNull(),
  barcode_type: varchar("barcode_type", { length: 20 }).default("EAN-13"),
  is_weighted: boolean("is_weighted").default(false),
  weight_per_unit: decimal("weight_per_unit", { precision: 10, scale: 3 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const productBarcodesRelations = relations(productBarcodes, ({ one }) => ({
  product: one(products, {
    fields: [productBarcodes.product_id],
    references: [products.id],
  }),
}));

// ── Product Batches (Phase 8) ─────────────────────────────────────────────────
export const productBatches = pgTable("product_batches", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  batch_number: varchar("batch_number", { length: 50 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
  selling_price: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  purchase_price: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  expiry_date: timestamp("expiry_date"),
  manufacture_date: timestamp("manufacture_date"),
  location: varchar("location", { length: 50 }),
  branch_id: integer("branch_id").references(() => branches.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const productBatchesRelations = relations(productBatches, ({ one, many }) => ({
  product: one(products, {
    fields: [productBatches.product_id],
    references: [products.id],
  }),
  branch: one(branches, {
    fields: [productBatches.branch_id],
    references: [branches.id],
  }),
  stockLedgerEntries: many(stockLedger),
}));

// ── Stock Ledger (Phase 8 - FIFO) ──────────────────────────────────────────────
export const stockLedger = pgTable("stock_ledger", {
  branch_id: integer("branch_id").references(() => branches.id),
  id: serial("id").primaryKey(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  batch_id: integer("batch_id").references(() => productBatches.id),
  transaction_type: varchar("transaction_type", { length: 20 }).notNull(), // 'in', 'out', 'adjustment', 'transfer', 'damage', 'expiry'
  quantity: integer("quantity").notNull(), // positive for in, negative for out
  unit_cost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  total_cost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  reference_id: integer("reference_id"), // order_id, purchase_id, adjustment_id
  reference_type: varchar("reference_type", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const stockLedgerRelations = relations(stockLedger, ({ one }) => ({
  product: one(products, {
    fields: [stockLedger.product_id],
    references: [products.id],
  }),
  batch: one(productBatches, {
    fields: [stockLedger.batch_id],
    references: [productBatches.id],
  }),
}));

// ── Branch Locations (Phase 9) ──────────────────────────────────────────────
export const branchLocations = pgTable("branch_locations", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id).notNull(),
  name: varchar("name", { length: 50 }).notNull(), // e.g., A-01, B-02
  section: varchar("section", { length: 20 }),
  aisle: varchar("aisle", { length: 20 }),
  shelf: varchar("shelf", { length: 20 }),
  level: varchar("level", { length: 10 }),
  location_type: varchar("location_type", { length: 20 }).default("storage"), // storage, picking, quarantine, damage
  capacity: integer("capacity").default(0),
  current_stock: integer("current_stock").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const branchLocationsRelations = relations(branchLocations, ({ one, many }) => ({
  branch: one(branches, {
    fields: [branchLocations.branch_id],
    references: [branches.id],
  }),
  locationBarcodes: many(locationBarcodes),
  batchStock: many(batchStock),
}));

// ── Location Barcodes (Phase 9) ──────────────────────────────────────────────
export const locationBarcodes = pgTable("location_barcodes", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").references(() => branchLocations.id).notNull(),
  barcode: varchar("barcode", { length: 50 }).notNull().unique(),
  barcode_type: varchar("barcode_type", { length: 20 }).default("QR"),
  is_primary: boolean("is_primary").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const locationBarcodesRelations = relations(locationBarcodes, ({ one }) => ({
  location: one(branchLocations, {
    fields: [locationBarcodes.location_id],
    references: [branchLocations.id],
  }),
}));

// ── Batch Stock (Phase 9 - Location-based stock) ────────────────────────────────
export const batchStock = pgTable("batch_stock", {
  id: serial("id").primaryKey(),
  batch_id: integer("batch_id").references(() => productBatches.id).notNull(),
  location_id: integer("location_id").references(() => branchLocations.id).notNull(),
  quantity: integer("quantity").notNull().default(0),
  min_quantity: integer("min_quantity").default(0),
  max_quantity: integer("max_quantity").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

export const batchStockRelations = relations(batchStock, ({ one }) => ({
  batch: one(productBatches, {
    fields: [batchStock.batch_id],
    references: [productBatches.id],
  }),
  location: one(branchLocations, {
    fields: [batchStock.location_id],
    references: [branchLocations.id],
  }),
}));

// ── Pick Lists (Phase 9) ───────────────────────────────────────────────────────
export const pickLists = pgTable("pick_lists", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => orders.id),
  reference_type: varchar("reference_type", { length: 50 }).notNull(), // 'sale', 'purchase_return', 'transfer'
  reference_id: integer("reference_id").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, assigned, picking, completed, cancelled
  assigned_to: integer("assigned_to").references(() => staff.id),
  priority: varchar("priority", { length: 10 }).default("normal"), // low, normal, high, urgent
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

export const pickListsRelations = relations(pickLists, ({ one, many }) => ({
  order: one(orders, {
    fields: [pickLists.order_id],
    references: [orders.id],
  }),
  assignedTo: one(staff, {
    fields: [pickLists.assigned_to],
    references: [staff.id],
  }),
  pickListItems: many(pickListItems),
}));

// ── Pick List Items (Phase 9) ────────────────────────────────────────────────
export const pickListItems = pgTable("pick_list_items", {
  id: serial("id").primaryKey(),
  pick_list_id: integer("pick_list_id").references(() => pickLists.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  batch_id: integer("batch_id").references(() => productBatches.id),
  location_id: integer("location_id").references(() => branchLocations.id),
  quantity_ordered: integer("quantity_ordered").notNull(),
  quantity_picked: integer("quantity_picked").default(0),
  status: varchar("status", { length: 20 }).default("pending"), // pending, picked, partial, missing
  picked_by: integer("picked_by").references(() => staff.id),
  picked_at: timestamp("picked_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const pickListItemsRelations = relations(pickListItems, ({ one }) => ({
  pickList: one(pickLists, {
    fields: [pickListItems.pick_list_id],
    references: [pickLists.id],
  }),
  product: one(products, {
    fields: [pickListItems.product_id],
    references: [products.id],
  }),
  batch: one(productBatches, {
    fields: [pickListItems.batch_id],
    references: [productBatches.id],
  }),
  location: one(branchLocations, {
    fields: [pickListItems.location_id],
    references: [branchLocations.id],
  }),
  pickedBy: one(staff, {
    fields: [pickListItems.picked_by],
    references: [staff.id],
  }),
}));

// ── Put Lists (Phase 9) ───────────────────────────────────────────────────────
export const putLists = pgTable("put_lists", {
  id: serial("id").primaryKey(),
  reference_type: varchar("reference_type", { length: 50 }).notNull(), // 'purchase', 'sale_return', 'damage', 'missing_stock'
  reference_id: integer("reference_id").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, assigned, putting, completed, cancelled
  assigned_to: integer("assigned_to").references(() => staff.id),
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

export const putListsRelations = relations(putLists, ({ one, many }) => ({
  assignedTo: one(staff, {
    fields: [putLists.assigned_to],
    references: [staff.id],
  }),
  putListItems: many(putListItems),
}));

// ── Put List Items (Phase 9) ────────────────────────────────────────────────
export const putListItems = pgTable("put_list_items", {
  id: serial("id").primaryKey(),
  put_list_id: integer("put_list_id").references(() => putLists.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  batch_id: integer("batch_id").references(() => productBatches.id),
  location_id: integer("location_id").references(() => branchLocations.id),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, put, partial
  put_by: integer("put_by").references(() => staff.id),
  put_at: timestamp("put_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const putListItemsRelations = relations(putListItems, ({ one }) => ({
  putList: one(putLists, {
    fields: [putListItems.put_list_id],
    references: [putLists.id],
  }),
  product: one(products, {
    fields: [putListItems.product_id],
    references: [products.id],
  }),
  batch: one(productBatches, {
    fields: [putListItems.batch_id],
    references: [productBatches.id],
  }),
  location: one(branchLocations, {
    fields: [putListItems.location_id],
    references: [branchLocations.id],
  }),
  putBy: one(staff, {
    fields: [putListItems.put_by],
    references: [staff.id],
  }),
}));

// ── Branch Damage (Phase 9) ────────────────────────────────────────────────
export const branchDamage = pgTable("branch_damage", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").references(() => branchLocations.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  batch_id: integer("batch_id").references(() => productBatches.id),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  reported_by: integer("reported_by").references(() => staff.id).notNull(),
  verified: boolean("verified").default(false),
  verified_by: integer("verified_by").references(() => staff.id),
  verified_at: timestamp("verified_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const branchDamageRelations = relations(branchDamage, ({ one }) => ({
  location: one(branchLocations, {
    fields: [branchDamage.location_id],
    references: [branchLocations.id],
  }),
  product: one(products, {
    fields: [branchDamage.product_id],
    references: [products.id],
  }),
  batch: one(productBatches, {
    fields: [branchDamage.batch_id],
    references: [productBatches.id],
  }),
  reportedBy: one(staff, {
    fields: [branchDamage.reported_by],
    references: [staff.id],
  }),
  verifiedBy: one(staff, {
    fields: [branchDamage.verified_by],
    references: [staff.id],
  }),
}));

// ── Stock Ledger Relations (Extended) ──────────────────────────────────────
export const stockLedgerRelationsExtended = relations(stockLedger, ({ one }) => ({
  product: one(products, {
    fields: [stockLedger.product_id],
    references: [products.id],
  }),
  batch: one(productBatches, {
    fields: [stockLedger.batch_id],
    references: [productBatches.id],
  }),
  branchLocation: one(branchLocations, {
    fields: [stockLedger.reference_id],
    references: [branchLocations.id],
  }),
}));

// ── Products Relations (Extended) ──────────────────────────────────────
export const productsRelationsExtended = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  productCategories: many(productCategoryMapping),
  productBarcodes: many(productBarcodes),
  productBatches: many(productBatches),
  stockLedgerEntries: many(stockLedger),
  branchDamage: many(branchDamage),
}));

// ── Pack Lists (Phase 9) ───────────────────────────────────────────────────────
export const packLists = pgTable("pack_lists", {
  id: serial("id").primaryKey(),
  pick_list_id: integer("pick_list_id").references(() => pickLists.id).notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, packed, shipped
  packed_by: integer("packed_by").references(() => staff.id),
  tracking_number: varchar("tracking_number", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  packed_at: timestamp("packed_at"),
});

export const packListsRelations = relations(packLists, ({ one }) => ({
  pickList: one(pickLists, {
    fields: [packLists.pick_list_id],
    references: [pickLists.id],
  }),
  packedBy: one(staff, {
    fields: [packLists.packed_by],
    references: [staff.id],
  }),
}));

// ── Stock Audits (Phase 10) ───────────────────────────────────────────────────────
export const stockAudits = pgTable("stock_audits", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id).notNull(),
  status: varchar("status", { length: 20 }).default("planned"), // planned, in_progress, completed, escalated
  auditor_id: integer("auditor_id").references(() => staff.id),
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

export const stockAuditsRelations = relations(stockAudits, ({ one, many }) => ({
  branch: one(branches, {
    fields: [stockAudits.branch_id],
    references: [branches.id],
  }),
  auditor: one(staff, {
    fields: [stockAudits.auditor_id],
    references: [staff.id],
  }),
  auditItems: many(stockAuditItems),
}));

// ── Stock Audit Items (Phase 10) ──────────────────────────────────────────────────
export const stockAuditItems = pgTable("stock_audit_items", {
  id: serial("id").primaryKey(),
  audit_id: integer("audit_id").references(() => stockAudits.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  location_id: integer("location_id").references(() => branchLocations.id),
  expected_qty: integer("expected_qty").notNull(),
  counted_qty: integer("counted_qty"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, match, mismatch, recounted, accepted, escalated
  created_at: timestamp("created_at").defaultNow(),
});

export const stockAuditItemsRelations = relations(stockAuditItems, ({ one, many }) => ({
  audit: one(stockAudits, {
    fields: [stockAuditItems.audit_id],
    references: [stockAudits.id],
  }),
  product: one(products, {
    fields: [stockAuditItems.product_id],
    references: [products.id],
  }),
  location: one(branchLocations, {
    fields: [stockAuditItems.location_id],
    references: [branchLocations.id],
  }),
  discrepancies: many(auditDiscrepancies),
}));

// ── Audit Discrepancies (Phase 10) ────────────────────────────────────────────────
export const auditDiscrepancies = pgTable("audit_discrepancies", {
  id: serial("id").primaryKey(),
  audit_item_id: integer("audit_item_id").references(() => stockAuditItems.id).notNull(),
  discrepancy_type: varchar("discrepancy_type", { length: 20 }).notNull(), // missing, damage, expiry, pna
  quantity: integer("quantity").notNull(),
  resolved_by: integer("resolved_by").references(() => staff.id),
  resolution_status: varchar("resolution_status", { length: 20 }).default("pending"), // pending, approved, rejected
  reason: text("reason"),
  created_at: timestamp("created_at").defaultNow(),
  resolved_at: timestamp("resolved_at"),
});

export const auditDiscrepanciesRelations = relations(auditDiscrepancies, ({ one }) => ({
  auditItem: one(stockAuditItems, {
    fields: [auditDiscrepancies.audit_item_id],
    references: [stockAuditItems.id],
  }),
  resolvedBy: one(staff, {
    fields: [auditDiscrepancies.resolved_by],
    references: [staff.id],
  }),
}));

// ── Missing Stock Queue (Phase 10) ────────────────────────────────────────────────
export const missingStockQueue = pgTable("missing_stock_queue", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  audit_id: integer("audit_id").references(() => stockAudits.id),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).default("missing"), // missing, found, written_off
  created_at: timestamp("created_at").defaultNow(),
  resolved_at: timestamp("resolved_at"),
});

export const missingStockQueueRelations = relations(missingStockQueue, ({ one }) => ({
  product: one(products, {
    fields: [missingStockQueue.product_id],
    references: [products.id],
  }),
  audit: one(stockAudits, {
    fields: [missingStockQueue.audit_id],
    references: [stockAudits.id],
  }),
}));

// ── Coupons (Phase 11) ────────────────────────────────────────────────────────────
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discount_type: varchar("discount_type", { length: 20 }).default("percentage"), // percentage, flat
  discount_value: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  min_order_value: decimal("min_order_value", { precision: 10, scale: 2 }).default("0"),
  category_id: integer("category_id").references(() => productCategories.id),
  valid_from: timestamp("valid_from"),
  valid_until: timestamp("valid_until"),
  usage_limit: integer("usage_limit"),
  usage_count: integer("usage_count").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Order Audits (Phase 11) ───────────────────────────────────────────────────────
export const orderAudits = pgTable("order_audits", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => orders.id).notNull(),
  action: varchar("action", { length: 20 }).notNull(), // edit, delete
  changed_by: integer("changed_by").references(() => staff.id),
  previous_state: jsonb("previous_state"),
  reason: text("reason"),
  created_at: timestamp("created_at").defaultNow(),
});

export const orderAuditsRelations = relations(orderAudits, ({ one }) => ({
  order: one(orders, {
    fields: [orderAudits.order_id],
    references: [orders.id],
  }),
  changedBy: one(staff, {
    fields: [orderAudits.changed_by],
    references: [staff.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [coupons.category_id],
    references: [productCategories.id],
  }),
  orders: many(orders),
}));

// ── Balance Snapshots (Phase 12) ──────────────────────────────────────────────────
export const balanceSnapshots = pgTable("balance_snapshots", {
  id: serial("id").primaryKey(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  closing_balance: decimal("closing_balance", { precision: 12, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Customer Ledger (Phase 13) ──────────────────────────────────────────────────
export const customerLedger = pgTable("customer_ledger", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").references(() => customers.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'points', 'credit'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // positive or negative
  reason: text("reason").notNull(),
  reference_id: integer("reference_id"), // e.g. order_id or return_id
  created_by: integer("created_by").references(() => staff.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const customerLedgerRelations = relations(customerLedger, ({ one }) => ({
  customer: one(customers, {
    fields: [customerLedger.customer_id],
    references: [customers.id],
  }),
}));

// ── Purchase Returns (Phase 14) ──────────────────────────────────────────────────
export const purchaseReturns = pgTable("purchase_returns", {
  branch_id: integer("branch_id").references(() => branches.id),
  id: serial("id").primaryKey(),
  purchase_id: integer("purchase_id").references(() => purchases.id).notNull(),
  supplier_id: integer("supplier_id").references(() => suppliers.id).notNull(),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, processed, cancelled
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const purchaseReturnItems = pgTable("purchase_return_items", {
  id: serial("id").primaryKey(),
  return_id: integer("return_id").references(() => purchaseReturns.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  batch_id: integer("batch_id").references(() => productBatches.id),
  quantity: integer("quantity").notNull(),
  refund_amount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const purchaseReturnsRelations = relations(purchaseReturns, ({ one, many }) => ({
  purchase: one(purchases, {
    fields: [purchaseReturns.purchase_id],
    references: [purchases.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseReturns.supplier_id],
    references: [suppliers.id],
  }),
  returnItems: many(purchaseReturnItems),
}));

export const purchaseReturnItemsRelations = relations(purchaseReturnItems, ({ one }) => ({
  purchaseReturn: one(purchaseReturns, {
    fields: [purchaseReturnItems.return_id],
    references: [purchaseReturns.id],
  }),
  product: one(products, {
    fields: [purchaseReturnItems.product_id],
    references: [products.id],
  }),
  batch: one(productBatches, {
    fields: [purchaseReturnItems.batch_id],
    references: [productBatches.id],
  }),
}));

// ── Sync Engine ─────────────────────────────────────────────────────────────
export const pendingSync = pgTable("pending_sync", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID idempotency key
  branch_id: integer("branch_id").references(() => branches.id),
  operation_type: varchar("operation_type", { length: 50 }).notNull(), // e.g. "CREATE_ORDER", "UPDATE_CUSTOMER"
  entity_type: varchar("entity_type", { length: 50 }).notNull(), // e.g. "order", "customer"
  entity_id: integer("entity_id"), // Local ID reference (optional if purely based on payload)
  payload: jsonb("payload").notNull(), // The complete JSON representation of the mutated entity
  status: varchar("status", { length: 20 }).default("pending"), // pending, synced, failed
  retry_count: integer("retry_count").default(0),
  last_error: text("last_error"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ── App Settings ────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id), // null = Global Setting
  key: varchar("key", { length: 100 }).notNull(), // e.g. "business_name", "invoice_prefix"
  value: jsonb("value").notNull(), 
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ── Staff Attendance ────────────────────────────────────────────────────────
export const staffAttendance = pgTable("staff_attendance", {
  id: serial("id").primaryKey(),
  staff_id: integer("staff_id").references(() => staff.id).notNull(),
  branch_id: integer("branch_id").references(() => branches.id),
  date: date("date").notNull(), // YYYY-MM-DD
  clock_in_time: timestamp("clock_in_time").notNull(),
  clock_out_time: timestamp("clock_out_time"),
  shift_status: varchar("shift_status", { length: 20 }).default("active"), // active, completed
  work_type: varchar("work_type", { length: 50 }).default("regular"), // regular, overtime
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const staffAttendanceRelations = relations(staffAttendance, ({ one }) => ({
  staff: one(staff, {
    fields: [staffAttendance.staff_id],
    references: [staff.id],
  }),
}));

// ── Payroll ─────────────────────────────────────────────────────────────
export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  staff_id: integer("staff_id").references(() => staff.id).notNull(),
  branch_id: integer("branch_id").references(() => branches.id),
  month: varchar("month", { length: 7 }).notNull(), // Format: YYYY-MM
  
  // Earnings
  base_salary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  overtime_pay: decimal("overtime_pay", { precision: 10, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 10, scale: 2 }).default("0"),
  
  // Deductions
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  advance_deduction: decimal("advance_deduction", { precision: 10, scale: 2 }).default("0"),
  
  // Totals
  net_payable: decimal("net_payable", { precision: 10, scale: 2 }).notNull(),
  
  status: varchar("status", { length: 20 }).default("draft"), // draft, approved, paid
  payment_date: timestamp("payment_date"),
  payment_method_id: integer("payment_method_id").references(() => paymentMethods.id),
  
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const payrollRelations = relations(payroll, ({ one }) => ({
  staff: one(staff, {
    fields: [payroll.staff_id],
    references: [staff.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [payroll.payment_method_id],
    references: [paymentMethods.id],
  }),
}));

// ── Loyalty History ────────────────────────────────────────────────────────
export const loyaltyHistory = pgTable("loyalty_history", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").references(() => customers.id).notNull(),
  branch_id: integer("branch_id").references(() => branches.id),
  points_change: integer("points_change").notNull(), // positive = earned, negative = redeemed
  reason: varchar("reason", { length: 255 }),        // "Purchase #1234", "Redemption -50pts"
  reference_id: varchar("reference_id", { length: 100 }), // order ID or payroll ID
  created_at: timestamp("created_at").defaultNow(),
});

export const loyaltyHistoryRelations = relations(loyaltyHistory, ({ one }) => ({
  customer: one(customers, {
    fields: [loyaltyHistory.customer_id],
    references: [customers.id],
  }),
}));



// ── Campaigns (Phase 26) ──────────────────────────────────────────────────
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).default("discount"), // discount, announcement
  status: varchar("status", { length: 50 }).default("draft"), // draft, scheduled, active, completed
  target_segment: jsonb("target_segment"), // e.g. { "tier": "gold", "min_spent": 5000 }
  coupon_id: integer("coupon_id").references(() => coupons.id),
  channel: varchar("channel", { length: 50 }).default("in_app"), // whatsapp, sms, in_app, email
  message_template: text("message_template"),
  scheduled_at: timestamp("scheduled_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  coupon: one(coupons, {
    fields: [campaigns.coupon_id],
    references: [coupons.id],
  }),
  audiences: many(campaignAudiences),
}));

export const campaignAudiences = pgTable("campaign_audiences", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").references(() => campaigns.id).notNull(),
  customer_id: integer("customer_id").references(() => customers.id).notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, sent, failed, opened
  error_log: text("error_log"),
  created_at: timestamp("created_at").defaultNow(),
});

export const campaignAudiencesRelations = relations(campaignAudiences, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignAudiences.campaign_id],
    references: [campaigns.id],
  }),
  customer: one(customers, {
    fields: [campaignAudiences.customer_id],
    references: [customers.id],
  }),
}));

// ── Product Conversions (Phase 27) ─────────────────────────────────────────
export const productConversions = pgTable("product_conversions", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id),
  pack_product_id: integer("pack_product_id").references(() => products.id).notNull(),
  loose_product_id: integer("loose_product_id").references(() => products.id).notNull(),
  packs_converted: integer("packs_converted").notNull(),
  loose_yielded: integer("loose_yielded").notNull(),
  converted_by: integer("converted_by").references(() => staff.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const productConversionsRelations = relations(productConversions, ({ one }) => ({
  packProduct: one(products, {
    fields: [productConversions.pack_product_id],
    references: [products.id],
  }),
  looseProduct: one(products, {
    fields: [productConversions.loose_product_id],
    references: [products.id],
  }),
  convertedBy: one(staff, {
    fields: [productConversions.converted_by],
    references: [staff.id],
  }),
}));




export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").references(() => customers.id),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
});
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").references(() => chatSessions.id),
  sender: varchar("sender", { length: 20 }),
  content: text("content"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  customer: one(customers, { fields: [chatSessions.customer_id], references: [customers.id] }),
  messages: many(chatMessages),
}));
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, { fields: [chatMessages.session_id], references: [chatSessions.id] }),
}));

// ── Accounting (Phase 38) ──────────────────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id),
  account_code: varchar("account_code", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  account_type: varchar("account_type", { length: 50 }).notNull(), // asset, liability, equity, revenue, expense
  balance_type: varchar("balance_type", { length: 10 }).notNull(), // debit, credit
  parent_id: integer("parent_id"), // recursive for sub-accounts
  is_group: boolean("is_group").default(false),
  created_at: timestamp("created_at").defaultNow(),
});
export const financialYears = pgTable("financial_years", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  is_closed: boolean("is_closed").default(false),
  created_at: timestamp("created_at").defaultNow(),
});
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id),
  entry_number: varchar("entry_number", { length: 50 }).unique().notNull(),
  entry_date: timestamp("entry_date").notNull().defaultNow(),
  reference_type: varchar("reference_type", { length: 50 }),
  reference_id: integer("reference_id"),
  narration: text("narration"),
  status: varchar("status", { length: 20 }).default("posted"), // draft, posted, cancelled
  created_at: timestamp("created_at").defaultNow(),
});
export const journalEntryLines = pgTable("journal_entry_lines", {
  id: serial("id").primaryKey(),
  journal_entry_id: integer("journal_entry_id").references(() => journalEntries.id).notNull(),
  account_id: integer("account_id").references(() => accounts.id).notNull(),
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0"),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0"),
  narration: text("narration"),
});
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  parent: one(accounts, { fields: [accounts.parent_id], references: [accounts.id] }),
  children: many(accounts),
}));
export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  lines: many(journalEntryLines),
}));
export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  entry: one(journalEntries, { fields: [journalEntryLines.journal_entry_id], references: [journalEntries.id] }),
  account: one(accounts, { fields: [journalEntryLines.account_id], references: [accounts.id] }),
}));

export const importJobs = pgTable("import_jobs", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id),
  entity_type: varchar("entity_type", { length: 50 }).notNull(), // 'product', 'customer', etc.
  status: varchar("status", { length: 20 }).default("pending"), // pending, validating, importing, completed, failed
  total_rows: integer("total_rows").default(0),
  processed_rows: integer("processed_rows").default(0),
  error_count: integer("error_count").default(0),
  file_name: varchar("file_name", { length: 255 }),
  error_log: jsonb("error_log"), // array of { row: number, error: string }
  created_by: varchar("created_by", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

// ── System Monitoring (Phase 41) ───────────────────────────────────────────────

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  cpu_usage: decimal("cpu_usage", { precision: 5, scale: 2 }),
  memory_used_mb: integer("memory_used_mb"),
  memory_total_mb: integer("memory_total_mb"),
  db_size_mb: decimal("db_size_mb", { precision: 10, scale: 2 }),
  db_connection_count: integer("db_connection_count"),
  db_slow_query_count: integer("db_slow_query_count").default(0),
  api_requests_per_min: integer("api_requests_per_min").default(0),
  api_avg_response_ms: integer("api_avg_response_ms"),
  api_error_count: integer("api_error_count").default(0),
  notification_queue_pending: integer("notification_queue_pending").default(0),
  import_jobs_pending: integer("import_jobs_pending").default(0),
  storage_used_mb: decimal("storage_used_mb", { precision: 10, scale: 2 }),
  offline_sync_pending: integer("offline_sync_pending").default(0),
  recorded_at: timestamp("recorded_at").defaultNow().notNull(),
});

export const eventLogs = pgTable("event_logs", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id),
  user_id: varchar("user_id", { length: 255 }),
  severity: varchar("severity", { length: 20 }).default("info").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  event: varchar("event", { length: 255 }).notNull(),
  message: text("message"),
  metadata: jsonb("metadata"),
  duration_ms: integer("duration_ms"),
  status_code: integer("status_code"),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const loginHistory = pgTable("login_history", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id", { length: 255 }).notNull(),
  user_email: varchar("user_email", { length: 255 }),
  status: varchar("status", { length: 20 }).default("success"),
  ip_address: varchar("ip_address", { length: 45 }),
  device_type: varchar("device_type", { length: 50 }),
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  location: varchar("location", { length: 255 }),
  failure_reason: text("failure_reason"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const branchHealthSnapshots = pgTable("branch_health_snapshots", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id).notNull(),
  is_online: boolean("is_online").default(true),
  last_seen_at: timestamp("last_seen_at").defaultNow(),
  pending_sync_items: integer("pending_sync_items").default(0),
  last_sync_at: timestamp("last_sync_at"),
  sync_error: text("sync_error"),
  active_devices: integer("active_devices").default(0),
  offline_devices: integer("offline_devices").default(0),
  low_stock_count: integer("low_stock_count").default(0),
  expiry_alert_count: integer("expiry_alert_count").default(0),
  recorded_at: timestamp("recorded_at").defaultNow().notNull(),
});

export const branchHealthRelations = relations(branchHealthSnapshots, ({ one }) => ({
  branch: one(branches, {
    fields: [branchHealthSnapshots.branch_id],
    references: [branches.id],
  }),
}));

// ── Role Permissions (Phase 43) ─────────────────────────────────────────────
// Granular domain × action grants per role name.
// Seeded on first run; editable by admin at runtime.
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  /** Role name: admin | manager | auditor | putter | picker | biller | sales_person */
  role_name: varchar("role_name", { length: 50 }).notNull(),
  /** Permission domain: pos | inventory | purchases | suppliers | customers | products |
   *  staff | reports | accounting | settings | backups | monitoring | branches |
   *  payroll | marketing | warehouse | notifications | imports | loyalty */
  domain: varchar("domain", { length: 50 }).notNull(),
  /** Action: read | write | delete | approve */
  action: varchar("action", { length: 20 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Password Reset Tokens ────────────────────────────────────────────────────
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  token_hash: text("token_hash").notNull().unique(), // SHA-256 of the raw token
  expires_at: timestamp("expires_at").notNull(),
  used_at: timestamp("used_at"),
  created_at: timestamp("created_at").defaultNow(),
});
