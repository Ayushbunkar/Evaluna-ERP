import { TRPCError } from "@trpc/server";
import { isAtLeastRole, type Role } from "../../permissions";
import { middleware } from "../init";

/**
 * Creates a TRPC middleware that ensures the current user
 * has a role at or above the required level.
 */
export function requireRole(requiredRole: Role) {
	return middleware(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
		}

		if (ctx.user.isSuperadmin) {
			return next({ ctx }); // Superadmins bypass role checks
		}

		if (!isAtLeastRole(ctx.user.role as Role, requiredRole)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `Requires ${requiredRole} or higher. You are ${ctx.user.role}.`,
			});
		}

		return next({ ctx });
	});
}
