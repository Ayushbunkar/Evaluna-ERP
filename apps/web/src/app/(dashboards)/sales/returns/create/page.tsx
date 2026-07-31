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

export default function CreateSalesReturn() {
	const [orderId, setOrderId] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [orderFound, setOrderFound] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const router = useRouter();
	const locale = useLocale();

	const handleSearch = () => {
		if (!orderId) return;
		setIsSearching(true);
		setTimeout(() => {
			setIsSearching(false);
			if (orderId.includes("ORD")) {
				setOrderFound(true);
				toast.success("Order retrieved successfully");
			} else {
				toast.error("Order not found. Check the ID and try again.");
			}
		}, 1000);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setTimeout(() => {
			setIsSubmitting(false);
			toast.success("Sales return logged successfully!");
			router.push("/sales/returns/list");
		}, 1500);
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
											placeholder="e.g. ORD-9201"
											className="pl-9"
											value={orderId}
											onChange={(e) => setOrderId(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && handleSearch()}
										/>
									</div>
									<Button
										onClick={handleSearch}
										disabled={isSearching || !orderId}
									>
										{isSearching ? "Searching..." : "Find"}
									</Button>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>

					{orderFound && (
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
													<p className="font-semibold">{orderId}</p>
													<p className="text-muted-foreground text-xs">
														Purchased on 2026-07-20
													</p>
												</div>
											</div>
											<div className="text-right">
												<p className="font-bold">
													{formatCurrency(1250, locale)}
												</p>
												<p className="text-muted-foreground text-xs">
													Original Total
												</p>
											</div>
										</div>

										<div className="space-y-4">
											<div className="space-y-2">
												<Label>Reason for Return</Label>
												<Select defaultValue="defective">
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
												onClick={() => setOrderFound(false)}
											>
												Cancel
											</Button>
											<Button
												type="submit"
												disabled={isSubmitting}
												className="bg-primary text-primary-foreground hover:bg-primary/90"
											>
												{isSubmitting ? "Processing..." : "Process Return"}
											</Button>
										</div>
									</CardContent>
								</form>
							</Card>
						</motion.div>
					)}
				</div>

				<div className="space-y-6">
					<AnimatedCard delay={0.1}>
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
