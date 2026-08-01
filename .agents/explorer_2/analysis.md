# Baseline Investigation Report: Data Fetching, TRPC Routers & Database Schema Optimization

**Explorer**: Explorer 2  
**Milestone**: Milestone 1 (Baseline Investigation)  
**Project**: Evaluna ERP Performance Optimization  
**Date**: 2026-07-31  

---

## 1. Executive Summary

This report delivers a thorough, evidence-based performance investigation of data fetching, TRPC routers, Drizzle ORM database schemas, database queries, and client-side integration across the Evaluna ERP application.

### Key Discoveries:
1. **Critical Schema Index Deficit**: Out of 50+ tables defined in `packages/db/src/schema.ts`, only **4 tables** (`products`, `orders`, `transactions`, `branchInventory`) have any indexes defined. Crucial foreign key columns such as `order_items.order_id`, `orders.customer_id`, `orders.branch_id`, `transactions.order_id`, `purchases.supplier_id`, `purchase_items.purchase_id`, and `pick_lists.assigned_to` lack indexes, causing PostgreSQL to execute full table scans during joins and relation lookups.
2. **Sequential `await` Execution Anti-Pattern**: Server-side dashboard endpoints across all 8 role dashboards (`admin`, `sales`, `auditor`, `hr`, `picker`, `putter`, `driver`, `marketing`) execute multiple independent database queries sequentially line-by-line using `await`. For example, `dashboard.getKpis` executes **11 sequential database queries** sequentially.
3. **N+1 Query Loop Anti-Pattern**: In `orders.create` (`apps/web/src/lib/trpc/routers/orders.ts`), inventory check and reservation are executed row-by-row inside a `for (const product of input.products)` loop, triggering $2N$ sequential database roundtrips per order.
4. **Unpaginated Large Data Fetches**: Analytics and reporting routers (`reports.ts`, `orders.ts`) return entire dataset results (`findMany` without `limit`/`offset` or pagination cursors) with deep relations (`orderItems`, `customer`), risking high memory allocation and slow JSON serialization.
5. **Missing Client-Side Query Caching**: Client-side React Query calls in dashboard pages (`apps/web/src/app/admin/page.tsx`, `auditor/page.tsx`, `picker/page.tsx`, etc.) use default React Query options (`staleTime: 0`), resulting in redundant refetches on every window/tab focus.

---

## 2. Database Model & Schema Analysis (`packages/db/src/schema.ts`)

Evaluna ERP uses **Drizzle ORM** targeting PostgreSQL (`packages/db/src/schema.ts`, 86KB).

### 2.1 Index Coverage Assessment

A codebase search for `index(` in `packages/db/src/` reveals indexes defined ONLY on the following 4 tables:
- `products`: `idx_products_barcode` (`barcode`), `idx_products_category` (`category`), `idx_products_family` (`product_family`)
- `orders`: `idx_orders_created_at` (`created_at`)
- `transactions`: `idx_transactions_created_at` (`created_at`)
- `branchInventory`: `idx_branch_inv_branch_product` (`branch_id`, `product_id`)

### 2.2 Critical Missing Indexes

| Model / Table | File & Line | Missing Index Column(s) | Impact |
|---|---|---|---|
| `order_items` | `schema.ts:194` | `order_id`, `product_id` | **High Severity**: Every order lookup with items (`orders.findFirst({ with: { orderItems: true } })`) causes a full table scan on `order_items`. |
| `orders` | `schema.ts:144` | `customer_id`, `branch_id`, `status`, `payment_method_id`, `user_uid` | Filtering orders by customer, branch, or status requires full table scans. |
| `transactions` | `schema.ts:219` | `branch_id`, `order_id`, `payment_method_id`, `type`, `category`, `status`, `user_uid` | KPI aggregations filtering by `branch_id`, `type`, and `category` scan all transaction records. |
| `customers` | `schema.ts:104` | `branch_id`, `user_uid`, `status` | Customer list lookups by branch or user_uid perform unindexed scans. |
| `staff` | `schema.ts:361` | `branch_id`, `status`, `user_uid` | Employee list and active staff counts perform unindexed scans. |
| `user_roles` | `schema.ts:410` | `user_id`, `role_id` | Authorization checks joining user to roles perform unindexed scans on `user_roles`. |
| `stock_adjustments` | `schema.ts:434` | `product_id`, `created_by`, `adjustment_type`, `created_at` | Audit damage and mismatch counts filter on `adjustment_type` without an index. |
| `purchases` & `purchase_items` | `schema.ts:701, 727` | `purchases.supplier_id`, `purchases.status`, `purchase_items.purchase_id`, `purchase_items.product_id` | Receiving bay and putaway task lookups join `purchases` to `purchase_items` without foreign key indexes. |
| `pick_lists` & `pick_list_items` | `schema.ts:997, 1022` | `pick_lists.assigned_to`, `pick_lists.status`, `pick_lists.order_id`, `pick_list_items.pick_list_id` | Picker dashboard queries filter by status (`assigned`, `picking`, `completed`) without indexes. |
| `product_batches` | `schema.ts:852` | `expiry_date`, `branch_id` | Expiry timeline and risk queries filter on `expiry_date` without an index. |

