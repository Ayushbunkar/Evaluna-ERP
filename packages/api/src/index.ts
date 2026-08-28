import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

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

const t = initTRPC.context<TRPCContext>().meta<Record<string, unknown>>().create({
	transformer: superjson,
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});

export const roleProcedure = (role: string) =>
	t.procedure.use(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		if (ctx.user.role !== role) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}
		return next({ ctx });
	});

export const customerProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});

export const permissionProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});

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
		if (!ctx.user.permissions?.includes(permission)) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}
		return next({ ctx });
	});