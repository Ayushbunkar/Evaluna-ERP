"use client";

import { Badge } from "@evaluna/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	AlertTriangleIcon,
	BarChart3Icon,
	ClipboardListIcon,
	Loader2Icon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ProcurementAnalyticsPage() {
	const trpc = useTRPC();

	// Query real analytics from database
	const { data, isLoading } = trpc.purchases.getAnalytics.useQuery();

	if (isLoading) {
		return (
			<div className="flex h-[80vh] items-center justify-center">
				<Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
			</div>
		);
	}

	const {
		totalSpend = 0,
		activeSuppliersCount = 0,
		openPOsCount = 0,
		avgLeadTimeDays = 0,
		outlayTrend = [],
		suppliersMetric = [],
		onTimeRate = 100,
		lowStockCount = 0,
		lowStockItems = [],
	} = data || {};

	// Find max outlay to scale chart bars nicely
	const maxOutlay = Math.max(...outlayTrend.map((t) => t.amount), 1);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div>
				<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
					Procurement Spend & Partner Analytics
				</h2>
				<p className="text-muted-foreground text-sm">
					Overview lead-times, total purchase volumes, and partner delivery
					performance ratios.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-4">
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Total Outlay Spend
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-slate-900 text-xl dark:text-slate-100">
							₹
							{totalSpend.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Accumulated ledger expenditure
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-green-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Supplier On-Time Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{onTimeRate}%
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							SLA on-time delivery ratio
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-blue-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Active Supply Channels
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-blue-600">
							{activeSuppliersCount} channels
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Active supplier partners registered
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-yellow-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Expected Receipts
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-yellow-600">
							{openPOsCount} batches
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Expected inbound deliveries in transit
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Monthly Outlay trend */}
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle className="font-bold text-base">
							Monthly Purchase Outlay Trend
						</CardTitle>
						<CardDescription>
							Processed procurement capital volumes by month
						</CardDescription>
					</CardHeader>
					<CardContent className="flex h-[240px] items-end justify-between gap-2 pt-6">
						{outlayTrend.map((t, i) => {
							const pct = (t.amount / maxOutlay) * 100;
							return (
								<div
									key={i}
									className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5"
								>
									<div className="pointer-events-none absolute bottom-16 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
										₹{t.amount.toLocaleString()}
									</div>
									<div
										className="w-full rounded-t-sm bg-blue-500 transition-colors hover:bg-blue-600"
										style={{ height: `${Math.max(pct, 4)}%` }}
									/>
									<span className="whitespace-nowrap font-semibold text-[9px] text-slate-400">
										{t.label}
									</span>
								</div>
							);
						})}
						{outlayTrend.length === 0 && (
							<div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
								No monthly transactional data available.
							</div>
						)}
					</CardContent>
				</Card>

				{/* Lead time statistics summary */}
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle className="font-bold text-base">
							Supplier Spend & Lead-Time Metrics
						</CardTitle>
						<CardDescription>
							Real transit compliance from purchase issues
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 pt-4">
						<div className="flex items-center justify-between border-b pb-2 font-semibold text-slate-700 text-xs dark:text-slate-300">
							<span>Overall procurement on-time rate</span>
							<span className="font-bold text-blue-600">
								{onTimeRate}% accuracy
							</span>
						</div>
						<div className="flex items-center justify-between border-b pb-2 font-semibold text-slate-700 text-xs dark:text-slate-300">
							<span>Average purchase lead time</span>
							<span className="font-bold text-green-600">
								{avgLeadTimeDays > 0
									? `${avgLeadTimeDays} Days`
									: "No completed GRNs yet"}
							</span>
						</div>

						<div className="pt-2">
							<span className="font-bold text-slate-500 text-xs uppercase tracking-wider">
								Top Suppliers Spend
							</span>
							<div className="mt-2 space-y-2">
								{suppliersMetric.map((sm, idx) => (
									<div
										key={idx}
										className="flex items-center justify-between text-xs"
									>
										<span className="font-medium text-slate-600 dark:text-slate-400">
											{sm.name} ({sm.poCount} POs)
										</span>
										<span className="font-bold text-slate-800 dark:text-slate-200">
											₹{sm.spend.toLocaleString()}
										</span>
									</div>
								))}
								{suppliersMetric.length === 0 && (
									<div className="text-muted-foreground text-xs">
										No supplier spend data recorded.
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Low stock alerts section */}
			<Card className="border-l-4 border-l-red-500 shadow-sm">
				<CardHeader className="flex flex-row items-center gap-2 pb-2">
					<AlertTriangleIcon className="h-5 w-5 text-red-500" />
					<div>
						<CardTitle className="font-bold text-base">
							Procurement Shortage & Low-Stock Alerts
						</CardTitle>
						<CardDescription>
							Items below minimum threshold (10 units) needing urgent purchase
							orders
						</CardDescription>
					</div>
					{lowStockCount > 0 && (
						<Badge variant="destructive" className="ml-auto">
							{lowStockCount} Critical
						</Badge>
					)}
				</CardHeader>
				<CardContent>
					{lowStockItems.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead>
									<tr className="border-b text-slate-500">
										<th className="pb-2 font-semibold">Product Name</th>
										<th className="pb-2 font-semibold">SKU Code</th>
										<th className="pb-2 text-right font-semibold">
											In-Stock Quantity
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{lowStockItems.map((item, idx) => (
										<tr
											key={idx}
											className="text-slate-700 dark:text-slate-300"
										>
											<td className="py-2">{item.productName}</td>
											<td className="py-2 font-mono">{item.sku}</td>
											<td className="py-2 text-right font-bold text-red-600">
												{item.inStock} units
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className="py-2 text-muted-foreground text-sm">
							All inventory levels are currently above minimum critical
							thresholds. No actions required.
						</p>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
