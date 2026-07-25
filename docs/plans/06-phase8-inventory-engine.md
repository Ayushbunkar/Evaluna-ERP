# Phase 8 — Inventory Engine with FIFO, Batches, and Stock Valuation

## Before Implementation Analysis

### Current Inventory Behavior

#### What Exists:
1. **Simple Stock Tracking**:
   - `products.in_stock` - Single integer field tracking total quantity
   - No batch/lot tracking
   - No expiry date tracking
   - No FIFO support

2. **Stock Adjustment**:
   - `stock_adjustments` table - Tracks stock changes with reason
   - No valuation tracking
   - No batch association

3. **Stock Movements**:
   - Stock increases on purchase
   - Stock decreases on order
   - No audit trail of movements

### Current Stock Model
```typescript
// From schema.ts
products: {
  in_stock: integer("in_stock").notNull().default(0),
}
```

### What Must Be Built:

#### 1. FIFO Inventory Costing
- Track each stock entry with cost price
- When stock is sold, use the cost of the oldest entry (FIFO)
- Calculate COGS (Cost of Goods Sold) using FIFO
- Track inventory value at cost

#### 2. Batch Tracking
- Each product can have multiple batches
- Each batch has its own quantity, expiry date, cost
- Track batch movements separately
- Handle batch-specific issues (damage, expiry)

#### 3. Stock Valuation
- Moving Average Cost
- FIFO Valuation
- Specific Identification
- Stock value by batch

### How FIFO Should Work

```
Example:
Day 1: Purchase 100 units @ ₹10/unit
Day 2: Purchase 50 units @ ₹12/unit
Day 3: Sell 80 units

FIFO Calculation:
- Sell 100 units from Day 1 @ ₹10 = ₹800 COGS
- Remaining: 20 units from Day 1 @ ₹10, 50 units from Day 2 @ ₹12
- Stock Value: (20 × ₹10) + (50 × ₹12) = ₹800
```

### How Batch Tracking Should Work

```
Example Product: Sugar 1kg
Batch A: 100 units, expiry 2025-12-31, cost ₹40
Batch B: 50 units, expiry 2026-01-15, cost ₹42

Stock Out (30 units):
- Use oldest batch first (Batch A)
- Batch A: 70 units remaining
- Batch B: 50 units

Expiry Handling:
- Check expiry dates daily
- Flag expired batches
- Handle expired stock separately
```

### How Weighted Barcodes Affect Inventory

```
Example: Fruit by weight
Barcode: 50012345 (500gm weight)
Price per kg: ₹100
Weight: 500gm
Amount: ₹50

Inventory:
- Weighted products tracked by weight (kg)
- Sale reduces weight stock
- Purchase increases weight stock
```

### How Damage and Expiry Affect Stock

```
Damage Handling:
1. Identify damaged batch
2. Deduct from batch quantity
3. Record damage reason
4. Move to damaged stock (separate tracking)

Expiry Handling:
1. Check expiry dates daily
2. Identify expired batches
3. Deduct from batch quantity
4. Record expiry reason
5. May need to be reported to authorities
```

### How Pack-to-Loose Conversion Works

```
Pack: 10 units @ ₹100 (₹10/unit)
Loose: 1 unit @ ₹12

Conversion:
- Pack to Loose: Break pack into loose units
- Loose to Pack: Group loose units into pack
- Track conversion separately
- Record any loss/gain
```

### How Value is Calculated

```
FIFO Valuation:
1. Track each stock entry with cost
2. When stock is sold, use oldest cost
3. Remaining stock valued at original cost

Example:
Purchase: 100 units @ ₹10
Purchase: 50 units @ ₹12
Sell: 80 units

COGS: 80 × ₹10 = ₹800
Remaining: 20 × ₹10 + 50 × ₹12 = ₹800
```

---

## Implementation Plan

### Database Changes

#### Stock Ledger Table (FIFO Tracking)
```sql
CREATE TABLE stock_ledger (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  batch_id INTEGER REFERENCES product_batches(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment', 'transfer', 'damage', 'expiry'
  quantity INTEGER NOT NULL, -- positive for in, negative for out
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  reference_id INTEGER, -- order_id, purchase_id, adjustment_id
  reference_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stock_ledger_product ON stock_ledger(product_id);
CREATE INDEX idx_stock_ledger_transaction ON stock_ledger(transaction_type);
CREATE INDEX idx_stock_ledger_date ON stock_ledger(created_at);
```

