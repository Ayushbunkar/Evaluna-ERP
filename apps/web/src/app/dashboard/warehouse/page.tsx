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
	ActivityIcon,
	AlertTriangleIcon,
	ArrowRightIcon,
	BoxesIcon,
	CheckSquareIcon,
	ClipboardListIcon,
	ClockIcon,
	ExternalLinkIcon,
	InfoIcon,
	PackageIcon,
	TrendingUpIcon,
	TruckIcon,
	UserCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function WMSDashboardOverview() {
	const trpc = useTRPC();

	// Queries
	const { data: stats, isLoading: statsLoading } =
		trpc.warehouse.getOverviewStats.useQuery(
			{},
			{
				refetchInterval: 15000,
				refetchOnWindowFocus: true,
			},
		);

	// Load general warehouse stats for the activity feed & capacity alerts
	const { data: genStats } = trpc.warehouse.getStats.useQuery(
		{
			branch_id: undefined,
		},
		{
			refetchInterval: 30000,
			refetchOnWindowFocus: true,
		},
	);

	const kpis = [
		{
			title: "Orders Waiting",
			value: stats?.ordersWaiting ?? 0,
			desc: "Awaiting pick allocation",
			icon: ClipboardListIcon,
			color: "border-l-blue-500",
			iconColor: "text-blue-500",
			href: "/dashboard/warehouse/picking",
		},
		{
			title: "Inbound Receiving",
			value: stats?.receivingQueue ?? 0,
			desc: "Expected POs in queue",
			icon: TruckIcon,
			color: "border-l-yellow-500",
			iconColor: "text-yellow-500",
			href: "/dashboard/warehouse/receiving",
		},
		{
			title: "Put-Away Tasks",
			value: stats?.putAwayQueue ?? 0,
			desc: "Items pending placement",
			icon: BoxesIcon,
			color: "border-l-purple-500",
			iconColor: "text-purple-500",
			href: "/dashboard/warehouse/put-away",
		},
		{
			title: "Picking Operations",
			value: stats?.pickingQueue ?? 0,
			desc: "Active picking checklists",
			icon: CheckSquareIcon,
			color: "border-l-orange-500",
			iconColor: "text-orange-500",
			href: "/dashboard/warehouse/picking",
		},
		{
			title: "Packing Queue",
			value: stats?.packingQueue ?? 0,
			desc: "Ready for box sealing",
			icon: PackageIcon,
			color: "border-l-green-500",
			iconColor: "text-green-500",
			href: "/dashboard/warehouse/packing",
		},
	];

	return (
		<PageTransition className="container mx-auto space-y-6 p-4 sm:p-6">
			{/* Welcome Banner */}
			<div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card/90 p-6 shadow-xs backdrop-blur-md md:flex-row md:items-center">
				<div className="space-y-1">
					<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
						Warehouse Operations Console
					</h1>
					<p className="text-muted-foreground text-sm">
						Live orchestrator control console for{" "}
						<strong className="text-foreground">Bhopal Main Warehouse</strong>. Manage receipts, put-away
						tasks, picks, and exceptions below.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className="border-primary/20 bg-primary/10 font-bold text-primary text-xs"
					>
						Branch ID: #1
					</Badge>
					<Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground text-xs font-semibold">
						Role: Operations Supervisor
					</Badge>
				</div>
			</div>

			{/* KPI Cards Row — Single line on desktop */}
			<StaggerList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-3.5" slow>
				{kpis.map((kpi, idx) => {
					const Icon = kpi.icon;
					return (
						<StaggerItem key={idx}>
							<AnimatedCard>
								<Link href={kpi.href} className="block h-full">
									<Card
										className={`h-full border-l-4 ${kpi.color} cursor-pointer border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:scale-[1.02] hover:border-border hover:shadow-md`}
									>
										<CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 sm:p-4 sm:pb-2">
											<CardTitle className="font-semibold text-muted-foreground text-[11px] sm:text-xs uppercase tracking-wider truncate">
												{kpi.title}
											</CardTitle>
											<Icon className={`h-4 w-4 shrink-0 ${kpi.iconColor}`} />
										</CardHeader>
										<CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
											<div className="font-bold text-2xl text-foreground sm:text-3xl tracking-tight">
												{statsLoading ? "..." : kpi.value}
											</div>
											<p className="mt-1 text-[11px] text-muted-foreground truncate">
												{kpi.desc}
											</p>
										</CardContent>
									</Card>
								</Link>
							</AnimatedCard>
						</StaggerItem>
					);
				})}
			</StaggerList>

			{/* Operational Control center Workspace Grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left Column: Live Operational Queues */}
				<div className="space-y-6 lg:col-span-2">
					<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
						<CardHeader className="flex flex-row items-center justify-between border-border/60 border-b pb-4">
							<div>
								<CardTitle className="font-bold text-base text-foreground">
									Live Warehouse Operations Queue
								</CardTitle>
								<CardDescription className="text-muted-foreground text-xs">
									Real-time orchestrator tracker of inbound dock flow, bin placement, and order fulfillment
								</CardDescription>
							</div>
							<Badge
								variant="outline"
								className="border-emerald-500/20 bg-emerald-500/10 font-semibold text-emerald-600 text-xs dark:text-emerald-400"
							>
								Live Auto-Updating
							</Badge>
						</CardHeader>
						<CardContent className="divide-y divide-border/60 p-0">
							{/* Inbound PO Queue Row */}
							<div className="flex items-start justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
								<div className="flex gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
										<TruckIcon className="h-5 w-5" />
									</div>
									<div>
										<h4 className="font-bold text-foreground text-sm">
											Inbound POs Awaiting Receipt
										</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{statsLoading
												? "..."
												: `${stats?.receivingQueue || 0} purchase orders pending inspection`}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="ghost"
									asChild
									className="font-semibold text-xs text-foreground hover:bg-muted"
								>
									<Link href="/dashboard/warehouse/receiving">
										Manage Receiving{" "}
										<ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>

							{/* Put-Away Row */}
							<div className="flex items-start justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
								<div className="flex gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
										<BoxesIcon className="h-5 w-5" />
									</div>
									<div>
										<h4 className="font-bold text-foreground text-sm">
											Storage Bins Allocation (Put-Away)
										</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{statsLoading
												? "..."
												: `${stats?.putAwayQueue || 0} active placement tasks unverified`}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="ghost"
									asChild
									className="font-semibold text-xs text-foreground hover:bg-muted"
								>
									<Link href="/dashboard/warehouse/put-away">
										Allocate Bins{" "}
										<ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>

							{/* Picking Operations */}
							<div className="flex items-start justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
								<div className="flex gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
										<CheckSquareIcon className="h-5 w-5" />
									</div>
									<div>
										<h4 className="font-bold text-foreground text-sm">
											Active Picking Lists
										</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{statsLoading
												? "..."
												: `${stats?.pickingQueue || 0} picks currently executing on shelves`}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="ghost"
									asChild
									className="font-semibold text-xs text-foreground hover:bg-muted"
								>
									<Link href="/dashboard/warehouse/picking">
										Monitor Picker{" "}
										<ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>

							{/* Packing Handoff */}
							<div className="flex items-start justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
								<div className="flex gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
										<PackageIcon className="h-5 w-5" />
									</div>
									<div>
										<h4 className="font-bold text-foreground text-sm">
											Packing Queue Hand-off
										</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{statsLoading
												? "..."
												: `${stats?.packingQueue || 0} packages sealed & awaiting fleet loader`}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="ghost"
									asChild
									className="font-semibold text-xs text-foreground hover:bg-muted"
								>
									<Link href="/dashboard/warehouse/packing">
										Manage Packing{" "}
										<ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Real-time Storage capacity & Fifo utilization cards */}
					<div className="grid gap-4 sm:grid-cols-2">
						<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
							<CardHeader className="pb-3 border-border/60 border-b">
								<CardTitle className="font-bold text-sm text-foreground">
									Physical Storage Capacity
								</CardTitle>
								<CardDescription className="text-muted-foreground text-xs">
									Bhopal Warehouse utilization index
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 pt-4">
								<div className="flex items-center justify-between font-semibold text-xs">
									<span className="text-muted-foreground">Utilized Space</span>
									<span className="text-blue-600 dark:text-blue-400 font-bold">
										{stats?.warehouseUtilization ?? 45}% Occupied
									</span>
								</div>
								<div className="h-2 w-full rounded-full bg-muted">
									<div
										className="h-2 rounded-full bg-blue-600 transition-all"
										style={{ width: `${stats?.warehouseUtilization ?? 45}%` }}
									/>
								</div>
								<div className="flex items-center justify-between text-[10px] text-muted-foreground">
									<span>Available capacity: 500 bins</span>
									<span>
										Empty bins:{" "}
										{500 -
											Math.round(
												(500 * (stats?.warehouseUtilization ?? 45)) / 100,
											)}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
							<CardHeader className="pb-3 border-border/60 border-b">
								<CardTitle className="font-bold text-sm text-foreground">
									First-In First-Out (FIFO) Index
								</CardTitle>
								<CardDescription className="text-muted-foreground text-xs">
									Average shelf residency of batched stock
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 pt-4">
								<div className="flex items-center justify-between font-semibold text-xs">
									<span className="text-muted-foreground">FIFO Compliance Rate</span>
									<span className="text-emerald-600 dark:text-emerald-400 font-bold">97.8% On-Time</span>
								</div>
								<div className="h-2 w-full rounded-full bg-muted">
									<div
										className="h-2 rounded-full bg-emerald-500"
										style={{ width: "97.8%" }}
									/>
								</div>
								<p className="text-[10px] text-muted-foreground">
									Minimal aging stock. Operator batch rotations are executing
									optimally.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Right Column: Supervisor Critical Attention Console */}
				<div className="space-y-6">
					<Card className="border-rose-500/30 bg-card/90 shadow-xs backdrop-blur-md">
						<CardHeader className="flex flex-row items-center justify-between border-rose-500/20 border-b pb-4">
							<div>
								<CardTitle className="flex items-center gap-2 font-bold text-base text-rose-600 dark:text-rose-400">
									<AlertTriangleIcon className="h-5 w-5" /> Supervisor Attention Console
								</CardTitle>
								<CardDescription className="text-muted-foreground text-xs">
									Delayed tasks or inventory anomalies
								</CardDescription>
							</div>
							{stats?.delayedTasks !== undefined && stats.delayedTasks > 0 && (
								<Badge variant="destructive" className="animate-pulse">
									{stats.delayedTasks} Alerts
								</Badge>
							)}
						</CardHeader>
						<CardContent className="space-y-4 p-4">
							{stats?.delayedTasks !== undefined && stats.delayedTasks > 0 ? (
								<div className="space-y-3">
									<div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-rose-800 dark:text-rose-300">
										<ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
										<div>
											<h5 className="font-bold text-xs">
												Delayed Inbound & Pick Lists Detected
											</h5>
											<p className="mt-1 text-[11px] leading-relaxed text-rose-700/90 dark:text-rose-300/80">
												There are {stats.delayedTasks} WMS tasks currently past
												their optimal operational SLA. Picker resources require
												allocation adjustments.
											</p>
											<Button
												size="sm"
												variant="link"
												className="mt-2 p-0 font-bold text-rose-700 dark:text-rose-300 text-xs"
												asChild
											>
												<Link href="/dashboard/warehouse/exceptions">
													Investigate Discrepancies{" "}
													<ArrowRightIcon className="ml-1 h-3 w-3" />
												</Link>
											</Button>
										</div>
									</div>
								</div>
							) : (
								<div className="py-6 text-center text-muted-foreground">
									<UserCheckIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
									<p className="font-medium text-xs">
										All tasks executing within normal SLA windows.
									</p>
								</div>
							)}

							{/* Real inventory alert box */}
							{genStats?.inventoryAlerts !== undefined &&
								genStats.inventoryAlerts.length > 0 && (
									<div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-amber-800 dark:text-amber-300">
										<InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
										<div>
											<h5 className="font-bold text-xs">
												Reorder Threshold Alerts
											</h5>
											<p className="mt-1 text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-300/80">
												{genStats.inventoryAlerts.length} products have fallen
												below minimum stock buffers.
											</p>
											<Link
												href="/dashboard/warehouse/stock"
												className="mt-1.5 inline-block font-bold text-amber-700 dark:text-amber-300 text-xs hover:underline"
											>
												View Stock Ledger →
											</Link>
										</div>
									</div>
								)}
						</CardContent>
					</Card>

					{/* Activity Logs card */}
					<Card className="shadow-sm">
						<CardHeader className="border-b pb-3">
							<CardTitle className="font-bold text-sm">
								WMS Live Activity Trail
							</CardTitle>
							<CardDescription>
								Most recent immutable audit-trail operations
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 pt-4">
							<div className="max-h-[220px] divide-y divide-slate-100 overflow-y-auto px-4">
								{genStats?.recentActivity &&
								genStats.recentActivity.length > 0 ? (
									genStats.recentActivity.slice(0, 5).map((act, i) => (
										<div
											key={i}
											className="flex items-start justify-between gap-3 py-2.5"
										>
											<div className="flex gap-2">
												<span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
												<div className="space-y-0.5">
													<p className="font-medium text-[11px] text-slate-800 dark:text-slate-200">
														{act.action}
													</p>
													<p className="text-[10px] text-slate-400">
														Operator: {act.user}
													</p>
												</div>
											</div>
											<span className="whitespace-nowrap text-[10px] text-slate-400">
												{act.time}
											</span>
										</div>
									))
								) : (
									<p className="py-6 text-center text-muted-foreground text-xs">
										No recent audit log entries.
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</PageTransition>
	);
}
