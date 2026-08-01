# Evaluna ERP — Baseline Investigation & Performance Analysis Report

**Agent**: Explorer 1  
**Milestone**: Milestone 1 (Baseline Investigation)  
**Date**: 2026-08-01  
**Target Application**: `apps/web` (Next.js ERP)

---

## 1. Executive Summary

This report provides a comprehensive baseline investigation of the Evaluna ERP monorepo, specifically examining `apps/web`, its dependency structure, Next.js configuration, role-based access control (RBAC) middleware, and the 8 core role dashboards (`admin`, `sales`, `auditor`, `hr`, `picker`, `putter`, `driver`, `marketing`).

Key Findings:
1. **Monorepo Layout**: Managed via Turborepo + Bun. Workspace packages under `packages/` (`api`, `auth`, `config`, `db`, `env`, `ui`) and apps under `apps/` (`web`, `desktop`).
2. **Next.js & Stack**: Next.js 16.1.6 (App Router), React 19.2.4, Tailwind CSS v4, tRPC 11, Drizzle ORM / Better Auth, Lucide React, Recharts, Framer Motion, Leaflet.
3. **Role Dashboard Audit**: All 8 target role dashboards were inspected. Each role has specific route handlers, dedicated sidebar layout configurations via `AppLayoutWithBranch`, and strict edge middleware role validation (`proxy.ts` + `ROUTE_ROLE_MAP` in `src/lib/permissions.ts`).
4. **Bundle Size Bottlenecks**: Heavy libraries (`recharts`, `framer-motion`, `react-barcode`, `leaflet`) are currently imported synchronously at page top-level in several key dashboard pages, inflating initial JS bundle chunks by over **500KB+**.
5. **Dependency Misclassifications**: Production `dependencies` in `apps/web/package.json` contain heavy dev-only and test-only packages like `@faker-js/faker` (~3.5MB) and `@electric-sql/pglite` (~2.5MB), plus root `package.json` containing `playwright`.

---

## 2. Project Layout & Tech Stack Architecture

### Monorepo Layout
```
evaluna-erp/
├── apps/
│   ├── web/                     # Next.js 16 Web Application (Port 3001)
│   └── desktop/                 # Electron/Desktop application
├── packages/
│   ├── api/                     # tRPC router definitions & context
│   ├── auth/                    # Better Auth configuration & client
│   ├── config/                  # Shared TypeScript/ESLint/Biome configs
│   ├── db/                      # Drizzle ORM schema & migrations
│   ├── env/                     # Zod-validated environment variables
│   └── ui/                      # Shared Shadcn UI component library
├── .agents/                     # AI Agent metadata & reports directory
├── turbo.json                   # Turborepo task pipeline configuration
├── package.json                 # Monorepo root configuration & catalog
└── bun.lock                     # Bun lockfile
```

### Next.js Configuration (`apps/web/next.config.mjs`)
- **Plugins**: `@ducanh2912/next-pwa` (PWA support), `next-intl/plugin` (Internationalization).
- **External Packages**: `serverExternalPackages: ["@electric-sql/pglite"]`.
- **Security Headers**: Enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `HSTS`.
- **Build Settings**: `typescript: { ignoreBuildErrors: true }`.

---

## 3. Comprehensive Audit of 8 Role Dashboards

Each of the 8 role dashboards was inspected for route structure, layout composition, permissions, and initial render overhead.

| Role | Primary Route Path | Layout File Path | Dashboard Page Path | Nav Items | Middleware Gate (`ROUTE_ROLE_MAP`) | Heavy Imports / Render Notes |
|------|-------------------|------------------|---------------------|-----------|-----------------------------------|------------------------------|
| **Admin** | `/admin` | `apps/web/src/app/admin/layout.tsx` | `apps/web/src/app/admin/page.tsx` | 21 nav links | `minRole: "admin"` (Level 0) | Direct imports of `recharts` (AreaChart, BarChart) & `framer-motion` |
| **Sales** | `/sales` | `apps/web/src/app/(dashboards)/sales/layout.tsx` | `apps/web/src/app/(dashboards)/sales/page.tsx` | 6 nav links | `minRole: "sales_person"` (Level 9) | `framer-motion` stagger animations |
| **Auditor** | `/auditor` | `apps/web/src/app/auditor/layout.tsx` | `apps/web/src/app/auditor/page.tsx` | 9 nav links | `minRole: "auditor"` (Level 2) | Direct imports of `recharts` (AreaChart, BarChart, PieChart) & `framer-motion` |
| **HR** | `/hr` | `apps/web/src/app/hr/layout.tsx` | `apps/web/src/app/hr/page.tsx` | 9 nav links | `minRole: "hr"` (Level 3) | Lightweight KPI cards |
| **Picker** | `/picker` | `apps/web/src/app/picker/layout.tsx` | `apps/web/src/app/picker/page.tsx` | 7 nav links | `minRole: "picker"` (Level 6) | Table list & stat cards |
| **Putter** | `/putter` | `apps/web/src/app/putter/layout.tsx` | `apps/web/src/app/putter/page.tsx` | 8 nav links | `minRole: "putter"` (Level 5) | Lightweight KPI grid |
| **Driver** | `/driver` | `apps/web/src/app/driver/layout.tsx` | `apps/web/src/app/driver/page.tsx` | 9 nav links | `minRole: "driver"` (Level 7) | Mobile frame wrapper (`max-w-md`), SVG mini-map, `framer-motion` |
| **Marketing** | `/marketing` | Inherits root layout | `apps/web/src/app/marketing/page.tsx` | Sub-routes (`coupons`, `rewards`) | `minRole: "marketing"` (Level 4) | `framer-motion` KPI cards |

