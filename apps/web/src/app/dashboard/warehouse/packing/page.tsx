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
	AlertOctagonIcon,
	AlertTriangleIcon,
	BotIcon,
	BoxIcon,
	CheckCircle2Icon,
	FileSpreadsheetIcon,
	Loader2Icon,
	PackageCheckIcon,
	PackageIcon,
	RefreshCwIcon,
	SearchIcon,
	TruckIcon,
	UsersIcon,
	WrenchIcon,
	ZapIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PackingPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");

	// Queries with real-time sync
	const {
		data: packingQueue,
		isLoading: packingLoading,
		isRefetching,
		refetch,
	} = trpc.warehouse.getPackingQueue.useQuery(undefined, {
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
	});

	const { data: pipelineHealth, refetch: refetchPipeline } =
		trpc.warehouse.getPipelineHealth.useQuery(undefined, {
			refetchInterval: 10000,
			refetchOnWindowFocus: true,
		});

	const { data: packerList } = trpc.staff.getPackers.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});

	const { data: isEWayBillConfigured } =
		trpc.warehouse.isEWayBillConfigured.useQuery();

	// Mutations
	const assignPackingMutation = trpc.warehouse.assignPackingTask.useMutation({
		onSuccess: () => {
			toast.success("Packer operator successfully assigned!");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPackingQueue.invalidate();
			utils.warehouse.getPipelineHealth.invalidate();
		},
		onError: (err) => {
			toast.error(`Assignment failed: ${err.message}`);
		},
	});

	const packPackageMutation = trpc.warehouse.packPackage.useMutation({
		onSuccess: () => {
			toast.success("Package successfully sealed & routed to fleet hand-off!");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPackingQueue.invalidate();
			utils.warehouse.getPipelineHealth.invalidate();
		},
		onError: (err) => {
			toast.error(`Packing failed: ${err.message}`);
		},
	});

	const autoAssignPackingMutation =
		trpc.warehouse.autoAssignPacking.useMutation({
			onSuccess: (res) => {
				toast.success(res.message);
				utils.warehouse.getOverviewStats.invalidate();
				utils.warehouse.getPackingQueue.invalidate();
				utils.warehouse.getPipelineHealth.invalidate();
			},
			onError: (err) => {
				toast.error(`Auto-assign packing failed: ${err.message}`);
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
			utils.warehouse.getPackingQueue.invalidate();
			utils.warehouse.getPipelineHealth.invalidate();
		},
		onError: (err) => {
			toast.error(`Failed to raise packing exception: ${err.message}`);
		},
	});

	const generateEWayBillMutation = trpc.warehouse.generateEWayBill.useMutation({
		onSuccess: (res) => {
			if (res.success) {
				toast.success(`Government E-Way Bill generated: ${res.eWayBillNo}`);
				utils.warehouse.getPackingQueue.invalidate();
			} else {
				toast.error(`E-Way Bill Error: ${res.error}`);
			}
		},
		onError: (err) => {
			toast.error(`API Gate Failure: ${err.message}`);
		},
	});

	// Packing Modal State
	const [selectedPackage, setSelectedPackage] = useState<any>(null);
	const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
	const [pkgWeight, setPkgWeight] = useState("");
	const [pkgDimensions, setPkgDimensions] = useState("");
	const [pkgNotes, setPkgNotes] = useState("");

	// E-Way Bill Modal State
	const [selectedEWayPackage, setSelectedEWayPackage] = useState<any>(null);
	const [isEWayModalOpen, setIsEWayModalOpen] = useState(false);
	const [vehicleNo, setVehicleNo] = useState("");
	const [transporterName, setTransporterName] = useState("");
	const [approxDistance, setApproxDistance] = useState("120");
	const [modeOfTransport, setModeOfTransport] = useState<
		"road" | "rail" | "air" | "ship"
	>("road");

	// Packing Issue Modal State
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
	const [issueTargetPackage, setIssueTargetPackage] = useState<any>(null);
	const [issueType, setIssueType] = useState<
		| "stockout"
		| "damaged_item"
		| "barcode_mismatch"
		| "picker_unresponsive"
		| "order_hold"
	>("damaged_item");
	const [issueNotes, setIssueNotes] = useState("");

	const openPackingModal = (pkg: any) => {
		setSelectedPackage(pkg);
		setIsPackingModalOpen(true);
	};

	const openEWayModal = (pkg: any) => {
		setSelectedEWayPackage(pkg);
		setIsEWayModalOpen(true);
	};

	const openIssueModal = (pkg: any) => {
		setIssueTargetPackage(pkg);
		setIssueNotes("");
		setIsIssueModalOpen(true);
	};

	const handleCompletePacking = async () => {
		if (!selectedPackage) return;
		await packPackageMutation.mutateAsync({
			packageId: selectedPackage.id,
			weight: Number.parseFloat(pkgWeight) || undefined,
			dimensions: pkgDimensions,
			notes: pkgNotes,
		});
		setIsPackingModalOpen(false);
		setPkgWeight("");
		setPkgDimensions("");
		setPkgNotes("");
	};

	const handleGenerateEWayBill = async () => {
		if (!selectedEWayPackage) return;
		await generateEWayBillMutation.mutateAsync({
			orderId: selectedEWayPackage.order_id,
			vehicleNo: vehicleNo,
			modeOfTransport: modeOfTransport,
			approxDistanceKm: Number.parseInt(approxDistance, 10) || 100,
			transporterName: transporterName || undefined,
		});
		setIsEWayModalOpen(false);
		setVehicleNo("");
		setTransporterName("");
		setApproxDistance("120");
	};

	const handleRaiseIssueSubmit = async () => {
		if (!issueTargetPackage) return;
		if (!issueNotes.trim()) {
			toast.error("Please provide description of the problem.");
			return;
		}
		await raiseIssueMutation.mutateAsync({
			referenceType: "package",
			referenceId: issueTargetPackage.id,
			issueType,
			notes: issueNotes,
		});
	};

	// Statistics
	const stats = useMemo(() => {
		if (!packingQueue)
			return { total: 0, unassigned: 0, inPacking: 0, sealed: 0 };
		let unassigned = 0;
		let inPacking = 0;
		let sealed = 0;

		for (const pkg of packingQueue) {
			const st = pkg.status?.toLowerCase() || "";
			if (!pkg.packed_by && st === "packing") {
				unassigned += 1;
			} else if (st === "packing") {
				inPacking += 1;
			} else if (st === "packed" || st === "ready_for_dispatch") {
				sealed += 1;
			}
		}

		return {
			total: packingQueue.length,
			unassigned,
			inPacking,
			sealed,
		};
	}, [packingQueue]);

	const filteredPackages = useMemo(() => {
		if (!packingQueue) return [];
		return packingQueue.filter(
			(pkg) =>
				pkg.package_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				String(pkg.order_id).includes(searchQuery) ||
				pkg.worker_name?.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [packingQueue, searchQuery]);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							Outbound Packing & Fleet Hand-off
						</h2>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE PIPELINE
						</span>
					</div>
					<p className="text-muted-foreground text-sm">
						Verify picked line items, box container dimensional sealing, autonomous packer load routing, and GST E-Way dispatch gating.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					<div className="relative w-full sm:w-72">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search package ref, order ID..."
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

			{/* AUTONOMOUS PACKING PIPELINE CONTROL BANNER */}
			<div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-purple-50/80 p-4 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/20 dark:via-blue-950/10 dark:to-purple-950/20">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex items-start gap-3">
						<div className="rounded-lg bg-indigo-600 p-2.5 text-white shadow-sm dark:bg-indigo-500">
							<ZapIcon className="h-5 w-5 animate-pulse" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-bold text-indigo-950 text-sm sm:text-base dark:text-indigo-200">
									Autonomous Packing & Dispatch Pipeline
								</h3>
								<Badge
									variant="outline"
									className="border-indigo-300 bg-indigo-100/70 font-mono text-[10px] text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
								>
									LIVE ENGINE
								</Badge>
							</div>
							<p className="mt-0.5 text-slate-600 text-xs dark:text-slate-400">
								{pipelineHealth?.activePackersCount ?? 0} active packing personnel ·{" "}
								{stats.unassigned} unassigned packages · {stats.sealed} sealed and fleet ready.
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							size="sm"
							onClick={() => autoAssignPackingMutation.mutate({})}
							disabled={autoAssignPackingMutation.isPending || stats.unassigned === 0}
							className="h-8 gap-1.5 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
						>
							{autoAssignPackingMutation.isPending ? (
								<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
							) : (
								<BotIcon className="h-3.5 w-3.5" />
							)}
							<span>Auto-Assign Packing Queue ({stats.unassigned})</span>
						</Button>

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
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
				<Card className="shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Total in Packing
								</p>
								<p className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
									{packingLoading ? "..." : stats.total}
								</p>
							</div>
							<div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
								<PackageIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-amber-200/70 bg-amber-50/30 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-amber-800 text-xs uppercase tracking-wider dark:text-amber-400">
									Awaiting Packer
								</p>
								<p className="font-bold text-2xl text-amber-900 tracking-tight sm:text-3xl dark:text-amber-300">
									{packingLoading ? "..." : stats.unassigned}
								</p>
							</div>
							<div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
								<BoxIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-indigo-200/70 bg-indigo-50/30 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-indigo-800 text-xs uppercase tracking-wider dark:text-indigo-400">
									Being Packed
								</p>
								<p className="font-bold text-2xl text-indigo-900 tracking-tight sm:text-3xl dark:text-indigo-300">
									{packingLoading ? "..." : stats.inPacking}
								</p>
							</div>
							<div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
								<PackageCheckIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-emerald-200/70 bg-emerald-50/30 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-emerald-800 text-xs uppercase tracking-wider dark:text-emerald-400">
									Sealed & Fleet Ready
								</p>
								<p className="font-bold text-2xl text-emerald-900 tracking-tight sm:text-3xl dark:text-emerald-300">
									{packingLoading ? "..." : stats.sealed}
								</p>
							</div>
							<div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
								<TruckIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Packing Table */}
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						In-Progress Packing & Dispatch Handoff Queue
					</CardTitle>
					<CardDescription>
						Perform quality audits on items, pack them in boxes and register
						shipment volumetric dimensions
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{packingLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Package Number</TableHead>
										<TableHead>Sales Order ID</TableHead>
										<TableHead>Current State</TableHead>
										<TableHead>Assigned Packer</TableHead>
										<TableHead>E-Way Bill Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPackages.map((pkg) => (
										<TableRow key={pkg.id}>
											<TableCell className="font-semibold text-slate-900 dark:text-slate-100">
												{pkg.package_number}
											</TableCell>
											<TableCell className="font-bold text-slate-800">
												ORD-#{pkg.order_id}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														pkg.status === "packed" ? "default" : "outline"
													}
													className={
														pkg.status === "packing"
															? "border-amber-200 bg-amber-50 text-amber-700"
															: ""
													}
												>
													{pkg.status}
												</Badge>
											</TableCell>
											<TableCell>
												{pkg.worker_name ? (
													<div className="flex items-center gap-2">
														<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 text-xs dark:bg-purple-950/60 dark:text-purple-300">
															{pkg.worker_name.charAt(0).toUpperCase()}
														</span>
														<div className="flex flex-col">
															<span className="font-semibold text-slate-800 text-xs dark:text-slate-200">
																{pkg.worker_name}
															</span>
															{pkg.status === "packing" && (
																<select
																	className="cursor-pointer bg-transparent text-[10px] text-muted-foreground underline hover:text-foreground focus:outline-none"
																	value=""
																	onChange={async (e) => {
																		const val = e.target.value;
																		if (val) {
																			await assignPackingMutation.mutateAsync({
																				packageId: pkg.id,
																				workerId: Number.parseInt(val),
																			});
																		}
																	}}
																>
																	<option value="">Reassign</option>
																	{packerList?.map((s) => (
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
																	await assignPackingMutation.mutateAsync({
																		packageId: pkg.id,
																		workerId: Number.parseInt(val),
																	});
																}
															}}
														>
															<option value="">+ Assign Packer</option>
															{packerList?.map((s) => (
																<option key={s.id} value={s.id}>
																	{s.name} ({s.staff_code || `EMP-${s.id}`})
																</option>
															))}
														</select>

														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																autoAssignPackingMutation.mutate({
																	packageIds: [pkg.id],
																})
															}
															disabled={autoAssignPackingMutation.isPending}
															className="h-7 px-1.5 text-[10px] text-indigo-600 border-indigo-200 hover:bg-indigo-50"
															title="Auto-assign packer"
														>
															<ZapIcon className="h-3 w-3 mr-0.5" /> Auto
														</Button>
													</div>
												)}
											</TableCell>
											<TableCell>
												{pkg.e_way_bill_no ? (
													<Badge className="border-emerald-200 bg-emerald-100 font-mono text-[10px] text-emerald-800">
														{pkg.e_way_bill_no}
													</Badge>
												) : Number(pkg.total_amount || 0) >= 50000 ? (
													<Badge
														variant="destructive"
														className="animate-pulse text-[10px]"
													>
														Required (₹
														{Number(pkg.total_amount).toLocaleString()})
													</Badge>
												) : (
													<span className="text-slate-400 text-xs">
														Optional
													</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end items-center gap-1.5">
													{pkg.status === "packing" ? (
														<Button
															size="sm"
															onClick={() => openPackingModal(pkg)}
															className="h-8 text-xs shadow-sm"
														>
															Seal Box Container
														</Button>
													) : (
														<div className="flex items-center gap-2">
															{!pkg.e_way_bill_no && (
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => openEWayModal(pkg)}
																	className="h-8 border-blue-200 text-blue-600 text-xs shadow-sm hover:bg-blue-50"
																>
																	<FileSpreadsheetIcon className="mr-1 h-3.5 w-3.5" />
																	E-Way Bill
																</Button>
															)}
															<div className="flex items-center gap-1 font-bold text-green-600 text-xs">
																<CheckCircle2Icon className="h-4 w-4" /> Sealed
															</div>
														</div>
													)}

													{/* Raise Packing Exception Button */}
													<Button
														size="sm"
														variant="ghost"
														onClick={() => openIssueModal(pkg)}
														className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400"
														title="Report packing defect or missing item"
													>
														<AlertTriangleIcon className="h-3.5 w-3.5 mr-1" />
														Issue
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
									{filteredPackages.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-12 text-center text-muted-foreground"
											>
												<PackageIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													No packages in dispatch queue.
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

			{/* PACK BOX DIALOG MODAL */}
			<Dialog open={isPackingModalOpen} onOpenChange={setIsPackingModalOpen}>
				<DialogContent className="bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Seal Package Box — {selectedPackage?.package_number}
						</DialogTitle>
						<DialogDescription>
							Validate container dimensions, weight, and hand-off to the
							shipping fleet.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Lot Weight (kg)
							</Label>
							<Input
								type="number"
								placeholder="E.g. 5.4"
								value={pkgWeight}
								onChange={(e) => setPkgWeight(e.target.value)}
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Box Dimensions (L x W x H cm)
							</Label>
							<Input
								placeholder="E.g. 30x20x15"
								value={pkgDimensions}
								onChange={(e) => setPkgDimensions(e.target.value)}
								className="mt-1 h-9 text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Fulfillment Sealing Notes
							</Label>
							<Textarea
								placeholder="Bubble wrapped, fragile label attached..."
								value={pkgNotes}
								onChange={(e) => setPkgNotes(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPackingModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleCompletePacking}
							disabled={packPackageMutation.isPending}
						>
							{packPackageMutation.isPending
								? "Sealing..."
								: "Seal Container & Fleet Handoff"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* GENERATE GOVERNMENT E-WAY BILL MODAL */}
			<Dialog open={isEWayModalOpen} onOpenChange={setIsEWayModalOpen}>
				<DialogContent className="bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-1.5 font-bold text-lg text-slate-900 dark:text-slate-100">
							<FileSpreadsheetIcon className="h-5 w-5 text-blue-500" />
							Government GST E-Way Bill Integration
						</DialogTitle>
						<DialogDescription>
							Register inter-state logistics transits for Order ORD-#
							{selectedEWayPackage?.order_id} directly with GST NIC Portal.
						</DialogDescription>
					</DialogHeader>

					{!isEWayBillConfigured ? (
						<div className="my-2 flex gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs dark:border-red-900/40 dark:bg-red-950/20">
							<AlertTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
							<div className="space-y-1 text-red-700 dark:text-red-300">
								<p className="font-bold">
									E-Way Bill integration not configured
								</p>
								<p className="leading-relaxed">
									Missing GSP credentials or configuration API endpoints. Please
									set{" "}
									<code className="border bg-white px-1 py-0.5 font-mono dark:bg-slate-800">
										EWAY_BILL_USERNAME
									</code>{" "}
									and{" "}
									<code className="border bg-white px-1 py-0.5 font-mono dark:bg-slate-800">
										EWAY_BILL_API_KEY
									</code>{" "}
									environment variables to initiate official connections.
								</p>
							</div>
						</div>
					) : (
						<div className="my-2 rounded-md border border-blue-200 bg-blue-50 p-3 font-medium text-[11px] text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
							API Active: Government Sandbox Endpoint is configured and ready.
						</div>
					)}

					<div className="my-2 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Vehicle Number (Required)
								</Label>
								<Input
									placeholder="E.g. MP-04-HE-1234"
									value={vehicleNo}
									onChange={(e) => setVehicleNo(e.target.value)}
									className="mt-1 h-9 font-bold text-xs uppercase"
									disabled={!isEWayBillConfigured}
								/>
							</div>
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Approx. Distance (km)
								</Label>
								<Input
									type="number"
									placeholder="E.g. 150"
									value={approxDistance}
									onChange={(e) => setApproxDistance(e.target.value)}
									className="mt-1 h-9 text-xs"
									disabled={!isEWayBillConfigured}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Transporter Name
								</Label>
								<Input
									placeholder="E.g. DTDC Express"
									value={transporterName}
									onChange={(e) => setTransporterName(e.target.value)}
									className="mt-1 h-9 text-xs"
									disabled={!isEWayBillConfigured}
								/>
							</div>
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Transport Mode
								</Label>
								<select
									value={modeOfTransport}
									onChange={(e: any) => setModeOfTransport(e.target.value)}
									className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm"
									disabled={!isEWayBillConfigured}
								>
									<option value="road">Roadway</option>
									<option value="rail">Railway</option>
									<option value="air">Airway</option>
									<option value="ship">Shipment</option>
								</select>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsEWayModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleGenerateEWayBill}
							disabled={
								!isEWayBillConfigured || generateEWayBillMutation.isPending
							}
						>
							{generateEWayBillMutation.isPending
								? "Connecting..."
								: "Generate GST E-Way Bill"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* RAISE PACKING ISSUE MODAL */}
			<Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
				<DialogContent className="max-w-lg bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-rose-600 text-lg">
							<AlertOctagonIcon className="h-5 w-5" />
							Raise Packing / Transit Exception · {issueTargetPackage?.package_number}
						</DialogTitle>
						<DialogDescription>
							Flag packaging damage or item discrepancy before final dispatch sealing.
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
								<option value="damaged_item">💥 Damaged Item / Broken Packaging</option>
								<option value="stockout">📦 Missing Line Items in Package</option>
								<option value="barcode_mismatch">🔍 Barcode / Box Label Mismatch</option>
								<option value="order_hold">🛑 Dispatch Hold Request</option>
							</select>
						</div>

						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">Notes & Observation</Label>
							<Textarea
								placeholder="Describe the issue observed at the packing station..."
								value={issueNotes}
								onChange={(e) => setIssueNotes(e.target.value)}
								rows={3}
								className="text-sm"
							/>
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
									Logging...
								</>
							) : (
								"Raise Packing Issue"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