---

## 3. TRPC Routers & Server-Side Data Fetching Across 8 Role Dashboards

### 3.1 Admin Dashboard (`apps/web/src/lib/trpc/routers/dashboard.ts`)
- **Endpoint**: `dashboard.getKpis` (lines 16-195)
- **Problem**: 11 sequential `await` database queries executed line-by-line:
  1. Line 36: `await db.select({ total: sum(transactions.amount) }).where(todaySales)`
  2. Line 50: `await db.select({ total: sum(transactions.amount) }).where(totalSales)`
  3. Line 62: `await db.select({ total: sum(transactions.amount) }).where(todayExpenses)`
  4. Line 76: `await db.select({ total: sum(transactions.amount) }).where(totalExpenses)`
  5. Line 88: `await db.select({ total: count() }).from(orders).where(todayCompletedOrders)`
  6. Line 101: `await db.select({ total: count() }).from(orders).where(totalCompletedOrders)`
  7. Line 107: `await db.select({ total: count() }).from(customers)`
  8. Line 113: `await db.select({ total: count() }).from(products)`
  9. Line 119: `await db.select({ total: count() }).from(orders).where(pendingOrders)`
  10. Line 125: `await db.select({ total: count() }).from(staff).where(activeStaff)`
  11. Line 136: `await db.select({ total: count() }).from(branchInventory).where(lowStock)`
- **Latency Impact**: Overall endpoint response time equals the sum of 11 database roundtrips.

### 3.2 Sales Dashboard (`apps/web/src/lib/trpc/routers/orders.ts`)
- **Endpoints**: `orders.create` (lines 94-200), `orders.list` (lines 72-92)
- **N+1 Anti-Pattern in `orders.create`**:
  ```ts
  // Lines 141-168: Loop over products in order
  for (const product of input.products) {
    const inv = await tx.query.branchInventory.findFirst({ ... }); // SELECT per product
    await tx.update(branchInventory).set({ ... }).where(...);      // UPDATE per product
  }
  ```
  For an order with 10 line items, this generates 20 sequential database queries.
- **Unpaginated Query in `orders.list`**:
  `db.query.orders.findMany({ where: eq(orders.user_uid, ctx.user.id), with: { customer: true } })` fetches all orders for a user without limit or cursor.

### 3.3 Auditor Dashboard (`apps/web/src/lib/trpc/routers/auditor.ts`)
- **Endpoint**: `auditor.getDashboardStats` (lines 7-79)
- **Problem**: Executes 3 sequential `await` database queries:
  1. Line 13: `adjustments` aggregation by `adjustment_type`
  2. Line 31: `expiring` count query on `productBatches`
  3. Line 38: `recentAudits` query on `stockAdjustments` joined with `staff`

### 3.4 HR Dashboard (`apps/web/src/lib/trpc/routers/hr.ts`)
- **Endpoint**: `hr.getDashboardStats` (lines 6-31), `hr.getEmployees` (lines 33-60)
- **Problem**: 
  - `getDashboardStats` executes 3 sequential queries (`empCount`, `activeCount`, `avgSalaryData`).
  - `getEmployees` hardcodes `limit: 100` without accepting pagination parameters.

### 3.5 Picker Dashboard (`apps/web/src/lib/trpc/routers/picker.ts`)
- **Endpoint**: `picker.getDashboardStats` (lines 7-59)
- **Problem**: Executes 5 sequential `await` database queries:
  1. Line 12: `assignedCount` query (`pickLists` status = assigned)
  2. Line 16: `completedCount` query (`pickLists` status = completed)
  3. Line 20: `pendingCount` query (`pickLists` status = pending)
  4. Line 25: `itemsPickedResult` query (`pickListItems` status = picked)
  5. Line 32: `recent` pickLists query with nested `pickListItems`
- **Note**: The 3 status count queries can be combined using `GROUP BY status` or executed via `Promise.all`.

### 3.6 Putter Dashboard (`apps/web/src/lib/trpc/routers/putter.ts`)
- **Endpoint**: `putter.getDashboardStats` (lines 13-42)
- **Problem**: Executes 3 sequential `await` queries:
  1. Line 19: `receivingCount` (`purchases` status = pending)
  2. Line 24: `putAwayCount` (`purchases` status = received)
  3. Line 28: `damageCount` (`stockAdjustments` type = damage)

### 3.7 Driver Dashboard (`apps/web/src/lib/trpc/routers/driver.ts`)
- **Endpoint**: `driver.getMobileDashboard` (lines 8-130)
- **Problem**: Sequential fallback queries (`findFirst` dispatched trip, then fallback `findFirst` any trip) with deep nested relations (`stops` -> `order` -> `customer`, `paymentMethod`). Lacks index on `delivery_trips.status`.

