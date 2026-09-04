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
	BarChart3Icon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	TrendingUpIcon,
} from "lucide-react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AnalyticsPage() {
	const trpc = useTRPC();

	// Queries
	const { data: stats, isLoading: statsLoading } =
		trpc.warehouse.getOverviewStats.useQuery({});
	const { data: genStats } = trpc.warehouse.getStats.useQuery({
		branch_id: undefined,
	});

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div>
				<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
					WMS Throughput & Workload Analytics
				</h2>
				<p className="text-muted-foreground text-sm">
					Monitor operational backlogs, SLA compliance index, and worker
					efficiency KPIs.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-4">
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Backlog Items
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
							{statsLoading
								? "..."
								: (stats?.ordersWaiting ?? 0) +
									(stats?.receivingQueue ?? 0)}{" "}
							units
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Pending inbound POs + pick lists
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-green-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							SLA compliance
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">98.4%</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							On-time delivery transit SLA rate
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-blue-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Operator Utilization
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-blue-600">89.5%</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Active worker task engagement rate
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-red-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Delayed Tasks
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-red-500">
							{statsLoading ? "..." : (stats?.delayedTasks ?? 0)} tasks
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Tasks past optimal fulfillment windows
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Hourly Workload Trend mockup */}
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle className="font-bold text-base">
							Daily Throughput Activity Trend
						</CardTitle>
						<CardDescription>
							Processed bulk units vs. target capacity by hour
						</CardDescription>
					</CardHeader>
					<CardContent className="flex h-[240px] items-end justify-between gap-2 pt-6">
						{[30, 45, 60, 80, 50, 65, 95, 75, 40, 20].map((val, i) => (
							<div
								key={i}
								className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
							>
								<div
									className="w-full rounded-t-sm bg-blue-500 transition-colors hover:bg-blue-600"
									style={{ height: `${val}%` }}
								/>
								<span className="font-semibold text-[9px] text-slate-400">
									{0 + i * 2}:00
								</span>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Task Completion Trend */}
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle className="font-bold text-base">
							WMS Task Category Backlog
						</CardTitle>
						<CardDescription>
							Current unallocated queues awaiting picker/putter actions
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 pt-4">
						<div className="space-y-1.5">
							<div className="flex justify-between font-semibold text-slate-700 text-xs">
								<span>Inbound Receiving</span>
								<span>{stats?.receivingQueue ?? 0} POs</span>
							</div>
							<div className="h-2 w-full rounded-full bg-slate-100">
								<div
									className="h-2 rounded-full bg-yellow-500"
									style={{ width: `${(stats?.receivingQueue || 0) * 10}%` }}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex justify-between font-semibold text-slate-700 text-xs">
								<span>Put-Away Placements</span>
								<span>{stats?.putAwayQueue ?? 0} tasks</span>
							</div>
							<div className="h-2 w-full rounded-full bg-slate-100">
								<div
									className="h-2 rounded-full bg-purple-500"
									style={{ width: `${(stats?.putAwayQueue || 0) * 10}%` }}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex justify-between font-semibold text-slate-700 text-xs">
								<span>Fulfillment Picking</span>
								<span>{stats?.pickingQueue ?? 0} lists</span>
							</div>
							<div className="h-2 w-full rounded-full bg-slate-100">
								<div
									className="h-2 rounded-full bg-orange-500"
									style={{ width: `${(stats?.pickingQueue || 0) * 10}%` }}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex justify-between font-semibold text-slate-700 text-xs">
								<span>Order Packing</span>
								<span>{stats?.packingQueue ?? 0} packages</span>
							</div>
							<div className="h-2 w-full rounded-full bg-slate-100">
								<div
									className="h-2 rounded-full bg-green-500"
									style={{ width: `${(stats?.packingQueue || 0) * 10}%` }}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
