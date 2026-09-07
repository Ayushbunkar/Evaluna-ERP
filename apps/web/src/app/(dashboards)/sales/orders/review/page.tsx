"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@/components/ui/badge";
import {
	ClockIcon,
	ClipboardListIcon,
	PhoneIcon,
	AlertCircleIcon,
	CheckCircle2Icon,
	ArrowRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useTRPC } from "@/lib/trpc/client";

const STATUS_CONFIG: Record<
	string,
	{ label: string; badgeClass: string }
> = {
	pending_review: {
		label: "Awaiting Review",
		badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
	},
	under_review: {
		label: "In Progress",
		badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
	},
};

function formatPendingDuration(createdAt: Date | string | null): string {
	if (!createdAt) return "Just now";
	const diffMs = Date.now() - new Date(createdAt).getTime();
	if (diffMs < 0) return "Just now";

	const diffMins = Math.floor(diffMs / (1000 * 60));
	if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;

	const diffHours = Math.floor(diffMins / 60);
	const remainingMins = diffMins % 60;
	if (diffHours < 24) {
		return `${diffHours}h ${remainingMins}m ago`;
	}

	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export default function CustomerOrderInboxPage() {
	const trpc = useTRPC();
	const {
		data: orders,
		isLoading,
		error,
	} = trpc.orders.listPendingReview.useQuery(undefined, {
		refetchInterval: 15000,
	});

	// Sort orders oldest-first so sales team prioritizes long-waiting customers
	const sortedOrders = useMemo(() => {
		if (!orders) return [];
		return [...orders].sort((a, b) => {
			const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			return timeA - timeB;
		});
	}, [orders]);

	const pendingReviewCount = sortedOrders.filter(
		(o) => o.status === "pending_review",
	).length;
	const underReviewCount = sortedOrders.filter(
		(o) => o.status === "under_review",
	).length;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Customer Orders Queue</h1>
				<p className="text-muted-foreground text-sm">
					Incoming portal orders awaiting staff phone review and price confirmation.
				</p>
			</div>

			{/* Queue Metrics */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card className="border-border/50 bg-gradient-to-br from-amber-500/5 to-transparent">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							New / Pending
						</CardTitle>
						<AlertCircleIcon className="h-5 w-5 text-amber-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{pendingReviewCount}</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Needs initial call & review
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-transparent">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Under Review
						</CardTitle>
						<ClockIcon className="h-5 w-5 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{underReviewCount}</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Draft saved / in phone consultation
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Total In Queue
						</CardTitle>
						<ClipboardListIcon className="h-5 w-5 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{sortedOrders.length}</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Sorted by oldest first
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Queue List */}
			{isLoading ? (
				<div className="py-12 text-center text-muted-foreground text-sm">
					Loading pending customer orders queue…
				</div>
			) : error ? (
				<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
					{error.message}
				</div>
			) : sortedOrders.length === 0 ? (
				<Card className="border-dashed border-border/60">
					<CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
							<CheckCircle2Icon className="h-6 w-6" />
						</div>
						<div>
							<p className="font-semibold text-foreground text-base">All clear!</p>
							<p className="text-muted-foreground text-sm">
								No customer orders waiting in the queue.
							</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3">
					{sortedOrders.map((o) => {
						const statusInfo = STATUS_CONFIG[o.status ?? ""] ?? {
							label: o.status ?? "Pending",
							badgeClass: "bg-muted text-muted-foreground",
						};

						return (
							<Card
								key={o.id}
								className="border-border/50 transition-all hover:border-primary/40 hover:shadow-md"
							>
								<CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
									<div className="space-y-1.5 min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-mono font-bold text-base text-primary">
												{o.orderRef}
											</span>
											<Badge
												variant="outline"
												className={`text-xs ${statusInfo.badgeClass}`}
											>
												{statusInfo.label}
											</Badge>
											<span className="inline-flex items-center gap-1 font-medium text-amber-700 text-xs dark:text-amber-400">
												<ClockIcon className="h-3 w-3" />
												Waiting: {formatPendingDuration(o.createdAt)}
											</span>
										</div>

										<div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium text-foreground text-sm">
											<span>{o.customerName}</span>
											{o.customerPhone && (
												<a
													href={`tel:${o.customerPhone}`}
													className="inline-flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400"
												>
													<PhoneIcon className="h-3.5 w-3.5" />
													{o.customerPhone}
												</a>
											)}
										</div>

										<div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
											<span>{o.itemsCount} line item(s)</span>
											<span>•</span>
											<span>
												Placed: {o.createdAt ? new Date(o.createdAt).toLocaleString() : "Recently"}
											</span>
										</div>
									</div>

									<div className="flex items-center gap-2 shrink-0 pt-2 border-t border-border/40 sm:border-t-0 sm:pt-0">
										{o.customerPhone && (
											<Button
												variant="outline"
												size="sm"
												asChild
												className="gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
											>
												<a href={`tel:${o.customerPhone}`}>
													<PhoneIcon className="h-3.5 w-3.5" />
													Call
												</a>
											</Button>
										)}

										<Button size="sm" asChild className="gap-1.5">
											<Link href={`/sales/orders/review/${o.id}`}>
												Review Order
												<ArrowRightIcon className="h-3.5 w-3.5" />
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
