import { TRPCError } from "@trpc/server";
import { middleware } from "../init";
import { isAtLeastRole, type Role } from "../../permissions";

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

    if (!isAtLeastRole(ctx.user.role, requiredRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires ${requiredRole} or higher. You are ${ctx.user.role}.`,
      });
    }

    return next({ ctx });
  });
}
