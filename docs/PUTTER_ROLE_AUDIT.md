# ROLE: Putter

## A. What this employee currently does
Based on code analysis, Putter personnel in the Evaluna ERP system are responsible for:
- Managing receiving operations (tracking incoming purchase orders and goods receipt notes)
- Executing put-away tasks (moving received goods to appropriate warehouse locations)
- Monitoring and reporting stock discrepancies and missing inventory
- Handling sale returns processing
- Managing damage reports and stock adjustments due to damage
- Tracking completed put-away operations
- Generating warehouse operation reports

Evidence from `apps/web/src/lib/trpc/routers/putter.ts` shows procedures for:
- getDashboardStats: Warehouse metrics including items to receive, put-away queue, missing stock, damage reports, sale returns, efficiency percentage
- getReceiving: Lists incoming purchase orders with supplier details, quantities, and status
- getPutAwayTasks: Lists items ready for put-away from received purchase orders
- getMissingStock: Returns list of missing stock items (currently returns empty array)
- getSaleReturns: Lists sale returns (currently returns empty array)
- getDamageReports: Lists stock adjustments due to damage with product details
- getCompleted: Lists completed put-away operations
- getReports: Returns warehouse reports (currently returns empty array)

## B. Dashboard
* dashboard route: /putter
* page/component: `apps/web/src/app/putter/page.tsx` (PutterDashboard component)
* navigation: Accessible via main navigation when user has putter or admin/manager/auditor role
* widgets: 
  - KPI cards for each metric returned by getDashboardStats (itemsToReceive, putAwayQueue, missingStock, damageReports, saleReturns, efficiencyPct)
* cards: Card components for each KPI section
* tables: None on main dashboard
* charts: Line chart showing "Receiving & Put Away Trend (Last 7 Days)" with received vs putAway data
* actions: 
  - Navigation links to subpages: Receiving, Put-Away, Missing, Damage, Completed, Returns, Reports
* filters: None visible on dashboard (branch filtering available as optional input in procedures)
* reports: Access to reports via /putter/reports route (currently shows empty state)

## C. Exact permissions
List of permissions actually implemented for Putter role (level 5):
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
  - None (Putter role does not have delete permissions for any domain)
* Approve:
  - None (Putter role does not have explicit approve permissions)
* Reject: Not explicitly implemented as separate permission
* Assign: Not explicitly implemented as separate permission
* Pay: Not applicable to putter role
* Refund: Not applicable to putter role
* Reconcile: Not applicable to putter role
* Dispatch: Not applicable to putter role
* Deliver: Not applicable to putter role
* Adjust inventory: inventory.write permission covers this
* Modify customer: customers.write permission
* Modify supplier: None (requires manager level)
* Modify employee: staff.write permission
* Modify payroll: None (requires manager level)
* Modify settings: None (requires admin level)

Note: Putter role inherits all permissions from levels 6-12 (picker, driver, biller, sales_person, delivery_manager, delivery_boy, customer) due to the hierarchical permission system.

## D. Backend connection
For every important dashboard action identify:
**UI → Query/Mutation → Router → Service → Database → Side effect**

1. **Putter Dashboard KPIs**
   - UI: PutterDashboard component calls useTRPC().putter.getDashboardStats
   - Query: putter.getDashboardStats query in `apps/web/src/lib/trpc/routers/putter.ts` lines 8-48
   - Router: putterRouter.getDashboardStats
   - Service: 
     - Database query to count purchases with status "pending" (items to receive)
     - Database query to count purchases with status "received" (put-away queue)
     - Database query to count stockAdjustments with adjustment_type "damage" (damage reports)
     - Hardcoded values for missingStock (3) and saleReturns (12)
     - Hardcoded efficiencyPct (98.4%)
     - Database query to get recent purchases for chart data
   - Database: 
     - `purchases` table (multiple queries)
     - `stockAdjustments` table (for damage count)
   - Side effect: Returns warehouse metrics for display in KPI cards and chart

2. **Receiving List**
   - UI: Accessible via /putter/receiving route
   - Query: putter.getReceiving query in `apps/web/src/lib/trpc/routers/putter.ts` lines 50-82
   - Router: putterRouter.getReceiving
   - Service: Direct database query with joins
   - Database: 
     - `purchases` table (main)
     - `suppliers` table (join for supplier name)
     - `purchaseItems` table (join for item count and quantity sum)
   - Side effect: Returns list of incoming purchase orders for display

