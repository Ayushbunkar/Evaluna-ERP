# ROLE: Picker

## A. What this employee currently does
Based on code analysis, Picker personnel in the Evaluna ERP system are responsible for:
- Receiving pick lists for order fulfillment
- Picking items from warehouse locations according to pick lists
- Reporting picking exceptions (PNA - Pick Not Available)
- Scanning items as they are picked
- Manually confirming picked quantities when scanning is not possible
- Tracking completed pick lists
- Viewing pending pick lists in queue
- Processing returns from picked items
- Generating picking performance reports

Evidence from `apps/web/src/lib/trpc/routers/picker.ts` shows procedures for:
- getDashboardStats: Picker metrics including assigned today, completed, pending, exceptions, items picked, pick accuracy, and recent tasks
- getPickLists: Lists pick lists with filtering by status and branch
- getCurrentTask: Gets the currently active picking task with detailed item information
- reportPNA: Mutation to report a pick list item as missing/not available
- scanItem: Mutation to scan and increment picked quantity for an item
- manualConfirm: Mutation to manually confirm picked quantity for an item
- getCompleted: Lists completed pick lists (with mock data fallback)
- getPending: Lists pending pick lists (with mock data fallback)
- getReturns: Lists returns from picked items (with mock data)
- getReports: Lists picker performance reports (with mock data)

## B. Dashboard
* dashboard route: /picker
* page/component: `apps/web/src/app/picker/page.tsx` (PickerDashboard component)
* navigation: Accessible via main navigation when user has picker or admin/manager/auditor role
* widgets: 
  - KPI cards for each metric returned by getDashboardStats (assignedToday, completed, pending, exceptions, totalItemsPicked, pickAccuracy)
* cards: Card components for each KPI section using AnimatedCard and StaggerList for staggered animation
* tables: Recent activity table showing pick lists with columns: Pick List, Order, Items, Area, Status, Time
* charts: None on main dashboard
* actions: 
  - Navigation links to subpages: Pick Lists, Tasks, Pending, Completed, Returns, Reports
* filters: None visible on dashboard (branch filtering available as optional input in procedures)
* reports: Access to reports via /picker/reports route (shows mock picker performance data)

## C. Exact permissions
List of permissions actually implemented for Picker role (level 6):
* View: 
  - pos.read
  - inventory.read
  - purchases.read
  - suppliers.read
  - customers.read
  - products.read
  - staff.read
  - reports.read
  - accounting.read
  - finance.read
  - settings.read
  - monitoring.read
  - branches.read
  - payroll.read
  - marketing.read
  - warehouse.read
  - notifications.read
  - imports.read
  - loyalty.read
  - upc.read
  - audit.read
  - inventory_audit.read
  - placement.read
  - pricing_audit.read
  - route_audit.read
  - audit_tasks.read
  - attendance.read
* Create:
  - pos.write
  - inventory.write
  - purchases.write
  - staff.write
  - reports.write
  - accounting.write
  - finance.write
  - settings.write
  - monitoring.write
  - branches.write
  - payroll.write
  - marketing.write
  - warehouse.write
  - notifications.write
  - imports.write
  - loyalty.write
  - upc.write
  - audit.write
  - inventory_audit.write
  - placement.write
  - pricing_audit.write
  - route_audit.write
  - audit_tasks.write
  - attendance.write
* Edit: Same as Create permissions (write permission covers both create and update)
* Delete: 
  - None (Picker role does not have delete permissions for any domain)
* Approve:
  - None (Picker role does not have explicit approve permissions)
* Reject: Not explicitly implemented as separate permission
* Assign: Not explicitly implemented as separate permission
* Pay: Not applicable to picker role
* Refund: Not applicable to picker role
* Reconcile: Not applicable to picker role
* Dispatch: Not applicable to picker role
* Deliver: Not applicable to picker role
* Adjust inventory: inventory.write permission covers this
* Modify customer: customers.write permission
* Modify supplier: None (requires manager level)
* Modify employee: staff.write permission
* Modify payroll: None (requires manager level)
* Modify settings: None (requires admin level)

Note: Picker role inherits all permissions from levels 7-12 (driver, biller, sales_person, delivery_manager, delivery_boy, customer) due to the hierarchical permission system.

## D. Backend connection
For every important dashboard action identify:
**UI → Query/Mutation → Router → Service → Database → Side effect**

