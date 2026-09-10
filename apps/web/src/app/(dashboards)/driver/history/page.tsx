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
import {
	ActivityIcon,
	BanknoteIcon,
	CheckCircle2Icon,
	CreditCardIcon,
	EyeIcon,
	FileTextIcon,
	HistoryIcon,
	Loader2Icon,
	MapPinIcon,
	SearchIcon,
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
	const completedTripsCount = deliveryHistory?.filter((t: any) => t.status === "Completed").length ?? 0;
	const inProgressTripsCount = deliveryHistory?.filter((t: any) => t.status === "In Progress" || t.status === "Active").length ?? 0;

	const aggregateCash = deliveryHistory?.reduce((acc: number, t: any) => acc + (t.totalCashCollected || 0), 0) || 0;
	const aggregateOnline = deliveryHistory?.reduce((acc: number, t: any) => acc + (t.totalOnlineCollected || 0), 0) || 0;
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
			<div className="flex h-[220px] flex-col items-center justify-center gap-2 text-destructive text-sm p-4 text-center">
				<p className="font-semibold">Error loading delivery history</p>
				<p className="text-xs text-muted-foreground">{error.message || "Failed to query trip history from server."}</p>
			</div>
		);

	return (
		<PageTransition className="container mx-auto space-y-6 py-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl tracking-tight text-slate-900 dark:text-slate-100">
						<HistoryIcon className="h-7 w-7 text-blue-600" />
						Delivery History & Financial Settlement
					</h1>
					<p className="text-slate-500 text-sm">
						Trip-by-trip delivery records, itemized customer stops, and Cash vs Online payment breakdowns.
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
									<p className="text-[11px] text-blue-600 mt-0.5">
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
									<p className="font-mono font-bold text-2xl text-emerald-800 dark:text-emerald-300">
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
									<p className="font-mono font-bold text-2xl text-purple-900 dark:text-purple-200">
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
									<p className="font-mono font-bold text-2xl text-amber-900 dark:text-amber-200">
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
						<CardTitle className="flex items-center gap-2 text-lg font-bold">
							<TruckIcon className="h-5 w-5 text-blue-600" />
							Trip Delivery Log & Collections
						</CardTitle>
						<CardDescription className="text-xs">
							Click on any trip to view detailed customer stops and Cash/Online collection breakdown.
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
										<TableHead className="font-semibold text-xs">Trip Ref</TableHead>
										<TableHead className="font-semibold text-xs">Route Name</TableHead>
										<TableHead className="font-semibold text-xs">Date</TableHead>
										<TableHead className="font-semibold text-xs">Driver & Vehicle</TableHead>
										<TableHead className="font-semibold text-xs">Stops Delivered</TableHead>
										<TableHead className="font-semibold text-xs">Cash Collection</TableHead>
										<TableHead className="font-semibold text-xs">Online Collection</TableHead>
										<TableHead className="font-semibold text-xs">Total Collection</TableHead>
										<TableHead className="text-right font-semibold text-xs">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((t: any) => (
										<TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
											<TableCell className="font-bold font-mono text-blue-600 text-xs">
												{t.tripNumber}
											</TableCell>
											<TableCell className="font-semibold text-sm">
												📍 {t.routeName}
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{t.date}
											</TableCell>
											<TableCell className="text-xs">
												<div className="font-medium text-slate-800 dark:text-slate-200">👤 {t.driverName}</div>
												<div className="text-muted-foreground text-[10px] font-mono mt-0.5">🚛 {t.vehiclePlate}</div>
											</TableCell>
											<TableCell className="text-xs">
												<span className="font-bold text-slate-800">{t.completedStops}</span> / {t.totalStops} Stops
											</TableCell>
											<TableCell className="font-mono text-xs font-semibold text-emerald-700">
												₹{t.totalCashCollected.toFixed(2)}
											</TableCell>
											<TableCell className="font-mono text-xs font-semibold text-purple-700">
												₹{t.totalOnlineCollected.toFixed(2)}
											</TableCell>
											<TableCell className="font-mono text-xs font-bold text-slate-900">
												₹{t.totalCollected.toFixed(2)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="outline"
													className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 font-medium"
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
				<Dialog open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
					<DialogContent className="sm:max-w-[700px]">
						<DialogHeader>
							<DialogTitle className="flex items-center justify-between font-bold text-xl text-slate-900">
								<div className="flex items-center gap-2">
									<TruckIcon className="h-6 w-6 text-blue-600" />
									<span>Trip Details & Financial Settlement ({selectedTrip.tripNumber})</span>
								</div>
							</DialogTitle>
							<DialogDescription className="text-xs text-slate-500">
								Complete breakdown of customer stops, Cash vs Online payment collections, and delivery status.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2 text-sm">
							{/* Summary Header Card */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs">
								<div>
									<span className="text-slate-500 block">Route Name:</span>
									<span className="font-bold text-slate-900 text-sm">📍 {selectedTrip.routeName}</span>
								</div>
								<div>
									<span className="text-slate-500 block">Assigned Driver:</span>
									<span className="font-medium text-slate-800">👤 {selectedTrip.driverName}</span>
								</div>
								<div>
									<span className="text-slate-500 block">Truck / Vehicle:</span>
									<span className="font-mono font-medium text-slate-800">🚛 {selectedTrip.vehiclePlate}</span>
								</div>
								<div>
									<span className="text-slate-500 block">Date & Status:</span>
									<span className="font-bold text-emerald-700">{selectedTrip.date} ({selectedTrip.status})</span>
								</div>
							</div>

							{/* Financial Ledger Summary Cards */}
							<div className="grid grid-cols-3 gap-3">
								<div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs">
									<span className="text-emerald-700 font-semibold uppercase tracking-wider text-[10px]">💵 Cash Collected</span>
									<p className="font-mono font-bold text-lg text-emerald-900 mt-1">₹{selectedTrip.totalCashCollected.toFixed(2)}</p>
								</div>
								<div className="rounded-xl border border-purple-200 bg-purple-50/80 p-3 text-xs">
									<span className="text-purple-700 font-semibold uppercase tracking-wider text-[10px]">💳 Online / UPI / QR</span>
									<p className="font-mono font-bold text-lg text-purple-900 mt-1">₹{selectedTrip.totalOnlineCollected.toFixed(2)}</p>
								</div>
								<div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs">
									<span className="text-amber-700 font-semibold uppercase tracking-wider text-[10px]">💰 Total Handover</span>
									<p className="font-mono font-bold text-lg text-amber-900 mt-1">₹{selectedTrip.totalCollected.toFixed(2)}</p>
								</div>
							</div>

							{/* Itemized Customer Stops Breakdown */}
							<div className="space-y-2">
								<h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Itemized Customer Stop Ledger</h4>
								<div className="overflow-x-auto rounded-lg border border-slate-200">
									<Table className="w-full text-xs">
										<TableHeader className="bg-slate-100">
											<TableRow>
												<TableHead className="font-semibold text-xs">#</TableHead>
												<TableHead className="font-semibold text-xs">Customer Name</TableHead>
												<TableHead className="font-semibold text-xs">Order Ref</TableHead>
												<TableHead className="font-semibold text-xs text-emerald-800">Cash (₹)</TableHead>
												<TableHead className="font-semibold text-xs text-purple-800">Online (₹)</TableHead>
												<TableHead className="font-semibold text-xs">Handover Status</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{selectedTrip.stops && selectedTrip.stops.length > 0 ? (
												selectedTrip.stops.map((st: any) => (
													<TableRow key={st.stopId} className="hover:bg-slate-50">
														<TableCell className="font-bold font-mono">#{st.sequence}</TableCell>
														<TableCell className="font-semibold text-slate-900">
															{st.customerName}
															<div className="text-[10px] font-normal text-slate-500">📍 {st.address}</div>
														</TableCell>
														<TableCell className="font-mono font-semibold text-blue-600">{st.orderRef}</TableCell>
														<TableCell className="font-mono font-bold text-emerald-700">
															{st.cashCollected > 0 ? `₹${st.cashCollected.toFixed(2)}` : "—"}
														</TableCell>
														<TableCell className="font-mono font-bold text-purple-700">
															{st.onlineCollected > 0 ? `₹${st.onlineCollected.toFixed(2)}` : "—"}
														</TableCell>
														<TableCell>
															<span className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase ${
																st.status === "Delivered" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
															}`}>
																✓ {st.status} ({st.deliveredAt})
															</span>
														</TableCell>
													</TableRow>
												))
											) : (
												<TableRow>
													<TableCell colSpan={6} className="text-center py-4 text-slate-400">
														No customer stops recorded for this trip.
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button onClick={() => setSelectedTrip(null)} className="w-full bg-slate-900 text-white hover:bg-slate-800 font-semibold">
								Close Financial Settlement View
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</PageTransition>
	);
}
