# DASHBOARD ROLE MATRIX

This matrix maps role-specific dashboards to their actual implementation status based on the operational audits of HR, Marketing, Putter, and Picker roles.

## Role-Based Dashboard Matrix

| Dashboard | Role | Path | Purpose | Real Data Source | API Connection | Database Tables | Key Mutations | Authorization Level | Data Accuracy | Status |
|-----------|------|------|---------|------------------|----------------|-----------------|---------------|---------------------|---------------|--------|
| HR Dashboard | HR | /hr | Workforce analytics and employee management | hr.getDashboardStats | hrRouter.getDashboardStats | staff, attendance, payroll | Leave approval, payroll processing | hr role | Partially Complete (some mock data) | PARTIALLY CONNECTED |
| Marketing Dashboard | Marketing | /admin/marketing | Marketing campaign and coupon management | marketing.getMetrics* | marketingRouter.getMetrics* | coupons, campaigns, campaignAudiences | Create coupon, launch campaign | marketing role | Not Implemented (missing procedure) | NOT CONNECTED |
| Putter Dashboard | Putter | /putter | Warehouse put-away and receiving operations | putter.getDashboardStats | putterRouter.getDashboardStats | purchases, purchaseItems, stockAdjustments | Receive inventory, put-away confirmation | putter role | Partially Complete (hardcoded/random values) | PARTIALLY CONNECTED |
| Picker Dashboard | Picker | /picker | Order picking and task management | picker.getDashboardStats | pickerRouter.getDashboardStats | pickLists, pickListItems, locations | Scan item, report PNA, manual confirm | picker role | Mostly Complete (real metrics, some mock fallbacks) | MOSTLY CONNECTED |

*Note: The marketing.getMetrics procedure does not exist in the current implementation, causing the dashboard to show placeholder content instead of real metrics.

### Detailed Dashboard Analysis by Role

#### HR Dashboard (/hr)
- **Widgets**: KPI cards for total employees, present today, on leave, payroll pending, new hires, attrition rate, open positions, average salary
- **Charts**: Workforce growth bar chart (hires vs attrition), Department distribution pie chart
- **Tables**: Recent employees table
- **Data Issues**: 
  - getAttendance returns empty array
  - getLeaveRequests returns mock data
  - getPayroll returns empty array
  - getPerformance returns mock data
  - getRecruitment returns mock data
- **Verified Working**: getDashboardStats, getEmployees, getSalaryStructure

#### Marketing Dashboard (/admin/marketing)
- **Widgets**: KPI cards for active campaigns, coupons redeemed, loyalty points given, new subscribers
- **Charts**: None implemented (placeholder for "Marketing activity chart/list will be rendered here.")
- **Tables**: None on main dashboard
- **Data Issues**:
  - getMetrics procedure does not exist (dashboard calls trpc.marketing.getMetrics which is missing)
  - All marketing KPIs would be missing or placeholder without this procedure
- **Verified Working**: None for dashboard metrics (subpages for coupons/campaigns work)

#### Putter Dashboard (/putter)
- **Widgets**: KPI cards for itemsToReceive, putAwayQueue, missingStock, damageReports, saleReturns, efficiencyPct
- **Charts**: Line chart showing "Receiving & Put Away Trend (Last 7 Days)"
- **Tables**: None on main dashboard
- **Data Issues**:
  - missingStock hardcoded to 3
  - saleReturns hardcoded to 12
  - efficiencyPct hardcoded to 98.4%
  - When no real data exists for chartData, random values are generated
  - getMissingStock, getSaleReturns, getReports return empty arrays
- **Verified Working**: getDashboardStats (with caveats), getReceiving, getPutAwayTasks, getDamageReports, getCompleted

#### Picker Dashboard (/picker)
- **Widgets**: KPI cards for assignedToday, completed, pending, exceptions, totalItemsPicked, pickAccuracy
- **Charts**: None on main dashboard
- **Tables**: Recent activity table showing pick lists
- **Data Issues**:
  - getReturns returns mock data
  - getReports returns mock data
  - getCompleted and getPending have mock data fallbacks when no real data exists
- **Verified Working**: getDashboardStats, getPickLists, getCurrentTask, reportPNA, scanItem, manualConfirm

### Connection Status Legend
- **FULLY CONNECTED**: All dashboard elements show real data from actual database queries
- **MOSTLY CONNECTED**: Core functionality works with real data, minor elements use mock/fallback data
- **PARTIALLY CONNECTED**: Significant mix of real and mock data, key features missing or non-functional
- **NOT CONNECTED**: Dashboard shows primarily placeholder/mock data or missing critical procedures