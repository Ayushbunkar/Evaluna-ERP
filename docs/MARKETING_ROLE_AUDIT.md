# ROLE: Marketing

## A. What this employee currently does
Based on code analysis, Marketing personnel in the Evaluna ERP system are responsible for:
- Creating and managing discount coupons and promotional offers
- Designing and executing marketing campaigns across multiple channels (WhatsApp, SMS, email, in-app)
- Managing customer loyalty programs and reward points
- Tracking campaign performance and customer engagement
- Managing customer opt-in/out for marketing communications
- Analyzing marketing effectiveness and ROI

Evidence from `apps/web/src/lib/trpc/routers/marketing.ts` shows procedures for:
- Coupon management: listCoupons, createCoupon, updateCoupon, validateCoupon
- Campaign management: listCampaigns, estimateAudience, createCampaign, launchCampaign
- The validateCoupon procedure handles coupon validation logic including expiration, usage limits, and minimum order requirements
- The launchCampaign procedure builds target audiences and seeds the campaignAudiences table for delivery

## B. Dashboard
* dashboard route: /admin/marketing (note: marketing dashboard is located under admin route)
* page/component: `apps/web/src/app/admin/marketing/page.tsx` (MarketingDashboard component)
* navigation: Accessible via admin dashboard when user has marketing or admin role
* widgets: 
  - KPI cards for active campaigns, coupons redeemed, loyalty points given, new subscribers
* cards: Card components for each KPI section
* tables: None on main dashboard (shown as "Marketing activity chart/list will be rendered here.")
* charts: None implemented on main dashboard (placeholder for future implementation)
* actions: 
  - Manage Coupons (links to /marketing/coupons)
  - Loyalty Rewards (links to /marketing/rewards)
* filters: None visible on dashboard (likely available in subpages)
* reports: Access to marketing reports via presumably undefined reporting structure

## C. Exact permissions
List of permissions actually implemented for Marketing role (level 4):
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
  - warehouse.read
  - notifications.read
  - imports.read
  - loyalty.read
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
  - warehouse.write
  - notifications.write
  - imports.write
  - loyalty.write
* Edit: Same as Create permissions (write permission covers both create and update)
* Delete: 
  - None (Marketing role does not have delete permissions for any domain)
* Approve:
  - None (Marketing role does not have explicit approve permissions)
* Reject: Not explicitly implemented as separate permission
* Assign: Not explicitly implemented as separate permission
* Pay: Not applicable to marketing role
* Refund: Not applicable to marketing role
* Reconcile: Not applicable to marketing role
* Dispatch: Not applicable to marketing role
* Deliver: Not applicable to marketing role
* Adjust inventory: inventory.write permission covers this
* Modify customer: customers.write permission
* Modify supplier: None (requires manager level)
* Modify employee: staff.write permission
* Modify payroll: None (requires manager level)
* Modify settings: None (requires admin level)

Note: Marketing role inherits all permissions from levels 5-12 (putter, picker, driver, biller, sales_person, delivery_manager, delivery_boy, customer) due to the hierarchical permission system.

## D. Backend connection
For every important dashboard action identify:
**UI → Query/Mutation → Router → Service → Database → Side effect**

1. **Marketing Dashboard KPIs**
   - UI: MarketingDashboard component calls trpc.marketing.getMetrics (note: this procedure does not exist in the current marketing router)
   - Query: Would be in marketing.getMetrics if it existed
   - Router: Would be in marketingRouter if getMetrics existed
   - Service: N/A (procedure missing)
   - Database: N/A (procedure missing)
   - Side effect: N/A (procedure missing)

2. **Coupon Listing**
   - UI: Accessible via /marketing/coupons route
   - Query: marketing.listCoupons query in `apps/web/src/lib/trpc/routers/marketing.ts` lines 14-16
   - Router: marketingRouter.listCoupons
   - Service: Direct database query
   - Database: `coupons` table
   - Side effect: Returns list of coupons for display

3. **Coupon Creation**
   - UI: Coupon creation form (location not specified in code)
   - Mutation: marketing.createCoupon mutation in `apps/web/src/lib/trpc/routers/marketing.ts` lines 18-48
   - Router: marketingRouter.createCoupon
   - Service: Database insert operation
   - Database: `coupons` table (insert new record)
   - Side effect: Creates new coupon available for use in campaigns and POS

