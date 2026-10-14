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
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	EyeIcon,
	IndianRupeeIcon,
	Loader2Icon,
	SearchIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	ShoppingCartIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function FinancePurchasesPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [statusFilter, setStatusFilter] = useState("pending");
	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: purchasesData, isLoading } =
		trpc.finance.listPurchases.useQuery({
			status: statusFilter,
			search: searchQuery || undefined,
			limit: 50,
		});

	// Review / Approval Modal State
	const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(
		null,
	);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [approvalNotes, setApprovalNotes] = useState("");
	const [rejectReason, setRejectReason] = useState("");
	const [isRejecting, setIsRejecting] = useState(false);

	const { data: activePO, isLoading: isDetailsLoading } =
		trpc.finance.getPurchaseDetails.useQuery(
			{ id: selectedPurchaseId! },
			{ enabled: !!selectedPurchaseId && isDetailModalOpen },
		);

	// Mutations
	const approveMutation = trpc.finance.approvePO.useMutation({
		onSuccess: (res) => {
			toast.success(
				`Purchase Order ${res.po_number || `#${res.id}`} successfully verified & issued to Procurement!`,
			);
			utils.finance.listPurchases.invalidate();
			utils.finance.getDashboardStats.invalidate();
			utils.procurement.listPOs.invalidate();
			utils.warehouse.getReceivingPOs.invalidate();
			setIsDetailModalOpen(false);
			setSelectedPurchaseId(null);
			setApprovalNotes("");
		},
		onError: (err) => {
			toast.error(`Verification failed: ${err.message}`);
		},
	});

	const rejectMutation = trpc.finance.rejectPO.useMutation({
		onSuccess: (res) => {
			toast.success(
				`Purchase Order ${res.po_number || `#${res.id}`} rejected by Finance.`,
			);
			utils.finance.listPurchases.invalidate();
			utils.finance.getDashboardStats.invalidate();
			utils.procurement.listPOs.invalidate();
			utils.warehouse.getReceivingPOs.invalidate();
			setIsDetailModalOpen(false);
			setSelectedPurchaseId(null);
			setIsRejecting(false);
			setRejectReason("");
		},
		onError: (err) => {
			toast.error(`Rejection failed: ${err.message}`);
		},
	});

	const handleOpenDetails = (poId: number) => {
		setSelectedPurchaseId(poId);
		setApprovalNotes("");
		setRejectReason("");
		setIsRejecting(false);
		setIsDetailModalOpen(true);
	};

	const handleApprove = () => {
		if (!selectedPurchaseId) return;
		approveMutation.mutate({
			purchaseId: selectedPurchaseId,
			notes: approvalNotes.trim() || undefined,
		});
	};

	const handleReject = () => {
		if (!selectedPurchaseId) return;
		if (!rejectReason.trim()) {
			toast.error("Please enter a valid rejection reason.");
			return;
		}
		rejectMutation.mutate({
			purchaseId: selectedPurchaseId,
			reason: rejectReason.trim(),
		});
	};

	const stats = purchasesData?.stats;
	const items = purchasesData?.items || [];

	return (
		<PageTransition>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="font-bold text-2xl text-foreground tracking-tight">
							Purchase Order Approvals
						</h1>
						<p className="text-muted-foreground text-sm">
							Review and verify procurement purchase contracts before warehouse
							intake & supplier disbursement.
						</p>
					</div>
				</div>

				{/* KPI Cards */}
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card className="border-amber-500/20 bg-amber-500/5">
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center justify-between">
								<p className="font-medium text-amber-700 text-xs dark:text-amber-400">
									Awaiting Verification
								</p>
								<div className="rounded-full bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
									<AlertCircleIcon className="h-4 w-4" />
								</div>
							</div>
							<p className="mt-2 font-bold text-2xl text-foreground">
								{stats?.pendingCount ?? 0}
							</p>
							<p className="mt-1 text-muted-foreground text-xs">
								Orders pending Finance sign-off
							</p>
						</CardContent>
					</Card>

					<Card className="border-primary/20 bg-primary/5">
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center justify-between">
								<p className="font-medium text-primary text-xs">
									Pending Commitment Value
								</p>
								<div className="rounded-full bg-primary/20 p-2 text-primary">
									<IndianRupeeIcon className="h-4 w-4" />
								</div>
							</div>
							<p className="mt-2 font-bold text-2xl text-foreground">
								₹
								{stats?.pendingAmount
									? stats.pendingAmount.toLocaleString("en-IN")
									: "0"}
							</p>
							<p className="mt-1 text-muted-foreground text-xs">
								Total exposure awaiting verification
							</p>
						</CardContent>
					</Card>

					<Card className="border-emerald-500/20 bg-emerald-500/5">
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center justify-between">
								<p className="font-medium text-emerald-700 text-xs dark:text-emerald-400">
									Verified & Issued
								</p>
								<div className="rounded-full bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-400">
									<ShieldCheckIcon className="h-4 w-4" />
								</div>
							</div>
							<p className="mt-2 font-bold text-2xl text-foreground">
								{stats?.issuedCount ?? 0}
							</p>
							<p className="mt-1 text-muted-foreground text-xs">
								Approved contracts sent to warehouse
							</p>
						</CardContent>
					</Card>

					<Card className="border-rose-500/20 bg-rose-500/5">
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center justify-between">
								<p className="font-medium text-rose-700 text-xs dark:text-rose-400">
									Rejected / On Hold
								</p>
								<div className="rounded-full bg-rose-500/20 p-2 text-rose-600 dark:text-rose-400">
									<XCircleIcon className="h-4 w-4" />
								</div>
							</div>
							<p className="mt-2 font-bold text-2xl text-foreground">
								{stats?.rejectedCount ?? 0}
							</p>
							<p className="mt-1 text-muted-foreground text-xs">
								Sent back to procurement
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Filter & Search Bar */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-wrap gap-2">
						{[
							{ id: "pending", label: "Pending Approvals" },
							{ id: "issued", label: "Verified & Issued" },
							{ id: "rejected", label: "Rejected" },
							{ id: "all", label: "All Orders" },
						].map((tab) => (
							<Button
								key={tab.id}
								variant={statusFilter === tab.id ? "default" : "outline"}
								size="sm"
								onClick={() => setStatusFilter(tab.id)}
								className="h-8 font-semibold text-xs"
							>
								{tab.label}
								{tab.id === "pending" && stats?.pendingCount ? (
									<span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 font-bold text-[10px] text-amber-700 dark:text-amber-300">
										{stats.pendingCount}
									</span>
								) : null}
							</Button>
						))}
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search PO # or supplier..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-8 pl-8 font-medium text-xs"
						/>
					</div>
				</div>

				{/* Data Table */}
				<Card className="border-border">
					<CardContent className="p-0">
						{isLoading ? (
							<div className="flex justify-center py-12">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="border-border/60 bg-muted/30">
											<TableHead className="font-semibold text-muted-foreground text-xs">
												PO Reference
											</TableHead>
											<TableHead className="font-semibold text-muted-foreground text-xs">
												Supplier Partner
											</TableHead>
											<TableHead className="font-semibold text-muted-foreground text-xs">
												Date Created
											</TableHead>
											<TableHead className="font-semibold text-muted-foreground text-xs">
												Expected Delivery
											</TableHead>
											<TableHead className="font-semibold text-muted-foreground text-xs">
												Total Value
											</TableHead>
											<TableHead className="font-semibold text-muted-foreground text-xs">
												Verification Status
											</TableHead>
											<TableHead className="text-right font-semibold text-muted-foreground text-xs">
												Action
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{items.map((po) => {
											const isPending =
												po.status === "pending" ||
												po.status === "pending_finance" ||
												po.status === "pending_approval";
											const isIssued = po.status === "issued";
											const isRejected = po.status === "rejected";

											return (
												<TableRow
													key={po.id}
													className="border-border/40 transition-colors hover:bg-muted/40"
												>
													<TableCell className="font-bold font-mono text-foreground text-xs">
														{po.po_number || `PO-#${po.id}`}
														<div className="font-normal text-[10px] text-muted-foreground">
															{po.grn_number || "Draft GRN"}
														</div>
													</TableCell>
													<TableCell className="text-xs">
														<div className="font-semibold text-foreground">
															{po.supplier_name || "Unknown Supplier"}
														</div>
														<div className="text-[10px] text-muted-foreground">
															{po.supplier_phone || po.supplier_email || "—"}
														</div>
													</TableCell>
													<TableCell className="text-muted-foreground text-xs">
														{po.created_at
															? new Date(po.created_at).toLocaleDateString(
																	"en-IN",
																)
															: "—"}
													</TableCell>
													<TableCell className="text-muted-foreground text-xs">
														{po.expected_delivery_date
															? new Date(
																	po.expected_delivery_date,
																).toLocaleDateString("en-IN")
															: "Immediate"}
													</TableCell>
													<TableCell className="font-bold text-foreground text-xs">
														₹
														{po.total_amount.toLocaleString("en-IN", {
															minimumFractionDigits: 2,
														})}
														<div className="font-normal text-[10px] text-muted-foreground">
															{po.item_count} items ({po.total_quantity} qty)
														</div>
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className={
																isPending
																	? "border-amber-500/30 bg-amber-500/10 font-semibold text-[11px] text-amber-600 dark:text-amber-400"
																	: isIssued
																		? "border-emerald-500/30 bg-emerald-500/10 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400"
																		: isRejected
																			? "border-rose-500/30 bg-rose-500/10 font-semibold text-[11px] text-rose-600 dark:text-rose-400"
																			: "border-blue-500/30 bg-blue-500/10 font-semibold text-[11px] text-blue-600 dark:text-blue-400"
															}
														>
															{isPending
																? "Awaiting Verification"
																: isIssued
																	? "Verified & Issued"
																	: isRejected
																		? "Rejected"
																		: po.status}
														</Badge>
													</TableCell>
													<TableCell className="text-right">
														<Button
															size="sm"
															variant={isPending ? "default" : "outline"}
															className="h-8 font-semibold text-xs"
															onClick={() => handleOpenDetails(po.id)}
														>
															<EyeIcon className="mr-1.5 h-3.5 w-3.5" />
															{isPending ? "Review & Verify" : "View Breakdown"}
														</Button>
													</TableCell>
												</TableRow>
											);
										})}

										{items.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={7}
													className="py-12 text-center text-muted-foreground"
												>
													<ShoppingCartIcon className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
													<p className="font-semibold text-sm">
														No purchase orders match current filter.
													</p>
													<p className="text-muted-foreground text-xs">
														{statusFilter === "pending"
															? "All pending orders have been processed."
															: "Try selecting a different status tab or clearing search."}
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

				{/* REVIEW & VERIFICATION DIALOG */}
				<Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
					<DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-white dark:bg-slate-900">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 font-bold text-lg">
								<ShieldCheckIcon className="h-5 w-5 text-primary" />
								Finance Verification:{" "}
								{activePO?.po_number || `PO-#${activePO?.id}`}
							</DialogTitle>
							<DialogDescription>
								Review procurement line items, tax computations, and supplier
								details before issuing order to warehouse.
							</DialogDescription>
						</DialogHeader>

						{isDetailsLoading ? (
							<div className="flex justify-center py-12">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : activePO ? (
							<div className="space-y-6">
								{/* Summary Row */}
								<div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
									<div>
										<p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
											Supplier
										</p>
										<p className="font-semibold text-foreground text-sm">
											{activePO.supplier_name}
										</p>
										<p className="text-muted-foreground text-xs">
											{activePO.supplier_phone ||
												activePO.supplier_email ||
												"—"}
										</p>
										{activePO.supplier_address && (
											<p className="mt-0.5 text-[11px] text-muted-foreground">
												{activePO.supplier_address}
											</p>
										)}
									</div>
									<div>
										<p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
											Expected Delivery
										</p>
										<p className="font-semibold text-foreground text-sm">
											{activePO.expected_delivery_date
												? new Date(
														activePO.expected_delivery_date,
													).toLocaleDateString("en-IN")
												: "Immediate / As per schedule"}
										</p>
										<p className="text-muted-foreground text-xs">
											Created:{" "}
											{new Date(activePO.created_at).toLocaleDateString(
												"en-IN",
											)}
										</p>
									</div>
									<div>
										<p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
											Total Value
										</p>
										<p className="font-bold text-foreground text-lg">
											₹
											{activePO.total_amount.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
											})}
										</p>
										<div className="flex gap-2 text-[10px] text-muted-foreground">
											<span>CGST: ₹{activePO.cgst_amount}</span>
											<span>SGST: ₹{activePO.sgst_amount}</span>
											{activePO.igst_amount > 0 && (
												<span>IGST: ₹{activePO.igst_amount}</span>
											)}
										</div>
									</div>
								</div>

								{/* Line Items Table */}
								<div>
									<h4 className="mb-2 font-semibold text-foreground text-xs uppercase tracking-wider">
										Contract Items Breakdown ({activePO.items?.length || 0}{" "}
										lines)
									</h4>
									<div className="overflow-hidden rounded-md border border-border">
										<Table>
											<TableHeader>
												<TableRow className="border-border/60 bg-muted/40">
													<TableHead className="font-semibold text-xs">
														Product
													</TableHead>
													<TableHead className="font-semibold text-xs">
														SKU
													</TableHead>
													<TableHead className="text-right font-semibold text-xs">
														Qty
													</TableHead>
													<TableHead className="text-right font-semibold text-xs">
														Unit Price
													</TableHead>
													<TableHead className="text-right font-semibold text-xs">
														GST Rate
													</TableHead>
													<TableHead className="text-right font-semibold text-xs">
														Line Total
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{activePO.items?.map((it: any) => (
													<TableRow key={it.id} className="border-border/40">
														<TableCell className="font-semibold text-foreground text-xs">
															{it.product_name}
														</TableCell>
														<TableCell className="font-mono text-muted-foreground text-xs">
															{it.product_sku}
														</TableCell>
														<TableCell className="text-right font-medium text-xs">
															{it.quantity}
														</TableCell>
														<TableCell className="text-right text-xs">
															₹{it.price.toFixed(2)}
														</TableCell>
														<TableCell className="text-right text-muted-foreground text-xs">
															{Number(it.cgst_rate) +
																Number(it.sgst_rate) +
																Number(it.igst_rate)}
															%
														</TableCell>
														<TableCell className="text-right font-bold text-foreground text-xs">
															₹
															{it.total.toLocaleString("en-IN", {
																minimumFractionDigits: 2,
															})}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</div>

								{/* Audit / PO Notes */}
								{activePO.notes && (
									<div className="rounded-md border border-border bg-muted/10 p-3">
										<p className="mb-1 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
											Order History & Notes
										</p>
										<p className="whitespace-pre-wrap font-mono text-muted-foreground text-xs">
											{activePO.notes}
										</p>
									</div>
								)}

								{/* Action Section for Pending Verification */}
								{(activePO.status === "pending" ||
									activePO.status === "pending_finance" ||
									activePO.status === "pending_approval") && (
									<div className="space-y-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
										{!isRejecting ? (
											<div className="space-y-3">
												<Label className="font-semibold text-foreground text-xs">
													Finance Verification Remarks (Optional)
												</Label>
												<Input
													placeholder="Add verification notes, payment terms, or reference..."
													value={approvalNotes}
													onChange={(e) => setApprovalNotes(e.target.value)}
													className="text-xs"
												/>
											</div>
										) : (
											<div className="space-y-3">
												<div className="flex items-center gap-1.5 font-bold text-rose-600 text-xs dark:text-rose-400">
													<ShieldAlertIcon className="h-4 w-4" />
													Please provide the reason for rejection:
												</div>
												<Input
													placeholder="Reason for rejection (e.g. Budget exceeded, incorrect pricing, duplicate request)..."
													value={rejectReason}
													onChange={(e) => setRejectReason(e.target.value)}
													className="border-rose-500/40 text-xs focus:ring-rose-500/20"
													autoFocus
												/>
											</div>
										)}
									</div>
								)}
							</div>
						) : null}

						<DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsDetailModalOpen(false)}
								className="text-xs"
							>
								Close
							</Button>

							{activePO &&
								(activePO.status === "pending" ||
									activePO.status === "pending_finance" ||
									activePO.status === "pending_approval") && (
									<div className="flex gap-2">
										{!isRejecting ? (
											<>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setIsRejecting(true)}
													className="border-rose-300 text-rose-600 text-xs hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800"
												>
													<XCircleIcon className="mr-1.5 h-3.5 w-3.5" />
													Reject PO
												</Button>
												<Button
													variant="default"
													size="sm"
													disabled={approveMutation.isPending}
													onClick={handleApprove}
													className="bg-emerald-600 font-semibold text-white text-xs hover:bg-emerald-700"
												>
													{approveMutation.isPending ? (
														<Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
													) : (
														<CheckCircle2Icon className="mr-1.5 h-3.5 w-3.5" />
													)}
													Verify & Issue PO
												</Button>
											</>
										) : (
											<>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setIsRejecting(false)}
													className="text-xs"
												>
													Cancel
												</Button>
												<Button
													variant="destructive"
													size="sm"
													disabled={rejectMutation.isPending}
													onClick={handleReject}
													className="font-semibold text-xs"
												>
													{rejectMutation.isPending ? (
														<Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
													) : (
														<XCircleIcon className="mr-1.5 h-3.5 w-3.5" />
													)}
													Confirm Rejection
												</Button>
											</>
										)}
									</div>
								)}
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PageTransition>
	);
}
