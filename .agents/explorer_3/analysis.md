# Evaluna ERP - Table Performance, Skeleton States & Re-rendering Analysis

**Module**: Baseline Investigation (Milestone 1)  
**Explorer**: Explorer 3  
**Target Application**: `Evaluna ERP` (`apps/web` and `packages/ui`)  
**Date**: 2026-08-01  

---

## Executive Summary

A comprehensive investigation was conducted into table rendering performance, loading feedback mechanisms, and state management / re-rendering bottlenecks across all key role-based dashboards in Evaluna ERP (`admin`, `sales`, `auditor`, `hr`, `picker`, `putter`, `driver`, and `marketing`).

### Core Findings
1. **Unvirtualized Large Tables**: All data tables—including critical high-cardinality entities such as Product Catalog (1,000+ items), Inventory Stock Levels (thousands of SKUs across branches), and Order Histories—render every record directly into the DOM (`table.map()`). On large datasets, this causes high layout thrashing, DOM node bloat, slow page transitions, and UI freeze.
2. **Missing Progressive Skeleton Loading**: 8 major dashboards and data components rely on full-screen spinners (`<div className="animate-spin..." />`) or plain text strings (e.g., `"Loading pick lists..."`, `"Loading attendance..."`) during data fetches. This creates poor UX and high Cumulative Layout Shift (CLS).
3. **Re-Rendering Hotspots**:
   - Column definitions and action handlers in pages using `@evaluna/ui/components/data-table` are re-created as un-memoized objects on every render, invalidating TanStack Table column definitions on every keystroke/state change.
   - Un-memoized computed KPI statistics and catalog filtering run on every single render in pages like `admin/products/page.tsx`.
   - Framer Motion stagger animations (`delay: i * 0.05`) are applied to every single `<tr>` in large tables, generating huge JS animation frame overhead and delays exceeding 10 seconds for items further down the table.
   - Window resize event listeners in `DataTable` trigger state updates on every resize event without debouncing or throttling.

---

## 1. Table Component Inventory Across Dashboards

| Dashboard / Module | File Path | Table Implementation Type | Rendering Mechanism | Dataset Size & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Admin - Product Master** | `apps/web/src/app/admin/products/page.tsx` | Raw HTML `<table>` | `filteredProducts?.map((product, i) => <motion.tr ...>)` | Full catalog (1,000+ rows rendered at once; staggered motion) |
| **Admin - Inventory Stock** | `apps/web/src/app/admin/inventory/page.tsx` | Raw HTML `<table>` | `items.map((item, i) => <motion.tr ...>)` | Multi-branch stock items (thousands of SKUs rendered at once) |
| **Admin - Orders** | `apps/web/src/app/admin/orders/page.tsx` | Shared `DataTable` (`@tanstack/react-table`) | `filteredOrders.map()` inside `DataTable` | High-frequency orders list (unvirtualized) |
| **Admin - Customers** | `apps/web/src/app/admin/customers/page.tsx` | Shared `DataTable` (`@tanstack/react-table`) | `filteredCustomers.map()` inside `DataTable` | Customer directory (unvirtualized) |
| **Admin - Attendance** | `apps/web/src/app/admin/attendance/page.tsx` | UI `<Table>` | `attendanceList.map()` | Daily staff clock-in/out records |
| **Admin - COA** | `apps/web/src/app/admin/accounting/coa/page.tsx` | UI `<StaggerList>` | `accounts?.map((acc) => <StaggerItem ...>)` | Chart of accounts tree |
| **Sales - Orders** | `apps/web/src/app/(dashboards)/sales/orders/page.tsx` | Shared `DataTable` | `orders.map()` inside `DataTable` | Branch sales transactions |
| **Sales - Cashbook** | `apps/web/src/app/(dashboards)/sales/cashbook/page.tsx` | Raw HTML `<table>` | `ledger?.items?.map((tx) => ...)` | High-volume daily cash flow register |
| **Auditor - Queue & History** | `apps/web/src/app/auditor/page.tsx` | UI `<Table>` | `data.auditQueue.map()`, `data.recentAudits.map()` | Stock cycle counts & mismatches |
| **HR - Attendance & Directory** | `apps/web/src/app/hr/attendance/page.tsx` & `employees/page.tsx` | Shared `DataTable` | `data.map()` inside `DataTable` | Staff records and monthly logs |
| **Picker - Pick Lists** | `apps/web/src/app/picker/pick-lists/page.tsx` | Raw HTML `<table>` | `pickLists.map((row) => ...)` | Real-time warehouse picking tasks |
| **Putter - Put-Away** | `apps/web/src/app/putter/put-away/page.tsx` | Shared `DataTable` | Empty fallback / `data.map()` | Real-time bin put-away queue |
| **Marketing - Coupons** | `apps/web/src/app/marketing/coupons/page.tsx` | Shared `DataTable` | `coupons.map()` | Active promo codes and redemptions |

