# Phase 9 — Warehouse Operations: Putting, Locations, Pick, Pack

## Before Implementation Analysis

### Current Warehouse Behavior

#### What Exists:
1. **Basic Warehouse Table** (`warehouses`):
   - id, name, address, contact, manager_id, created_at
   - No location tracking
   - No barcode support for locations

2. **Stock Transfers** (`stock_transfers`):
   - Simple transfer between warehouses
   - No location tracking
   - No pick/put workflow

3. **Stock Adjustments** (`stock_adjustments`):
   - Manual stock adjustments
   - No warehouse location tracking

### What Must Be Built:

#### 1. Warehouse Locations
- Location-based storage (A-01, B-02, etc.)
- Location types: storage, picking, quarantine, damage
- Capacity management
- Location barcodes for scanning

#### 2. Put Flow
- Put-in stock from purchase
- Missing stock put-in
- Sale return put-in
- Damage raise by Putter

#### 3. Pick Flow
- Pick list generation
- Item picking deduction
- Sale picking
- Purchase return picking
- FIFO integrity across locations

#### 4. Pack Flow
- Pack list generation
- Packing verification
- Shipping preparation

### How the Warehouse Flow Should Work

```
Put Flow:
1. Purchase arrives at warehouse
2. Putter scans location barcode
3. Putter scans product barcode
4. System checks if location has capacity
5. Stock is placed in location
6. Batch stock is updated

Pick Flow:
1. Order is created
2. Pick list is generated
3. Picker scans pick list barcode
4. Picker scans location barcode
5. Picker scans product barcode
6. System checks batch expiry (FIFO)
7. Stock is deducted from location
8. Pick list item is marked picked

Pack Flow:
1. All items picked
2. Pack list is generated
3. Pack verification
4. Shipping label printed
5. Order marked ready for shipping
```

### Role of Putter
- Receives stock from purchase
- Scans location barcode
- Scans product barcode
- Places stock in location
- Reports damage

### Role of Picker
- Picks items for orders
- Scans pick list barcode
- Scans location barcode
- Scans product barcode
- Deducts stock from location

### Location-Based FIFO
- Oldest batch in location is picked first
- Expiry dates checked before picking
- Damage stock separated

### Stock Placement
- New stock placed in oldest available location
- Capacity checked before placement
- Location barcode scanned

### Receiving and Retrieval
- Receiving: Put flow with purchase order
- Retrieval: Pick flow with order

### Barcode Scanning Requirement
- Staff must scan their ID barcode
- Locations must have barcodes
- Products must have barcodes
- All movements must be auditable

---

## Implementation Plan

### Database Changes (Completed)
- `warehouse_locations` - Location storage
- `location_barcodes` - Location barcode mapping
- `batch_stock` - Location-based batch stock
- `pick_lists` - Pick list header
- `pick_list_items` - Pick list line items
- `put_lists` - Put list header
- `put_list_items` - Put list line items
- `warehouse_damage` - Damage tracking

### API Changes

#### Location API
```
POST /api/warehouse/locations/create
POST /api/warehouse/locations/update/:id
POST /api/warehouse/locations/delete/:id
GET  /api/warehouse/locations/list/:warehouseId
GET  /api/warehouse/locations/by-barcode/:barcode
GET  /api/warehouse/locations/search?query=
```

#### Put Flow API
```
POST /api/warehouse/put/create
POST /api/warehouse/put/add-item
POST /api/warehouse/put/complete
POST /api/warehouse/put/cancel
GET  /api/warehouse/put/list
GET  /api/warehouse/put/by-id/:id
```

#### Pick Flow API
```
POST /api/warehouse/pick/create
POST /api/warehouse/pick/add-item
POST /api/warehouse/pick/complete
POST /api/warehouse/pick/cancel
GET  /api/warehouse/pick/list
GET  /api/warehouse/pick/by-id/:id
```

#### Pack Flow API
```
POST /api/warehouse/pack/create
POST /api/warehouse/pack/complete
GET  /api/warehouse/pack/list
GET  /api/warehouse/pack/by-id/:id
```

#### Damage API
```
POST /api/warehouse/damage/report
POST /api/warehouse/damage/verify/:id
GET  /api/warehouse/damage/list
```

### UI Changes

#### Location Management
- Location list page
- Location form page
- Location barcode generator
- Location capacity tracker

#### Put Flow UI
- Put list creation
- Location scanner
- Product scanner
- Stock placement confirmation

#### Pick Flow UI
- Pick list generation
- Pick list scanner
- Location scanner
- Product scanner
- Pick confirmation

#### Pack Flow UI
- Pack list generation
- Pack verification
- Shipping label printing

#### Damage UI
- Damage report form
- Damage verification
- Damage report list

### Implementation Steps

#### Week 1: Location Management
- [ ] Create location API
- [ ] Create location UI
- [ ] Test location barcode scanning

#### Week 2: Put Flow
- [ ] Create put list API
- [ ] Create put flow UI
- [ ] Test put flow

#### Week 3: Pick Flow
- [ ] Create pick list API
- [ ] Create pick flow UI
- [ ] Test pick flow with FIFO

#### Week 4: Pack Flow
- [ ] Create pack list API
- [ ] Create pack flow UI
- [ ] Test pack flow

#### Week 5: Damage & Integration
- [ ] Create damage API
- [ ] Create damage UI
- [ ] Integrate with inventory
- [ ] Test end-to-end

---

## Testing Checklist

### Location Management
- [ ] Create location
- [ ] Generate location barcode
- [ ] Scan location barcode
- [ ] Update location
- [ ] Delete location
- [ ] Search locations
- [ ] Check capacity

### Put Flow
- [ ] Create put list
- [ ] Add item to put list
- [ ] Scan location barcode
- [ ] Scan product barcode
- [ ] Complete put list
- [ ] Cancel put list
- [ ] Report damage

### Pick Flow
- [ ] Create pick list
- [ ] Add item to pick list
- [ ] Scan pick list barcode
- [ ] Scan location barcode
- [ ] Scan product barcode
- [ ] Complete pick list
- [ ] Cancel pick list
- [ ] FIFO integrity check

### Pack Flow
- [ ] Create pack list
- [ ] Verify pack list
- [ ] Print shipping label
- [ ] Complete pack list

### Damage Handling
- [ ] Report damage
- [ ] Verify damage
- [ ] Deduct damaged stock
- [ ] Generate damage report

### Integration
- [ ] Stock deduction on pick
- [ ] Stock addition on put
- [ ] Inventory update on damage
- [ ] Order status update