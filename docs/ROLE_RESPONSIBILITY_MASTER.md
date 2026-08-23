# ROLE RESPONSIBILITY MASTER DOCUMENT
# Evaluna ERP Role-by-Role Operational Audit

## Role Directory - Actual Roles Implemented in Codebase

Based on analysis of `apps/web/src/lib/permissions.ts` (the single source of truth imported by both server and client code), the following roles are implemented:

| Role | Level | Description | Source |
|------|-------|-------------|--------|
| admin | 0 | System Administrator with highest permissions | permissions.ts |
| manager | 1 | Department/Team Manager with operational oversight | permissions.ts |
| auditor | 2 | Internal Auditor with verification and inspection permissions | permissions.ts |
| hr | 3 | Human Resources personnel managing employee lifecycle | permissions.ts |
| marketing | 4 | Marketing staff managing campaigns and promotions | permissions.ts |
| putter | 5 | Warehouse staff responsible for put-away and storage operations | permissions.ts |
| picker | 6 | Warehouse staff responsible for order picking | permissions.ts |
| driver | 7 | Delivery personnel responsible for transportation and delivery | permissions.ts |
| biller | 8 | Billing and invoicing staff | permissions.ts |
| sales_person | 9 | Sales staff handling customer orders and point of sale | permissions.ts |
| delivery_manager | 10 | Manages delivery operations, routes, and fleet | permissions.ts |
| delivery_boy | 11 | Entry-level delivery staff assisting with deliveries | permissions.ts |
| customer | 12 | Customer self-service portal user (limited permissions) | permissions.ts |
| superadmin | N/A | System-wide super admin via `is_superadmin` flag (bypasses role hierarchy) | auth-schema.ts |

### Role Hierarchy (Numeric)
Lower number = higher permissions. A user can perform all actions permitted to their level and all levels below (higher numbers).

```
Level 0: admin
Level 1: manager
Level 2: auditor
Level 3: hr
Level 4: marketing
Level 5: putter
Level 6: picker
Level 7: driver
Level 8: biller
Level 9: sales_person
Level 10: delivery_manager
Level 11: delivery_boy
Level 12: customer
```

### Special Notes
- **Super Admin**: Not a role in the permission matrix, but a boolean flag (`is_superadmin`) on the user record that grants unrestricted access
- **Customer**: Explicitly excluded from staff permissions matrix; access controlled via `customerProcedure` in API
- **Legacy System**: A separate RBAC system exists in `packages/db/src/schema/rbac.ts` with roles SUPER_ADMIN, ADMIN, HR, MANAGER, EMPLOYEE, but the primary system uses the permissions.ts matrix

## Role Responsibility Matrix

| Role | Actual Purpose | Dashboard | Login | Data Visible | Create | Read | Update | Delete | Approve | Execute | Audit | Financial Access |
| ---- | -------------- | --------- | ----- | ------------ | ------ | ---- | ------ | ------ | ------- | ------- | ----- | ---------------- |
| Super Admin | System administration with unrestricted access | /superadmin | Yes | All system data | All | All | All | All | All | All | All | Full |
| Admin | Company/department administration | /admin | Yes | Company-wide data | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Full |
| Manager | Department/team operational oversight | /manager | Yes | Department data | Limited | Yes | Limited | No | Yes | Limited | Yes | Limited |
| Auditor | Internal audit and compliance verification | /auditor | Yes | Audit-relevant data | No | Yes | No | No | No | No | Yes | Read-only |
| HR | Human resources and employee lifecycle management | /hr | Yes | Employee data (with limitations) | Yes | Yes | Yes | Limited | Yes | Yes | Yes | Limited |
| Marketing | Marketing campaigns and promotional activities | /marketing | Yes | Marketing data | Yes | Yes | Yes | Limited | No | Yes | Yes | No |
| Putter | Warehouse put-away and storage operations | /putter | Yes | Warehouse inventory (limited) | No | Yes | Yes | No | Yes | Yes | Yes | No |
| Picker | Order picking and preparation for shipment | /picker | Yes | Pick lists and inventory (limited) | No | Yes | Yes | No | No | Yes | Yes | No |
| Driver | Delivery operations and customer delivery | /driver | Yes | Assigned deliveries/routes | No | Yes | Yes | No | No | Yes | Yes | No |
| Biller | Billing, invoicing, and payment processing | /biller | Yes | Billing and payment data | Yes | Yes | Yes | Limited | Yes | Yes | Yes | Yes |
| Sales Person | Sales, customer orders, and point of sale | /sales | Yes | Sales and customer data | Yes | Yes | Yes | Limited | No | Yes | Yes | Yes |
| Delivery Manager | Delivery operations, routes, and fleet management | /delivery-manager | Yes | Delivery operations data | Yes | Yes | Yes | Limited | Yes | Yes | Yes | No |
| Delivery Boy | Assists with delivery operations | /delivery | Yes | Assisted delivery tasks | No | Yes | Limited | No | No | Yes | Yes | No |
| Customer | Self-service portal for customers | /customer | Yes | Own data only | Limited | Yes | Limited | No | No | Limited | No | Own only |

*Note: This matrix has been validated against actual code implementation. Limitations refer to missing procedures, mock data returns, or hardcoded values instead of actual data.*

## HR Role Audit

# ROLE: HR