---

## 2. Major Tables Requiring Virtualization

We have identified **3 major data tables** that process high-cardinality datasets and currently suffer severe DOM rendering overhead.

### 1. Product Master Catalog Table
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\admin\products\page.tsx`
- **Line Numbers**: 280–414
- **Current Table Structure**:
  ```tsx
  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
    {isLoading
      ? Array(5).fill(0).map(...)
      : filteredProducts?.map((product, i) => (
          <motion.tr
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {/* Checkbox, Product Name, SKU, Category, Prices, Margin, Status, Actions */}
          </motion.tr>
        ))}
  </tbody>
  ```
- **Bottleneck Analysis**:
  - In enterprise ERP deployment, catalog items exceed 1,000–10,000+ items.
  - Rendering 1,000 `<motion.tr>` elements produces over 10,000 DOM nodes.
  - `transition={{ delay: i * 0.05 }}` causes the 1,000th item to wait 50 seconds before animating!
- **Virtualization Proposal**:
  Integrate `@tanstack/react-virtual` (`useVirtualizer`). Fixed container height (e.g., `h-[600px]`), estimated row height `56px`. Renders only ~15–20 DOM rows at any given scroll position.

---

### 2. Inventory Stock Levels Table
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\admin\inventory\page.tsx`
- **Line Numbers**: 150–226
- **Current Table Structure**:
  ```tsx
  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
    {isLoading
      ? Array(5).fill(0).map(...)
      : items.map((item, i) => (
          <motion.tr key={item.id} transition={{ delay: i * 0.05 }}>
            {/* Product Info, Branch Location, Qty on Hand, Reorder Level, Status, Update Button */}
          </motion.tr>
        ))}
  </tbody>
  ```
- **Bottleneck Analysis**:
  - Inventory tracks stock per product per branch location (SKU x Warehouse Location matrix).
  - Whole dataset mapping without pagination or virtualization leads to heavy scroll jank during stock audits.
- **Virtualization Proposal**:
  Implement `@tanstack/react-virtual` with dynamic item sizing or fixed row height `52px`.

---

### 3. Orders Master Table (`DataTable` Primitive)
- **File Paths**: 
  - `d:\Evaluna ERP\apps\web\src\app\admin\orders\page.tsx` (Lines 308–316)
  - `d:\Evaluna ERP\apps\web\src\app\(dashboards)\sales\orders\page.tsx`
  - Base Component: `d:\Evaluna ERP\packages\ui\src\components\data-table.tsx` (Lines 217–254)
- **Current Table Structure**:
  ```tsx
  {/* packages/ui/src/components/data-table.tsx */}
  <TableBody>
    {table.getRowModel().rows.map((row) => (
      <TableRow key={row.id} onClick={() => onRowClick?.(row.original)}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
  ```
- **Bottleneck Analysis**:
  - `DataTable` is used across 20+ pages in the application. It takes an array of data and maps directly over `table.getRowModel().rows`.
  - When query results return hundreds of order records, `DataTable` mounts every row to the DOM simultaneously.
- **Virtualization Proposal**:
  Add built-in virtualization to `DataTable` in `packages/ui/src/components/data-table.tsx` using `useVirtualizer` from `@tanstack/react-virtual`. This will instantly virtualize order tables, customer tables, supplier tables, and transaction ledgers across the entire ERP without breaking existing props!

---

## 3. Progressive Skeleton Loading Deficiencies

Multiple role-based dashboards currently lack progressive skeleton feedback, resorting to intrusive centered spinners or plain text strings.

### Key Deficiencies Inventory

#### 1. Auditor Control Center (`auditor/page.tsx`)
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\auditor\page.tsx`
- **Line Numbers**: 93–99
- **Current Anti-pattern**:
  ```tsx
  if (isLoading || !data) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-primary border-b-2" />
      </div>
    );
  }
  ```
- **Impact**: The user experiences a blank canvas with a spinner. When data arrives, 6 KPI cards, 3 recharts, 1 live alert feed, and 2 data tables pop into existence simultaneously, causing visual jarring and layout shift.
- **Remediation**: Replace with a structural `AuditorDashboardSkeleton` mirroring the bento grid: 6 KPI skeleton cards (`<Skeleton className="h-24 w-full" />`), 3 chart skeletons, and skeleton table rows.

#### 2. Driver Mobile Dashboard (`driver/page.tsx`)
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\driver\page.tsx`
- **Line Numbers**: 95–101
- **Current Anti-pattern**:
  ```tsx
  if (isLoading || !data) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-primary border-b-2" />
      </div>
    );
  }
  ```
