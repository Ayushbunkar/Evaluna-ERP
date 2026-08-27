import type * as schema from "@evaluna/db/schema";
import { initTRPC, TRPCError } from "@trpc/server";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import superjson from "superjson";
import type { OpenApiMeta } from "trpc-to-openapi";

export type Role = string;
export type Permission = string;

export interface BaseUser {
	id: string;
	name: string;
	email: string;
	role: Role;
	branchId: number | null;
	isSuperadmin: boolean;
	isActive: boolean;
	permissions: Permission[];
}

export interface TRPCContext {
	user: BaseUser | null;
	db: NodePgDatabase<typeof schema>;
}

const t = initTRPC.context<TRPCContext>().meta<OpenApiMeta>().create({
	transformer: superjson,
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

// Base protected procedure ensures user is logged in
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
	}
	if (!ctx.user.isActive) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Account suspended" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});

// Customer self-service procedure.
export const customerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	const customer = await ctx.db.query.customers.findFirst({
		where: (c: any, { eq, and }: any) =>
			and(eq(c.email, ctx.user.email), eq(c.is_deleted, false)),
	});
	if (!customer) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No customer account is linked to this login.",
		});
	}
	return next({ ctx: { ...ctx, user: ctx.user, customer } });
});

export const superadminProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
	}
	if (!ctx.user.isSuperadmin) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Super admin access required",
		});
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});

// Middleware to enforce specific permissions
export const requirePermission = (requiredPermission: Permission) => {
	return t.middleware(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
		}
		if (ctx.user.isSuperadmin) {
			return next({ ctx: { ...ctx, user: ctx.user } });
		}
		if (!ctx.user.permissions?.includes(requiredPermission)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Missing required permission: ",
			});
		}
		return next({ ctx: { ...ctx, user: ctx.user } });
	});
};

export const permissionProcedure = (permission: Permission) =>
	protectedProcedure.use(requirePermission(permission));

// Middleware to enforce specific roles
export const requireRole = (roles: Role[]) => {
	return t.middleware(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
		}
		if (ctx.user.isSuperadmin || roles.includes(ctx.user.role)) {
			return next({ ctx: { ...ctx, user: ctx.user } });
		}
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Role not permitted. Requires one of: ",
		});
	});
};

export const roleProcedure = (roles: Role[]) =>
	protectedProcedure.use(requireRole(roles));

export const middleware = t.middleware;
export type { OpenApiMeta };


export const appRouter = router({
	"__tests__" : __tests__Router,
	accounting : accountingRouter,
	admin : adminRouter,
	approvals : approvalsRouter,
	attendance : attendanceRouter,
	"audit-findings" : auditFindingsRouter,
	"audit-tasks" : auditTasksRouter,
	"audit" : auditRouter,
	"auditor" : auditorRouter,
	"backups" : backupsRouter,
	"bank-accounts" : bankAccountsRouter,
	"barcodes" : barcodesRouter,
	"batches" : batchesRouter,
	"biller" : billerRouter,
	"billing" : billingRouter,
	"branches" : branchesRouter,
	"cashbook" : cashbookRouter,
	"categories" : categoriesRouter,
	"chatbot" : chatbotRouter,
	"checker" : checkerRouter,
	"client-settings" : clientSettingsRouter,
	"customer" : customerRouter,
	"customers" : customersRouter,
	"dashboard" : dashboardRouter,
	"delivery" : deliveryRouter,
	"driver" : driverRouter,
	"employee-expenses" : employeeExpensesRouter,
	"expenses" : expensesRouter,
	"finance" : financeRouter,
	"hr" : hrRouter,
	"hrms" : hrmsRouter,
	"imports" : importsRouter,
	"inventory" : inventoryRouter,
	"loyalty" : loyaltyRouter,
	"marketing" : marketingRouter,
	"master-data" : masterDataRouter,
	"monitoring" : monitoringRouter,
	"notifications" : notificationsRouter,
	"orders" : ordersRouter,
	"packer" : packerRouter,
	"payment-batch" : paymentBatchRouter,
	"payment-methods" : paymentMethodsRouter,
	"payments" : paymentsRouter,
	"payroll-enhanced" : payrollEnhancedRouter,
	"payroll-lock" : payrollLockRouter,
	"payroll-variance" : payrollVarianceRouter,
	"payroll" : payrollRouter,
	"payslip" : payslipRouter,
	"permissions" : permissionsRouter,
	"picker" : pickerRouter,
	"picking" : pickingRouter,
	"placement" : placementRouter,
	"pos" : posRouter,
	"price-audit" : priceAuditRouter,
	"products" : productsRouter,
	"purchase-returns" : purchaseReturnsRouter,
	"purchases" : purchasesRouter,
	"putter" : putterRouter,
	"receiving-inspections" : receivingInspectionsRouter,
	"reports" : reportsRouter,
	"route-audit" : routeAuditRouter,
	"salary" : salaryRouter,
	"sales-returns" : salesReturnsRouter,
	"schemes" : schemesRouter,
	"settings" : settingsRouter,
	"staff" : staffRouter,
	"superadmin" : superadminRouter,
	"supplier" : supplierRouter,
	"suppliers" : suppliersRouter,
	"transactions" : transactionsRouter,
	"transfers" : transfersRouter,
	"upc" : upcRouter,
	"vehicles" : vehiclesRouter,
	"warehouse" : warehouseRouter
});

export type AppRouter = typeof appRouter;

