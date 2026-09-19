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
import { getPermissionsForRole, normalizeRole } from "@/lib/permissions";

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

export const createTRPCContext = async (opts?: {
	req?: Request;
}): Promise<TRPCContext> => {
	const user = await getAuthUser(opts?.req);

	const rawRoleName = (user?.primaryRole?.name ||
		(user as any)?.role ||
		user?.staff?.role ||
		"") as string;

	const resolvedRole = normalizeRole(
		rawRoleName || (user?.isSuperadmin ? "super_admin" : "customer"),
	);

	const standardRolePerms = getPermissionsForRole(resolvedRole as any) as string[];
	const userPerms =
		user?.permissions && user.permissions.length > 0 ? user.permissions : [];
	const resolvedPermissions = Array.from(
		new Set([...userPerms, ...standardRolePerms]),
	);

	// Transform CachedSession to match TRPCContext user interface
	const baseUser = user
		? {
				id: user.userId,
				name: user.name,
				email: user.email,
				status: user.status,
				forcePasswordChange: user.forcePasswordChange,
				isSuperadmin: user.isSuperadmin,
				branchId: user.branchId ?? user.staff?.branchId ?? null,
				warehouseId: user.warehouseId,
				staff: user.staff
					? {
							...user.staff,
							role: (user.staff as any).role || resolvedRole,
						}
					: null,
				primaryRole: user.primaryRole
					? {
							...user.primaryRole,
							name: resolvedRole,
							permissions: resolvedPermissions,
						}
					: {
							name: user.isSuperadmin ? "super_admin" : resolvedRole,
							dashboardRoute: user.canonicalDashboardRoute ?? "/customer",
							permissions: resolvedPermissions,
						},
				roles: user.roles ?? [],
				permissions: resolvedPermissions,
				canonicalDashboardRoute: user.canonicalDashboardRoute ?? "/customer",
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
