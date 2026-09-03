import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { customers } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

// Context type
export type TRPCContext = {
	user: {
		id: string;
		name: string;
		email: string;
		role: string;
		branchId?: string | null;
		isSuperadmin?: boolean;
		isActive?: boolean;
		permissions?: string[];
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
	return next({ ctx: { ...ctx, user: ctx.user } });
});

export const roleProcedure = (allowedRoles: string[]) => {
	return t.procedure.use(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
		}

		// Superadmins bypass every role gate. `super_admin` is not a value in the
		// user.role enum — it is the `is_superadmin` flag on the user record — so
		// role-string matching alone would wrongly reject a superadmin.
		if (!ctx.user.isSuperadmin && !allowedRoles.includes(ctx.user.role)) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}

		return next({ ctx: { ...ctx, user: ctx.user } });
	});
};

export const customerProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	const customerList = await ctx.db
		.select()
		.from(customers)
		.where(eq(customers.email, ctx.user.email))
		.limit(1);

	const customer = customerList[0];
	if (!customer) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No customer account linked to this user.",
		});
	}

	return next({ ctx: { ...ctx, user: ctx.user, customer } });
});

export const permissionProcedure = (permission: string) => {
	return t.procedure.use(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}

		if (!ctx.user.isSuperadmin && !ctx.user.permissions?.includes(permission)) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}

		return next({ ctx: { ...ctx, user: ctx.user } });
	});
};

export const superadminProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user || !ctx.user.isSuperadmin) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});

export const requirePermission = (permission: string) =>
	t.middleware(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		if (!ctx.user.isSuperadmin && !ctx.user.permissions?.includes(permission)) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}
		return next({ ctx });
	});
