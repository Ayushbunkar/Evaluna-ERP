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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	ArrowLeftIcon,
	CalendarIcon,
	ClockIcon,
	EyeIcon,
	FileTextIcon,
	IndianRupeeIcon,
	Loader2Icon,
	PackageIcon,
	PhoneIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldAlertIcon,
	UserIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function CancelledOrdersPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const [searchQuery, setSearchQuery] = useState("");
	const [viewingOrder, setViewingOrder] = useState<any>(null);

	const {
		data: cancelledOrders = [],
		isLoading,
		isFetching,
		refetch,
	} = trpc.orders.listCancelledOrders.useQuery({
		search: searchQuery || undefined,
	});

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6 lg:p-8">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
							<XCircleIcon className="h-5 w-5" />
						</div>
						<h1 className="font-bold text-2xl tracking-tight text-foreground sm:text-3xl">
							Cancelled Orders Archive
						</h1>
					</div>
					<p className="mt-1 text-muted-foreground text-sm">
						View all portal and counter orders cancelled by customers or sales team with preserved audit reasons.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isFetching}
						className="gap-1.5"
					>
						<RefreshCwIcon
							className={`h-4 w-4 ${isFetching ? "animate-spin text-rose-500" : ""}`}
						/>
						Refresh
					</Button>
					<Button size="sm" variant="default" asChild className="gap-1.5">
						<Link href="/sales/orders/review">
							<ArrowLeftIcon className="h-4 w-4" />
							Back to Active Review Queue
						</Link>
					</Button>
				</div>
			</div>

			{/* KPI Metric Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card className="border-border/60 bg-card/80 shadow-sm">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Total Cancelled Orders
								</p>
								<h3 className="mt-1.5 font-bold text-2xl text-foreground sm:text-3xl">
									{cancelledOrders.length}
								</h3>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
								<XCircleIcon className="h-6 w-6" />
							</div>
						</div>
						<p className="mt-2 text-muted-foreground text-xs">
							Archived & preserved with complete audit logs
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-card/80 shadow-sm">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Cancelled Value
								</p>
								<h3 className="mt-1.5 font-bold text-2xl text-rose-600 sm:text-3xl">
									₹
									{cancelledOrders
										.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
										.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
								</h3>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
								<IndianRupeeIcon className="h-6 w-6" />
							</div>
						</div>
						<p className="mt-2 text-muted-foreground text-xs">
							Gross value of cancelled customer orders
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-card/80 shadow-sm">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Audit Preservation
								</p>
								<div className="mt-1.5 flex items-center gap-1.5 font-bold text-emerald-600 text-lg sm:text-xl">
									<ShieldAlertIcon className="h-5 w-5" />
									<span>Protected Record</span>
								</div>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
								<FileTextIcon className="h-6 w-6" />
							</div>
						</div>
						<p className="mt-2 text-muted-foreground text-xs">
							Sales staff cannot permanently delete cancelled orders
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Cancelled Orders Table Card */}
			<Card className="border-border/60 shadow-sm">
				<CardHeader className="p-4 sm:p-6">
					<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div>
							<CardTitle className="font-bold text-lg text-foreground">
								Cancelled Orders List
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Click on any cancelled order to inspect its items and customer details.
							</CardDescription>
						</div>

						<div className="relative min-w-[260px]">
							<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search order ref, customer or phone..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="h-9 pl-9 text-xs"
							/>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex h-64 flex-col items-center justify-center gap-3">
							<Loader2Icon className="h-8 w-8 animate-spin text-rose-500" />
							<p className="font-medium text-muted-foreground text-sm">
								Loading cancelled orders archive...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40 hover:bg-muted/40">
										<TableHead className="font-semibold text-xs">Order Ref</TableHead>
										<TableHead className="font-semibold text-xs">Customer Name</TableHead>
										<TableHead className="font-semibold text-xs">Contact</TableHead>
										<TableHead className="font-semibold text-xs">Items</TableHead>
										<TableHead className="font-semibold text-xs">Total Amount</TableHead>
										<TableHead className="font-semibold text-xs">Cancellation Reason (कारण)</TableHead>
										<TableHead className="font-semibold text-xs">Cancelled Date</TableHead>
										<TableHead className="text-right font-semibold text-xs">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{cancelledOrders.map((o) => (
										<TableRow key={o.id} className="hover:bg-muted/20">
											<TableCell className="py-3 font-bold font-mono text-xs text-rose-600 dark:text-rose-400">
												{o.orderRef}
											</TableCell>

											<TableCell className="py-3 font-semibold text-foreground text-sm">
												{o.customer?.name || "Customer"}
											</TableCell>

											<TableCell className="py-3 text-xs">
												{o.customer?.phone ? (
													<a
														href={`tel:${o.customer.phone}`}
														className="text-emerald-600 hover:underline dark:text-emerald-400"
													>
														{o.customer.phone}
													</a>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>

											<TableCell className="py-3">
												<Badge variant="outline" className="text-xs">
													{o.items.length} item(s)
												</Badge>
											</TableCell>

											<TableCell className="py-3 font-mono font-semibold text-sm">
												₹{o.totalAmount.toFixed(2)}
											</TableCell>

											<TableCell className="py-3">
												<div className="max-w-[240px]">
													<span className="font-medium text-foreground text-xs">
														{o.cancelReason}
													</span>
													<div className="text-[11px] text-muted-foreground">
														By: {o.cancelledBy}
													</div>
												</div>
											</TableCell>

											<TableCell className="py-3 text-muted-foreground text-xs">
												{o.cancelledAt
													? new Date(o.cancelledAt).toLocaleString()
													: "N/A"}
											</TableCell>

											<TableCell className="py-3 text-right">
												<Button
													size="sm"
													variant="outline"
													onClick={() => setViewingOrder(o)}
													className="gap-1.5 text-xs shadow-xs"
												>
													<EyeIcon className="h-3.5 w-3.5" />
													View Details
												</Button>
											</TableCell>
										</TableRow>
									))}

									{cancelledOrders.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={8}
												className="py-12 text-center text-muted-foreground"
											>
												<XCircleIcon className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
												<p className="font-bold text-sm">No Cancelled Orders Found</p>
												<p className="text-xs">
													All orders are either active in review or completed.
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Cancelled Order Detail Modal */}
			<Dialog
				open={!!viewingOrder}
				onOpenChange={(open) => !open && setViewingOrder(null)}
			>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<XCircleIcon className="h-5 w-5 text-rose-500" />
							Cancelled Order Details ({viewingOrder?.orderRef})
						</DialogTitle>
						<DialogDescription>
							Complete snapshot of the customer order and cancellation audit record.
						</DialogDescription>
					</DialogHeader>

					{viewingOrder && (
						<div className="space-y-4 py-2">
							{/* Cancellation Audit Banner */}
							<div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3.5 text-xs dark:border-rose-900/50 dark:bg-rose-950/40">
								<div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
									<AlertTriangleIcon className="h-4 w-4 text-rose-600" />
									Cancellation Reason:
								</div>
								<p className="mt-1 font-medium text-rose-900 text-sm dark:text-rose-200">
									{viewingOrder.cancelReason}
								</p>
								<div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-[11px]">
									<span>Recorded by: {viewingOrder.cancelledBy}</span>
									<span>•</span>
									<span>
										Date:{" "}
										{viewingOrder.cancelledAt
											? new Date(viewingOrder.cancelledAt).toLocaleString()
											: "N/A"}
									</span>
								</div>
							</div>

							{/* Customer Info */}
							<div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
								<div>
									<span className="block text-muted-foreground">Customer Name</span>
									<span className="font-bold text-foreground text-sm">
										{viewingOrder.customer?.name || "Customer"}
									</span>
								</div>
								<div>
									<span className="block text-muted-foreground">Phone Number</span>
									<span className="font-semibold text-foreground">
										{viewingOrder.customer?.phone || "—"}
									</span>
								</div>
								{viewingOrder.customer?.address && (
									<div className="col-span-2">
										<span className="block text-muted-foreground">Address</span>
										<span className="text-foreground">
											{viewingOrder.customer?.address}
										</span>
									</div>
								)}
							</div>

							{/* Order Items Table */}
							<div>
								<h4 className="mb-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
									Ordered Line Items ({viewingOrder.items.length})
								</h4>
								<div className="max-h-56 overflow-y-auto rounded-md border">
									<Table>
										<TableHeader>
											<TableRow className="bg-muted/40 text-xs">
												<TableHead>Product</TableHead>
												<TableHead>SKU</TableHead>
												<TableHead className="text-right">Qty</TableHead>
												<TableHead className="text-right">Unit Price</TableHead>
												<TableHead className="text-right">Total</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{viewingOrder.items.map((it: any) => (
												<TableRow key={it.id} className="text-xs">
													<TableCell className="font-medium text-foreground">
														{it.name}
													</TableCell>
													<TableCell className="font-mono text-muted-foreground">
														{it.sku}
													</TableCell>
													<TableCell className="text-right font-semibold">
														{it.quantity} {it.unit}
													</TableCell>
													<TableCell className="text-right font-mono">
														₹{it.price.toFixed(2)}
													</TableCell>
													<TableCell className="text-right font-mono font-bold">
														₹{(it.price * it.quantity).toFixed(2)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>

							{/* Total Footer */}
							<div className="flex justify-between border-t pt-2 text-sm">
								<span className="font-semibold text-muted-foreground">
									Order Value
								</span>
								<span className="font-bold font-mono text-base text-foreground">
									₹{viewingOrder.totalAmount.toFixed(2)}
								</span>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setViewingOrder(null)}
							className="text-xs"
						>
							Close Details
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
