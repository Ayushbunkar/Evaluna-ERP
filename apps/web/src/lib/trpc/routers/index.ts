import { router } from "../init";
import { clientSettingsRouter } from "./client-settings";
import { permissionsRouter } from "./permissions";
import { settingsRouter } from "./settings";
import { salaryRouter } from "./salary";
import { payslipRouter } from "./payslip";
import { paymentBatchRouter } from "./payment-batch";
import { payrollVarianceRouter } from "./payroll-variance";
import { payrollLockRouter } from "./payroll-lock";
import { payrollEnhancedRouter } from "./payroll-enhanced";

export const appRouter = router({
	settings: settingsRouter,
	clientSettings: clientSettingsRouter,
	permissions: permissionsRouter,
	salary: salaryRouter,
	payslip: payslipRouter,
	paymentBatch: paymentBatchRouter,
	payrollVariance: payrollVarianceRouter,
	payrollLock: payrollLockRouter,
	payrollEnhanced: payrollEnhancedRouter,
});

export type AppRouter = typeof appRouter;
