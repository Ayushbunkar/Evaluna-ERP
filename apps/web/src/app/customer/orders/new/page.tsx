"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import {
	MinusIcon,
	PackageIcon,
	PlusIcon,
	SearchIcon,
	ShoppingCartIcon,
	Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

type CartLine = { productId: number; name: string; unit: string | null; qty: number };

export default function NewOrderPage() {
	const trpc = useTRPC();
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [cart, setCart] = useState<Record<number, CartLine>>({});
	// One idempotency key per cart "session" — regenerated after a successful
	// submit so a genuinely new order isn't rejected as a duplicate.
	const idempotencyKey = useRef<string>(crypto.randomUUID());

	const { data: products, isLoading } = trpc.customer.browseProducts.useQuery(
		search.trim() ? { search: search.trim() } : undefined,
	);

	const submit = trpc.customer.submitOrder.useMutation({
		onSuccess: (res) => {
			toast.success(
				res.duplicate
					? "This order was already submitted."
					: "Order submitted! Our team will review it shortly.",
			);
			idempotencyKey.current = crypto.randomUUID();
			setCart({});
			router.push(`/customer/orders/${res.orderId}`);
		},
		onError: (err) => {
			toast.error(err.message || "Could not submit your order. Please retry.");
		},
	});

	const cartLines = useMemo(() => Object.values(cart), [cart]);
	const totalQty = cartLines.reduce((a, l) => a + l.qty, 0);

	const setQty = (line: Omit<CartLine, "qty">, qty: number) => {
		setCart((prev) => {
			const next = { ...prev };
			if (qty <= 0) {
				delete next[line.productId];
			} else {
				next[line.productId] = { ...line, qty };
			}
			return next;
		});
	};

	const handleSubmit = () => {
		if (cartLines.length === 0) return;
		submit.mutate({
			idempotencyKey: idempotencyKey.current,
			items: cartLines.map((l) => ({ productId: l.productId, quantity: l.qty })),
		});
	};

	// PLACEHOLDER_NEW_ORDER_JSX

	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
			<div className="space-y-4">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">New Order</h1>
					<p className="text-muted-foreground text-sm">
						Choose the items and quantities you need. Our team will confirm
						pricing after review.
					</p>
				</div>

				<div className="relative">
					<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search products…"
						className="pl-9"
					/>
				</div>

				{isLoading ? (
					<p className="text-muted-foreground text-sm">Loading products…</p>
				) : (products ?? []).length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center gap-2 py-12 text-center">
							<PackageIcon className="h-10 w-10 text-muted-foreground" />
							<p className="text-muted-foreground text-sm">
								No products found.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-2 sm:grid-cols-2">
						{(products ?? []).map((p) => {
							const line = cart[p.id];
							const qty = line?.qty ?? 0;
							const base = { productId: p.id, name: p.name, unit: p.unit };
							return (
								<div
									key={p.id}
									className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card p-3"
								>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">{p.name}</p>
										<p className="text-muted-foreground text-xs">
											{p.category}
											{p.unit ? ` · ${p.unit}` : ""}
										</p>
									</div>
									{qty === 0 ? (
										<Button
											size="sm"
											variant="outline"
											onClick={() => setQty(base, 1)}
										>
											<PlusIcon className="mr-1 h-3.5 w-3.5" /> Add
										</Button>
									) : (
										<div className="flex items-center gap-1.5">
											<Button
												size="icon"
												variant="outline"
												className="h-7 w-7"
												onClick={() => setQty(base, qty - 1)}
											>
												<MinusIcon className="h-3.5 w-3.5" />
											</Button>
											<span className="w-6 text-center font-medium text-sm">
												{qty}
											</span>
											<Button
												size="icon"
												variant="outline"
												className="h-7 w-7"
												onClick={() => setQty(base, qty + 1)}
											>
												<PlusIcon className="h-3.5 w-3.5" />
											</Button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Cart / review — NO prices shown anywhere. */}
			<div className="lg:sticky lg:top-4 lg:self-start">
				<Card className="border-border/50">
					<CardContent className="space-y-3 p-4">
						<div className="flex items-center gap-2 font-semibold">
							<ShoppingCartIcon className="h-4 w-4" /> Your Order
							<span className="ml-auto text-muted-foreground text-sm">
								{totalQty} item(s)
							</span>
						</div>

						{cartLines.length === 0 ? (
							<p className="py-6 text-center text-muted-foreground text-sm">
								No items yet. Add products from the list.
							</p>
						) : (
							<div className="space-y-2">
								{cartLines.map((l) => (
									<div
										key={l.productId}
										className="flex items-center justify-between gap-2 text-sm"
									>
										<span className="min-w-0 truncate">{l.name}</span>
										<span className="flex items-center gap-2">
											<span className="text-muted-foreground">×{l.qty}</span>
											<button
												type="button"
												onClick={() =>
													setQty(
														{ productId: l.productId, name: l.name, unit: l.unit },
														0,
													)
												}
												className="text-muted-foreground hover:text-destructive"
											>
												<Trash2Icon className="h-3.5 w-3.5" />
											</button>
										</span>
									</div>
								))}
							</div>
						)}

						<p className="rounded-md bg-muted/60 p-2 text-muted-foreground text-xs">
							Pricing is confirmed by our team after review — you'll see the
							total on your invoice once the order is confirmed.
						</p>

						<Button
							className="w-full"
							disabled={cartLines.length === 0 || submit.isPending}
							onClick={handleSubmit}
						>
							{submit.isPending ? "Submitting…" : "Submit Order"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
