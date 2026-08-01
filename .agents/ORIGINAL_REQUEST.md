# Original User Request

## 2026-07-31T20:01:29Z

# Teamwork Project Prompt

Optimize the Evaluna ERP Next.js application for maximum page load speed and rendering performance without breaking any existing business logic, routes, or permissions.

Working directory: d:\Evaluna ERP
Integrity mode: development

## Requirements

### R1. Bundle Size & Code Splitting
Reduce JavaScript bundle sizes by dynamically importing heavy components (charts, modals, large tables), lazy-loading non-critical sections, and removing unused dependencies.

### R2. Data Fetching & Caching Optimization
Optimize database queries (add missing indexes, paginate large tables, avoid N+1 queries) and improve frontend data fetching (parallel fetches, implement caching for heavy dashboard widgets).

### R3. Rendering Performance
Virtualize large lists and tables, implement skeleton loaders for progressive rendering, and eliminate unnecessary component re-renders (memoization, localized state).

### R4. Preserve All Logic (Strict Constraint)
Do not change any business behavior, authentication middleware, permission rules, TRPC routers, or existing dashboard structures. The visual appearance and functionality must remain exactly the same, only faster.

## Acceptance Criteria

### Performance Metrics
- [ ] Implement virtualization on at least 3 major data tables.
- [ ] Convert at least 5 heavy components (e.g., charts, complex modals) to use dynamic imports.
- [ ] Add caching or parallel fetching to at least 3 dashboard components.

### Regression Checks
- [ ] All 8 role dashboards (admin, sales, auditor, hr, picker, putter, driver, marketing) load without 401/403 or routing errors.
- [ ] Data tables still successfully display and paginate database records.
- [ ] The authentication middleware still functions correctly.
