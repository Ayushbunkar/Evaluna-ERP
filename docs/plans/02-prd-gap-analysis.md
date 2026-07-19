# PRD Gap Analysis - Evaluna ERP

## Current State Analysis

### Existing Features (Brazil-POS)

#### 1. Products Module
**Status:** ✅ Implemented
**Brazil-Specific Fields to Remove:**
- `ncm` (Nomenclatura Comum do Mercosul) - 8-digit code
- `cfop` (Código Fiscal de Operações e Prestações) - 4-digit code
- `icms_cst` (Código de Situação da Operação no ICMS) - 3-digit code
- `pis_cst` - 2-digit code
- `cofins_cst` - 2-digit code
- `unit_of_measure` (Brazilian measurement units)

**India-Specific Fields to Add:**
- `hsn` (Harmonized System Nomenclature) - 8-digit code
- `gst_rate` (0%, 5%, 12%, 18%, 28%) - already partially implemented
- `taxable` (boolean) - for GST applicability

#### 2. Customers Module
**Status:** ✅ Implemented
- `khata` (Brazilian credit ledger system) - should become `credit_limit` for India

**India-Specific Fields to Add:**
- `gst_number` (GSTIN) - 15-character alphanumeric
- `pan_number` - 10-character alphanumeric
- `credit_limit` - numeric with decimal support
- `payment_terms` (days: 7, 15, 30, 60, 90)
- `customer_type` (retail, wholesale, corporate, government)

#### 3. Orders/POS Module
**Status:** ✅ Implemented
**Brazil-Specific Features to Remove:**
- `emitNfce` checkbox (NFC-e - Nota Fiscal do Consumidor Eletrônica)
- Brazil-specific fiscal data in order items

**India-Specific Features to Add:**
- GST invoice generation
- E-way bill integration (for inter-state sales > ₹50,000)
- Tax breakdown by GST rate (CGST, SGST, IGST)
- HSN-wise summary

#### 4. Payment Methods Module
**Status:** ✅ Implemented
**Changes Needed:**
- Add `payment_type` (cash, card, upi, netbanking, wallet)
- Add `bank_name` for card/netbanking payments
- Add `transaction_id` for digital payments

#### 5. Suppliers Module
**Status:** ✅ Implemented
**Brazil-Specific Fields to Remove:**
- None specific

**India-Specific Fields to Add:**
- `gst_number` (GSTIN)
- `pan_number`
- `supplier_category` (local, national, international)

#### 6. Purchases Module
**Status:** ✅ Implemented
**Changes Needed:**
- Add GST tax calculation
- Add tax breakdown (CGST, SGST, IGST)
- Add HSN-wise purchase summary

#### 7. Purchase Returns Module
**Status:** ✅ Implemented
**Changes Needed:**
- Add GST reversal calculation
- Add tax breakdown

#### 8. Expenses Module
**Status:** ✅ Implemented
**Changes Needed:**
- Add `expense_category` (office, salary, marketing, utilities, etc.)
- Add `payment_method` reference
- Add `tax_amount` for GST on expenses

#### 9. Dashboard
**Status:** ✅ Implemented
**Changes Needed:**
- Add GST summary section
- Add HSN-wise sales report
- Add customer-wise GST summary

---

## Missing Features (India ERP Requirements)

### 1. Staff Management
**Priority:** 🔴 High
**Description:** Employee management system with roles and permissions
**Features:**
- Staff list with CRUD operations
- Role-based access control (RBAC)
- Staff attendance tracking
- Salary management (basic, HRA, DA, PF, ESIC)
- Payroll generation

**Database Tables Needed:**
```sql
staff (
  id, name, email, phone, address,
  role, department, join_date, salary,
  pf_number, pan, aadhaar, bank_account,
  created_at
)
```

### 2. Inventory Management
**Priority:** 🔴 High
**Description:** Advanced inventory tracking with stock adjustments
**Features:**
- Stock adjustments (add/remove/transfer)
- Stock alerts (low stock, out of stock)
- Batch/serial number tracking
- Product variants (size, color)
- Warehouse management

**Database Tables Needed:**
```sql
stock_adjustments (
  id, product_id, quantity, reason,
  adjustment_type (add/remove/transfer),
  reference_document, created_at
)

product_variants (
  id, product_id, variant_name, 
  variant_value, price, stock
)

warehouses (
  id, name, address, contact
)

stock_transfers (
  id, from_warehouse, to_warehouse,
  product_id, quantity, created_at
)
```

