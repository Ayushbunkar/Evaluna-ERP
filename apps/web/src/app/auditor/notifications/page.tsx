"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type FilterOption,
	SearchFilter,
} from "@evaluna/ui/components/search-filter";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { BellIcon, CheckCheckIcon, CheckIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useBranch } from "@/lib/branch-context";
import { useTRPC } from "@/lib/trpc/client";

const priorityVariant = (
	p: string,
): "default" | "secondary" | "destructive" | "outline" => {
	if (p === "critical") return "destructive";
	if (p === "high") return "default";
	if (p === "normal") return "secondary";
	return "outline";
};

export default function NotificationsPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { activeBranchId } = useBranch();

	const [searchTerm, setSearchTerm] = useState("");
	const [readFilter, setReadFilter] = useState("all");

	const {
		data: notifications = [],
		isLoading,
		error,
	} = trpc.notifications.list.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
	);

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: [["notifications", "list"]] });
		queryClient.invalidateQueries({
			queryKey: [["notifications", "unreadCount"]],
		});
	};

	const markAsRead = trpc.notifications.markAsRead.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Marked as read");
		},
		onError: (err) => toast.error(err.message),
	});

	const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("All notifications marked as read");
		},
		onError: (err) => toast.error(err.message),
	});

	const readFilterOptions: FilterOption[] = [
		{ label: "All", value: "all" },
		{ label: "Unread", value: "unread", variant: "warning" },
		{ label: "Read", value: "read", variant: "success" },
	];

	const isUnread = (row: any) => !(row.is_read ?? !!row.read_at);

	const filtered = useMemo(() => {
		return (notifications as any[]).filter((n) => {
			if (readFilter === "unread" && !isUnread(n)) return false;
			if (readFilter === "read" && isUnread(n)) return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				String(n.title ?? "").toLowerCase().includes(q) ||
				String(n.message ?? "").toLowerCase().includes(q) ||
				String(n.type ?? "").toLowerCase().includes(q)
			);
		});
	}, [notifications, readFilter, searchTerm]);

	const hasUnread = (notifications as any[]).some((n) => isUnread(n));

	if (isLoading) {
		return (
			<Card className="flex flex-col gap-6 p-6">
				<CardHeader className="p-0">
					<Skeleton className="h-10 w-64" />
				</CardHeader>
				<CardContent className="space-y-3 p-0">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-16 w-full rounded-lg" />
					))}
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent>
					<p className="text-red-500">{(error as any)?.message}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<PageTransition>
			<Card className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<div className="mb-2 flex items-end justify-between">
						<div>
							<h1 className="font-bold text-2xl tracking-tight">
								Notifications
							</h1>
							<p className="mt-1 text-muted-foreground text-sm">
								Your notifications. Unread items are highlighted.
							</p>
						</div>
						<Button
							size="sm"
							variant="secondary"
							disabled={!hasUnread || markAllAsRead.isPending}
							onClick={() =>
								markAllAsRead.mutate(
									activeBranchId ? { branch_id: activeBranchId } : {},
								)
							}
						>
							<CheckCheckIcon className="mr-2 h-4 w-4" />
							Mark all read
						</Button>
					</div>
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search notifications"
						filters={[
							{
								options: readFilterOptions,
								value: readFilter,
								onChange: setReadFilter,
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0">
					{filtered.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
							<BellIcon className="h-8 w-8" />
							<p>No notifications found</p>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							{filtered.map((n: any) => {
								const unread = isUnread(n);
								return (
									<div
										key={n.id}
										className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
											unread
												? "border-primary/30 bg-primary/5"
												: "border-border/50 bg-background"
										}`}
									>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												{unread && (
													<span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
												)}
												<h4
													className={`truncate text-sm ${unread ? "font-semibold" : "font-medium"}`}
												>
													{n.title ?? n.type ?? "Notification"}
												</h4>
												{n.priority && (
													<Badge
														variant={priorityVariant(n.priority)}
														className="capitalize"
													>
														{n.priority}
													</Badge>
												)}
											</div>
											<p className="mt-1 text-muted-foreground text-xs">
												{n.message}
											</p>
											<p className="mt-1 text-[10px] text-muted-foreground/70">
												{n.created_at
													? new Date(n.created_at).toLocaleString()
													: ""}
											</p>
										</div>
										{unread && (
											<Button
												size="sm"
												variant="ghost"
												disabled={markAsRead.isPending}
												onClick={() => markAsRead.mutate({ id: n.id })}
											>
												<CheckIcon className="mr-1 h-4 w-4" />
												Mark read
											</Button>
										)}
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
