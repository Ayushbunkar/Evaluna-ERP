import {
	createCallerFactory,
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

	// Transform CachedSession to match BaseUser interface
	const baseUser = user
		? {
				id: user.userId,
				name: user.name,
				email: user.email,
				role: user.role,
				branchId: user.branchId,
				isSuperadmin: user.isSuperadmin,
				isActive: user.isActive,
				permissions: user.permissions,
			}
		: null;

    if (!baseUser) {
        console.error("[TRPC] createTRPCContext user is NULL! getAuthUser returned null");
    }

	return { user: baseUser, db: db as any };
};
