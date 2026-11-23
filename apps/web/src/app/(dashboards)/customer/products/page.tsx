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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
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
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
	FlameIcon,
	LayersIcon,
	Loader2Icon,
	MapPinIcon,
	MinusIcon,
	PackageIcon,
	PhoneIcon,
	PlusIcon,
	SearchIcon,
	ShoppingBagIcon,
	SparklesIcon,
	TagIcon,
	Trash2Icon,
	TruckIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRealtimeStock } from "@/hooks/use-realtime-stock";
import { PageTransition } from "@/lib/animations";
import {
	calculateEffectivePrice,
	findMatchingSlab,
	getOfferCountdown,
	isQuantityInSlab,
	type PricingSlab,
} from "@/lib/pricing/slab-pricing";
import { useTRPC } from "@/lib/trpc/client";

type CartItem = {
	productId: number;
	name: string;
	sku: string | null;
	unit: string | null;
	price: number;
	quantity: number;
};

function getNextDecrement(current: number): number {
	if (current > 1) {
		const intPart = Math.floor(current);
		if (current - intPart > 0.001) {
			return Number(intPart.toFixed(3));
		}
		return Number((current - 1).toFixed(3));
	}
	if (current > 0.5) {
		return 0.5;
	}
	if (current > 0.25) {
		return 0.25;
	}
	return 0.1;
}

function getNextIncrement(current: number): number {
	if (current < 1) {
		if (current < 0.25) return 0.25;
		if (current < 0.5) return 0.5;
		return 1;
	}
	return Number((current + 1).toFixed(3));
}

function DecimalQuantityInput({
	value,
	onChange,
	onRemove,
	disabled = false,
	className = "",
}: {
	value: number;
	onChange: (val: number) => void;
	onRemove?: () => void;
	disabled?: boolean;
	className?: string;
}) {
	const [text, setText] = useState<string>(() => String(value));
	const isFocusedRef = useRef(false);

	useEffect(() => {
		if (!isFocusedRef.current) {
			setText(String(value));
		}
	}, [value]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value;
		setText(raw);
		const parsed = Number.parseFloat(raw);
		if (!isNaN(parsed) && parsed > 0) {
			onChange(Number(parsed.toFixed(3)));
		}
	};

	const handleBlur = () => {
		isFocusedRef.current = false;
		const parsed = Number.parseFloat(text);
		if (isNaN(parsed) || parsed <= 0) {
			if (onRemove && (parsed === 0 || text === "0")) {
				onRemove();
			} else {
				setText(String(value || 1));
				onChange(value || 1);
			}
		} else {
			const clean = Number(parsed.toFixed(3));
			setText(String(clean));
			onChange(clean);
		}
	};

	return (
		<Input
			type="text"
			inputMode="decimal"
			value={text}
			disabled={disabled}
			onChange={handleInputChange}
			onFocus={() => {
				isFocusedRef.current = true;
			}}
			onBlur={handleBlur}
			className={className}
		/>
	);
}

