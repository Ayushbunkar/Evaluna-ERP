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
	ArrowRight,
	CheckCircle2Icon,
	FlameIcon,
	LayersIcon,
	LogInIcon,
	MinusIcon,
	PackageIcon,
	PlusIcon,
	SearchIcon,
	ShieldCheckIcon,
	ShoppingCartIcon,
	SparklesIcon,
	TruckIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { useRealtimeStock } from "@/hooks/use-realtime-stock";
import { useSession } from "@/hooks/use-session";
import { PageTransition } from "@/lib/animations";
import { findMatchingSlab } from "@/lib/pricing/slab-pricing";
import { useTRPC } from "@/lib/trpc/client";

type CartItem = {
	productId: number;
	name: string;
	unit: string | null;
	price: number;
	quantity: number;
	imageUrl?: string | null;
	category?: string | null;
	originalPrice?: number;
};

export default function PublicProductsCatalogPage() {
	useRealtimeStock();
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const router = useRouter();
	const { session } = useSession();

	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<string>("all");
	const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "deals">("all");
	const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "name">("default");

	const toolbarRef = useRef<HTMLDivElement>(null);

	const scrollToCatalogTop = () => {
		if (typeof window === "undefined") return;
		if (toolbarRef.current) {
			const navbarHeight = 62;
			const elementTop = toolbarRef.current.getBoundingClientRect().top + window.scrollY;
			const targetY = Math.max(0, elementTop - navbarHeight);
			window.scrollTo({
				top: targetY,
				behavior: "smooth",
			});
		} else {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const handleCategoryChange = (newCat: string) => {
		setCategory(newCat);
		scrollToCatalogTop();
	};

	const handleStockFilterChange = (newFilter: "all" | "in_stock" | "deals") => {
		setStockFilter(newFilter);
		scrollToCatalogTop();
	};

	const handleSortChange = (newSort: "default" | "price_asc" | "price_desc" | "name") => {
		setSortBy(newSort);
		scrollToCatalogTop();
	};

	const [cart, setCart] = useState<Record<number, CartItem>>({});
	const [quantities, setQuantities] = useState<Record<number, number | string>>({});
	const [loginPromptOpen, setLoginPromptOpen] = useState(false);

	// Fetch public catalog from live database
	const {
		data: products,
		isLoading,
		error,
	} = trpc.customer.browseProducts.useQuery(
		{
			search: search.trim() || undefined,
		},
		{
			refetchInterval: 10000,
		},
	);

	// Fetch server cart if user is logged in
	const { data: serverCart } = trpc.customer.getCart.useQuery(undefined, {
		refetchInterval: 5000,
		enabled: !!session?.user,
	});

	// Mutations for logged-in users
	const addToCartMutation = trpc.customer.addToCart.useMutation({
		onSuccess: () => {
			utils.customer.getCart.invalidate();
		},
	});

	// Load guest cart from localStorage for unauthenticated users
	useEffect(() => {
		if (!session?.user) {
			try {
				const raw = localStorage.getItem("evaluna_guest_cart");
				if (raw) {
					const parsed = JSON.parse(raw);
					if (parsed && typeof parsed === "object") {
						setCart(parsed);
					}
				}
			} catch (_e) {}
		}
	}, [session?.user]);

	// When user is authenticated, sync with server cart
	useEffect(() => {
		if (serverCart?.items && session?.user) {
			const map: Record<number, CartItem> = {};
			for (const item of serverCart.items) {
				map[item.productId] = {
					productId: item.productId,
					name: item.productName,
					unit: item.unit,
					price: item.effectivePrice,
					quantity: item.quantity,
					originalPrice: item.originalPrice,
				};
			}
			setCart(map);
		}
	}, [serverCart, session?.user]);

	// Auto-merge guest cart into server cart once user logs in
	useEffect(() => {
		if (session?.user) {
			try {
				const raw = localStorage.getItem("evaluna_guest_cart");
				if (raw) {
					const parsed = JSON.parse(raw);
					const items = Object.values(parsed || {}) as CartItem[];
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

	// Save guest cart back to localStorage and notify header
	const saveGuestCart = (newCart: Record<number, CartItem>) => {
		setCart(newCart);
		try {
			localStorage.setItem("evaluna_guest_cart", JSON.stringify(newCart));
			window.dispatchEvent(new Event("evaluna_cart_updated"));
		} catch (_e) {}
	};

	// Persistent unique categories across catalog
	const allCategoriesRef = useRef<string[]>([]);
	const totalCatalogCountRef = useRef<number>(0);

	if (products && products.length > 0) {
		const currentCats = new Set<string>();
		products.forEach((p) => {
			if (p.category) currentCats.add(p.category);
		});
		if (currentCats.size >= allCategoriesRef.current.length) {
			allCategoriesRef.current = Array.from(currentCats).sort();
		}
		if (products.length >= totalCatalogCountRef.current) {
			totalCatalogCountRef.current = products.length;
		}
	}

	const categories = useMemo(() => {
		if (allCategoriesRef.current.length > 0) return allCategoriesRef.current;
		const set = new Set<string>();
		(products ?? []).forEach((p) => {
			if (p.category) set.add(p.category);
		});
		return Array.from(set).sort();
	}, [products]);

	const totalCatalogCount = totalCatalogCountRef.current || products?.length || 0;

	// Filter and sort products
	const filteredProducts = useMemo(() => {
		let list = [...(products ?? [])];

		// Filter by category
		if (category !== "all") {
			list = list.filter((p) => p.category === category);
		}

		// Filter by stock status / deals
		if (stockFilter === "in_stock") {
			list = list.filter(
				(p) =>
					(p as any).stockStatus !== "out_of_stock" &&
					Number((p as any).availableStock ?? 0) > 0,
			);
		} else if (stockFilter === "deals") {
			list = list.filter((p) => p.hasActiveOffer);
		}

		// Sorting
		if (sortBy === "price_asc") {
			list.sort(
				(a, b) =>
					Number(a.price || a.effectivePrice || 0) -
					Number(b.price || b.effectivePrice || 0),
			);
		} else if (sortBy === "price_desc") {
			list.sort(
				(a, b) =>
					Number(b.price || b.effectivePrice || 0) -
					Number(a.price || a.effectivePrice || 0),
			);
		} else if (sortBy === "name") {
			list.sort((a, b) => a.name.localeCompare(b.name));
		}

		return list;
	}, [products, category, stockFilter, sortBy]);

	// Cart stats
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

	const setCardQty = (pid: number, val: number | string) => {
		setQuantities((prev) => ({
			...prev,
			[pid]:
				typeof val === "string" ? val : Math.max(0.001, Number(val.toFixed(3))),
		}));
	};

	const handleIncrement = (pid: number, maxStock: number) => {
		const current = getCardQty(pid);
		let next = current + 1;
		if (current < 1) next = 1;
		if (next > maxStock) {
			toast.warning(`Only ${maxStock} units currently available in stock.`);
			next = maxStock;
		}
		setCardQty(pid, next);
		if (cart[pid]) {
			handleAddToCart(
				products?.find((p) => p.id === pid) as any,
				next,
				true,
			);
		}
	};

	const handleDecrement = (pid: number) => {
		const current = getCardQty(pid);
		let next = current - 1;
		if (current <= 1 && current > 0.5) next = 0.5;
		else if (current <= 0.5 && current > 0.25) next = 0.25;
		else if (current <= 0.25) next = 0.1;
		if (next <= 0) next = 0.1;
		setCardQty(pid, next);
		if (cart[pid]) {
			handleAddToCart(
				products?.find((p) => p.id === pid) as any,
				next,
				true,
			);
		}
	};

	const handleAddToCart = (product: any, forcedQty?: number, silent = false) => {
		const qty = forcedQty ?? getCardQty(product.id);
		const availStock = Number(product.availableStock ?? 99999);

		if (qty <= 0) {
			toast.error("Please select a quantity greater than zero.");
			return;
		}
		if (availStock > 0 && qty > availStock) {
			toast.warning(`Quantity adjusted to maximum available stock (${availStock}).`);
		}
		const validQty = Math.min(qty, availStock > 0 ? availStock : qty);

		const activeSlab = findMatchingSlab(product.slabs, validQty);
		const effectivePrice = activeSlab
			? activeSlab.unitPrice
			: Number(product.effectivePrice ?? product.price ?? 0);

		if (session?.user) {
			// Logged in user: sync directly to database
			addToCartMutation.mutate(
				{
					productId: product.id,
					quantity: validQty,
				},
				{
					onSuccess: () => {
						if (!silent) toast.success(`Added ${product.name} (${validQty} ${product.unit || "unit"}) to cart`);
					},
					onError: (err) => {
						toast.error(err.message || "Failed to add to cart");
					},
				},
			);
		} else {
			// Guest user: save to local guest cart
			const newCart = {
				...cart,
				[product.id]: {
					productId: product.id,
					name: product.name,
					unit: product.unit,
					price: effectivePrice,
					quantity: validQty,
					imageUrl: product.imageUrl,
					category: product.category,
					originalPrice: Number(product.price || effectivePrice),
				},
			};
			saveGuestCart(newCart);
			if (!silent) {
				toast.success(`Added ${product.name} to cart`);
			}
		}
	};

	const handleCheckoutClick = () => {
		if (!session?.user) {
			setLoginPromptOpen(true);
		} else {
			router.push("/customer/cart");
		}
	};

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200 w-full">
			{/* Public Navbar */}
			<PublicHeader />

			{/* Hero Catalog Header */}
			<section className="relative border-b border-border/60 bg-muted/20 py-8 sm:py-12">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
						<div className="space-y-3 max-w-3xl">
							<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
								<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
								<span>Live B2B Wholesale Catalogue</span>
							</div>
							<h1 className="font-extrabold text-2xl sm:text-4xl text-foreground tracking-tight">
								Wholesale Grocery & FMCG Supplies
							</h1>
							<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
								Direct transparent mill & factory pricing from Central Logistics Hub, Vidisha Road & Berasia Transit Junction, Bhopal. Browse products, check live availability, and order with volume discounts.
							</p>
						</div>

						{/* Highlights Pill */}
						<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
							<div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 shadow-2xs">
								<TruckIcon className="h-4 w-4 text-emerald-600" />
								<span>Express Regional Delivery</span>
							</div>
							<div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 shadow-2xs">
								<ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
								<span>100% Verified Quality</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Main Catalog Section */}
			<main className="mx-auto max-w-7xl w-full flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
				{/* Search & Filter Toolbar */}
				<div
					ref={toolbarRef}
					className="sticky top-[58px] sm:top-[60px] z-40 rounded-xl border border-border/70 bg-background/95 p-3.5 shadow-md backdrop-blur-md"
				>
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						{/* Search Input */}
						<div className="relative flex-1">
							<SearchIcon className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by product name..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9 pr-8 text-xs sm:text-sm bg-muted/30 focus-visible:bg-background"
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
								>
									<XIcon className="h-4 w-4" />
								</button>
							)}
						</div>

						{/* Filters and Sorting */}
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							{/* Category Dropdown */}
							<Select value={category} onValueChange={handleCategoryChange}>
								<SelectTrigger className="w-full sm:w-[190px] text-xs sm:text-sm bg-muted/30">
									<SelectValue placeholder="All Categories" />
								</SelectTrigger>
								<SelectContent position="popper" side="bottom" sideOffset={6} collisionPadding={12} className="max-h-72 sm:max-h-80">
									<SelectItem value="all">All Categories ({totalCatalogCount})</SelectItem>
									{categories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Stock Filter Pills */}
							<div className="flex items-center rounded-lg border border-border/80 bg-muted/30 p-1 text-xs">
								<button
									type="button"
									onClick={() => handleStockFilterChange("all")}
									className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
										stockFilter === "all"
											? "bg-background text-foreground shadow-2xs font-semibold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									All
								</button>
								<button
									type="button"
									onClick={() => handleStockFilterChange("in_stock")}
									className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
										stockFilter === "in_stock"
											? "bg-emerald-600 text-white shadow-2xs font-semibold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									In Stock
								</button>
								<button
									type="button"
									onClick={() => handleStockFilterChange("deals")}
									className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
										stockFilter === "deals"
											? "bg-amber-600 text-white shadow-2xs font-semibold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<FlameIcon className="h-3 w-3" />
									<span>Deals</span>
								</button>
							</div>

							{/* Sort Selector */}
							<Select value={sortBy} onValueChange={(val: any) => handleSortChange(val)}>
								<SelectTrigger className="w-full sm:w-[170px] text-xs sm:text-sm bg-muted/30">
									<SelectValue placeholder="Sort Products" />
								</SelectTrigger>
								<SelectContent position="popper" side="bottom" sideOffset={6} collisionPadding={12} className="max-h-72 sm:max-h-80">
									<SelectItem value="default">Featured</SelectItem>
									<SelectItem value="price_asc">Price: Low to High</SelectItem>
									<SelectItem value="price_desc">Price: High to Low</SelectItem>
									<SelectItem value="name">Name (A-Z)</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Category Quick Pills */}
					{categories.length > 0 && (
						<div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs scrollbar-none">
							<button
								type="button"
								onClick={() => handleCategoryChange("all")}
								className={`shrink-0 rounded-full px-3 py-1 text-xs transition-all ${
									category === "all"
										? "bg-foreground text-background font-semibold"
										: "border border-border/80 bg-muted/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
								}`}
							>
								All ({totalCatalogCount})
							</button>
							{categories.map((cat) => (
								<button
									key={cat}
									type="button"
									onClick={() => handleCategoryChange(cat)}
									className={`shrink-0 rounded-full px-3 py-1 text-xs transition-all ${
										category === cat
											? "bg-foreground text-background font-semibold"
											: "border border-border/80 bg-muted/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
									}`}
								>
									{cat}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Products Grid Content */}
				{isLoading ? (
					<div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
						<p className="text-sm">Fetching verified catalogue and live wholesale prices...</p>
					</div>
				) : error ? (
					<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
						<AlertCircleIcon className="mx-auto h-8 w-8 mb-2" />
						<p className="font-semibold text-sm">Failed to load product catalog</p>
						<p className="text-xs mt-1 text-muted-foreground">{error.message}</p>
					</div>
				) : filteredProducts.length === 0 ? (
					<div className="rounded-xl border border-border/60 bg-muted/20 py-16 text-center">
						<PackageIcon className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
						<h3 className="font-bold text-base text-foreground">No products match your criteria</h3>
						<p className="text-xs text-muted-foreground mt-1">Try resetting your search query or selecting a different category.</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-4 text-xs"
							onClick={() => {
								setSearch("");
								setCategory("all");
								setStockFilter("all");
							}}
						>
							Reset Filters
						</Button>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 w-full min-w-0">
						{filteredProducts.map((product) => {
							const isOutOfStock =
								(product as any).stockStatus === "out_of_stock" ||
								Number((product as any).availableStock ?? 0) <= 0;
							const hasOffer = product.hasActiveOffer;
							const currentQty = getCardQty(product.id);
							const inCartItem = cart[product.id];
							const activeSlab = findMatchingSlab(
								(product as any).slabs,
								currentQty,
							);
							const effectivePrice = activeSlab
								? activeSlab.unitPrice
								: Number(product.effectivePrice ?? product.price ?? 0);
							const originalPrice = Number(product.price || effectivePrice);

							return (
								<Card
									key={product.id}
									className={`group relative flex flex-col justify-between overflow-hidden border w-full min-w-0 transition-all duration-200 hover:shadow-md ${
										isOutOfStock
											? "opacity-75 bg-muted/20 border-border/40"
											: inCartItem
												? "border-emerald-500/40 bg-card shadow-xs ring-1 ring-emerald-500/20"
												: "border-border/70 bg-card hover:border-emerald-500/30"
									}`}
								>
									{/* Top Image Preview & Badges */}
									<div className="relative aspect-square w-full overflow-hidden bg-muted/40 flex items-center justify-center p-3">
										{product.imageUrl ? (
											<img
												src={product.imageUrl}
												alt=""
												aria-label={product.name}
												className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
												loading="lazy"
												onError={(e) => {
													e.currentTarget.style.display = "none";
													const next = e.currentTarget.nextElementSibling as HTMLElement;
													if (next) next.style.display = "flex";
												}}
											/>
										) : null}
										<div
											className={`flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60 ${
												product.imageUrl ? "hidden" : "flex"
											}`}
										>
											<PackageIcon className="h-12 w-12 stroke-[1.5]" />
											<span className="font-mono text-[10px] uppercase tracking-wider">
												{product.category || "General"}
											</span>
										</div>

										{/* Status Badges Overlay */}
										<div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
											<span className="rounded-md bg-background/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-2xs border border-border/60">
												{product.category || "General"}
											</span>
											{hasOffer && (
												<span className="flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-2xs animate-pulse">
													<FlameIcon className="h-3 w-3" />
													<span>{product.discountPercent}% OFF</span>
												</span>
											)}
										</div>

										<div className="absolute top-2.5 right-2.5">
											{isOutOfStock ? (
												<span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
													Out of Stock
												</span>
											) : (product as any).stockStatus === "almost_sold_out" ? (
												<span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
													Only {(product as any).availableStock} Left
												</span>
											) : (product as any).stockStatus === "few_left" || (product as any).stockStatus === "selling_fast" ? (
												<span className="rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
													Selling Fast
												</span>
											) : (
												<span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
													In Stock
												</span>
											)}
										</div>
									</div>

									{/* Card Content: Title & Details */}
									<CardHeader className="p-4 pb-2">
										<CardTitle className="line-clamp-2 text-sm sm:text-base font-bold text-foreground leading-snug">
											{product.name}
										</CardTitle>
										{product.description && (
											<CardDescription className="line-clamp-2 text-xs text-muted-foreground mt-1">
												{product.description}
											</CardDescription>
										)}
									</CardHeader>

									{/* Pricing & Volume Slabs */}
									<CardContent className="p-4 pt-0 space-y-2.5">
										<div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
											<div className="flex items-baseline justify-between">
												<div className="flex items-baseline gap-1.5">
													<span className="font-extrabold text-lg sm:text-xl text-foreground">
														₹{effectivePrice.toFixed(2)}
													</span>
													<span className="text-xs text-muted-foreground">
														/ {product.unit || "Pcs"}
													</span>
												</div>
												{(hasOffer || activeSlab) && originalPrice > effectivePrice && (
													<span className="text-xs line-through text-muted-foreground">
														₹{originalPrice.toFixed(2)}
													</span>
												)}
											</div>

											{/* Slab Notice */}
											{(product as any).slabs && (product as any).slabs.length > 0 && (
												<div className="mt-1.5 flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-400">
													<LayersIcon className="h-3 w-3 shrink-0" />
													<span>
														Bulk Slabs: Min {(product as any).slabs[0]?.minQuantity} units for ₹
														{Number((product as any).slabs[0]?.unitPrice).toFixed(2)}
													</span>
												</div>
											)}
										</div>
									</CardContent>

									{/* Action Footer: Quantity Selector & Add Button */}
									<CardFooter className="p-4 pt-0 flex flex-col gap-2">
										<div className="flex w-full items-center gap-2">
											{/* Decimal Stepper */}
											<div className="flex items-center rounded-lg border border-border/80 bg-background shadow-2xs">
												<button
													type="button"
													disabled={isOutOfStock}
													onClick={() => handleDecrement(product.id)}
													className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
													title="Decrease quantity"
												>
													<MinusIcon className="h-3.5 w-3.5" />
												</button>
												<input
													type="text"
													inputMode="decimal"
													disabled={isOutOfStock}
													value={currentQty}
													onChange={(e) => {
														const val = e.target.value;
														const parsed = Number.parseFloat(val);
														if (val === "" || !isNaN(parsed)) {
															setCardQty(product.id, val);
														}
													}}
													onBlur={() => {
														const parsed = Number.parseFloat(String(currentQty));
														const clean = isNaN(parsed) || parsed <= 0 ? 1 : Number(parsed.toFixed(3));
														setCardQty(product.id, clean);
														if (inCartItem) {
															handleAddToCart(product, clean, true);
														}
													}}
													className="h-8 w-12 bg-transparent text-center font-mono text-xs font-semibold focus:outline-none"
												/>
												<button
													type="button"
													disabled={isOutOfStock}
													onClick={() =>
														handleIncrement(
															product.id,
															Number((product as any).availableStock ?? 99999),
														)
													}
													className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
													title="Increase quantity"
												>
													<PlusIcon className="h-3.5 w-3.5" />
												</button>
											</div>

											{/* Add to Cart Button */}
											<Button
												type="button"
												disabled={isOutOfStock}
												onClick={() => handleAddToCart(product)}
												className={`flex-1 h-8 text-xs font-semibold shadow-2xs transition-all ${
													inCartItem
														? "bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
														: "bg-emerald-600 hover:bg-emerald-700 text-white"
												}`}
											>
												{isOutOfStock ? (
													"Sold Out"
												) : inCartItem ? (
													<span className="flex items-center gap-1">
														<CheckCircle2Icon className="h-3.5 w-3.5" />
														<span>In Cart ({inCartItem.quantity})</span>
													</span>
												) : (
													<span className="flex items-center gap-1">
														<ShoppingCartIcon className="h-3.5 w-3.5" />
														<span>Add to Cart</span>
													</span>
												)}
											</Button>
										</div>
									</CardFooter>
								</Card>
							);
						})}
					</div>
				)}
			</main>

			{/* Floating Bottom Cart Summary (Visible when items in cart) */}
			{cartItemsList.length > 0 && (
				<div className="sticky bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 sm:p-4 backdrop-blur-md shadow-2xl transition-all">
					<div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-inner">
								<ShoppingCartIcon className="h-5 w-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<span className="font-extrabold text-foreground text-sm sm:text-base">
										{totalCartCount} items selected
									</span>
									<span className="text-xs text-muted-foreground">
										({cartItemsList.length} distinct products)
									</span>
								</div>
								<div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
									Est. Total: ₹{totalCartAmount.toFixed(2)}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 sm:gap-3">
							<Button
								variant="outline"
								size="sm"
								onClick={() => router.push("/customer/cart")}
								className="text-xs font-medium"
							>
								View Cart
							</Button>
							<Button
								size="sm"
								onClick={handleCheckoutClick}
								className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 gap-1.5 shadow-sm"
							>
								<span>Proceed to Checkout</span>
								<ArrowRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Auth Guard Modal (Login Required to Place Order) */}
			<Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner dark:bg-emerald-950/60 dark:text-emerald-400 mb-2">
							<LogInIcon className="h-7 w-7" />
						</div>
						<DialogTitle className="text-center font-bold text-lg sm:text-xl">
							Sign In Required to Place Order
						</DialogTitle>
						<p className="text-center text-xs sm:text-sm text-muted-foreground pt-1">
							Your selected items and quantities are securely saved in your cart. Please sign in or register to verify your business address, apply credit/GST, and submit your order.
						</p>
					</DialogHeader>

					<div className="my-2 rounded-xl border border-border/70 bg-muted/30 p-3.5 text-xs space-y-2">
						<div className="flex justify-between font-medium">
							<span className="text-muted-foreground">Cart Items:</span>
							<span className="font-bold text-foreground">
								{totalCartCount} units across {cartItemsList.length} products
							</span>
						</div>
						<div className="flex justify-between font-medium">
							<span className="text-muted-foreground">Estimated Order Total:</span>
							<span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
								₹{totalCartAmount.toFixed(2)}
							</span>
						</div>
					</div>

					<DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2.5">
						<Button
							variant="outline"
							className="w-full sm:w-1/2 text-xs"
							onClick={() => {
								setLoginPromptOpen(false);
								router.push(`/signup?callbackUrl=${encodeURIComponent("/customer/cart")}`);
							}}
						>
							Register Business
						</Button>
						<Button
							className="w-full sm:w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
							onClick={() => {
								setLoginPromptOpen(false);
								router.push(`/login?callbackUrl=${encodeURIComponent("/customer/cart")}`);
							}}
						>
							<LogInIcon className="mr-1.5 h-3.5 w-3.5" />
							<span>Sign In & Place Order</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Public Footer */}
			<footer className="border-t border-border/60 bg-muted/20 py-8 text-xs text-muted-foreground">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
					<div className="flex items-center space-x-2">
						<img
							src="/logo.jpg"
							alt="Evaluna ERP"
							className="h-5 w-5 rounded-md object-cover"
						/>
						<span className="font-bold text-foreground">Evaluna ERP</span>
						<span>• Central Logistics Hub, Vidisha Road & Berasia Transit Junction, Bhopal, MP - 403106</span>
					</div>
					<div>
						© {new Date().getFullYear()} Evaluna Technologies Pvt. Ltd. All rights reserved.
					</div>
					<div className="flex items-center space-x-4">
						<Link href="/privacy" className="hover:text-foreground transition-colors">
							Privacy
						</Link>
						<Link href="/terms" className="hover:text-foreground transition-colors">
							Terms
						</Link>
						<Link href="/contact" className="hover:text-foreground transition-colors">
							Contact
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
