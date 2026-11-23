"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Bell,
	CheckCheck,
	Clock,
	Flame,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingNotificationsPage() {
	const trpc = useTRPC();
	const notifsQuery = trpc.instagram.getNotifications.useQuery();

	const markReadMutation = trpc.instagram.markNotificationRead.useMutation({
		onSuccess: () => {
			toast.success("Notifications marked as read.");
			notifsQuery.refetch();
		},
	});

	const { notifications = [], unreadCount = 0 } = notifsQuery.data || {};

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Marketing Notifications & Alerts
					</h1>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Stay informed on scheduled post publishing, high engagement spikes, and Meta token status
					</p>
				</div>

				{unreadCount > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => markReadMutation.mutate({})}
						className="h-8 gap-1.5 text-xs"
					>
						<CheckCheck className="h-3.5 w-3.5" />
						Mark All as Read
					</Button>
				)}
			</div>

			<div className="space-y-3">
				{notifications.map((n) => (
					<Card
						key={n.id}
						className={`rounded-xl border shadow-xs transition-all ${
							n.isRead
								? "border-border/70 bg-card"
								: "border-primary/50 bg-primary/5"
						}`}
					>
						<CardContent className="p-4 flex items-start justify-between gap-4">
							<div className="flex items-start gap-3">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
									<Bell className="h-4 w-4" />
								</div>
								<div>
									<div className="flex items-center gap-2">
										<p className="font-bold text-xs text-foreground">{n.title}</p>
										{!n.isRead && (
											<Badge className="bg-primary text-primary-foreground text-[9px] h-4 px-1.5">
												New
											</Badge>
										)}
									</div>
									<p className="text-xs text-muted-foreground mt-1">{n.message}</p>
									<p className="text-[10px] text-muted-foreground/70 mt-1">
										{n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN") : "Recent"}
									</p>
								</div>
							</div>

							{n.link && (
								<Button variant="ghost" size="sm" asChild className="text-xs h-7 shrink-0">
									<Link href={n.link}>View</Link>
								</Button>
							)}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
