"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
	ActivityIcon,
	AlertCircleIcon,
	AlertTriangleIcon,
	ArrowLeftIcon,
	BarcodeIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	ClockIcon,
	FileTextIcon,
	Loader2Icon,
	MapPinIcon,
	PackageIcon,
	PlayIcon,
	RefreshCwIcon,
	SaveIcon,
	SearchIcon,
	SendIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	SparklesIcon,
	UserIcon,
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
import { Input } from "@evaluna/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

interface ItemCountState {
	id: number;
	counted_qty: number | "";
	discrepancy_reason: string;
	remarks: string;
}

export default function AuditTaskDetailPage() {
	const params = useParams();
	const router = useRouter();
	const auditId = Number(params?.id);

	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");
	const [filterVarianceOnly, setFilterVarianceOnly] = useState(false);
	const [barcodeInput, setBarcodeInput] = useState("");
	const [itemsState, setItemsState] = useState<Record<number, ItemCountState>>({});
	const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

	const {
		data: auditData,
		isLoading,
		refetch,
	} = trpc.audit.getAudit.useQuery(
		{ auditId },
		{ enabled: !isNaN(auditId) },
	);

	const audit = auditData?.audit;
	const items = auditData?.items ?? [];

	// Sync fetched items to local editable state
	useEffect(() => {
		if (items.length > 0) {
			const initial: Record<number, ItemCountState> = {};
			for (const item of items) {
				initial[item.id] = {
					id: item.id,
					counted_qty: item.counted_qty !== null ? Number(item.counted_qty) : "",
					discrepancy_reason: item.discrepancy_reason ?? "unknown",
					remarks: item.remarks ?? "",
				};
			}
			setItemsState(initial);
		}
	}, [items]);

	// Mutations
	const startMutation = trpc.audit.startAudit.useMutation({
		onSuccess: () => refetch(),
	});

	const saveProgressMutation = trpc.audit.saveAuditProgress.useMutation({
		onSuccess: () => refetch(),
	});

	const submitMutation = trpc.audit.submitAudit.useMutation({
		onSuccess: () => {
			setSubmitConfirmOpen(false);
			refetch();
		},
	});

	const isReadOnly =
		audit?.status === "completed" ||
		audit?.status === "approved" ||
		audit?.status === "discrepancy_review" ||
		audit?.status === "submitted";

	// Handle individual count change
	const handleCountChange = (itemId: number, value: string) => {
		const num = value === "" ? "" : Math.max(0, parseInt(value, 10) || 0);
		setItemsState((prev) => ({
			...prev,
			[itemId]: {
				...(prev[itemId] || { id: itemId, discrepancy_reason: "unknown", remarks: "" }),
				counted_qty: num,
			},
		}));
	};

	const handleReasonChange = (itemId: number, reason: string) => {
		setItemsState((prev) => ({
			...prev,
			[itemId]: {
				...(prev[itemId] || { id: itemId, counted_qty: "", remarks: "" }),
				discrepancy_reason: reason,
			},
		}));
	};

	const handleRemarksChange = (itemId: number, remarks: string) => {
		setItemsState((prev) => ({
			...prev,
			[itemId]: {
				...(prev[itemId] || { id: itemId, counted_qty: "", discrepancy_reason: "unknown" }),
				remarks,
			},
		}));
	};

	// Save all progress
	const handleSave = () => {
		const payload = Object.values(itemsState)
			.filter((it) => it.counted_qty !== "")
			.map((it) => ({
				item_id: it.id,
				counted_qty: Number(it.counted_qty),
				discrepancy_reason: it.discrepancy_reason || undefined,
				remarks: it.remarks || undefined,
			}));

		saveProgressMutation.mutate({
			audit_id: auditId,
			items: payload,
		});
	};

	// Submit audit for manager review
	const handleSubmit = () => {
		const payload = Object.values(itemsState)
			.filter((it) => it.counted_qty !== "")
			.map((it) => ({
				item_id: it.id,
				counted_qty: Number(it.counted_qty),
				discrepancy_reason: it.discrepancy_reason || undefined,
				remarks: it.remarks || undefined,
			}));

		submitMutation.mutate({
			audit_id: auditId,
			items: payload,
		});
	};

	// Quick Barcode Scanning handler: find item by UPC/SKU and auto-increment or focus
	const handleBarcodeScan = (e: React.FormEvent) => {
		e.preventDefault();
		if (!barcodeInput.trim()) return;
		const code = barcodeInput.trim().toLowerCase();

		const matched = items.find(
			(it) =>
				it.product?.upc?.toLowerCase() === code ||
				it.product?.sku?.toLowerCase() === code ||
				it.product?.name?.toLowerCase().includes(code),
		);

		if (matched) {
			const current = itemsState[matched.id]?.counted_qty;
			const nextVal = current === "" ? 1 : Number(current) + 1;
			handleCountChange(matched.id, String(nextVal));
			setSearchQuery(matched.product?.sku || matched.product?.name || "");
			setBarcodeInput("");
		} else {
			alert(`No SKU/UPC matching "${barcodeInput}" found in this audit snapshot.`);
		}
	};

	// Metrics calculation
	const metrics = useMemo(() => {
		let countedCount = 0;
		let matchedCount = 0;
		let varianceCount = 0;
		let totalVarianceQty = 0;

		for (const item of items) {
			const state = itemsState[item.id];
			const counted = state?.counted_qty;
			const expected = item.expected_qty ?? 0;

			if (counted !== "" && counted !== undefined) {
				countedCount++;
				const diff = Number(counted) - expected;
				if (diff !== 0) {
					varianceCount++;
					totalVarianceQty += diff;
				} else {
					matchedCount++;
				}
			}
		}

		const total = items.length;
		const completionRate = total > 0 ? Math.round((countedCount / total) * 100) : 0;

		return {
			total,
			countedCount,
			matchedCount,
			varianceCount,
			totalVarianceQty,
			completionRate,
		};
	}, [items, itemsState]);

	// Filtered items list
	const filteredItems = useMemo(() => {
		return items.filter((item) => {
			const state = itemsState[item.id];
			const counted = state?.counted_qty;
			const expected = item.expected_qty ?? 0;
			const hasVariance = counted !== "" && counted !== undefined && Number(counted) !== expected;

			if (filterVarianceOnly && !hasVariance) return false;

			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return (
				item.product?.name?.toLowerCase().includes(q) ||
				item.product?.sku?.toLowerCase().includes(q) ||
				item.product?.upc?.toLowerCase().includes(q) ||
				item.location?.name?.toLowerCase().includes(q)
			);
		});
	}, [items, itemsState, searchQuery, filterVarianceOnly]);

	if (isLoading) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="text-center">
					<Loader2Icon className="mx-auto h-8 w-8 animate-spin text-blue-600" />
					<p className="mt-2 text-xs text-muted-foreground">Loading audit task details...</p>
				</div>
			</div>
		);
	}

	if (!audit) {
		return (
			<div className="flex h-96 flex-col items-center justify-center gap-3">
				<AlertCircleIcon className="h-10 w-10 text-rose-500" />
				<h2 className="text-lg font-semibold">Audit Task Not Found</h2>
				<p className="text-xs text-muted-foreground">The requested audit ID #{auditId} does not exist.</p>
				<Button size="sm" asChild>
					<Link href="/auditor/tasks">Back to Tasks</Link>
				</Button>
			</div>
		);
	}

	return (
		<PageTransition className="space-y-6">
			{/* Top Navigation & Actions */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div className="flex items-center gap-3">
					<Button variant="outline" size="icon" asChild className="h-8 w-8">
						<Link href="/auditor/tasks">
							<ArrowLeftIcon className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
								Audit #{audit.id} Workspace
							</h1>
							<Badge
								variant="outline"
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
						</div>
						<p className="mt-0.5 text-muted-foreground text-xs">
							{audit.location_name ? `${audit.location_name} • ` : ""}
							{audit.branch?.name ?? `Branch #${audit.branch_id}`} •{" "}
							<span className="capitalize">{audit.audit_type?.replace("_", " ") || "Full Audit"}</span>
						</p>
					</div>
				</div>

				{/* Header Actions */}
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						className="text-xs"
					>
						<RefreshCwIcon className="mr-1.5 h-3.5 w-3.5" /> Refresh
					</Button>

					{audit.status === "planned" || audit.status === "pending" ? (
						<Button
							size="sm"
							onClick={() => startMutation.mutate({ audit_id: auditId })}
							disabled={startMutation.isPending}
							className="text-xs bg-blue-600 hover:bg-blue-700"
						>
							<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
							{startMutation.isPending ? "Starting..." : "Start Count Task"}
						</Button>
					) : null}

					{!isReadOnly && (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={handleSave}
								disabled={saveProgressMutation.isPending}
								className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
							>
								<SaveIcon className="mr-1.5 h-3.5 w-3.5" />
								{saveProgressMutation.isPending ? "Saving..." : "Save Progress"}
							</Button>

							<Dialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
								<DialogTrigger asChild>
									<Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700">
										<SendIcon className="mr-1.5 h-3.5 w-3.5" /> Submit Audit
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[420px]">
									<DialogHeader>
										<DialogTitle>Submit Inventory Audit #{audit.id}?</DialogTitle>
										<DialogDescription>
											This will finalize the physical count snapshot. If variances are detected (
											{metrics.varianceCount} items), this audit will be forwarded to the Warehouse
											Manager for discrepancy review and stock adjustment reconciliation.
										</DialogDescription>
									</DialogHeader>
									<div className="py-2 text-xs space-y-2">
										<div className="flex justify-between border-b pb-1 text-muted-foreground">
											<span>Total Items Counted:</span>
											<span className="font-semibold text-foreground">
												{metrics.countedCount} / {metrics.total}
											</span>
										</div>
										<div className="flex justify-between border-b pb-1 text-muted-foreground">
											<span>Variances Detected:</span>
											<span className={`font-semibold ${metrics.varianceCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
												{metrics.varianceCount} SKUs
											</span>
										</div>
									</div>
									<DialogFooter>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setSubmitConfirmOpen(false)}
											className="text-xs"
										>
											Cancel
										</Button>
										<Button
											size="sm"
											onClick={handleSubmit}
											disabled={submitMutation.isPending}
											className="text-xs bg-emerald-600 hover:bg-emerald-700"
										>
											{submitMutation.isPending ? "Submitting..." : "Confirm & Submit Audit"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</>
					)}
				</div>
			</div>

			{/* Progress & Live Metrics Strip */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
				<Card className="border-border/60 bg-card p-4">
					<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
						Count Progress
					</p>
					<div className="mt-1 flex items-baseline justify-between">
						<span className="text-xl font-bold text-foreground">
							{metrics.countedCount} / {metrics.total}
						</span>
						<span className="text-xs font-semibold text-blue-600">
							{metrics.completionRate}%
						</span>
					</div>
					<div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
						<div
							className={`h-full transition-all ${
								metrics.completionRate === 100 ? "bg-emerald-500" : "bg-blue-500"
							}`}
							style={{ width: `${metrics.completionRate}%` }}
						/>
					</div>
				</Card>

				<Card className="border-border/60 bg-card p-4">
					<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
						Matched Stock
					</p>
					<div className="mt-1 flex items-baseline justify-between">
						<span className="text-xl font-bold text-emerald-600">
							{metrics.matchedCount}
						</span>
						<ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
					</div>
					<p className="mt-1 text-[11px] text-muted-foreground">Count matches system</p>
				</Card>

				<Card className="border-border/60 bg-card p-4">
					<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
						Variances Found
					</p>
					<div className="mt-1 flex items-baseline justify-between">
						<span className={`text-xl font-bold ${metrics.varianceCount > 0 ? "text-rose-600" : "text-muted-foreground"}`}>
							{metrics.varianceCount}
						</span>
						<AlertTriangleIcon className="h-4 w-4 text-rose-500" />
					</div>
					<p className="mt-1 text-[11px] text-muted-foreground">SKUs with count mismatch</p>
				</Card>

				<Card className="border-border/60 bg-card p-4">
					<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
						Net Unit Variance
					</p>
					<div className="mt-1 flex items-baseline justify-between">
						<span className={`text-xl font-bold ${metrics.totalVarianceQty < 0 ? "text-rose-600" : metrics.totalVarianceQty > 0 ? "text-amber-600" : "text-emerald-600"}`}>
							{metrics.totalVarianceQty > 0 ? `+${metrics.totalVarianceQty}` : metrics.totalVarianceQty}
						</span>
						<PackageIcon className="h-4 w-4 text-muted-foreground" />
					</div>
					<p className="mt-1 text-[11px] text-muted-foreground">Total unit discrepancy</p>
				</Card>

				<Card className="border-border/60 bg-card p-4 col-span-2 lg:col-span-1">
					<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
						Auditor Notes
					</p>
					<p className="mt-1 text-xs text-muted-foreground line-clamp-2">
						{audit.notes || "No special instructions provided."}
					</p>
				</Card>
			</div>

			{/* Barcode Quick Scan Bar + Table Search */}
			<Card className="border-border/60 bg-card p-4 shadow-sm">
				<div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
					{/* Fast Barcode Scanner Form */}
					<form onSubmit={handleBarcodeScan} className="flex gap-2 w-full sm:w-auto flex-1 max-w-md">
						<div className="relative flex-1">
							<BarcodeIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Scan UPC / SKU barcode..."
								value={barcodeInput}
								onChange={(e) => setBarcodeInput(e.target.value)}
								disabled={isReadOnly}
								className="pl-8 text-xs font-mono"
							/>
						</div>
						<Button type="submit" size="sm" disabled={isReadOnly} className="text-xs shrink-0">
							Scan / +1
						</Button>
					</form>

					{/* Filter controls */}
					<div className="flex items-center gap-3 w-full sm:w-auto">
						<div className="relative flex-1 sm:w-60">
							<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search items in table..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8 text-xs"
							/>
						</div>

						<Button
							variant={filterVarianceOnly ? "default" : "outline"}
							size="sm"
							onClick={() => setFilterVarianceOnly(!filterVarianceOnly)}
							className="text-xs shrink-0"
						>
							<AlertTriangleIcon className="mr-1 h-3.5 w-3.5" />
							{filterVarianceOnly ? "Show All" : "Only Variances"}
						</Button>
					</div>
				</div>
			</Card>

			{/* Physical Count Table */}
			<Card className="border-border/60 bg-card shadow-sm">
				<CardHeader className="flex flex-row items-center justify-between pb-3">
					<div>
						<CardTitle className="text-base">Physical Count Inventory Grid</CardTitle>
						<CardDescription className="text-xs">
							Enter physical counted quantities. Variances are automatically calculated in real-time.
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{filteredItems.length === 0 ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							No items match the current filter or search criteria.
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[60px]">#</TableHead>
										<TableHead className="min-w-[200px]">Product / SKU / UPC</TableHead>
										<TableHead>Location / Bin</TableHead>
										<TableHead className="w-[120px] text-center">System Qty</TableHead>
										<TableHead className="w-[140px] text-center">Physical Count</TableHead>
										<TableHead className="w-[120px] text-center">Variance</TableHead>
										<TableHead className="min-w-[180px]">Discrepancy Reason</TableHead>
										<TableHead className="min-w-[180px]">Remarks / Notes</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredItems.map((item, idx) => {
										const state = itemsState[item.id] || {
											id: item.id,
											counted_qty: "",
											discrepancy_reason: "unknown",
											remarks: "",
										};
										const countedVal = state.counted_qty;
										const expectedVal = item.expected_qty ?? 0;
										const isCounted = countedVal !== "" && countedVal !== undefined;
										const variance = isCounted ? Number(countedVal) - expectedVal : null;
										const hasVariance = variance !== null && variance !== 0;

										return (
											<TableRow
												key={item.id}
												className={`transition-colors ${
													hasVariance
														? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/60"
														: isCounted
															? "bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/50"
															: "hover:bg-muted/50"
												}`}
											>
												<TableCell className="font-mono text-xs text-muted-foreground">
													{idx + 1}
												</TableCell>
												<TableCell>
													<div className="font-medium text-xs text-foreground">
														{item.product?.name ?? `Product #${item.product_id}`}
													</div>
													<div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
														{item.product?.sku && <span>SKU: {item.product.sku}</span>}
														{item.product?.upc && <span>• UPC: {item.product.upc}</span>}
													</div>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{item.location?.name ?? "Default Location"}
												</TableCell>
												<TableCell className="text-center font-mono font-semibold text-xs text-foreground">
													{expectedVal}
												</TableCell>
												<TableCell className="text-center">
													<Input
														type="number"
														min={0}
														placeholder="—"
														value={countedVal}
														onChange={(e) => handleCountChange(item.id, e.target.value)}
														disabled={isReadOnly}
														className="h-8 w-24 text-center font-mono text-xs mx-auto"
													/>
												</TableCell>
												<TableCell className="text-center">
													{variance === null ? (
														<Badge variant="outline" className="text-[11px] text-muted-foreground">
															Uncounted
														</Badge>
													) : variance === 0 ? (
														<Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 text-[11px]">
															<CheckCircle2Icon className="mr-1 h-3 w-3" /> Matched (0)
														</Badge>
													) : (
														<Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 text-[11px] font-mono font-bold">
															<AlertTriangleIcon className="mr-1 h-3 w-3" />
															{variance > 0 ? `+${variance}` : variance}
														</Badge>
													)}
												</TableCell>
												<TableCell>
													{hasVariance ? (
														<Select
															value={state.discrepancy_reason || "unknown"}
															onValueChange={(val) => handleReasonChange(item.id, val)}
															disabled={isReadOnly}
														>
															<SelectTrigger className="h-8 text-xs">
																<SelectValue placeholder="Reason" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="damaged" className="text-xs">Damaged / Expired Stock</SelectItem>
																<SelectItem value="theft" className="text-xs">Theft / Unexplained Loss</SelectItem>
																<SelectItem value="misplaced" className="text-xs">Misplaced in Other Bin</SelectItem>
																<SelectItem value="data_entry" className="text-xs">Data Entry / Receiving Error</SelectItem>
																<SelectItem value="found_extra" className="text-xs">Found Extra / Unrecorded</SelectItem>
																<SelectItem value="unknown" className="text-xs">Under Investigation / Unknown</SelectItem>
															</SelectContent>
														</Select>
													) : (
														<span className="text-[11px] text-muted-foreground">—</span>
													)}
												</TableCell>
												<TableCell>
													<Input
														placeholder="Add audit notes..."
														value={state.remarks || ""}
														onChange={(e) => handleRemarksChange(item.id, e.target.value)}
														disabled={isReadOnly}
														className="h-8 text-xs"
													/>
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
