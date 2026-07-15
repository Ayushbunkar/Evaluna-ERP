# Phase 7 — Product Master, Categories, and Barcode Foundation

## Before Implementation Analysis

### Current Product System

#### What Exists:
1. **Database Schema** (`packages/db/src/schema.ts`):
   - `products` table with basic fields: id, name, description, price, in_stock, user_uid, category, hsn, taxable, barcode, sku, unit, created_at
   - `stock_adjustments` table for stock tracking
   - `warehouses` table for warehouse management
   - `stock_transfers` table for inter-warehouse transfers

2. **API Endpoints** (`packages/api/src/products/`):
   - `products.list` - GET all products (public procedure)
   - Missing: create, update, delete, search, by-id

3. **UI Components** (`apps/web/src/app/admin/products/`):
   - Product list page
   - Product form (basic)
   - Missing: category management, barcode scanner, batch management

4. **Validation** (`apps/web/src/lib/validation/product.ts`):
   - Basic product schema exists

### What Must Be Extended:

#### 1. Product Master
- Add MRP (Maximum Retail Price)
- Add Selling Price
- Add Purchase Price
- Add Opening Stock
- Add Low Stock Threshold
- Add Batch Number Support
- Add Location and Location Category
- Add Weighted Barcode Support

#### 2. Category Management
- Create `product_categories` table
- Support hierarchical categories (parent-child)
- Add category metadata (description, image, slug)

#### 3. Barcode Support
- Add barcode scanning support
- Add barcode generation
- Add weighted barcode support (price per unit weight)
- Add multiple barcode support per product

### Data Model Changes

#### Products Table Extensions:
```sql
ALTER TABLE products ADD COLUMN mrp DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN selling_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN purchase_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN opening_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN batch_number VARCHAR(50);
ALTER TABLE products ADD COLUMN expiry_date TIMESTAMP;
ALTER TABLE products ADD COLUMN location VARCHAR(50);
ALTER TABLE products ADD COLUMN location_category VARCHAR(50);
ALTER TABLE products ADD COLUMN is_weighted BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN weight_per_unit DECIMAL(10, 3);
```

#### New Tables:
```sql
-- Product Categories (Hierarchical)
CREATE TABLE product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  parent_id INTEGER REFERENCES product_categories(id),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Category Mapping (Many-to-Many)
CREATE TABLE product_category_mapping (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  category_id INTEGER REFERENCES product_categories(id) NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Barcodes (Multiple barcodes per product)
CREATE TABLE product_barcodes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  barcode VARCHAR(50) NOT NULL UNIQUE,
  barcode_type VARCHAR(20) DEFAULT 'EAN-13',
  is_weighted BOOLEAN DEFAULT false,
  weight_per_unit DECIMAL(10, 3),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Batches (Batch/lot tracking)
CREATE TABLE product_batches (
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

-- Stock Ledger (FIFO tracking)
CREATE TABLE stock_ledger (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  batch_id INTEGER REFERENCES product_batches(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment', 'transfer'
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_value DECIMAL(10, 2) NOT NULL,
  reference_id INTEGER, -- order_id, purchase_id, adjustment_id
  reference_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Changes

#### New Product API Endpoints:
```
POST   /api/products/create
POST   /api/products/update/:id
POST   /api/products/delete/:id
GET    /api/products/list
GET    /api/products/by-id/:id
GET    /api/products/search?query=&category=&price_min=&price_max=
GET    /api/products/by-barcode/:barcode
GET    /api/products/low-stock
POST   /api/products/batch/add
POST   /api/products/batch/remove
GET    /api/products/batch/ledger/:productId
```

#### New Category API Endpoints:
```
POST   /api/categories/create
POST   /api/categories/update/:id
POST   /api/categories/delete/:id
GET    /api/categories/list
GET    /api/categories/tree
GET    /api/categories/by-slug/:slug
```

#### New Barcode API Endpoints:
```
POST   /api/barcodes/generate
GET    /api/barcodes/validate/:barcode
POST   /api/barcodes/add-to-product/:productId
DELETE /api/barcodes/remove/:barcodeId
```

### UI Changes

#### Product Form:
- Add MRP field
- Add Selling Price field
- Add Purchase Price field
- Add Opening Stock field
- Add Low Stock Threshold field
- Add Batch Number field
- Add Expiry Date picker
- Add Location field
- Add Location Category field
- Add Weighted toggle
- Add Weight per Unit field
- Add Multiple Barcode input
- Add Category selector (multi-select)

#### Category Management:
- Create category list page
- Create category form page
- Add hierarchical category tree view
- Add category drag-and-drop reordering

#### Barcode Scanner:
- Add barcode scanner UI component
- Add barcode scanning input field in POS
- Add barcode validation
- Add barcode generation preview

#### Batch Management:
- Create batch list page per product
- Create batch form page
- Add batch ledger view
- Add batch expiry alerts

### Offline Implications

1. **Barcode Scanning**: Must work offline - store scanned barcodes locally
2. **Product Search**: Must work offline - use indexedDB for search
3. **Stock Updates**: Must queue offline changes and sync when online
4. **Batch Tracking**: Must track batch movements offline

---

## Implementation Plan

### Week 1: Database & API
- [ ] Create product_categories table
- [ ] Create product_category_mapping table
- [ ] Create product_barcodes table
- [ ] Create product_batches table
- [ ] Create stock_ledger table
- [ ] Add new columns to products table
- [ ] Create category API endpoints
- [ ] Create barcode API endpoints
- [ ] Create batch API endpoints
- [ ] Update product API endpoints

### Week 2: UI Components
- [ ] Create category list page
- [ ] Create category form page
- [ ] Update product form with new fields
- [ ] Create barcode scanner component
- [ ] Create batch management UI
- [ ] Update POS to use new product fields

### Week 3: Testing & Integration
- [ ] Test category CRUD
- [ ] Test barcode scanning
- [ ] Test batch tracking
- [ ] Test stock ledger updates
- [ ] Test offline sync

---

## Testing Checklist

### Product Master
- [ ] Create product with all fields
- [ ] Update product fields
- [ ] Delete product
- [ ] Search products by name
- [ ] Search products by category
- [ ] Search products by barcode
- [ ] View low stock products
- [ ] View product by barcode scan

### Category Management
- [ ] Create category
- [ ] Create sub-category
- [ ] List categories in tree view
- [ ] Update category
- [ ] Delete category
- [ ] Assign category to product
- [ ] Remove category from product

### Barcode Support
- [ ] Generate barcode
- [ ] Scan barcode in POS
- [ ] Validate barcode format
- [ ] Add multiple barcodes to product
- [ ] Handle weighted barcode
- [ ] Handle barcode collision

### Batch Management
- [ ] Create batch for product
- [ ] Add stock to batch
- [ ] Remove stock from batch
- [ ] View batch ledger
- [ ] Handle batch expiry
- [ ] Handle damaged batch stock

### Stock Ledger
- [ ] Record stock in
- [ ] Record stock out
- [ ] Record stock adjustment
- [ ] Calculate FIFO valuation
- [ ] Calculate stock value
- [ ] Generate stock ledger report