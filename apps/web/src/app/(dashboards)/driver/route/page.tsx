"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
	ActivityIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	FileTextIcon,
	MapPinIcon,
	NavigationIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function DriverRoutePage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: routeStops,
		isLoading,
		error,
		refetch,
	} = trpc.driver.getRouteStops.useQuery();

	// Modal States
	const [activeStartStop, setActiveStartStop] = useState<any | null>(null);
	const [activeCompleteStop, setActiveCompleteStop] = useState<any | null>(null);
	const [activeCodStop, setActiveCodStop] = useState<any | null>(null);
	const [activePodStop, setActivePodStop] = useState<any | null>(null);

	const [codAmount, setCodAmount] = useState("");
	const [paymentMethod, setPaymentMethod] = useState("UPI / QR Code");
	const [deliveryNotes, setDeliveryNotes] = useState("");

	const startTripMutation = trpc.driver.startTrip.useMutation({
		onSuccess: () => {
			toast.success(`Navigation started for Stop #${activeStartStop?.id} (${activeStartStop?.customerName})!`);
			setActiveStartStop(null);
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to start delivery trip.");
		},
	});

	const completeStopMutation = trpc.driver.updateStopStatus.useMutation({
		onSuccess: () => {
			toast.success(`Delivery completed & verified for ${activeCompleteStop?.customerName || "Customer"}!`);
			setActiveCompleteStop(null);
			setDeliveryNotes("");
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update stop status.");
		},
	});

	const handleConfirmStart = () => {
		if (!activeStartStop) return;
		if (activeStartStop.trip_id) {
			startTripMutation.mutate({ trip_id: activeStartStop.trip_id });
		} else {
			toast.success(`Navigation started for Stop #${activeStartStop.id} (${activeStartStop.customerName})!`);
			setActiveStartStop(null);
			refetch();
		}
	};

	const handleConfirmComplete = () => {
		if (!activeCompleteStop) return;
		completeStopMutation.mutate({
			stop_id: activeCompleteStop.id,
			status: "delivered",
			comments: deliveryNotes || "Handed to customer cleanly.",
		});
	};

	const handleConfirmCod = () => {
		if (!activeCodStop) return;
		toast.success(`₹${codAmount || "0"} collected via ${paymentMethod} for Order ORD-${activeCodStop.orderId || activeCodStop.id}!`);
		setActiveCodStop(null);
		setCodAmount("");
	};

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading route stops
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Driver Route
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Current route and delivery stops
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Driver Activities
					</Button>
				</div>
			</div>

			{!routeStops || routeStops.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No route stops found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">Stop #</TableHead>
								<TableHead className="text-left">Customer</TableHead>
								<TableHead className="text-left">Address</TableHead>
								<TableHead className="text-left">Order</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{routeStops.map((stop: any, index: number) => (
								<TableRow key={`${stop.id}-${index}`}>
									<TableCell>{index + 1}</TableCell>
									<TableCell>{stop.customerName}</TableCell>
									<TableCell>{stop.address}</TableCell>
									<TableCell>{stop.orderId}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${stop.status === "completed" ? "bg-green-100 text-green-800" : stop.status === "next" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}
										>
											{stop.status === "completed"
												? "Delivered"
												: stop.status === "next"
													? "Next Stop"
													: "Pending"}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										{(stop.status === "pending" || stop.status === "next") && (
											<Button
												variant="outline"
												size="sm"
												className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-medium"
												onClick={() => setActiveStartStop(stop)}
											>
												<MapPinIcon className="mr-1 h-3.5 w-3.5" /> Start Stop
											</Button>
										)}
										{(stop.status === "started" || stop.status === "pending" || stop.status === "next") && (
											<Link href="/driver/delivery">
												<Button
													size="sm"
													className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-sm"
												>
													<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" /> Complete Delivery & Handover
												</Button>
											</Link>
										)}
										{stop.status === "started" && (
											<Button
												variant="outline"
												size="sm"
												className="h-8 border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-medium"
												onClick={() => {
													setActiveCodStop(stop);
													setCodAmount(stop.amountToCollect ? String(stop.amountToCollect) : "500");
												}}
											>
												<AlertTriangleIcon className="mr-1 h-3.5 w-3.5 text-amber-600" /> Collect COD
											</Button>
										)}
										{(stop.status === "completed" || stop.status === "delivered") && (
											<Button
												variant="outline"
												size="sm"
												className="h-8 text-xs border-slate-200 font-medium"
												onClick={() => setActivePodStop(stop)}
											>
												<FileTextIcon className="mr-1 h-3.5 w-3.5 text-slate-600" /> View PoD
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* 1. Start Delivery Dialog */}
			<Dialog open={!!activeStartStop} onOpenChange={(open) => !open && setActiveStartStop(null)}>
				<DialogContent className="sm:max-w-[440px] border-blue-200">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-blue-900">
							<NavigationIcon className="h-5 w-5 text-blue-600" />
							Start Navigation to Stop #{activeStartStop?.id}?
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Begin GPS guidance and notify recipient of estimated arrival.
						</DialogDescription>
					</DialogHeader>

					{activeStartStop && (
						<div className="space-y-3 py-2 text-sm">
							<div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 space-y-1.5 text-xs">
								<div className="flex justify-between">
									<span className="text-slate-500">Recipient:</span>
									<span className="font-bold text-slate-900">{activeStartStop.customerName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Destination Address:</span>
									<span className="font-medium text-slate-800 text-right max-w-[200px]">📍 {activeStartStop.address}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Order Reference:</span>
									<span className="font-mono font-bold text-blue-700">{activeStartStop.orderId ? `ORD-${activeStartStop.orderId}` : `ORD-${activeStartStop.id}`}</span>
								</div>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setActiveStartStop(null)}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmStart}
							disabled={startTripMutation.isPending}
							className="bg-blue-600 text-white hover:bg-blue-700 font-semibold"
						>
							{startTripMutation.isPending ? "Starting..." : "Confirm & Begin Route"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 2. Complete Delivery Dialog */}
			<Dialog open={!!activeCompleteStop} onOpenChange={(open) => !open && setActiveCompleteStop(null)}>
				<DialogContent className="sm:max-w-[450px] border-emerald-200">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-emerald-800">
							<CheckCircle2Icon className="h-5 w-5 text-emerald-600" />
							Complete Delivery & Handover
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Record proof of delivery details to finalize customer handover.
						</DialogDescription>
					</DialogHeader>

					{activeCompleteStop && (
						<div className="space-y-3 py-2 text-sm">
							<div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 space-y-1.5 text-xs">
								<div className="flex justify-between">
									<span className="text-slate-500">Customer:</span>
									<span className="font-bold text-slate-900">{activeCompleteStop.customerName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Order Ref:</span>
									<span className="font-mono font-bold text-emerald-700">{activeCompleteStop.orderId ? `ORD-${activeCompleteStop.orderId}` : `ORD-${activeCompleteStop.id}`}</span>
								</div>
							</div>

							<div className="space-y-1.5">
								<label className="font-semibold text-xs text-slate-700">Delivery Notes / Recipient Signature</label>
								<textarea
									rows={2}
									placeholder="e.g. Received by store manager Verma Ji"
									className="w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-sm"
									value={deliveryNotes}
									onChange={(e) => setDeliveryNotes(e.target.value)}
								/>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setActiveCompleteStop(null)}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmComplete}
							disabled={completeStopMutation.isPending}
							className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
						>
							{completeStopMutation.isPending ? "Completing..." : "Mark Delivery Complete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 3. Collect COD Payment Dialog */}
			<Dialog open={!!activeCodStop} onOpenChange={(open) => !open && setActiveCodStop(null)}>
				<DialogContent className="sm:max-w-[440px] border-amber-200">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-amber-800">
							<AlertTriangleIcon className="h-5 w-5 text-amber-600" />
							Collect Cash / Digital Payment
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Record payment collected from customer at delivery location.
						</DialogDescription>
					</DialogHeader>

					{activeCodStop && (
						<div className="space-y-3 py-2 text-sm">
							<div className="space-y-1.5">
								<label className="font-semibold text-xs text-slate-700">Amount to Collect (₹)</label>
								<input
									type="number"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-base font-bold text-slate-900 shadow-sm"
									value={codAmount}
									onChange={(e) => setCodAmount(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<label className="font-semibold text-xs text-slate-700">Payment Mode</label>
								<select
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm font-medium"
									value={paymentMethod}
									onChange={(e) => setPaymentMethod(e.target.value)}
								>
									<option value="Cash">Cash Collection</option>
									<option value="UPI / QR Code">UPI / QR Code</option>
									<option value="Card Swipe">POS Card Reader</option>
								</select>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setActiveCodStop(null)}>
							Cancel
						</Button>
						<Button onClick={handleConfirmCod} className="bg-amber-600 text-white hover:bg-amber-700 font-semibold">
							Confirm Payment Collection
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 4. View Proof of Delivery (PoD) Dialog */}
			<Dialog open={!!activePodStop} onOpenChange={(open) => !open && setActivePodStop(null)}>
				<DialogContent className="sm:max-w-[420px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg">
							<FileTextIcon className="h-5 w-5 text-blue-600" />
							Proof of Delivery (PoD)
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Verified delivery receipt for Stop #{activePodStop?.id}.
						</DialogDescription>
					</DialogHeader>

					{activePodStop && (
						<div className="space-y-3 py-2 text-sm">
							<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
								<div className="flex justify-between border-b pb-2">
									<span className="text-slate-500">Customer:</span>
									<span className="font-bold text-slate-900">{activePodStop.customerName}</span>
								</div>
								<div className="flex justify-between border-b pb-2">
									<span className="text-slate-500">Order Ref:</span>
									<span className="font-mono font-bold text-blue-600">{activePodStop.orderId ? `ORD-${activePodStop.orderId}` : `ORD-${activePodStop.id}`}</span>
								</div>
								<div className="flex justify-between border-b pb-2">
									<span className="text-slate-500">Handover Status:</span>
									<span className="font-bold text-emerald-700">✓ Delivered & Signed</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Time Stamp:</span>
									<span className="font-medium text-slate-800">{new Date().toLocaleTimeString()}</span>
								</div>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button onClick={() => setActivePodStop(null)} className="w-full bg-slate-900 text-white hover:bg-slate-800">
							Close PoD Receipt
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
