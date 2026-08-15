"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Minus,
	Plus,
	Search,
	ShoppingCart,
	Tag,
	Ticket,
	Trash2,
	Wifi,
	WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PaymentModal } from "@/components/pos/payment-modal";
import { SaleCompletionScreen } from "@/components/pos/SaleCompletionScreen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	AnimatedButton,
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

export default function POSPage() {
	const [cart, setCart] = useState<any[]>([]);
	const [search, setSearch] = useState("");
	const [isOffline, setIsOffline] = useState(false);
	const [paymentModalOpen, setPaymentModalOpen] = useState(false);
	const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);
	const [resumeId, setResumeId] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			setResumeId(params.get("resume"));
		}
	}, []);

	const { data: resumeOrder } = trpc.orders.get.useQuery(
		{ id: Number(resumeId) },
		{ enabled: !!resumeId },
	);

	useEffect(() => {
		if (resumeOrder && resumeOrder.orderItems && cart.length === 0) {
			const restoredCart = resumeOrder.orderItems.map((item: any) => ({
				id: item.product?.id || item.product_id,
				name: item.product?.name || `Item #${item.product_id}`,
				price: item.price,
				qty: item.quantity,
			}));
			setCart(restoredCart);
			// Clean up URL so refresh doesn't keep reloading it
			if (typeof window !== "undefined") {
				window.history.replaceState({}, "", window.location.pathname);
			}
		}
	}, [resumeOrder]);

	const [couponCode, setCouponCode] = useState("");
	const [couponModalOpen, setCouponModalOpen] = useState(false);
	const [lastPayments, setLastPayments] = useState<any[]>([]);
	const [appliedCoupon, setAppliedCoupon] = useState<{
		id: number;
		code: string;
		discount: number;
	} | null>(null);

	const utils = trpc.useUtils();

	// TRPC Queries
	const { data: catalog, isLoading } = trpc.pos.catalog.useQuery(undefined, {
		staleTime: 1000 * 60 * 60, // heavily cache for offline use
	});

	const deleteHoldBillMutation = trpc.orders.delete.useMutation();

	const checkoutMutation = trpc.pos.checkout.useMutation({
		onSuccess: (data) => {
			toast.success("Order processed successfully!");
			setLastCompletedOrder({
				id: data.id,
				createdAt: new Date().toISOString(),
				items: cart,
				total: total,
				subtotal: subtotal,
				discount: discount,
				couponCode: appliedCoupon?.code,
				payments: lastPayments,
			});
			setCart([]);
			setAppliedCoupon(null);

			utils.orders.list.invalidate();
			utils.cashbook.getLedger.invalidate();
			utils.cashbook.getDailySummary.invalidate();

			if (resumeId) {
				deleteHoldBillMutation.mutate({ id: Number(resumeId) });
				setResumeId(null);
			}
		},
		onError: (err) => {
			toast.error(`Checkout failed: ${err.message}`);
		},
	});

	const suspendMutation = trpc.pos.suspendCart.useMutation({
		onSuccess: () => {
			toast.success("Bill put on hold!");
			setCart([]);
			setAppliedCoupon(null);
			utils.orders.list.invalidate();
		},
		onError: (err) => {
			toast.error(`Hold bill failed: ${err.message}`);
		},
	});

	// Offline Detection
	useEffect(() => {
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		setIsOffline(!navigator.onLine);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const subtotal = cart.reduce(
		(acc, item) => acc + Number.parseFloat(item.price) * item.qty,
		0,
	);
	const discount = appliedCoupon?.discount || 0;
	const total = Math.max(0, subtotal - discount);

	const validateCouponMutation = trpc.marketing.validateCoupon.useMutation({
		onSuccess: (data) => {
			setAppliedCoupon({
				id: (data as any).id || (data as any).couponId,
				code: data.code,
				discount: data.discountAmount,
			});
			toast.success("Coupon applied!");
			setCouponCode("");
		},
		onError: (error) => {
			toast.error(error.message);
			setAppliedCoupon(null);
		},
	});

	const handleApplyCoupon = () => {
		if (!couponCode) return;
		validateCouponMutation.mutate({
			code: couponCode,
			cartTotal: subtotal,
		} as any);
	};

	const removeCoupon = () => {
		setAppliedCoupon(null);
	};

	// Barcode Scanner Listener
	const addToCart = (product: any, qty = 1) => {
		setCart((prev) => {
			const existing = prev.find((item) => item.id === product.id);
			if (existing) {
				return prev.map((item) =>
					item.id === product.id ? { ...item, qty: item.qty + qty } : item,
				);
			}
			return [...prev, { ...product, qty: qty }];
		});
	};

	useEffect(() => {
		let barcode = "";
		let timeout: NodeJS.Timeout;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in an input field
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			if (e.key === "Enter") {
				if (barcode && catalog) {
					if (barcode.length === 13 && barcode.startsWith("21")) {
						const itemCode = barcode.substring(2, 7);
						const weightStr = barcode.substring(7, 12);
						const qty = Number.parseFloat(weightStr) / 1000;
						const product = catalog.find((p) => p.barcode === itemCode);
						if (product) {
							if (product.is_weighted) {
								addToCart(product, qty);
								toast.success(`Added ${product.name}`);
							} else {
								addToCart(product, 1);
								toast.warning("Product is not weighted, added 1 unit");
							}
						} else {
							toast.error("Product not found");
						}
					} else if (barcode.length === 13 && barcode.startsWith("22")) {
						const itemCode = barcode.substring(2, 7);
						const priceStr = barcode.substring(7, 12);
						const price = Number.parseFloat(priceStr) / 100;
						const product = catalog.find((p) => p.barcode === itemCode);
						if (product) {
							if (product.is_weighted) {
								const qty = price / Number.parseFloat(product.price);
								addToCart(product, qty);
								toast.success(`Added ${product.name}`);
							} else {
								addToCart(product, 1);
								toast.warning("Product is not weighted, added 1 unit");
							}
						} else {
							toast.error("Product not found");
						}
					} else {
						const product = catalog.find(
							(p) => p.barcode === barcode || p.sku === barcode,
						);
						if (product) {
							addToCart(product, 1);
							toast.success(`Added ${product.name}`);
						} else {
							toast.error("Product not found");
						}
					}
				}
				barcode = "";
				return;
			}

			if (e.key.length === 1) {
				barcode += e.key;
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					barcode = "";
				}, 100); // 100ms timeout to distinguish scanner from manual typing
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [catalog, addToCart]);

	const updateQty = (id: number, delta: number) => {
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const newQty = Math.max(0.001, item.qty + delta);
					return { ...item, qty: newQty };
				}
				return item;
			}),
		);
	};

	const removeFromCart = (id: number) => {
		setCart((prev) => prev.filter((item) => item.id !== id));
	};

	const handleCheckout = () => {
		if (cart.length === 0) return toast.error("Cart is empty");
		setPaymentModalOpen(true);
	};

	const finalizeOrder = (payments: any[]) => {
		if (isOffline) {
			toast.info("Saved offline bill. Will sync when online.");
			setCart([]);
			setAppliedCoupon(null);
			return;
		}

		setLastPayments(payments);
		checkoutMutation.mutate({
			items: cart.map((c) => ({
				productId: c.id,
				quantity: c.qty,
				price: c.price,
			})),
			payments: payments,
			isOfflineSync: false,
			couponId: appliedCoupon?.id,
			discountAmount: appliedCoupon?.discount
				? String(appliedCoupon.discount)
				: undefined,
		} as any);
	};

	const filteredCatalog = catalog?.filter(
		(p) =>
			p.name.toLowerCase().includes(search.toLowerCase()) ||
			p.barcode?.includes(search),
	);

	return (
		<PageTransition className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted/40">
			{/* Left Pane - Catalog */}
			<div className="flex min-h-0 flex-1 flex-col border-r p-4">
				<div className="mb-4 flex shrink-0 items-center justify-between">
					<h1 className="font-bold text-2xl">Point of Sale</h1>
					<div className="flex items-center gap-2">
						{isOffline ? (
							<span className="flex items-center gap-2 font-semibold text-destructive">
								<WifiOff className="h-4 w-4" /> Offline
							</span>
						) : (
							<span className="flex items-center gap-2 font-semibold text-primary">
								<Wifi className="h-4 w-4" /> Online
							</span>
						)}
					</div>
				</div>

				<div className="relative mb-4 shrink-0">
					<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search products by name or scan barcode..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="bg-background pl-9"
					/>
				</div>

				<ScrollArea className="min-h-0 flex-1">
					{isLoading ? (
						<div className="grid grid-cols-2 gap-4 p-2 md:grid-cols-3 lg:grid-cols-4">
							{[1, 2, 3, 4, 5, 6].map((n) => (
								<div
									key={n}
									className="h-32 animate-pulse rounded-xl bg-muted"
								/>
							))}
						</div>
					) : (
						<StaggerList className="grid grid-cols-2 gap-4 p-2 md:grid-cols-3 lg:grid-cols-4">
							{filteredCatalog?.map((product) => (
								<StaggerItem key={product.id}>
									<AnimatedCard>
										<Card
											className="flex h-full cursor-pointer flex-col justify-between border-transparent shadow-sm transition-colors hover:border-primary/50"
											onClick={() => addToCart(product)}
										>
											<CardHeader className="p-4 pb-2">
												<CardTitle
													className="truncate font-semibold text-sm"
													title={product.name}
												>
													{product.name}
												</CardTitle>
											</CardHeader>
											<CardContent className="flex flex-col justify-end p-4 pt-0">
												<div className="font-bold text-lg text-primary">
													₹{Number.parseFloat(product.price).toFixed(2)}
												</div>
												<div className="mt-1 line-clamp-2 min-h-[32px] text-muted-foreground text-xs">
													{product.description || ""}
												</div>
											</CardContent>
										</Card>
									</AnimatedCard>
								</StaggerItem>
							))}
						</StaggerList>
					)}
				</ScrollArea>
			</div>

			{/* Right Pane - Cart */}
			<div className="z-10 flex min-h-0 w-[350px] shrink-0 flex-col bg-background p-4 shadow-xl lg:w-[400px]">
				<div className="mb-4 flex shrink-0 items-center justify-between">
					<h2 className="flex items-center gap-2 font-bold text-xl">
						<ShoppingCart className="h-5 w-5" /> Current Order
					</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setCart([])}
						disabled={cart.length === 0}
					>
						Clear
					</Button>
				</div>
				<ScrollArea className="min-h-0 flex-1 bg-muted/20 p-4">
					<AnimatePresence>
						{cart.length === 0 ? (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="flex h-full flex-col items-center justify-center space-y-4 text-muted-foreground"
							>
								<ShoppingCart className="h-16 w-16 opacity-20" />
								<p>Cart is empty</p>
								<p className="text-xs">Scan a barcode or click a product</p>
							</motion.div>
						) : (
							<div className="space-y-3 pr-4">
								{cart.map((item) => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, scale: 0.9, x: 20 }}
										animate={{ opacity: 1, scale: 1, x: 0 }}
										exit={{ opacity: 0, scale: 0.9, x: -20 }}
										className="flex w-full flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm overflow-hidden"
									>
										<div className="flex w-full items-center justify-between gap-2">
											<div className="min-w-0 flex-1 truncate font-semibold text-sm" title={item.name}>
												{item.name}
											</div>
											<div className="shrink-0 whitespace-nowrap text-muted-foreground text-xs">
												₹{Number.parseFloat(item.price).toFixed(2)} / unit
											</div>
										</div>

										<div className="flex w-full items-center justify-between gap-2">
											<div className="flex h-8 items-center rounded-md border">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-none rounded-l-md"
													onClick={() => updateQty(item.id, -1)}
												>
													<Minus className="h-3 w-3" />
												</Button>
												<span className="w-12 text-center font-semibold text-sm">
													{Number.isInteger(item.qty)
														? item.qty
														: item.qty.toFixed(3)}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-none rounded-r-md"
													onClick={() => updateQty(item.id, 1)}
												>
													<Plus className="h-3 w-3" />
												</Button>
											</div>
											<div className="flex items-center gap-3">
												<span className="font-bold text-sm">
													₹
													{(Number.parseFloat(item.price) * item.qty).toFixed(
														2,
													)}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive hover:bg-destructive/10"
													onClick={() => removeFromCart(item.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</motion.div>
								))}
							</div>
						)}
					</AnimatePresence>
				</ScrollArea>

				<div className="mt-4 shrink-0 space-y-3 border-t pt-4">
					{/* Subtotal row */}
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>Subtotal</span>
						<span>₹{subtotal.toFixed(2)}</span>
					</div>

					{/* Coupon row */}
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<div className="flex items-center gap-2">
							<span>Discount</span>
							{appliedCoupon ? (
								<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs">
									<Ticket className="h-3 w-3" />
									{appliedCoupon.code}
									<button
										type="button"
										className="ml-1 text-green-500 hover:text-red-500"
										onClick={removeCoupon}
										title="Remove coupon"
									>
										×
									</button>
								</span>
							) : (
								<Button
									variant="outline"
									size="sm"
									className="h-6 gap-1 px-2 text-xs"
									onClick={() => setCouponModalOpen(true)}
									disabled={cart.length === 0}
								>
									<Ticket className="h-3 w-3" /> Add Coupon
								</Button>
							)}
						</div>
						<span className="text-green-600">− ₹{discount.toFixed(2)}</span>
					</div>
					<div className="flex items-center justify-between border-t pt-2 font-bold text-2xl">
						<span>Total</span>
						<span>₹{total.toFixed(2)}</span>
					</div>

					<div className="grid grid-cols-2 gap-2 pt-4">
						<Button
							variant="secondary"
							size="lg"
							className="w-full"
							onClick={() => {
								suspendMutation.mutate({
									items: cart,
									total: total.toString(),
								});
							}}
							disabled={cart.length === 0 || suspendMutation.isPending}
						>
							{suspendMutation.isPending ? "Holding..." : "Hold Bill"}
						</Button>
						<Button
							size="lg"
							className="w-full font-bold text-lg"
							onClick={handleCheckout}
							disabled={cart.length === 0 || checkoutMutation.isPending}
						>
							{checkoutMutation.isPending ? "Processing..." : "Pay Now"}
						</Button>
					</div>
				</div>
			</div>

			{paymentModalOpen && (
				<PaymentModal
					open={paymentModalOpen}
					onOpenChange={setPaymentModalOpen}
					totalAmount={total}
					onConfirm={(payments: any[]) => finalizeOrder(payments)}
				/>
			)}

			{/* Coupon Modal */}
			<Dialog open={couponModalOpen} onOpenChange={setCouponModalOpen}>
				<DialogContent className="sm:max-w-[380px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Ticket className="h-5 w-5 text-primary" />
							Apply Coupon Code
						</DialogTitle>
						<DialogDescription>
							Enter your coupon code below to get a discount on your order.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-3 py-2">
						<Input
							placeholder="Enter coupon code (e.g. SAVE10)"
							value={couponCode}
							onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
							className="text-sm"
							onKeyDown={(e) => {
								if (e.key === "Enter" && couponCode) {
									handleApplyCoupon();
									setCouponModalOpen(false);
								}
							}}
							autoFocus
						/>
					</div>
					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setCouponModalOpen(false);
								setCouponCode("");
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								handleApplyCoupon();
								setCouponModalOpen(false);
							}}
							disabled={!couponCode || validateCouponMutation.isPending}
						>
							{validateCouponMutation.isPending
								? "Applying..."
								: "Apply Coupon"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{lastCompletedOrder && (
				<SaleCompletionScreen
					order={lastCompletedOrder}
					onNewSale={() => setLastCompletedOrder(null)}
				/>
			)}
		</PageTransition>
	);
}
