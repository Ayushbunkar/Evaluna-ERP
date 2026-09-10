"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	CheckCircle2Icon,
	ClockIcon,
	EyeIcon,
	PackageIcon,
	PlusIcon,
	ShoppingBagIcon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const getStatusLabel = (status: string, locale: string) => {
	if (locale === "hi") {
		const hiLabels: Record<string, string> = {
			pending_review: "पुष्टि लंबित",
			under_review: "बिक्री संपर्क जारी",
			confirmed: "पुष्टि की गई",
			processing: "प्रसंस्करण में",
			ready: "तैयार",
			dispatched: "भेजा गया",
			delivered: "वितरित",
			cancelled: "रद्द",
		};
		return hiLabels[status] ?? status;
	}
	const enLabels: Record<string, string> = {
		pending_review: "Pending Sales Confirmation",
		under_review: "Sales Contacting",
		confirmed: "Confirmed",
		processing: "Processing",
		ready: "Ready",
		dispatched: "Dispatched",
		delivered: "Delivered",
		cancelled: "Cancelled",
	};
	return enLabels[status] ?? status;
};

const PENDING = ["pending_review", "under_review"];
const CONFIRMED = [
	"confirmed",
	"processing",
	"ready",
	"dispatched",
	"delivered",
];

export default function CustomerOrdersPage() {
	const trpc = useTRPC();
	const locale = useLocale();

	const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");
	const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

	const {
		data: orders,
		isLoading,
		error,
	} = trpc.customer.getMyOrders.useQuery(undefined, {
		refetchInterval: 10000, // Poll every 10s for status updates from Sales
	});

	const { data: orderDetail, isLoading: detailLoading } =
		trpc.customer.getMyOrder.useQuery(
			{ id: selectedOrderId! },
			{ enabled: selectedOrderId !== null },
		);

	const filteredOrders = useMemo(() => {
		const list = orders ?? [];
		if (filter === "pending") {
			return list.filter((o) => PENDING.includes(o.status ?? ""));
		}
		if (filter === "confirmed") {
			return list.filter((o) => CONFIRMED.includes(o.status ?? ""));
		}
		return list;
	}, [orders, filter]);

	const t = {
		title:
			locale === "hi" ? "मेरे ऑर्डर और स्टेटस ट्रैकिंग" : "My Orders & Status Tracking",
		subtitle:
			locale === "hi"
				? "अपने रखे गए ऑर्डर्स को ट्रैक करें और बिक्री टीम द्वारा आपके अनुरोधों की पुष्टि होने पर अपडेट प्राप्त करें।"
				: "Track your placed orders and receive updates when sales confirms your requests.",
		placeNewOrder: locale === "hi" ? "नया ऑर्डर सबमिट करें" : "Place New Order",
		allOrders:
			locale === "hi"
				? (count: number) => `सभी ऑर्डर (${count})`
				: (count: number) => `All Orders (${count})`,
		pendingConfirmation:
			locale === "hi"
				? (count: number) => `पुष्टि लंबित (${count})`
				: (count: number) => `Pending Confirmation (${count})`,
		confirmed:
			locale === "hi"
				? (count: number) => `पुष्टि की गई (${count})`
				: (count: number) => `Confirmed (${count})`,
		loadingOrders:
			locale === "hi" ? "आपके ऑर्डर लोड हो रहे हैं..." : "Loading your orders...",
		noOrdersFound: locale === "hi" ? "कोई ऑर्डर नहीं मिला।" : "No orders found.",
		placeFirstOrder:
			locale === "hi"
				? "उत्पाद कैटलॉग से अपना पहला ऑर्डर सबमिट करें।"
				: "Place your first order from the product catalog.",
		browseProducts: locale === "hi" ? "उत्पाद ब्राउज़ करें" : "Browse Products",
		orderId: locale === "hi" ? "ऑर्डर आईडी" : "Order ID",
		placedDate: locale === "hi" ? "रखने की तारीख" : "Placed Date",
		products: locale === "hi" ? "उत्पाद" : "Products",
		status: locale === "hi" ? "स्थिति" : "Status",
		action: locale === "hi" ? "कार्रवाई" : "Action",
		details: locale === "hi" ? "विवरण" : "Details",
		productsCount:
			locale === "hi"
				? (count: number) => `${count} उत्पाद`
				: (count: number) => `${count} product(s)`,
		orderDetails:
			locale === "hi"
				? (ref: string) => `ऑर्डर विवरण — ${ref}`
				: (ref: string) => `Order Details — ${ref}`,
		loadingOrderDetails:
			locale === "hi"
				? "ऑर्डर विवरण लोड हो रहा है..."
				: "Loading order details...",
		orderDate: locale === "hi" ? "ऑर्डर की तारीख" : "Order Date",
		workflowProgress:
			locale === "hi" ? "ऑर्डर प्रगति वर्कफ़्लो" : "Order Workflow Progress",
		stepSubmitted:
			locale === "hi" ? "1. ऑर्डर सबमिट किया गया" : "1. Order Submitted",
		stepReviewing:
			locale === "hi"
				? "2. बिक्री टीम समीक्षा कर रही है"
				: "2. Sales Team Reviewing",
		stepConfirmed:
			locale === "hi" ? "3. ऑर्डर की पुष्टि की गई" : "3. Order Confirmed",
		orderedProducts:
			locale === "hi"
				? "ऑर्डर किए गए उत्पाद और मात्राएँ"
				: "Ordered Products & Quantities",
		quantityLabel:
			locale === "hi"
				? (qty: number) => `मात्रा: ${qty}`
				: (qty: number) => `Quantity: ${qty}`,
		back: locale === "hi" ? "पीछे" : "Back",
	};

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div>
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						{t.title}
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						{t.subtitle}
					</p>
				</div>
				<Button
					asChild
					className="bg-emerald-600 text-white hover:bg-emerald-700"
				>
					<Link href="/customer/products">
						<PlusIcon className="mr-1.5 h-4 w-4" /> {t.placeNewOrder}
					</Link>
				</Button>
			</div>

			{/* Filter Tabs */}
			<div className="flex items-center gap-2 border-border/40 border-b pb-2">
				<Button
					variant={filter === "all" ? "default" : "outline"}
					size="sm"
					className="text-xs"
					onClick={() => setFilter("all")}
				>
					{t.allOrders(orders?.length ?? 0)}
				</Button>
				<Button
					variant={filter === "pending" ? "default" : "outline"}
					size="sm"
					className="text-xs"
					onClick={() => setFilter("pending")}
				>
					{t.pendingConfirmation(
						orders?.filter((o) => PENDING.includes(o.status ?? "")).length ?? 0,
					)}
				</Button>
				<Button
					variant={filter === "confirmed" ? "default" : "outline"}
					size="sm"
					className="text-xs"
					onClick={() => setFilter("confirmed")}
				>
					{t.confirmed(
						orders?.filter((o) => CONFIRMED.includes(o.status ?? "")).length ??
							0,
					)}
				</Button>
			</div>

			{/* Orders List / Table */}
			{isLoading ? (
				<div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
					{t.loadingOrders}
				</div>
			) : error ? (
				<div className="flex h-[250px] items-center justify-center text-destructive text-sm">
					Error loading orders: {error.message}
				</div>
			) : filteredOrders.length === 0 ? (
				<Card className="border-border/50">
					<CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
						<ShoppingBagIcon className="h-10 w-10 opacity-40" />
						<p className="font-medium text-sm">{t.noOrdersFound}</p>
						<p className="text-xs">{t.placeFirstOrder}</p>
						<Button
							asChild
							variant="outline"
							size="sm"
							className="mt-2 text-xs"
						>
							<Link href="/customer/products">{t.browseProducts}</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t.orderId}</TableHead>
									<TableHead>{t.placedDate}</TableHead>
									<TableHead>{t.products}</TableHead>
									<TableHead>{t.status}</TableHead>
									<TableHead className="text-right">{t.action}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredOrders.map((o) => {
									const isPending = PENDING.includes(o.status ?? "");
									const isConfirmed = CONFIRMED.includes(o.status ?? "");

									return (
										<TableRow key={o.id}>
											<TableCell className="font-semibold text-foreground">
												{o.orderRef}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{o.date ? new Date(o.date).toLocaleString() : "—"}
											</TableCell>
											<TableCell className="font-medium text-xs">
												{t.productsCount(o.itemsCount)}
											</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
														isConfirmed
															? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
															: isPending
																? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
																: "bg-muted text-muted-foreground"
													}`}
												>
													{getStatusLabel(o.status ?? "", locale)}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="outline"
													size="sm"
													className="text-xs"
													onClick={() => setSelectedOrderId(o.id)}
												>
													<EyeIcon className="mr-1 h-3.5 w-3.5" /> {t.details}
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{/* Order Details & Timeline Dialog */}
			<Dialog
				open={selectedOrderId !== null}
				onOpenChange={() => setSelectedOrderId(null)}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{t.orderDetails(
								orderDetail?.orderRef || `ORD-${selectedOrderId}`,
							)}
						</DialogTitle>
					</DialogHeader>

					{detailLoading || !orderDetail ? (
						<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs">
							{t.loadingOrderDetails}
						</div>
					) : (
						<div className="space-y-5 text-sm">
							{/* Status Badge & Date */}
							<div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 p-3">
								<div>
									<p className="text-muted-foreground text-xs">{t.orderDate}</p>
									<p className="font-semibold text-xs">
										{orderDetail.date
											? new Date(orderDetail.date).toLocaleString()
											: "—"}
									</p>
								</div>
								<span
									className={`rounded-full px-3 py-1 font-semibold text-xs ${
										CONFIRMED.includes(orderDetail.status ?? "")
											? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
											: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
									}`}
								>
									{getStatusLabel(orderDetail.status ?? "", locale)}
								</span>
							</div>

							{/* Status Timeline */}
							<div className="space-y-2">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.workflowProgress}
								</p>
								<div className="grid gap-2 border-emerald-500/40 border-l-2 pl-4 text-xs">
									<div className="flex items-center gap-2">
										<CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
										<span className="font-medium">{t.stepSubmitted}</span>
									</div>
									<div className="flex items-center gap-2">
										{orderDetail.status === "under_review" ||
										CONFIRMED.includes(orderDetail.status ?? "") ? (
											<CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
										) : (
											<ClockIcon className="h-4 w-4 text-amber-500" />
										)}
										<span className="font-medium">{t.stepReviewing}</span>
									</div>
									<div className="flex items-center gap-2">
										{CONFIRMED.includes(orderDetail.status ?? "") ? (
											<CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
										) : (
											<ClockIcon className="h-4 w-4 text-muted-foreground opacity-40" />
										)}
										<span className="font-medium">{t.stepConfirmed}</span>
									</div>
								</div>
							</div>

							{/* Original Order vs Updated Bill Comparison */}
							{orderDetail.original_items && (
								<div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
									<p className="flex items-center gap-1.5 font-bold text-[11px] text-amber-700 uppercase tracking-wide dark:text-amber-400">
										📋{" "}
										{locale === "hi"
											? "मूल ऑर्डर बनाम संशोधित बिल (अपडेट)"
											: "Original Order vs Final Updated Bill"}
									</p>
									<div className="space-y-1.5 pt-1 font-mono text-[11px]">
										{(() => {
											const origList = orderDetail.original_items as Array<{
												productId: number;
												quantity: number;
												name: string;
												sku: string;
											}>;
											const finalMap = new Map(
												orderDetail.items.map((i) => [i.productId, i.quantity]),
											);
											const comparisons: React.ReactNode[] = [];

											origList.forEach((orig) => {
												const finalQty = finalMap.get(orig.productId) ?? 0;
												if (finalQty === 0) {
													comparisons.push(
														<div
															key={`rem-${orig.productId}`}
															className="flex justify-between text-red-600 line-through"
														>
															<span>❌ {orig.name}</span>
															<span>
																Qty: {orig.quantity} →{" "}
																{locale === "hi" ? "हटाया गया" : "Removed"}
															</span>
														</div>,
													);
												} else if (finalQty !== orig.quantity) {
													const diff = finalQty - orig.quantity;
													const colorClass =
														diff > 0
															? "text-emerald-600 font-semibold"
															: "text-amber-600 font-semibold";
													comparisons.push(
														<div
															key={`mod-${orig.productId}`}
															className="flex justify-between text-foreground"
														>
															<span>📝 {orig.name}</span>
															<span>
																Qty: {orig.quantity} →{" "}
																<strong className={colorClass}>
																	{finalQty} ({diff > 0 ? `+${diff}` : diff})
																</strong>
															</span>
														</div>,
													);
												} else {
													comparisons.push(
														<div
															key={`same-${orig.productId}`}
															className="flex justify-between text-muted-foreground"
														>
															<span>✅ {orig.name}</span>
															<span>
																Qty: {orig.quantity} (
																{locale === "hi" ? "अपरिवर्तित" : "Unchanged"})
															</span>
														</div>,
													);
												}
											});

											const origProductIds = new Set(
												origList.map((i) => i.productId),
											);
											orderDetail.items.forEach((finalItem) => {
												if (!origProductIds.has(finalItem.productId)) {
													comparisons.push(
														<div
															key={`add-${finalItem.productId}`}
															className="flex justify-between font-semibold text-emerald-600"
														>
															<span>
																➕ {finalItem.name} (
																{locale === "hi" ? "जोड़ा गया" : "Added"})
															</span>
															<span>Qty: {finalItem.quantity}</span>
														</div>,
													);
												}
											});

											return comparisons.length > 0 ? (
												<div className="space-y-1.5">{comparisons}</div>
											) : (
												<div className="text-center text-muted-foreground italic">
													{locale === "hi"
														? "इस ऑर्डर में कोई संशोधन नहीं किया गया है।"
														: "No modifications were made to this order."}
												</div>
											);
										})()}
									</div>
								</div>
							)}

							{/* Itemized Products */}
							<div className="space-y-2">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.orderedProducts}
								</p>
								<div className="max-h-[200px] space-y-2 overflow-y-auto pr-1">
									{orderDetail.items.map((item) => (
										<div
											key={item.id}
											className="flex items-center justify-between gap-3 rounded-md border border-border/40 p-2.5 text-xs"
										>
											<div className="flex items-center gap-2">
												<PackageIcon className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium text-foreground">
													{item.name}
												</span>
											</div>
											<span className="font-semibold text-foreground">
												{t.quantityLabel(item.quantity)}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
