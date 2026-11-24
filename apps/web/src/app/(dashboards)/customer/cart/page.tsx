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
	LogInIcon,
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
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRealtimeStock } from "@/hooks/use-realtime-stock";
import { useSession } from "@/hooks/use-session";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function CustomerCartPage() {
	useRealtimeStock();
	const trpc = useTRPC();
	const router = useRouter();
	const locale = useLocale();
	const { session } = useSession();

	// Confirmation & Review Modals
	const [reviewOpen, setReviewOpen] = useState(false);
	const [loginPromptOpen, setLoginPromptOpen] = useState(false);
	const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
	const [orderNotes, setOrderNotes] = useState("");
	const [guestCartMap, setGuestCartMap] = useState<Record<number, any>>({});
	const [placedOrder, setPlacedOrder] = useState<{
		orderId: number;
		orderRef: string;
		totalAmount: number;
	} | null>(null);

	const idempotencyKeyRef = useRef<string | null>(null);
	const isSubmittingRef = useRef(false);

	// Fetch Server-Persistent Cart (only when authenticated)
	const {
		data: cart,
		isLoading: cartLoading,
		refetch: refetchCart,
	} = trpc.customer.getCart.useQuery(undefined, {
		refetchOnWindowFocus: true,
		refetchInterval: 5000,
		enabled: !!session?.user,
	});

	// Load guest cart from localStorage
	useEffect(() => {
		const loadGuestCart = () => {
			if (!session?.user) {
				try {
					const raw = localStorage.getItem("evaluna_guest_cart");
					if (raw) {
						setGuestCartMap(JSON.parse(raw) || {});
					} else {
						setGuestCartMap({});
					}
				} catch (_e) {
					setGuestCartMap({});
				}
			}
		};
		loadGuestCart();
		window.addEventListener("storage", loadGuestCart);
		window.addEventListener("evaluna_cart_updated", loadGuestCart);
		return () => {
			window.removeEventListener("storage", loadGuestCart);
			window.removeEventListener("evaluna_cart_updated", loadGuestCart);
		};
	}, [session?.user]);

	// Fetch Customer Profile for Delivery Details (only when authenticated)
	const { data: profile } = trpc.customer.getMyProfile.useQuery(undefined, {
		enabled: !!session?.user,
	});

	// Mutations
	const utils = trpc.useUtils();

	const addToCartMutation = trpc.customer.addToCart.useMutation({
		onSuccess: () => {
			utils.customer.getCart.invalidate();
		},
	});

	// Auto-merge guest cart into server cart once user logs in
	useEffect(() => {
		if (session?.user) {
			try {
				const raw = localStorage.getItem("evaluna_guest_cart");
				if (raw) {
					const parsed = JSON.parse(raw);
					const items = Object.values(parsed || {}) as any[];
					if (items.length > 0) {
						items.forEach((it) => {
							addToCartMutation.mutate({
								productId: it.productId,
								quantity: it.quantity,
							});
						});
						localStorage.removeItem("evaluna_guest_cart");
						window.dispatchEvent(new Event("evaluna_cart_updated"));
					}
				}
			} catch (_e) {}
		}
	}, [session?.user]);

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

	// Construct guest cart representation
	const guestItems = useMemo(() => {
		return Object.values(guestCartMap || {}).map((item: any) => ({
			id: item.productId,
			productId: item.productId,
			productName: item.name,
			sku: item.sku || null,
			unit: item.unit || "unit",
			originalPrice: Number(item.originalPrice || item.price || 0),
			effectivePrice: Number(item.price || 0),
			quantity: Number(item.quantity || 1),
			lineTotal: Number(
				(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2),
			),
			itemNet: Number(
				(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2),
			),
			discountPercent: 0,
			isAvailable: true,
			availableStock: 9999,
			stockStatus: "in_stock",
			stockBadgeColor: "bg-emerald-500",
			stockBadgeText: "In Stock",
			stockBadgeTextHi: "स्टॉक में उपलब्ध",
			stockWarningText: "",
			stockWarningTextHi: "",
			isStockShortage: false,
			imageUrl: item.image || item.imageUrl || null,
			slabs: item.slabs || [],
			appliedSlab: null,
			hasActiveOffer: false,
			offerReason: "",
		}));
	}, [guestCartMap]);

	const guestSubtotal = useMemo(() => {
		return guestItems.reduce((acc, i) => acc + i.lineTotal, 0);
	}, [guestItems]);

	const guestTax = useMemo(() => {
		return Number((guestSubtotal * 0.05).toFixed(2));
	}, [guestSubtotal]);

	const effectiveCart = session?.user
		? cart
		: {
				items: guestItems,
				itemCount: guestItems.length,
				totalQuantity: guestItems.reduce((acc, i) => acc + i.quantity, 0),
				subtotal: guestSubtotal,
				taxAmount: guestTax,
				taxRatePercent: 5,
				discountTotal: 0,
				estimatedTotal: Number((guestSubtotal + guestTax).toFixed(2)),
				hasStockShortage: false,
				hasUnavailableItems: false,
				hasOutOfStockItems: false,
		  };

	const items = effectiveCart?.items || [];
	const hasItems = items.length > 0;
	const isLoading = session?.user ? cartLoading : false;

	// Handlers
	const handleQtyChange = (productId: number, newQty: number) => {
		if (newQty <= 0) {
			handleRemoveItem(productId);
			return;
		}
		if (session?.user) {
			const item = cart?.items?.find((i) => i.productId === productId);
			const maxAvailable = Number((item as any)?.availableStock ?? 99999);
			if (newQty > maxAvailable) {
				toast.warning(
					locale === "hi"
						? `केवल ${maxAvailable} यूनिट उपलब्ध हैं।`
						: `Only ${maxAvailable} units are currently available.`,
				);
				newQty = maxAvailable;
			}
			updateQtyMutation.mutate({
				productId,
				quantity: Number(Number(newQty).toFixed(3)),
			});
		} else {
			setGuestCartMap((prev) => {
				const clone = { ...prev };
				if (clone[productId]) {
					clone[productId].quantity = Number(Number(newQty).toFixed(3));
				}
				try {
					localStorage.setItem("evaluna_guest_cart", JSON.stringify(clone));
					window.dispatchEvent(new Event("evaluna_cart_updated"));
				} catch (_e) {}
				return clone;
			});
		}
	};

	const handleRemoveItem = (productId: number) => {
		if (session?.user) {
			removeItemMutation.mutate({ productId });
		} else {
			setGuestCartMap((prev) => {
				const clone = { ...prev };
				delete clone[productId];
				try {
					localStorage.setItem("evaluna_guest_cart", JSON.stringify(clone));
					window.dispatchEvent(new Event("evaluna_cart_updated"));
				} catch (_e) {}
				return clone;
			});
			toast.success(
				locale === "hi"
					? "उत्पाद कार्ट से हटा दिया गया!"
					: "Product removed from cart!",
			);
		}
	};

	const handleClearCart = () => {
		if (session?.user) {
			clearCartMutation.mutate();
		} else {
			setGuestCartMap({});
			try {
				localStorage.removeItem("evaluna_guest_cart");
				window.dispatchEvent(new Event("evaluna_cart_updated"));
			} catch (_e) {}
			setClearConfirmOpen(false);
			toast.info(
				locale === "hi"
					? "आपकी कार्ट खाली कर दी गई है।"
					: "Your shopping cart has been cleared.",
			);
		}
	};

	const handleOpenReview = () => {
		if (!session?.user) {
			setLoginPromptOpen(true);
			return;
		}
		if (!hasItems) {
			toast.error(
				locale === "hi"
					? "आपकी कार्ट में कोई उत्पाद नहीं है।"
					: "Your cart is empty.",
			);
			return;
		}
		if (effectiveCart?.hasOutOfStockItems) {
			toast.error(
				locale === "hi"
					? "यह उत्पाद वर्तमान में स्टॉक में नहीं है। कृपया अपनी कार्ट अपडेट करें।"
					: "This product is currently out of stock. Please update your cart.",
			);
			return;
		}
		if (effectiveCart?.hasStockShortage) {
			toast.error(
				locale === "hi"
					? "कार्ट में कुछ आइटम उपलब्ध स्टॉक से अधिक हैं। कृपया मात्रा समायोजित करें।"
					: "Some items in your cart exceed available stock. Please adjust quantities.",
			);
			return;
		}
		if (!idempotencyKeyRef.current) {
			idempotencyKeyRef.current = crypto.randomUUID();
		}
		setReviewOpen(true);
	};

	const handleConfirmAndPlaceOrder = () => {
		if (!session?.user) {
			setLoginPromptOpen(true);
			return;
		}
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
			<PageTransition className="container mx-auto max-w-2xl px-4 py-12">
				<Card className="space-y-6 border-emerald-200 bg-white p-8 text-center shadow-xl dark:border-emerald-900/60 dark:bg-slate-900">
					<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner dark:bg-emerald-950/60 dark:text-emerald-400">
						<CheckCircle2Icon className="zoom-in-75 h-10 w-10 animate-in duration-300" />
					</div>

					<div className="space-y-2">
						<Badge className="bg-emerald-600 px-3 py-1 font-extrabold text-white text-xs">
							{locale === "hi" ? "ऑर्डर सफलतापूर्वक सबमिट" : "ORDER SUBMITTED"}
						</Badge>
						<h1 className="font-extrabold text-2xl text-slate-900 sm:text-3xl dark:text-slate-100">
							{locale === "hi"
								? "ऑर्डर प्राप्त हुआ!"
								: "Order Placed Successfully!"}
						</h1>
						<p className="mx-auto max-w-md text-muted-foreground text-sm">
							{locale === "hi"
								? "आपका ऑर्डर हमारी बिक्री टीम को सत्यापन और बिलिंग के लिए भेज दिया गया है।"
								: "Your order has been submitted for Sales review and inventory allocation."}
						</p>
					</div>

					<div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left dark:border-slate-800 dark:bg-slate-950">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								{locale === "hi" ? "ऑर्डर संदर्भ संख्या:" : "Order Reference:"}
							</span>
							<span className="font-bold font-mono text-slate-900 dark:text-slate-100">
								{placedOrder.orderRef}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								{locale === "hi"
									? "अनुमानित कुल राशि:"
									: "Estimated Order Total:"}
							</span>
							<span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
								₹
								{placedOrder.totalAmount.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								{locale === "hi" ? "स्थिति:" : "Current Status:"}
							</span>
							<span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
								<span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
								{locale === "hi"
									? "बिक्री पुष्टि लंबित (Pending Review)"
									: "Pending Sales Review"}
							</span>
						</div>
					</div>

					<div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
						<Button
							onClick={() => router.push("/customer/orders")}
							className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700 sm:w-auto"
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
		<PageTransition className="container mx-auto space-y-6 px-4 pb-24 sm:px-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-3 border-border/60 border-b pb-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<Link
							href="/customer/products"
							className="text-muted-foreground transition-colors hover:text-foreground"
							title="Back to Catalog"
						>
							<ArrowLeftIcon className="h-5 w-5" />
						</Link>
						<h1 className="flex items-center gap-2 font-extrabold text-foreground text-xl tracking-tight sm:text-2xl">
							<ShoppingCartIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
							<span>{locale === "hi" ? "शॉपिंग कार्ट" : "Shopping Cart"}</span>
							{hasItems && (
								<span className="font-semibold text-muted-foreground text-sm">
									({effectiveCart?.itemCount}{" "}
									{effectiveCart?.itemCount === 1 ? "item" : "items"})
								</span>
							)}
						</h1>
					</div>
					<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
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
						className="h-9 gap-1.5 font-semibold text-xs"
					>
						<ArrowLeftIcon className="h-3.5 w-3.5" />
						<span>
							{locale === "hi" ? "उत्पाद ब्राउज़ करें" : "Continue Shopping"}
						</span>
					</Button>

					{hasItems && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setClearConfirmOpen(true)}
							className="h-9 gap-1 text-rose-600 text-xs hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
						>
							<Trash2Icon className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">
								{locale === "hi" ? "कार्ट साफ करें" : "Clear Cart"}
							</span>
						</Button>
					)}
				</div>
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
					<Loader2Icon className="h-8 w-8 animate-spin text-emerald-600" />
					<p className="font-medium text-sm">
						{locale === "hi"
							? "आपकी कार्ट लोड हो रही है..."
							: "Loading your saved shopping cart..."}
					</p>
				</div>
			)}

			{/* Empty Cart State */}
			{!isLoading && !hasItems && (
				<Card className="border-2 border-dashed bg-card p-12 text-center shadow-xs">
					<CardContent className="flex flex-col items-center justify-center gap-4 py-8">
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 shadow-inner dark:bg-slate-800 dark:text-slate-500">
							<ShoppingCartIcon className="h-10 w-10 opacity-70" />
						</div>
						<div className="space-y-1">
							<h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
								{locale === "hi" ? "आपकी कार्ट खाली है" : "Your cart is empty"}
							</h3>
							<p className="mx-auto max-w-sm text-muted-foreground text-xs">
								{locale === "hi"
									? "हमारे उत्पाद कैटलॉग को ब्राउज़ करें और अपनी कार्ट में आइटम जोड़ें।"
									: "Browse our products and add items to your cart. All selections stay saved across visits."}
							</p>
						</div>
						<Button
							onClick={() => router.push("/customer/products")}
							className="mt-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
						>
							<PackageIcon className="mr-2 h-4 w-4" />
							{locale === "hi"
								? "उत्पाद देखें (Explore Products)"
								: "Explore Products"}
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Cart Layout: Items List + Summary Panel */}
			{!isLoading && hasItems && (
				<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
					{/* Left Column: Cart Items List */}
					<div className="space-y-4 lg:col-span-8">
						{Boolean((cart as any)?.hasOutOfStockItems) && (
							<div className="flex items-center gap-2.5 rounded-xl border border-red-300 bg-red-50 p-3.5 text-red-800 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
								<AlertCircleIcon className="h-5 w-5 shrink-0 text-red-600" />
								<div className="font-semibold text-xs sm:text-sm">
									{locale === "hi"
										? "आपकी कार्ट में कुछ उत्पाद वर्तमान में स्टॉक में नहीं हैं। कृपया चेकआउट करने से पहले अपनी कार्ट अपडेट करें।"
										: "This product is currently out of stock. Please update your cart before proceeding to checkout."}
								</div>
							</div>
						)}

						{items.map((item) => {
							const hasOffer = Boolean(item.hasActiveOffer);
							const isOutOfStock = Boolean(
								(item as any).isOutOfStock ||
									Number((item as any).availableStock ?? 0) <= 0,
							);
							const hasShortage = Boolean(item.isStockShortage);

							return (
								<Card
									key={item.id}
									className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
										isOutOfStock
											? "border-red-400 bg-red-50/20 dark:border-red-900/60 dark:bg-red-950/20"
											: hasShortage
												? "border-amber-300 dark:border-amber-800"
												: "border-border/70 hover:border-slate-300 dark:hover:border-slate-700"
									}`}
								>
									<div className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
										{/* Item Info & Image */}
										<div className="flex min-w-0 flex-1 items-center gap-3.5">
											{/* Product Photo Box */}
											<div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1.5 shadow-inner sm:h-24 sm:w-24 dark:border-slate-800 dark:bg-slate-900">
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
														className="px-1.5 py-0 font-medium text-[9px]"
													>
														{item.category}
													</Badge>
													{item.sku && (
														<span className="font-mono text-[10px] text-muted-foreground">
															SKU: {item.sku}
														</span>
													)}
													{hasOffer && (
														<Badge className="gap-0.5 bg-gradient-to-r from-amber-500 to-red-600 px-1.5 py-0 font-extrabold text-[9px] text-white">
															<FlameIcon className="h-2.5 w-2.5" />
															<span>{item.discountPercent}% OFF</span>
														</Badge>
													)}
												</div>

												<h3 className="line-clamp-1 font-bold text-slate-900 text-sm leading-snug sm:text-base dark:text-slate-100">
													{item.productName}
												</h3>

												{/* Price Display */}
												<div className="flex items-baseline gap-1.5 text-xs">
													{item.originalPrice > item.effectivePrice && (
														<span className="font-medium text-[11px] text-muted-foreground line-through">
															₹{item.originalPrice.toFixed(2)}
														</span>
													)}
													<span className="font-bold text-slate-900 sm:text-sm dark:text-slate-100">
														₹{item.effectivePrice.toFixed(2)}
													</span>
													<span className="text-[11px] text-muted-foreground">
														/ {item.unit}
													</span>
													{item.offerReason && (
														<span className="hidden font-semibold text-[10px] text-emerald-600 sm:inline dark:text-emerald-400">
															({item.offerReason})
														</span>
													)}
												</div>

												{/* Availability & Stock Warning */}
												{isOutOfStock ? (
													<div className="mt-1 flex items-center gap-1.5 rounded border border-red-300 bg-red-100/70 p-1.5 font-bold text-red-600 text-xs dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
														<AlertCircleIcon className="h-3.5 w-3.5 shrink-0 text-red-600" />
														<span>
															{locale === "hi"
																? "यह उत्पाद वर्तमान में स्टॉक में नहीं है। कृपया अपनी कार्ट से हटाएं।"
																: "This product is currently out of stock. Please update your cart."}
														</span>
													</div>
												) : hasShortage ? (
													<div className="mt-1 flex items-center gap-1 font-semibold text-[11px] text-amber-700 dark:text-amber-400">
														<AlertTriangleIcon className="h-3 w-3 shrink-0" />
														<span>
															{locale === "hi"
																? `वर्तमान उपलब्ध स्टॉक (${(item as any).availableStock ?? item.inStock} ${item.unit}) से अधिक चुनी गई मात्रा`
																: `Only ${(item as any).availableStock ?? item.inStock} ${item.unit} available. Please adjust quantity.`}
														</span>
													</div>
												) : (item as any).stockWarningText ? (
													<div className="mt-1 flex items-center gap-1 font-semibold text-[11px] text-amber-700 dark:text-amber-400">
														<AlertTriangleIcon className="h-3 w-3 shrink-0" />
														<span>
															{locale === "hi"
																? (item as any).stockWarningTextHi
																: (item as any).stockWarningText}
														</span>
													</div>
												) : null}
											</div>
										</div>

										{/* Quantity Controls & Line Total */}
										<div className="flex w-full shrink-0 items-center justify-between gap-3 border-t pt-3 sm:w-auto sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
											{/* Line Total */}
											<div className="text-left sm:text-right">
												<div className="text-[11px] text-muted-foreground">
													{locale === "hi" ? "आइटम योग:" : "Item Total:"}
												</div>
												<div className="font-extrabold text-base text-emerald-700 sm:text-lg dark:text-emerald-400">
													₹
													{item.itemNet.toLocaleString(undefined, {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</div>
												{item.itemDiscount > 0 && (
													<div className="font-semibold text-[10px] text-emerald-600 dark:text-emerald-400">
														Save ₹{item.itemDiscount.toFixed(2)}
													</div>
												)}
											</div>

											{/* Quantity Selector & Remove */}
											<div className="flex items-center gap-2">
												<div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xs dark:border-slate-700 dark:bg-slate-900">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800"
														onClick={() =>
															handleQtyChange(item.productId, item.quantity - 1)
														}
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
															const val = Number.parseFloat(e.target.value);
															if (!isNaN(val) && val > 0) {
																handleQtyChange(item.productId, val);
															}
														}}
														className="h-8 w-14 border-0 bg-transparent text-center font-bold text-xs focus:outline-none focus:ring-0"
													/>

													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800"
														onClick={() =>
															handleQtyChange(item.productId, item.quantity + 1)
														}
														title="Increase quantity"
													>
														<PlusIcon className="h-3.5 w-3.5" />
													</Button>
												</div>

												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleRemoveItem(item.productId)
													}
													className="h-8 w-8 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
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
					<div className="sticky top-20 space-y-4 lg:col-span-4">
						<Card className="border-border/80 bg-card shadow-md">
							<CardHeader className="border-border/50 border-b p-4 pb-3">
								<CardTitle className="flex items-center justify-between font-extrabold text-base">
									<span>
										{locale === "hi" ? "ऑर्डर सारांश" : "Order Summary"}
									</span>
									<span className="font-normal text-muted-foreground text-xs">
										{effectiveCart?.itemCount}{" "}
										{effectiveCart?.itemCount === 1 ? "Product" : "Products"}
									</span>
								</CardTitle>
							</CardHeader>

							<CardContent className="space-y-3 p-4 text-sm">
								<div className="flex items-center justify-between text-muted-foreground">
									<span>
										{locale === "hi"
											? "कुल मात्रा (Total Qty):"
											: "Total Quantity:"}
									</span>
									<span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
										{effectiveCart?.totalQuantity} Units
									</span>
								</div>

								<div className="flex items-center justify-between text-muted-foreground">
									<span>
										{locale === "hi" ? "उप-योग (Subtotal):" : "Cart Subtotal:"}
									</span>
									<span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
										₹
										{effectiveCart?.subtotal?.toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>

								{(effectiveCart?.discountTotal ?? 0) > 0 && (
									<div className="flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
										<span className="flex items-center gap-1">
											<FlameIcon className="h-3.5 w-3.5" />
											<span>
												{locale === "hi" ? "ऑफर/स्लैब छूट:" : "Discounts Saved:"}
											</span>
										</span>
										<span className="font-mono">
											-₹
											{effectiveCart?.discountTotal?.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</span>
									</div>
								)}

								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>
										{locale === "hi" ? "लागू जीएसटी (GST):" : "Estimated GST:"}
									</span>
									<span className="font-medium italic">
										{locale === "hi" ? "बिक्री बिलिंग अनुसार" : "As per ERP rules"}
									</span>
								</div>

								<div className="flex items-baseline justify-between border-border/60 border-t pt-3">
									<div>
										<span className="font-extrabold text-base text-foreground">
											{locale === "hi" ? "अनुमानित कुल:" : "Estimated Total:"}
										</span>
										<p className="text-[10px] text-muted-foreground">
											{locale === "hi"
												? "अंतिम बिलिंग पर पुष्टि होगी"
												: "Subject to Sales confirmation"}
										</p>
									</div>
									<span className="font-extrabold font-mono text-emerald-700 text-xl sm:text-2xl dark:text-emerald-400">
										₹
										{effectiveCart?.estimatedTotal?.toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
								</div>

								{/* Delivery notice */}
								<div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-muted-foreground text-xs dark:border-slate-800 dark:bg-slate-900/60">
									<div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
										<TruckIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
										<span>
											{locale === "hi"
												? "डिलीवरी व बिलिंग"
												: "Delivery & Billing"}
										</span>
									</div>
									<p className="text-[11px] leading-relaxed">
										{locale === "hi"
											? "ऑर्डर सीधे आपकी पंजीकृत दुकान पर डिलीवर होगा। बिक्री टीम द्वारा पुष्टि के बाद बिल तैयार होगा।"
											: "Free delivery to your registered address. Invoice generated upon Sales team approval."}
									</p>
								</div>
							</CardContent>

							<CardFooter className="flex flex-col gap-2 p-4 pt-0">
								<Button
									size="lg"
									onClick={handleOpenReview}
									disabled={
										!hasItems ||
										checkoutMutation.isPending ||
										Boolean((cart as any)?.hasOutOfStockItems) ||
										Boolean((cart as any)?.hasStockShortage)
									}
									className={`h-11 w-full font-extrabold text-sm shadow-md ${
										(cart as any)?.hasOutOfStockItems
											? "cursor-not-allowed bg-red-600 text-white opacity-90 hover:bg-red-700"
											: "bg-emerald-600 text-white hover:bg-emerald-700"
									}`}
								>
									{(cart as any)?.hasOutOfStockItems ? (
										<span className="flex items-center gap-1.5">
											<AlertCircleIcon className="h-4 w-4" />
											<span>
												{locale === "hi"
													? "आउट ऑफ स्टॉक आइटम हटाएं"
													: "Update Cart to Checkout"}
											</span>
										</span>
									) : (
										<>
											<span>
												{locale === "hi"
													? "ऑर्डर की पुष्टि करें"
													: "Proceed to Confirm Order"}
											</span>
											<ArrowRightIcon className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>

								<Button
									variant="ghost"
									size="sm"
									onClick={() => router.push("/customer/products")}
									className="w-full text-muted-foreground text-xs hover:text-foreground"
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
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-6">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-extrabold text-xl">
							<CheckCircle2Icon className="h-5 w-5 text-emerald-600" />
							<span>
								{locale === "hi"
									? "ऑर्डर की समीक्षा व पुष्टि"
									: "Review & Confirm Your Order"}
							</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							{locale === "hi"
								? "कृपया सबमिट करने से पहले अपने उत्पादों, मात्राओं और वितरण पते की जांच करें।"
								: "Please verify your items, quantities, and delivery address before final placement."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Customer Details Box */}
						<div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
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

							<div className="grid grid-cols-1 gap-2 border-slate-200/60 border-t pt-1 text-muted-foreground sm:grid-cols-2 dark:border-slate-800/60">
								<div className="flex items-center gap-1.5">
									<PhoneIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
									<span>{profile?.phone || "Phone on file"}</span>
								</div>
								<div className="flex items-start gap-1.5">
									<MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
									<span className="line-clamp-2">
										{profile?.address || "Registered Address"}
									</span>
								</div>
							</div>
						</div>

						{/* Items Summary Table */}
						<div className="overflow-hidden rounded-xl border border-border">
							<div className="flex justify-between bg-muted/50 px-3 py-2 font-bold text-muted-foreground text-xs">
								<span>
									{locale === "hi" ? "उत्पाद विवरण" : "Product & Quantity"}
								</span>
								<span>{locale === "hi" ? "राशि" : "Amount"}</span>
							</div>
							<div className="max-h-56 divide-y divide-border/60 overflow-y-auto">
								{items.map((it) => (
									<div
										key={it.id}
										className="flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900/40"
									>
										<div className="min-w-0 flex-1">
											<p className="truncate font-bold text-slate-900 dark:text-slate-100">
												{it.productName}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{it.quantity} {it.unit} × ₹
												{it.effectivePrice.toFixed(2)}
												{it.hasActiveOffer && (
													<span className="ml-1 font-semibold text-emerald-600">
														({it.discountPercent}% off)
													</span>
												)}
											</p>
										</div>
										<span className="shrink-0 font-bold font-mono text-slate-900 dark:text-slate-100">
											₹
											{it.itemNet.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</span>
									</div>
								))}
							</div>
							<div className="flex items-center justify-between border-border border-t bg-slate-100/70 px-3 py-2 text-xs dark:bg-slate-900/80">
								<span className="font-extrabold text-foreground">
									{locale === "hi"
										? "कुल अनुमानित राशि:"
										: "Estimated Payable Amount:"}
								</span>
								<span className="font-extrabold font-mono text-emerald-600 text-sm dark:text-emerald-400">
									₹
									{effectiveCart?.estimatedTotal?.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						</div>

						{/* Optional Order Notes */}
						<div className="space-y-1.5">
							<Label htmlFor="orderNotes" className="font-semibold text-xs">
								{locale === "hi"
									? "विशेष निर्देश / टिप्पणियां (वैकल्पिक)"
									: "Order Notes / Remarks (Optional)"}
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
						<div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/70 p-2.5 text-[11px] text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
							<AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
							<span>
								{locale === "hi"
									? "सबमिट करने पर यह ऑर्डर सीधे बिक्री डैशबोर्ड पर समीक्षा हेतु चला जाएगा। पुष्टि उपरांत वेयरहाउस पिकिंग शुरू होगी।"
									: "Once placed, this order is submitted for Sales review. Upon approval, warehouse picking & dispatch will commence."}
							</span>
						</div>
					</div>

					<DialogFooter className="flex flex-col items-center gap-2 pt-2 sm:flex-row">
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
							className="w-full bg-emerald-600 font-extrabold text-white hover:bg-emerald-700 sm:w-auto"
						>
							{checkoutMutation.isPending ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									<span>
										{locale === "hi"
											? "ऑर्डर सबमिट हो रहा है..."
											: "Submitting Order..."}
									</span>
								</>
							) : (
								<>
									<CheckCircle2Icon className="mr-2 h-4 w-4" />
									<span>
										{locale === "hi"
											? "ऑर्डर कन्फर्म करें"
											: "Confirm & Place Order"}
									</span>
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
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-rose-600">
							<Trash2Icon className="h-5 w-5" />
							<span>
								{locale === "hi"
									? "क्या आप कार्ट खाली करना चाहते हैं?"
									: "Clear Shopping Cart?"}
							</span>
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
							onClick={handleClearCart}
							disabled={clearCartMutation.isPending}
						>
							{clearCartMutation.isPending ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : (
								<span>
									{locale === "hi" ? "हाँ, कार्ट खाली करें" : "Yes, Clear Cart"}
								</span>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Login Required Modal for Guest Checkout */}
			<Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
				<DialogContent className="max-w-md p-6">
					<DialogHeader>
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-2">
							<ShoppingCartIcon className="h-6 w-6" />
						</div>
						<DialogTitle className="text-center font-serif text-xl sm:text-2xl">
							{locale === "hi"
								? "ऑर्डर पूरा करने के लिए लॉग इन करें"
								: "Sign In to Complete Order"}
						</DialogTitle>
						<p className="text-center text-sm text-muted-foreground pt-1">
							{locale === "hi"
								? "थोक दरों पर ऑर्डर सबमिट करने, GST इनवॉइस प्राप्त करने और डिलीवरी शेड्यूल करने के लिए अपने खाते में लॉग इन करें या नया बिज़नेस खाता बनाएं। आपके कार्ट का सामान सुरक्षित है!"
								: "Please sign in or register your verified business account to complete your wholesale order, receive a GST invoice, and schedule fast delivery. Your selected items are saved in your cart!"}
						</p>
					</DialogHeader>

					<div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs space-y-2">
						<div className="flex justify-between font-medium">
							<span>{locale === "hi" ? "कार्ट कुल वस्तुएं:" : "Total Items in Cart:"}</span>
							<span className="font-bold text-foreground">
								{effectiveCart?.itemCount ?? 0} {locale === "hi" ? "आइटम" : "items"} ({effectiveCart?.totalQuantity ?? 0} {locale === "hi" ? "यूनिट" : "units"})
							</span>
						</div>
						<div className="flex justify-between font-medium">
							<span>{locale === "hi" ? "कुल अनुमानित राशि:" : "Estimated Payable:"}</span>
							<span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
								₹{Number(effectiveCart?.estimatedTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</span>
						</div>
					</div>

					<DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2.5">
						<Button
							variant="outline"
							className="w-full sm:w-1/2"
							onClick={() => {
								setLoginPromptOpen(false);
								router.push(`/signup?callbackUrl=${encodeURIComponent("/customer/cart")}`);
							}}
						>
							{locale === "hi" ? "नया खाता बनाएं" : "Register Business"}
						</Button>
						<Button
							className="w-full sm:w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
							onClick={() => {
								setLoginPromptOpen(false);
								router.push(`/login?callbackUrl=${encodeURIComponent("/customer/cart")}`);
							}}
						>
							<LogInIcon className="mr-2 h-4 w-4" />
							{locale === "hi" ? "लॉग इन करें" : "Sign In & Order"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
