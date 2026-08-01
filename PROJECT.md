# Project: Evaluna ERP Performance Optimization

## Architecture
Next.js 16.1.6 (App Router) + React 19 + Tailwind CSS v4 + TRPC 11 + Drizzle ORM + PostgreSQL in a Turborepo monorepo.
Role dashboards: Admin, Sales, Auditor, HR, Picker, Putter, Driver, Marketing.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Baseline Investigation | Inspect codebase, identify target components & queries | None | DONE |
| 2 | Bundle Size & Code Splitting (R1) | Dynamic imports (>=5 components), lazy loading, devDeps cleanup | M1 | DONE |
| 3 | Data Fetching & Caching (R2) | Query optimization, indexes, caching/parallel fetch (>=3 dashboards) | M1, M2 | IN_PROGRESS |
| 4 | Rendering Performance (R3) | Virtualize >=3 tables, skeleton loaders, memoization | M1, M2, M3 | PLANNED |
| 5 | E2E Regression Verification & Forensic Audit (R4) | Verify 8 role dashboards, zero business logic regressions | M2, M3, M4 | PLANNED |

## Interface Contracts
- Business logic, TRPC routers, permissions, and auth middleware must remain unchanged.
- All public/protected route signatures and dashboard props must remain identical.

## Code Layout
- Web App: `apps/web` (Next.js App Router)
  - Routes & Pages: `apps/web/src/app/` (`admin`, `sales`, `auditor`, `hr`, `picker`, `putter`, `driver`, `marketing`)
  - Middleware & Auth: `apps/web/src/proxy.ts`, `apps/web/src/lib/permissions.ts`
  - TRPC Routers: `apps/web/src/lib/trpc/routers/` (`dashboard.ts`, `orders.ts`, `auditor.ts`, `hr.ts`, `picker.ts`, `putter.ts`, `reports.ts`)
- Database Package: `packages/db`
  - Schema: `packages/db/src/schema.ts` (Drizzle ORM definitions)
- UI Package: `packages/ui`
  - Shared Components: `packages/ui/src/components/data-table.tsx`

## Baseline & Implementation Results Summary
1. **Milestone 1 (Baseline Investigation)**: Completed. Mapped all 8 role dashboards, tech stack, and performance bottlenecks.
2. **Milestone 2 (Bundle Size & Code Splitting - R1)**: Completed & Clean Audit.
   - Extracted Recharts chart blocks in `admin`, `auditor`, `billing`, `delivery`, `finance`, `inventory`, and `warehouse` dashboards into dynamic components with `{ ssr: false }` and `<Skeleton>` loading placeholders.
   - Moved `@faker-js/faker` and `@electric-sql/pglite` to `devDependencies` in `apps/web/package.json`.
   - Verified 100% build pass across 181 routes. Verified CLEAN by Forensic Auditor M2.
3. **Milestone 3 (Data Fetching & Caching - R2)**:
   - Add foreign key `index()` definitions in `packages/db/src/schema.ts` (`order_items.order_id`, `orders.customer_id`, `orders.branch_id`, `transactions.order_id`, `purchases.supplier_id`, `pick_lists.assigned_to`).
   - Parallelize sequential queries in TRPC routers (`dashboard.ts`, `auditor.ts`, `hr.ts`, `picker.ts`, `putter.ts`) using `Promise.all`.
   - Batch inventory checks in `orders.create` (`orders.ts`) to avoid N+1 query loop.
   - Set React Query `staleTime: 30_000` and `refetchOnWindowFocus: false` on client dashboard hooks across 3+ dashboards.
