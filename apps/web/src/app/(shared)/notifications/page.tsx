"use client";

import { Button } from "@evaluna/ui/components/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { WhatsAppSmsHub } from "@/components/notifications/WhatsAppSmsHub";
import { useSession } from "@/hooks/use-session";
import { PageTransition } from "@/lib/animations";
import { normalizeRole, ROLE_DASHBOARD_MAP } from "@/lib/permissions";

export default function SharedNotificationsPage() {
	const router = useRouter();
	const sessionData = useSession();
	const user = sessionData.session?.user;
	const normalized = normalizeRole((user as any)?.role || "sales_person");
	const dashboardHref =
		(user as any)?.canonicalDashboardRoute ||
		ROLE_DASHBOARD_MAP[normalized as keyof typeof ROLE_DASHBOARD_MAP] ||
		"/sales";

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="flex items-center gap-2.5 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<MessageSquare className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
						Automated WhatsApp & SMS Control Hub
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Monitor automated customer alerts, driver route dispatch SMS, and
						test messaging templates in real time
					</p>
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => router.push(dashboardHref)}
					className="gap-2 font-semibold text-xs"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Dashboard
				</Button>
			</div>

			{/* Main WhatsApp & SMS Hub Component */}
			<WhatsAppSmsHub />
		</PageTransition>
	);
}
