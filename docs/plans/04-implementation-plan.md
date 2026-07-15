# Implementation Plan - Evaluna ERP (India ERP)

## Phase 1: Database Migration (Week 1-2)

### Week 1: Schema Updates

#### Day 1-2: Core Table Modifications
- [ ] Backup existing database
- [ ] Add HSN column to products table
- [ ] Add taxable column to products table
- [ ] Add gst_number column to customers table
- [ ] Add pan_number column to customers table
- [ ] Add credit_limit column to customers table
- [ ] Add payment_terms column to customers table
- [ ] Add customer_type column to customers table
- [ ] Add cgst_amount, sgst_amount, igst_amount columns to orders table
- [ ] Add e_way_bill_no column to orders table
- [ ] Add gst_breakdown JSONB column to orders table
- [ ] Add expense_category column to expenses table
- [ ] Add payment_method_id column to expenses table
- [ ] Add tax_amount column to expenses table
- [ ] Remove Brazil-specific columns (ncm, cfop, icms_cst, pis_cst, cofins_cst)

#### Day 3-4: New Table Creation
- [ ] Create staff table
- [ ] Create roles table
- [ ] Create user_roles table
- [ ] Create stock_adjustments table
- [ ] Create warehouses table
- [ ] Create stock_transfers table
- [ ] Create tax_rates table
- [ ] Create companies table
- [ ] Create user_companies table
- [ ] Create e_way_bills table
- [ ] Create notifications table

#### Day 5: Data Migration
- [ ] Migrate existing products to new schema
- [ ] Migrate existing customers to new schema
- [ ] Migrate existing orders to new schema
- [ ] Migrate existing expenses to new schema
- [ ] Create default roles (Admin, Manager, Cashier, Accountant)
- [ ] Create default tax rates (0%, 5%, 12%, 18%, 28%)

### Week 2: Database Testing
- [ ] Test database migrations
- [ ] Test data integrity
- [ ] Test foreign key constraints
- [ ] Test indexes
- [ ] Document database schema

---

## Phase 2: Backend API Development (Week 3-5)

### Week 3: Core API Updates

#### Day 1-2: Product API
- [ ] Update product validation schema (add HSN, taxable)
- [ ] Update product list handler
- [ ] Update product create handler
- [ ] Update product update handler
- [ ] Update product delete handler
- [ ] Test product API endpoints

#### Day 3-4: Customer API
- [ ] Update customer validation schema (add GST fields)
- [ ] Update customer list handler
- [ ] Update customer create handler
- [ ] Update customer update handler
- [ ] Update customer delete handler
- [ ] Test customer API endpoints

#### Day 5: Order API
- [ ] Update order validation schema (add GST fields)
- [ ] Update order create handler (POS)
- [ ] Update order list handler
- [ ] Update order update handler
- [ ] Update order delete handler
- [ ] Test order API endpoints

### Week 4: New Module APIs

#### Day 1-2: Staff API
- [ ] Create staff validation schema
- [ ] Create staff list handler
- [ ] Create staff create handler
- [ ] Create staff update handler
- [ ] Create staff delete handler
- [ ] Test staff API endpoints

#### Day 3-4: Inventory API
- [ ] Create stock_adjustments validation schema
- [ ] Create stock_adjustments list handler
- [ ] Create stock_adjustments create handler
- [ ] Create warehouses list handler
- [ ] Create warehouses create handler
- [ ] Create stock_transfers handlers
- [ ] Test inventory API endpoints

#### Day 5: Tax API
- [ ] Create tax_rates validation schema
- [ ] Create tax_rates list handler
- [ ] Create tax_rates create handler
- [ ] Create CGST calculation handler
- [ ] Create SGST calculation handler
- [ ] Create IGST calculation handler
- [ ] Test tax API endpoints

### Week 5: Reports & Multi-Company APIs