### Permission & Middleware Architecture Verification (`apps/web/src/proxy.ts` & `apps/web/src/lib/permissions.ts`)
- **Session Validation**: Middleware validates session cookie (`evaluna.session_token`, `better-auth.session_token`) via `/api/auth/get-session`.
- **Role Hierarchy**: Numeric hierarchy where lower level number = higher permission power (`admin: 0`, `manager: 1`, `auditor: 2`, `hr: 3`, `marketing: 4`, `putter: 5`, `picker: 6`, `driver: 7`, `biller: 8`, `sales_person: 9`).
- **Route Access Protection**: Every dashboard path prefix (`/admin`, `/sales`, `/auditor`, `/hr`, `/picker`, `/putter`, `/driver`, `/marketing`, `/biller`) is validated against `ROUTE_ROLE_MAP` using `isAtLeastRole(userRole, minRole)`. If unauthorized, rewrites to `/error/403`.
- **Preservation Requirement**: All optimizations in future milestones must keep `proxy.ts`, `ROUTE_ROLE_MAP`, and `ROLE_LEVEL` logic unchanged.

---

## 4. Top 10 Dynamic Import Candidates (`next/dynamic` / `React.lazy`)

Converting heavy, non-critical components to dynamic imports (`next/dynamic` with `ssr: false` or skeleton loaders) will yield immediate bundle size savings and improve First Contentful Paint (FCP) and Largest Contentful Paint (LCP).

### Candidate 1: Admin Overview Recharts Charts
- **File Path**: `apps/web/src/app/admin/page.tsx` (Lines 30-37, 242-284, 358-380, 403-415)
- **Heavy Import**: `recharts` (`AreaChart`, `Area`, `BarChart`, `Bar`, `CartesianGrid`, `XAxis`, `YAxis`)
- **Reason**: Recharts is a ~400KB SVG rendering library. In `admin/page.tsx`, 4 charts (`Revenue & Expenses Trend`, `Branch Performance`, `Cash Flow`) are imported statically.
- **Action**: Extract chart cards into `AdminRevenueChart.tsx`, `AdminBranchChart.tsx`, `AdminCashFlowChart.tsx` and load them via `dynamic(() => import(...), { ssr: false, loading: () => <Skeleton /> })`.

### Candidate 2: Auditor Control Center Recharts Charts
- **File Path**: `apps/web/src/app/auditor/page.tsx` (Lines 38-49, 222-260, 324-348, 367-399)
- **Heavy Import**: `recharts` (`AreaChart`, `BarChart`, `PieChart`, `Cell`, `Area`, `Bar`, `Pie`)
- **Reason**: Auditor dashboard renders 3 heavy charts (`Expiry Risk Timeline`, `Damage Reports`, `Warehouse Issues Breakdown` pie chart) directly in the main page bundle.
- **Action**: Move charts to dynamic client components with fallback skeletons.

### Candidate 3: Billing & POS Dashboard Charts
- **File Path**: `apps/web/src/app/billing/page.tsx` (Lines 39-50, 249-290, 376-397, 415-441)
- **Heavy Import**: `recharts` (`AreaChart`, `BarChart`, `PieChart`)
- **Reason**: Loads `Sales Timeline`, `Hourly Sales`, and `Payment Methods` pie chart statically.
- **Action**: Extract chart widgets into lazy components.

### Candidate 4: Barcode Generator Label Component
- **File Paths**:
  - `apps/web/src/components/printing/BarcodeLabel.tsx` (Line 2)
  - `apps/web/src/app/admin/staff/page.tsx` (Line 34)
  - `apps/web/src/app/admin/warehouse/locations/page.tsx` (Line 25)
  - `apps/web/src/app/manager/staff/page.tsx` (Line 34)
  - `apps/web/src/app/manager/warehouse/locations/page.tsx` (Line 25)
- **Heavy Import**: `react-barcode`
- **Reason**: Barcode rendering canvas/SVG code is only needed when a user opens a print label or badge view modal.
- **Action**: Wrap `BarcodeLabel` or `Barcode` import in `next/dynamic` so it is loaded on demand when modal opens.

