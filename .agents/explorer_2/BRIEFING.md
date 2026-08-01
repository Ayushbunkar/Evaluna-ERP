# BRIEFING — 2026-07-31T20:04:30Z

## Mission
Investigate data fetching, TRPC routers, Prisma ORM schema, database queries, and API endpoints across the Evaluna ERP application.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Read-only investigator / Explorer 2
- Working directory: d:\Evaluna ERP\.agents\explorer_2
- Original parent: 612b1826-a325-4a57-9d9f-4ae77fbb81f9
- Milestone: Milestone 1 (Baseline Investigation)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement code changes in app
- Write metadata/reports only to assigned folder: d:\Evaluna ERP\.agents\explorer_2
- Codebase investigation focusing on Prisma schema, TRPC routers, server-side fetching, 8 dashboards (admin, sales, auditor, hr, picker, putter, driver, marketing), slow/N+1 queries, unpaginated fetches, sequential awaits, and optimization targets.

## Current Parent
- Conversation ID: 612b1826-a325-4a57-9d9f-4ae77fbb81f9
- Updated: 2026-07-31T20:04:30Z

## Investigation State
- **Explored paths**: `packages/db/src/schema.ts`, `apps/web/src/lib/trpc/routers/*.ts` (all role dashboards), `apps/web/src/app/admin/page.tsx`, `auditor/page.tsx`, `hr/page.tsx`, `picker/page.tsx`, `putter/page.tsx`, `driver/page.tsx`, `marketing/page.tsx`, `(dashboards)/sales/page.tsx`.
- **Key findings**:
  1. Only 4 out of 50+ database tables have indexes defined in Drizzle schema. Missing indexes on foreign keys such as `order_items.order_id`, `orders.customer_id`, `transactions.order_id`, etc.
  2. Server dashboard routers execute up to 11 sequential `await` queries (`dashboard.getKpis`, `picker.getDashboardStats`, `auditor.getDashboardStats`, `hr.getDashboardStats`, `putter.getDashboardStats`).
  3. N+1 query loop anti-pattern in `orders.create` mutation (row-by-row inventory checks).
  4. Unpaginated data fetches in `reportsRouter`.
  5. Default `staleTime: 0` in dashboard client components causing redundant refetches.
- **Unexplored areas**: None (investigation complete).

## Key Decisions Made
- Formulated 4 concrete optimization proposals (query parallelization, batching inventory checks, client query caching, schema indexing) preserving router signatures, business logic, and authorization rules.

## Artifact Index
- `d:\Evaluna ERP\.agents\explorer_2\ORIGINAL_REQUEST.md` — Original request log
- `d:\Evaluna ERP\.agents\explorer_2\BRIEFING.md` — Persistent briefing index
- `d:\Evaluna ERP\.agents\explorer_2\progress.md` — Heartbeat progress log
- `d:\Evaluna ERP\.agents\explorer_2\analysis.md` — Comprehensive baseline analysis report
- `d:\Evaluna ERP\.agents\explorer_2\handoff.md` — 5-component handoff report
