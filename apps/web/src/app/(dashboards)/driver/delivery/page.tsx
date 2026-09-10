"use client";

import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle,
	CreditCard,
	FileText,
	IndianRupee,
	Minus,
	Package,
	Plus,
	Printer,
	QrCode,
	RefreshCw,
	ShieldAlert,
	Truck,
	User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";
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

type OrderItemHandover = {
	id: number;
	name: string;
	originalQty: number;
	deliveredQty: number;
	returnedQty: number;
	price: number;
	returnReason?: string;
};

export default function DriverLiveDeliveryPage() {
	const trpc = useTRPC();
	const { data: dashboardData, isLoading, refetch } = trpc.driver.getMobileDashboard.useQuery({});
	const submitHandover = trpc.driver.submitDeliveryHandover.useMutation({
		onSuccess: () => {
			toast.success("Delivery Handover & Payment Settlement recorded successfully!");
			setBillModalOpen(true);
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to submit delivery handover.");
		},
	});

	const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
	const [cashAmount, setCashAmount] = useState<number>(0);
	const [onlineAmount, setOnlineAmount] = useState<number>(0);
	const [notes, setNotes] = useState("");
	const [billModalOpen, setBillModalOpen] = useState(false);
	const [extraModalOpen, setExtraModalOpen] = useState(false);
	const [selectedTruckItems, setSelectedTruckItems] = useState<Record<number, number>>({});

	// Items handover state per product
	const [items, setItems] = useState<OrderItemHandover[]>([
		{ id: 1, name: "Whole Wheat Atta 10kg", originalQty: 2, deliveredQty: 2, returnedQty: 0, price: 420 },
		{ id: 2, name: "Refined Soyabean Oil 5L", originalQty: 1, deliveredQty: 1, returnedQty: 0, price: 650 },
		{ id: 3, name: "Basmati Rice Special 5kg", originalQty: 1, deliveredQty: 0, returnedQty: 1, price: 580, returnReason: "Damaged Package" },
	]);

	const truckStockItems = [
		{ id: 101, name: "Sugar 1kg", price: 45 },
		{ id: 102, name: "Fortune Soyabean Oil 1L", price: 140 },
		{ id: 103, name: "Taj Mahal Tea 250g", price: 180 },
		{ id: 104, name: "Amul Pure Ghee 1L", price: 620 },
		{ id: 105, name: "Tata Salt 1kg", price: 28 },
	];

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
			const truckItem = truckStockItems.find((t) => t.id === id);
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
		toast.success(`Added ${newEntries.length} items from Van Stock to customer bill!`);
		setExtraModalOpen(false);
		setSelectedTruckItems({});
	};

	const activeStop = dashboardData?.routeStops?.find((s) => s.id === selectedStopId) || dashboardData?.routeStops?.[0];

	const handleQtyChange = (id: number, delta: number) => {
		setItems((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const newDelivered = Math.max(0, Math.min(item.originalQty, item.deliveredQty + delta));
					const newReturned = item.originalQty - newDelivered;
					return { ...item, deliveredQty: newDelivered, returnedQty: newReturned };
				}
				return item;
			}),
		);
	};

	const handleReasonChange = (id: number, reason: string) => {
		setItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, returnReason: reason } : item)),
		);
	};

	// Bill calculations
	const subtotal = items.reduce((acc, item) => acc + item.deliveredQty * item.price, 0);
	const totalReturnedValue = items.reduce((acc, item) => acc + item.returnedQty * item.price, 0);
	const tax = Math.round(subtotal * 0.05); // 5% GST
	const finalTotal = subtotal + tax;
	const remainingBalance = finalTotal - (cashAmount + onlineAmount);

	const handleQuickFillPayment = (type: "fullCash" | "fullOnline" | "halfSplit") => {
		if (type === "fullCash") {
			setCashAmount(finalTotal);
			setOnlineAmount(0);
		} else if (type === "fullOnline") {
			setCashAmount(0);
			setOnlineAmount(finalTotal);
		} else if (type === "halfSplit") {
			const half = Math.round(finalTotal / 2);
			setCashAmount(half);
			setOnlineAmount(finalTotal - half);
		}
	};

	const handleSubmitHandover = () => {
		if (remainingBalance !== 0) {
			toast.error(`Payment amount does not match bill total of ₹${finalTotal}. Remaining balance: ₹${remainingBalance}`);
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

	const handleDoneBill = () => {
		setBillModalOpen(false);

		// Find remaining pending stops excluding the current one
		const remainingPending = dashboardData?.routeStops?.filter(
			(s) => s.id !== activeStop?.id && s.status !== "completed" && s.status !== "delivered",
		);

		if (remainingPending && remainingPending.length > 0) {
			const nextStop = remainingPending[0];
			setSelectedStopId(nextStop.id);
			setCashAmount(0);
			setOnlineAmount(0);
			setNotes("");
			toast.success(`Completed delivery for ${activeStop?.customerName || "Customer"}. Selected next stop: ${nextStop.customerName}!`);
		} else {
			toast.success("All customer delivery stops on this trip completed successfully!", {
				duration: 5000,
			});
		}
		refetch();
	};

	return (
		<div className="min-h-screen bg-gray-50/50 p-4 md:p-6 dark:bg-gray-900">
			<div className="mx-auto max-w-5xl space-y-6">
				{/* Top Bar Navigation */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center space-x-3">
						<Link href="/driver">
							<Button variant="outline" size="icon">
								<ArrowLeft className="h-4 w-4" />
							</Button>
						</Link>
						<div>
							<h1 className="font-bold text-2xl text-gray-900 tracking-tight dark:text-white">
								Live Stop Handover & Bill Generation
							</h1>
							<p className="text-gray-500 text-sm dark:text-gray-400">
								Inspect package items, record returns/damage, & settle payment live.
							</p>
						</div>
					</div>
					<Badge variant="outline" className="w-fit border-blue-500 bg-blue-50 text-blue-700 py-1.5 px-3">
						<Truck className="mr-1.5 h-4 w-4" /> Active Driver Session
					</Badge>
				</div>

				{/* Active Stop Selector */}
				{dashboardData?.routeStops && dashboardData.routeStops.length > 0 && (
					<Card className="border-blue-100 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div className="flex items-center space-x-2">
									<User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									<span className="font-semibold text-gray-900 dark:text-white">Select Customer Stop:</span>
								</div>
								<div className="flex flex-wrap gap-2">
									{dashboardData.routeStops.map((stop) => (
										<Button
											key={stop.id}
											variant={selectedStopId === stop.id || (!selectedStopId && stop === activeStop) ? "default" : "outline"}
											size="sm"
											onClick={() => setSelectedStopId(stop.id)}
											className="gap-1.5"
										>
											<span>{stop.customerName}</span>
											<Badge
												variant={stop.status === "completed" ? "secondary" : "outline"}
												className="ml-1 text-[10px]"
											>
												{stop.status}
											</Badge>
										</Button>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				<div className="grid gap-6 md:grid-cols-12">
					{/* Left Column: Item Inspection & Return/Damage Entry */}
					<div className="space-y-6 md:col-span-7">
						<Card className="shadow-sm">
							<CardHeader className="border-b bg-gray-50/50 pb-3 dark:bg-gray-800/50">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
											className="h-8 text-xs gap-1 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
											onClick={() => setExtraModalOpen(true)}
										>
											<Plus className="h-3.5 w-3.5" /> Add Extra Item (Van Stock)
										</Button>
										<Badge variant="secondary" className="font-mono text-xs">
											{activeStop ? `ORD-${activeStop.orderId || activeStop.id}` : "ORD-LIVE"}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent className="divide-y p-0">
								{items.map((item) => (
									<div key={item.id} className="p-4 space-y-3">
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-semibold text-gray-900 text-sm dark:text-white">
													{item.name}
												</h4>
												<p className="text-gray-500 text-xs dark:text-gray-400">
													Price: ₹{item.price} / unit | Total Expected: {item.originalQty}
												</p>
											</div>
											<span className="font-bold font-mono text-sm text-gray-900 dark:text-white">
												₹{item.deliveredQty * item.price}
											</span>
										</div>

										<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
											<div className="flex items-center space-x-2">
												<span className="text-xs font-medium text-gray-600 dark:text-gray-300">Accepted Qty:</span>
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
												<Label className="text-xs text-red-600 dark:text-red-400 font-medium">
													Reason for Return / Damage:
												</Label>
												<Input
													placeholder="e.g. Damaged seal, customer rejected item..."
													value={item.returnReason || ""}
													onChange={(e) => handleReasonChange(item.id, e.target.value)}
													className="h-8 text-xs border-red-200 focus:border-red-500"
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
								<CardTitle className="text-sm">Driver Stop Observations / Remarks</CardTitle>
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
							<CardHeader className="bg-blue-600 text-white rounded-t-lg">
								<CardTitle className="flex items-center justify-between text-lg">
									<span>Live Invoice Summary</span>
									<FileText className="h-5 w-5 opacity-80" />
								</CardTitle>
								<CardDescription className="text-blue-100 text-xs">
									Customer: {activeStop?.customerName || "Customer"} | Ref: #{activeStop?.id || "STOP-01"}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 p-5">
								<div className="space-y-2 text-sm">
									<div className="flex justify-between text-gray-600 dark:text-gray-300">
										<span>Items Subtotal</span>
										<span className="font-mono">₹{subtotal}</span>
									</div>
									{totalReturnedValue > 0 && (
										<div className="flex justify-between text-red-600 dark:text-red-400 font-medium">
											<span>Return / Damage Deduction</span>
											<span className="font-mono">-₹{totalReturnedValue}</span>
										</div>
									)}
									<div className="flex justify-between text-gray-600 dark:text-gray-300">
										<span>Estimated GST (5%)</span>
										<span className="font-mono">₹{tax}</span>
									</div>
									<div className="border-t pt-2 flex justify-between font-bold text-base text-gray-900 dark:text-white">
										<span>Net Payable Amount</span>
										<span className="font-mono text-blue-600 dark:text-blue-400">₹{finalTotal}</span>
									</div>
								</div>

								{/* Payment Collection Breakdown */}
								<div className="space-y-3 border-t pt-4">
									<Label className="font-semibold text-gray-900 text-xs dark:text-white flex items-center justify-between">
										<span>Payment Collection Mode</span>
										<span className="text-[10px] text-gray-500 font-normal">Mixed / Full Split</span>
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
											<Label className="text-xs text-gray-600 dark:text-gray-400">Cash Received (₹)</Label>
											<Input
												type="number"
												value={cashAmount || ""}
												onChange={(e) => setCashAmount(Number(e.target.value))}
												placeholder="0"
												className="font-mono text-sm"
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-xs text-gray-600 dark:text-gray-400">Online / UPI Received (₹)</Label>
											<Input
												type="number"
												value={onlineAmount || ""}
												onChange={(e) => setOnlineAmount(Number(e.target.value))}
												placeholder="0"
												className="font-mono text-sm"
											/>
										</div>
									</div>

									{/* Balance Status */}
									<div className="rounded-md bg-gray-100 p-2.5 text-xs font-semibold flex items-center justify-between dark:bg-gray-800">
										<span>Payment Balance:</span>
										<span className={remainingBalance === 0 ? "text-emerald-600" : "text-amber-600 font-bold"}>
											{remainingBalance === 0 ? "✓ Paid in Full" : `₹${remainingBalance} Pending`}
										</span>
									</div>
								</div>
							</CardContent>
							<CardFooter className="bg-gray-50 border-t p-4 rounded-b-lg dark:bg-gray-800">
								<Button
									className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
									disabled={submitHandover.isPending}
									onClick={handleSubmitHandover}
								>
									{submitHandover.isPending ? (
										<RefreshCw className="h-4 w-4 animate-spin" />
									) : (
										<CheckCircle className="h-4 w-4" />
									)}
									Complete Handover & Issue Bill
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
			</div>

			{/* Digital Receipt Bill Modal */}
			<Dialog open={billModalOpen} onOpenChange={setBillModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-emerald-600" />
							Digital Delivery Bill Generated
						</DialogTitle>
						<DialogDescription>
							Invoice #INV-DEL-{Date.now().toString().slice(-6)} recorded for Finance Manager.
						</DialogDescription>
					</DialogHeader>

					<div className="rounded-lg border p-4 space-y-3 bg-white font-mono text-xs text-gray-800 dark:bg-gray-950 dark:text-gray-200">
						<div className="text-center border-b pb-2">
							<h3 className="font-bold text-sm">EVALUNA ERP LOGISTICS</h3>
							<p className="text-[10px] text-gray-500">Live Delivery Receipt</p>
						</div>

						<div className="space-y-1">
							<div className="flex justify-between">
								<span>Customer:</span>
								<span className="font-bold">{activeStop?.customerName || "Customer"}</span>
							</div>
							<div className="flex justify-between">
								<span>Date/Time:</span>
								<span>{new Date().toLocaleTimeString()}</span>
							</div>
						</div>

						<div className="border-t border-b py-2 space-y-1">
							{items.map((i) => (
								<div key={i.id} className="flex justify-between">
									<span>{i.deliveredQty}x {i.name}</span>
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
						<Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
							<Printer className="h-4 w-4" /> Print Receipt
						</Button>
						<Button onClick={handleDoneBill}>Done</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add Extra Van Item Modal (Multi-select) */}
			<Dialog open={extraModalOpen} onOpenChange={setExtraModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Package className="h-5 w-5 text-blue-600" />
							Add On-the-spot Items (Van Stock)
						</DialogTitle>
						<DialogDescription className="text-xs">
							Select one or multiple extra inventory items carried in the truck buffer stock to add to customer's live bill.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
								<span>Available Truck Buffer Items</span>
								<span className="text-[11px] text-blue-600 font-normal">Check items to include</span>
							</div>

							<div className="grid gap-2.5 max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50/50 dark:bg-gray-900">
								{truckStockItems.map((truckItem) => {
									const isSelected = !!selectedTruckItems[truckItem.id];
									const qty = selectedTruckItems[truckItem.id] || 1;

									return (
										<div
											key={truckItem.id}
											className={`p-3 rounded-lg text-xs border transition-all space-y-2 ${
												isSelected
													? "border-blue-500 bg-white dark:bg-gray-800 shadow-sm"
													: "border-gray-200 bg-white/60 dark:bg-gray-800/60 hover:border-gray-300"
											}`}
										>
											<div className="flex items-center justify-between">
												<label className="flex items-center space-x-2.5 cursor-pointer flex-1">
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
												<span className="font-mono font-bold text-gray-900 dark:text-white">
													₹{truckItem.price} / unit
												</span>
											</div>

											{isSelected && (
												<div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
													<span className="text-[11px] text-gray-500">Quantity to add:</span>
													<div className="flex items-center space-x-1.5">
														<Button
															type="button"
															variant="outline"
															size="icon"
															className="h-6 w-6"
															onClick={() => updateTruckItemQty(truckItem.id, -1)}
														>
															<Minus className="h-3 w-3" />
														</Button>
														<span className="w-7 text-center font-bold text-xs font-mono">
															{qty}
														</span>
														<Button
															type="button"
															variant="outline"
															size="icon"
															className="h-6 w-6"
															onClick={() => updateTruckItemQty(truckItem.id, 1)}
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
							<div className="rounded-lg bg-blue-50 p-3 text-xs font-semibold text-blue-900 flex justify-between items-center dark:bg-blue-950/40 dark:text-blue-100 border border-blue-200">
								<span>{Object.keys(selectedTruckItems).length} item(s) selected</span>
								<span className="font-mono text-sm">
									Subtotal: ₹
									{Object.entries(selectedTruckItems).reduce((acc, [idStr, qty]) => {
										const item = truckStockItems.find((t) => t.id === Number(idStr));
										return acc + (item ? item.price * qty : 0);
									}, 0)}
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
							className="bg-blue-600 text-white hover:bg-blue-700 gap-1.5"
						>
							Add Selected ({Object.keys(selectedTruckItems).length}) to Live Bill
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
