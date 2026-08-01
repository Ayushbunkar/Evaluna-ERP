# Handoff Report — Explorer 1 (Milestone 1: Baseline Investigation)

**Agent**: Explorer 1  
**Milestone**: Milestone 1 (Baseline Investigation)  
**Target Folder**: `d:\Evaluna ERP\.agents\explorer_1`  
**Report File**: `d:\Evaluna ERP\.agents\explorer_1\analysis.md`

---

## 1. Observation

Direct observations from codebase inspection:

### Project Architecture & Dependencies
- Workspace setup: Turborepo + Bun. Root `package.json` contains scripts (`dev`, `build`, `check-types`, `check`).
- Web app location: `apps/web` (Next.js 16.1.6, React 19.2.4, Tailwind CSS v4, tRPC 11).
- `apps/web/package.json` line 24: `"@faker-js/faker": "^10.5.0"` listed under `dependencies`. Direct usage in `apps/web/src/lib/db/seed.ts` (Line 1: `import { faker } from "@faker-js/faker";`).
- `apps/web/package.json` line 19: `"@electric-sql/pglite": "^0.5.4"` listed under `dependencies`. Direct usage in `apps/web/src/lib/trpc/routers/__tests__/helpers.ts` (Line 1: `import { PGlite } from "@electric-sql/pglite";`).
- Root `package.json` line 45: `"playwright": "^1.61.1"` listed under `dependencies`.

### Role Dashboards & Layouts
- **Admin**: Route `/admin`. Layout at `apps/web/src/app/admin/layout.tsx` (74 lines, 21 nav items). Page at `apps/web/src/app/admin/page.tsx` (452 lines).
  - Verbatim lines 30-37: `import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";`
  - Verbatim line 16: `import { motion } from "framer-motion";`
- **Sales**: Route `/sales`. Layout at `apps/web/src/app/(dashboards)/sales/layout.tsx` (36 lines, 6 nav items). Page at `apps/web/src/app/(dashboards)/sales/page.tsx` (193 lines).
  - Uses `framer-motion` stagger list animations.
- **Auditor**: Route `/auditor`. Layout at `apps/web/src/app/auditor/layout.tsx` (46 lines, 9 nav items). Page at `apps/web/src/app/auditor/page.tsx` (552 lines).
  - Verbatim lines 38-49: `import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";`
- **HR**: Route `/hr`. Layout at `apps/web/src/app/hr/layout.tsx` (42 lines, 9 nav items). Page at `apps/web/src/app/hr/page.tsx` (47 lines).
- **Picker**: Route `/picker`. Layout at `apps/web/src/app/picker/layout.tsx` (38 lines, 7 nav items). Page at `apps/web/src/app/picker/page.tsx` (175 lines).
- **Putter**: Route `/putter`. Layout at `apps/web/src/app/putter/layout.tsx` (44 lines, 8 nav items). Page at `apps/web/src/app/putter/page.tsx` (46 lines).
- **Driver**: Route `/driver`. Layout at `apps/web/src/app/driver/layout.tsx` (51 lines, mobile frame wrapper `max-w-md`). Page at `apps/web/src/app/driver/page.tsx` (344 lines).
- **Marketing**: Route `/marketing`. Subpages `/marketing/coupons` & `/marketing/rewards`. Page at `apps/web/src/app/marketing/page.tsx` (167 lines).

### Permissions & Middleware Gates
- Middleware file: `apps/web/src/proxy.ts` (171 lines).
- Permissions matrix & route map: `apps/web/src/lib/permissions.ts` (295 lines).
- Verbatim `ROUTE_ROLE_MAP` (lines 276-294):
  - `/admin` -> `minRole: "admin"`
  - `/auditor` -> `minRole: "auditor"`
  - `/hr` -> `minRole: "hr"`
  - `/marketing` -> `minRole: "marketing"`
  - `/putter` -> `minRole: "putter"`
  - `/picker` -> `minRole: "picker"`
  - `/driver` -> `minRole: "driver"`
  - `/biller` -> `minRole: "biller"`
  - `/sales` -> `minRole: "sales_person"`

---

## 2. Logic Chain

1. **Observation**: Recharts (400KB+ minified library) and Framer Motion are directly imported at the top of main dashboard page files (`admin/page.tsx`, `auditor/page.tsx`, `billing/page.tsx`, `finance/page.tsx`, `inventory/page.tsx`, `warehouse/page.tsx`, `delivery/page.tsx`).
2. **Step**: Synchronous top-level imports force the Next.js bundler to include Recharts inside the initial JS bundle for these routes.
3. **Inference**: Converting chart components to `next/dynamic` client components (`ssr: false` or skeleton loading) will defer chart bundle evaluation until after initial render, reducing page chunk size by ~400KB.
4. **Observation**: `@faker-js/faker` and `@electric-sql/pglite` are placed in `dependencies` in `apps/web/package.json`, but grep searches show `@faker-js/faker` is only used in `src/lib/db/seed.ts` (seed script) and `@electric-sql/pglite` is only used in unit test setup (`src/lib/trpc/routers/__tests__/helpers.ts`).
5. **Inference**: Moving these packages to `devDependencies` removes heavy dev-only code (~6MB total) from production app dependencies without altering runtime behavior.
6. **Observation**: All 8 role dashboards have distinct layouts with `AppLayoutWithBranch` and explicit route protection in `ROUTE_ROLE_MAP` inside `proxy.ts`.
7. **Inference**: Optimization work in Milestone 2 must preserve all layout wrapper props and middleware configurations without altering auth check signatures.

---

## 3. Caveats

- **Runtime Bundle Analysis**: Exact bundle chunk byte counts require running a production build (`bun run build` / `next build`).
- **Server Component Constraints**: Any component converted to `next/dynamic` with `ssr: false` must be a Client Component (`"use client"`). Since dashboard pages are already `"use client"`, this is safe.
- **Uninvestigated Areas**: Deep TRPC query execution profiling and database index optimization are scheduled for Milestone 3. Table virtualization is scheduled for Milestone 4.

---

## 4. Conclusion

The baseline investigation is complete. The application architecture is well-structured, but bundle size is negatively impacted by top-level synchronous imports of Recharts, Barcode generators, and Leaflet maps across multiple role dashboards. Additionally, `package.json` contains oversized dev/test dependencies.

Top 10 candidates for dynamic import have been identified in `analysis.md`. All 8 role dashboards and their middleware security gates have been audited and documented.

---

## 5. Verification Method

1. **Inspect Report Files**:
   - `d:\Evaluna ERP\.agents\explorer_1\analysis.md`
   - `d:\Evaluna ERP\.agents\explorer_1\handoff.md`
2. **Verify Role Routes & Layouts**:
   - Inspect `apps/web/src/proxy.ts` line 112 to verify `isDashboardRoute` logic.
   - Inspect `apps/web/src/lib/permissions.ts` lines 276-294 (`ROUTE_ROLE_MAP`).
   - Check presence of all 8 role page files:
     - `apps/web/src/app/admin/page.tsx`
     - `apps/web/src/app/(dashboards)/sales/page.tsx`
     - `apps/web/src/app/auditor/page.tsx`
     - `apps/web/src/app/hr/page.tsx`
     - `apps/web/src/app/picker/page.tsx`
     - `apps/web/src/app/putter/page.tsx`
     - `apps/web/src/app/driver/page.tsx`
     - `apps/web/src/app/marketing/page.tsx`
3. **Invalidation Conditions**:
   - Any modification to `ROUTE_ROLE_MAP` or `proxy.ts` that removes role level checks.
   - Any removal of `AppLayoutWithBranch` from role layout files.
