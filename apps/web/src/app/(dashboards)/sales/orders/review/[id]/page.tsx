"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	ArrowLeftIcon,
	CheckCircle2Icon,
	Loader2Icon,
	LockIcon,
	MapPinIcon,
	NavigationIcon,
	PhoneIcon,
	PlusIcon,
	RouteIcon,
	SaveIcon,
	SearchIcon,
	Trash2Icon,
	TruckIcon,
	UserIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SaleCompletionScreen } from "@/components/pos/SaleCompletionScreen";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/lib/trpc/client";

type Line = {
	productId: number;
	name: string;
	unit: string | null;
	quantity: number;
	price: number;
};

export default function CustomerOrderReviewPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = Number(params.id);

	const {
		data: order,
		isLoading,
		error,
	} = trpc.orders.getForReview.useQuery(
		{ id },
		{ enabled: Number.isFinite(id) },
	);
	const { data: catalog } = trpc.products.list.useQuery();
	const { data: routes } = trpc.delivery.listRoutes.useQuery({});

	const [lines, setLines] = useState<Line[]>([]);
	const [discount, setDiscount] = useState(0);
	const [selectedRouteId, setSelectedRouteId] = useState<string>("");
	const [addProductId, setAddProductId] = useState<string>("");
	const [productSearch, setProductSearch] = useState<string>("");
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isConfirmingLocal, setIsConfirmingLocal] = useState(false);
	const [isSavingDraftLocal, setIsSavingDraftLocal] = useState(false);
	const confirmingRef = useRef(false);
	const savingDraftRef = useRef(false);
	const seeded = useRef(false);

	const filteredCatalog = useMemo(() => {
		const list = (catalog ?? []).filter((p) => p.status === "active");
		if (!productSearch.trim()) return list;
		const query = productSearch.toLowerCase().trim();
		return list.filter(
			(p) =>
				p.name.toLowerCase().includes(query) ||
				(p.sku && p.sku.toLowerCase().includes(query)) ||
				(p.category && p.category.toLowerCase().includes(query)),
		);
	}, [catalog, productSearch]);

	// Seed editable lines and route from the stored order once.
	useEffect(() => {
		if (order && !seeded.current) {
			setLines(
				order.items.map((it: any) => ({
					productId: it.productId as number,
					name: it.name || it.productName || it.product?.name || "Product",
					unit: it.unit,
					quantity: it.quantity,
					price:
						Number(it.price) > 0
							? Number(it.price)
							: Number(it.suggestedPrice ?? it.catalogPrice ?? 0),
				})),
			);
			setDiscount(Number(order.discountAmount ?? 0));
			if (order.assignedRoute?.id) {
				setSelectedRouteId(String(order.assignedRoute.id));
			}
			seeded.current = true;
		}
	}, [order]);

	const subtotal = useMemo(
		() => lines.reduce((a, l) => a + l.price * l.quantity, 0),
		[lines],
	);
	const total = Math.max(0, subtotal - discount);
	const locked = order?.locked || order?.status === "confirmed";

	const setLine = (pid: number, patch: Partial<Line>) =>
		setLines((prev) =>
			prev.map((l) => (l.productId === pid ? { ...l, ...patch } : l)),
		);
	const removeLine = (pid: number) =>
		setLines((prev) => prev.filter((l) => l.productId !== pid));

	const addProduct = () => {
		const pid = Number(addProductId);
		if (!pid) return;
		if (lines.some((l) => l.productId === pid)) {
			toast.info("That product is already in the order.");
			return;
		}
		const prod = catalog?.find((p) => p.id === pid);
		if (!prod) return;
		setLines((prev) => [
			...prev,
			{
				productId: pid,
				name: prod.name,
				unit: null,
				quantity: 1,
				price: prod.baseSellingPrice ?? 0,
			},
		]);
		setAddProductId("");
	};

	const saveDraft = trpc.orders.updateReviewItems.useMutation({
		onSuccess: () => {
			savingDraftRef.current = false;
			setIsSavingDraftLocal(false);
			toast.success("Order draft updated successfully.");
			utils.orders.getForReview.invalidate({ id });
			utils.orders.listPendingReview.invalidate();
			utils.orders.getPendingCount.invalidate();
		},
		onError: (e) => {
			savingDraftRef.current = false;
			setIsSavingDraftLocal(false);
			toast.error(e.message);
		},
	});

	const assignRouteMutation = trpc.orders.assignRoute.useMutation({
		onSuccess: (data) => {
			toast.success(`Assigned to ${data.routeName}`);
			utils.orders.getForReview.invalidate({ id });
			utils.delivery.listRoutes.invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	const handleRouteChange = (newRouteId: string) => {
		setSelectedRouteId(newRouteId);
		if (newRouteId && newRouteId !== "none") {
			assignRouteMutation.mutate({
				orderId: id,
				routeId: Number(newRouteId),
			});
		}
	};

	const [completedOrder, setCompletedOrder] = useState<any>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [selectedCancelReason, setSelectedCancelReason] = useState<string>(
		"Customer Refused / Changed Mind (ग्राहक ने मना कर दिया)",
	);
	const [customCancelReason, setCustomCancelReason] = useState<string>("");
	const [cancelNotes, setCancelNotes] = useState<string>("");

	const cancelMutation = trpc.orders.cancelOrder.useMutation({
		onSuccess: () => {
			toast.success(
				`Order ORD-${id} has been cancelled and archived under Cancelled Orders.`,
			);
			utils.orders.listPendingReview.invalidate();
			utils.orders.getPendingCount.invalidate();
			utils.orders.listCancelledOrders.invalidate();
			utils.orders.list.invalidate();
			setCancelDialogOpen(false);
			router.push("/sales/orders/review");
		},
		onError: (err) => {
			toast.error(`Failed to cancel order: ${err.message}`);
		},
	});

	const handleCancelSubmit = () => {
		const finalReason =
			selectedCancelReason === "Custom / Other Reason"
				? customCancelReason.trim()
				: selectedCancelReason;

		if (!finalReason) {
			toast.error("Please provide a reason for cancelling this order.");
			return;
		}

		cancelMutation.mutate({
			id,
			reason: finalReason,
			notes: cancelNotes.trim() || undefined,
		});
	};

	const confirm = trpc.orders.confirmOrder.useMutation({
		onSuccess: (res) => {
			confirmingRef.current = false;
			setIsConfirmingLocal(false);
			toast.success("Order confirmed! Bill generated successfully.");
			utils.orders.list.invalidate();
			utils.orders.listPendingReview.invalidate();
			utils.orders.getPendingCount.invalidate();
			utils.manager.getDashboardStats.invalidate();
			utils.manager.getAwaitingDispatchOrders.invalidate();
			utils.delivery.listAllTrips.invalidate();
			utils.delivery.listRoutes.invalidate();
			utils.picker.getPending.invalidate();
			utils.picker.getDashboardStats.invalidate();
			utils.warehouse.getPickingQueue.invalidate();
			setConfirmOpen(false);

			// Populate CompletedOrder for the bill invoice screen
			const sub = lines.reduce((a, l) => a + l.price * l.quantity, 0);
			const tot = Math.max(0, sub - discount);
			setCompletedOrder({
				id: id,
				createdAt: new Date().toISOString(),
				customerName: order?.customer?.name || "Customer",
				customerPhone: order?.customer?.phone || "",
				shopName: order?.customer?.address || "",
				address: order?.customer?.address || "",
				subtotal: sub,
				discount: discount,
				total: tot,
				items: lines.map((l: any) => ({
					id: l.productId,
					name: l.name || l.productName || "Product",
					productName: l.name || l.productName || "Product",
					qty: l.quantity,
					price: l.price.toString(),
				})),
				payments: [{ methodId: 1, amount: tot.toString() }],
			});
		},
		onError: (e) => {
			confirmingRef.current = false;
			setIsConfirmingLocal(false);
			setConfirmOpen(false);
			toast.error(e.message);
		},
	});

	const isConfirming = isConfirmingLocal || confirm.isPending;
	const isSavingDraft = isSavingDraftLocal || saveDraft.isPending;

	if (completedOrder) {
		return (
			<SaleCompletionScreen
				order={completedOrder}
				onNewSale={() => {
					setCompletedOrder(null);
					router.push("/sales/orders/review");
				}}
			/>
		);
	}

	if (isLoading)
		return (
			<div className="py-12 text-center text-muted-foreground text-sm">
				Loading order details…
			</div>
		);

	if (error || !order)
		return (
			<div className="space-y-4">
				<Link
					href="/sales/orders/review"
					className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
				>
					<ArrowLeftIcon className="h-4 w-4" /> Back to orders queue
				</Link>
				<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
					{error?.message ?? "Order not found."}
				</div>
			</div>
		);

	const unpricedCount = lines.filter((l) => l.price <= 0).length;
	const canConfirm =
		!locked &&
		lines.length > 0 &&
		unpricedCount === 0 &&
		!isConfirming &&
		!isSavingDraft;

	const handleSave = () => {
		if (
			savingDraftRef.current ||
			confirmingRef.current ||
			isSavingDraft ||
			isConfirming ||
			lines.length === 0
		)
			return;

		savingDraftRef.current = true;
		setIsSavingDraftLocal(true);

		saveDraft.mutate({
			id,
			items: lines.map((l) => ({
				productId: l.productId,
				quantity: l.quantity,
				price: l.price,
			})),
			discountAmount: discount,
		});
	};

	const handleConfirm = () => {
		if (
			confirmingRef.current ||
			savingDraftRef.current ||
			isConfirming ||
			isSavingDraft ||
			!canConfirm
		)
			return;

		confirmingRef.current = true;
		setIsConfirmingLocal(true);

		confirm.mutate({
			id,
			items: lines.map((l) => ({
				productId: l.productId,
				quantity: l.quantity,
				price: l.price,
			})),
			discountAmount: discount,
			routeId:
				selectedRouteId && selectedRouteId !== "none"
					? Number(selectedRouteId)
					: undefined,
		});
	};

	return (
		<div className="space-y-6">
			{order.reviewedBy && (
				<div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-purple-900 shadow-sm dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200 flex items-center gap-3">
					<span className="text-xl">🔒</span>
					<div>
						<p className="font-semibold text-sm">
							Equipped / Being Reviewed by: {order.reviewedBy}
						</p>
						<p className="text-xs text-purple-700 dark:text-purple-300">
							Another sales team member opened this order first. Be mindful when editing or making changes.
						</p>
					</div>
				</div>
			)}
			{/* Back Link & Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Link
						href="/sales/orders/review"
						className="mb-2 inline-flex items-center gap-1 font-medium text-primary text-sm hover:underline"
					>
						<ArrowLeftIcon className="h-4 w-4" /> Back to Queue
					</Link>
					<div className="flex items-center gap-3">
						<h1 className="font-bold font-mono text-2xl tracking-tight">
							{order.orderRef}
						</h1>
						{locked ? (
							<div className="flex items-center gap-2">
								<Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
									Confirmed & Invoiced
								</Badge>
								<Button
									asChild
									size="sm"
									variant="outline"
									className="border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
								>
									<Link href={`/sales/pos?completedOrderId=${order.id}`}>
										View Bill in POS / Print Invoice
									</Link>
								</Button>
							</div>
						) : (
							<Badge
								variant="outline"
								className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
							>
								Review In Progress
							</Badge>
						)}
					</div>
				</div>

				{/* Prominent Call Customer Button */}
				{order.customer?.phone && (
					<Button
						asChild
						size="lg"
						className="gap-2 bg-emerald-600 font-semibold text-white shadow-md hover:bg-emerald-700"
					>
						<a href={`tel:${order.customer.phone}`}>
							<PhoneIcon className="h-5 w-5" />
							Call Customer ({order.customer.phone})
						</a>
					</Button>
				)}
			</div>

			{/* Customer Details Card */}
			<Card className="border-border/50 bg-gradient-to-r from-card via-card to-primary/5">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<UserIcon className="h-4 w-4 text-primary" />
						Customer Information
					</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div>
						<p className="font-semibold text-foreground text-sm">
							{order.customer?.name}
						</p>
						<p className="text-muted-foreground text-xs">Customer Name</p>
					</div>

					<div>
						<p className="font-medium font-mono text-foreground text-sm">
							{order.customer?.phone || "No phone available"}
						</p>
						<p className="text-muted-foreground text-xs">Contact Number</p>
					</div>

					<div>
						<div className="flex items-center gap-1 font-medium text-foreground text-sm">
							<MapPinIcon className="h-3.5 w-3.5 text-muted-foreground" />
							<span className="truncate">
								{order.customer?.address || "No address provided"}
							</span>
						</div>
						<p className="text-muted-foreground text-xs">Delivery Address</p>
					</div>
				</CardContent>
			</Card>

			{/* Delivery Route Assignment Card */}
			<Card className="border-border/50 bg-gradient-to-r from-card via-card to-blue-500/5">
				<CardHeader className="pb-3">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle className="flex items-center gap-2 text-base">
							<TruckIcon className="h-4 w-4 text-blue-500" />
							Delivery Route Assignment (वितरण रूट)
						</CardTitle>
						{selectedRouteId ? (
							<Badge className="bg-blue-500/10 font-semibold text-blue-600 dark:text-blue-400">
								Route Assigned
							</Badge>
						) : (
							<Badge variant="outline" className="text-muted-foreground text-xs">
								Unassigned
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div className="flex-1">
							<Label className="text-muted-foreground text-xs">
								Assign Manager-Created Delivery Route:
							</Label>
							<Select
								value={selectedRouteId}
								onValueChange={handleRouteChange}
								disabled={locked}
							>
								<SelectTrigger className="mt-1 h-9 w-full">
									<SelectValue placeholder="Select Route (Route 1 / Route 2 / Route 3…)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">-- No Route Assigned --</SelectItem>
									{(routes ?? []).map((r, idx) => (
										<SelectItem key={r.id} value={String(r.id)}>
											<div className="flex items-center gap-2">
												<span className="font-bold text-primary">
													Route {idx + 1}:
												</span>
												<span>{r.name}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{selectedRouteId && selectedRouteId !== "none" && (
							<div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2.5 sm:max-w-xs">
								<p className="font-semibold text-blue-600 text-xs dark:text-blue-400">
									Active:{" "}
									{routes?.find((r) => String(r.id) === selectedRouteId)?.name ||
										`Route #${selectedRouteId}`}
								</p>
								<p className="text-[11px] text-muted-foreground">
									Linked Stops:{" "}
									{routes?.find((r) => String(r.id) === selectedRouteId)?.stops
										?.length || 0}{" "}
									customers
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Unpriced warning banner */}
			{!locked && unpricedCount > 0 && (
				<div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 text-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
					<AlertCircleIcon className="h-4 w-4 shrink-0 text-amber-600" />
					<span>
						{unpricedCount} line item(s) have ₹0.00 price. Enter valid prices
						before confirming the order.
					</span>
				</div>
			)}

			{/* Line Items Table Card */}
			<Card className="border-border/50">
				<CardHeader>
					<CardTitle className="text-base">Line Items & Pricing</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="hidden rounded-lg bg-muted/50 px-4 py-2 font-medium text-muted-foreground text-xs sm:grid sm:grid-cols-[1fr_100px_140px_120px_40px] sm:gap-4">
						<span>Product</span>
						<span>Quantity</span>
						<span>Unit Price (MRP)</span>
						<span className="text-right">Line Total</span>
						<span className="sr-only">Actions</span>
					</div>

					{lines.map((l) => (
						<div
							key={l.productId}
							className="flex flex-col gap-3 rounded-lg border border-border/40 p-3 last:border-0 sm:grid sm:grid-cols-[1fr_100px_140px_120px_40px] sm:items-center sm:gap-4 sm:border-0 sm:border-b sm:p-0 sm:pb-3"
						>
							<div className="min-w-0">
								<p className="font-medium text-foreground text-sm">{l.name}</p>
								<div className="flex flex-wrap items-center gap-2 pt-1">
									<span className="inline-flex items-center rounded-md border border-border/40 bg-muted/85 px-2 py-0.5 font-bold font-mono text-[10px] text-muted-foreground shadow-sm">
										ID: {l.productId}
									</span>
									{l.unit && (
										<span className="font-medium text-muted-foreground text-xs">
											Unit: {l.unit}
										</span>
									)}
								</div>
							</div>

							<div>
								<Label className="text-xs sm:sr-only">Quantity</Label>
								<Input
									type="number"
									min={1}
									value={l.quantity}
									disabled={locked}
									onChange={(e) =>
										setLine(l.productId, {
											quantity: Math.max(1, Number(e.target.value) || 1),
										})
									}
									className="h-9"
								/>
							</div>

							<div>
								<Label className="text-xs sm:sr-only">Unit Price (₹)</Label>
								<div
									className={`flex h-9 items-center justify-between gap-1.5 rounded-md border border-border/50 bg-muted/30 px-3 text-sm ${l.price <= 0 ? "border-amber-400 bg-amber-50/50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200" : "text-foreground"}`}
									title="MRP is locked and managed exclusively by Warehouse Manager"
								>
									<span className="font-medium">
										₹
										{Number(l.price).toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
									<span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
										<LockIcon className="h-2.5 w-2.5" />
										MRP
									</span>
								</div>
							</div>

							<div className="flex items-center justify-between sm:justify-end">
								<span className="text-muted-foreground text-xs sm:hidden">
									Line Total:
								</span>
								<span className="font-semibold text-foreground text-sm">
									₹
									{(l.price * l.quantity).toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>

							{!locked && (
								<button
									type="button"
									onClick={() => removeLine(l.productId)}
									className="self-end text-muted-foreground transition-colors hover:text-destructive sm:self-center"
									title="Remove item"
								>
									<Trash2Icon className="h-4 w-4" />
								</button>
							)}
						</div>
					))}

					{/* Add Extra Item Row */}
					{!locked && (
						<div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-center">
							<div className="relative flex-1">
								<Select
									value={addProductId}
									onValueChange={(val) => {
										setAddProductId(val);
									}}
								>
									<SelectTrigger className="h-10 flex-1">
										<SelectValue placeholder="🔍 Search or select product to add…" />
									</SelectTrigger>
									<SelectContent className="max-h-80 w-[420px] p-2">
										<div className="sticky top-0 z-10 mb-2 bg-popover pb-1">
											<div className="relative">
												<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
												<Input
													placeholder="Search by product name, SKU or category..."
													value={productSearch}
													onChange={(e) => setProductSearch(e.target.value)}
													onKeyDown={(e) => e.stopPropagation()}
													className="h-9 pl-8 text-xs"
													autoFocus
												/>
											</div>
										</div>
										<div className="max-h-60 overflow-y-auto">
											{filteredCatalog.length === 0 ? (
												<div className="p-3 text-center text-muted-foreground text-xs">
													No matching products found.
												</div>
											) : (
												filteredCatalog.map((p) => (
													<SelectItem
														key={p.id}
														value={String(p.id)}
														className="cursor-pointer py-2 text-xs"
													>
														<div className="flex w-full items-center justify-between gap-4">
															<span className="font-medium text-foreground">
																{p.name}
																{p.baseSellingPrice
																	? ` (₹${p.baseSellingPrice})`
																	: ""}
															</span>
															<span
																className={`shrink-0 rounded px-1.5 py-0.5 font-bold font-mono text-[10px] ${
																	(p.stock ?? 0) > 0
																		? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
																		: "bg-red-500/15 text-red-700 dark:text-red-400"
																}`}
															>
																Stock: {p.stock ?? 0}
															</span>
														</div>
													</SelectItem>
												))
											)}
										</div>
									</SelectContent>
								</Select>
							</div>
							<Button
								variant="outline"
								size="default"
								onClick={addProduct}
								disabled={!addProductId}
								className="gap-1.5 sm:w-auto"
							>
								<PlusIcon className="h-4 w-4" /> Add Item
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Order Summary & Actions */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Card className="border-border/50">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">
							Order Notes / Staff Info
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-muted-foreground text-xs">
						<p>• Verify prices verbally with the customer before confirming.</p>
						<p>• Once confirmed, pricing becomes visible on Customer Portal.</p>
						<p>
							• Stock will be reserved and an invoice generated automatically.
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/50">
					<CardContent className="space-y-3 p-4 text-sm">
						<div className="flex justify-between font-medium">
							<span className="text-muted-foreground">Subtotal</span>
							<span>
								₹
								{subtotal.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>

						<div className="flex items-center justify-between gap-3">
							<span className="text-muted-foreground">Discount (₹)</span>
							<Input
								type="number"
								min={0}
								step="0.01"
								value={discount}
								disabled={locked}
								onChange={(e) =>
									setDiscount(Math.max(0, Number(e.target.value) || 0))
								}
								className="h-8 w-32 text-right"
							/>
						</div>

						<div className="flex justify-between border-border/40 border-t pt-2 font-bold text-base text-foreground">
							<span>Final Total</span>
							<span className="font-mono text-lg text-primary">
								₹
								{total.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Bottom Action Bar */}
			{!locked && (
				<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
					<Button
						variant="outline"
						type="button"
						onClick={() => setCancelDialogOpen(true)}
						className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50"
					>
						<XCircleIcon className="h-4 w-4" />
						Cancel Order (ग्राहक ने मना किया)
					</Button>

					<div className="flex flex-wrap items-center gap-3">
						<Button
							variant="outline"
							onClick={handleSave}
							disabled={isSavingDraft || isConfirming || lines.length === 0}
							className="gap-2"
						>
							{isSavingDraft ? (
								<>
									<Loader2Icon className="h-4 w-4 animate-spin" />
									Saving Draft…
								</>
							) : (
								<>
									<SaveIcon className="h-4 w-4" />
									Save Draft
								</>
							)}
						</Button>

						<Button
							onClick={() => setConfirmOpen(true)}
							disabled={!canConfirm || isConfirming || isSavingDraft}
							className="gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
						>
							<CheckCircle2Icon className="h-4 w-4" />
							Confirm & Generate Bill
						</Button>
					</div>
				</div>
			)}

			{/* Cancel Customer Order Reason Modal */}
			<Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-destructive text-lg">
							<AlertTriangleIcon className="h-5 w-5" />
							Cancel Customer Order ({order?.orderRef})
						</DialogTitle>
						<DialogDescription>
							This order will be removed from the active queue and archived under{" "}
							<span className="font-semibold text-foreground">Cancelled Orders</span> with full customer and item details preserved.
						</DialogDescription>
					</DialogHeader>

					{order && (
						<div className="space-y-4 py-2 text-xs">
							<div className="rounded-lg border bg-muted/40 p-3">
								<div className="font-bold text-foreground text-sm">
									{order.customer?.name}
								</div>
								{order.customer?.phone && (
									<div className="text-muted-foreground">
										Phone: {order.customer?.phone}
									</div>
								)}
								<div className="mt-1 text-muted-foreground text-[11px]">
									Items: {lines.length} line item(s)
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="detailCancelReasonSelect" className="font-semibold text-xs">
									Cancellation Reason (कारण) *
								</Label>
								<select
									id="detailCancelReasonSelect"
									value={selectedCancelReason}
									onChange={(e) => setSelectedCancelReason(e.target.value)}
									className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-medium text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								>
									<option value="Customer Refused / Changed Mind (ग्राहक ने मना कर दिया)">
										Customer Refused / Changed Mind (ग्राहक ने मना कर दिया)
									</option>
									<option value="Customer Cancelled on Phone Call (फ़ोन पर ग्राहक द्वारा निरस्त)">
										Customer Cancelled on Phone Call (फ़ोन पर ग्राहक द्वारा निरस्त)
									</option>
									<option value="Ordered by Mistake / Duplicate Order (गलती से ऑर्डर / डुप्लीकेट)">
										Ordered by Mistake / Duplicate Order (गलती से ऑर्डर / डुप्लीकेट)
									</option>
									<option value="Item Price / Rate Mismatch (कीमत पर असहमति)">
										Item Price / Rate Mismatch (कीमत पर असहमति)
									</option>
									<option value="Out of Stock / Delivery Delayed (स्टॉक अनुपलब्ध / देरी)">
										Out of Stock / Delivery Delayed (स्टॉक अनुपलब्ध / देरी)
									</option>
									<option value="Customer Unreachable / Wrong Number (ग्राहक से संपर्क नहीं हो पाया)">
										Customer Unreachable / Wrong Number (ग्राहक से संपर्क नहीं हो पाया)
									</option>
									<option value="Custom / Other Reason">Custom / Other Reason</option>
								</select>
							</div>

							{selectedCancelReason === "Custom / Other Reason" && (
								<div className="space-y-1.5">
									<Label htmlFor="detailCustomCancelReason" className="font-semibold text-xs">
										Specify Custom Reason *
									</Label>
									<Input
										id="detailCustomCancelReason"
										placeholder="e.g. Customer cancelled due to change in store requirement"
										value={customCancelReason}
										onChange={(e) => setCustomCancelReason(e.target.value)}
										className="text-xs"
									/>
								</div>
							)}

							<div className="space-y-1.5">
								<Label htmlFor="detailCancelNotes" className="font-semibold text-xs text-muted-foreground">
									Additional Comments (Optional)
								</Label>
								<Input
									id="detailCancelNotes"
									placeholder="e.g. Customer informed on phone call"
									value={cancelNotes}
									onChange={(e) => setCancelNotes(e.target.value)}
									className="text-xs"
								/>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setCancelDialogOpen(false)}
							className="text-xs"
						>
							Go Back
						</Button>
						<Button
							variant="destructive"
							onClick={handleCancelSubmit}
							disabled={cancelMutation.isPending}
							className="gap-1.5 text-xs"
						>
							{cancelMutation.isPending ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : (
								<XCircleIcon className="h-4 w-4" />
							)}
							Confirm Cancellation
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm Order Dialog */}
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg">
							Confirm Customer Order?
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 py-2 text-sm">
						<p className="text-muted-foreground">
							Are you sure you want to finalize order{" "}
							<strong className="font-mono text-foreground">
								{order.orderRef}
							</strong>{" "}
							for{" "}
							<strong className="text-foreground">
								{order.customer?.name}
							</strong>
							?
						</p>
						<div className="space-y-1.5 rounded-lg bg-muted/60 p-3 text-xs">
							<div className="flex justify-between">
								<span>Line Items:</span>
								<span className="font-semibold">{lines.length} items</span>
							</div>
							<div className="flex justify-between border-border/40 border-t pt-1 font-bold text-foreground text-sm">
								<span>Total Bill Amount:</span>
								<span className="font-mono text-emerald-600">
									₹
									{total.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						</div>

						{/* Route Selection Dropdown */}
						<div className="space-y-1.5 rounded-lg border border-border/70 bg-card p-3 shadow-xs">
							<Label className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
								<TruckIcon className="h-4 w-4 text-blue-500" />
								Choose Delivery Route (वितरण रूट चुनें):
							</Label>
							<Select
								value={selectedRouteId || "none"}
								onValueChange={handleRouteChange}
							>
								<SelectTrigger className="h-9 w-full bg-background font-medium text-xs">
									<SelectValue placeholder="Select Route (Route 1 / Route 2…)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										<span className="text-muted-foreground">-- No Route (Default Dispatch) --</span>
									</SelectItem>
									{(routes ?? []).map((r, idx) => (
										<SelectItem key={r.id} value={String(r.id)}>
											<div className="flex items-center gap-2">
												<span className="font-bold text-primary">
													Route {idx + 1}:
												</span>
												<span>{r.name}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedRouteId && selectedRouteId !== "none" ? (
								<p className="flex items-center gap-1 font-medium text-[11px] text-blue-600 dark:text-blue-400">
									<NavigationIcon className="h-3 w-3 shrink-0" />
									<span>
										Selected:{" "}
										<strong>
											{routes?.find((r) => String(r.id) === selectedRouteId)?.name ||
												`Route #${selectedRouteId}`}
										</strong>
										{routes?.find((r) => String(r.id) === selectedRouteId)?.description
											? ` • ${routes?.find((r) => String(r.id) === selectedRouteId)?.description}`
											: ""}
									</span>
								</p>
							) : (
								<p className="text-[11px] text-muted-foreground">
									Assign a delivery route so the order automatically links to the driver's trip stops.
								</p>
							)}
						</div>

						<p className="text-muted-foreground text-xs">
							This will reserve stock, assign the delivery route stop, generate the final bill, and make prices
							visible on the customer portal.
						</p>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setConfirmOpen(false)}
							disabled={isConfirming}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirm}
							disabled={isConfirming || confirm.isPending}
							className={`bg-emerald-600 text-white hover:bg-emerald-700 ${
								isConfirming ? "pointer-events-none opacity-80" : ""
							}`}
						>
							{isConfirming ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									Confirming & Billing…
								</>
							) : (
								"Confirm Order"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
