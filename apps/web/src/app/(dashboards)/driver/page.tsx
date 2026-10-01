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
	ActivityIcon,
	AlertTriangleIcon,
	ArrowRightIcon,
	CalendarIcon,
	CheckCircle2,
	CheckCircleIcon,
	ClockIcon,
	FileText,
	Headphones,
	History,
	MapPin,
	MapPinIcon,
	PackageCheck,
	PackageIcon,
	PhoneCall,
	RefreshCwIcon,
	ShieldCheck,
	Sparkles,
	Truck,
	TruckIcon,
	User,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion, PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function DriverDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: dashboard,
		refetch,
	} = trpc.driver.getMobileDashboard.useQuery(
		{},
		{ refetchInterval: 15000 },
	);

	const assignedOrders = dashboard?.assignedOrders || 0;
	const deliveredOrders = dashboard?.delivered || 0;
	const pendingOrders = dashboard?.pending || 0;

	return (
		<PageTransition className="container max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
			{/* Header Banner */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Badge className="bg-blue-500/30 text-blue-200 border-blue-400/40 text-xs px-2.5 py-0.5">
							<Sparkles className="mr-1 h-3 w-3 text-amber-300 inline" /> Driver Executive Console
						</Badge>
					</div>
					<h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
						Driver Dashboard
					</h1>
					<p className="text-blue-100/80 text-xs sm:text-sm max-w-xl">
						Manage active route deliveries, customer handovers, live invoicing & vehicle health in real-time.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs shadow-xs"
					>
						<RefreshCwIcon className="mr-1.5 h-3.5 w-3.5" /> Refresh
					</Button>
					<Button
						size="sm"
						className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md"
						asChild
					>
						<Link href="/driver/delivery">
							<FileText className="mr-1.5 h-4 w-4" /> Start Delivery Handover
						</Link>
					</Button>
				</div>
			</div>

			{/* Eye-Catching Quick Action Cards Hub */}
			<div className="space-y-2.5">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<ActivityIcon className="h-4 w-4 text-blue-600" /> Quick Action Hub (मुख्य विकल्प)
					</h2>
					<span className="text-xs text-muted-foreground">Touch-optimized for drivers</span>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{/* Action 1: Live Delivery & Bill */}
					<Link href="/driver/delivery" className="group">
						<Card className="h-full border-2 border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-background hover:border-blue-600 hover:shadow-md transition-all rounded-xl cursor-pointer">
							<CardContent className="p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-3 rounded-xl bg-blue-600 text-white shadow-md group-hover:scale-105 transition-transform">
										<FileText className="h-6 w-6" />
									</div>
									<div>
										<h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
											Live Delivery & Bill
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											{pendingOrders > 0
												? `${pendingOrders} stops pending handover`
												: "Generate doorstep invoice"}
										</p>
									</div>
								</div>
								<ArrowRightIcon className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform shrink-0" />
							</CardContent>
						</Card>
					</Link>

					{/* Action 2: Route Navigation */}
					<Link href="/driver/route" className="group">
						<Card className="h-full border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-background hover:border-emerald-600 hover:shadow-md transition-all rounded-xl cursor-pointer">
							<CardContent className="p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md group-hover:scale-105 transition-transform">
										<MapPin className="h-6 w-6" />
									</div>
									<div>
										<h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
											Route Navigation
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											Map view & stop sequence
										</p>
									</div>
								</div>
								<ArrowRightIcon className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0" />
							</CardContent>
						</Card>
					</Link>

					{/* Action 3: Delivery History */}
					<Link href="/driver/history" className="group">
						<Card className="h-full border border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-background hover:border-purple-600 hover:shadow-md transition-all rounded-xl cursor-pointer">
							<CardContent className="p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-3 rounded-xl bg-purple-600 text-white shadow-md group-hover:scale-105 transition-transform">
										<History className="h-6 w-6" />
									</div>
									<div>
										<h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
											Delivery History
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											2-Bill audit & cash settlement
										</p>
									</div>
								</div>
								<ArrowRightIcon className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform shrink-0" />
							</CardContent>
						</Card>
					</Link>

					{/* Action 4: Vehicle Status */}
					<Link href="/driver/vehicle" className="group">
						<Card className="h-full border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background hover:border-amber-600 hover:shadow-md transition-all rounded-xl cursor-pointer">
							<CardContent className="p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-3 rounded-xl bg-amber-600 text-white shadow-md group-hover:scale-105 transition-transform">
										<Truck className="h-6 w-6" />
									</div>
									<div>
										<h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
											Vehicle Inspection
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											{dashboard?.vehicleStatus?.fuelLevel
												? `Fuel: ${dashboard.vehicleStatus.fuelLevel}`
												: "Fuel & odometer logs"}
										</p>
									</div>
								</div>
								<ArrowRightIcon className="h-5 w-5 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
							</CardContent>
						</Card>
					</Link>

					{/* Action 5: Support & Dispatch */}
					<Link href="/driver/support" className="group">
						<Card className="h-full border border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-background hover:border-indigo-600 hover:shadow-md transition-all rounded-xl cursor-pointer">
							<CardContent className="p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md group-hover:scale-105 transition-transform">
										<Headphones className="h-6 w-6" />
									</div>
									<div>
										<h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
											Support & Dispatch
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											Helpline & emergency contact
										</p>
									</div>
								</div>
								<ArrowRightIcon className="h-5 w-5 text-indigo-600 group-hover:translate-x-1 transition-transform shrink-0" />
							</CardContent>
						</Card>
					</Link>

					{/* Action 6: Profile & Account */}
					<Link href="/driver/profile" className="group">
						<Card className="h-full border border-slate-300 dark:border-slate-800 bg-card hover:border-slate-400 hover:shadow-md transition-all rounded-xl cursor-pointer">
							<CardContent className="p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-3 rounded-xl bg-slate-800 text-white shadow-md group-hover:scale-105 transition-transform">
										<User className="h-6 w-6" />
									</div>
									<div>
										<h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
											Driver Profile
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											Shift details & settings
										</p>
									</div>
								</div>
								<ArrowRightIcon className="h-5 w-5 text-slate-600 group-hover:translate-x-1 transition-transform shrink-0" />
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>

			{/* Driver Summary Metrics (Completely removed Online/Offline status) */}
			<motion.div
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<Card className="border-border shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/30">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg flex items-center gap-2">
								<PackageCheck className="h-5 w-5 text-blue-600" />
								Delivery Performance & Stop Summary
							</CardTitle>
							<CardDescription className="text-xs">
								Active trip stop metrics and assigned deliveries
							</CardDescription>
						</div>
						<Button variant="outline" size="sm" className="text-xs" asChild>
							<Link href="/driver/support">
								<PhoneCall className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Contact Dispatch
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-4">
						<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
							<div className="rounded-xl border border-blue-200/80 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20 p-3.5 text-center">
								<p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
									Assigned Orders
								</p>
								<p className="font-bold font-mono text-2xl text-blue-900 dark:text-blue-200 mt-1">
									{assignedOrders}
								</p>
							</div>
							<div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20 p-3.5 text-center">
								<p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
									Delivered Stops
								</p>
								<p className="font-bold font-mono text-2xl text-emerald-800 dark:text-emerald-200 mt-1">
									{deliveredOrders}
								</p>
							</div>
							<div className="rounded-xl border border-amber-200/80 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20 p-3.5 text-center">
								<p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
									Pending Delivery
								</p>
								<p className="font-bold font-mono text-2xl text-amber-900 dark:text-amber-200 mt-1">
									{pendingOrders}
								</p>
							</div>
							<div className="rounded-xl border border-purple-200/80 bg-purple-50/50 dark:border-purple-900/60 dark:bg-purple-950/20 p-3.5 text-center">
								<p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
									COD Collected
								</p>
								<p className="font-bold font-mono text-xl text-purple-950 dark:text-purple-200 mt-1">
									{formatCurrency(dashboard?.codCollected || 0, locale)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Next Delivery Card */}
			<motion.div
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
			>
				<Card className="border-border shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/30">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg flex items-center gap-2">
								<MapPin className="h-5 w-5 text-emerald-600" />
								Next Active Delivery Stop
							</CardTitle>
							<CardDescription className="text-xs">
								Upcoming customer drop-off details
							</CardDescription>
						</div>
						<Button
							size="sm"
							className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
							asChild
						>
							<Link href="/driver/route">
								Navigate <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-4">
						{dashboard?.nextDelivery ? (
							<div className="space-y-4">
								<div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20 p-3.5">
									<div className="flex flex-col gap-1">
										<div className="flex flex-wrap items-center gap-1.5">
											{dashboard.nextDelivery.orders &&
											dashboard.nextDelivery.orders.length > 0 ? (
												dashboard.nextDelivery.orders.map((ord: any) => (
													<span
														key={ord.id}
														className="inline-flex items-center rounded-md border border-blue-200 bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-900/60 dark:text-blue-300"
													>
														ORD-{ord.id}
													</span>
												))
											) : (
												<p className="font-bold text-sm font-mono text-blue-900 dark:text-blue-200">
													{dashboard.nextDelivery.orderId.startsWith("ORD-")
														? dashboard.nextDelivery.orderId
														: `ORD-${dashboard.nextDelivery.orderId}`}
												</p>
											)}
											{dashboard.nextDelivery.ordersCount &&
												dashboard.nextDelivery.ordersCount > 1 && (
													<Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px]">
														{dashboard.nextDelivery.ordersCount} Orders
													</Badge>
												)}
										</div>
										<p className="font-bold text-gray-900 dark:text-white text-base">
											{dashboard.nextDelivery.customerName}
										</p>
									</div>
									<div className="flex items-center gap-2 text-right">
										<Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold">
											COD
										</Badge>
										<span className="text-gray-500 font-mono text-xs">
											{dashboard.nextDelivery.estimatedDuration}
										</span>
									</div>
								</div>

								<div className="grid gap-3 sm:grid-cols-3 text-xs">
									<div className="rounded-lg border p-3 bg-card">
										<p className="text-muted-foreground font-semibold mb-1">
											Delivery Address
										</p>
										<p className="font-medium text-foreground break-all">
											{dashboard.nextDelivery.address}
										</p>
									</div>
									<div className="rounded-lg border p-3 bg-card">
										<p className="text-muted-foreground font-semibold mb-1">
											Customer Contact
										</p>
										<p className="font-bold text-foreground">
											{dashboard.nextDelivery.contactName}
										</p>
										<p className="text-blue-600 font-mono">
											{dashboard.nextDelivery.contactPhone}
										</p>
									</div>
									<div className="rounded-lg border p-3 bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
										<p className="text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
											Amount to Collect
										</p>
										<p className="font-extrabold font-mono text-emerald-900 dark:text-emerald-200 text-base">
											{formatCurrency(
												dashboard.nextDelivery.amountToCollect,
												locale,
											)}
										</p>
									</div>
								</div>

								<div className="flex items-center justify-between pt-2 border-t text-xs">
									<div className="flex items-center gap-4 text-muted-foreground">
										<span>
											Packages:{" "}
											<strong className="text-foreground">
												{dashboard.nextDelivery.packages}
											</strong>
										</span>
										<span>
											Items:{" "}
											<strong className="text-foreground">
												{dashboard.nextDelivery.items?.length || 0}
											</strong>
										</span>
									</div>
									<Button
										size="sm"
										variant="outline"
										className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
										asChild
									>
										<Link href="/driver/delivery">Process Handover →</Link>
									</Button>
								</div>
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
								No active deliveries
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Route Progress */}
			<motion.div
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.2 }}
			>
				<Card className="border-border shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/30">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg flex items-center gap-2">
								<Truck className="h-5 w-5 text-indigo-600" />
								Route Progress & Delivery Sequence
							</CardTitle>
							<CardDescription className="text-xs">
								Delivery stops and completion status
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/driver/history">
								View Details <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-4">
						{dashboard?.routeStops?.length > 0 ? (
							<div className="space-y-3">
								{dashboard.routeStops.map((stop: any, index: number) => (
									<div
										key={`${stop.id}-${index}`}
										className="flex items-center justify-between border-border/60 border-b pb-2.5 last:border-0 last:pb-0"
									>
										<div className="flex items-center gap-3">
											<div
												className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${
													stop.status === "completed"
														? "bg-emerald-600"
														: stop.status === "next"
															? "bg-blue-600 ring-2 ring-blue-400/50"
															: "bg-gray-400"
												}`}
											>
												{index + 1}
											</div>
											<div className="flex flex-col">
												<p className="font-semibold text-sm text-foreground">
													{stop.customerName}
												</p>
												<p className="text-muted-foreground text-xs">
													{stop.status === "completed"
														? "Delivered ✓"
														: stop.status === "next"
															? "Next Stop"
															: "Pending"}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2 text-right">
											{stop.status === "completed" ? (
												<CheckCircle2 className="h-4 w-4 text-emerald-600" />
											) : stop.status === "next" ? (
												<ArrowRightIcon className="h-4 w-4 animate-pulse text-blue-600" />
											) : (
												<ClockIcon className="h-4 w-4 text-amber-500" />
											)}
											<span className="font-mono text-muted-foreground text-xs">
												{stop.time || "--:--"}
											</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
								No route stops
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Collections & Returns */}
			<motion.div
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.3 }}
			>
				<Card className="border-border shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/30">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg flex items-center gap-2">
								<ShieldCheck className="h-5 w-5 text-purple-600" />
								Collections & Return Reconciliation
							</CardTitle>
							<CardDescription className="text-xs">
								Cash on Delivery and return management
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/driver/history">
								View Details <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-4">
						<div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
							<div className="rounded-lg border p-3 bg-card">
								<p className="mb-1 font-semibold text-muted-foreground text-xs">
									COD Collected
								</p>
								<p className="font-bold text-lg text-emerald-700 dark:text-emerald-400 font-mono">
									{formatCurrency(dashboard?.codCollected || 0, locale)}
								</p>
							</div>
							<div className="rounded-lg border p-3 bg-card">
								<p className="mb-1 font-semibold text-muted-foreground text-xs">
									Successful Collections
								</p>
								<p className="font-bold text-lg font-mono">
									{dashboard?.successfulCollections || 0}
								</p>
							</div>
							<div className="rounded-lg border p-3 bg-card">
								<p className="mb-1 font-semibold text-muted-foreground text-xs">
									Returns Processed
								</p>
								<p className="font-bold text-lg font-mono text-amber-700 dark:text-amber-400">
									{dashboard?.returnsProcessed || 0}
								</p>
							</div>
							<div className="rounded-lg border p-3 bg-card">
								<p className="mb-1 font-semibold text-muted-foreground text-xs">
									Return Rate
								</p>
								<p className="font-bold text-lg font-mono">
									{dashboard?.returnRate || 0}%
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Vehicle Status & Notifications Grid */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Vehicle Status */}
				<motion.div
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.4 }}
				>
					<Card className="border-border shadow-xs h-full flex flex-col justify-between">
						<div>
							<CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/30">
								<div className="space-y-0.5">
									<CardTitle className="text-base font-bold flex items-center gap-2">
										<Truck className="h-4 w-4 text-amber-600" />
										Vehicle Status
									</CardTitle>
									<CardDescription className="text-xs">
										Current vehicle health
									</CardDescription>
								</div>
								<Button variant="ghost" size="sm" asChild>
									<Link href="/driver/vehicle">
										Details <ArrowRightIcon className="ml-1 h-3 w-3" />
									</Link>
								</Button>
							</CardHeader>
							<CardContent className="pt-4">
								{dashboard?.vehicleStatus ? (
									<div className="grid gap-3 grid-cols-3 text-xs">
										<div className="rounded-lg border p-2.5 text-center bg-card">
											<p className="mb-0.5 font-medium text-muted-foreground">
												Maintenance
											</p>
											<p
												className={`font-bold ${
													dashboard?.vehicleStatus?.maintenanceDue
														? "text-red-600"
														: "text-emerald-600"
												}`}
											>
												{dashboard?.vehicleStatus?.maintenanceDue
													? "Due"
													: "OK ✓"}
											</p>
										</div>
										<div className="rounded-lg border p-2.5 text-center bg-card">
											<p className="mb-0.5 font-medium text-muted-foreground">
												Fuel Level
											</p>
											<p className="font-bold font-mono">
												{dashboard?.vehicleStatus?.fuelLevel || "N/A"}
											</p>
										</div>
										<div className="rounded-lg border p-2.5 text-center bg-card">
											<p className="mb-0.5 font-medium text-muted-foreground">
												Odometer
											</p>
											<p className="font-bold font-mono">
												{dashboard?.vehicleStatus?.odometer || "N/A"}
											</p>
										</div>
									</div>
								) : (
									<div className="flex h-[100px] items-center justify-center text-muted-foreground text-xs">
										Vehicle status not available
									</div>
								)}
							</CardContent>
						</div>
					</Card>
				</motion.div>

				{/* Notifications */}
				<motion.div
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.5 }}
				>
					<Card className="border-border shadow-xs h-full flex flex-col justify-between">
						<div>
							<CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/30">
								<div className="space-y-0.5">
									<CardTitle className="text-base font-bold flex items-center gap-2">
										<Headphones className="h-4 w-4 text-indigo-600" />
										Dispatch Notifications
									</CardTitle>
									<CardDescription className="text-xs">
										Alerts & instructions
									</CardDescription>
								</div>
								<Button variant="ghost" size="sm" asChild>
									<Link href="/driver/support">
										View All <ArrowRightIcon className="ml-1 h-3 w-3" />
									</Link>
								</Button>
							</CardHeader>
							<CardContent className="pt-4">
								{dashboard?.notifications?.length > 0 ? (
									<div className="space-y-2">
										{dashboard.notifications.map((notif: any, index: number) => (
											<div
												key={index}
												className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 text-xs"
											>
												<p className="font-medium text-foreground">
													{notif.message}
												</p>
												<span className="text-muted-foreground font-mono text-[10px] shrink-0 ml-2">
													{notif.time}
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="flex h-[100px] items-center justify-center text-muted-foreground text-xs">
										No notifications
									</div>
								)}
							</CardContent>
						</div>
					</Card>
				</motion.div>
			</div>
		</PageTransition>
	);
}
