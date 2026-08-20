"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { PlusCircleIcon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

const STATUS_LABELS: Record<string, string> = {
	pending_review: "Awaiting review",
	under_review: "Being reviewed",
	confirmed: "Confirmed",
	completed: "Completed",
	cancelled: "Cancelled",
};

const FILTERS = [
	{ key: "all", label: "All" },
	{ key: "pending", label: "Pending" },
	{ key: "confirmed", label: "Confirmed" },
] as const;

const PENDING = ["pending_review", "under_review"];
const CONFIRMED = ["confirmed", "completed"];

export default function CustomerOrdersPage() {
	const trpc = useTRPC();
	const { data: orders, isLoading } = trpc.customer.getMyOrders.useQuery();
	const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

	const filtered = useMemo(() => {
		const rows = orders ?? [];
		if (filter === "pending")
			return rows.filter((o) => PENDING.includes(o.status ?? ""));
		if (filter === "confirmed")
			return rows.filter((o) => CONFIRMED.includes(o.status ?? ""));
		return rows;
	}, [orders, filter]);

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="font-bold text-2xl tracking-tight">My Orders</h1>
				<Link href="/customer/orders/new">
					<Button className="gap-2">
						<PlusCircleIcon className="h-4 w-4" /> New Order
					</Button>
				</Link>
			</div>

			<div className="flex gap-2">
				{FILTERS.map((f) => (
					<button
						type="button"
						key={f.key}
						onClick={() => setFilter(f.key)}
						className={`rounded-full px-4 py-1.5 font-medium text-sm transition-colors ${
							filter === f.key
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/70"
						}`}
					>
						{f.label}
					</button>
				))}
			</div>

			{isLoading ? (
				<p className="text-muted-foreground text-sm">Loading orders…</p>
			) : filtered.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-12 text-center">
						<ShoppingBagIcon className="h-10 w-10 text-muted-foreground" />
						<p className="text-muted-foreground text-sm">No orders here yet.</p>
						<Link href="/customer/orders/new">
							<Button variant="outline" size="sm">
								Create your first order
							</Button>
						</Link>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-2">
					{filtered.map((o) => (
						<Link
							key={o.id}
							href={`/customer/orders/${o.id}`}
							className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4 transition-colors hover:bg-accent/40"
						>
							<div>
								<p className="font-medium">{o.orderRef}</p>
								<p className="text-muted-foreground text-xs">
									{o.date ? new Date(o.date).toLocaleDateString() : "—"} ·{" "}
									{o.itemsCount} item(s)
								</p>
							</div>
							<div className="text-right">
								<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
									{STATUS_LABELS[o.status ?? ""] ?? o.status}
								</span>
								{o.total != null && (
									<p className="mt-1 font-semibold">
										₹{o.total.toLocaleString("en-IN")}
									</p>
								)}
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
