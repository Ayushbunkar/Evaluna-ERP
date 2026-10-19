"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
	Truck,
	Calendar,
	Plus,
	Trash2,
	Save,
	Send,
	AlertCircle,
	CheckCircle2,
	Clock,
	Search,
	Package,
	FileText,
	Info,
	Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface PlannedItem {
	productId: string;
	productName: string;
	sku: string;
	availableStock: number;
	uom: string;
	plannedQty: number;
	isAdditional: boolean;
	additionalReason?: string;
	notes?: string;
}

export default function VanStockPlanningPage() {
	const utils = trpc.useUtils();
	const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
	const [dispatchDate, setDispatchDate] = useState<string>(
		new Date().toISOString().split("T")[0]
	);
	const [generalNotes, setGeneralNotes] = useState<string>("");
	const [items, setItems] = useState<PlannedItem[]>([]);

	// Product search state
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedProductId, setSelectedProductId] = useState("");
	const [qtyToAdd, setQtyToAdd] = useState<number>(1);
	const [isAdditionalItem, setIsAdditionalItem] = useState(false);
	const [reasonForAdditional, setReasonForAdditional] = useState("");
	const [itemNotes, setItemNotes] = useState("");

	// Queries
	const { data: metadata, isLoading: loadingMeta } = trpc.vanStock.getPlanningMetadata.useQuery();
	const { data: plansData, isLoading: loadingPlans } = trpc.vanStock.listPlans.useQuery({
		limit: 30,
	});

	// Mutations
	const createPlanMutation = trpc.vanStock.createPlan.useMutation({
		onSuccess: (data) => {
			toast.success(
				data.status === "PENDING_PICKING"
					? "Van Stock Plan submitted to Picker queue!"
					: "Van Stock Plan saved as draft!"
			);
			utils.vanStock.listPlans.invalidate();
			utils.vanStock.getPlanningMetadata.invalidate();
			// Reset form
			setSelectedVehicleId("");
			setItems([]);
			setGeneralNotes("");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create plan");
		},
	});

	const selectedVehicle = metadata?.vehicles.find((v: any) => v.id === selectedVehicleId);
	const filteredProducts = (metadata?.products || []).filter(
		(p: any) =>
			p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.sku.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleAddItem = () => {
		if (!selectedProductId) {
			toast.error("Please select a product");
			return;
		}
		if (qtyToAdd <= 0) {
			toast.error("Quantity must be greater than zero");
			return;
		}
		if (isAdditionalItem && !reasonForAdditional.trim()) {
			toast.error("Please provide a reason for additional stock");
			return;
		}

		const prod = metadata?.products.find((p: any) => p.id === selectedProductId);
		if (!prod) return;

		// Check if already in items
		const existingIndex = items.findIndex(
			(i) => i.productId === selectedProductId && i.isAdditional === isAdditionalItem
		);

		if (existingIndex >= 0) {
			const updated = [...items];
			updated[existingIndex].plannedQty += qtyToAdd;
			setItems(updated);
		} else {
			setItems([
				...items,
				{
					productId: prod.id,
					productName: prod.name,
					sku: prod.sku,
					availableStock: prod.availableStock,
					uom: prod.unit || (prod as any).uom || "pcs",
					plannedQty: qtyToAdd,
					isAdditional: isAdditionalItem,
					additionalReason: isAdditionalItem ? reasonForAdditional : undefined,
					notes: itemNotes,
				},
			]);
		}

		// Reset item entry
		setSelectedProductId("");
		setSearchQuery("");
		setQtyToAdd(1);
		setIsAdditionalItem(false);
		setReasonForAdditional("");
		setItemNotes("");
	};

	const handleRemoveItem = (index: number) => {
		setItems(items.filter((_, i) => i !== index));
	};

	const handleUpdateQty = (index: number, newQty: number) => {
		if (newQty <= 0) return;
		const updated = [...items];
		updated[index].plannedQty = newQty;
		setItems(updated);
	};

	const handleSave = (submitForPicking: boolean) => {
		if (!selectedVehicleId) {
			toast.error("Please select a delivery vehicle/van");
			return;
		}
		if (items.length === 0) {
			toast.error("Please add at least one product to the stock plan");
			return;
		}

		createPlanMutation.mutate({
			vehicleId: selectedVehicleId,
			dispatchDate,
			notes: generalNotes,
			submitForPicking,
			items: items.map((item) => ({
				productId: item.productId,
				plannedQty: item.plannedQty,
				isAdditional: item.isAdditional,
				additionalReason: item.additionalReason,
				notes: item.notes,
			})),
		});
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "DRAFT":
				return <Badge variant="outline" className="text-gray-600 border-gray-300">Draft</Badge>;
			case "PENDING_PICKING":
				return <Badge className="bg-amber-500 hover:bg-amber-600">Pending Picking</Badge>;
			case "PICKING_IN_PROGRESS":
				return <Badge className="bg-amber-600 hover:bg-amber-700">Picking</Badge>;
			case "PENDING_PACKING":
				return <Badge className="bg-purple-500 hover:bg-purple-600">Pending Packing</Badge>;
			case "PACKING_IN_PROGRESS":
				return <Badge className="bg-purple-600 hover:bg-purple-700">Packing</Badge>;
			case "PENDING_MANAGER_VERIFICATION":
				return <Badge className="bg-blue-600 hover:bg-blue-700">Awaiting Manager Review</Badge>;
			case "PENDING_LOADING":
				return <Badge className="bg-indigo-600 hover:bg-indigo-700">Ready for Loading</Badge>;
			case "LOADING_IN_PROGRESS":
				return <Badge className="bg-indigo-700 hover:bg-indigo-800">Loading</Badge>;
			case "PENDING_FINAL_DISPATCH_APPROVAL":
				return <Badge className="bg-orange-600 hover:bg-orange-700 animate-pulse">Needs Dispatch Approval</Badge>;
			case "DISPATCHED":
				return <Badge className="bg-emerald-600 hover:bg-emerald-700">Dispatched (On Route)</Badge>;
			case "PENDING_RETURN_VERIFICATION":
				return <Badge className="bg-teal-600 hover:bg-teal-700">Return Awaiting Approval</Badge>;
			case "RECONCILED":
				return <Badge className="bg-gray-800 hover:bg-gray-900">Reconciled / Closed</Badge>;
			case "REJECTED":
				return <Badge variant="destructive">Rejected</Badge>;
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<Truck className="h-6 w-6 text-primary" />
						Van Stock Planning
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Create and manage van stock manifests. Control stock allocation from planning to warehouse picking.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => handleSave(false)}
						disabled={createPlanMutation.isPending || !selectedVehicleId || items.length === 0}
						className="gap-2"
					>
						<Save className="h-4 w-4" />
						Save Draft
					</Button>
					<Button
						onClick={() => handleSave(true)}
						disabled={createPlanMutation.isPending || !selectedVehicleId || items.length === 0}
						className="gap-2 bg-primary hover:bg-primary/90"
					>
						<Send className="h-4 w-4" />
						Submit for Picking
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Form: Vehicle & Planning Details */}
				<div className="space-y-6 lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<Truck className="h-4 w-4 text-primary" />
								1. Select Van & Date
							</CardTitle>
							<CardDescription>
								Choose the delivery vehicle and planned dispatch date.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
									Vehicle / Van *
								</label>
								<Select
									value={selectedVehicleId}
									onValueChange={setSelectedVehicleId}
									disabled={loadingMeta}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select vehicle registration..." />
									</SelectTrigger>
									<SelectContent>
										{metadata?.vehicles.map((v: any) => (
											<SelectItem key={v.id} value={v.id}>
												{v.registrationNumber} ({v.type || "Van"} - Cap: {v.capacityKg || 0} kg)
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{selectedVehicle && (
									<div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs space-y-1 border">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Type:</span>
											<span className="font-medium">{selectedVehicle.type}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Capacity:</span>
											<span className="font-medium">{selectedVehicle.capacityKg} kg</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Vehicle Status:</span>
											<span className="font-semibold capitalize text-emerald-600">
												{selectedVehicle.status}
											</span>
										</div>
									</div>
								)}
							</div>

							<div>
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
									Dispatch Date *
								</label>
								<Input
									type="date"
									value={dispatchDate}
									onChange={(e) => setDispatchDate(e.target.value)}
									className="w-full"
								/>
							</div>

							<div>
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
									General Notes / Instructions
								</label>
								<textarea
									rows={3}
									value={generalNotes}
									onChange={(e) => setGeneralNotes(e.target.value)}
									placeholder="Special route instructions, client priority notes, handling alerts..."
									className="w-full text-xs rounded-md border border-input bg-transparent px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								/>
							</div>
						</CardContent>
					</Card>

					{/* Add Item Card */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<Package className="h-4 w-4 text-primary" />
								2. Add Stock Items
							</CardTitle>
							<CardDescription>
								Search warehouse stock and specify loading quantities.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
									Search Product
								</label>
								<div className="relative mb-2">
									<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
									<Input
										placeholder="Filter by name or SKU..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-8 text-xs"
									/>
								</div>
								<Select
									value={selectedProductId}
									onValueChange={setSelectedProductId}
								>
									<SelectTrigger className="w-full text-xs">
										<SelectValue placeholder="Choose product..." />
									</SelectTrigger>
									<SelectContent className="max-h-56">
										{filteredProducts.map((p: any) => (
											<SelectItem key={p.id} value={p.id} className="text-xs">
												{p.name} [{p.sku}] (Avail: {p.availableStock} {p.unit || p.uom || "pcs"})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
										Quantity *
									</label>
									<Input
										type="number"
										min="1"
										step="any"
										value={qtyToAdd}
										onChange={(e) => setQtyToAdd(parseFloat(e.target.value) || 0)}
										className="text-xs"
									/>
								</div>
								<div className="flex items-end">
									<label className="flex items-center gap-2 cursor-pointer text-xs p-2 rounded border w-full h-9 bg-background">
										<input
											type="checkbox"
											checked={isAdditionalItem}
											onChange={(e) => setIsAdditionalItem(e.target.checked)}
											className="rounded"
										/>
										<span className="font-medium text-amber-700 dark:text-amber-400">
											Extra / Exception
										</span>
									</label>
								</div>
							</div>

							{isAdditionalItem && (
								<div>
									<label className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
										Reason for Additional Stock *
									</label>
									<Input
										placeholder="e.g. Expected ad-hoc customer route order..."
										value={reasonForAdditional}
										onChange={(e) => setReasonForAdditional(e.target.value)}
										className="text-xs border-amber-300 dark:border-amber-800"
									/>
								</div>
							)}

							<div>
								<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
									Item Handling Notes
								</label>
								<Input
									placeholder="Optional notes for picker / packer..."
									value={itemNotes}
									onChange={(e) => setItemNotes(e.target.value)}
									className="text-xs"
								/>
							</div>

							<Button
								type="button"
								variant="secondary"
								onClick={handleAddItem}
								className="w-full text-xs gap-2"
							>
								<Plus className="h-3.5 w-3.5" />
								Add to Plan Manifest
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Right: Manifest Grid */}
				<div className="space-y-6 lg:col-span-2">
					<Card className="h-full flex flex-col">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<div>
								<CardTitle className="text-base flex items-center gap-2">
									<FileText className="h-4 w-4 text-primary" />
									Current Plan Manifest ({items.length} items)
								</CardTitle>
								<CardDescription>
									Review and fine-tune stock quantities before releasing to warehouse picking.
								</CardDescription>
							</div>
							{items.length > 0 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setItems([])}
									className="text-destructive hover:bg-destructive/10 text-xs h-8"
								>
									Clear All
								</Button>
							)}
						</CardHeader>
						<CardContent className="flex-1 flex flex-col justify-between">
							{items.length === 0 ? (
								<div className="flex-1 flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg">
									<Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
									<h3 className="font-semibold text-sm text-foreground">Manifest is empty</h3>
									<p className="text-xs text-muted-foreground max-w-sm mt-1">
										Select a vehicle on the left and start adding products from warehouse inventory.
									</p>
								</div>
							) : (
								<div className="overflow-x-auto border rounded-lg">
									<table className="w-full text-left text-xs">
										<thead className="bg-muted text-muted-foreground font-semibold border-b">
											<tr>
												<th className="p-2.5">Product & SKU</th>
												<th className="p-2.5 text-center">Warehouse Stock</th>
												<th className="p-2.5 text-center">Planned Qty</th>
												<th className="p-2.5">Type & Reason</th>
												<th className="p-2.5 text-center">Action</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											{items.map((item, idx) => (
												<tr key={`${item.productId}-${item.isAdditional}`} className="hover:bg-muted/30">
													<td className="p-2.5">
														<div className="font-medium text-foreground">{item.productName}</div>
														<div className="text-[11px] text-muted-foreground font-mono">
															{item.sku}
														</div>
														{item.notes && (
															<div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
																Note: {item.notes}
															</div>
														)}
													</td>
													<td className="p-2.5 text-center font-mono">
														{item.availableStock} {item.uom}
													</td>
													<td className="p-2.5 text-center">
														<Input
															type="number"
															min="1"
															step="any"
															value={item.plannedQty}
															onChange={(e) =>
																handleUpdateQty(idx, parseFloat(e.target.value) || 0)
															}
															className="w-20 text-center h-7 text-xs mx-auto font-semibold"
														/>
													</td>
													<td className="p-2.5">
														{item.isAdditional ? (
															<div>
																<Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 text-[10px]">
																	Extra Item
																</Badge>
																<div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 italic">
																	"{item.additionalReason}"
																</div>
															</div>
														) : (
															<Badge variant="outline" className="text-[10px]">
																Standard Stock
															</Badge>
														)}
													</td>
													<td className="p-2.5 text-center">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleRemoveItem(idx)}
															className="h-7 w-7 text-muted-foreground hover:text-destructive"
														>
															<Trash2 className="h-3.5 w-3.5" />
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							<div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
								<div>
									Total distinct items: <span className="font-bold text-foreground">{items.length}</span>
								</div>
								<div>
									Total units:{" "}
									<span className="font-bold text-foreground">
										{items.reduce((sum, i) => sum + i.plannedQty, 0)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Plans History / Active Plans Table */}
			<Card className="mt-8">
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<Clock className="h-4 w-4 text-primary" />
						Recent Van Stock Plans
					</CardTitle>
					<CardDescription>
						All stock plans created across your branch and their current progression status.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loadingPlans ? (
						<div className="py-8 text-center text-xs text-muted-foreground">Loading plans...</div>
					) : plansData?.items?.length === 0 ? (
						<div className="py-8 text-center text-xs text-muted-foreground">
							No stock plans created yet.
						</div>
					) : (
						<div className="overflow-x-auto border rounded-lg">
							<table className="w-full text-left text-xs">
								<thead className="bg-muted text-muted-foreground font-semibold border-b">
									<tr>
										<th className="p-2.5">Plan Reference</th>
										<th className="p-2.5">Vehicle</th>
										<th className="p-2.5">Driver</th>
										<th className="p-2.5">Dispatch Date</th>
										<th className="p-2.5 text-center">Items</th>
										<th className="p-2.5 text-center">Status</th>
										<th className="p-2.5">Created At</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{plansData?.items?.map((plan: any) => (
										<tr key={plan.id} className="hover:bg-muted/30">
											<td className="p-2.5 font-mono font-medium text-foreground">
												{plan.planNumber}
												<div className="text-[10px] text-muted-foreground">
													Rev: {plan.revision}
												</div>
											</td>
											<td className="p-2.5">
												<div className="font-medium text-foreground">
													{plan.vehicle?.registrationNumber || "Unassigned"}
												</div>
												<div className="text-[10px] text-muted-foreground">
													{plan.vehicle?.type}
												</div>
											</td>
											<td className="p-2.5">
												{plan.driver?.name || (
													<span className="text-muted-foreground italic">Pending assignment</span>
												)}
											</td>
											<td className="p-2.5 font-medium">{plan.dispatchDate}</td>
											<td className="p-2.5 text-center font-mono font-medium">
												{plan.items?.length || 0}
											</td>
											<td className="p-2.5 text-center">
												{getStatusBadge(plan.status)}
											</td>
											<td className="p-2.5 text-muted-foreground">
												{new Date(plan.createdAt).toLocaleString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
