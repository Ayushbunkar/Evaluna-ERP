"use client";

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
	CheckCircle2Icon,
	MinusIcon,
	PackageIcon,
	PlusIcon,
	SearchIcon,
	ShoppingBagIcon,
	Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

type CartItem = {
	productId: number;
	name: string;
	sku: string | null;
	unit: string | null;
	quantity: number;
};

export default function CustomerProductsPage() {
	const trpc = useTRPC();
	const router = useRouter();
	const locale = useLocale();

	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<string>("all");
	const [cart, setCart] = useState<Record<number, CartItem>>({});
	const [quantities, setQuantities] = useState<Record<number, number>>({});
	const [reviewOpen, setReviewOpen] = useState(false);

	const {
		data: products,
		isLoading,
		error,
	} = trpc.customer.browseProducts.useQuery({
		search: search.trim() || undefined,
		category: category !== "all" ? category : undefined,
	});

	const categories = useMemo(() => {
		const set = new Set<string>();
		(products ?? []).forEach((p) => {
			if (p.category) set.add(p.category);
		});
		return Array.from(set);
	}, [products]);

	const cartItemsList = useMemo(() => Object.values(cart), [cart]);
	const totalCartCount = useMemo(
		() => cartItemsList.reduce((sum, item) => sum + item.quantity, 0),
		[cartItemsList],
	);

	const getQty = (pid: number) => quantities[pid] ?? 1;

	const setQty = (pid: number, val: number) => {
		setQuantities((prev) => ({
			...prev,
			[pid]: Math.max(1, val),
		}));
	};

	const handleAddToCart = (product: {
		id: number;
		name: string;
		sku: string | null;
		unit: string | null;
	}) => {
		const qtyToAdd = getQty(product.id);
		setCart((prev) => {
			const existingQty = prev[product.id]?.quantity ?? 0;
			return {
				...prev,
				[product.id]: {
					productId: product.id,
					name: product.name,
					sku: product.sku,
					unit: product.unit,
					quantity: existingQty + qtyToAdd,
				},
			};
		});
		toast.success(
			locale === "hi" ? "आइटम ऑर्डर में जोड़ा गया!" : "Added items to order!",
		);
	};

	const updateCartQty = (pid: number, val: number) => {
		const finalVal = Math.max(1, val);
		setCart((prev) => {
			if (!prev[pid]) return prev;
			return {
				...prev,
				[pid]: {
					...prev[pid],
					quantity: finalVal,
				},
			};
		});
	};

	const handleRemoveFromCart = (pid: number) => {
		setCart((prev) => {
			const clone = { ...prev };
			delete clone[pid];
			return clone;
		});
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
			setReviewOpen(false);
			toast.success(
				locale === "hi"
					? "ऑर्डर सफलतापूर्वक सबमिट किया गया!"
					: "Order submitted successfully for sales review!",
			);
			router.push("/customer/orders");
		},
		onError: (err) => {
			toast.error(
				err.message ||
					(locale === "hi"
						? "ऑर्डर सबमिट करने में विफल।"
						: "Failed to submit order."),
			);
		},
	});

	const handleSubmitOrder = async () => {
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

		try {
			// Save phone & address permanently to profile first
			await updateProfileMutation.mutateAsync({
				name: profile?.name || "Customer",
				phone: cleanPhone,
				address: cleanAddress,
			});

			// Now submit the order
			const idempotencyKey = crypto.randomUUID();
			submitOrderMutation.mutate({
				idempotencyKey,
				items: cartItemsList.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
				})),
			});
		} catch (_err) {
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
					<Button
						onClick={() => setReviewOpen(true)}
						className="bg-emerald-600 text-white hover:bg-emerald-700"
					>
						<ShoppingBagIcon className="mr-2 h-4 w-4" /> {t.reviewOrderBtn}
					</Button>
				)}
			</div>

			{/* Search & Filter Bar */}
			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
					<div className="relative flex-1">
						<SearchIcon className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t.searchPlaceholder}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9 text-xs sm:text-sm"
						/>
					</div>
					<Select value={category} onValueChange={setCategory}>
						<SelectTrigger className="w-full text-xs sm:w-[200px] sm:text-sm">
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
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{(products ?? []).map((product) => {
						const isAvailable = product.available !== false;
						const currentQty = getQty(product.id);
						const inCart = cart[product.id];

						return (
							<Card
								key={product.id}
								className="flex flex-col justify-between border-border/50 bg-card shadow-sm transition-all hover:border-border"
							>
								<CardHeader className="p-4 pb-2">
									<div className="flex items-start justify-between gap-2">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
											<PackageIcon className="h-5 w-5 text-blue-500" />
										</div>
										<span
											className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${
												isAvailable
													? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
													: "bg-red-500/10 text-red-600 dark:text-red-400"
											}`}
										>
											{isAvailable ? t.available : t.unavailable}
										</span>
									</div>
									<CardTitle className="mt-2 line-clamp-1 text-base">
										{product.name}
									</CardTitle>
									<CardDescription className="line-clamp-2 text-xs">
										{product.description}
									</CardDescription>
								</CardHeader>

								<CardContent className="space-y-2 p-4 pt-0">
									{product.sku && (
										<p className="font-mono text-[11px] text-muted-foreground">
											SKU: {product.sku}
										</p>
									)}

									{/* Quantity Control */}
									<div className="flex items-center justify-between gap-2 pt-2">
										<span className="text-muted-foreground text-xs">
											{t.quantity}
										</span>
										<div className="center flex items-center rounded-md border border-border">
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-none"
												onClick={() => setQty(product.id, currentQty - 1)}
												disabled={currentQty <= 1 || !isAvailable}
											>
												<MinusIcon className="h-3 w-3" />
											</Button>
											<span className="w-8 text-center font-semibold text-xs">
												{currentQty}
											</span>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-none"
												onClick={() => setQty(product.id, currentQty + 1)}
												disabled={!isAvailable}
											>
												<PlusIcon className="h-3 w-3" />
											</Button>
										</div>
									</div>
								</CardContent>

								<CardFooter className="p-4 pt-0">
									<Button
										className="w-full text-xs"
										size="sm"
										onClick={() => handleAddToCart(product)}
										disabled={!isAvailable}
									>
										{inCart ? t.addMore(inCart.quantity) : t.addToOrder}
									</Button>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			)}

			{/* Floating Order Cart Bar */}
			{cartItemsList.length > 0 && (
				<div className="fixed right-4 bottom-4 left-4 z-40 mx-auto max-w-4xl rounded-xl border border-emerald-500/30 bg-card p-4 shadow-xl backdrop-blur sm:left-auto">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="font-bold text-foreground text-sm">
								{t.floatingCartTitle(cartItemsList.length, totalCartCount)}
							</p>
							<p className="text-muted-foreground text-xs">
								{t.floatingCartDesc}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="text-xs"
								onClick={() => setCart({})}
							>
								{t.clear}
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
			)}

			{/* Review Order Dialog */}
			<Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{t.reviewOrderTitle}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 text-sm">
						<p className="text-muted-foreground text-xs">{t.reviewOrderDesc}</p>

						<div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
							{cartItemsList.map((item) => (
								<div
									key={item.productId}
									className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
								>
									<div>
										<p className="font-semibold text-sm">{item.name}</p>
										{item.sku && (
											<p className="font-mono text-[11px] text-muted-foreground">
												SKU: {item.sku}
											</p>
										)}
									</div>
									<div className="flex items-center gap-3">
										<div className="flex items-center rounded-md border border-border">
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 rounded-none"
												onClick={() =>
													updateCartQty(item.productId, item.quantity - 1)
												}
											>
												<MinusIcon className="h-3 w-3" />
											</Button>
											<span className="w-8 text-center font-semibold text-xs">
												{item.quantity}
											</span>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 rounded-none"
												onClick={() =>
													updateCartQty(item.productId, item.quantity + 1)
												}
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

						{/* Delivery Information Section */}
						<div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
							<p className="font-bold text-foreground text-xs uppercase tracking-wide">
								🚚{" "}
								{locale === "hi"
									? "वितरण और संपर्क जानकारी"
									: "Delivery & Contact Information"}
							</p>
							<div className="grid gap-3">
								<div className="space-y-1">
									<label className="flex items-center gap-1 font-semibold text-[11px] text-muted-foreground">
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
									<label className="flex items-center gap-1 font-semibold text-[11px] text-muted-foreground">
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
							onClick={() => setReviewOpen(false)}
							disabled={submitOrderMutation.isPending}
						>
							{t.back}
						</Button>
						<Button
							className="bg-emerald-600 text-white hover:bg-emerald-700"
							onClick={handleSubmitOrder}
							disabled={
								submitOrderMutation.isPending || cartItemsList.length === 0
							}
						>
							{submitOrderMutation.isPending ? t.submitting : t.submitBtn}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
