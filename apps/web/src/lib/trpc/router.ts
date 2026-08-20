import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router } from "./init";
import { accountingRouter } from "./routers/accounting";
import { approvalsRouter } from "./routers/approvals";
import { attendanceRouter } from "./routers/attendance";
import { auditRouter } from "./routers/audit";
import { auditFindingsRouter } from "./routers/audit-findings";
import { auditTasksRouter } from "./routers/audit-tasks";
import { auditorRouter } from "./routers/auditor";
import { backupsRouter } from "./routers/backups";
import { bankAccountsRouter } from "./routers/bank-accounts";
import { billingRouter } from "./routers/billing";
import { branchesRouter } from "./routers/branches";
import { cashbookRouter } from "./routers/cashbook";
import { categoriesRouter } from "./routers/categories";
import { chatbotRouter } from "./routers/chatbot";
import { checkerRouter } from "./routers/checker";
import { clientSettingsRouter } from "./routers/client-settings";
import { customerRouter } from "./routers/customer";
import { customersRouter } from "./routers/customers";
import { dashboardRouter } from "./routers/dashboard";
import { deliveryRouter } from "./routers/delivery";
import { driverRouter } from "./routers/driver";
import { employeeExpensesRouter } from "./routers/employee-expenses";
import { expensesRouter } from "./routers/expenses";
import { financeRouter } from "./routers/finance";
import { hrRouter } from "./routers/hr";
import { hrmsRouter } from "./routers/hrms";
import { importsRouter } from "./routers/imports";
import { inventoryRouter } from "./routers/inventory";
import { loyaltyRouter } from "./routers/loyalty";
import { marketingRouter } from "./routers/marketing";
import { masterDataRouter } from "./routers/master-data";
import { monitoringRouter } from "./routers/monitoring";
import { notificationsRouter } from "./routers/notifications";
import { ordersRouter } from "./routers/orders";
import { packerRouter } from "./routers/packer";
import { paymentMethodsRouter } from "./routers/payment-methods";
import { paymentsRouter } from "./routers/payments";
import { placementRouter } from "./routers/placement";
import { priceAuditRouter } from "./routers/price-audit";
import { payrollRouter } from "./routers/payroll";
import { permissionsRouter } from "./routers/permissions";
import { pickerRouter } from "./routers/picker";
import { pickingRouter } from "./routers/picking";
import { posRouter } from "./routers/pos";
import { productsRouter } from "./routers/products";
import { purchaseReturnsRouter } from "./routers/purchase-returns";
import { purchasesRouter } from "./routers/purchases";
import { receivingInspectionsRouter } from "./routers/receiving-inspections";
import { routeAuditRouter } from "./routers/route-audit";
import { putterRouter } from "./routers/putter";
import { reportsRouter } from "./routers/reports";
import { salesReturnsRouter } from "./routers/sales-returns";
import { schemesRouter } from "./routers/schemes";
import { settingsRouter } from "./routers/settings";
import { staffRouter } from "./routers/staff";
import { superadminRouter } from "./routers/superadmin";
import { supplierRouter } from "./routers/supplier";
import { suppliersRouter } from "./routers/suppliers";
import { transactionsRouter } from "./routers/transactions";
import { transfersRouter } from "./routers/transfers";
import { upcRouter } from "./routers/upc";
import { vehiclesRouter } from "./routers/vehicles";
import { warehouseRouter } from "./routers/warehouse";

export const appRouter = router({
	chatbot: chatbotRouter,
	notifications: notificationsRouter,
	products: productsRouter,
	customers: customersRouter,
	orders: ordersRouter,
	transactions: transactionsRouter,
	paymentMethods: paymentMethodsRouter,
	dashboard: dashboardRouter,
	suppliers: suppliersRouter,
	warehouse: warehouseRouter,
	audit: auditRouter,
	pos: posRouter,
	cashbook: cashbookRouter,
	reports: reportsRouter,
	salesReturns: salesReturnsRouter,
	branches: branchesRouter,
	transfers: transfersRouter,
	settings: settingsRouter,
	staff: staffRouter,
	attendance: attendanceRouter,
	payroll: payrollRouter,
	permissions: permissionsRouter,
	loyalty: loyaltyRouter,
	marketing: marketingRouter,
	backups: backupsRouter,
	accounting: accountingRouter,
	imports: importsRouter,
	monitoring: monitoringRouter,
	inventory: inventoryRouter,
	categories: categoriesRouter,
	purchases: purchasesRouter,
	purchaseReturns: purchaseReturnsRouter,
	superadmin: superadminRouter,
	delivery: deliveryRouter,
	finance: financeRouter,
	billing: billingRouter,
	driver: driverRouter,
	auditor: auditorRouter,
	upc: upcRouter,
	auditFindings: auditFindingsRouter,
	auditTasks: auditTasksRouter,
	receivingInspections: receivingInspectionsRouter,
	placement: placementRouter,
	priceAudit: priceAuditRouter,
	routeAudit: routeAuditRouter,
	picker: pickerRouter,
	packer: packerRouter,
	checker: checkerRouter,
	putter: putterRouter,
	hr: hrRouter,
	hrms: hrmsRouter,
	customer: customerRouter,
	supplier: supplierRouter,
	schemes: schemesRouter,
	approvals: approvalsRouter,
	picking: pickingRouter,
	clientSettings: clientSettingsRouter,
	expenses: expensesRouter,
	payments: paymentsRouter,
	bankAccounts: bankAccountsRouter,
	employeeExpenses: employeeExpensesRouter,
	vehicles: vehiclesRouter,
	masterData: masterDataRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
