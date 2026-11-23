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
	BoxesIcon,
	CheckCircle2Icon,
	ClockIcon,
	FolderCheckIcon,
	Loader2Icon,
	MapPinIcon,
	PlayIcon,
	RefreshCwIcon,
	SearchIcon,
	UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PutAwayPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"ALL" | "AWAITING" | "IN_PROGRESS" | "VERIFIED"
	>("ALL");

	// Queries
	const {
		data: putAwayQueue,
		isLoading: putAwayLoading,
		isRefetching,
		refetch,
	} = trpc.warehouse.getPutAwayQueue.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});
	const { data: putterList } = trpc.staff.getPutters.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});
	const { data: locationsList } = trpc.warehouse.getLocations.useQuery({});

	// Mutations
	const assignPutAwayMutation = trpc.warehouse.assignPutAwayTask.useMutation({
		onSuccess: () => {
			toast.success("Put-away task successfully assigned to operator!");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPutAwayQueue.invalidate();
		},
		onError: (err) => {
			toast.error(`Assignment failed: ${err.message}`);
		},
	});

	const startPutAwayMutation = trpc.warehouse.startPutAwayTask.useMutation({
		onSuccess: () => {
			toast.success("Put-away placement in progress!");
			utils.warehouse.getPutAwayQueue.invalidate();
		},
		onError: (err) => {
			toast.error(`Start failed: ${err.message}`);
		},
	});

	const completePutAwayMutation =
		trpc.warehouse.completePutAwayTask.useMutation({
			onSuccess: () => {
				toast.success("Put-away verified, stock balances updated!");
				utils.warehouse.getOverviewStats.invalidate();
				utils.warehouse.getPutAwayQueue.invalidate();
			},
			onError: (err) => {
				toast.error(`Verification failed: ${err.message}`);
			},
		});

	// Modal State
	const [selectedPutAway, setSelectedPutAway] = useState<any>(null);
	const [isPutAwayModalOpen, setIsPutAwayModalOpen] = useState(false);
	const [putAwayQty, setPutAwayQty] = useState<number>(10);
	const [putAwayLocation, setPutAwayLocation] = useState<string>("1");
	const [putAwayNotes, setPutAwayNotes] = useState("");

	const openPutAwayModal = (task: any) => {
		setSelectedPutAway(task);
		setPutAwayQty(10);
		if (locationsList && locationsList.length > 0) {
			setPutAwayLocation(locationsList[0].id.toString());
		}
		setIsPutAwayModalOpen(true);
	};

	const handleCompletePutAway = async () => {
		if (!selectedPutAway) return;
		await completePutAwayMutation.mutateAsync({
			placementId: selectedPutAway.id,
			locationId: Number.parseInt(putAwayLocation) || 1,
			qty: Number(putAwayQty) || 1,
			notes: putAwayNotes,
		});
		setIsPutAwayModalOpen(false);
		setPutAwayNotes("");
	};

	// Statistics
	const stats = useMemo(() => {
		if (!putAwayQueue)
			return { total: 0, awaiting: 0, inProgress: 0, verified: 0 };
		let awaiting = 0;
		let inProgress = 0;
		let verified = 0;

		for (const t of putAwayQueue) {
			const st = t.status?.toUpperCase() || "";
			if (st === "AWAITING_PLACEMENT" || st === "PENDING") awaiting += 1;
			else if (st === "VERIFICATION_REQUIRED" || st === "PLACED" || st === "IN_PROGRESS") inProgress += 1;
			else if (st === "VERIFIED" || st === "COMPLETED") verified += 1;
		}

		return {
			total: putAwayQueue.length,
			awaiting,
			inProgress,
			verified,
		};
	}, [putAwayQueue]);

	const filteredTasks = useMemo(() => {
		if (!putAwayQueue) return [];
		return putAwayQueue.filter((t) => {
			const query = searchQuery.toLowerCase();
			const matchesSearch =
				!query ||
				t.id.toString().includes(query) ||
				t.product_name?.toLowerCase().includes(query) ||
				t.product_sku?.toLowerCase().includes(query) ||
				t.batch_number?.toLowerCase().includes(query) ||
				t.worker_name?.toLowerCase().includes(query);

			if (!matchesSearch) return false;

			const st = t.status?.toUpperCase() || "";
			if (statusFilter === "AWAITING") {
				return st === "AWAITING_PLACEMENT" || st === "PENDING";
			}
			if (statusFilter === "IN_PROGRESS") {
				return (
					st === "VERIFICATION_REQUIRED" ||
					st === "PLACED" ||
					st === "IN_PROGRESS"
				);
			}
			if (statusFilter === "VERIFIED") {
				return st === "VERIFIED" || st === "COMPLETED";
			}

			return true;
		});
	}, [putAwayQueue, searchQuery, statusFilter]);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							Put-Away & Placement Verification
						</h2>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE
						</span>
					</div>
					<p className="text-muted-foreground text-sm">
						Route received goods from dock to bin layouts & update real-time stock
						balances.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					<div className="relative w-full sm:w-72">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search product, SKU, batch, worker..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
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
						<span className="hidden sm:inline">Refresh</span>
					</Button>
				</div>
			</div>

			{/* KPI Metrics */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
				<Card className="shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Total Put-Away Tasks
								</p>
								<p className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
									{putAwayLoading ? "..." : stats.total}
								</p>
							</div>
							<div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
								<BoxesIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-amber-200/70 bg-amber-50/30 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-amber-800 text-xs uppercase tracking-wider dark:text-amber-400">
									Awaiting Placement
								</p>
								<p className="font-bold text-2xl text-amber-900 tracking-tight sm:text-3xl dark:text-amber-300">
									{putAwayLoading ? "..." : stats.awaiting}
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
									In Progress / Assigned
								</p>
								<p className="font-bold text-2xl text-blue-900 tracking-tight sm:text-3xl dark:text-blue-300">
									{putAwayLoading ? "..." : stats.inProgress}
								</p>
							</div>
							<div className="rounded-xl bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
								<UsersIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-emerald-200/70 bg-emerald-50/30 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-emerald-800 text-xs uppercase tracking-wider dark:text-emerald-400">
									Verified & Stocked
								</p>
								<p className="font-bold text-2xl text-emerald-900 tracking-tight sm:text-3xl dark:text-emerald-300">
									{putAwayLoading ? "..." : stats.verified}
								</p>
							</div>
							<div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
								<CheckCircle2Icon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Put-Away Tasks Table Card */}
			<Card className="shadow-sm">
				<CardHeader className="border-b pb-4">
					<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div>
							<CardTitle className="font-bold text-base">
								Inbound Put-Away Verification Queue
							</CardTitle>
							<CardDescription>
								Assign warehouse operators & confirm physical storage bin
								locations
							</CardDescription>
						</div>

						{/* Filter Buttons */}
						<div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
							<Button
								variant={statusFilter === "ALL" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("ALL")}
								className="h-7 text-xs"
							>
								All ({stats.total})
							</Button>
							<Button
								variant={statusFilter === "AWAITING" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("AWAITING")}
								className="h-7 text-xs"
							>
								Awaiting ({stats.awaiting})
							</Button>
							<Button
								variant={statusFilter === "IN_PROGRESS" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("IN_PROGRESS")}
								className="h-7 text-xs"
							>
								In Progress ({stats.inProgress})
							</Button>
							<Button
								variant={statusFilter === "VERIFIED" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("VERIFIED")}
								className="h-7 text-xs"
							>
								Verified ({stats.verified})
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{putAwayLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							<p className="mt-2 text-muted-foreground text-xs">
								Loading put-away tasks...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="w-[120px]">Task Ref</TableHead>
										<TableHead>Product Details</TableHead>
										<TableHead>Batch Number</TableHead>
										<TableHead>Current Status</TableHead>
										<TableHead>Assigned Operator</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredTasks.map((task) => {
										const isVerified =
											task.status === "VERIFIED" || task.status === "COMPLETED";
										const isAwaiting =
											task.status === "AWAITING_PLACEMENT" ||
											task.status === "PENDING";
										return (
											<TableRow key={task.id} className="hover:bg-muted/20">
												<TableCell className="font-mono font-bold text-slate-900 text-xs dark:text-slate-100">
													PV-#{task.id}
												</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span className="font-bold text-slate-800 text-xs dark:text-slate-100">
															{task.product_name}
														</span>
														<span className="font-mono text-[10px] text-muted-foreground">
															SKU: {task.product_sku || "N/A"}
														</span>
													</div>
												</TableCell>
												<TableCell className="font-mono font-semibold text-xs">
													{task.batch_number || "Auto Batch"}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															isVerified
																? "default"
																: isAwaiting
																	? "outline"
																	: "secondary"
														}
														className={
															isAwaiting
																? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
																: isVerified
																	? "bg-emerald-600 text-white"
																	: ""
														}
													>
														{task.status}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1.5 text-xs">
														<UsersIcon className="h-3.5 w-3.5 text-slate-400" />
														<span className="font-medium">
															{task.worker_name ?? "Unassigned"}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-2">
														{!task.placed_by && !isVerified && (
															<select
																className="cursor-pointer rounded border border-input bg-background px-2 py-1 font-semibold text-xs shadow-sm focus:outline-none"
																onChange={async (e) => {
																	const val = e.target.value;
																	if (val) {
																		await assignPutAwayMutation.mutateAsync({
																			placementId: task.id,
																			workerId: Number.parseInt(val),
																		});
																	}
																}}
															>
																<option value="">+ Assign Putter</option>
																{putterList?.map((s) => (
																	<option key={s.id} value={s.id}>
																		{s.name} ({s.staff_code || `EMP-${s.id}`})
																	</option>
																))}
															</select>
														)}

														{!isVerified && (
															<Button
																size="sm"
																onClick={() => openPutAwayModal(task)}
																className="h-8 text-xs shadow-sm"
															>
																<MapPinIcon className="mr-1 h-3.5 w-3.5" />
																Confirm Storage Bin
															</Button>
														)}

														{isVerified && (
															<div className="flex items-center gap-1 font-bold text-emerald-600 text-xs">
																<CheckCircle2Icon className="h-4 w-4" /> Placed
																& Stocked
															</div>
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})}
									{filteredTasks.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-16 text-center text-muted-foreground"
											>
												<BoxesIcon className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
												<p className="font-bold text-slate-700 text-sm dark:text-slate-300">
													No put-away tasks found.
												</p>
												<p className="text-xs">
													There are no products currently awaiting storage bin
													placement matching your filter.
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

			{/* CONFIRM PUT AWAY DIALOG */}
			<Dialog open={isPutAwayModalOpen} onOpenChange={setIsPutAwayModalOpen}>
				<DialogContent className="max-w-md bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg">
							<MapPinIcon className="h-5 w-5 text-primary" />
							Confirm Storage Bin Location
						</DialogTitle>
						<DialogDescription>
							Assign storage bin & update live warehouse inventory for{" "}
							<span className="font-bold text-slate-800 dark:text-slate-200">
								{selectedPutAway?.product_name}
							</span>
							.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Storage Bin / Rack Location *
							</Label>
							<select
								className="mt-1 w-full rounded-md border border-input bg-background p-2 font-semibold text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
								value={putAwayLocation}
								onChange={(e) => setPutAwayLocation(e.target.value)}
							>
								{locationsList && locationsList.length > 0 ? (
									locationsList.map((loc) => (
										<option key={loc.id} value={loc.id.toString()}>
											{loc.section ? `${loc.section} - ` : ""}
											{loc.name} (Cap: {loc.capacity ?? 100})
										</option>
									))
								) : (
									<>
										<option value="1">
											Aisle A - Row 1 - Bin A101 (General Storage)
										</option>
										<option value="2">
											Aisle B - Row 2 - Bin B202 (Bulk Rack)
										</option>
									</>
								)}
							</select>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Verified Placement Quantity *
							</Label>
							<Input
								type="number"
								min={1}
								value={putAwayQty}
								onChange={(e) =>
									setPutAwayQty(Number.parseInt(e.target.value) || 0)
								}
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Supervisor Verification Notes
							</Label>
							<Textarea
								placeholder="E.g. Placed in shelf level 2 safely. Packaging intact."
								value={putAwayNotes}
								onChange={(e) => setPutAwayNotes(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPutAwayModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleCompletePutAway}
							disabled={completePutAwayMutation.isPending}
							className="shadow-sm"
						>
							{completePutAwayMutation.isPending ? (
								<>
									<Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									Updating Inventory...
								</>
							) : (
								"Verify Stock & Save Placement"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
