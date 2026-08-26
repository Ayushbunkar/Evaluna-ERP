import { router } from '../init;
import { __tests__Router } from './__tests__';
import { accountingRouter } from './accounting';
import { adminRouter } from './admin';
import { approvalsRouter } from './approvals';
import { attendanceRouter } from './attendance';
import { audit-findingsRouter } from './audit-findings';
import { audit-tasksRouter } from './audit-tasks';
import { auditRouter } from './audit';
import { auditorRouter } from './auditor';
import { backupsRouter } from './backups';
import { bank-accountsRouter } from './bank-accounts';
import { barcodesRouter } from './barcodes';
import { batchesRouter } from './batches';
import { billerRouter } from './biller';
import { billingRouter } from './billing';
import { branchesRouter } from './branches';
import { cashbookRouter } from './cashbook';
import { categoriesRouter } from './categories';
import { chatbotRouter } from './chatbot';
import { checkerRouter } from './checker';
import { client-settingsRouter } from './client-settings';
import { customerRouter } from './customer';
import { customersRouter } from './customers';
import { dashboardRouter } from './dashboard';
import { deliveryRouter } from './delivery';
import { driverRouter } from './driver';
import { employee-expensesRouter } from './employee-expenses';
import { expensesRouter } from './expenses';
import { financeRouter } from './finance';
import { hrRouter } from './hr';
import { hrmsRouter } from './hrms';
import { importsRouter } from './imports';
import { inventoryRouter } from './inventory';
import { loyaltyRouter } from './loyalty';
import { marketingRouter } from './marketing';
import { master-dataRouter } from './master-data';
import { monitoringRouter } from './monitoring';
import { notificationsRouter } from './notifications';
import { ordersRouter } from './orders';
import { packerRouter } from './packer';
import { payment-batchRouter } from './payment-batch';
import { payment-methodsRouter } from './payment-methods';
import { paymentsRouter } from './payments';
import { payroll-enhancedRouter } from './payroll-enhanced';
import { payroll-lockRouter } from './payroll-lock';
import { payroll-varianceRouter } from './payroll-variance';
import { payrollRouter } from './payroll';
import { payroll.tsRouter } from './payroll.ts';
import { payslipRouter } from './payslip';
import { permissionsRouter } from './permissions';
import { pickerRouter } from './picker';
import { pickingRouter } from './picking';
import { placementRouter } from './placement';
import { posRouter } from './pos';
import { price-auditRouter } from './price-audit';
import { productsRouter } from './products';
import { purchase-returnsRouter } from './purchase-returns';
import { purchasesRouter } from './purchases';
import { putterRouter } from './putter';
import { receiving-inspectionsRouter } from './receiving-inspections';
import { reportsRouter } from './reports';
import { route-auditRouter } from './route-audit';
import { salaryRouter } from './salary';
import { sales-returnsRouter } from './sales-returns';
import { schemesRouter } from './schemes';
import { settingsRouter } from './settings';
import { staffRouter } from './staff';
import { superadminRouter } from './superadmin';
import { supplierRouter } from './supplier';
import { suppliersRouter } from './suppliers';
import { transactionsRouter } from './transactions';
import { transfersRouter } from './transfers';
import { upcRouter } from './upc';
import { vehiclesRouter } from './vehicles';
import { warehouseRouter } from './warehouse';

export const appRouter = router({
	__tests__ : __tests__Router,
	accounting : accountingRouter,
	admin : adminRouter,
	approvals : approvalsRouter,
	attendance : attendanceRouter,
	audit-findings : audit-findingsRouter,
	audit-tasks : audit-tasksRouter,
	audit : auditRouter,
	auditor : auditorRouter,
	backups : backupsRouter,
	bank-accounts : bank-accountsRouter,
	barcodes : barcodesRouter,
	batches : batchesRouter,
	biller : billerRouter,
	billing : billingRouter,
	branches : branchesRouter,
	cashbook : cashbookRouter,
	categories : categoriesRouter,
	chatbot : chatbotRouter,
	checker : checkerRouter,
	client-settings : client-settingsRouter,
	customer : customerRouter,
	customers : customersRouter,
	dashboard : dashboardRouter,
	delivery : deliveryRouter,
	driver : driverRouter,
	employee-expenses : employee-expensesRouter,
	expenses : expensesRouter,
	finance : financeRouter,
	hr : hrRouter,
	hrms : hrmsRouter,
	imports : importsRouter,
	inventory : inventoryRouter,
	loyalty : loyaltyRouter,
	marketing : marketingRouter,
	master-data : master-dataRouter,
	monitoring : monitoringRouter,
	notifications : notificationsRouter,
	orders : ordersRouter,
	packer : packerRouter,
	payment-batch : payment-batchRouter,
	payment-methods : payment-methodsRouter,
	payments : paymentsRouter,
	payroll-enhanced : payroll-enhancedRouter,
	payroll-lock : payroll-lockRouter,
	payroll-variance : payroll-varianceRouter,
	payroll : payrollRouter,
	payroll.ts : payroll.tsRouter,
	payslip : payslipRouter,
	permissions : permissionsRouter,
	picker : pickerRouter,
	picking : pickingRouter,
	placement : placementRouter,
	pos : posRouter,
	price-audit : price-auditRouter,
	products : productsRouter,
	purchase-returns : purchase-returnsRouter,
	purchases : purchasesRouter,
	putter : putterRouter,
	receiving-inspections : receiving-inspectionsRouter,
	reports : reportsRouter,
	route-audit : route-auditRouter,
	salary : salaryRouter,
	sales-returns : sales-returnsRouter,
	schemes : schemesRouter,
	settings : settingsRouter,
	staff : staffRouter,
	superadmin : superadminRouter,
	supplier : supplierRouter,
	suppliers : suppliersRouter,
	transactions : transactionsRouter,
	transfers : transfersRouter,
	upc : upcRouter,
	vehicles : vehiclesRouter,
	warehouse : warehouseRouter,
});

export type AppRouter = typeof appRouter;
