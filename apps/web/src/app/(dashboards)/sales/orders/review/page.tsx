"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	ArrowRightIcon,
	CheckCircle2Icon,
	ClipboardListIcon,
	ClockIcon,
	Loader2Icon,
	PhoneIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/lib/trpc/client";

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
	pending_review: {
		label: "Awaiting Review",
		badgeClass:
			"bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
	},
	under_review: {
		label: "In Progress",
		badgeClass:
			"bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
	},
};

const PRESET_CANCEL_REASONS = [
	"Customer Refused / Changed Mind (ग्राहक ने मना कर दिया)",
	"Customer Cancelled on Phone Call (फ़ोन पर ग्राहक द्वारा निरस्त)",
	"Ordered by Mistake / Duplicate Order (गलती से ऑर्डर / डुप्लीकेट)",
	"Item Price / Rate Mismatch (कीमत पर असहमति)",
	"Out of Stock / Delivery Delayed (स्टॉक अनुपलब्ध / देरी)",
	"Customer Unreachable / Wrong Number (ग्राहक से संपर्क नहीं हो पाया)",
	"Custom / Other Reason",
];

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
	const utils = trpc.useUtils();

	const [cancellingOrder, setCancellingOrder] = useState<any>(null);
	const [selectedReason, setSelectedReason] = useState<string>(PRESET_CANCEL_REASONS[0]);
	const [customReason, setCustomReason] = useState<string>("");
	const [cancelNotes, setCancelNotes] = useState<string>("");

	const {
		data: orders,
		isLoading,
		error,
		refetch,
	} = trpc.orders.listPendingReview.useQuery(undefined, {
		refetchInterval: 15000,
	});

	const cancelMutation = trpc.orders.cancelOrder.useMutation({
		onSuccess: () => {
			toast.success(
				`Order ORD-${cancellingOrder?.id} cancelled and moved to Cancelled Orders archive.`,
			);
			utils.orders.listPendingReview.invalidate();
			utils.orders.getPendingCount.invalidate();
			utils.orders.listCancelledOrders.invalidate();
			utils.orders.list.invalidate();
			refetch();
			setCancellingOrder(null);
			setSelectedReason(PRESET_CANCEL_REASONS[0]);
			setCustomReason("");
			setCancelNotes("");
		},
		onError: (err) => {
			toast.error(`Failed to cancel order: ${err.message}`);
		},
	});

	const handleCancelSubmit = () => {
		if (!cancellingOrder) return;
		const reasonFinal =
			selectedReason === "Custom / Other Reason"
				? customReason.trim()
				: selectedReason;

		if (!reasonFinal) {
			toast.error("Please provide a reason for cancelling this order.");
			return;
		}

		cancelMutation.mutate({
			id: cancellingOrder.id,
			reason: reasonFinal,
			notes: cancelNotes.trim() || undefined,
		});
	};

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
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Customer Orders Queue
					</h1>
					<p className="text-muted-foreground text-sm">
						Incoming portal orders awaiting staff phone review and price
						confirmation.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40">
						<Link href="/sales/orders/cancelled">
							<XCircleIcon className="h-4 w-4 text-rose-500" />
							Cancelled Orders Archive
						</Link>
					</Button>
				</div>
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
			) : error || sortedOrders.length === 0 ? (
				<Card className="border-border/60 border-dashed">
					<CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
							<CheckCircle2Icon className="h-6 w-6" />
						</div>
						<div>
							<p className="font-semibold text-base text-foreground">
								No Pending Customer Orders
							</p>
							<p className="text-muted-foreground text-sm">
								All clear! There are currently no customer orders waiting in the queue.
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
									<div className="min-w-0 flex-1 space-y-1.5">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-bold font-mono text-base text-primary">
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
												Placed:{" "}
												{o.createdAt
													? new Date(o.createdAt).toLocaleString()
													: "Recently"}
											</span>
										</div>
									</div>

									<div className="flex shrink-0 items-center gap-2 border-border/40 border-t pt-2 sm:border-t-0 sm:pt-0">
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

										<Button
											variant="outline"
											size="sm"
											onClick={() => setCancellingOrder(o)}
											className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50"
										>
											<XCircleIcon className="h-3.5 w-3.5" />
											Cancel Order
										</Button>

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

			{/* Cancel Customer Order Reason Modal */}
			<Dialog
				open={!!cancellingOrder}
				onOpenChange={(open) => !open && setCancellingOrder(null)}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-destructive text-lg">
							<AlertTriangleIcon className="h-5 w-5" />
							Cancel Customer Order ({cancellingOrder?.orderRef})
						</DialogTitle>
						<DialogDescription>
							This order will be removed from the active review queue and archived
							under <span className="font-semibold text-foreground">Cancelled Orders</span> with full customer and item details preserved.
						</DialogDescription>
					</DialogHeader>

					{cancellingOrder && (
						<div className="space-y-4 py-2 text-xs">
							{/* Customer Summary */}
							<div className="rounded-lg border bg-muted/40 p-3">
								<div className="font-bold text-foreground text-sm">
									{cancellingOrder.customerName}
								</div>
								{cancellingOrder.customerPhone && (
									<div className="text-muted-foreground">
										Phone: {cancellingOrder.customerPhone}
									</div>
								)}
								<div className="mt-1 text-muted-foreground text-[11px]">
									Items: {cancellingOrder.itemsCount} line items
								</div>
							</div>

							{/* Cancellation Reason Select */}
							<div className="space-y-1.5">
								<Label htmlFor="cancelReasonSelect" className="font-semibold text-xs">
									Cancellation Reason (कारण) *
								</Label>
								<select
									id="cancelReasonSelect"
									value={selectedReason}
									onChange={(e) => setSelectedReason(e.target.value)}
									className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-medium text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								>
									{PRESET_CANCEL_REASONS.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>

							{/* Custom Reason input */}
							{selectedReason === "Custom / Other Reason" && (
								<div className="space-y-1.5">
									<Label htmlFor="customCancelReason" className="font-semibold text-xs">
										Specify Custom Reason *
									</Label>
									<Input
										id="customCancelReason"
										placeholder="e.g. Customer cancelled due to change in store requirement"
										value={customReason}
										onChange={(e) => setCustomReason(e.target.value)}
										className="text-xs"
									/>
								</div>
							)}

							{/* Additional notes */}
							<div className="space-y-1.5">
								<Label htmlFor="cancelNotes" className="font-semibold text-xs text-muted-foreground">
									Additional Comments (Optional)
								</Label>
								<Input
									id="cancelNotes"
									placeholder="e.g. Customer informed on 9:30 PM call"
									value={cancelNotes}
									onChange={(e) => setCancelNotes(e.target.value)}
									className="text-xs"
								/>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setCancellingOrder(null)}
							className="text-xs"
						>
							Go Back
						</Button>
						<Button
							variant="destructive"
							onClick={handleCancelSubmit}
							disabled={cancelMutation.isPending}
							className="gap-1.5 text-xs"
						>
							{cancelMutation.isPending ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : (
								<XCircleIcon className="h-4 w-4" />
							)}
							Confirm Cancellation
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

