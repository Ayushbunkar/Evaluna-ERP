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
	ArrowRightIcon,
	CheckCircle2Icon,
	ClockIcon,
	FileTextIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	ShoppingCartIcon,
	Trash2Icon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PurchaseRequestsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Queries
	const { data: requests, isLoading: requestsLoading } =
		trpc.procurement.listRequests.useQuery({
			search: searchQuery || undefined,
		});

	const { data: kpis } = trpc.procurement.getProcurementKpis.useQuery();
	const { data: invData } = trpc.inventory.list.useQuery({ limit: 200 });
	const { data: suppliersList } = trpc.suppliers.list.useQuery();

	// Modal States
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isConvertOpen, setIsConvertOpen] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);

	const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

	// Create PR Form State
	const [department, setDepartment] = useState("Warehouse");
	const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
	const [prNotes, setPrNotes] = useState("");
	const [requestItems, setRequestItems] = useState<
		Array<{
			productId: number;
			quantity: number;
			estimatedUnitCost: number;
			preferredSupplierId?: number;
			notes?: string;
		}>
	>([{ productId: 0, quantity: 1, estimatedUnitCost: 10 }]);

	// Convert Form State
	const [targetSupplierId, setTargetSupplierId] = useState<number>(0);
	const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");

	// Reject Form State
	const [rejectionReason, setRejectionReason] = useState("");

	// Mutations
	const createMutation = trpc.procurement.createRequest.useMutation({
		onSuccess: () => {
			toast.success("Purchase Request submitted for approval!");
			utils.procurement.listRequests.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			setIsCreateOpen(false);
			setRequestItems([{ productId: 0, quantity: 1, estimatedUnitCost: 10 }]);
			setPrNotes("");
		},
		onError: (err) => {
			toast.error(`Request creation failed: ${err.message}`);
		},
	});

	const approveMutation = trpc.procurement.approveRequest.useMutation({
		onSuccess: () => {
			toast.success("Purchase Request approved!");
			utils.procurement.listRequests.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
		},
		onError: (err) => {
			toast.error(`Approval failed: ${err.message}`);
		},
	});

	const rejectMutation = trpc.procurement.rejectRequest.useMutation({
		onSuccess: () => {
			toast.success("Purchase Request rejected.");
			utils.procurement.listRequests.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			setIsRejectOpen(false);
			setRejectionReason("");
		},
		onError: (err) => {
			toast.error(`Rejection failed: ${err.message}`);
		},
	});

	const convertMutation = trpc.procurement.convertToPO.useMutation({
		onSuccess: (po) => {
			toast.success(`Purchase Request converted to PO #${po.po_number || po.id}!`);
			utils.procurement.listRequests.invalidate();
			utils.procurement.listPOs.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			setIsConvertOpen(false);
		},
		onError: (err) => {
			toast.error(`Conversion to PO failed: ${err.message}`);
		},
	});

	const handleAddItemRow = () => {
		setRequestItems((prev) => [
			...prev,
			{ productId: 0, quantity: 1, estimatedUnitCost: 10 },
		]);
	};

	const handleRemoveItemRow = (index: number) => {
		if (requestItems.length <= 1) return;
		setRequestItems((prev) => prev.filter((_, i) => i !== index));
	};

	const handleItemChange = (index: number, field: string, val: any) => {
		setRequestItems((prev) => {
			const updated = [...prev];
			const current = { ...updated[index], [field]: val };

			if (field === "productId") {
				const prod = invData?.items?.find((p: any) => p.id === Number(val));
				if (prod) {
					current.estimatedUnitCost = Number(
						prod.base_procurement_price || prod.procurement_price || prod.price || 10,
					);
				}
			}

			updated[index] = current;
			return updated;
		});
	};

	const filteredRequests =
		requests?.filter((req) => {
			if (statusFilter === "all") return true;
			return req.status === statusFilter;
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
							Purchase Requests (PR)
						</h1>
						<p className="text-muted-foreground text-sm">
							Internal material requisitions initiated by warehouse or department teams, awaiting manager approval before converting to POs.
						</p>
					</div>
					<Button
						onClick={() => setIsCreateOpen(true)}
						className="gap-2 bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
					>
						<PlusIcon className="h-4 w-4" />
						Create Purchase Request
					</Button>
				</div>

				{/* KPI Cards */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Card className="border-l-4 border-l-amber-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Pending Approval</p>
								<h3 className="mt-1 font-bold text-2xl text-amber-600 dark:text-amber-400 tracking-tight">
									{kpis?.pendingPRs ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Requires manager authorization</p>
							</div>
							<div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
								<ClockIcon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-emerald-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Approved Requests</p>
								<h3 className="mt-1 font-bold text-2xl text-emerald-600 dark:text-emerald-400 tracking-tight">
									{kpis?.approvedPRs ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Ready for conversion to PO</p>
							</div>
							<div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
								<CheckCircle2Icon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-purple-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Total Requests</p>
								<h3 className="mt-1 font-bold text-2xl text-foreground tracking-tight">
									{requests?.length ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">All logged requisitions</p>
							</div>
							<div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
								<FileTextIcon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters & Search */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full max-w-sm">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<Input
							placeholder="Search by request # or requester..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{[
							{ id: "all", label: "All Requests" },
							{ id: "pending_approval", label: "Pending" },
							{ id: "approved", label: "Approved" },
							{ id: "converted", label: "Converted to PO" },
							{ id: "rejected", label: "Rejected" },
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

				{/* Requests Table */}
				<Card className="shadow-sm">
					<CardHeader className="p-4">
						<CardTitle className="text-base">Purchase Request Ledger</CardTitle>
						<CardDescription className="text-xs">
							Showing {filteredRequests.length} purchase requests
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Request #</TableHead>
										<TableHead>Department</TableHead>
										<TableHead>Requested By</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Items</TableHead>
										<TableHead>Est. Total</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Created</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{requestsLoading ? (
										<TableRow>
											<TableCell colSpan={9} className="h-32 text-center">
												<Loader2Icon className="mx-auto h-6 w-6 animate-spin text-gray-400" />
												<p className="mt-2 text-gray-500 text-xs">Loading requests...</p>
											</TableCell>
										</TableRow>
									) : filteredRequests.length === 0 ? (
										<TableRow>
											<TableCell colSpan={9} className="h-32 text-center text-gray-500 text-sm">
												No purchase requests found.
											</TableCell>
										</TableRow>
									) : (
										filteredRequests.map((req) => (
											<TableRow key={req.id} className="hover:bg-muted/50">
												<TableCell className="font-semibold font-mono text-xs">
													{req.request_number}
												</TableCell>
												<TableCell>{req.department}</TableCell>
												<TableCell className="text-xs">{req.requested_by}</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={
															req.priority === "urgent"
																? "border-red-500 text-red-600 font-bold"
																: req.priority === "high"
																	? "border-amber-500 text-amber-600"
																	: "border-gray-300 text-gray-600"
														}
													>
														{req.priority.toUpperCase()}
													</Badge>
												</TableCell>
												<TableCell className="text-xs">{req.item_count} items</TableCell>
												<TableCell className="font-semibold">
													{formatCurrency(req.estimated_total)}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={
															req.status === "approved"
																? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]"
																: req.status === "converted"
																	? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-[10px]"
																	: req.status === "rejected"
																		? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium text-[10px]"
																		: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-[10px]"
														}
													>
														{req.status.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-xs text-gray-500">
													{req.created_at
														? new Date(req.created_at).toLocaleDateString()
														: "N/A"}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1.5">
														{req.status === "pending_approval" && (
															<>
																<Button
																	size="sm"
																	onClick={() => approveMutation.mutate({ id: req.id })}
																	disabled={approveMutation.isPending}
																	className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
																>
																	Approve
																</Button>
																<Button
																	size="sm"
																	variant="destructive"
																	onClick={() => {
																		setSelectedRequestId(req.id);
																		setIsRejectOpen(true);
																	}}
																	className="h-7 text-xs"
																>
																	Reject
																</Button>
															</>
														)}

														{req.status === "approved" && (
															<Button
																size="sm"
																onClick={() => {
																	setSelectedRequestId(req.id);
																	setIsConvertOpen(true);
																}}
																className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
															>
																<ShoppingCartIcon className="h-3 w-3" />
																Issue PO
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

				{/* Create PR Modal */}
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<PlusIcon className="h-5 w-5 text-blue-600" />
								New Purchase Request
							</DialogTitle>
							<DialogDescription>
								Submit required goods for review before raising a supplier Purchase Order.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-xs">Requesting Department</Label>
									<select
										className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
										value={department}
										onChange={(e) => setDepartment(e.target.value)}
									>
										<option value="Warehouse">Warehouse & Logistics</option>
										<option value="Operations">Operations</option>
										<option value="Sales">Sales & Distribution</option>
										<option value="Retail">Retail Store</option>
									</select>
								</div>

								<div>
									<Label className="text-xs">Priority</Label>
									<select
										className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
										value={priority}
										onChange={(e: any) => setPriority(e.target.value)}
									>
										<option value="low">Low Priority</option>
										<option value="medium">Medium Priority</option>
										<option value="high">High Priority</option>
										<option value="urgent">Urgent</option>
									</select>
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between mb-2">
									<Label className="text-xs font-semibold">Requested Items</Label>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={handleAddItemRow}
										className="h-7 text-xs text-blue-600 gap-1"
									>
										<PlusIcon className="h-3 w-3" />
										Add Line Item
									</Button>
								</div>

								<div className="space-y-2">
									{requestItems.map((row, idx) => (
										<div
											key={idx}
											className="grid grid-cols-12 gap-2 items-center rounded-lg border p-2 bg-muted/20"
										>
											<div className="col-span-5">
												<select
													className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
													value={row.productId}
													onChange={(e) =>
														handleItemChange(idx, "productId", Number(e.target.value))
													}
												>
													<option value={0}>-- Select Product --</option>
													{invData?.items?.map((p: any) => (
														<option key={p.id} value={p.id}>
															{p.product} (SKU: {p.sku})
														</option>
													))}
												</select>
											</div>

											<div className="col-span-2">
												<Input
													type="number"
													min="1"
													placeholder="Qty"
													value={row.quantity}
													onChange={(e) =>
														handleItemChange(
															idx,
															"quantity",
															Number.parseFloat(e.target.value) || 1,
														)
													}
													className="h-8 text-xs text-center"
												/>
											</div>

											<div className="col-span-2">
												<Input
													type="number"
													min="0"
													placeholder="Est. Cost"
													value={row.estimatedUnitCost}
													onChange={(e) =>
														handleItemChange(
															idx,
															"estimatedUnitCost",
															Number.parseFloat(e.target.value) || 0,
														)
													}
													className="h-8 text-xs text-right"
												/>
											</div>

											<div className="col-span-2 font-mono text-xs font-bold text-right">
												₹{(row.quantity * row.estimatedUnitCost).toFixed(2)}
											</div>

											<div className="col-span-1 text-right">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveItemRow(idx)}
													disabled={requestItems.length <= 1}
													className="h-7 w-7 text-red-500 hover:text-red-700"
												>
													<Trash2Icon className="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>
									))}
								</div>
							</div>

							<div>
								<Label className="text-xs">Notes / Justification</Label>
								<Input
									placeholder="Reason for requisition..."
									value={prNotes}
									onChange={(e) => setPrNotes(e.target.value)}
									className="mt-1"
								/>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={() =>
									createMutation.mutate({
										department,
										priority,
										notes: prNotes,
										items: requestItems.filter((i) => i.productId > 0),
									})
								}
								disabled={
									createMutation.isPending ||
									requestItems.some((i) => i.productId === 0)
								}
								className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
							>
								{createMutation.isPending && (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								)}
								Submit Request
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Convert to PO Modal */}
				<Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<ShoppingCartIcon className="h-5 w-5 text-blue-600" />
								Convert PR to Purchase Order
							</DialogTitle>
							<DialogDescription>
								Select the vendor to issue this Purchase Order to.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div>
								<Label className="text-xs font-medium">Select Supplier</Label>
								<select
									className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
									value={targetSupplierId}
									onChange={(e) => setTargetSupplierId(Number(e.target.value))}
								>
									<option value={0}>-- Select Supplier --</option>
									{suppliersList?.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name} ({s.phone || "No phone"})
										</option>
									))}
								</select>
							</div>

							<div>
								<Label className="text-xs font-medium">Expected Delivery Date</Label>
								<Input
									type="date"
									value={expectedDeliveryDate}
									onChange={(e) => setExpectedDeliveryDate(e.target.value)}
									className="mt-1"
								/>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsConvertOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={() =>
									convertMutation.mutate({
										requestId: selectedRequestId!,
										supplierId: targetSupplierId,
										expectedDeliveryDate: expectedDeliveryDate
											? new Date(expectedDeliveryDate)
											: undefined,
									})
								}
								disabled={convertMutation.isPending || targetSupplierId === 0}
								className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
							>
								{convertMutation.isPending && (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								)}
								Create PO
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Reject PR Modal */}
				<Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-red-600">
								<XCircleIcon className="h-5 w-5" />
								Reject Purchase Request
							</DialogTitle>
							<DialogDescription>
								Provide the reason for rejecting this purchase request.
							</DialogDescription>
						</DialogHeader>

						<div className="py-2">
							<Label className="text-xs font-medium">Rejection Reason</Label>
							<Input
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="e.g. Budget constraint, excess inventory exists..."
								className="mt-1"
							/>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsRejectOpen(false)}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() =>
									rejectMutation.mutate({
										id: selectedRequestId!,
										reason: rejectionReason,
									})
								}
								disabled={rejectMutation.isPending || !rejectionReason.trim()}
							>
								{rejectMutation.isPending && (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								)}
								Confirm Rejection
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PageTransition>
	);
}
