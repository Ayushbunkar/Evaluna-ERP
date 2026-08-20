import { protectedProcedure } from "../init";
import { requirePermission } from "../middleware/requirePermission";
import type { Action, Domain } from "@/lib/permissions";

/**
 * Build a tRPC procedure gated by a single `domain.action` permission, using
 * the hierarchy-aware RBAC in permissions.ts. Superadmins bypass (handled
 * inside requirePermission). This is the authorization boundary for every
 * auditor mutation/query — frontend hiding is never relied on.
 */
export const permProcedure = (domain: Domain, action: Action) =>
	protectedProcedure.use(requirePermission(domain, action));