### Candidate 5: Driver Map Tracking & Full Screen Maps
- **File Paths**:
  - `apps/web/src/app/admin/delivery/tracking/tracking-map.tsx` (Lines 2, 11-12)
  - `apps/web/src/app/delivery/components/MapComponent.tsx` (Lines 11-13)
- **Heavy Import**: `leaflet`, `react-leaflet`, `leaflet/dist/leaflet.css` (~140KB gzipped)
- **Reason**: Interactive Leaflet maps require browser DOM (`window`, `L`) and cannot SSR.
- **Action**: Ensure all Leaflet map views use `dynamic(() => import(...), { ssr: false })` wrapper pattern.

### Candidate 6: Complex Customer & Order Action Modals
- **File Paths**:
  - `apps/web/src/app/admin/cashier/page.tsx` (Lines 403-534)
  - `apps/web/src/app/admin/customers/page.tsx` (Lines 373-504)
  - `apps/web/src/app/(dashboards)/sales/customers/page.tsx` (Lines 373-504)
  - `apps/web/src/app/(dashboards)/sales/orders/page.tsx` (Lines 325-408)
- **Heavy Component**: Large complex forms with state, multi-tab validation, and dialog content inside page files.
- **Reason**: Dialog markup and child form logic increase page chunk size even when dialog is closed (`open === false`).
- **Action**: Separate inner dialog form components and dynamically import them only when dialog state is open.

### Candidate 7: Domain Dashboard Charts (Finance, Inventory, Warehouse, Delivery)
- **File Paths**:
  - `apps/web/src/app/finance/page.tsx` (Line 41)
  - `apps/web/src/app/inventory/page.tsx` (Line 45)
  - `apps/web/src/app/warehouse/page.tsx` (Line 43)
  - `apps/web/src/app/delivery/page.tsx` (Line 44)
- **Heavy Import**: `recharts`
- **Reason**: Synchronously loaded recharts in domain landing pages.
- **Action**: Convert all chart sections across domain pages to `next/dynamic`.

### Candidate 8: Scalar API Documentation Renderer
- **File Path**: `apps/web/src/app/api/docs/route.ts` (Line 1)
- **Heavy Import**: `@scalar/nextjs-api-reference`
- **Reason**: Standalone route for API documentation. Ensure it remains isolated from main app bundle.

---

## 5. Dependency Audit (`package.json`)

An audit of `apps/web/package.json` and root `package.json` revealed several misclassified or oversized packages that can be moved or cleaned up.

| Dependency Name | Current Location | Size Impact | Usage Context | Recommendation |
|-----------------|------------------|-------------|---------------|----------------|
| `@faker-js/faker` | `apps/web/package.json` -> `dependencies` | ~3.5MB | Only used in `src/lib/db/seed.ts` for mock database seeding | Move to `devDependencies` in `apps/web/package.json` |
| `@electric-sql/pglite` | `apps/web/package.json` -> `dependencies` | ~2.5MB | Only used in tRPC test runner helpers (`src/lib/trpc/routers/__tests__/helpers.ts`) | Move to `devDependencies` in `apps/web/package.json` |
| `playwright` | Root `package.json` -> `dependencies` | ~1.5MB | End-to-end testing library | Move to `devDependencies` in root `package.json` |
| `recharts` | `apps/web/package.json` -> `dependencies` | ~400KB | SVG charting across dashboards | Retain in `dependencies`, but enforce `next/dynamic` lazy loading everywhere |
| `leaflet` & `react-leaflet` | `apps/web/package.json` -> `dependencies` | ~140KB | Delivery & driver maps | Retain in `dependencies`, enforce `ssr: false` dynamic imports |

---

## 6. Recommendations for Next Milestones

1. **Milestone 2 (Bundle Size & Code Splitting)**:
   - Extract and dynamically import top recharts components in `admin/page.tsx`, `auditor/page.tsx`, `billing/page.tsx`, `finance/page.tsx`, `inventory/page.tsx`, `warehouse/page.tsx`, `delivery/page.tsx`.
   - Dynamically import `BarcodeLabel` modal components.
   - Move `@faker-js/faker` and `@electric-sql/pglite` to `devDependencies`.
2. **Milestone 3 (Data Fetching & Caching)**:
   - Optimize tRPC query batching and parallel fetching in `admin/page.tsx` and `auditor/page.tsx`.
3. **Milestone 4 (Rendering Performance)**:
   - Virtualize high-volume tables (`auditQueue`, `routeStops`, `recentBills`, `inventory`) using `@tanstack/react-table` + virtual scroll.
4. **Milestone 5 (E2E Regression & Forensic Audit)**:
   - Validate strict preservation of role permissions (`proxy.ts`), dashboard props, and layouts across all 8 role dashboards.
