## 2026-08-01T15:10:09Z
You are Worker M2 (replacement) for Milestone 2: Bundle Size & Code Splitting (R1) of the Evaluna ERP performance optimization project.

Working directory: d:\Evaluna ERP\.agents\worker_m2

Objective: Complete Milestone 2 refactoring for bundle size reduction and code splitting without breaking any existing functionality, routes, or permissions.

Detailed Tasks:
1. Move dev-only/test-only packages in apps/web/package.json:
   - Move @faker-js/faker and @electric-sql/pglite from dependencies to devDependencies.
2. Code-split heavy components (target >= 5 components) using next/dynamic with { ssr: false } and fallback skeletons:
   - Admin Dashboard (apps/web/src/app/admin/page.tsx): Dynamically import Recharts chart widgets.
   - Auditor Dashboard (apps/web/src/app/auditor/page.tsx): Dynamically import Recharts chart widgets.
   - Domain Dashboards (billing/page.tsx, finance/page.tsx, inventory/page.tsx, warehouse/page.tsx, delivery/page.tsx): Dynamically import Recharts charts.
   - BarcodeLabel (apps/web/src/components/printing/BarcodeLabel.tsx): Wrap react-barcode import or BarcodeLabel in dynamic lazy loading.
   - Leaflet Map components (apps/web/src/app/admin/delivery/tracking/tracking-map.tsx, apps/web/src/app/delivery/components/MapComponent.tsx): Use next/dynamic with ssr: false.
3. Verification:
   - Run type checks / build checks to verify zero TypeScript errors or build failures.
   - Document commands executed and build outputs.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Output Requirements:
- Update d:\Evaluna ERP\.agents\worker_m2\progress.md as you work.
- Write your completed handoff report to d:\Evaluna ERP\.agents\worker_m2\handoff.md.
- Send a message to orchestrator upon completion.
