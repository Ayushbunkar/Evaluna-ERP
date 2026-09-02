"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	FileTextIcon,
	TrendingUpIcon,
	Loader2Icon,
	ShieldCheckIcon,
	UsersIcon,
	ClockIcon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PutterReportsPage() {
	const trpc = useTRPC();
	const { data: reports, isLoading, error } = trpc.putter.getReports.useQuery({});
	const { data: stats } = trpc.putter.getDashboardStats.useQuery({});

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
					<FileTextIcon className="h-7 w-7 text-blue-600" />
					Putter Efficiency & Placement Reports
				</h1>
				<p className="text-muted-foreground text-sm">
					Warehouse put-away velocity, receiving turnaround duration, accuracy metrics, and staff leaderboard.
				</p>
			</div>

			{/* KPI Summary Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Put-Away Efficiency</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{stats?.efficiencyPct ?? 100}%</p>
								</div>
								<TrendingUpIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Put-Away Queue</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{stats?.putAwayQueue ?? 0}</p>
								</div>
								<ShieldCheckIcon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-amber-700 dark:text-amber-400">Missing Stock Audits</p>
									<p className="text-3xl font-bold text-amber-800 dark:text-amber-300">{stats?.missingStock ?? 0}</p>
								</div>
								<ClockIcon className="h-8 w-8 text-amber-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-red-700 dark:text-red-400">Damage Reports</p>
									<p className="text-3xl font-bold text-red-800 dark:text-red-300">{stats?.damageReports ?? 0}</p>
								</div>
								<FileTextIcon className="h-8 w-8 text-red-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Staff Leaderboard */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<UsersIcon className="h-4 w-4 text-blue-600" />
						Putter Staff Performance Leaderboard
					</CardTitle>
					<CardDescription>Individual put-away metrics and completion hours for the last 30 days</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" /> Loading reports...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading putter performance reports"}
						</div>
					) : !reports || reports.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<UsersIcon className="h-10 w-10 opacity-30 text-blue-500" />
							<p>No putaway staff logs recorded for this period.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Putter Employee</TableHead>
										<TableHead>Completed Tasks</TableHead>
										<TableHead>Avg Completion Time</TableHead>
										<TableHead>Efficiency Rate</TableHead>
										<TableHead>Evaluation Period</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reports.map((r, idx) => (
										<TableRow key={idx} className="hover:bg-muted/50">
											<TableCell className="font-semibold text-sm">{r.employeeName}</TableCell>
											<TableCell className="text-sm font-medium">{r.tasksDone} tasks</TableCell>
											<TableCell className="font-mono text-xs text-muted-foreground">
												{r.avgCompletionHours.toFixed(1)} hours
											</TableCell>
											<TableCell>
												<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
													{r.efficiencyPct}%
												</span>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">{r.period}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
