# Orchestration Plan — Evaluna ERP Performance Optimization

## Objectives
Optimize bundle size, data fetching, database queries, and rendering performance across the Evaluna ERP application while strictly maintaining zero regressions across all 8 role dashboards.

## Milestone Decomposition
1. **Milestone 1: Investigation & Baseline Audit**
   - Explore codebase structure, Next.js components, TRPC routers, database schemas, and bundle dependencies.
   - Identify heavy components suitable for dynamic import (target >= 5).
   - Identify slow queries / missing indexes / N+1 data fetching points (target >= 3 dashboard components).
   - Identify large tables requiring virtualization (target >= 3 major data tables) and components needing skeleton loaders / memoization.
   - Output baseline findings in `.agents/explorer_1/analysis.md`.

2. **Milestone 2: Bundle Size & Code Splitting (R1)**
   - Dynamically import heavy components (charts, modals, large tables).
   - Lazy-load non-critical sections.
   - Remove unused dependencies if any.
   - Verify bundle reduction and test component loading.

3. **Milestone 3: Data Fetching & Caching Optimization (R2)**
   - Optimize Prisma/TRPC database queries (indexes, pagination, avoid N+1 queries).
   - Implement parallel fetching and caching for heavy dashboard widgets (>= 3 components).
   - Verify zero changes to router logic or permission middleware.

4. **Milestone 4: Rendering Performance & Table Virtualization (R3)**
   - Virtualize at least 3 major data tables.
   - Implement skeleton loaders for progressive rendering.
   - Eliminate unnecessary component re-renders (memoization, localized state).

5. **Milestone 5: Verification, E2E Regression Checks & Forensic Audit (R4)**
   - Run full build and test suite.
   - Verify all 8 role dashboards (admin, sales, auditor, hr, picker, putter, driver, marketing) load without 401/403 or routing errors.
   - Conduct Forensic Audit to ensure zero business logic / integrity regressions.

## Execution Strategy
- Iteration Loop per milestone: Explorer -> Worker -> Reviewer -> Challenger -> Forensic Auditor.
