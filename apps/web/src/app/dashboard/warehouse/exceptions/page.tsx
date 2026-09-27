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
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	ArchiveIcon,
	BoxesIcon,
	CheckCircle2Icon,
	ClockIcon,
	FilterIcon,
	Loader2Icon,
	PackageXIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	UserIcon,
	XCircleIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

type FilterTab = "all" | "active" | "resolved" | "damage" | "missing" | "mismatch";

interface ActiveIncident {
	id: string;
	rawId: number;
	source: "adjustment" | "inspection" | "sla_delay";
	type: string;
	title: string;
	description: string;
	productName?: string;
	productSku?: string;
	quantity: number;
	reportedBy: string;
	createdAt: string;
	reference?: string;
}

interface ResolvedIncident {
	id: string;
	rawId: number;
	source: "adjustment" | "inspection";
	title: string;
	resolutionNotes: string;
	actionType?: string;
	productName?: string;
	productSku?: string;
	quantity: number;
	resolvedAt: string;
	reportedBy?: string;
}

export default function ExceptionsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<FilterTab>("all");

	// Live Data Queries
	const {
		data: exceptionsData,
		isLoading: exceptionsLoading,
		isRefetching,
		refetch,
	} = trpc.warehouse.getExceptions.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});

	const { data: productsList } = trpc.products.list.useQuery();

	// Mutations
	const logExceptionMutation = trpc.warehouse.logException.useMutation({
		onSuccess: () => {
			toast.success("Operational exception successfully logged!");
			utils.warehouse.getExceptions.invalidate();
			utils.warehouse.getOverviewStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Reporting failed: ${err.message}`);
		},
	});

	const resolveExceptionMutation = trpc.warehouse.resolveException.useMutation({
		onSuccess: () => {
			toast.success("Incident ticket marked as resolved!");
			utils.warehouse.getExceptions.invalidate();
			utils.warehouse.getOverviewStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Resolution failed: ${err.message}`);
		},
	});

	// Report Exception Modal State
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [reportQty, setReportQty] = useState<string>("1");
	const [reportType, setReportType] = useState<
		"damage" | "missing" | "mismatch" | "quarantine"
	>("damage");
	const [reportReason, setReportReason] = useState("");

	// Resolve Modal State
	const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
	const [selectedIncident, setSelectedIncident] = useState<ActiveIncident | null>(null);
	const [resolveActionType, setResolveActionType] = useState<
		"quarantine_isolated" | "write_off" | "supplier_claim" | "adjusted_counts" | "passed_override"
	>("quarantine_isolated");
	const [resolveNotes, setResolveNotes] = useState("");

	const handleRaiseException = async () => {
		const prodId = Number.parseInt(selectedProductId || (productsList?.[0]?.id?.toString() ?? "1"), 10);
		const qty = Number.parseInt(reportQty, 10) || 1;

		if (!reportReason.trim()) {
			toast.error("Please enter discrepancy investigation notes.");
			return;
		}

		await logExceptionMutation.mutateAsync({
			productId: prodId,
			qty,
			reason: reportReason.trim(),
			type: reportType,
		});

		setIsReportModalOpen(false);
		setReportQty("1");
		setReportReason("");
	};

	const handleOpenResolve = (incident: ActiveIncident) => {
		setSelectedIncident(incident);
		setResolveNotes("");
		setResolveActionType("quarantine_isolated");
		setIsResolveModalOpen(true);
	};

	const handleExecuteResolve = async () => {
		if (!selectedIncident) return;
		if (!resolveNotes.trim()) {
			toast.error("Please provide resolution action notes.");
			return;
		}

		if (selectedIncident.source === "sla_delay") {
			toast.info("SLA delays automatically resolve when the underlying pick list is fulfilled.");
			setIsResolveModalOpen(false);
			return;
		}

		await resolveExceptionMutation.mutateAsync({
			id: selectedIncident.rawId,
			source: selectedIncident.source,
			actionType: resolveActionType,
			resolutionNotes: resolveNotes.trim(),
		});

		setIsResolveModalOpen(false);
		setSelectedIncident(null);
		setResolveNotes("");
	};

	// Parse Active Incidents and Resolved Archive
	const { activeIncidents, resolvedIncidents, stats } = useMemo(() => {
		const active: ActiveIncident[] = [];
		const resolved: ResolvedIncident[] = [];

		let totalDamagedUnits = 0;
		let totalMissingUnits = 0;

		// 1. Process Stock Adjustments
		if (exceptionsData?.adjustments) {
			exceptionsData.adjustments.forEach((adj) => {
				const isResolved =
					adj.reference_document &&
					adj.reference_document.startsWith("RESOLVED:");

				if (adj.type === "damage" || adj.type === "quarantine") {
					totalDamagedUnits += Math.abs(adj.quantity);
				} else if (adj.type === "missing" || adj.type === "mismatch") {
					totalMissingUnits += Math.abs(adj.quantity);
				}

				if (isResolved) {
					resolved.push({
						id: `RES-ADJ-${adj.id}`,
						rawId: adj.id,
						source: "adjustment",
						title: `RESOLVED: ${adj.type.toUpperCase()} — ${adj.product_name || `Product #${adj.product_id}`}`,
						resolutionNotes: adj.reference_document?.replace(/^RESOLVED:\s*/, "") || adj.reason || "Resolved",
						productName: adj.product_name || `Product #${adj.product_id}`,
						productSku: adj.product_sku || "N/A",
						quantity: Math.abs(adj.quantity),
						resolvedAt: adj.created_at ? new Date(adj.created_at).toLocaleDateString() : "—",
						reportedBy: adj.created_by_name || "Supervisor",
					});
				} else {
					let title = "Physical Discrepancy";
					if (adj.type === "damage") {
						title = `Damaged Stock Quarantined: ${adj.product_name || `Product #${adj.product_id}`}`;
					} else if (adj.type === "missing") {
						title = `Missing Units on Shelf: ${adj.product_name || `Product #${adj.product_id}`}`;
					} else if (adj.type === "mismatch") {
						title = `Inventory Count Mismatch: ${adj.product_name || `Product #${adj.product_id}`}`;
					} else if (adj.type === "quarantine") {
						title = `Stock Isolation / Quarantine: ${adj.product_name || `Product #${adj.product_id}`}`;
					}

					active.push({
						id: `INC-ADJ-${adj.id}`,
						rawId: adj.id,
						source: "adjustment",
						type: adj.type,
						title,
						description: adj.reason || "Physical lot discrepancy flagged by warehouse operator.",
						productName: adj.product_name || `Product #${adj.product_id}`,
						productSku: adj.product_sku || "N/A",
						quantity: Math.abs(adj.quantity),
						reportedBy: adj.created_by_name || "Depot Staff",
						createdAt: adj.created_at ? new Date(adj.created_at).toLocaleString() : "—",
					});
				}
			});
		}

		// 2. Process Receiving Inspections
		if (exceptionsData?.inspections) {
			exceptionsData.inspections.forEach((insp) => {
				const isResolved =
					insp.status === "verified" ||
					(insp.notes && insp.notes.includes("RESOLVED:"));

				if (insp.condition === "damaged" || insp.status === "quarantined") {
					totalDamagedUnits += Math.max(0, (insp.expected_qty || 0) - (insp.received_qty || 0)) || 1;
				}

				if (isResolved) {
					resolved.push({
						id: `RES-INSP-${insp.id}`,
						rawId: insp.id,
						source: "inspection",
						title: `RESOLVED: GRN ${insp.grn_number || `PO-${insp.purchase_id}`} Receiving Inspection`,
						resolutionNotes: insp.notes || "Verified with supplier. GRN counts reconciled.",
						productName: insp.product_name || `Product #${insp.product_id}`,
						productSku: insp.product_sku || "N/A",
						quantity: Math.abs((insp.expected_qty || 0) - (insp.received_qty || 0)),
						resolvedAt: insp.verified_at ? new Date(insp.verified_at).toLocaleDateString() : (insp.created_at ? new Date(insp.created_at).toLocaleDateString() : "—"),
						reportedBy: insp.inspector_name || "QA Inspector",
					});
				} else {
					const diff = (insp.expected_qty || 0) - (insp.received_qty || 0);
					let title = `Receiving Inspection Variance: ${insp.product_name || `Product #${insp.product_id}`}`;
					if (insp.condition === "damaged") {
						title = `Damaged Goods at Inbound QA: ${insp.product_name || `Product #${insp.product_id}`}`;
					} else if (diff > 0) {
						title = `Receiving Qty Shortage (PO-${insp.purchase_id}): ${insp.product_name || `Product #${insp.product_id}`}`;
					}

					active.push({
						id: `INC-INSP-${insp.id}`,
						rawId: insp.id,
						source: "inspection",
						type: insp.condition === "damaged" ? "damage" : (diff > 0 ? "mismatch" : "quarantine"),
						title,
						description: insp.notes ? `${insp.notes} (Expected: ${insp.expected_qty}, Received: ${insp.received_qty})` : `Discrepancy on Inbound GRN ${insp.grn_number || `#${insp.purchase_id}`}. Condition: ${insp.condition}.`,
						productName: insp.product_name || `Product #${insp.product_id}`,
						productSku: insp.product_sku || "N/A",
						quantity: Math.abs(diff) || 1,
						reportedBy: insp.inspector_name || "QA Staff",
						createdAt: insp.created_at ? new Date(insp.created_at).toLocaleString() : "—",
						reference: insp.grn_number || `PO #${insp.purchase_id}`,
					});
				}
			});
		}

		// 3. Process Overdue SLA Alerts
		if (exceptionsData?.overduePicks) {
			exceptionsData.overduePicks.forEach((op) => {
				active.push({
					id: `SLA-PL-${op.id}`,
					rawId: op.id,
					source: "sla_delay",
					type: "sla",
					title: `SLA Violation: Overdue Pick List PL-${op.id}`,
					description: `Fulfillment pick for Order ORD-${op.order_id} has exceeded the 2-hour SLA window on warehouse racks. Assigned to: ${op.worker_name || "Unassigned"}.`,
					quantity: 1,
					reportedBy: "Automated SLA Monitor",
					createdAt: op.created_at ? new Date(op.created_at).toLocaleString() : "—",
					reference: `ORD-${op.order_id}`,
				});
			});
		}

		const totalCount = active.length + resolved.length;
		const activeCount = active.length;
		const resolvedCount = resolved.length;

		return {
			activeIncidents: active,
			resolvedIncidents: resolved,
			stats: {
				totalCount,
				activeCount,
				resolvedCount,
				totalDamagedUnits,
				totalMissingUnits,
			},
		};
	}, [exceptionsData]);

	// Filtered Active Incidents
	const filteredActive = useMemo(() => {
		return activeIncidents.filter((inc) => {
			if (activeTab === "resolved") return false;
			if (activeTab === "damage" && inc.type !== "damage" && inc.type !== "quarantine") return false;
			if (activeTab === "missing" && inc.type !== "missing") return false;
			if (activeTab === "mismatch" && inc.type !== "mismatch") return false;

			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				return (
					inc.title.toLowerCase().includes(q) ||
					inc.description.toLowerCase().includes(q) ||
					(inc.productName && inc.productName.toLowerCase().includes(q)) ||
					(inc.productSku && inc.productSku.toLowerCase().includes(q)) ||
					inc.reportedBy.toLowerCase().includes(q) ||
					(inc.reference && inc.reference.toLowerCase().includes(q))
				);
			}
			return true;
		});
	}, [activeIncidents, activeTab, searchQuery]);

	// Filtered Resolved Incidents
	const filteredResolved = useMemo(() => {
		return resolvedIncidents.filter((res) => {
			if (activeTab === "active" || activeTab === "damage" || activeTab === "missing" || activeTab === "mismatch") {
				if (activeTab !== "all" && activeTab !== "resolved") return false;
			}

			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				return (
					res.title.toLowerCase().includes(q) ||
					res.resolutionNotes.toLowerCase().includes(q) ||
					(res.productName && res.productName.toLowerCase().includes(q)) ||
					(res.productSku && res.productSku.toLowerCase().includes(q))
				);
			}
			return true;
		});
	}, [resolvedIncidents, activeTab, searchQuery]);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							Operational Exceptions Console
						</h2>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE REAL-TIME
						</span>
					</div>
					<p className="text-muted-foreground text-sm">
						Investigate receiving mismatches, missing units on racks, and log
						damaged/quarantined goods.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					<Button
						variant="destructive"
						onClick={() => setIsReportModalOpen(true)}
						className="h-9 gap-1.5 font-bold text-xs shadow-sm"
					>
						<ShieldAlertIcon className="h-4 w-4" />
						Report New Exception
					</Button>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search exceptions, SKU..."
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
						Sync
					</Button>
				</div>
			</div>

			{/* Top KPI Metrics Bar */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "all" ? "border-primary ring-1 ring-primary" : ""}`}
					onClick={() => setActiveTab("all")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
							<BoxesIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Total Incidents</p>
							<p className="font-bold text-slate-900 text-xl dark:text-slate-100">
								{stats.totalCount}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "active" ? "border-red-500 ring-1 ring-red-500" : ""}`}
					onClick={() => setActiveTab("active")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
							<AlertCircleIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Active Tickets</p>
							<p className="font-bold text-red-600 text-xl dark:text-red-400">
								{stats.activeCount}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "damage" ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
					onClick={() => setActiveTab("damage")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
							<PackageXIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Damaged Units</p>
							<p className="font-bold text-rose-600 text-xl dark:text-rose-400">
								{stats.totalDamagedUnits}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "missing" ? "border-amber-500 ring-1 ring-amber-500" : ""}`}
					onClick={() => setActiveTab("missing")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
							<AlertTriangleIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Missing Units</p>
							<p className="font-bold text-amber-600 text-xl dark:text-amber-400">
								{stats.totalMissingUnits}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md col-span-2 sm:col-span-1 ${activeTab === "resolved" ? "border-emerald-500 ring-1 ring-emerald-500" : ""}`}
					onClick={() => setActiveTab("resolved")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
							<ShieldCheckIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Resolved Log</p>
							<p className="font-bold text-emerald-600 text-xl dark:text-emerald-400">
								{stats.resolvedCount}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter Tabs */}
			<div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-1">
				<Button
					variant={activeTab === "all" ? "default" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("all")}
					className="h-7 text-xs"
				>
					All ({stats.totalCount})
				</Button>
				<Button
					variant={activeTab === "active" ? "default" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("active")}
					className="h-7 text-xs"
				>
					Active Tickets ({stats.activeCount})
				</Button>
				<Button
					variant={activeTab === "damage" ? "default" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("damage")}
					className="h-7 text-xs"
				>
					Damaged / Quarantine
				</Button>
				<Button
					variant={activeTab === "missing" ? "default" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("missing")}
					className="h-7 text-xs"
				>
					Missing / Mismatches
				</Button>
				<Button
					variant={activeTab === "resolved" ? "default" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("resolved")}
					className="h-7 text-xs"
				>
					Resolved Archive ({stats.resolvedCount})
				</Button>
			</div>

			{/* Core Exception Columns (Active Incidents & Resolution Log Archive) */}
			{exceptionsLoading ? (
				<div className="flex flex-col items-center justify-center py-20">
					<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
					<p className="mt-2 text-muted-foreground text-xs">
						Loading live operational exceptions...
					</p>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2">
					{/* Active Incident Tickets Column */}
					<Card className="shadow-sm">
						<CardHeader className="border-b pb-4">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="font-bold text-base text-slate-950 dark:text-slate-100">
										Active Incident Tickets
									</CardTitle>
									<CardDescription>
										Live quality deviations currently pending supervisor investigation
									</CardDescription>
								</div>
								<Badge variant="destructive" className="font-bold text-xs">
									{filteredActive.length} Active
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-3 p-4">
							{filteredActive.map((inc) => {
								const isSla = inc.source === "sla_delay" || inc.type === "sla";
								const isDamage = inc.type === "damage" || inc.type === "quarantine";

								return (
									<div
										key={inc.id}
										className={`flex flex-col gap-2 rounded-lg border p-3.5 transition-all hover:shadow-sm ${
											isSla
												? "border-amber-200 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20"
												: isDamage
													? "border-red-200 bg-red-50/60 dark:border-red-800/60 dark:bg-red-950/20"
													: "border-purple-200 bg-purple-50/60 dark:border-purple-800/60 dark:bg-purple-950/20"
										}`}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex items-start gap-2.5">
												{isSla ? (
													<AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
												) : isDamage ? (
													<XCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
												) : (
													<AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
												)}
												<div>
													<h5
														className={`font-bold text-xs ${
															isSla
																? "text-amber-900 dark:text-amber-200"
																: isDamage
																	? "text-red-900 dark:text-red-200"
																	: "text-purple-900 dark:text-purple-200"
														}`}
													>
														{inc.title}
													</h5>
													<p
														className={`mt-1 text-[11px] leading-relaxed ${
															isSla
																? "text-amber-800 dark:text-amber-300"
																: isDamage
																	? "text-red-800 dark:text-red-300"
																	: "text-purple-800 dark:text-purple-300"
														}`}
													>
														{inc.description}
													</p>
												</div>
											</div>
										</div>

										<div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2 text-[10px] text-muted-foreground dark:border-white/5">
											<div className="flex items-center gap-3">
												{inc.productSku && (
													<span className="font-mono font-semibold">
														SKU: {inc.productSku}
													</span>
												)}
												<span>Qty: <b>{inc.quantity}</b></span>
												<span>By: <b>{inc.reportedBy}</b></span>
											</div>

											{inc.source !== "sla_delay" && (
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleOpenResolve(inc)}
													className="h-6 bg-white px-2 font-bold text-[10px] shadow-sm hover:bg-slate-50 dark:bg-slate-900"
												>
													Resolve Ticket
												</Button>
											)}
										</div>
									</div>
								);
							})}

							{filteredActive.length === 0 && (
								<div className="py-12 text-center text-muted-foreground">
									<CheckCircle2Icon className="mx-auto mb-2 h-8 w-8 text-emerald-500 opacity-60" />
									<p className="font-bold text-sm">No active incident tickets</p>
									<p className="text-xs">
										All warehouse quality and inventory records are clean.
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Resolution Log Archive Column */}
					<Card className="shadow-sm">
						<CardHeader className="border-b pb-4">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="font-bold text-base text-slate-950 dark:text-slate-100">
										Resolution Log Archive
									</CardTitle>
									<CardDescription>
										Supervisor actions and reconciled exception history
									</CardDescription>
								</div>
								<Badge variant="secondary" className="font-bold text-xs">
									{filteredResolved.length} Resolved
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-3 p-4">
							{filteredResolved.map((res) => (
								<div
									key={res.id}
									className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 transition-all hover:shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/20"
								>
									<div className="flex items-start gap-2.5">
										<CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
										<div className="flex-1">
											<h5 className="font-bold text-emerald-900 text-xs dark:text-emerald-200">
												{res.title}
											</h5>
											<p className="mt-1 text-[11px] text-emerald-800 leading-relaxed dark:text-emerald-300">
												{res.resolutionNotes}
											</p>
										</div>
									</div>

									<div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/40 pt-2 text-[10px] text-emerald-700 dark:border-emerald-800/40 dark:text-emerald-400">
										<div className="flex items-center gap-3">
											{res.productSku && (
												<span className="font-mono font-semibold">
													SKU: {res.productSku}
												</span>
											)}
											<span>Resolved Qty: <b>{res.quantity}</b></span>
										</div>
										<span>Resolved On: <b>{res.resolvedAt}</b></span>
									</div>
								</div>
							))}

							{filteredResolved.length === 0 && (
								<div className="py-12 text-center text-muted-foreground">
									<ArchiveIcon className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" />
									<p className="font-bold text-sm">No resolved exceptions in log</p>
									<p className="text-xs">
										Resolved tickets and adjustments will appear here.
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* REPORT EXCEPTION MODAL */}
			<Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
				<DialogContent className="bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg text-slate-900 dark:text-slate-100">
							Report Operational Exception / Quality Deviation
						</DialogTitle>
						<DialogDescription>
							Submit physical lot discrepancies directly to the system logs,
							triggering warehouse quality quarantine and supervisor audit.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Affected Product Item
							</Label>
							<select
								className="mt-1 w-full rounded-md border border-input bg-background p-2 font-bold text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
								value={selectedProductId}
								onChange={(e) => setSelectedProductId(e.target.value)}
							>
								{productsList && productsList.length > 0 ? (
									productsList.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name} {p.sku ? `(SKU: ${p.sku})` : ""}
										</option>
									))
								) : (
									<option value="1">High-Grade Steel Widget (SKU: WID-001)</option>
								)}
							</select>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Discrepant / Affected Quantity
							</Label>
							<Input
								type="number"
								min="1"
								value={reportQty}
								onChange={(e) => setReportQty(e.target.value)}
								placeholder="E.g. 1"
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Discrepancy Category Type
							</Label>
							<select
								className="mt-1 w-full rounded-md border border-input bg-background p-2 font-bold text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
								value={reportType}
								onChange={(e) => setReportType(e.target.value as any)}
							>
								<option value="damage">Physical Damaged Stock (Dented, Broken, Leaking)</option>
								<option value="missing">Missing units from Shelf / Rack</option>
								<option value="mismatch">Lot Receipt Count Mismatch</option>
								<option value="quarantine">Quality Quarantine (Failed QA / Isolation)</option>
							</select>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Discrepancy Investigation Notes
							</Label>
							<Textarea
								placeholder="Specify precise damage indicators, rack bin location, box condition, or count discrepancy..."
								value={reportReason}
								onChange={(e) => setReportReason(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsReportModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleRaiseException}
							variant="destructive"
							disabled={logExceptionMutation.isPending}
						>
							{logExceptionMutation.isPending
								? "Logging..."
								: "Submit Exception Ticket"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* RESOLVE EXCEPTION MODAL */}
			<Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
				<DialogContent className="bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg text-slate-900 dark:text-slate-100">
							Resolve Exception Incident Ticket
						</DialogTitle>
						<DialogDescription>
							Reconcile inventory discrepancy, execute write-offs or quarantine isolation, and record supervisor resolution.
						</DialogDescription>
					</DialogHeader>

					{selectedIncident && (
						<div className="my-2 space-y-4">
							<div className="rounded-lg border bg-muted/40 p-3 text-xs">
								<p className="font-bold text-slate-800 dark:text-slate-200">
									{selectedIncident.title}
								</p>
								<p className="mt-1 text-muted-foreground">
									{selectedIncident.description}
								</p>
								<div className="mt-2 flex gap-4 text-[11px]">
									<span>Qty: <b>{selectedIncident.quantity}</b></span>
									<span>Reported by: <b>{selectedIncident.reportedBy}</b></span>
								</div>
							</div>

							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Supervisor Resolution Action
								</Label>
								<select
									className="mt-1 w-full rounded-md border border-input bg-background p-2 font-bold text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
									value={resolveActionType}
									onChange={(e) => setResolveActionType(e.target.value as any)}
								>
									<option value="quarantine_isolated">
										Quarantine to Isolation Rack (Shelf Zone A)
									</option>
									<option value="write_off">
										Write-Off Damaged Stock from Inventory
									</option>
									<option value="supplier_claim">
										File Supplier Claim / Debit Note for Shortage
									</option>
									<option value="adjusted_counts">
										Adjust Physical Stock Ledger Counts
									</option>
									<option value="passed_override">
										QA Re-Inspection Passed (Count Verified)
									</option>
								</select>
							</div>

							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Resolution Action Notes
								</Label>
								<Textarea
									placeholder="Describe supervisor reconciliation actions taken (e.g. Verified with supplier. Adjusted GRN counts in database)..."
									value={resolveNotes}
									onChange={(e) => setResolveNotes(e.target.value)}
									className="mt-1 h-20 text-xs"
								/>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsResolveModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleExecuteResolve}
							disabled={resolveExceptionMutation.isPending}
							className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
						>
							{resolveExceptionMutation.isPending
								? "Resolving..."
								: "Confirm & Resolve Ticket"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
