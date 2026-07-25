-- Phase 7: Product Master, Categories, and Barcode Foundation
-- Phase 8: Inventory Engine with FIFO, Batches, and Stock Valuation
-- Phase 9: Warehouse Operations: Putting, Locations, Pick, Pack

-- ============================================
-- Phase 7: Product Categories
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id INTEGER REFERENCES product_categories(id),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_category_mapping (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  category_id INTEGER REFERENCES product_categories(id) NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_category_mapping_product ON product_category_mapping(product_id);
CREATE INDEX idx_product_category_mapping_category ON product_category_mapping(category_id);

-- ============================================
-- Phase 7: Product Barcodes
-- ============================================
CREATE TABLE IF NOT EXISTS product_barcodes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  barcode VARCHAR(50) NOT NULL,
  barcode_type VARCHAR(20) DEFAULT 'EAN-13',
  is_weighted BOOLEAN DEFAULT false,
  weight_per_unit DECIMAL(10, 3),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_barcodes_product ON product_barcodes(product_id);
CREATE INDEX idx_product_barcodes_barcode ON product_barcodes(barcode);

-- ============================================
-- Phase 7: Product Batches
-- ============================================
CREATE TABLE IF NOT EXISTS product_batches (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  batch_number VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  mrp DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  expiry_date TIMESTAMP,
  manufacture_date TIMESTAMP,
  location VARCHAR(50),
  warehouse_id INTEGER REFERENCES warehouses(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_batches_product ON product_batches(product_id);
CREATE INDEX idx_product_batches_batch_number ON product_batches(batch_number);
CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date) WHERE expiry_date IS NOT NULL;

-- ============================================
-- Phase 8: Stock Ledger (FIFO)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_ledger (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  batch_id INTEGER REFERENCES product_batches(id),
  transaction_type VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  reference_id INTEGER,
  reference_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stock_ledger_product ON stock_ledger(product_id);
CREATE INDEX idx_stock_ledger_batch ON stock_ledger(batch_id);
CREATE INDEX idx_stock_ledger_transaction ON stock_ledger(transaction_type);
CREATE INDEX idx_stock_ledger_date ON stock_ledger(created_at);

-- ============================================
-- Phase 9: Warehouse Locations
-- ============================================
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER REFERENCES warehouses(id) NOT NULL,
  name VARCHAR(50) NOT NULL,
  section VARCHAR(20),
  aisle VARCHAR(20),
  shelf VARCHAR(20),
  level VARCHAR(10),
  location_type VARCHAR(20) DEFAULT 'storage',
  capacity INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_warehouse_locations_warehouse ON warehouse_locations(warehouse_id);
CREATE INDEX idx_warehouse_locations_name ON warehouse_locations(name);

-- ============================================
-- Phase 9: Location Barcodes
-- ============================================
CREATE TABLE IF NOT EXISTS location_barcodes (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES warehouse_locations(id) NOT NULL,
  barcode VARCHAR(50) NOT NULL UNIQUE,
  barcode_type VARCHAR(20) DEFAULT 'QR',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_location_barcodes_location ON location_barcodes(location_id);
CREATE INDEX idx_location_barcodes_barcode ON location_barcodes(barcode);

-- ============================================
-- Phase 9: Batch Stock (Location-based)
-- ============================================
CREATE TABLE IF NOT EXISTS batch_stock (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES product_batches(id) NOT NULL,
  location_id INTEGER REFERENCES warehouse_locations(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  max_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_batch_stock_batch ON batch_stock(batch_id);
CREATE INDEX idx_batch_stock_location ON batch_stock(location_id);

-- ============================================
-- Phase 9: Pick Lists
-- ============================================
CREATE TABLE IF NOT EXISTS pick_lists (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  reference_type VARCHAR(50) NOT NULL,
  reference_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  assigned_to INTEGER REFERENCES staff(id),
  priority VARCHAR(10) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_pick_lists_order ON pick_lists(order_id);
CREATE INDEX idx_pick_lists_status ON pick_lists(status);
CREATE INDEX idx_pick_lists_assigned_to ON pick_lists(assigned_to);

-- ============================================
-- Phase 9: Pick List Items
-- ============================================
CREATE TABLE IF NOT EXISTS pick_list_items (
  id SERIAL PRIMARY KEY,
  pick_list_id INTEGER REFERENCES pick_lists(id) NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  batch_id INTEGER REFERENCES product_batches(id),
  location_id INTEGER REFERENCES warehouse_locations(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_picked INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  picked_by INTEGER REFERENCES staff(id),
  picked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pick_list_items_pick_list ON pick_list_items(pick_list_id);
CREATE INDEX idx_pick_list_items_product ON pick_list_items(product_id);
CREATE INDEX idx_pick_list_items_status ON pick_list_items(status);

-- ============================================
-- Phase 9: Put Lists
-- ============================================
CREATE TABLE IF NOT EXISTS put_lists (
  id SERIAL PRIMARY KEY,
  reference_type VARCHAR(50) NOT NULL,
  reference_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  assigned_to INTEGER REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_put_lists_status ON put_lists(status);
CREATE INDEX idx_put_lists_assigned_to ON put_lists(assigned_to);

-- ============================================
-- Phase 9: Put List Items
-- ============================================
CREATE TABLE IF NOT EXISTS put_list_items (
  id SERIAL PRIMARY KEY,
  put_list_id INTEGER REFERENCES put_lists(id) NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  batch_id INTEGER REFERENCES product_batches(id),
  location_id INTEGER REFERENCES warehouse_locations(id),
  quantity INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  put_by INTEGER REFERENCES staff(id),
  put_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_put_list_items_put_list ON put_list_items(put_list_id);
CREATE INDEX idx_put_list_items_product ON put_list_items(product_id);
CREATE INDEX idx_put_list_items_status ON put_list_items(status);

-- ============================================
-- Phase 9: Warehouse Damage
-- ============================================
CREATE TABLE IF NOT EXISTS warehouse_damage (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES warehouse_locations(id) NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  batch_id INTEGER REFERENCES product_batches(id),
  quantity INTEGER NOT NULL,
  reason TEXT,
  reported_by INTEGER REFERENCES staff(id) NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_by INTEGER REFERENCES staff(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_warehouse_damage_location ON warehouse_damage(location_id);
CREATE INDEX idx_warehouse_damage_product ON warehouse_damage(product_id);
CREATE INDEX idx_warehouse_damage_reported_by ON warehouse_damage(reported_by);

-- ============================================
-- Phase 7: Update Products Table
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS opening_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_weighted BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_per_unit DECIMAL(10, 3);

-- ============================================
-- Phase 8: Update Products Table
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP;

-- ============================================
-- Phase 9: Update Stock Transfers Table
-- ============================================
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS from_location_id INTEGER REFERENCES warehouse_locations(id);
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS to_location_id INTEGER REFERENCES warehouse_locations(id);
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS pick_list_id INTEGER REFERENCES pick_lists(id);
ALTER TABLE stock_transfers ADD COLUMN IF NOT EXISTS put_list_id INTEGER REFERENCES put_lists(id);

-- ============================================
-- Phase 9: Update Orders Table
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pick_list_id INTEGER REFERENCES pick_lists(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS put_list_id INTEGER REFERENCES put_lists(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES warehouses(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES warehouse_locations(id);

-- ============================================
-- Phase 9: Update Staff Table
-- ============================================
ALTER TABLE staff ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) UNIQUE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS join_date TIMESTAMP;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary DECIMAL(10, 2);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pf_number VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pan VARCHAR(10);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS aadhaar VARCHAR(12);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS ifsc VARCHAR(11);

-- ============================================
-- Phase 9: Update Warehouses Table
-- ============================================
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES staff(id);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS contact VARCHAR(20);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address TEXT;

-- ============================================
-- Phase 9: Update Product Batches Table
-- ============================================
ALTER TABLE product_batches ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES warehouses(id);

-- ============================================
-- Phase 9: Update Stock Ledger Table
-- ============================================
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS warehouse_location_id INTEGER REFERENCES warehouse_locations(id);

-- ============================================
-- Phase 9: Update Pick List Items Table
-- ============================================
ALTER TABLE pick_list_items ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES warehouse_locations(id);

-- ============================================
-- Phase 9: Update Put List Items Table
-- ============================================
ALTER TABLE put_list_items ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES warehouse_locations(id);

-- ============================================
-- Phase 9: Update Warehouse Damage Table
-- ============================================
ALTER TABLE warehouse_damage ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES warehouse_locations(id);