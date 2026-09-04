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
	ActivityIcon,
	ClockIcon,
	FileBarChart,
	Loader2Icon,
	PackageIcon,
	ShieldCheckIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickerReportsPage() {
	const trpc = useTRPC();
	const {
		data: reports,
		isLoading,
		error,
	} = trpc.picker.getReports.useQuery({});
	const { data: stats } = trpc.picker.getDashboardStats.useQuery({});

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
					<FileBarChart className="h-7 w-7 text-blue-600" />
					Picker Performance & Fulfillment Reports
				</h1>
				<p className="text-muted-foreground text-sm">
					Order picking velocity, items picked metrics, team leaderboards, and
					accuracy analytics.
				</p>
			</div>

			{/* Summary Stat Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Total Items Picked
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{stats?.totalItemsPicked ?? 0}
									</p>
								</div>
								<PackageIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-green-700 text-sm dark:text-green-400">
										Completed Orders
									</p>
									<p className="font-bold text-3xl text-green-800 dark:text-green-300">
										{stats?.completed ?? 0}
									</p>
								</div>
								<TrendingUpIcon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-purple-700 text-sm dark:text-purple-400">
										Pick Accuracy
									</p>
									<p className="font-bold text-3xl text-purple-800 dark:text-purple-300">
										{stats?.pickAccuracy ?? 100}%
									</p>
								</div>
								<ShieldCheckIcon className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-sm text-yellow-700 dark:text-yellow-400">
										Queue Items
									</p>
									<p className="font-bold text-3xl text-yellow-800 dark:text-yellow-300">
										{stats?.pending ?? 0}
									</p>
								</div>
								<ClockIcon className="h-8 w-8 text-yellow-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Leaderboard & Reports Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<UsersIcon className="h-4 w-4 text-blue-600" />
						Picker Staff Performance Leaderboard
					</CardTitle>
					<CardDescription>
						Individual picking metrics for the last 30 days
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" />{" "}
							Loading reports...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading picker reports"}
						</div>
					) : !reports || reports.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<UsersIcon className="h-10 w-10 text-blue-500 opacity-30" />
							<p>No picker performance logs recorded for this period.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Picker Employee</TableHead>
										<TableHead>Completed Tasks</TableHead>
										<TableHead>Total Units Picked</TableHead>
										<TableHead>Accuracy Rate</TableHead>
										<TableHead>Evaluation Period</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reports.map((r, idx) => (
										<TableRow key={idx} className="hover:bg-muted/50">
											<TableCell className="font-semibold text-sm">
												{r.employeeName}
											</TableCell>
											<TableCell className="font-medium text-sm">
												{r.tasksDone} orders
											</TableCell>
											<TableCell className="font-bold text-blue-600 text-sm dark:text-blue-400">
												{r.totalItemsPicked} units
											</TableCell>
											<TableCell>
												<span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800 text-xs dark:bg-green-900/30 dark:text-green-400">
													{r.accuracyPct}%
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{r.period}
											</TableCell>
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
