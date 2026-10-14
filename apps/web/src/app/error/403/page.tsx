"use client";

import { Button } from "@evaluna/ui/components/button";
import { ShieldAlertIcon } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { getCanonicalDashboardRoute } from "@/lib/rbac-config";

export default function Forbidden403Page() {
	const { session, isLoading } = useSession();
	const userRole = (session?.user as any)?.role || "customer";
	const userDashboard = getCanonicalDashboardRoute(userRole);
	const formattedRole = userRole.replace(/_/g, " ").toUpperCase();

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
			<div className="flex flex-col items-center space-y-4 text-center">
				<div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
					<ShieldAlertIcon className="h-10 w-10 text-red-600" />
				</div>
				<h1 className="font-bold text-4xl text-red-600 tracking-tighter sm:text-5xl">
					403 - Access Denied
				</h1>
				<p className="max-w-[500px] text-muted-foreground text-sm sm:text-base">
					You do not have permission to access this section. Your account role ({formattedRole}) is restricted to your assigned operational workspace.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-4">
					<Button asChild>
						<Link href={userDashboard}>Go to My Dashboard</Link>
					</Button>
					<Button variant="outline" asChild>
						<a href="/api/logout">Sign Out</a>
					</Button>
				</div>
			</div>
		</div>
	);
}
