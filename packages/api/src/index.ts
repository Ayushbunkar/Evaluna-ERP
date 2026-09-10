import type { Role } from "@evaluna/db";
import { customers } from "@evaluna/db/schema";
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

		let userRole = (ctx.user.primaryRole?.name ||
			(ctx.user as any).role) as string;
		if (userRole) {
			const lowerRole = userRole.toLowerCase();
			if (
				lowerRole === "salesperson" ||
				lowerRole === "sales" ||
				lowerRole === "sales_person"
			) {
				userRole = "sales_person";
			}
		}

		// Check if the user's primary role is one of the required roles
		if (!userRole || !requiredRoles.includes(userRole as any)) {
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

export const customerProcedure = protectedProcedure.use(
	async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
		}

		let customer = await ctx.db.query.customers.findFirst({
			where: (c: any, { eq, and, or }: any) =>
				and(
					or(
						eq(c.user_uid, ctx.user.id),
						ctx.user.email ? eq(c.email, ctx.user.email) : undefined,
					),
					eq(c.is_deleted, false),
				),
		});

		if (!customer && ctx.user.email) {
			const roleName = (
				(ctx.user as any).role ||
				ctx.user.primaryRole?.name ||
				""
			).toLowerCase();
			if (
				!roleName ||
				roleName === "customer" ||
				roleName === "customer representative" ||
				roleName.includes("customer")
			) {
				const customerCode = `CUST-${Date.now()}`;
				try {
					const [newCustomer] = await ctx.db
						.insert(customers)
						.values({
							name: ctx.user.name || "Customer",
							email: ctx.user.email,
							user_uid: ctx.user.id,
							customer_code: customerCode,
							status: "active",
							is_deleted: false,
							branch_id: ctx.user.branchId ?? 1,
						})
						.onConflictDoNothing()
						.returning();

					customer =
						newCustomer ||
						(await ctx.db.query.customers.findFirst({
							where: (c: any, { eq }: any) => eq(c.email, ctx.user.email),
						}));
				} catch (_err) {
					customer = await ctx.db.query.customers.findFirst({
						where: (c: any, { eq }: any) => eq(c.email, ctx.user.email),
					});
				}
			}
		}

		if (!customer) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "No customer account is linked to this login.",
			});
		}

		return next({ ctx: { ...ctx, user: ctx.user, customer } });
	},
);
