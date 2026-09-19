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
	ArrowLeftIcon,
	ArrowRightIcon,
	CheckCircle2Icon,
	ClockIcon,
	FileTextIcon,
	HeadphonesIcon,
	InfoIcon,
	Loader2Icon,
	MapPinIcon,
	NavigationIcon,
	PackageCheckIcon,
	PackageIcon,
	RefreshCwIcon,
	RouteIcon,
	ShieldCheckIcon,
	SparklesIcon,
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
		isFetching,
		error,
		refetch,
	} = trpc.driver.getRouteStops.useQuery(undefined, {
		refetchInterval: 15000,
	});

	// Modal States
	const [activeStartStop, setActiveStartStop] = useState<any | null>(null);
	const [activeCompleteStop, setActiveCompleteStop] = useState<any | null>(
		null,
	);
	const [activeCodStop, setActiveCodStop] = useState<any | null>(null);
	const [activePodStop, setActivePodStop] = useState<any | null>(null);
	const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

	const [codAmount, setCodAmount] = useState("");
	const [paymentMethod, setPaymentMethod] = useState("UPI / QR Code");
	const [deliveryNotes, setDeliveryNotes] = useState("");

	const startTripMutation = trpc.driver.startTrip.useMutation({
		onSuccess: () => {
			toast.success(
				`Navigation started for Stop #${activeStartStop?.id} (${activeStartStop?.customerName})!`,
			);
			setActiveStartStop(null);
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to start delivery trip.");
		},
	});

	const completeStopMutation = trpc.driver.updateStopStatus.useMutation({
		onSuccess: () => {
			toast.success(
				`Delivery completed & verified for ${activeCompleteStop?.customerName || "Customer"}!`,
			);
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
			toast.success(
				`Navigation started for Stop #${activeStartStop.id} (${activeStartStop.customerName})!`,
			);
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
		toast.success(
			`₹${codAmount || "0"} collected via ${paymentMethod} for Order ORD-${activeCodStop.orderId || activeCodStop.id}!`,
		);
		setActiveCodStop(null);
		setCodAmount("");
	};

	const handleManualRefresh = async () => {
		await refetch();
		toast.success("Route status checked with dispatcher.");
	};

	// Loading State
	if (isLoading) {
		return (
			<PageTransition className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center space-y-4 py-12 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-950/50 dark:text-blue-400">
					<Loader2Icon className="h-8 w-8 animate-spin" />
				</div>
				<div className="space-y-1">
					<h3 className="font-semibold text-foreground text-lg">
						Loading Driver Route...
					</h3>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Fetching assigned delivery stops, customer orders, and live
						navigation data.
					</p>
				</div>
			</PageTransition>
		);
	}

	const hasStops = Array.isArray(routeStops) && routeStops.length > 0;
	const completedStopsCount = hasStops
		? routeStops.filter((s: any) => s.status === "completed" || s.status === "delivered").length
		: 0;
	const pendingStopsCount = hasStops ? routeStops.length - completedStopsCount : 0;

	return (
		<PageTransition className="container mx-auto space-y-6 py-6 sm:py-8">
			{/* Top Header & Quick Actions */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Link
							href="/driver"
							className="inline-flex items-center text-muted-foreground text-xs transition-colors hover:text-foreground sm:text-sm"
						>
							<ArrowLeftIcon className="mr-1 h-3.5 w-3.5" /> Driver Dashboard
						</Link>
						<span className="text-muted-foreground/50">/</span>
						<span className="font-medium text-foreground text-xs sm:text-sm">
							Route Navigation
						</span>
					</div>
					<h1 className="flex items-center gap-2.5 font-bold text-foreground text-2xl tracking-tight sm:text-3xl">
						<RouteIcon className="h-7 w-7 text-blue-600" />
						Delivery Route &amp; Stops
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Turn-by-turn customer stops, live delivery status, and package handover.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleManualRefresh}
						disabled={isFetching}
						className="h-9 gap-1.5 text-xs shadow-sm"
					>
						<RefreshCwIcon
							className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`}
						/>
						{isFetching ? "Syncing..." : "Refresh Route"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsDispatchModalOpen(true)}
						className="h-9 gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
					>
						<HeadphonesIcon className="h-3.5 w-3.5" /> Dispatch Desk
					</Button>
					{hasStops && (
						<Button
							size="sm"
							asChild
							className="h-9 gap-1.5 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
						>
							<Link href="/driver/delivery">
								<PackageCheckIcon className="h-3.5 w-3.5" /> Start Handover
							</Link>
						</Button>
					)}
				</div>
			</div>

			{/* Empty State / No Route Assigned Beautiful State */}
			{!hasStops ? (
				<div className="space-y-6">
					{/* Main Hero Card */}
					<Card className="overflow-hidden border-border/80 bg-gradient-to-b from-card via-card to-muted/20 shadow-md">
						<div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
						<CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center sm:py-16">
							{/* Status Badge */}
							<div className="mb-6 flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-emerald-700 text-xs font-semibold shadow-xs dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
								<span className="relative flex h-2 w-2">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
								</span>
								Driver Online &bull; Ready for Route Assignment
							</div>

							{/* Icon Hero Badge */}
							<div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 ring-8 ring-blue-50/50 dark:bg-blue-950/60 dark:ring-blue-900/20">
								<TruckIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
								<div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
									<SparklesIcon className="h-4 w-4" />
								</div>
							</div>

							{/* Main Heading & Clarification */}
							<h2 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
								No Active Route Assigned Yet
							</h2>
							<p className="mt-2 max-w-lg text-muted-foreground text-xs leading-relaxed sm:text-sm">
								Your delivery manager or dispatch team has not assigned a route to
								your account for this shift yet. As soon as your route is planned and
								dispatched, your optimized stops, addresses, and customer order lists
								will appear here automatically.
							</p>

							{/* Status Indicators Grid */}
							<div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
								<div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5 text-left">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
										<ClockIcon className="h-5 w-5" />
									</div>
									<div className="space-y-0.5">
										<p className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
											Shift Status
										</p>
										<p className="font-bold text-foreground text-xs">
											On Standby
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5 text-left">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
										<TruckIcon className="h-5 w-5" />
									</div>
									<div className="space-y-0.5">
										<p className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
											Vehicle Fleet
										</p>
										<p className="font-bold text-foreground text-xs">
											Depot Bay Ready
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5 text-left">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
										<RefreshCwIcon className="h-5 w-5" />
									</div>
									<div className="space-y-0.5">
										<p className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
											Live Auto-Sync
										</p>
										<p className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
											Active (15s polling)
										</p>
									</div>
								</div>
							</div>

							{/* Call to Actions */}
							<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
								<Button
									onClick={handleManualRefresh}
									disabled={isFetching}
									className="gap-2 bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700"
								>
									<RefreshCwIcon
										className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
									/>
									{isFetching ? "Checking Dispatch..." : "Check Route Status"}
								</Button>

								<Button
									variant="outline"
									onClick={() => setIsDispatchModalOpen(true)}
									className="gap-2 border-slate-300 shadow-sm dark:border-slate-700"
								>
									<HeadphonesIcon className="h-4 w-4 text-emerald-600" />
									Contact Manager / Dispatch
								</Button>

								<Button variant="ghost" asChild className="gap-1.5 text-muted-foreground">
									<Link href="/driver">
										Dashboard <ArrowRightIcon className="h-4 w-4" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Helpful Driver Dispatch Workflow Card */}
					<Card className="border-border/60 shadow-xs">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 font-bold text-base text-foreground">
								<InfoIcon className="h-4 w-4 text-blue-600" />
								How Driver Routes &amp; Trips Work
							</CardTitle>
							<CardDescription className="text-xs">
								Step-by-step lifecycle from manager route planning to customer delivery.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-3">
								<div className="space-y-1.5 rounded-xl border border-border/40 bg-muted/20 p-3.5">
									<div className="flex items-center gap-2 font-bold text-blue-700 text-xs dark:text-blue-400">
										<span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 font-mono text-[10px] dark:bg-blue-900/60">
											1
										</span>
										Manager Assignment
									</div>
									<p className="text-muted-foreground text-xs leading-relaxed">
										The delivery manager groups pending sales orders into an optimized route and assigns your vehicle &amp; driver ID.
									</p>
								</div>

								<div className="space-y-1.5 rounded-xl border border-border/40 bg-muted/20 p-3.5">
									<div className="flex items-center gap-2 font-bold text-indigo-700 text-xs dark:text-indigo-400">
										<span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 font-mono text-[10px] dark:bg-indigo-900/60">
											2
										</span>
										Live Navigation &amp; Stops
									</div>
									<p className="text-muted-foreground text-xs leading-relaxed">
										Your assigned stops, customer addresses, phone numbers, and package contents instantly appear right on this page.
									</p>
								</div>

								<div className="space-y-1.5 rounded-xl border border-border/40 bg-muted/20 p-3.5">
									<div className="flex items-center gap-2 font-bold text-emerald-700 text-xs dark:text-emerald-400">
										<span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 font-mono text-[10px] dark:bg-emerald-900/60">
											3
										</span>
										Handover &amp; Settlement
									</div>
									<p className="text-muted-foreground text-xs leading-relaxed">
										Perform item verification, collect Cash / UPI payments, record returns, and close delivery handovers in real time.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			) : (
				/* Active Route Table View */
				<div className="space-y-6">
					{/* Route Summary Badges */}
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<Card className="border-border/60 bg-card/60 p-4 shadow-xs">
							<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								Total Stops
							</p>
							<p className="mt-1 font-bold text-2xl text-foreground">
								{routeStops.length}
							</p>
						</Card>
						<Card className="border-border/60 bg-card/60 p-4 shadow-xs">
							<p className="font-semibold text-amber-600 text-xs uppercase tracking-wider">
								Pending Stops
							</p>
							<p className="mt-1 font-bold text-2xl text-amber-700 dark:text-amber-400">
								{pendingStopsCount}
							</p>
						</Card>
						<Card className="border-border/60 bg-card/60 p-4 shadow-xs">
							<p className="font-semibold text-emerald-600 text-xs uppercase tracking-wider">
								Delivered Stops
							</p>
							<p className="mt-1 font-bold text-2xl text-emerald-700 dark:text-emerald-400">
								{completedStopsCount}
							</p>
						</Card>
						<Card className="border-border/60 bg-card/60 p-4 shadow-xs">
							<p className="font-semibold text-blue-600 text-xs uppercase tracking-wider">
								Trip Status
							</p>
							<p className="mt-1 font-bold text-blue-700 text-lg dark:text-blue-400">
								{completedStopsCount === routeStops.length ? "Trip Completed" : "In Progress"}
							</p>
						</Card>
					</div>

					{/* Route Stops Table */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-base font-bold">
								Assigned Delivery Stops
							</CardTitle>
							<CardDescription className="text-xs">
								Follow the sequence below for optimized transit and handover.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table className="w-full">
									<TableHeader className="bg-muted/40">
										<TableRow>
											<TableHead className="w-16 text-center font-bold text-xs">#</TableHead>
											<TableHead className="font-bold text-xs">Customer</TableHead>
											<TableHead className="font-bold text-xs">Address</TableHead>
											<TableHead className="font-bold text-xs">Order Ref</TableHead>
											<TableHead className="font-bold text-xs">Status</TableHead>
											<TableHead className="text-right font-bold text-xs">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{routeStops.map((stop: any, index: number) => {
											const isCompleted =
												stop.status === "completed" || stop.status === "delivered";
											const isNext = stop.status === "next";
											return (
												<TableRow
													key={`${stop.id}-${index}`}
													className={`transition-colors ${
														isCompleted
															? "bg-emerald-50/20 dark:bg-emerald-950/10"
															: isNext
																? "bg-blue-50/30 dark:bg-blue-950/20"
																: ""
													}`}
												>
													<TableCell className="text-center font-bold font-mono text-xs">
														<span
															className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
																isCompleted
																	? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
																	: isNext
																		? "bg-blue-600 text-white"
																		: "bg-muted text-muted-foreground"
															}`}
														>
															{index + 1}
														</span>
													</TableCell>
													<TableCell className="font-medium text-foreground text-sm">
														{stop.customerName}
														{stop.phone && (
															<div className="text-[11px] text-muted-foreground">
																📞 {stop.phone}
															</div>
														)}
													</TableCell>
													<TableCell className="max-w-[220px] text-xs text-muted-foreground">
														<div className="line-clamp-2">📍 {stop.address}</div>
													</TableCell>
													<TableCell>
														<div className="flex flex-wrap items-center gap-1.5">
															{stop.orders && stop.orders.length > 0 ? (
																stop.orders.map((ord: any) => (
																	<span
																		key={ord.id}
																		className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
																	>
																		ORD-{ord.id}
																	</span>
																))
															) : (
																<span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-300">
																	{typeof stop.orderId === "string" &&
																	stop.orderId.startsWith("ORD-")
																		? stop.orderId
																		: `ORD-${stop.orderId || stop.id}`}
																</span>
															)}
															{stop.ordersCount && stop.ordersCount > 1 ? (
																<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
																	{stop.ordersCount} Orders
																</span>
															) : null}
														</div>
													</TableCell>
													<TableCell>
														<span
															className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
																isCompleted
																	? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
																	: isNext
																		? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
																		: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
															}`}
														>
															{isCompleted
																? "Delivered"
																: isNext
																	? "Next Stop"
																	: "Pending"}
														</span>
													</TableCell>
													<TableCell className="text-right">
														<div className="flex items-center justify-end gap-1.5">
															{(stop.status === "pending" || stop.status === "next") && (
																<Button
																	variant="outline"
																	size="sm"
																	className="h-8 border-blue-200 font-medium text-blue-600 text-xs hover:bg-blue-50"
																	onClick={() => setActiveStartStop(stop)}
																>
																	<MapPinIcon className="mr-1 h-3.5 w-3.5" /> Start
																</Button>
															)}
															{!isCompleted && (
																<Link href="/driver/delivery">
																	<Button
																		size="sm"
																		className="h-8 bg-emerald-600 font-semibold text-white text-xs shadow-xs hover:bg-emerald-700"
																	>
																		<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />
																		Handover
																	</Button>
																</Link>
															)}
															{stop.status === "started" && (
																<Button
																	variant="outline"
																	size="sm"
																	className="h-8 border-amber-200 font-medium text-amber-700 text-xs hover:bg-amber-50"
																	onClick={() => {
																		setActiveCodStop(stop);
																		setCodAmount(
																			stop.amountToCollect
																				? String(stop.amountToCollect)
																				: "500",
																		);
																	}}
																>
																	<AlertTriangleIcon className="mr-1 h-3.5 w-3.5 text-amber-600" />
																	COD
																</Button>
															)}
															{isCompleted && (
																<Button
																	variant="outline"
																	size="sm"
																	className="h-8 border-slate-200 font-medium text-xs"
																	onClick={() => setActivePodStop(stop)}
																>
																	<FileTextIcon className="mr-1 h-3.5 w-3.5 text-slate-600" />
																	PoD
																</Button>
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* 1. Start Delivery Dialog */}
			<Dialog
				open={!!activeStartStop}
				onOpenChange={(open) => !open && setActiveStartStop(null)}
			>
				<DialogContent className="border-blue-200 sm:max-w-[440px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-blue-900 text-lg">
							<NavigationIcon className="h-5 w-5 text-blue-600" />
							Start Navigation to Stop #{activeStartStop?.id}?
						</DialogTitle>
						<DialogDescription className="text-slate-500 text-xs">
							Begin GPS guidance and notify recipient of estimated arrival.
						</DialogDescription>
					</DialogHeader>

					{activeStartStop && (
						<div className="space-y-3 py-2 text-sm">
							<div className="space-y-1.5 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs">
								<div className="flex justify-between">
									<span className="text-slate-500">Recipient:</span>
									<span className="font-bold text-slate-900">
										{activeStartStop.customerName}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Destination Address:</span>
									<span className="max-w-[200px] text-right font-medium text-slate-800">
										📍 {activeStartStop.address}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-slate-500">Order Reference:</span>
									<div className="flex flex-wrap justify-end gap-1">
										{activeStartStop.orders && activeStartStop.orders.length > 0 ? (
											activeStartStop.orders.map((ord: any) => (
												<span
													key={ord.id}
													className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 font-bold font-mono text-[11px] text-blue-800"
												>
													ORD-{ord.id}
												</span>
											))
										) : (
											<span className="font-bold font-mono text-blue-700">
												{typeof activeStartStop.orderId === "string" &&
												activeStartStop.orderId.startsWith("ORD-")
													? activeStartStop.orderId
													: `ORD-${activeStartStop.orderId || activeStartStop.id}`}
											</span>
										)}
									</div>
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
							className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
						>
							{startTripMutation.isPending
								? "Starting..."
								: "Confirm & Begin Route"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 2. Complete Delivery Dialog */}
			<Dialog
				open={!!activeCompleteStop}
				onOpenChange={(open) => !open && setActiveCompleteStop(null)}
			>
				<DialogContent className="border-emerald-200 sm:max-w-[450px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-emerald-800 text-lg">
							<CheckCircle2Icon className="h-5 w-5 text-emerald-600" />
							Complete Delivery & Handover
						</DialogTitle>
						<DialogDescription className="text-slate-500 text-xs">
							Record proof of delivery details to finalize customer handover.
						</DialogDescription>
					</DialogHeader>

					{activeCompleteStop && (
						<div className="space-y-3 py-2 text-sm">
							<div className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs">
								<div className="flex justify-between">
									<span className="text-slate-500">Customer:</span>
									<span className="font-bold text-slate-900">
										{activeCompleteStop.customerName}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-slate-500">Order Ref:</span>
									<div className="flex flex-wrap justify-end gap-1">
										{activeCompleteStop.orders &&
										activeCompleteStop.orders.length > 0 ? (
											activeCompleteStop.orders.map((ord: any) => (
												<span
													key={ord.id}
													className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 font-bold font-mono text-[11px] text-emerald-800"
												>
													ORD-{ord.id}
												</span>
											))
										) : (
											<span className="font-bold font-mono text-emerald-700">
												{typeof activeCompleteStop.orderId === "string" &&
												activeCompleteStop.orderId.startsWith("ORD-")
													? activeCompleteStop.orderId
													: `ORD-${activeCompleteStop.orderId || activeCompleteStop.id}`}
											</span>
										)}
									</div>
								</div>
							</div>

							<div className="space-y-1.5">
								<label className="font-semibold text-slate-700 text-xs">
									Delivery Notes / Recipient Signature
								</label>
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
						<Button
							variant="outline"
							onClick={() => setActiveCompleteStop(null)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmComplete}
							disabled={completeStopMutation.isPending}
							className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
						>
							{completeStopMutation.isPending
								? "Completing..."
								: "Mark Delivery Complete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 3. Collect COD Payment Dialog */}
			<Dialog
				open={!!activeCodStop}
				onOpenChange={(open) => !open && setActiveCodStop(null)}
			>
				<DialogContent className="border-amber-200 sm:max-w-[440px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-amber-800 text-lg">
							<AlertTriangleIcon className="h-5 w-5 text-amber-600" />
							Collect Cash / Digital Payment
						</DialogTitle>
						<DialogDescription className="text-slate-500 text-xs">
							Record payment collected from customer at delivery location.
						</DialogDescription>
					</DialogHeader>

					{activeCodStop && (
						<div className="space-y-3 py-2 text-sm">
							<div className="space-y-1.5">
								<label className="font-semibold text-slate-700 text-xs">
									Amount to Collect (₹)
								</label>
								<input
									type="number"
									className="w-full rounded-md border border-input bg-background px-3 py-2 font-bold text-base text-slate-900 shadow-sm"
									value={codAmount}
									onChange={(e) => setCodAmount(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<label className="font-semibold text-slate-700 text-xs">
									Payment Mode
								</label>
								<select
									className="w-full rounded-md border border-input bg-background px-3 py-2 font-medium text-sm shadow-sm"
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
						<Button
							onClick={handleConfirmCod}
							className="bg-amber-600 font-semibold text-white hover:bg-amber-700"
						>
							Confirm Payment Collection
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 4. View Proof of Delivery (PoD) Dialog */}
			<Dialog
				open={!!activePodStop}
				onOpenChange={(open) => !open && setActivePodStop(null)}
			>
				<DialogContent className="sm:max-w-[420px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg">
							<FileTextIcon className="h-5 w-5 text-blue-600" />
							Proof of Delivery (PoD)
						</DialogTitle>
						<DialogDescription className="text-slate-500 text-xs">
							Verified delivery receipt for Stop #{activePodStop?.id}.
						</DialogDescription>
					</DialogHeader>

					{activePodStop && (
						<div className="space-y-3 py-2 text-sm">
							<div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
								<div className="flex justify-between border-b pb-2">
									<span className="text-slate-500">Customer:</span>
									<span className="font-bold text-slate-900">
										{activePodStop.customerName}
									</span>
								</div>
								<div className="flex justify-between items-center border-b pb-2">
									<span className="text-slate-500">Order Ref:</span>
									<div className="flex flex-wrap justify-end gap-1">
										{activePodStop.orders && activePodStop.orders.length > 0 ? (
											activePodStop.orders.map((ord: any) => (
												<span
													key={ord.id}
													className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 font-bold font-mono text-[11px] text-blue-800"
												>
													ORD-{ord.id}
												</span>
											))
										) : (
											<span className="font-bold font-mono text-blue-600">
												{typeof activePodStop.orderId === "string" &&
												activePodStop.orderId.startsWith("ORD-")
													? activePodStop.orderId
													: `ORD-${activePodStop.orderId || activePodStop.id}`}
											</span>
										)}
									</div>
								</div>
								<div className="flex justify-between border-b pb-2">
									<span className="text-slate-500">Handover Status:</span>
									<span className="font-bold text-emerald-700">
										✓ Delivered &amp; Signed
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Time Stamp:</span>
									<span className="font-medium text-slate-800">
										{new Date().toLocaleTimeString()}
									</span>
								</div>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							onClick={() => setActivePodStop(null)}
							className="w-full bg-slate-900 text-white hover:bg-slate-800"
						>
							Close PoD Receipt
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 5. Dispatch Hotline Dialog */}
			<Dialog open={isDispatchModalOpen} onOpenChange={setIsDispatchModalOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<HeadphonesIcon className="h-5 w-5 text-emerald-600" />
							Central Logistics Dispatch Desk
						</DialogTitle>
						<DialogDescription className="text-xs">
							Direct support for route assignments, urgent order changes, and roadside assistance.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/40">
							<p className="font-medium text-emerald-800 text-xs dark:text-emerald-300">
								Dispatch Desk Hotline:
							</p>
							<p className="mt-1 font-bold font-mono text-emerald-900 text-lg dark:text-emerald-100">
								+1 (800) 555-0199
							</p>
							<p className="mt-1 text-[11px] text-muted-foreground">
								Available during all active dispatch &amp; delivery shifts.
							</p>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsDispatchModalOpen(false)}
							>
								Close
							</Button>
							<Button
								size="sm"
								className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
								onClick={() => {
									window.location.href = "tel:+18005550199";
								}}
							>
								<HeadphonesIcon className="h-3.5 w-3.5" /> Call Dispatch Desk
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
