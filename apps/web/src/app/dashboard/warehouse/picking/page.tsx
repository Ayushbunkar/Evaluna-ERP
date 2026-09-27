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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	ActivityIcon,
	AlertOctagonIcon,
	AlertTriangleIcon,
	BotIcon,
	BoxesIcon,
	CheckCircle2Icon,
	CheckSquareIcon,
	ClockIcon,
	CpuIcon,
	FlameIcon,
	Loader2Icon,
	PackageCheckIcon,
	PackageSearchIcon,
	PlayIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldAlertIcon,
	SparklesIcon,
	UserCheckIcon,
	UserPlusIcon,
	UsersIcon,
	WrenchIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickingPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "pending" | "picking" | "completed"
	>("all");

	// Queries with real-time background sync
	const {
		data: pickingQueue,
		isLoading: pickingLoading,
		isRefetching,
		refetch,
	} = trpc.warehouse.getPickingQueue.useQuery(undefined, {
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
	});

	const { data: pickerList } = trpc.staff.getPickers.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});

	const { data: pipelineHealth, refetch: refetchPipeline } =
		trpc.warehouse.getPipelineHealth.useQuery(undefined, {
			refetchInterval: 10000,
			refetchOnWindowFocus: true,
		});

	// Mutations
	const assignPickingMutation = trpc.warehouse.assignPickingTask.useMutation({
		onSuccess: () => {
			toast.success("Picker operator successfully assigned!");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPickingQueue.invalidate();
			utils.warehouse.getPipelineHealth.invalidate();
		},
		onError: (err) => {
			toast.error(`Assignment failed: ${err.message}`);
		},
	});

	const autoAssignPickingMutation =
		trpc.warehouse.autoAssignPicking.useMutation({
			onSuccess: (res) => {
				toast.success(res.message);
				utils.warehouse.getOverviewStats.invalidate();
				utils.warehouse.getPickingQueue.invalidate();
				utils.warehouse.getPipelineHealth.invalidate();
			},
			onError: (err) => {
				toast.error(`Auto-assignment failed: ${err.message}`);
			},
		});

	const runSelfHealingMutation =
		trpc.warehouse.runSelfHealingPipeline.useMutation({
			onSuccess: (res) => {
				toast.success(res.message);
				utils.warehouse.getOverviewStats.invalidate();
				utils.warehouse.getPickingQueue.invalidate();
				utils.warehouse.getPackingQueue.invalidate();
				utils.warehouse.getPipelineHealth.invalidate();
			},
			onError: (err) => {
				toast.error(`Self-healing pipeline error: ${err.message}`);
			},
		});

	const raiseIssueMutation = trpc.warehouse.raisePipelineIssue.useMutation({
		onSuccess: (res) => {
			toast.success(res.message);
			setIsIssueModalOpen(false);
			setIssueNotes("");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPickingQueue.invalidate();
			utils.warehouse.getPipelineHealth.invalidate();
			utils.warehouse.getExceptions.invalidate();
		},
		onError: (err) => {
			toast.error(`Failed to raise issue: ${err.message}`);
		},
	});

	const startPickingMutation = trpc.warehouse.startPickingTask.useMutation({
		onSuccess: () => {
			toast.success("Picking task started on shelves!");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPickingQueue.invalidate();
			utils.warehouse.getPipelineHealth.invalidate();
		},
		onError: (err) => {
			toast.error(`Start failed: ${err.message}`);
		},
	});

	const pickItemMutation = trpc.warehouse.pickItem.useMutation({
		onSuccess: () => {
			toast.success("Line item successfully picked!");
			utils.warehouse.getPickingQueue.invalidate();
		},
		onError: (err) => {
			toast.error(`Pick item failed: ${err.message}`);
		},
	});

	const completePickingMutation =
		trpc.warehouse.completePickingTask.useMutation({
			onSuccess: () => {
				toast.success("Picking completed! Moved to packing queue.");
				utils.warehouse.getOverviewStats.invalidate();
				utils.warehouse.getPickingQueue.invalidate();
				utils.warehouse.getPackingQueue.invalidate();
				utils.warehouse.getPipelineHealth.invalidate();
			},
			onError: (err) => {
				toast.error(`Completion failed: ${err.message}`);
			},
		});

	// Shelf Pick Modal State
	const [selectedPickList, setSelectedPickList] = useState<any>(null);
	const [pickListItems, setPickListItems] = useState<any[]>([]);
	const [loadingItems, setLoadingItems] = useState(false);
	const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);

	// Issue Modal State
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
	const [issueTargetPickList, setIssueTargetPickList] = useState<any>(null);
	const [issueType, setIssueType] = useState<
		| "stockout"
		| "damaged_item"
		| "barcode_mismatch"
		| "picker_unresponsive"
		| "order_hold"
	>("stockout");
	const [issueNotes, setIssueNotes] = useState("");
	const [autoReassignCheck, setAutoReassignCheck] = useState(true);

	const openPickingModal = async (pl: any) => {
		setSelectedPickList(pl);
		setIsPickingModalOpen(true);
		setLoadingItems(true);
		try {
			const items = await utils.client.warehouse.getPickListItems.query({
				pickListId: pl.id,
			});
			setPickListItems(items);
		} catch (e) {
			toast.error("Failed to load pick items");
		} finally {
			setLoadingItems(false);
		}
	};

	const openIssueModal = (pl: any) => {
		setIssueTargetPickList(pl);
		setIssueNotes("");
		setIsIssueModalOpen(true);
	};

	const handlePickItem = async (
		itemId: number,
		currentQty: number,
		targetQty: number,
	) => {
		await pickItemMutation.mutateAsync({
			itemId,
			qtyPicked: targetQty,
		});
		if (selectedPickList) {
			const items = await utils.client.warehouse.getPickListItems.query({
				pickListId: selectedPickList.id,
			});
			setPickListItems(items);
		}
	};

	const handleCompletePicking = async () => {
		if (!selectedPickList) return;
		await completePickingMutation.mutateAsync({
			pickListId: selectedPickList.id,
		});
		setIsPickingModalOpen(false);
	};

	const handleRaiseIssueSubmit = async () => {
		if (!issueTargetPickList) return;
		if (!issueNotes.trim()) {
			toast.error("Please provide description of the problem.");
			return;
		}
		await raiseIssueMutation.mutateAsync({
			referenceType: "pick_list",
			referenceId: issueTargetPickList.id,
			issueType,
			notes: issueNotes,
			autoReassign: autoReassignCheck,
		});
	};

	// Statistics
	const stats = useMemo(() => {
		if (!pickingQueue)
			return { total: 0, pending: 0, inProgress: 0, completed: 0, urgent: 0 };
		let pending = 0;
		let inProgress = 0;
		let completed = 0;
		let urgent = 0;

		for (const pl of pickingQueue) {
			const st = pl.status?.toLowerCase() || "";
			if (pl.priority === "urgent" || pl.priority === "high") {
				urgent += 1;
			}
			if (st === "pending" || st === "unassigned" || !pl.assigned_to) {
				pending += 1;
			} else if (st === "picking" || st === "assigned" || st === "in_progress") {
				inProgress += 1;
			} else if (st === "completed") {
				completed += 1;
			}
		}

		return {
			total: pickingQueue.length,
			pending,
			inProgress,
			completed,
			urgent,
		};
	}, [pickingQueue]);

	const filteredPicks = useMemo(() => {
		if (!pickingQueue) return [];
		return pickingQueue.filter((pl) => {
			const query = searchQuery.toLowerCase();
			const matchesSearch =
				!query ||
				pl.id.toString().includes(query) ||
				pl.order_id?.toString().includes(query) ||
				pl.customer_name?.toLowerCase().includes(query) ||
				pl.worker_name?.toLowerCase().includes(query) ||
				pl.priority?.toLowerCase().includes(query);

			if (!matchesSearch) return false;

			const st = pl.status?.toLowerCase() || "";
			if (statusFilter === "pending") {
				return st === "pending" || !pl.assigned_to;
			}
			if (statusFilter === "picking") {
				return st === "picking" || st === "assigned" || st === "in_progress";
			}
			if (statusFilter === "completed") {
				return st === "completed";
			}

			return true;
		});
	}, [pickingQueue, searchQuery, statusFilter]);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							Outbound Picking Queue
						</h2>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE PIPELINE
						</span>
					</div>
					<p className="text-muted-foreground text-sm">
						Autonomous task dispatching, real-time shelf retrieval monitoring, and self-healing bottleneck resolution.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					<div className="relative w-full sm:w-72">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search pick list #, order #, customer..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetch();
							refetchPipeline();
						}}
						disabled={isRefetching}
						className="gap-1.5"
					>
						<RefreshCwIcon
							className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
						/>
						<span className="hidden sm:inline">Refresh</span>
					</Button>
				</div>
			</div>

			{/* AUTOMATED PIPELINE & SELF-HEALING CONTROL CENTER BANNER */}
			<div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-blue-50/80 p-4 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-blue-950/20">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex items-start gap-3">
						<div className="rounded-lg bg-indigo-600 p-2.5 text-white shadow-sm dark:bg-indigo-500">
							<ZapIcon className="h-5 w-5 animate-pulse" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-bold text-indigo-950 text-sm sm:text-base dark:text-indigo-200">
									Autonomous Dispatch Pipeline & Workload Balancer
								</h3>
								<Badge
									variant="outline"
									className="border-indigo-300 bg-indigo-100/70 font-mono text-[10px] text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
								>
									ACTIVE & HEALTHY
								</Badge>
							</div>
							<p className="mt-0.5 text-slate-600 text-xs dark:text-slate-400">
								{pipelineHealth?.activePickersCount ?? 0} active pickers available ·{" "}
								{stats.pending} pending allocation ·{" "}
								{pipelineHealth?.delayedCount ?? 0} overdue SLA tasks.
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* One-Click Auto-Assign Pipeline */}
						<Button
							size="sm"
							onClick={() => autoAssignPickingMutation.mutate({})}
							disabled={autoAssignPickingMutation.isPending || stats.pending === 0}
							className="h-8 gap-1.5 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
						>
							{autoAssignPickingMutation.isPending ? (
								<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
							) : (
								<BotIcon className="h-3.5 w-3.5" />
							)}
							<span>Auto-Assign Queue ({stats.pending})</span>
						</Button>

						{/* Self-Healing Pipeline Fix */}
						<Button
							size="sm"
							variant="outline"
							onClick={() => runSelfHealingMutation.mutate()}
							disabled={runSelfHealingMutation.isPending}
							className="h-8 gap-1.5 border-purple-300 bg-white/80 text-purple-700 shadow-sm hover:bg-purple-50 dark:border-purple-800 dark:bg-slate-900/60 dark:text-purple-300"
						>
							{runSelfHealingMutation.isPending ? (
								<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
							) : (
								<WrenchIcon className="h-3.5 w-3.5" />
							)}
							<span>Self-Heal Pipeline</span>
						</Button>
					</div>
				</div>

				{/* Bottleneck alert banner if bottlenecks exist */}
				{pipelineHealth?.bottlenecks && pipelineHealth.bottlenecks.length > 0 && (
					<div className="mt-3.5 space-y-2 border-indigo-200/60 border-t pt-3 dark:border-indigo-900/40">
						{pipelineHealth.bottlenecks.map((b) => (
							<div
								key={b.id}
								className={`flex items-center justify-between rounded-lg p-2.5 text-xs ${
									b.severity === "critical"
										? "border border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
										: "border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
								}`}
							>
								<div className="flex items-center gap-2">
									<AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
									<span className="font-semibold">{b.title}:</span>
									<span className="text-muted-foreground">{b.description}</span>
								</div>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => runSelfHealingMutation.mutate()}
									disabled={runSelfHealingMutation.isPending}
									className="h-6 gap-1 px-2 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300"
								>
									<ZapIcon className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
									Fix Now
								</Button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* KPI Summary Row */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
				<Card className="shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Total Pick Lists
								</p>
								<p className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
									{pickingLoading ? "..." : stats.total}
								</p>
							</div>
							<div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
								<CheckSquareIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-amber-200/70 bg-amber-50/30 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-amber-800 text-xs uppercase tracking-wider dark:text-amber-400">
									Pending Assignment
								</p>
								<p className="font-bold text-2xl text-amber-900 tracking-tight sm:text-3xl dark:text-amber-300">
									{pickingLoading ? "..." : stats.pending}
								</p>
							</div>
							<div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
								<ClockIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-blue-200/70 bg-blue-50/30 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-blue-800 text-xs uppercase tracking-wider dark:text-blue-400">
									In Progress (Picking)
								</p>
								<p className="font-bold text-2xl text-blue-900 tracking-tight sm:text-3xl dark:text-blue-300">
									{pickingLoading ? "..." : stats.inProgress}
								</p>
							</div>
							<div className="rounded-xl bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
								<PackageSearchIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-emerald-200/70 bg-emerald-50/30 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-emerald-800 text-xs uppercase tracking-wider dark:text-emerald-400">
									Completed
								</p>
								<p className="font-bold text-2xl text-emerald-900 tracking-tight sm:text-3xl dark:text-emerald-300">
									{pickingLoading ? "..." : stats.completed}
								</p>
							</div>
							<div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
								<CheckCircle2Icon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Picking Table Card */}
			<Card className="shadow-sm">
				<CardHeader className="border-b pb-4">
					<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div>
							<CardTitle className="font-bold text-base">
								Fulfillment Picking Checklist Queue
							</CardTitle>
							<CardDescription>
								Coordinate picker operators to retrieve stock items from the
								specified aisle bins
							</CardDescription>
						</div>

						{/* Filter Tabs */}
						<div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
							<Button
								variant={statusFilter === "all" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("all")}
								className="h-7 text-xs"
							>
								All ({stats.total})
							</Button>
							<Button
								variant={statusFilter === "pending" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("pending")}
								className="h-7 text-xs"
							>
								Pending ({stats.pending})
							</Button>
							<Button
								variant={statusFilter === "picking" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("picking")}
								className="h-7 text-xs"
							>
								In Progress ({stats.inProgress})
							</Button>
							<Button
								variant={statusFilter === "completed" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("completed")}
								className="h-7 text-xs"
							>
								Completed ({stats.completed})
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{pickingLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							<p className="mt-2 text-muted-foreground text-xs">
								Loading picking lists...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="w-[120px]">Pick List ID</TableHead>
										<TableHead>Customer Order</TableHead>
										<TableHead>SLA Priority</TableHead>
										<TableHead>Checklist Status</TableHead>
										<TableHead>Assigned Picker</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPicks.map((pl) => (
										<TableRow key={pl.id} className="hover:bg-muted/20">
											<TableCell className="font-mono font-bold text-slate-900 text-xs dark:text-slate-100">
												PL-#{pl.id}
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-bold text-slate-800 text-sm dark:text-slate-100">
														{pl.customer_name || "Walk-in Customer"}
													</span>
													<span className="font-mono text-[11px] text-muted-foreground">
														Order ID: #{pl.order_id}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														pl.priority === "high" || pl.priority === "urgent"
															? "destructive"
															: "secondary"
													}
													className={
														pl.priority === "urgent" ? "animate-pulse" : ""
													}
												>
													{pl.priority || "normal"}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														pl.status === "completed"
															? "default"
															: pl.status === "picking"
																? "secondary"
																: "outline"
													}
													className={
														pl.status === "pending"
															? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
															: pl.status === "picking"
																? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
																: pl.status === "completed"
																	? "bg-emerald-600 text-white"
																	: ""
													}
												>
													{pl.status}
												</Badge>
											</TableCell>

											{/* ASSIGNED PICKER COLUMN */}
											<TableCell>
												{pl.worker_name ? (
													<div className="flex items-center gap-2">
														<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs dark:bg-blue-950/60 dark:text-blue-300">
															{pl.worker_name.charAt(0).toUpperCase()}
														</span>
														<div className="flex flex-col">
															<span className="font-semibold text-slate-800 text-xs dark:text-slate-200">
																{pl.worker_name}
															</span>
															{pl.status !== "completed" && (
																<select
																	className="cursor-pointer bg-transparent text-[10px] text-muted-foreground underline hover:text-foreground focus:outline-none"
																	value=""
																	onChange={async (e) => {
																		const val = e.target.value;
																		if (val) {
																			await assignPickingMutation.mutateAsync({
																				pickListId: pl.id,
																				workerId: Number.parseInt(val),
																			});
																		}
																	}}
																>
																	<option value="">Reassign</option>
																	{pickerList?.map((s) => (
																		<option key={s.id} value={s.id}>
																			{s.name} ({s.staff_code || `EMP-${s.id}`})
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
															onChange={async (e) => {
																const val = e.target.value;
																if (val) {
																	await assignPickingMutation.mutateAsync({
																		pickListId: pl.id,
																		workerId: Number.parseInt(val),
																	});
																}
															}}
														>
															<option value="">+ Assign Picker</option>
															{pickerList?.map((s) => (
																<option key={s.id} value={s.id}>
																	{s.name} ({s.staff_code || `EMP-${s.id}`})
																</option>
															))}
														</select>

														{/* Quick 1-Click Auto Assign Single Picklist */}
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																autoAssignPickingMutation.mutate({
																	pickListIds: [pl.id],
																})
															}
															disabled={autoAssignPickingMutation.isPending}
															className="h-7 px-1.5 text-[10px] text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
															title="Auto-Assign to least loaded picker"
														>
															<ZapIcon className="h-3 w-3 mr-0.5" />
															Auto
														</Button>
													</div>
												)}
											</TableCell>

											<TableCell className="text-right">
												<div className="flex justify-end items-center gap-1.5">
													{(!pl.assigned_to || pl.status === "pending") && (
														<Button
															size="sm"
															onClick={() =>
																startPickingMutation.mutate({
																	pickListId: pl.id,
																})
															}
															disabled={startPickingMutation.isPending}
															className="h-8 text-xs shadow-sm"
														>
															<PlayIcon className="mr-1 h-3.5 w-3.5" /> Start
															Picking
														</Button>
													)}

													{pl.status === "assigned" && (
														<Button
															size="sm"
															onClick={() =>
																startPickingMutation.mutate({
																	pickListId: pl.id,
																})
															}
															disabled={startPickingMutation.isPending}
															className="h-8 text-xs shadow-sm"
														>
															<PlayIcon className="mr-1 h-3.5 w-3.5" /> Start
															Picking
														</Button>
													)}

													{pl.status === "picking" && (
														<Button
															size="sm"
															onClick={() => openPickingModal(pl)}
															className="h-8 bg-blue-600 text-white text-xs shadow-sm hover:bg-blue-700"
														>
															<PackageSearchIcon className="mr-1 h-3.5 w-3.5" />{" "}
															Execute Shelf Pick
														</Button>
													)}

													{pl.status === "completed" && (
														<div className="flex items-center gap-1 font-bold text-emerald-600 text-xs">
															<CheckCircle2Icon className="h-4 w-4" /> Pick
															Completed
														</div>
													)}

													{/* Raise Issue / Fix Pipeline Button */}
													{pl.status !== "completed" && (
														<Button
															size="sm"
															variant="ghost"
															onClick={() => openIssueModal(pl)}
															className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
															title="Report stockout, damage or re-route task"
														>
															<AlertTriangleIcon className="h-3.5 w-3.5 mr-1" />
															Issue
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
									{filteredPicks.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-16 text-center text-muted-foreground"
											>
												<CheckSquareIcon className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
												<p className="font-bold text-slate-700 text-sm dark:text-slate-300">
													No picking lists found.
												</p>
												<p className="text-xs">
													There are no orders awaiting picking matching your
													filter.
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

			{/* EXECUTE SHELF PICK MODAL */}
			<Dialog open={isPickingModalOpen} onOpenChange={setIsPickingModalOpen}>
				<DialogContent className="max-w-2xl bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg">
							<PackageSearchIcon className="h-5 w-5 text-primary" />
							Pick Items for Pick List #{selectedPickList?.id}
						</DialogTitle>
						<DialogDescription>
							Retrieve goods from shelf bins for Order #
							{selectedPickList?.order_id} (
							{selectedPickList?.customer_name || "Customer"}).
							{selectedPickList?.worker_name && (
								<span className="ml-1 font-semibold text-slate-800 dark:text-slate-200">
									· Assigned: {selectedPickList.worker_name}
								</span>
							)}
						</DialogDescription>
					</DialogHeader>

					{loadingItems ? (
						<div className="flex justify-center py-10">
							<Loader2Icon className="h-6 w-6 animate-spin text-primary" />
						</div>
					) : (
						<div className="my-2 max-h-[350px] space-y-4 overflow-y-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40">
										<TableHead>Product Line Name</TableHead>
										<TableHead>SKU</TableHead>
										<TableHead>Qty Ordered</TableHead>
										<TableHead>Qty Picked</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pickListItems.map((item) => {
										const isPicked =
											(item.quantity_picked ?? 0) >= item.quantity_ordered;
										return (
											<TableRow key={item.id}>
												<TableCell className="max-w-[200px] truncate font-bold text-xs">
													{item.product_name}
												</TableCell>
												<TableCell className="font-mono text-xs">
													{item.product_sku || "N/A"}
												</TableCell>
												<TableCell className="font-semibold text-xs">
													{item.quantity_ordered} units
												</TableCell>
												<TableCell className="font-bold text-xs">
													{item.quantity_picked ?? 0} / {item.quantity_ordered}
												</TableCell>
												<TableCell className="text-right">
													{isPicked ? (
														<Badge
															variant="outline"
															className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700 text-xs"
														>
															<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />{" "}
															Picked
														</Badge>
													) : (
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																handlePickItem(
																	item.id,
																	item.quantity_picked ?? 0,
																	item.quantity_ordered,
																)
															}
															disabled={pickItemMutation.isPending}
															className="h-7 text-xs shadow-sm"
														>
															Confirm Pick
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

					<DialogFooter className="gap-2 sm:justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPickingModalOpen(false)}
						>
							Close
						</Button>
						<Button
							size="sm"
							onClick={handleCompletePicking}
							disabled={
								completePickingMutation.isPending ||
								loadingItems ||
								pickListItems.some(
									(i) => (i.quantity_picked ?? 0) < i.quantity_ordered,
								)
							}
							className="shadow-sm"
						>
							{completePickingMutation.isPending ? (
								<>
									<Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									Handing off to Packer...
								</>
							) : (
								"Complete Picking & Hand to Packer"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* RAISE PIPELINE ISSUE / SELF-HEAL MODAL */}
			<Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
				<DialogContent className="max-w-lg bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-rose-600 text-lg">
							<AlertOctagonIcon className="h-5 w-5" />
							Raise Pipeline Exception · PL-#{issueTargetPickList?.id}
						</DialogTitle>
						<DialogDescription>
							Flag a physical or operational problem. The pipeline will immediately adjust priorities, re-route tasks, and log an audit exception.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">Problem Category</Label>
							<select
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
								value={issueType}
								onChange={(e) => setIssueType(e.target.value as any)}
							>
								<option value="stockout">📦 Stockout / Item Not on Shelf Bin</option>
								<option value="damaged_item">💥 Damaged SKU / Unfit for Shipment</option>
								<option value="barcode_mismatch">🔍 Barcode / SKU Discrepancy</option>
								<option value="picker_unresponsive">⏳ Picker Unresponsive / Stalled Task</option>
								<option value="order_hold">🛑 Customer / Sales Order Hold Request</option>
							</select>
						</div>

						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">Problem Details & Floor Notes</Label>
							<Textarea
								placeholder="Describe what happened on the shelf bin or with this order..."
								value={issueNotes}
								onChange={(e) => setIssueNotes(e.target.value)}
								rows={3}
								className="text-sm"
							/>
						</div>

						<div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
							<input
								type="checkbox"
								id="autoReassignCheck"
								checked={autoReassignCheck}
								onChange={(e) => setAutoReassignCheck(e.target.checked)}
								className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
							/>
							<label htmlFor="autoReassignCheck" className="flex items-center gap-1.5 text-xs text-indigo-900 dark:text-indigo-200">
								<ZapIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
								<span><span className="font-bold">Autonomous Re-route:</span> Immediately re-assign this order to another available picker & bump priority to Urgent.</span>
							</label>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsIssueModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={handleRaiseIssueSubmit}
							disabled={raiseIssueMutation.isPending || !issueNotes.trim()}
						>
							{raiseIssueMutation.isPending ? (
								<>
									<Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									Logging & Re-routing...
								</>
							) : (
								"Raise Issue & Fix Pipeline"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
