"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

export default function PurchaseReturnPage() {
	const { id } = useParams();
	const router = useRouter();
	const purchaseId = Number.parseInt(id as string, 10);

	const { data: purchase, isLoading } = trpc.purchases.get.useQuery({
		id: purchaseId,
	});
	const processReturn = trpc.purchases.processReturn.useMutation({
		onSuccess: () => {
			toast.success("Purchase return processed successfully");
			router.push("/admin/purchases");
		},
	});

	const [returnItems, setReturnItems] = useState<
		Record<number, { quantity: number; refund_amount: number }>
	>({});

	if (isLoading) return <div className="p-8">Loading purchase...</div>;
	if (!purchase) return <div className="p-8">Purchase not found</div>;

	const handleReturnQuantityChange = (
		productId: number,
		qtyStr: string,
		priceStr: string,
	) => {
		const qty = Number.parseInt(qtyStr, 10) || 0;
		const price = Number.parseFloat(priceStr) || 0;

		setReturnItems((prev) => ({
			...prev,
			[productId]: {
				quantity: qty,
				refund_amount: qty * price,
			},
		}));
	};

	const handleSubmit = () => {
		const items = Object.entries(returnItems)
			.filter(([_, data]) => data.quantity > 0)
			.map(([productId, data]) => ({
				product_id: Number.parseInt(productId, 10),
				quantity: data.quantity,
				refund_amount: data.refund_amount,
			}));

		if (items.length === 0) {
			return toast.error("Please specify at least one item to return");
		}

		processReturn.mutate({
			purchase_id: purchaseId,
			items,
		});
	};

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/purchases")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl">Process Purchase Return</h1>
					<p className="text-muted-foreground">
						{purchase.grn_number || `PO-${purchase.id}`} • Supplier:{" "}
						{purchase.supplier?.name}
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Select Items to Return</CardTitle>
					<CardDescription>
						Enter the quantity of each item you want to return to the supplier.
						This will automatically decrement inventory and adjust the
						supplier's outstanding balance.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<table className="w-full border-collapse text-left text-sm">
						<thead>
							<tr className="border-b">
								<th className="py-2">Item ID</th>
								<th>Price Paid</th>
								<th>Purchased Qty</th>
								<th>Return Qty</th>
								<th className="text-right">Refund Total</th>
							</tr>
						</thead>
						<tbody>
							{purchase.purchaseItems?.map((item: any) => {
								const returnData = returnItems[item.product_id] || {
									quantity: 0,
									refund_amount: 0,
								};
								return (
									<tr
										key={item.id}
										className="border-b last:border-0 hover:bg-muted/50"
									>
										<td className="py-4">Product #{item.product_id}</td>
										<td>₹{item.price}</td>
										<td>{item.quantity}</td>
										<td className="w-32">
											<Input
												type="number"
												min="0"
												max={item.quantity}
												value={returnData.quantity || ""}
												onChange={(e) =>
													handleReturnQuantityChange(
														item.product_id,
														e.target.value,
														item.price,
													)
												}
												placeholder="0"
											/>
										</td>
										<td className="text-right font-medium text-red-600">
											₹{returnData.refund_amount.toFixed(2)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>

					<div className="mt-6 flex justify-end">
						<Button onClick={handleSubmit} disabled={processReturn.isPending}>
							Confirm Return
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
