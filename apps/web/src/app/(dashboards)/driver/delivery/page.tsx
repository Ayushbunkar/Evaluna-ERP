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
	CheckCircle,
	CreditCard,
	FileText,
	IndianRupee,
	MapPin,
	Minus,
	Package,
	Phone,
	Plus,
	Printer,
	QrCode,
	RefreshCw,
	Truck,
	User,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

type OrderItemHandover = {
	id: number;
	name: string;
	originalQty: number;
	deliveredQty: number;
	returnedQty: number;
	price: number;
	returnReason?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	if (status === "delivered" || status === "completed") return "secondary";
	if (status === "failed") return "destructive";
	if (status === "started") return "default";
	return "outline";
}

function getStatusLabel(status: string): string {
	if (status === "delivered" || status === "completed") return "Delivered ✓";
	if (status === "failed") return "Failed ✗";
	if (status === "started") return "In Progress";
	if (status === "partially_delivered") return "Partial";
	return "Pending";
}

// ─── Default items (to be replaced with real order items from API) ────────────

const DEFAULT_ITEMS: OrderItemHandover[] = [
	{
		id: 1,
		name: "Whole Wheat Atta 10kg",
		originalQty: 2,
		deliveredQty: 2,
		returnedQty: 0,
		price: 420,
	},
	{
		id: 2,
		name: "Refined Soyabean Oil 5L",
		originalQty: 1,
		deliveredQty: 1,
		returnedQty: 0,
		price: 650,
	},
	{
		id: 3,
		name: "Basmati Rice Special 5kg",
		originalQty: 1,
		deliveredQty: 0,
		returnedQty: 1,
		price: 580,
		returnReason: "Damaged Package",
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
	const t = useTranslations();
	const trpc = useTRPC();
	const {
		data: dashboardData,
		isLoading: isDashboardLoading,
		refetch: refetchDashboard,
	} = trpc.driver.getMobileDashboard.useQuery({});

	const {
		data: directRouteStops,
		isLoading: isRouteLoading,
		refetch: refetchStops,
	} = trpc.driver.getRouteStops.useQuery();

	const isLoading = isDashboardLoading || isRouteLoading;
	const refetch = () => {
		refetchDashboard();
		refetchStops();
	};

	const submitHandover = trpc.driver.submitDeliveryHandover.useMutation({
		onSuccess: () => {
			toast.success(
				"Delivery Handover & Payment Settlement recorded successfully!",
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

	const routeStops =
		directRouteStops && directRouteStops.length > 0
			? directRouteStops
			: (dashboardData?.routeStops ?? []);
	const activeStop = routeStops.find((s) => s.id === handoverStopId) ?? null;

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
					id: id + Date.now() + Math.random(),
					name: `${truckItem.name} (Van Stock)`,
					originalQty: qty,
					deliveredQty: qty,
					returnedQty: 0,
					price: truckItem.price,
				});
			}
		}
		if (newEntries.length === 0) {
			toast.error("Please select at least one item to add.");
			return;
		}
		setItems((prev) => [...prev, ...newEntries]);
		toast.success(
			`Added ${newEntries.length} items from Van Stock to customer bill!`,
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

	// ── Bill calculations ──────────────────────────────────────────────────────

	const subtotal = items.reduce(
		(acc, item) => acc + item.deliveredQty * item.price,
		0,
	);
	const totalReturnedValue = items.reduce(
		(acc, item) => acc + item.returnedQty * item.price,
		0,
	);
	const tax = Math.round(subtotal * 0.05); // 5% GST
	const finalTotal = subtotal + tax;
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
				`Payment amount does not match bill total of ₹${finalTotal}. Remaining balance: ₹${remainingBalance}`,
			);
			return;
		}
		submitHandover.mutate({
			trip_id: 1,
			stop_id: activeStop?.id || 1,
			cashAmount,
			onlineAmount,
			deliveryNotes: notes,
			damagedOrReturnedItems: items
				.filter((i) => i.returnedQty > 0)
				.map((i) => ({
					id: i.id,
					name: i.name,
					qty: i.returnedQty,
					reason: i.returnReason || "Item Returned / Damaged",
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
			// Reset form for next stop
			setCashAmount(0);
			setOnlineAmount(0);
			setNotes("");
			setItems(DEFAULT_ITEMS);
			setHandoverStopId(nextStop.id);
			toast.success(
				`Completed delivery for ${activeStop?.customerName || "Customer"}. Opening next stop: ${nextStop.customerName}!`,
			);
		} else {
			setHandoverStopId(null);
			toast.success("All delivery stops on this trip completed successfully!", {
				duration: 5000,
			});
		}
		refetch();
	};

	// ── Open handover for a stop ───────────────────────────────────────────────

	const handleOpenHandover = (stopId: number) => {
		// Reset form when opening a new stop
		setCashAmount(0);
		setOnlineAmount(0);
		setNotes("");
		setItems(DEFAULT_ITEMS);
		setHandoverStopId(stopId);
	};

	// ─────────────────────────────────────────────────────────────────────────
	// RENDER
	// ─────────────────────────────────────────────────────────────────────────

	return (
		<div className="min-h-screen bg-gray-50/50 p-4 md:p-6 dark:bg-gray-900">
			<div className="mx-auto max-w-5xl space-y-6">
				{/* ── Top Bar ─────────────────────────────────────────────────── */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center space-x-3">
						{handoverStopId !== null ? (
							<Button
								variant="outline"
								size="icon"
								onClick={() => setHandoverStopId(null)}
							>
								<ArrowLeft className="h-4 w-4" />
							</Button>
						) : (
							<Link href="/driver">
								<Button variant="outline" size="icon">
									<ArrowLeft className="h-4 w-4" />
								</Button>
							</Link>
						)}
						<div>
							<h1 className="font-bold text-2xl text-gray-900 tracking-tight dark:text-white">
								{handoverStopId !== null
									? t("driver.handoverAndLiveBilling")
									: t("driver.deliveryStops")}
							</h1>
							<p className="text-gray-500 text-sm dark:text-gray-400">
								{handoverStopId !== null
									? `${t("sales.customerName")}: ${activeStop?.customerName || "—"} · Ref #${activeStop?.id ?? "—"}`
									: t("driver.selectStopToStartLiveHandoverBilling")}
							</p>
						</div>
					</div>
					<Badge
						variant="outline"
						className="w-fit border-blue-500 bg-blue-50 px-3 py-1.5 text-blue-700"
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
								<span className="ml-3 text-gray-500">
									{t("common.loading")}
								</span>
							</div>
						)}

						{!isLoading && routeStops.length === 0 && (
							<Card className="border-dashed">
								<CardContent className="flex flex-col items-center justify-center py-16 text-center">
									<Package className="mb-4 h-12 w-12 text-gray-300" />
									<h3 className="font-semibold text-gray-700 dark:text-gray-300">
										{t("common.noItemFound")}
									</h3>
									<p className="mt-1 text-gray-500 text-sm">
										{t("driver.selectStopToStartLiveHandoverBilling")}
									</p>
								</CardContent>
							</Card>
						)}

						{!isLoading && routeStops.length > 0 && (
							<div className="space-y-4">
								{/* Summary strip */}
								<div className="flex flex-wrap gap-3">
									<Badge
										variant="outline"
										className="gap-1.5 px-3 py-1 text-sm"
									>
										<Package className="h-3.5 w-3.5" />
										{routeStops.length} {t("driver.totalStops")}
									</Badge>
									<Badge
										variant="outline"
										className="gap-1.5 border-amber-400 bg-amber-50 px-3 py-1 text-amber-700 text-sm"
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
										className="gap-1.5 border-emerald-400 bg-emerald-50 px-3 py-1 text-emerald-700 text-sm"
									>
										<CheckCircle className="h-3.5 w-3.5" />
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
												className={`shadow-sm transition-all ${
													isDone
														? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20"
														: isFailed
															? "border-red-200 bg-red-50/30 dark:border-red-900"
															: "hover:border-blue-200 hover:shadow-md"
												}`}
											>
												<CardHeader className="pb-3">
													<div className="flex items-start justify-between gap-2">
														<div className="flex items-center gap-2">
															<span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs dark:bg-blue-900 dark:text-blue-300">
																{idx + 1}
															</span>
															<CardTitle className="text-base leading-tight">
																{stop.customerName}
															</CardTitle>
														</div>
														<Badge
															variant={getStatusVariant(stop.status)}
															className="shrink-0 text-xs"
														>
															{getStatusLabel(stop.status, t)}
														</Badge>
													</div>
												</CardHeader>

												<CardContent className="space-y-2 pb-4 text-sm">
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
															<span className="text-xs">{stop.phone}</span>
														</div>
													)}
													{/* Order Items */}
													{stop.orderItems && stop.orderItems.length > 0 && (
														<div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800/40">
															<div className="flex items-center gap-1.5 border-gray-100 border-b px-3 py-1.5 dark:border-gray-700">
																<Package className="h-3.5 w-3.5 text-blue-500" />
																<span className="font-semibold text-[11px] text-gray-600 uppercase tracking-wide dark:text-gray-400">
																	{t("driver.orderItems")} (
																	{stop.orderItems.length})
																</span>
															</div>
															<div className="divide-y divide-gray-100 dark:divide-gray-700">
																{stop.orderItems.map(
																	(
																		oi: {
																			id: number;
																			name: string;
																			qty: number;
																			price?: number;
																		},
																		i: number,
																	) => (
																		<div
																			key={oi.id ?? i}
																			className="flex items-center justify-between px-3 py-2"
																		>
																			<div className="flex items-center gap-2">
																				<span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 font-bold text-[10px] text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
																					{oi.qty}
																				</span>
																				<span className="text-gray-700 text-xs leading-tight dark:text-gray-300">
																					{oi.name}
																				</span>
																			</div>
																			{oi.price != null && (
																				<span className="ml-2 shrink-0 font-mono font-semibold text-gray-700 text-xs dark:text-gray-300">
																					₹{oi.price * oi.qty}
																				</span>
																			)}
																		</div>
																	),
																)}
															</div>
														</div>
													)}
													{/* Order ref & amount */}
													<div className="flex items-center justify-between border-t pt-1">
														<span className="font-mono text-gray-500 text-xs">
															Ref #{stop.orderId || stop.id}
														</span>
														<span className="flex items-center gap-0.5 font-bold font-mono text-sm">
															<IndianRupee className="h-3.5 w-3.5" />
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
															className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
															onClick={() => handleOpenHandover(stop.id)}
														>
															<FileText className="h-4 w-4" />
															{t("driver.handoverAndLiveBilling")}
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
				    PHASE 2 — HANDOVER & BILL PANEL
				    ══════════════════════════════════════════════════════════════ */}
				{handoverStopId !== null && (
					<div className="grid gap-6 md:grid-cols-12">
						{/* Left Column: Item Inspection & Return/Damage Entry */}
						<div className="space-y-6 md:col-span-7">
							<Card className="shadow-sm">
								<CardHeader className="border-b bg-gray-50/50 pb-3 dark:bg-gray-800/50">
									<div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
										<div>
											<CardTitle className="flex items-center gap-2 text-base">
												<Package className="h-4 w-4 text-blue-600" />
												Itemized Delivery Verification
											</CardTitle>
											<CardDescription>
												Adjust quantities for items kept vs returned/damaged.
											</CardDescription>
										</div>
										<div className="flex items-center space-x-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="h-8 gap-1 border-blue-300 bg-blue-50 text-blue-700 text-xs hover:bg-blue-100"
												onClick={() => setExtraModalOpen(true)}
											>
												<Plus className="h-3.5 w-3.5" /> Add Extra Item (Van
												Stock)
											</Button>
											<Badge variant="secondary" className="font-mono text-xs">
												{activeStop
													? `ORD-${activeStop.orderId || activeStop.id}`
													: "ORD-LIVE"}
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent className="divide-y p-0">
									{items.map((item) => (
										<div key={item.id} className="space-y-3 p-4">
											<div className="flex items-start justify-between">
												<div>
													<h4 className="font-semibold text-gray-900 text-sm dark:text-white">
														{item.name}
													</h4>
													<p className="text-gray-500 text-xs dark:text-gray-400">
														Price: ₹{item.price} / unit | Total Expected:{" "}
														{item.originalQty}
													</p>
												</div>
												<span className="font-bold font-mono text-gray-900 text-sm dark:text-white">
													₹{item.deliveredQty * item.price}
												</span>
											</div>

											<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
												<div className="flex items-center space-x-2">
													<span className="font-medium text-gray-600 text-xs dark:text-gray-300">
														Accepted Qty:
													</span>
													<div className="flex items-center space-x-1">
														<Button
															variant="outline"
															size="icon"
															className="h-7 w-7"
															onClick={() => handleQtyChange(item.id, -1)}
														>
															<Minus className="h-3 w-3" />
														</Button>
														<span className="w-8 text-center font-bold text-sm">
															{item.deliveredQty}
														</span>
														<Button
															variant="outline"
															size="icon"
															className="h-7 w-7"
															onClick={() => handleQtyChange(item.id, 1)}
														>
															<Plus className="h-3 w-3" />
														</Button>
													</div>
												</div>
												{item.returnedQty > 0 && (
													<Badge variant="destructive" className="gap-1">
														<AlertTriangle className="h-3 w-3" />
														{item.returnedQty} Returned / Damaged
													</Badge>
												)}
											</div>

											{item.returnedQty > 0 && (
												<div className="space-y-1 pt-1">
													<Label className="font-medium text-red-600 text-xs dark:text-red-400">
														Reason for Return / Damage:
													</Label>
													<Input
														placeholder="e.g. Damaged seal, customer rejected item..."
														value={item.returnReason || ""}
														onChange={(e) =>
															handleReasonChange(item.id, e.target.value)
														}
														className="h-8 border-red-200 text-xs focus:border-red-500"
													/>
												</div>
											)}
										</div>
									))}
								</CardContent>
							</Card>

							{/* Delivery Notes */}
							<Card className="shadow-sm">
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">
										Driver Stop Observations / Remarks
									</CardTitle>
								</CardHeader>
								<CardContent>
									<Textarea
										placeholder="Add any specific delivery remarks (e.g. Handed to security guard, cash verified with customer...)"
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										rows={2}
										className="text-xs"
									/>
								</CardContent>
							</Card>
						</div>

						{/* Right Column: Live Bill Summary & Payment Collection */}
						<div className="space-y-6 md:col-span-5">
							<Card className="border-2 border-blue-500 shadow-md">
								<CardHeader className="rounded-t-lg bg-blue-600 text-white">
									<CardTitle className="flex items-center justify-between text-lg">
										<span>Live Invoice Summary</span>
										<FileText className="h-5 w-5 opacity-80" />
									</CardTitle>
									<CardDescription className="text-blue-100 text-xs">
										Customer: {activeStop?.customerName || "Customer"} | Ref: #
										{activeStop?.id || "STOP-01"}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4 p-5">
									<div className="space-y-2 text-sm">
										<div className="flex justify-between text-gray-600 dark:text-gray-300">
											<span>Items Subtotal</span>
											<span className="font-mono">₹{subtotal}</span>
										</div>
										{totalReturnedValue > 0 && (
											<div className="flex justify-between font-medium text-red-600 dark:text-red-400">
												<span>Return / Damage Deduction</span>
												<span className="font-mono">
													-₹{totalReturnedValue}
												</span>
											</div>
										)}
										<div className="flex justify-between text-gray-600 dark:text-gray-300">
											<span>Estimated GST (5%)</span>
											<span className="font-mono">₹{tax}</span>
										</div>
										<div className="flex justify-between border-t pt-2 font-bold text-base text-gray-900 dark:text-white">
											<span>Net Payable Amount</span>
											<span className="font-mono text-blue-600 dark:text-blue-400">
												₹{finalTotal}
											</span>
										</div>
									</div>

									{/* Payment Collection */}
									<div className="space-y-3 border-t pt-4">
										<Label className="flex items-center justify-between font-semibold text-gray-900 text-xs dark:text-white">
											<span>Payment Collection Mode</span>
											<span className="font-normal text-[10px] text-gray-500">
												Mixed / Full Split
											</span>
										</Label>

										<div className="flex gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="flex-1 text-xs"
												onClick={() => handleQuickFillPayment("fullCash")}
											>
												<IndianRupee className="mr-1 h-3.5 w-3.5" /> Full Cash
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="flex-1 text-xs"
												onClick={() => handleQuickFillPayment("fullOnline")}
											>
												<QrCode className="mr-1 h-3 w-3" /> Full Online
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="flex-1 text-xs"
												onClick={() => handleQuickFillPayment("halfSplit")}
											>
												50/50 Split
											</Button>
										</div>

										<div className="grid grid-cols-2 gap-3 pt-1">
											<div className="space-y-1">
												<Label className="text-gray-600 text-xs dark:text-gray-400">
													Cash Received (₹)
												</Label>
												<Input
													type="number"
													value={cashAmount || ""}
													onChange={(e) =>
														setCashAmount(Number(e.target.value))
													}
													placeholder="0"
													className="font-mono text-sm"
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-gray-600 text-xs dark:text-gray-400">
													Online / UPI Received (₹)
												</Label>
												<Input
													type="number"
													value={onlineAmount || ""}
													onChange={(e) =>
														setOnlineAmount(Number(e.target.value))
													}
													placeholder="0"
													className="font-mono text-sm"
												/>
											</div>
										</div>

										{/* Balance Status */}
										<div className="flex items-center justify-between rounded-md bg-gray-100 p-2.5 font-semibold text-xs dark:bg-gray-800">
											<span>Payment Balance:</span>
											<span
												className={
													remainingBalance === 0
														? "text-emerald-600"
														: "font-bold text-amber-600"
												}
											>
												{remainingBalance === 0
													? "✓ Paid in Full"
													: `₹${remainingBalance} Pending`}
											</span>
										</div>
									</div>
								</CardContent>
								<CardFooter className="rounded-b-lg border-t bg-gray-50 p-4 dark:bg-gray-800">
									<Button
										className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
										disabled={submitHandover.isPending}
										onClick={handleSubmitHandover}
									>
										{submitHandover.isPending ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											<CheckCircle className="h-4 w-4" />
										)}
										Complete Handover &amp; Issue Bill
									</Button>
								</CardFooter>
							</Card>
						</div>
					</div>
				)}
			</div>

			{/* ── Digital Receipt Modal ─────────────────────────────────────────── */}
			<Dialog open={billModalOpen} onOpenChange={setBillModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-emerald-600" />
							Digital Delivery Bill Generated
						</DialogTitle>
						<DialogDescription>
							Invoice #INV-DEL-{Date.now().toString().slice(-6)} recorded for
							Finance Manager.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 rounded-lg border bg-white p-4 font-mono text-gray-800 text-xs dark:bg-gray-950 dark:text-gray-200">
						<div className="border-b pb-2 text-center">
							<h3 className="font-bold text-sm">EVALUNA ERP LOGISTICS</h3>
							<p className="text-[10px] text-gray-500">Live Delivery Receipt</p>
						</div>

						<div className="space-y-1">
							<div className="flex justify-between">
								<span>Customer:</span>
								<span className="font-bold">
									{activeStop?.customerName || "Customer"}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Date/Time:</span>
								<span>{new Date().toLocaleTimeString()}</span>
							</div>
						</div>

						<div className="space-y-1 border-t border-b py-2">
							{items.map((i) => (
								<div key={i.id} className="flex justify-between">
									<span>
										{i.deliveredQty}x {i.name}
									</span>
									<span>₹{i.deliveredQty * i.price}</span>
								</div>
							))}
						</div>

						<div className="space-y-1 pt-1 font-bold">
							<div className="flex justify-between">
								<span>Total Net Bill:</span>
								<span>₹{finalTotal}</span>
							</div>
							<div className="flex justify-between text-emerald-600">
								<span>Cash Paid:</span>
								<span>₹{cashAmount}</span>
							</div>
							<div className="flex justify-between text-blue-600">
								<span>Online/UPI Paid:</span>
								<span>₹{onlineAmount}</span>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							className="gap-1.5"
							onClick={() => window.print()}
						>
							<Printer className="h-4 w-4" /> Print Receipt
						</Button>
						<Button onClick={handleDoneBill}>Done</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Add Extra Van Item Modal ──────────────────────────────────────── */}
			<Dialog open={extraModalOpen} onOpenChange={setExtraModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Package className="h-5 w-5 text-blue-600" />
							Add On-the-spot Items (Van Stock)
						</DialogTitle>
						<DialogDescription className="text-xs">
							Select one or multiple extra inventory items carried in the truck
							buffer stock to add to customer's live bill.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between font-semibold text-gray-700 text-xs dark:text-gray-300">
								<span>Available Truck Buffer Items</span>
								<span className="font-normal text-[11px] text-blue-600">
									Check items to include
								</span>
							</div>

							<div className="grid max-h-64 gap-2.5 overflow-y-auto rounded-lg border bg-gray-50/50 p-2 dark:bg-gray-900">
								{TRUCK_STOCK_ITEMS.map((truckItem) => {
									const isSelected = !!selectedTruckItems[truckItem.id];
									const qty = selectedTruckItems[truckItem.id] || 1;
									return (
										<div
											key={truckItem.id}
											className={`space-y-2 rounded-lg border p-3 text-xs transition-all ${
												isSelected
													? "border-blue-500 bg-white shadow-sm dark:bg-gray-800"
													: "border-gray-200 bg-white/60 hover:border-gray-300 dark:bg-gray-800/60"
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
													<span className="font-semibold text-gray-900 dark:text-white">
														{truckItem.name}
													</span>
												</label>
												<span className="font-bold font-mono text-gray-900 dark:text-white">
													₹{truckItem.price} / unit
												</span>
											</div>

											{isSelected && (
												<div className="flex items-center justify-between border-gray-100 border-t pt-1 dark:border-gray-700">
													<span className="text-[11px] text-gray-500">
														Quantity to add:
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
														<span className="w-7 text-center font-bold font-mono text-xs">
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
							Cancel
						</Button>
						<Button
							disabled={Object.keys(selectedTruckItems).length === 0}
							onClick={handleAddMultipleTruckItemsToBill}
							className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
						>
							Add Selected ({Object.keys(selectedTruckItems).length}) to Live
							Bill
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
