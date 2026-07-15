"use client";

import { useSession } from "@/hooks/use-session";
import { isAtLeastRole, type Role } from "@/lib/permissions";
import type { ReactNode } from "react";

interface RoleGateProps {
  minRole: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children if the current user has a role at or above the minimum required.
 */
export function RoleGate({ minRole, children, fallback = null }: RoleGateProps) {
  const { session, isLoading } = useSession();

  if (isLoading) return null;
  if (!session?.user) return <>{fallback}</>;

  const user = session.user as any;
  if (user.isSuperadmin) return <>{children}</>;

  const hasRole = isAtLeastRole(user.role || "sales_person", minRole);

  return hasRole ? <>{children}</> : <>{fallback}</>;
}
