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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ActivityIcon,
	AlertTriangle,
	Banknote,
	BanknoteIcon,
	CheckCircle2,
	CheckCircle2Icon,
	CreditCardIcon,
	EyeIcon,
	FileTextIcon,
	HistoryIcon,
	Layers,
	Loader2Icon,
	MapPinIcon,
	PackageCheck,
	QrCode,
	SearchIcon,
	ShoppingCart,
	TruckIcon,
	UserIcon,
	WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function DriverHistoryPage() {
	const trpc = useTRPC();
	const {
		data: deliveryHistory,
		isLoading,
		error,
	} = trpc.driver.getDeliveryHistory.useQuery();

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

	const filteredList = deliveryHistory?.filter(
		(t: any) =>
			t.tripNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.routeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.vehiclePlate?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Cumulative financial aggregates across all trips
	const completedTripsCount =
		deliveryHistory?.filter((t: any) => t.status === "Completed").length ?? 0;
	const inProgressTripsCount =
		deliveryHistory?.filter(
			(t: any) => t.status === "In Progress" || t.status === "Active",
		).length ?? 0;

	const aggregateCash =
		deliveryHistory?.reduce(
			(acc: number, t: any) => acc + (t.totalCashCollected || 0),
			0,
		) || 0;
	const aggregateOnline =
		deliveryHistory?.reduce(
			(acc: number, t: any) => acc + (t.totalOnlineCollected || 0),
			0,
		) || 0;
	const aggregateTotal = aggregateCash + aggregateOnline;

	if (isLoading)
		return (
			<div className="flex h-[220px] items-center justify-center gap-2 text-muted-foreground text-sm">
				<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" />
				Loading trip delivery history & financial ledgers...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[220px] flex-col items-center justify-center gap-2 p-4 text-center text-destructive text-sm">
				<p className="font-semibold">Error loading delivery history</p>
				<p className="text-muted-foreground text-xs">
					{error.message || "Failed to query trip history from server."}
				</p>
			</div>
		);

	return (
		<PageTransition className="container mx-auto space-y-6 py-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl text-slate-900 tracking-tight dark:text-slate-100">
						<HistoryIcon className="h-7 w-7 text-blue-600" />
						Delivery History & Financial Settlement
					</h1>
					<p className="text-slate-500 text-sm">
						Trip-by-trip delivery records, itemized customer stops, and Cash vs
						Online payment breakdowns.
					</p>
				</div>
			</div>

			{/* Financial Summary Stats Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-blue-700 text-xs uppercase tracking-wider dark:text-blue-400">
										Completed Trips
									</p>
									<p className="font-bold text-3xl text-blue-900 dark:text-blue-200">
										{completedTripsCount}
									</p>
									<p className="mt-0.5 text-[11px] text-blue-600">
										{inProgressTripsCount} trip(s) in progress
									</p>
								</div>
								<TruckIcon className="h-8 w-8 text-blue-500 opacity-80" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-emerald-700 text-xs uppercase tracking-wider dark:text-emerald-400">
										Total Cash Collected
									</p>
									<p className="font-bold font-mono text-2xl text-emerald-800 dark:text-emerald-300">
										₹{aggregateCash.toFixed(2)}
									</p>
								</div>
								<BanknoteIcon className="h-8 w-8 text-emerald-500 opacity-80" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-purple-200 bg-purple-50/60 dark:border-purple-900 dark:bg-purple-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-purple-700 text-xs uppercase tracking-wider dark:text-purple-400">
										Total Online / UPI
									</p>
									<p className="font-bold font-mono text-2xl text-purple-900 dark:text-purple-200">
										₹{aggregateOnline.toFixed(2)}
									</p>
								</div>
								<CreditCardIcon className="h-8 w-8 text-purple-500 opacity-80" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-amber-700 text-xs uppercase tracking-wider dark:text-amber-400">
										Combined Total Handover
									</p>
									<p className="font-bold font-mono text-2xl text-amber-900 dark:text-amber-200">
										₹{aggregateTotal.toFixed(2)}
									</p>
								</div>
								<WalletIcon className="h-8 w-8 text-amber-500 opacity-80" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Trip History Table Card */}
			<Card className="border-border/60 shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 font-bold text-lg">
							<TruckIcon className="h-5 w-5 text-blue-600" />
							Trip Delivery Log & Collections
						</CardTitle>
						<CardDescription className="text-xs">
							Click on any trip to view detailed customer stops and Cash/Online
							collection breakdown.
						</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search trip, route, driver..."
							className="w-full rounded-md border border-input bg-background py-1.5 pr-3 pl-9 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{!filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
							<HistoryIcon className="h-10 w-10 text-blue-500 opacity-30" />
							<p>No delivery trip history records found.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="font-semibold text-xs">
											Trip Ref
										</TableHead>
										<TableHead className="font-semibold text-xs">
											Route Name
										</TableHead>
										<TableHead className="font-semibold text-xs">
											Date
										</TableHead>
										<TableHead className="font-semibold text-xs">
											Driver & Vehicle
										</TableHead>
										<TableHead className="font-semibold text-xs">
											Stops Delivered
										</TableHead>
										<TableHead className="font-semibold text-xs">
											Cash Collection
										</TableHead>
										<TableHead className="font-semibold text-xs">
											Online Collection
										</TableHead>
										<TableHead className="font-semibold text-xs">
											Total Collection
										</TableHead>
										<TableHead className="text-right font-semibold text-xs">
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((t: any) => (
										<TableRow
											key={t.id}
											className="transition-colors hover:bg-muted/40"
										>
											<TableCell className="font-bold font-mono text-blue-600 text-xs">
												{t.tripNumber}
											</TableCell>
											<TableCell className="font-semibold text-sm">
												📍 {t.routeName}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{t.date}
											</TableCell>
											<TableCell className="text-xs">
												<div className="font-medium text-slate-800 dark:text-slate-200">
													👤 {t.driverName}
												</div>
												<div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
													🚛 {t.vehiclePlate}
												</div>
											</TableCell>
											<TableCell className="text-xs">
												<span className="font-bold text-slate-800">
													{t.completedStops}
												</span>{" "}
												/ {t.totalStops} Stops
											</TableCell>
											<TableCell className="font-mono font-semibold text-emerald-700 text-xs">
												₹{t.totalCashCollected.toFixed(2)}
											</TableCell>
											<TableCell className="font-mono font-semibold text-purple-700 text-xs">
												₹{t.totalOnlineCollected.toFixed(2)}
											</TableCell>
											<TableCell className="font-bold font-mono text-slate-900 text-xs">
												₹{t.totalCollected.toFixed(2)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="outline"
													className="h-8 border-blue-200 font-medium text-blue-700 text-xs hover:bg-blue-50"
													onClick={() => setSelectedTrip(t)}
												>
													<EyeIcon className="mr-1.5 h-3.5 w-3.5" />
													View Details
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Trip Details & Financial Settlement Modal */}
			{selectedTrip && (
				<Dialog
					open={!!selectedTrip}
					onOpenChange={(open) => !open && setSelectedTrip(null)}
				>
					<DialogContent className="sm:max-w-[700px]">
						<DialogHeader>
							<DialogTitle className="flex items-center justify-between font-bold text-slate-900 text-xl">
								<div className="flex items-center gap-2">
									<TruckIcon className="h-6 w-6 text-blue-600" />
									<span>
										Trip Details & Financial Settlement (
										{selectedTrip.tripNumber})
									</span>
								</div>
							</DialogTitle>
							<DialogDescription className="text-slate-500 text-xs">
								Complete breakdown of customer stops, Cash vs Online payment
								collections, and delivery status.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2 text-sm">
							{/* Summary Header Card */}
							<div className="grid grid-cols-2 gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs sm:grid-cols-4">
								<div>
									<span className="block text-slate-500">Route Name:</span>
									<span className="font-bold text-slate-900 text-sm">
										📍 {selectedTrip.routeName}
									</span>
								</div>
								<div>
									<span className="block text-slate-500">Assigned Driver:</span>
									<span className="font-medium text-slate-800">
										👤 {selectedTrip.driverName}
									</span>
								</div>
								<div>
									<span className="block text-slate-500">Truck / Vehicle:</span>
									<span className="font-medium font-mono text-slate-800">
										🚛 {selectedTrip.vehiclePlate}
									</span>
								</div>
								<div>
									<span className="block text-slate-500">Date & Status:</span>
									<span className="font-bold text-emerald-700">
										{selectedTrip.date} ({selectedTrip.status})
									</span>
								</div>
							</div>

							{/* Financial Ledger Summary Cards */}
							<div className="grid grid-cols-3 gap-3">
								<div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs">
									<span className="font-semibold text-[10px] text-emerald-700 uppercase tracking-wider">
										💵 Cash Collected
									</span>
									<p className="mt-1 font-bold font-mono text-emerald-900 text-lg">
										₹{selectedTrip.totalCashCollected.toFixed(2)}
									</p>
								</div>
								<div className="rounded-xl border border-purple-200 bg-purple-50/80 p-3 text-xs">
									<span className="font-semibold text-[10px] text-purple-700 uppercase tracking-wider">
										💳 Online / UPI / QR
									</span>
									<p className="mt-1 font-bold font-mono text-lg text-purple-900">
										₹{selectedTrip.totalOnlineCollected.toFixed(2)}
									</p>
								</div>
								<div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs">
									<span className="font-semibold text-[10px] text-amber-700 uppercase tracking-wider">
										💰 Total Handover
									</span>
									<p className="mt-1 font-bold font-mono text-amber-900 text-lg">
										₹{selectedTrip.totalCollected.toFixed(2)}
									</p>
								</div>
							</div>

							{/* 2-BILL HANDOVER LIFECYCLE AUDIT VIEW FOR DRIVER */}
							<div className="space-y-3 pt-2">
								<h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
									<Layers className="h-4 w-4 text-indigo-600" />
									2-Bill Handover Lifecycle Audit (दोनों बिलों का तुलनात्मक विवरण)
								</h4>

								<Tabs defaultValue="bill2" className="w-full space-y-3">
									<TabsList className="grid grid-cols-2 w-full bg-slate-100 p-1">
										<TabsTrigger value="bill1" className="text-xs font-semibold py-1.5">
											1️⃣ Initial Dispatched Bill (जो मिला था)
										</TabsTrigger>
										<TabsTrigger value="bill2" className="text-xs font-semibold py-1.5">
											2️⃣ Final Doorstep Settled Bill (जो कलेक्ट किया)
										</TabsTrigger>
									</TabsList>

									{/* BILL 1: INITIAL DISPATCHED ITEMS */}
									<TabsContent value="bill1">
										<div className="rounded-lg border border-blue-200 bg-blue-50/30 p-3 space-y-3">
											<div className="flex items-center justify-between">
												<div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
													<ShoppingCart className="h-4 w-4 text-blue-600" />
													<span>Bill 1: Initial Loaded Vehicle Items (प्रारंभिक बिल)</span>
												</div>
												<span className="text-xs font-mono font-bold text-blue-700">
													Dispatched Value: ₹{selectedTrip.totalCollected.toFixed(2)}
												</span>
											</div>

											<div className="overflow-x-auto rounded border border-blue-100 bg-white">
												<Table className="w-full text-xs">
													<TableHeader className="bg-blue-50">
														<TableRow>
															<TableHead className="font-semibold">Stop / Customer</TableHead>
															<TableHead className="font-semibold">Order Ref</TableHead>
															<TableHead className="font-semibold text-center">Dispatched Qty</TableHead>
															<TableHead className="font-semibold text-right">Rate</TableHead>
															<TableHead className="font-semibold text-right">Subtotal</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{selectedTrip.stops && selectedTrip.stops.length > 0 ? (
															selectedTrip.stops.map((st: any) => (
																<TableRow key={st.stopId}>
																	<TableCell className="font-semibold text-slate-800">
																		{st.customerName}
																	</TableCell>
																	<TableCell className="font-mono text-blue-600 font-semibold">
																		{st.orderRef}
																	</TableCell>
																	<TableCell className="text-center font-bold text-blue-700">
																		{st.packages || 1} Pkgs / Items
																	</TableCell>
																	<TableCell className="text-right">
																		₹{(st.amountToCollect || (st.cashCollected + st.onlineCollected) || 0).toLocaleString("en-IN")}
																	</TableCell>
																	<TableCell className="text-right font-bold text-blue-900">
																		₹{(st.amountToCollect || (st.cashCollected + st.onlineCollected) || 0).toLocaleString("en-IN")}
																	</TableCell>
																</TableRow>
															))
														) : (
															<TableRow>
																<TableCell colSpan={5} className="py-3 text-center text-slate-400">
																	No initial dispatch item records found.
																</TableCell>
															</TableRow>
														)}
													</TableBody>
												</Table>
											</div>
										</div>
									</TabsContent>

									{/* BILL 2: FINAL DOORSTEP SETTLED BILL */}
									<TabsContent value="bill2">
										<div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3 space-y-3">
											<div className="flex items-center justify-between">
												<div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
													<PackageCheck className="h-4 w-4 text-emerald-600" />
													<span>Bill 2: Final Doorstep Delivered & Collected Bill (अंतिम संग्रह)</span>
												</div>
												<span className="text-xs font-mono font-bold text-emerald-700">
													Handover Total: ₹{selectedTrip.totalCollected.toFixed(2)}
												</span>
											</div>

											{/* Itemized Customer Stops Ledger */}
											<div className="overflow-x-auto rounded-lg border border-emerald-100 bg-white">
												<Table className="w-full text-xs">
													<TableHeader className="bg-emerald-50">
														<TableRow>
															<TableHead className="font-semibold">#</TableHead>
															<TableHead className="font-semibold">Customer Name</TableHead>
															<TableHead className="font-semibold">Order Ref</TableHead>
															<TableHead className="font-semibold text-emerald-800">Cash (₹)</TableHead>
															<TableHead className="font-semibold text-purple-800">Online (₹)</TableHead>
															<TableHead className="font-semibold">Handover Status</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{selectedTrip.stops && selectedTrip.stops.length > 0 ? (
															selectedTrip.stops.map((st: any) => (
																<TableRow key={st.stopId} className="hover:bg-slate-50">
																	<TableCell className="font-bold font-mono">
																		#{st.sequence}
																	</TableCell>
																	<TableCell className="font-semibold text-slate-900">
																		{st.customerName}
																		<div className="font-normal text-[10px] text-slate-500">
																			📍 {st.address}
																		</div>
																	</TableCell>
																	<TableCell className="font-mono font-semibold text-blue-600">
																		{st.orderRef}
																	</TableCell>
																	<TableCell className="font-bold font-mono text-emerald-700">
																		{st.cashCollected > 0
																			? `₹${st.cashCollected.toFixed(2)}`
																			: "—"}
																	</TableCell>
																	<TableCell className="font-bold font-mono text-purple-700">
																		{st.onlineCollected > 0
																			? `₹${st.onlineCollected.toFixed(2)}`
																			: "—"}
																	</TableCell>
																	<TableCell>
																		<span
																			className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase ${
																				st.status === "Delivered"
																					? "bg-emerald-100 text-emerald-800"
																					: "bg-amber-100 text-amber-800"
																			}`}
																		>
																			✓ {st.status} ({st.deliveredAt})
																		</span>
																	</TableCell>
																</TableRow>
															))
														) : (
															<TableRow>
																<TableCell colSpan={6} className="py-4 text-center text-slate-400">
																	No customer stops recorded for this trip.
																</TableCell>
															</TableRow>
														)}
													</TableBody>
												</Table>
											</div>
										</div>
									</TabsContent>
								</Tabs>
							</div>
						</div>

						<DialogFooter>
							<Button
								onClick={() => setSelectedTrip(null)}
								className="w-full bg-slate-900 font-semibold text-white hover:bg-slate-800"
							>
								Close Financial Settlement View
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</PageTransition>
	);
}
