# Payroll System Architecture Discovery Report

## Current State Analysis

### Database Schema

#### Core Tables
1. **payroll** - Stores payroll records
   - id (serial PK)
   - staff_id (FK to staff)
   - month, year (pay period)
   - base_salary, overtime_pay, bonus, deductions, advance_deduction
   - net_payable
   - status (draft/approved/paid)
   - payment_date, payment_method_id
   - notes

2. **staff** - Employee master data
   - id (serial PK)
   - salary (current base salary)
   - bank_account, bank_name, ifsc
   - employee_code, name, email, phone
   - department, branch_id
   - join_date, status

3. **enhanced_attendance** - Detailed attendance tracking
   - GPS check-in/out, selfie verification
   - break tracking, risk scoring
   - overtime calculation fields
   - attendance_status enum

4. **leave_applications** - Employee leave requests
   - leave_type_id (FK to leave_types)
   - start_date, end_date
   - status (pending/approved/rejected/cancelled)
   - approved_by, approved_at

5. **leave_types** - Leave policies
   - name, code, description
   - is_paid, max_days, carry_forward

6. **overtime** - Overtime records
   - hours, rate, status
   - approved_by, approved_at

7. **payment_methods** - Disbursement options
   - name, payment_type (cash/bank/etc)
   - bank details

8. **transactions** - Financial records
   - Used for payroll payments as expenses
   - amount, payment_method_id, staff_id

### TRPC Routers

#### payroll.ts
- **list**: Filtered payroll records with staff details
- **generate**: Creates draft payroll from staff salaries
- **update**: Modify salary components, recalculate net payable
- **approve**: Set status to approved
- **pay**: Mark as paid, create expense transaction

#### hr.ts
- **getLeaveRequests**: List leave applications with filters
- **createLeaveApplication**: Submit leave requests
- **updateLeaveApplication**: Approve/reject/cancel leaves
- **deleteLeaveApplication**: Delete pending applications
- **getSalaryStructure**: Calculate salary components
- **createPayroll**: Generate payroll with attendance/leave integration

#### attendance.ts
- Legacy: Basic clock-in/out
- Production: Geofenced attendance with GPS validation

### Current Capabilities

1. **Payroll Generation**
   - Batch generation from staff base salaries
   - Integration with attendance (present days calculation)
   - Integration with approved leave applications
   - Integration with approved overtime
   - Basic salary component calculation

2. **Approval Workflow**
   - Three-state system: draft → approved → paid
   - Role-based access (HR/manager for creation/updates)
   - Prevents modification of paid payrolls

3. **Payment Processing**
   - Marks payroll as paid with date/method
   - Creates corresponding expense transaction
   - Records payment details

4. **Leave Management**
   - Full lifecycle: create → approve/reject → cancel/delete
   - Overlap prevention
   - Leave type validation (max days)
   - Balance checking (simplified)

5. **Attendance Tracking**
   - GPS-based verification
   - Break time tracking
   - Risk scoring for anomalies
   - Device registration and validation

## Identified Gaps for Complete 49-Point Payroll System

### 1. Employee Salary Structure with Effective-Dated Changes
**Missing:**
- Salary history tracking table
- Effective-dated salary revisions
- Multiple salary components structure
- Salary component templates (basic, HRA, conveyance, etc.)

### 2. Approval Workflows
**Missing:**
- Multi-level approval chains (employee → manager → HR → finance)
- Workflow notifications and escalations
- Approval rules based on amount thresholds
- Delegation and backup approvers

### 3. Attendance/Leave Integration
**Missing:**
- Automated payroll calculation from attendance data
- Shift differentials, holiday pay, night shift allowances
- Undertime calculations and recovery
- Leave encashment processing
- Attendance-based salary adjustments

### 4. Compensation Management
**Missing:**
- Reimbursement tracking (medical, travel, etc.)
- Salary advance and recovery management
- Bonus, incentive, commission structures
- Arrears and backpay calculations
- Retroactive pay adjustments

### 5. Payroll Calculation Engine
**Missing:**
- Statutory deductions (PF, ESI, gratuity, professional tax)
- Tax calculations (TDS based on income slabs)
- Loan recovery processing
- Variable components (shift allowances, incentive pay)
- Cost-to-company (CTC) breakdown

### 6. Validation and Review
**Missing:**
- Pre-payroll validation checks
- Payroll review/approval workflows
- Variance analysis vs. budgeted/forecasted amounts
- Anomaly detection (unusual variations)
- Employee self-service for discrepancies

### 7. Payment Processing and Reconciliation
**Missing:**
- Multiple payment methods (NEFT, RTGS, IMPS, check, cash)
- Payment reconciliation workflows
- Payment status tracking (pending, processed, cleared, bounced)
- Bank statement integration
- Payment reminders and follow-ups

### 8. Payslip Generation
**Missing:**
- Detailed payslip templates
- Multiple formats (PDF, print, email, SMS)
- Earnings/deductions breakdown
- Year-to-date (YTD) summaries
- Employee self-service portal
- Digital signatures and encryption

### 9. Notifications, Audit, Security, and Reporting
**Missing:**
- Payroll-specific notifications (generation, approval, payment)
- Enhanced audit trail for payroll-specific changes
- Role-based security for sensitive payroll data
- Comprehensive payroll reports
   - Payroll register
   - Cost analysis reports
   - Statutory filings (PF, ESI, TDS returns)
   - Bank reconciliation statements
   - Department-wise cost reports

## Recommendations for Implementation

### Phase 1: Foundation Enhancements
1. Create salary history table with effective dates
2. Enhance staff table with multiple salary components
3. Implement statutory deduction calculations
4. Add tax calculation engine

### Phase 2: Workflow & Integration
1. Implement multi-level approval workflows
2. Enhance attendance/leave to payroll integration
3. Add compensation management modules
4. Implement payment method enhancements

### Phase 3: Employee Experience & Reporting
1. Develop payslip generation system
2. Create employee self-service portal
3. Implement notification system
4. Build comprehensive reporting engine

### Phase 4: Advanced Features
1. Add arrears/backpay processing
2. Implement retroactive adjustments
3. Add analytics and forecasting
4. Integrate with external accounting systems

## Dependencies

### Internal Dependencies
- Staff/employee master data
- Attendance and leave management systems
- Financial accounting (transactions, payment methods)
- Branch and multi-tenancy infrastructure
- Role-based access control system
- Audit logging framework

### External Integrations
- Banking APIs for payment processing
- Government portals for statutory filings
- Biometric device APIs for attendance
- Email/SMS gateways for notifications

## Implementation Approach

1. **Backward Compatibility**: All changes must maintain compatibility with existing payroll runs
2. **Migration Strategy**: Schema migrations with data migration scripts
3. **Testing**: Comprehensive test suite covering edge cases
4. **Performance**: Optimized for batch processing of large employee bases
5. **Security**: Encryption for sensitive data, role-based access controls

## Estimated Effort

Based on the gaps identified, implementing the complete 49-point payroll system would require:
- 8-10 weeks of development effort
- 2-3 developers
- 1 QA engineer
- 1 business analyst for requirements validation

## Conclusion

The current payroll system provides a solid foundation with basic payroll generation, approval workflows, and payment processing. However, to meet the complete 49-point requirements as specified by the user, significant enhancements are needed in salary structure management, approval workflows, attendance/leave integration, compensation management, tax/statutory calculations, validation processes, payment reconciliation, payslip generation, and reporting capabilities.

The system is designed with extensibility in mind, featuring modular TRPC routers and a normalized database schema that can accommodate these enhancements without major architectural changes.