# Target Architecture - Evaluna ERP (India ERP)

## 1. System Overview

### 1.1 Architecture Type
- **Pattern:** Microservices with Shared Database
- **Frontend:** Next.js 14 (App Router)
- **Backend:** tRPC (TypeScript Remote Procedure Call)
- **Database:** PostgreSQL
- **Authentication:** Better Auth
- **Styling:** Tailwind CSS + shadcn/ui

### 1.2 Technology Stack
```
Frontend:
├── Next.js 14 (App Router)
├── TypeScript
├── tRPC (client & server)
├── React Query
├── Tailwind CSS
├── shadcn/ui components
├── recharts (charts)
└── next-intl (i18n)

Backend:
├── tRPC (API layer)
├── Drizzle ORM
├── PostgreSQL
├── Better Auth
└── Zod (validation)

Infrastructure:
├── Docker
├── Docker Compose
└── Nginx (reverse proxy)
```

---

## 2. Module Architecture

### 2.1 Core Modules

```
Evaluna ERP
├── apps/
│   ├── web/                    # Main web application (Next.js)
│   └── docs/                   # Documentation
├── packages/
│   ├── api/                    # tRPC API layer
│   ├── auth/                   # Authentication (Better Auth)
│   ├── db/                     # Database schema & migrations
│   ├── ui/                     # Shared UI components
│   └── config/                 # Configuration management
└── docs/                       # Documentation
```

### 2.2 Module Breakdown

#### A. Products Module
```
apps/web/src/app/admin/products/
├── page.tsx                    # Product list with search/filter
├── components/
│   └── product-form.tsx       # Product form (CRUD)
└── lib/
    └── validation/
        └── product.ts          # Zod validation schema

packages/api/src/products/
├── router.ts                   # tRPC router
├── handlers/
│   ├── list.ts                 # List products
│   ├── create.ts               # Create product
│   ├── update.ts               # Update product
│   └── delete.ts               # Delete product
└── schema.ts                   # Input/output schemas
```

#### B. Customers Module
```
apps/web/src/app/admin/customers/
├── page.tsx                    # Customer list
├── components/
│   └── customer-form.tsx      # Customer form
└── lib/
    └── validation/
        └── customer.ts         # Validation schema

packages/api/src/customers/
├── router.ts
├── handlers/
│   ├── list.ts
│   ├── create.ts
│   ├── update.ts
│   └── delete.ts
└── schema.ts
```

#### C. POS/Orders Module
```
apps/web/src/app/admin/pos/
├── page.tsx                    # POS interface
└── lib/
    └── validation/
        └── order.ts            # Order validation

packages/api/src/orders/
├── router.ts
├── handlers/
│   ├── create.ts               # Create order (POS)
│   ├── list.ts
│   ├── update.ts
│   └── delete.ts
└── schema.ts
```

#### D. Staff Module (NEW)
```
apps/web/src/app/admin/staff/
├── page.tsx                    # Staff list
├── components/
│   └── staff-form.tsx         # Staff form
└── lib/
    └── validation/
        └── staff.ts            # Validation schema

packages/api/src/staff/
├── router.ts
├── handlers/
│   ├── list.ts
│   ├── create.ts
│   ├── update.ts
│   └── delete.ts
└── schema.ts
```

#### E. Inventory Module (NEW)
```
apps/web/src/app/admin/inventory/
├── page.tsx                    # Inventory dashboard
├── adjustments/                # Stock adjustments
│   └── page.tsx
├── transfers/                  # Stock transfers
│   └── page.tsx
└── lib/
    └── validation/
        └── inventory.ts        # Validation schema

packages/api/src/inventory/
├── router.ts
├── handlers/
│   ├── adjustments/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   └── update.ts
│   ├── transfers/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   └── update.ts
│   └── stock.ts                # Stock queries
└── schema.ts
```

#### F. Tax Module (NEW)
```
apps/web/src/app/admin/tax/
├── page.tsx                    # Tax rates configuration
├── reports/                    # Tax reports
│   ├── page.tsx
│   └── gstr-1/                 # GSTR-1 report
│       └── page.tsx
└── lib/
    └── validation/
        └── tax.ts              # Validation schema

packages/api/src/tax/
├── router.ts
├── handlers/
│   ├── rates/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   └── update.ts
│   ├── calculations/
│   │   ├── cgst.ts
│   │   ├── sgst.ts
│   │   └── igst.ts
│   └── reports/
│       ├── summary.ts
│       └── gstr-1.ts
└── schema.ts
```

