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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	ArrowRightIcon,
	CheckCircle2Icon,
	CheckIcon,
	ClockIcon,
	FilterIcon,
	Loader2Icon,
	MapPinIcon,
	PackageCheckIcon,
	PackageIcon,
	RefreshCwIcon,
	SearchIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function LoadingQueuePage() {
	const trpc = useTRPC();
	const [viewMode, setViewMode] = useState<"trips" | "direct_orders">("trips");
	const [statusFilter, setStatusFilter] = useState<"all" | "ready_for_loading" | "loading" | "loaded">("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Trips Queue Query
	const {
		data: loadingQueue = [],
		isLoading: isLoadingTrips,
		refetch: refetchTrips,
	} = trpc.loader.getLoadingQueue.useQuery(
		{ status: statusFilter, search: searchQuery },
		{
			refetchInterval: 120000,
			refetchIntervalInBackground: false,
			refetchOnWindowFocus: false,
		},
	);

	// Direct Packed Orders Queue Query
	const {
		data: packedOrders = [],
		isLoading: isLoadingOrders,
		refetch: refetchOrders,
	} = trpc.loader.getPackedOrdersQueue.useQuery(
		{
			search: searchQuery,
			status:
				statusFilter === "loaded"
					? "loaded"
					: statusFilter === "ready_for_loading"
						? "ready_for_loading"
						: "all",
		},
		{ refetchInterval: 60000 },
	);

	const markLoadedMutation = trpc.loader.markDirectOrderLoaded.useMutation({
		onSuccess: (res) => {
			toast.success(
				res.status === "loaded"
					? `Order #${res.orderId} marked as Loaded!`
					: `Order #${res.orderId} status reset to Ready for Loading!`,
			);
			refetchOrders();
			refetchTrips();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update order loading status");
		},
	});

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-2xl tracking-tight text-foreground sm:text-3xl">
						Loading Queue (लोडिंग कतार)
					</h1>
					<p className="text-muted-foreground text-sm">
						पैकर द्वारा तैयार ऑर्डर्स व मैनेजर द्वारा प्लान की गई डिलीवरी ट्रिप्स की लोडिंग व सत्यापन।
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link href="/loader/van-loading">
						<Button
							variant="outline"
							className="font-semibold text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 gap-2 shrink-0 shadow-xs"
						>
							<TruckIcon className="h-4 w-4" /> Van Stock Loading
						</Button>
					</Link>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							refetchTrips();
							refetchOrders();
						}}
						className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
						title="Refresh"
					>
						<RefreshCwIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Main View Mode Switcher */}
			<div className="flex flex-wrap items-center gap-2 border-b pb-3">
				<Button
					size="sm"
					variant={viewMode === "direct_orders" ? "default" : "outline"}
					onClick={() => setViewMode("direct_orders")}
					className="font-bold text-xs gap-1.5 rounded-lg"
				>
					<PackageCheckIcon className="h-4 w-4" />
					Direct Packed Orders Queue ({packedOrders.length})
				</Button>
				<Button
					size="sm"
					variant={viewMode === "trips" ? "default" : "outline"}
					onClick={() => setViewMode("trips")}
					className="font-bold text-xs gap-1.5 rounded-lg"
				>
					<TruckIcon className="h-4 w-4" />
					Delivery Trips ({loadingQueue.length})
				</Button>
			</div>

			{/* Filter Controls & Search */}
			<Card className="border-border/60 shadow-xs">
				<CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					{/* Status Pills */}
					<div className="flex flex-wrap items-center gap-1.5">
						<Button
							size="sm"
							variant={statusFilter === "all" ? "default" : "outline"}
							className="h-8 text-xs font-semibold rounded-lg"
							onClick={() => setStatusFilter("all")}
						>
							All
						</Button>
						<Button
							size="sm"
							variant={statusFilter === "ready_for_loading" ? "default" : "outline"}
							className={`h-8 text-xs font-semibold rounded-lg ${
								statusFilter !== "ready_for_loading"
									? "border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300"
									: ""
							}`}
							onClick={() => setStatusFilter("ready_for_loading")}
						>
							Ready for Loading
						</Button>
						{viewMode === "trips" && (
							<Button
								size="sm"
								variant={statusFilter === "loading" ? "default" : "outline"}
								className={`h-8 text-xs font-semibold rounded-lg ${
									statusFilter !== "loading"
										? "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300"
										: ""
								}`}
								onClick={() => setStatusFilter("loading")}
							>
								Currently Loading
							</Button>
						)}
						<Button
							size="sm"
							variant={statusFilter === "loaded" ? "default" : "outline"}
							className={`h-8 text-xs font-semibold rounded-lg ${
								statusFilter !== "loaded"
									? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300"
									: ""
							}`}
							onClick={() => setStatusFilter("loaded")}
						>
							Loaded
						</Button>
					</div>

					{/* Search Bar */}
					<div className="relative w-full sm:w-72">
						<SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
						<Input
							type="text"
							placeholder={
								viewMode === "trips"
									? "Search Trip ID, Route, Driver..."
									: "Search Order #, Customer, Village..."
							}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-8 pl-8 text-xs rounded-lg"
						/>
					</div>
				</CardContent>
			</Card>

			{/* VIEW 1: Dispatched Delivery Trips */}
			{viewMode === "trips" && (
				<Card className="border-border/60 shadow-sm">
					<CardHeader className="border-b pb-4">
						<CardTitle className="text-xl font-bold flex items-center justify-between">
							<span className="flex items-center gap-2">
								<TruckIcon className="h-5 w-5 text-primary" />
								Dispatched Delivery Trips ({loadingQueue.length})
							</span>
						</CardTitle>
						<CardDescription className="text-xs">
							मैनेजर द्वारा बनाई गई ट्रिप्स - ड्राइवर व गाड़ी के साथ लोडिंग हेतु तैयार।
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-6">
						{isLoadingTrips ? (
							<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary mb-2" />
								<p className="text-sm font-medium">Loading dispatch queue...</p>
							</div>
						) : loadingQueue.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
								<TruckIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
								<p className="font-semibold text-base">No trips found matching criteria.</p>
								<p className="text-xs text-muted-foreground mt-1">
									Try resetting your search query or status filter.
								</p>
								{packedOrders.length > 0 && (
									<div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl max-w-md mx-auto text-emerald-800 dark:text-emerald-300 shadow-xs">
										<p className="font-bold text-sm">
											📦 {packedOrders.length} Direct Packed Order{packedOrders.length > 1 ? "s" : ""} Ready for Loading!
										</p>
										<p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
											पैकर द्वारा तैयार सामान सीधे कतार में मौजूद है। बिना ट्रिप बने भी लोड/सत्यापित कर सकते हैं।
										</p>
										<Button
											size="sm"
											className="mt-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-lg"
											onClick={() => setViewMode("direct_orders")}
										>
											<PackageCheckIcon className="h-4 w-4" />
											View Direct Packed Orders ({packedOrders.length})
										</Button>
									</div>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{loadingQueue.map((trip: any) => (
									<div
										key={trip.tripId}
										className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
									>
										<div
											className={`absolute top-0 left-0 h-full w-1.5 ${
												trip.status === "loaded"
													? "bg-emerald-500"
													: trip.status === "loading"
														? "bg-amber-500 animate-pulse"
														: "bg-blue-500"
											}`}
										/>
										<div className="flex items-start justify-between pl-2">
											<div>
												<span className="font-mono text-xs font-bold text-muted-foreground">
													Trip #{trip.tripId}
												</span>
												<h4 className="font-bold text-base text-foreground mt-0.5">
													{trip.routeName}
												</h4>
											</div>
											<span
												className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
													trip.status === "loaded"
														? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
														: trip.status === "loading"
															? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
															: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
												}`}
											>
												{trip.status === "loading" ? "Loading" : trip.status.replace(/_/g, " ")}
											</span>
										</div>

										<div className="mt-4 space-y-2 text-xs text-muted-foreground pl-2">
											<div className="flex items-center gap-2">
												<UserIcon className="h-3.5 w-3.5 text-primary" />
												Driver:{" "}
												<span className="font-semibold text-foreground">
													{trip.driverName}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<TruckIcon className="h-3.5 w-3.5 text-primary" />
												Vehicle:{" "}
												<span className="font-semibold text-foreground">
													{trip.vehicle}
												</span>
											</div>
											<div className="flex items-center justify-between border-t border-border/50 pt-2 mt-2">
												<span className="flex items-center gap-1.5">
													<PackageIcon className="h-3.5 w-3.5 text-amber-500" />
													<strong>{trip.ordersCount}</strong> Orders ({trip.villagesCount} Villages)
												</span>
												<span className="font-mono text-[11px] text-muted-foreground">
													{trip.loadedOrdersCount}/{trip.ordersCount} Loaded
												</span>
											</div>
										</div>

										<div className="mt-4 pt-2 pl-2">
											<Link href={`/loader/loading/${trip.tripId}`}>
												<Button
													className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90 text-xs"
													size="sm"
												>
													{trip.status === "loaded"
														? "View Loaded Trip"
														: trip.status === "loading"
															? "Continue Loading"
															: "Start Loading"}
													<ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
												</Button>
											</Link>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* VIEW 2: Direct Packed Orders Queue */}
			{viewMode === "direct_orders" && (
				<Card className="border-border/60 shadow-sm">
					<CardHeader className="border-b pb-4">
						<CardTitle className="text-xl font-bold flex items-center justify-between">
							<span className="flex items-center gap-2">
								<PackageCheckIcon className="h-5 w-5 text-emerald-600" />
								Direct Packed Orders Queue ({packedOrders.length})
							</span>
						</CardTitle>
						<CardDescription className="text-xs">
							पैकर द्वारा पैक किए गए ऑर्डर्स सीधे यहाँ मौजूद हैं। बिना ट्रिप बने भी सामान लोड और स्टेज किया जा सकता है।
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{isLoadingOrders ? (
							<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary mb-2" />
								<p className="text-sm font-medium">Loading packed orders queue...</p>
							</div>
						) : packedOrders.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
								<CheckCircle2Icon className="h-12 w-12 text-emerald-500 mb-3 opacity-70" />
								<p className="font-semibold text-base">No packed orders in queue.</p>
								<p className="text-xs text-muted-foreground mt-1">
									Orders packed by packers will appear here immediately.
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/40 text-xs">
											<TableHead className="w-[120px]">Order Code</TableHead>
											<TableHead>Customer / Phone</TableHead>
											<TableHead>Route / Area</TableHead>
											<TableHead>Packages / Items</TableHead>
											<TableHead>Trip Plan Status</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{packedOrders.map((ord: any) => (
											<TableRow key={ord.orderId} className="hover:bg-muted/20 text-xs">
												<TableCell className="font-mono font-bold text-foreground">
													{ord.orderCode}
													<div className="text-[10px] font-normal text-muted-foreground">
														₹{Number(ord.totalAmount || 0).toFixed(2)}
													</div>
												</TableCell>
												<TableCell>
													<div className="font-semibold text-foreground">{ord.customerName}</div>
													<div className="text-[11px] text-muted-foreground">{ord.customerPhone}</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1 font-medium text-foreground">
														<MapPinIcon className="h-3.5 w-3.5 text-primary shrink-0" />
														<span>{ord.village}</span>
													</div>
													{ord.routeName && ord.routeName !== ord.village && (
														<div className="text-[10px] text-muted-foreground pl-4.5">
															{ord.routeName}
														</div>
													)}
												</TableCell>
												<TableCell>
													<div className="font-semibold text-foreground">
														{ord.packageCount} {ord.packageCount > 1 ? "Pkgs" : "Pkg"}
													</div>
													<div className="text-[11px] text-muted-foreground">
														{ord.itemsCount} Items
													</div>
												</TableCell>
												<TableCell>
													{ord.tripId ? (
														<div className="flex flex-col gap-0.5">
															<span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 w-fit">
																<TruckIcon className="h-3 w-3" /> Trip #{ord.tripId}
															</span>
															{ord.driverName && (
																<span className="text-[10px] text-muted-foreground">
																	{ord.driverName} {ord.vehicle ? `(${ord.vehicle})` : ""}
																</span>
															)}
														</div>
													) : (
														<span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 w-fit">
															<ClockIcon className="h-3 w-3" /> Awaiting Trip Creation
														</span>
													)}
												</TableCell>
												<TableCell>
													{ord.isLoaded ? (
														<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
															<CheckCircle2Icon className="h-3 w-3" /> Loaded
														</span>
													) : (
														<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
															Ready to Load
														</span>
													)}
												</TableCell>
												<TableCell className="text-right">
													{ord.isLoaded ? (
														<Button
															variant="outline"
															size="sm"
															className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
															disabled={markLoadedMutation.isPending}
															onClick={() =>
																markLoadedMutation.mutate({
																	orderId: ord.orderId,
																	loaded: false,
																})
															}
														>
															Unmark
														</Button>
													) : (
														<Button
															size="sm"
															className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
															disabled={markLoadedMutation.isPending}
															onClick={() =>
																markLoadedMutation.mutate({
																	orderId: ord.orderId,
																	loaded: true,
																})
															}
														>
															<CheckIcon className="h-3 w-3" /> Mark Loaded
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</PageTransition>
	);
}
