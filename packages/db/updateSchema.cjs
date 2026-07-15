const fs = require('fs');

const file = 'd:/Evaluna ERP-main/packages/db/src/schema.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Rename warehouses to branches
content = content.replace(/warehouses/g, 'branches');
content = content.replace(/warehouse_id/g, 'branch_id');
content = content.replace(/warehouse/g, 'branch');
content = content.replace(/Warehouse/g, 'Branch');

// 2. Add is_headquarters, code, phone, email to branches
content = content.replace(
  /export const branches = pgTable\("branches", \{([^}]+)\}\);/g,
  `export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  manager_id: integer("manager_id").references(() => staff.id),
  is_headquarters: boolean("is_headquarters").default(false),
  created_at: timestamp("created_at").defaultNow(),
});`
);

// 3. Remove in_stock from products
content = content.replace(/in_stock: integer\("in_stock"\)\.notNull\(\)\.default\(0\),\n\s*/g, '');

// 4. Add branch_inventory table
const branchInventoryStr = `
export const branchInventory = pgTable("branch_inventory", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  in_stock: integer("in_stock").notNull().default(0),
  reorder_level: integer("reorder_level").notNull().default(10),
  created_at: timestamp("created_at").defaultNow(),
});

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
`;
content = content.replace(/export const productsRelations = relations\(products, \(\{ many \}\) => \(\{/, branchInventoryStr + '\nexport const productsRelations = relations(products, ({ many }) => ({');

// 5. Add branch_id to transactions, orders, purchases, purchaseReturns, expenses, staff, stockLedger, customers
function addBranchId(tableName, text) {
  const regex = new RegExp(`export const ${tableName} = pgTable\\("${tableName}", \\{`);
  return text.replace(regex, `export const ${tableName} = pgTable("${tableName}", {\n  branch_id: integer("branch_id").references(() => branches.id),`);
}

function addBranchIdToTable(varName, tableName, text) {
  const regex = new RegExp(`export const ${varName} = pgTable\\("${tableName}", \\{`);
  return text.replace(regex, `export const ${varName} = pgTable("${tableName}", {\n  branch_id: integer("branch_id").references(() => branches.id),`);
}

content = addBranchId('orders', content);
content = addBranchId('transactions', content);
content = addBranchId('purchases', content);
content = addBranchId('expenses', content);
content = addBranchId('staff', content);
content = addBranchId('customers', content);
content = addBranchIdToTable('purchaseReturns', 'purchase_returns', content);
content = addBranchIdToTable('stockLedger', 'stock_ledger', content);

fs.writeFileSync(file, content);
console.log('Schema updated successfully!');
