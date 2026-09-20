// @ts-nocheck
"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
	AlertTriangle,
	ArrowLeftIcon,
	Banknote,
	CheckCircle2,
	Clock,
	DollarSign,
	FileEdit,
	FileText,
	Layers,
	MapPin,
	MessageCircle,
	PackageCheck,
	Phone,
	Printer,
	QrCode,
	RotateCcw,
	ShoppingCart,
	Truck,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { use, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { generateOrderWhatsAppLink } from "@/lib/whatsapp";

export default function OrderDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const orderId = Number.parseInt(id, 10);
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("stage4");

	const { data: order, isLoading } = trpc.orders.get.useQuery({
		id: orderId,
	}) as { data: any; isLoading: boolean };

	let tRaw: any = null;
	let tcRaw: any = null;
	try {
		tRaw = useTranslations("orders");
	} catch (e) {}
	try {
		tcRaw = useTranslations("common");
	} catch (e) {}
	const locale = useLocale();

	const commonDict: Record<string, { en: string; hi: string }> = {
		completed: { en: "Completed / Delivered", hi: "पूरा / डिलीवर हुआ" },
		pending: { en: "Pending", hi: "लंबित" },
		processing: { en: "Processing / In Transit", hi: "प्रगति पर / रास्ते में" },
		cancelled: { en: "Cancelled", hi: "निरस्त" },
		total: { en: "Total Amount", hi: "कुल राशि" },
		category: { en: "Category", hi: "श्रेणी" },
		orderDetails: { en: "Order Bill Lifecycle (4 Stages)", hi: "ऑर्डर बिल के 4 चरण" },
		orderNotFound: { en: "Order not found", hi: "ऑर्डर नहीं मिला" },
	};

	const tc = (key: string) => {
		try {
			if (tcRaw) {
				const val = tcRaw(key);
				if (
					val &&
					typeof val === "string" &&
					!val.includes("MISSING_MESSAGE") &&
					!val.includes("Could not resolve")
				) {
					return val;
				}
			}
		} catch (e) {}
		const entry = commonDict[key];
		if (entry) return locale === "hi" ? entry.hi : entry.en;
		return key.charAt(0).toUpperCase() + key.slice(1);
	};

	const t = (key: string) => {
		try {
			if (tRaw) {
				const val = tRaw(key);
				if (
					val &&
					typeof val === "string" &&
					!val.includes("MISSING_MESSAGE") &&
					!val.includes("Could not resolve")
				) {
					return val;
				}
			}
		} catch (e) {}
		const entry = commonDict[key];
		if (entry) return locale === "hi" ? entry.hi : entry.en;
		return key.charAt(0).toUpperCase() + key.slice(1);
	};

	if (isLoading) {
		return (
			<div className="max-w-5xl space-y-6 mx-auto p-4">
				<Skeleton className="h-8 w-64" />
				<Card>
					<CardContent className="space-y-4 p-6">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-8 w-full" />
						))}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!order) {
		return <div className="text-muted-foreground p-6">{t("orderNotFound")}</div>;
	}

	// Prepare data for 4 bill stages
	// Stage 1: Customer placed original items
	const originalItems: any[] = Array.isArray(order.original_items)
		? order.original_items
		: order.orderItems?.map((i: any) => ({
				name: i.product?.name || `Product #${i.product_id}`,
				quantity: i.quantity,
				price: i.price,
				category: i.product?.category,
		  })) || [];

	const originalSubtotal = originalItems.reduce(
		(sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
		0
	);

	// Stage 2: Salesperson reviewed items
	const reviewedItems: any[] = order.orderItems || [];
	const reviewedSubtotal = reviewedItems.reduce(
		(sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
		0
	);

	// Stage 3: Invoiced details
	const discountAmount = Number(order.discount_amount || 0);
	const discountReason = order.discount_reason || "";
	const otherCharges = Number(order.other_charges || 0);
	const otherChargesReason = order.other_charges_reason || "";
	const cgstAmount = Number(order.cgst_amount || 0);
	const sgstAmount = Number(order.sgst_amount || 0);
	const igstAmount = Number(order.igst_amount || 0);
	const invoicedTotal = Number(order.total_amount || 0);

	// Stage 4: Delivery & Doorstep Settlement
	const deliveryHandover = order.deliveryHandover || null;
	const returnedItems: any[] = deliveryHandover?.returnedItems || [];
	const cashCollected = Number(deliveryHandover?.cashCollected || 0);
	const onlineCollected = Number(deliveryHandover?.onlineCollected || 0);
	const totalCollected = Number(
		deliveryHandover?.totalCollected || (cashCollected + onlineCollected) || invoicedTotal
	);
	const hasReturns = returnedItems.length > 0;
	const returnedTotal = returnedItems.reduce(
		(sum, item) => sum + (Number(item.price || item.unitPrice || 0) * Number(item.quantity || item.qty || 1)),
		0
	);

	const statusColor =
		order.status === "completed"
			? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
			: order.status === "cancelled"
				? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
				: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";

	return (
		<div className="max-w-5xl space-y-6 mx-auto pb-12">
			{/* Top Header */}
			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
				<div className="flex items-center gap-3">
					<Link href="/sales/orders">
						<Button variant="ghost" size="icon" className="rounded-full">
							<ArrowLeftIcon className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-bold text-2xl tracking-tight">
								Order #{order.id}
							</h1>
							<Badge variant="outline" className={`font-semibold ${statusColor}`}>
								{order.status === "completed"
									? "Delivered & Settled"
									: order.status === "cancelled"
										? "Cancelled"
										: "In Progress / Active"}
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							Comprehensive 4-Stage Bill Lifecycle & Audit Trail
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{order.customer?.phone && (
						<a
							href={generateOrderWhatsAppLink(
								{
									id: order.id,
									totalAmount: order.total_amount,
									items: order.orderItems?.map((item: any) => ({
										name: item.product?.name,
										quantity: item.quantity,
										price: item.price,
									})),
								},
								{ name: "Store Branch" },
								order.customer.phone,
							)}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="outline" size="sm" className="gap-2">
								<MessageCircle className="h-4 w-4 text-green-600" />
								WhatsApp
							</Button>
						</a>
					)}

					<Button
						size="sm"
						onClick={() => router.push(`/sales/pos?completedOrderId=${order.id}`)}
						className="gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 shadow-sm"
					>
						<Printer className="h-4 w-4" />
						Print Final Bill
					</Button>
				</div>
			</div>

			{/* Customer & Order Summary Card */}
			<Card className="border-border/60 shadow-sm">
				<CardContent className="p-5">
					<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
						{/* Customer Column */}
						<div>
							<div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
								<User className="h-3.5 w-3.5" /> Customer Details
							</div>
							<div className="font-bold text-sm text-foreground mt-1">
								{order.customer?.name || "Walk-in Customer"}
							</div>
							{order.customer?.phone && (
								<p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
									<Phone className="h-3 w-3 text-emerald-600" /> {order.customer.phone}
								</p>
							)}
							{order.customer?.address && (
								<p className="text-xs text-muted-foreground flex items-start gap-1 mt-1 leading-snug line-clamp-2">
									<MapPin className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
									<span>{order.customer.address}</span>
								</p>
							)}
						</div>

						{/* Delivery Route */}
						<div>
							<div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
								<Truck className="h-3.5 w-3.5" /> Assigned Route & Driver
							</div>
							{order.route ? (
								<div className="mt-1">
									<Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-xs">
										🚚 {order.route.name} {order.route.code ? `(${order.route.code})` : ""}
									</Badge>
								</div>
							) : (
								<p className="text-xs text-muted-foreground mt-1">No route assigned</p>
							)}
							{deliveryHandover?.driverName && (
								<p className="text-xs font-medium text-foreground mt-1 flex items-center gap-1">
									<span>👤 Driver:</span> {deliveryHandover.driverName}
								</p>
							)}
						</div>

						{/* Timestamps */}
						<div>
							<div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
								<Clock className="h-3.5 w-3.5" /> Order Timeline
							</div>
							<p className="text-xs text-foreground mt-1">
								<span className="text-muted-foreground">Placed:</span>{" "}
								{order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
							</p>
							{deliveryHandover?.deliveredAt && (
								<p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
									<span>Delivered:</span>{" "}
									{new Date(deliveryHandover.deliveredAt).toLocaleString()}
								</p>
							)}
						</div>

						{/* Final Setteled Amount */}
						<div className="bg-muted/40 p-3 rounded-lg border border-border/40">
							<div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
								Final Settled Bill
							</div>
							<div className="font-extrabold text-xl text-emerald-600 dark:text-emerald-400 mt-0.5">
								{formatCurrency(totalCollected, locale)}
							</div>
							<div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
								<span>💵 ₹{cashCollected}</span>
								<span>•</span>
								<span>📱 ₹{onlineCollected}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 4-Stage Lifecycle Stepper Preview */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
				<button
					type="button"
					onClick={() => setActiveTab("stage1")}
					className={`p-3 rounded-lg border text-left transition-all ${
						activeTab === "stage1"
							? "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold shadow-sm"
							: "bg-card border-border hover:bg-muted/50 text-muted-foreground"
					}`}
				>
					<div className="flex items-center gap-1.5 font-bold">
						<ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
						1. Customer Placed
					</div>
					<div className="text-[11px] text-muted-foreground mt-0.5">
						{originalItems.length} items • {formatCurrency(originalSubtotal, locale)}
					</div>
				</button>

				<button
					type="button"
					onClick={() => setActiveTab("stage2")}
					className={`p-3 rounded-lg border text-left transition-all ${
						activeTab === "stage2"
							? "bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 font-semibold shadow-sm"
							: "bg-card border-border hover:bg-muted/50 text-muted-foreground"
					}`}
				>
					<div className="flex items-center gap-1.5 font-bold">
						<FileEdit className="h-3.5 w-3.5 text-purple-500" />
						2. Salesperson Review
					</div>
					<div className="text-[11px] text-muted-foreground mt-0.5">
						{reviewedItems.length} items • {formatCurrency(reviewedSubtotal, locale)}
					</div>
				</button>

				<button
					type="button"
					onClick={() => setActiveTab("stage3")}
					className={`p-3 rounded-lg border text-left transition-all ${
						activeTab === "stage3"
							? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold shadow-sm"
							: "bg-card border-border hover:bg-muted/50 text-muted-foreground"
					}`}
				>
					<div className="flex items-center gap-1.5 font-bold">
						<FileText className="h-3.5 w-3.5 text-amber-500" />
						3. Confirmed Invoice
					</div>
					<div className="text-[11px] text-muted-foreground mt-0.5">
						Net: {formatCurrency(invoicedTotal, locale)} (Disc: ₹{discountAmount})
					</div>
				</button>

				<button
					type="button"
					onClick={() => setActiveTab("stage4")}
					className={`p-3 rounded-lg border text-left transition-all ${
						activeTab === "stage4"
							? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm"
							: "bg-card border-border hover:bg-muted/50 text-muted-foreground"
					}`}
				>
					<div className="flex items-center gap-1.5 font-bold">
						<PackageCheck className="h-3.5 w-3.5 text-emerald-500" />
						4. Doorstep Final Bill
					</div>
					<div className="text-[11px] text-muted-foreground mt-0.5">
						Settled: {formatCurrency(totalCollected, locale)} {hasReturns ? "• ⚠️ Returns" : ""}
					</div>
				</button>
			</div>

			{/* Main 4-Stage Bill Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
				<TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto p-1 bg-muted/70">
					<TabsTrigger value="stage1" className="text-xs py-2">
						1️⃣ Customer Placed
					</TabsTrigger>
					<TabsTrigger value="stage2" className="text-xs py-2">
						2️⃣ Sales Review
					</TabsTrigger>
					<TabsTrigger value="stage3" className="text-xs py-2">
						3️⃣ Invoiced Bill
					</TabsTrigger>
					<TabsTrigger value="stage4" className="text-xs py-2">
						4️⃣ Final Doorstep Bill
					</TabsTrigger>
					<TabsTrigger value="comparison" className="text-xs py-2 col-span-2 md:col-span-1">
						📊 All 4 Comparison
					</TabsTrigger>
				</TabsList>

				{/* ----------------------------------------- */}
				{/* STAGE 1: CUSTOMER PLACED ORDER */}
				{/* ----------------------------------------- */}
				<TabsContent value="stage1">
					<Card>
						<CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-base font-bold text-blue-950 dark:text-blue-200 flex items-center gap-2">
										<ShoppingCart className="h-4 w-4 text-blue-600" />
										Stage 1: Initial Customer Placed Order (आरंभिक ग्राहक ऑर्डर)
									</CardTitle>
									<CardDescription className="text-xs">
										The raw items, quantities, and request submitted by the customer before any salesperson adjustments.
									</CardDescription>
								</div>
								<Badge className="bg-blue-600 text-white font-medium">Stage 1</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">#</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead className="text-center">Requested Qty</TableHead>
										<TableHead className="text-right">Catalog Price</TableHead>
										<TableHead className="text-right">Subtotal</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{originalItems.map((item: any, idx: number) => {
										const itemPrice = Number(item.price || 0);
										const itemQty = Number(item.quantity || 1);
										return (
											<TableRow key={idx}>
												<TableCell className="text-muted-foreground">{idx + 1}</TableCell>
												<TableCell className="font-medium">
													{item.name || item.product?.name || `Item #${item.id || item.product_id}`}
												</TableCell>
												<TableCell className="text-center font-semibold">
													{itemQty}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(itemPrice, locale)}
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(itemPrice * itemQty, locale)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>

							<div className="p-4 bg-muted/20 border-t border-border flex justify-between items-center">
								<div className="text-xs text-muted-foreground">
									Initial Customer Total Requested Items: <span className="font-semibold text-foreground">{originalItems.length}</span>
								</div>
								<div className="text-right">
									<div className="text-xs text-muted-foreground">Estimated Order Value</div>
									<div className="text-lg font-bold text-blue-600 dark:text-blue-400">
										{formatCurrency(originalSubtotal, locale)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* ----------------------------------------- */}
				{/* STAGE 2: SALESPERSON REVIEW & PRICING */}
				{/* ----------------------------------------- */}
				<TabsContent value="stage2">
					<Card>
						<CardHeader className="bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-base font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
										<FileEdit className="h-4 w-4 text-purple-600" />
										Stage 2: Salesperson Review & Pricing (सेल्सपर्सन समीक्षा व दर निर्धारण)
									</CardTitle>
									<CardDescription className="text-xs">
										The verified wholesale quantities and custom ERP rates set during salesperson review.
									</CardDescription>
								</div>
								<Badge className="bg-purple-600 text-white font-medium">Stage 2</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">#</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead className="hidden sm:table-cell">Category</TableHead>
										<TableHead className="text-center">Reviewed Qty</TableHead>
										<TableHead className="text-right">Wholesale Rate</TableHead>
										<TableHead className="text-right">Amount</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reviewedItems.map((item: any, idx: number) => {
										const itemPrice = Number(item.price || 0);
										const itemQty = Number(item.quantity || 1);
										return (
											<TableRow key={item.id || idx}>
												<TableCell className="text-muted-foreground">{idx + 1}</TableCell>
												<TableCell className="font-medium">
													{item.product?.name ?? `#${item.product_id}`}
												</TableCell>
												<TableCell className="hidden sm:table-cell">
													{item.product?.category ? (
														<Badge variant="outline" className="text-[10px]">
															{item.product.category}
														</Badge>
													) : (
														"—"
													)}
												</TableCell>
												<TableCell className="text-center font-semibold">
													{itemQty}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(itemPrice, locale)}
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(itemPrice * itemQty, locale)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>

							<div className="p-4 bg-muted/20 border-t border-border flex justify-between items-center">
								<div className="text-xs text-muted-foreground">
									Reviewed Items Count: <span className="font-semibold text-foreground">{reviewedItems.length}</span>
								</div>
								<div className="text-right">
									<div className="text-xs text-muted-foreground">Review Subtotal</div>
									<div className="text-lg font-bold text-purple-600 dark:text-purple-400">
										{formatCurrency(reviewedSubtotal, locale)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* ----------------------------------------- */}
				{/* STAGE 3: CONFIRMED & INVOICED BILL */}
				{/* ----------------------------------------- */}
				<TabsContent value="stage3">
					<Card>
						<CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-base font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
										<FileText className="h-4 w-4 text-amber-600" />
										Stage 3: Confirmed & Invoiced Commercial Bill (पुष्टीकृत इनवॉइस बिल)
									</CardTitle>
									<CardDescription className="text-xs">
										Final commercial invoice with discounts, taxes, delivery route, and extra charges applied.
									</CardDescription>
								</div>
								<Badge className="bg-amber-600 text-white font-medium">Stage 3</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">#</TableHead>
										<TableHead>Product</TableHead>
										<TableHead className="text-center">Qty</TableHead>
										<TableHead className="text-right">Rate</TableHead>
										<TableHead className="text-right">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reviewedItems.map((item: any, idx: number) => (
										<TableRow key={item.id || idx}>
											<TableCell className="text-muted-foreground">{idx + 1}</TableCell>
											<TableCell className="font-medium">
												{item.product?.name ?? `#${item.product_id}`}
											</TableCell>
											<TableCell className="text-center font-semibold">
												{item.quantity}
											</TableCell>
											<TableCell className="text-right">
												{formatCurrency(item.price, locale)}
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatCurrency(item.price * item.quantity, locale)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* Breakdown Summary */}
							<div className="p-5 bg-muted/30 border-t border-border grid sm:grid-cols-2 gap-4">
								<div className="space-y-2 text-xs">
									{discountAmount > 0 && (
										<div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
											<span className="font-semibold">Applied Discount:</span> ₹{discountAmount}
											{discountReason && <span className="block text-[11px] text-muted-foreground mt-0.5">Reason: {discountReason}</span>}
										</div>
									)}
									{otherCharges > 0 && (
										<div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300">
											<span className="font-semibold">Other Charges / Handling:</span> ₹{otherCharges}
											{otherChargesReason && <span className="block text-[11px] text-muted-foreground mt-0.5">Reason: {otherChargesReason}</span>}
										</div>
									)}
									{order.notes && (
										<div className="text-muted-foreground">
											<span className="font-medium text-foreground">Order Notes:</span> {order.notes}
										</div>
									)}
								</div>

								<div className="space-y-1.5 text-xs text-right">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Items Subtotal:</span>
										<span className="font-medium">{formatCurrency(reviewedSubtotal, locale)}</span>
									</div>
									{discountAmount > 0 && (
										<div className="flex justify-between text-emerald-600 font-medium">
											<span>Discount Applied:</span>
											<span>- {formatCurrency(discountAmount, locale)}</span>
										</div>
									)}
									{otherCharges > 0 && (
										<div className="flex justify-between text-blue-600 font-medium">
											<span>Extra Charges:</span>
											<span>+ {formatCurrency(otherCharges, locale)}</span>
										</div>
									)}
									{(cgstAmount > 0 || sgstAmount > 0 || igstAmount > 0) && (
										<div className="flex justify-between text-muted-foreground">
											<span>Tax (CGST + SGST):</span>
											<span>{formatCurrency(cgstAmount + sgstAmount + igstAmount, locale)}</span>
										</div>
									)}
									<div className="border-t border-border/80 pt-2 flex justify-between items-center text-sm font-bold text-foreground">
										<span>Invoice Grand Total:</span>
										<span className="text-base text-amber-600 dark:text-amber-400">
											{formatCurrency(invoicedTotal, locale)}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* ----------------------------------------- */}
				{/* STAGE 4: DOORSTEP DELIVERY & SETTLEMENT */}
				{/* ----------------------------------------- */}
				<TabsContent value="stage4">
					<Card>
						<CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-base font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
										<PackageCheck className="h-4 w-4 text-emerald-600" />
										Stage 4: Doorstep Delivery & Final Settlement Bill (अंतिम डिलीवरी व संग्रह बिल)
									</CardTitle>
									<CardDescription className="text-xs">
										The final handover at the customer doorstep — verified delivered items, returned/damaged deductions, and payment collected.
									</CardDescription>
								</div>
								<Badge className="bg-emerald-600 text-white font-medium">Stage 4 Final</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-5 space-y-6">
							{/* Doorstep Return / Damage Alert if applicable */}
							{hasReturns ? (
								<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
									<div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
										<AlertTriangle className="h-4 w-4" />
										<span>Doorstep Returns & Damaged Items Deducted ({returnedItems.length})</span>
									</div>
									<div className="overflow-x-auto">
										<table className="w-full text-xs">
											<thead>
												<tr className="border-b border-red-500/20 text-muted-foreground">
													<th className="text-left pb-1 font-medium">Item Name</th>
													<th className="text-center pb-1 font-medium">Returned Qty</th>
													<th className="text-left pb-1 font-medium">Reason for Return / Damage</th>
													<th className="text-right pb-1 font-medium">Deduction</th>
												</tr>
											</thead>
											<tbody>
												{returnedItems.map((ret: any, idx: number) => {
													const retQty = Number(ret.quantity || ret.qty || 1);
													const retPrice = Number(ret.price || ret.unitPrice || 0);
													return (
														<tr key={idx} className="border-b border-red-500/10">
															<td className="py-1.5 font-medium text-foreground">
																{ret.name || ret.productName || `Item #${ret.productId || idx + 1}`}
															</td>
															<td className="py-1.5 text-center font-bold text-red-600">
																{retQty}
															</td>
															<td className="py-1.5 text-muted-foreground">
																{ret.reason || "Damaged at delivery / Customer rejected"}
															</td>
															<td className="py-1.5 text-right font-medium text-red-600">
																- {formatCurrency(retPrice * retQty, locale)}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								</div>
							) : (
								<div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
									<CheckCircle2 className="h-4 w-4 text-emerald-600" />
									<span>All items accepted in full at doorstep without returns or damage.</span>
								</div>
							)}

							{/* Doorstep Delivered Items Table */}
							<div>
								<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
									Delivered Items Summary
								</h3>
								<div className="rounded-md border overflow-hidden">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-12">#</TableHead>
												<TableHead>Product Name</TableHead>
												<TableHead className="text-center">Delivered Qty</TableHead>
												<TableHead className="text-right">Unit Rate</TableHead>
												<TableHead className="text-right">Net Accepted Total</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{reviewedItems.map((item: any, idx: number) => {
												const ret = returnedItems.find(
													(r) => r.id === item.id || r.productId === item.product_id || r.name === item.product?.name
												);
												const retQty = ret ? Number(ret.quantity || ret.qty || 0) : 0;
												const netQty = Math.max(0, Number(item.quantity || 1) - retQty);
												const itemPrice = Number(item.price || 0);

												return (
													<TableRow key={item.id || idx}>
														<TableCell className="text-muted-foreground">{idx + 1}</TableCell>
														<TableCell className="font-medium">
															{item.product?.name ?? `#${item.product_id}`}
															{retQty > 0 && (
																<span className="ml-2 text-[10px] text-red-600 font-normal">
																	({retQty} returned)
																</span>
															)}
														</TableCell>
														<TableCell className="text-center font-bold text-emerald-700 dark:text-emerald-400">
															{netQty}
														</TableCell>
														<TableCell className="text-right">
															{formatCurrency(itemPrice, locale)}
														</TableCell>
														<TableCell className="text-right font-medium">
															{formatCurrency(itemPrice * netQty, locale)}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</div>

							{/* Payment Collection Cards */}
							<div>
								<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
									Doorstep Payment Collection Breakdown
								</h3>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div className="p-4 rounded-lg bg-card border border-border/80 shadow-sm flex items-center gap-3">
										<div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600">
											<Banknote className="h-5 w-5" />
										</div>
										<div>
											<div className="text-xs text-muted-foreground">Cash Collected</div>
											<div className="text-lg font-bold text-emerald-600">
												{formatCurrency(cashCollected, locale)}
											</div>
										</div>
									</div>

									<div className="p-4 rounded-lg bg-card border border-border/80 shadow-sm flex items-center gap-3">
										<div className="p-2.5 rounded-full bg-blue-500/10 text-blue-600">
											<QrCode className="h-5 w-5" />
										</div>
										<div>
											<div className="text-xs text-muted-foreground">Online / UPI Collected</div>
											<div className="text-lg font-bold text-blue-600">
												{formatCurrency(onlineCollected, locale)}
											</div>
										</div>
									</div>

									<div className="p-4 rounded-lg bg-emerald-600 text-white shadow-sm flex items-center gap-3">
										<div className="p-2.5 rounded-full bg-white/20 text-white">
											<CheckCircle2 className="h-5 w-5" />
										</div>
										<div>
											<div className="text-xs text-white/80">Total Bill Settled</div>
											<div className="text-lg font-black">
												{formatCurrency(totalCollected, locale)}
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Delivery Handover Notes */}
							{deliveryHandover?.deliveryNotes && (
								<div className="p-3 rounded bg-muted/40 border border-border text-xs">
									<span className="font-semibold text-foreground">Driver Handover Remarks:</span>{" "}
									<span className="text-muted-foreground">{deliveryHandover.deliveryNotes}</span>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ----------------------------------------- */}
				{/* TAB 5: ALL 4 STAGES PROGRESSION COMPARISON */}
				{/* ----------------------------------------- */}
				<TabsContent value="comparison">
					<Card>
						<CardHeader className="bg-muted/40 border-b border-border">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-base font-bold flex items-center gap-2">
										<Layers className="h-4 w-4 text-indigo-600" />
										Complete 4-Stage Bill Progression Audit (चारों बिलों का तुलनात्मक विवरण)
									</CardTitle>
									<CardDescription className="text-xs">
										Side-by-side progression from Customer Request → Sales Review → Invoiced Bill → Final Delivered Settlement.
									</CardDescription>
								</div>
								<Badge variant="outline">Full Audit</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/30">
											<TableHead className="font-bold">Item Description</TableHead>
											<TableHead className="text-center font-bold text-blue-600">
												1. Placed Qty
											</TableHead>
											<TableHead className="text-center font-bold text-purple-600">
												2. Review Qty
											</TableHead>
											<TableHead className="text-center font-bold text-amber-600">
												3. Invoice Qty
											</TableHead>
											<TableHead className="text-center font-bold text-emerald-600">
												4. Final Net Qty
											</TableHead>
											<TableHead className="text-right font-bold">Final Rate</TableHead>
											<TableHead className="text-right font-bold">Settled Amount</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{reviewedItems.map((item: any, idx: number) => {
											const original = originalItems.find(
												(o) => o.name === item.product?.name || o.id === item.product_id
											);
											const ret = returnedItems.find(
												(r) => r.id === item.id || r.productId === item.product_id || r.name === item.product?.name
											);
											const origQty = original ? Number(original.quantity || 1) : "—";
											const revQty = Number(item.quantity || 1);
											const retQty = ret ? Number(ret.quantity || ret.qty || 0) : 0;
											const finalQty = Math.max(0, revQty - retQty);
											const itemPrice = Number(item.price || 0);

											return (
												<TableRow key={item.id || idx}>
													<TableCell className="font-medium">
														{item.product?.name ?? `#${item.product_id}`}
														{retQty > 0 && (
															<Badge variant="destructive" className="ml-2 text-[9px] py-0 px-1">
																{retQty} returned
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-center text-blue-700 dark:text-blue-400 font-medium">
														{origQty}
													</TableCell>
													<TableCell className="text-center text-purple-700 dark:text-purple-400 font-medium">
														{revQty}
													</TableCell>
													<TableCell className="text-center text-amber-700 dark:text-amber-400 font-medium">
														{revQty}
													</TableCell>
													<TableCell className="text-center text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/5">
														{finalQty}
													</TableCell>
													<TableCell className="text-right">
														{formatCurrency(itemPrice, locale)}
													</TableCell>
													<TableCell className="text-right font-bold text-emerald-600">
														{formatCurrency(itemPrice * finalQty, locale)}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>

							{/* Summary Progression Bar */}
							<div className="p-4 bg-muted/20 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
								<div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20">
									<div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">1. Customer Placed</div>
									<div className="text-sm font-bold text-blue-700 dark:text-blue-300 mt-0.5">
										{formatCurrency(originalSubtotal, locale)}
									</div>
								</div>
								<div className="p-2.5 rounded bg-purple-500/10 border border-purple-500/20">
									<div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">2. Salesperson Reviewed</div>
									<div className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-0.5">
										{formatCurrency(reviewedSubtotal, locale)}
									</div>
								</div>
								<div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20">
									<div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">3. Commercial Invoice</div>
									<div className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-0.5">
										{formatCurrency(invoicedTotal, locale)}
									</div>
								</div>
								<div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20">
									<div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">4. Final Settled</div>
									<div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
										{formatCurrency(totalCollected, locale)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
