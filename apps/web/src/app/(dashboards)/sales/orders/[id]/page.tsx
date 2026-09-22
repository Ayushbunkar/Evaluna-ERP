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
	BarChart3,
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
	PlusCircle,
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
import { use, useEffect, useState } from "react";
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

	const { data: order, isLoading } = trpc.orders.get.useQuery({
		id: orderId,
	}) as { data: any; isLoading: boolean };

	const hasHandover =
		!!order?.deliveryHandover &&
		(order.status === "completed" ||
			order.deliveryHandover?.deliveryStatus === "delivered");

	const [activeTab, setActiveTab] = useState<string>("stage3");

	useEffect(() => {
		if (order) {
			setActiveTab(hasHandover ? "stage4" : "stage3");
		}
	}, [order, hasHandover]);

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

	const assignedDriverName =
		order.driver?.name || deliveryHandover?.driverName || null;

	// Stage 4: Delivered Items Calculation & Extra Doorstep Addition Detection
	let rawDeliveredList: any[] = [];
	if (deliveryHandover?.deliveredItems && Array.isArray(deliveryHandover.deliveredItems) && deliveryHandover.deliveredItems.length > 0) {
		rawDeliveredList = deliveryHandover.deliveredItems.map((it: any) => ({
			name: it.name || it.productName || `Item #${it.id || it.product_id}`,
			quantity: Number(it.qty || it.quantity || 1),
			price: Number(it.price || it.unitPrice || 0),
			productId: it.productId || it.id || it.product_id,
			returnedQty: 0,
		}));
	} else {
		rawDeliveredList = (order.orderItems || []).map((item: any) => {
			const ret = returnedItems.find(
				(r: any) =>
					r.id === item.id ||
					r.productId === item.product_id ||
					r.name === item.product?.name,
			);
			const retQty = ret ? Number(ret.quantity || ret.qty || 0) : 0;
			const netQty = Math.max(0, Number(item.quantity || 1) - retQty);
			return {
				name: item.product?.name ?? `Product #${item.product_id}`,
				quantity: netQty,
				price: Number(item.price || 0),
				productId: item.product_id || item.id,
				returnedQty: retQty,
			};
		});
	}

	const currentDeliveredSum = rawDeliveredList.reduce(
		(sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
		0
	);

	const deliveredItemsList = rawDeliveredList.map((item: any) => {
		const origMatch = (originalItems || []).find((orig: any) =>
			(item.productId && (orig.product_id === item.productId || orig.id === item.productId)) ||
			(orig.name && item.name && orig.name.trim().toLowerCase() === item.name.trim().toLowerCase())
		);
		const revMatch = (reviewedItems || []).find((rev: any) =>
			(item.productId && (rev.product_id === item.productId || rev.id === item.productId)) ||
			(rev.product?.name && item.name && rev.product.name.trim().toLowerCase() === item.name.trim().toLowerCase())
		);
		
		const isNewItem = !origMatch && !revMatch;
		const initialQty = Number(revMatch?.quantity || origMatch?.quantity || 0);
		const isExtraQty = !isNewItem && item.quantity > initialQty;

		return {
			...item,
			isAddedAtDoorstep: isNewItem || isExtraQty,
			initialQty,
		};
	});

	if (totalCollected > 0 && currentDeliveredSum < totalCollected) {
		const diff = totalCollected - currentDeliveredSum;
		deliveredItemsList.push({
			name: "Doorstep Added Items / Balance Adjustment",
			quantity: 1,
			price: diff,
			returnedQty: 0,
			isAddedAtDoorstep: true,
		});
	}

	const finalDeliveredSum = deliveredItemsList.reduce(
		(sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
		0
	);

	// Unified 4-Stage Comparison List across all order items & doorstep additions
	const compMap = new Map<string, any>();

	originalItems.forEach((orig: any, oIdx: number) => {
		const key = orig.product_id ? `pid_${orig.product_id}` : (orig.name || `orig_${oIdx}`);
		compMap.set(key, {
			key,
			name: orig.name || orig.product?.name || `Product #${orig.id || orig.product_id}`,
			productId: orig.product_id || orig.id,
			origQty: Number(orig.quantity || 1),
			revQty: null,
			invoiceQty: null,
			finalQty: null,
			price: Number(orig.price || 0),
			isAddedAtDoorstep: false,
			retQty: 0,
		});
	});

	reviewedItems.forEach((rev: any, rIdx: number) => {
		const key = rev.product_id ? `pid_${rev.product_id}` : (rev.product?.name || `rev_${rIdx}`);
		const existing = compMap.get(key);
		const ret = returnedItems.find(
			(r: any) => r.id === rev.id || r.productId === rev.product_id || r.name === rev.product?.name,
		);
		const retQty = ret ? Number(ret.quantity || ret.qty || 0) : 0;
		const revQty = Number(rev.quantity || 1);
		const price = Number(rev.price || existing?.price || 0);

		if (existing) {
			existing.revQty = revQty;
			existing.invoiceQty = revQty;
			existing.retQty = retQty;
			if (price > 0) existing.price = price;
		} else {
			compMap.set(key, {
				key,
				name: rev.product?.name ?? `Product #${rev.product_id}`,
				productId: rev.product_id || rev.id,
				origQty: null,
				revQty: revQty,
				invoiceQty: revQty,
				finalQty: null,
				price: price,
				isAddedAtDoorstep: false,
				isAddedBySalesperson: true,
				retQty: retQty,
			});
		}
	});

	deliveredItemsList.forEach((del: any, dIdx: number) => {
		const key = del.productId ? `pid_${del.productId}` : (del.name || `del_${dIdx}`);
		const existing = compMap.get(key);
		const delQty = Number(del.quantity || 0);

		if (existing) {
			existing.finalQty = delQty;
			if (del.isAddedAtDoorstep) existing.isAddedAtDoorstep = true;
		} else {
			compMap.set(key, {
				key,
				name: del.name,
				productId: del.productId,
				origQty: null,
				revQty: null,
				invoiceQty: null,
				finalQty: delQty,
				price: Number(del.price || 0),
				isAddedAtDoorstep: true,
				retQty: del.returnedQty || 0,
			});
		}
	});

	const comparisonList = Array.from(compMap.values());

	const statusColor =
		order.status === "completed"
			? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
			: order.status === "cancelled"
				? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
				: order.status === "out_for_delivery"
					? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
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
										: order.status === "out_for_delivery"
											? "Out for Delivery"
											: order.route
												? "Route Assigned / Processing"
												: "Awaiting Dispatch"}
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
									totalAmount: hasHandover ? totalCollected : invoicedTotal,
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
						className={`gap-2 font-semibold text-white shadow-sm ${
							hasHandover
								? "bg-emerald-600 hover:bg-emerald-700"
								: "bg-amber-600 hover:bg-amber-700"
						}`}
					>
						<Printer className="h-4 w-4" />
						{hasHandover ? "Print Final Settled Bill" : "Print Commercial Invoice"}
					</Button>
				</div>
			</div>

			{/* Customer & Order Summary Card */}
			<Card className="border-border/60 shadow-sm">
				<CardContent className="p-5">
					<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
						{/* Customer Column */}
						<div>
							<div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
								<User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Customer Details
							</div>
							<div className="font-bold text-sm text-foreground mt-1 flex items-center gap-1.5">
								<span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
								{order.customer?.name || "Walk-in Customer"}
							</div>
							{order.customer?.phone && (
								<p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-mono">
									<Phone className="h-3 w-3 text-emerald-600 shrink-0" /> {order.customer.phone}
								</p>
							)}
							{order.customer?.address && (
								<p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1 leading-snug line-clamp-2">
									<MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
									<span>{order.customer.address}</span>
								</p>
							)}
						</div>

						{/* Delivery Route & Assigned Driver */}
						<div>
							<div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
								<Truck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Assigned Route & Driver
							</div>
							{order.route ? (
								<div className="mt-1">
									<Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-xs gap-1">
										<Truck className="h-3 w-3 text-amber-600" /> {order.route.name} {order.route.code ? `(${order.route.code})` : ""}
									</Badge>
								</div>
							) : (
								<p className="text-xs text-muted-foreground mt-1 italic">No route assigned</p>
							)}
							<p className="text-xs font-medium text-foreground mt-1.5 flex items-center gap-1.5">
								<User className="h-3 w-3 text-indigo-500 shrink-0" />
								<span className="text-muted-foreground">Driver:</span>{" "}
								{assignedDriverName ? (
									<span className="font-semibold text-foreground">{assignedDriverName}</span>
								) : (
									<span className="text-muted-foreground italic">Not assigned yet</span>
								)}
							</p>
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

						{/* Current Active Total / Settled Amount Box */}
						<div className="bg-muted/40 p-3 rounded-lg border border-border/40">
							<div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center justify-between">
								<span>{hasHandover ? "Final Settled Bill" : "Active Commercial Total"}</span>
								{!hasHandover && (
									<Badge variant="outline" className="text-[9px] py-0 px-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
										{order.status === "out_for_delivery" ? "In Transit" : "Invoice"}
									</Badge>
								)}
							</div>
							<div className={`font-extrabold text-xl mt-0.5 ${hasHandover ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
								{formatCurrency(hasHandover ? totalCollected : invoicedTotal, locale)}
							</div>
							{hasHandover ? (
								<div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
									<span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/60">
										<Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
										₹{cashCollected}
									</span>
									<span className="text-muted-foreground/40">•</span>
									<span className="inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-200/80 dark:border-purple-800/60">
										<QrCode className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
										₹{onlineCollected}
									</span>
								</div>
							) : (
								<p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
									<Clock className="h-3 w-3 text-amber-600" />
									Pending Doorstep Handover
								</p>
							)}
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
						{hasHandover
							? `Settled: ${formatCurrency(totalCollected, locale)}${hasReturns ? " • ⚠️ Returns" : ""}`
							: `Pending: ${formatCurrency(invoicedTotal, locale)} (Awaiting Delivery)`}
					</div>
				</button>
			</div>

			{/* Main 4-Stage Bill Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
				<TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto p-1 bg-muted/70 gap-1">
					<TabsTrigger value="stage1" className="text-xs py-2 flex items-center justify-center gap-1.5 font-medium data-[state=active]:font-bold">
						<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-[10px] font-bold text-blue-600 dark:text-blue-400">1</span>
						<ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
						Customer Placed
					</TabsTrigger>
					<TabsTrigger value="stage2" className="text-xs py-2 flex items-center justify-center gap-1.5 font-medium data-[state=active]:font-bold">
						<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-[10px] font-bold text-purple-600 dark:text-purple-400">2</span>
						<FileEdit className="h-3.5 w-3.5 text-purple-500" />
						Sales Review
					</TabsTrigger>
					<TabsTrigger value="stage3" className="text-xs py-2 flex items-center justify-center gap-1.5 font-medium data-[state=active]:font-bold">
						<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-600 dark:text-amber-400">3</span>
						<FileText className="h-3.5 w-3.5 text-amber-500" />
						Invoiced Bill
					</TabsTrigger>
					<TabsTrigger value="stage4" className="text-xs py-2 flex items-center justify-center gap-1.5 font-medium data-[state=active]:font-bold">
						<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">4</span>
						<PackageCheck className="h-3.5 w-3.5 text-emerald-500" />
						Final Doorstep Bill
					</TabsTrigger>
					<TabsTrigger value="comparison" className="text-xs py-2 col-span-2 md:col-span-1 flex items-center justify-center gap-1.5 font-medium data-[state=active]:font-bold">
						<BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
						All 4 Comparison
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
										const original = originalItems.find(
											(o) =>
												(o.id && (o.id === item.product_id || o.product_id === item.product_id)) ||
												(o.name && item.product?.name && o.name.trim().toLowerCase() === item.product.name.trim().toLowerCase())
										);
										const isNewItem = !original;
										const origQty = original ? Number(original.quantity || 1) : null;
										const isQtyModified = origQty !== null && origQty !== itemQty;

										return (
											<TableRow key={item.id || idx} className={isNewItem ? "bg-emerald-500/10 dark:bg-emerald-950/30" : ""}>
												<TableCell className="text-muted-foreground">{idx + 1}</TableCell>
												<TableCell className="font-medium">
													<div className="flex items-center gap-2 flex-wrap">
														<span>{item.product?.name ?? `#${item.product_id}`}</span>
														{isNewItem && (
															<Badge className="bg-emerald-600 text-white font-bold text-[10px] py-0.5 px-2 flex items-center gap-1 shadow-2xs">
																<PlusCircle className="h-3 w-3" />
																➕ Added by Salesperson (सेल्सपर्सन द्वारा जोड़ा गया)
															</Badge>
														)}
													</div>
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
													<div className="flex items-center justify-center gap-1.5">
														<span>{itemQty}</span>
														{isQtyModified && (
															<Badge
																variant="outline"
																className="text-[10px] py-0 px-1 bg-purple-500/10 border-purple-400 text-purple-700 dark:text-purple-300 font-normal"
															>
																Edited (was {origQty})
															</Badge>
														)}
													</div>
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
									{reviewedItems.map((item: any, idx: number) => {
										const original = originalItems.find(
											(o) =>
												(o.id && (o.id === item.product_id || o.product_id === item.product_id)) ||
												(o.name && item.product?.name && o.name.trim().toLowerCase() === item.product.name.trim().toLowerCase())
										);
										const isNewItem = !original;

										return (
											<TableRow key={item.id || idx} className={isNewItem ? "bg-emerald-500/10 dark:bg-emerald-950/30" : ""}>
												<TableCell className="text-muted-foreground">{idx + 1}</TableCell>
												<TableCell className="font-medium">
													<div className="flex items-center gap-2 flex-wrap">
														<span>{item.product?.name ?? `#${item.product_id}`}</span>
														{isNewItem && (
															<Badge className="bg-emerald-600 text-white font-bold text-[10px] py-0.5 px-2 flex items-center gap-1 shadow-2xs">
																<PlusCircle className="h-3 w-3" />
																➕ Added by Salesperson (सेल्सपर्सन द्वारा जोड़ा गया)
															</Badge>
														)}
													</div>
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
										);
									})}
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
										{hasHandover
											? "The final handover at the customer doorstep — verified delivered items, returned/damaged deductions, and payment collected."
											: "This stage is unlocked when the driver completes physical delivery handover and payment collection."}
									</CardDescription>
								</div>
								<Badge className={hasHandover ? "bg-emerald-600 text-white font-medium" : "bg-amber-600 text-white font-medium"}>
									{hasHandover ? "Stage 4 Final" : "Awaiting Handover"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-5 space-y-6">
							{!hasHandover ? (
								/* Awaiting Dispatch / Delivery Handover View */
								<div className="space-y-6">
									<div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900 dark:text-amber-200">
										<Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
										<div className="space-y-1 text-xs">
											<p className="font-bold text-sm">
												Awaiting Physical Dispatch & Doorstep Handover (डिलीवरी व अंतिम बिल लंबित)
											</p>
											<p className="text-amber-800 dark:text-amber-300 leading-relaxed">
												This order has not reached the final delivery handover stage yet. 
												Once the driver completes delivery at the customer doorstep (recording any returned or rejected items, POD confirmation, and collecting cash/UPI payments), the final settled bill and audit will be generated and displayed here.
											</p>
										</div>
									</div>

									{/* Pending Items Summary */}
									<div>
										<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
											Items Pending Delivery Handover
										</h3>
										<div className="rounded-md border overflow-hidden">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead className="w-12">#</TableHead>
														<TableHead>Product Name</TableHead>
														<TableHead className="text-center">Dispatched Qty</TableHead>
														<TableHead className="text-center">Delivery Status</TableHead>
														<TableHead className="text-right">Unit Rate</TableHead>
														<TableHead className="text-right">Invoiced Amount</TableHead>
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
																<TableCell className="text-center font-semibold">
																	{itemQty}
																</TableCell>
																<TableCell className="text-center">
																	<Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
																		Pending Handover
																	</Badge>
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
										</div>
									</div>

									{/* Expected Collection Placeholder */}
									<div>
										<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
											Expected Collection at Handover
										</h3>
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
											<div className="p-4 rounded-lg bg-card border border-border/80 shadow-sm flex items-center gap-3">
												<div className="p-2.5 rounded-full bg-muted text-muted-foreground">
													<Banknote className="h-5 w-5" />
												</div>
												<div>
													<div className="text-xs text-muted-foreground">Cash (Pending)</div>
													<div className="text-base font-semibold text-muted-foreground">
														—
													</div>
												</div>
											</div>

											<div className="p-4 rounded-lg bg-card border border-border/80 shadow-sm flex items-center gap-3">
												<div className="p-2.5 rounded-full bg-muted text-muted-foreground">
													<QrCode className="h-5 w-5" />
												</div>
												<div>
													<div className="text-xs text-muted-foreground">Online / UPI (Pending)</div>
													<div className="text-base font-semibold text-muted-foreground">
														—
													</div>
												</div>
											</div>

											<div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 shadow-sm flex items-center gap-3">
												<div className="p-2.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
													<Clock className="h-5 w-5" />
												</div>
												<div>
													<div className="text-xs text-amber-700 dark:text-amber-300 font-medium">Expected Handover Total</div>
													<div className="text-lg font-bold text-amber-800 dark:text-amber-200">
														{formatCurrency(invoicedTotal, locale)}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							) : (
								/* Completed Handover & Settlement View */
								<div className="space-y-6">
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
													{deliveredItemsList.map((item: any, idx: number) => {
														const itemQty = Number(item.quantity || 1);
														const itemPrice = Number(item.price || 0);

														return (
															<TableRow key={idx} className={item.isAddedAtDoorstep ? "bg-emerald-500/10 dark:bg-emerald-950/30" : ""}>
																<TableCell className="text-muted-foreground">
																	{idx + 1}
																</TableCell>
																<TableCell className="font-medium">
																	<div className="flex items-center gap-2 flex-wrap">
																		<span>{item.name}</span>
																		{item.isAddedAtDoorstep && (
																			<Badge className="bg-emerald-600 text-white font-bold text-[9px] py-0.5 px-2 flex items-center gap-1 shadow-2xs">
																				<PlusCircle className="h-3 w-3" />
																				➕ Added at Doorstep (डोरस्टेप पर जोड़ा गया)
																			</Badge>
																		)}
																		{item.returnedQty > 0 && (
																			<span className="text-[10px] text-red-600 font-normal">
																				({item.returnedQty} returned)
																			</span>
																		)}
																	</div>
																</TableCell>
																<TableCell className="text-center font-bold text-emerald-700 dark:text-emerald-400">
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
													<TableRow className="bg-emerald-500/10 font-bold border-t-2 border-emerald-500/30">
														<TableCell colSpan={4} className="text-right text-xs uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
															Total Settled Doorstep Bill (कुल अंतिम बिल)
														</TableCell>
														<TableCell className="text-right text-emerald-700 dark:text-emerald-400 text-sm">
															{formatCurrency(finalDeliveredSum, locale)}
														</TableCell>
													</TableRow>
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

									{/* Delivery Handover Notes & Remarks */}
									{deliveryHandover?.deliveryNotes && (
										<div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
											<div className="flex items-center gap-1.5 font-bold text-emerald-950 dark:text-emerald-200">
												<FileText className="h-3.5 w-3.5 text-emerald-600" />
												<span>Driver Handover Remarks (ड्राइवर की टिप्पणी):</span>
											</div>
											<p className="text-emerald-900 dark:text-emerald-300 font-medium pl-5">
												{(() => {
													try {
														const parsed = JSON.parse(deliveryHandover.deliveryNotes);
														return parsed.deliveryNotes && parsed.deliveryNotes.trim() !== ""
															? parsed.deliveryNotes
															: "Handover completed cleanly at customer doorstep without special remarks.";
													} catch {
														return deliveryHandover.deliveryNotes;
													}
												})()}
											</p>
										</div>
									)}
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
												4. Final Settled Qty
											</TableHead>
											<TableHead className="text-right font-bold">Unit Rate</TableHead>
											<TableHead className="text-right font-bold">Settled Amount</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{comparisonList.map((item: any, idx: number) => {
											const finalQty = item.finalQty ?? (hasHandover ? Math.max(0, (item.revQty || 0) - (item.retQty || 0)) : null);
											const itemPrice = Number(item.price || 0);

											const isAddedBySalesperson = item.isAddedBySalesperson || (item.origQty === null && item.revQty !== null);

											return (
												<TableRow key={item.key || idx} className={item.isAddedAtDoorstep ? "bg-emerald-500/10 dark:bg-emerald-950/30" : isAddedBySalesperson ? "bg-purple-500/10 dark:bg-purple-950/30" : ""}>
													<TableCell className="font-medium">
														<div className="flex items-center gap-2 flex-wrap">
															<span>{item.name}</span>
															{isAddedBySalesperson && (
																<Badge className="bg-purple-600 text-white font-bold text-[9px] py-0.5 px-2 flex items-center gap-1 shadow-2xs">
																	<PlusCircle className="h-3 w-3" />
																	➕ Added by Salesperson (सेल्सपर्सन द्वारा जोड़ा गया)
																</Badge>
															)}
															{item.isAddedAtDoorstep && (
																<Badge className="bg-emerald-600 text-white font-bold text-[9px] py-0.5 px-2 flex items-center gap-1 shadow-2xs">
																	<PlusCircle className="h-3 w-3" />
																	➕ Added at Doorstep (डोरस्टेप पर जोड़ा गया)
																</Badge>
															)}
															{item.retQty > 0 && (
																<Badge variant="destructive" className="text-[9px] py-0 px-1">
																	{item.retQty} returned
																</Badge>
															)}
														</div>
													</TableCell>
													<TableCell className="text-center text-blue-700 dark:text-blue-400 font-medium">
														{item.origQty ?? "—"}
													</TableCell>
													<TableCell className="text-center text-purple-700 dark:text-purple-400 font-medium">
														<div className="flex items-center justify-center gap-1">
															<span>{item.revQty ?? "—"}</span>
															{item.origQty !== null && item.revQty !== null && item.origQty !== item.revQty && (
																<Badge variant="outline" className="text-[9px] py-0 px-1 border-purple-400 bg-purple-500/10 text-purple-700 font-normal">
																	Edited
																</Badge>
															)}
														</div>
													</TableCell>
													<TableCell className="text-center text-amber-700 dark:text-amber-400 font-medium">
														{item.invoiceQty ?? "—"}
													</TableCell>
													<TableCell className="text-center text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/5">
														{hasHandover ? (
															finalQty ?? "—"
														) : (
															<span className="text-xs text-muted-foreground font-normal italic">
																— (Pending)
															</span>
														)}
													</TableCell>
													<TableCell className="text-right">
														{formatCurrency(itemPrice, locale)}
													</TableCell>
													<TableCell className="text-right font-bold text-emerald-600">
														{hasHandover ? (
															formatCurrency(itemPrice * (finalQty || 0), locale)
														) : (
															<span className="text-xs text-muted-foreground font-normal italic">
																— (Est. {formatCurrency(itemPrice * (item.revQty || 0), locale)})
															</span>
														)}
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
									<div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
										{hasHandover ? "4. Final Settled" : "4. Final Settled (Pending)"}
									</div>
									<div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
										{hasHandover
											? formatCurrency(totalCollected, locale)
											: `Pending (Est: ${formatCurrency(invoicedTotal, locale)})`}
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
