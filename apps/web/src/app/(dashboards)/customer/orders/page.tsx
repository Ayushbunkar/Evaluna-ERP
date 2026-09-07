"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	CheckCircle2Icon,
	ClockIcon,
	EyeIcon,
	PackageIcon,
	PlusIcon,
	ShoppingBagIcon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const STATUS_LABELS: Record<string, string> = {
	pending_review: "Pending Sales Confirmation",
	under_review: "Sales Contacting",
	confirmed: "Confirmed",
	processing: "Processing",
	ready: "Ready",
	dispatched: "Dispatched",
	delivered: "Delivered",
	cancelled: "Cancelled",
};

const PENDING = ["pending_review", "under_review"];
const CONFIRMED = ["confirmed", "processing", "ready", "dispatched", "delivered"];

export default function CustomerOrdersPage() {
	const trpc = useTRPC();

	const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");
	const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

	const { data: orders, isLoading, error } = trpc.customer.getMyOrders.useQuery(undefined, {
		refetchInterval: 10000, // Poll every 10s for status updates from Sales
	});

	const { data: orderDetail, isLoading: detailLoading } = trpc.customer.getMyOrder.useQuery(
		{ id: selectedOrderId! },
		{ enabled: selectedOrderId !== null },
	);

	const filteredOrders = useMemo(() => {
		const list = orders ?? [];
		if (filter === "pending") {
			return list.filter((o) => PENDING.includes(o.status ?? ""));
		}
		if (filter === "confirmed") {
			return list.filter((o) => CONFIRMED.includes(o.status ?? ""));
		}
		return list;
	}, [orders, filter]);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div>
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						My Orders & Status Tracking
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Track your placed orders and receive updates when sales confirms your requests.
					</p>
				</div>
				<Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
					<Link href="/customer/products">
						<PlusIcon className="mr-1.5 h-4 w-4" /> Place New Order
					</Link>
				</Button>
			</div>

			{/* Filter Tabs */}
			<div className="flex items-center gap-2 border-border/40 border-b pb-2">
				<Button
					variant={filter === "all" ? "default" : "outline"}
					size="sm"
					className="text-xs"
					onClick={() => setFilter("all")}
				>
					All Orders ({orders?.length ?? 0})
				</Button>
				<Button
					variant={filter === "pending" ? "default" : "outline"}
					size="sm"
					className="text-xs"
					onClick={() => setFilter("pending")}
				>
					Pending Confirmation (
					{orders?.filter((o) => PENDING.includes(o.status ?? "")).length ?? 0})
				</Button>
				<Button
					variant={filter === "confirmed" ? "default" : "outline"}
					size="sm"
					className="text-xs"
					onClick={() => setFilter("confirmed")}
				>
					Confirmed (
					{orders?.filter((o) => CONFIRMED.includes(o.status ?? "")).length ?? 0})
				</Button>
			</div>

			{/* Orders List / Table */}
			{isLoading ? (
				<div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
					Loading your orders...
				</div>
			) : error ? (
				<div className="flex h-[250px] items-center justify-center text-destructive text-sm">
					Error loading orders: {error.message}
				</div>
			) : filteredOrders.length === 0 ? (
				<Card className="border-border/50">
					<CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
						<ShoppingBagIcon className="h-10 w-10 opacity-40" />
						<p className="text-sm font-medium">No orders found.</p>
						<p className="text-xs">Place your first order from the product catalog.</p>
						<Button asChild variant="outline" size="sm" className="mt-2 text-xs">
							<Link href="/customer/products">Browse Products</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Order ID</TableHead>
									<TableHead>Placed Date</TableHead>
									<TableHead>Products</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredOrders.map((o) => {
									const isPending = PENDING.includes(o.status ?? "");
									const isConfirmed = CONFIRMED.includes(o.status ?? "");

									return (
										<TableRow key={o.id}>
											<TableCell className="font-semibold text-foreground">
												{o.orderRef}
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{o.date ? new Date(o.date).toLocaleString() : "—"}
											</TableCell>
											<TableCell className="text-xs font-medium">
												{o.itemsCount} product(s)
											</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
														isConfirmed
															? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
															: isPending
																? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
																: "bg-muted text-muted-foreground"
													}`}
												>
													{STATUS_LABELS[o.status ?? ""] ?? o.status ?? "Pending"}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="outline"
													size="sm"
													className="text-xs"
													onClick={() => setSelectedOrderId(o.id)}
												>
													<EyeIcon className="mr-1 h-3.5 w-3.5" /> Details
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{/* Order Details & Timeline Dialog */}
			<Dialog open={selectedOrderId !== null} onOpenChange={() => setSelectedOrderId(null)}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Order Details — {orderDetail?.orderRef || `ORD-${selectedOrderId}`}</DialogTitle>
					</DialogHeader>

					{detailLoading || !orderDetail ? (
						<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs">
							Loading order details...
						</div>
					) : (
						<div className="space-y-5 text-sm">
							{/* Status Badge & Date */}
							<div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 p-3">
								<div>
									<p className="text-xs text-muted-foreground">Order Date</p>
									<p className="font-semibold text-xs">
										{orderDetail.date ? new Date(orderDetail.date).toLocaleString() : "—"}
									</p>
								</div>
								<span
									className={`rounded-full px-3 py-1 text-xs font-semibold ${
										CONFIRMED.includes(orderDetail.status ?? "")
											? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
											: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
									}`}
								>
									{STATUS_LABELS[orderDetail.status ?? ""] ?? orderDetail.status}
								</span>
							</div>

							{/* Status Timeline */}
							<div className="space-y-2">
								<p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
									Order Workflow Progress
								</p>
								<div className="grid gap-2 border-l-2 border-emerald-500/40 pl-4 text-xs">
									<div className="flex items-center gap-2">
										<CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
										<span className="font-medium">1. Order Submitted</span>
									</div>
									<div className="flex items-center gap-2">
										{orderDetail.status === "under_review" || CONFIRMED.includes(orderDetail.status ?? "") ? (
											<CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
										) : (
											<ClockIcon className="h-4 w-4 text-amber-500" />
										)}
										<span className="font-medium">2. Sales Team Reviewing</span>
									</div>
									<div className="flex items-center gap-2">
										{CONFIRMED.includes(orderDetail.status ?? "") ? (
											<CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
										) : (
											<ClockIcon className="h-4 w-4 text-muted-foreground opacity-40" />
										)}
										<span className="font-medium">3. Order Confirmed</span>
									</div>
								</div>
							</div>

							{/* Itemized Products */}
							<div className="space-y-2">
								<p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
									Ordered Products & Quantities
								</p>
								<div className="max-h-[200px] space-y-2 overflow-y-auto pr-1">
									{orderDetail.items.map((item) => (
										<div
											key={item.id}
											className="flex items-center justify-between gap-3 rounded-md border border-border/40 p-2.5 text-xs"
										>
											<div className="flex items-center gap-2">
												<PackageIcon className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium text-foreground">{item.name}</span>
											</div>
											<span className="font-semibold text-foreground">
												Quantity: {item.quantity}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
