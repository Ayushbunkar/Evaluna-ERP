"use client";

import { ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { trpc } from "@/lib/trpc/client";

export function CustomerCartHeaderButton() {
	const pathname = usePathname();
	const { session } = useSession();

	const { data: serverCart } = trpc.customer.getCart.useQuery(undefined, {
		refetchOnWindowFocus: true,
		staleTime: 10_000,
		enabled: !!session?.user,
	});

	const [guestCount, setGuestCount] = useState(0);
	const [guestTotal, setGuestTotal] = useState(0);

	useEffect(() => {
		const updateGuestCart = () => {
			if (session?.user) return;
			try {
				const raw = localStorage.getItem("evaluna_guest_cart");
				if (raw) {
					const parsed = JSON.parse(raw);
					const items = Object.values(parsed || {});
					const count = items.length;
					const total = items.reduce(
						(sum: number, item: any) =>
							sum + Number(item.price || 0) * Number(item.quantity || 0),
						0,
					);
					setGuestCount(count);
					setGuestTotal(total);
				} else {
					setGuestCount(0);
					setGuestTotal(0);
				}
			} catch (_e) {
				setGuestCount(0);
				setGuestTotal(0);
			}
		};

		updateGuestCart();
		window.addEventListener("storage", updateGuestCart);
		window.addEventListener("evaluna_cart_updated", updateGuestCart);
		return () => {
			window.removeEventListener("storage", updateGuestCart);
			window.removeEventListener("evaluna_cart_updated", updateGuestCart);
		};
	}, [session?.user]);

	const itemCount = session?.user
		? serverCart?.itemCount ?? 0
		: guestCount;

	const totalAmount = session?.user
		? serverCart?.estimatedTotal ?? 0
		: guestTotal;

	const isCartPage = pathname === "/customer/cart";

	return (
		<Link href="/customer/cart" title="Shopping Cart">
			<Button
				variant={isCartPage ? "secondary" : "ghost"}
				size="sm"
				className={`relative h-9 gap-1.5 px-2.5 font-semibold transition-all ${
					itemCount > 0
						? "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
						: "text-muted-foreground hover:text-foreground"
				} ${isCartPage ? "bg-emerald-500/10 font-bold dark:bg-emerald-500/20" : ""}`}
			>
				<div className="relative flex items-center justify-center">
					<ShoppingCartIcon className="h-4 w-4" />
					{itemCount > 0 && (
						<span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold text-white shadow-xs animate-in zoom-in-75">
							{itemCount > 99 ? "99+" : itemCount}
						</span>
					)}
				</div>
				<span className="hidden sm:inline-block text-xs">
					Cart
					{itemCount > 0 && (
						<span className="ml-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
							(₹
							{totalAmount.toLocaleString(undefined, {
								minimumFractionDigits: 0,
								maximumFractionDigits: 0,
							})}
							)
						</span>
					)}
				</span>
			</Button>
		</Link>
	);
}