### 3.8 Marketing Dashboard (`apps/web/src/lib/trpc/routers/marketing.ts`)
- **Endpoint**: `marketing.launchCampaign` (lines 201-245)
- **Problem**: Queries `customers` with status and opt-in filters (`marketing_opt_in: true`) without an index on `(status, marketing_opt_in, loyalty_tier)`. Sequentially inserts audience records row-by-row or batch without bulk strategy optimization.

---

## 4. Summary of Identified Anti-Patterns

| Anti-Pattern | Example Location | Root Cause | Performance Impact |
|---|---|---|---|
| **Sequential `await` Chains** | `dashboard.ts:36-136` (11 queries), `picker.ts:12-32` (5 queries) | Writing queries sequentially instead of leveraging `Promise.all` | Multiplies latency by number of queries |
| **N+1 Query Loops** | `orders.ts:141-168` | Performing DB select & update inside array `.map` or `for...of` loop | $2N$ network roundtrips per request |
| **Unpaginated Data Fetches** | `reports.ts:36, 57, 85`, `orders.ts:84` | Calling `findMany` without `limit`/`offset`/`cursor` | Massive payload size, high memory footprint |
| **Missing Foreign Key Indexes** | `schema.ts:194` (`order_items.order_id`), `schema.ts:144` (`orders.customer_id`) | Omitted `index()` in table definition | PostgreSQL performs full table scan on joins |
| **Default `staleTime: 0`** | `admin/page.tsx:93`, `auditor/page.tsx:89` | Omitting React Query cache configuration | Redundant network refetches on tab switch |

---

## 5. Concrete Optimization Proposals

These 4 concrete optimization proposals can be implemented **without modifying any TRPC router signatures, business logic, or authorization rules**:

### Proposal 1: Parallelize `dashboard.getKpis` & Add Client Query Caching
- **Target Router**: `apps/web/src/lib/trpc/routers/dashboard.ts` (`getKpis`)
- **Optimization**: Wrap the 11 independent database queries in `Promise.all([ ... ])`:
  ```ts
  const [
    [todaySalesRow], [totalSalesRow], [todayExpensesRow], [totalExpensesRow],
    [todayBillsRow], [totalBillsRow], [totalCustomersRow], [totalProductsRow],
    [pendingOrdersRow], [activeStaffRow], [lowStockRow]
  ] = await Promise.all([
    db.select({ total: sum(transactions.amount) }).from(transactions).where(...),
    db.select({ total: sum(transactions.amount) }).from(transactions).where(...),
    // ... all 11 queries in parallel
  ]);
  ```
- **Target Component**: `apps/web/src/app/admin/page.tsx`
- **Optimization**: Add `{ staleTime: 30_000, refetchOnWindowFocus: false }` to `trpc.dashboard.getKpis.useQuery(...)` to cache KPI data client-side.

### Proposal 2: Batch Inventory Checks in `orders.create` to Eliminate N+1
- **Target Router**: `apps/web/src/lib/trpc/routers/orders.ts` (`create`)
- **Optimization**: Fetch all product inventory records in a single query prior to the loop:
  ```ts
  const productIds = input.products.map(p => p.id);
  const inventoryRows = await tx.query.branchInventory.findMany({
    where: and(
      inArray(branchInventory.product_id, productIds),
      eq(branchInventory.branch_id, branchId)
    )
  });
  const invMap = new Map(inventoryRows.map(i => [i.product_id, i]));
  ```

### Proposal 3: Parallelize Role Dashboard Routers (`auditor`, `hr`, `picker`, `putter`)
- **Target Routers**:
  - `apps/web/src/lib/trpc/routers/auditor.ts`: Parallelize `adjustments`, `expiring`, and `recentAudits` with `Promise.all`.
  - `apps/web/src/lib/trpc/routers/hr.ts`: Parallelize `empCount`, `activeCount`, and `avgSalaryData` with `Promise.all`.
  - `apps/web/src/lib/trpc/routers/picker.ts`: Parallelize status counts & recent tasks with `Promise.all`.
  - `apps/web/src/lib/trpc/routers/putter.ts`: Parallelize `receivingCount`, `putAwayCount`, and `damageCount` with `Promise.all`.

### Proposal 4: Add Missing Database Indexes in `packages/db/src/schema.ts`
- **Target File**: `packages/db/src/schema.ts`
- **Optimization**: Add Drizzle `index()` definitions for critical foreign keys:
  - `orderItems`: `index("idx_order_items_order_id").on(table.order_id)`, `index("idx_order_items_product_id").on(table.product_id)`
  - `orders`: `index("idx_orders_customer_id").on(table.customer_id)`, `index("idx_orders_branch_id").on(table.branch_id)`, `index("idx_orders_status").on(table.status)`
  - `transactions`: `index("idx_transactions_branch_id").on(table.branch_id)`, `index("idx_transactions_order_id").on(table.order_id)`
  - `purchaseItems`: `index("idx_purchase_items_purchase_id").on(table.purchase_id)`
  - `pickLists`: `index("idx_pick_lists_status").on(table.status)`, `index("idx_pick_lists_assigned_to").on(table.assigned_to)`
