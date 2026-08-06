"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	ArrowLeftIcon,
	CheckCircle2Icon,
	ReceiptIcon,
	SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { AnimatedCard, motion, PageTransition } from "@/lib/animations";
import { formatCurrency } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

export default function CreateSalesReturn() {
	const [searchInput, setSearchInput] = useState("");
	const [searchId, setSearchId] = useState<number | null>(null);
	const [selectedItems, setSelectedItems] = useState<Record<number, number>>({}); // itemId -> return qty
	const [reason, setReason] = useState("defective");
	const [notes, setNotes] = useState("");

	const router = useRouter();
	const locale = useLocale();

	const { data: order, isFetching } = trpc.orders.get.useQuery(
		{ id: searchId! },
		{ enabled: !!searchId },
	);

	const createMutation = trpc.salesReturns.create.useMutation({
		onSuccess: () => {
			toast.success("Sales return logged successfully!");
			router.push("/sales/returns/list");
		},
		onError: (err) => {
			toast.error(`Failed to create return: ${err.message}`);
		},
	});

	const handleSearch = () => {
		const parsed = parseInt(searchInput.replace(/\D/g, ""), 10);
		if (!parsed || isNaN(parsed)) {
			toast.error("Please enter a valid numeric Order ID.");
			return;
		}
		setSearchId(parsed);
	};

	const toggleItemSelection = (itemId: number, maxQty: number, checked: boolean) => {
		setSelectedItems((prev) => {
			const next = { ...prev };
			if (checked) {
				next[itemId] = 1; // Default to 1 on select
			} else {
				delete next[itemId];
			}
			return next;
		});
	};

	const updateItemQty = (itemId: number, maxQty: number, qty: number) => {
		if (qty < 1) qty = 1;
		if (qty > maxQty) qty = maxQty;
		setSelectedItems((prev) => ({ ...prev, [itemId]: qty }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!order) return;

		const itemsToReturn = Object.entries(selectedItems).map(([idStr, qty]) => {
			const itemId = parseInt(idStr, 10);
			const orderItem = order.orderItems.find((i: any) => i.id === itemId);
			if (!orderItem) throw new Error("Invalid item");
			return {
				productId: orderItem.product_id!,
				quantity: qty,
				price: Number(orderItem.price),
				refundAmount: Number(orderItem.price) * qty,
			};
		});

		if (itemsToReturn.length === 0) {
			toast.error("Please select at least one item to return.");
			return;
		}

		const totalRefund = itemsToReturn.reduce((acc, curr) => acc + curr.refundAmount, 0);

		createMutation.mutate({
			orderId: order.id,
			customerId: order.customer_id!,
			items: itemsToReturn,
			totalAmount: totalRefund,
			cgstAmount: 0,
			sgstAmount: 0,
			igstAmount: 0,
		});
	};

	return (
		<PageTransition className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild className="rounded-full">
					<Link href="/sales/returns/list">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						New Sales Return
					</h1>
					<p className="text-muted-foreground text-sm">
						Log a returned item from a previous sale.
					</p>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<div className="space-y-6 md:col-span-2">
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
							<CardHeader>
								<CardTitle>Lookup Order</CardTitle>
								<CardDescription>
									Enter the receipt or order number to fetch sale details.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex gap-2">
									<div className="relative flex-1">
										<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											placeholder="e.g. 1234"
											className="pl-9"
											value={searchInput}
											onChange={(e) => setSearchInput(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && handleSearch()}
										/>
									</div>
									<Button
										onClick={handleSearch}
										disabled={isFetching || !searchInput}
									>
										{isFetching ? "Searching..." : "Find"}
									</Button>
								</div>
								{searchId && !isFetching && !order && (
									<p className="mt-4 text-sm text-red-500">
										Order not found or you don't have access to it.
									</p>
								)}
							</CardContent>
						</Card>
					</AnimatedCard>

					{order && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
						>
							<Card className="border-border/50 bg-card/50 shadow-sm">
								<form onSubmit={handleSubmit}>
									<CardHeader>
										<CardTitle>Return Details</CardTitle>
										<CardDescription>
											Select items and reason for return.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
											<div className="flex items-center gap-3">
												<div className="rounded-full bg-primary/10 p-2">
													<ReceiptIcon className="h-5 w-5 text-primary" />
												</div>
												<div>
													<p className="font-semibold">Order #{order.id}</p>
													<p className="text-muted-foreground text-xs">
														Purchased on{" "}
														{order.created_at
															? new Date(order.created_at).toLocaleDateString()
															: "-"}
													</p>
													<p className="text-muted-foreground text-xs font-medium">
														Customer: {order.customer?.name || "Unknown"}
													</p>
												</div>
											</div>
											<div className="text-right">
												<p className="font-bold">
													{formatCurrency(Number(order.total_amount), locale)}
												</p>
												<p className="text-muted-foreground text-xs">
													Original Total
												</p>
											</div>
										</div>

										<div className="space-y-4">
											<Label>Select Items to Return</Label>
											<div className="rounded-md border">
												{order.orderItems.map((item: any) => {
													const isSelected = !!selectedItems[item.id];
													return (
														<div
															key={item.id}
															className="flex items-center justify-between border-b p-3 last:border-0"
														>
															<div className="flex items-center gap-3">
																<input
																	type="checkbox"
																	className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
																	checked={isSelected}
																	onChange={(e) =>
																		toggleItemSelection(item.id, item.quantity, e.target.checked)
																	}
																/>
																<div>
																	<p className="text-sm font-medium">
																		{item.product?.name || "Unknown Product"}
																	</p>
																	<p className="text-xs text-muted-foreground">
																		Purchased: {item.quantity} x{" "}
																		{formatCurrency(Number(item.price), locale)}
																	</p>
																</div>
															</div>
															{isSelected && (
																<div className="flex items-center gap-2">
																	<Label className="text-xs">Return Qty:</Label>
																	<Input
																		type="number"
																		min={1}
																		max={item.quantity}
																		value={selectedItems[item.id]}
																		onChange={(e) =>
																			updateItemQty(
																				item.id,
																				item.quantity,
																				parseInt(e.target.value) || 1
																			)
																		}
																		className="h-8 w-20"
																	/>
																</div>
															)}
														</div>
													);
												})}
											</div>
										</div>

										<div className="space-y-4 pt-2">
											<div className="space-y-2">
												<Label>Reason for Return</Label>
												<Select value={reason} onValueChange={setReason}>
													<SelectTrigger>
														<SelectValue placeholder="Select reason" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="defective">
															Defective / Damaged
														</SelectItem>
														<SelectItem value="wrong_item">
															Wrong Item Supplied
														</SelectItem>
														<SelectItem value="customer_changed_mind">
															Customer Changed Mind
														</SelectItem>
														<SelectItem value="other">Other</SelectItem>
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label>Additional Notes (Optional)</Label>
												<textarea
													value={notes}
													onChange={(e) => setNotes(e.target.value)}
													placeholder="Condition of the item, specific defects, etc."
													className="flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													rows={3}
												/>
											</div>
										</div>

										<div className="flex justify-end gap-2 border-border/50 border-t pt-4">
											<Button
												type="button"
												variant="outline"
												onClick={() => setSearchId(null)}
											>
												Cancel
											</Button>
											<Button
												type="submit"
												disabled={createMutation.isPending}
												className="bg-primary text-primary-foreground hover:bg-primary/90"
											>
												{createMutation.isPending ? "Processing..." : "Create Return"}
											</Button>
										</div>
									</CardContent>
								</form>
							</Card>
						</motion.div>
					)}
				</div>

				<div className="space-y-6">
					<AnimatedCard>
						<Card className="border-border/50 bg-card/30 shadow-sm">
							<CardHeader>
								<CardTitle className="text-base">Return Policy</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-muted-foreground text-sm">
								<div className="flex items-start gap-2">
									<CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
									<p>
										Items can be returned within 30 days of purchase with
										original receipt.
									</p>
								</div>
								<div className="flex items-start gap-2">
									<CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
									<p>
										Defective items must be logged with specific defect notes.
									</p>
								</div>
								<div className="flex items-start gap-2">
									<CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
									<p>Refunds should match original payment method.</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</div>
			</div>
		</PageTransition>
	);
}
