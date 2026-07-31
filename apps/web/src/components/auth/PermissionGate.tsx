"use client";

import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";
import { type Action, type Domain, roleHasPermission } from "@/lib/permissions";

interface PermissionGateProps {
	domain: Domain;
	action: Action;
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * Conditionally renders children if the current user has the specified permission.
 * Uses the static permission matrix logic on the client.
 */
export function PermissionGate({
	domain,
	action,
	children,
	fallback = null,
}: PermissionGateProps) {
	const { session, isLoading } = useSession();

	if (isLoading) return null;
	if (!session?.user) return <>{fallback}</>;

	const user = session.user as any;
	if (user.isSuperadmin) return <>{children}</>; // Superadmins bypass UI gates

	const hasPerm = roleHasPermission(
		user.role || "sales_person",
		domain,
		action,
	);

	return hasPerm ? children : fallback;
}
