import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router } from "./init";
import { chatbotRouter } from "./routers/chatbot";
import { productsRouter } from "./routers/products";
import { customersRouter } from "./routers/customers";
import { ordersRouter } from "./routers/orders";
import { transactionsRouter } from "./routers/transactions";
import { paymentMethodsRouter } from "./routers/payment-methods";
import { dashboardRouter } from "./routers/dashboard";
import { suppliersRouter } from "./routers/suppliers";
import { warehouseRouter } from "./routers/warehouse";
import { posRouter } from "./routers/pos";
import { auditRouter } from "./routers/audit";
import { cashbookRouter } from "./routers/cashbook";
import { reportsRouter } from "./routers/reports";
import { branchesRouter } from "./routers/branches";
import { transfersRouter } from "./routers/transfers";
import { settingsRouter } from "./routers/settings";
import { staffRouter } from "./routers/staff";
import { attendanceRouter } from "./routers/attendance";
import { payrollRouter } from "./routers/payroll";
import { permissionsRouter } from "./routers/permissions";
import { loyaltyRouter } from "./routers/loyalty";
import { marketingRouter } from "./routers/marketing";
import { notificationsRouter } from "./routers/notifications";
import { backupsRouter } from "./routers/backups";
import { accountingRouter } from "./routers/accounting";
import { importsRouter } from "./routers/imports";
import { monitoringRouter } from "./routers/monitoring";
import { inventoryRouter } from "./routers/inventory";
import { categoriesRouter } from "./routers/categories";

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
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
