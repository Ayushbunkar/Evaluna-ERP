"use client";

import { useEffect, useState } from "react";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
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
	AlertCircleIcon,
	AlertTriangleIcon,
	ArrowLeftIcon,
	BarcodeIcon,
	BoxesIcon,
	CheckCircle2Icon,
	CheckSquareIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	ClockIcon,
	EyeOffIcon,
	MinusIcon,
	PackageCheckIcon,
	PlayIcon,
	PlusIcon,
	RefreshCwIcon,
	RotateCcwIcon,
	SaveIcon,
	SearchIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	SlidersHorizontalIcon,
	SparklesIcon,
	UserCheckIcon,
	WarehouseIcon,
	XIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function EmployeeAuditCountWorkspace() {
	const trpc = useTRPC();

	// Tab states: active, completed, all
	const [statusTab, setStatusTab] = useState<"active" | "completed" | "all">(
		"active",
	);
	const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);

	// In-sheet states
	const [itemSearchQuery, setItemSearchQuery] = useState("");
	const [countsMap, setCountsMap] = useState<
		Record<number, { count: number | null; remarks: string; reason: string }>
	>({});
	const [recountsMap, setRecountsMap] = useState<
		Record<number, { count: number | null; notes: string }>
	>({});

	// Queries
	const {
		data: myAudits,
		isLoading: myAuditsLoading,
		refetch: refetchMyAudits,
	} = trpc.audit.getMyAudits.useQuery({
		status: statusTab,
	});

	const {
		data: activeAuditData,
		isLoading: activeAuditLoading,
		refetch: refetchActiveAudit,
	} = trpc.audit.getAudit.useQuery(
		{ auditId: selectedAuditId ?? 0 },
		{ enabled: !!selectedAuditId },
	);

	// Sync loaded audit lines into local state
	useEffect(() => {
		if (activeAuditData?.items) {
			const initialCounts: Record<
				number,
				{ count: number | null; remarks: string; reason: string }
			> = {};
			const initialRecounts: Record<
				number,
				{ count: number | null; notes: string }
			> = {};

			for (const item of activeAuditData.items) {
				initialCounts[item.id] = {
					count: item.counted_qty !== null ? Number(item.counted_qty) : null,
					remarks: item.remarks || "",
					reason: item.discrepancy_reason || "",
				};
				initialRecounts[item.id] = {
					count: item.recount_qty !== null ? Number(item.recount_qty) : null,
					notes: item.recount_notes || "",
				};
			}

			setCountsMap(initialCounts);
			setRecountsMap(initialRecounts);
		}
	}, [activeAuditData]);

	// Mutations
	const startAuditMutation = trpc.audit.startAudit.useMutation({
		onSuccess: () => {
			toast.success("Audit verification started!");
			refetchActiveAudit();
			refetchMyAudits();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to start audit.");
		},
	});

	const saveProgressMutation = trpc.audit.recordCountProgress.useMutation({
		onSuccess: () => {
			toast.success("Count progress draft saved.");
			refetchActiveAudit();
			refetchMyAudits();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to save count draft.");
		},
	});

	const submitCountMutation = trpc.audit.submitCountLines.useMutation({
		onSuccess: (res) => {
			if (res.status === "completed") {
				toast.success("Count submitted successfully! 100% matched benchmark.");
			} else {
				toast.warning(
					`Count submitted with ${res.discrepancyCount} variance line(s) for manager review.`,
				);
			}
			setSelectedAuditId(null);
			refetchMyAudits();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to submit count.");
		},
	});

	const submitRecountMutation = trpc.audit.submitRecount.useMutation({
		onSuccess: () => {
			toast.success("Recount successfully returned to manager for review.");
			setSelectedAuditId(null);
			refetchMyAudits();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to submit recount.");
		},
	});

	const handleSetCount = (itemId: number, countValue: number | null) => {
		setCountsMap((prev) => ({
			...prev,
			[itemId]: {
				...prev[itemId],
				count: countValue,
			},
		}));
	};

	const handleSetRecount = (itemId: number, countValue: number | null) => {
		setRecountsMap((prev) => ({
			...prev,
			[itemId]: {
				...prev[itemId],
				count: countValue,
			},
		}));
	};

	const handleSaveDraft = () => {
		if (!selectedAuditId || !activeAuditData) return;

		const itemsToSave = Object.entries(countsMap)
			.filter(([_, val]) => val.count !== null)
			.map(([id, val]) => ({
				item_id: Number(id),
				counted_qty: Number(val.count),
				remarks: val.remarks,
			}));

		if (itemsToSave.length === 0) {
			toast.info("No counted lines to save.");
			return;
		}

		saveProgressMutation.mutate({
			audit_id: selectedAuditId,
			items: itemsToSave,
		});
	};

	const handleSubmitCount = () => {
		if (!selectedAuditId || !activeAuditData) return;

		const uncountedItems = activeAuditData.items.filter(
			(i) => countsMap[i.id]?.count === null || countsMap[i.id]?.count === undefined,
		);

		if (uncountedItems.length > 0) {
			toast.error(
				`Please count all lines (${uncountedItems.length} lines remaining). Enter "0" if item is empty.`,
			);
			return;
		}

		const itemsToSubmit = activeAuditData.items.map((i) => ({
			item_id: i.id,
			counted_qty: Number(countsMap[i.id].count),
			remarks: countsMap[i.id].remarks || undefined,
			discrepancy_reason: countsMap[i.id].reason || undefined,
		}));

		submitCountMutation.mutate({
			audit_id: selectedAuditId,
			items: itemsToSubmit,
		});
	};

	const handleSubmitRecount = () => {
		if (!selectedAuditId || !activeAuditData) return;

		const recountRequestedItems = activeAuditData.items.filter(
			(i) => i.status === "recount_requested",
		);

		const itemsToSubmit = recountRequestedItems.map((i) => ({
			item_id: i.id,
			recount_qty: Number(recountsMap[i.id]?.count ?? countsMap[i.id]?.count ?? 0),
			notes: recountsMap[i.id]?.notes || undefined,
		}));

		submitRecountMutation.mutate({
			audit_id: selectedAuditId,
			items: itemsToSubmit,
		});
	};

	const isBlindAudit = activeAuditData?.audit?.counting_method === "blind";
	const isRecountMode = activeAuditData?.audit?.status === "recount_requested";

	const filteredItems = (activeAuditData?.items || []).filter((item) => {
		if (!itemSearchQuery) return true;
		const query = itemSearchQuery.toLowerCase();
		return (
			item.product?.name?.toLowerCase().includes(query) ||
			item.product?.sku?.toLowerCase().includes(query) ||
			item.product?.barcode?.toLowerCase().includes(query)
		);
	});

	const countedCount = Object.values(countsMap).filter(
		(v) => v.count !== null,
	).length;
	const totalCount = activeAuditData?.items?.length || 0;
	const progressPercent =
		totalCount > 0 ? Math.round((countedCount / totalCount) * 100) : 0;

	return (
		<PageTransition className="container mx-auto space-y-6 p-4 sm:p-6">
			{/* Command Header Banner */}
			<div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card/90 p-5 sm:p-6 shadow-xs backdrop-blur-md md:flex-row md:items-center">
				<div className="space-y-1">
					<div className="flex items-center gap-2.5">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
							<CheckSquareIcon className="h-5 w-5" />
						</span>
						<div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Physical Stock Count Workspace
							</h1>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Authorized inventory counting sheet, blind verification protocol, barcode lookup, and physical variance reporting.
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2.5">
					<Badge
						variant="outline"
						className="border-primary/20 bg-primary/10 font-bold text-primary text-xs"
					>
						Counter Terminal
					</Badge>

					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetchMyAudits();
							if (selectedAuditId) refetchActiveAudit();
						}}
						className="text-xs h-9 border-border/70 hover:bg-muted"
					>
						<RefreshCwIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />{" "}
						Refresh
					</Button>
				</div>
			</div>

			{/* Task Selector if no audit is actively selected */}
			{!selectedAuditId ? (
				<div className="space-y-4">
					<div className="flex items-center gap-2 border-b border-border/60 pb-3">
						{[
							{ id: "active", label: "Active Count Tasks" },
							{ id: "completed", label: "Completed / Submitted" },
							{ id: "all", label: "All Assigned Tasks" },
						].map((tab) => (
							<Button
								key={tab.id}
								variant={statusTab === tab.id ? "default" : "outline"}
								size="sm"
								onClick={() => setStatusTab(tab.id as any)}
								className={`text-xs h-8 ${
									statusTab === tab.id
										? "bg-blue-600 hover:bg-blue-700 text-white font-semibold"
										: "text-muted-foreground border-border/70 hover:bg-muted"
								}`}
							>
								{tab.label}
							</Button>
						))}
					</div>

					{/* Task Cards Grid */}
					{myAuditsLoading ? (
						<div className="p-12 text-center text-sm text-muted-foreground">
							Loading count assignments...
						</div>
					) : !myAudits || myAudits.length === 0 ? (
						<div className="p-12 text-center border rounded-2xl border-dashed border-border/80 bg-card/60">
							<BoxesIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
							<p className="text-sm font-semibold text-foreground">
								No pending count assignments
							</p>
							<p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
								You have no assigned inventory verification sheets requiring counting at this moment.
							</p>
						</div>
					) : (
						<StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{myAudits.map((audit) => {
								const isRecount = audit.status === "recount_requested";
								const isCompleted =
									audit.status === "completed" ||
									audit.status === "discrepancy_review";

								return (
									<StaggerItem key={audit.id}>
										<AnimatedCard>
											<Card className="h-full border-l-4 border-l-blue-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:scale-[1.01] hover:shadow-md flex flex-col justify-between">
												<CardHeader className="p-4 pb-2">
													<div className="flex items-center justify-between">
														<span className="font-mono text-xs font-bold text-foreground">
															{audit.audit_number || `AUD-${audit.id}`}
														</span>
														<Badge
															variant="outline"
															className={`text-[10px] capitalize font-medium ${
																isRecount
																	? "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300"
																	: isCompleted
																		? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
																		: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
															}`}
														>
															{isRecount
																? "Recount Required"
																: audit.status?.replace("_", " ")}
														</Badge>
													</div>

													<CardTitle className="text-sm font-bold text-foreground mt-1">
														{audit.title}
													</CardTitle>

													<CardDescription className="text-xs text-muted-foreground">
														{audit.branch?.name || "Main Warehouse Hub"}
														{audit.location_name && ` • Zone: ${audit.location_name}`}
													</CardDescription>
												</CardHeader>

												<CardContent className="p-4 pt-2 space-y-3">
													<div className="flex items-center gap-1.5">
														<Badge
															variant="outline"
															className={`text-[10px] uppercase font-semibold ${
																audit.counting_method === "blind"
																	? "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
																	: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
															}`}
														>
															{audit.counting_method === "blind" ? (
																<span className="flex items-center gap-1">
																	<EyeOffIcon className="h-2.5 w-2.5" /> Blind Count
																</span>
															) : (
																"Assisted Count"
															)}
														</Badge>

														<Badge
															variant="outline"
															className="text-[10px] uppercase font-semibold text-muted-foreground"
														>
															{audit.audit_type?.replace("_", " ") || "Cycle Count"}
														</Badge>
													</div>

													{/* Progress meter */}
													<div className="space-y-1">
														<div className="flex justify-between text-[11px] text-muted-foreground font-mono">
															<span>
																{audit.countedLines} of {audit.totalLines} lines
																counted
															</span>
															<span className="font-semibold text-foreground">
																{audit.progressPercent}%
															</span>
														</div>
														<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
															<div
																className={`h-full rounded-full transition-all ${
																	audit.progressPercent === 100
																		? "bg-emerald-500"
																		: "bg-blue-600"
																}`}
																style={{ width: `${audit.progressPercent}%` }}
															/>
														</div>
													</div>

													{isRecount && (
														<div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-[11px] text-purple-800 dark:text-purple-300">
															<span className="font-semibold">Recount Reason:</span>{" "}
															{audit.review_notes || "Manager requested a recount."}
														</div>
													)}
												</CardContent>

												<CardFooter className="p-4 pt-0">
													<Button
														size="sm"
														onClick={() => setSelectedAuditId(audit.id)}
														className="w-full text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium"
													>
														{isRecount ? (
															<>
																<RotateCcwIcon className="mr-1.5 h-3.5 w-3.5" /> Open
																Recount Sheet
															</>
														) : isCompleted ? (
															<>
																<ClipboardCheckIcon className="mr-1.5 h-3.5 w-3.5" />{" "}
																View Count Summary
															</>
														) : audit.status === "in_progress" ? (
															<>
																<CheckSquareIcon className="mr-1.5 h-3.5 w-3.5" />{" "}
																Resume Counting
															</>
														) : (
															<>
																<PlayIcon className="mr-1.5 h-3.5 w-3.5" /> Start
																Counting
															</>
														)}
													</Button>
												</CardFooter>
											</Card>
										</AnimatedCard>
									</StaggerItem>
								);
							})}
						</StaggerList>
					)}
				</div>
			) : (
				/* ══════════════════════════════════════════════════════════════════════
				    ACTIVE INTERACTIVE COUNT SHEET
				══════════════════════════════════════════════════════════════════════ */
				<div className="space-y-4">
					{/* Active Toolbar */}
					<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
						<CardContent className="p-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setSelectedAuditId(null)}
										className="text-xs h-8 border-border/70 hover:bg-muted"
									>
										<ArrowLeftIcon className="mr-1.5 h-3.5 w-3.5" /> Back to Tasks
									</Button>

									<div>
										<div className="flex items-center gap-2">
											<span className="font-mono text-xs font-bold text-foreground">
												{activeAuditData?.audit?.audit_number ||
													`AUD-${selectedAuditId}`}
											</span>
											<span className="text-xs font-bold text-foreground">
												{activeAuditData?.audit?.title}
											</span>
											<Badge
												variant="outline"
												className={`text-[10px] uppercase font-semibold ${
													isBlindAudit
														? "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
														: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
												}`}
											>
												{isBlindAudit ? "Blind Count" : "Assisted Count"}
											</Badge>
										</div>
										<p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
											Hub: {activeAuditData?.audit?.branch?.name} • Lines:{" "}
											{totalCount} • Counted: {countedCount}
										</p>
									</div>
								</div>

								{/* Submission Actions */}
								<div className="flex items-center gap-2">
									{activeAuditData?.audit?.status === "planned" && (
										<Button
											size="sm"
											onClick={() =>
												startAuditMutation.mutate({
													audit_id: selectedAuditId,
												})
											}
											disabled={startAuditMutation.isPending}
											className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium"
										>
											<PlayIcon className="mr-1.5 h-3.5 w-3.5" /> Start Counting
										</Button>
									)}

									{activeAuditData?.audit?.status !== "completed" && (
										<>
											<Button
												variant="outline"
												size="sm"
												onClick={handleSaveDraft}
												disabled={saveProgressMutation.isPending}
												className="text-xs h-8 border-border/70 hover:bg-muted"
											>
												<SaveIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />{" "}
												Save Draft
											</Button>

											{isRecountMode ? (
												<Button
													size="sm"
													onClick={handleSubmitRecount}
													disabled={submitRecountMutation.isPending}
													className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm"
												>
													<SendIcon className="mr-1.5 h-3.5 w-3.5" /> Submit Recount
												</Button>
											) : (
												<Button
													size="sm"
													onClick={handleSubmitCount}
													disabled={submitCountMutation.isPending}
													className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
												>
													<SendIcon className="mr-1.5 h-3.5 w-3.5" /> Submit Count
												</Button>
											)}
										</>
									)}
								</div>
							</div>

							{/* Progress Bar */}
							<div className="mt-3 space-y-1">
								<div className="flex justify-between text-[11px] text-muted-foreground font-mono">
									<span>Count Progress</span>
									<span>
										{countedCount} / {totalCount} items ({progressPercent}%)
									</span>
								</div>
								<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
									<div
										className="h-full bg-blue-600 transition-all rounded-full"
										style={{ width: `${progressPercent}%` }}
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Blind Count Notice Banner */}
					{isBlindAudit && activeAuditData?.audit?.status !== "completed" && (
						<div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3.5 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-300">
							<EyeOffIcon className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold">Blind Count Protocol Active:</span>{" "}
								System expected stock is hidden to eliminate confirmation bias. Count actual physical stock present on the shelf/bin and record accurately.
							</div>
						</div>
					)}

					{/* Recount Notice Banner */}
					{isRecountMode && (
						<div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
							<RotateCcwIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold">Recount Requested by Manager:</span>{" "}
								{activeAuditData.audit?.review_notes || "Please re-verify the highlighted lines."}
							</div>
						</div>
					)}

					{/* Fast Barcode / SKU Filter Input */}
					<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
						<CardContent className="p-3">
							<div className="relative">
								<BarcodeIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Scan barcode or type SKU / product name to jump to item..."
									value={itemSearchQuery}
									onChange={(e) => setItemSearchQuery(e.target.value)}
									className="pl-9 text-xs h-9 font-mono bg-background"
								/>
							</div>
						</CardContent>
					</Card>

					{/* Count Lines Table */}
					<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md overflow-hidden">
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader className="bg-muted/30">
										<TableRow className="text-xs">
											<TableHead className="w-12 text-center">#</TableHead>
											<TableHead>Product Identifier & Details</TableHead>
											{!isBlindAudit && (
												<TableHead className="text-right">
													Expected Benchmark
												</TableHead>
											)}
											<TableHead className="w-60 text-center">
												Physical Count Entry
											</TableHead>
											{isRecountMode && (
												<TableHead className="w-48 text-center">
													Recount Entry
												</TableHead>
											)}
											<TableHead>Condition / Notes</TableHead>
											<TableHead className="w-24 text-center">Status</TableHead>
										</TableRow>
									</TableHeader>

									<TableBody>
										{filteredItems.map((item, index) => {
											const currentCount = countsMap[item.id]?.count ?? null;
											const isCounted = currentCount !== null;
											const needsRecount = item.status === "recount_requested";

											return (
												<TableRow
													key={item.id}
													className={`text-xs transition-colors ${
														needsRecount
															? "bg-purple-500/10 ring-1 ring-purple-500/30"
															: isCounted
																? "bg-blue-500/5 dark:bg-blue-950/10"
																: ""
													}`}
												>
													{/* Index */}
													<TableCell className="text-center font-mono text-muted-foreground text-[11px]">
														{index + 1}
													</TableCell>

													{/* Product info */}
													<TableCell>
														<div>
															<p className="font-semibold text-foreground text-xs">
																{item.product?.name || `Product #${item.product_id}`}
															</p>
															<div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
																<span>SKU: {item.product?.sku || "N/A"}</span>
																<span>•</span>
																<span>Barcode: {item.product?.barcode || "N/A"}</span>
															</div>
														</div>
													</TableCell>

													{/* Assisted expected qty */}
													{!isBlindAudit && (
														<TableCell className="text-right font-mono font-semibold text-foreground">
															{item.expected_qty ?? "—"}
														</TableCell>
													)}

													{/* Count Entry Controls */}
													<TableCell>
														<div className="flex items-center justify-center gap-1.5">
															{/* Decrement */}
															<Button
																variant="outline"
																size="icon"
																onClick={() =>
																	handleSetCount(
																		item.id,
																		Math.max(0, (currentCount ?? 0) - 1),
																	)
																}
																className="h-7 w-7 text-xs border-border/80"
															>
																<MinusIcon className="h-3 w-3" />
															</Button>

															{/* Direct numeric input */}
															<Input
																type="number"
																min="0"
																placeholder="Count"
																value={currentCount !== null ? currentCount : ""}
																onChange={(e) => {
																	const val = e.target.value;
																	handleSetCount(
																		item.id,
																		val === "" ? null : Math.max(0, Number(val)),
																	);
																}}
																className="h-7 w-20 text-center text-xs font-bold font-mono bg-background"
															/>

															{/* Increment */}
															<Button
																variant="outline"
																size="icon"
																onClick={() =>
																	handleSetCount(item.id, (currentCount ?? 0) + 1)
																}
																className="h-7 w-7 text-xs border-border/80"
															>
																<PlusIcon className="h-3 w-3" />
															</Button>

															{/* Explicit Zero Pill button */}
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleSetCount(item.id, 0)}
																title="Mark as 0 (Out of stock)"
																className="h-7 px-2 text-[10px] font-mono text-muted-foreground hover:text-foreground border-border/80"
															>
																0
															</Button>
														</div>
													</TableCell>

													{/* Recount Entry if applicable */}
													{isRecountMode && (
														<TableCell>
															<div className="flex items-center justify-center gap-1.5">
																<Input
																	type="number"
																	min="0"
																	placeholder="Recount"
																	value={
																		recountsMap[item.id]?.count !== null
																			? recountsMap[item.id]?.count ?? ""
																			: ""
																	}
																	onChange={(e) => {
																		const val = e.target.value;
																		handleSetRecount(
																			item.id,
																			val === "" ? null : Math.max(0, Number(val)),
																		);
																	}}
																	className="h-7 w-20 text-center text-xs font-bold font-mono border-purple-500/30 bg-background"
																/>
															</div>
														</TableCell>
													)}

													{/* Remarks */}
													<TableCell>
														<Input
															placeholder="Damage, expiry, location notes..."
															value={countsMap[item.id]?.remarks ?? ""}
															onChange={(e) =>
																setCountsMap((prev) => ({
																	...prev,
																	[item.id]: {
																		...prev[item.id],
																		remarks: e.target.value,
																	},
																}))
															}
															className="h-7 text-[11px] bg-background"
														/>
													</TableCell>

													{/* Status */}
													<TableCell className="text-center">
														{needsRecount ? (
															<Badge
																variant="outline"
																className="text-[10px] border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300"
															>
																Recount
															</Badge>
														) : isCounted ? (
															<Badge
																variant="outline"
																className="text-[10px] border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
															>
																Counted
															</Badge>
														) : (
															<Badge
																variant="outline"
																className="text-[10px] border-border text-muted-foreground"
															>
																Pending
															</Badge>
														)}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						</CardContent>

						{/* Footer Bar */}
						<CardFooter className="p-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/10">
							<div className="text-xs text-muted-foreground font-mono">
								<span className="font-semibold text-foreground">
									{countedCount}
								</span>{" "}
								of {totalCount} lines verified ({progressPercent}% finished).
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleSaveDraft}
									disabled={saveProgressMutation.isPending}
									className="text-xs h-8 border-border/70 hover:bg-muted"
								>
									<SaveIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />{" "}
									Save Progress Draft
								</Button>

								{isRecountMode ? (
									<Button
										size="sm"
										onClick={handleSubmitRecount}
										disabled={submitRecountMutation.isPending}
										className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm"
									>
										<ClipboardCheckIcon className="mr-1.5 h-3.5 w-3.5" /> Submit Recount
									</Button>
								) : (
									<Button
										size="sm"
										onClick={handleSubmitCount}
										disabled={submitCountMutation.isPending}
										className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
									>
										<CheckSquareIcon className="mr-1.5 h-3.5 w-3.5" /> Submit Completed Count
									</Button>
								)}
							</div>
						</CardFooter>
					</Card>
				</div>
			)}
		</PageTransition>
	);
}
