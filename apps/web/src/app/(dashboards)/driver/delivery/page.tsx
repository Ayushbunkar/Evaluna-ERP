"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	CheckCircle,
	CheckSquare,
	ChevronDown,
	ChevronUp,
	CreditCard,
	FileText,
	Filter,
	IndianRupee,
	Layers,
	MapPin,
	Minus,
	Package,
	Phone,
	Plus,
	Printer,
	QrCode,
	RefreshCw,
	Search,
	Truck,
	User,
	X,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SaleCompletionScreen } from "@/components/pos/SaleCompletionScreen";
import { useTRPC } from "@/lib/trpc/client";

type OrderItemHandover = {
	id: number;
	order_id?: number | null;
	product_id?: number | null;
	name: string;
	originalQty: number;
	deliveredQty: number;
	returnedQty: number;
	price: number;
	returnReason?: string;
	checked?: boolean;
	isVanStock?: boolean;
};

const RETURN_PRESET_REASONS = [
	"Damaged Packaging (पैकेजिंग क्षति)",
	"Customer Refused / Excess (ग्राहक ने लेने से मना किया)",
	"Wrong Item / Variant (गलत सामान)",
	"Expired / Near Expiry (खराब गुणवत्ता)",
	"Short Supply / Missing (कम मात्रा)",
	"Custom / Other Reason",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	if (status === "delivered" || status === "completed") return "secondary";
	if (status === "failed") return "destructive";
	if (status === "started" || status === "out_for_delivery" || status === "in_transit")
		return "default";
	return "outline";
}

function getStatusLabel(status: string): string {
	if (status === "delivered" || status === "completed") return "Delivered ✓";
	if (status === "failed") return "Failed ✗";
	if (status === "started" || status === "out_for_delivery" || status === "in_transit")
		return "Out for Delivery";
	if (status === "loaded" || status === "ready_for_loading") return "Loaded";
	if (status === "partially_delivered") return "Partial";
	return "Pending";
}

// ─── Default items ────────────────────────────────────────────────────────────

const DEFAULT_ITEMS: OrderItemHandover[] = [
	{
		id: 1,
		order_id: 595,
		name: "Whole Wheat Atta 10kg",
		originalQty: 2,
		deliveredQty: 2,
		returnedQty: 0,
		price: 420,
	},
	{
		id: 2,
		order_id: 595,
		name: "Refined Soyabean Oil 5L",
		originalQty: 1,
		deliveredQty: 1,
		returnedQty: 0,
		price: 650,
	},
	{
		id: 3,
		order_id: 574,
		name: "Basmati Rice Special 5kg",
		originalQty: 1,
		deliveredQty: 0,
		returnedQty: 1,
		price: 580,
		returnReason: "Damaged Packaging (पैकेजिंग क्षति)",
	},
];

