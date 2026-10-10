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
	AlertTriangleIcon,
	BanknoteIcon,
	CheckCircle2Icon,
	CreditCardIcon,
	EyeIcon,
	FileTextIcon,
	IndianRupeeIcon,
	Loader2Icon,
	ReceiptIcon,
	SearchIcon,
	ShieldCheckIcon,
	TrendingUpIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function SupplierPayablesPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Queries
	const { data: invoices, isLoading: invoicesLoading } =
		trpc.procurement.listInvoices.useQuery({
			search: searchQuery || undefined,
		});

	const { data: kpis, isLoading: kpisLoading } =
		trpc.procurement.getProcurementKpis.useQuery();

	const { data: bankAccountsList } = trpc.finance.getBankAccounts.useQuery({});

	// Dialog States
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

	// Payment Form State
	const [paymentAmount, setPaymentAmount] = useState<number>(0);
	const [paymentMode, setPaymentMode] = useState<
		"bank_transfer" | "cheque" | "cash" | "upi" | "neft"
	>("bank_transfer");
	const [paymentReference, setPaymentReference] = useState("");
	const [selectedBankId, setSelectedBankId] = useState<number | undefined>(undefined);
	const [paymentNotes, setPaymentNotes] = useState("");

	// Override Form State
	const [allowOverride, setAllowOverride] = useState(false);
	const [overrideNotes, setOverrideNotes] = useState("");

	// Invoice Detail Query
	const { data: invoiceDetail, isLoading: detailLoading } =
		trpc.procurement.getInvoice.useQuery(
			{ id: selectedInvoiceId! },
			{ enabled: !!selectedInvoiceId },
		);

	// Mutations
	const approveMutation = trpc.procurement.approveInvoice.useMutation({
		onSuccess: () => {
			toast.success("Invoice approved for payment!");
			utils.procurement.listInvoices.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			if (selectedInvoiceId) {
				utils.procurement.getInvoice.invalidate({ id: selectedInvoiceId });
			}
			setAllowOverride(false);
			setOverrideNotes("");
		},
		onError: (err) => {
			toast.error(`Approval failed: ${err.message}`);
		},
	});

	const paymentMutation = trpc.procurement.executePayment.useMutation({
		onSuccess: (data) => {
			toast.success(
				`Payment of ₹${data.amountPaid.toFixed(2)} recorded successfully!`,
			);
			utils.procurement.listInvoices.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			utils.finance.getBankAccounts.invalidate();
			setIsPaymentDialogOpen(false);
			if (selectedInvoiceId) {
				utils.procurement.getInvoice.invalidate({ id: selectedInvoiceId });
			}
		},
		onError: (err) => {
			toast.error(`Payment execution failed: ${err.message}`);
		},
	});

	const handleOpenDetail = (id: number) => {
		setSelectedInvoiceId(id);
		setIsDetailDialogOpen(true);
	};

	const handleOpenPayment = (inv: any) => {
		setSelectedInvoiceId(inv.id);
		setPaymentAmount(Number(inv.outstanding_amount));
		setPaymentReference(`TXN-${Date.now().toString().slice(-6)}`);
		setIsPaymentDialogOpen(true);
	};

	const filteredInvoices =
		invoices?.filter((inv) => {
			if (statusFilter === "all") return true;
			if (statusFilter === "awaiting_approval") {
				return inv.status === "draft" || inv.status === "verified";
			}
			if (statusFilter === "approved") {
				return inv.status === "approved_for_payment";
			}
			if (statusFilter === "paid") {
				return inv.status === "paid";
			}
			if (statusFilter === "mismatch") {
				return inv.matching_status !== "matched" && inv.matching_status !== "variance_approved";
			}
			return true;
		}) || [];

	const formatCurrency = (val: number | string | null | undefined) =>
		`₹${Number(val || 0).toLocaleString("en-IN", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;

	return (
		<PageTransition>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
							Supplier Payables & 3-Way Matching
						</h1>
						<p className="text-muted-foreground text-sm">
							Review vendor bills, verify against Purchase Orders & Warehouse Goods Receipts, approve payables, and execute disbursements.
						</p>
					</div>
				</div>

				{/* KPI Cards */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card className="border-l-4 border-l-blue-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="p-5">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Total Billed
									</p>
									<h3 className="mt-1 font-bold text-2xl text-foreground tracking-tight">
										{formatCurrency(kpis?.totalInvoiced)}
									</h3>
									<p className="mt-1 text-[11px] text-muted-foreground">
										Cumulative vendor billing
									</p>
								</div>
								<div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
									<ReceiptIcon className="h-6 w-6" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-rose-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="p-5">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Outstanding Payables
									</p>
									<h3 className="mt-1 font-bold text-2xl text-rose-600 dark:text-rose-400 tracking-tight">
										{formatCurrency(kpis?.totalOutstanding)}
									</h3>
									<p className="mt-1 text-[11px] text-muted-foreground">
										Approved & pending payout
									</p>
								</div>
								<div className="rounded-xl bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
									<IndianRupeeIcon className="h-6 w-6" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-amber-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="p-5">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Awaiting Finance Approval
									</p>
									<h3 className="mt-1 font-bold text-2xl text-amber-600 dark:text-amber-400 tracking-tight">
										{kpis?.awaitingFinanceApproval ?? 0}
									</h3>
									<p className="mt-1 text-[11px] text-muted-foreground">
										Invoices queued for audit
									</p>
								</div>
								<div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
									<ShieldCheckIcon className="h-6 w-6" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-purple-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="p-5">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										3-Way Mismatch / Exceptions
									</p>
									<h3 className="mt-1 font-bold text-2xl text-purple-600 dark:text-purple-400 tracking-tight">
										{kpis?.mismatchedInvoices ?? 0}
									</h3>
									<p className="mt-1 text-[11px] text-muted-foreground">
										Price or quantity variance flagged
									</p>
								</div>
								<div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
									<AlertTriangleIcon className="h-6 w-6" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters & Search */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full max-w-sm">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<Input
							placeholder="Search by invoice # or supplier..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{[
							{ id: "all", label: "All Bills" },
							{ id: "awaiting_approval", label: "Awaiting Approval" },
							{ id: "approved", label: "Ready to Pay" },
							{ id: "paid", label: "Paid" },
							{ id: "mismatch", label: "Mismatches Only" },
						].map((tab) => (
							<Button
								key={tab.id}
								variant={statusFilter === tab.id ? "default" : "outline"}
								size="sm"
								onClick={() => setStatusFilter(tab.id)}
								className="text-xs"
							>
								{tab.label}
							</Button>
						))}
					</div>
				</div>

				{/* Invoices Table */}
				<Card className="shadow-sm">
					<CardHeader className="p-4">
						<CardTitle className="text-base">Supplier Invoices Register</CardTitle>
						<CardDescription className="text-xs">
							Showing {filteredInvoices.length} supplier invoices
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Invoice #</TableHead>
										<TableHead>Supplier</TableHead>
										<TableHead>PO Reference</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Total Bill</TableHead>
										<TableHead>Outstanding</TableHead>
										<TableHead>3-Way Match</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{invoicesLoading ? (
										<TableRow>
											<TableCell colSpan={9} className="h-32 text-center">
												<Loader2Icon className="mx-auto h-6 w-6 animate-spin text-gray-400" />
												<p className="mt-2 text-gray-500 text-xs">Loading payables ledger...</p>
											</TableCell>
										</TableRow>
									) : filteredInvoices.length === 0 ? (
										<TableRow>
											<TableCell colSpan={9} className="h-32 text-center text-gray-500 text-sm">
												No supplier invoices found matching current filters.
											</TableCell>
										</TableRow>
									) : (
										filteredInvoices.map((inv) => (
											<TableRow key={inv.id} className="hover:bg-muted/50">
												<TableCell className="font-semibold text-gray-900 dark:text-gray-100">
													{inv.invoice_number}
												</TableCell>
												<TableCell>{inv.supplier_name || "Unknown Supplier"}</TableCell>
												<TableCell>
													<span className="font-mono text-xs">{inv.po_number || "Direct PO"}</span>
												</TableCell>
												<TableCell className="text-xs text-gray-500">
													{inv.invoice_date
														? new Date(inv.invoice_date).toLocaleDateString()
														: "N/A"}
												</TableCell>
												<TableCell className="font-medium">
													{formatCurrency(inv.total_amount)}
												</TableCell>
												<TableCell className="font-semibold text-red-600 dark:text-red-400">
													{formatCurrency(inv.outstanding_amount)}
												</TableCell>
												<TableCell>
													{inv.matching_status === "matched" ? (
														<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
															Matched
														</Badge>
													) : inv.matching_status === "variance_approved" ? (
														<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
															Override Approved
														</Badge>
													) : (
														<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
															{inv.matching_status.replace(/_/g, " ")}
														</Badge>
													)}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={
															inv.status === "paid"
																? "border-emerald-500 text-emerald-600"
																: inv.status === "approved_for_payment"
																	? "border-blue-500 text-blue-600"
																	: "border-gray-400 text-gray-600"
														}
													>
														{inv.status.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleOpenDetail(inv.id)}
															className="h-8 gap-1 text-xs"
														>
															<EyeIcon className="h-3.5 w-3.5" />
															Audit
														</Button>

														{inv.status === "approved_for_payment" &&
															Number(inv.outstanding_amount) > 0 && (
																<Button
																	size="sm"
																	onClick={() => handleOpenPayment(inv)}
																	className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
																>
																	<CreditCardIcon className="h-3.5 w-3.5" />
																	Disburse
																</Button>
															)}
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{/* 3-Way Match & Detail Audit Modal */}
				<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<ReceiptIcon className="h-5 w-5 text-blue-600" />
								Supplier Invoice Audit & 3-Way Matching
							</DialogTitle>
							<DialogDescription>
								Comparing Purchase Order, Warehouse Goods Receipt (GRN), and Vendor Billed quantities and prices.
							</DialogDescription>
						</DialogHeader>

						{detailLoading || !invoiceDetail ? (
							<div className="py-12 text-center">
								<Loader2Icon className="mx-auto h-8 w-8 animate-spin text-gray-400" />
							</div>
						) : (
							<div className="space-y-6">
								{/* Summary header */}
								<div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-4">
									<div>
										<p className="text-xs text-muted-foreground">Invoice Number</p>
										<p className="font-bold">{invoiceDetail.invoice_number}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Supplier</p>
										<p className="font-semibold">{invoiceDetail.supplier_name}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">PO Number</p>
										<p className="font-mono text-sm">{invoiceDetail.po_number || "Direct"}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Total / Outstanding</p>
										<p className="font-bold text-red-600">
											{formatCurrency(invoiceDetail.outstanding_amount)} / {formatCurrency(invoiceDetail.total_amount)}
										</p>
									</div>
								</div>

								{/* Line items comparison */}
								<div>
									<h4 className="font-semibold text-sm mb-2">Line-by-Line 3-Way Matching Comparison</h4>
									<div className="rounded-md border overflow-hidden">
										<Table>
											<TableHeader className="bg-muted/50">
												<TableRow>
													<TableHead>Product</TableHead>
													<TableHead className="text-center">PO Qty</TableHead>
													<TableHead className="text-center">GRN Accepted</TableHead>
													<TableHead className="text-center">Billed Qty</TableHead>
													<TableHead className="text-right">Unit Price</TableHead>
													<TableHead className="text-center">Variances</TableHead>
													<TableHead className="text-right">Line Total</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{invoiceDetail.items?.map((it: any) => {
													const hasPriceVar = Math.abs(Number(it.price_variance || 0)) > 0.01;
													const hasQtyVar = Math.abs(Number(it.quantity_variance || 0)) > 0.001;

													return (
														<TableRow key={it.id}>
															<TableCell className="font-medium">
																{it.product_name}
																<span className="block text-[11px] text-muted-foreground">
																	SKU: {it.product_sku}
																</span>
															</TableCell>
															<TableCell className="text-center font-mono text-xs">
																{Number(it.po_quantity || 0)}
															</TableCell>
															<TableCell className="text-center font-mono text-xs text-emerald-600 font-bold">
																{Number(it.grn_quantity || 0)}
															</TableCell>
															<TableCell className="text-center font-mono text-xs">
																{Number(it.billed_quantity)}
															</TableCell>
															<TableCell className="text-right font-mono text-xs">
																₹{Number(it.unit_price).toFixed(2)}
															</TableCell>
															<TableCell className="text-center">
																{hasPriceVar || hasQtyVar ? (
																	<div className="flex flex-col gap-1 items-center">
																		{hasPriceVar && (
																			<Badge variant="destructive" className="text-[10px] py-0">
																				Price: ₹{Number(it.price_variance).toFixed(2)}
																			</Badge>
																		)}
																		{hasQtyVar && (
																			<Badge variant="destructive" className="text-[10px] py-0">
																				Qty: {Number(it.quantity_variance)}
																			</Badge>
																		)}
																	</div>
																) : (
																	<Badge variant="outline" className="text-emerald-600 border-emerald-500 text-[10px]">
																		Exact Match
																	</Badge>
																)}
															</TableCell>
															<TableCell className="text-right font-semibold">
																₹{Number(it.line_total).toFixed(2)}
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</div>
								</div>

								{/* Payment Allocations history */}
								{invoiceDetail.allocations && invoiceDetail.allocations.length > 0 && (
									<div>
										<h4 className="font-semibold text-sm mb-2">Payment Disbursements History</h4>
										<div className="rounded-md border overflow-hidden">
											<Table>
												<TableHeader className="bg-muted/50">
													<TableRow>
														<TableHead>Date</TableHead>
														<TableHead>Reference</TableHead>
														<TableHead>Mode</TableHead>
														<TableHead>Amount</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{invoiceDetail.allocations.map((a: any) => (
														<TableRow key={a.id}>
															<TableCell className="text-xs">
																{new Date(a.payment_date).toLocaleString()}
															</TableCell>
															<TableCell className="font-mono text-xs">
																{a.reference_number || "N/A"}
															</TableCell>
															<TableCell className="text-xs uppercase">
																{a.payment_mode}
															</TableCell>
															<TableCell className="font-bold text-emerald-600">
																{formatCurrency(a.allocated_amount)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</div>
								)}

								{/* Finance Approval Action */}
								{invoiceDetail.status !== "approved_for_payment" &&
									invoiceDetail.status !== "paid" && (
										<div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
											<h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200 mb-1">
												Finance Verification & Approval
											</h4>
											<p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
												Approving this invoice registers the payable into the general ledger and unlocks payout disbursement.
											</p>

											{invoiceDetail.matching_status !== "matched" &&
												invoiceDetail.matching_status !== "variance_approved" && (
													<div className="space-y-3 mb-3">
														<div className="flex items-center gap-2">
															<input
																type="checkbox"
																id="overrideCheck"
																checked={allowOverride}
																onChange={(e) => setAllowOverride(e.target.checked)}
																className="h-4 w-4 rounded border-gray-300"
															/>
															<Label htmlFor="overrideCheck" className="text-xs font-semibold text-amber-900">
																I authorize variance override approval for this invoice
															</Label>
														</div>
														{allowOverride && (
															<Input
																placeholder="Enter audit rationale for accepting the variance..."
																value={overrideNotes}
																onChange={(e) => setOverrideNotes(e.target.value)}
																className="text-xs bg-white"
															/>
														)}
													</div>
												)}

											<Button
												onClick={() =>
													approveMutation.mutate({
														invoiceId: invoiceDetail.id,
														allowVarianceOverride: allowOverride,
														overrideNotes,
													})
												}
												disabled={
													approveMutation.isPending ||
													(invoiceDetail.matching_status !== "matched" &&
														invoiceDetail.matching_status !== "variance_approved" &&
														!allowOverride)
												}
												className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
											>
												{approveMutation.isPending && (
													<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
												)}
												<CheckCircle2Icon className="h-4 w-4" />
												Approve Payable for Disbursement
											</Button>
										</div>
									)}
							</div>
						)}

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
								Close Audit
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Execute Payment Disbursement Dialog */}
				<Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<BanknoteIcon className="h-5 w-5 text-emerald-600" />
								Execute Supplier Disbursement
							</DialogTitle>
							<DialogDescription>
								Post payment transaction and atomically deduct bank balance.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div>
								<Label className="text-xs font-medium">Disbursement Amount (₹)</Label>
								<Input
									type="number"
									step="0.01"
									value={paymentAmount}
									onChange={(e) => setPaymentAmount(Number.parseFloat(e.target.value) || 0)}
									className="font-bold text-base mt-1"
								/>
							</div>

							<div>
								<Label className="text-xs font-medium">Select Source Bank / Cash Account</Label>
								<select
									className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
									value={selectedBankId || ""}
									onChange={(e) =>
										setSelectedBankId(
											e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
										)
									}
								>
									<option value="">-- Direct External Payment (No Bank Deduction) --</option>
									{bankAccountsList?.items?.map((acc: any) => (
										<option key={acc.id} value={acc.id}>
											{acc.account_name} ({acc.bank_name || "Cash"}) — Balance: ₹{Number(acc.current_balance).toLocaleString()}
										</option>
									))}
								</select>
							</div>

							<div>
								<Label className="text-xs font-medium">Payment Mode</Label>
								<select
									className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
									value={paymentMode}
									onChange={(e: any) => setPaymentMode(e.target.value)}
								>
									<option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
									<option value="upi">UPI</option>
									<option value="cheque">Cheque</option>
									<option value="cash">Cash</option>
								</select>
							</div>

							<div>
								<Label className="text-xs font-medium">Transaction / UTR Reference #</Label>
								<Input
									value={paymentReference}
									onChange={(e) => setPaymentReference(e.target.value)}
									placeholder="e.g. UTR1239847120"
									className="mt-1"
								/>
							</div>

							<div>
								<Label className="text-xs font-medium">Remarks / Notes</Label>
								<Input
									value={paymentNotes}
									onChange={(e) => setPaymentNotes(e.target.value)}
									placeholder="Optional notes"
									className="mt-1"
								/>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={() =>
									paymentMutation.mutate({
										invoiceId: selectedInvoiceId!,
										amount: paymentAmount,
										paymentMode,
										referenceNumber: paymentReference,
										bankAccountId: selectedBankId,
										notes: paymentNotes,
									})
								}
								disabled={paymentMutation.isPending || paymentAmount <= 0}
								className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
							>
								{paymentMutation.isPending && (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								)}
								Confirm & Disburse
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PageTransition>
	);
}
