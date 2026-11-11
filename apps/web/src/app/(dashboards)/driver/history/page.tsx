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
	Clock,
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
import Link from "next/link";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { DateFilterBar } from "@/components/shared/filters/date-filter-bar";
import { useTRPC } from "@/lib/trpc/client";

export default function DriverHistoryPage() {
	const trpc = useTRPC();
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [datePreset, setDatePreset] = useState("all");

	const {
		data: deliveryHistory,
		isLoading,
		error,
	} = trpc.driver.getDeliveryHistory.useQuery({
		startDate: startDate || undefined,
		endDate: endDate || undefined,
	});

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

	const filteredList = deliveryHistory?.filter(
		(t: any) =>
			t.tripNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.routeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.vehiclePlate?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Cumulative financial aggregates across filtered trips
	const completedTripsCount =
		filteredList?.filter((t: any) => t.status === "Completed").length ?? 0;
	const inProgressTripsCount =
		filteredList?.filter(
			(t: any) => t.status === "In Progress" || t.status === "Active",
		).length ?? 0;

	const aggregateCash =
		filteredList?.reduce(
			(acc: number, t: any) => acc + (Number(t.totalCashCollected) || 0),
			0,
		) || 0;
	const aggregateOnline =
		filteredList?.reduce(
			(acc: number, t: any) => acc + (Number(t.totalOnlineCollected) || 0),
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
				<CardHeader className="flex flex-col gap-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
					</div>

					<DateFilterBar
						startDate={startDate}
						endDate={endDate}
						datePreset={datePreset}
						totalCount={filteredList?.length || 0}
						countLabel="trips"
						totalAmount={aggregateTotal}
						amountLabel="Total Handover:"
						onDateChange={(start, end, preset) => {
							setStartDate(start);
							setEndDate(end);
							setDatePreset(preset);
						}}
					/>
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
												<span className="font-bold text-slate-800 dark:text-slate-100">
													{t.completedStops}
												</span>{" "}
												/ {t.totalStops} Stops
											</TableCell>
											<TableCell className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
												₹{t.totalCashCollected.toFixed(2)}
											</TableCell>
											<TableCell className="font-mono font-semibold text-purple-700 dark:text-purple-400 text-xs">
												₹{t.totalOnlineCollected.toFixed(2)}
											</TableCell>
											<TableCell className="font-bold font-mono text-slate-900 dark:text-slate-100 text-xs">
												₹{t.totalCollected.toFixed(2)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="outline"
													className="h-8 border-blue-200 dark:border-blue-800 font-medium text-blue-700 dark:text-blue-300 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/40"
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
					<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-border bg-background text-foreground">
						<DialogHeader>
							<DialogTitle className="flex items-center justify-between font-bold text-foreground text-xl">
								<div className="flex items-center gap-2">
									<TruckIcon className="h-6 w-6 text-blue-500" />
									<span>
										Trip Details & Financial Settlement (
										{selectedTrip.tripNumber})
									</span>
								</div>
							</DialogTitle>
							<DialogDescription className="text-muted-foreground text-xs">
								Complete breakdown of customer stops, Cash vs Online payment
								collections, and delivery status.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2 text-sm">
							{/* Summary Header Card */}
							<div className="grid grid-cols-2 gap-3 rounded-xl border border-blue-200/60 bg-blue-50/60 p-3.5 text-xs sm:grid-cols-4 dark:border-blue-900/40 dark:bg-blue-950/30">
								<div>
									<span className="block text-muted-foreground font-medium">Route Name:</span>
									<span className="font-bold text-foreground text-sm flex items-center gap-1 mt-0.5">
										<MapPinIcon className="h-4 w-4 text-blue-500 shrink-0" />
										{selectedTrip.routeName}
									</span>
								</div>
								<div>
									<span className="block text-muted-foreground font-medium">Assigned Driver:</span>
									<span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
										<UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
										{selectedTrip.driverName}
									</span>
								</div>
								<div>
									<span className="block text-muted-foreground font-medium">Truck / Vehicle:</span>
									<span className="font-semibold font-mono text-foreground flex items-center gap-1 mt-0.5">
										<TruckIcon className="h-4 w-4 text-muted-foreground shrink-0" />
										{selectedTrip.vehiclePlate}
									</span>
								</div>
								<div>
									<span className="block text-muted-foreground font-medium">Date & Status:</span>
									<span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
										<CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
										{selectedTrip.date} ({selectedTrip.status})
									</span>
								</div>
							</div>

							{/* Financial Ledger Summary Cards */}
							<div className="grid grid-cols-3 gap-3">
								<div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs dark:border-emerald-800/60 dark:bg-emerald-950/40">
									<span className="font-semibold text-[10px] text-emerald-700 uppercase tracking-wider flex items-center gap-1 dark:text-emerald-400">
										<Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
										Cash Collected
									</span>
									<p className="mt-1 font-bold font-mono text-emerald-900 text-lg dark:text-emerald-200">
										₹{selectedTrip.totalCashCollected.toFixed(2)}
									</p>
								</div>
								<div className="rounded-xl border border-purple-200 bg-purple-50/80 p-3 text-xs dark:border-purple-800/60 dark:bg-purple-950/40">
									<span className="font-semibold text-[10px] text-purple-700 uppercase tracking-wider flex items-center gap-1 dark:text-purple-400">
										<QrCode className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
										Online / UPI / QR
									</span>
									<p className="mt-1 font-bold font-mono text-lg text-purple-900 dark:text-purple-200">
										₹{selectedTrip.totalOnlineCollected.toFixed(2)}
									</p>
								</div>
								<div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs dark:border-amber-800/60 dark:bg-amber-950/40">
									<span className="font-semibold text-[10px] text-amber-700 uppercase tracking-wider flex items-center gap-1 dark:text-amber-400">
										<WalletIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
										Total Handover
									</span>
									<p className="mt-1 font-bold font-mono text-amber-900 text-lg dark:text-amber-200">
										₹{selectedTrip.totalCollected.toFixed(2)}
									</p>
								</div>
							</div>

							{/* 2-BILL HANDOVER LIFECYCLE AUDIT VIEW FOR DRIVER */}
							{(() => {
								const validTripStops = (selectedTrip.stops || []).filter((st: any) => {
									const hasMoney =
										(Number(st.cashCollected) || 0) > 0 ||
										(Number(st.onlineCollected) || 0) > 0;
									const hasDeliveredItems =
										Array.isArray(st.deliveredItems) &&
										st.deliveredItems.some(
											(it: any) =>
												Number(it.price || 0) > 0 && Number(it.qty || 0) > 0,
										);
									const hasItems =
										Array.isArray(st.items) &&
										st.items.some(
											(it: any) =>
												Number(it.price || 0) > 0 && Number(it.qty || 0) > 0,
										);
									const hasInitialItems =
										Array.isArray(st.initialItems) &&
										st.initialItems.some(
											(it: any) =>
												Number(it.price || 0) > 0 && Number(it.qty || 0) > 0,
										);
									return (
										hasMoney ||
										hasDeliveredItems ||
										hasItems ||
										hasInitialItems ||
										st.status === "Delivered"
									);
								});

								return (
							<div className="space-y-3 pt-2">
								<h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
									<Layers className="h-4 w-4 text-indigo-500" />
									2-Bill Handover Lifecycle Audit (दोनों बिलों का तुलनात्मक विवरण)
								</h4>

								<Tabs defaultValue="bill2" className="w-full space-y-3">
									<TabsList className="grid grid-cols-2 w-full bg-muted/60 p-1 border border-border/40">
										<TabsTrigger value="bill1" className="text-xs font-semibold py-1.5 flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
											<ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
											Initial Dispatched Bill (जो मिला था)
										</TabsTrigger>
										<TabsTrigger value="bill2" className="text-xs font-semibold py-1.5 flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
											<PackageCheck className="h-3.5 w-3.5 text-emerald-500" />
											Final Doorstep Settled Bill (जो कलेक्ट किया)
										</TabsTrigger>
									</TabsList>

									{/* BILL 1: INITIAL DISPATCHED ITEMS */}
									<TabsContent value="bill1">
										<div className="rounded-lg border border-blue-200/80 bg-blue-50/40 p-3 space-y-3 dark:border-blue-900/50 dark:bg-blue-950/30">
											<div className="flex items-center justify-between">
												<div className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
													<ShoppingCart className="h-4 w-4 text-blue-500" />
													<span>Bill 1: Initial Loaded Vehicle Items (प्रारंभिक बिल)</span>
												</div>
												<span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
													Dispatched Value: ₹{selectedTrip.totalCollected.toFixed(2)}
												</span>
											</div>

											<div className="overflow-x-auto rounded border border-border bg-card">
												<Table className="w-full text-xs">
													<TableHeader className="bg-muted/50">
														<TableRow className="border-border">
															<TableHead className="font-semibold text-foreground">Customer / Stop</TableHead>
															<TableHead className="font-semibold text-foreground">Order Ref</TableHead>
															<TableHead className="font-semibold text-foreground">Dispatched Product Name</TableHead>
															<TableHead className="font-semibold text-center text-foreground">Qty</TableHead>
															<TableHead className="font-semibold text-right text-foreground">Unit Price</TableHead>
															<TableHead className="font-semibold text-right text-foreground">Subtotal</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{validTripStops && validTripStops.length > 0 ? (
															validTripStops.flatMap((st: any) => {
																const rawItems = st.initialItems && st.initialItems.length > 0
																	? st.initialItems
																	: (st.amountToCollect || st.cashCollected + st.onlineCollected > 0)
																		? [{ name: "Dispatched Order Package", qty: 1, price: st.amountToCollect || st.cashCollected + st.onlineCollected || 0 }]
																		: [];
																const items = rawItems.filter((it: any) => Number(it.price || 0) > 0 || Number(it.qty || 0) > 0 || st.status === "Delivered");
																if (items.length === 0) return [];
																
																return items.map((it: any, iIdx: number) => (
																	<TableRow key={`${st.stopId}-${iIdx}`} className="border-border">
																		{iIdx === 0 && (
																			<TableCell rowSpan={items.length} className="font-semibold text-foreground align-top border-r border-border bg-muted/20">
																				<div>{st.customerName}</div>
																				<div className="font-normal text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
																					<MapPinIcon className="h-3 w-3 text-blue-500 inline shrink-0" />
																					{st.address}
																				</div>
																			</TableCell>
																		)}
																		{iIdx === 0 && (
																			<TableCell rowSpan={items.length} className="font-mono text-blue-600 dark:text-blue-400 font-semibold align-top border-r border-border bg-muted/20">
																				{st.orderRef}
																			</TableCell>
																		)}
																		<TableCell className="font-medium text-foreground">
																			{it.name}
																		</TableCell>
																		<TableCell className="text-center font-bold text-blue-600 dark:text-blue-400">
																			{it.qty}
																		</TableCell>
																		<TableCell className="text-right text-muted-foreground">
																			₹{Number(it.price || 0).toLocaleString("en-IN")}
																		</TableCell>
																		<TableCell className="text-right font-bold text-foreground">
																			₹{(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString("en-IN")}
																		</TableCell>
																	</TableRow>
																));
															})
														) : (
															<TableRow className="border-border">
																<TableCell colSpan={6} className="py-3 text-center text-muted-foreground">
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
										<div className="rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-3 space-y-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
											<div className="flex items-center justify-between">
												<div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
													<PackageCheck className="h-4 w-4 text-emerald-500" />
													<span>Bill 2: Final Doorstep Delivered & Collected Bill (अंतिम संग्रह)</span>
												</div>
												<span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
													Handover Total: ₹{selectedTrip.totalCollected.toFixed(2)}
												</span>
											</div>

											{/* Itemized Customer Stops Ledger */}
											{validTripStops && validTripStops.length > 0 ? (
												validTripStops.map((st: any, sIdx: number) => {
													const rawDelItems =
														(st.deliveredItems && st.deliveredItems.length > 0)
															? st.deliveredItems
															: (st.items && st.items.length > 0)
																? st.items
																: (st.cashCollected + st.onlineCollected > 0 || Number(st.amountToCollect || 0) > 0)
																	? [{ name: "Doorstep Delivered Package", qty: 1, price: st.cashCollected + st.onlineCollected || st.amountToCollect || 0 }]
																	: [];
													
													const delItems = rawDelItems.filter((it: any) => Number(it.price || 0) > 0 || Number(it.qty || 0) > 0 || st.status === "Delivered");
													if (delItems.length === 0 && Number(st.cashCollected || 0) === 0 && Number(st.onlineCollected || 0) === 0 && st.status !== "Delivered") {
														return null;
													}
													
													const stopGrossTotal = delItems.reduce((acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.qty || 1)), 0);
													const stopDiscount = Number(st.discountAmount || 0);
													const stopExtraCharges = Number(st.extraCharges || 0);
													const stopCollected = Number(st.cashCollected || 0) + Number(st.onlineCollected || 0);
													const stopFinalTotal = stopCollected > 0
														? stopCollected
														: Math.max(0, stopGrossTotal - stopDiscount + stopExtraCharges);

													return (
														<div key={st.stopId} className="rounded-lg border border-border bg-card overflow-hidden space-y-0 shadow-2xs">
															{/* Stop Summary Header */}
															<div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-2.5 border-b border-border text-xs">
																<div className="flex items-center gap-2">
																	<span className="font-bold font-mono bg-emerald-600 text-white px-2 py-0.5 rounded text-[11px]">
																		#{sIdx + 1}
																	</span>
																	<div>
																		<span className="font-bold text-foreground text-xs">{st.customerName}</span>
																		<span className="font-mono text-blue-600 dark:text-blue-400 font-semibold ml-2 text-[11px]">({st.orderRef})</span>
																		<div className="text-[10px] text-muted-foreground flex items-center gap-1">
																			<MapPinIcon className="h-3 w-3 text-emerald-500 inline shrink-0" />
																			{st.address}
																		</div>
																	</div>
																</div>

																<div className="flex items-center gap-2">
																	{st.cashCollected > 0 && (
																		<span className="font-mono font-bold text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-950/70 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
																			<Banknote className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
																			Cash: ₹{st.cashCollected.toFixed(2)}
																		</span>
																	)}
																	{st.onlineCollected > 0 && (
																		<span className="font-mono font-bold text-purple-700 bg-purple-100/90 dark:text-purple-300 dark:bg-purple-950/70 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
																			<QrCode className="h-3 w-3 text-purple-600 dark:text-purple-400" />
																			Online: ₹{st.onlineCollected.toFixed(2)}
																		</span>
																	)}
																	<span
																		className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase flex items-center gap-1 ${
																			st.status === "Delivered"
																				? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
																				: st.status === "Failed"
																					? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
																					: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
																		}`}
																	>
																		{st.status === "Delivered" ? (
																			<CheckCircle2 className="h-3 w-3 text-emerald-500" />
																		) : (
																			<Clock className="h-3 w-3 text-amber-500" />
																		)}
																		{st.status} {st.status === "Delivered" && st.deliveredAt ? `(${st.deliveredAt})` : "(Pending)"}
																	</span>

																	<Button
																		size="sm"
																		variant="outline"
																		asChild
																		className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/40 font-semibold gap-1"
																	>
																		<Link href={`/driver/delivery?editStopId=${st.stopId}`}>
																			<FileTextIcon className="h-3 w-3 text-blue-500" />
																			<span>Edit Handover / Bill</span>
																		</Link>
																	</Button>
																</div>
															</div>

															{/* Itemized Products Table */}
															<Table className="w-full text-xs">
																<TableHeader className="bg-muted/30">
																	<TableRow className="border-border">
																		<TableHead className="font-semibold text-foreground">Delivered Product Name</TableHead>
																		<TableHead className="font-semibold text-center text-foreground">Delivered Qty</TableHead>
																		<TableHead className="font-semibold text-right text-foreground">Unit Rate</TableHead>
																		<TableHead className="font-semibold text-right text-foreground">Accepted Net Total</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{delItems.map((it: any, iIdx: number) => (
																		<TableRow key={iIdx} className="hover:bg-muted/30 border-border">
																			<TableCell className="font-medium text-foreground">
																				{it.name}
																			</TableCell>
																			<TableCell className="text-center font-bold text-emerald-600 dark:text-emerald-400">
																				{it.qty}
																			</TableCell>
																			<TableCell className="text-right text-muted-foreground">
																				₹{Number(it.price || 0).toLocaleString("en-IN")}
																			</TableCell>
																			<TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-300">
																				₹{(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString("en-IN")}
																			</TableCell>
																		</TableRow>
																	))}
																	{st.status !== "Delivered" ? (
																		<TableRow className="bg-amber-500/10 font-bold border-t border-amber-500/30">
																			<TableCell colSpan={3} className="text-right text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
																				Pending Handover Expected Bill (अपेक्षित संग्रह बिल)
																			</TableCell>
																			<TableCell className="text-right text-amber-600 dark:text-amber-400 text-sm font-extrabold">
																				₹{stopFinalTotal.toLocaleString("en-IN")}
																			</TableCell>
																		</TableRow>
																	) : (
																		<>
																			<TableRow className="bg-muted/20 font-medium border-border">
																				<TableCell colSpan={3} className="text-right text-xs uppercase tracking-wider text-muted-foreground">
																					Delivered Items Subtotal (सामान का कुल मूल्य)
																				</TableCell>
																				<TableCell className="text-right text-foreground text-xs font-semibold">
																					₹{stopGrossTotal.toLocaleString("en-IN")}
																				</TableCell>
																			</TableRow>
																			{stopDiscount > 0 && (
																				<TableRow className="bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400 border-border">
																					<TableCell colSpan={3} className="text-right text-xs uppercase tracking-wider">
																						Discount Applied (लागू छूट)
																						{st.discountReason && (
																							<span className="block text-[10px] font-normal text-muted-foreground">
																								कारण / Reason: ({st.discountReason})
																							</span>
																						)}
																					</TableCell>
																					<TableCell className="text-right text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
																						- ₹{stopDiscount.toLocaleString("en-IN")}
																					</TableCell>
																				</TableRow>
																			)}
																			{stopExtraCharges > 0 && (
																				<TableRow className="bg-blue-500/10 font-medium text-blue-700 dark:text-blue-400 border-border">
																					<TableCell colSpan={3} className="text-right text-xs uppercase tracking-wider">
																						Other Charges (अतिरिक्त शुल्क)
																						{st.extraChargesReason && (
																							<span className="block text-[10px] font-normal text-muted-foreground">
																								कारण / Reason: ({st.extraChargesReason})
																							</span>
																						)}
																					</TableCell>
																					<TableCell className="text-right text-blue-700 dark:text-blue-400 text-xs font-semibold">
																						+ ₹{stopExtraCharges.toLocaleString("en-IN")}
																					</TableCell>
																				</TableRow>
																			)}
																			<TableRow className="bg-emerald-500/15 font-bold border-t border-emerald-500/30">
																				<TableCell colSpan={3} className="text-right text-xs uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
																					Customer Handover Settled Total (ग्राहक कुल भुगतान)
																				</TableCell>
																				<TableCell className="text-right text-emerald-700 dark:text-emerald-400 text-sm font-extrabold">
																					₹{stopFinalTotal.toLocaleString("en-IN")}
																				</TableCell>
																			</TableRow>
																		</>
																	)}
																</TableBody>
															</Table>
														</div>
													);
												})
											) : (
												<div className="py-4 text-center text-muted-foreground text-xs">
													No customer stops recorded for this trip.
												</div>
											)}
										</div>
									</TabsContent>
								</Tabs>
							</div>
								);
							})()}
						</div>

						<DialogFooter>
							<Button
								onClick={() => setSelectedTrip(null)}
								className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
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
