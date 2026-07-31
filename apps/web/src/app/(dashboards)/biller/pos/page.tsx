"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	BanknoteIcon,
	CreditCardIcon,
	MinusIcon,
	PlusIcon,
	SearchIcon,
	ShoppingCartIcon,
	TagIcon,
	Trash2Icon,
	UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

type Product = {
	id: number;
	name: string;
	sku: string | null;
	description: string | null;
	price: number;
	category: string | null;
	stock_quantity: number | null;
	image_url: string | null;
};

type CartItem = Product & { cartQuantity: number };

export default function POSCatalogPage() {
	const trpc = useTRPC();
	const _tc = useTranslations("common");
	const locale = useLocale();

	// In a real scenario, this trpc.pos.catalog might return the products.
	// We map it to our Product type.
	const { data: rawData = [], isLoading, error } = trpc.pos.catalog.useQuery();
	const products = rawData as unknown as Product[];

	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [customerName, setCustomerName] = useState("");
	const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
	const [customerInput, setCustomerInput] = useState("");

	// Derived state
	const categories = useMemo(() => {
		const cats = new Set(
			products.map((p) => p.category).filter(Boolean) as string[],
		);
		return Array.from(cats);
	}, [products]);

	const filteredProducts = useMemo(() => {
		return products.filter((p) => {
			const matchesSearch =
				p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = selectedCategory
				? p.category === selectedCategory
				: true;
			return matchesSearch && matchesCategory;
		});
	}, [products, searchTerm, selectedCategory]);

	const cartTotal = useMemo(() => {
		return cart.reduce(
			(total, item) => total + item.price * item.cartQuantity,
			0,
		);
	}, [cart]);

	const tax = cartTotal * 0.1; // 10% tax example
	const grandTotal = cartTotal + tax;

	// Actions
	const addToCart = (product: Product) => {
		setCart((prev) => {
			const existing = prev.find((item) => item.id === product.id);
			if (existing) {
				return prev.map((item) =>
					item.id === product.id
						? { ...item, cartQuantity: item.cartQuantity + 1 }
						: item,
				);
			}
			return [...prev, { ...product, cartQuantity: 1 }];
		});
	};

	const updateQuantity = (id: number, delta: number) => {
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const newQty = Math.max(1, item.cartQuantity + delta);
					return { ...item, cartQuantity: newQty };
				}
				return item;
			}),
		);
	};

	const removeFromCart = (id: number) => {
		setCart((prev) => prev.filter((item) => item.id !== id));
	};

	const clearCart = () => setCart([]);

	const handleCheckout = (method: string) => {
		if (cart.length === 0) return;
		toast.success(`Payment successful via ${method}`);
		clearCart();
	};

	if (isLoading) {
		return (
			<div className="flex h-[calc(100vh-8rem)] animate-pulse gap-6">
				<div className="flex flex-1 flex-col gap-4">
					<Skeleton className="h-12 w-full rounded-xl" />
					<div className="flex gap-2">
						<Skeleton className="h-8 w-24 rounded-full" />
						<Skeleton className="h-8 w-24 rounded-full" />
					</div>
					<div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<Skeleton key={i} className="aspect-square rounded-2xl" />
						))}
					</div>
				</div>
				<div className="w-[350px] lg:w-[400px]">
					<Skeleton className="h-full w-full rounded-2xl" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="font-medium text-red-500">
				Failed to load catalog: {error.message}
			</div>
		);
	}

	return (
		<PageTransition>
			<div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden lg:flex-row">
				{/* Left Side: Catalog */}
				<div className="flex h-full flex-1 flex-col gap-4 overflow-hidden">
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1">
							<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search products by name or SKU..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="h-11 rounded-xl border-border/50 bg-background pl-9 shadow-sm"
							/>
						</div>
						<Dialog
							open={isCustomerDialogOpen}
							onOpenChange={setIsCustomerDialogOpen}
						>
							<DialogTrigger asChild>
								<Button
									variant="outline"
									className="h-11 gap-2 rounded-xl border-border/50 bg-background shadow-sm"
								>
									<UserIcon className="h-4 w-4" />{" "}
									{customerName || "Add Customer"}
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Select or Add Customer</DialogTitle>
								</DialogHeader>
								<div className="flex flex-col gap-4 py-4">
									<Input
										placeholder="Enter customer name..."
										value={customerInput}
										onChange={(e) => setCustomerInput(e.target.value)}
									/>
									<Button
										onClick={() => {
											setCustomerName(customerInput);
											setIsCustomerDialogOpen(false);
										}}
									>
										Save Customer
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>

					<div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto pb-2">
						<Badge
							variant={selectedCategory === null ? "default" : "outline"}
							className="cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 font-medium text-sm transition-all"
							onClick={() => setSelectedCategory(null)}
						>
							All Items
						</Badge>
						{categories.map((cat) => (
							<Badge
								key={cat}
								variant={selectedCategory === cat ? "default" : "outline"}
								className="cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 font-medium text-sm transition-all"
								onClick={() => setSelectedCategory(cat)}
							>
								{cat}
							</Badge>
						))}
					</div>

					<div className="-mr-4 flex-1 overflow-y-auto pr-4">
						<div className="grid grid-cols-2 gap-4 pb-20 md:grid-cols-3 xl:grid-cols-4">
							{filteredProducts.length === 0 ? (
								<div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
									<TagIcon className="mb-4 h-12 w-12 opacity-20" />
									<p>No products found matching your search.</p>
								</div>
							) : (
								filteredProducts.map((product) => (
									<motion.div
										key={product.id}
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => addToCart(product)}
									>
										<Card className="group h-full cursor-pointer overflow-hidden rounded-2xl border-border/40 bg-background/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md">
											<div className="relative flex aspect-square items-center justify-center bg-muted/30 p-6 transition-colors group-hover:bg-primary/5">
												{product.image_url ? (
													<Image
														src={product.image_url}
														alt={product.name}
														fill
														className="object-contain p-4"
													/>
												) : (
													<PackageIcon className="h-16 w-16 text-muted-foreground/30" />
												)}
												{product.stock_quantity !== null &&
													product.stock_quantity < 5 && (
														<span className="absolute top-2 right-2 rounded-full bg-red-100 px-2 py-0.5 font-bold text-[10px] text-red-700">
															{product.stock_quantity} left
														</span>
													)}
											</div>
											<CardContent className="space-y-1 p-4 pt-3">
												<h3 className="line-clamp-2 font-semibold text-sm leading-tight">
													{product.name}
												</h3>
												<p className="text-muted-foreground text-xs">
													{product.sku}
												</p>
												<div className="pt-2 font-bold text-base text-primary">
													{formatCurrency(product.price, locale)}
												</div>
											</CardContent>
										</Card>
									</motion.div>
								))
							)}
						</div>
					</div>
				</div>

				{/* Right Side: Cart */}
				<Card className="flex h-full w-full shrink-0 flex-col overflow-hidden rounded-2xl border-border/50 bg-background/80 shadow-lg backdrop-blur-xl lg:w-[400px]">
					<CardHeader className="shrink-0 border-border/40 border-b bg-muted/20 pb-4">
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-lg">
								<ShoppingCartIcon className="h-5 w-5 text-primary" />
								Current Order
							</CardTitle>
							{cart.length > 0 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={clearCart}
									className="h-8 px-2 text-destructive text-xs hover:bg-destructive/10 hover:text-destructive"
								>
									Clear
								</Button>
							)}
						</div>
					</CardHeader>

					<div className="flex-1 overflow-y-auto px-4">
						{cart.length === 0 ? (
							<div className="flex h-[300px] flex-col items-center justify-center text-muted-foreground opacity-60">
								<ShoppingCartIcon className="mb-4 h-16 w-16 stroke-1" />
								<p>Cart is empty</p>
								<p className="text-sm">Click items to add them</p>
							</div>
						) : (
							<div className="flex flex-col gap-3 py-4">
								{cart.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40"
									>
										<div className="min-w-0 flex-1">
											<h4 className="truncate font-medium text-sm">
												{item.name}
											</h4>
											<p className="text-muted-foreground text-xs">
												{formatCurrency(item.price, locale)}
											</p>
										</div>
										<div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background p-0.5 shadow-sm">
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive"
												onClick={() => updateQuantity(item.id, -1)}
											>
												<MinusIcon className="h-3 w-3" />
											</Button>
											<span className="w-5 text-center font-semibold text-sm">
												{item.cartQuantity}
											</span>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary"
												onClick={() => updateQuantity(item.id, 1)}
											>
												<PlusIcon className="h-3 w-3" />
											</Button>
										</div>
										<div className="w-16 text-right font-semibold text-sm">
											{formatCurrency(item.price * item.cartQuantity, locale)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
											onClick={() => removeFromCart(item.id)}
										>
											<Trash2Icon className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>

					<CardFooter className="shrink-0 flex-col gap-4 border-border/40 border-t bg-muted/20 p-5">
						<div className="w-full space-y-2 text-sm">
							<div className="flex justify-between text-muted-foreground">
								<span>Subtotal</span>
								<span>{formatCurrency(cartTotal, locale)}</span>
							</div>
							<div className="flex justify-between text-muted-foreground">
								<span>Tax (10%)</span>
								<span>{formatCurrency(tax, locale)}</span>
							</div>
							<div className="mt-2 flex justify-between border-border/50 border-t pt-2 font-bold text-lg">
								<span>Total</span>
								<span className="text-primary">
									{formatCurrency(grandTotal, locale)}
								</span>
							</div>
						</div>

						<div className="mt-2 grid w-full grid-cols-2 gap-2">
							<Button
								size="lg"
								className="h-14 rounded-xl bg-emerald-600 text-white shadow-emerald-900/20 shadow-lg hover:bg-emerald-700"
								onClick={() => handleCheckout("Cash")}
								disabled={cart.length === 0}
							>
								<BanknoteIcon className="mr-2 h-5 w-5" /> Cash
							</Button>
							<Button
								size="lg"
								className="h-14 rounded-xl shadow-lg shadow-primary/20"
								onClick={() => handleCheckout("Card")}
								disabled={cart.length === 0}
							>
								<CreditCardIcon className="mr-2 h-5 w-5" /> Card
							</Button>
						</div>
					</CardFooter>
				</Card>
			</div>
		</PageTransition>
	);
}
