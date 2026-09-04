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
	AlertCircleIcon,
	AlertTriangleIcon,
	BellIcon,
	CalendarIcon,
	CheckCheckIcon,
	CheckIcon,
	InfoIcon,
	Loader2Icon,
	TrendingDownIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function NotificationsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	// 1. Query notifications
	const {
		data: notificationsList,
		isLoading,
		refetch,
	} = trpc.notifications.list.useQuery(
		{ limit: 50 },
		{ refetchOnWindowFocus: true },
	);

	// 2. Mark Single Read Mutation
	const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
		onSuccess: () => {
			toast.success("Notification marked as read");
			refetch();
			utils.notifications.unreadCount.invalidate();
		},
		onError: (err) => {
			toast.error(`Error: ${err.message}`);
		},
	});

	// 3. Mark All Read Mutation
	const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
		onSuccess: () => {
			toast.success("All notifications marked as read");
			refetch();
			utils.notifications.unreadCount.invalidate();
		},
		onError: (err) => {
			toast.error(`Error: ${err.message}`);
		},
	});

	const handleMarkRead = (id: number) => {
		markAsReadMutation.mutate({ id });
	};

	const handleMarkAllRead = () => {
		markAllAsReadMutation.mutate({});
	};

	const getIconForType = (type: string) => {
		switch (type) {
			case "low_stock":
				return <TrendingDownIcon className="h-5 w-5 text-red-500" />;
			case "expiry":
			case "warning":
				return <AlertTriangleIcon className="h-5 w-5 text-amber-500" />;
			case "error":
				return <AlertCircleIcon className="h-5 w-5 text-rose-600" />;
			case "birthday":
			case "campaign":
				return <CalendarIcon className="h-5 w-5 text-purple-500" />;
			default:
				return <InfoIcon className="h-5 w-5 text-blue-500" />;
		}
	};

	const getPriorityBadgeColor = (priority: string | null) => {
		switch (priority) {
			case "critical":
				return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200";
			case "high":
				return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
			default:
				return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200";
		}
	};

	const hasUnread = notificationsList?.some((n) => !n.is_read);

	return (
		<PageTransition className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<BellIcon className="h-6 w-6 text-blue-500" />
						In-App Notification Center
					</h2>
					<p className="text-muted-foreground text-sm">
						Access, view, and organize deep-linked workflows, alerts, and
						priority messages.
					</p>
				</div>
				{hasUnread && (
					<Button
						size="sm"
						onClick={handleMarkAllRead}
						disabled={markAllAsReadMutation.isPending}
						className="h-8 bg-blue-600 text-xs shadow-sm hover:bg-blue-700"
					>
						<CheckCheckIcon className="mr-1.5 h-4 w-4" />
						Mark All as Read
					</Button>
				)}
			</div>

			<Card className="shadow-sm">
				<CardHeader className="border-b pb-4">
					<CardTitle className="font-bold text-base">
						Latest Notifications
					</CardTitle>
					<CardDescription>
						Up to 50 targeted alerts specifically addressed to your staff
						account
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="divide-y divide-slate-100 dark:divide-slate-800">
							{notificationsList?.map((n) => (
								<div
									key={n.id}
									className={`flex items-start gap-4 p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20 ${
										!n.is_read
											? "border-l-4 border-l-blue-500 bg-blue-50/10 dark:bg-blue-900/5"
											: ""
									}`}
								>
									<div className="flex-shrink-0 rounded-full bg-slate-100 p-2 dark:bg-slate-800">
										{getIconForType(n.type)}
									</div>

									<div className="min-w-0 flex-1 space-y-1">
										<div className="flex flex-wrap items-center gap-2">
											<span
												className={`font-bold text-sm ${!n.is_read ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}
											>
												{n.title}
											</span>
											{n.priority && n.priority !== "normal" && (
												<Badge
													variant="outline"
													className={`text-[9px] uppercase tracking-wider ${getPriorityBadgeColor(n.priority)}`}
												>
													{n.priority}
												</Badge>
											)}
											{!n.is_read && (
												<Badge className="bg-blue-500 font-semibold text-[9px] uppercase tracking-wider hover:bg-blue-600">
													New
												</Badge>
											)}
										</div>
										<p className="break-words text-slate-500 text-xs leading-relaxed dark:text-slate-400">
											{n.message}
										</p>
										<span className="block pt-1 text-[10px] text-slate-400">
											{n.created_at
												? new Date(n.created_at).toLocaleString()
												: ""}
										</span>
									</div>

									{!n.is_read && (
										<Button
											size="icon"
											variant="ghost"
											onClick={() => handleMarkRead(n.id)}
											disabled={markAsReadMutation.isPending}
											className="h-8 w-8 text-slate-400 hover:text-blue-500"
											title="Mark as Read"
										>
											<CheckIcon className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}

							{notificationsList?.length === 0 && (
								<div className="py-16 text-center text-muted-foreground">
									<BellIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
									<p className="font-bold text-sm">
										Inbox is completely clear!
									</p>
									<p className="mt-1 text-xs">
										There are no unread notifications or alerts addressed to
										you.
									</p>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