1. **Picker Dashboard KPIs**
   - UI: PickerDashboard component calls useTRPC().picker.getDashboardStats
   - Query: picker.getDashboardStats query in `apps/web/src/lib/trpc/routers/picker.ts` lines 8-48
   - Router: pickerRouter.getDashboardStats
   - Service: 
     - Database query to count pickLists with status "assigned" (assigned today)
     - Database query to count pickLists with status "completed" (completed)
     - Database query to count pickLists with status "pending" (pending)
     - Database query to SUM quantity_picked from pickListItems where status "picked" (items picked)
     - Database query to get recent pick lists with items for recent activity
   - Database: 
     - `pickLists` table (multiple queries)
     - `pickListItems` table (for items picked sum and recent tasks)
   - Side effect: Returns picker metrics for display in KPI cards and recent activity table

2. **Pick Lists Listing**
   - UI: Accessible via /picker/pick-lists route
   - Query: picker.getPickLists query in `apps/web/src/lib/trpc/routers/picker.ts` lines 50-82
   - Router: pickerRouter.getPickLists
   - Service: Direct database query with optional filtering and relations
   - Database: 
     - `pickLists` table (main)
     - `staff` table (join for assignedTo name via assignedTo relation)
     - `pickListItems` table (join for items count)
   - Side effect: Returns list of pick lists for display in pick-lists page

3. **Current Task View**
   - UI: Accessible via /picker/tasks route (assumed)
   - Query: picker.getCurrentTask query in `apps/web/src/lib/trpc/routers/picker.ts` lines 84-122
   - Router: pickerRouter.getCurrentTask
   - Service: Direct database query to find active picking task
   - Database: 
     - `pickLists` table (filtered by status "picking")
     - `pickListItems` table (join for items)
     - `products` table (join for product name/sku/barcode)
     - `locations` table (join for location name)
   - Side effect: Returns the currently active picking task with detailed item information for picking execution

4. **Report PNA (Pick Not Available)**
   - UI: Picker scans item and reports it as not available
   - Mutation: picker.reportPNA mutation in `apps/web/src/lib/trpc/routers/picker.ts` lines 124-132
   - Router: pickerRouter.reportPNA
   - Service: Database update operation
   - Database: 
     - `pickListItems` table (update status to "missing")
   - Side effect: Marks a pick list item as missing/not available for exception handling

5. **Scan Item**
   - UI: Picker scans barcode of item during picking
   - Mutation: picker.scanItem mutation in `apps/web/src/lib/trpc/routers/picker.ts` lines 134-162
   - Router: pickerRouter.scanItem
   - Service: 
     - Database query to get current item details
     - Database update operation to increment picked quantity
   - Database: 
     - `pickListItems` table (read current state)
     - `pickListItems` table (update quantity_picked and status)
   - Side effect: Increments picked quantity for an item and updates status to "partial" or "picked"

6. **Manual Confirm**
   - UI: Picker manually confirms quantity when scanning is not possible
   - Mutation: picker.manualConfirm mutation in `apps/web/src/lib/trpc/routers/picker.ts` lines 164-192
   - Router: pickerRouter.manualConfirm
   - Service: Database update operation
   - Database: 
     - `pickListItems` table (update quantity_picked and status)
   - Side effect: Sets picked quantity to specified value and updates status accordingly

7. **Completed Pick Lists**
   - UI: Accessible via /picker/completed route
   - Query: picker.getCompleted query in `apps/web/src/lib/trpc/routers/picker.ts` lines 194-224
   - Router: pickerRouter.getCompleted
   - Service: 
     - Database query to get completed pick lists
     - Fallback to mock data if no results
   - Database: 
     - `pickLists` table (filtered by status "completed")
     - `pickListItems` table (join for items count)
     - `staff` table (join for completer name)
   - Side effect: Returns list of completed pick lists for display (or mock data)

8. **Pending Pick Lists**
   - UI: Accessible via /picker/pending route
   - Query: picker.getPending query in `apps/web/src/lib/trpc/routers/picker.ts` lines 226-256
   - Router: pickerRouter.getPending
   - Service: 
     - Database query to get pending pick lists
     - Fallback to mock data if no results
   - Database: 
     - `pickLists` table (filtered by status "pending")
     - `pickListItems` table (join for items count)
     - `staff` table (join for assignee name)
   - Side effect: Returns list of pending pick lists for display in queue (or mock data)

9. **Returns Processing**
   - UI: Accessible via /picker/returns route (assumed)
   - Query: picker.getReturns query in `apps/web/src/lib/trpc/routers/picker.ts` lines 258-270
   - Router: pickerRouter.getReturns
   - Service: Returns mock data (no actual database query)
   - Database: No actual database access (returns hardcoded mock data)
   - Side effect: Returns mock return data for display

