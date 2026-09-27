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
	BarChart3Icon,
	BoxesIcon,
	CheckCircle2Icon,
	ClockIcon,
	FlameIcon,
	LayersIcon,
	Loader2Icon,
	PackageCheckIcon,
	RefreshCwIcon,
	TrendingUpIcon,
	TrophyIcon,
	UserCheckIcon,
	UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AnalyticsPage() {
	const trpc = useTRPC();

	// Live Real-Time Analytics Query
	const {
		data: analyticsData,
		isLoading: analyticsLoading,
		isRefetching,
		refetch,
	} = trpc.warehouse.getThroughputAnalytics.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});

	const { data: locationsList } = trpc.warehouse.getLocations.useQuery({});

	const maxBacklog = useMemo(() => {
		if (!analyticsData) return 10;
		return Math.max(
			analyticsData.receivingQueue,
			analyticsData.putAwayQueue,
			analyticsData.pickingQueue,
			analyticsData.packingQueue,
			1,
		);
	}, [analyticsData]);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							WMS Throughput & Workload Analytics
						</h2>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE REAL-TIME
						</span>
					</div>
					<p className="text-muted-foreground text-sm">
						Real-time operational backlogs, SLA compliance index, hourly fulfillment activity, and operator efficiency metrics.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="gap-1.5"
					>
						<RefreshCwIcon
							className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
						/>
						Sync
					</Button>
				</div>
			</div>

			{/* KPI Metric Overview Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* 1. Backlog Items */}
				<Card className="shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Backlog Items
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-slate-900 dark:text-slate-100">
							{analyticsLoading ? (
								<Loader2Icon className="h-7 w-7 animate-spin text-muted-foreground" />
							) : (
								`${analyticsData?.backlogUnits ?? 0} units`
							)}
						</div>
						<p className="mt-1 text-[11px] text-muted-foreground">
							Active POs + Pick Lists + Put-Aways
						</p>
					</CardContent>
				</Card>

				{/* 2. SLA Compliance Rate */}
				<Card className="border-l-4 border-l-emerald-500 shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							SLA Compliance
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-emerald-600 dark:text-emerald-400">
							{analyticsLoading ? (
								<Loader2Icon className="h-7 w-7 animate-spin text-muted-foreground" />
							) : (
								`${analyticsData?.slaCompliancePercent ?? 100}%`
							)}
						</div>
						<p className="mt-1 text-[11px] text-muted-foreground">
							On-time fulfillment SLA compliance index
						</p>
					</CardContent>
				</Card>

				{/* 3. Operator Utilization */}
				<Card className="border-l-4 border-l-blue-500 shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Operator Utilization
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-blue-600 dark:text-blue-400">
							{analyticsLoading ? (
								<Loader2Icon className="h-7 w-7 animate-spin text-muted-foreground" />
							) : (
								`${analyticsData?.operatorUtilizationPercent ?? 0}%`
							)}
						</div>
						<p className="mt-1 text-[11px] text-muted-foreground">
							Active worker task engagement rate
						</p>
					</CardContent>
				</Card>

				{/* 4. Delayed Tasks */}
				<Card
					className={`border-l-4 shadow-sm ${
						(analyticsData?.delayedTasks ?? 0) > 0
							? "border-l-red-500 bg-red-50/20 dark:bg-red-950/10"
							: "border-l-slate-300"
					}`}
				>
					<CardHeader className="pb-2">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Delayed Tasks
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`font-bold text-3xl ${
								(analyticsData?.delayedTasks ?? 0) > 0
									? "text-red-600 dark:text-red-400"
									: "text-slate-700 dark:text-slate-300"
							}`}
						>
							{analyticsLoading ? (
								<Loader2Icon className="h-7 w-7 animate-spin text-muted-foreground" />
							) : (
								`${analyticsData?.delayedTasks ?? 0} tasks`
							)}
						</div>
						<p className="mt-1 text-[11px] text-muted-foreground">
							Tasks past optimal SLA window (&gt;2 hrs)
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Core Activity Charts & Backlogs */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* 1. Daily Hourly Throughput Activity Trend */}
				<Card className="shadow-sm">
					<CardHeader className="border-b pb-4">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="font-bold text-base text-slate-900 dark:text-slate-100">
									Daily Throughput Activity Trend
								</CardTitle>
								<CardDescription>
									Real completed item picks & packages processed by hour today
								</CardDescription>
							</div>
							<Badge variant="outline" className="text-xs font-mono">
								Today: {analyticsData?.completedToday ?? 0} processed
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="pt-6">
						{analyticsLoading ? (
							<div className="flex h-[240px] items-center justify-center">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : (
							<div className="flex h-[240px] items-end justify-between gap-1.5 sm:gap-2">
								{analyticsData?.hourlyChart?.map((item, idx) => (
									<div
										key={idx}
										className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5"
									>
										{/* Hover Tooltip */}
										<div className="pointer-events-none absolute -top-8 rounded bg-slate-900 px-2 py-0.5 text-[10px] text-white opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-slate-100 dark:text-slate-900">
											{item.volume} units
										</div>

										<div
											className={`w-full rounded-t-sm transition-all duration-300 ${
												item.volume > 0
													? "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
													: "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800"
											}`}
											style={{ height: `${item.heightPercent}%` }}
										/>
										<span className="font-semibold text-[9px] text-slate-400">
											{item.label}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* 2. Task Category Backlog */}
				<Card className="shadow-sm">
					<CardHeader className="border-b pb-4">
						<div>
							<CardTitle className="font-bold text-base text-slate-900 dark:text-slate-100">
								WMS Task Category Backlog
							</CardTitle>
							<CardDescription>
								Live unallocated and active workflow queues awaiting operator actions
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent className="space-y-4 pt-5">
						{analyticsLoading ? (
							<div className="flex h-[200px] items-center justify-center">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : (
							<>
								{/* Inbound Receiving */}
								<div className="space-y-1.5">
									<div className="flex justify-between font-semibold text-slate-700 text-xs dark:text-slate-300">
										<span className="flex items-center gap-1.5">
											<span className="h-2 w-2 rounded-full bg-yellow-500" />
											Inbound Receiving
										</span>
										<span className="font-mono font-bold">
											{analyticsData?.receivingQueue ?? 0} POs
										</span>
									</div>
									<div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
										<div
											className="h-full rounded-full bg-yellow-500 transition-all duration-500"
											style={{
												width: `${Math.min(100, Math.max(4, ((analyticsData?.receivingQueue || 0) / maxBacklog) * 100))}%`,
											}}
										/>
									</div>
								</div>

								{/* Put-Away Placements */}
								<div className="space-y-1.5">
									<div className="flex justify-between font-semibold text-slate-700 text-xs dark:text-slate-300">
										<span className="flex items-center gap-1.5">
											<span className="h-2 w-2 rounded-full bg-purple-500" />
											Put-Away Placements
										</span>
										<span className="font-mono font-bold">
											{analyticsData?.putAwayQueue ?? 0} tasks
										</span>
									</div>
									<div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
										<div
											className="h-full rounded-full bg-purple-500 transition-all duration-500"
											style={{
												width: `${Math.min(100, Math.max(4, ((analyticsData?.putAwayQueue || 0) / maxBacklog) * 100))}%`,
											}}
										/>
									</div>
								</div>

								{/* Fulfillment Picking */}
								<div className="space-y-1.5">
									<div className="flex justify-between font-semibold text-slate-700 text-xs dark:text-slate-300">
										<span className="flex items-center gap-1.5">
											<span className="h-2 w-2 rounded-full bg-orange-500" />
											Fulfillment Picking
										</span>
										<span className="font-mono font-bold">
											{analyticsData?.pickingQueue ?? 0} lists
										</span>
									</div>
									<div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
										<div
											className="h-full rounded-full bg-orange-500 transition-all duration-500"
											style={{
												width: `${Math.min(100, Math.max(4, ((analyticsData?.pickingQueue || 0) / maxBacklog) * 100))}%`,
											}}
										/>
									</div>
								</div>

								{/* Order Packing */}
								<div className="space-y-1.5">
									<div className="flex justify-between font-semibold text-slate-700 text-xs dark:text-slate-300">
										<span className="flex items-center gap-1.5">
											<span className="h-2 w-2 rounded-full bg-emerald-500" />
											Order Packing & Checking
										</span>
										<span className="font-mono font-bold">
											{analyticsData?.packingQueue ?? 0} packages
										</span>
									</div>
									<div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
										<div
											className="h-full rounded-full bg-emerald-500 transition-all duration-500"
											style={{
												width: `${Math.min(100, Math.max(4, ((analyticsData?.packingQueue || 0) / maxBacklog) * 100))}%`,
											}}
										/>
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Leaderboard & Velocity Insights */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Top Velocity Products */}
				<Card className="shadow-sm">
					<CardHeader className="border-b pb-4">
						<div className="flex items-center gap-2">
							<FlameIcon className="h-4 w-4 text-orange-500" />
							<CardTitle className="font-bold text-base">
								Top Product Fulfillment Velocity
							</CardTitle>
						</div>
						<CardDescription>
							Highest volume SKU movements across depot picklists
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{analyticsData?.topProducts && analyticsData.topProducts.length > 0 ? (
							<div className="divide-y">
								{analyticsData.topProducts.map((p, i) => (
									<div
										key={p.id || i}
										className="flex items-center justify-between p-3.5 hover:bg-muted/20"
									>
										<div className="flex items-center gap-3">
											<span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-xs dark:bg-slate-800 dark:text-slate-300">
												#{i + 1}
											</span>
											<div>
												<p className="font-bold text-slate-900 text-xs dark:text-slate-100">
													{p.name}
												</p>
												<span className="font-mono text-[10px] text-muted-foreground">
													SKU: {p.sku}
												</span>
											</div>
										</div>
										<div className="text-right">
											<span className="font-bold text-primary text-xs">
												{p.picked} units picked
											</span>
											<p className="text-[10px] text-muted-foreground">
												{p.ordered} ordered
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="py-12 text-center text-muted-foreground text-xs">
								<BoxesIcon className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700" />
								No item picks recorded yet today.
							</div>
						)}
					</CardContent>
				</Card>

				{/* Operator Productivity Leaderboard */}
				<Card className="shadow-sm">
					<CardHeader className="border-b pb-4">
						<div className="flex items-center gap-2">
							<TrophyIcon className="h-4 w-4 text-yellow-500" />
							<CardTitle className="font-bold text-base">
								Operator Productivity Leaderboard
							</CardTitle>
						</div>
						<CardDescription>
							Top completed warehouse task executions
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{analyticsData?.operatorLeaderboard &&
						analyticsData.operatorLeaderboard.length > 0 ? (
							<div className="divide-y">
								{analyticsData.operatorLeaderboard.map((op, i) => (
									<div
										key={op.id || i}
										className="flex items-center justify-between p-3.5 hover:bg-muted/20"
									>
										<div className="flex items-center gap-3">
											<span
												className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs ${
													i === 0
														? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
														: i === 1
															? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
															: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
												}`}
											>
												#{i + 1}
											</span>
											<div>
												<p className="font-bold text-slate-900 text-xs dark:text-slate-100">
													{op.name}
												</p>
												<span className="text-[10px] text-muted-foreground capitalize">
													{op.role || "Operator"}
												</span>
											</div>
										</div>
										<div className="text-right">
											<span className="font-bold text-emerald-600 text-xs dark:text-emerald-400">
												{op.completedPicks} tasks
											</span>
											<p className="text-[10px] text-muted-foreground">
												Fulfilled
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="py-12 text-center text-muted-foreground text-xs">
								<UsersIcon className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700" />
								No operator completions recorded today.
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
