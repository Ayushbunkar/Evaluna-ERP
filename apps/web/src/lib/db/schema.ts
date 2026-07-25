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
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
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
  in_stock: integer("in_stock").notNull().default(0),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }),
  hsn: varchar("hsn", { length: 8 }),
  taxable: boolean("taxable").default(true),
  barcode: varchar("barcode", { length: 255 }),
  sku: varchar("sku", { length: 255 }),
  unit: varchar("unit", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Customers ───────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  gst_number: varchar("gst_number", { length: 15 }),
  pan_number: varchar("pan_number", { length: 10 }),
  credit_limit: decimal("credit_limit", { precision: 10, scale: 2 }).default("0"),
  payment_terms: integer("payment_terms").default(30),
  customer_type: varchar("customer_type", { length: 20 }).default("retail"),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Orders ──────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").references(() => customers.id),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  cgst_amount: decimal("cgst_amount", { precision: 10, scale: 2 }).default("0"),
  sgst_amount: decimal("sgst_amount", { precision: 10, scale: 2 }).default("0"),
  igst_amount: decimal("igst_amount", { precision: 10, scale: 2 }).default("0"),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  payment_method_id: integer("payment_method_id").references(() => paymentMethods.id),
  e_way_bill_no: varchar("e_way_bill_no", { length: 50 }),
  gst_breakdown: jsonb("gst_breakdown"),
  created_at: timestamp("created_at").defaultNow(),
});

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
  id: serial("id").primaryKey(),
  description: text("description"),
  order_id: integer("order_id").references(() => orders.id),
  payment_method_id: integer("payment_method_id").references(() => paymentMethods.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }),
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 20 }),
  created_at: timestamp("created_at").defaultNow(),
});

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
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  gst_number: varchar("gst_number", { length: 15 }),
  pan_number: varchar("pan_number", { length: 10 }),
  supplier_category: varchar("supplier_category", { length: 20 }).default("local"),
  created_at: timestamp("created_at").defaultNow(),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}));

// ── Staff ─────────────────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
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

// ── Warehouses ────────────────────────────────────────────────────────────────
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  address: text("address"),
  contact: varchar("contact", { length: 20 }),
  manager_id: integer("manager_id").references(() => staff.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  stockTransfersFrom: many(stockTransfers),
  stockTransfersTo: many(stockTransfers),
}));