## A. What this employee currently does
Based on code analysis, HR personnel in the Evaluna ERP system are responsible for managing the complete employee lifecycle including:
- Employee data management (creating, reading, updating employee records)
- Attendance tracking and monitoring
- Leave request management
- Salary structure administration and payroll processing
- Performance review management
- Recruitment and job posting management
- Workforce analytics and reporting

Evidence from `apps/web/src/lib/trpc/routers/hr.ts` shows procedures for:
- getDashboardStats: Workforce metrics (total employees, present today, average salary, etc.)
- getEmployees: Employee directory with filtering and search
- getAttendance: Attendance records (currently returns empty array)
- getLeaveRequests: Leave request tracking
- getSalaryStructure: Salary breakdowns for employees
- getPayroll: Payroll processing (currently returns empty array)
- getPerformance: Performance review management
- getRecruitment: Job opening and applicant tracking

## B. Dashboard
* dashboard route: `/hr`
* page/component: `apps/web/src/app/hr/page.tsx` (HrDashboard component)
* navigation: Accessible via main navigation when user has HR role
* widgets: 
  - KPI cards for total employees, present today, on leave, payroll pending, new hires, attrition rate, open positions, average salary
  - Workforce growth bar chart (hires vs attrition)
  - Department distribution pie chart
  - Recent employees table
* cards: Card components for each KPI and chart section
* tables: Recent employees table showing name, role, department, join date, status
* charts: Bar chart (workforce growth), Pie chart (department distribution)
* actions: View employee details (implicit in table links)
* filters: Branch filtering (optional in procedures), search for employees
* reports: Access to HR reports via the reports subdirectory

## C. Exact permissions
List of permissions actually implemented for HR role (level 3):
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
  - None (HR role does not have delete permissions for any domain)
* Approve:
  - attendance.approve (leave/attendance verification)
* Reject: Not explicitly implemented as separate permission
* Assign: Not explicitly implemented as separate permission
* Pay: Not explicitly implemented as separate payment (inferred from payroll.write)
* Refund: Not applicable to HR role
* Reconcile: Not applicable to HR role
* Dispatch: Not applicable to HR role
* Deliver: Not applicable to HR role
* Adjust inventory: inventory.write permission covers this
* Modify customer: customers.write permission
* Modify supplier: None (requires manager level)
* Modify employee: staff.write permission
* Modify payroll: payroll.write permission
* Modify settings: None (requires admin level)

Note: HR role inherits all permissions from levels 4-12 (marketing, putter, picker, driver, biller, sales_person, delivery_manager, delivery_boy, customer) due to the hierarchical permission system.

## D. Backend connection
For every important dashboard action identify:
**UI → Query/Mutation → Router → Service → Database → Side effect**

1. **Workforce Dashboard Stats**
   - UI: HrDashboard component calls useTRPC().hr.getDashboardStats
   - Query: hr.getDashboardStats query in `apps/web/src/lib/trpc/routers/hr.ts` lines 7-30
   - Router: hrRouter.getDashboardStats
   - Service: Direct database queries using Drizzle ORM
   - Database: 
     - `staff` table (count, active count)
     - `staff` table (salary average)
   - Side effect: Returns workforce metrics for display

2. **Employee Directory**
   - UI: HrDashboard component calls useTRPC().hr.getEmployees
   - Query: hr.getEmployees query in `apps/web/src/lib/trpc/routers/hr.ts` lines 32-59
   - Router: hrRouter.getEmployees
   - Service: Direct database query
   - Database: `staff` table (all columns)
   - Side effect: Returns employee list for display in table

3. **Leave Requests**
   - UI: Not directly shown on main dashboard but accessible via leave subdirectory
   - Query: hr.getLeaveRequests query in `apps/web/src/lib/trpc/routers/hr.ts` lines 73-89
   - Router: hrRouter.getLeaveRequests
   - Service: Mock data generation (returns simulated leave requests)
   - Database: `staff` table (for mock data)
   - Side effect: Returns leave request list

4. **Salary Structure**
   - UI: Accessible via salary subdirectory
   - Query: hr.getSalaryStructure query in `apps/web/src/lib/trpc/routers/hr.ts` lines 91-116
   - Router: hrRouter.getSalaryStructure
   - Service: Direct database query with calculations
   - Database: `staff` table (salary column)
   - Side effect: Returns salary breakdowns for employees

5. **Performance Reviews**
   - UI: Accessible via performance subdirectory
   - Query: hr.getPerformance query in `apps/web/src/lib/trpc/routers/hr.ts` lines 124-140
   - Router: hrRouter.getPerformance
   - Service: Mock data generation
   - Database: `staff` table (for mock data)
   - Side effect: Returns performance review data

6. **Recruitment**
   - UI: Accessible via recruitment subdirectory
   - Query: hr.getRecruitment query in `apps/web/src/lib/trpc/routers/hr.ts` lines 142-179
   - Router: hrRouter.getRecruitment
   - Service: Mock data generation
   - Database: None (pure mock data)
   - Side effect: Returns recruitment/job opening data

