"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
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
	ArrowLeftIcon,
	ArrowRightIcon,
	CheckCircle2Icon,
	FlameIcon,
	LayersIcon,
	Loader2Icon,
	MapPinIcon,
	MinusIcon,
	PackageIcon,
	PhoneIcon,
	PlusIcon,
	ReceiptIcon,
	ShoppingCartIcon,
	Trash2Icon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function CustomerCartPage() {
	const trpc = useTRPC();
	const router = useRouter();
	const locale = useLocale();

	// Confirmation & Review Modals
	const [reviewOpen, setReviewOpen] = useState(false);
	const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
	const [orderNotes, setOrderNotes] = useState("");
	const [placedOrder, setPlacedOrder] = useState<{
		orderId: number;
		orderRef: string;
		totalAmount: number;
	} | null>(null);

	const idempotencyKeyRef = useRef<string | null>(null);
	const isSubmittingRef = useRef(false);

	// Fetch Server-Persistent Cart
	const {
		data: cart,
		isLoading: cartLoading,
		refetch: refetchCart,
	} = trpc.customer.getCart.useQuery(undefined, {
		refetchOnWindowFocus: true,
	});

	// Fetch Customer Profile for Delivery Details
	const { data: profile } = trpc.customer.getMyProfile.useQuery();

	// Mutations
	const utils = trpc.useUtils();

	const updateQtyMutation = trpc.customer.updateCartItemQuantity.useMutation({
		onSuccess: () => {
			utils.customer.getCart.invalidate();
		},
		onError: (err) => {
			toast.error(`Failed to update quantity: ${err.message}`);
		},
	});

	const removeItemMutation = trpc.customer.removeFromCart.useMutation({
		onSuccess: () => {
			toast.success(
				locale === "hi"
					? "उत्पाद कार्ट से हटा दिया गया!"
					: "Product removed from cart!",
			);
			utils.customer.getCart.invalidate();
		},
		onError: (err) => {
			toast.error(`Failed to remove item: ${err.message}`);
		},
	});

	const clearCartMutation = trpc.customer.clearCart.useMutation({
		onSuccess: () => {
			setClearConfirmOpen(false);
			toast.info(
				locale === "hi"
					? "आपकी कार्ट खाली कर दी गई है।"
					: "Your shopping cart has been cleared.",
			);
			utils.customer.getCart.invalidate();
		},
		onError: (err) => {
			toast.error(`Failed to clear cart: ${err.message}`);
		},
	});

	const checkoutMutation = trpc.customer.checkoutCart.useMutation({
		onSuccess: (data) => {
			isSubmittingRef.current = false;
			setReviewOpen(false);
			idempotencyKeyRef.current = null;
			setPlacedOrder({
				orderId: data.orderId,
				orderRef: data.orderRef,
				totalAmount: data.totalAmount,
			});
			utils.customer.getCart.invalidate();
			utils.customer.getMyOrders.invalidate();
			toast.success(
				locale === "hi"
					? "ऑर्डर सफलतापूर्वक सबमिट किया गया! बिक्री टीम शीघ्र समीक्षा करेगी।"
					: "Order placed successfully! Submitted for Sales review.",
			);
		},
		onError: (err) => {
			isSubmittingRef.current = false;
			toast.error(
				err.message ||
					(locale === "hi"
						? "ऑर्डर सबमिट करने में विफल।"
						: "Failed to place order."),
			);
		},
	});

	const items = cart?.items || [];
	const hasItems = items.length > 0;

	// Handlers
	const handleQtyChange = (productId: number, newQty: number) => {
		if (newQty <= 0) {
			removeItemMutation.mutate({ productId });
			return;
		}
		updateQtyMutation.mutate({
			productId,
			quantity: Number(Number(newQty).toFixed(3)),
		});
	};

	const handleOpenReview = () => {
		if (!hasItems) {
			toast.error(
				locale === "hi"
					? "आपकी कार्ट में कोई उत्पाद नहीं है।"
					: "Your cart is empty.",
			);
			return;
		}
		if (!idempotencyKeyRef.current) {
			idempotencyKeyRef.current = crypto.randomUUID();
		}
		setReviewOpen(true);
	};

	const handleConfirmAndPlaceOrder = () => {
		if (isSubmittingRef.current || checkoutMutation.isPending) return;
		if (!idempotencyKeyRef.current) {
			idempotencyKeyRef.current = crypto.randomUUID();
		}
		isSubmittingRef.current = true;
		checkoutMutation.mutate({
			idempotencyKey: idempotencyKeyRef.current,
			notes: orderNotes.trim() || undefined,
		});
	};

	// ── SUCCESS SCREEN ────────────────────────────────────────────────────────
	if (placedOrder) {
		return (
			<PageTransition className="container mx-auto max-w-2xl py-12 px-4">
				<Card className="border-emerald-200 bg-white shadow-xl dark:border-emerald-900/60 dark:bg-slate-900 text-center p-8 space-y-6">
					<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-inner">
						<CheckCircle2Icon className="h-10 w-10 animate-in zoom-in-75 duration-300" />
					</div>

					<div className="space-y-2">
						<Badge className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1">
							{locale === "hi" ? "ऑर्डर सफलतापूर्वक सबमिट" : "ORDER SUBMITTED"}
						</Badge>
						<h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
							{locale === "hi" ? "ऑर्डर प्राप्त हुआ!" : "Order Placed Successfully!"}
						</h1>
						<p className="text-muted-foreground text-sm max-w-md mx-auto">
							{locale === "hi"
								? "आपका ऑर्डर हमारी बिक्री टीम को सत्यापन और बिलिंग के लिए भेज दिया गया है।"
								: "Your order has been submitted for Sales review and inventory allocation."}
						</p>
					</div>

					<div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950 space-y-2 text-left">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								{locale === "hi" ? "ऑर्डर संदर्भ संख्या:" : "Order Reference:"}
							</span>
							<span className="font-mono font-bold text-slate-900 dark:text-slate-100">
								{placedOrder.orderRef}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								{locale === "hi" ? "अनुमानित कुल राशि:" : "Estimated Order Total:"}
							</span>
							<span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
								₹{placedOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								{locale === "hi" ? "स्थिति:" : "Current Status:"}
							</span>
							<span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
								<span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
								{locale === "hi" ? "बिक्री पुष्टि लंबित (Pending Review)" : "Pending Sales Review"}
							</span>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
						<Button
							onClick={() => router.push("/customer/orders")}
							className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
						>
							<ReceiptIcon className="mr-2 h-4 w-4" />
							{locale === "hi" ? "ऑर्डर विवरण देखें" : "View Order Details"}
						</Button>

						<Button
							variant="outline"
							onClick={() => {
								setPlacedOrder(null);
								router.push("/customer/products");
							}}
							className="w-full sm:w-auto"
						>
							<ArrowLeftIcon className="mr-2 h-4 w-4" />
							{locale === "hi" ? "और खरीदारी करें" : "Continue Shopping"}
						</Button>
					</div>
				</Card>
			</PageTransition>
		);
	}

	return (
		<PageTransition className="container mx-auto space-y-6 pb-24 px-4 sm:px-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-border/60 pb-4">
				<div>
					<div className="flex items-center gap-2">
						<Link
							href="/customer/products"
							className="text-muted-foreground hover:text-foreground transition-colors"
							title="Back to Catalog"
						>
							<ArrowLeftIcon className="h-5 w-5" />
						</Link>
						<h1 className="font-extrabold text-foreground text-xl tracking-tight sm:text-2xl flex items-center gap-2">
							<ShoppingCartIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
							<span>
								{locale === "hi" ? "शॉपिंग कार्ट" : "Shopping Cart"}
							</span>
							{hasItems && (
								<span className="text-sm font-semibold text-muted-foreground">
									({cart?.itemCount} {cart?.itemCount === 1 ? "item" : "items"})
								</span>
							)}
						</h1>
					</div>
					<p className="text-muted-foreground text-xs sm:text-sm mt-1">
						{locale === "hi"
							? "अपने चुने गए उत्पादों की समीक्षा करें, मात्रा अपडेट करें और ऑर्डर सबमिट करें।"
							: "Review your selected items, apply volume discounts, and submit for Sales confirmation."}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push("/customer/products")}
						className="h-9 gap-1.5 text-xs font-semibold"
					>
						<ArrowLeftIcon className="h-3.5 w-3.5" />
						<span>{locale === "hi" ? "उत्पाद ब्राउज़ करें" : "Continue Shopping"}</span>
					</Button>

					{hasItems && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setClearConfirmOpen(true)}
							className="h-9 gap-1 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
						>
							<Trash2Icon className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">{locale === "hi" ? "कार्ट साफ करें" : "Clear Cart"}</span>
						</Button>
					)}
				</div>
			</div>

			{/* Loading State */}
			{cartLoading && (
				<div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
					<Loader2Icon className="h-8 w-8 animate-spin text-emerald-600" />
					<p className="text-sm font-medium">
						{locale === "hi" ? "आपकी कार्ट लोड हो रही है..." : "Loading your saved shopping cart..."}
					</p>
				</div>
			)}

			{/* Empty Cart State */}
			{!cartLoading && !hasItems && (
				<Card className="border-dashed border-2 p-12 text-center bg-card shadow-xs">
					<CardContent className="flex flex-col items-center justify-center gap-4 py-8">
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 shadow-inner">
							<ShoppingCartIcon className="h-10 w-10 opacity-70" />
						</div>
						<div className="space-y-1">
							<h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
								{locale === "hi" ? "आपकी कार्ट खाली है" : "Your cart is empty"}
							</h3>
							<p className="text-xs text-muted-foreground max-w-sm mx-auto">
								{locale === "hi"
									? "हमारे उत्पाद कैटलॉग को ब्राउज़ करें और अपनी कार्ट में आइटम जोड़ें।"
									: "Browse our products and add items to your cart. All selections stay saved across visits."}
							</p>
						</div>
						<Button
							onClick={() => router.push("/customer/products")}
							className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
						>
							<PackageIcon className="mr-2 h-4 w-4" />
							{locale === "hi" ? "उत्पाद देखें (Explore Products)" : "Explore Products"}
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Cart Layout: Items List + Summary Panel */}
			{!cartLoading && hasItems && (
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
					{/* Left Column: Cart Items List */}
					<div className="lg:col-span-8 space-y-4">
						{items.map((item) => {
							const hasOffer = Boolean(item.hasActiveOffer);
							const hasShortage = Boolean(item.isStockShortage);

							return (
								<Card
									key={item.id}
									className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
										hasShortage
											? "border-amber-300 dark:border-amber-800"
											: "border-border/70 hover:border-slate-300 dark:hover:border-slate-700"
									}`}
								>
									<div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
										{/* Item Info & Image */}
										<div className="flex items-center gap-3.5 min-w-0 flex-1">
											{/* Product Photo Box */}
											<div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center p-1.5 shadow-inner">
												{item.imageUrl ? (
													<img
														src={item.imageUrl}
														alt={item.productName}
														className="h-full w-full object-contain"
														loading="lazy"
													/>
												) : (
													<PackageIcon className="h-8 w-8 text-slate-400 dark:text-slate-600" />
												)}
											</div>

											{/* Text Details */}
											<div className="min-w-0 flex-1 space-y-1">
												<div className="flex flex-wrap items-center gap-1.5">
													<Badge
														variant="outline"
														className="text-[9px] px-1.5 py-0 font-medium"
													>
														{item.category}
													</Badge>
													{item.sku && (
														<span className="font-mono text-[10px] text-muted-foreground">
															SKU: {item.sku}
														</span>
													)}
													{hasOffer && (
														<Badge className="bg-gradient-to-r from-amber-500 to-red-600 text-white font-extrabold text-[9px] px-1.5 py-0 gap-0.5">
															<FlameIcon className="h-2.5 w-2.5" />
															<span>{item.discountPercent}% OFF</span>
														</Badge>
													)}
												</div>

												<h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">
													{item.productName}
												</h3>

												{/* Price Display */}
												<div className="flex items-baseline gap-1.5 text-xs">
													{item.originalPrice > item.effectivePrice && (
														<span className="line-through text-muted-foreground font-medium text-[11px]">
															₹{item.originalPrice.toFixed(2)}
														</span>
													)}
													<span className="font-bold text-slate-900 dark:text-slate-100 sm:text-sm">
														₹{item.effectivePrice.toFixed(2)}
													</span>
													<span className="text-[11px] text-muted-foreground">
														/ {item.unit}
													</span>
													{item.offerReason && (
														<span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">
															({item.offerReason})
														</span>
													)}
												</div>

												{/* Availability Warning */}
												{hasShortage && (
													<div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
														<AlertTriangleIcon className="h-3 w-3 shrink-0" />
														<span>
															{locale === "hi"
																? `वर्तमान स्टॉक (${item.inStock} ${item.unit}) से अधिक चुनी गई मात्रा`
																: `Quantity exceeds immediate stock (${item.inStock} ${item.unit}). Sales will verify.`}
														</span>
													</div>
												)}
											</div>
										</div>

										{/* Quantity Controls & Line Total */}
										<div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
											{/* Line Total */}
											<div className="text-left sm:text-right">
												<div className="text-[11px] text-muted-foreground">
													{locale === "hi" ? "आइटम योग:" : "Item Total:"}
												</div>
												<div className="font-extrabold text-base sm:text-lg text-emerald-700 dark:text-emerald-400">
													₹{item.itemNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
												</div>
												{item.itemDiscount > 0 && (
													<div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
														Save ₹{item.itemDiscount.toFixed(2)}
													</div>
												)}
											</div>

											{/* Quantity Selector & Remove */}
											<div className="flex items-center gap-2">
												<div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800"
														onClick={() => handleQtyChange(item.productId, item.quantity - 1)}
														title="Decrease quantity"
													>
														<MinusIcon className="h-3.5 w-3.5" />
													</Button>

													<input
														type="number"
														step="any"
														min="0.1"
														value={item.quantity}
														onChange={(e) => {
															const val = parseFloat(e.target.value);
															if (!isNaN(val) && val > 0) {
																handleQtyChange(item.productId, val);
															}
														}}
														className="h-8 w-14 border-0 text-center font-bold text-xs focus:outline-none focus:ring-0 bg-transparent"
													/>

													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800"
														onClick={() => handleQtyChange(item.productId, item.quantity + 1)}
														title="Increase quantity"
													>
														<PlusIcon className="h-3.5 w-3.5" />
													</Button>
												</div>

												<Button
													variant="ghost"
													size="icon"
													onClick={() => removeItemMutation.mutate({ productId: item.productId })}
													className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
													title="Remove from cart"
												>
													<Trash2Icon className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								</Card>
							);
						})}
					</div>

					{/* Right Column: Order Summary Card */}
					<div className="lg:col-span-4 sticky top-20 space-y-4">
						<Card className="border-border/80 bg-card shadow-md">
							<CardHeader className="p-4 pb-3 border-b border-border/50">
								<CardTitle className="font-extrabold text-base flex items-center justify-between">
									<span>{locale === "hi" ? "ऑर्डर सारांश" : "Order Summary"}</span>
									<span className="text-xs font-normal text-muted-foreground">
										{cart?.itemCount} {cart?.itemCount === 1 ? "Product" : "Products"}
									</span>
								</CardTitle>
							</CardHeader>

							<CardContent className="p-4 space-y-3 text-sm">
								<div className="flex items-center justify-between text-muted-foreground">
									<span>{locale === "hi" ? "कुल मात्रा (Total Qty):" : "Total Quantity:"}</span>
									<span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
										{cart?.totalQuantity} Units
									</span>
								</div>

								<div className="flex items-center justify-between text-muted-foreground">
									<span>{locale === "hi" ? "उप-योग (Subtotal):" : "Cart Subtotal:"}</span>
									<span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
										₹{cart?.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
									</span>
								</div>

								{(cart?.discountTotal ?? 0) > 0 && (
									<div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
										<span className="flex items-center gap-1">
											<FlameIcon className="h-3.5 w-3.5" />
											<span>{locale === "hi" ? "ऑफर/स्लैब छूट:" : "Discounts Saved:"}</span>
										</span>
										<span className="font-mono">
											-₹{cart?.discountTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
										</span>
									</div>
								)}

								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>{locale === "hi" ? "लागू जीएसटी (GST):" : "Estimated GST:"}</span>
									<span className="font-medium italic">
										{locale === "hi" ? "बिक्री बिलिंग अनुसार" : "As per ERP rules"}
									</span>
								</div>

								<div className="border-t border-border/60 pt-3 flex items-baseline justify-between">
									<div>
										<span className="font-extrabold text-base text-foreground">
											{locale === "hi" ? "अनुमानित कुल:" : "Estimated Total:"}
										</span>
										<p className="text-[10px] text-muted-foreground">
											{locale === "hi" ? "अंतिम बिलिंग पर पुष्टि होगी" : "Subject to Sales confirmation"}
										</p>
									</div>
									<span className="font-extrabold text-xl sm:text-2xl text-emerald-700 dark:text-emerald-400 font-mono">
										₹{cart?.estimatedTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
									</span>
								</div>

								{/* Delivery notice */}
								<div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-muted-foreground space-y-1 dark:border-slate-800 dark:bg-slate-900/60">
									<div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
										<TruckIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
										<span>{locale === "hi" ? "डिलीवरी व बिलिंग" : "Delivery & Billing"}</span>
									</div>
									<p className="text-[11px] leading-relaxed">
										{locale === "hi"
											? "ऑर्डर सीधे आपकी पंजीकृत दुकान पर डिलीवर होगा। बिक्री टीम द्वारा पुष्टि के बाद बिल तैयार होगा।"
											: "Free delivery to your registered address. Invoice generated upon Sales team approval."}
									</p>
								</div>
							</CardContent>

							<CardFooter className="p-4 pt-0 flex flex-col gap-2">
								<Button
									size="lg"
									onClick={handleOpenReview}
									disabled={!hasItems || checkoutMutation.isPending}
									className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md h-11"
								>
									<span>{locale === "hi" ? "ऑर्डर की पुष्टि करें" : "Proceed to Confirm Order"}</span>
									<ArrowRightIcon className="ml-2 h-4 w-4" />
								</Button>

								<Button
									variant="ghost"
									size="sm"
									onClick={() => router.push("/customer/products")}
									className="w-full text-xs text-muted-foreground hover:text-foreground"
								>
									{locale === "hi" ? "और उत्पाद जोड़ें" : "Continue Shopping"}
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
			)}

			{/* ── CHECKOUT ORDER REVIEW MODAL ────────────────────────────────────── */}
			<Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
					<DialogHeader>
						<DialogTitle className="font-extrabold text-xl flex items-center gap-2">
							<CheckCircle2Icon className="h-5 w-5 text-emerald-600" />
							<span>{locale === "hi" ? "ऑर्डर की समीक्षा व पुष्टि" : "Review & Confirm Your Order"}</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							{locale === "hi"
								? "कृपया सबमिट करने से पहले अपने उत्पादों, मात्राओं और वितरण पते की जांच करें।"
								: "Please verify your items, quantities, and delivery address before final placement."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Customer Details Box */}
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-900/60 text-xs">
							<div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
								<span className="flex items-center gap-1.5">
									<UserIcon className="h-4 w-4 text-emerald-600" />
									<span>{profile?.name || "Customer"}</span>
								</span>
								{profile?.customer_code && (
									<Badge variant="outline" className="font-mono text-[10px]">
										{profile.customer_code}
									</Badge>
								)}
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
								<div className="flex items-center gap-1.5">
									<PhoneIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
									<span>{profile?.phone || "Phone on file"}</span>
								</div>
								<div className="flex items-start gap-1.5">
									<MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-500 mt-0.5" />
									<span className="line-clamp-2">{profile?.address || "Registered Address"}</span>
								</div>
							</div>
						</div>

						{/* Items Summary Table */}
						<div className="rounded-xl border border-border overflow-hidden">
							<div className="bg-muted/50 px-3 py-2 text-xs font-bold text-muted-foreground flex justify-between">
								<span>{locale === "hi" ? "उत्पाद विवरण" : "Product & Quantity"}</span>
								<span>{locale === "hi" ? "राशि" : "Amount"}</span>
							</div>
							<div className="divide-y divide-border/60 max-h-56 overflow-y-auto">
								{items.map((it) => (
									<div
										key={it.id}
										className="px-3 py-2 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/40"
									>
										<div className="min-w-0 flex-1">
											<p className="font-bold text-slate-900 dark:text-slate-100 truncate">
												{it.productName}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{it.quantity} {it.unit} × ₹{it.effectivePrice.toFixed(2)}
												{it.hasActiveOffer && (
													<span className="ml-1 text-emerald-600 font-semibold">
														({it.discountPercent}% off)
													</span>
												)}
											</p>
										</div>
										<span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
											₹{it.itemNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
										</span>
									</div>
								))}
							</div>
							<div className="bg-slate-100/70 dark:bg-slate-900/80 px-3 py-2 text-xs flex justify-between items-center border-t border-border">
								<span className="font-extrabold text-foreground">
									{locale === "hi" ? "कुल अनुमानित राशि:" : "Estimated Payable Amount:"}
								</span>
								<span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
									₹{cart?.estimatedTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</span>
							</div>
						</div>

						{/* Optional Order Notes */}
						<div className="space-y-1.5">
							<Label htmlFor="orderNotes" className="text-xs font-semibold">
								{locale === "hi" ? "विशेष निर्देश / टिप्पणियां (वैकल्पिक)" : "Order Notes / Remarks (Optional)"}
							</Label>
							<Textarea
								id="orderNotes"
								rows={2}
								value={orderNotes}
								onChange={(e) => setOrderNotes(e.target.value)}
								placeholder="e.g. Please deliver before 2 PM, call on arrival..."
								className="text-xs"
							/>
						</div>

						{/* Disclaimer */}
						<div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/30 p-2.5 text-[11px] text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2">
							<AlertCircleIcon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
							<span>
								{locale === "hi"
									? "सबमिट करने पर यह ऑर्डर सीधे बिक्री डैशबोर्ड पर समीक्षा हेतु चला जाएगा। पुष्टि उपरांत वेयरहाउस पिकिंग शुरू होगी।"
									: "Once placed, this order is submitted for Sales review. Upon approval, warehouse picking & dispatch will commence."}
							</span>
						</div>
					</div>

					<DialogFooter className="flex flex-col sm:flex-row items-center gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => setReviewOpen(false)}
							disabled={checkoutMutation.isPending}
							className="w-full sm:w-auto"
						>
							{locale === "hi" ? "वापस कार्ट पर जाएं" : "Back to Cart"}
						</Button>

						<Button
							onClick={handleConfirmAndPlaceOrder}
							disabled={checkoutMutation.isPending}
							className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
						>
							{checkoutMutation.isPending ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									<span>{locale === "hi" ? "ऑर्डर सबमिट हो रहा है..." : "Submitting Order..."}</span>
								</>
							) : (
								<>
									<CheckCircle2Icon className="mr-2 h-4 w-4" />
									<span>{locale === "hi" ? "ऑर्डर कन्फर्म करें" : "Confirm & Place Order"}</span>
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── CLEAR CART CONFIRMATION MODAL ──────────────────────────────────── */}
			<Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
							<Trash2Icon className="h-5 w-5" />
							<span>{locale === "hi" ? "क्या आप कार्ट खाली करना चाहते हैं?" : "Clear Shopping Cart?"}</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							{locale === "hi"
								? "आपकी कार्ट के सभी आइटम हटा दिए जाएंगे। यह क्रिया पूर्ववत नहीं की जा सकती।"
								: "All items currently in your cart will be removed. You can always add them back from the product catalog."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex justify-end gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => setClearConfirmOpen(false)}
							disabled={clearCartMutation.isPending}
						>
							{locale === "hi" ? "रद्द करें" : "Cancel"}
						</Button>
						<Button
							variant="destructive"
							onClick={() => clearCartMutation.mutate()}
							disabled={clearCartMutation.isPending}
						>
							{clearCartMutation.isPending ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : (
								<span>{locale === "hi" ? "हाँ, कार्ट खाली करें" : "Yes, Clear Cart"}</span>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
