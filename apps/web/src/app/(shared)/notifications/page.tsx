"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { ArrowLeft, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { ROLE_DASHBOARD_MAP, normalizeRole } from "@/lib/permissions";

export default function SharedNotificationsPage() {
	const router = useRouter();
	const sessionData = useSession();
	const user = sessionData.session?.user;
	const normalized = normalizeRole((user as any)?.role || "sales_person");
	const dashboardHref = (user as any)?.canonicalDashboardRoute || ROLE_DASHBOARD_MAP[normalized as keyof typeof ROLE_DASHBOARD_MAP] || "/sales";

	useEffect(() => {
		const timer = setTimeout(() => {
			router.replace(dashboardHref);
		}, 800);
		return () => clearTimeout(timer);
	}, [dashboardHref, router]);

	return (
		<div className="flex min-h-[60vh] items-center justify-center p-4">
			<Card className="max-w-md w-full text-center border-border/60 shadow-lg bg-card/80 backdrop-blur-md">
				<CardHeader className="flex flex-col items-center pb-2">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
						<Bell className="h-7 w-7 animate-bounce" />
					</div>
					<CardTitle className="text-lg font-bold">In-App Notification Modal</CardTitle>
					<CardDescription className="text-xs text-muted-foreground mt-1">
						Notifications are now accessible instantly from the bell icon on your dashboard header without opening a separate page.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-2">
					<Button
						variant="default"
						size="sm"
						onClick={() => router.replace(dashboardHref)}
						className="gap-2 font-medium"
					>
						<ArrowLeft className="h-4 w-4" />
						Return to Dashboard
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
