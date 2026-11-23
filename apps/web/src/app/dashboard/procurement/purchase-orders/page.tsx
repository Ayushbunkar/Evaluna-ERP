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
	AlertTriangleIcon,
	CheckCircle2Icon,
	ChevronLeftIcon,
	ChevronRightIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	SparklesIcon,
	TruckIcon,
	XIcon,
	ZapIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PurchaseOrdersPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: pos, isLoading: posLoading } =
		trpc.warehouse.getReceivingPOs.useQuery({ includeAll: true });
	const { data: suppliersList } = trpc.suppliers.list.useQuery();
	const { data: invData } = trpc.inventory.list.useQuery({ limit: 500 });

	// Compute Low Stock & Out of Stock Items for Quick Reordering
	const lowStockItems = useMemo(() => {
		if (!invData?.items) return [];
		return invData.items
			.filter(
				(i: any) =>
					(i.qty_on_hand ?? 0) <= (i.reorder_level ?? 10) ||
					i.status === "low_stock" ||
					i.status === "out_of_stock",
			)
			.sort((a: any, b: any) => (a.qty_on_hand ?? 0) - (b.qty_on_hand ?? 0));
	}, [invData?.items]);

	const outOfStockCount = useMemo(() => {
		return lowStockItems.filter((i: any) => (i.qty_on_hand ?? 0) <= 0).length;
	}, [lowStockItems]);

	const belowReorderCount = useMemo(() => {
		return lowStockItems.filter((i: any) => (i.qty_on_hand ?? 0) > 0).length;
	}, [lowStockItems]);

	// Mutations
	const createPOMutation = trpc.procurement.createPO.useMutation({
		onSuccess: () => {
			toast.success(
				"Purchase Order created & sent to Finance for verification!",
			);
			utils.warehouse.getReceivingPOs.invalidate();
			utils.procurement.listPOs.invalidate();
			utils.finance.listPurchases.invalidate();
			utils.finance.getDashboardStats.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			setIsCreateModalOpen(false);
			setSelectedSupplier("");
			setOrderItems([{ productId: "", quantity: 1, price: 10 }]);
		},
		onError: (err) => {
			toast.error(`PO creation failed: ${err.message}`);
		},
	});

	// Order Line Item Interface
	interface OrderItemLine {
		productId: string;
		quantity: number;
		price: number;
		isNewProduct?: boolean;
		newProductName?: string;
		newProductSku?: string;
		newProductCategory?: string;
		newProductUnit?: string;
		newProductSellingPrice?: number;
	}

	// Modal State
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [selectedSupplier, setSelectedSupplier] = useState("");
	const [orderItems, setOrderItems] = useState<OrderItemLine[]>([
		{ productId: "", quantity: 1, price: 10 },
	]);

	// Fast Type-To-Add State
	const [quickProductSearch, setQuickProductSearch] = useState("");
	const [quickQuantity, setQuickQuantity] = useState(1);
	const [quickPrice, setQuickPrice] = useState(10);
	const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);

	const matchedProducts =
		quickProductSearch.trim() && invData?.items
			? invData.items.filter(
					(i: any) =>
						(i.product &&
							i.product
								.toLowerCase()
								.includes(quickProductSearch.trim().toLowerCase())) ||
						(i.sku &&
							i.sku
								.toLowerCase()
								.includes(quickProductSearch.trim().toLowerCase())),
				)
			: [];

	const handleQuickAddProduct = (product: any) => {
		const targetProductId = (product.productId || product.id).toString();
		const unitCost = Number(
			product.base_procurement_price ||
				product.procurement_price ||
				product.price ||
				10,
		);
		const existingIdx = orderItems.findIndex(
			(i) => i.productId === targetProductId,
		);

		if (existingIdx >= 0) {
			const updated = [...orderItems];
			updated[existingIdx].quantity += quickQuantity || 1;
			setOrderItems(updated);
		} else {
			if (
				orderItems.length === 1 &&
				!orderItems[0].productId &&
				!orderItems[0].isNewProduct
			) {
				setOrderItems([
					{
						productId: targetProductId,
						quantity: quickQuantity || 1,
						price: unitCost,
					},
				]);
			} else {
				setOrderItems([
					...orderItems,
					{
						productId: targetProductId,
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

	const addNewProductLineItem = (initialName = "") => {
		const defaultCost = 10;
		const newItem: OrderItemLine = {
			productId: "",
			isNewProduct: true,
			newProductName: initialName,
			newProductCategory: "General",
			newProductUnit: "pcs",
			newProductSellingPrice: Math.round(defaultCost * 1.25 * 100) / 100,
			quantity: quickQuantity || 1,
			price: defaultCost,
		};
		if (
			orderItems.length === 1 &&
			!orderItems[0].productId &&
			!orderItems[0].isNewProduct
		) {
			setOrderItems([newItem]);
		} else {
			setOrderItems([...orderItems, newItem]);
		}
		if (initialName) {
			setQuickProductSearch("");
			setShowQuickSuggestions(false);
			toast.success(
				`Added "${initialName}" as new product to PO lines! Complete details below.`,
			);
		}
	};

	const handleAddNewProductQuick = (name: string) => {
		const trimmed = name.trim();
		if (!trimmed) {
			toast.error("Please enter a product name.");
			return;
		}
		addNewProductLineItem(trimmed);
	};

	const handleAddLowStockItem = (item: any) => {
		const targetId = (item.productId || item.id).toString();
		const neededQty = Math.max(
			1,
			(item.reorder_level ?? 10) - (item.qty_on_hand ?? 0),
		);
		const unitCost = Number(
			item.base_procurement_price ||
				item.procurement_price ||
				item.costPrice ||
				item.price ||
				10,
		);

		const existingIdx = orderItems.findIndex(
			(i) => i.productId === targetId,
		);

		if (existingIdx >= 0) {
			toast.info(`${item.product} is already in the PO line items.`);
			return;
		}

		if (orderItems.length === 1 && !orderItems[0].productId) {
			setOrderItems([
				{
					productId: targetId,
					quantity: neededQty,
					price: unitCost,
				},
			]);
		} else {
			setOrderItems([
				...orderItems,
				{
					productId: targetId,
					quantity: neededQty,
					price: unitCost,
				},
			]);
		}
		toast.success(`Added ${item.product} (Qty: ${neededQty}) to PO lines!`);
	};

	const handleAddAllLowStock = () => {
		if (lowStockItems.length === 0) {
			toast.info("No low stock items found.");
			return;
		}

		const newItems = [...orderItems.filter((i) => i.productId)];
		let addedCount = 0;

		for (const item of lowStockItems) {
			const targetId = (item.productId || item.id).toString();
			const neededQty = Math.max(
				1,
				(item.reorder_level ?? 10) - (item.qty_on_hand ?? 0),
			);
			const unitCost = Number(
				item.base_procurement_price ||
					item.procurement_price ||
					item.costPrice ||
					item.price ||
					10,
			);

			if (!newItems.some((i) => i.productId === targetId)) {
				newItems.push({
					productId: targetId,
					quantity: neededQty,
					price: unitCost,
				});
				addedCount++;
			}
		}

		if (addedCount > 0) {
			setOrderItems(newItems);
			toast.success(
				`Added ${addedCount} critical low-stock items to PO lines!`,
			);
		} else {
			toast.info("All low stock items are already in your PO lines.");
		}
	};

	const lowStockScrollRef = useRef<HTMLDivElement>(null);
	const scrollLowStock = (direction: "left" | "right") => {
		if (lowStockScrollRef.current) {
			const offset = direction === "left" ? -300 : 300;
			lowStockScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
		}
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
		setOrderItems([
			...orderItems,
			{ productId: "", quantity: 1, price: 10, isNewProduct: false },
		]);
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
		(acc, curr) => acc + (curr.quantity || 0) * (curr.price || 0),
		0,
	);

	const handleCreatePO = async () => {
		if (!selectedSupplier) {
			toast.error("Please select a supplier partner.");
			return;
		}
		if (
			orderItems.some(
				(i) =>
					(!i.isNewProduct && !i.productId) ||
					(i.isNewProduct && !i.newProductName?.trim()),
			)
		) {
			toast.error(
				"Please select an existing product or enter a name for all new items.",
			);
			return;
		}
		if (orderItems.some((i) => (i.quantity || 0) <= 0)) {
			toast.error("Quantity must be greater than 0 for all order lines.");
			return;
		}

		await createPOMutation.mutateAsync({
			supplierId: Number.parseInt(selectedSupplier, 10),
			items: orderItems.map((i) => ({
				productId: i.productId ? Number.parseInt(i.productId, 10) : undefined,
				isNewProduct: i.isNewProduct,
				newProductName: i.newProductName?.trim(),
				newProductCategory: i.newProductCategory?.trim(),
				newProductUnit: i.newProductUnit?.trim(),
				newProductSellingPrice: i.newProductSellingPrice
					? Number(i.newProductSellingPrice)
					: undefined,
				quantity: i.quantity,
				price: i.price,
			})),
		});
	};

	const filteredPOs =
		pos?.filter(
			(po: any) =>
				po.grn_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				po.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()),
		) || [];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
						Purchase Orders Ledger
					</h1>
					<p className="text-muted-foreground text-sm">
						Issue supplier purchase orders, track scheduled deliveries, and coordinate with warehouse receiving.
					</p>
				</div>
				<div className="flex w-full gap-2 sm:w-auto">
					<Button
						onClick={() => setIsCreateModalOpen(true)}
						className="h-9 bg-primary font-bold text-primary-foreground text-xs shadow-sm hover:bg-primary/90"
					>
						<PlusIcon className="mr-1.5 h-4 w-4" /> Create Purchase Order
					</Button>
					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search PO number, supplier..."
							className="pl-9 bg-background/50 border-border/80"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Top Low Stock & Inventory Replenishment Alert Banner */}
			{lowStockItems.length > 0 && (
				<div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent p-4 shadow-xs backdrop-blur-md dark:border-amber-500/20">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
								<AlertTriangleIcon className="h-5 w-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="font-bold text-sm text-foreground">
										Low Stock & Reorder Alerts ({lowStockItems.length} Products Need Replenishing)
									</h3>
									<Badge className="bg-rose-500 text-white font-black text-[10px] px-1.5 py-0">
										Urgent
									</Badge>
								</div>
								<p className="text-muted-foreground text-xs mt-0.5">
									Products below warehouse safety thresholds. Review current stock counts and initiate a PO.
								</p>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2 shrink-0">
							<div className="flex items-center gap-3 bg-background/80 px-3 py-1.5 rounded-lg border border-border/80 text-xs">
								<div>
									<span className="text-[10px] text-muted-foreground block font-medium">Out of Stock</span>
									<span className="font-black text-rose-600 text-sm">{outOfStockCount} items</span>
								</div>
								<div className="h-6 w-px bg-border" />
								<div>
									<span className="text-[10px] text-muted-foreground block font-medium">Low Stock</span>
									<span className="font-black text-amber-600 text-sm">{belowReorderCount} items</span>
								</div>
							</div>

							<Button
								size="sm"
								onClick={() => {
									handleAddAllLowStock();
									setIsCreateModalOpen(true);
								}}
								className="h-8 bg-rose-600 hover:bg-rose-700 font-bold text-white text-xs shadow-xs"
							>
								<PlusIcon className="mr-1.5 h-3.5 w-3.5" /> Reorder All Critical Items ({lowStockItems.length})
							</Button>
						</div>
					</div>

					{/* Quick Item Previews with Exact Stock Numbers */}
					<div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
						{lowStockItems.slice(0, 10).map((item: any) => {
							const currentQty = item.qty_on_hand ?? 0;
							const minThreshold = item.reorder_level ?? 10;
							const deficit = Math.max(1, minThreshold - currentQty);

							return (
								<div
									key={item.productId || item.id}
									onClick={() => {
										handleAddLowStockItem(item);
										setIsCreateModalOpen(true);
									}}
									className="group cursor-pointer flex shrink-0 items-center gap-2 rounded-lg border border-border/70 bg-background/90 px-3 py-1.5 text-xs shadow-2xs hover:border-rose-400 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-all"
								>
									<span className={`h-2 w-2 rounded-full shrink-0 ${currentQty === 0 ? "bg-rose-500 animate-ping" : "bg-amber-500"}`} />
									<div>
										<p className="font-bold text-foreground text-xs leading-none truncate max-w-[150px] group-hover:text-rose-600 transition-colors">
											{item.product}
										</p>
										<p className="text-[10px] text-muted-foreground mt-0.5">
											Stock: <span className={`font-black ${currentQty === 0 ? "text-rose-600" : "text-amber-600"}`}>{currentQty}</span> / Min: {minThreshold}
											<span className="ml-1 text-blue-600 font-bold">(+{deficit})</span>
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
				<CardHeader className="border-border/60 border-b">
					<CardTitle className="font-bold text-base text-foreground">Purchase Orders</CardTitle>
					<CardDescription className="text-muted-foreground text-xs">
						Active procurement contracts, supplier fulfillment status, and order values
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
									<TableRow className="border-border/60 bg-muted/30">
										<TableHead className="font-semibold text-muted-foreground text-xs">PO Reference</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs">Supplier Partner</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs">Date Issued</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs">Total Cost</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs">Status</TableHead>
										<TableHead className="text-right font-semibold text-muted-foreground text-xs">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPOs.map((po: any) => (
										<TableRow
											key={po.id}
											className="cursor-pointer border-border/40 hover:bg-muted/40 transition-colors"
											onClick={() => openDetailsModal(po)}
										>
											<TableCell className="font-bold font-mono text-xs text-foreground">
												{po.po_number || `PO-#${po.id}`} — {po.grn_number || "Draft"}
											</TableCell>
											<TableCell className="font-semibold text-foreground text-xs">
												{po.supplier_name}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{new Date(po.created_at).toLocaleDateString()}
											</TableCell>
											<TableCell className="font-bold text-foreground text-xs">
												₹{Number(po.total_amount).toFixed(2)}
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className={
														po.status === "received" || po.status === "completed"
															? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]"
															: po.status === "issued" || po.status === "approved"
																? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]"
																: po.status === "rejected"
																	? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium text-[10px]"
																	: po.status === "ordered" || po.status === "confirmed"
																		? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-[10px]"
																		: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-[10px]"
													}
												>
													{po.status === "pending_finance" || po.status === "pending" || po.status === "pending_approval"
														? "Pending Finance Approval"
														: po.status === "issued" || po.status === "approved"
															? "Approved & Issued"
															: po.status === "rejected"
																? "Rejected by Finance"
																: po.status}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="ghost"
													className="h-8 text-xs font-semibold hover:bg-muted"
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
				<DialogContent className="flex flex-col max-h-[90vh] w-[95vw] max-w-2xl min-w-0 overflow-hidden p-0 border-border bg-white dark:bg-slate-900 gap-0 sm:max-w-2xl">
					<DialogHeader className="p-4 sm:p-5 pb-2.5 border-b border-border/50 shrink-0 text-left">
						<DialogTitle className="font-bold text-base sm:text-lg">
							Create Purchase Order (PO)
						</DialogTitle>
						<DialogDescription className="text-xs">
							Submit contract order request directly to supplier. Triggers inbound GRN routing on save.
						</DialogDescription>
					</DialogHeader>

					{/* SCROLLING BODY - VERTICAL ONLY, NEVER HORIZONTAL */}
					<div
						className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-3 w-full min-w-0 max-w-full"
						style={{ maxWidth: "100%", width: "100%" }}
					>
						{/* URGENT LOW STOCK ALERT & REORDER SUGGESTIONS (UPAR) - ONLY THIS BOX SCROLLS HORIZONTALLY */}
						{lowStockItems.length > 0 && (
							<div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/5 p-2.5 shadow-xs dark:border-rose-500/20 dark:bg-rose-950/20">
								<div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-rose-200/60 dark:border-rose-900/40 min-w-0">
									<div className="flex items-center gap-1.5 min-w-0">
										<div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white font-bold text-xs shrink-0">
											<AlertTriangleIcon className="h-3 w-3" />
										</div>
										<div className="min-w-0">
											<h4 className="font-bold text-xs text-rose-900 dark:text-rose-200 truncate">
												Urgent Low Stock Items ({lowStockItems.length} Products Need Reordering)
											</h4>
											<div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
												{outOfStockCount > 0 && (
													<span className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
														<AlertCircleIcon className="h-3 w-3" />
														{outOfStockCount} Out of Stock
													</span>
												)}
												{belowReorderCount > 0 && (
													<span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
														<AlertTriangleIcon className="h-3 w-3" />
														{belowReorderCount} Below Min
													</span>
												)}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										<div className="flex items-center gap-0.5 bg-white/90 dark:bg-slate-900/90 rounded-md p-0.5 border border-rose-200 dark:border-rose-900 shadow-xs">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => scrollLowStock("left")}
												className="h-6 w-6 text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950"
												title="Scroll Left"
											>
												<ChevronLeftIcon className="h-3.5 w-3.5" />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => scrollLowStock("right")}
												className="h-6 w-6 text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950"
												title="Scroll Right"
											>
												<ChevronRightIcon className="h-3.5 w-3.5" />
											</Button>
										</div>
										<Button
											type="button"
											size="sm"
											onClick={handleAddAllLowStock}
											className="h-6.5 bg-rose-600 hover:bg-rose-700 text-white text-[10.5px] font-bold px-2 shadow-xs shrink-0"
										>
											<PlusIcon className="mr-1 h-3 w-3" /> Add All ({lowStockItems.length})
										</Button>
									</div>
								</div>

								{/* Scrollable Low Stock Item Cards With Exact Stock Numbers */}
								<div className="w-full min-w-0 max-w-full overflow-hidden">
									<div
										ref={lowStockScrollRef}
										className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1 scrollbar-thin scroll-smooth w-full min-w-0"
										style={{
											maxWidth: "100%",
											WebkitOverflowScrolling: "touch",
											overscrollBehaviorX: "contain",
										}}
									>
										{lowStockItems.map((item: any) => {
											const targetId = (item.productId || item.id).toString();
											const isAlreadyInPO = orderItems.some(
												(oi) => oi.productId === targetId,
											);
											const currentQty = item.qty_on_hand ?? 0;
											const minThreshold = item.reorder_level ?? 10;
											const deficit = Math.max(1, minThreshold - currentQty);

											return (
												<div
													key={targetId}
													className={`flex-shrink-0 w-48 sm:w-52 rounded-lg border p-2 transition-all text-xs flex flex-col justify-between ${
														isAlreadyInPO
															? "bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-950/20"
															: currentQty === 0
																? "bg-white border-rose-300 shadow-xs dark:bg-slate-900 dark:border-rose-900/60"
																: "bg-white border-amber-300 shadow-xs dark:bg-slate-900 dark:border-amber-900/60"
													}`}
												>
													<div>
														<div className="flex items-start justify-between gap-1 mb-1">
															<span
																className="font-bold text-foreground truncate block leading-tight text-xs"
																title={item.product}
															>
																{item.product}
															</span>
															<Badge
																variant="outline"
																className={`text-[9px] px-1 py-0 font-extrabold uppercase shrink-0 ${
																	currentQty === 0
																		? "bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-400"
																		: "bg-amber-500/15 text-amber-800 border-amber-300 dark:text-amber-400"
																}`}
															>
																{currentQty === 0 ? "0 Stock" : `Low: ${currentQty}`}
															</Badge>
														</div>

														{/* Exact Numbers Display Box */}
														<div className="bg-slate-100/90 dark:bg-slate-800/80 rounded px-1.5 py-1 mb-1.5 font-mono text-[10px] space-y-0.5">
															<div className="flex justify-between items-center">
																<span className="text-muted-foreground">
																	Current Stock:
																</span>
																<span
																	className={`font-black ${currentQty === 0 ? "text-rose-600" : "text-amber-600"}`}
																>
																	{currentQty} {item.unit || "units"}
																</span>
															</div>
															<div className="flex justify-between items-center">
																<span className="text-muted-foreground">
																	Min Threshold:
																</span>
																<span className="font-semibold text-slate-700 dark:text-slate-300">
																	{minThreshold} {item.unit || "units"}
																</span>
															</div>
															<div className="flex justify-between items-center pt-0.5 border-t border-slate-200 dark:border-slate-700">
																<span className="text-muted-foreground font-semibold">
																	Deficit to Order:
																</span>
																<span className="font-black text-blue-600 dark:text-blue-400">
																	+{deficit} {item.unit || "units"}
																</span>
															</div>
														</div>
													</div>

													{/* Action Button */}
													<Button
														type="button"
														size="sm"
														disabled={isAlreadyInPO}
														onClick={() => handleAddLowStockItem(item)}
														className={`w-full h-6 text-[10.5px] font-bold ${
															isAlreadyInPO
																? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 cursor-default"
																: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
														}`}
													>
														{isAlreadyInPO ? (
															<>
																<CheckCircle2Icon className="mr-1 h-3 w-3 text-emerald-600" />{" "}
																In PO Lines
															</>
														) : (
															<>
																<PlusIcon className="mr-1 h-3 w-3" /> + Add to PO
																(+{deficit})
															</>
														)}
													</Button>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						)}

						{/* Supplier Selection & Fast Item Quick-Add Grid (COMPACT SINGLE ROW) */}
						<div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end rounded-lg border border-border/60 bg-muted/20 p-2 w-full min-w-0 max-w-full">
							{/* Supplier Partner */}
							<div className="sm:col-span-5 min-w-0 w-full">
								<Label className="font-bold text-foreground text-[11px] block mb-1">
									Select Supplier Partner *
								</Label>
								<select
									className="w-full h-8 cursor-pointer rounded-md border border-input bg-white px-2 font-semibold text-xs text-foreground focus:ring-1 focus:ring-primary dark:bg-slate-900 truncate"
									value={selectedSupplier}
									onChange={(e) => setSelectedSupplier(e.target.value)}
								>
									<option value="">Choose Supplier</option>
									{suppliersList?.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name} ({s.supplier_code})
										</option>
									))}
								</select>
							</div>

							{/* Fast Item Quick-Add Bar */}
							<div className="sm:col-span-7 min-w-0 w-full">
								<div className="mb-1 flex items-center justify-between">
									<Label className="flex items-center gap-1 font-bold text-foreground text-[11px]">
										<ZapIcon className="h-3 w-3 text-amber-500" />
										Fast Quick-Add
									</Label>
									<span className="font-normal text-[10px] text-muted-foreground">
										Type & Enter or Add
									</span>
								</div>
								<div className="relative flex items-center gap-1.5 w-full min-w-0">
									<div className="relative flex-1 min-w-0">
										<Input
											placeholder="Type name or SKU..."
											value={quickProductSearch}
											onChange={(e) => {
												setQuickProductSearch(e.target.value);
												setShowQuickSuggestions(true);
											}}
											onFocus={() => setShowQuickSuggestions(true)}
											className="h-8 bg-white font-medium text-xs dark:bg-slate-900 w-full"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													const query = quickProductSearch.trim();
													if (!query) {
														toast.error("Type a product name or SKU to quick-add.");
														return;
													}
													if (matchedProducts.length > 0) {
														handleQuickAddProduct(matchedProducts[0]);
													} else {
														toast.error(`No product found matching "${query}".`);
													}
												}
											}}
										/>
										{showQuickSuggestions && quickProductSearch.trim() && (
											<div className="absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-white p-1.5 shadow-xl dark:bg-slate-900 border-primary/20">
												{matchedProducts.length > 0 ? (
													<>
														{matchedProducts.slice(0, 6).map((prod: any) => (
															<div
																key={prod.id}
																onMouseDown={() => handleQuickAddProduct(prod)}
																className="flex cursor-pointer items-center justify-between rounded-md p-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800"
															>
																<div className="truncate mr-2">
																	<span className="font-bold text-slate-900 dark:text-slate-100">
																		{prod.product}
																	</span>
																	<span className="ml-1.5 font-mono text-[10px] text-slate-500">
																		({prod.sku})
																	</span>
																</div>
																<div className="text-right shrink-0">
																	<span className="font-bold text-emerald-600">
																		₹
																		{Number(
																			prod.base_procurement_price ||
																				prod.procurement_price ||
																				prod.price ||
																				10,
																		).toFixed(2)}
																	</span>
																	<span className="ml-1.5 text-[10px] text-muted-foreground">
																		({prod.qty_on_hand || 0} left)
																	</span>
																</div>
															</div>
														))}
														<div
															onMouseDown={() =>
																handleAddNewProductQuick(quickProductSearch)
															}
															className="flex cursor-pointer items-center justify-between rounded-md p-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/20 mt-1 transition-colors"
														>
															<span className="flex items-center gap-1.5 truncate">
																<SparklesIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
																Order &ldquo;{quickProductSearch.trim()}&rdquo; as New Product
															</span>
															<Badge
																variant="outline"
																className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 shrink-0"
															>
																+ New
															</Badge>
														</div>
													</>
												) : (
													<div className="p-2 text-center space-y-1.5">
														<p className="text-xs text-muted-foreground truncate">
															No catalog product matches &ldquo;<strong>{quickProductSearch}</strong>&rdquo;
														</p>
														<Button
															type="button"
															size="sm"
															onMouseDown={() =>
																handleAddNewProductQuick(quickProductSearch)
															}
															className="h-6.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs w-full"
														>
															<SparklesIcon className="mr-1 h-3 w-3" />
															+ Order &ldquo;{quickProductSearch.trim()}&rdquo; as New Product
														</Button>
													</div>
												)}
											</div>
										)}
									</div>
									<Input
										type="number"
										min="1"
										placeholder="Qty"
										value={quickQuantity}
										onChange={(e) =>
											setQuickQuantity(Number.parseInt(e.target.value) || 1)
										}
										className="h-8 w-16 text-center bg-white font-bold text-xs dark:bg-slate-900 shrink-0"
									/>
									<Button
										type="button"
										size="sm"
										disabled={!quickProductSearch.trim()}
										onClick={() => {
											const query = quickProductSearch.trim();
											if (!query) {
												toast.error("Type a product name or SKU to quick-add.");
												return;
											}
											if (matchedProducts.length > 0) {
												handleQuickAddProduct(matchedProducts[0]);
											} else {
												handleAddNewProductQuick(query);
											}
										}}
										className="h-8 bg-blue-600 px-2.5 font-bold text-white text-xs shadow-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
									>
										<PlusIcon className="h-3.5 w-3.5 sm:mr-1" />
										<span className="hidden sm:inline">Add</span>
									</Button>
								</div>
							</div>
						</div>

						{/* Dynamic Items list */}
						<div className="space-y-1.5 w-full min-w-0 max-w-full">
							<div className="flex items-center justify-between flex-wrap gap-1.5">
								<Label className="font-bold text-foreground text-xs">
									Order Line Items ({orderItems.length})
								</Label>
								<div className="flex items-center gap-1.5">
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => addNewProductLineItem()}
										className="h-6 text-[10.5px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-bold bg-emerald-500/5 px-2"
									>
										<SparklesIcon className="mr-1 h-3 w-3 text-emerald-600" /> + Order New Product
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={addLineItem}
										className="h-6 text-[10.5px] px-2 font-semibold"
									>
										<PlusIcon className="mr-1 h-3 w-3" /> + Line
									</Button>
								</div>
							</div>

							<div className="max-h-52 space-y-1.5 overflow-y-auto pr-0.5 scrollbar-thin w-full min-w-0 max-w-full">
								{orderItems.map((item, idx) => {
									if (item.isNewProduct) {
										return (
											<div
												key={idx}
												className="rounded-md border border-emerald-400/50 bg-emerald-50/20 p-2 dark:bg-emerald-950/20 space-y-1.5 text-xs min-w-0 max-w-full shadow-2xs"
											>
												<div className="flex items-center justify-between gap-1.5 min-w-0">
													<div className="flex items-center gap-1.5 min-w-0 flex-1">
														<Badge className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0 shrink-0">
															✨ New Product
														</Badge>
														<Input
															placeholder="Product Name *"
															value={item.newProductName || ""}
															onChange={(e) =>
																updateLineItem(
																	idx,
																	"newProductName",
																	e.target.value,
																)
															}
															className="h-7 font-bold text-xs bg-white dark:bg-slate-900 min-w-0 flex-1"
														/>
													</div>
													<div className="flex items-center gap-1 shrink-0">
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => {
																const updated = [...orderItems];
																updated[idx] = {
																	productId: "",
																	quantity: item.quantity || 1,
																	price: item.price || 10,
																	isNewProduct: false,
																};
																setOrderItems(updated);
															}}
															className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-1"
														>
															Catalog
														</Button>
														<Button
															size="icon"
															variant="ghost"
															className="h-6 w-6 text-red-500 hover:text-red-700"
															onClick={() => removeLineItem(idx)}
															disabled={orderItems.length === 1}
														>
															<XIcon className="h-3.5 w-3.5" />
														</Button>
													</div>
												</div>

												<div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap min-w-0">
													<select
														className="h-7 rounded border border-input bg-white px-1.5 text-[11px] font-semibold dark:bg-slate-900 w-24 shrink-0"
														value={item.newProductCategory || "General"}
														onChange={(e) =>
															updateLineItem(
																idx,
																"newProductCategory",
																e.target.value,
															)
														}
													>
														<option value="General">General</option>
														<option value="Groceries">Groceries</option>
														<option value="Dairy">Dairy</option>
														<option value="Beverages">Beverages</option>
														<option value="Snacks">Snacks</option>
														<option value="Bakery">Bakery</option>
														<option value="Spices">Spices</option>
														<option value="Personal Care">Personal Care</option>
														<option value="Household">Household</option>
													</select>
													<select
														className="h-7 rounded border border-input bg-white px-1 text-[11px] font-semibold dark:bg-slate-900 w-16 shrink-0"
														value={item.newProductUnit || "pcs"}
														onChange={(e) =>
															updateLineItem(
																idx,
																"newProductUnit",
																e.target.value,
															)
														}
													>
														<option value="pcs">Pcs</option>
														<option value="kg">Kg</option>
														<option value="box">Box</option>
														<option value="pkt">Pkt</option>
														<option value="ltr">Ltr</option>
														<option value="gm">Gm</option>
														<option value="can">Can</option>
														<option value="bottle">Bottle</option>
													</select>
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
														className="h-7 w-16 text-center font-bold text-xs bg-white dark:bg-slate-900 px-1 shrink-0"
													/>
													<Input
														type="number"
														placeholder="Cost ₹"
														min="0"
														step="0.01"
														value={item.price}
														onChange={(e) => {
															const cost =
																Number.parseFloat(e.target.value) || 0;
															updateLineItem(idx, "price", cost);
															if (!item.newProductSellingPrice) {
																updateLineItem(
																	idx,
																	"newProductSellingPrice",
																	Math.round(cost * 1.25 * 100) / 100,
																);
															}
														}}
														className="h-7 w-20 text-right font-bold text-xs bg-white dark:bg-slate-900 px-1 shrink-0"
													/>
													<div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto shrink-0">
														<span>Sell: ₹</span>
														<Input
															type="number"
															placeholder="Sell"
															min="0"
															step="0.01"
															value={
																item.newProductSellingPrice ||
																Math.round(item.price * 1.25 * 100) / 100
															}
															onChange={(e) =>
																updateLineItem(
																	idx,
																	"newProductSellingPrice",
																	Number.parseFloat(e.target.value) || 0,
																)
															}
															className="h-6 w-16 text-[11px] font-bold bg-white dark:bg-slate-900 py-0 px-1"
														/>
														<span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 ml-1">
															₹{((item.quantity || 0) * (item.price || 0)).toFixed(0)}
														</span>
													</div>
												</div>
											</div>
										);
									}

									return (
										<div
											key={idx}
											className="flex items-center gap-1.5 rounded-md border border-border/60 bg-slate-50/70 p-1.5 dark:bg-slate-900/40 min-w-0 max-w-full"
										>
											<div className="flex-1 min-w-0">
												<select
													className="w-full h-7.5 cursor-pointer rounded border border-input bg-white px-2 font-medium text-xs dark:bg-slate-900 truncate"
													value={item.productId}
													onChange={(e) => {
														const selectedId = e.target.value;
														if (selectedId === "__NEW_PRODUCT__") {
															const updated = [...orderItems];
															updated[idx] = {
																productId: "",
																isNewProduct: true,
																newProductName: "",
																newProductCategory: "General",
																newProductUnit: "pcs",
																quantity: item.quantity || 1,
																price: item.price || 10,
																newProductSellingPrice:
																	Math.round((item.price || 10) * 1.25 * 100) /
																	100,
															};
															setOrderItems(updated);
															return;
														}
														const selectedProd = invData?.items?.find(
															(i: any) =>
																(i.productId || i.id).toString() === selectedId,
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
													<option
														value="__NEW_PRODUCT__"
														className="text-emerald-600 font-bold"
													>
														✨ + [NEW ITEM] Order product not in catalog...
													</option>
													{invData?.items?.map((i: any) => {
														const pId = (i.productId || i.id).toString();
														return (
															<option key={pId} value={pId}>
																{i.product} {i.sku ? `(${i.sku})` : ""}
															</option>
														);
													})}
												</select>
											</div>
											<div className="w-16 shrink-0">
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
													className="h-7.5 text-center font-bold text-xs bg-white dark:bg-slate-900 px-1"
												/>
											</div>
											<div className="w-20 shrink-0">
												<Input
													type="number"
													placeholder="Cost ₹"
													min="0"
													step="0.01"
													value={item.price}
													onChange={(e) =>
														updateLineItem(
															idx,
															"price",
															Number.parseFloat(e.target.value) || 0,
														)
													}
													className="h-7.5 text-right font-bold text-xs bg-white dark:bg-slate-900 px-1.5"
												/>
											</div>
											<div className="w-16 shrink-0 text-right text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
												₹{((item.quantity || 0) * (item.price || 0)).toFixed(0)}
											</div>
											<Button
												size="icon"
												variant="ghost"
												className="h-7.5 w-7.5 text-muted-foreground hover:text-red-600 shrink-0"
												onClick={() => removeLineItem(idx)}
												disabled={orderItems.length === 1}
											>
												<XIcon className="h-3.5 w-3.5" />
											</Button>
										</div>
									);
								})}
							</div>
						</div>

						{/* Real-time calculated totals */}
						<div className="flex items-center justify-between border-t pt-2 font-bold text-xs w-full min-w-0">
							<span>Estimated Order Volume:</span>
							<span className="text-blue-600 text-sm">
								₹
								{totalAmount.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>
					</div>

					<DialogFooter className="p-3 sm:p-4 border-t border-border/50 shrink-0 gap-2 bg-muted/10">
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
				<DialogContent className="max-w-3xl border-border bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Purchase Order Items — {selectedPO?.po_number || `PO-#${selectedPO?.id}`}
						</DialogTitle>
						<DialogDescription className="text-xs">
							Supplier Company: <strong className="text-foreground">{selectedPO?.supplier_name}</strong> &bull; Status: <strong className="text-foreground">{selectedPO?.status?.toUpperCase()}</strong> &bull; Receiving: <strong className="text-foreground">{(selectedPO?.receiving_status || "pending").toUpperCase()}</strong>
						</DialogDescription>
					</DialogHeader>

					{loadingDetails ? (
						<div className="flex justify-center py-8">
							<Loader2Icon className="h-6 w-6 animate-spin" />
						</div>
					) : (
						<div className="my-2 max-h-80 space-y-4 overflow-y-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="text-xs">Product Line Item</TableHead>
										<TableHead className="text-center text-xs">Ordered</TableHead>
										<TableHead className="text-center text-xs">Delivery & Inspection</TableHead>
										<TableHead className="text-xs">Batch #</TableHead>
										<TableHead className="text-right text-xs">Unit Cost</TableHead>
										<TableHead className="text-right text-xs">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{poDetailsList.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-semibold text-xs">
												<div>{item.product_name}</div>
												{item.product_sku && (
													<div className="font-mono text-[10px] text-muted-foreground">{item.product_sku}</div>
												)}
											</TableCell>
											<TableCell className="text-center font-bold font-mono text-xs">
												{Number(item.quantity)} units
											</TableCell>
											<TableCell className="text-center">
												{item.has_receipt ? (
													<div className="flex flex-wrap items-center justify-center gap-1">
														<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
															Accepted: {item.accepted_quantity}
														</span>
														{Number(item.damaged_quantity) > 0 && (
															<span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-bold text-amber-600 dark:text-amber-400 text-[11px]">
																Damaged: {item.damaged_quantity}
															</span>
														)}
														{Number(item.rejected_quantity) > 0 && (
															<span className="rounded-full bg-red-500/10 px-2 py-0.5 font-bold text-red-600 dark:text-red-400 text-[11px]">
																Rejected: {item.rejected_quantity}
															</span>
														)}
													</div>
												) : (
													<Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
														Pending Inbound
													</Badge>
												)}
											</TableCell>
											<TableCell className="font-mono text-xs">
												{item.batch_number ? (
													<span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{item.batch_number}</span>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
											<TableCell className="text-right font-mono text-xs">
												₹{Number(item.price).toFixed(2)}
											</TableCell>
											<TableCell className="text-right font-bold font-mono text-xs">
												₹{(Number(item.quantity) * Number(item.price)).toFixed(2)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}

					<DialogFooter className="flex flex-wrap items-center justify-between gap-2 sm:justify-between">
						{selectedPO && (
							<Button
								variant="outline"
								size="sm"
								asChild
								className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 text-xs"
							>
								<a href={`/procurement/incoming/${selectedPO.id}`}>
									View Inbound Inspection / GRNs
								</a>
							</Button>
						)}
						<Button size="sm" onClick={() => setIsDetailModalOpen(false)}>
							Close Order Details
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
