# BRIEFING — 2026-08-01T15:00:11Z

## Mission
Milestone 2: Bundle Size & Code Splitting (R1 & R4) - Convert heavy Recharts components across dashboard pages to dynamic imports using `next/dynamic` (with `ssr: false`), move `@faker-js/faker` and `@electric-sql/pglite` to devDependencies in `apps/web/package.json`, and ensure all 8 role dashboards compile cleanly and function properly.

## 🔒 My Identity
- Archetype: implementer/qa/specialist
- Roles: implementer, qa, specialist
- Working directory: d:\Evaluna ERP\.agents\worker_m2
- Original parent: 612b1826-a325-4a57-9d9f-4ae77fbb81f9
- Milestone: Milestone 2 (R1 & R4)

## 🔒 Key Constraints
- Do NOT change any business behavior, authentication middleware, permission rules, TRPC routers, or dashboard routing/layout structures.
- All 8 role dashboards (`admin`, `sales`, `auditor`, `hr`, `picker`, `putter`, `driver`, `marketing`) must continue to render correctly without errors.
- DO NOT CHEAT (no hardcoding, facade outputs, etc.).

## Current Parent
- Conversation ID: 612b1826-a325-4a57-9d9f-4ae77fbb81f9
- Updated: not yet

## Task Summary
- **What to build**: Modular dynamic Recharts chart components loaded with `next/dynamic` (`ssr: false`) with skeleton placeholders, move dev dependencies in `apps/web/package.json`.
- **Success criteria**: Recharts components dynamically imported across dashboard pages (at least 5-7 chart components), `@faker-js/faker` and `@electric-sql/pglite` in `devDependencies`, clean build and typecheck.
- **Interface contracts**: PROJECT.md
- **Code layout**: apps/web

## Key Decisions Made
- Initialized briefing and plan.

## Artifact Index
- d:\Evaluna ERP\.agents\worker_m2\ORIGINAL_REQUEST.md — Original User Request log
- d:\Evaluna ERP\.agents\worker_m2\BRIEFING.md — Persistent briefing file
- d:\Evaluna ERP\.agents\worker_m2\progress.md — Progress heartbeat

## Change Tracker
- **Files modified**: None yet
- **Build status**: Pending initial run
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Pending
- **Tests added/modified**: Pending

## Loaded Skills
- None explicitly loaded
