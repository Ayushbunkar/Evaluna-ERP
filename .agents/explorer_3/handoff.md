# Handoff Report - Explorer 3

## 1. Observation

### Table Component & Virtualization Observations
- **`packages/ui/src/components/data-table.tsx` (Lines 217–254)**:
  `DataTable` loops directly through all rows: `table.getRowModel().rows.map((row) => <TableRow ...>)`. It does not use virtualization (`@tanstack/react-virtual` or `react-window`).
- **`apps/web/src/app/admin/products/page.tsx` (Lines 280–414)**:
  Product Master catalog renders all items directly: `{filteredProducts?.map((product, i) => <motion.tr key={product.id} transition={{ delay: i * 0.05 }}> ... </motion.tr>)}`.
- **`apps/web/src/app/admin/inventory/page.tsx` (Lines 150–226)**:
  Stock level table maps all items directly with `<motion.tr transition={{ delay: i * 0.05 }}>`.
- **`apps/web/src/app/admin/orders/page.tsx` (Lines 308–316)**:
  Order list renders via `DataTable` without virtualization.

### Progressive Skeleton Loading Observations
- **`apps/web/src/app/auditor/page.tsx` (Lines 93–99)**:
  `if (isLoading || !data) return (<div className="flex h-full min-h-[400px] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-primary border-b-2" /></div>);`
- **`apps/web/src/app/driver/page.tsx` (Lines 95–101)**:
  `if (isLoading || !data) return (<div className="flex h-full min-h-[400px] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-primary border-b-2" /></div>);`
- **`apps/web/src/app/picker/pick-lists/page.tsx` (Lines 50–53)**:
  `{isLoading ? <div className="p-8 text-center text-muted-foreground">Loading pick lists...</div> : ...}`
- **`apps/web/src/app/putter/page.tsx` (Lines 18–20)**:
  `{isLoading ? <p>Loading stats...</p> : ...}`
- **`apps/web/src/app/marketing/page.tsx` (Lines 152–156)**:
  `{isLoading ? <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" /></div> : ...}`
- **`apps/web/src/app/admin/attendance/page.tsx` (Lines 232–241)**:
  `{isLoading && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading attendance...</TableCell></TableRow>}`
- **`apps/web/src/app/admin/accounting/coa/page.tsx` (Lines 171–173)**:
  `{isLoading ? <p>Loading...</p> : ...}`
- **`apps/web/src/app/(dashboards)/sales/cashbook/page.tsx` (Lines 257–267)**:
  Lacks explicit `loadingLedger` check; when `loadingLedger` is true, falls through to render "No recent cash transactions today" as a flash before data arrives.

### Re-rendering & Memoization Hotspots
- **`apps/web/src/app/admin/orders/page.tsx` (Lines 74–121, 223–254)** & **`admin/customers/page.tsx` (Lines 81–129, 131–160)**:
  `tableColumns`, `actionsColumn`, and `exportColumns` are defined inline without `useMemo`. Reference changes every render, invalidating `useMemo` inside `DataTable` line 162 (`columnDefs`).
- **`apps/web/src/app/admin/products/page.tsx` (Lines 54–71)**:
  5 separate Array `.map()` / `.filter()` calculations (`categories`, `filteredProducts`, `lowStockCount`, `missingMarginCount`, `fastMovingCount`) run synchronously on every render without `useMemo`.
- **`packages/ui/src/components/data-table.tsx` (Lines 155–160)**:
  `window.addEventListener("resize", check)` triggers `setIsMobile` on every resize event un-throttled.

---

## 2. Logic Chain

1. **Table Virtualization Bottlenecks**:
   - *Premise*: ERP databases store large volumes of items (products, SKUs, orders).
   - *Observation*: `Product Master` (`admin/products/page.tsx`), `Inventory` (`admin/inventory/page.tsx`), and `DataTable` (`packages/ui/src/components/data-table.tsx`) map the entire dataset into DOM table rows.
   - *Inference*: Rendering 1,000+ rows creates 10,000+ DOM nodes simultaneously, causing thread freezing, high memory allocation, and scroll lag. Adding `@tanstack/react-virtual` to `DataTable` and custom table pages will limit DOM nodes to ~15-20 rows.

2. **Skeleton Loading Deficiencies**:
   - *Premise*: Modern web applications use progressive skeleton UI to eliminate Cumulative Layout Shift (CLS) and maintain spatial orientation during async data fetches.
   - *Observation*: 8 key dashboard pages (`auditor/page.tsx`, `driver/page.tsx`, `picker/pick-lists/page.tsx`, `putter/page.tsx`, `marketing/page.tsx`, `admin/attendance/page.tsx`, `admin/accounting/coa/page.tsx`, `sales/cashbook/page.tsx`) use full-screen spinners, plain text ("Loading..."), or miss loading checks altogether.
   - *Inference*: Users experience abrupt layout jumps and visual instability. Structural skeleton components will maintain layout stability and improve perceived performance.

3. **Re-rendering Hotspots**:
   - *Observation*: Column objects in `admin/orders/page.tsx` and `admin/customers/page.tsx` are instantiated inline on every render.
   - *Inference*: `DataTable` relies on `useMemo(..., [columns])`. Since `columns` is re-created every render, `DataTable` re-runs column processing and re-renders table headers and cells on every state change (e.g. typing in search inputs).

---

## 3. Caveats

- **Network Mode**: Investigation was performed in CODE_ONLY mode via static code analysis and structural inspection. No external network requests were made.
- **Production Dataset Sizes**: Actual dataset sizes will vary depending on customer database scale, but ERP design must account for high cardinality (1,000+ SKUs / transactions).

---

## 4. Conclusion

Evaluna ERP displays clear performance optimization opportunities in table rendering, state memoization, and user feedback:
1. **Virtualization**: Adding `@tanstack/react-virtual` to `DataTable` in `packages/ui` and custom tables (`admin/products/page.tsx`, `admin/inventory/page.tsx`) will eliminate DOM node bloat for large catalogs and order histories.
2. **Skeleton UI**: Replacing full-page spinners and plain text loading strings across 8 dashboards (`auditor`, `driver`, `picker`, `putter`, `marketing`, `admin/attendance`, `admin/accounting/coa`, `sales/cashbook`) with progressive skeleton loaders will stabilize UX and eliminate CLS.
3. **Memoization & Animation Cleanup**: Wrapping table column definitions and computed statistics in `useMemo`, throttling window resize listeners in `DataTable`, and removing per-row Framer Motion stagger delays on large lists will drastically reduce re-renders and CPU animation overhead.

---

## 5. Verification Method

To independently verify these findings:
1. **Inspect Files & Line Numbers**:
   - View `packages/ui/src/components/data-table.tsx` lines 155-160 and 217-254.
   - View `apps/web/src/app/admin/products/page.tsx` lines 54-71 and 280-414.
   - View `apps/web/src/app/auditor/page.tsx` lines 93-99.
   - View `apps/web/src/app/driver/page.tsx` lines 95-101.
   - View `apps/web/src/app/picker/pick-lists/page.tsx` lines 50-53.
   - View `apps/web/src/app/admin/orders/page.tsx` lines 74-121.
2. **Report Reference**:
   - Comprehensive analysis is documented in `d:\Evaluna ERP\.agents\explorer_3\analysis.md`.