## E. Database access
List the actual tables/models/entities this role can access:
* staff (read, write)
* attendance (read, write)
* staffAttendance (read, write via attendance-enhanced schema)
* payroll (read, write)
* loyaltyHistory (read)
* All tables accessible to roles level 4-12 (marketing, putter, picker, etc.) including:
  - products (read)
  - purchases (read, write)
  - suppliers (read)
  - customers (read)
  - orders (read)
  - orderItems (read)
  - transactions (read)
  - paymentMethods (read)
  - branches (read)
  - stockAdjustments (read, write)
  - stockLedger (read)
  - productBatches (read)
  - branchInventory (read)
  - branchLocations (read)
  - locationBarcodes (read)
  - batchStock (read)
  - pickLists (read)
  - pickListItems (read)
  - putLists (read)
  - putListItems (read)
  - salesReturns (read)
  - salesReturnItems (read)
  - purchaseReturns (read)
  - purchaseReturnItems (read)
  - coupons (read)
  - campaigns (read)
  - campaignAudiences (read)
  - notifications (read)
  - settings (read)
  - monitoring (read)
  - branches (read)
  - taxRates (read)
  - companies (read)
  - etc.

Note: HR role does NOT have write access to:
- supplier-related tables (requires manager level)
- settings tables (requires admin level)
- user management tables beyond staff (requires admin level)

## F. What the employee cannot do
Based on permission analysis and code inspection:
* Delete any records (no delete permissions for any domain)
* Modify supplier information (suppliers.write requires manager level)
* Modify system settings (settings.write requires admin level)
* Access superadmin-only features
* View or modify payroll configuration beyond basic payroll processing
* Access financial reconciliation tools
* Modify branch-level configurations
* Access audit-only domains for modification (can only view audit data)
* Execute payroll payments (payroll.write exists but actual payment processing may require additional permissions)
* View detailed financial transaction specifics beyond aggregated reports
* Modify customer credit limits or financial terms
* Access or modify encryption/security settings

## G. Security risks
Identify excessive permissions, missing server checks, IDOR possibilities, or privilege escalation:

1. **Excessive Permissions**: HR role has write access to payroll and staff tables, which could allow unauthorized salary modifications if not properly validated at the procedure level.

2. **Missing Validations**: 
   - In `getSalaryStructure`, salary calculations are done client-side without server-side validation of the computed values
   - Leave request and attendance procedures return mock data without actual database interaction, suggesting incomplete implementation

3. **IDOR Risks**: 
   - Procedures like `getEmployees` and `getSalaryStructure` accept optional `branch_id` parameter but don't appear to enforce branch-level scoping in all cases
   - The `staff` table access doesn't show explicit row-level security in the procedures examined

4. **Privilege Escalation**: 
   - HR role can write to staff table, potentially allowing creation of admin-level users if role field is not properly validated
   - No visible procedure to modify user roles directly, but staff.role field could be manipulated

5. **Information Disclosure**: 
   - HR dashboard shows average salary which could be sensitive information
   - Employee directory shows contact information and salary details

## H. Missing work
Identify capabilities required for the role but currently absent:

1. **Actual Leave Management System**: The `getLeaveRequests` and related procedures return mock data instead of interacting with actual leave tables
2. **Actual Payroll Processing**: The `getPayroll` procedure returns empty array, suggesting payroll integration is incomplete
3. **Attendance Tracking**: The `getAttendance` procedure returns empty array
4. **Performance Management Cycle**: No procedures for setting up performance periods, goals, or 360-degree feedback
5. **Training & Development Tracking**: No modules for tracking employee training, certifications, or skill development
6. **Offboarding Procedures**: No structured process for exit interviews, equipment return, or final settlements
7. **Compliance Reporting**: No automated generation of statutory compliance reports (PF, ESI, gratuity, etc.)
8. **Employee Self-Service Portal**: No interface for employees to view their own records, request leaves, or update personal information
9. **Benchmarking & Analytics**: No advanced analytics for turnover prediction, hiring forecasting, or diversity metrics
10. **Integration with Biometric Systems**: No connectivity to attendance biometric devices or access control systems

## I. Current quality
Score:
* Functionality /10: 6 (Basic CRUD operations for employees exist, but key modules like payroll, attendance, leave are mock/incomplete)
* Authorization /10: 8 (Proper role-based access control via permissions matrix, but missing fine-grained scoping)
* Dashboard /10: 7 (Good visualization of metrics, but based on incomplete/mock data)
* Backend integration /10: 5 (Several key procedures return mock or empty data)
* UX /10: 8 (Well-designed dashboard with proper charts and cards)
* Auditability /10: 6 (Limited audit trails visible in code for HR-specific actions)
* Production readiness /10: 5 (Not production-ready due to incomplete core HR modules)

## J. Improvements
List concrete improvements, not generic suggestions:

1. **Implement Actual Leave Management**: 
   - Create `leave_requests` table in database
   - Implement proper CRUD operations for leave requests in hrRouter
   - Add approval workflow with notifications

2. **Complete Payroll Integration**: 
   - Implement `getPayroll` procedure to return actual payroll data
   - Add payroll processing procedures with tax calculations, statutory deductions
   - Integrate with payment processing for salary disbursement

3. **Implement Real Attendance Tracking**: 
   - Connect `getAttendance` to actual attendance records
   - Add biometric device integration points
   - Implement geo-fencing for remote workers

4. **Enhance Performance Management**: 
   - Add goal setting and tracking procedures
   - Implement 360-degree feedback collection
   - Add performance improvement plan tracking

5. **Add Training Management Module**: 
   - Create tables for training programs, employee participation, certifications
   - Implement tracking of mandatory vs optional training
   - Add expiry tracking for certifications

6. **Implement Offboarding Workflow**: 
   - Create exit interview templates and tracking
   - Add asset return procedures
   - Implement final settlement calculations

