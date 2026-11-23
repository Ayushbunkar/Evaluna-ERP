"use client";

import { useState } from "react";
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
	ActivityIcon,
	AlertOctagonIcon,
	AlertTriangleIcon,
	BarcodeIcon,
	BoxesIcon,
	CalendarIcon,
	CheckCircle2Icon,
	CheckSquareIcon,
	ClockIcon,
	CompassIcon,
	FilterIcon,
	IndianRupeeIcon,
	LayersIcon,
	PackageCheckIcon,
	PackageIcon,
	PlusIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	SlidersHorizontalIcon,
	SparklesIcon,
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

export default function WarehouseBatchesPage() {
	const trpc = useTRPC();

	// Branch and filter states
	const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "expired" | "critical_30" | "warning_60" | "healthy"
	>("all");
	const [sortBy, setSortBy] = useState<
		"expiry_asc" | "expiry_desc" | "qty_desc" | "newest"
	>("expiry_asc");

	// FEFO Simulator Modal State
	const [isFEFOModalOpen, setIsFEFOModalOpen] = useState(false);
	const [fefoProductId, setFefoProductId] = useState<number | undefined>(undefined);
	const [fefoRequiredQty, setFefoRequiredQty] = useState<number>(10);

	// Create Batch Modal State
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [createProductId, setCreateProductId] = useState<number | undefined>(undefined);
	const [createBatchNumber, setCreateBatchNumber] = useState("");
	const [createQuantity, setCreateQuantity] = useState("50");
	const [createMrp, setCreateMrp] = useState("120");
	const [createSellingPrice, setCreateSellingPrice] = useState("100");
	const [createPurchasePrice, setCreatePurchasePrice] = useState("75");
	const [createLocation, setCreateLocation] = useState("Rack B-04");
	const [createManufactureDate, setCreateManufactureDate] = useState("");
	const [createExpiryDate, setCreateExpiryDate] = useState("");
	const [productSearchInput, setProductSearchInput] = useState("");

	// Data Queries
	const {
		data: stats,
		isLoading: statsLoading,
		refetch: refetchStats,
	} = trpc.batches.getStats.useQuery({ branchId: selectedBranchId });

	const {
		data: batchData,
		isLoading: batchesLoading,
		refetch: refetchBatches,
	} = trpc.batches.list.useQuery({
		branchId: selectedBranchId,
		search: searchQuery || undefined,
		status: statusFilter,
		sortBy,
		limit: 100,
	});

	const { data: productsList } = trpc.products.list.useQuery(
		{ search: productSearchInput || undefined, limit: 50 },
		{ enabled: isCreateModalOpen || isFEFOModalOpen },
	);

	const { data: fefoRecommendation, isLoading: fefoLoading } =
		trpc.batches.getFEFORecommendations.useQuery(
			{
				productId: fefoProductId ?? 0,
				branchId: selectedBranchId,
				requiredQty: fefoRequiredQty,
			},
			{ enabled: !!fefoProductId && isFEFOModalOpen },
		);

	// Mutations
	const createBatchMutation = trpc.batches.create.useMutation({
		onSuccess: (data) => {
			toast.success(
				`Batch "${data.batch.batch_number}" created and recorded in FIFO stock ledger!`,
			);
			setIsCreateModalOpen(false);
			resetCreateForm();
			refetchBatches();
			refetchStats();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create batch.");
		},
	});

	const resetCreateForm = () => {
		setCreateProductId(undefined);
		setCreateBatchNumber("");
		setCreateQuantity("50");
		setCreateMrp("120");
		setCreateSellingPrice("100");
		setCreatePurchasePrice("75");
		setCreateLocation("Rack B-04");
		setCreateManufactureDate("");
		setCreateExpiryDate("");
		setProductSearchInput("");
	};

	const handleExecuteCreateBatch = () => {
		if (!createProductId) {
			toast.error("Please select a master product.");
			return;
		}
		if (!createBatchNumber.trim()) {
			toast.error("Please enter a batch number.");
			return;
		}
		if (!createExpiryDate) {
			toast.error("Please specify batch expiry date for FEFO tracking.");
			return;
		}

		createBatchMutation.mutate({
			productId: createProductId,
			branchId: selectedBranchId,
			batchNumber: createBatchNumber.trim(),
			quantity: Number(createQuantity) || 0,
			mrp: Number(createMrp) || 0,
			sellingPrice: Number(createSellingPrice) || 0,
			purchasePrice: Number(createPurchasePrice) || 0,
			location: createLocation.trim() || undefined,
			manufactureDate: createManufactureDate || undefined,
			expiryDate: createExpiryDate,
		});
	};

	return (
		<PageTransition>
			<div className="container mx-auto p-4 sm:p-6 space-y-6">
				{/* Top Command Banner */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/90 p-5 backdrop-blur-md shadow-xs">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
								<LayersIcon className="h-5 w-5" />
							</span>
							<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
								Multi-Warehouse Batches & FEFO Expiry Engine
							</h1>
						</div>
						<p className="text-xs sm:text-sm text-muted-foreground">
							First Expired First Out (FEFO) automated allocation, shelf-life surveillance, and lot-level traceability across all warehouse locations.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2.5">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								refetchBatches();
								refetchStats();
								toast.info("Batch inventory refreshed.");
							}}
							disabled={batchesLoading || statsLoading}
							className="text-xs h-9 border-border/70 hover:bg-muted"
						>
							<RefreshCwIcon
								className={`mr-1.5 h-3.5 w-3.5 ${
									batchesLoading ? "animate-spin text-blue-600" : ""
								}`}
							/>
							Live Sync
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsFEFOModalOpen(true)}
							className="text-xs h-9 border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10"
						>
							<CompassIcon className="mr-1.5 h-3.5 w-3.5" />
							FEFO Dispatch Simulator
						</Button>

						<Button
							size="sm"
							onClick={() => setIsCreateModalOpen(true)}
							className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
						>
							<PlusIcon className="mr-1.5 h-3.5 w-3.5" />
							Create New Batch
						</Button>
					</div>
				</div>

				{/* KPI Cards: Surveillance Metrics */}
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
					<Card className="border-border/60 bg-card p-3.5 border-l-4 border-l-blue-600 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-[11px] font-medium uppercase tracking-wider">
								Total Batches
							</span>
							<LayersIcon className="h-4 w-4 text-blue-600" />
						</div>
						<div className="mt-2">
							<span className="text-xl sm:text-2xl font-bold text-foreground">
								{stats?.totalBatches ?? 0}
							</span>
							<p className="text-[10px] text-muted-foreground mt-0.5">
								{stats?.totalQuantity?.toLocaleString() ?? 0} total units
							</p>
						</div>
					</Card>

					<Card className="border-border/60 bg-card p-3.5 border-l-4 border-l-rose-600 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-[11px] font-medium uppercase tracking-wider text-rose-600">
								Expired Stock
							</span>
							<AlertOctagonIcon className="h-4 w-4 text-rose-600" />
						</div>
						<div className="mt-2">
							<span className="text-xl sm:text-2xl font-bold text-rose-600">
								{stats?.expiredCount ?? 0}
							</span>
							<p className="text-[10px] text-rose-600 font-mono mt-0.5">
								₹{stats?.expiredValue?.toLocaleString() ?? 0} loss exposure
							</p>
						</div>
					</Card>

					<Card className="border-border/60 bg-card p-3.5 border-l-4 border-l-amber-500 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-[11px] font-medium uppercase tracking-wider text-amber-600">
								Expires &lt; 30 Days
							</span>
							<AlertTriangleIcon className="h-4 w-4 text-amber-600" />
						</div>
						<div className="mt-2">
							<span className="text-xl sm:text-2xl font-bold text-amber-600">
								{stats?.critical30DaysCount ?? 0}
							</span>
							<p className="text-[10px] text-muted-foreground mt-0.5">
								High clearance priority
							</p>
						</div>
					</Card>

					<Card className="border-border/60 bg-card p-3.5 border-l-4 border-l-orange-500 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-[11px] font-medium uppercase tracking-wider">
								30 - 60 Days
							</span>
							<ClockIcon className="h-4 w-4 text-orange-500" />
						</div>
						<div className="mt-2">
							<span className="text-xl sm:text-2xl font-bold text-foreground">
								{stats?.warning60DaysCount ?? 0}
							</span>
							<p className="text-[10px] text-muted-foreground mt-0.5">
								Medium shelf warning
							</p>
						</div>
					</Card>

					<Card className="border-border/60 bg-card p-3.5 border-l-4 border-l-emerald-600 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-[11px] font-medium uppercase tracking-wider">
								Healthy Stock
							</span>
							<ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
						</div>
						<div className="mt-2">
							<span className="text-xl sm:text-2xl font-bold text-emerald-600">
								{stats?.healthyCount ?? 0}
							</span>
							<p className="text-[10px] text-muted-foreground mt-0.5">
								&gt; 60 days buffer
							</p>
						</div>
					</Card>

					<Card className="border-border/60 bg-card p-3.5 border-l-4 border-l-purple-600 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-[11px] font-medium uppercase tracking-wider">
								Valuation
							</span>
							<IndianRupeeIcon className="h-4 w-4 text-purple-600" />
						</div>
						<div className="mt-2">
							<span className="text-lg sm:text-xl font-bold text-foreground font-mono">
								₹{stats?.totalInventoryValue?.toLocaleString() ?? 0}
							</span>
							<p className="text-[10px] text-muted-foreground mt-0.5">
								Active batch holding
							</p>
						</div>
					</Card>
				</div>

				{/* Search, Filter Tabs & Sort Controls */}
				<Card className="border-border/60 bg-card shadow-xs">
					<CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
						{/* Status Filters */}
						<div className="flex flex-wrap items-center gap-1.5">
							{[
								{ id: "all", label: "All Lots" },
								{ id: "critical_30", label: "Critical (<30d)" },
								{ id: "warning_60", label: "Warning (30-60d)" },
								{ id: "expired", label: "Expired" },
								{ id: "healthy", label: "Healthy" },
							].map((tab) => (
								<button
									key={tab.id}
									type="button"
									onClick={() => setStatusFilter(tab.id as any)}
									className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
										statusFilter === tab.id
											? "bg-blue-600 text-white shadow-xs"
											: "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* Search & Sort */}
						<div className="flex items-center gap-2">
							<div className="relative min-w-[200px] sm:min-w-[280px]">
								<SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
								<Input
									placeholder="Search lot, SKU, barcode, bin..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-8 h-8 text-xs bg-background"
								/>
							</div>

							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as any)}
								className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value="expiry_asc">Sort: FEFO (Earliest Expiry)</option>
								<option value="expiry_desc">Sort: Latest Expiry</option>
								<option value="qty_desc">Sort: Highest Quantity</option>
								<option value="newest">Sort: Newly Created</option>
							</select>
						</div>
					</CardHeader>

					{/* Batches Table */}
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-muted/20">
									<TableRow className="text-xs">
										<TableHead className="font-semibold">Batch / Lot #</TableHead>
										<TableHead className="font-semibold">Product & SKU</TableHead>
										<TableHead className="font-semibold">Storage Bin</TableHead>
										<TableHead className="font-semibold text-right">Available Qty</TableHead>
										<TableHead className="font-semibold text-right">Pricing (₹)</TableHead>
										<TableHead className="font-semibold">Expiry Date</TableHead>
										<TableHead className="font-semibold">Shelf-Life Status</TableHead>
										<TableHead className="font-semibold text-right">FEFO Priority</TableHead>
									</TableRow>
								</TableHeader>

								<TableBody>
									{batchesLoading ? (
										<TableRow>
											<TableCell colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
												<RefreshCwIcon className="mx-auto mb-2 h-5 w-5 animate-spin text-blue-600" />
												Loading multi-warehouse batch registry...
											</TableCell>
										</TableRow>
									) : batchData?.batches && batchData.batches.length > 0 ? (
										batchData.batches.map((batch, index) => {
											return (
												<TableRow
													key={batch.id}
													className="hover:bg-muted/30 transition-colors text-xs"
												>
													{/* Batch # */}
													<TableCell className="font-mono font-bold text-foreground">
														<div className="flex items-center gap-1.5">
															<BarcodeIcon className="h-3.5 w-3.5 text-muted-foreground" />
															{batch.batchNumber}
														</div>
													</TableCell>

													{/* Product */}
													<TableCell>
														<div>
															<p className="font-medium text-foreground">{batch.productName}</p>
															<div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
																<span>SKU: {batch.productSku || "-"}</span>
																{batch.productBarcode && (
																	<>
																		<span>•</span>
																		<span>EAN: {batch.productBarcode}</span>
																	</>
																)}
															</div>
														</div>
													</TableCell>

													{/* Bin Location */}
													<TableCell>
														<Badge
															variant="outline"
															className="font-mono text-[11px] border-border/80 bg-muted/30"
														>
															{batch.location}
														</Badge>
													</TableCell>

													{/* Quantity */}
													<TableCell className="text-right font-mono font-bold text-foreground">
														{batch.quantity}{" "}
														<span className="text-[10px] text-muted-foreground font-normal">
															{batch.productUnit}
														</span>
													</TableCell>

													{/* Pricing */}
													<TableCell className="text-right font-mono text-[11px]">
														<div>
															<span className="font-semibold text-foreground">₹{batch.sellingPrice}</span>
															<span className="text-[10px] text-muted-foreground ml-1">
																(Cost: ₹{batch.purchasePrice})
															</span>
														</div>
													</TableCell>

													{/* Expiry Date */}
													<TableCell className="font-mono text-[11px]">
														{batch.expiryDate ? (
															<div>
																<span>{new Date(batch.expiryDate).toLocaleDateString()}</span>
																{batch.daysToExpiry !== null && (
																	<p className="text-[10px] text-muted-foreground">
																		{batch.daysToExpiry < 0
																			? `Expired ${Math.abs(batch.daysToExpiry)}d ago`
																			: `${batch.daysToExpiry} days left`}
																	</p>
																)}
															</div>
														) : (
															<span className="text-muted-foreground">No Expiry</span>
														)}
													</TableCell>

													{/* Status Badge */}
													<TableCell>
														{batch.expiryStatus === "expired" ? (
															<Badge
																variant="outline"
																className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-semibold"
															>
																Expired (Lock)
															</Badge>
														) : batch.expiryStatus === "critical" ? (
															<Badge
																variant="outline"
																className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold"
															>
																&lt; 30 Days (Clear)
															</Badge>
														) : batch.expiryStatus === "warning" ? (
															<Badge
																variant="outline"
																className="border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[10px] font-semibold"
															>
																30-60 Days
															</Badge>
														) : (
															<Badge
																variant="outline"
																className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold"
															>
																Healthy
															</Badge>
														)}
													</TableCell>

													{/* FEFO Priority */}
													<TableCell className="text-right">
														<Badge
															variant="outline"
															className={`font-mono text-[10px] ${
																index === 0
																	? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold"
																	: "border-border text-muted-foreground"
															}`}
														>
															{index === 0 ? "★ Primary Pick" : `#${index + 1}`}
														</Badge>
													</TableCell>
												</TableRow>
											);
										})
									) : (
										<TableRow>
											<TableCell colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
												No batches found matching the selected filters. Click &quot;Create New Batch&quot; to register a lot.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{/* ── CREATE BATCH MODAL ─────────────────────────────────────── */}
				{isCreateModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
						<Card className="w-full max-w-xl border-border bg-card shadow-2xl">
							<CardHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
										<LayersIcon className="h-4 w-4 text-blue-600" />
										Register Inbound Batch & Lot (FEFO Tracked)
									</CardTitle>
									<CardDescription className="text-xs text-muted-foreground mt-0.5">
										Creates lot record, updates warehouse stock, and logs FIFO entry in stock ledger.
									</CardDescription>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setIsCreateModalOpen(false)}
									className="h-8 w-8 text-muted-foreground hover:bg-muted"
								>
									<XIcon className="h-4 w-4" />
								</Button>
							</CardHeader>

							<CardContent className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
								{/* Product Selector */}
								<div>
									<label className="text-xs font-semibold text-foreground">
										Target Product *
									</label>
									<div className="mt-1 space-y-2">
										<Input
											placeholder="Search product master..."
											value={productSearchInput}
											onChange={(e) => setProductSearchInput(e.target.value)}
											className="h-8 text-xs bg-background"
										/>
										<select
											value={createProductId ?? ""}
											onChange={(e) =>
												setCreateProductId(
													e.target.value ? Number(e.target.value) : undefined,
												)
											}
											className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
										>
											<option value="">Select product to assign batch...</option>
											{productsList?.map((p) => (
												<option key={p.id} value={p.id}>
													{p.name} ({p.sku || `#${p.id}`}) — Current Stock: {p.stock}
												</option>
											))}
										</select>
									</div>
								</div>

								{/* Batch & Bin */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<label className="text-xs font-semibold text-foreground">
											Batch / Lot Number *
										</label>
										<Input
											placeholder="e.g. LOT-2026-X12"
											value={createBatchNumber}
											onChange={(e) => setCreateBatchNumber(e.target.value)}
											className="mt-1 h-8 text-xs bg-background font-mono"
										/>
									</div>

									<div>
										<label className="text-xs font-semibold text-foreground">
											Warehouse Bin / Rack Location
										</label>
										<Input
											placeholder="e.g. Aisle 3, Rack B-04"
											value={createLocation}
											onChange={(e) => setCreateLocation(e.target.value)}
											className="mt-1 h-8 text-xs bg-background"
										/>
									</div>
								</div>

								{/* Quantity & Dates */}
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div>
										<label className="text-xs font-semibold text-foreground">
											Lot Quantity *
										</label>
										<Input
											type="number"
											placeholder="50"
											value={createQuantity}
											onChange={(e) => setCreateQuantity(e.target.value)}
											className="mt-1 h-8 text-xs bg-background font-mono"
										/>
									</div>

									<div>
										<label className="text-xs font-semibold text-foreground">
											Manufacture Date
										</label>
										<Input
											type="date"
											value={createManufactureDate}
											onChange={(e) => setCreateManufactureDate(e.target.value)}
											className="mt-1 h-8 text-xs bg-background"
										/>
									</div>

									<div>
										<label className="text-xs font-semibold text-foreground">
											Expiry Date * (FEFO)
										</label>
										<Input
											type="date"
											value={createExpiryDate}
											onChange={(e) => setCreateExpiryDate(e.target.value)}
											className="mt-1 h-8 text-xs bg-background"
										/>
									</div>
								</div>

								{/* Financial / Pricing */}
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
									<div>
										<label className="text-xs font-semibold text-foreground">
											Purchase Cost (₹)
										</label>
										<Input
											type="number"
											placeholder="75"
											value={createPurchasePrice}
											onChange={(e) => setCreatePurchasePrice(e.target.value)}
											className="mt-1 h-8 text-xs bg-background font-mono"
										/>
									</div>

									<div>
										<label className="text-xs font-semibold text-foreground">
											Selling Price (₹)
										</label>
										<Input
											type="number"
											placeholder="100"
											value={createSellingPrice}
											onChange={(e) => setCreateSellingPrice(e.target.value)}
											className="mt-1 h-8 text-xs bg-background font-mono"
										/>
									</div>

									<div>
										<label className="text-xs font-semibold text-foreground">
											MRP (₹)
										</label>
										<Input
											type="number"
											placeholder="120"
											value={createMrp}
											onChange={(e) => setCreateMrp(e.target.value)}
											className="mt-1 h-8 text-xs bg-background font-mono"
										/>
									</div>
								</div>
							</CardContent>

							<CardFooter className="p-4 border-t border-border/60 flex items-center justify-end gap-2 bg-muted/10">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsCreateModalOpen(false)}
									className="text-xs h-8"
								>
									Cancel
								</Button>
								<Button
									size="sm"
									onClick={handleExecuteCreateBatch}
									disabled={createBatchMutation.isPending}
									className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium"
								>
									{createBatchMutation.isPending ? "Creating..." : "Confirm & Save Lot"}
								</Button>
							</CardFooter>
						</Card>
					</div>
				)}

				{/* ── FEFO DISPATCH SIMULATOR MODAL ──────────────────────────── */}
				{isFEFOModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
						<Card className="w-full max-w-2xl border-border bg-card shadow-2xl">
							<CardHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
										<CompassIcon className="h-4 w-4 text-blue-600" />
										FEFO (First Expired First Out) Dispatch Engine
									</CardTitle>
									<CardDescription className="text-xs text-muted-foreground mt-0.5">
										Simulate order picking allocation: system picks earliest-expiring lots first to minimize inventory wastage.
									</CardDescription>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setIsFEFOModalOpen(false)}
									className="h-8 w-8 text-muted-foreground hover:bg-muted"
								>
									<XIcon className="h-4 w-4" />
								</Button>
							</CardHeader>

							<CardContent className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<label className="text-xs font-semibold text-foreground">
											Select Product
										</label>
										<select
											value={fefoProductId ?? ""}
											onChange={(e) =>
												setFefoProductId(
													e.target.value ? Number(e.target.value) : undefined,
												)
											}
											className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
										>
											<option value="">Select product to simulate...</option>
											{productsList?.map((p) => (
												<option key={p.id} value={p.id}>
													{p.name} ({p.sku || `#${p.id}`})
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="text-xs font-semibold text-foreground">
											Required Dispatch Qty
										</label>
										<Input
											type="number"
											placeholder="10"
											value={fefoRequiredQty}
											onChange={(e) => setFefoRequiredQty(Math.max(1, Number(e.target.value)))}
											className="mt-1 h-8 text-xs bg-background font-mono"
										/>
									</div>
								</div>

								{/* Recommendation Results */}
								{fefoProductId ? (
									<div className="space-y-3 pt-2">
										<div className="flex items-center justify-between text-xs">
											<span className="font-semibold text-foreground">
												Recommended FEFO Pick Sequence
											</span>
											{fefoRecommendation?.fulfilled ? (
												<Badge className="bg-emerald-600 text-white text-[10px]">
													Full Fulfillment (100%)
												</Badge>
											) : (
												<Badge variant="destructive" className="text-[10px]">
													Shortfall: {fefoRecommendation?.shortfall} units
												</Badge>
											)}
										</div>

										<div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
											<Table>
												<TableHeader className="bg-muted/40">
													<TableRow className="text-[11px]">
														<TableHead className="py-1">Pick Rank</TableHead>
														<TableHead className="py-1">Lot Number</TableHead>
														<TableHead className="py-1">Bin Location</TableHead>
														<TableHead className="py-1">Expiry Date</TableHead>
														<TableHead className="py-1 text-right">Available</TableHead>
														<TableHead className="py-1 text-right font-bold text-blue-600">
															Pick Qty
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{fefoRecommendation?.batches &&
													fefoRecommendation.batches.length > 0 ? (
														fefoRecommendation.batches.map((rec) => (
															<TableRow key={rec.batchId} className="text-xs">
																<TableCell className="py-2 font-mono">
																	{rec.isPrimaryPick ? (
																		<span className="font-bold text-blue-600">
																			#1 (Earliest)
																		</span>
																	) : (
																		`#${rec.priorityOrder}`
																	)}
																</TableCell>
																<TableCell className="py-2 font-mono font-medium">
																	{rec.batchNumber}
																</TableCell>
																<TableCell className="py-2 text-[11px]">
																	{rec.location}
																</TableCell>
																<TableCell className="py-2 font-mono text-[11px]">
																	{rec.expiryDate
																		? new Date(rec.expiryDate).toLocaleDateString()
																		: "-"}
																</TableCell>
																<TableCell className="py-2 text-right font-mono">
																	{rec.availableQty}
																</TableCell>
																<TableCell className="py-2 text-right font-mono font-bold text-blue-600">
																	{rec.allocatedQty}
																</TableCell>
															</TableRow>
														))
													) : (
														<TableRow>
															<TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
																No active lots with stock found for this product.
															</TableCell>
														</TableRow>
													)}
												</TableBody>
											</Table>
										</div>
									</div>
								) : (
									<div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
										Please select a product above to simulate FEFO picking sequence.
									</div>
								)}
							</CardContent>

							<CardFooter className="p-4 border-t border-border/60 flex items-center justify-end bg-muted/10">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsFEFOModalOpen(false)}
									className="text-xs h-8"
								>
									Close
								</Button>
							</CardFooter>
						</Card>
					</div>
				)}
			</div>
		</PageTransition>
	);
}
