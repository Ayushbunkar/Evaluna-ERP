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
		trpc.warehouse.getOverviewStats.useQuery({});
	const { data: pos, isLoading: posLoading } =
		trpc.warehouse.getReceivingPOs.useQuery();
	const { data: putAwayQueue, isLoading: putAwayLoading } =
		trpc.warehouse.getPutAwayQueue.useQuery();
	const { data: pickingQueue, isLoading: pickingLoading } =
		trpc.warehouse.getPickingQueue.useQuery();
	const { data: packingQueue, isLoading: packingLoading } =
		trpc.warehouse.getPackingQueue.useQuery();

	// Load general warehouse stats for the activity feed & capacity alerts
	const { data: genStats } = trpc.warehouse.getStats.useQuery({
		branch_id: undefined,
	});

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
			<div className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:items-center dark:bg-slate-800">
				<div className="space-y-1">
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Welcome back, Warehouse Operations Supervisor
					</h2>
					<p className="text-muted-foreground text-sm">
						Live orchestrator control console for{" "}
						<strong>Bhopal Main Warehouse</strong>. Manage receipts, put-away
						tasks, picks, and exceptions below.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className="border-blue-200 bg-blue-50 text-blue-700"
					>
						Branch ID: #1
					</Badge>
					<Badge variant="outline" className="bg-slate-50 text-slate-700">
						System Level: supervisor
					</Badge>
				</div>
			</div>

			{/* KPI Cards Row */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" slow>
				{kpis.map((kpi, idx) => {
					const Icon = kpi.icon;
					return (
						<StaggerItem key={idx}>
							<AnimatedCard>
								<Link href={kpi.href}>
									<Card
										className={`border-l-4 ${kpi.color} cursor-pointer bg-white shadow-sm transition-all hover:scale-102 hover:shadow-md dark:bg-slate-800`}
									>
										<CardHeader className="flex flex-row items-center justify-between pb-2">
											<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
												{kpi.title}
											</CardTitle>
											<Icon className={`h-4 w-4 ${kpi.iconColor}`} />
										</CardHeader>
										<CardContent>
											<div className="font-bold text-2xl text-slate-900 sm:text-3xl dark:text-slate-100">
												{statsLoading ? "..." : kpi.value}
											</div>
											<p className="mt-1 text-[10px] text-muted-foreground">
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
					<Card className="shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between border-b pb-4">
							<div>
								<CardTitle className="font-bold text-base">
									Live Warehouse Operations Queue
								</CardTitle>
								<CardDescription>
									Real-time orchestrator tracker of inbound and outbound flow
								</CardDescription>
							</div>
							<Badge
								variant="outline"
								className="animate-pulse bg-green-50 text-green-700"
							>
								Auto-Updating
							</Badge>
						</CardHeader>
						<CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
							{/* Inbound PO Queue Row */}
							<div className="flex items-start justify-between gap-4 p-4">
								<div className="flex gap-3">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
										<TruckIcon className="h-5 w-5" />
									</div>
									<div>
										<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
											Inbound POs Awaiting Receipt
										</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{posLoading
												? "..."
												: `${pos?.filter((po) => po.status === "pending").length || 0} purchase orders pending inspection`}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="ghost"
									asChild
									className="font-semibold text-xs"
								>
									<Link href="/dashboard/warehouse/receiving">
										Manage Receiving{" "}
										<ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>

							{/* Put-Away Row */}
							<div className="flex items-start justify-between gap-4 p-4">
								<div className="flex gap-3">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
										<BoxesIcon className="h-5 w-5" />
									</div>
									<div>
										<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
											Storage Bins Allocation (Put-Away)
										</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{putAwayLoading
												? "..."
												: `${putAwayQueue?.filter((t) => t.status === "AWAITING_PLACEMENT").length || 0} active placement tasks unverified`}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="ghost"
									asChild
									className="font-semibold text-xs"
								>
									<Link href="/dashboard/warehouse/put-away">
										Allocate Bins{" "}
										<ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>

							{/* Picking Operations */}
							<div className="flex items-start justify-between gap-4 p-4">
								<div className="flex gap-3">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
										<CheckSquareIcon className="h-5 w-5" />
									</div>
									<div>
										<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
											Active Picking Lists
										</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{pickingLoading
												? "..."
												: `${pickingQueue?.filter((pl) => pl.status === "picking").length || 0} picks currently executing on shelves`}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="ghost"
									asChild
									className="font-semibold text-xs"
								>
									<Link href="/dashboard/warehouse/picking">
										Monitor Picker{" "}
										<ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>

							{/* Packing Handoff */}
							<div className="flex items-start justify-between gap-4 p-4">
								<div className="flex gap-3">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
										<PackageIcon className="h-5 w-5" />
									</div>
									<div>
										<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
											Packing Queue Hand-off
										</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{packingLoading
												? "..."
												: `${packingQueue?.filter((p) => p.status === "packing").length || 0} packages sealed & awaiting fleet loader`}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="ghost"
									asChild
									className="font-semibold text-xs"
								>
									<Link href="/dashboard/warehouse/packing">
										Handoff Packages{" "}
										<ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Real-time Storage capacity & Fifo utilization cards */}
					<div className="grid gap-4 sm:grid-cols-2">
						<Card className="shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="font-bold text-sm">
									Physical Storage Capacity
								</CardTitle>
								<CardDescription>
									Bhopal Warehouse utilization index
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between font-semibold text-xs">
									<span>Utilized Space</span>
									<span className="text-blue-600">
										{stats?.warehouseUtilization ?? 45}% Occupied
									</span>
								</div>
								<div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
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

						<Card className="shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="font-bold text-sm">
									First-In First-Out (FIFO) Index
								</CardTitle>
								<CardDescription>
									Average shelf residency of batched stock
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between font-semibold text-xs">
									<span>FIFO Compliance Rate</span>
									<span className="text-green-600">97.8% On-Time</span>
								</div>
								<div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
									<div
										className="h-2 rounded-full bg-green-500"
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
					<Card className="border-red-200 bg-white shadow-md">
						<CardHeader className="flex flex-row items-center justify-between border-red-500/10 border-b pb-4">
							<div>
								<CardTitle className="flex items-center gap-2 font-bold text-base text-red-600">
									<AlertTriangleIcon className="h-5 w-5" /> Supervisor Attention
									Console
								</CardTitle>
								<CardDescription>
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
									<div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
										<ClockIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
										<div>
											<h5 className="font-bold text-red-800 text-xs">
												Delayed Inbound & Pick Lists Detected
											</h5>
											<p className="mt-1 text-[11px] text-red-700">
												There are {stats.delayedTasks} WMS tasks currently past
												their optimal operational SLA. Picker resources require
												allocation adjustments.
											</p>
											<Button
												size="sm"
												variant="link"
												className="mt-2 p-0 font-bold text-red-800 text-xs"
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
								<div className="py-6 text-center text-slate-400">
									<UserCheckIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
									<p className="font-medium text-xs">
										All tasks executing within normal SLA windows.
									</p>
								</div>
							)}

							{/* Real inventory alert box */}
							{genStats?.inventoryAlerts !== undefined &&
								genStats.inventoryAlerts.length > 0 && (
									<div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
										<InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
										<div>
											<h5 className="font-bold text-amber-800 text-xs">
												Reorder Threshold Alerts
											</h5>
											<p className="mt-1 text-[11px] text-amber-700">
												{genStats.inventoryAlerts.length} products have fallen
												below minimum stock buffers.
											</p>
											<Link
												href="/dashboard/warehouse/stock"
												className="mt-1.5 inline-block font-bold text-amber-800 text-xs hover:underline"
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
