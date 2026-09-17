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
	CheckCircle2Icon,
	ChevronRightIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	TruckIcon,
	XIcon,
	ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PurchaseOrdersPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: pos, isLoading: posLoading } =
		trpc.warehouse.getReceivingPOs.useQuery();
	const { data: suppliersList } = trpc.suppliers.list.useQuery();
	const { data: invData } = trpc.inventory.list.useQuery({ limit: 100 });

	// Mutations
	const createPOMutation = trpc.purchases.create.useMutation({
		onSuccess: () => {
			toast.success("Purchase Order successfully created & sent to warehouse!");
			utils.warehouse.getReceivingPOs.invalidate();
			setIsCreateModalOpen(false);
			setSelectedSupplier("");
			setOrderItems([{ productId: "", quantity: 1, price: 10 }]);
		},
		onError: (err) => {
			toast.error(`PO creation failed: ${err.message}`);
		},
	});

	// Modal State
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [selectedSupplier, setSelectedSupplier] = useState("");
	const [orderItems, setOrderItems] = useState<
		Array<{ productId: string; quantity: number; price: number }>
	>([{ productId: "", quantity: 1, price: 10 }]);

	// Fast Type-To-Add State
	const [quickProductSearch, setQuickProductSearch] = useState("");
	const [quickQuantity, setQuickQuantity] = useState(1);
	const [quickPrice, setQuickPrice] = useState(10);
	const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);

	const matchedProducts =
		invData?.items?.filter(
			(i: any) =>
				i.product.toLowerCase().includes(quickProductSearch.toLowerCase()) ||
				i.sku.toLowerCase().includes(quickProductSearch.toLowerCase()),
		) || [];

	const handleQuickAddProduct = (product: any) => {
		const unitCost = Number(
			product.base_procurement_price || product.procurement_price || product.price || 10,
		);
		const existingIdx = orderItems.findIndex(
			(i) => i.productId === product.id.toString(),
		);

		if (existingIdx >= 0) {
			const updated = [...orderItems];
			updated[existingIdx].quantity += quickQuantity || 1;
			setOrderItems(updated);
		} else {
			if (orderItems.length === 1 && !orderItems[0].productId) {
				setOrderItems([
					{
						productId: product.id.toString(),
						quantity: quickQuantity || 1,
						price: unitCost,
					},
				]);
			} else {
				setOrderItems([
					...orderItems,
					{
						productId: product.id.toString(),
						quantity: quickQuantity || 1,
						price: unitCost,
					},
				]);
			}
		}
		setQuickProductSearch("");
		setShowQuickSuggestions(false);
		toast.success(`Added ${product.product} to PO lines!`);
	};

	// PO Detail View Modal
	const [selectedPO, setSelectedPO] = useState<any>(null);
	const [poDetailsList, setPoDetailsList] = useState<any[]>([]);
	const [loadingDetails, setLoadingItems] = useState(false);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

	const openDetailsModal = async (po: any) => {
		setSelectedPO(po);
		setIsDetailModalOpen(true);
		setLoadingItems(true);
		try {
			const items = await utils.client.warehouse.getPurchaseItems.query({
				purchaseId: po.id,
			});
			setPoDetailsList(items);
		} catch (e) {
			toast.error("Failed to load PO lines");
		} finally {
			setLoadingItems(false);
		}
	};

	const addLineItem = () => {
		setOrderItems([...orderItems, { productId: "", quantity: 1, price: 10 }]);
	};

	const removeLineItem = (idx: number) => {
		const updated = [...orderItems];
		updated.splice(idx, 1);
		setOrderItems(updated);
	};

	const updateLineItem = (idx: number, field: string, val: any) => {
		const updated = [...orderItems];
		updated[idx] = {
			...updated[idx],
			[field]: val,
		};
		setOrderItems(updated);
	};

	// Calculate totals
	const totalAmount = orderItems.reduce(
		(acc, curr) => acc + curr.quantity * curr.price,
		0,
	);

	const handleCreatePO = async () => {
		if (!selectedSupplier) {
			toast.error("Please select a supplier.");
			return;
		}
		if (orderItems.some((i) => !i.productId)) {
			toast.error("Please select a product for all line items.");
			return;
		}

		await createPOMutation.mutateAsync({
			supplierId: selectedSupplier,
			total: totalAmount,
			items: orderItems,
		});
	};

	const filteredPOs =
		pos?.filter(
			(po) =>
				po.grn_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				po.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()),
		) || [];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Purchase Orders Ledger
					</h2>
					<p className="text-muted-foreground text-sm">
						Overview procurement purchase orders, create new reorder batches,
						and track inbound deliveries.
					</p>
				</div>
				<div className="flex w-full gap-2 sm:w-auto">
					<Button
						onClick={() => setIsCreateModalOpen(true)}
						className="h-9 font-bold text-xs shadow-sm"
					>
						<PlusIcon className="mr-1.5 h-4 w-4" /> Create Purchase Order
					</Button>
					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search PO number, supplier..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">Purchase Orders</CardTitle>
					<CardDescription>
						Track status, delivery schedules, and outstanding balances of active
						procurement lots
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{posLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>PO Reference</TableHead>
										<TableHead>Supplier Partner</TableHead>
										<TableHead>Date Issued</TableHead>
										<TableHead>Total Cost</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPOs.map((po) => (
										<TableRow
											key={po.id}
											className="cursor-pointer hover:bg-slate-50/50"
											onClick={() => openDetailsModal(po)}
										>
											<TableCell className="font-bold text-xs">
												PO-#{po.id} — {po.grn_number || "Draft"}
											</TableCell>
											<TableCell className="font-semibold text-slate-800 dark:text-slate-100">
												{po.supplier_name}
											</TableCell>
											<TableCell className="text-slate-500 text-xs">
												{new Date(po.created_at).toLocaleDateString()}
											</TableCell>
											<TableCell className="font-bold text-xs">
												₹{Number(po.total_amount).toFixed(2)}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														po.status === "received" ||
														po.status === "completed"
															? "default"
															: "outline"
													}
													className={
														po.status === "pending"
															? "border-amber-200 bg-amber-50 text-amber-700"
															: ""
													}
												>
													{po.status}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="ghost"
													className="h-8 text-xs"
												>
													View Items{" "}
													<ChevronRightIcon className="ml-1 h-3.5 w-3.5" />
												</Button>
											</TableCell>
										</TableRow>
									))}
									{filteredPOs.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-12 text-center text-muted-foreground"
											>
												<TruckIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													No purchase orders registered.
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

			{/* CREATE PO MODAL DIALOG */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Create Purchase Order (PO)
						</DialogTitle>
						<DialogDescription>
							Submit contract order request directly to supplier. Triggers
							inbound GRN routing on save.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Select Supplier Partner
							</Label>
							<select
								className="mt-1 w-full cursor-pointer rounded border bg-white p-2 font-bold text-xs"
								value={selectedSupplier}
								onChange={(e) => setSelectedSupplier(e.target.value)}
							>
								<option value="">Choose Supplier</option>
								{suppliersList?.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name} (Code: {s.supplier_code})
									</option>
								))}
							</select>
						</div>

						{/* Fast Item Quick-Add Bar */}
						<div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
							<div className="mb-1.5 flex items-center justify-between">
								<Label className="flex items-center gap-1.5 font-bold text-blue-950 text-xs dark:text-blue-200">
									<ZapIcon className="h-3.5 w-3.5 text-amber-500" />
									Fast Item Quick-Add (Type Name or SKU)
								</Label>
								<span className="font-medium text-[10px] text-blue-700 dark:text-blue-300">
									Type & press Enter or Add
								</span>
							</div>
							<div className="relative flex flex-col gap-2 sm:flex-row">
								<div className="relative flex-1">
									<Input
										placeholder="Type material name or SKU to quick-add..."
										value={quickProductSearch}
										onChange={(e) => {
											setQuickProductSearch(e.target.value);
											setShowQuickSuggestions(true);
										}}
										onFocus={() => setShowQuickSuggestions(true)}
										className="h-8.5 bg-white font-semibold text-xs shadow-xs dark:bg-slate-900"
										onKeyDown={(e) => {
											if (e.key === "Enter" && matchedProducts.length > 0) {
												e.preventDefault();
												handleQuickAddProduct(matchedProducts[0]);
											}
										}}
									/>
									{showQuickSuggestions &&
										quickProductSearch.trim() &&
										matchedProducts.length > 0 && (
											<div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white p-1 shadow-xl dark:bg-slate-900">
												{matchedProducts.slice(0, 6).map((prod: any) => (
													<div
														key={prod.id}
														onMouseDown={() => handleQuickAddProduct(prod)}
														className="flex cursor-pointer items-center justify-between rounded-md p-2 text-xs hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800"
													>
														<div>
															<span className="font-bold text-slate-900 dark:text-slate-100">
																{prod.product}
															</span>
															<span className="ml-2 font-mono text-[11px] text-slate-500">
																SKU: {prod.sku}
															</span>
														</div>
														<div className="text-right">
															<span className="font-bold text-emerald-600">
																₹
																{Number(
																	prod.base_procurement_price ||
																		prod.procurement_price ||
																		prod.price ||
																		10,
																).toFixed(2)}
															</span>
															<span className="ml-1 text-[10px] text-muted-foreground">
																({prod.qty_on_hand || 0} in stock)
															</span>
														</div>
													</div>
												))}
											</div>
										)}
								</div>
								<div className="flex gap-2">
									<Input
										type="number"
										min="1"
										placeholder="Qty"
										value={quickQuantity}
										onChange={(e) =>
											setQuickQuantity(Number.parseInt(e.target.value) || 1)
										}
										className="h-8.5 w-20 bg-white font-bold text-xs dark:bg-slate-900"
									/>
									<Button
										type="button"
										size="sm"
										onClick={() => {
											if (matchedProducts.length > 0) {
												handleQuickAddProduct(matchedProducts[0]);
											} else {
												toast.error("Type a product name or SKU to quick-add.");
											}
										}}
										className="h-8.5 bg-blue-600 px-3 font-bold text-white text-xs shadow-xs hover:bg-blue-700"
									>
										<PlusIcon className="mr-1 h-3.5 w-3.5" /> + Quick Add
									</Button>
								</div>
							</div>
						</div>

						{/* Dynamic Items list */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="font-bold text-slate-700 text-xs">
									Order Line Items ({orderItems.length})
								</Label>
								<Button
									size="sm"
									variant="outline"
									onClick={addLineItem}
									className="h-7 text-xs"
								>
									<PlusIcon className="mr-1 h-3 w-3" /> Add Item Line
								</Button>
							</div>

							<div className="max-h-48 space-y-2 overflow-y-auto">
								{orderItems.map((item, idx) => (
									<div
										key={idx}
										className="relative flex items-center gap-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-900/40"
									>
										<div className="flex-1">
											<select
												className="w-full cursor-pointer rounded border bg-white p-1.5 font-bold text-xs dark:bg-slate-900"
												value={item.productId}
												onChange={(e) => {
													const selectedId = e.target.value;
													const selectedProd = invData?.items?.find(
														(i: any) => i.id.toString() === selectedId,
													);
													updateLineItem(idx, "productId", selectedId);
													if (selectedProd && !item.price) {
														updateLineItem(
															idx,
															"price",
															Number(
																selectedProd.base_procurement_price ||
																	selectedProd.price ||
																	10,
															),
														);
													}
												}}
											>
												<option value="">Choose Material</option>
												{invData?.items?.map((i: any) => (
													<option key={i.id} value={i.id}>
														{i.product} (SKU: {i.sku}) — Stock: {i.qty_on_hand}
													</option>
												))}
											</select>
										</div>
										<div className="w-20">
											<Input
												type="number"
												placeholder="Qty"
												min="1"
												value={item.quantity}
												onChange={(e) =>
													updateLineItem(
														idx,
														"quantity",
														Number.parseInt(e.target.value) || 0,
													)
												}
												className="h-8 font-bold text-xs"
											/>
										</div>
										<div className="w-24">
											<Input
												type="number"
												placeholder="Cost"
												min="0"
												value={item.price}
												onChange={(e) =>
													updateLineItem(
														idx,
														"price",
														Number.parseFloat(e.target.value) || 0,
													)
												}
												className="h-8 font-bold text-xs"
											/>
										</div>
										<Button
											size="icon"
											variant="ghost"
											className="h-8 w-8 text-red-500 hover:text-red-700"
											onClick={() => removeLineItem(idx)}
											disabled={orderItems.length === 1}
										>
											<XIcon className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</div>

						{/* Real-time calculated totals */}
						<div className="flex items-center justify-between border-t pt-4 font-bold text-sm">
							<span>Estimated Order Volume:</span>
							<span className="text-blue-600">
								₹
								{totalAmount.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsCreateModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleCreatePO}
							disabled={createPOMutation.isPending}
						>
							{createPOMutation.isPending
								? "Creating..."
								: "Issue Purchase Order"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* PO DETAIL DRAWER */}
			<Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
				<DialogContent className="max-w-xl bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Purchase Order Items — PO-#{selectedPO?.id}
						</DialogTitle>
						<DialogDescription className="text-xs">
							Supplier Company: {selectedPO?.supplier_name}
						</DialogDescription>
					</DialogHeader>

					{loadingDetails ? (
						<div className="flex justify-center py-8">
							<Loader2Icon className="h-6 w-6 animate-spin" />
						</div>
					) : (
						<div className="my-2 max-h-60 space-y-4 overflow-y-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product Line Item</TableHead>
										<TableHead>Ordered Quantity</TableHead>
										<TableHead>Unit Cost</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{poDetailsList.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-bold text-xs">
												{item.product_name}
											</TableCell>
											<TableCell className="font-semibold text-xs">
												{item.quantity} units
											</TableCell>
											<TableCell className="font-semibold text-xs">
												₹{Number(item.price).toFixed(2)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}

					<DialogFooter>
						<Button size="sm" onClick={() => setIsDetailModalOpen(false)}>
							Close Order Details
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
