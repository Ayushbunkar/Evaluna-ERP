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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	CameraIcon,
	CheckCircle2Icon,
	DownloadIcon,
	Loader2Icon,
	PackagePlusIcon,
	RotateCcwIcon,
	TrendingUpIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PutterDashboard() {
	const trpc = useTRPC();
	const {
		data: stats,
		isLoading,
		error,
	} = trpc.putter.getDashboardStats.useQuery({});
	const { data: putAwayTasks } = trpc.putter.getPutAwayTasks.useQuery({});

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
						Putter & Warehouse Fulfillment Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Manage incoming receiving dock goods, shelf bin put-away, missing
						stock audits, and damaged items.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
						asChild
					>
						<Link href="/putter/put-away">
							<PackagePlusIcon className="h-4 w-4" /> Start Put-Away
						</Link>
					</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
					<Loader2Icon className="h-6 w-6 animate-spin text-blue-600" /> Loading
					dashboard stats...
				</div>
			) : error ? (
				<div className="flex h-40 items-center justify-center text-destructive">
					{error.message || "Error loading dashboard stats"}
				</div>
			) : (
				<>
					{/* KPI Summary Cards */}
					<StaggerList
						className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
						slow
					>
						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-border/50 bg-card/80 shadow-sm transition-all hover:shadow-md"
									onClick={() => (window.location.href = "/putter/receiving")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110">
												<DownloadIcon className="h-5 w-5 text-blue-600" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Items to Receive
											</p>
											<p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
												{stats?.itemsToReceive ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-border/50 bg-card/80 shadow-sm transition-all hover:shadow-md"
									onClick={() => (window.location.href = "/putter/put-away")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110">
												<PackagePlusIcon className="h-5 w-5 text-green-600" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Put-Away Queue
											</p>
											<p className="font-bold text-2xl text-green-600 dark:text-green-400">
												{stats?.putAwayQueue ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-border/50 bg-card/80 shadow-sm transition-all hover:shadow-md"
									onClick={() => (window.location.href = "/putter/missing")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 transition-transform group-hover:scale-110">
												<AlertTriangleIcon className="h-5 w-5 text-amber-600" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Missing Stock
											</p>
											<p className="font-bold text-2xl text-amber-600 dark:text-amber-400">
												{stats?.missingStock ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-border/50 bg-card/80 shadow-sm transition-all hover:shadow-md"
									onClick={() => (window.location.href = "/putter/damage")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 transition-transform group-hover:scale-110">
												<XCircleIcon className="h-5 w-5 text-red-600" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Damage Reports
											</p>
											<p className="font-bold text-2xl text-red-600 dark:text-red-400">
												{stats?.damageReports ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-border/50 bg-card/80 shadow-sm transition-all hover:shadow-md"
									onClick={() => (window.location.href = "/putter/returns")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition-transform group-hover:scale-110">
												<RotateCcwIcon className="h-5 w-5 text-purple-600" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Sale Returns
											</p>
											<p className="font-bold text-2xl text-purple-600 dark:text-purple-400">
												{stats?.saleReturns ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-border/50 bg-card/80 shadow-sm transition-all hover:shadow-md"
									onClick={() => (window.location.href = "/putter/reports")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110">
												<TrendingUpIcon className="h-5 w-5 text-blue-600" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Efficiency
											</p>
											<p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
												{stats?.efficiencyPct ?? 100}%
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>
					</StaggerList>

					{/* Receiving & Put Away Trend Chart */}
					{stats?.chartData && stats.chartData.length > 0 && (
						<Card className="border-border/50 shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 font-bold text-base">
									<TrendingUpIcon className="h-5 w-5 text-blue-600" />
									Receiving & Put Away Trend (Last 7 Days)
								</CardTitle>
								<CardDescription>
									Daily comparison of dock receipts vs completed bin put-aways
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="h-[280px] w-full">
									<ResponsiveContainer width="100%" height="100%">
										<LineChart
											data={stats.chartData}
											margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												vertical={false}
												stroke="hsl(var(--muted-foreground)/0.2)"
											/>
											<XAxis
												dataKey="date"
												axisLine={false}
												tickLine={false}
												tick={{
													fill: "hsl(var(--muted-foreground))",
													fontSize: 12,
												}}
												dy={10}
											/>
											<YAxis
												axisLine={false}
												tickLine={false}
												tick={{
													fill: "hsl(var(--muted-foreground))",
													fontSize: 12,
												}}
											/>
											<Tooltip
												contentStyle={{
													backgroundColor: "hsl(var(--card))",
													border: "1px solid hsl(var(--border))",
													borderRadius: "0.5rem",
													boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
												}}
											/>
											<Line
												type="monotone"
												dataKey="received"
												name="Goods Received"
												stroke="#2563eb"
												strokeWidth={3}
												dot={{ r: 4, strokeWidth: 2 }}
												activeDot={{ r: 6 }}
											/>
											<Line
												type="monotone"
												dataKey="putAway"
												name="Items Put Away"
												stroke="#16a34a"
												strokeWidth={3}
												dot={{ r: 4, strokeWidth: 2 }}
											/>
										</LineChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Recent Pending Put Away Queue */}
					<Card className="border-border/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<div>
								<CardTitle className="flex items-center gap-2 text-lg">
									<PackagePlusIcon className="h-5 w-5 text-blue-600" />
									Active Put-Away Queue
								</CardTitle>
								<CardDescription>
									Items waiting to be moved from receiving bay to warehouse
									shelf bins
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/putter/put-away">
									View All Queue <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent>
							{!putAwayTasks || putAwayTasks.length === 0 ? (
								<div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
									<CheckCircle2Icon className="h-8 w-8 text-green-500 opacity-30" />
									<span>No pending put-away tasks in queue right now</span>
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Task ID</TableHead>
												<TableHead>Product Name</TableHead>
												<TableHead>SKU</TableHead>
												<TableHead>Qty</TableHead>
												<TableHead>From Location</TableHead>
												<TableHead>Target Bin</TableHead>
												<TableHead className="text-right">Action</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{putAwayTasks.slice(0, 5).map((task) => (
												<TableRow key={task.id} className="hover:bg-muted/50">
													<TableCell className="font-mono font-semibold text-xs">
														{task.id}
													</TableCell>
													<TableCell className="font-bold text-sm">
														{task.product}
													</TableCell>
													<TableCell className="font-mono text-muted-foreground text-xs">
														{task.sku}
													</TableCell>
													<TableCell className="font-bold text-blue-600 text-sm dark:text-blue-400">
														{task.qty} units
													</TableCell>
													<TableCell className="text-muted-foreground text-xs">
														{task.from}
													</TableCell>
													<TableCell className="font-semibold text-green-600 text-xs dark:text-green-400">
														{task.to_location}
													</TableCell>
													<TableCell className="text-right">
														<Button
															size="sm"
															className="h-8 bg-blue-600 text-white hover:bg-blue-700"
															asChild
														>
															<Link href="/putter/put-away">
																<PackagePlusIcon className="mr-1 h-3.5 w-3.5" />{" "}
																Put Away
															</Link>
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</PageTransition>
	);
}