export default function CustomerProductsPage() {
	useRealtimeStock();
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const router = useRouter();
	const locale = useLocale();

	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<string>("all");
	const [cart, setCart] = useState<Record<number, CartItem>>({});
	const [quantities, setQuantities] = useState<Record<number, number | string>>(
		{},
	);
	const [reviewOpen, setReviewOpen] = useState(false);
	const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
	const submittingRef = useRef(false);
	const idempotencyKeyRef = useRef<string | null>(null);

	const {
		data: products,
		isLoading,
		error,
	} = trpc.customer.browseProducts.useQuery(
		{
			search: search.trim() || undefined,
			category: category !== "all" ? category : undefined,
		},
		{
			refetchInterval: 5000,
		},
	);

	// Persistent server-side cart synchronization
	const { data: serverCart } = trpc.customer.getCart.useQuery(undefined, {
		refetchInterval: 5000,
	});

	useEffect(() => {
		if (serverCart?.items) {
			const map: Record<number, CartItem> = {};
			for (const item of serverCart.items) {
				map[item.productId] = {
					productId: item.productId,
					name: item.productName,
					sku: item.sku,
					unit: item.unit,
					price: item.effectivePrice,
					quantity: item.quantity,
					originalPrice: item.originalPrice,
				};
			}
			setCart(map);
		}
	}, [serverCart]);

	const addToCartMutation = trpc.customer.addToCart.useMutation({
		onSuccess: () => {
			utils.customer.getCart.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to add to cart");
			utils.customer.getCart.invalidate();
		},
	});

	const updateCartQtyMutation =
		trpc.customer.updateCartItemQuantity.useMutation({
			onSuccess: () => {
				utils.customer.getCart.invalidate();
			},
			onError: (err) => {
				toast.error(err.message || "Failed to update item quantity");
				utils.customer.getCart.invalidate();
			},
		});

	const removeFromCartMutation = trpc.customer.removeFromCart.useMutation({
		onSuccess: () => {
			utils.customer.getCart.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to remove item");
			utils.customer.getCart.invalidate();
		},
	});

	const clearCartMutation = trpc.customer.clearCart.useMutation({
		onSuccess: () => {
			utils.customer.getCart.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to clear cart");
			utils.customer.getCart.invalidate();
		},
	});

	const categories = useMemo(() => {
		const set = new Set<string>();
		(products ?? []).forEach((p) => {
			if (p.category) set.add(p.category);
		});
		return Array.from(set);
	}, [products]);

	const productsWithDeals = useMemo(
		() => (products ?? []).filter((p) => p.hasActiveOffer),
		[products],
	);

	const cartItemsList = useMemo(() => Object.values(cart), [cart]);
	const totalCartCount = useMemo(
		() =>
			Number(
				cartItemsList.reduce((sum, item) => sum + item.quantity, 0).toFixed(3),
			),
		[cartItemsList],
	);
	const totalCartAmount = useMemo(
		() =>
			cartItemsList.reduce(
				(sum, item) => sum + item.quantity * (item.price || 0),
				0,
			),
		[cartItemsList],
	);

	const getCardQty = (pid: number): number => {
		if (cart[pid]) return cart[pid].quantity;
		const raw = quantities[pid];
		if (raw === undefined || raw === "") return 1;
		const parsed = typeof raw === "number" ? raw : Number.parseFloat(raw);
		return isNaN(parsed) || parsed <= 0 ? 1 : Number(parsed.toFixed(3));
	};

	const setQty = (pid: number, val: number | string) => {
		setQuantities((prev) => ({
			...prev,
			[pid]:
				typeof val === "string" ? val : Math.max(0.001, Number(val.toFixed(3))),
		}));
	};

	const handleCardQtyChange = (product: any, val: number) => {
		const availStock = Number(product.availableStock ?? 99999);
		if (product.stockStatus === "out_of_stock" || availStock <= 0) {
			toast.error(
				locale === "hi"
					? "यह उत्पाद वर्तमान में स्टॉक में नहीं है।"
					: "This product is currently out of stock.",
			);
			return;
		}
		if (val > availStock) {
			toast.warning(
				locale === "hi"
					? `केवल ${availStock} यूनिट उपलब्ध हैं।`
					: `Only ${availStock} units are currently available.`,
			);
			val = availStock;
		}
		if (cart[product.id]) {
			if (val <= 0) {
				handleRemoveFromCart(product.id);
			} else {
				updateCartQty(product.id, val);
			}
		} else {
			setQty(product.id, val);
		}
	};

	const handleCardIncrement = (product: any) => {
		const availStock = Number(product.availableStock ?? 99999);
		if (product.stockStatus === "out_of_stock" || availStock <= 0) {
			toast.error(
				locale === "hi"
					? "यह उत्पाद वर्तमान में स्टॉक में नहीं है।"
					: "This product is currently out of stock.",
			);
			return;
		}
		const current = getCardQty(product.id);
		const next = getNextIncrement(current);
		if (next > availStock) {
			toast.warning(
				locale === "hi"
					? `केवल ${availStock} यूनिट उपलब्ध हैं।`
					: `Only ${availStock} units are currently available.`,
			);
			return;
		}
		if (cart[product.id]) {
			updateCartQty(product.id, next);
		} else {
			setQty(product.id, next);
		}
	};

	const handleCardDecrement = (product: any) => {
		const current = getCardQty(product.id);
		if (current <= 0.1) return;
		const next = getNextDecrement(current);
		if (cart[product.id]) {
			updateCartQty(product.id, next);
		} else {
			setQty(product.id, next);
		}
	};

	const handleAddToCart = (product: any) => {
		const availStock = Number(product.availableStock ?? 0);
		if (product.stockStatus === "out_of_stock" || availStock <= 0) {
			toast.error(
				locale === "hi"
					? "यह उत्पाद वर्तमान में अनुपलब्ध है। स्टॉक आने पर उपलब्ध होगा।"
					: "Currently unavailable. This product will be available once stock is replenished.",
			);
			return;
		}
		const qtyToAdd = getCardQty(product.id);
		if (qtyToAdd > availStock) {
			toast.warning(
				locale === "hi"
					? `केवल ${availStock} यूनिट उपलब्ध हैं।`
					: `Only ${availStock} units are currently available.`,
			);
			return;
		}
		let finalPrice = product.price || 0;
		if (product.slabs && product.slabs.length > 0) {
			const slabCalc = calculateEffectivePrice({
				regularPrice: product.originalPrice || product.price,
				slabs: product.slabs,
				quantity: qtyToAdd,
			});
			if (slabCalc.isSlabApplied) {
				finalPrice = slabCalc.unitPrice;
			}
		}
		setCart((prev) => ({
			...prev,
			[product.id]: {
				productId: product.id,
				name: product.name,
				sku: product.sku,
				unit: product.unit,
				price: finalPrice,
				quantity: qtyToAdd,
				slabs: product.slabs,
				originalPrice: product.originalPrice || product.price,
			},
		}));
		addToCartMutation.mutate({
			productId: product.id,
			quantity: qtyToAdd,
		});
		toast.success(
			locale === "hi"
				? `${product.name} (${qtyToAdd}) कार्ट में जोड़ा गया!`
				: `Added ${product.name} (${qtyToAdd}) to cart!`,
		);
	};

	const updateCartQty = (pid: number, val: number | string) => {
		let finalQty: number;
		if (typeof val === "string") {
			const p = Number.parseFloat(val);
			finalQty = isNaN(p) || p <= 0 ? 0.001 : Number(p.toFixed(3));
		} else {
			finalQty = Math.max(0.001, Number(val.toFixed(3)));
		}

		setCart((prev) => {
			if (!prev[pid]) return prev;
			const item = prev[pid];
			let effectivePrice = item.price;
			if ((item as any).slabs && (item as any).slabs.length > 0) {
				const slabCalc = calculateEffectivePrice({
					regularPrice: (item as any).originalPrice || item.price,
					slabs: (item as any).slabs,
					quantity: finalQty,
				});
				if (slabCalc.isSlabApplied) {
					effectivePrice = slabCalc.unitPrice;
				}
			}
			return {
				...prev,
				[pid]: {
					...item,
					price: effectivePrice,
					quantity: finalQty,
				},
			};
		});

		updateCartQtyMutation.mutate({
			productId: pid,
			quantity: finalQty,
		});
	};

	const handleCartIncrement = (pid: number) => {
		const item = cart[pid];
		if (!item) return;
		const next = getNextIncrement(item.quantity);
		updateCartQty(pid, next);
	};

	const handleCartDecrement = (pid: number) => {
		const item = cart[pid];
		if (!item || item.quantity <= 0.1) return;
		const next = getNextDecrement(item.quantity);
		updateCartQty(pid, next);
	};

	const handleRemoveFromCart = (pid: number) => {
		setCart((prev) => {
			const clone = { ...prev };
			delete clone[pid];
			return clone;
		});
		removeFromCartMutation.mutate({ productId: pid });
	};

	const handleClearCart = () => {
		setCart({});
		clearCartMutation.mutate();
	};

	const { data: profile } = trpc.customer.getMyProfile.useQuery();
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");

	useEffect(() => {
		if (profile) {
			setPhone(profile.phone || "");
			setAddress(profile.address || "");
		}
	}, [profile]);

	const updateProfileMutation = trpc.customer.updateMyProfile.useMutation({
		onError: (err) => {
			toast.error(
				err.message ||
					(locale === "hi"
						? "प्रोफ़ाइल अपडेट करने में विफल।"
						: "Failed to save profile."),
			);
		},
	});

	const submitOrderMutation = trpc.customer.submitOrder.useMutation({
		onSuccess: () => {
			setCart({});
			utils.customer.getCart.invalidate();
			setReviewOpen(false);
			setIsSubmittingLocal(false);
			submittingRef.current = false;
			idempotencyKeyRef.current = null;
			toast.success(
				locale === "hi"
					? "ऑर्डर सफलतापूर्वक सबमिट किया गया!"
					: "Order submitted successfully for sales review!",
			);
			router.push("/customer/orders");
		},
		onError: (err) => {
			setIsSubmittingLocal(false);
			submittingRef.current = false;
			toast.error(
				err.message ||
					(locale === "hi"
						? "ऑर्डर सबमिट करने में विफल।"
						: "Failed to submit order."),
			);
		},
	});

	const isSubmitting =
		isSubmittingLocal ||
		submitOrderMutation.isPending ||
		updateProfileMutation.isPending;

	const handleSubmitOrder = async () => {
		if (submittingRef.current || isSubmitting) return;
		if (cartItemsList.length === 0) return;

		const cleanPhone = phone.trim();
		const cleanAddress = address.trim();

		if (cleanPhone.length < 10) {
			toast.error(
				locale === "hi"
					? "कृपया एक वैध फ़ोन नंबर दर्ज करें (न्यूनतम 10 अंक)"
					: "Please enter a valid phone number (min 10 digits).",
			);
			return;
		}
		if (cleanAddress.length < 5) {
			toast.error(
				locale === "hi"
					? "कृपया एक वैध वितरण पता दर्ज करें (न्यूनतम 5 वर्ण)"
					: "Please enter a valid delivery address (min 5 characters).",
			);
			return;
		}

		// Immediate synchronous lock
		submittingRef.current = true;
		setIsSubmittingLocal(true);

		try {
			// Save phone & address permanently to profile first
			await updateProfileMutation.mutateAsync({
				name: profile?.name || "Customer",
				phone: cleanPhone,
				address: cleanAddress,
			});

			// Now submit the order with stable session key
			const idempotencyKey = idempotencyKeyRef.current || crypto.randomUUID();
			idempotencyKeyRef.current = idempotencyKey;

			await submitOrderMutation.mutateAsync({
				idempotencyKey,
				items: cartItemsList.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
				})),
			});
		} catch (_err) {
			submittingRef.current = false;
			setIsSubmittingLocal(false);
			// handled by mutation onError
		}
	};

	const t = {
		title: locale === "hi" ? "उत्पाद और ऑर्डर देना" : "Products & Place Order",
		subtitle:
			locale === "hi"
				? "उपलब्ध कैटलॉग ब्राउज़ करें, मात्राएँ चुनें और बिक्री समीक्षा के लिए अपना ऑर्डर सबमिट करें।"
				: "Browse available catalog, select quantities, and submit your order for sales review.",
		reviewOrderBtn:
			locale === "hi"
				? `ऑर्डर समीक्षा (${totalCartCount} आइटम)`
				: `Review Order (${totalCartCount} items)`,
		searchPlaceholder:
			locale === "hi"
				? "उत्पाद नाम, SKU द्वारा खोजें..."
				: "Search by product name, SKU...",
		allCategories: locale === "hi" ? "सभी श्रेणियां" : "All Categories",
		loadingProducts:
			locale === "hi"
				? "उपलब्ध उत्पाद लोड हो रहे हैं..."
				: "Loading available products...",
		noProductsFound:
			locale === "hi"
				? "आपके फ़िल्टर से मेल खाने वाले कोई उत्पाद नहीं मिले।"
				: "No products found matching your filter.",
		quantity: locale === "hi" ? "मात्रा" : "Quantity",
		addToOrder: locale === "hi" ? "ऑर्डर में जोड़ें" : "Add to Order",
		addMore:
			locale === "hi"
				? (qty: number) => `और जोड़ें (ऑर्डर में ${qty})`
				: (qty: number) => `Add More (${qty} in order)`,
		available: locale === "hi" ? "उपलब्ध" : "Available",
		unavailable: locale === "hi" ? "अनुपलब्ध" : "Unavailable",
		floatingCartTitle:
			locale === "hi"
				? (prodCount: number, itemCount: number) =>
						`ऑर्डर सूची (${prodCount} उत्पाद · ${itemCount} आइटम)`
				: (prodCount: number, itemCount: number) =>
						`Order List (${prodCount} products · ${itemCount} items)`,
		floatingCartDesc:
			locale === "hi"
				? "बिक्री समीक्षा के लिए सबमिट करने के लिए तैयार।"
				: "Ready to submit for sales review.",
		clear: locale === "hi" ? "साफ करें" : "Clear",
		reviewOrderTitle:
			locale === "hi" ? "अपने ऑर्डर की समीक्षा करें" : "Review Your Order",
		reviewOrderDesc:
			locale === "hi"
				? "सबमिट करने से पहले कृपया चुने गए उत्पादों और मात्राओं की जांच कर लें।"
				: "Please check the selected products and quantities before submitting.",
		policyTitle: locale === "hi" ? "ऑर्डर समीक्षा नीति" : "Order Review Policy",
		policyDesc:
			locale === "hi"
				? "आपका ऑर्डर हमारी बिक्री टीम द्वारा समीक्षा और पुष्टि किया जाएगा। विवरण को अंतिम रूप देने के लिए आपसे संपर्क किया जाएगा।"
				: "Your order will be reviewed and confirmed by our sales team. You will be contacted to finalize details.",
		back: locale === "hi" ? "पीछे" : "Back",
		submitBtn: locale === "hi" ? "ऑर्डर सबमिट करें" : "Submit Order",
		submitting: locale === "hi" ? "सबमिट किया जा रहा है..." : "Submitting...",
		reviewOrderBtnShort: locale === "hi" ? "ऑर्डर समीक्षा" : "Review Order",
	};

	return (
		<PageTransition className="container mx-auto space-y-6 pb-24">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						{t.title}
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						{t.subtitle}
					</p>
				</div>
				{cartItemsList.length > 0 && (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => router.push("/customer/cart")}
							className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
						>
							<ShoppingBagIcon className="mr-2 h-4 w-4" />
							{locale === "hi" ? "कार्ट खोलें" : "Open Cart"} (
							{cartItemsList.length})
						</Button>
						<Button
							onClick={() => setReviewOpen(true)}
							className="bg-emerald-600 text-white hover:bg-emerald-700"
						>
							<CheckCircle2Icon className="mr-2 h-4 w-4" /> {t.reviewOrderBtn}
						</Button>
					</div>
				)}
			</div>

			{/* Active Deals Banner */}
			{productsWithDeals.length > 0 && (
				<div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 p-4 shadow-sm sm:p-5 dark:border-amber-700/60 dark:from-amber-950/40 dark:to-amber-950/40">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 text-white shadow-md">
								<FlameIcon className="h-6 w-6 animate-pulse" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="font-extrabold text-base text-gray-900 sm:text-lg dark:text-white">
										{locale === "hi"
											? "आज के विशेष ऑफर एवं डिस्काउंट"
											: "Today's Special Deals & Offers"}
									</h3>
									<Badge className="animate-pulse bg-red-600 font-extrabold text-[10px] text-white tracking-wider">
										{productsWithDeals.length}{" "}
										{locale === "hi" ? "ऑफ़र सक्रिय" : "DEALS ACTIVE"}
									</Badge>
								</div>
								<p className="mt-0.5 text-muted-foreground text-xs">
									{locale === "hi"
										? "वेयरहाउस मैनेजर द्वारा आज के लिए विशेष छूट! इन उत्पादों पर भारी बचत करें (सबसे ऊपर सूचीबद्ध)।"
										: "Warehouse-managed daily discounts active today! Enjoy heavy savings on these top featured items."}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Sticky Search & Filter Bar */}
			<div className="sticky top-0 z-30 -mx-2 px-2 py-2 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 bg-background/95 backdrop-blur-md transition-all shadow-xs">
				<Card className="border-border/60 bg-card/95 shadow-sm backdrop-blur-sm">
					<CardContent className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
						<div className="relative flex-1">
							<SearchIcon className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t.searchPlaceholder}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9 text-xs sm:text-sm bg-background/80"
							/>
						</div>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger className="w-full text-xs sm:w-[200px] sm:text-sm bg-background/80">
								<SelectValue placeholder={t.allCategories} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t.allCategories}</SelectItem>
								{categories.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</CardContent>
				</Card>
			</div>

			{/* Product Grid */}
			{isLoading ? (
				<div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
					{t.loadingProducts}
				</div>
			) : error ? (
				<div className="flex h-[300px] items-center justify-center text-destructive text-sm">
					Error loading products: {error.message}
				</div>
			) : (products ?? []).length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
						<PackageIcon className="h-10 w-10 opacity-40" />
						<p className="text-sm">{t.noProductsFound}</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{(products ?? []).map((product) => {
						const isOutOfStock =
							(product as any).stockStatus === "out_of_stock" ||
							Number((product as any).availableStock ?? 0) <= 0;
						const isAvailable = product.available !== false && !isOutOfStock;
						const inCart = cart[product.id];
						const currentQty = inCart
							? inCart.quantity
							: getCardQty(product.id);
						const hasOffer = Boolean(product.hasActiveOffer);
						const offerCountdown = getOfferCountdown(
							(product as any).slabEndDate || (product as any).offerEndDate,
							locale,
						);
						const productImgUrl =
							(product as any).imageUrl || (product as any).image;

						return (
							<Card
								key={product.id}
								className={`group flex flex-col justify-between overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg ${
									hasOffer
										? "border-amber-400/90 bg-gradient-to-b from-amber-50/40 via-card to-card shadow-md dark:border-amber-600/80 dark:from-amber-950/20"
										: isOutOfStock
											? "border-red-300/60 bg-card opacity-90 shadow-xs dark:border-red-900/40"
											: "border-border/70 bg-card shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
								}`}
							>
								{/* Large Product Image Preview Box */}
								<div className="relative w-full overflow-hidden border-border/40 border-b bg-gradient-to-b from-slate-100/90 to-slate-50/60 p-3 dark:from-slate-800/40 dark:to-slate-900/40">
									{/* Top Badges & Status Overlay */}
									<div className="pointer-events-none absolute top-2.5 right-2.5 left-2.5 z-10 flex items-start justify-between gap-1.5">
										<div className="flex flex-col items-start gap-1">
											{hasOffer && (
												<span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-red-600 px-2 py-0.5 font-extrabold text-[10px] text-white shadow-sm">
													<FlameIcon className="h-3 w-3" />
													{product.discountPercent}% OFF
												</span>
											)}
											{(product as any).hasSlabs && (
												<span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-100/95 px-2 py-0.5 font-bold text-[10px] text-purple-900 shadow-2xs dark:border-purple-800 dark:bg-purple-950/90 dark:text-purple-200">
													<LayersIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
													<span>Bulk Discounts</span>
												</span>
											)}
										</div>

										<div className="flex flex-col items-end gap-1">
											{(product as any).stockStatus === "out_of_stock" ||
											isOutOfStock ? (
												<span className="rounded-full border border-red-300/70 bg-red-500/15 px-2 py-0.5 font-extrabold text-[10px] text-red-700 shadow-2xs backdrop-blur-xs dark:border-red-800 dark:text-red-300">
													{locale === "hi" ? "आउट ऑफ स्टॉक" : "OUT OF STOCK"}
												</span>
											) : (product as any).stockStatus === "almost_sold_out" ? (
												<span className="rounded-full border border-red-300/70 bg-red-500/15 px-2 py-0.5 font-extrabold text-[10px] text-red-700 shadow-2xs backdrop-blur-xs dark:border-red-800 dark:text-red-300">
													{locale === "hi" ? "लगभग समाप्त" : "ALMOST SOLD OUT"}
												</span>
											) : (product as any).stockStatus === "selling_fast" ? (
												<span className="rounded-full border border-amber-300/70 bg-amber-500/15 px-2 py-0.5 font-extrabold text-[10px] text-amber-800 shadow-2xs backdrop-blur-xs dark:border-amber-800 dark:text-amber-300">
													{locale === "hi" ? "तेज़ी से बिक रहा" : "SELLING FAST"}
												</span>
											) : (product as any).stockStatus === "few_left" ? (
												<span className="rounded-full border border-amber-300/70 bg-amber-500/15 px-2 py-0.5 font-extrabold text-[10px] text-amber-800 shadow-2xs backdrop-blur-xs dark:border-amber-800 dark:text-amber-300">
													{locale === "hi" ? "कुछ ही शेष" : "FEW LEFT"}
												</span>
											) : (
												<span className="rounded-full border border-emerald-300/60 bg-emerald-500/15 px-2 py-0.5 font-extrabold text-[10px] text-emerald-700 shadow-2xs backdrop-blur-xs dark:border-emerald-800 dark:text-emerald-300">
													{locale === "hi" ? "स्टॉक में उपलब्ध" : "IN STOCK"}
												</span>
											)}
											{offerCountdown && (
												<span
													className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-extrabold text-[10px] shadow-2xs ${
														offerCountdown.urgency === "urgent"
															? "animate-pulse border border-rose-300/80 bg-rose-500/15 text-rose-700 dark:border-rose-800 dark:text-rose-300"
															: offerCountdown.urgency === "warning"
																? "border border-amber-300/80 bg-amber-500/15 text-amber-800 dark:border-amber-800 dark:text-amber-300"
																: "border border-purple-200/80 bg-purple-500/15 text-purple-700 dark:border-purple-800 dark:text-purple-300"
													}`}
													title={`Valid until ${offerCountdown.formattedDate}`}
												>
													<ClockIcon className="h-3 w-3" />
													<span>{offerCountdown.badgeText}</span>
												</span>
											)}
										</div>
									</div>

									{/* Centered Image with Object-Contain & Fallback */}
									<div className="flex h-44 w-full items-center justify-center pt-8 sm:h-52">
										{productImgUrl ? (
											<img
												src={productImgUrl}
												alt={product.name}
												className="max-h-full max-w-full object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
												loading="lazy"
											/>
										) : (
											<div className="flex select-none flex-col items-center justify-center gap-2">
												<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-400 shadow-inner dark:bg-slate-800/80 dark:text-slate-500">
													<PackageIcon className="h-8 w-8" />
												</div>
												<span className="font-medium text-[11px] text-muted-foreground/80">
													{product.category || "General"}
												</span>
											</div>
										)}
									</div>
								</div>

								<CardHeader className="p-4 pb-2">
									<div className="flex items-center justify-between gap-1">
										<span className="inline-block rounded-md bg-muted px-2 py-0.5 font-semibold text-[10px] text-muted-foreground">
											{product.category || "General"}
										</span>
										{product.sku && (
											<span className="font-mono text-[10px] text-muted-foreground">
												SKU: {product.sku}
											</span>
										)}
									</div>
									<CardTitle className="mt-1.5 line-clamp-2 font-bold text-sm leading-snug sm:text-base">
										{product.name}
									</CardTitle>
									{product.description && (
										<CardDescription className="line-clamp-2 text-xs">
											{product.description}
										</CardDescription>
									)}
								</CardHeader>

								<CardContent className="space-y-2.5 p-4 pt-0">
									{/* Price & Unit Display */}
									<div
										className={`rounded-lg border p-2.5 transition-colors ${
											hasOffer
												? "border-amber-300/80 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30"
												: (product as any).hasSlabs
													? "border-purple-200 bg-purple-50/30 dark:border-purple-900/60 dark:bg-purple-950/20"
													: "border-border/60 bg-muted/20"
										}`}
									>
										{(() => {
											const activeSlab = findMatchingSlab(
												(product as any).slabs,
												currentQty,
											);
											const isSlabActive = Boolean(activeSlab);
											const effectivePrice = isSlabActive
												? Number(activeSlab.unitPrice)
												: Number(product.price || 0);
											const regularP = Number(
												product.originalPrice || product.price || 0,
											);

											return (
												<>
													{hasOffer && (
														<div className="mb-1 flex items-center justify-between border-amber-200 border-b pb-1 text-[11px] dark:border-amber-800">
															<span className="flex items-center gap-1 font-bold text-red-600 dark:text-red-400">
																<FlameIcon className="h-3 w-3 text-red-500" />
																{product.offerReason ||
																	(locale === "hi"
																		? "आज का विशेष ऑफर"
																		: "Today's Deal")}
															</span>
															<span className="font-extrabold text-red-600 dark:text-red-400">
																{product.discountPercent}% OFF
															</span>
														</div>
													)}
													<div className="flex items-baseline justify-between">
														<div className="flex flex-col">
															{(hasOffer || isSlabActive) &&
																regularP > effectivePrice && (
																	<span className="font-semibold text-muted-foreground text-xs line-through">
																		₹
																		{regularP.toLocaleString(undefined, {
																			minimumFractionDigits: 2,
																			maximumFractionDigits: 2,
																		})}
																	</span>
																)}
															<div className="flex items-baseline gap-1">
																<span
																	className={`font-bold text-lg sm:text-xl ${
																		isSlabActive
																			? "font-extrabold text-purple-700 dark:text-purple-300"
																			: hasOffer
																				? "font-extrabold text-red-600 dark:text-red-400"
																				: "text-foreground"
																	}`}
																>
																	₹
																	{effectivePrice.toLocaleString(undefined, {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	})}
																</span>
																{product.unit && (
																	<span className="font-medium text-muted-foreground text-xs">
																		/ {product.unit}
																	</span>
																)}
															</div>
														</div>
														<span
															className={`font-semibold text-[10px] ${
																isSlabActive
																	? "text-purple-700 dark:text-purple-300"
																	: hasOffer
																		? "text-red-600 dark:text-red-400"
																		: "text-emerald-600 dark:text-emerald-400"
															}`}
														>
															{isSlabActive
																? locale === "hi"
																	? "थोक स्लैब मूल्य"
																	: "Volume Tier Price"
																: hasOffer
																	? locale === "hi"
																		? "ऑफ़र मूल्य"
																		: "Deal Price"
																	: locale === "hi"
																		? "मानक मूल्य"
																		: "Standard Price"}
														</span>
													</div>

													{currentQty !== 1 && (
														<div className="mt-1 flex items-center justify-between border-border/40 border-t pt-1 text-[11px]">
															<span className="text-muted-foreground">
																{locale === "hi" ? "उप-योग:" : "Subtotal:"}
															</span>
															<span className="font-bold text-emerald-600 dark:text-emerald-400">
																₹
																{(effectivePrice * currentQty).toLocaleString(
																	undefined,
																	{
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	},
																)}
															</span>
														</div>
													)}
												</>
											);
										})()}
									</div>

									{/* Real-time Stock Status & Low-Stock Alerts */}
									{isOutOfStock ? (
										<div className="rounded-lg border border-red-200 bg-red-50/90 p-2 text-center font-semibold text-red-700 text-xs dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
											<div className="flex items-center justify-center gap-1.5">
												<AlertCircleIcon className="h-3.5 w-3.5 shrink-0 text-red-600" />
												<span>
													{locale === "hi"
														? (product as any).stockWarningTextHi ||
															"वर्तमान में अनुपलब्ध। स्टॉक आने पर यह उत्पाद उपलब्ध होगा।"
														: (product as any).stockWarningText ||
															"Currently unavailable. This product will be available once stock is replenished."}
												</span>
											</div>
										</div>
									) : (product as any).stockWarningText ? (
										<div
											className={`rounded-lg border p-1.5 text-center font-bold text-[11px] ${
												(product as any).stockStatus === "almost_sold_out"
													? "border-red-200 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
													: "border-amber-200 bg-amber-50/90 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300"
											}`}
										>
											<div className="flex items-center justify-center gap-1.5">
												<AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
												<span>
													{locale === "hi"
														? (product as any).stockWarningTextHi
														: (product as any).stockWarningText}
												</span>
											</div>
										</div>
									) : null}

									{/* Quantity Slab Pricing Tier Breakdown */}
									{(product as any).slabs &&
										(product as any).slabs.length > 0 && (
											<div className="space-y-1.5 rounded-lg border border-purple-200/90 bg-purple-50/50 p-2 dark:border-purple-900/60 dark:bg-purple-950/20">
												<div className="flex items-center justify-between font-bold text-[11px] text-purple-900 dark:text-purple-200">
													<span className="flex items-center gap-1">
														<LayersIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
														<span>Volume Slab Discounts (थोक दर)</span>
													</span>
													<span className="font-semibold text-[10px] text-purple-600 dark:text-purple-400">
														{(product as any).slabs.length} Slabs Available
													</span>
												</div>

												{/* Offer validity window banner / Countdown */}
												{offerCountdown ? (
													<div
														className={`flex items-center justify-between gap-1.5 rounded border px-2 py-1 font-semibold text-[10px] ${
															offerCountdown.urgency === "urgent"
																? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
																: offerCountdown.urgency === "warning"
																	? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
																	: "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-200"
														}`}
													>
														<div className="flex min-w-0 shrink-0 items-center gap-1.5">
															<ClockIcon className="h-3 w-3 shrink-0 animate-pulse text-current" />
															<span className="whitespace-nowrap font-bold text-[10px]">
																{locale === "hi"
																	? `वैध: ${offerCountdown.formattedDate}`
																	: `Valid: ${offerCountdown.formattedDate}`}
															</span>
														</div>
														<span className="shrink-0 whitespace-nowrap rounded border border-amber-200/60 bg-white/90 px-1.5 py-0.5 font-extrabold font-mono text-[9px] text-amber-950 shadow-2xs dark:border-amber-800/60 dark:bg-slate-900/90 dark:text-amber-100">
															{offerCountdown.badgeText}
														</span>
													</div>
												) : (
													<div className="flex items-center justify-between gap-1 rounded border border-purple-200/60 bg-white/80 px-2 py-0.5 font-medium text-[9px] text-purple-800 dark:border-purple-800/60 dark:bg-slate-900/60 dark:text-purple-300">
														<span className="flex items-center gap-1 whitespace-nowrap">
															<CalendarIcon className="h-2.5 w-2.5 shrink-0 text-purple-600 dark:text-purple-400" />
															<span>
																{locale === "hi"
																	? "दर वैधता: नियमित थोक दर (स्थाई)"
																	: "Rate Validity: Regular Ongoing Rate"}
															</span>
														</span>
														<span className="shrink-0 whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400">
															{locale === "hi" ? "सक्रिय" : "Active"}
														</span>
													</div>
												)}

												<div
													className={`grid gap-1.5 ${(product as any).slabs.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"} text-center`}
												>
													{(product as any).slabs.map(
														(slab: any, sIdx: number) => {
															const isActive = isQuantityInSlab(
																slab,
																(product as any).slabs,
																currentQty,
															);
															const slabPrice = Number(slab.unitPrice);
															const baseP = Number(
																product.originalPrice || product.price || 0,
															);
															const pct =
																baseP > 0
																	? Math.round(
																			((baseP - slabPrice) / baseP) * 100,
																		)
																	: 0;

															return (
																<button
																	type="button"
																	key={sIdx}
																	onClick={() => {
																		handleQtyChange(
																			product.id,
																			slab.minQuantity,
																		);
																	}}
																	title={
																		locale === "hi"
																			? `${slab.minQuantity} यूनिट चुनें`
																			: `Select ${slab.minQuantity} units`
																	}
																	className={`flex cursor-pointer flex-col items-center justify-center rounded border p-1 text-center transition-all ${
																		isActive
																			? "border-purple-600 bg-purple-600 font-bold text-white shadow-xs ring-2 ring-purple-400 hover:bg-purple-700"
																			: "border-purple-200/70 bg-white text-slate-800 hover:border-purple-400 hover:bg-purple-100/60 dark:border-purple-800/70 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-purple-950/60"
																	}`}
																>
																	<div
																		className={`truncate font-semibold text-[9px] ${isActive ? "text-purple-100" : "text-muted-foreground"}`}
																	>
																		{slab.minQuantity}
																		{slab.maxQuantity
																			? `–${slab.maxQuantity}`
																			: "+"}{" "}
																		{product.unit &&
																		product.unit.toLowerCase() !== "pcs"
																			? product.unit
																			: "qty"}
																	</div>
																	<div
																		className={`font-bold font-mono text-xs ${isActive ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`}
																	>
																		₹{slabPrice.toFixed(2)}
																	</div>
																	{pct > 0 && (
																		<div
																			className={
																				isActive
																					? "font-bold text-[8px] text-purple-200"
																					: "font-bold text-[8px] text-purple-600 dark:text-purple-400"
																			}
																		>
																			{pct}% off
																		</div>
																	)}
																</button>
															);
														},
													)}
												</div>

												{/* Active Tier Alert Banner */}
												{(() => {
													const activeSlab = findMatchingSlab(
														(product as any).slabs,
														currentQty,
													);
													if (activeSlab) {
														const baseP = Number(
															product.originalPrice || product.price || 0,
														);
														const saved = Math.max(
															0,
															baseP - Number(activeSlab.unitPrice),
														);
														return (
															<div className="flex items-center justify-between rounded border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 font-bold text-[10px] text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
																<span>
																	✓ Unlocked {activeSlab.minQuantity}
																	{activeSlab.maxQuantity
																		? `–${activeSlab.maxQuantity}`
																		: "+"}{" "}
																	{product.unit || "qty"} tier!
																</span>
																{saved > 0 && (
																	<span>Save ₹{saved.toFixed(2)}/unit</span>
																)}
															</div>
														);
													}
													return null;
												})()}
											</div>
										)}

									{/* Quantity Control */}
									<div className="flex items-center justify-between gap-2 pt-1">
										<span className="text-muted-foreground text-xs">
											{t.quantity}
										</span>
										<div className="center flex items-center rounded-md border border-border">
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-none"
												onClick={() => handleCardDecrement(product)}
												disabled={currentQty <= 0.1 || !isAvailable}
												title="Decrease quantity (supports 0.5, 0.25)"
											>
												<MinusIcon className="h-3 w-3" />
											</Button>
											<DecimalQuantityInput
												value={currentQty}
												onChange={(val) => handleCardQtyChange(product, val)}
												onRemove={
													inCart
														? () => handleRemoveFromCart(product.id)
														: undefined
												}
												disabled={!isAvailable}
												className="h-7 w-14 border-0 p-0 text-center font-semibold text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
											/>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-none"
												onClick={() => handleCardIncrement(product)}
												disabled={
													!isAvailable ||
													currentQty >=
														Number((product as any).availableStock ?? 99999)
												}
												title="Increase quantity"
											>
												<PlusIcon className="h-3 w-3" />
											</Button>
										</div>
									</div>
								</CardContent>

								<CardFooter className="p-4 pt-0">
									{inCart ? (
										<div className="flex w-full items-center gap-1.5">
											<Button
												className={`flex-1 border font-semibold text-xs ${
													isOutOfStock
														? "border-red-400 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-300"
														: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
												}`}
												size="sm"
												variant="outline"
												onClick={() => router.push("/customer/cart")}
												title={locale === "hi" ? "कार्ट में देखें" : "View in Cart"}
											>
												{isOutOfStock ? (
													<AlertCircleIcon className="mr-1.5 h-3.5 w-3.5 text-red-600 dark:text-red-400" />
												) : (
													<CheckCircle2Icon className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
												)}
												{locale === "hi"
													? `कार्ट में (${inCart.quantity})`
													: `In Cart (${inCart.quantity})`}
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
												onClick={() => handleRemoveFromCart(product.id)}
												title={
													locale === "hi" ? "कार्ट से हटाएं" : "Remove from cart"
												}
											>
												<Trash2Icon className="h-4 w-4" />
											</Button>
										</div>
									) : isOutOfStock ? (
										<Button
											className="w-full cursor-not-allowed border border-slate-300/60 bg-slate-200 font-semibold text-slate-500 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
											size="sm"
											disabled
										>
											<AlertCircleIcon className="mr-1.5 h-3.5 w-3.5 text-red-500" />
											{locale === "hi"
												? "आउट ऑफ स्टॉक (Out of Stock)"
												: "OUT OF STOCK"}
										</Button>
									) : (
										<Button
											className="w-full bg-emerald-600 text-white text-xs hover:bg-emerald-700"
											size="sm"
											onClick={() => handleAddToCart(product)}
											disabled={!isAvailable}
										>
											<ShoppingBagIcon className="mr-1.5 h-3.5 w-3.5" />
											{locale === "hi"
												? `कार्ट में जोड़ें (${currentQty})`
												: `Add to Cart (${currentQty})`}
										</Button>
									)}
								</CardFooter>
							</Card>
						);
					})}
				</div>
			)}

			{/* Floating Order Cart Bar */}
			{cartItemsList.length > 0 && (
				<div className="fixed right-4 bottom-4 left-4 z-40 mx-auto max-w-4xl rounded-xl border border-emerald-500/30 bg-card/95 p-4 shadow-xl backdrop-blur sm:left-auto">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="font-bold text-foreground text-sm">
								{t.floatingCartTitle(cartItemsList.length, totalCartCount)}
							</p>
							<p className="text-muted-foreground text-xs">
								{t.floatingCartDesc}
							</p>
						</div>
						<div className="flex items-center justify-between gap-4 sm:justify-end">
							<div className="text-right">
								<p className="text-[10px] text-muted-foreground">
									{locale === "hi" ? "कुल अनुमानित मूल्य" : "Est. Total Amount"}
								</p>
								<p className="font-bold text-emerald-600 text-sm dark:text-emerald-400">
									₹
									{totalCartAmount.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									className="text-xs"
									onClick={handleClearCart}
								>
									{t.clear}
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="border-emerald-600 text-emerald-700 text-xs hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
									onClick={() => router.push("/customer/cart")}
								>
									<ShoppingBagIcon className="mr-1.5 h-3.5 w-3.5" />
									{locale === "hi" ? "कार्ट देखें" : "View Cart"}
								</Button>
								<Button
									size="sm"
									className="bg-emerald-600 text-white text-xs hover:bg-emerald-700"
									onClick={() => setReviewOpen(true)}
								>
									<CheckCircle2Icon className="mr-1.5 h-4 w-4" />{" "}
									{t.reviewOrderBtnShort}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Review Order Dialog */}
			<Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{t.reviewOrderTitle}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 text-sm">
						<p className="text-muted-foreground text-xs">{t.reviewOrderDesc}</p>

						<div className="max-h-[250px] space-y-2 overflow-y-auto pr-1">
							{cartItemsList.map((item) => (
								<div
									key={item.productId}
									className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
								>
									<div>
										<p className="font-semibold text-sm">{item.name}</p>
										<div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
											{item.sku && <span>SKU: {item.sku}</span>}
											<span>•</span>
											<span className="font-semibold text-foreground">
												₹{Number(item.price || 0).toFixed(2)}{" "}
												{item.unit ? `/ ${item.unit}` : ""}
											</span>
										</div>
										<p className="mt-1 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
											{locale === "hi" ? "आइटम योग:" : "Item Total:"} ₹
											{(Number(item.price || 0) * item.quantity).toFixed(2)}
										</p>
									</div>
									<div className="flex items-center gap-3">
										<div className="flex items-center rounded-md border border-border">
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 rounded-none"
												onClick={() => handleCartDecrement(item.productId)}
												disabled={item.quantity <= 0.1}
												title="Decrease quantity (supports 0.5, 0.25)"
											>
												<MinusIcon className="h-3 w-3" />
											</Button>
											<DecimalQuantityInput
												value={item.quantity}
												onChange={(val) => updateCartQty(item.productId, val)}
												onRemove={() => handleRemoveFromCart(item.productId)}
												className="h-6 w-14 border-0 p-0 text-center font-semibold text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
											/>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 rounded-none"
												onClick={() => handleCartIncrement(item.productId)}
												title="Increase quantity"
											>
												<PlusIcon className="h-3 w-3" />
											</Button>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-muted-foreground hover:text-destructive"
											onClick={() => handleRemoveFromCart(item.productId)}
										>
											<Trash2Icon className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>

						{/* Total Estimated Price Card */}
						<div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5">
							<div>
								<p className="font-bold text-foreground text-xs uppercase tracking-wide">
									{locale === "hi"
										? "कुल अनुमानित ऑर्डर मूल्य"
										: "Estimated Order Total"}
								</p>
								<p className="text-[10px] text-muted-foreground">
									{locale === "hi"
										? "अंतिम चालान में कर और छूट शामिल हो सकते हैं"
										: "Final billing may reflect taxes or manager discounts"}
								</p>
							</div>
							<p className="font-bold text-emerald-600 text-lg sm:text-xl dark:text-emerald-400">
								₹
								{totalCartAmount.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>

						{/* Delivery Information Section */}
						<div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
							<div className="flex items-center gap-2">
								<TruckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
								<p className="font-bold text-foreground text-xs uppercase tracking-wide">
									{locale === "hi"
										? "वितरण और संपर्क जानकारी"
										: "Delivery & Contact Information"}
								</p>
							</div>
							<div className="grid gap-3">
								<div className="space-y-1">
									<label className="flex items-center gap-1.5 font-semibold text-[11px] text-muted-foreground">
										<PhoneIcon className="h-3.5 w-3.5 text-muted-foreground" />
										<span>
											{locale === "hi"
												? "फ़ोन नंबर (अनिवार्य)"
												: "Phone Number (Required)"}{" "}
											*
										</span>
									</label>
									<Input
										type="tel"
										placeholder={
											locale === "hi"
												? "अपना 10-अंकों का फ़ोन नंबर दर्ज करें"
												: "Enter your 10-digit phone number"
										}
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										className="h-9 text-xs"
									/>
								</div>
								<div className="space-y-1">
									<label className="flex items-center gap-1.5 font-semibold text-[11px] text-muted-foreground">
										<MapPinIcon className="h-3.5 w-3.5 text-muted-foreground" />
										<span>
											{locale === "hi"
												? "वितरण का पता (अनिवार्य)"
												: "Delivery Address (Required)"}{" "}
											*
										</span>
									</label>
									<textarea
										placeholder={
											locale === "hi"
												? "अपना पूरा पता दर्ज करें जहाँ ऑर्डर पहुंचाना है"
												: "Enter your complete delivery address"
										}
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									/>
								</div>
							</div>
						</div>

						<div className="rounded-lg bg-blue-500/10 p-3 text-blue-600 text-xs dark:text-blue-400">
							<p className="font-medium">{t.policyTitle}</p>
							<p className="mt-0.5 text-[11px] leading-relaxed">
								{t.policyDesc}
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => {
								idempotencyKeyRef.current = null;
								setReviewOpen(false);
							}}
							disabled={isSubmitting}
						>
							{t.back}
						</Button>
						<Button
							className={`bg-emerald-600 text-white hover:bg-emerald-700 ${
								isSubmitting ? "pointer-events-none opacity-80" : ""
							}`}
							onClick={handleSubmitOrder}
							disabled={isSubmitting || cartItemsList.length === 0}
						>
							{isSubmitting ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									{t.submitting}
								</>
							) : (
								t.submitBtn
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
