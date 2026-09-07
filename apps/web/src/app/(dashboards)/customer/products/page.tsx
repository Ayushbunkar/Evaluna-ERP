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
import { useMemo, useState } from "react";
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

	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<string>("all");
	const [cart, setCart] = useState<Record<number, CartItem>>({});
	const [quantities, setQuantities] = useState<Record<number, number>>({});
	const [reviewOpen, setReviewOpen] = useState(false);

	const { data: products, isLoading, error } = trpc.customer.browseProducts.useQuery({
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
		toast.success(`Added ${qtyToAdd} × ${product.name} to order list`);
	};

	const handleRemoveFromCart = (productId: number) => {
		setCart((prev) => {
			const next = { ...prev };
			delete next[productId];
			return next;
		});
	};

	const updateCartQty = (productId: number, qty: number) => {
		if (qty <= 0) {
			handleRemoveFromCart(productId);
			return;
		}
		setCart((prev) => ({
			...prev,
			[productId]: {
				...prev[productId],
				quantity: qty,
			},
		}));
	};

	const submitOrderMutation = trpc.customer.submitOrder.useMutation({
		onSuccess: (res) => {
			toast.success(`Order ${res.orderRef} placed successfully!`);
			setCart({});
			setReviewOpen(false);
			router.push("/customer/orders");
		},
		onError: (err) => {
			toast.error(`Failed to submit order: ${err.message}`);
		},
	});

	const handleSubmitOrder = () => {
		if (cartItemsList.length === 0) return;
		const idempotencyKey = crypto.randomUUID();
		submitOrderMutation.mutate({
			idempotencyKey,
			items: cartItemsList.map((item) => ({
				productId: item.productId,
				quantity: item.quantity,
			})),
		});
	};

	return (
		<PageTransition className="container mx-auto space-y-6 pb-24">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Products & Place Order
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Browse available catalog, select quantities, and submit your order for sales review.
					</p>
				</div>
				{cartItemsList.length > 0 && (
					<Button
						onClick={() => setReviewOpen(true)}
						className="bg-emerald-600 text-white hover:bg-emerald-700"
					>
						<ShoppingBagIcon className="mr-2 h-4 w-4" /> Review Order ({totalCartCount} items)
					</Button>
				)}
			</div>

			{/* Search & Filter Bar */}
			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
					<div className="relative flex-1">
						<SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by product name, SKU..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9 text-xs sm:text-sm"
						/>
					</div>
					<Select value={category} onValueChange={setCategory}>
						<SelectTrigger className="w-full sm:w-[200px] text-xs sm:text-sm">
							<SelectValue placeholder="All Categories" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
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
					Loading available products...
				</div>
			) : error ? (
				<div className="flex h-[300px] items-center justify-center text-destructive text-sm">
					Error loading products: {error.message}
				</div>
			) : (products ?? []).length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
						<PackageIcon className="h-10 w-10 opacity-40" />
						<p className="text-sm">No products found matching your filter.</p>
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
											className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
												isAvailable
													? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
													: "bg-red-500/10 text-red-600 dark:text-red-400"
											}`}
										>
											{isAvailable ? "Available" : "Unavailable"}
										</span>
									</div>
									<CardTitle className="line-clamp-1 mt-2 text-base">
										{product.name}
									</CardTitle>
									<CardDescription className="line-clamp-2 text-xs">
										{product.description}
									</CardDescription>
								</CardHeader>

								<CardContent className="p-4 pt-0 space-y-2">
									{product.sku && (
										<p className="text-[11px] font-mono text-muted-foreground">
											SKU: {product.sku}
										</p>
									)}

									{/* Quantity Control */}
									<div className="flex items-center justify-between gap-2 pt-2">
										<span className="text-xs text-muted-foreground">Quantity</span>
										<div className="flex items-center rounded-md border border-border">
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-none"
												onClick={() => setQty(product.id, currentQty - 1)}
												disabled={currentQty <= 1 || !isAvailable}
											>
												<MinusIcon className="h-3 w-3" />
											</Button>
											<span className="w-8 text-center text-xs font-semibold">
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
										{inCart ? `Add More (${inCart.quantity} in order)` : "Add to Order"}
									</Button>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			)}

			{/* Floating Order Cart Bar */}
			{cartItemsList.length > 0 && (
				<div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-4xl rounded-xl border border-emerald-500/30 bg-card p-4 shadow-xl backdrop-blur sm:left-auto">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="font-bold text-sm text-foreground">
								Order List ({cartItemsList.length} products · {totalCartCount} items)
							</p>
							<p className="text-xs text-muted-foreground">
								Ready to submit for sales confirmation.
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="text-xs"
								onClick={() => setCart({})}
							>
								Clear
							</Button>
							<Button
								size="sm"
								className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
								onClick={() => setReviewOpen(true)}
							>
								<CheckCircle2Icon className="mr-1.5 h-4 w-4" /> Review Order
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Review Order Dialog */}
			<Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Review Your Order</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 text-sm">
						<p className="text-xs text-muted-foreground">
							Please check the selected products and quantities before submitting.
						</p>

						<div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
							{cartItemsList.map((item) => (
								<div
									key={item.productId}
									className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3 bg-muted/20"
								>
									<div>
										<p className="font-semibold text-sm">{item.name}</p>
										{item.sku && (
											<p className="text-[11px] font-mono text-muted-foreground">
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
											<span className="w-8 text-center text-xs font-semibold">
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

						<div className="rounded-lg bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400">
							<p className="font-medium">Order Review Policy</p>
							<p className="mt-0.5 text-[11px]">
								Your order will be reviewed and confirmed by our sales team. You will be contacted to finalize details.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setReviewOpen(false)}
							disabled={submitOrderMutation.isPending}
						>
							Back
						</Button>
						<Button
							className="bg-emerald-600 text-white hover:bg-emerald-700"
							onClick={handleSubmitOrder}
							disabled={submitOrderMutation.isPending || cartItemsList.length === 0}
						>
							{submitOrderMutation.isPending ? "Submitting..." : "Submit Order"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
