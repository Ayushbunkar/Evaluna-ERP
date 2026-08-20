"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	AwardIcon,
	ClockIcon,
	PlusCircleIcon,
	ShoppingBagIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";

const STATUS_LABELS: Record<string, string> = {
	pending_review: "Awaiting review",
	under_review: "Being reviewed",
	confirmed: "Confirmed",
	completed: "Completed",
	cancelled: "Cancelled",
};

export default function CustomerDashboardPage() {
	const trpc = useTRPC();
	const { data: stats, isLoading } = trpc.customer.getPortalStats.useQuery();
	const { data: orders } = trpc.customer.getMyOrders.useQuery();

	const recent = (orders ?? []).slice(0, 5);

	const cards = [
		{
			title: "Total Orders",
			value: stats?.totalOrders ?? 0,
			icon: ShoppingBagIcon,
		},
		{
			title: "Awaiting Review",
			value: stats?.pendingOrders ?? 0,
			icon: ClockIcon,
		},
		{
			title: "Loyalty Points",
			value: stats?.loyaltyPoints ?? 0,
			icon: AwardIcon,
		},
		{
			title: "Wallet Balance",
			value: `₹${(stats?.walletBalance ?? 0).toLocaleString("en-IN")}`,
			icon: WalletIcon,
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Welcome back</h1>
					<p className="text-muted-foreground text-sm">
						Browse products and place a new order — our team will review it and
						share pricing.
					</p>
				</div>
				<Link href="/customer/orders/new">
					<Button className="gap-2">
						<PlusCircleIcon className="h-4 w-4" /> New Order
					</Button>
				</Link>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{cards.map(({ title, value, icon: Icon }) => (
					<Card key={title} className="border-border/50 bg-card/50">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-muted-foreground text-sm">
								{title}
							</CardTitle>
							<Icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{isLoading ? "—" : value}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Card className="border-border/50">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base">Recent Orders</CardTitle>
					<Link
						href="/customer/orders"
						className="text-primary text-sm hover:underline"
					>
						View all
					</Link>
				</CardHeader>
				<CardContent className="space-y-2">
					{recent.length === 0 ? (
						<p className="py-6 text-center text-muted-foreground text-sm">
							No orders yet. Start by creating a new order.
						</p>
					) : (
						recent.map((o) => (
							<Link
								key={o.id}
								href={`/customer/orders/${o.id}`}
								className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/40"
							>
								<div>
									<p className="font-medium text-sm">{o.orderRef}</p>
									<p className="text-muted-foreground text-xs">
										{o.date ? new Date(o.date).toLocaleDateString() : "—"} ·{" "}
										{o.itemsCount} item(s)
									</p>
								</div>
								<div className="text-right">
									<span className="rounded-full bg-muted px-2 py-0.5 text-xs">
										{STATUS_LABELS[o.status ?? ""] ?? o.status}
									</span>
									{o.total != null && (
										<p className="mt-1 font-semibold text-sm">
											₹{o.total.toLocaleString("en-IN")}
										</p>
									)}
								</div>
							</Link>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}
