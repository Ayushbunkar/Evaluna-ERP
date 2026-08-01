## 2026-08-01T15:00:11Z
<USER_REQUEST>
You are Worker M2 for Milestone 2 (Bundle Size & Code Splitting - R1) of the Evaluna ERP performance optimization project.

Your assigned folder for metadata/reports is: `d:\Evaluna ERP\.agents\worker_m2`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objectives (Requirement R1 & R4):
1. Convert at least 5-7 heavy UI components (specifically Recharts chart blocks across dashboard pages) to dynamic imports using `next/dynamic` (with `ssr: false` or appropriate skeleton loading placeholders).
   Target files identified in investigation:
   - `apps/web/src/app/admin/page.tsx` (Recharts charts)
   - `apps/web/src/app/auditor/page.tsx` (Recharts Area/Bar/Pie charts)
   - `apps/web/src/app/(dashboards)/billing/page.tsx` or `finance/page.tsx` or `inventory/page.tsx` or `warehouse/page.tsx` or `delivery/page.tsx`
   Create clean modular dynamic chart components or wrap heavy components in `next/dynamic` so the main bundle size is significantly reduced.
2. In `apps/web/package.json`:
   - Move `@faker-js/faker` and `@electric-sql/pglite` from `dependencies` to `devDependencies` (these are only used in seed scripts and unit tests).
3. Ensure strict compliance with Requirement R4:
   - Do NOT change any business behavior, authentication middleware, permission rules, TRPC routers, or dashboard routing/layout structures.
   - All 8 role dashboards (`admin`, `sales`, `auditor`, `hr`, `picker`, `putter`, `driver`, `marketing`) must continue to render correctly without errors.

Verification:
- Run build and type check commands (e.g. `bun run check` or `bun run build` or `pnpm build`) to verify there are no compilation or type errors.
- Document all modified files, line numbers, dynamic import wrappers created, and build results in `d:\Evaluna ERP\.agents\worker_m2\handoff.md`.

When finished, send a message to the orchestrator summarizing your changes and referencing your handoff report.
</USER_REQUEST>