#### G. Reports Module (NEW)
```
apps/web/src/app/admin/reports/
├── sales/                      # Sales reports
│   ├── daily.tsx
│   ├── weekly.tsx
│   ├── monthly.tsx
│   └── yearly.tsx
├── purchases/                  # Purchase reports
├── inventory/                  # Stock reports
├── tax/                        # Tax reports
└── financial/                  # Financial reports

packages/api/src/reports/
├── router.ts
├── handlers/
│   ├── sales/
│   │   ├── daily.ts
│   │   ├── weekly.ts
│   │   ├── monthly.ts
│   │   └── yearly.ts
│   ├── purchases/
│   │   ├── list.ts
│   │   └── summary.ts
│   ├── inventory/
│   │   ├── stock.ts
│   │   └── low-stock.ts
│   └── financial/
│       ├── profit-loss.ts
│       └── balance-sheet.ts
└── schema.ts
```

#### H. Multi-Company Module (NEW)
```
apps/web/src/app/admin/companies/
├── page.tsx                    # Company list
├── components/
│   └── company-form.tsx       # Company form
└── lib/
    └── validation/
        └── company.ts          # Validation schema

apps/web/src/app/admin/users/
├── page.tsx                    # User management
└── lib/
    └── validation/
        └── user.ts             # User validation

packages/api/src/companies/
├── router.ts
├── handlers/
│   ├── list.ts
│   ├── create.ts
│   ├── update.ts
│   └── delete.ts
└── schema.ts

packages/api/src/users/
├── router.ts
├── handlers/
│   ├── list.ts
│   ├── create.ts
│   ├── update.ts
│   └── delete.ts
└── schema.ts
```

---

## 3. Database Schema

### 3.1 Core Tables (Modified)

#### products
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  in_stock INTEGER NOT NULL DEFAULT 0,
  user_uid VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  hsn VARCHAR(8),              -- NEW: India-specific
  taxable BOOLEAN DEFAULT true, -- NEW: GST applicability
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### customers
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  user_uid VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  gst_number VARCHAR(15),      -- NEW: GSTIN
  pan_number VARCHAR(10),      -- NEW: PAN
  credit_limit DECIMAL(10, 2) DEFAULT 0, -- NEW: Credit limit
  payment_terms INTEGER DEFAULT 30, -- NEW: Payment terms in days
  customer_type VARCHAR(20) DEFAULT 'retail', -- NEW: Customer type
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### orders
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  cgst_amount DECIMAL(10, 2) DEFAULT 0, -- NEW
  sgst_amount DECIMAL(10, 2) DEFAULT 0, -- NEW
  igst_amount DECIMAL(10, 2) DEFAULT 0, -- NEW
  user_uid VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method_id INTEGER REFERENCES payment_methods(id),
  e_way_bill_no VARCHAR(50),   -- NEW: E-way bill number
  gst_breakdown JSONB,         -- NEW: Tax breakdown
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### expenses
```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  expense_category VARCHAR(50), -- NEW: Category
  payment_method_id INTEGER REFERENCES payment_methods(id), -- NEW
  tax_amount DECIMAL(10, 2) DEFAULT 0, -- NEW: GST on expense
  user_uid VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 New Tables

#### staff
```sql
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(50),
  join_date DATE NOT NULL,
  salary DECIMAL(10, 2) NOT NULL,
  pf_number VARCHAR(50),
  pan VARCHAR(10),
  aadhaar VARCHAR(12),
  bank_account VARCHAR(50),
  bank_name VARCHAR(100),
  ifsc VARCHAR(11),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### roles
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### user_roles
```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES staff(id) NOT NULL,
  role_id INTEGER REFERENCES roles(id) NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);
```

#### stock_adjustments
```sql
CREATE TABLE stock_adjustments (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  adjustment_type VARCHAR(20) NOT NULL, -- 'add', 'remove', 'transfer'
  reference_document VARCHAR(255),
  created_by INTEGER REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### warehouses
```sql
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  contact VARCHAR(20),
  manager_id INTEGER REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### stock_transfers
