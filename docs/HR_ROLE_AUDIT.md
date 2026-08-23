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
* Pay: Not explicitly implemented as separate permission (inferred from payroll.write)
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
   - Create employee portal for viewing payslips, requesting leaves, updating personal info
   - Add mobile accessibility for self-service functions

9. **Implement Advanced Analytics**: 
   - Add predictive analytics for turnover risk
   - Implement diversity and inclusion tracking
   - Add hiring forecast based on business growth projections

10. **Add Data Validation and Sanitization**: 
    - Implement server-side validation for all HR data modifications
    - Add input sanitization to prevent injection attacks
    - Implement role-based field-level security (e.g., hide salary from non-HR managers)