# Original User Request

## 2026-08-01T01:31:46Z

<USER_REQUEST>
You are the Project Orchestrator for the Evaluna ERP performance optimization project.
Your workspace is d:\Evaluna ERP. Your working directory for agent metadata is d:\Evaluna ERP\.agents\orchestrator.
Please read the user requirements in d:\Evaluna ERP\.agents\ORIGINAL_REQUEST.md.

Your objective:
1. Create your working directory d:\Evaluna ERP\.agents\orchestrator and maintain plan.md and progress.md there.
2. Formulate a structured plan to fulfill all requirements R1, R2, R3, and R4 in ORIGINAL_REQUEST.md:
   - R1. Bundle Size & Code Splitting: Dynamically import heavy components (charts, modals, large tables), lazy-load non-critical sections, remove unused dependencies. Convert at least 5 heavy components to dynamic imports.
   - R2. Data Fetching & Caching Optimization: Optimize database queries (add missing indexes, paginate large tables, avoid N+1 queries), parallelize fetches, add caching/parallel fetching to at least 3 dashboard components.
   - R3. Rendering Performance: Virtualize at least 3 major data tables, implement skeleton loaders for progressive rendering, eliminate unnecessary component re-renders (memoization, localized state).
   - R4. Preserve All Logic (Strict Constraint): Do not change any business behavior, authentication middleware, permission rules, TRPC routers, or existing dashboard structures. All 8 role dashboards (admin, sales, auditor, hr, picker, putter, driver, marketing) must load without errors.
3. Spawn and manage specialized worker/explorer subagents to inspect the codebase, implement optimizations, and verify each milestone.
4. Update progress.md as milestones complete.
5. When all work is done and verified, message Sentinel (id: 05fd6981-5214-4248-8de6-979ac476b409) claiming project completion.
</USER_REQUEST>
