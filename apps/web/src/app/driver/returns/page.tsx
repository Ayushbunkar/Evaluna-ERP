"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { ArrowLeftIcon, CheckIcon, PackageXIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

export default function PartialReturnPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const stopId = searchParams.get("stopId");

	const { data: stopDetails, isLoading } = trpc.delivery.getStopDetails.useQuery(
		{ stopId: Number(stopId) },
		{ enabled: !!stopId }
	);

	const processReturn = trpc.delivery.processPartialReturn.useMutation({
		onSuccess: () => {
			router.push("/driver");
		},
	});

	const [returnedItems, setReturnedItems] = useState<Record<number, number>>({});

	if (isLoading) {
		return <div className="p-6 text-center">Loading stop details...</div>;
	}

	if (!stopDetails) {
		return <div className="p-6 text-center text-red-500">Stop not found or no items available.</div>;
	}

	const handleQuantityChange = (productId: number, qty: number, max: number) => {
		if (qty < 0 || qty > max) return;
		setReturnedItems((prev) => ({
			...prev,
			[productId]: qty,
		}));
	};

	const handleSubmit = () => {
		const items = Object.entries(returnedItems)
			.filter(([_, qty]) => qty > 0)
			.map(([productId, qty]) => ({
				productId: Number(productId),
				quantity: qty,
				reason: "Customer Rejected / Damaged",
			}));

		processReturn.mutate({
			stopId: Number(stopId),
			returnedItems: items,
		});
	};

	return (
		<div className="flex h-screen flex-col bg-slate-50">
			{/* Header */}
			<header className="sticky top-0 z-10 flex h-16 items-center border-b border-border/50 bg-white px-4 shadow-sm">
				<Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
					<ArrowLeftIcon className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="font-bold text-lg">Partial Return</h1>
					<p className="text-muted-foreground text-xs">{stopDetails.customer.name}</p>
				</div>
			</header>

			{/* Content */}
			<main className="flex-1 overflow-y-auto p-4 space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-md flex items-center gap-2">
							<PackageXIcon className="h-5 w-5 text-amber-500" /> Select Items to Return
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{stopDetails.items.map((item: any) => (
							<div key={item.product_id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
								<div>
									<p className="font-bold text-sm">{item.product.name}</p>
									<p className="text-muted-foreground text-xs">Delivering: {item.quantity}</p>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return Qty</span>
									<div className="flex items-center rounded-lg border bg-muted/50 p-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 rounded-md"
											onClick={() => handleQuantityChange(item.product_id, (returnedItems[item.product_id] || 0) - 1, item.quantity)}
										>
											-
										</Button>
										<span className="w-8 text-center font-bold text-sm">
											{returnedItems[item.product_id] || 0}
										</span>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 rounded-md"
											onClick={() => handleQuantityChange(item.product_id, (returnedItems[item.product_id] || 0) + 1, item.quantity)}
										>
											+
										</Button>
									</div>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</main>

			{/* Footer */}
			<div className="border-t bg-white p-4 pb-8 safe-area-bottom">
				<Button
					size="lg"
					className="w-full h-14 rounded-xl font-bold shadow-md shadow-primary/20"
					onClick={handleSubmit}
					disabled={processReturn.isPending || Object.values(returnedItems).every(q => q === 0)}
				>
					<CheckIcon className="mr-2 h-5 w-5" />
					Confirm Partial Return
				</Button>
			</div>
		</div>
	);
}