#### Batch Stock View (for real-time stock)
```sql
CREATE VIEW batch_stock AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  pb.id as batch_id,
  pb.batch_number,
  pb.expiry_date,
  COALESCE(SUM(sl.quantity), 0) as current_quantity,
  pb.unit_cost
FROM products p
JOIN product_batches pb ON pb.product_id = p.id
LEFT JOIN stock_ledger sl ON sl.batch_id = pb.id
GROUP BY p.id, pb.id;
```

### API Changes

#### Stock Movement API
```
POST /api/inventory/stock-in
- Add stock to a batch
- Update stock ledger
- Update batch quantity

POST /api/inventory/stock-out
- Remove stock from a batch (FIFO)
- Update stock ledger
- Update batch quantity
- Calculate COGS

POST /api/inventory/adjustment
- Adjust stock quantity
- Record adjustment reason
- Update stock ledger

POST /api/inventory/damage
- Record damaged stock
- Deduct from batch
- Track damage separately

POST /api/inventory/expiry
- Record expired stock
- Deduct from batch
- Track expiry separately

GET /api/inventory/stock-ledger/:productId
- Get stock ledger for product
- FIFO valuation report

GET /api/inventory/batch-ledger/:batchId
- Get batch movement history

GET /api/inventory/low-stock
- Get products below threshold

GET /api/inventory/expiring-soon
- Get batches expiring within 30 days

GET /api/inventory/valuation
- Get current stock valuation
- FIFO valuation report
```

### UI Changes

#### Stock Movement UI
- Stock in form (select batch, quantity, cost)
- Stock out form (select batch, quantity)
- Adjustment form (select batch, new quantity, reason)
- Damage form (select batch, quantity, reason)
- Expiry form (select batch, quantity, reason)

#### Reports UI
- Stock ledger report (per product)
- Batch ledger report (per batch)
- FIFO valuation report
- Low stock alert report
- Expiring soon report
- Stock valuation report

### Implementation Steps

#### Week 1: Stock Ledger & Batch Management
- [ ] Create stock_ledger table
- [ ] Create batch_stock view
- [ ] Create stock_ledger API
- [ ] Create batch management API
- [ ] Test stock ledger entries

#### Week 2: FIFO Logic
- [ ] Implement FIFO stock out logic
- [ ] Implement COGS calculation
- [ ] Implement FIFO valuation
- [ ] Test FIFO calculations

#### Week 3: Damage & Expiry
- [ ] Create damage tracking
- [ ] Create expiry tracking
- [ ] Implement damage API
- [ ] Implement expiry API
- [ ] Test damage/expiry handling

#### Week 4: Pack-to-Loose Conversion
- [ ] Create conversion tracking
- [ ] Implement conversion API
- [ ] Test conversion logic

#### Week 5: Reports & UI
- [ ] Create stock ledger report
- [ ] Create FIFO valuation report
- [ ] Create low stock alert UI
- [ ] Create expiry alert UI
- [ ] Test all reports

---

## Testing Checklist

### Stock Ledger
- [ ] Record stock in with cost
- [ ] Record stock out with FIFO
- [ ] Calculate COGS correctly
- [ ] Update batch quantities
- [ ] Generate stock ledger report

### FIFO Valuation
- [ ] Purchase at different costs
- [ ] Sell using FIFO
- [ ] Calculate correct COGS
- [ ] Value remaining stock correctly

### Batch Management
- [ ] Create batch for product
- [ ] Add stock to batch
- [ ] Remove stock from batch
- [ ] View batch ledger
- [ ] Handle batch expiry

### Damage Handling
- [ ] Record damaged stock
- [ ] Deduct from batch
- [ ] Track damage separately
- [ ] Generate damage report

### Expiry Handling
- [ ] Identify expiring batches
- [ ] Record expired stock
- [ ] Deduct from batch
- [ ] Generate expiry report

### Pack-to-Loose Conversion
- [ ] Convert pack to loose
- [ ] Convert loose to pack
- [ ] Track conversion
- [ ] Handle conversion loss/gain

### Reports
- [ ] Stock ledger report
- [ ] FIFO valuation report
- [ ] Low stock alert
- [ ] Expiring soon report
- [ ] Stock valuation report