const TRUCK_STOCK_ITEMS = [
	{ id: 101, name: "Sugar 1kg", price: 45 },
	{ id: 102, name: "Fortune Soyabean Oil 1L", price: 140 },
	{ id: 103, name: "Taj Mahal Tea 250g", price: 180 },
	{ id: 104, name: "Amul Pure Ghee 1L", price: 620 },
	{ id: 105, name: "Tata Salt 1kg", price: 28 },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DriverLiveDeliveryPage() {
	let locale = "en";
	try {
		locale = useLocale();
	} catch {
		locale = "en";
	}

	let tRaw: any = null;
	try {
		tRaw = useTranslations();
	} catch (e) {}
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
		return key;
	};

	const trpc = useTRPC();
	const {
		data: dashboardData,
		isLoading: isDashboardLoading,
		refetch: refetchDashboard,
	} = trpc.driver.getMobileDashboard.useQuery({}, { refetchInterval: 15000 });

	const {
		data: directRouteStops,
		isLoading: isRouteLoading,
		refetch: refetchStops,
	} = trpc.driver.getRouteStops.useQuery(undefined, {
		refetchInterval: 15000,
	});

	const isLoading = isDashboardLoading || isRouteLoading;
	const refetch = () => {
		refetchDashboard();
		refetchStops();
	};

	const submitHandover = trpc.driver.submitDeliveryHandover.useMutation({
		onSuccess: () => {
			toast.success(
				locale === "hi"
					? "डिलीवरी हैंडओवर एवं भुगतान सफलतापूर्वक रिकॉर्ड किया गया!"
					: "Delivery Handover & Payment Settlement recorded successfully!",
			);
			setBillModalOpen(true);
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to submit delivery handover.");
		},
	});

	// Phase: null = stops list view, number = handover view for that stop ID
	const [handoverStopId, setHandoverStopId] = useState<number | null>(null);

	// Handover form state
	const [cashAmount, setCashAmount] = useState<number>(0);
	const [onlineAmount, setOnlineAmount] = useState<number>(0);
	const [notes, setNotes] = useState("");
	const [billModalOpen, setBillModalOpen] = useState(false);
	const [extraModalOpen, setExtraModalOpen] = useState(false);
	const [selectedTruckItems, setSelectedTruckItems] = useState<
		Record<number, number>
	>({});
	const [items, setItems] = useState<OrderItemHandover[]>(DEFAULT_ITEMS);

	// Order filtering & Search states
	const [selectedOrderFilter, setSelectedOrderFilter] = useState<
		number | "all" | "van_stock"
	>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [collapsedOrders, setCollapsedOrders] = useState<Record<string, boolean>>(
		{},
	);

	const routeStops =
		directRouteStops && directRouteStops.length > 0
			? directRouteStops
			: (dashboardData?.routeStops ?? []);
	const activeStop = routeStops.find((s) => s.id === handoverStopId) ?? null;

	// ── Active Stop Orders List ────────────────────────────────────────────────
	const activeOrdersList = useMemo(() => {
		if (!activeStop) return [];

		// If activeStop has an orders array from backend
		if (activeStop.orders && activeStop.orders.length > 0) {
			return activeStop.orders.map((ord: any) => {
				const ordItems = items.filter((it) => it.order_id === ord.id);
				const ordDeliveredTotal = ordItems.reduce(
					(sum, it) => sum + it.deliveredQty * it.price,
					0,
				);
				const ordOriginalTotal = ordItems.reduce(
					(sum, it) => sum + it.originalQty * it.price,
					0,
				);
				const allChecked =
					ordItems.length > 0 && ordItems.every((it) => it.checked);
				const checkedCount = ordItems.filter((it) => it.checked).length;
				return {
					id: ord.id,
					orderIdStr: `ORD-${ord.id}`,
					status: ord.status,
					itemsCount: ordItems.length,
					deliveredTotal: ordDeliveredTotal,
					originalTotal: ordOriginalTotal || ord.total_amount,
					allChecked,
					checkedCount,
					items: ordItems,
				};
			});
		}

		// Fallback: group items by order_id if present
		const groupedMap = new Map<number, OrderItemHandover[]>();
		for (const item of items) {
			if (item.order_id) {
				if (!groupedMap.has(item.order_id)) {
					groupedMap.set(item.order_id, []);
				}
				groupedMap.get(item.order_id)!.push(item);
			}
		}

		if (groupedMap.size > 0) {
			return Array.from(groupedMap.entries()).map(([ordId, ordItems]) => {
				const ordDeliveredTotal = ordItems.reduce(
					(sum, it) => sum + it.deliveredQty * it.price,
					0,
				);
				const ordOriginalTotal = ordItems.reduce(
					(sum, it) => sum + it.originalQty * it.price,
					0,
				);
				return {
					id: ordId,
					orderIdStr: `ORD-${ordId}`,
					status: "in_transit",
					itemsCount: ordItems.length,
					deliveredTotal: ordDeliveredTotal,
					originalTotal: ordOriginalTotal,
					allChecked:
						ordItems.length > 0 && ordItems.every((it) => it.checked),
					checkedCount: ordItems.filter((it) => it.checked).length,
					items: ordItems,
				};
			});
		}

		// Single order fallback
		const fallbackId = activeStop.orderId || activeStop.id;
		const ordDeliveredTotal = items.reduce(
			(sum, it) => sum + it.deliveredQty * it.price,
			0,
		);
		return [
			{
				id: typeof fallbackId === "number" ? fallbackId : 1,
				orderIdStr: String(fallbackId).startsWith("ORD-")
					? String(fallbackId)
					: `ORD-${fallbackId}`,
				status: activeStop.rawStatus || "in_transit",
				itemsCount: items.length,
				deliveredTotal: ordDeliveredTotal,
				originalTotal: ordDeliveredTotal,
				allChecked: items.length > 0 && items.every((it) => it.checked),
				checkedCount: items.filter((it) => it.checked).length,
				items: items,
			},
		];
	}, [activeStop, items]);

	const vanStockItemsCount = useMemo(
		() => items.filter((i) => i.isVanStock).length,
		[items],
	);
	const vanStockDeliveredTotal = useMemo(
		() =>
			items
				.filter((i) => i.isVanStock)
				.reduce((sum, it) => sum + it.deliveredQty * it.price, 0),
		[items],
	);

	// ── Filtered items based on Order Tab + Search ────────────────────────────
	const filteredItems = useMemo(() => {
		return items.filter((item) => {
			// Order pill filter
			if (selectedOrderFilter === "van_stock") {
				if (!item.isVanStock) return false;
			} else if (selectedOrderFilter !== "all") {
				if (item.order_id !== selectedOrderFilter) return false;
			}

			// Text search filter
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const matchName = item.name.toLowerCase().includes(q);
				const matchOrderId = item.order_id
					? String(item.order_id).includes(q) ||
						`ord-${item.order_id}`.includes(q)
					: false;
				const matchReason = item.returnReason
					? item.returnReason.toLowerCase().includes(q)
					: false;
				if (!matchName && !matchOrderId && !matchReason) return false;
			}

			return true;
		});
	}, [items, selectedOrderFilter, searchQuery]);

	// ── Grouped Sections for Order-Wise Display ────────────────────────────────
	const groupedItemsByOrder = useMemo(() => {
		const groups: Array<{
			orderIdKey: string;
			orderIdNumeric?: number;
			orderTitle: string;
			orderBadge: string;
			orderTotal: number;
			items: OrderItemHandover[];
			allChecked: boolean;
			checkedCount: number;
		}> = [];

		if (selectedOrderFilter !== "all") {
			const isVan = selectedOrderFilter === "van_stock";
			const title = isVan
				? locale === "hi"
					? "अतिरिक्त वैन स्टॉक सामान (Van Stock)"
					: "Van Stock Additions"
				: `Order #${
						typeof selectedOrderFilter === "number"
							? `ORD-${selectedOrderFilter}`
							: selectedOrderFilter
					}`;
			const total = filteredItems.reduce(
				(sum, it) => sum + it.deliveredQty * it.price,
				0,
			);
			groups.push({
				orderIdKey: String(selectedOrderFilter),
				orderIdNumeric: isVan ? undefined : Number(selectedOrderFilter),
				orderTitle: title,
				orderBadge: isVan ? "Van Stock" : `ORD-${selectedOrderFilter}`,
				orderTotal: total,
				items: filteredItems,
				allChecked:
					filteredItems.length > 0 &&
					filteredItems.every((it) => it.checked),
				checkedCount: filteredItems.filter((it) => it.checked).length,
			});
			return groups;
		}

		// Group by order_id
		const orderMap = new Map<number, OrderItemHandover[]>();
		const vanStockList: OrderItemHandover[] = [];
		const otherList: OrderItemHandover[] = [];

		for (const item of filteredItems) {
			if (item.isVanStock) {
				vanStockList.push(item);
			} else if (item.order_id) {
				if (!orderMap.has(item.order_id)) {
					orderMap.set(item.order_id, []);
				}
				orderMap.get(item.order_id)!.push(item);
			} else {
				otherList.push(item);
			}
		}

		for (const [ordId, ordItems] of orderMap.entries()) {
			const total = ordItems.reduce(
				(sum, it) => sum + it.deliveredQty * it.price,
				0,
			);
			groups.push({
				orderIdKey: `ord-${ordId}`,
				orderIdNumeric: ordId,
				orderTitle: `Order #ORD-${ordId}`,
				orderBadge: `ORD-${ordId}`,
				orderTotal: total,
				items: ordItems,
				allChecked:
					ordItems.length > 0 && ordItems.every((it) => it.checked),
				checkedCount: ordItems.filter((it) => it.checked).length,
			});
		}

		if (vanStockList.length > 0) {
			const total = vanStockList.reduce(
				(sum, it) => sum + it.deliveredQty * it.price,
				0,
			);
			groups.push({
				orderIdKey: "van_stock",
				orderTitle:
					locale === "hi"
						? "अतिरिक्त वैन स्टॉक सामान (Van Stock)"
						: "Van Stock Additions",
				orderBadge: "Van Stock",
				orderTotal: total,
				items: vanStockList,
				allChecked:
					vanStockList.length > 0 &&
					vanStockList.every((it) => it.checked),
				checkedCount: vanStockList.filter((it) => it.checked).length,
			});
		}

		if (otherList.length > 0) {
			const total = otherList.reduce(
				(sum, it) => sum + it.deliveredQty * it.price,
				0,
			);
			groups.push({
				orderIdKey: "other",
				orderTitle: `${activeStop?.customerName || "Customer"} Items`,
				orderBadge: "Items",
				orderTotal: total,
				items: otherList,
				allChecked:
					otherList.length > 0 && otherList.every((it) => it.checked),
				checkedCount: otherList.filter((it) => it.checked).length,
			});
		}

		return groups;
	}, [filteredItems, selectedOrderFilter, activeStop, locale]);

	// ── Van stock helpers ──────────────────────────────────────────────────────

	const toggleTruckItem = (id: number) => {
		setSelectedTruckItems((prev) => {
			const copy = { ...prev };
			if (copy[id]) {
				delete copy[id];
			} else {
				copy[id] = 1;
			}
			return copy;
		});
	};

	const updateTruckItemQty = (id: number, delta: number) => {
		setSelectedTruckItems((prev) => {
			const current = prev[id] || 0;
			const next = Math.max(1, current + delta);
			return { ...prev, [id]: next };
		});
	};

	const handleAddMultipleTruckItemsToBill = () => {
		const newEntries: OrderItemHandover[] = [];
		for (const [idStr, qty] of Object.entries(selectedTruckItems)) {
			const id = Number(idStr);
			const truckItem = TRUCK_STOCK_ITEMS.find((t) => t.id === id);
			if (truckItem && qty > 0) {
				newEntries.push({
					id: id + Date.now() + Math.floor(Math.random() * 1000),
					order_id: null,
					isVanStock: true,
					name: `${truckItem.name} (Van Stock)`,
					originalQty: qty,
					deliveredQty: qty,
					returnedQty: 0,
					price: truckItem.price,
					checked: true,
				});
			}
		}
		if (newEntries.length === 0) {
			toast.error(
				locale === "hi"
					? "कृपया कम से कम एक सामान चुनें"
					: "Please select at least one item to add.",
			);
			return;
		}
		setItems((prev) => [...prev, ...newEntries]);
		toast.success(
			locale === "hi"
				? `वैन स्टॉक से ${newEntries.length} सामान ग्राहक बिल में जोड़े गए!`
				: `Added ${newEntries.length} items from Van Stock to customer bill!`,
		);
		setExtraModalOpen(false);
		setSelectedTruckItems({});
	};

	// ── Item inspection helpers ────────────────────────────────────────────────

	const handleQtyChange = (id: number, delta: number) => {
		setItems((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const newDelivered = Math.max(
						0,
						Math.min(item.originalQty, item.deliveredQty + delta),
					);
					const newReturned = item.originalQty - newDelivered;
					return {
						...item,
						deliveredQty: newDelivered,
						returnedQty: newReturned,
					};
				}
				return item;
			}),
		);
	};

	const handleReasonChange = (id: number, reason: string) => {
		setItems((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, returnReason: reason } : item,
			),
		);
	};

	const handleToggleCheck = (id: number) => {
		setItems((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, checked: !item.checked } : item,
			),
		);
	};

	const handleToggleAllChecks = () => {
		const targetList = filteredItems;
		const allTargetChecked =
			targetList.length > 0 && targetList.every((i) => i.checked);
		const targetIds = new Set(targetList.map((i) => i.id));
		setItems((prev) =>
			prev.map((item) =>
				targetIds.has(item.id)
					? { ...item, checked: !allTargetChecked }
					: item,
			),
		);
	};

	const handleToggleGroupChecks = (groupKey: string) => {
		const group = groupedItemsByOrder.find((g) => g.orderIdKey === groupKey);
		if (!group) return;
		const allGroupChecked = group.allChecked;
		const groupItemIds = new Set(group.items.map((i) => i.id));
		setItems((prev) =>
			prev.map((item) =>
				groupItemIds.has(item.id)
					? { ...item, checked: !allGroupChecked }
					: item,
			),
		);
	};

	const toggleCollapseOrder = (groupKey: string) => {
		setCollapsedOrders((prev) => ({
			...prev,
			[groupKey]: !prev[groupKey],
		}));
	};

	// ── Bill calculations ──────────────────────────────────────────────────────

	const subtotal = items.reduce(
		(acc, item) => acc + item.deliveredQty * item.price,
		0,
	);
	const totalReturnedValue = items.reduce(
		(acc, item) => acc + item.returnedQty * item.price,
		0,
	);
	const finalTotal = subtotal;
	const remainingBalance = finalTotal - (cashAmount + onlineAmount);

	const handleQuickFillPayment = (
		type: "fullCash" | "fullOnline" | "halfSplit",
	) => {
		if (type === "fullCash") {
			setCashAmount(finalTotal);
			setOnlineAmount(0);
		} else if (type === "fullOnline") {
			setCashAmount(0);
			setOnlineAmount(finalTotal);
		} else {
			const half = Math.round(finalTotal / 2);
			setCashAmount(half);
			setOnlineAmount(finalTotal - half);
		}
	};

	// ── Submit handover ────────────────────────────────────────────────────────

	const handleSubmitHandover = () => {
		if (remainingBalance !== 0) {
			toast.error(
				locale === "hi"
					? `भुगतान राशि कुल बिल ₹${finalTotal} से मेल नहीं खाती। बकाया: ₹${remainingBalance}`
					: `Payment amount does not match bill total of ₹${finalTotal}. Remaining balance: ₹${remainingBalance}`,
			);
			return;
		}
		submitHandover.mutate({
			trip_id: activeStop?.trip_id || 1,
			stop_id: activeStop?.id || 1,
			cashAmount: Number(cashAmount) || 0,
			onlineAmount: Number(onlineAmount) || 0,
			deliveryNotes: notes,
			damagedOrReturnedItems: items
				.filter((i) => (Number(i.returnedQty) || 0) > 0)
				.map((i) => ({
					id: Number(i.id),
					name: String(i.name || ""),
					qty: Number(i.returnedQty) || 0,
					reason: i.returnReason || "Item Returned / Damaged",
				})),
			deliveredItems: items
				.filter((i) => (Number(i.deliveredQty) || 0) > 0)
				.map((i) => ({
					id: Number(i.id),
					name: String(i.name || ""),
					qty: Number(i.deliveredQty) || 0,
					price: Number(i.price) || 0,
				})),
		});
	};

	// ── Done: advance to next pending stop or go back to list ─────────────────

	const handleDoneBill = () => {
		setBillModalOpen(false);
		const remainingPending = routeStops.filter(
			(s) =>
				s.id !== activeStop?.id &&
				s.status !== "completed" &&
				s.status !== "delivered",
		);
		if (remainingPending.length > 0) {
			const nextStop = remainingPending[0];
			setCashAmount(0);
			setOnlineAmount(0);
			setNotes("");
			setItems(DEFAULT_ITEMS);
			setSelectedOrderFilter("all");
			setSearchQuery("");
			setHandoverStopId(nextStop.id);
			toast.success(
				locale === "hi"
					? `${activeStop?.customerName || "ग्राहक"} की डिलीवरी पूरी हुई! अगला स्टॉप: ${nextStop.customerName}`
					: `Completed delivery for ${activeStop?.customerName || "Customer"}. Opening next stop: ${nextStop.customerName}!`,
			);
		} else {
			setHandoverStopId(null);
			toast.success(
				locale === "hi"
					? "इस ट्रिप के सभी डिलीवरी स्टॉप्स सफलतापूर्वक पूरे हो गए!"
					: "All delivery stops on this trip completed successfully!",
				{ duration: 5000 },
			);
		}
		refetch();
	};

	// ── Open handover for a stop ───────────────────────────────────────────────

	const handleOpenHandover = (stopId: number) => {
		setCashAmount(0);
		setOnlineAmount(0);
		setNotes("");
		setSelectedOrderFilter("all");
		setSearchQuery("");
		const targetStop = routeStops.find((s) => s.id === stopId);
		if (targetStop && targetStop.orderItems && targetStop.orderItems.length > 0) {
			setItems(
				targetStop.orderItems.map((oi: any) => ({
					id: oi.id,
					order_id:
						oi.order_id ??
						(targetStop.orders && targetStop.orders.length === 1
							? targetStop.orders[0].id
							: null),
					product_id: oi.product_id,
					name: oi.name,
					originalQty: Number(oi.qty) || 0,
					deliveredQty: Number(oi.qty) || 0,
					returnedQty: 0,
					price: Number(oi.price || 0),
					checked: Boolean(oi.checked),
					isVanStock: false,
				})),
			);
		} else {
			setItems(DEFAULT_ITEMS);
		}
		setHandoverStopId(stopId);
	};

	// ─────────────────────────────────────────────────────────────────────────
	// RENDER
	// ─────────────────────────────────────────────────────────────────────────

	return (
		<div className="min-h-screen bg-gray-50/50 p-4 md:p-6 dark:bg-gray-900">
			<div className="mx-auto max-w-6xl space-y-6">
				{/* ── Top Bar ─────────────────────────────────────────────────── */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center space-x-3">
						{handoverStopId !== null ? (
							<Button
								variant="outline"
								size="icon"
								onClick={() => setHandoverStopId(null)}
								className="h-9 w-9 rounded-xl shadow-xs"
							>
								<ArrowLeft className="h-4 w-4" />
							</Button>
						) : (
							<Link href="/driver">
								<Button variant="outline" size="icon" className="h-9 w-9 rounded-xl shadow-xs">
									<ArrowLeft className="h-4 w-4" />
								</Button>
							</Link>
						)}
						<div>
							<h1 className="font-bold text-xl sm:text-2xl text-gray-900 tracking-tight dark:text-white flex items-center gap-2">
								{handoverStopId !== null
									? (locale === "hi" ? "हैंडओवर एवं लाइव बिलिंग" : "Handover & Live Billing")
									: t("driver.deliveryStops")}
							</h1>
							<p className="text-gray-500 text-xs sm:text-sm dark:text-gray-400 flex items-center gap-2">
								{handoverStopId !== null ? (
									<>
										<span className="font-medium text-gray-800 dark:text-gray-200">
											{locale === "hi" ? "ग्राहक का नाम" : "Customer Name"}:{" "}
											<span className="font-bold text-blue-600 dark:text-blue-400">
												{activeStop?.customerName || "—"}
											</span>
										</span>
										<span>•</span>
										<span className="font-mono text-gray-500">
											Ref #{activeStop?.id ?? "—"}
										</span>
										{activeOrdersList.length > 1 && (
											<Badge
												variant="secondary"
												className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-semibold text-[11px]"
											>
												{activeOrdersList.length} {locale === "hi" ? "संयुक्त ऑर्डर्स" : "Combined Orders"}
											</Badge>
										)}
									</>
								) : (
									t("driver.selectStopToStartLiveHandoverBilling")
								)}
							</p>
						</div>
					</div>
					<Badge
						variant="outline"
						className="w-fit border-blue-500 bg-blue-50 px-3 py-1.5 text-blue-700 font-semibold shadow-2xs"
					>
						<Truck className="mr-1.5 h-4 w-4" />{" "}
						{t("driver.activeDriverSession")}
					</Badge>
				</div>

				{/* ══════════════════════════════════════════════════════════════
				    PHASE 1 — STOPS LIST
				    ══════════════════════════════════════════════════════════════ */}
				{handoverStopId === null && (
					<>
						{isLoading && (
							<div className="flex items-center justify-center py-20">
								<RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
								<span className="ml-3 text-gray-500 font-medium">
									{t("common.loading")}
								</span>
							</div>
						)}

						{!isLoading && routeStops.length === 0 && (
							<Card className="border-dashed border-border/80 bg-gradient-to-b from-card via-card to-muted/20 shadow-sm">
								<CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
									<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-6 ring-blue-50/50 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-900/20">
										<Package className="h-8 w-8" />
									</div>
									<h3 className="font-bold text-foreground text-lg sm:text-xl">
										{locale === "hi" ? "कोई सक्रिय डिलीवरी स्टॉप नहीं" : "No Active Delivery Stops"}
									</h3>
									<p className="mt-1.5 max-w-md text-muted-foreground text-xs leading-relaxed sm:text-sm">
										{locale === "hi"
											? "मैनेजर द्वारा आपको अभी कोई सक्रिय रूट असाइन नहीं किया गया है। डिस्पैच होते ही सभी ऑर्डर्स यहाँ दिखेंगे।"
											: "Your delivery manager has not assigned any active customer stops to you yet. Once your route is dispatched, your customer orders and handover verification tools will appear here."}
									</p>
									<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
										<Button
											variant="outline"
											size="sm"
											onClick={refetch}
											className="gap-2 text-xs"
										>
											<RefreshCw className="h-3.5 w-3.5" />{" "}
											{locale === "hi" ? "रूट चेक करें" : "Check for New Route"}
										</Button>
										<Button size="sm" asChild className="gap-2 text-xs">
											<Link href="/driver/route">
												<MapPin className="h-3.5 w-3.5" />{" "}
												{locale === "hi" ? "रूट डैशबोर्ड देखें" : "View Route Dashboard"}
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						)}

						{!isLoading && routeStops.length > 0 && (
							<div className="space-y-4">
								{/* Summary strip */}
								<div className="flex flex-wrap gap-3">
									<Badge
										variant="outline"
										className="gap-1.5 px-3 py-1 text-sm font-semibold bg-background"
									>
										<Package className="h-3.5 w-3.5 text-blue-600" />
										{routeStops.length} {t("driver.totalStops")}
									</Badge>
									<Badge
										variant="outline"
										className="gap-1.5 border-amber-400 bg-amber-50 px-3 py-1 text-amber-700 text-sm font-semibold dark:bg-amber-950/40 dark:text-amber-300"
									>
										{
											routeStops.filter(
												(s) =>
													s.status !== "delivered" &&
													s.status !== "completed" &&
													s.status !== "failed",
											).length
										}{" "}
										{t("status.pending")}
									</Badge>
									<Badge
										variant="outline"
										className="gap-1.5 border-emerald-400 bg-emerald-50 px-3 py-1 text-emerald-700 text-sm font-semibold dark:bg-emerald-950/40 dark:text-emerald-300"
									>
										<CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
										{
											routeStops.filter(
												(s) =>
													s.status === "delivered" || s.status === "completed",
											).length
										}{" "}
										{t("status.delivered")}
									</Badge>
								</div>

								{/* Stop cards */}
								<div className="grid gap-4 sm:grid-cols-2">
									{routeStops.map((stop, idx) => {
										const isDone =
											stop.status === "delivered" ||
											stop.status === "completed";
										const isFailed = stop.status === "failed";
										return (
											<Card
												key={stop.id}
												className={`shadow-xs transition-all border ${
													isDone
														? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20"
														: isFailed
															? "border-red-200 bg-red-50/30 dark:border-red-900"
															: "hover:border-blue-300 hover:shadow-md bg-card"
												}`}
											>
												<CardHeader className="pb-3">
													<div className="flex items-start justify-between gap-2">
														<div className="flex items-center gap-2">
															<span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs dark:bg-blue-900 dark:text-blue-300">
																{idx + 1}
															</span>
															<div>
																<CardTitle className="text-base leading-tight">
																	{stop.customerName}
																</CardTitle>
															</div>
														</div>
														<Badge
															variant={getStatusVariant(stop.status)}
															className="shrink-0 text-xs"
														>
															{getStatusLabel(stop.status)}
														</Badge>
													</div>
												</CardHeader>

												<CardContent className="space-y-2.5 pb-4 text-sm">
													{/* Address */}
													{stop.address && (
														<div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
															<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
															<span className="text-xs leading-snug">
																{stop.address}
															</span>
														</div>
													)}
													{/* Phone */}
													{stop.phone && (
														<div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
															<Phone className="h-4 w-4 shrink-0 text-gray-400" />
															<span className="text-xs font-mono">{stop.phone}</span>
														</div>
													)}

													{/* Orders tags breakdown */}
													<div className="flex flex-wrap items-center gap-1.5 pt-1">
														{stop.orders && stop.orders.length > 0 ? (
															stop.orders.map((ord: any) => (
																<span
																	key={ord.id}
																	className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50/80 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 shadow-2xs"
																>
																	<Package className="h-3 w-3" />
																	ORD-{ord.id}
																	{ord.total_amount > 0 && (
																		<span className="text-blue-950 dark:text-blue-200 font-semibold">
																			(₹{ord.total_amount})
																		</span>
																	)}
																</span>
															))
														) : (
															<span className="font-mono text-gray-500 text-xs">
																{typeof stop.orderId === "string" &&
																stop.orderId.startsWith("ORD-")
																	? stop.orderId
																	: `ORD-${stop.orderId || stop.id}`}
															</span>
														)}
														{stop.ordersCount && stop.ordersCount > 1 && (
															<span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
																{stop.ordersCount} {locale === "hi" ? "ऑर्डर्स" : "Orders"}
															</span>
														)}
													</div>

													{/* Order Items preview */}
													{stop.orderItems && stop.orderItems.length > 0 && (
														<div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40 overflow-hidden">
															<div className="flex items-center justify-between border-gray-100 border-b px-3 py-1.5 dark:border-gray-700 bg-muted/30">
																<span className="font-semibold text-[11px] text-gray-600 uppercase tracking-wide dark:text-gray-400 flex items-center gap-1.5">
																	<Package className="h-3.5 w-3.5 text-blue-500" />
																	{locale === "hi" ? "सामान सूची" : "Items Preview"} (
																	{stop.orderItems.length})
																</span>
																<span className="font-mono text-xs font-bold text-emerald-600">
																	₹{stop.amountToCollect ?? "—"}
																</span>
															</div>
															<div className="divide-y divide-gray-100 dark:divide-gray-700/60 max-h-36 overflow-y-auto">
																{stop.orderItems.slice(0, 4).map((oi: any, i: number) => (
																	<div
																		key={oi.id ?? i}
																		className="flex items-center justify-between px-3 py-1.5 text-xs"
																	>
																		<div className="flex items-center gap-2 truncate">
																			<span className="flex h-4 min-w-4 px-1 items-center justify-center rounded bg-blue-100 font-bold text-[10px] text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
																				{oi.qty}x
																			</span>
																			<span className="text-gray-700 dark:text-gray-300 truncate">
																				{oi.name}
																			</span>
																			{oi.order_id && (
																				<span className="text-[10px] font-mono text-muted-foreground">
																					[ORD-{oi.order_id}]
																				</span>
																			)}
																		</div>
																		{oi.price != null && (
																			<span className="ml-2 shrink-0 font-mono font-semibold text-gray-700 text-xs dark:text-gray-300">
																				₹{oi.price * oi.qty}
																			</span>
																		)}
																	</div>
																))}
																{stop.orderItems.length > 4 && (
																	<div className="px-3 py-1 text-[11px] text-center text-blue-600 font-semibold bg-blue-50/40 dark:bg-blue-950/20">
																		+{stop.orderItems.length - 4} {locale === "hi" ? "और सामान..." : "more items..."}
																	</div>
																)}
															</div>
														</div>
													)}

													{/* Amount to collect */}
													<div className="flex items-center justify-between border-t pt-2">
														<span className="text-xs font-medium text-muted-foreground">
															{locale === "hi" ? "कुल देय राशि:" : "Total Payable Amount:"}
														</span>
														<span className="flex items-center gap-0.5 font-bold font-mono text-base text-blue-600 dark:text-blue-400">
															<IndianRupee className="h-4 w-4" />
															{stop.amountToCollect ?? "—"}
														</span>
													</div>
												</CardContent>

												<CardFooter className="pt-0">
													{isDone ? (
														<div className="flex w-full gap-2">
															<div className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 py-2 font-semibold text-emerald-700 text-xs dark:bg-emerald-950/40 dark:text-emerald-300">
																<CheckCircle className="h-4 w-4" />{" "}
																{t("driver.handoverCompleted")}
															</div>
															<Button
																variant="outline"
																size="sm"
																className="border-emerald-300 text-emerald-700 text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
																onClick={() => handleOpenHandover(stop.id)}
															>
																{t("common.edit")} / {t("common.view")}
															</Button>
														</div>
													) : isFailed ? (
														<div className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-300 bg-red-50 py-2 font-semibold text-red-700 text-xs dark:bg-red-950/40 dark:text-red-300">
															{t("status.failed")}
														</div>
													) : (
														<Button
															className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-xs"
															onClick={() => handleOpenHandover(stop.id)}
														>
															<FileText className="h-4 w-4" />
															{locale === "hi" ? "सामान जाँचें एवं बिल बनाएं" : "Handover & Live Billing"}
														</Button>
													)}
												</CardFooter>
											</Card>
										);
									})}
								</div>
							</div>
						)}
					</>
				)}

				{/* ══════════════════════════════════════════════════════════════
				    PHASE 2 — HANDOVER & BILL PANEL (WITH ORDER SEPARATION & FILTERING)
				    ══════════════════════════════════════════════════════════════ */}
				{handoverStopId !== null && (
					<div className="grid gap-6 md:grid-cols-12">
						{/* Left Column: Item Inspection & Return/Damage Entry */}
						<div className="space-y-4 md:col-span-7">
							<Card className="shadow-sm border">
								<CardHeader className="border-b bg-gradient-to-r from-blue-50/50 via-gray-50/50 to-muted/20 pb-3 dark:from-blue-950/20 dark:via-gray-800/50 dark:to-gray-800/30">
									<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
										<div>
											<CardTitle className="flex items-center gap-2 text-base font-bold">
												<Package className="h-4 w-4 text-blue-600" />
												{locale === "hi"
													? "सामान वितरण सत्यापन (Itemized Verification)"
													: "Itemized Delivery Verification"}
											</CardTitle>
											<CardDescription className="text-xs">
												{locale === "hi"
													? "ग्राहकों को सौंपे गए या लौटाए गए सामान की मात्रा समायोजित करें।"
													: "Adjust quantities for items kept vs returned/damaged."}
											</CardDescription>
										</div>

										<div className="flex flex-wrap items-center gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												className={`h-8 gap-1 text-xs font-semibold transition-colors shadow-2xs ${
													filteredItems.length > 0 &&
													filteredItems.every((i) => i.checked)
														? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
														: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
												}`}
												onClick={handleToggleAllChecks}
											>
												<CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
												{filteredItems.length > 0 &&
												filteredItems.every((i) => i.checked)
													? locale === "hi" ? "सभी अनचेक करें" : "Uncheck All"
													: locale === "hi" ? "सभी सामान टिक करें" : "Tick All Items"}
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="h-8 gap-1 border-blue-300 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 shadow-2xs"
												onClick={() => setExtraModalOpen(true)}
											>
												<Plus className="h-3.5 w-3.5" />{" "}
												{locale === "hi" ? "+ वैन स्टॉक जोड़ें" : "+ Add Van Stock"}
											</Button>
										</div>
									</div>

									{/* ── Order Filter & Pills Bar (The core user request) ── */}
									<div className="mt-3 space-y-2 border-t pt-3">
										<div className="flex items-center justify-between text-xs">
											<span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
												<Layers className="h-3.5 w-3.5 text-blue-600" />
												{locale === "hi"
													? "ऑर्डर अनुसार अलग-अलग देखें (Filter by Order Number):"
													: "Filter by Order Number:"}
											</span>
											{selectedOrderFilter !== "all" && (
												<button
													type="button"
													onClick={() => setSelectedOrderFilter("all")}
													className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
												>
													<X className="h-3 w-3" />{" "}
													{locale === "hi" ? "सभी ऑर्डर्स देखें" : "Show All Orders"}
												</button>
											)}
										</div>

										<div className="flex flex-wrap gap-1.5">
											{/* All Orders Button */}
											<button
												type="button"
												onClick={() => setSelectedOrderFilter("all")}
												className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
													selectedOrderFilter === "all"
														? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20"
														: "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
												}`}
											>
												<Package className="h-3.5 w-3.5" />
												<span>{locale === "hi" ? "सभी ऑर्डर्स (All)" : "All Orders"}</span>
												<span
													className={`rounded-full px-1.5 py-0.2 text-[10px] ${
														selectedOrderFilter === "all"
															? "bg-blue-700 text-white"
															: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
													}`}
												>
													{items.length} {locale === "hi" ? "सामान" : "items"}
												</span>
											</button>

											{/* Individual Order Buttons */}
											{activeOrdersList.map((ord) => {
												const isSelected = selectedOrderFilter === ord.id;
												return (
													<button
														key={ord.id}
														type="button"
														onClick={() => setSelectedOrderFilter(ord.id)}
														className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
															isSelected
																? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20"
																: "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
														}`}
													>
														<span className="font-mono font-bold">
															{ord.orderIdStr}
														</span>
														<span
															className={`rounded px-1.5 py-0.2 font-mono text-[10px] ${
																isSelected
																	? "bg-indigo-700 text-white"
																	: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
															}`}
														>
															₹{ord.deliveredTotal}
														</span>
														<span
															className={`text-[10px] font-normal ${
																isSelected ? "text-indigo-100" : "text-gray-500"
															}`}
														>
															({ord.checkedCount}/{ord.itemsCount} ✓)
														</span>
													</button>
												);
											})}

											{/* Van Stock items button if added */}
											{vanStockItemsCount > 0 && (
												<button
													type="button"
													onClick={() => setSelectedOrderFilter("van_stock")}
													className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
														selectedOrderFilter === "van_stock"
															? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20"
															: "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
													}`}
												>
													<Plus className="h-3.5 w-3.5" />
													<span>Van Stock</span>
													<span className="rounded bg-emerald-200/80 dark:bg-emerald-900 px-1 py-0.2 font-mono text-[10px]">
														+₹{vanStockDeliveredTotal}
													</span>
												</button>
											)}
										</div>

										{/* Search box for quick filtering within or across orders */}
										<div className="relative pt-1">
											<Search className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-gray-400" />
											<Input
												type="text"
												placeholder={
													locale === "hi"
														? "सामान का नाम या कोड खोजें (Search item in order)..."
														: "Search item name, order # or return reason..."
												}
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
												className="h-8 pl-8 pr-8 text-xs bg-white dark:bg-gray-900"
											/>
											{searchQuery && (
												<button
													type="button"
													onClick={() => setSearchQuery("")}
													className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600"
												>
													<X className="h-3.5 w-3.5" />
												</button>
											)}
										</div>
									</div>
								</CardHeader>

								<CardContent className="p-3 space-y-4">
									{filteredItems.length === 0 ? (
										<div className="py-12 text-center text-muted-foreground text-xs">
											<Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
											<p className="font-semibold text-sm">
												{locale === "hi"
													? "कोई सामान नहीं मिला"
													: "No items match current order filter or search query"}
											</p>
											<Button
												variant="link"
												size="sm"
												onClick={() => {
													setSelectedOrderFilter("all");
													setSearchQuery("");
												}}
												className="mt-2 text-xs"
											>
												{locale === "hi" ? "फ़िल्टर रीसेट करें" : "Reset Filters"}
											</Button>
										</div>
									) : (
										groupedItemsByOrder.map((group) => {
											const isCollapsed = collapsedOrders[group.orderIdKey];
											return (
												<div
													key={group.orderIdKey}
													className="rounded-xl border bg-card shadow-2xs overflow-hidden transition-all"
												>
													{/* Group Section Header */}
													<div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/20 border-b">
														<div className="flex items-center gap-2">
															<button
																type="button"
																onClick={() => toggleCollapseOrder(group.orderIdKey)}
																className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded hover:bg-muted"
																title={isCollapsed ? "Expand" : "Collapse"}
															>
																{isCollapsed ? (
																	<ChevronDown className="h-4 w-4" />
																) : (
																	<ChevronUp className="h-4 w-4" />
																)}
															</button>
															<span className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
																<Package className="h-4 w-4 text-blue-600" />
																{group.orderTitle}
															</span>
															<Badge
																variant="secondary"
																className="font-mono text-[10px] font-bold bg-blue-100/70 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
															>
																{group.items.length} {locale === "hi" ? "सामान" : "Items"}
															</Badge>
														</div>

														<div className="flex items-center gap-2">
															<span className="font-mono font-bold text-xs text-foreground">
																₹{group.orderTotal}
															</span>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={() => handleToggleGroupChecks(group.orderIdKey)}
																className="h-6 px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
															>
																<CheckSquare className="mr-1 h-3 w-3 text-emerald-600" />
																{group.allChecked
																	? locale === "hi" ? "अनचेक" : "Uncheck"
																	: locale === "hi" ? "पूरा टिक करें" : "Tick Order"}
															</Button>
														</div>
													</div>

													{/* Group Items */}
													{!isCollapsed && (
														<div className="divide-y divide-border/60">
															{group.items.map((item) => (
																<div
																	key={item.id}
																	className={`space-y-2.5 p-3.5 transition-colors ${
																		item.checked
																			? "bg-emerald-50/50 dark:bg-emerald-950/20"
																			: ""
																	}`}
																>
																	<div className="flex items-start justify-between gap-3">
																		<div className="flex items-start gap-3">
																			<button
																				type="button"
																				onClick={() => handleToggleCheck(item.id)}
																				className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer ${
																					item.checked
																						? "border-emerald-600 bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20"
																						: "border-gray-300 bg-white hover:border-emerald-500 dark:border-gray-600 dark:bg-gray-800"
																				}`}
																				title={
																					item.checked
																						? "Handed Over (वितरित)"
																						: "Click to mark as handed over (वितरित चिह्नित करें)"
																				}
																			>
																				<Check
																					className={`h-4 w-4 ${
																						item.checked
																							? "opacity-100 stroke-[3]"
																							: "opacity-0"
																					}`}
																				/>
																			</button>

																			<div>
																				<div className="flex flex-wrap items-center gap-1.5">
																					<h4
																						onClick={() => handleToggleCheck(item.id)}
																						className={`cursor-pointer font-semibold text-xs sm:text-sm transition-colors ${
																							item.checked
																								? "text-emerald-950 dark:text-emerald-200 line-through decoration-emerald-500/50"
																								: "text-foreground"
																						}`}
																					>
																						{item.name}
																					</h4>
																					{item.order_id && (
																						<Badge
																							variant="outline"
																							className="font-mono text-[10px] font-bold border-indigo-200 bg-indigo-50/70 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 py-0"
																						>
																							ORD-{item.order_id}
																						</Badge>
																					)}
																					{item.isVanStock && (
																						<Badge
																							variant="outline"
																							className="font-mono text-[10px] font-bold border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 py-0"
																						>
																							Van Stock
																						</Badge>
																					)}
																					{item.checked && (
																						<Badge
																							variant="outline"
																							className="border-emerald-300 bg-emerald-100/80 text-[10px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 py-0"
																						>
																							✓ Handed Over
																						</Badge>
																					)}
																				</div>
																				<p className="text-muted-foreground text-[11px] mt-0.5">
																					{locale === "hi" ? "मूल्य" : "Price"}: ₹{item.price} / unit |{" "}
																					{locale === "hi" ? "अपेक्षित मात्रा" : "Total Expected"}:{" "}
																					<span className="font-semibold text-foreground">{item.originalQty}</span>
																				</p>
																			</div>
																		</div>

																		<span className="font-bold font-mono text-foreground text-xs sm:text-sm shrink-0">
																			₹{item.deliveredQty * item.price}
																		</span>
																	</div>

																	{/* Quantity Stepper & Return status */}
																	<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-2 text-xs">
																		<div className="flex items-center space-x-2">
																			<span className="font-semibold text-muted-foreground text-[11px]">
																				{locale === "hi" ? "स्वीकृत मात्रा:" : "Accepted Qty:"}
																			</span>
																			<div className="flex items-center space-x-1 bg-background border rounded-md p-0.5">
																				<Button
																					variant="ghost"
																					size="icon"
																					className="h-6 w-6 rounded"
																					onClick={() => handleQtyChange(item.id, -1)}
																				>
																					<Minus className="h-3 w-3" />
																				</Button>
																				<span className="w-8 text-center font-bold font-mono text-xs text-foreground">
																					{item.deliveredQty}
																				</span>
																				<Button
																					variant="ghost"
																					size="icon"
																					className="h-6 w-6 rounded"
																					onClick={() => handleQtyChange(item.id, 1)}
																				>
																					<Plus className="h-3 w-3" />
																				</Button>
																			</div>
																		</div>

																		{item.returnedQty > 0 ? (
																			<Badge variant="destructive" className="gap-1 font-semibold text-[11px]">
																				<AlertTriangle className="h-3 w-3" />
																				{item.returnedQty} {locale === "hi" ? "वापस / क्षतिग्रस्त" : "Returned / Damaged"}
																			</Badge>
																		) : (
																			<span className="text-[11px] text-emerald-600 font-medium">
																				✓ {locale === "hi" ? "पूरी मात्रा स्वीकृत" : "Full quantity accepted"}
																			</span>
																		)}
																	</div>

																	{/* Reason selection for returns */}
																	{item.returnedQty > 0 && (
																		<div className="space-y-1.5 rounded-lg border border-red-200 bg-red-50/50 p-2.5 dark:border-red-900/50 dark:bg-red-950/20">
																			<Label className="font-bold text-red-700 text-[11px] dark:text-red-400 flex items-center justify-between">
																				<span>{locale === "hi" ? "वापसी / क्षति का कारण चुनें:" : "Reason for Return / Damage:"}</span>
																				<span className="text-[10px] font-normal text-red-500">Required</span>
																			</Label>
																			<div className="grid gap-1.5 sm:grid-cols-2">
																				<select
																					value={
																						RETURN_PRESET_REASONS.includes(item.returnReason || "")
																							? item.returnReason
																							: "Custom / Other Reason"
																					}
																					onChange={(e) => {
																						const val = e.target.value;
																						if (val !== "Custom / Other Reason") {
																							handleReasonChange(item.id, val);
																						}
																					}}
																					className="h-8 rounded-md border border-red-200 bg-white px-2 text-xs text-red-950 dark:border-red-800 dark:bg-gray-900 dark:text-red-200 focus:outline-none focus:ring-1 focus:ring-red-500"
																				>
																					{RETURN_PRESET_REASONS.map((r) => (
																						<option key={r} value={r}>
																							{r}
																						</option>
																					))}
																				</select>
																				<Input
																					placeholder={
																						locale === "hi"
																							? "स्पष्टीकरण लिखें..."
																							: "Type specific reason / note..."
																					}
																					value={item.returnReason || ""}
																					onChange={(e) =>
																						handleReasonChange(item.id, e.target.value)
																					}
																					className="h-8 border-red-200 bg-white text-xs text-red-950 dark:border-red-800 dark:bg-gray-900 dark:text-red-200 focus:border-red-500"
																				/>
																			</div>
																		</div>
																	)}
																</div>
															))}
														</div>
													)}
												</div>
											);
										})
									)}
								</CardContent>
							</Card>

							{/* Delivery Notes */}
							<Card className="shadow-xs border">
								<CardHeader className="pb-2 pt-3">
									<CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
										{locale === "hi" ? "ड्राइवर डिलीवरी टिप्पणी / रिमार्क्स" : "Driver Stop Observations / Remarks"}
									</CardTitle>
								</CardHeader>
								<CardContent className="pb-3">
									<Textarea
										placeholder={
											locale === "hi"
												? "कोई विशेष टिप्पणी लिखें (जैसे: सुरक्षा गार्ड को सामान सौंपा, ग्राहक द्वारा नकद चेक कराया गया...)"
												: "Add any specific delivery remarks (e.g. Handed to security guard, cash verified with customer...)"
										}
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										rows={2}
										className="text-xs resize-none"
									/>
								</CardContent>
							</Card>
						</div>

						{/* Right Column: Live Bill Summary & Payment Collection with Order Breakdown */}
						<div className="space-y-4 md:col-span-5">
							<Card className="border-2 border-blue-500 shadow-md">
								<CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
									<CardTitle className="flex items-center justify-between text-base sm:text-lg font-bold">
										<span className="flex items-center gap-1.5">
											<FileText className="h-5 w-5" />
											{locale === "hi" ? "लाइव बिल सारांश" : "Live Invoice Summary"}
										</span>
										<Badge className="bg-white/20 text-white border-none font-mono text-xs">
											Ref #{activeStop?.id || "STOP-01"}
										</Badge>
									</CardTitle>
									<CardDescription className="text-blue-100 text-xs">
										{locale === "hi" ? "ग्राहक" : "Customer"}:{" "}
										<span className="font-bold text-white">
											{activeStop?.customerName || "Customer"}
										</span>
									</CardDescription>
								</CardHeader>

								<CardContent className="space-y-4 p-4">
									{/* Order-wise Breakdown Accordion/Widget */}
									{activeOrdersList.length > 0 && (
										<div className="rounded-xl border bg-muted/30 p-3 space-y-2">
											<div className="flex items-center justify-between text-xs font-bold text-foreground">
												<span className="flex items-center gap-1.5">
													<Layers className="h-3.5 w-3.5 text-blue-600" />
													{locale === "hi" ? "ऑर्डर अनुसार ब्रेकडाउन:" : "Order-Wise Breakdown:"}
												</span>
												<span className="font-mono text-muted-foreground text-[11px]">
													{activeOrdersList.length} {locale === "hi" ? "ऑर्डर्स" : "Orders"}
												</span>
											</div>

											<div className="space-y-1.5 max-h-40 overflow-y-auto">
												{activeOrdersList.map((ord) => {
													const isFiltered = selectedOrderFilter === ord.id;
													return (
														<button
															key={ord.id}
															type="button"
															onClick={() =>
																setSelectedOrderFilter((prev) =>
																	prev === ord.id ? "all" : ord.id,
																)
															}
															className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer border text-left ${
																isFiltered
																	? "bg-indigo-50 border-indigo-300 text-indigo-950 font-bold dark:bg-indigo-950/50 dark:text-indigo-200"
																	: "bg-background border-border/60 hover:bg-muted text-foreground"
															}`}
															title="Click to isolate this order's items"
														>
															<div className="flex items-center gap-1.5">
																<span className="font-mono font-bold text-blue-700 dark:text-blue-300">
																	{ord.orderIdStr}
																</span>
																<span className="text-[10px] text-muted-foreground">
																	({ord.itemsCount} {locale === "hi" ? "सामान" : "items"})
																</span>
															</div>
															<div className="flex items-center gap-1.5">
																<span className="font-mono font-semibold">
																	₹{ord.deliveredTotal}
																</span>
																<span className="text-[10px] text-emerald-600 font-bold">
																	{ord.checkedCount}/{ord.itemsCount} ✓
																</span>
															</div>
														</button>
													);
												})}
											</div>
										</div>
									)}

									{/* Total calculations */}
									<div className="space-y-2 text-xs sm:text-sm">
										<div className="flex justify-between text-muted-foreground">
											<span>{locale === "hi" ? "सामान उप-योग (Subtotal)" : "Items Subtotal"}</span>
											<span className="font-mono font-semibold text-foreground">₹{subtotal}</span>
										</div>
										{totalReturnedValue > 0 && (
											<div className="flex justify-between font-semibold text-red-600 dark:text-red-400">
												<span>{locale === "hi" ? "वापसी / क्षति कटौती" : "Return / Damage Deduction"}</span>
												<span className="font-mono">
													-₹{totalReturnedValue}
												</span>
											</div>
										)}
										<div className="flex justify-between border-t pt-2 font-bold text-base text-foreground">
											<span>{locale === "hi" ? "कुल देय राशि (Net Payable)" : "Net Payable Amount"}</span>
											<span className="font-mono text-blue-600 dark:text-blue-400 text-lg">
												₹{finalTotal}
											</span>
										</div>
									</div>

									{/* Payment Collection */}
									<div className="space-y-3 border-t pt-3">
										<Label className="flex items-center justify-between font-bold text-foreground text-xs">
											<span>{locale === "hi" ? "भुगतान संग्रह मोड (Payment Mode)" : "Payment Collection Mode"}</span>
											<span className="font-normal text-[10px] text-muted-foreground">
												Mixed / Split Supported
											</span>
										</Label>

										<div className="flex gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="flex-1 text-xs font-semibold h-8"
												onClick={() => handleQuickFillPayment("fullCash")}
											>
												<IndianRupee className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Full Cash
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="flex-1 text-xs font-semibold h-8"
												onClick={() => handleQuickFillPayment("fullOnline")}
											>
												<QrCode className="mr-1 h-3 w-3 text-blue-600" /> Full Online
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="flex-1 text-xs font-semibold h-8"
												onClick={() => handleQuickFillPayment("halfSplit")}
											>
												50/50 Split
											</Button>
										</div>

										<div className="grid grid-cols-2 gap-3 pt-1">
											<div className="space-y-1">
												<Label className="text-muted-foreground text-[11px] font-semibold">
													{locale === "hi" ? "नकद प्राप्त (₹ Cash)" : "Cash Received (₹)"}
												</Label>
												<Input
													type="number"
													value={cashAmount || ""}
													onChange={(e) =>
														setCashAmount(Number(e.target.value))
													}
													placeholder="0"
													className="font-mono text-sm h-9"
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-muted-foreground text-[11px] font-semibold">
													{locale === "hi" ? "ऑनलाइन / UPI प्राप्त (₹)" : "Online / UPI (₹)"}
												</Label>
												<Input
													type="number"
													value={onlineAmount || ""}
													onChange={(e) =>
														setOnlineAmount(Number(e.target.value))
													}
													placeholder="0"
													className="font-mono text-sm h-9"
												/>
											</div>
										</div>

										{/* Balance Status */}
										<div className="flex items-center justify-between rounded-lg bg-muted/60 p-2.5 font-bold text-xs">
											<span>{locale === "hi" ? "भुगतान स्थिति:" : "Payment Balance:"}</span>
											<span
												className={
													remainingBalance === 0
														? "text-emerald-600 font-bold"
														: "font-bold text-amber-600"
												}
											>
												{remainingBalance === 0
													? locale === "hi" ? "✓ पूर्ण भुगतान प्राप्त" : "✓ Paid in Full"
													: `₹${remainingBalance} ${locale === "hi" ? "बकाया" : "Pending"}`}
											</span>
										</div>
									</div>
								</CardContent>

								<CardFooter className="rounded-b-lg border-t bg-muted/20 p-4">
									<Button
										className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm h-10 shadow-xs"
										disabled={submitHandover.isPending}
										onClick={handleSubmitHandover}
									>
										{submitHandover.isPending ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											<CheckCircle className="h-4 w-4" />
										)}
										{locale === "hi" ? "हैंडओवर पूर्ण करें एवं रसीद जारी करें" : "Complete Handover & Issue Bill"}
									</Button>
								</CardFooter>
							</Card>
						</div>
					</div>
				)}
			</div>

			{/* ── POS-Standard Billing Checkout Overlay (A4 Sheet / 80mm Thermal & Sharing) ── */}
			{billModalOpen && (
				<SaleCompletionScreen
					order={{
						id: (activeStop?.orderIds?.[0] ||
							activeStop?.orderId ||
							Date.now().toString().slice(-6)) as any,
						createdAt: new Date().toISOString(),
						items: items.map((i) => ({
							id: i.id,
							name: i.name,
							productName: i.name,
							qty: Number(i.deliveredQty) || 0,
							price: String(i.price),
						})),
						total: finalTotal,
						subtotal: subtotal,
						discount: 0,
						payments: [
							...(cashAmount > 0
								? [{ methodId: 1, amount: String(cashAmount) }]
								: []),
							...(onlineAmount > 0
								? [{ methodId: 3, amount: String(onlineAmount) }]
								: []),
						],
						cashierName: dashboardData?.driverName || "Driver Staff",
						customerName:
							activeStop?.customerName &&
							activeStop.customerName !== "Customer"
								? activeStop.customerName
								: "Customer",
						customerPhone:
							activeStop?.phone && activeStop.phone !== "N/A"
								? activeStop.phone
								: "N/A",
						address:
							activeStop?.address && activeStop.address !== "N/A"
								? activeStop.address
								: "Delivery Address",
					}}
					onNewSale={handleDoneBill}
				/>
			)}

			{/* ── Add Extra Van Item Modal ──────────────────────────────────────── */}
			<Dialog open={extraModalOpen} onOpenChange={setExtraModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Package className="h-5 w-5 text-blue-600" />
							{locale === "hi"
								? "मौके पर अतिरिक्त सामान जोड़ें (Van Stock)"
								: "Add On-the-spot Items (Van Stock)"}
						</DialogTitle>
						<DialogDescription className="text-xs">
							{locale === "hi"
								? "ट्रक में मौजूद अतिरिक्त सामान को ग्राहक के लाइव बिल में शामिल करने के लिए चुनें।"
								: "Select one or multiple extra inventory items carried in the truck buffer stock to add to customer's live bill."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between font-semibold text-foreground text-xs">
								<span>{locale === "hi" ? "उपलब्ध वैन बफ़र सामान" : "Available Truck Buffer Items"}</span>
								<span className="font-normal text-[11px] text-blue-600">
									{locale === "hi" ? "शामिल करने के लिए चेक करें" : "Check items to include"}
								</span>
							</div>

							<div className="grid max-h-64 gap-2.5 overflow-y-auto rounded-lg border bg-muted/20 p-2">
								{TRUCK_STOCK_ITEMS.map((truckItem) => {
									const isSelected = !!selectedTruckItems[truckItem.id];
									const qty = selectedTruckItems[truckItem.id] || 1;
									return (
										<div
											key={truckItem.id}
											className={`space-y-2 rounded-lg border p-3 text-xs transition-all ${
												isSelected
													? "border-blue-500 bg-card shadow-xs"
													: "border-border bg-card/60 hover:border-border"
											}`}
										>
											<div className="flex items-center justify-between">
												<label className="flex flex-1 cursor-pointer items-center space-x-2.5">
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => toggleTruckItem(truckItem.id)}
														className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
													/>
													<span className="font-semibold text-foreground">
														{truckItem.name}
													</span>
												</label>
												<span className="font-bold font-mono text-foreground">
													₹{truckItem.price} / unit
												</span>
											</div>

											{isSelected && (
												<div className="flex items-center justify-between border-t pt-1.5">
													<span className="text-[11px] text-muted-foreground">
														{locale === "hi" ? "जोड़ी जाने वाली मात्रा:" : "Quantity to add:"}
													</span>
													<div className="flex items-center space-x-1.5">
														<Button
															type="button"
															variant="outline"
															size="icon"
															className="h-6 w-6"
															onClick={() =>
																updateTruckItemQty(truckItem.id, -1)
															}
														>
															<Minus className="h-3 w-3" />
														</Button>
														<span className="w-7 text-center font-bold font-mono text-xs text-foreground">
															{qty}
														</span>
														<Button
															type="button"
															variant="outline"
															size="icon"
															className="h-6 w-6"
															onClick={() =>
																updateTruckItemQty(truckItem.id, 1)
															}
														>
															<Plus className="h-3 w-3" />
														</Button>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>

						{/* Selection Summary */}
						{Object.keys(selectedTruckItems).length > 0 && (
							<div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 font-semibold text-blue-900 text-xs dark:bg-blue-950/40 dark:text-blue-100">
								<span>
									{Object.keys(selectedTruckItems).length} item(s) selected
								</span>
								<span className="font-mono text-sm">
									Subtotal: ₹
									{Object.entries(selectedTruckItems).reduce(
										(acc, [idStr, qty]) => {
											const item = TRUCK_STOCK_ITEMS.find(
												(t) => t.id === Number(idStr),
											);
											return acc + (item ? item.price * qty : 0);
										},
										0,
									)}
								</span>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setExtraModalOpen(false)}>
							{locale === "hi" ? "रद्द करें" : "Cancel"}
						</Button>
						<Button
							disabled={Object.keys(selectedTruckItems).length === 0}
							onClick={handleAddMultipleTruckItemsToBill}
							className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700 font-semibold"
						>
							{locale === "hi"
								? `चुने गए (${Object.keys(selectedTruckItems).length}) लाइव बिल में जोड़ें`
								: `Add Selected (${Object.keys(selectedTruckItems).length}) to Live Bill`}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
