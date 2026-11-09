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
	CheckCircle2Icon,
	ClockIcon,
	DownloadIcon,
	Loader2Icon,
	PackageCheckIcon,
	PackagePlusIcon,
	RotateCcwIcon,
	TrendingUpIcon,
	TruckIcon,
	XCircleIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const PutterTrendChart = dynamic(
	() => import("@/components/charts/putter-chart"),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-[280px] w-full items-center justify-center text-muted-foreground text-sm animate-pulse bg-muted/10 rounded-md">
				Loading chart...
			</div>
		),
	},
);

export default function PutterDashboard() {
	const trpc = useTRPC();
	const {
		data: stats,
		isLoading,
		error,
	} = trpc.putter.getDashboardStats.useQuery({});
	const { data: putAwayTasks, isLoading: loadingTasks } =
		trpc.putter.getPutAwayTasks.useQuery({});

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl flex items-center gap-2.5">
						<PackagePlusIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
						Putter & Warehouse Put-Away Hub
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Verify incoming supplier procurement goods, process sales & driver van returns, and restock rejected manifests to warehouse inventory.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700 font-semibold"
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
					{/* 6 Real Database Overview Cards (Section 4.A) */}
					<StaggerList
						className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
						slow
					>
						{/* 1. Total Pending Putaway */}
						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-blue-200/80 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20 shadow-sm transition-all hover:shadow-md hover:border-blue-400"
									onClick={() => (window.location.href = "/putter/put-away")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110">
												<PackagePlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Total Pending Putaway
											</p>
											<p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
												{stats?.totalPendingPutaway ?? stats?.putAwayQueue ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						{/* 2. Supplier Inward Pending */}
						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-sky-200/80 bg-sky-50/40 dark:border-sky-900/50 dark:bg-sky-950/20 shadow-sm transition-all hover:shadow-md hover:border-sky-400"
									onClick={() => (window.location.href = "/putter/put-away?source=SUPPLIER_GRN")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 transition-transform group-hover:scale-110">
												<DownloadIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Supplier Inward (GRN)
											</p>
											<p className="font-bold text-2xl text-sky-600 dark:text-sky-400">
												{stats?.supplierInwardPending ?? stats?.itemsToReceive ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						{/* 3. Van Returns & Rejections Pending */}
						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-purple-200/80 bg-purple-50/40 dark:border-purple-900/50 dark:bg-purple-950/20 shadow-sm transition-all hover:shadow-md hover:border-purple-400"
									onClick={() => (window.location.href = "/putter/put-away?source=VAN_RETURN")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition-transform group-hover:scale-110">
												<TruckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Van Returns & Restock
											</p>
											<p className="font-bold text-2xl text-purple-600 dark:text-purple-400">
												{(stats?.vanReturnsPending ?? 0) + (stats?.vanRejectionsPending ?? 0)}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						{/* 4. Partially Completed Tasks */}
						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20 shadow-sm transition-all hover:shadow-md hover:border-amber-400"
									onClick={() => (window.location.href = "/putter/put-away?source=ALL")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 transition-transform group-hover:scale-110">
												<ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Partially Completed
											</p>
											<p className="font-bold text-2xl text-amber-600 dark:text-amber-400">
												{stats?.partiallyCompletedTasks ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						{/* 5. Completed Today */}
						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20 shadow-sm transition-all hover:shadow-md hover:border-emerald-400"
									onClick={() => (window.location.href = "/putter/completed")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 transition-transform group-hover:scale-110">
												<CheckCircle2Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Completed Today
											</p>
											<p className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
												{stats?.completedToday ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>

						{/* 6. Discrepancies & Issues */}
						<StaggerItem>
							<AnimatedCard>
								<Card
									className="group cursor-pointer border-rose-200/80 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20 shadow-sm transition-all hover:shadow-md hover:border-rose-400"
									onClick={() => (window.location.href = "/putter/damage")}
								>
									<CardContent className="p-4">
										<div className="flex flex-col items-center gap-1 text-center">
											<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 transition-transform group-hover:scale-110">
												<AlertTriangleIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
											</div>
											<p className="font-semibold text-muted-foreground text-xs">
												Discrepancies / Issues
											</p>
											<p className="font-bold text-2xl text-rose-600 dark:text-rose-400">
												{stats?.discrepanciesCount ?? stats?.damageReports ?? 0}
											</p>
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>
					</StaggerList>

					{/* Live Pending Queue Section */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b">
							<div>
								<CardTitle className="flex items-center gap-2 text-base font-bold">
									<PackagePlusIcon className="h-5 w-5 text-blue-600" />
									Active Put-Away Queue
								</CardTitle>
								<CardDescription className="text-xs">
									Pending physical verification, location selection, and warehouse stock additions
								</CardDescription>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
								asChild
							>
								<Link href="/putter/put-away">
									View Full Put-Away Workspace <ArrowRightIcon className="h-3.5 w-3.5" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-4">
							{loadingTasks ? (
								<div className="flex h-32 items-center justify-center gap-2 text-muted-foreground text-sm">
									<Loader2Icon className="h-4 w-4 animate-spin text-blue-600" /> Loading pending tasks...
								</div>
							) : !putAwayTasks || putAwayTasks.length === 0 ? (
								<div className="flex h-32 flex-col items-center justify-center gap-1.5 text-muted-foreground text-center">
									<CheckCircle2Icon className="h-8 w-8 text-emerald-500 opacity-60" />
									<p className="font-semibold text-sm text-foreground">Put-Away Queue is all clear!</p>
									<p className="text-xs">No pending goods requiring warehouse shelf placement.</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="text-xs">
												<TableHead>Source & Reference</TableHead>
												<TableHead>Product Name</TableHead>
												<TableHead>SKU</TableHead>
												<TableHead className="text-right">Quantity</TableHead>
												<TableHead>Dock / Bay</TableHead>
												<TableHead>Target Storage Bin</TableHead>
												<TableHead>Condition</TableHead>
												<TableHead className="text-right">Action</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{putAwayTasks.slice(0, 5).map((task: any) => (
												<TableRow key={task.id} className="hover:bg-muted/40 text-xs">
													<TableCell className="font-medium">
														<div className="font-mono text-xs font-semibold text-primary">
															{task.sourceReference || task.id}
														</div>
														<div className="text-[10px] text-muted-foreground capitalize">
															{task.sourceType?.replace(/_/g, " ") || "Inward"}
														</div>
													</TableCell>
													<TableCell className="font-semibold text-foreground">
														{task.product}
													</TableCell>
													<TableCell className="font-mono text-muted-foreground">
														{task.sku}
													</TableCell>
													<TableCell className="font-bold text-right text-blue-600 dark:text-blue-400">
														{task.qty} units
													</TableCell>
													<TableCell className="text-muted-foreground">
														{task.from}
													</TableCell>
													<TableCell className="font-medium text-emerald-700 dark:text-emerald-400">
														{task.to_location}
													</TableCell>
													<TableCell>
														<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
															{task.condition || "USABLE"}
														</span>
													</TableCell>
													<TableCell className="text-right">
														<Button
															size="sm"
															className="h-7 text-xs bg-blue-600 text-white hover:bg-blue-700"
															asChild
														>
															<Link href="/putter/put-away">
																Shelve Item
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

					{/* Receiving & Put Away Trend Chart */}
					{stats?.chartData && stats.chartData.length > 0 && (
						<Card className="border-border/50 shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 font-bold text-base">
									<TrendingUpIcon className="h-5 w-5 text-blue-600" />
									Receiving & Put Away Trend (Last 7 Days)
								</CardTitle>
								<CardDescription className="text-xs">
									Daily throughput comparison of incoming shipments vs items physically shelved into warehouse stock.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<PutterTrendChart data={stats.chartData} />
							</CardContent>
						</Card>
					)}
				</>
			)}
		</PageTransition>
	);
}
