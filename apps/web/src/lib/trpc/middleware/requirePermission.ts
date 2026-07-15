import { TRPCError } from "@trpc/server";
import { middleware } from "../init";
import type { Domain, Action, Permission } from "../../permissions";

/**
 * Creates a TRPC middleware that ensures the current user
 * has a specific domain.action permission.
 */
export function requirePermission(domain: Domain, action: Action) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
    }

    if (ctx.user.isSuperadmin) {
      return next({ ctx }); // Superadmins bypass permission checks
    }

    const requiredPerm: Permission = `${domain}.${action}`;
    
    if (!ctx.user.permissions.includes(requiredPerm)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires permission: ${requiredPerm}`,
      });
    }

    return next({ ctx });
  });
}
