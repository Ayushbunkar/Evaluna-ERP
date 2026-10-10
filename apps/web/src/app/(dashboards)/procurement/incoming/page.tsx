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
	ArrowRightIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
	EyeIcon,
	Loader2Icon,
	PackageCheckIcon,
	SearchIcon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function IncomingShipmentsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Queries
	const { data: pos, isLoading: posLoading } = trpc.procurement.listPOs.useQuery(
		{
			search: searchQuery || undefined,
		},
	);
	const { data: grns } = trpc.procurement.listGRNs.useQuery({});
	const { data: kpis } = trpc.procurement.getProcurementKpis.useQuery();

	// Receive Modal State
	const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
	const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
	const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
	const [vehicleNumber, setVehicleNumber] = useState("");
	const [receiptNotes, setReceiptNotes] = useState("");

	// Line item inspection state
	const [receivedItems, setReceivedItems] = useState<
		Array<{
			purchaseItemId: number;
			productId: number;
			productName: string;
			orderedQuantity: number;
			receivedQuantity: number;
			acceptedQuantity: number;
			rejectedQuantity: number;
			damagedQuantity: number;
			unitCost: number;
			batchNumber: string;
			inspectionNotes: string;
		}>
	>([]);

	// Selected PO Query
	const { data: poDetail, isLoading: poLoading } = trpc.procurement.getPO.useQuery(
		{ id: selectedPOId! },
		{ enabled: !!selectedPOId },
	);

	// Mutation
	const recordReceiptMutation = trpc.procurement.recordReceipt.useMutation({
		onSuccess: (grn) => {
			toast.success(
				`Goods Receipt Note ${grn.grn_number} generated! Inventory updated for accepted goods.`,
			);
			utils.procurement.listPOs.invalidate();
			utils.procurement.listGRNs.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			utils.warehouse.getReceivingPOs.invalidate();
			setIsReceiveDialogOpen(false);
			setSelectedPOId(null);
		},
		onError: (err) => {
			toast.error(`Goods receipt failed: ${err.message}`);
		},
	});

	const handleOpenReceive = (po: any) => {
		setSelectedPOId(po.id);
		setDeliveryNoteNumber(`DN-${Date.now().toString().slice(-5)}`);
		setVehicleNumber("");
		setReceiptNotes("");
		setIsReceiveDialogOpen(true);
	};

	// When poDetail loads, initialize receivedItems
	const handleInitInspection = () => {
		if (poDetail?.items) {
			setReceivedItems(
				poDetail.items.map((it: any) => ({
					purchaseItemId: it.id,
					productId: it.product_id,
					productName: it.product_name,
					orderedQuantity: Number(it.quantity),
					receivedQuantity: Number(it.quantity),
					acceptedQuantity: Number(it.quantity),
					rejectedQuantity: 0,
					damagedQuantity: 0,
					unitCost: Number(it.price),
					batchNumber: `B-${Date.now().toString().slice(-4)}`,
					inspectionNotes: "Good condition upon inspection",
				})),
			);
		}
	};

	const handleItemChange = (index: number, field: string, val: any) => {
		setReceivedItems((prev) => {
			const updated = [...prev];
			const current = { ...updated[index], [field]: val };

			if (field === "receivedQuantity") {
				current.acceptedQuantity = val - (current.rejectedQuantity + current.damagedQuantity);
			} else if (field === "rejectedQuantity" || field === "damagedQuantity") {
				const sumBad = Number(current.rejectedQuantity || 0) + Number(current.damagedQuantity || 0);
				current.acceptedQuantity = Math.max(0, current.receivedQuantity - sumBad);
			}

			updated[index] = current;
			return updated;
		});
	};

	const filteredPOs =
		pos?.filter((p) => {
			if (statusFilter === "all") return true;
			if (statusFilter === "pending") return p.receiving_status === "pending";
			if (statusFilter === "partial") return p.receiving_status === "partial";
			if (statusFilter === "received") return p.receiving_status === "received";
			return true;
		}) || [];

	return (
		<PageTransition>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
							Incoming Inventory & Warehouse Inbound
						</h1>
						<p className="text-muted-foreground text-sm">
							Track inbound supplier shipments, verify physical deliveries, inspect quality, and post accepted stock to the warehouse ledger.
						</p>
					</div>
					<Button asChild variant="outline" className="gap-2 border-border/80 bg-background/50 font-semibold text-xs shadow-xs hover:bg-muted">
						<Link href="/dashboard/warehouse/receiving">
							<PackageCheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							Warehouse Receiving Console
						</Link>
					</Button>
				</div>

				{/* KPI Cards */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
					<Card className="border-l-4 border-l-amber-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Pending Delivery</p>
								<h3 className="mt-1 font-bold text-2xl text-amber-600 dark:text-amber-400 tracking-tight">
									{pos?.filter((p) => p.receiving_status === "pending").length ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Awaiting dock arrival</p>
							</div>
							<div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
								<TruckIcon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-blue-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Partially Received</p>
								<h3 className="mt-1 font-bold text-2xl text-blue-600 dark:text-blue-400 tracking-tight">
									{kpis?.partiallyReceived ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Split shipments in-progress</p>
							</div>
							<div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
								<ClockIcon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-emerald-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Fully Received</p>
								<h3 className="mt-1 font-bold text-2xl text-emerald-600 dark:text-emerald-400 tracking-tight">
									{pos?.filter((p) => p.receiving_status === "received").length ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Stock ledger incremented</p>
							</div>
							<div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
								<CheckCircle2Icon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-purple-500 border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Goods Receipt Notes</p>
								<h3 className="mt-1 font-bold text-2xl text-purple-600 dark:text-purple-400 tracking-tight">
									{grns?.length ?? 0}
								</h3>
								<p className="mt-1 text-[11px] text-muted-foreground">Official GRNs logged</p>
							</div>
							<div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
								<PackageCheckIcon className="h-6 w-6" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters & Table */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full max-w-sm">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search by PO # or supplier..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 bg-background/50 border-border/80"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{[
							{ id: "all", label: "All POs" },
							{ id: "pending", label: "Pending Inbound" },
							{ id: "partial", label: "Partially Received" },
							{ id: "received", label: "Fully Received" },
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

				<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
					<CardHeader className="border-border/60 border-b p-4">
						<CardTitle className="font-bold text-base text-foreground">Inbound PO Shipments Queue</CardTitle>
						<CardDescription className="text-muted-foreground text-xs">
							Showing {filteredPOs.length} purchase orders ready for gate check-in
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>PO Number</TableHead>
										<TableHead>Supplier</TableHead>
										<TableHead>Expected Delivery</TableHead>
										<TableHead>Confirmed Delivery</TableHead>
										<TableHead>Items / Qty</TableHead>
										<TableHead>Receiving Status</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{posLoading ? (
										<TableRow>
											<TableCell colSpan={7} className="h-32 text-center">
												<Loader2Icon className="mx-auto h-6 w-6 animate-spin text-gray-400" />
												<p className="mt-2 text-gray-500 text-xs">Loading inbound queue...</p>
											</TableCell>
										</TableRow>
									) : filteredPOs.length === 0 ? (
										<TableRow>
											<TableCell colSpan={7} className="h-32 text-center text-gray-500 text-sm">
												No inbound purchase orders found matching current criteria.
											</TableCell>
										</TableRow>
									) : (
										filteredPOs.map((po) => {
											const isOverdue =
												po.expected_delivery_date &&
												new Date(po.expected_delivery_date) < new Date() &&
												po.receiving_status !== "received";

											return (
												<TableRow key={po.id} className="hover:bg-muted/50">
													<TableCell className="font-semibold font-mono text-xs">
														{po.po_number || `PO-${po.id}`}
													</TableCell>
													<TableCell>{po.supplier_name}</TableCell>
													<TableCell className="text-xs">
														{po.expected_delivery_date ? (
															<span className={isOverdue ? "text-red-600 font-bold" : "text-gray-600"}>
																{new Date(po.expected_delivery_date).toLocaleDateString()}
																{isOverdue && " (Overdue)"}
															</span>
														) : (
															<span className="text-muted-foreground">Not set</span>
														)}
													</TableCell>
													<TableCell className="text-xs text-muted-foreground">
														{po.confirmed_delivery_date
															? new Date(po.confirmed_delivery_date).toLocaleDateString()
															: "Pending Supplier"}
													</TableCell>
													<TableCell className="text-xs font-medium">
														{po.item_count} items ({po.total_quantity} units)
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className={
																po.receiving_status === "received"
																	? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]"
																	: po.receiving_status === "partial"
																		? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-[10px]"
																		: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-[10px]"
															}
														>
															{po.receiving_status.toUpperCase()}
														</Badge>
													</TableCell>
													<TableCell className="text-right">
														{po.receiving_status !== "received" ? (
															<Button
																size="sm"
																onClick={() => handleOpenReceive(po)}
																className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
															>
																<PackageCheckIcon className="h-3.5 w-3.5" />
																Inspect & Receive
															</Button>
														) : (
															<span className="text-xs text-emerald-600 font-semibold">
																Completed
															</span>
														)}
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{/* Inspect & Receive Modal */}
				<Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<PackageCheckIcon className="h-5 w-5 text-emerald-600" />
								Warehouse Goods Receipt & Quality Inspection
							</DialogTitle>
							<DialogDescription>
								Record actual delivered quantities, inspect quality, record shortages/damages, and post accepted inventory.
							</DialogDescription>
						</DialogHeader>

						{poLoading || !poDetail ? (
							<div className="py-12 text-center">
								<Loader2Icon className="mx-auto h-8 w-8 animate-spin text-gray-400" />
							</div>
						) : (
							<div className="space-y-4 py-2">
								<div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/40 p-3 text-xs">
									<div>
										<span className="text-muted-foreground block">PO Number</span>
										<span className="font-bold font-mono text-sm">{poDetail.po_number || `PO-${poDetail.id}`}</span>
									</div>
									<div>
										<span className="text-muted-foreground block">Supplier</span>
										<span className="font-semibold">{poDetail.supplier_name}</span>
									</div>
									<div>
										<span className="text-muted-foreground block">PO Value</span>
										<span className="font-bold text-sm">₹{Number(poDetail.total_amount).toFixed(2)}</span>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-xs">Supplier Delivery Note / Challan #</Label>
										<Input
											value={deliveryNoteNumber}
											onChange={(e) => setDeliveryNoteNumber(e.target.value)}
											className="mt-1"
										/>
									</div>
									<div>
										<Label className="text-xs">Delivery Vehicle # (Optional)</Label>
										<Input
											placeholder="e.g. DL-01-AB-1234"
											value={vehicleNumber}
											onChange={(e) => setVehicleNumber(e.target.value)}
											className="mt-1"
										/>
									</div>
								</div>

								{receivedItems.length === 0 ? (
									<div className="rounded-lg border border-dashed p-6 text-center">
										<p className="text-xs text-muted-foreground mb-3">
											Load PO items into inspection table to record delivered quantities.
										</p>
										<Button size="sm" onClick={handleInitInspection} className="bg-blue-600 text-xs">
											Load PO Line Items
										</Button>
									</div>
								) : (
									<div>
										<h4 className="font-semibold text-xs mb-2">Item-Level Quality & Quantity Inspection</h4>
										<div className="rounded-md border overflow-hidden">
											<Table>
												<TableHeader className="bg-muted/50">
													<TableRow>
														<TableHead>Product</TableHead>
														<TableHead className="text-center">Ordered</TableHead>
														<TableHead className="text-center">Received</TableHead>
														<TableHead className="text-center">Accepted</TableHead>
														<TableHead className="text-center">Damaged / Rejected</TableHead>
														<TableHead>Batch #</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{receivedItems.map((row, idx) => (
														<TableRow key={idx}>
															<TableCell className="font-medium text-xs">
																{row.productName}
															</TableCell>
															<TableCell className="text-center font-mono text-xs">
																{row.orderedQuantity}
															</TableCell>
															<TableCell className="text-center">
																<Input
																	type="number"
																	step="0.001"
																	value={row.receivedQuantity}
																	onChange={(e) =>
																		handleItemChange(
																			idx,
																			"receivedQuantity",
																			Number.parseFloat(e.target.value) || 0,
																		)
																	}
																	className="h-7 text-xs w-20 mx-auto text-center"
																/>
															</TableCell>
															<TableCell className="text-center">
																<Input
																	type="number"
																	step="0.001"
																	value={row.acceptedQuantity}
																	onChange={(e) =>
																		handleItemChange(
																			idx,
																			"acceptedQuantity",
																			Number.parseFloat(e.target.value) || 0,
																		)
																	}
																	className="h-7 text-xs w-20 mx-auto text-center text-emerald-700 font-bold bg-emerald-50"
																/>
															</TableCell>
															<TableCell className="text-center">
																<div className="flex gap-1 justify-center">
																	<Input
																		type="number"
																		placeholder="Dmg"
																		value={row.damagedQuantity}
																		onChange={(e) =>
																			handleItemChange(
																				idx,
																				"damagedQuantity",
																				Number.parseFloat(e.target.value) || 0,
																			)
																		}
																		className="h-7 text-xs w-16 text-center text-red-600"
																	/>
																	<Input
																		type="number"
																		placeholder="Rej"
																		value={row.rejectedQuantity}
																		onChange={(e) =>
																			handleItemChange(
																				idx,
																				"rejectedQuantity",
																				Number.parseFloat(e.target.value) || 0,
																			)
																		}
																		className="h-7 text-xs w-16 text-center text-amber-600"
																	/>
																</div>
															</TableCell>
															<TableCell>
																<Input
																	value={row.batchNumber}
																	onChange={(e) =>
																		handleItemChange(idx, "batchNumber", e.target.value)
																	}
																	className="h-7 text-xs font-mono"
																/>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</div>
								)}

								<div>
									<Label className="text-xs">Inspection Remarks / Warehouse Notes</Label>
									<Input
										placeholder="Optional receiving notes..."
										value={receiptNotes}
										onChange={(e) => setReceiptNotes(e.target.value)}
										className="mt-1"
									/>
								</div>
							</div>
						)}

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={() =>
									recordReceiptMutation.mutate({
										purchaseId: selectedPOId!,
										deliveryNoteNumber,
										vehicleNumber,
										notes: receiptNotes,
										items: receivedItems.map((i) => ({
											purchaseItemId: i.purchaseItemId,
											productId: i.productId,
											orderedQuantity: i.orderedQuantity,
											receivedQuantity: i.receivedQuantity,
											acceptedQuantity: i.acceptedQuantity,
											rejectedQuantity: i.rejectedQuantity,
											damagedQuantity: i.damagedQuantity,
											shortageQuantity: Math.max(0, i.orderedQuantity - i.receivedQuantity),
											unitCost: i.unitCost,
											batchNumber: i.batchNumber,
										})),
									})
								}
								disabled={recordReceiptMutation.isPending || receivedItems.length === 0}
								className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
							>
								{recordReceiptMutation.isPending && (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								)}
								Generate GRN & Update Inventory
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PageTransition>
	);
}
