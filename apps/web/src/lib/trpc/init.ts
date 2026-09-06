import {
	createCallerFactory,
	customerProcedure,
	middleware,
	permissionProcedure,
	protectedProcedure,
	publicProcedure,
	requirePermission,
	roleProcedure,
	router,
	superadminProcedure,
	type TRPCContext,
} from "@evaluna/api";
import { getAuthUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export type { TRPCContext };
export {
	createCallerFactory,
	customerProcedure,
	middleware,
	permissionProcedure,
	protectedProcedure,
	publicProcedure,
	requirePermission,
	roleProcedure,
	router,
	superadminProcedure,
};

export const createTRPCContext = async (): Promise<TRPCContext> => {
	const user = await getAuthUser();

	const resolvedRole = user?.primaryRole?.name === "salesperson" 
		? "sales_person" 
		: (user?.primaryRole?.name || (user?.isSuperadmin ? "super_admin" : "admin"));

	// Transform CachedSession to match TRPCContext user interface
	const baseUser = user
		? {
				id: user.userId,
				name: user.name,
				email: user.email,
				status: user.status,
				forcePasswordChange: user.forcePasswordChange,
				isSuperadmin: user.isSuperadmin,
				branchId: user.branchId,
				warehouseId: user.warehouseId,
				staff: user.staff,
				primaryRole: user.primaryRole 
					? {
							...user.primaryRole,
							name: user.primaryRole.name === "salesperson" ? "sales_person" : user.primaryRole.name,
					  }
					: {
							name: user.isSuperadmin ? "super_admin" : "admin",
							dashboardRoute: user.canonicalDashboardRoute ?? "/dashboard",
							permissions: user.permissions ?? [],
					  },
				roles: user.roles ?? [],
				permissions: user.permissions ?? [],
				canonicalDashboardRoute: user.canonicalDashboardRoute ?? "/dashboard",
				role: resolvedRole,
			}
		: null;

	if (!baseUser) {
		console.error(
			"[TRPC] createTRPCContext user is NULL! getAuthUser returned null",
		);
	}

	return { user: baseUser as any, db: db as any };
};
