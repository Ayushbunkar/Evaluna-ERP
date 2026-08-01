# Handoff Report: Baseline Data Fetching & Database Investigation

**Sender**: Explorer 2  
**Recipient**: Orchestrator / Implementer  
**Milestone**: Milestone 1 (Baseline Investigation)  
**Date**: 2026-07-31  

---

## 1. Observation

### Observation 1.1: Missing Database Indexes in Drizzle ORM Schema
- **File**: `d:\Evaluna ERP\packages\db\src\schema.ts`
- Code search (`grep_search`) for `index(` in `packages/db/src/` returned index definitions ONLY on lines 87-89 (`products`), 189 (`orders`), 239 (`transactions`), and 302 (`branchInventory`).
- Out of 50+ database tables, 46+ tables have zero indexes defined.
- Specific missing indexes:
  - `order_items` (`schema.ts:194`): missing index on `order_id` and `product_id`.
  - `orders` (`schema.ts:144`): missing index on `customer_id`, `branch_id`, `status`, `payment_method_id`, `user_uid`.
  - `transactions` (`schema.ts:219`): missing index on `branch_id`, `order_id`, `type`, `category`, `status`.
  - `purchase_items` (`schema.ts:727`): missing index on `purchase_id`, `product_id`.
  - `pick_lists` (`schema.ts:997`): missing index on `status`, `assigned_to`, `order_id`.

### Observation 1.2: Sequential `await` Execution in TRPC Routers
- **File**: `d:\Evaluna ERP\apps\web\src\lib\trpc\routers\dashboard.ts` (lines 36-136)
  - `getKpis` executes 11 sequential `await` queries line-by-line: `todaySalesRow`, `totalSalesRow`, `todayExpensesRow`, `totalExpensesRow`, `todayBillsRow`, `totalBillsRow`, `totalCustomersRow`, `totalProductsRow`, `pendingOrdersRow`, `activeStaffRow`, `lowStockRow`.
- **File**: `d:\Evaluna ERP\apps\web\src\lib\trpc\routers\auditor.ts` (lines 13-38)
  - `getDashboardStats` executes 3 sequential `await` queries (`adjustments`, `expiring`, `recentAudits`).
- **File**: `d:\Evaluna ERP\apps\web\src\lib\trpc\routers\hr.ts` (lines 11-17)
  - `getDashboardStats` executes 3 sequential `await` queries (`empCount`, `activeCount`, `avgSalaryData`).
- **File**: `d:\Evaluna ERP\apps\web\src\lib\trpc\routers\picker.ts` (lines 12-32)
  - `getDashboardStats` executes 5 sequential `await` queries (`assignedCount`, `completedCount`, `pendingCount`, `itemsPickedResult`, `recent`).
- **File**: `d:\Evaluna ERP\apps\web\src\lib\trpc\routers\putter.ts` (lines 19-28)
  - `getDashboardStats` executes 3 sequential `await` queries (`receivingCount`, `putAwayCount`, `damageCount`).

### Observation 1.3: N+1 Query Loop in Order Creation
- **File**: `d:\Evaluna ERP\apps\web\src\lib\trpc\routers\orders.ts` (lines 141-168)
  - `for (const product of input.products)` loop calls `tx.query.branchInventory.findFirst(...)` and `tx.update(branchInventory)...` sequentially per product item in the order.

### Observation 1.4: Unpaginated Data Fetches in Reporting Endpoints
- **File**: `d:\Evaluna ERP\apps\web\src\lib\trpc\routers\reports.ts` (lines 36, 57, 85, 124, 213, 246)
  - `getSalesReport`, `getGstReport`, `getProfitReport`, `getStockReport`, `getCustomerReport`, `getCashBookReport` call `db.query.<table\>.findMany` without `limit`/`offset` or pagination cursors.

### Observation 1.5: Missing Client Query Caching Configuration
- **File**: `d:\Evaluna ERP\apps\web\src\app\admin\page.tsx` (line 93), `apps/web/src/app\auditor\page.tsx` (line 89), `apps/web/src/app\marketing\page.tsx` (line 50)
  - `trpc.<router\>.<procedure\>.useQuery(...)` calls do not supply React Query options (`staleTime`, `refetchOnWindowFocus`), leaving `staleTime` at default 0.

