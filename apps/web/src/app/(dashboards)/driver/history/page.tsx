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
				<StaggerItem className="h-full">
					<Card className="h-full border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="flex h-full flex-col justify-between p-4">
							<div className="flex items-start justify-between gap-2">
								<div className="space-y-1">
									<p className="font-semibold text-blue-700 text-xs uppercase tracking-wider dark:text-blue-400">
										Completed Trips
									</p>
									<p className="font-bold font-mono text-2xl text-blue-900 dark:text-blue-200">
										{completedTripsCount}
									</p>
								</div>
								<TruckIcon className="h-8 w-8 text-blue-500 opacity-80 shrink-0" />
							</div>
							<p className="mt-2 text-[11px] text-blue-600">
								{inProgressTripsCount} trip(s) in progress
							</p>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem className="h-full">
					<Card className="h-full border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
						<CardContent className="flex h-full flex-col justify-between p-4">
							<div className="flex items-start justify-between gap-2">
								<div className="space-y-1">
									<p className="font-semibold text-emerald-700 text-xs uppercase tracking-wider dark:text-emerald-400">
										Total Cash Collected
									</p>
									<p className="font-bold font-mono text-2xl text-emerald-800 dark:text-emerald-300">
										₹{aggregateCash.toFixed(2)}
									</p>
								</div>
								<BanknoteIcon className="h-8 w-8 text-emerald-500 opacity-80 shrink-0" />
							</div>
							<p className="mt-2 text-[11px] text-emerald-600/80">
								Cash collections
							</p>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem className="h-full">
					<Card className="h-full border-purple-200 bg-purple-50/60 dark:border-purple-900 dark:bg-purple-950/20">
						<CardContent className="flex h-full flex-col justify-between p-4">
							<div className="flex items-start justify-between gap-2">
								<div className="space-y-1">
									<p className="font-semibold text-purple-700 text-xs uppercase tracking-wider dark:text-purple-400">
										Total Online / UPI
									</p>
									<p className="font-bold font-mono text-2xl text-purple-900 dark:text-purple-200">
										₹{aggregateOnline.toFixed(2)}
									</p>
								</div>
								<QrCode className="h-8 w-8 text-purple-500 opacity-80 shrink-0" />
							</div>
							<p className="mt-2 text-[11px] text-purple-600/80">
								Digital payment settlements
							</p>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem className="h-full">
					<Card className="h-full border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
						<CardContent className="flex h-full flex-col justify-between p-4">
							<div className="flex items-start justify-between gap-2">
								<div className="space-y-1">
									<p className="font-semibold text-amber-700 text-xs uppercase tracking-wider dark:text-amber-400">
										Combined Total Handover
									</p>
									<p className="font-bold font-mono text-2xl text-amber-900 dark:text-amber-200">
										₹{aggregateTotal.toFixed(2)}
									</p>
								</div>
								<WalletIcon className="h-8 w-8 text-amber-500 opacity-80 shrink-0" />
							</div>
							<p className="mt-2 text-[11px] text-amber-600/80">
								Total combined collection
							</p>
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
									<span className="block text-slate-500 font-medium">Route Name:</span>
									<span className="font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
										<MapPinIcon className="h-4 w-4 text-blue-600 shrink-0" />
										{selectedTrip.routeName}
									</span>
								</div>
								<div>
									<span className="block text-slate-500 font-medium">Assigned Driver:</span>
									<span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
										<UserIcon className="h-4 w-4 text-slate-600 shrink-0" />
										{selectedTrip.driverName}
									</span>
								</div>
								<div>
									<span className="block text-slate-500 font-medium">Truck / Vehicle:</span>
									<span className="font-semibold font-mono text-slate-800 flex items-center gap-1 mt-0.5">
										<TruckIcon className="h-4 w-4 text-slate-600 shrink-0" />
										{selectedTrip.vehiclePlate}
									</span>
								</div>
								<div>
									<span className="block text-slate-500 font-medium">Date & Status:</span>
									<span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
										<CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
										{selectedTrip.date} ({selectedTrip.status})
									</span>
								</div>
							</div>

							{/* Financial Ledger Summary Cards */}
							<div className="grid grid-cols-3 gap-3">
								<div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs">
									<span className="font-semibold text-[10px] text-emerald-700 uppercase tracking-wider flex items-center gap-1">
										<Banknote className="h-3.5 w-3.5 text-emerald-600" />
										Cash Collected
									</span>
									<p className="mt-1 font-bold font-mono text-emerald-900 text-lg">
										₹{selectedTrip.totalCashCollected.toFixed(2)}
									</p>
								</div>
								<div className="rounded-xl border border-purple-200 bg-purple-50/80 p-3 text-xs">
									<span className="font-semibold text-[10px] text-purple-700 uppercase tracking-wider flex items-center gap-1">
										<QrCode className="h-3.5 w-3.5 text-purple-600" />
										Online / UPI / QR
									</span>
									<p className="mt-1 font-bold font-mono text-lg text-purple-900">
										₹{selectedTrip.totalOnlineCollected.toFixed(2)}
									</p>
								</div>
								<div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs">
									<span className="font-semibold text-[10px] text-amber-700 uppercase tracking-wider flex items-center gap-1">
										<WalletIcon className="h-3.5 w-3.5 text-amber-600" />
										Total Handover
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
										<TabsTrigger value="bill1" className="text-xs font-semibold py-1.5 flex items-center gap-1.5">
											<ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
											Initial Dispatched Bill (जो मिला था)
										</TabsTrigger>
										<TabsTrigger value="bill2" className="text-xs font-semibold py-1.5 flex items-center gap-1.5">
											<PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
											Final Doorstep Settled Bill (जो कलेक्ट किया)
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
															<TableHead className="font-semibold">Customer / Stop</TableHead>
															<TableHead className="font-semibold">Order Ref</TableHead>
															<TableHead className="font-semibold">Dispatched Product Name</TableHead>
															<TableHead className="font-semibold text-center">Qty</TableHead>
															<TableHead className="font-semibold text-right">Unit Price</TableHead>
															<TableHead className="font-semibold text-right">Subtotal</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{selectedTrip.stops && selectedTrip.stops.length > 0 ? (
															selectedTrip.stops.flatMap((st: any) => {
																const items = st.initialItems && st.initialItems.length > 0
																	? st.initialItems
																	: [{ name: "Dispatched Order Package", qty: 1, price: st.amountToCollect || st.cashCollected + st.onlineCollected || 0 }];
																
																return items.map((it: any, iIdx: number) => (
																	<TableRow key={`${st.stopId}-${iIdx}`}>
																		{iIdx === 0 && (
																			<TableCell rowSpan={items.length} className="font-semibold text-slate-800 align-top border-r bg-slate-50/30">
																				<div>{st.customerName}</div>
																				<div className="font-normal text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
																					<MapPinIcon className="h-3 w-3 text-blue-500 inline shrink-0" />
																					{st.address}
																				</div>
																			</TableCell>
																		)}
																		{iIdx === 0 && (
																			<TableCell rowSpan={items.length} className="font-mono text-blue-600 font-semibold align-top border-r bg-slate-50/30">
																				{st.orderRef}
																			</TableCell>
																		)}
																		<TableCell className="font-medium text-slate-900">
																			{it.name}
																		</TableCell>
																		<TableCell className="text-center font-bold text-blue-700">
																			{it.qty}
																		</TableCell>
																		<TableCell className="text-right">
																			₹{Number(it.price || 0).toLocaleString("en-IN")}
																		</TableCell>
																		<TableCell className="text-right font-bold text-blue-900">
																			₹{(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString("en-IN")}
																		</TableCell>
																	</TableRow>
																));
															})
														) : (
															<TableRow>
																<TableCell colSpan={6} className="py-3 text-center text-slate-400">
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
											{selectedTrip.stops && selectedTrip.stops.length > 0 ? (
												selectedTrip.stops.map((st: any) => {
													const delItems =
														(st.deliveredItems && st.deliveredItems.length > 0)
															? st.deliveredItems
															: (st.items && st.items.length > 0)
																? st.items
																: [{ name: "Doorstep Delivered Package", qty: 1, price: st.cashCollected + st.onlineCollected || st.amountToCollect || 0 }];
													
													const stopTotal = delItems.reduce((acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.qty || 1)), 0);

													return (
														<div key={st.stopId} className="rounded-lg border border-emerald-200/80 bg-white overflow-hidden space-y-0">
															{/* Stop Summary Header */}
															<div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/70 p-2.5 border-b border-emerald-100 text-xs">
																<div className="flex items-center gap-2">
																	<span className="font-bold font-mono bg-emerald-600 text-white px-2 py-0.5 rounded text-[11px]">
																		#{st.sequence}
																	</span>
																	<div>
																		<span className="font-bold text-slate-900 text-xs">{st.customerName}</span>
																		<span className="font-mono text-blue-600 font-semibold ml-2 text-[11px]">({st.orderRef})</span>
																		<div className="text-[10px] text-slate-500 flex items-center gap-1">
																			<MapPinIcon className="h-3 w-3 text-emerald-600 inline shrink-0" />
																			{st.address}
																		</div>
																	</div>
																</div>

																<div className="flex items-center gap-3">
																	{st.cashCollected > 0 && (
																		<span className="font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
																			<Banknote className="h-3 w-3 text-emerald-600" />
																			Cash: ₹{st.cashCollected.toFixed(2)}
																		</span>
																	)}
																	{st.onlineCollected > 0 && (
																		<span className="font-mono font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
																			<QrCode className="h-3 w-3 text-purple-600" />
																			Online: ₹{st.onlineCollected.toFixed(2)}
																		</span>
																	)}
																	<span className="rounded-full px-2 py-0.5 font-bold text-[10px] uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
																		<CheckCircle2 className="h-3 w-3 text-emerald-600" />
																		{st.status} ({st.deliveredAt})
																	</span>
																</div>
															</div>

															{/* Itemized Products Table */}
															<Table className="w-full text-xs">
																<TableHeader className="bg-slate-50/80">
																	<TableRow>
																		<TableHead className="font-semibold text-slate-700">Delivered Product Name</TableHead>
																		<TableHead className="font-semibold text-center text-slate-700">Delivered Qty</TableHead>
																		<TableHead className="font-semibold text-right text-slate-700">Unit Rate</TableHead>
																		<TableHead className="font-semibold text-right text-slate-700">Accepted Net Total</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{delItems.map((it: any, iIdx: number) => (
																		<TableRow key={iIdx} className="hover:bg-slate-50/50">
																			<TableCell className="font-medium text-slate-900">
																				{it.name}
																			</TableCell>
																			<TableCell className="text-center font-bold text-emerald-700">
																				{it.qty}
																			</TableCell>
																			<TableCell className="text-right text-slate-600">
																				₹{Number(it.price || 0).toLocaleString("en-IN")}
																			</TableCell>
																			<TableCell className="text-right font-bold text-emerald-800">
																				₹{(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString("en-IN")}
																			</TableCell>
																		</TableRow>
																	))}
																	<TableRow className="bg-emerald-500/10 font-bold border-t border-emerald-500/20">
																		<TableCell colSpan={3} className="text-right text-xs uppercase tracking-wider text-emerald-950">
																			Customer Handover Settled Total (ग्राहक कुल भुगतान)
																		</TableCell>
																		<TableCell className="text-right text-emerald-700 text-sm font-extrabold">
																			₹{stopTotal.toLocaleString("en-IN")}
																		</TableCell>
																	</TableRow>
																</TableBody>
															</Table>
														</div>
													);
												})
											) : (
												<div className="py-4 text-center text-slate-400 text-xs">
													No customer stops recorded for this trip.
												</div>
											)}
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