4. **Coupon Validation**
   - UI: POS or checkout system when coupon code is entered
   - Mutation: marketing.validateCoupon mutation in `apps/web/src/lib/trpc/routers/marketing.ts` lines 90-142
   - Router: marketingRouter.validateCoupon
   - Service: Database query + business logic validation
   - Database: `coupons` table (read coupon details)
   - Side effect: Returns discount amount if coupon is valid, throws error if invalid

5. **Campaign Listing**
   - UI: Accessible via /marketing/campaigns route (assumed)
   - Query: marketing.listCampaigns query in `apps/web/src/lib/trpc/routers/marketing.ts` lines 145-150
   - Router: marketingRouter.listCampaigns
   - Service: Direct database query
   - Database: `campaigns` table
   - Side effect: Returns list of campaigns for display

6. **Campaign Creation**
   - UI: Campaign creation form (location not specified in code)
   - Mutation: marketing.createCampaign mutation in `apps/web/src/lib/trpc/routers/marketing.ts` lines 175-199
   - Router: marketingRouter.createCampaign
   - Service: Database insert operation
   - Database: `campaigns` table (insert new record)
   - Side effect: Creates new campaign ready for launch

7. **Campaign Launch**
   - UI: Launch button on campaign management interface
   - Mutation: marketing.launchCampaign mutation in `apps/web/src/lib/trpc/routers/marketing.ts` lines 201-245
   - Router: marketingRouter.launchCampaign
   - Service: 
     - Database query to get campaign details
     - Database query to find eligible customers based on targeting criteria
     - Database insert to seed campaignAudiences table
   - Database: 
     - `campaigns` table (read)
     - `customers` table (read for targeting)
     - `campaignAudiences` table (insert audience members)
   - Side effect: 
     - Creates audience members for campaign delivery
     - In a real system, would trigger message delivery via WhatsApp/SMS/email/in-app

## E. Database access
List the actual tables/models/entities this role can access:
* coupons (read, write)
* campaigns (read, write)
* campaignAudiences (read, write)
* customers (read)
* loyaltyHistory (read)
* All tables accessible to roles level 5-12 (putter, picker, driver, biller, sales_person, delivery_manager, delivery_boy, customer) including:
  - products (read)
  - purchases (read)
  - suppliers (read)
  - orders (read)
  - orderItems (read)
  - transactions (read)
  - paymentMethods (read)
  - branches (read)
  - stockAdjustments (read)
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
  - notifications (read)
  - settings (read)
  - monitoring (read)
  - branches (read)
  - taxRates (read)
  - companies (read)
  - etc.

Note: Marketing role does NOT have write access to:
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
* Manage inventory levels or product master data
* Create or modify user roles and permissions
* Access delivery management or vehicle tracking systems
* Modify branch manager assignments

## G. Security risks
Identify excessive permissions, missing server checks, IDOR possibilities, or privilege escalation:

1. **Missing getMetrics Procedure**: The marketing dashboard calls `trpc.marketing.getMetrics` but this procedure does not exist in the marketing router, which would cause runtime errors.

2. **Incomplete Coupon Validation**: 
   - The validateCoupon procedure checks basic validity but doesn't verify if the coupon is applicable to the specific products in cart
   - No validation of coupon applicability to customer segments or tiers

3. **Missing Campaign Execution Tracking**: 
   - No procedures to track actual message delivery status (sent, delivered, failed)
   - No integration with actual messaging gateways (Twilio, WhatsApp Business API, etc.)

4. **Potential IDOR in Coupon Operations**: 
   - Coupon update and validation procedures rely on coupon ID or code but don't explicitly verify branch-level scoping
   - A user could potentially access coupons from other branches if not properly filtered

5. **Data Exposure Risks**: 
   - Marketing dashboard exposes loyalty points and campaign metrics that could be sensitive competitive information
   - Customer data access for campaign targeting could inadvertently expose PII if not properly handled

6. **Missing Rate Limiting**: 
   - No visible rate limiting on coupon validation could allow brute-force attacks to discover valid coupon codes

## H. Missing work
Identify capabilities required for the role but currently absent:

1. **Actual Marketing Metrics Dashboard**: 
   - Implement getMetrics procedure in marketingRouter
   - Add tracking for actual campaign performance (impressions, clicks, conversions)
   - Add ROI calculation and reporting

2. **Channel Integration**: 
   - Implement actual integration with WhatsApp Business API, Twilio for SMS, email services (SendGrid/SMTP)
   - Add delivery tracking and reporting for marketing messages