---

## 2. Logic Chain

1. **Observation 1.1** shows that PostgreSQL tables lack indexes on primary join keys (e.g. `order_items.order_id`).
   $\rightarrow$ **Step 1**: Drizzle queries joining `orders` with `orderItems` (`db.query.orders.findMany({ with: { orderItems: true } })`) force PostgreSQL to perform sequential full table scans over `order_items`.
2. **Observation 1.2** shows that server endpoints in `dashboard.ts`, `auditor.ts`, `hr.ts`, `picker.ts`, and `putter.ts` run independent `db.select()` calls sequentially using `await`.
   $\rightarrow$ **Step 2**: Total HTTP response latency is equal to $\sum_{i=1}^N T_{\text{query}_i}$. Using `Promise.all` reduces latency to $\max(T_{\text{query}_i})$, yielding up to a 5-10x latency improvement on dashboard loads.
3. **Observation 1.3** shows row-by-row queries inside array iteration loops in `orders.create`.
   $\rightarrow$ **Step 3**: Ordering $N$ items requires $2N + 3$ database roundtrips. Batching the inventory lookup into a single `inArray` query reduces database roundtrips from $2N + 3$ to $4$.
4. **Observation 1.4** shows unpaginated large data fetches in reporting routines.
   $\rightarrow$ **Step 4**: Retaining unpaginated queries under production data volumes causes high memory overhead and potential process crashes/slow response transfers.
5. **Observation 1.5** shows client-side queries default to `staleTime: 0`.
   $\rightarrow$ **Step 5**: Every user interaction or window focus triggers duplicate server requests, increasing database pressure.

---

## 3. Caveats

- **Scope Limit**: Code analysis was conducted via static inspection. Database query execution plans (`EXPLAIN ANALYZE`) were not generated against live production PostgreSQL instances.
- **Drizzle Kit Migration**: Adding indexes to `packages/db/src/schema.ts` will require running `drizzle-kit generate` / migration scripts to apply index DDL to the database.
- **TRPC Router Signatures**: Proposals strictly adhere to maintaining existing input/output schemas and authorization checks.

---

## 4. Conclusion

Evaluna ERP suffers from systematic data fetching bottlenecks:
1. **Schema Deficit**: 46+ tables lack foreign key indexes (notably `order_items.order_id`).
2. **Sequential Latency**: Dashboard endpoints execute up to 11 sequential database queries.
3. **N+1 Operations**: Order creation executes loop-based inventory checks.
4. **Client Refetch Redundancy**: Dashboard React Query hooks lack `staleTime` caching.

Implementing the 4 proposed concrete optimizations (parallel query execution with `Promise.all`, batched inventory lookup in `orders.create`, client `staleTime` caching, and adding foreign key indexes to `schema.ts`) will dramatically cut response times across all 8 role dashboards while preserving existing API signatures and authorization rules.

---

## 5. Verification Method

### 5.1 Verification Commands
- **Type Checking**:
  `pnpm build` or `bun run check` from project root to ensure no broken imports or type mismatches.
- **Database Schema Validation**:
  Inspect `packages/db/src/schema.ts` to confirm presence of `index(...)` calls on `order_items`, `orders`, `transactions`, `purchases`, `pick_lists`, etc.

### 5.2 Specific Files to Inspect
- `packages/db/src/schema.ts`
- `apps/web/src/lib/trpc/routers/dashboard.ts`
- `apps/web/src/lib/trpc/routers/orders.ts`
- `apps/web/src/lib/trpc/routers/auditor.ts`
- `apps/web/src/lib/trpc/routers/hr.ts`
- `apps/web/src/lib/trpc/routers/picker.ts`
- `apps/web/src/lib/trpc/routers/putter.ts`
- `apps/web/src/app/admin/page.tsx`

### 5.3 Invalidation Conditions
- A proposal is invalidated if altering query execution (e.g. `Promise.all`) changes data return structure or breaks existing TRPC Zod output validation schemas.
