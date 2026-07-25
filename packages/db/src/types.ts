// Phase 7: Product Categories
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  created_at: string;
}

export interface ProductCategoryMapping {
  id: number;
  product_id: number;
  category_id: number;
  is_primary: boolean;
  created_at: string;
}

// Phase 7: Product Barcodes
export interface ProductBarcode {
  id: number;
  product_id: number;
  barcode: string;
  barcode_type: string;
  is_weighted: boolean;
  weight_per_unit?: string;
  created_at: string;
}

// Phase 7: Product Batches
export interface ProductBatch {
  id: number;
  product_id: number;
  batch_number: string;
  quantity: number;
  mrp: string;
  selling_price: string;
  purchase_price: string;
  expiry_date?: string;
  manufacture_date?: string;
  location?: string;
  warehouse_id?: number;
  created_at: string;
}

// Phase 8: Stock Ledger (FIFO)
export interface StockLedger {
  id: number;
  product_id: number;
  batch_id?: number;
  transaction_type: string;
  quantity: number;
  unit_cost: string;
  total_cost: string;
  reference_id?: number;
  reference_type?: string;
  created_at: string;
}

// Phase 9: Warehouse Locations
export interface WarehouseLocation {
  id: number;
  warehouse_id: number;
  name: string;
  section?: string;
  aisle?: string;
  shelf?: string;
  level?: string;
  location_type: string;
  capacity: number;
  current_stock: number;
  is_active: boolean;
  created_at: string;
}

// Phase 9: Location Barcodes
export interface LocationBarcode {
  id: number;
  location_id: number;
  barcode: string;
  barcode_type: string;
  is_primary: boolean;
  created_at: string;
}

// Phase 9: Batch Stock (Location-based)
export interface BatchStock {
  id: number;
  batch_id: number;
  location_id: number;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  created_at: string;
}

// Phase 9: Pick Lists
export interface PickList {
  id: number;
  order_id?: number;
  reference_type: string;
  reference_id: number;
  status: string;
  assigned_to?: number;
  priority: string;
  created_at: string;
  completed_at?: string;
}

// Phase 9: Pick List Items
export interface PickListItem {
  id: number;
  pick_list_id: number;
  product_id: number;
  batch_id?: number;
  location_id?: number;
  quantity_ordered: number;
  quantity_picked: number;
  status: string;
  picked_by?: number;
  picked_at?: string;
  created_at: string;
}

// Phase 9: Put Lists
export interface PutList {
  id: number;
  reference_type: string;
  reference_id: number;
  status: string;
  assigned_to?: number;
  created_at: string;
  completed_at?: string;
}

// Phase 9: Put List Items
export interface PutListItem {
  id: number;
  put_list_id: number;
  product_id: number;
  batch_id?: number;
  location_id?: number;
  quantity: number;
  status: string;
  put_by?: number;
  put_at?: string;
  created_at: string;
}

// Phase 9: Warehouse Damage
export interface WarehouseDamage {
  id: number;
  location_id: number;
  product_id: number;
  batch_id?: number;
  quantity: number;
  reason?: string;
  reported_by: number;
  verified: boolean;
  verified_by?: number;
  verified_at?: string;
  created_at: string;
}

// Extended Product with Phase 7-9 fields
export interface ExtendedProduct {
  id: number;
  name: string;
  description?: string;
  price: string;
  in_stock: number;
  user_uid: string;
  category?: string;
  hsn?: string;
  taxable: boolean;
  barcode?: string;
  sku?: string;
  unit?: string;
  created_at: string;
  mrp?: string;
  selling_price?: string;
  purchase_price?: string;
  opening_stock: number;
  low_stock_threshold: number;
  is_weighted: boolean;
  weight_per_unit?: string;
  batch_number?: string;
  expiry_date?: string;
}

// Inventory Summary
export interface InventorySummary {
  total_products: number;
  total_stock: number;
  total_value: string;
  low_stock_count: number;
  expired_stock_count: number;
  damaged_stock_count: number;
}

// Batch Stock Summary
export interface BatchStockSummary {
  batch_id: number;
  batch_number: string;
  total_quantity: number;
  available_quantity: number;
  min_quantity: number;
  max_quantity: number;
  expiry_date?: string;
  warehouse_id?: number;
}

// Location Stock Summary
export interface LocationStockSummary {
  location_id: number;
  location_name: string;
  product_id: number;
  product_name: string;
  batch_id?: number;
  batch_number?: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
}

// Stock Movement
export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  batch_id?: number;
  batch_number?: string;
  transaction_type: string;
  quantity: number;
  unit_cost: string;
  total_cost: string;
  reference_id?: number;
  reference_type?: string;
  warehouse_location_id?: number;
  location_name?: string;
  created_at: string;
}

// Pick List Summary
export interface PickListSummary {
  id: number;
  order_id?: number;
  reference_type: string;
  reference_id: number;
  status: string;
  priority: string;
  assigned_to?: number;
  assigned_to_name?: string;
  items_count: number;
  items_picked: number;
  created_at: string;
  completed_at?: string;
}

// Put List Summary
export interface PutListSummary {
  id: number;
  reference_type: string;
  reference_id: number;
  status: string;
  assigned_to?: number;
  assigned_to_name?: string;
  items_count: number;
  items_put: number;
  created_at: string;
  completed_at?: string;
}

// Warehouse Damage Summary
export interface WarehouseDamageSummary {
  id: number;
  location_id: number;
  location_name: string;
  product_id: number;
  product_name: string;
  batch_id?: number;
  batch_number?: string;
  quantity: number;
  reason?: string;
  reported_by: number;
  reported_by_name?: string;
  verified: boolean;
  verified_by?: number;
  verified_by_name?: string;
  verified_at?: string;
  created_at: string;
}