7. **Add Compliance Reporting**: 
   - Implement automated generation of statutory reports
   - Add alerts for compliance filing deadlines
   - Create audit trails for compliance-related changes

8. **Enhance Employee Self-Service**: 
   - Create employee portal for viewing payslips, requesting leaves, or updating personal info
   - Add mobile accessibility for self-service functions

9. **Implement Advanced Analytics**: 
   - Add predictive analytics for turnover risk
   - Implement diversity and inclusion tracking
   - Add hiring forecast based on business growth projections

10. **Add Data Validation and Sanitization**: 
    - Implement server-side validation for all HR data modifications
    - Add input sanitization to prevent injection attacks
    - Implement role-based field-level security (e.g., hide salary from non-HR managers)


## Manager Role Audit

# ROLE: Manager

## A. What this employee currently does
Based on code analysis, Manager personnel in the Evaluna ERP system are responsible for operational oversight of their assigned branch/department including:
- Monitoring daily sales, orders, and revenue metrics
- Managing inventory levels and stock movements
- Overseeing customer orders and delivery operations
- Managing staff attendance and performance
- Handling expenses and cash book management
- Generating operational reports and analytics
- Approving certain transactions and workflows

Evidence from TRPC routers shows managers have access to procedures for:
- Dashboard KPIs (today's sales, bills, profit, footfall, pending orders, etc.)
- Order management (create, read, update, delete, confirm)
- Customer management (CRUD operations)
- Inventory operations (adjustments, conversions, scanning)
- Supplier management (CRUD operations)
- Product management (CRUD operations)
- Financial operations (expenses, transactions, dashboard stats)
- Staff management (listing, basic info)
- Attendance tracking
- Reports generation
- Purchase and sales returns

## B. Dashboard
* **dashboard route**: `/manager`
* **page/component**: `apps/web/src/app/manager/page.tsx` (BranchManagerDashboard component)
* **navigation**: Defined in `apps/web/src/app/manager/layout.tsx` with managerNavItems array containing links to:
  - Dashboard (/manager)
  - Orders (/manager/orders)
  - Purchase Returns (/manager/purchase-returns)
  - Warehouse (/manager/warehouse)
  - Inventory (/manager/inventory)
  - Billing (/manager/billing)
  - Delivery (/manager/delivery)
  - Customers (/manager/customers)
  - Staff (/manager/staff)
  - Attendance (/manager/attendance)
  - Expenses (/manager/expenses)
  - Cash Book (/manager/cash-book)
  - Reports (/manager/reports)
  - Products (/manager/products)
  - Purchases (/manager/purchases)
  - Cashier (/manager/cashier)
  - Warehouse Movement (/manager/warehouse/movement)
  - Warehouse Locations (/manager/warehouse/locations)
  - Warehouse Conversions (/manager/warehouse/conversions)
  - Warehouse Scanner (/manager/warehouse/scanner)
* **widgets/cards**: The main dashboard displays multiple statistic cards:
  - Today's Sales (with trend vs yesterday)
  - Today's Bills (order count with trend)
  - Net Profit (with positive/negative indicator)
  - Footfall (customer count)
  - Pending Orders (delivery count)
  - Orders Ready (ready for pickup/delivery)
  - Delivery Pending (out for delivery)
  - Returns (count requiring action)
* **charts**: 
  - Today's Timeline (live feed of branch operations)
  - Top Products (by revenue sold)
  - Low Stock Alerts (count of items needing re-order)
  - Staff Performance (sales and rating)
  - Cash Collection (breakdown by payment type)
  - Manager Tasks (todo list with priority/status)
  - Realtime Alerts & Activities (notifications by type)
* **tables**: Not prominently featured on main dashboard (data presented in cards/charts)
* **actions**: 
  - View detailed reports via navigation
  - Approve/reject tasks
  - Drill down into specific metrics
* **filters**: 
  - Branch context (via cookie/evaluna.branch_context)
  - Time-based filtering in various procedures
* **reports**: Access to detailed reports via the reports subdirectory

## C. Exact permissions
List of permissions actually implemented for Manager role (level 1):
* **View**: 
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
* **Create**:
  - pos.write
  - inventory.write
  - purchases.write
  - suppliers.write
  - customers.write
  - products.write
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
* **Edit**: Same as Create permissions (write permission covers both create and update)
* **Delete**: 
  - pos.delete
  - inventory.delete
  - purchases.delete
  - suppliers.delete
  - customers.delete
  - products.delete
  - None for staff, reports, accounting, finance, settings, monitoring, branches, payroll, marketing (requires admin level)
  - warehouse.delete
  - notifications.delete
  - imports.delete
  - loyalty.delete
* **Approve**:
  - pos.approve
  - inventory.approve
  - purchases.approve
  - suppliers.approve
  - customers.approve
  - finance.approve
  - warehouse.approve
  - None for settings, monitoring, branches, payroll, marketing (requires admin level)
  - attendance.approve (via HR level and above, but manager can approve via hr role inheritance? Actually checking...)
  - Note: Manager does NOT have attendance.approve (requires HR level 3)
* **Reject**: Not explicitly implemented as separate permission
* **Assign**: Not explicitly implemented as separate permission
* **Pay**: Not explicitly implemented as separate payment (inferred from finance.write)
* **Refund**: Not explicitly implemented as separate permission
* **Reconcile**: Not explicitly implemented as separate permission
* **Dispatch**: Not explicitly implemented as separate permission
* **Deliver**: Not explicitly implemented as separate permission
* **Adjust inventory**: inventory.write permission covers this
* **Modify customer**: customers.write permission
* **Modify supplier**: suppliers.write permission
* **Modify employee**: staff.write permission
* **Modify payroll**: payroll.write permission
* **Modify settings**: None (requires admin level)

**Note**: Manager role inherits all permissions from levels 2-12 (auditor, hr, marketing, putter, picker, driver, biller, sales_person, delivery_manager, delivery_boy, customer) due to the hierarchical permission system.

## D. Backend connection
For important dashboard actions identify:
**UI → Query/Mutation → Router → Service → Database → Side effect**

1. **View Dashboard Statistics**:
   - UI: BranchManagerDashboard component calls useTRPC().dashboard.getKpis
   - Query: dashboard.getKpis query in trpc/routers/dashboard.ts
   - Router: dashboardRouter.getKpis
   - Service: Aggregates data from multiple sources
   - Database: 
     - transactions table (today's sales, cash inflow)
     - orders table (today's bills/orders count)
     - staff table (footfall calculation)
   - Side effect: Returns aggregated KPIs for display

2. **Order Management**:
   - UI: Orders management section
   - Query/Mutation: Handled by ordersRouter (create, read, update, delete, confirmOrder, etc.)
   - Router: ordersRouter
   - Service: Direct database operations with transaction handling
   - Database: 
     - orders table (CRUD operations)
     - orderItems table (related items)
     - branchInventory table (stock reservations/deductions)
     - transactions table (payment recording)
     - stockLedger table (inventory movements)
   - Side effect: Creates/reads/updates/deletes order records and updates inventory/financials

3. **Customer Management**:
   - UI: Customers management section
   - Query/Mutation: Handled by customersRouter (CRUD operations, ledger adjustments)
   - Router: customersRouter
   - Service: Direct database operations
   - Database: 
     - customers table (CRUD operations)
     - customerLedger table (credit/points adjustments)
   - Side effect: Creates/reads/updates/deletes customer records and manages financial relationships

4. **Inventory Operations**:
   - UI: Inventory management section
   - Query/Mutation: Handled by inventoryRouter (adjustments, conversions, scanning)
   - Router: inventoryRouter
   - Service: Direct database operations
   - Database: 
     - branchInventory table (stock levels)
     - stockLedger table (inventory movements)
     - stockAdjustments table (adjustment records)
     - productConversions table (pack/loose conversions)
   - Side effect: Updates inventory levels and logs movements/conversions

5. **Supplier Management**:
   - UI: Suppliers management section
   - Query/Mutation: Handled by suppliersRouter (CRUD operations)
   - Router: suppliersRouter
   - Service: Direct database operations
   - Database: 
     - suppliers table (CRUD operations)
   - Side effect: Creates/reads/updates/deletes supplier records

6. **Product Management**:
   - UI: Products management section
   - Query/Mutation: Handled by productsRouter (CRUD operations)
   - Router: productsRouter
   - Service: Direct database operations
   - Database: 
     - products table (CRUD operations)
   - Side effect: Creates/reads/updates/deletes product records

7. **Financial Operations**:
   - UI: Expenses and financial management sections
   - Query/Mutation: Handled by financeRouter and expenses procedures
   - Router: financeRouter, expenses procedures in relevant routers
   - Service: Direct database operations
   - Database: 
     - expenses table (CRUD operations)
     - transactions table (financial movements)
     - bankAccounts table (bank/cash balances)
   - Side effect: Creates/reads/updates/deletes expense records and tracks financial transactions

8. **Staff Management**:
   - UI: Staff management section
   - Query/Mutation: Handled by staffRouter (listing, basic info)
   - Router: staffRouter
   - Service: Direct database operations
   - Database: 
     - staff table (read operations)
   - Side effect: Returns staff information for display and management

9. **Attendance Tracking**:
   - UI: Attendance management section
   - Query/Mutation: Handled by attendanceRouter
   - Router: attendanceRouter
   - Service: Direct database operations
   - Database: 
     - attendance table (CRUD operations)
   - Side effect: Creates/reads/updates/deletes attendance records

## E. Database access
List the actual tables/models/entities this role can access:
* staff (read, write)
* attendance (read, write)
* customers (read, write)
* customerLedger (read, write)
* suppliers (read, write)
* products (read, write)
* orders (read, write)
* orderItems (read, write)
* transactions (read, write)
* expenses (read, write)
* branchInventory (read, write)
* stockLedger (read, write)
* stockAdjustments (read, write)
* productConversions (read, write)
* bankAccounts (read)
* settings (read)
* branches (read)
* reports (read)
* notifications (read, write)
* imports (read, write)
* loyalty (read, write)
* warehouse (read, write)

Note: Manager role does NOT have write access to:
- settings tables (requires admin level)
- user management tables beyond staff (requires admin level for role changes)
- Certain financial reconciliation tables (requires admin level)

Note: Manager role inherits read access to all tables accessible to roles level 2-12 (auditor and below), but write access is limited to operational tables as listed above.

## F. What the employee cannot do
Based on permission analysis and code inspection:
* Delete records for: staff, reports, accounting, finance, settings, monitoring, branches, payroll, marketing
* Approve records for: settings, monitoring, branches, payroll, marketing
* Modify system settings (settings.write requires admin level)
* Modify user roles or create admin-level users
* Access superadmin-only features
* View or modify system-wide configurations beyond branch level
* Access audit trails for modification (can only view via auditor-level permissions)
* Execute certain financial operations requiring dual approval
* Access encryption/security settings
* Modify branch-level configurations beyond operational parameters
* Access certain advanced financial reconciliation tools
* View detailed payroll configuration beyond basic processing
* Modify tax rates or financial rules
* Execute system maintenance or backup operations

## G. Security risks
Identify excessive permissions, missing server checks, IDOR possibilities, or privilege escalation:

1. **Appropriate Permissions**: Manager role has well-scoped permissions appropriate for operational oversight - can manage day-to-day operations but cannot modify system configuration or access sensitive HR/financial master data.

2. **Missing Validations**: 
   - In order confirmation procedures, additional validation could be added for fraud prevention
   - Inventory adjustment procedures could benefit from mandatory reason fields and approval workflows for large adjustments

3. **IDOR Risks**: 
   - Procedures generally properly scope to user's branchId where applicable
   - Some procedures accept branch_id parameters but validation could be strengthened
   - Overall IDOR risk appears low due to proper scoping

4. **Privilege Escalation**: 
   - Manager role cannot create or modify user roles to elevate privileges
   - No visible path to gain admin or superadmin access through manager permissions
   - Write access to operational tables is appropriate for role function

5. **Information Disclosure**: 
   - Manager dashboard shows appropriate operational metrics for branch management
   * Financial information is limited to branch-level transactions and expenses
   * No access to company-wide financials or master payroll data

## H. Missing work
Identify capabilities required for the role but currently absent:

1. **Advanced Approval Workflows**: 
   - No multi-level approval for high-value transactions
   - No conditional approval rules based on amount or risk factors

2. **Budget Management**: 
   - No ability to set or track operational budgets
   - No variance analysis between planned vs actual spending

3. **Advanced Inventory Controls**: 
   - No automated reorder point suggestions
   - No vendor performance tracking
   - No quality control inspection workflows

4. **Customer Relationship Management**: 
   - No customer segmentation or lifetime value tracking
   - No automated marketing campaign triggers based on customer behavior
   - No loyalty program analytics beyond basic points tracking

5. **Employee Development**: 
   - No performance improvement plan tracking
   - No skill gap analysis or training recommendations
   - No succession planning capabilities

6. **Advanced Financial Controls**: 
   - No cash flow forecasting
   - No cost center or profitability analysis by product/category
   - No automated financial reconciliation alerts

7. **Integration Capabilities**: 
   - No API access for third-party integrations
   - No webhook system for real-time notifications
   - No integration with accounting software (Tally, QuickBooks, etc.)

8. **Mobile Workforce Management**: 
   - No geofencing for staff attendance
   - No route optimization for delivery personnel
   - No real-time vehicle tracking

9. **Compliance & Audit**: 
   - No automated tax filing preparation
   - No internal audit trail for manager-specific actions
   - No compliance checklist tracking

10. **Customer Self-Service Enhancements**: 
    - No customer portal for self-service returns/exchanges
    - No automated customer satisfaction surveys
    - No warranty or service contract tracking

## I. Current quality
Score:
* Functionality /10: 8 (Core operational modules work well for day-to-day management)
* Authorization /10: 9 (Proper role-based access control with appropriate restrictions)
* Dashboard /10: 8 (Excellent visualization of key operational metrics)
* Backend integration /10: 8 (Good database connections for core operational functions)
* UX /10: 8 (Well-designed interface with logical navigation and workflows)
* Auditability /10: 7 (Standard audit logs exist but could be enhanced for managerial actions)
* Production readiness /10: 8 (Production-ready for core operational management)

## J. Improvements
List concrete improvements, not generic suggestions:

1. **Implement Approval Workflow Enhancements**: 
   - Add multi-level approval for transactions above configurable thresholds
   - Implement conditional approval rules (e.g., discounts >10% require manager approval)

2. **Add Budget Management Module**: 
   - Create budgets table for operational expense tracking
   - Implement budget vs actual reporting with variance analysis
   - Add budget alert notifications when thresholds are approached

3. **Enhance Inventory Management**: 
   - Add automated reorder point calculations based on velocity
   - Implement vendor scoring and performance tracking
   - Add quality control inspection workflows for received goods

4. **Enhance CRM Capabilities**: 
   - Add customer segmentation based on purchase frequency/value
   - Implement automated marketing triggers for customer lifecycle events
   - Add loyalty program analytics with redemption tracking

5. **Implement Employee Development Tools**: 
   - Add performance improvement plan tracking
   - Implement skill gap analysis and training recommendations
   - Add basic succession planning capabilities for key roles

6. **Add Advanced Financial Controls**: 
   - Implement cash flow forecasting based on receivables/payables
   - Add cost center tracking and profitability analysis by product/category
   - Implement automated financial reconciliation alerts for mismatches

7. **Add Integration Capabilities**: 
   - Implement REST API endpoints for third-party integrations
   - Add webhook system for real-time event notifications
   - Add connectors for popular accounting software

8. **Enhance Mobile Workforce Management**: 
   - Add geofencing capabilities for staff attendance verification
   - Implement route optimization for delivery personnel
   - Add real-time vehicle tracking integration points

9. **Improve Compliance & Audit Features**: 
   - Add automated tax calculation and reporting helpers
   - Create manager-specific audit trail for operational decisions
   - Add compliance checklist tracking for operational requirements

10. **Enhance Customer Self-Service**: 
    - Add customer portal for self-service returns/exchanges
    - Implement automated customer satisfaction feedback collection
    - Add warranty and service contract tracking capabilities

## Super Admin Role Audit

# ROLE: Super Admin

## A. What this employee currently does
The Super Admin is a system-wide administrator with unrestricted access to all Evaluna ERP functionality. Unlike other roles that are defined in the role hierarchy (permissions.ts), Super Admin status is granted via the `is_superadmin` boolean flag on the user record (auth-schema.ts). Super Admins can:

- Manage all system settings, configurations, and infrastructure
- Oversee all branches, companies, and subscriptions
- Manage all users and roles across the entire system
- Access all financial data, billing information, and revenue metrics
- Perform system maintenance, backups, and monitoring
- Manage master data and system-wide configurations
- Conduct system audits and compliance checks
- Access all dashboards and administrative functions without restriction

## B. Dashboard
* **dashboard route**: `/superadmin`
* **page/component**: `apps/web/src/app/superadmin/page.tsx` (SuperAdminDashboard component)
* **navigation**: Defined in `apps/web/src/app/superadmin/layout.tsx` with superAdminNavItems array containing links to:
  - Dashboard (/superadmin)
  - Branches (/superadmin/branches)
  - Companies (/superadmin/companies)
  - Users (/superadmin/users)
  - Roles (/superadmin/roles)
  - Client Management (/superadmin/client-management)
  - Permissions (/superadmin/permissions)
  - Master Data (/superadmin/master-data)
  - Dashboard Builder (/superadmin/dashboard-builder)
  - Health (/superadmin/health)
  - Audit Logs (/superadmin/audit-logs)
  - Backups (/superadmin/backups)
  - Monitoring (/superadmin/monitoring)
  - Settings (/superadmin/settings)
* **widgets/cards**: The main dashboard displays 4 statistic cards:
  - Total Branches (links to branches management)
  - System Health (shows status, links to health tab)
  - Global Users (shows count, links to role assignment)
  - Master Data (shows synchronization status)
* **tables**: Not present on main dashboard, but available in sub-sections
* **charts**: Not present on main dashboard (health section likely contains charts)
* **actions**: Navigation to all sub-sections for management operations
* **filters**: Not present on main dashboard (available in sub-sections)
* **reports**: Not present on main dashboard (available in sub-sections like monitoring, health, etc.)

## C. Exact permissions
Based on code analysis, Super Admins bypass ALL permission and role checks:
* **View**: All data (bypasses all restrictions via isSuperadmin flag)
* **Create**: All entities (bypasses all restrictions via isSuperadmin flag)
* **Edit**: All entities (bypasses all restrictions via isSuperadmin flag)
* **Delete**: All entities (bypasses all restrictions via isSuperadmin flag)
* **Approve**: All approval workflows (bypasses all restrictions via isSuperadmin flag)
* **Reject**: All rejection workflows (bypasses all restrictions via isSuperadmin flag)
* **Assign**: All assignment operations (bypasses all restrictions via isSuperadmin flag)
* **Pay**: All payment processing (bypasses all restrictions via isSuperadmin flag)
* **Refund**: All refund operations (bypasses all restrictions via isSuperadmin flag)
* **Reconcile**: All reconciliation operations (bypasses all restrictions via isSuperadmin flag)
* **Dispatch**: All dispatch operations (bypasses all restrictions via isSuperadmin flag)
* **Deliver**: All delivery operations (bypasses all restrictions via isSuperadmin flag)
* **Adjust inventory**: All inventory adjustments (bypasses all restrictions via isSuperadmin flag)
* **Modify customer**: All customer modifications (bypasses all restrictions via isSuperadmin flag)
* **Modify supplier**: All supplier modifications (bypasses all restrictions via isSuperadmin flag)
* **Modify employee**: All employee modifications (bypasses all restrictions via isSuperadmin flag)
* **Modify payroll**: All payroll modifications (bypasses all restrictions via isSuperadmin flag)
* **Modify settings**: All settings modifications (bypasses all restrictions via isSuperadmin flag)

**Note**: Super admins bypass all checks in:
- requirePermission middleware (packages/api/src/index.ts lines 85-86, 110)
- requireRole middleware (apps/web/src/lib/trpc/middleware/requireRole.ts lines 15-16)
- superadminProcedure (packages/api/src/index.ts lines 66-77)

## D. Backend connection
For important dashboard actions:

**UI → Query/Mutation → Router → Service → Database → Side effect**

1. **View Dashboard Statistics**:
   - UI: SuperAdminDashboard component (page.tsx)
   - Query: getDashboardStats query in superadminRouter (trpc/routers/superadmin.ts lines 14-43)
   - Router: superadminRouter.getDashboardStats
   - Service: Direct database queries via db client
   - Database: 
     - companies table (total companies, active companies)
     - staff/user table (total users)
     - branches table (total branches)
     - billingInvoices table (revenue sum)
   - Side effect: Returns aggregated statistics for display

2. **Manage Companies**:
   - UI: Companies management section
   - Query/Mutation: getCompanies (query), createCompany (mutation) in superadminRouter
   - Router: superadminRouter.getCompanies/.createCompany
   - Service: Direct database operations
   - Database: companies table (CRUD operations)
   - Side effect: Creates/reads/updates/deletes company records

3. **View System Health**:
   - UI: Health dashboard section
   - Query: getSystemHealth query in superadminRouter (lines 66-75)
   - Router: superadminRouter.getSystemHealth
   - Service: Returns mock health data (implementation needed)
   - Database: No direct connection (returns static mock data)
   - Side effect: Displays system health metrics (currently mock implementations)

4. **Manage Users/Roles/Permissions**:
   - UI: Users, Roles, Permissions sections
   - Query/Mutation: Handled by respective routers (users.ts, roles.ts, permissions.ts)
   - Router: userRouter, rolesRouter, permissionsRouter
   - Service: Direct database operations via procedures
   - Database: staff, roles, user_roles, user_companies tables
   - Side effect: Manages user accounts, role assignments, and permissions

## E. Database access
Super Admins can access ALL tables in the database due to bypassing all permission checks. Based on schema analysis, key accessible tables include:

**Core System Tables**:
- staff (user accounts and employee information)
- roles (role definitions)
- user_roles (many-to-many between staff and roles)
- user_companies (user-company associations)
- companies (organizational entities)
- branches (physical locations)
- subscriptions (billing subscriptions)
- plans (subscription plans)
- billingInvoices (financial transactions)

**Audit and Monitoring Tables**:
- audit_logs (system audit trail)
- compliance_logs (compliance tracking)
- system_settings (global configuration)
- backup_schedules (backup management)
- health_checks (system monitoring)
- alerting_systems (alert configurations)

**Operational Tables** (accessible via bypass):
- customers, suppliers, products, inventory
- orders, invoices, payments
- payroll, salary_structures
- warehouse_operations, stock_levels
- marketing_campaigns, leads
- attendance_records, leave_requests
- And all other tables in the schema

## F. What the employee cannot do
Super Admins have no explicit restrictions in the codebase. However, inherent limitations include:
* Cannot perform actions when the system is offline/maintenance (infrastructure level)
* Cannot exceed database or server resource limits (infrastructure level)
* Cannot bypass authentication (must be logged in as a user with isSuperadmin=true)
* Cannot perform actions that violate database constraints (e.g., unique violations, foreign key constraints)
* Cannot modify the isSuperadmin flag on their own account without another Super Admin doing it (self-prevention mechanism would need to be implemented)

## G. Security risks
* **Excessive permissions**: Super Admins have unrestricted access to all system data and functionality - this is by design but represents a significant risk if compromised
* **Missing server checks**: None - Super Admin bypass is implemented at the procedure level (superadminProcedure) and middleware level (requirePermission, requireRole)
* **IDOR possibilities**: Not applicable as Super Admins can access all resources anyway
* **Privilege escalation**: 
  - If a Super Admin account is compromised, attacker gains full system access
  - No additional elevation needed as Super Admin is already the highest privilege level
  - Risk of credential theft leading to immediate system compromise
* **Additional risks**:
  - No requirement for Just-In-Time (JIT) access or time-limited Super Admin sessions
  - No mandatory multi-factor authentication specifically for Super Admin actions
  - No audit trail specifically tracking when Super Admin bypasses are used (though general audit logs exist)
  - No separation of duties - Super Admins can both create and approve all transactions

## H. Missing work
* **Just-in-Time Super Admin access**: No mechanism for requesting temporary Super Admin elevation
* **Super Admin activity isolation**: No separate logging/monitoring of Super Admin-specific activities
* **Emergency access procedures**: No defined break-glass procedures for Super Admin lockout scenarios
* **Super Admin session timeout**: No special idle timeout for Super Admin sessions (uses standard session settings)
* **Geofencing/IP restrictions**: No ability to restrict Super Admin login to specific networks or locations
* **Approval workflows for critical Super Admin actions**: No requirement for dual approval on certain high-risk Super Admin operations
* **Password policy enforcement**: No special password requirements for Super Admin accounts
* **Privileged access workstation (PAW) requirements**: No requirement to use hardened systems for Super Admin access
* **Behavioral analytics**: No anomaly detection for Super Admin behavior patterns

## I. Current quality
* **Functionality /10**: 9 - Core Super Admin functionality works correctly
* **Authorization /10**: 10 - SuperadminProcedure and middleware correctly bypass all checks
* **Dashboard /10**: 7 - Main dashboard shows basic stats but lacks real-time charts and deeper insights
* **Backend integration /10**: 8 - Good database connections for core functions, but some sections (like health) use mock data
* **UX /10**: 8 - Clean interface with logical navigation, but could benefit from more data visualization
* **Auditability /10**: 8 - General audit logs exist, but Super Admin-specific actions aren't highlighted
* **Production readiness /10**: 8 - Solid foundation but missing some enterprise-grade security controls

## J. Improvements
* Implement Just-In-Time (JIT) Super Admin access with approval workflows
* Add mandatory MFA for Super Admin login and sensitive operations
* Create Super Admin-specific audit trail with tamper-proof logging
* Implement geofencing and IP-based restrictions for Super Admin access
* Add behavioral analytics to detect anomalous Super Admin activity
* Implement password vault integration for Super Admin credentials
* Create emergency access procedures (break-glass) with oversight
* Add real-time system health monitoring with actual metrics (replace mock data)
* Implement Super Admin session recording for high-risk operations
* Add data loss prevention (DLP) controls for Super Admin data exports
* Implement role-based Super Admin scopes (e.g., Super Admin for billing only, HR only, etc.)