// ── Stock Transfers ───────────────────────────────────────────────────────────
export const stockTransfers = pgTable("stock_transfers", {
  id: serial("id").primaryKey(),
  from_warehouse_id: integer("from_warehouse_id").references(() => warehouses.id).notNull(),
  to_warehouse_id: integer("to_warehouse_id").references(() => warehouses.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  created_at: timestamp("created_at").defaultNow(),
});

export const stockTransfersRelations = relations(stockTransfers, ({ one }) => ({
  fromWarehouse: one(warehouses, {
    fields: [stockTransfers.from_warehouse_id],
    references: [warehouses.id],
  }),
  toWarehouse: one(warehouses, {
    fields: [stockTransfers.to_warehouse_id],
    references: [warehouses.id],
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

// ── Notifications ──────────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => staff.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: varchar("type", { length: 20 }).default("info"),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(staff, {
    fields: [notifications.user_id],
    references: [staff.id],
  }),
}));

// ── Purchases ─────────────────────────────────────────────────────────────────
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  supplier_id: integer("supplier_id").references(() => suppliers.id).notNull(),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  cgst_amount: decimal("cgst_amount", { precision: 10, scale: 2 }).default("0"),
  sgst_amount: decimal("sgst_amount", { precision: 10, scale: 2 }).default("0"),
  igst_amount: decimal("igst_amount", { precision: 10, scale: 2 }).default("0"),
  user_uid: varchar("user_uid", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
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
  warehouse_id: integer("warehouse_id").references(() => warehouses.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const productBatchesRelations = relations(productBatches, ({ one, many }) => ({
  product: one(products, {
    fields: [productBatches.product_id],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [productBatches.warehouse_id],
    references: [warehouses.id],
  }),
  stockLedgerEntries: many(stockLedger),
}));

// ── Stock Ledger (Phase 8 - FIFO) ──────────────────────────────────────────────
export const stockLedger = pgTable("stock_ledger", {
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

// ── Warehouse Locations (Phase 9) ──────────────────────────────────────────────
export const warehouseLocations = pgTable("warehouse_locations", {
  id: serial("id").primaryKey(),
  warehouse_id: integer("warehouse_id").references(() => warehouses.id).notNull(),
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

export const warehouseLocationsRelations = relations(warehouseLocations, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseLocations.warehouse_id],
    references: [warehouses.id],
  }),
  locationBarcodes: many(locationBarcodes),
  batchStock: many(batchStock),
}));

// ── Location Barcodes (Phase 9) ──────────────────────────────────────────────
export const locationBarcodes = pgTable("location_barcodes", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").references(() => warehouseLocations.id).notNull(),
  barcode: varchar("barcode", { length: 50 }).notNull().unique(),
  barcode_type: varchar("barcode_type", { length: 20 }).default("QR"),
  is_primary: boolean("is_primary").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const locationBarcodesRelations = relations(locationBarcodes, ({ one }) => ({
  location: one(warehouseLocations, {
    fields: [locationBarcodes.location_id],
    references: [warehouseLocations.id],
  }),
}));

// ── Batch Stock (Phase 9 - Location-based stock) ────────────────────────────────
export const batchStock = pgTable("batch_stock", {
  id: serial("id").primaryKey(),
  batch_id: integer("batch_id").references(() => productBatches.id).notNull(),
  location_id: integer("location_id").references(() => warehouseLocations.id).notNull(),
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
  location: one(warehouseLocations, {
    fields: [batchStock.location_id],
    references: [warehouseLocations.id],
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
  location_id: integer("location_id").references(() => warehouseLocations.id),
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
  location: one(warehouseLocations, {
    fields: [pickListItems.location_id],
    references: [warehouseLocations.id],
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
  location_id: integer("location_id").references(() => warehouseLocations.id),
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
  location: one(warehouseLocations, {
    fields: [putListItems.location_id],
    references: [warehouseLocations.id],
  }),
  putBy: one(staff, {
    fields: [putListItems.put_by],
    references: [staff.id],
  }),
}));

// ── Warehouse Damage (Phase 9) ────────────────────────────────────────────────
export const warehouseDamage = pgTable("warehouse_damage", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").references(() => warehouseLocations.id).notNull(),
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

export const warehouseDamageRelations = relations(warehouseDamage, ({ one }) => ({
  location: one(warehouseLocations, {
    fields: [warehouseDamage.location_id],
    references: [warehouseLocations.id],
  }),
  product: one(products, {
    fields: [warehouseDamage.product_id],
    references: [products.id],
  }),
  batch: one(productBatches, {
    fields: [warehouseDamage.batch_id],
    references: [productBatches.id],
  }),
  reportedBy: one(staff, {
    fields: [warehouseDamage.reported_by],
    references: [staff.id],
  }),
  verifiedBy: one(staff, {
    fields: [warehouseDamage.verified_by],
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
  warehouseLocation: one(warehouseLocations, {
    fields: [stockLedger.reference_id],
    references: [warehouseLocations.id],
  }),
}));

// ── Products Relations (Extended) ──────────────────────────────────────
export const productsRelationsExtended = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  productCategories: many(productCategoryMapping),
  productBarcodes: many(productBarcodes),
  productBatches: many(productBatches),
  stockLedgerEntries: many(stockLedger),
  warehouseDamage: many(warehouseDamage),
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
  warehouse_id: integer("warehouse_id").references(() => warehouses.id).notNull(),
  status: varchar("status", { length: 20 }).default("planned"), // planned, in_progress, completed, escalated
  auditor_id: integer("auditor_id").references(() => staff.id),
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

export const stockAuditsRelations = relations(stockAudits, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [stockAudits.warehouse_id],
    references: [warehouses.id],
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
  location_id: integer("location_id").references(() => warehouseLocations.id),
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
  location: one(warehouseLocations, {
    fields: [stockAuditItems.location_id],
    references: [warehouseLocations.id],
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
