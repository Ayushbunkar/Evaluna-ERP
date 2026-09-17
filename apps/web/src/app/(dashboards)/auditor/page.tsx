"use client";

import { useState } from "react";
import Link from "next/link";
import {
	ActivityIcon,
	AlertTriangleIcon,
	ArrowRightIcon,
	BarcodeIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	ClockIcon,
	EyeIcon,
	FileBarChartIcon,
	PackageIcon,
	PlayIcon,
	PlusIcon,
	RefreshCwIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	ShieldIcon,
	TrendingUpIcon,
} from "lucide-react";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AuditorDashboard() {
	const trpc = useTRPC();
	const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);

	// Load KPI stats
	const {
		data: stats,
		isLoading: statsLoading,
		refetch: refetchStats,
	} = trpc.audit.getDashboardStats.useQuery(
		{ branchId: selectedBranchId },
		{
			refetchInterval: 30000,
			refetchOnWindowFocus: false,
		},
	);

	// Load active / recent audits
	const {
		data: audits,
		isLoading: auditsLoading,
		refetch: refetchAudits,
	} = trpc.audit.listAudits.useQuery({
		branchId: selectedBranchId,
	});

	const pendingCount = stats?.pendingAudits ?? 0;
	const inProgressCount = stats?.inProgress ?? 0;
	const completedCount = stats?.completedAudits ?? 0;
	const varianceCount = stats?.varianceFound ?? 0;
	const accuracyRate = stats?.accuracyRate ?? 100;

	return (
		<PageTransition className="space-y-6">
			{/* Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
							<ShieldIcon className="h-5 w-5" />
						</span>
						<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
							Auditor Dashboard
						</h1>
					</div>
					<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
						Inventory oversight, physical count verification, and discrepancy auditing
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetchStats();
							refetchAudits();
						}}
						className="text-xs"
					>
						<RefreshCwIcon className="mr-1.5 h-3.5 w-3.5" /> Refresh
					</Button>
					<Button size="sm" asChild className="text-xs bg-blue-600 hover:bg-blue-700">
						<Link href="/auditor/tasks">
							<ClipboardListIcon className="mr-1.5 h-3.5 w-3.5" /> View All Tasks
						</Link>
					</Button>
				</div>
			</div>

			{/* 4 Primary KPI Cards Required by Prompt */}
			<StaggerList className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				{/* 1. Pending Audits */}
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/60 bg-card shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-700">
							<CardContent className="p-4 sm:p-5">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
											Pending Audits
										</p>
										<p className="mt-1 font-bold text-2xl sm:text-3xl text-foreground">
											{statsLoading ? "..." : pendingCount}
										</p>
										<p className="mt-1 text-[11px] text-muted-foreground">
											Awaiting physical count
										</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
										<ClockIcon className="h-6 w-6" />
									</div>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				{/* 2. In Progress */}
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/60 bg-card shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-700">
							<CardContent className="p-4 sm:p-5">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
											In Progress
										</p>
										<p className="mt-1 font-bold text-2xl sm:text-3xl text-blue-600 dark:text-blue-400">
											{statsLoading ? "..." : inProgressCount}
										</p>
										<p className="mt-1 text-[11px] text-muted-foreground">
											Actively being counted
										</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
										<ActivityIcon className="h-6 w-6" />
									</div>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				{/* 3. Completed */}
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/60 bg-card shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-700">
							<CardContent className="p-4 sm:p-5">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
											Completed Audits
										</p>
										<p className="mt-1 font-bold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
											{statsLoading ? "..." : completedCount}
										</p>
										<p className="mt-1 text-[11px] text-muted-foreground">
											Reconciled & finalized
										</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
										<CheckCircle2Icon className="h-6 w-6" />
									</div>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				{/* 4. Variance Found */}
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/60 bg-card shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-700">
							<CardContent className="p-4 sm:p-5">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
											Variance Found
										</p>
										<p className="mt-1 font-bold text-2xl sm:text-3xl text-rose-600 dark:text-rose-400">
											{statsLoading ? "..." : varianceCount}
										</p>
										<p className="mt-1 text-[11px] text-muted-foreground">
											Requires reconciliation
										</p>
									</div>
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
										<AlertTriangleIcon className="h-6 w-6" />
									</div>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Accuracy Banner & Quick Action Shortcuts */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card className="border-border/60 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 p-5">
					<div className="flex items-start justify-between">
						<div>
							<span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
								Overall Stock Health
							</span>
							<h3 className="mt-1 text-2xl font-bold text-foreground">
								{accuracyRate}% Accuracy
							</h3>
							<p className="mt-1 text-xs text-muted-foreground">
								Based on {stats?.totalAudits ?? 0} audited records across all warehouse locations.
							</p>
						</div>
						<div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
							<TrendingUpIcon className="h-6 w-6" />
						</div>
					</div>
					<div className="mt-4 flex gap-2">
						<Button size="sm" variant="outline" asChild className="text-xs flex-1">
							<Link href="/auditor/findings">
								<ShieldAlertIcon className="mr-1 h-3.5 w-3.5 text-rose-500" /> View Discrepancies
							</Link>
						</Button>
						<Button size="sm" variant="outline" asChild className="text-xs flex-1">
							<Link href="/auditor/history">
								<FileBarChartIcon className="mr-1 h-3.5 w-3.5 text-indigo-500" /> Audit History
							</Link>
						</Button>
					</div>
				</Card>

				<Card className="border-border/60 bg-card p-5 lg:col-span-2">
					<h3 className="text-sm font-semibold text-foreground">Quick Action Workspaces</h3>
					<p className="text-xs text-muted-foreground">
						Jump into specific warehouse verification tasks
					</p>
					<div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
						<Link
							href="/auditor/tasks"
							className="group flex flex-col items-center justify-center rounded-lg border border-border/60 bg-muted/30 p-3 text-center transition-all hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
						>
							<ClipboardListIcon className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
							<span className="mt-1.5 text-xs font-medium text-foreground">Stock Count Tasks</span>
						</Link>
						<Link
							href="/auditor/upc"
							className="group flex flex-col items-center justify-center rounded-lg border border-border/60 bg-muted/30 p-3 text-center transition-all hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20"
						>
							<BarcodeIcon className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
							<span className="mt-1.5 text-xs font-medium text-foreground">UPC Verification</span>
						</Link>
						<Link
							href="/auditor/receiving"
							className="group flex flex-col items-center justify-center rounded-lg border border-border/60 bg-muted/30 p-3 text-center transition-all hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-900/20"
						>
							<PackageIcon className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
							<span className="mt-1.5 text-xs font-medium text-foreground">Receiving Inspection</span>
						</Link>
					</div>
				</Card>
			</div>

			{/* Active & Pending Audits Table */}
			<Card className="border-border/60 bg-card shadow-sm">
				<CardHeader className="flex flex-row items-center justify-between pb-3">
					<div>
						<CardTitle className="text-base sm:text-lg">Active & Pending Stock Audits</CardTitle>
						<CardDescription className="text-xs">
							Current inventory count assignments requiring auditor verification
						</CardDescription>
					</div>
					<Button variant="ghost" size="sm" asChild className="text-xs">
						<Link href="/auditor/tasks">
							View All ({audits?.length ?? 0}) <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
						</Link>
					</Button>
				</CardHeader>
				<CardContent className="p-0">
					{auditsLoading ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							Loading audit tasks...
						</div>
					) : !audits || audits.length === 0 ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							<ClipboardCheckIcon className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
							No active audit tasks found. All inventory locations are up to date!
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[80px]">Audit #</TableHead>
										<TableHead>Location / Type</TableHead>
										<TableHead>Branch / Warehouse</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Items Progress</TableHead>
										<TableHead>Discrepancies</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{audits.slice(0, 6).map((audit) => {
										const totalItems = audit.totalItemsCount ?? 0;
										const countedItems = audit.countedItemsCount ?? 0;
										const progressPct = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;
										const hasVariance = (audit.varianceItemsCount ?? 0) > 0;

										return (
											<TableRow key={audit.id} className="hover:bg-muted/50">
												<TableCell className="font-mono font-medium text-xs">
													#{audit.id}
												</TableCell>
												<TableCell>
													<div className="font-medium text-xs text-foreground">
														{audit.location_name || "Whole Warehouse"}
													</div>
													<div className="text-[11px] text-muted-foreground capitalize">
														{audit.audit_type?.replace("_", " ") || "Full Count"}
													</div>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{audit.branch?.name ?? `Branch #${audit.branch_id}`}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															audit.status === "completed" || audit.status === "approved"
																? "default"
																: audit.status === "in_progress"
																	? "secondary"
																	: audit.status === "discrepancy_review" || audit.status === "submitted"
																		? "outline"
																		: "outline"
														}
														className={
															audit.status === "completed" || audit.status === "approved"
																? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200"
																: audit.status === "in_progress"
																	? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200"
																	: audit.status === "discrepancy_review" || audit.status === "submitted"
																		? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200"
																		: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
														}
													>
														{audit.status?.replace("_", " ")}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="w-32">
														<div className="flex justify-between text-[11px] text-muted-foreground mb-1">
															<span>{countedItems} / {totalItems}</span>
															<span>{progressPct}%</span>
														</div>
														<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
															<div
																className={`h-full transition-all ${
																	progressPct === 100 ? "bg-emerald-500" : "bg-blue-500"
																}`}
																style={{ width: `${progressPct}%` }}
															/>
														</div>
													</div>
												</TableCell>
												<TableCell>
													{hasVariance ? (
														<span className="inline-flex items-center text-xs font-medium text-rose-600 dark:text-rose-400">
															<AlertTriangleIcon className="mr-1 h-3.5 w-3.5" />
															{audit.varianceItemsCount} items
														</span>
													) : (
														<span className="inline-flex items-center text-xs text-muted-foreground">
															<ShieldCheckIcon className="mr-1 h-3.5 w-3.5 text-emerald-500" />
															None
														</span>
													)}
												</TableCell>
												<TableCell className="text-right">
													{audit.status === "completed" || audit.status === "approved" ? (
														<Button size="sm" variant="ghost" asChild className="h-7 text-xs">
															<Link href={`/auditor/tasks/${audit.id}`}>
																<EyeIcon className="mr-1 h-3 w-3" /> View Summary
															</Link>
														</Button>
													) : (
														<Button size="sm" asChild className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
															<Link href={`/auditor/tasks/${audit.id}`}>
																<PlayIcon className="mr-1 h-3 w-3" />
																{audit.status === "in_progress" ? "Continue Count" : "Start Count"}
															</Link>
														</Button>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
