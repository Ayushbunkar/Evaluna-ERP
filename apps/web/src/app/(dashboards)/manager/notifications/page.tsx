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
import { BellIcon, CheckCheckIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function NotificationsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	// Query notifications scoped to authenticated manager
	const {
		data: notifications = [],
		isLoading,
		refetch,
	} = trpc.notifications.list.useQuery({ limit: 50 });

	const markReadMutation = trpc.notifications.markAsRead.useMutation({
		onSuccess: () => {
			toast.success("Notification marked as read");
			refetch();
			utils.notifications.unreadCount.invalidate();
		},
		onError: (err) => {
			toast.error(`Error: ${err.message}`);
		},
	});

	const markAllReadMutation = trpc.notifications.markAllAsRead.useMutation({
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
		markReadMutation.mutate({ id });
	};

	const handleMarkAllRead = () => {
		markAllReadMutation.mutate({});
	};

	const hasUnread = notifications.some((n) => !n.is_read);

	return (
		<PageTransition className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<BellIcon className="h-6 w-6 text-blue-600" />
						Manager Alerts & Notifications
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Access and manage important system updates, shift alerts, and task
						changes.
					</p>
				</div>
				{hasUnread && (
					<Button
						size="sm"
						onClick={handleMarkAllRead}
						disabled={markAllReadMutation.isPending}
						className="bg-blue-600 hover:bg-blue-700"
					>
						<CheckCheckIcon className="mr-1.5 h-4 w-4" /> Mark All Read
					</Button>
				)}
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Alert Feed Inbox
					</CardTitle>
					<CardDescription>
						Chronological inbox targeted directly to your operator account
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="divide-y divide-slate-100 dark:divide-slate-800">
							{notifications.map((n) => (
								<div
									key={n.id}
									className={`flex items-start justify-between gap-4 p-4 transition-colors hover:bg-slate-50/40 ${
										!n.is_read
											? "border-l-4 border-l-blue-500 bg-blue-50/10"
											: ""
									}`}
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<span className="font-bold text-slate-900 text-sm dark:text-slate-100">
												{n.title}
											</span>
											{!n.is_read && (
												<Badge className="bg-blue-500 font-bold text-[9px] uppercase tracking-wider">
													New
												</Badge>
											)}
										</div>
										<p className="text-slate-600 text-xs leading-relaxed dark:text-slate-400">
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
											disabled={markReadMutation.isPending}
											className="h-8 w-8 text-slate-400 hover:text-blue-500"
										>
											<CheckIcon className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}

							{notifications.length === 0 && (
								<div className="py-16 text-center text-slate-400">
									<BellIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
									<p className="font-bold text-sm">Inbox is empty</p>
									<p className="mt-1 text-xs">
										There are no notifications targeted to your account.
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
