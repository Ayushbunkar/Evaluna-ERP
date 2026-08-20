import type * as schema from "@evaluna/db/schema";
import { initTRPC, TRPCError } from "@trpc/server";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import superjson from "superjson";
import type { OpenApiMeta } from "trpc-to-openapi";

export type Role = string;
// Permissions are stored in JSONB in roles.permissions, typically key-value. We use a flat string array here for checking.
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
// Resolves the logged-in user to their own `customers` row (linked by email),
// and attaches it as `ctx.customer`. All customer-facing data MUST be scoped to
// `ctx.customer.id` — this is the server-side enforcement of tenant isolation
// (no reliance on frontend hiding). Throws FORBIDDEN if the login has no linked
// customer record.
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
				message: `Missing required permission: ${requiredPermission}`,
			});
		}
		return next({ ctx: { ...ctx, user: ctx.user } });
	});
};

// Use this to chain on existing procedures
// example: protectedProcedure.use(requirePermission('Inventory:Read'))
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
			message: `Role not permitted. Requires one of: ${roles.join(", ")}`,
		});
	});
};

export const roleProcedure = (roles: Role[]) =>
	protectedProcedure.use(requireRole(roles));

export const middleware = t.middleware;
export type { OpenApiMeta };