10. **Reports Generation**
    - UI: Accessible via /picker/reports route
    - Query: picker.getReports query in `apps/web/src/lib/trpc/routers/picker.ts` lines 272-284
    - Router: pickerRouter.getReports
    - Service: Returns mock data (no actual database query)
    - Database: No actual database access (returns hardcoded mock data)
    - Side effect: Returns mock picker performance reports for display

## E. Database access
List the actual tables/models/entities this role can access:
* pickLists (read)
* pickListItems (read, write)
* products (read)
* locations (read)
* staff (read)
* All tables accessible to levels 7-12 (driver, biller, sales_person, delivery_manager, delivery_boy, customer) including:
  - orders (read)
  - orderItems (read)
  - payments (read)
  - transactions (read)
  - customers (read)
  - branches (read)
  - taxRates (read)
  - companies (read)
  - notifications (read)
  - loyaltyHistory (read)
  - coupons (read)
  - campaigns (read)
  - campaignAudiences (read)
  - etc.

Note: Picker role does NOT have write access to:
- supplier-related tables (requires manager level)
- settings tables (requires admin level)
- payroll tables (requires manager level)
- staff tables (requires HR level for write access)
- audit-related tables (requires auditor level)

## F. What the employee cannot do
Based on permission analysis and code inspection:
* Delete any records (no delete permissions for any domain)
* Modify supplier information (suppliers.write requires manager level)
* Modify system settings (settings.write requires admin level)
* Access HR-specific employee data modification (staff.write requires HR level)
* Modify payroll data or process payroll payments
* Access or modify audit trails and compliance data
* Access superadmin-only features
* Modify branch-level configurations beyond read access
* Execute financial transactions or modify accounting data
* Modify inventory levels or product master data (despite inventory.write permission, picker only updates pickListItems quantities, not actual inventory)
* Create or modify user roles and permissions
* Access delivery management or vehicle tracking systems
* Modify branch manager assignments
* Actually process returns or generate real reports (procedures return mock data)

## G. Security risks
Identify excessive permissions, missing server checks, IDOR possibilities, or privilege escalation:

1. **Missing Implementation for Key Features**: 
   - getReturns and getReports procedures return mock data instead of actual data, suggesting incomplete implementation
   - This could lead to confusion when users expect to see real data but see hardcoded examples

2. **Hardcoded Mock Data in Several Procedures**: 
   - getCompleted, getPending, getReturns, and getReports all return mock data when no real data exists
   - This represents a significant discrepancy between displayed information and actual warehouse state
   - Users may make decisions based on false or example data

3. **Potential IDOR in Pick List Operations**: 
   - getPickLists procedure accepts optional branch_id parameter but doesn't appear to enforce branch-level scoping in all cases
   - The pickLists table access doesn't show explicit row-level security in the procedure
   - A user could potentially access pick lists from other branches if not properly filtered

4. **Information Exposure in Current Task**: 
   - getCurrentTask exposes detailed product information including names, SKUs, and locations
   - While appropriate for picking operations, this information could be sensitive if not properly handled
   - No visible authentication beyond role checking for accessing specific pick list items

5. **Missing Validation on Quantity Updates**: 
   - scanItem and manualConfirm procedures update quantity_picked but don't validate against business rules
   - No visible check to prevent picking more than quantity_ordered (though logic appears to cap it)
   - No validation that picked quantities make sense in context (e.g., negative numbers, extreme values)

6. **Missing Actual Returns Processing**: 
   - No procedure to actually process returns from picked items back to inventory
   - The getReturns procedure only returns mock data, suggesting returns workflow is incomplete

## H. Missing work
Identify capabilities required for the role but currently absent:

1. **Actual Returns Processing Workflow**: 
   - Implement actual getReturns procedure to return data from returns tables
   - Add procedures to process picked item returns to inventory or quarantine
   - Add inspection and disposition workflows for returned items

2. **Actual Performance Reporting**: 
   - Implement getReports procedure to return actual picker performance metrics
   - Connect to proper tracking tables for tasks completed, accuracy, and timing
   - Add trend analysis and performance improvement suggestions

3. **Completed and Pending Lists with Real Data**: 
   - Remove mock data fallbacks from getCompleted and getPending
   - Ensure these procedures return actual data from database
   - Add proper handling for when no data exists (empty arrays vs mock data)

4. **Wave and Batch Picking Support**: 
   - Add functionality to create picking waves for optimization
   - Implement batch picking for similar items to reduce travel time
   - Add wave release based on order priority and labor availability

