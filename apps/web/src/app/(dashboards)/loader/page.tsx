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
	ExternalLinkIcon,
	Loader2Icon,
	MapPinIcon,
	PackageCheckIcon,
	PackageIcon,
	RefreshCwIcon,
	RouteIcon,
	SearchIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { LoaderProfileModal } from "./loader-profile-modal";

export default function LoaderDashboard() {
	const trpc = useTRPC();
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"orders" | "trips">("orders");
	const [orderSearch, setOrderSearch] = useState("");
	const [orderStatusFilter, setOrderStatusFilter] = useState<
		"all" | "packed" | "ready_for_loading" | "loaded"
	>("all");

	const {
		data: stats,
		isLoading: isLoadingStats,
		refetch: refetchStats,
	} = trpc.loader.getDashboardStats.useQuery(undefined, {
		refetchInterval: 12000,
	});

	const {
		data: loadingQueue = [],
		isLoading: isLoadingQueue,
		refetch: refetchQueue,
	} = trpc.loader.getLoadingQueue.useQuery(undefined, {
		refetchInterval: 10000,
	});

	const {
		data: packedOrders = [],
		isLoading: isLoadingPackedOrders,
		refetch: refetchPackedOrders,
	} = trpc.loader.getPackedOrdersQueue.useQuery(
		{ search: orderSearch, status: orderStatusFilter },
		{ refetchInterval: 10000 },
	);

	const markLoadedMutation = trpc.loader.markDirectOrderLoaded.useMutation({
		onSuccess: (res) => {
			toast.success(
				res.status === "loaded"
					? `Order #${res.orderId} marked as Loaded!`
					: `Order #${res.orderId} status reset to Ready for Loading!`,
			);
			refetchPackedOrders();
			refetchStats();
			refetchQueue();
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
						Loader Dashboard (लोडर डैशबोर्ड)
					</h1>
					<p className="text-muted-foreground text-sm">
						पैकर द्वारा तैयार ऑर्डर्स को तुरंत लोड करें और मैनेजर द्वारा बनाई गई डिलीवरी ट्रिप्स को कन्फर्म करें।
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link href="/loader/van-loading">
						<Button
							variant="outline"
							className="font-semibold text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40 gap-2 shrink-0 shadow-xs"
						>
							<TruckIcon className="h-4 w-4" /> Van Stock Loading ({(stats as any)?.vanStockReadyCount || 0})
						</Button>
					</Link>
					<Button
						onClick={() => setIsProfileModalOpen(true)}
						className="bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 gap-2 shrink-0 self-start sm:self-auto"
					>
						<UserIcon className="h-4 w-4" /> Edit Profile
					</Button>
				</div>
			</div>

			<LoaderProfileModal
				open={isProfileModalOpen}
				onOpenChange={setIsProfileModalOpen}
			/>

			{/* KPI Metrics Cards */}
			<StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StaggerItem>
					<AnimatedCard className="border-border/60 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Direct Packed Orders
								</p>
								<h3 className="mt-1 font-bold text-2xl text-emerald-600 dark:text-emerald-400">
									{isLoadingStats ? "..." : `${(stats as any)?.directPackedOrders || 0} Orders`}
								</h3>
								<p className="text-[11px] text-muted-foreground mt-0.5">
									पैकर द्वारा तैयार (Ready for Staging)
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
								<PackageCheckIcon className="h-6 w-6" />
							</div>
						</div>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard className="border-border/60 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Trips Ready for Loading
								</p>
								<h3 className="mt-1 font-bold text-2xl text-blue-600 dark:text-blue-400">
									{isLoadingStats ? "..." : `${stats?.readyForLoadingTrips || 0} Trips`}
								</h3>
								<p className="text-[11px] text-muted-foreground mt-0.5">
									गाड़ियों में लोड होने हेतु तैयार
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
								<TruckIcon className="h-6 w-6" />
							</div>
						</div>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard className="border-border/60 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Van Stock Ready
								</p>
								<h3 className="mt-1 font-bold text-2xl text-indigo-600 dark:text-indigo-400">
									{isLoadingStats ? "..." : `${(stats as any)?.vanStockReadyCount || 0} Vans`}
								</h3>
								<p className="text-[11px] text-muted-foreground mt-0.5">
									वैन स्टॉक भौतिक लोडिंग कतार
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
								<TruckIcon className="h-6 w-6" />
							</div>
						</div>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard className="border-border/60 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Loaded Today
								</p>
								<h3 className="mt-1 font-bold text-2xl text-purple-600 dark:text-purple-400">
									{isLoadingStats ? "..." : `${stats?.loadedTodayTrips || 0} Trips`}
								</h3>
								<p className="text-[11px] text-muted-foreground mt-0.5">
									सफलतापूर्वक लोड की गईं
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
								<CheckCircle2Icon className="h-6 w-6" />
							</div>
						</div>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Section Tabs Switcher */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
				<div className="flex items-center gap-2">
					<Button
						variant={activeTab === "orders" ? "default" : "outline"}
						size="sm"
						onClick={() => setActiveTab("orders")}
						className="font-bold text-xs gap-1.5 rounded-lg"
					>
						<PackageCheckIcon className="h-4 w-4" />
						Direct Packed Orders (पैकर से प्राप्त - {packedOrders.length})
					</Button>
					<Button
						variant={activeTab === "trips" ? "default" : "outline"}
						size="sm"
						onClick={() => setActiveTab("trips")}
						className="font-bold text-xs gap-1.5 rounded-lg"
					>
						<TruckIcon className="h-4 w-4" />
						Trips Ready for Loading ({loadingQueue.length})
					</Button>
				</div>
				<div className="flex items-center gap-2">
					<Link href="/loader/van-loading">
						<Button variant="ghost" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 gap-1 font-semibold">
							Open Van Loading <ArrowRightIcon className="h-3.5 w-3.5" />
						</Button>
					</Link>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							refetchStats();
							refetchQueue();
							refetchPackedOrders();
						}}
						className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
						title="Refresh Data"
					>
						<RefreshCwIcon className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>

			{/* TAB 1: Direct Packed Orders Queue */}
			{activeTab === "orders" && (
				<Card className="border-border/60 shadow-sm">
					<CardHeader className="border-b pb-4">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div>
								<CardTitle className="flex items-center gap-2 text-xl font-bold">
									<PackageCheckIcon className="h-5 w-5 text-emerald-600" />
									Direct Packed Orders Queue (पैकर द्वारा तैयार सामान)
								</CardTitle>
								<CardDescription className="text-xs mt-1">
									पैकर द्वारा पैकिंग पूरा होते ही ऑर्डर्स तुरंत यहाँ दिखते हैं। मैनेजर के ट्रिप बनाने से पहले ही आप इन्हें लोड/स्टेज कर सकते हैं।
								</CardDescription>
							</div>

							{/* Search & Filter */}
							<div className="flex flex-wrap items-center gap-2">
								<div className="relative w-full sm:w-64">
									<SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
									<Input
										type="text"
										placeholder="Search Order, Customer, Route..."
										value={orderSearch}
										onChange={(e) => setOrderSearch(e.target.value)}
										className="h-8 pl-8 text-xs rounded-lg"
									/>
								</div>
								<div className="flex items-center gap-1">
									<Button
										size="sm"
										variant={orderStatusFilter === "all" ? "default" : "outline"}
										className="h-8 text-xs px-2.5"
										onClick={() => setOrderStatusFilter("all")}
									>
										All
									</Button>
									<Button
										size="sm"
										variant={orderStatusFilter === "packed" ? "default" : "outline"}
										className="h-8 text-xs px-2.5"
										onClick={() => setOrderStatusFilter("packed")}
									>
										Packed
									</Button>
									<Button
										size="sm"
										variant={orderStatusFilter === "loaded" ? "default" : "outline"}
										className="h-8 text-xs px-2.5"
										onClick={() => setOrderStatusFilter("loaded")}
									>
										Loaded
									</Button>
								</div>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{isLoadingPackedOrders ? (
							<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary mb-2" />
								<p className="text-sm font-medium">Fetching packed orders...</p>
							</div>
						) : packedOrders.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
								<CheckCircle2Icon className="h-12 w-12 text-emerald-500 mb-3 opacity-70" />
								<p className="font-semibold text-base">No packed orders in queue.</p>
								<p className="text-xs text-muted-foreground mt-1">
									Orders packed by packers will appear here automatically in real time.
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

			{/* TAB 2: Trips Ready for Loading */}
			{activeTab === "trips" && (
				<Card className="border-border/60 shadow-sm">
					<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
						<div>
							<CardTitle className="flex items-center gap-2 text-xl font-bold">
								<TruckIcon className="h-5 w-5 text-primary" />
								Trips Ready for Loading (डिलीवरी ट्रिप्स)
							</CardTitle>
							<CardDescription className="text-xs">
								मैनेजर द्वारा बनाई गई डिलीवरी ट्रिप्स जिनमें ड्राइवर व गाड़ी आवंटित है।
							</CardDescription>
						</div>
						<Link href="/loader/loading">
							<Button variant="outline" size="sm" className="gap-2 text-xs font-semibold">
								View All Queue <ArrowRightIcon className="h-4 w-4" />
							</Button>
						</Link>
					</CardHeader>
					<CardContent className="pt-6">
						{isLoadingQueue ? (
							<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary mb-2" />
								<p className="text-sm font-medium">Fetching loading queue...</p>
							</div>
						) : loadingQueue.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
								<TruckIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
								<p className="font-semibold text-base">No trips are currently ready for loading.</p>
								<p className="text-xs text-muted-foreground mt-1">
									Manager created trips with assigned drivers & vehicles will appear here automatically.
								</p>
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
													{trip.status === "loading" ? "Continue Loading" : "Start Loading"}
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
		</PageTransition>
	);
}
