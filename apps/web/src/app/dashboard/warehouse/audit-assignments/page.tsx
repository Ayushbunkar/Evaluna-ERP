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
	ArrowRightIcon,
	BarcodeIcon,
	BoxesIcon,
	CalendarIcon,
	CheckCircle2Icon,
	CheckIcon,
	CheckSquareIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	ClockIcon,
	EyeIcon,
	EyeOffIcon,
	FilterIcon,
	IndianRupeeIcon,
	LayersIcon,
	PackageCheckIcon,
	PlusIcon,
	RefreshCwIcon,
	RotateCcwIcon,
	SearchIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	SlidersHorizontalIcon,
	SparklesIcon,
	UserCheckIcon,
	UsersIcon,
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

export default function WarehouseAuditAssignmentsPage() {
	const trpc = useTRPC();

	// Filters
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
		undefined,
	);

	// Modal states
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isRecountModalOpen, setIsRecountModalOpen] = useState(false);
	const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
	const [recountNotes, setRecountNotes] = useState("");
	const [reconcileNotes, setReconcileNotes] = useState("");
	const [selectedLinesForRecount, setSelectedLinesForRecount] = useState<
		number[]
	>([]);

	// Create Form State
	const [createStep, setCreateStep] = useState(1);
	const [formTitle, setFormTitle] = useState("");
	const [formBranchId, setFormBranchId] = useState<number>(1);
	const [formAuditType, setFormAuditType] = useState<
		"cycle_count" | "full_physical" | "spot_check" | "discrepancy_followup"
	>("cycle_count");
	const [formCountingMethod, setFormCountingMethod] = useState<
		"blind" | "assisted"
	>("blind");
	const [formPriority, setFormPriority] = useState<
		"low" | "medium" | "high" | "urgent"
	>("medium");
	const [formAuditorId, setFormAuditorId] = useState<number | undefined>(
		undefined,
	);
	const [formLocationName, setFormLocationName] = useState("");
	const [formDueDate, setFormDueDate] = useState("");
	const [formNotes, setFormNotes] = useState("");
	const [formScopeMode, setFormScopeMode] = useState<
		"all" | "category" | "custom"
	>("all");
	const [formCategoryId, setFormCategoryId] = useState<number | undefined>(
		undefined,
	);
	const [formSelectedProductIds, setFormSelectedProductIds] = useState<number[]>([]);
	const [productSearchInput, setProductSearchInput] = useState("");
	const [isQuickAddProductOpen, setIsQuickAddProductOpen] = useState(false);
	const [newProductName, setNewProductName] = useState("");
	const [newProductSku, setNewProductSku] = useState("");
	const [newProductCategory, setNewProductCategory] = useState("General");
	const [newProductPrice, setNewProductPrice] = useState("100");
	const [newProductBarcode, setNewProductBarcode] = useState("");

	// Load Data
	const {
		data: stats,
		isLoading: statsLoading,
		refetch: refetchStats,
	} = trpc.audit.getDashboardStats.useQuery({ branchId: selectedBranchId });

	const {
		data: audits,
		isLoading: auditsLoading,
		refetch: refetchAudits,
	} = trpc.audit.listAudits.useQuery({
		branchId: selectedBranchId,
		status: statusFilter === "all" ? undefined : statusFilter,
		search: searchQuery || undefined,
	});

	const { data: assignableStaff } = trpc.audit.getAssignableAuditors.useQuery({
		branchId: formBranchId,
	});

	const { data: availableProductsList, refetch: refetchProductsList } =
		trpc.products.list.useQuery(
			{
				search: productSearchInput || undefined,
				limit: 50,
			},
			{ enabled: isCreateModalOpen && createStep === 2 && formScopeMode === "custom" },
		);

	const { data: scopePreview, isLoading: scopePreviewLoading, refetch: refetchScopePreview } =
		trpc.audit.getAuditScopePreview.useQuery(
			{
				branchId: formBranchId,
				categoryId:
					formScopeMode === "category" ? formCategoryId : undefined,
				productIds:
					formScopeMode === "custom" ? formSelectedProductIds : undefined,
			},
			{ enabled: isCreateModalOpen && createStep === 2 },
		);

	const {
		data: activeAuditDetail,
		isLoading: auditDetailLoading,
		refetch: refetchAuditDetail,
	} = trpc.audit.getAudit.useQuery(
		{ auditId: selectedAuditId ?? 0 },
		{ enabled: !!selectedAuditId && isDetailModalOpen },
	);

	// Mutations
	const createPlanMutation = trpc.audit.createAuditPlan.useMutation({
		onSuccess: (data) => {
			toast.success(
				`Audit Plan ${data.audit_number || "created"} published successfully.`,
			);
			setIsCreateModalOpen(false);
			resetCreateForm();
			refetchAudits();
			refetchStats();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create audit assignment.");
		},
	});

	const requestRecountMutation = trpc.audit.requestRecount.useMutation({
		onSuccess: () => {
			toast.success("Recount request dispatched to assigned counter.");
			setIsRecountModalOpen(false);
			setRecountNotes("");
			setSelectedLinesForRecount([]);
			refetchAuditDetail();
			refetchAudits();
			refetchStats();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to request recount.");
		},
	});

	const reconcileAuditMutation = trpc.audit.reconcileAudit.useMutation({
		onSuccess: (res) => {
			toast.success(
				`Audit reconciled! ${res.adjustedLinesCount} adjustment lines posted to stock ledger.`,
			);
			setIsReconcileModalOpen(false);
			setIsDetailModalOpen(false);
			refetchAudits();
			refetchStats();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to reconcile audit.");
		},
	});

	const quickCreateProductMutation = trpc.products.create.useMutation({
		onSuccess: (newProd) => {
			toast.success(`Product "${newProd.name}" created successfully!`);
			setIsQuickAddProductOpen(false);
			setNewProductName("");
			setNewProductSku("");
			setNewProductBarcode("");
			setNewProductPrice("100");
			// Automatically select newly created product
			setFormSelectedProductIds((prev) => [...prev, newProd.id]);
			refetchProductsList();
			refetchScopePreview();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create new product.");
		},
	});

	const resetCreateForm = () => {
		setCreateStep(1);
		setFormTitle("");
		setFormLocationName("");
		setFormDueDate("");
		setFormNotes("");
		setFormAuditorId(undefined);
		setFormScopeMode("all");
		setFormCategoryId(undefined);
		setFormSelectedProductIds([]);
		setProductSearchInput("");
		setIsQuickAddProductOpen(false);
	};

	const handleOpenAuditDetail = (id: number) => {
		setSelectedAuditId(id);
		setSelectedLinesForRecount([]);
		setIsDetailModalOpen(true);
	};

	const handleToggleLineRecount = (lineId: number) => {
		setSelectedLinesForRecount((prev) =>
			prev.includes(lineId)
				? prev.filter((id) => id !== lineId)
				: [...prev, lineId],
		);
	};

	const handleSelectAllDiscrepantLines = () => {
		if (!activeAuditDetail?.items) return;
		const discrepantIds = activeAuditDetail.items
			.filter(
				(i) =>
					i.status === "mismatch" ||
					(i.counted_qty !== null && i.counted_qty !== i.expected_qty),
			)
			.map((i) => i.id);
		setSelectedLinesForRecount(discrepantIds);
	};

	const handleExecuteCreatePlan = () => {
		if (!formTitle.trim()) {
			toast.error("Please enter an audit title.");
			return;
		}
		if (!formAuditorId) {
			toast.error("Please assign a staff member for counting.");
			return;
		}
		if (formScopeMode === "custom" && formSelectedProductIds.length === 0) {
			toast.error("Please select or add at least one product to audit.");
			return;
		}

		createPlanMutation.mutate({
			branch_id: formBranchId,
			title: formTitle,
			audit_type: formAuditType,
			counting_method: formCountingMethod,
			priority: formPriority,
			auditor_id: formAuditorId,
			location_name: formLocationName || undefined,
			due_date: formDueDate || undefined,
			notes: formNotes || undefined,
			category_id:
				formScopeMode === "category" ? formCategoryId : undefined,
			product_ids:
				formScopeMode === "custom" ? formSelectedProductIds : undefined,
		});
	};

	const handleExecuteRecount = () => {
		if (!selectedAuditId) return;
		if (selectedLinesForRecount.length === 0) {
			toast.error("Select at least one line to recount.");
			return;
		}
		if (!recountNotes.trim()) {
			toast.error("Please provide instructions for the recount.");
			return;
		}

		requestRecountMutation.mutate({
			audit_id: selectedAuditId,
			item_ids: selectedLinesForRecount,
			recount_notes: recountNotes,
		});
	};

	const handleExecuteReconciliation = () => {
		if (!selectedAuditId) return;
		reconcileAuditMutation.mutate({
			audit_id: selectedAuditId,
			notes: reconcileNotes || undefined,
			apply_adjustments: true,
		});
	};

	return (
		<PageTransition className="container mx-auto space-y-6 p-4 sm:p-6">
			{/* Welcome & Command Header */}
			<div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card/90 p-5 sm:p-6 shadow-xs backdrop-blur-md md:flex-row md:items-center">
				<div className="space-y-1">
					<div className="flex items-center gap-2.5">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
							<ClipboardCheckIcon className="h-5 w-5" />
						</span>
						<div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Inventory Audit & Stock Control
							</h1>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Configure physical count plans, enforce blind counting integrity, investigate variances, and execute ledger reconciliation.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<Badge
						variant="outline"
						className="border-primary/20 bg-primary/10 font-bold text-primary text-xs"
					>
						Warehouse: Main Hub #1
					</Badge>

					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetchStats();
							refetchAudits();
						}}
						className="text-xs h-9 border-border/70 hover:bg-muted"
					>
						<RefreshCwIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />{" "}
						Sync
					</Button>

					<Button
						size="sm"
						onClick={() => {
							resetCreateForm();
							setIsCreateModalOpen(true);
						}}
						className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 shadow-sm"
					>
						<PlusIcon className="mr-1.5 h-4 w-4" /> Create Audit Plan
					</Button>
				</div>
			</div>

			{/* KPI Summary Row — Sleek Border-l Accent Cards */}
			<StaggerList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-3.5">
				{/* 1. Total Audits */}
				<StaggerItem>
					<AnimatedCard>
						<Card className="h-full border-l-4 border-l-blue-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 sm:p-4 sm:pb-2">
								<CardTitle className="font-semibold text-muted-foreground text-[11px] sm:text-xs uppercase tracking-wider truncate">
									Total Audits
								</CardTitle>
								<ClipboardListIcon className="h-4 w-4 shrink-0 text-blue-500" />
							</CardHeader>
							<CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
								<div className="font-bold text-2xl text-foreground sm:text-3xl tracking-tight">
									{statsLoading ? "..." : stats?.totalAudits ?? 0}
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground truncate">
									All registered cycles
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				{/* 2. In Progress Counting */}
				<StaggerItem>
					<AnimatedCard>
						<Card className="h-full border-l-4 border-l-amber-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 sm:p-4 sm:pb-2">
								<CardTitle className="font-semibold text-muted-foreground text-[11px] sm:text-xs uppercase tracking-wider truncate">
									Active Counting
								</CardTitle>
								<ActivityIcon className="h-4 w-4 shrink-0 text-amber-500" />
							</CardHeader>
							<CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
								<div className="font-bold text-2xl text-amber-600 dark:text-amber-400 sm:text-3xl tracking-tight">
									{statsLoading ? "..." : stats?.inProgress ?? 0}
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground truncate">
									In field verification
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				{/* 3. Discrepancy Review */}
				<StaggerItem>
					<AnimatedCard>
						<Card className="h-full border-l-4 border-l-rose-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 sm:p-4 sm:pb-2">
								<CardTitle className="font-semibold text-muted-foreground text-[11px] sm:text-xs uppercase tracking-wider truncate">
									Review Required
								</CardTitle>
								<AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-500" />
							</CardHeader>
							<CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
								<div className="font-bold text-2xl text-rose-600 dark:text-rose-400 sm:text-3xl tracking-tight">
									{statsLoading ? "..." : stats?.varianceFound ?? 0}
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground truncate">
									Mismatches flagged
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				{/* 4. Recounts Active */}
				<StaggerItem>
					<AnimatedCard>
						<Card className="h-full border-l-4 border-l-purple-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 sm:p-4 sm:pb-2">
								<CardTitle className="font-semibold text-muted-foreground text-[11px] sm:text-xs uppercase tracking-wider truncate">
									Recounts Active
								</CardTitle>
								<RotateCcwIcon className="h-4 w-4 shrink-0 text-purple-500" />
							</CardHeader>
							<CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
								<div className="font-bold text-2xl text-purple-600 dark:text-purple-400 sm:text-3xl tracking-tight">
									{statsLoading ? "..." : stats?.recountRequested ?? 0}
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground truncate">
									Second count pending
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				{/* 5. Reconciled & Closed */}
				<StaggerItem>
					<AnimatedCard>
						<Card className="h-full border-l-4 border-l-emerald-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 sm:p-4 sm:pb-2">
								<CardTitle className="font-semibold text-muted-foreground text-[11px] sm:text-xs uppercase tracking-wider truncate">
									Reconciled
								</CardTitle>
								<ShieldCheckIcon className="h-4 w-4 shrink-0 text-emerald-500" />
							</CardHeader>
							<CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
								<div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400 sm:text-3xl tracking-tight">
									{statsLoading ? "..." : stats?.completedAudits ?? 0}
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground truncate">
									Adjustments posted
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Filter Tabs & Search Command */}
			<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
				<CardContent className="p-3.5">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						{/* Filter Pills */}
						<div className="flex flex-wrap items-center gap-1.5">
							{[
								{ id: "all", label: "All Audits" },
								{ id: "planned", label: "Planned / Ready" },
								{ id: "in_progress", label: "Counting" },
								{ id: "discrepancy_review", label: "Review Required" },
								{ id: "recount_requested", label: "Recounts" },
								{ id: "completed", label: "Reconciled" },
							].map((tab) => (
								<Button
									key={tab.id}
									variant={statusFilter === tab.id ? "default" : "outline"}
									size="sm"
									onClick={() => setStatusFilter(tab.id)}
									className={`text-xs h-8 ${
										statusFilter === tab.id
											? "bg-blue-600 hover:bg-blue-700 text-white font-semibold"
											: "text-muted-foreground border-border/70 hover:bg-muted"
									}`}
								>
									{tab.label}
								</Button>
							))}
						</div>

						{/* Search Input */}
						<div className="relative w-full sm:w-72">
							<SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								placeholder="Filter audit #, title, location..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8 text-xs h-8 bg-background"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Audit Assignments Register Table */}
			<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md overflow-hidden">
				<CardHeader className="p-4 pb-2 border-b border-border/50 bg-muted/20">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-sm font-semibold text-foreground">
								Audit Register & Lifecycle Status
							</CardTitle>
							<CardDescription className="text-xs text-muted-foreground">
								Frozen inventory benchmarks, assigned personnel, count progression, and reconciliation triggers
							</CardDescription>
						</div>

						<Badge
							variant="outline"
							className="text-[11px] font-mono border-border bg-background"
						>
							{audits?.length ?? 0} Audits Loaded
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{auditsLoading ? (
						<div className="p-12 text-center text-sm text-muted-foreground">
							Loading audit registry...
						</div>
					) : !audits || audits.length === 0 ? (
						<div className="p-12 text-center">
							<BoxesIcon className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
							<p className="text-sm font-semibold text-foreground">
								No audit plans found
							</p>
							<p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
								Create a new stock verification plan to initiate blind counting or cycle counts across warehouse zones.
							</p>
							<Button
								size="sm"
								onClick={() => {
									resetCreateForm();
									setIsCreateModalOpen(true);
								}}
								className="mt-4 bg-blue-600 hover:bg-blue-700 text-xs text-white"
							>
								<PlusIcon className="mr-1.5 h-3.5 w-3.5" /> Create Audit Plan
							</Button>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-muted/30">
									<TableRow className="hover:bg-transparent text-xs">
										<TableHead className="font-semibold">Audit Code</TableHead>
										<TableHead className="font-semibold">Plan & Zone</TableHead>
										<TableHead className="font-semibold">Protocol</TableHead>
										<TableHead className="font-semibold">Assigned Counter</TableHead>
										<TableHead className="font-semibold">Count Progress</TableHead>
										<TableHead className="font-semibold">Status</TableHead>
										<TableHead className="font-semibold">Variances</TableHead>
										<TableHead className="font-semibold text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>

								<TableBody>
									{audits.map((audit) => {
										const progressPct =
											audit.totalItemsCount > 0
												? Math.round(
														(audit.countedItemsCount / audit.totalItemsCount) * 100,
													)
												: 0;

										return (
											<TableRow key={audit.id} className="hover:bg-muted/40 transition-colors">
												{/* Code */}
												<TableCell className="font-mono text-xs font-bold text-foreground">
													{audit.audit_number || `AUD-${audit.id}`}
												</TableCell>

												{/* Title & Zone */}
												<TableCell>
													<div>
														<p className="font-medium text-xs text-foreground">
															{audit.title}
														</p>
														<div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground font-mono">
															<span>{audit.branch?.name || "Main Hub"}</span>
															{audit.location_name && (
																<>
																	<span>•</span>
																	<span>Zone: {audit.location_name}</span>
																</>
															)}
														</div>
													</div>
												</TableCell>

												{/* Protocol & Priority */}
												<TableCell>
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
																	<EyeOffIcon className="h-2.5 w-2.5" /> Blind
																</span>
															) : (
																"Assisted"
															)}
														</Badge>

														<Badge
															variant="outline"
															className={`text-[10px] uppercase font-semibold ${
																audit.priority === "urgent"
																	? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
																	: audit.priority === "high"
																		? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
																		: "border-border text-muted-foreground"
															}`}
														>
															{audit.priority}
														</Badge>
													</div>
												</TableCell>

												{/* Counter */}
												<TableCell>
													<div className="flex items-center gap-2">
														<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-foreground">
															{audit.auditor?.name
																? audit.auditor.name.slice(0, 2).toUpperCase()
																: "ST"}
														</div>
														<div className="text-xs">
															<p className="font-medium text-foreground">
																{audit.auditor?.name || "Unassigned"}
															</p>
															<p className="text-[10px] text-muted-foreground font-mono">
																{audit.auditor?.staff_code || ""}
															</p>
														</div>
													</div>
												</TableCell>

												{/* Progress */}
												<TableCell>
													<div className="w-28 space-y-1">
														<div className="flex justify-between text-[10px] text-muted-foreground font-mono">
															<span>
																{audit.countedItemsCount}/{audit.totalItemsCount}
															</span>
															<span>{progressPct}%</span>
														</div>
														<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
															<div
																className={`h-full rounded-full transition-all ${
																	progressPct === 100
																		? "bg-emerald-500"
																		: "bg-blue-600"
																}`}
																style={{ width: `${progressPct}%` }}
															/>
														</div>
													</div>
												</TableCell>

												{/* Status */}
												<TableCell>
													<Badge
														variant="outline"
														className={`text-[11px] capitalize font-medium ${
															audit.status === "completed"
																? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
																: audit.status === "discrepancy_review"
																	? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
																	: audit.status === "recount_requested"
																		? "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300"
																		: audit.status === "in_progress"
																			? "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
																			: "border-border text-muted-foreground"
														}`}
													>
														{audit.status === "discrepancy_review"
															? "Pending Review"
															: audit.status === "recount_requested"
																? "Recount Active"
																: audit.status?.replace("_", " ")}
													</Badge>
												</TableCell>

												{/* Discrepancies */}
												<TableCell>
													{audit.varianceItemsCount > 0 ? (
														<Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-300 dark:border-amber-800 text-[11px] font-mono">
															<AlertTriangleIcon className="mr-1 h-3 w-3" />
															{audit.varianceItemsCount} lines
														</Badge>
													) : audit.countedItemsCount === audit.totalItemsCount &&
														audit.totalItemsCount > 0 ? (
														<Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-300 dark:border-emerald-800 text-[11px]">
															<CheckCircle2Icon className="mr-1 h-3 w-3" /> 100% Match
														</Badge>
													) : (
														<span className="text-xs text-muted-foreground">—</span>
													)}
												</TableCell>

												{/* Actions */}
												<TableCell className="text-right">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleOpenAuditDetail(audit.id)}
														className="text-xs h-8 border-border/70 hover:bg-muted font-medium"
													>
														<EyeIcon className="mr-1.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
														{audit.status === "discrepancy_review"
															? "Review & Reconcile"
															: "View Details"}
													</Button>
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

			{/* ══════════════════════════════════════════════════════════════════════
			    CREATE AUDIT ASSIGNMENT MODAL (WIZARD)
			══════════════════════════════════════════════════════════════════════ */}
			{isCreateModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
					<Card className="w-full max-w-2xl bg-card border-border/80 shadow-2xl rounded-2xl animate-in fade-in-50 zoom-in-95">
						<CardHeader className="p-5 border-b border-border/60 bg-muted/20 rounded-t-2xl">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-lg font-bold text-foreground">
										Create Inventory Audit Plan
									</CardTitle>
									<CardDescription className="text-xs text-muted-foreground mt-0.5">
										Step {createStep} of 3:{" "}
										{createStep === 1
											? "Plan Parameters & Counting Protocol"
											: createStep === 2
												? "Inventory Scope & Snapshot Freezing"
												: "Authorized Counter Assignment & Publish"}
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
							</div>

							{/* Step Dots */}
							<div className="flex items-center gap-2 mt-3">
								{[1, 2, 3].map((s) => (
									<div
										key={s}
										className={`h-1.5 flex-1 rounded-full transition-all ${
											createStep >= s ? "bg-blue-600" : "bg-muted"
										}`}
									/>
								))}
							</div>
						</CardHeader>

						<CardContent className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
							{/* STEP 1: Basic Information */}
							{createStep === 1 && (
								<div className="space-y-4">
									<div>
										<label className="text-xs font-semibold text-foreground">
											Audit Plan Title *
										</label>
										<Input
											placeholder="e.g. Q4 High-Value Goods Blind Audit"
											value={formTitle}
											onChange={(e) => setFormTitle(e.target.value)}
											className="mt-1 text-xs bg-background"
										/>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div>
											<label className="text-xs font-semibold text-foreground">
												Audit Type
											</label>
											<select
												value={formAuditType}
												onChange={(e) => setFormAuditType(e.target.value as any)}
												className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
											>
												<option value="cycle_count">Cycle Count (Periodic)</option>
												<option value="full_physical">Full Physical Inventory</option>
												<option value="spot_check">Spot Check (High Risk)</option>
												<option value="discrepancy_followup">
													Discrepancy Follow-up
												</option>
											</select>
										</div>

										<div>
											<label className="text-xs font-semibold text-foreground">
												Counting Protocol *
											</label>
											<select
												value={formCountingMethod}
												onChange={(e) =>
													setFormCountingMethod(e.target.value as any)
												}
												className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
											>
												<option value="blind">
													Blind Count (Expected Stock Masked)
												</option>
												<option value="assisted">
													Assisted Count (Expected Stock Visible)
												</option>
											</select>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div>
											<label className="text-xs font-semibold text-foreground">
												Priority
											</label>
											<select
												value={formPriority}
												onChange={(e) => setFormPriority(e.target.value as any)}
												className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
											>
												<option value="low">Low Priority</option>
												<option value="medium">Medium Priority</option>
												<option value="high">High Priority</option>
												<option value="urgent">Urgent Priority</option>
											</select>
										</div>

										<div>
											<label className="text-xs font-semibold text-foreground">
												Location / Zone Specification
											</label>
											<Input
												placeholder="e.g. Aisle 2, Bin Racks A to D"
												value={formLocationName}
												onChange={(e) => setFormLocationName(e.target.value)}
												className="mt-1 text-xs bg-background"
											/>
										</div>
									</div>

									<div>
										<label className="text-xs font-semibold text-foreground">
											Due Date
										</label>
										<Input
											type="date"
											value={formDueDate}
											onChange={(e) => setFormDueDate(e.target.value)}
											className="mt-1 text-xs bg-background"
										/>
									</div>
								</div>
							)}

							{/* STEP 2: Inventory Scope Selection */}
							{createStep === 2 && (
								<div className="space-y-4">
									<div>
										<label className="text-xs font-semibold text-foreground">
											Select Inventory Scope
										</label>
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1.5">
											<div
												onClick={() => setFormScopeMode("all")}
												className={`cursor-pointer rounded-xl border p-3.5 text-xs transition-all ${
													formScopeMode === "all"
														? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 font-medium"
														: "border-border/70 hover:bg-muted/40"
												}`}
											>
												<div className="flex items-center gap-2">
													<LayersIcon className="h-4 w-4 text-blue-600" />
													<p className="font-semibold text-foreground">
														All Active Products
													</p>
												</div>
												<p className="text-[11px] text-muted-foreground mt-1">
													Audit entire warehouse stock catalog
												</p>
											</div>

											<div
												onClick={() => setFormScopeMode("category")}
												className={`cursor-pointer rounded-xl border p-3.5 text-xs transition-all ${
													formScopeMode === "category"
														? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 font-medium"
														: "border-border/70 hover:bg-muted/40"
												}`}
											>
												<div className="flex items-center gap-2">
													<BoxesIcon className="h-4 w-4 text-blue-600" />
													<p className="font-semibold text-foreground">
														By Category
													</p>
												</div>
												<p className="text-[11px] text-muted-foreground mt-1">
													Target specific category (cycle count)
												</p>
											</div>

											<div
												onClick={() => setFormScopeMode("custom")}
												className={`cursor-pointer rounded-xl border p-3.5 text-xs transition-all ${
													formScopeMode === "custom"
														? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 font-medium"
														: "border-border/70 hover:bg-muted/40"
												}`}
											>
												<div className="flex items-center gap-2">
													<CheckSquareIcon className="h-4 w-4 text-blue-600" />
													<p className="font-semibold text-foreground">
														Select Products
													</p>
												</div>
												<p className="text-[11px] text-muted-foreground mt-1">
													Select & add specific items to count
												</p>
											</div>
										</div>
									</div>

									{formScopeMode === "category" && (
										<div>
											<label className="text-xs font-semibold text-foreground">
												Select Category
											</label>
											<select
												value={formCategoryId ?? ""}
												onChange={(e) =>
													setFormCategoryId(
														e.target.value ? Number(e.target.value) : undefined,
													)
												}
												className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
											>
												<option value="">All Categories</option>
												<option value="1">Beverages & Bottled</option>
												<option value="2">Packaged Snacks</option>
												<option value="3">Dairy & Cold Storage</option>
												<option value="4">Dry Provisions</option>
											</select>
										</div>
									)}

									{formScopeMode === "custom" && (
										<div className="space-y-3 rounded-xl border border-border/80 bg-background/50 p-3.5">
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
												<div>
													<p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
														<CheckSquareIcon className="h-3.5 w-3.5 text-blue-600" />
														Specific Products Selection ({formSelectedProductIds.length} Selected)
													</p>
													<p className="text-[11px] text-muted-foreground">
														Search existing inventory or quickly create and add new products to count.
													</p>
												</div>

												<Button
													size="sm"
													type="button"
													onClick={() => setIsQuickAddProductOpen(!isQuickAddProductOpen)}
													className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
												>
													<PlusIcon className="h-3.5 w-3.5 mr-1" />
													{isQuickAddProductOpen ? "Cancel New Product" : "Add New Product"}
												</Button>
											</div>

											{/* Quick Create New Product Form */}
											{isQuickAddProductOpen && (
												<div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-3">
													<div className="flex items-center justify-between">
														<span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
															<PackageCheckIcon className="h-3.5 w-3.5" />
															Quick Add Master Product to System
														</span>
														<span className="text-[10px] text-muted-foreground">
															Saved immediately & included in audit
														</span>
													</div>

													<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
														<div>
															<label className="text-[10px] font-semibold text-foreground">Item Name *</label>
															<Input
																placeholder="e.g. Basmati Rice 5kg"
																value={newProductName}
																onChange={(e) => setNewProductName(e.target.value)}
																className="h-7 text-xs bg-background mt-0.5"
															/>
														</div>

														<div>
															<label className="text-[10px] font-semibold text-foreground">SKU / Code</label>
															<Input
																placeholder="e.g. SKU-RICE-001"
																value={newProductSku}
																onChange={(e) => setNewProductSku(e.target.value)}
																className="h-7 text-xs bg-background mt-0.5"
															/>
														</div>

														<div>
															<label className="text-[10px] font-semibold text-foreground">Barcode / EAN</label>
															<Input
																placeholder="e.g. 890123456789"
																value={newProductBarcode}
																onChange={(e) => setNewProductBarcode(e.target.value)}
																className="h-7 text-xs bg-background mt-0.5"
															/>
														</div>

														<div>
															<label className="text-[10px] font-semibold text-foreground">Price (₹) *</label>
															<Input
																type="number"
																placeholder="100"
																value={newProductPrice}
																onChange={(e) => setNewProductPrice(e.target.value)}
																className="h-7 text-xs bg-background mt-0.5"
															/>
														</div>
													</div>

													<div className="flex justify-end gap-2 pt-1">
														<Button
															size="sm"
															type="button"
															variant="outline"
															onClick={() => setIsQuickAddProductOpen(false)}
															className="h-7 text-xs"
														>
															Close
														</Button>
														<Button
															size="sm"
															type="button"
															disabled={!newProductName.trim() || quickCreateProductMutation.isPending}
															onClick={() => {
																if (!newProductName.trim()) {
																	toast.error("Please enter product name.");
																	return;
																}
																quickCreateProductMutation.mutate({
																	name: newProductName.trim(),
																	sku: newProductSku.trim() || undefined,
																	barcode: newProductBarcode.trim() || undefined,
																	price: Number(newProductPrice) || 0,
																	category: newProductCategory || "General",
																});
															}}
															className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
														>
															<CheckIcon className="h-3.5 w-3.5 mr-1" />
															{quickCreateProductMutation.isPending ? "Adding..." : "Save & Add to Audit"}
														</Button>
													</div>
												</div>
											)}

											{/* Search & Selection Filter */}
											<div className="relative">
												<SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
												<Input
													placeholder="Search products by title, SKU, or barcode..."
													value={productSearchInput}
													onChange={(e) => setProductSearchInput(e.target.value)}
													className="pl-8 h-8 text-xs bg-background"
												/>
											</div>

											{/* Available Products Selection Table */}
											<div className="max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-card">
												<Table>
													<TableHeader className="bg-muted/20">
														<TableRow className="text-[10px]">
															<TableHead className="w-10 text-center py-1">Pick</TableHead>
															<TableHead className="py-1">Product Name</TableHead>
															<TableHead className="py-1">SKU / Barcode</TableHead>
															<TableHead className="py-1 text-right">System Stock</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{availableProductsList && availableProductsList.length > 0 ? (
															availableProductsList.map((prod) => {
																const isChecked = formSelectedProductIds.includes(prod.id);
																return (
																	<TableRow
																		key={prod.id}
																		className={`text-[11px] cursor-pointer hover:bg-muted/40 transition-colors ${
																			isChecked ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
																		}`}
																		onClick={() => {
																			setFormSelectedProductIds((prev) =>
																				isChecked
																					? prev.filter((id) => id !== prod.id)
																					: [...prev, prod.id],
																			);
																		}}
																	>
																		<TableCell className="text-center py-1.5" onClick={(e) => e.stopPropagation()}>
																			<input
																				type="checkbox"
																				checked={isChecked}
																				onChange={(e) => {
																					setFormSelectedProductIds((prev) =>
																						e.target.checked
																							? [...prev, prod.id]
																							: prev.filter((id) => id !== prod.id),
																					);
																				}}
																				className="rounded border-border text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
																			/>
																		</TableCell>
																		<TableCell className="py-1.5 font-medium text-foreground">
																			{prod.name}
																		</TableCell>
																		<TableCell className="py-1.5 font-mono text-muted-foreground text-[10px]">
																			{prod.sku || "-"}
																		</TableCell>
																		<TableCell className="py-1.5 text-right font-mono font-semibold">
																			{prod.stock}
																		</TableCell>
																	</TableRow>
																);
															})
														) : (
															<TableRow>
																<TableCell colSpan={4} className="py-4 text-center text-xs text-muted-foreground">
																	No products found matching &quot;{productSearchInput}&quot;. Click &quot;Add New Product&quot; to create one!
																</TableCell>
															</TableRow>
														)}
													</TableBody>
												</Table>
											</div>
										</div>
									)}

									{/* Snapshot Preview Box */}
									<div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-2">
										<div className="flex items-center justify-between text-xs">
											<span className="font-semibold text-foreground flex items-center gap-1.5">
												<BoxesIcon className="h-4 w-4 text-blue-600" />
												Snapshot Scope Preview
											</span>
											{scopePreviewLoading ? (
												<span className="text-[11px] text-muted-foreground">
													Calculating scope...
												</span>
											) : (
												<Badge variant="outline" className="text-xs font-mono font-bold">
													{scopePreview?.totalProducts ?? 0} SKUs Included
												</Badge>
											)}
										</div>

										<p className="text-[11px] text-muted-foreground">
											Upon publishing, current inventory quantities will be frozen as the immutable benchmark snapshot for variance calculation.
										</p>

										{scopePreview?.sampleProducts &&
											scopePreview.sampleProducts.length > 0 && (
												<div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-border/60 bg-background">
													<Table>
														<TableHeader className="bg-muted/20">
															<TableRow className="text-[10px]">
																<TableHead className="py-1">SKU</TableHead>
																<TableHead className="py-1">Product</TableHead>
																<TableHead className="py-1 text-right">
																	Snapshot Stock
																</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{scopePreview.sampleProducts.map((p) => (
																<TableRow key={p.id} className="text-[11px]">
																	<TableCell className="py-1 font-mono">
																		{p.sku || p.barcode || `#${p.id}`}
																	</TableCell>
																	<TableCell className="py-1 truncate max-w-[200px]">
																		{p.name}
																	</TableCell>
																	<TableCell className="py-1 text-right font-mono font-semibold">
																		{p.branch_stock}
																	</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											)}
									</div>
								</div>
							)}

							{/* STEP 3: Assign Staff & Confirmation */}
							{createStep === 3 && (
								<div className="space-y-4">
									<div>
										<label className="text-xs font-semibold text-foreground">
											Assign Authorized Auditor / Staff Counter *
										</label>
										<select
											value={formAuditorId ?? ""}
											onChange={(e) =>
												setFormAuditorId(
													e.target.value ? Number(e.target.value) : undefined,
												)
											}
											className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
										>
											<option value="">Select counting personnel...</option>
											{assignableStaff?.map((s) => (
												<option key={s.id} value={s.id}>
													{s.name} ({s.staff_code || s.role})
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="text-xs font-semibold text-foreground">
											Special Instructions / Audit Notes
										</label>
										<textarea
											rows={3}
											placeholder="e.g. Inspect top shelf racks carefully. Verify barcode labels and expiry dates if package damaged."
											value={formNotes}
											onChange={(e) => setFormNotes(e.target.value)}
											className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									</div>

									<div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5 flex gap-2.5 items-start text-xs text-blue-900 dark:text-blue-300">
										<ShieldCheckIcon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
										<div>
											<p className="font-semibold">
												Immutable Snapshot Protocol
											</p>
											<p className="text-[11px] mt-0.5 text-blue-800/80 dark:text-blue-300/80">
												Expected inventory snapshot will be locked upon publishing. Discrepancies between physical counts and this frozen snapshot will require manager authorization to reconcile.
											</p>
										</div>
									</div>
								</div>
							)}
						</CardContent>

						<CardFooter className="p-4 border-t border-border/60 flex items-center justify-between bg-muted/10 rounded-b-2xl">
							{createStep > 1 ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCreateStep(createStep - 1)}
									className="text-xs h-8"
								>
									Back
								</Button>
							) : (
								<div />
							)}

							<div className="flex gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsCreateModalOpen(false)}
									className="text-xs h-8"
								>
									Cancel
								</Button>

								{createStep < 3 ? (
									<Button
										size="sm"
										onClick={() => {
											if (createStep === 1 && !formTitle.trim()) {
												toast.error("Please enter an audit title.");
												return;
											}
											setCreateStep(createStep + 1);
										}}
										className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
									>
										Next Step <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
									</Button>
								) : (
									<Button
										size="sm"
										onClick={handleExecuteCreatePlan}
										disabled={createPlanMutation.isPending}
										className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
									>
										{createPlanMutation.isPending
											? "Publishing..."
											: "Publish & Freeze Snapshot"}
									</Button>
								)}
							</div>
						</CardFooter>
					</Card>
				</div>
			)}

			{/* ══════════════════════════════════════════════════════════════════════
			    AUDIT DETAIL & DISCREPANCY REVIEW MODAL
			══════════════════════════════════════════════════════════════════════ */}
			{isDetailModalOpen && activeAuditDetail && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
					<Card className="w-full max-w-4xl bg-card border-border/80 shadow-2xl rounded-2xl animate-in fade-in-50 zoom-in-95">
						<CardHeader className="p-5 border-b border-border/60 bg-muted/20 rounded-t-2xl">
							<div className="flex items-center justify-between">
								<div>
									<div className="flex items-center gap-2">
										<CardTitle className="text-lg font-bold text-foreground">
											Audit Review: {activeAuditDetail.audit?.audit_number || `#${selectedAuditId}`}
										</CardTitle>
										<Badge
											variant="outline"
											className={`text-[10px] capitalize font-medium ${
												activeAuditDetail.audit?.status === "completed"
													? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
													: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
											}`}
										>
											{activeAuditDetail.audit?.status?.replace("_", " ")}
										</Badge>
									</div>

									<p className="text-xs text-muted-foreground mt-0.5">
										{activeAuditDetail.audit?.title} • Counter:{" "}
										{activeAuditDetail.audit?.auditor?.name || "Unassigned"} • Method:{" "}
										{activeAuditDetail.audit?.counting_method?.toUpperCase()}
									</p>
								</div>

								<Button
									variant="ghost"
									size="icon"
									onClick={() => setIsDetailModalOpen(false)}
									className="h-8 w-8 text-muted-foreground hover:bg-muted"
								>
									<XIcon className="h-4 w-4" />
								</Button>
							</div>

							{/* Summary Counters Strip */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
								<div className="rounded-xl border border-border/80 bg-card p-3">
									<p className="text-[10px] uppercase text-muted-foreground font-semibold">
										Total Lines
									</p>
									<p className="text-lg font-bold text-foreground">
										{activeAuditDetail.items.length}
									</p>
								</div>

								<div className="rounded-xl border border-border/80 bg-card p-3">
									<p className="text-[10px] uppercase text-muted-foreground font-semibold">
										Counted Lines
									</p>
									<p className="text-lg font-bold text-blue-600 dark:text-blue-400">
										{activeAuditDetail.items.filter((i) => i.counted_qty !== null).length}
									</p>
								</div>

								<div className="rounded-xl border border-border/80 bg-card p-3">
									<p className="text-[10px] uppercase text-muted-foreground font-semibold">
										Matched Lines
									</p>
									<p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
										{activeAuditDetail.items.filter((i) => i.status === "match").length}
									</p>
								</div>

								<div className="rounded-xl border border-border/80 bg-card p-3">
									<p className="text-[10px] uppercase text-muted-foreground font-semibold">
										Variances Found
									</p>
									<p className="text-lg font-bold text-amber-600 dark:text-amber-400">
										{
											activeAuditDetail.items.filter(
												(i) =>
													i.status === "mismatch" ||
													(i.counted_qty !== null && i.counted_qty !== i.expected_qty),
											).length
										}
									</p>
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
							{/* Action bar for review */}
							<div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/60">
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={handleSelectAllDiscrepantLines}
										className="text-xs h-7.5"
									>
										Select All Variances ({selectedLinesForRecount.length} selected)
									</Button>
									{selectedLinesForRecount.length > 0 && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setSelectedLinesForRecount([])}
											className="text-xs h-7.5 text-muted-foreground"
										>
											Clear Selection
										</Button>
									)}
								</div>

								{activeAuditDetail.audit?.status !== "completed" && (
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setIsRecountModalOpen(true)}
											disabled={selectedLinesForRecount.length === 0}
											className="text-xs h-7.5 border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20"
										>
											<RotateCcwIcon className="mr-1 h-3.5 w-3.5" /> Request Recount (
											{selectedLinesForRecount.length})
										</Button>

										<Button
											size="sm"
											onClick={() => setIsReconcileModalOpen(true)}
											className="text-xs h-7.5 bg-emerald-600 hover:bg-emerald-700 text-white"
										>
											<ShieldCheckIcon className="mr-1 h-3.5 w-3.5" /> Finalize & Reconcile
										</Button>
									</div>
								)}
							</div>

							{/* Items Table */}
							<div className="rounded-xl border border-border/80 overflow-hidden">
								<Table>
									<TableHeader className="bg-muted/30">
										<TableRow className="text-xs">
											<TableHead className="w-8"></TableHead>
											<TableHead>SKU & Product Name</TableHead>
											<TableHead className="text-right">Snapshot Expected</TableHead>
											<TableHead className="text-right">Counted</TableHead>
											<TableHead className="text-right">Recount</TableHead>
											<TableHead className="text-right">Variance</TableHead>
											<TableHead>Status & Reason</TableHead>
										</TableRow>
									</TableHeader>

									<TableBody>
										{activeAuditDetail.items.map((item) => {
											const isSelected = selectedLinesForRecount.includes(item.id);
											const isMismatch =
												item.status === "mismatch" ||
												(item.counted_qty !== null &&
													item.counted_qty !== item.expected_qty);

											return (
												<TableRow
													key={item.id}
													className={`text-xs ${
														isMismatch
															? "bg-amber-500/5 dark:bg-amber-950/10"
															: ""
													} ${isSelected ? "ring-1 ring-blue-500" : ""}`}
												>
													<TableCell className="w-8">
														{isMismatch && (
															<input
																type="checkbox"
																checked={isSelected}
																onChange={() => handleToggleLineRecount(item.id)}
																className="rounded border-border text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
															/>
														)}
													</TableCell>

													<TableCell>
														<div>
															<p className="font-semibold text-foreground">
																{item.product?.name || `Product #${item.product_id}`}
															</p>
															<p className="font-mono text-[10px] text-muted-foreground">
																SKU: {item.product?.sku || "N/A"} • Barcode:{" "}
																{item.product?.barcode || "N/A"}
															</p>
														</div>
													</TableCell>

													<TableCell className="text-right font-mono font-medium">
														{item.expected_qty ?? "—"}
													</TableCell>

													<TableCell className="text-right font-mono font-bold text-foreground">
														{item.counted_qty !== null ? (
															item.counted_qty
														) : (
															<span className="text-muted-foreground italic">
																Uncounted
															</span>
														)}
													</TableCell>

													<TableCell className="text-right font-mono">
														{item.recount_qty !== null ? (
															<Badge
																variant="outline"
																className="text-[10px] border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300"
															>
																{item.recount_qty}
															</Badge>
														) : (
															<span className="text-muted-foreground">—</span>
														)}
													</TableCell>

													<TableCell className="text-right">
														{item.variance !== null ? (
															<Badge
																variant="outline"
																className={`text-[10px] font-mono font-bold ${
																	item.variance === 0
																		? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
																		: item.variance < 0
																			? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
																			: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
																}`}
															>
																{item.variance > 0 ? `+${item.variance}` : item.variance}
															</Badge>
														) : (
															<span className="text-muted-foreground">—</span>
														)}
													</TableCell>

													<TableCell>
														<div>
															<Badge
																variant="outline"
																className={`text-[10px] capitalize ${
																	item.status === "match"
																		? "border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
																		: item.status === "mismatch"
																			? "border-amber-500/20 text-amber-700 dark:text-amber-300"
																			: item.status === "recounted"
																				? "border-purple-500/20 text-purple-700 dark:text-purple-300"
																				: "border-border text-muted-foreground"
																}`}
															>
																{item.status}
															</Badge>

															{(item.discrepancy_reason || item.remarks) && (
																<p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[150px]">
																	{item.discrepancy_reason || item.remarks}
																</p>
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						</CardContent>

						<CardFooter className="p-4 border-t border-border/60 flex items-center justify-between bg-muted/10 rounded-b-2xl">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsDetailModalOpen(false)}
								className="text-xs h-8"
							>
								Close
							</Button>

							{activeAuditDetail.audit?.status !== "completed" && (
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsRecountModalOpen(true)}
										disabled={selectedLinesForRecount.length === 0}
										className="text-xs h-8 border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20"
									>
										<RotateCcwIcon className="mr-1.5 h-3.5 w-3.5" /> Request Recount
									</Button>

									<Button
										size="sm"
										onClick={() => setIsReconcileModalOpen(true)}
										className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
									>
										<ShieldCheckIcon className="mr-1.5 h-3.5 w-3.5" /> Reconcile & Post Adjustments
									</Button>
								</div>
							)}
						</CardFooter>
					</Card>
				</div>
			)}

			{/* ══════════════════════════════════════════════════════════════════════
			    RECOUNT REQUEST DIALOG
			══════════════════════════════════════════════════════════════════════ */}
			{isRecountModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
					<Card className="w-full max-w-md bg-card border-border/80 shadow-2xl rounded-2xl animate-in fade-in-50 zoom-in-95">
						<CardHeader className="p-4 border-b border-border/60 bg-muted/20 rounded-t-2xl">
							<div className="flex items-center gap-2">
								<RotateCcwIcon className="h-5 w-5 text-purple-600" />
								<CardTitle className="text-base font-bold text-foreground">
									Request Physical Recount
								</CardTitle>
							</div>
							<CardDescription className="text-xs text-muted-foreground mt-0.5">
								Dispatch {selectedLinesForRecount.length} item line(s) back to the assigned auditor for physical verification.
							</CardDescription>
						</CardHeader>

						<CardContent className="p-4 space-y-3">
							<div>
								<label className="text-xs font-semibold text-foreground">
									Recount Instructions & Reason *
								</label>
								<textarea
									rows={3}
									placeholder="e.g. Please verify carton B-04 in top pallet. Count variance is high."
									value={recountNotes}
									onChange={(e) => setRecountNotes(e.target.value)}
									className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
								/>
							</div>

							<div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-[11px] text-purple-800 dark:text-purple-300">
								Original physical counts are preserved in audit history. The counter will submit an updated recount without overwriting the previous entry.
							</div>
						</CardContent>

						<div className="p-4 border-t border-border/60 flex justify-end gap-2 bg-muted/10 rounded-b-2xl">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsRecountModalOpen(false)}
								className="text-xs h-8"
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleExecuteRecount}
								disabled={requestRecountMutation.isPending}
								className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
							>
								{requestRecountMutation.isPending
									? "Requesting..."
									: "Confirm Recount Request"}
							</Button>
						</div>
					</Card>
				</div>
			)}

			{/* ══════════════════════════════════════════════════════════════════════
			    RECONCILIATION CONFIRMATION DIALOG
			══════════════════════════════════════════════════════════════════════ */}
			{isReconcileModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
					<Card className="w-full max-w-md bg-card border-border/80 shadow-2xl rounded-2xl animate-in fade-in-50 zoom-in-95">
						<CardHeader className="p-4 border-b border-border/60 bg-muted/20 rounded-t-2xl">
							<div className="flex items-center gap-2">
								<ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
								<CardTitle className="text-base font-bold text-foreground">
									Authorize Stock Reconciliation
								</CardTitle>
							</div>
							<CardDescription className="text-xs text-muted-foreground mt-0.5">
								Reconciliation posts atomic stock adjustments and updates warehouse ledgers.
							</CardDescription>
						</CardHeader>

						<CardContent className="p-4 space-y-3">
							<div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
								<p className="font-semibold flex items-center gap-1.5">
									<AlertOctagonIcon className="h-4 w-4 text-amber-600 shrink-0" />
									Ledger Impact Notice
								</p>
								<p className="text-[11px] text-amber-800/80 dark:text-amber-200/80">
									This action will insert records into <strong>stock_adjustments</strong> and <strong>stock_ledger</strong>, adjust warehouse on-hand inventory, and close this audit cycle.
								</p>
							</div>

							<div>
								<label className="text-xs font-semibold text-foreground">
									Reconciliation Approval Notes (Optional)
								</label>
								<textarea
									rows={2}
									placeholder="e.g. Approved by Warehouse Operations Manager."
									value={reconcileNotes}
									onChange={(e) => setReconcileNotes(e.target.value)}
									className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
								/>
							</div>
						</CardContent>

						<div className="p-4 border-t border-border/60 flex justify-end gap-2 bg-muted/10 rounded-b-2xl">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsReconcileModalOpen(false)}
								className="text-xs h-8"
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleExecuteReconciliation}
								disabled={reconcileAuditMutation.isPending}
								className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
							>
								{reconcileAuditMutation.isPending
									? "Reconciling..."
									: "Authorize & Post Adjustments"}
							</Button>
						</div>
					</Card>
				</div>
			)}
		</PageTransition>
	);
}