```sql
CREATE TABLE stock_transfers (
  id SERIAL PRIMARY KEY,
  from_warehouse_id INTEGER REFERENCES warehouses(id) NOT NULL,
  to_warehouse_id INTEGER REFERENCES warehouses(id) NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### tax_rates
```sql
CREATE TABLE tax_rates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL, -- 'CGST 9%', 'SGST 9%', 'IGST 18%'
  rate DECIMAL(5, 2) NOT NULL, -- 9.00, 18.00
  tax_type VARCHAR(10) NOT NULL, -- 'cgst', 'sgst', 'igst'
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### companies
```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact VARCHAR(20),
  gst_number VARCHAR(15),
  pan VARCHAR(10),
  financial_year_start DATE,
  financial_year_end DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### user_companies
```sql
CREATE TABLE user_companies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES staff(id) NOT NULL,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);
```

#### e_way_bills
```sql
CREATE TABLE e_way_bills (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) NOT NULL,
  e_way_bill_no VARCHAR(50) UNIQUE NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled'
  created_by INTEGER REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### notifications
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES staff(id),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. API Architecture

### 4.1 tRPC Router Structure

```
packages/api/src/trpc/
├── router.ts                   # Main router
├── context.ts                  # tRPC context
└── routers/
    ├── products.ts
    ├── customers.ts
    ├── orders.ts
    ├── staff.ts
    ├── inventory.ts
    ├── tax.ts
    ├── reports.ts
    ├── companies.ts
    └── auth.ts
```

### 4.2 tRPC Router Example

```typescript
// packages/api/src/trpc/routers/products.ts
import { z } from 'zod';
import { protectedProcedure, router } from '../context';
import { listProductsHandler } from '../handlers/products/list';
import { createProductHandler } from '../handlers/products/create';
import { updateProductHandler } from '../handlers/products/update';
import { deleteProductHandler } from '../handlers/products/delete';

export const productsRouter = router({
  list: protectedProcedure.query(listProductsHandler),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().min(0),
      in_stock: z.number().min(0),
      category: z.string().optional(),
      hsn: z.string().optional(),
      taxable: z.boolean().default(true),
    }))
    .mutation(createProductHandler),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().min(0),
      in_stock: z.number().min(0),
      category: z.string().optional(),
      hsn: z.string().optional(),
      taxable: z.boolean().default(true),
    }))
    .mutation(updateProductHandler),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(deleteProductHandler),
});
```

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow
```
1. User enters credentials
2. Backend validates credentials (Better Auth)
3. JWT token generated
4. Token stored in cookie
5. All API calls include token
6. tRPC context validates token
7. User data attached to request
```

### 5.2 Authorization (RBAC)
```
1. User has roles assigned
2. Each role has permissions
3. API handlers check permissions
4. Access granted/denied based on permissions

Example:
- Admin: All permissions
- Manager: View reports, manage staff
- Cashier: POS operations only
- Accountant: Financial reports only
```

---

## 6. Frontend Architecture

### 6.1 Page Structure
```
apps/web/src/app/
├── admin/
│   ├── page.tsx                # Admin dashboard
│   ├── layout.tsx              # Admin layout
│   ├── products/
│   │   ├── page.tsx
│   │   └── components/
│   ├── customers/
│   │   ├── page.tsx
│   │   └── components/
│   ├── pos/
│   │   └── page.tsx
│   ├── staff/
│   │   ├── page.tsx
│   │   └── components/
│   ├── inventory/
│   │   ├── page.tsx
│   │   ├── adjustments/
│   │   └── transfers/
│   ├── tax/
│   │   ├── page.tsx
│   │   └── reports/
│   ├── reports/
│   │   ├── sales/
│   │   ├── purchases/
│   │   └── financial/
│   ├── companies/
│   │   └── page.tsx
│   └── users/
│       └── page.tsx
├── api/                        # API routes
├── login/
│   └── page.tsx
└── signup/
    └── page.tsx
```

### 6.2 Component Structure
```
apps/web/src/components/
├── admin-layout.tsx
├── sidebar.tsx
├── navbar