#### Day 1-2: Reports API
- [ ] Create daily sales report handler
- [ ] Create weekly sales report handler
- [ ] Create monthly sales report handler
- [ ] Create yearly sales report handler
- [ ] Create purchase report handler
- [ ] Create stock report handler
- [ ] Create profit & loss handler
- [ ] Test reports API endpoints

#### Day 3-4: Multi-Company API
- [ ] Create companies validation schema
- [ ] Create companies list handler
- [ ] Create companies create handler
- [ ] Create user_companies handlers
- [ ] Test multi-company API endpoints

#### Day 5: E-way Bill API
- [ ] Create e_way_bills validation schema
- [ ] Create e_way_bills create handler
- [ ] Create e_way_bills list handler
- [ ] Test e-way bill API endpoints

---

## Phase 3: Frontend Development (Week 6-8)

### Week 6: Core Module Updates

#### Day 1-2: Products Page
- [ ] Update product form (add HSN, taxable)
- [ ] Update product list page
- [ ] Test product CRUD operations

#### Day 3-4: Customers Page
- [ ] Update customer form (add GST fields)
- [ ] Update customer list page
- [ ] Test customer CRUD operations

#### Day 5: POS Page
- [ ] Update POS page (add GST calculation)
- [ ] Update order summary (show tax breakdown)
- [ ] Test POS operations

### Week 7: New Module Pages

#### Day 1-2: Staff Page
- [ ] Create staff list page
- [ ] Create staff form page
- [ ] Test staff CRUD operations

#### Day 3-4: Inventory Page
- [ ] Create inventory dashboard page
- [ ] Create stock adjustments page
- [ ] Create stock transfers page
- [ ] Test inventory operations

#### Day 5: Tax Page
- [ ] Create tax rates configuration page
- [ ] Create tax reports page
- [ ] Test tax operations

### Week 8: Reports & Multi-Company Pages

#### Day 1-2: Reports Pages
- [ ] Create sales reports page (daily, weekly, monthly, yearly)
- [ ] Create purchase reports page
- [ ] Create stock reports page
- [ ] Create financial reports page

#### Day 3-4: Multi-Company Pages
- [ ] Create companies list page
- [ ] Create companies form page
- [ ] Create user management page
- [ ] Test multi-company operations

#### Day 5: Dashboard Updates
- [ ] Update dashboard with GST summary
- [ ] Update dashboard with HSN-wise sales
- [ ] Update dashboard with customer-wise GST
- [ ] Test dashboard

---

## Phase 4: Testing & Deployment (Week 9-10)

### Week 9: Testing

#### Day 1-2: Unit Testing
- [ ] Test all API handlers
- [ ] Test all validation schemas
- [ ] Test all utility functions

#### Day 3-4: Integration Testing
- [ ] Test database migrations
- [ ] Test API endpoints
- [ ] Test frontend components

#### Day 5: User Acceptance Testing
- [ ] Test with sample data
- [ ] Test with real-world scenarios
- [ ] Fix bugs

### Week 10: Deployment

#### Day 1-2: Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Fix issues

#### Day 3-4: Production Deployment
- [ ] Backup production database
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor logs

#### Day 5: Documentation
- [ ] Update API documentation
- [ ] Update user documentation
- [ ] Create training materials

---

## Implementation Checklist

### Database
- [ ] Backup database
- [ ] Add new columns
- [ ] Remove Brazil-specific columns
- [ ] Create new tables
- [ ] Migrate data
- [ ] Test migrations

### Backend
- [ ] Update validation schemas
- [ ] Update API handlers
- [ ] Create new API handlers
- [ ] Test API endpoints
- [ ] Update tRPC routers

### Frontend
- [ ] Update forms
- [ ] Update list pages
- [ ] Create new pages
- [ ] Test UI components
- [ ] Test user flows

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] User acceptance testing

### Deployment
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Documentation

---

## Notes

- Each phase should be completed before moving to the next
- Test thoroughly at each stage
- Document any issues encountered
- Keep backup of database before each major change
- Use feature branches for each module
- Merge to main only after thorough testing