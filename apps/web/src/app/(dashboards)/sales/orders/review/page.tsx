"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { ClipboardListIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";

const STATUS_LABELS: Record<string, string> = {
	pending_review: "New â€” awaiting review",
	under_review: "In progress",
};

export default function CustomerOrderInboxPage() {
	const trpc = useTRPC();
	const {
		data: orders,
		isLoading,
		error,
	} = trpc.orders.listPendingReview.useQuery(undefined, {
		refetchInterval: 30000,
	});

	return (
		<div className="space-y-5">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Customer Orders</h1>
				<p className="text-muted-foreground text-sm">
					Orders submitted by customers. Open one to call, edit items, apply
					pricing, and confirm.
				</p>
			</div>

			{isLoading ? (
				<p className="text-muted-foreground text-sm">Loadingâ€¦</p>
			) : error ? (
				<p className="text-destructive text-sm">{error.message}</p>
			) : (orders ?? []).length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-2 py-12 text-center">
						<ClipboardListIcon className="h-10 w-10 text-muted-foreground" />
						<p className="text-muted-foreground text-sm">
							No customer orders waiting for review.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-2">
					{(orders ?? []).map((o) => (
						<Link
							key={o.id}
							href={`/sales/orders/review/${o.id}`}
							className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card p-4 transition-colors hover:bg-accent/40"
						>
							<div className="min-w-0">
								<p className="font-medium">
									{o.orderRef} Â· {o.customerName}
								</p>
								<p className="flex items-center gap-2 text-muted-foreground text-xs">
									{o.customerPhone && (
										<span className="inline-flex items-center gap-1">
											<PhoneIcon className="h-3 w-3" />
											{o.customerPhone}
										</span>
									)}
									<span>{o.itemsCount} item(s)</span>
									<span>
										{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
									</span>
								</p>
							</div>
							<span
								className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
									o.status === "under_review"
										? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
										: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
								}`}
							>
								{STATUS_LABELS[o.status ?? ""] ?? o.status}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