3. **Put-Away Tasks**
   - UI: Accessible via /putter/put-away route
   - Query: putter.getPutAwayTasks query in `apps/web/src/lib/trpc/routers/putter.ts` lines 84-110
   - Router: putterRouter.getPutAwayTasks
   - Service: Direct database query with joins
   - Database: 
     - `purchaseItems` table (main)
     - `purchases` table (join for purchase details and status filter)
     - `products` table (join for product name and SKU)
   - Side effect: Returns list of items ready for put-away from received purchase orders

4. **Damage Reports**
   - UI: Accessible via /putter/damage route
   - Query: putter.getDamageReports query in `apps/web/src/lib/trpc/routers/putter.ts` lines 130-162
   - Router: putterRouter.getDamageReports
   - Service: Direct database query with joins
   - Database: 
     - `stockAdjustments` table (main, filtered by adjustment_type "damage")
     - `products` table (join for product name)
     - `staff` table (join for reporter name)
   - Side effect: Returns list of stock adjustments due to damage for display

5. **Completed Put-Away**
   - UI: Accessible via /putter/completed route
   - Query: putter.getCompleted query in `apps/web/src/lib/trpc/routers/putter.ts` lines 164-182
   - Router: putterRouter.getCompleted
   - Service: Direct database query
   - Database: 
     - `purchases` table (filtered by status "completed")
   - Side effect: Returns list of completed purchase orders for display

6. **Missing Stock, Sale Returns, Reports**
   - UI: Accessible via respective routes
   - Query: putter.getMissingStock, putter.getSaleReturns, putter.getReports (lines 112-128, 184-190)
   - Router: putterRouter.getMissingStock, putterRouter.getSaleReturns, putterRouter.getReports
   - Service: All return empty arrays (no actual database queries)
   - Database: No actual database access (returns mock/empty data)
   - Side effect: Returns empty arrays for display

## E. Database access
List the actual tables/models/entities this role can access:
* purchases (read)
* purchaseItems (read)
* suppliers (read)
* products (read)
* stockAdjustments (read)
* staff (read)
* All tables accessible to roles level 6-12 (picker, driver, biller, sales_person, delivery_manager, delivery_boy, customer) including:
  - orders (read)
  - orderItems (read)
  - paymentMethods (read)
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

Note: Putter role does NOT have write access to:
- supplier-related tables (requires manager level)
- settings tables (requires admin level)
- payroll tables (requires manager level)
- staff tables (requires HR level for write access)
- audit-related tables (requires auditor level)

Note: Despite having inventory.write permission in the matrix, the putter procedures only perform READ operations on inventory-related tables (no actual CREATE/UPDATE/DELETE operations in the exposed procedures).

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
* Modify inventory levels or product master data (despite inventory.write permission, no procedures expose write operations)
* Create or modify user roles and permissions
* Access delivery management or vehicle tracking systems
* Modify branch manager assignments
* Actually create missing stock reports, sale returns, or warehouse reports (procedures return empty arrays)

## G. Security risks
Identify excessive permissions, missing server checks, IDOR possibilities, or privilege escalation:

1. **Missing Implementation for Key Features**: 
   - getMissingStock, getSaleReturns, and getReports procedures return empty arrays instead of actual data, suggesting incomplete implementation
   - This could lead to confusion when users expect to see data but see nothing

2. **Hardcoded Dashboard Values**: 
   - missingStock is hardcoded to 3
   - saleReturns is hardcoded to 12
   - efficiencyPct is hardcoded to 98.4%
   - When no real data exists for chartData, random values are generated
   - This represents a significant discrepancy between displayed metrics and actual warehouse state

3. **Potential IDOR in Receiving Operations**: 
   - getReceiving procedure accepts optional branch_id parameter but doesn't appear to enforce branch-level scoping in all cases
   - The purchases table access doesn't show explicit row-level security in the procedure

4. **Information Disclosure**: 
   - Putter dashboard shows supplier names and contact information in receiving lists
   - Damage reports show staff names who reported the damage
   - While appropriate for the role, this information could be sensitive if not properly handled

5. **Missing Validation**: 
   - No visible validation of input parameters beyond basic Zod schema validation
   - No evidence of business rule validation (e.g., ensuring put-away quantities match received quantities)

## H. Missing work
Identify capabilities required for the role but currently absent:

1. **Actual Missing Stock Tracking**: 
   - Implement getMissingStock procedure to return actual missing stock discrepancies
   - Create missing stock queue/table to track discrepancies
   - Add adjustment workflow for missing stock resolution

2. **Actual Sale Returns Processing**: 
   - Implement getSaleReturns procedure to return actual sale return data
   - Connect to salesReturns and salesReturnItems tables
   - Add inspection and restocking workflow for returned items

