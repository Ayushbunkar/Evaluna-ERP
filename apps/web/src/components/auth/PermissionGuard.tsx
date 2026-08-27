"use client";

import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useRouter } from "next/navigation";
import type React from "react";
import { useSession } from "@/hooks/use-session";

interface PermissionGuardProps {
	children: React.ReactNode;
	allowedRoles?: string[];
	requiredPermissions?: string[];
	fallback?: React.ReactNode;
}

export function PermissionGuard({
	children,
	allowedRoles = [],
	requiredPermissions = [],
	fallback,
}: PermissionGuardProps) {
	const { session, isLoading } = useSession();
	const router = useRouter();

	if (isLoading) {
		return <Skeleton className="h-[400px] w-full" />;
	}

	if (!session?.user) {
		if (fallback) return <>{fallback}</>;
		router.push("/unauthorized");
		return null;
	}

	const userRole = session.user.role as string;
	const userPermissions = ((session.user as any).permissions as string[]) || [];

	const hasRole = allowedRoles.length === 0 || allowedRoles.includes(userRole);
	const hasPermissions =
		requiredPermissions.length === 0 ||
		requiredPermissions.every((p) => userPermissions.includes(p));

	if (!hasRole || !hasPermissions) {
		if (fallback) return <>{fallback}</>;
		router.push("/unauthorized");
		return null;
	}

	return <>{children}</>;
}

