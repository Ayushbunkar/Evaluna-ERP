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
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import {
	AlertTriangleIcon,
	ArrowLeftIcon,
	CheckCircle2Icon,
	CheckSquareIcon,
	ClockIcon,
	Loader2Icon,
	MapPinIcon,
	PackageIcon,
	PhoneIcon,
	SquareIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function TripLoadingDetailsPage({
	params,
}: {
	params: Promise<{ tripId: string }>;
}) {
	const { tripId } = use(params);
	const numericTripId = Number.parseInt(tripId, 10);
	const trpc = useTRPC();

	const {
		data: loadingData,
		isLoading,
		refetch,
	} = trpc.loader.getTripLoadingDetails.useQuery(
		{ tripId: numericTripId },
		{ refetchInterval: 5000 },
	);

	const startLoadingMutation = trpc.loader.startLoadingTrip.useMutation({
		onSuccess: () => refetch(),
	});

	const markOrderLoadedMutation = trpc.loader.markOrderLoaded.useMutation({
		onSuccess: () => refetch(),
		onError: (err) => toast.error(err.message || "Failed to update order status"),
	});

	const completeLoadingMutation = trpc.loader.completeTripLoading.useMutation({
		onSuccess: () => {
			toast.success(`Trip #${numericTripId} loading completed successfully!`);
			setIsCompleteModalOpen(false);
			refetch();
		},
		onError: (err) => toast.error(err.message || "Failed to complete trip loading"),
	});

	const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
	const [forceExceptions, setForceExceptions] = useState(false);
	const [exceptionReason, setExceptionReason] = useState("");

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
				<Loader2Icon className="h-10 w-10 animate-spin text-primary mb-3" />
				<p className="text-base font-medium">Fetching trip loading manifest...</p>
			</div>
		);
	}

	if (!loadingData) {
		return (
			<div className="space-y-4">
				<Link href="/loader/loading">
					<Button variant="outline" size="sm" className="gap-2 text-xs">
						<ArrowLeftIcon className="h-4 w-4" /> Back to Loading Queue
					</Button>
				</Link>
				<p className="text-muted-foreground">Trip details not found.</p>
			</div>
		);
	}

	const { trip, stops, summary } = loadingData;

	const handleStartLoading = async () => {
		try {
			await startLoadingMutation.mutateAsync({ tripId: numericTripId });
			toast.info(`Trip #${numericTripId} status set to Loading`);
		} catch (err: any) {
			toast.error(err.message || "Failed to start loading");
		}
	};

	const handleToggleOrderLoaded = async (orderId: number, currentlyLoaded: boolean) => {
		try {
			await markOrderLoadedMutation.mutateAsync({
				tripId: numericTripId,
				orderId,
				loaded: !currentlyLoaded,
			});
			if (!currentlyLoaded) {
				toast.success(`Order ORD-${orderId} marked as Loaded ✓`);
			} else {
				toast.info(`Order ORD-${orderId} marked as Pending`);
			}
		} catch (e) {}
	};

	const handleConfirmComplete = async () => {
		try {
			await completeLoadingMutation.mutateAsync({
				tripId: numericTripId,
				forceWithExceptions: forceExceptions,
				exceptionReason: forceExceptions ? exceptionReason : undefined,
			});
		} catch (e) {}
	};

	return (
		<PageTransition className="space-y-6">
			{/* Top Nav Header */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Link href="/loader/loading">
						<Button variant="outline" size="icon" className="h-9 w-9">
							<ArrowLeftIcon className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-bold text-2xl tracking-tight text-foreground sm:text-3xl">
								TRIP #{trip.tripId}
							</h1>
							<span
								className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
									trip.status === "loaded"
										? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
										: trip.status === "loading"
											? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
											: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
								}`}
							>
								{trip.status === "loading" && (
									<span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
								)}
								{trip.status.replace(/_/g, " ")}
							</span>
						</div>
						<p className="text-muted-foreground text-xs mt-0.5 font-medium">
							{trip.routeName}
						</p>
					</div>
				</div>

				{trip.status === "ready_for_loading" || trip.status === "pending" ? (
					<Button
						onClick={handleStartLoading}
						disabled={startLoadingMutation.isPending}
						className="bg-blue-600 font-semibold text-white hover:bg-blue-700 text-xs sm:text-sm"
					>
						<ClockIcon className="mr-2 h-4 w-4" />
						{startLoadingMutation.isPending ? "Starting..." : "Start Loading"}
					</Button>
				) : null}
			</div>

			{/* Trip Meta Information Banner */}
			<Card className="border-border/60 shadow-xs">
				<CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<UserIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
								Assigned Driver
							</p>
							<p className="font-bold text-sm text-foreground">{trip.driverName}</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<TruckIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
								Assigned Vehicle
							</p>
							<p className="font-bold text-sm text-foreground">{trip.vehicle}</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
							<PackageIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
								Loading Progress
							</p>
							<p className="font-bold text-sm text-foreground">
								{summary.loadedOrders} / {summary.totalOrders} Orders Loaded
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Orders Manifest Grouped By Route Stop / Village */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="font-bold text-lg text-foreground flex items-center gap-2">
						<MapPinIcon className="h-5 w-5 text-emerald-600" />
						Route Village Manifest ({stops.length} Stops)
					</h3>
					<span className="text-xs text-muted-foreground">
						Click on any package/order to mark physical loading into vehicle.
					</span>
				</div>

				{stops.map((stop: any, idx: number) => (
					<Card key={stop.stopId || idx} className="border-border/70 shadow-xs overflow-hidden">
						<CardHeader className="bg-muted/40 p-4 border-b">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
										{stop.sequence || idx + 1}
									</div>
									<div>
										<CardTitle className="text-base font-bold flex items-center gap-2">
											<span>{stop.villageName}</span>
											<span className="text-xs font-normal text-muted-foreground">
												({stop.customerName})
											</span>
										</CardTitle>
										{stop.customerPhone && (
											<CardDescription className="text-[11px] font-mono flex items-center gap-1 mt-0.5">
												<PhoneIcon className="h-3 w-3" /> {stop.customerPhone}
											</CardDescription>
										)}
									</div>
								</div>
								<span className="text-xs font-semibold text-muted-foreground">
									{stop.orders.filter((o: any) => o.isLoaded).length} / {stop.orders.length} Orders Loaded
								</span>
							</div>
						</CardHeader>
						<CardContent className="p-0 divide-y">
							{stop.orders.length === 0 ? (
								<div className="p-4 text-xs text-muted-foreground italic">
									No active orders for this customer stop.
								</div>
							) : (
								stop.orders.map((order: any) => (
									<div
										key={order.orderId}
										onClick={() =>
											handleToggleOrderLoaded(order.orderId, order.isLoaded)
										}
										className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
											order.isLoaded
												? "bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-950/20"
												: "hover:bg-muted/50"
										}`}
									>
										<div className="flex items-start gap-3">
											<div className="mt-0.5 shrink-0">
												{order.isLoaded ? (
													<CheckSquareIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
												) : (
													<SquareIcon className="h-5 w-5 text-muted-foreground" />
												)}
											</div>
											<div>
												<div className="flex items-center gap-2">
													<span className="font-bold text-sm text-foreground font-mono">
														{order.orderCode}
													</span>
													<span
														className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
															order.isLoaded
																? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
																: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
														}`}
													>
														{order.isLoaded ? "✓ Loaded" : "Pending Loading"}
													</span>
												</div>
												<div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
													<span>
														<strong>{order.itemsCount}</strong> Items
													</span>
													<span>•</span>
													<span>
														Package count: <strong>{order.packageCount}</strong>
													</span>
													<span>•</span>
													<span className="font-semibold text-foreground">
														₹{Number(order.totalAmount || 0).toLocaleString()}
													</span>
												</div>
												{order.items && order.items.length > 0 && (
													<div className="mt-2 flex flex-wrap gap-1">
														{order.items.map((i: any, iIdx: number) => (
															<span
																key={iIdx}
																className="inline-flex items-center rounded border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
															>
																{i.productName || "Item"} ({i.quantity})
															</span>
														))}
													</div>
												)}
											</div>
										</div>

										<Button
											type="button"
											size="sm"
											variant={order.isLoaded ? "outline" : "default"}
											className={`shrink-0 text-xs font-semibold ${
												order.isLoaded
													? "border-emerald-500/40 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300"
													: "bg-primary text-primary-foreground hover:bg-primary/90"
											}`}
											onClick={(e) => {
												e.stopPropagation();
												handleToggleOrderLoaded(order.orderId, order.isLoaded);
											}}
										>
											{order.isLoaded ? "✓ Loaded" : "Mark as Loaded"}
										</Button>
									</div>
								))
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Bottom Sticky Action Summary */}
			<Card className="border-border/80 bg-card p-4 shadow-md sticky bottom-4 z-10">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-6 text-sm">
						<div>
							<p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
								Total Orders
							</p>
							<p className="font-bold text-lg text-foreground">{summary.totalOrders}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
								Loaded
							</p>
							<p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
								{summary.loadedOrders}
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
								Remaining
							</p>
							<p className="font-bold text-lg text-amber-600 dark:text-amber-400">
								{summary.remainingOrders}
							</p>
						</div>
					</div>

					<Button
						size="lg"
						disabled={
							trip.status === "loaded" ||
							completeLoadingMutation.isPending
						}
						onClick={() => {
							if (summary.remainingOrders > 0) {
								toast.error(
									`${summary.remainingOrders} orders are still pending loading. Complete physical loading for all orders first.`,
								);
								return;
							}
							setIsCompleteModalOpen(true);
						}}
						className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-sm text-sm"
					>
						<CheckCircle2Icon className="mr-2 h-5 w-5" />
						{trip.status === "loaded" ? "Loading Completed ✓" : "Complete Loading"}
					</Button>
				</div>
			</Card>

			{/* Final Loading Confirmation Modal */}
			<Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-xl font-bold">
							<CheckCircle2Icon className="h-6 w-6 text-emerald-600" />
							Complete Loading for Trip #{trip.tripId}?
						</DialogTitle>
						<DialogDescription className="text-xs pt-1">
							Confirm that all assigned packages have been physically loaded into the vehicle.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-3 border-y text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Route:</span>
							<span className="font-bold text-foreground">{trip.routeName}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Driver:</span>
							<span className="font-bold text-foreground">{trip.driverName}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Vehicle:</span>
							<span className="font-bold text-foreground">{trip.vehicle}</span>
						</div>
						<div className="flex justify-between border-t pt-2">
							<span className="text-muted-foreground">Total Orders:</span>
							<span className="font-bold text-foreground">{summary.totalOrders}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Loaded Orders:</span>
							<span className="font-bold text-emerald-600">{summary.loadedOrders}</span>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setIsCompleteModalOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmComplete}
							disabled={completeLoadingMutation.isPending}
							className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
						>
							{completeLoadingMutation.isPending ? "Completing..." : "Complete Loading"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