- **Impact**: High friction for mobile drivers on cellular connections.
- **Remediation**: Render top app bar skeleton, next delivery drop-off card skeleton (`<Skeleton className="h-64 w-full rounded-xl" />`), and 4 thumb action button skeletons.

#### 3. Picker Pick-Lists (`picker/pick-lists/page.tsx`)
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\picker\pick-lists\page.tsx`
- **Line Numbers**: 50–53
- **Current Anti-pattern**:
  ```tsx
  {isLoading ? (
    <div className="p-8 text-center text-muted-foreground">
      Loading pick lists...
    </div>
  ) : ...
  ```
- **Impact**: Plain text string `"Loading pick lists..."` inside the card.
- **Remediation**: Render 5 table row skeletons (`<TableRow>{Array(9).fill(0).map(() => <TableCell><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>`).

#### 4. Putter Dashboard (`putter/page.tsx`)
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\putter\page.tsx`
- **Line Numbers**: 18–20
- **Current Anti-pattern**:
  ```tsx
  {isLoading ? <p>Loading stats...</p> : ...}
  ```
- **Impact**: Plain text string `<p>Loading stats...</p>`.
- **Remediation**: Render 4 KPI card skeletons (`<Skeleton className="h-28 w-full rounded-xl" />`).

#### 5. Marketing Dashboard (`marketing/page.tsx`)
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\marketing\page.tsx`
- **Line Numbers**: 152–156
- **Current Anti-pattern**:
  ```tsx
  {isLoading ? (
    <div className="flex justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
    </div>
  ) : ...
  ```
- **Impact**: Centered spinner inside card body while KPI cards above lack skeleton placeholders.
- **Remediation**: Add progressive skeleton state for KPI cards and marketing activity feed.

#### 6. Admin Staff Attendance (`admin/attendance/page.tsx`)
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\admin\attendance\page.tsx`
- **Line Numbers**: 232–241
- **Current Anti-pattern**:
  ```tsx
  {isLoading && (
    <TableRow>
      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
        Loading attendance...
      </TableCell>
    </TableRow>
  )}
  ```
- **Impact**: `"Loading attendance..."` text inside a table row.
- **Remediation**: Replace with 5 skeleton table rows.

#### 7. Chart of Accounts (`admin/accounting/coa/page.tsx`)
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\admin\accounting\coa\page.tsx`
- **Line Numbers**: 171–173
- **Current Anti-pattern**:
  ```tsx
  {isLoading ? <p>Loading...</p> : ...}
  ```
- **Impact**: Plain text string `<p>Loading...</p>`.
- **Remediation**: Render skeleton ledger tree rows.

#### 8. Sales Cashbook (`(dashboards)/sales/cashbook/page.tsx`)
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\(dashboards)\sales\cashbook\page.tsx`
- **Line Numbers**: 257–267
- **Current Anti-pattern**: Lacks explicit `loadingLedger` state check for the ledger table. When `loadingLedger` is true, `ledger?.items` evaluates to `undefined`, falling through to line 257 `(!ledger?.items || ledger.items.length === 0)` and incorrectly showing "No recent cash transactions today" before data arrives.
- **Remediation**: Add `loadingLedger ? <SkeletonRows /> : (!ledger?.items ...)` conditional branch.

---

## 4. Re-Rendering Hotspots & State Bottlenecks

### 1. Un-memoized Columns & Action Headers in `DataTable` Pages
- **Affected Files**:
  - `d:\Evaluna ERP\apps\web\src\app\admin\orders\page.tsx` (Lines 74–121, 223–254)
  - `d:\Evaluna ERP\apps\web\src\app\admin\customers\page.tsx` (Lines 81–129, 131–160)
  - `d:\Evaluna ERP\apps\web\src\app\(dashboards)\sales\orders\page.tsx`
  - `d:\Evaluna ERP\apps\web\src\app\(dashboards)\sales\customers\page.tsx`
- **Root Cause**: `tableColumns`, `actionsColumn`, and `exportColumns` are defined inline directly in the component render loop as un-memoized object literals.
- **Impact**: In `DataTable` (`packages/ui/src/components/data-table.tsx` Line 162):
  ```tsx
  const columnDefs = useMemo(() => columns.map(mapToColumnDef), [columns]);
  ```
  Because `columns` is a new array reference on every single render, `columnDefs` recalculates on every keystroke in search filters or dialog toggles, forcing TanStack Table to re-initialize column definitions and re-render every table cell.
- **Fix**: Wrap column definitions in `useMemo(() => [...], [t, tc, locale])` or declare static columns outside the component.

### 2. Un-memoized Computed Statistics & Filtering in Product Catalog
- **File Path**: `d:\Evaluna ERP\apps\web\src\app\admin\products\page.tsx`
- **Line Numbers**: 54–71
- **Root Cause**:
  ```tsx
  const categories = products ? Array.from(new Set(products.map((p) => p.category))) : [];
  const filteredProducts = products?.filter((p) => { ... });
  const lowStockCount = products?.filter((p) => p.stock < 50).length || 0;
  const missingMarginCount = products?.filter((p) => p.margin <= 0).length || 0;
  const fastMovingCount = products?.filter((p) => p.stock > 100).length || 0;
  ```
- **Impact**: 5 full array traversals run synchronously on every render (including when `selectedIds` state changes upon toggling a single row checkbox).
- **Fix**: Wrap calculations in `useMemo`:
  ```tsx
  const { categories, lowStockCount, missingMarginCount, fastMovingCount } = useMemo(() => {
    if (!products) return { categories: [], lowStockCount: 0, missingMarginCount: 0, fastMovingCount: 0 };
    // Single loop over products to compute all metrics
  }, [products]);
  ```

### 3. Un-throttled Resize Listener in `DataTable` Component
- **File Path**: `d:\Evaluna ERP\packages\ui\src\components\data-table.tsx`
- **Line Numbers**: 155–160
- **Root Cause**:
  ```tsx
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  ```
- **Impact**: Resizing the window fires dozens of events per second, causing repeated `setIsMobile` calls and forced re-renders of `DataTable`.
- **Fix**: Debounce or throttle the resize listener or use `matchMedia` listener (`window.matchMedia("(max-width: 767px)")`).

### 4. Heavy Framer Motion Stagger Animation on Large Table Rows
- **File Paths**:
  - `d:\Evaluna ERP\apps\web\src\app\admin\products\page.tsx` (Line 317)
  - `d:\Evaluna ERP\apps\web\src\app\admin\inventory\page.tsx` (Line 177)
- **Root Cause**: `<motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>`
- **Impact**: Attaches motion listeners to every row in large tables. Row #300 waits 15 seconds to animate.
- **Fix**: Remove individual row motion animations or limit animation to the container / first 10 rows.

### 5. Un-memoized Helper Components
- **File Paths**:
  - `d:\Evaluna ERP\apps\web\src\app\auditor\page.tsx` (`KPICard` function at lines 53-84)
  - `d:\Evaluna ERP\apps\web\src\app\marketing\page.tsx` (`KPICard` function at lines 16-45)
  - `d:\Evaluna ERP\apps\web\src\app\driver\page.tsx` (`MiniMapPreview` function at lines 33-69)
- **Root Cause**: Inline component helper functions re-render whenever the parent dashboard state updates.
- **Fix**: Wrap with `React.memo(KPICard)`.

---

## 5. Actionable Optimization Proposals & Implementation Roadmap

1. **Package Enhancements (`packages/ui/src/components/data-table.tsx`)**:
   - Add built-in table virtualization (`useVirtualizer` from `@tanstack/react-virtual`).
   - Add built-in row skeleton rendering prop (`isLoading?: boolean; skeletonRows?: number`).
   - Replace un-throttled window resize event listener with `window.matchMedia`.

2. **Dashboard Skeleton Standards**:
   - Create standardized skeleton components for dashboards (`AuditorDashboardSkeleton`, `DriverDashboardSkeleton`, `PickerListSkeleton`).
   - Ensure all data fetching blocks render layout-preserving skeletons rather than spinners or text strings.

3. **Page-Level Optimization Rules**:
   - Wrap all table columns and export columns in `useMemo`.
   - Wrap computed array statistics and filters in `useMemo`.
   - Replace per-row Framer Motion animations on data tables with lightweight CSS transitions or container-only animations.

---

**Report Compiled By**: Explorer 3  
**Status**: Investigation Complete — Ready for Implementer Handoff.
