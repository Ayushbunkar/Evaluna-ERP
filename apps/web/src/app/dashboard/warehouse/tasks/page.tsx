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
import { Input } from "@evaluna/ui/components/input";
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
	BarcodeIcon,
	BoxesIcon,
	CheckCircle2Icon,
	ClipboardListIcon,
	ClockIcon,
	FilterIcon,
	Loader2Icon,
	PackageCheckIcon,
	RefreshCwIcon,
	SearchIcon,
	UserCheckIcon,
	UserPlusIcon,
	UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

type TaskCategory = "all" | "picking" | "putaway" | "upc";
type StatusFilter = "all" | "pending" | "completed";

export default function TasksPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [categoryTab, setCategoryTab] = useState<TaskCategory>("all");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

	// Live Queries with real-time background sync
	const {
		data: pickingQueue,
		isLoading: pickingLoading,
		isRefetching: pickingRefetching,
		refetch: refetchPicking,
	} = trpc.warehouse.getPickingQueue.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});

	const {
		data: putAwayQueue,
		isLoading: putAwayLoading,
		isRefetching: putAwayRefetching,
		refetch: refetchPutAway,
	} = trpc.warehouse.getPutAwayQueue.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});

	const {
		data: upcTasksData,
		isLoading: upcTasksLoading,
		isRefetching: upcRefetching,
		refetch: refetchUpc,
	} = trpc.upc.listTasks.useQuery(
		{ pageSize: 50 },
		{
			refetchInterval: 15000,
			refetchOnWindowFocus: true,
		},
	);

	const { data: staffList } = trpc.staff.list.useQuery();
	const { data: pickerList } = trpc.staff.getPickers.useQuery();
	const { data: putterList } = trpc.staff.getPutters.useQuery();

	// Mutations for 1-Click Assignment & Reassignment
	const assignPickingMutation = trpc.warehouse.assignPickingTask.useMutation({
		onSuccess: () => {
			toast.success("Picking operator assigned successfully!");
			utils.warehouse.getPickingQueue.invalidate();
		},
		onError: (err) => {
			toast.error(`Picking assignment failed: ${err.message}`);
		},
	});

	const assignPutAwayMutation = trpc.warehouse.assignPutAwayTask.useMutation({
		onSuccess: () => {
			toast.success("Put-away operator assigned successfully!");
			utils.warehouse.getPutAwayQueue.invalidate();
		},
		onError: (err) => {
			toast.error(`Put-away assignment failed: ${err.message}`);
		},
	});

	const reassignUpcMutation = trpc.upc.reassignTask.useMutation({
		onSuccess: (data) => {
			toast.success(`UPC task assigned to ${data.assignedToName || "staff"}!`);
			utils.upc.listTasks.invalidate();
		},
		onError: (err) => {
			toast.error(`UPC task assignment failed: ${err.message}`);
		},
	});

	const handleRefreshAll = () => {
		refetchPicking();
		refetchPutAway();
		refetchUpc();
	};

	const isRefetching = pickingRefetching || putAwayRefetching || upcRefetching;
	const isLoading = pickingLoading || putAwayLoading || upcTasksLoading;

	// Build Unified Task List
	const combinedTasks = useMemo(() => {
		const tasks: Array<{
			id: string;
			rawId: number;
			category: "picking" | "putaway" | "upc";
			type: string;
			reference: string;
			status: string;
			operator: string | null;
			operatorId: number | null;
			priority: string;
			created_at: string;
		}> = [];

		if (pickingQueue) {
			pickingQueue.forEach((pl) => {
				tasks.push({
					id: `PL-${pl.id}`,
					rawId: pl.id,
					category: "picking",
					type: "Picking Checklist",
					reference: `ORD-${pl.order_id}${pl.customer_name ? ` (${pl.customer_name})` : ""}`,
					status: pl.status,
					operator: pl.worker_name || null,
					operatorId: pl.worker_id || null,
					priority: pl.priority || "normal",
					created_at: new Date(pl.created_at).toLocaleDateString(),
				});
			});
		}

		if (putAwayQueue) {
			putAwayQueue.forEach((pv) => {
				tasks.push({
					id: `PV-${pv.id}`,
					rawId: pv.id,
					category: "putaway",
					type: "Put-Away Placement",
					reference: pv.batch_number ? `Batch #${pv.batch_number}` : `Location #${pv.location_id}`,
					status: pv.status,
					operator: pv.worker_name || null,
					operatorId: pv.worker_id || null,
					priority: "normal",
					created_at: new Date(pv.created_at).toLocaleDateString(),
				});
			});
		}

		if (upcTasksData?.tasks) {
			upcTasksData.tasks.forEach((ut) => {
				tasks.push({
					id: `UPC-${ut.id}`,
					rawId: ut.id,
					category: "upc",
					type: `UPC ${ut.task_type.toUpperCase()}`,
					reference: ut.product_name
						? `${ut.product_name} (${ut.sku || "N/A"})`
						: ut.upc_value || "Barcode Task",
					status: ut.status,
					operator: ut.assigned_to_name || null,
					operatorId: ut.assigned_to || null,
					priority: ut.priority || "MEDIUM",
					created_at: ut.created_at
						? new Date(ut.created_at).toLocaleDateString()
						: "—",
				});
			});
		}

		return tasks;
	}, [pickingQueue, putAwayQueue, upcTasksData]);

	// KPI Stats
	const stats = useMemo(() => {
		const total = combinedTasks.length;
		const pickingCount = combinedTasks.filter((t) => t.category === "picking").length;
		const putAwayCount = combinedTasks.filter((t) => t.category === "putaway").length;
		const upcCount = combinedTasks.filter((t) => t.category === "upc").length;
		const unassignedCount = combinedTasks.filter((t) => !t.operator).length;
		return { total, pickingCount, putAwayCount, upcCount, unassignedCount };
	}, [combinedTasks]);

	// Filtered Tasks
	const filteredTasks = useMemo(() => {
		return combinedTasks.filter((t) => {
			// Category Tab
			if (categoryTab !== "all" && t.category !== categoryTab) {
				return false;
			}

			// Search Query
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase();
				const matchesSearch =
					t.id.toLowerCase().includes(query) ||
					t.type.toLowerCase().includes(query) ||
					t.reference.toLowerCase().includes(query) ||
					(t.operator && t.operator.toLowerCase().includes(query)) ||
					t.status.toLowerCase().includes(query);

				if (!matchesSearch) return false;
			}

			// Status Filter
			const st = t.status.toLowerCase();
			const isCompleted =
				st === "completed" || st === "verified" || st === "finished";

			if (statusFilter === "pending") {
				return !isCompleted;
			}
			if (statusFilter === "completed") {
				return isCompleted;
			}

			return true;
		});
	}, [combinedTasks, categoryTab, searchQuery, statusFilter]);

	// Handler to assign operator based on task category
	const handleAssign = async (
		task: (typeof combinedTasks)[number],
		staffIdStr: string,
	) => {
		if (!staffIdStr) return;
		const staffId = Number.parseInt(staffIdStr, 10);
		if (Number.isNaN(staffId)) return;

		if (task.category === "picking") {
			await assignPickingMutation.mutateAsync({
				pickListId: task.rawId,
				workerId: staffId,
			});
		} else if (task.category === "putaway") {
			await assignPutAwayMutation.mutateAsync({
				placementId: task.rawId,
				workerId: staffId,
			});
		} else if (task.category === "upc") {
			await reassignUpcMutation.mutateAsync({
				taskId: task.rawId,
				newAssignedTo: staffId,
			});
		}
	};

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							Centralized WMS Task Manager
						</h2>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE REAL-TIME
						</span>
					</div>
					<p className="text-muted-foreground text-sm">
						Unified task orchestration: assign operators, monitor SLA priorities,
						and manage picking, put-away, and barcode verification.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search task #, operator, ref..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={handleRefreshAll}
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

			{/* KPI Metric Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${categoryTab === "all" ? "border-primary ring-1 ring-primary" : ""}`}
					onClick={() => setCategoryTab("all")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
							<ClipboardListIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Total Tasks</p>
							<p className="font-bold text-slate-900 text-xl dark:text-slate-100">
								{stats.total}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${categoryTab === "picking" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
					onClick={() => setCategoryTab("picking")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
							<BoxesIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Picking</p>
							<p className="font-bold text-blue-600 text-xl dark:text-blue-400">
								{stats.pickingCount}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${categoryTab === "putaway" ? "border-purple-500 ring-1 ring-purple-500" : ""}`}
					onClick={() => setCategoryTab("putaway")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
							<PackageCheckIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Put-Away</p>
							<p className="font-bold text-purple-600 text-xl dark:text-purple-400">
								{stats.putAwayCount}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${categoryTab === "upc" ? "border-teal-500 ring-1 ring-teal-500" : ""}`}
					onClick={() => setCategoryTab("upc")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
							<BarcodeIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">UPC Tasks</p>
							<p className="font-bold text-teal-600 text-xl dark:text-teal-400">
								{stats.upcCount}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md col-span-2 sm:col-span-4 lg:col-span-1 ${statusFilter === "pending" && stats.unassignedCount > 0 ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20" : ""}`}
					onClick={() => {
						setStatusFilter("pending");
					}}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
							<AlertTriangleIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Unassigned</p>
							<p className="font-bold text-amber-700 text-xl dark:text-amber-400">
								{stats.unassignedCount}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Task Ledger Table Card */}
			<Card className="shadow-sm">
				<CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="font-bold text-base">
							WMS Task Ledger
						</CardTitle>
						<CardDescription>
							Consolidated audit log and operator allocation across all warehouse workflows
						</CardDescription>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* Category Tabs */}
						<div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
							<Button
								variant={categoryTab === "all" ? "default" : "ghost"}
								size="sm"
								onClick={() => setCategoryTab("all")}
								className="h-7 text-xs"
							>
								All ({stats.total})
							</Button>
							<Button
								variant={categoryTab === "picking" ? "default" : "ghost"}
								size="sm"
								onClick={() => setCategoryTab("picking")}
								className="h-7 text-xs"
							>
								Picking ({stats.pickingCount})
							</Button>
							<Button
								variant={categoryTab === "putaway" ? "default" : "ghost"}
								size="sm"
								onClick={() => setCategoryTab("putaway")}
								className="h-7 text-xs"
							>
								Put-Away ({stats.putAwayCount})
							</Button>
							<Button
								variant={categoryTab === "upc" ? "default" : "ghost"}
								size="sm"
								onClick={() => setCategoryTab("upc")}
								className="h-7 text-xs"
							>
								UPC ({stats.upcCount})
							</Button>
						</div>

						{/* Status Filter */}
						<select
							className="h-8 cursor-pointer rounded-md border border-input bg-background px-2 font-semibold text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
						>
							<option value="all">All Statuses</option>
							<option value="pending">Pending / Active</option>
							<option value="completed">Completed / Verified</option>
						</select>
					</div>
				</CardHeader>

				<CardContent className="p-0 sm:p-6">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							<p className="mt-2 text-muted-foreground text-xs">
								Loading WMS tasks ledger...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="w-[120px]">Task Reference</TableHead>
										<TableHead>Category Type</TableHead>
										<TableHead>Lot / Order / UPC Ref</TableHead>
										<TableHead>SLA Priority</TableHead>
										<TableHead className="min-w-[200px]">Assigned Operator</TableHead>
										<TableHead>Creation Date</TableHead>
										<TableHead className="text-right">Execution State</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredTasks.map((t) => {
										const isCompleted =
											t.status.toLowerCase() === "completed" ||
											t.status.toLowerCase() === "verified";

										const categoryBadgeColor =
											t.category === "picking"
												? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
												: t.category === "putaway"
													? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
													: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300";

										return (
											<TableRow key={t.id} className="hover:bg-muted/20">
												{/* Task ID */}
												<TableCell className="font-mono font-bold text-slate-900 text-xs dark:text-slate-100">
													{t.id}
												</TableCell>

												{/* Category */}
												<TableCell>
													<span
														className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold text-[11px] ${categoryBadgeColor}`}
													>
														{t.type}
													</span>
												</TableCell>

												{/* Reference */}
												<TableCell className="max-w-[220px] truncate font-medium text-xs">
													{t.reference}
												</TableCell>

												{/* SLA Priority */}
												<TableCell>
													<Badge
														variant={
															t.priority.toLowerCase() === "high" ||
															t.priority.toLowerCase() === "urgent"
																? "destructive"
																: "secondary"
														}
														className={
															t.priority.toLowerCase() === "urgent"
																? "animate-pulse"
																: ""
														}
													>
														{t.priority}
													</Badge>
												</TableCell>

												{/* Assigned Operator Column with Avatar and 1-Click Reassign */}
												<TableCell>
													{t.operator ? (
														<div className="flex items-center gap-2">
															<span
																className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-sm ${
																	t.category === "picking"
																		? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
																		: t.category === "putaway"
																			? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
																			: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
																}`}
															>
																{t.operator.charAt(0).toUpperCase()}
															</span>
															<div className="flex flex-col">
																<span className="font-semibold text-slate-800 text-xs dark:text-slate-200">
																	{t.operator}
																</span>
																{!isCompleted && (
																	<select
																		className="cursor-pointer bg-transparent text-[10px] text-muted-foreground underline hover:text-foreground focus:outline-none"
																		value=""
																		onChange={(e) =>
																			handleAssign(t, e.target.value)
																		}
																	>
																		<option value="">Reassign operator</option>
																		{(t.category === "picking"
																			? pickerList
																			: t.category === "putaway"
																				? putterList
																				: staffList
																		)?.map((s) => (
																			<option key={s.id} value={s.id}>
																				{s.name} ({s.staff_code || s.role || "Staff"})
																			</option>
																		))}
																	</select>
																)}
															</div>
														</div>
													) : (
														<div className="flex items-center gap-1.5">
															<select
																className="h-7 cursor-pointer rounded-md border border-input bg-background px-2 font-semibold text-muted-foreground text-xs shadow-sm hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
																value=""
																onChange={(e) =>
																	handleAssign(t, e.target.value)
																}
															>
																<option value="">
																	{t.category === "picking"
																		? "+ Assign Picker"
																		: t.category === "putaway"
																			? "+ Assign Putter"
																			: "+ Assign Operator"}
																</option>
																{(t.category === "picking"
																	? pickerList
																	: t.category === "putaway"
																		? putterList
																		: staffList
																)?.map((s) => (
																	<option key={s.id} value={s.id}>
																		{s.name} ({s.staff_code || s.role || "Staff"})
																	</option>
																))}
															</select>
														</div>
													)}
												</TableCell>

												{/* Creation Date */}
												<TableCell className="text-slate-500 text-xs">
													{t.created_at}
												</TableCell>

												{/* Execution State */}
												<TableCell className="text-right">
													<Badge
														variant={isCompleted ? "default" : "outline"}
														className={
															isCompleted
																? "bg-emerald-600 text-white hover:bg-emerald-700"
																: t.status === "pending" ||
																		t.status === "PENDING" ||
																		t.status === "AWAITING_PLACEMENT"
																	? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
																	: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
														}
													>
														{t.status}
													</Badge>
												</TableCell>
											</TableRow>
										);
									})}

									{filteredTasks.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={7}
												className="py-12 text-center text-muted-foreground"
											>
												<ClipboardListIcon className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-700" />
												<p className="font-bold text-sm">
													No tasks match the active category and filter criteria.
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
