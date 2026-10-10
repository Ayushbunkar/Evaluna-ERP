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
	CheckCircle2Icon,
	EyeIcon,
	FileTextIcon,
	Loader2Icon,
	PlusIcon,
	ReceiptIcon,
	SearchIcon,
	ShieldAlertIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ProcurementInvoicesPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Queries
	const { data: invoices, isLoading: invoicesLoading } =
		trpc.procurement.listInvoices.useQuery({
			search: searchQuery || undefined,
		});

	const { data: pos } = trpc.procurement.listPOs.useQuery({ limit: 100 });
	const { data: kpis } = trpc.procurement.getProcurementKpis.useQuery();

	// Modal States
	const [isRegisterOpen, setIsRegisterOpen] = useState(false);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

	// Register Invoice Form State
	const [selectedPOId, setSelectedPOId] = useState<number>(0);
	const [invoiceNumber, setInvoiceNumber] = useState("");
	const [invoiceDate, setInvoiceDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [dueDate, setDueDate] = useState("");
	const [invoiceItems, setInvoiceItems] = useState<
		Array<{
			productId: number;
			productName?: string;
			billedQuantity: number;
			unitPrice: number;
			taxRate: number;
		}>
	>([]);

	// Selected PO Query to preload items
	const { data: selectedPO } = trpc.procurement.getPO.useQuery(
		{ id: selectedPOId },
		{ enabled: selectedPOId > 0 },
	);

	// Invoice Detail Query
	const { data: invoiceDetail, isLoading: detailLoading } =
		trpc.procurement.getInvoice.useQuery(
			{ id: selectedInvoiceId! },
			{ enabled: !!selectedInvoiceId },
		);

	// When PO changes, preload line items
	const handleSelectPO = (poId: number) => {
		setSelectedPOId(poId);
	};

	// Update items when selectedPO finishes loading
	const handleLoadPOItems = () => {
		if (selectedPO?.items) {
			setInvoiceItems(
				selectedPO.items.map((it: any) => ({
					productId: it.product_id,
					productName: it.product_name,
					billedQuantity: Number(it.quantity),
					unitPrice: Number(it.price),
					taxRate: Number(it.cgst_rate || 0) + Number(it.sgst_rate || 0) + Number(it.igst_rate || 0),
				})),
			);
		}
	};

	// Mutation
	const registerMutation = trpc.procurement.registerInvoice.useMutation({
		onSuccess: (inv) => {
			toast.success(
				`Vendor Invoice #${inv.invoice_number} registered! 3-Way Match Status: ${inv.matching_status.toUpperCase()}`,
			);
			utils.procurement.listInvoices.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			setIsRegisterOpen(false);
			setSelectedPOId(0);
			setInvoiceNumber("");
			setInvoiceItems([]);
		},
		onError: (err) => {
			toast.error(`Registration failed: ${err.message}`);
		},
	});

	const handleItemChange = (index: number, field: string, val: any) => {
		setInvoiceItems((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], [field]: val };
			return updated;
		});
	};

	const filteredInvoices =
		invoices?.filter((inv) => {
			if (statusFilter === "all") return true;
			if (statusFilter === "matched") return inv.matching_status === "matched";
			if (statusFilter === "mismatch") {
				return inv.matching_status !== "matched" && inv.matching_status !== "variance_approved";
			}
			return inv.status === statusFilter;
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
							Supplier Invoices & 3-Way Matching
						</h1>
						<p className="text-muted-foreground text-sm">
							Register vendor bills, run automated 3-way reconciliation against PO commitments and warehouse receipts, and route for finance approval.
						</p>
					</div>
					<Button
						onClick={() => setIsRegisterOpen(true)}
						className="gap-2 bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
					>
						<PlusIcon className="h-4 w-4" />
						Register Supplier Bill
					</Button>
				</div>

				{/* KPI Cards */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
					<Card className="border-l-4 border-l-blue-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Total Registered</p>
								<h3 className="mt-1 font-bold text-2xl text-foreground tracking-tight">
									{invoices?.length ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Vendor invoices on file</p>
							</div>
							<div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
								<ReceiptIcon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-emerald-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">3-Way Matched</p>
								<h3 className="mt-1 font-bold text-2xl text-emerald-600 dark:text-emerald-400 tracking-tight">
									{invoices?.filter((i) => i.matching_status === "matched").length ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Zero variance verified</p>
							</div>
							<div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
								<CheckCircle2Icon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-purple-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Price / Qty Variances</p>
								<h3 className="mt-1 font-bold text-2xl text-purple-600 dark:text-purple-400 tracking-tight">
									{kpis?.mismatchedInvoices ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Exceptions flagged</p>
							</div>
							<div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
								<AlertTriangleIcon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-rose-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Outstanding Payables</p>
								<h3 className="mt-1 font-bold text-2xl text-rose-600 dark:text-rose-400 tracking-tight">
									{formatCurrency(kpis?.totalOutstanding)}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Awaiting settlement</p>
							</div>
							<div className="rounded-xl bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
								<ReceiptIcon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters & Search */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full max-w-sm">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search by invoice # or supplier..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 bg-background/50 border-border/80"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{[
							{ id: "all", label: "All Invoices" },
							{ id: "matched", label: "Matched (Clean)" },
							{ id: "mismatch", label: "Discrepancies" },
							{ id: "approved_for_payment", label: "Approved" },
							{ id: "paid", label: "Paid" },
						].map((tab) => (
							<Button
								key={tab.id}
								variant={statusFilter === tab.id ? "default" : "outline"}
								size="sm"
								onClick={() => setStatusFilter(tab.id)}
								className="text-xs font-semibold"
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
							Showing {filteredInvoices.length} invoices
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
												<p className="mt-2 text-gray-500 text-xs">Loading invoices...</p>
											</TableCell>
										</TableRow>
									) : filteredInvoices.length === 0 ? (
										<TableRow>
											<TableCell colSpan={9} className="h-32 text-center text-gray-500 text-sm">
												No supplier invoices found matching current criteria.
											</TableCell>
										</TableRow>
									) : (
										filteredInvoices.map((inv) => (
											<TableRow key={inv.id} className="hover:bg-muted/50">
												<TableCell className="font-semibold font-mono text-xs">
													{inv.invoice_number}
												</TableCell>
												<TableCell>{inv.supplier_name}</TableCell>
												<TableCell className="font-mono text-xs">
													{inv.po_number || "Direct PO"}
												</TableCell>
												<TableCell className="text-xs text-gray-500">
													{inv.invoice_date
														? new Date(inv.invoice_date).toLocaleDateString()
														: "N/A"}
												</TableCell>
												<TableCell className="font-semibold">
													{formatCurrency(inv.total_amount)}
												</TableCell>
												<TableCell className="font-bold text-red-600">
													{formatCurrency(inv.outstanding_amount)}
												</TableCell>
												<TableCell>
													{inv.matching_status === "matched" ? (
														<Badge className="bg-emerald-100 text-emerald-800">
															Exact Match
														</Badge>
													) : inv.matching_status === "variance_approved" ? (
														<Badge className="bg-blue-100 text-blue-800">
															Override Approved
														</Badge>
													) : (
														<Badge className="bg-amber-100 text-amber-800">
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
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setSelectedInvoiceId(inv.id);
															setIsDetailOpen(true);
														}}
														className="h-8 gap-1 text-xs"
													>
														<EyeIcon className="h-3.5 w-3.5" />
														Audit
													</Button>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{/* Register Invoice Modal */}
				<Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
					<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<ReceiptIcon className="h-5 w-5 text-blue-600" />
								Register Supplier Bill
							</DialogTitle>
							<DialogDescription>
								Link the vendor invoice to a Purchase Order to verify quantities, costs, and taxes.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-xs font-semibold">Select Purchase Order</Label>
									<select
										className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
										value={selectedPOId}
										onChange={(e) => handleSelectPO(Number(e.target.value))}
									>
										<option value={0}>-- Select PO to bill against --</option>
										{pos?.map((p) => (
											<option key={p.id} value={p.id}>
												{p.po_number || `PO-${p.id}`} — {p.supplier_name} (₹{Number(p.total_amount).toFixed(2)})
											</option>
										))}
									</select>
								</div>

								<div>
									<Label className="text-xs font-semibold">Supplier Bill / Invoice #</Label>
									<Input
										placeholder="e.g. INV-2026-981"
										value={invoiceNumber}
										onChange={(e) => setInvoiceNumber(e.target.value)}
										className="mt-1"
									/>
								</div>
							</div>

							{selectedPO && (
								<div className="rounded-lg bg-blue-50/50 p-3 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50 flex items-center justify-between">
									<div className="text-xs">
										<p className="font-semibold text-blue-900 dark:text-blue-200">
											Supplier: {selectedPO.supplier_name}
										</p>
										<p className="text-blue-700 dark:text-blue-400">
											Receiving Status: {selectedPO.receiving_status.toUpperCase()} | Total PO Value: ₹{Number(selectedPO.total_amount).toFixed(2)}
										</p>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={handleLoadPOItems}
										className="h-7 text-xs bg-white dark:bg-gray-800"
									>
										Preload PO Items
									</Button>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-xs">Invoice Date</Label>
									<Input
										type="date"
										value={invoiceDate}
										onChange={(e) => setInvoiceDate(e.target.value)}
										className="mt-1"
									/>
								</div>
								<div>
									<Label className="text-xs">Payment Due Date</Label>
									<Input
										type="date"
										value={dueDate}
										onChange={(e) => setDueDate(e.target.value)}
										className="mt-1"
									/>
								</div>
							</div>

							{invoiceItems.length > 0 && (
								<div>
									<Label className="text-xs font-semibold mb-2 block">
										Billed Items & Rates
									</Label>
									<div className="rounded-md border overflow-hidden">
										<Table>
											<TableHeader className="bg-muted/50">
												<TableRow>
													<TableHead>Product</TableHead>
													<TableHead className="text-center">Billed Qty</TableHead>
													<TableHead className="text-right">Unit Price (₹)</TableHead>
													<TableHead className="text-center">Tax %</TableHead>
													<TableHead className="text-right">Line Total</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{invoiceItems.map((row, idx) => {
													const lineBase = row.billedQuantity * row.unitPrice;
													const lineTotal = lineBase + lineBase * (row.taxRate / 100);
													return (
														<TableRow key={idx}>
															<TableCell className="font-medium text-xs">
																{row.productName || `Product #${row.productId}`}
															</TableCell>
															<TableCell className="text-center">
																<Input
																	type="number"
																	step="0.001"
																	value={row.billedQuantity}
																	onChange={(e) =>
																		handleItemChange(
																			idx,
																			"billedQuantity",
																			Number.parseFloat(e.target.value) || 0,
																		)
																	}
																	className="h-7 text-xs w-20 mx-auto text-center"
																/>
															</TableCell>
															<TableCell className="text-right">
																<Input
																	type="number"
																	step="0.01"
																	value={row.unitPrice}
																	onChange={(e) =>
																		handleItemChange(
																			idx,
																			"unitPrice",
																			Number.parseFloat(e.target.value) || 0,
																		)
																	}
																	className="h-7 text-xs w-24 ml-auto text-right"
																/>
															</TableCell>
															<TableCell className="text-center font-mono text-xs">
																{row.taxRate}%
															</TableCell>
															<TableCell className="text-right font-bold text-xs">
																₹{lineTotal.toFixed(2)}
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</div>
								</div>
							)}
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsRegisterOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={() =>
									registerMutation.mutate({
										purchaseId: selectedPOId,
										supplierId: selectedPO!.supplier_id!,
										invoiceNumber: invoiceNumber.trim(),
										invoiceDate: new Date(invoiceDate),
										dueDate: dueDate ? new Date(dueDate) : undefined,
										items: invoiceItems.map((i) => ({
											productId: i.productId,
											billedQuantity: i.billedQuantity,
											unitPrice: i.unitPrice,
											taxRate: i.taxRate,
										})),
									})
								}
								disabled={
									registerMutation.isPending ||
									selectedPOId === 0 ||
									!invoiceNumber.trim() ||
									invoiceItems.length === 0
								}
								className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
							>
								{registerMutation.isPending && (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								)}
								Register & Match
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Detail & Audit Dialog */}
				<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
					<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<ReceiptIcon className="h-5 w-5 text-blue-600" />
								Invoice 3-Way Match Verification
							</DialogTitle>
						</DialogHeader>

						{detailLoading || !invoiceDetail ? (
							<div className="py-12 text-center">
								<Loader2Icon className="mx-auto h-8 w-8 animate-spin text-gray-400" />
							</div>
						) : (
							<div className="space-y-4">
								<div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/40 p-3 text-xs">
									<div>
										<span className="text-muted-foreground block">Invoice #</span>
										<span className="font-bold text-sm">{invoiceDetail.invoice_number}</span>
									</div>
									<div>
										<span className="text-muted-foreground block">Supplier</span>
										<span className="font-semibold">{invoiceDetail.supplier_name}</span>
									</div>
									<div>
										<span className="text-muted-foreground block">Matching Result</span>
										<span className="font-bold uppercase text-emerald-600">
											{invoiceDetail.matching_status}
										</span>
									</div>
								</div>

								<div className="rounded-md border overflow-hidden">
									<Table>
										<TableHeader className="bg-muted/50">
											<TableRow>
												<TableHead>Product</TableHead>
												<TableHead className="text-center">PO Qty</TableHead>
												<TableHead className="text-center">GRN Accepted</TableHead>
												<TableHead className="text-center">Billed Qty</TableHead>
												<TableHead className="text-right">Unit Price</TableHead>
												<TableHead className="text-right">Variances</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{invoiceDetail.items?.map((it: any) => (
												<TableRow key={it.id}>
													<TableCell className="font-medium text-xs">
														{it.product_name}
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
													<TableCell className="text-right text-xs">
														{Math.abs(Number(it.price_variance || 0)) > 0.01 ||
														Math.abs(Number(it.quantity_variance || 0)) > 0.001 ? (
															<span className="text-red-600 font-bold">
																ΔP: ₹{Number(it.price_variance).toFixed(2)} | ΔQ: {Number(it.quantity_variance)}
															</span>
														) : (
															<span className="text-emerald-600 font-semibold">Matched</span>
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						)}

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsDetailOpen(false)}>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PageTransition>
	);
}
