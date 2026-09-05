import { type Role } from "@evaluna/db";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

// Context type

export type StaffRecord = {
	id: number;
	name: string;
	staffCode: string;
	branchId?: number | null;
	// Add other necessary staff fields here as we discover them
};

export type RoleContext = {
	name: string;
	dashboardRoute: string; // The canonical dashboard route for this role
	permissions: string[]; // Aggregated permissions for the role
};

export type TRPCContext = {
	user: {
		id: string;
		name: string;
		email: string;
		status: "PENDING" | "ACTIVE" | "INACTIVE" | "LOCKED" | "SUSPENDED";
		forcePasswordChange: boolean;
		isSuperadmin: boolean;
		branchId?: number | null;
		warehouseId?: number | null;
		staff: StaffRecord | null; // Linked employee record
		primaryRole: RoleContext; // The user's primary/active role context
		roles: RoleContext[]; // All roles the user belongs to
		permissions: string[]; // Aggregated, unique permissions
		canonicalDashboardRoute: string; // The route the user should be redirected to on login
	} | null;
	db: any;
	realtimeService?: any;
};

const t = initTRPC
	.context<TRPCContext>()
	.meta<Record<string, unknown>>()
	.create({
		transformer: superjson,
	});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
	}

	// Enforce force password change on all protected routes (Requirement 13)
	if (ctx.user.forcePasswordChange) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "PASSWORD_CHANGE_REQUIRED",
		});
	}

	return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * A protected procedure that checks if the user's primary role is within the list of required roles.
 */
export const roleProcedure = (requiredRoles: Role[]) => {
	return protectedProcedure.use(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		
		// Superadmin bypasses role procedures
		if (ctx.user.isSuperadmin) {
			return next({ ctx: { ...ctx, user: ctx.user } });
		}

		const userRole = (ctx.user.primaryRole?.name || (ctx.user as any).role) as Role;

		// Check if the user's primary role is one of the required roles
		if (!userRole || !requiredRoles.includes(userRole)) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}

		return next({ ctx: { ...ctx, user: ctx.user } });
	});
};

/**
 * A protected procedure that allows a password change mutation even if
 * `forcePasswordChange` is true. Used for the actual password update endpoint.
 */
export const forcePasswordChangeProcedure = t.procedure.use(
	async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
		}
		return next({ ctx: { ...ctx, user: ctx.user } });
	},
);

export const permissionProcedure = (permission: string) => {
	return protectedProcedure.use(async ({ ctx, next }) => {
		if (!ctx.user) {
			// Should be unreachable due to protectedProcedure, but for safety
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}

		if (!ctx.user.isSuperadmin && !ctx.user.permissions.includes(permission)) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}

		return next({ ctx: { ...ctx, user: ctx.user } });
	});
};

export const superadminProcedure = permissionProcedure("admin.super.access");

export const requirePermission = (permission: string) =>
	t.middleware(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		if (!ctx.user.isSuperadmin && !ctx.user.permissions.includes(permission)) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}
		return next({ ctx });
	});

export const customerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	const userRole = ctx.user.primaryRole?.name;
	if (userRole !== "customer" && !ctx.user.isSuperadmin) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});