3. **Advanced Audience Targeting**: 
   - Implement more sophisticated targeting options (purchase history, geographic, demographic)
   - Add A/B testing capabilities for campaigns
   - Add customer segmentation based on RFM analysis

4. **Coupon Usage Analytics**: 
   - Track actual coupon redemptions by time, location, customer segment
   - Add fraud detection for coupon abuse
   - Add expiration and usage automation

5. **Loyalty Program Management**: 
   - Implement actual loyalty points accrual and redemption tracking
   - Add tier-based benefits and automatic tier progression
   - Add loyalty program expiration and inactivity handling

6. **Marketing Calendar and Planning**: 
   - Add campaign scheduling and calendar view
   - Add marketing budget tracking and allocation
   - Add campaign approval workflows

7. **Customer Preference Management**: 
   - Implement sophisticated opt-in/out management by channel and topic
   - Add preference center for customers to manage their marketing communications
   - Add GDPR/CCPA compliance features for data privacy

8. **Performance Analytics Dashboard**: 
   - Implement actual charts and graphs on marketing dashboard
   - Add funnel analysis for campaign performance
   - Add cohort analysis for customer lifecycle marketing

9. **Referral Program Management**: 
   - Add referral tracking and reward distribution
   - Add viral coefficient tracking and optimization

10. **Social Media Integration**: 
    - Add social media posting and engagement tracking
    - Add social listening and sentiment analysis capabilities

## I. Current quality
Score:
* Functionality /10: 6 (Core coupon and campaign CRUD operations exist, but key marketing execution and analytics features are missing)
* Authorization /10: 8 (Proper role-based access control via permissions matrix, but missing fine-grained scoping for marketing-specific resources)
* Dashboard /10: 4 (Dashboard exists but shows placeholder content instead of actual metrics due to missing getMetrics procedure)
* Backend integration /10: 5 (Basic CRUD operations work, but integrations with actual marketing channels are missing)
* UX /10: 7 (Well-designed dashboard interface with proper layout and navigation)
* Auditability /10: 5 (Limited audit trails visible for marketing-specific actions)
* Production readiness /10: 4 (Not production-ready due to missing core marketing execution features)

## J. Improvements
List concrete improvements, not generic suggestions:

1. **Implement getMetrics Procedure**: 
   - Add getMetrics procedure to marketingRouter that returns actual marketing performance data
   - Include metrics like active campaigns, coupons redeemed, loyalty points issued/redeemed, conversion rates
   - Ensure data is sourced from actual database tables, not mock data

2. **Build Channel Integrations**: 
   - Integrate with WhatsApp Business API for template messages and session messages
   - Integrate with Twilio or similar for SMS delivery
   - Integrate with email service (SendGrid, SMTP) for email campaigns
   - Add delivery receipt tracking and error handling

3. **Enhance Coupon Functionality**: 
   - Add product-specific coupon applicability rules
   - Implement coupon stacking prevention or enablement based on business rules
   - Add automatic coupon expiration and cleanup jobs

4. **Implement Campaign Execution Tracking**: 
   - Add message delivery status tracking (sent, delivered, failed, opened, clicked)
   - Add bounce handling and complaint processing for email/SMS
   - Add opt-out processing unsubscribe requests

5. **Develop Advanced Targeting Capabilities**: 
   - Add RFM (Recency, Frequency, Monetary) analysis for customer segmentation
   - Implement predictive targeting for cross-sell/up-sell opportunities
   - Add geographic targeting based on customer location data

6. **Create Loyalty Program Engine**: 
   - Implement points accrual rules based on purchase behavior
   - Add tier-based benefits with automatic progression
   - Implement points expiration and redemption options

7. **Add Marketing Calendar and Planning Tools**: 
   - Implement drag-and-drop campaign scheduling
   - Add marketing budget allocation and tracking
   - Add campaign approval workflow with stakeholder notifications

8. **Implement Customer Preference Management**: 
   - Add granular opt-in/out by communication channel (WhatsApp, SMS, Email, App Notification)
   - Add preference center for customers to manage frequency and content types
   - Add consent tracking for regulatory compliance

9. **Build Performance Analytics Dashboard**: 
   - Add actual charts showing campaign performance over time
   - Implement funnel analysis from impressions to conversions
   - Add cohort analysis for customer lifecycle value tracking

10. **Add Referral and Viral Marketing Features**: 
    - Implement referral tracking with unique referral codes
    - Add reward distribution for successful referrals
    - Add viral coefficient measurement and optimization tools

## K. Progress Update
Completed Marketing role audit at $(date). Moving on to Putter role audit.