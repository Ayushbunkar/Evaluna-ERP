import { router } from "../init";
import { accountingRouter } from "./accounting";
import { adminRouter } from "./admin";
import { approvalsRouter } from "./approvals";
import { attendanceRouter } from "./attendance";
import { auditFindingsRouter } from "./audit-findings";
import { auditTasksRouter } from "./audit-tasks";
import { auditRouter } from "./audit";
import { auditorRouter } from "./auditor";
import { backupsRouter } from "./backups";
import { bankAccountsRouter } from "./bank-accounts";
import { barcodesRouter } from "./barcodes";
import { batchesRouter } from "./batches";
import { billerRouter } from "./biller";
import { billingRouter } from "./billing";
import { branchesRouter } from "./branches";
import { cashbookRouter } from "./cashbook";
import { categoriesRouter } from "./categories";
import { chatbotRouter } from "./chatbot";
import { checkerRouter } from "./checker";
import { clientSettingsRouter } from "./client-settings";
import { customerRouter } from "./customer";
import { customersRouter } from "./customers";
import { dashboardRouter } from "./dashboard";
import { deliveryRouter } from "./delivery";
import { driverRouter } from "./driver";
import { employeeExpensesRouter } from "./employee-expenses";
import { expensesRouter } from "./expenses";
import { financeRouter } from "./finance";
import { hrRouter } from "./hr";
import { hrmsRouter } from "./hrms";
import { importsRouter } from "./imports";
import { inventoryRouter } from "./inventory";
import { loyaltyRouter } from "./loyalty";
import { marketingRouter } from "./marketing";
import { masterDataRouter } from "./master-data";
import { monitoringRouter } from "./monitoring";
import { notificationsRouter } from "./notifications";
import { ordersRouter } from "./orders";
import { packerRouter } from "./packer";
import { paymentBatchRouter } from "./payment-batch";
import { paymentMethodsRouter } from "./payment-methods";
import { paymentsRouter } from "./payments";
import { payrollEnhancedRouter } from "./payroll-enhanced";
import { payrollLockRouter } from "./payroll-lock";
import { payrollVarianceRouter } from "./payroll-variance";
import { payrollRouter } from "./payroll";
import { payslipRouter } from "./payslip";
import { permissionsRouter } from "./permissions";
import { pickerRouter } from "./picker";
import { pickingRouter } from "./picking";
import { placementRouter } from "./placement";
import { posRouter } from "./pos";
import { priceAuditRouter } from "./price-audit";
import { productsRouter } from "./products";
import { purchaseReturnsRouter } from "./purchase-returns";
import { purchasesRouter } from "./purchases";
import { putterRouter } from "./putter";
import { receivingInspectionsRouter } from "./receiving-inspections";
import { reportsRouter } from "./reports";
import { routeAuditRouter } from "./route-audit";
import { salaryRouter } from "./salary";
import { salesReturnsRouter } from "./sales-returns";
import { schemesRouter } from "./schemes";
import { settingsRouter } from "./settings";
import { staffRouter } from "./staff";
import { superadminRouter } from "./superadmin";
import { supplierRouter } from "./supplier";
import { suppliersRouter } from "./suppliers";
import { transactionsRouter } from "./transactions";
import { transfersRouter } from "./transfers";
import { upcRouter } from "./upc";
import { vehiclesRouter } from "./vehicles";
import { warehouseRouter } from "./warehouse";

export const appRouter = router({
	accounting: accountingRouter,
	admin: adminRouter,
	approvals: approvalsRouter,
	attendance: attendanceRouter,
	auditFindings: auditFindingsRouter,
	auditTasks: auditTasksRouter,
	audit: auditRouter,
	auditor: auditorRouter,
	backups: backupsRouter,
	bankAccounts: bankAccountsRouter,
	barcodes: barcodesRouter,
	batches: batchesRouter,
	biller: billerRouter,
	billing: billingRouter,
	branches: branchesRouter,
	cashbook: cashbookRouter,
	categories: categoriesRouter,
	chatbot: chatbotRouter,
	checker: checkerRouter,
	clientSettings: clientSettingsRouter,
	customer: customerRouter,
	customers: customersRouter,
	dashboard: dashboardRouter,
	delivery: deliveryRouter,
	driver: driverRouter,
	employeeExpenses: employeeExpensesRouter,
	expenses: expensesRouter,
	finance: financeRouter,
	hr: hrRouter,
	hrms: hrmsRouter,
	imports: importsRouter,
	inventory: inventoryRouter,
	loyalty: loyaltyRouter,
	marketing: marketingRouter,
	masterData: masterDataRouter,
	monitoring: monitoringRouter,
	notifications: notificationsRouter,
	orders: ordersRouter,
	packer: packerRouter,
	paymentBatch: paymentBatchRouter,
	paymentMethods: paymentMethodsRouter,
	payments: paymentsRouter,
	payrollEnhanced: payrollEnhancedRouter,
	payrollLock: payrollLockRouter,
	payrollVariance: payrollVarianceRouter,
	payroll: payrollRouter,
	payslip: payslipRouter,
	permissions: permissionsRouter,
	picker: pickerRouter,
	picking: pickingRouter,
	placement: placementRouter,
	pos: posRouter,
	priceAudit: priceAuditRouter,
	products: productsRouter,
	purchaseReturns: purchaseReturnsRouter,
	purchases: purchasesRouter,
	putter: putterRouter,
	receivingInspections: receivingInspectionsRouter,
	reports: reportsRouter,
	routeAudit: routeAuditRouter,
	salary: salaryRouter,
	salesReturns: salesReturnsRouter,
	schemes: schemesRouter,
	settings: settingsRouter,
	staff: staffRouter,
	superadmin: superadminRouter,
	supplier: supplierRouter,
	suppliers: suppliersRouter,
	transactions: transactionsRouter,
	transfers: transfersRouter,
	upc: upcRouter,
	vehicles: vehiclesRouter,
	warehouse: warehouseRouter,
});

export type AppRouter = typeof appRouter;