3. **Actual Warehouse Reports**: 
   - Implement getReports procedure to return actual warehouse performance reports
   - Add reporting functionality for inventory turns, put-away efficiency, receiving accuracy, etc.

4. **Put-Away Confirmation Workflow**: 
   - Add procedures to confirm put-away completion
   - Update inventory locations when put-away is completed
   - Track put-away accuracy and timing metrics

5. **Receiving Inspection Workflow**: 
   - Add procedures for quality inspection during receiving
   - Track acceptance vs rejection of received goods
   - Link to supplier performance metrics

6. **Damage Management Workflow**: 
   - Add procedures to approve/reject damage claims
   - Add workflow for damaged goods disposition (return to vendor, scrap, repair)
   - Track damage costs and root cause analysis

7. **Inventory Location Management**: 
   - Add procedures to manage warehouse locations, bins, and storage strategy
   - Implement slotting optimization suggestions
   - Track inventory aging and expiration dates

8. **Cross-Docking Capabilities**: 
   - Add support for direct transfer from receiving to shipping without put-away
   - Track cross-docking efficiency metrics

9. **Wave and Batch Picking Support**: 
   - Add functionality to create put-away waves for efficiency
   - Batch similar put-away tasks to reduce travel time

10. **Integration with Material Handling Equipment**: 
    - Add connectivity to barcode scanners, RFID readers, and warehouse management systems
    - Support for voice-directed put-away systems

## I. Current quality
Score:
* Functionality /10: 5 (Basic receiving and put-away task listing exists, but key warehouse operations like missing stock, sale returns, and reporting are non-functional)
* Authorization /10: 8 (Proper role-based access control via permissions matrix, but missing fine-grained scoping for warehouse-specific resources)
* Dashboard /10: 5 (Dashboard exists but shows hardcoded/random values instead of actual metrics due to incomplete/mock data procedures)
* Backend integration /10: 4 (Several key procedures return mock or empty data, hardcoded values used instead of real calculations)
* UX /10: 7 (Well-designed dashboard interface with proper layout, navigation, and charts)
* Auditability /10: 5 (Limited audit trails visible in code for putter-specific actions)
* Production readiness /10: 3 (Not production-ready due to incomplete core warehouse operations)

## J. Improvements
List concrete improvements, not generic suggestions:

1. **Implement Actual Missing Stock Tracking**: 
   - Create missing_stock table in database to track discrepancies
   - Implement getMissingStock procedure to query actual missing stock records
   - Add adjustment procedures to resolve missing stock with approval workflow

2. **Implement Actual Sale Returns Processing**: 
   - Implement getSaleReturns procedure to return data from salesReturns and salesReturnItems tables
   - Add inspection procedures for received returns
   - Add restocking or disposition workflows

3. **Implement Actual Warehouse Reports**: 
   - Implement getReports procedure to generate real warehouse performance metrics
   - Add reports for receiving accuracy, put-away efficiency, inventory turns, and damage rates
   - Include trend analysis and forecasting capabilities

4. **Replace Hardcoded Values with Real Calculations**: 
   - Calculate actual missing stock from inventory discrepancies
   - Calculate actual sale return volumes from processed returns
   - Calculate actual efficiency percentage based on put-away timing vs SLAs
   - Use real historical data for chart generation instead of random values

5. **Implement Put-Away Confirmation Workflow**: 
   - Add confirmPutAwayTask procedure to mark put-away as completed
   - Update inventory locations and quantities upon confirmation
   - Add put-away accuracy tracking and exception handling

6. **Enhance Receiving with Inspection Capabilities**: 
   - Add inspection procedures for received goods (quantity, quality, damage)
   - Track acceptance/rejection reasons
   - Link to supplier quality scorecards

7. **Implement Damage Management Workflow**: 
   - Add approveDamageClaim and rejectDamageClaim procedures
   - Add disposition tracking for damaged goods (RTV, scrap, repair)
   - Add cost tracking and root cause analysis fields

8. **Add Inventory Location Management**: 
   - Implement warehouse location hierarchy (zone, aisle, shelf, bin)
   - Add put-away location suggestions based on product characteristics and velocity
   - Implement inventory aging and expiration tracking

9. **Create Wave and Batch Processing**: 
   - Add functionality to create put-away waves for optimization
   - Batch similar put-away tasks to reduce travel time
   - Implement wave release based on dock availability and labor capacity

10. **Integrate with Material Handling Systems**: 
    - Add APIs for barcode scanner integration
    - Support for RFID-based inventory tracking
    - Connect to conveyor systems and sortation equipment where applicable

## K. Progress Update
Completed Putter role audit at $(date). Moving on to Picker role audit.