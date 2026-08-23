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