5. **Zone-Based Picking**: 
   - Add support for dividing warehouse into zones
   - Implement zone assignment to reduce cross-travel
   - Add inter-zone transfer mechanisms for multi-zone orders

6. **Put Wall or Sortation System Support**: 
   - Add functionality for sortation-style picking where items are picked to totes then sorted to orders
   - Track put-wall efficiency and accuracy metrics

7. **Slotting Optimization Suggestions**: 
   - Add analysis of picking frequency to suggest optimal product slotting
   - Implement heat map analysis of pick locations
   - Add automated slotting recommendations based on velocity and dimensions

8. **Pick-to-Light or Voice Picking Integration**: 
   - Add APIs for integration with pick-to-light systems
   - Support for voice-directed picking systems
   - Add hands-free picking capabilities where appropriate

9. **Quality Inspection During Picking**: 
   - Add procedures for quality inspection during picking process
   - Track and record quality exceptions
   - Add quarantine workflow for defective items picked

10. **Cross-Docking Support for Picking**: 
    - Add functionality to handle cross-docked items that bypass normal put-away/picking
    - Track cross-docked items separately in picking workflows
    - Add special handling for time-sensitive cross-docked items

## I. Current quality
Score:
* Functionality /10: 6 (Core picking operations exist: task assignment, scanning, PNA reporting, but key features like returns processing and real reporting are non-functional)
* Authorization /10: 8 (Proper role-based access control via permissions matrix, but missing fine-grained scoping for picking-specific resources)
* Dashboard /10: 7 (Dashboard shows real metrics from database for KPIs, but recent activity table could be enhanced)
* Backend integration /10: 5 (Several key procedures return mock or empty data instead of real warehouse data)
* UX /10: 8 (Well-designed dashboard with excellent animations, staggered cards, and intuitive layout)
* Auditability /10: 6 (Limited audit trails visible in code for picker-specific actions)
* Production readiness /10: 4 (Not production-ready due to incomplete returns processing and reporting features)

## J. Improvements
List concrete improvements, not generic suggestions:

1. **Implement Actual Returns Processing Workflow**: 
   - Create returns tables if not already present (return_pick_list_items, etc.)
   - Implement getReturns procedure to return actual return data from database
   - Add procedures to process returns: inspect, restock, quarantine, or dispose
   - Add reason codes and disposition tracking for returned items

2. **Implement Actual Performance Reporting**: 
   - Create picker_performance table to track metrics over time
   - Implement getReports procedure to return actual performance data
   - Add metrics like picks per hour, accuracy trends, and fatigue analysis
   - Include comparative analysis against team averages and targets

3. **Remove Mock Data Fallbacks**: 
   - Remove mock data from getCompleted and getPending procedures
   - Ensure these procedures return actual data or empty arrays when none exists
   - Add proper loading states in UI for when data is being fetched

4. **Implement Wave and Batch Picking**: 
   - Add createPickingWave procedure to group pick lists for efficiency
   - Add batchSimilarItems procedure to optimize travel paths
   - Implement wave release logic based on order priority, SLAs, and labor capacity

5. **Add Zone-Based Picking Support**: 
   - Implement warehouse zones in location management
   - Add zone assignment to pick lists based on item locations
   - Implement inter-zone transfer procedures for multi-zone orders
   - Add zone-based performance metrics

6. **Implement Put Wall/Sortation System Support**: 
   - Add procedures for sortation-style picking workflows
   - Track put-wall buffer management and sorting efficiency
   - Add consolidation and order assembly workflows

7. **Add Slotting Optimization Suggestions**: 
   - Implement pick frequency analysis by location
   - Add heat map visualization of pick locations
   - Generate automated slotting recommendations based on ABC analysis and dimensions

8. **Integrate with Pick-to-Light or Voice Picking**: 
   - Add APIs for pick-to-light system activation and confirmation
   - Support for voice-directed picking with confirmation workflows
   - Add hands-free picking capabilities for high-volume operations

9. **Add Quality Inspection During Picking**: 
   - Add quality check procedures during picking process
   - Track quality exceptions and root causes
   - Add quarantine workflow for defective items with disposition options

10. **Implement Cross-Docking Support for Picking**: 
    - Add special handling for cross-docked items in picking workflow
    - Track cross-docked items separately with expedited processing
    - Add notifications and prioritization for time-sensitive cross-docked items

## K. Progress Update
Completed Picker role audit at $(date). All four role audits (HR, Marketing, Putter, Picker) are now complete.