### 3. Reports & Analytics
**Priority:** 🟡 Medium
**Description:** Comprehensive reporting system
**Features:**
- Sales report (daily, weekly, monthly, yearly)
- Purchase report
- Stock report
- GST return reports (GSTR-1, GSTR-2, GSTR-3B)
- Customer ledger statement
- Supplier ledger statement
- Profit & Loss statement
- Balance Sheet

### 4. Tax Management
**Priority:** 🔴 High
**Description:** GST compliance and tax calculation
**Features:**
- Tax rate configuration (0%, 5%, 12%, 18%, 28%)
- CGST/SGST/IGST calculation
- Tax summary by rate
- GST return preparation
- E-invoicing integration (India)

**Database Tables Needed:**
```sql
tax_rates (
  id, name, rate, type (cgst/sgst/igst),
  created_at
)
```

### 5. E-way Bill System
**Priority:** 🟡 Medium
**Description:** E-way bill generation for inter-state sales
**Features:**
- E-way bill generation
- E-way bill validity check
- E-way bill cancellation
- E-way bill report

### 6. E-invoicing
**Priority:** 🟢 Low
**Description:** Government-mandated e-invoicing for businesses > ₹5 crore turnover
**Features:**
- IRN generation
- QR code generation
- E-invoice download

### 7. Multi-User Support
**Priority:** 🔴 High
**Description:** Multi-branch and multi-user support
**Features:**
- Company/branch selection
- User permissions management
- Audit trail
- Data isolation by company

**Database Tables Needed:**
```sql
companies (
  id, name, address, contact,
  gst_number, pan, financial_year,
  created_at
)

user_companies (
  user_id, company_id, role,
  permissions (JSON)
)
```

### 8. Financial Accounting
**Priority:** 🟡 Medium
**Description:** Full accounting system
**Features:**
- Chart of accounts
- Journal entries
- Ledger statements
- Trial balance
- Financial statements

### 9. Notifications
**Priority:** 🟢 Low
**Description:** Email/SMS notifications
**Features:**
- Order confirmation emails
- Payment reminders
- Stock alerts
- GST return reminders

### 10. Mobile App
**Priority:** 🟢 Low
**Description:** Native mobile applications
**Features:**
- Android POS app
- iOS POS app
- Staff mobile app

---

## Priority Matrix

### Phase 1: Critical (Must Have)
1. Staff Management with RBAC
2. Inventory Management (Stock Adjustments)
3. Tax Management (GST)
4. Multi-User Support (Company/Branch)

### Phase 2: Important (Should Have)
1. Reports & Analytics
2. E-way Bill System
3. Financial Accounting

### Phase 3: Nice to Have
1. E-invoicing
2. Notifications
3. Mobile App

---

## Database Schema Changes Summary

### Tables to Modify
| Table | Brazil Fields to Remove | India Fields to Add |
|-------|------------------------|---------------------|
| products | ncm, cfop, icms_cst, pis_cst, cofins_cst | hsn, taxable |
| customers | khata | gst_number, pan_number, credit_limit, payment_terms, customer_type |
| suppliers | - | gst_number, pan_number, supplier_category |
| orders | - | gst_breakdown (JSON), e_way_bill_no |
| expenses | - | expense_category, payment_method_id, tax_amount |

### New Tables to Create
| Table | Purpose |
|-------|---------|
| staff | Employee management |
| roles | Role definitions |
| permissions | Permission definitions |
| user_roles | User-role mapping |
| stock_adjustments | Stock adjustment tracking |
| product_variants | Product variants |
| warehouses | Warehouse management |
| stock_transfers | Inter-warehouse transfers |
| tax_rates | GST tax rates |
| companies | Multi-company support |
| user_companies | User-company mapping |
| e_way_bills | E-way bill records |
| notifications | Notification logs |

---

## Migration Strategy

### Step 1: Database Migration
1. Backup existing database
2. Add new columns for India-specific features
3. Remove Brazil-specific columns
4. Create new tables
5. Migrate existing data

### Step 2: Code Changes
1. Update validation schemas
2. Update API endpoints
3. Update UI components
4. Add new features

### Step 3: Testing
1. Unit tests
2. Integration tests
3. User acceptance testing

### Step 4: Deployment
1. Deploy to staging
2. Test thoroughly
3. Deploy to production
4. Monitor and fix issues

---

## Notes

- The current codebase has a solid foundation with most CRUD operations implemented
- Brazil-specific fiscal data (NCM, CFOP, ICMS, PIS, COFINS) needs to be replaced with India-specific GST data
- The POS system is well-designed and can be extended with GST calculations
- The dashboard provides good analytics but needs GST-specific reports
- Multi-user support needs to be built from scratch