## 2026-08-01T15:37:08Z
You are Worker M3 for Milestone 3 (Data Fetching & Caching Optimization - R2 & R4) of the Evaluna ERP performance optimization project.

Your assigned folder for metadata/reports is: `d:\Evaluna ERP\.agents\worker_m3`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objectives (Requirement R2 & R4):
1. **Schema Indexes** (`packages/db/src/schema.ts`):
   Add explicit Drizzle `index(...)` definitions for foreign keys and frequent query filters on:
   - `order_items`: index on `order_id` and `product_id`.
   - `orders`: index on `customer_id`, `branch_id`, `status`, `payment_method_id`, `user_uid`.
   - `transactions`: index on `branch_id`, `order_id`, `type`, `category`, `status`.
   - `purchase_items`: index on `purchase_id`, `product_id`.
   - `pick_lists`: index on `status`, `assigned_to`, `order_id`.

2. **Parallelize Sequential DB Queries in TRPC Routers**:
   - `apps/web/src/lib/trpc/routers/dashboard.ts` (`getKpis` procedure): Convert the 11 sequential database `await` queries into a single `Promise.all([ ... ])` call.
   - `apps/web/src/lib/trpc/routers/auditor.ts` (`getDashboardStats` procedure): Convert the 3 sequential queries (`adjustments`, `expiring`, `recentAudits`) into `Promise.all([ ... ])`.
   - `apps/web/src/lib/trpc/routers/hr.ts` (`getDashboardStats` procedure): Convert the 3 sequential queries (`empCount`, `activeCount`, `avgSalaryData`) into `Promise.all([ ... ])`.
   - `apps/web/src/lib/trpc/routers/picker.ts` (`getDashboardStats` procedure): Convert the 5 sequential queries into `Promise.all([ ... ])`.
   - `apps/web/src/lib/trpc/routers/putter.ts` (`getDashboardStats` procedure): Convert the 3 sequential queries into `Promise.all([ ... ])`.

3. **Batch Inventory Check in Order Creation**:
   - `apps/web/src/lib/trpc/routers/orders.ts` (`create` procedure): Replace the loop-based N+1 inventory lookup with a single batch `inArray(branchInventory.product_id, productIds)` SELECT query prior to stock reservation.

4. **Client-Side Query Caching for Heavy Dashboard Widgets**:
   - Set React Query options `{ staleTime: 30_000, refetchOnWindowFocus: false }` on dashboard `trpc.<router>.<procedure>.useQuery(...)` hooks across `apps/web/src/app/admin/page.tsx`, `apps/web/src/app/auditor/page.tsx`, `apps/web/src/app/marketing/page.tsx` (and other role dashboards as applicable).

5. **Requirement R4 Compliance & Verification**:
   - Strict Constraint: Do NOT change any business behavior, authentication middleware, permission rules, TRPC router input/output signatures, or existing dashboard structures.
   - Run type checks (`bun run check` or `pnpm build`) to verify clean compilation.
   - Write your handoff report to `d:\Evaluna ERP\.agents\worker_m3\handoff.md` and send a message to the orchestrator summarizing your changes.
