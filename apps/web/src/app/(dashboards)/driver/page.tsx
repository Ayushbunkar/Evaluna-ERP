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
	ActivityIcon,
	AlertTriangleIcon,
	ArrowRightIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	MapPinIcon,
	PackageIcon,
	RefreshCwIcon,
	TruckIcon,
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
	const { data: dashboard } = trpc.driver.getMobileDashboard.useQuery();

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Driver Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Delivery management, route navigation, and customer service
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Driver Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/driver/route">
							<MapPinIcon className="mr-2 h-4 w-4" /> View Route
						</Link>
					</Button>
				</div>
			</div>

			{/* Driver Status */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Driver Status
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Current delivery status and location
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/driver/support">
								Contact Dispatch <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="text-center">
								<p className="text-muted-foreground text-xs">Status</p>
								<p
									className={`font-bold text-lg ${
										dashboard?.status === "Online"
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{dashboard?.status || "Offline"}
								</p>
							</div>
							<div className="text-center">
								<p className="text-muted-foreground text-xs">Assigned Orders</p>
								<p className="font-bold text-lg">
									{dashboard?.assignedOrders || 0}
								</p>
							</div>
							<div className="text-center">
								<p className="text-muted-foreground text-xs">Delivered</p>
								<p className="font-bold text-lg">{dashboard?.delivered || 0}</p>
							</div>
							<div className="text-center">
								<p className="text-muted-foreground text-xs">Pending</p>
								<p className="font-bold text-lg">{dashboard?.pending || 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Next Delivery */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.4 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Next Delivery
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Upcoming delivery stop
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/driver/route">
								Navigate <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{dashboard?.nextDelivery ? (
							<div className="space-y-4">
								<div className="flex items-center justify-between border-border/50 p-3">
									<div className="flex flex-col">
										<p className="font-medium text-sm">
											Order {dashboard.nextDelivery.orderId}
										</p>
										<p className="text-muted-foreground text-xs">
											{dashboard.nextDelivery.customerName}
										</p>
									</div>
									<div className="flex items-center gap-2 text-right">
										<span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 text-xs">
											COD
										</span>
										<span className="text-gray-500 text-xs">
											{dashboard.nextDelivery.estimatedDuration}
										</span>
									</div>
								</div>
								<div className="border-border/50 p-4">
									<p className="mb-1 font-medium text-muted-foreground text-xs">
										Address
									</p>
									<p className="break-all text-sm">
										{dashboard.nextDelivery.address}
									</p>
								</div>
								<div className="flex items-center justify-between border-border/50 p-4">
									<div className="flex flex-col">
										<p className="mb-1 font-medium text-muted-foreground text-xs">
											Contact
										</p>
										<p className="font-medium text-sm">
											{dashboard.nextDelivery.contactName}
										</p>
										<p className="text-xs">
											{dashboard.nextDelivery.contactPhone}
										</p>
									</div>
									<div className="text-right">
										<p className="mb-1 font-medium text-muted-foreground text-xs">
											Amount to Collect
										</p>
										<p className="font-bold text-lg">
											{formatCurrency(
												dashboard.nextDelivery.amountToCollect,
												locale,
											)}
										</p>
									</div>
								</div>
								<div className="flex items-center justify-between border-border/50 p-4">
									<div className="flex flex-col">
										<p className="mb-1 font-medium text-muted-foreground text-xs">
											Packages
										</p>
										<p className="font-medium text-sm">
											{dashboard.nextDelivery.packages}
										</p>
									</div>
									<div className="text-right">
										<p className="mb-1 font-medium text-muted-foreground text-xs">
											Items
										</p>
										<p className="font-medium text-sm">
											{dashboard.nextDelivery.items.length}
										</p>
									</div>
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
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.5 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Route Progress
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Delivery stops and completion status
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/driver/history">
								View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{dashboard?.routeStops?.length > 0 ? (
							<div className="space-y-3">
								{dashboard.routeStops.map((stop, index) => (
									<div
										key={`${stop.id}-${index}`}
										className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0"
									>
										<div className="flex items-center gap-3">
											<div
												className={`flex h-8 w-8 items-center justify-center rounded-full ${
													stop.status === "completed"
														? "bg-green-500"
														: stop.status === "next"
															? "bg-blue-500"
															: "bg-gray-400"
												}`}
											>
												{index + 1}
											</div>
											<div className="flex flex-col">
												<p className="font-medium text-sm">
													{stop.customerName}
												</p>
												<p className="text-muted-foreground text-xs">
													{stop.status === "completed"
														? "Delivered"
														: stop.status === "next"
															? "Next Stop"
															: "Pending"}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2 text-right">
											<span
												className={`text-xs ${
													stop.status === "completed"
														? "text-green-600"
														: stop.status === "next"
															? "text-blue-600"
															: "text-yellow-600"
												}`}
											>
												{stop.status === "completed"
													? "âœ“"
													: stop.status === "next"
														? "â†’"
														: "â—‹"}
											</span>
											<span className="text-gray-500 text-xs">{stop.time}</span>
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
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.6 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Collections & Returns
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Cash on Delivery and return management
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/driver/history">
								View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									COD Collected
								</p>
								<p className="font-bold text-lg">
									{formatCurrency(dashboard?.codCollected || 0, locale)}
								</p>
							</div>
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Successful Collections
								</p>
								<p className="font-bold text-lg">
									{dashboard?.successfulCollections || 0}
								</p>
							</div>
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Returns Processed
								</p>
								<p className="font-bold text-lg">
									{dashboard?.returnsProcessed || 0}
								</p>
							</div>
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Return Rate
								</p>
								<p className="font-bold text-lg">
									{dashboard?.returnRate || 0}%
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Vehicle Status */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.7 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Vehicle Status
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Current vehicle information and maintenance
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/driver/vehicle">
								View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{dashboard?.vehicleStatus ? (
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="border-border/50 p-4">
									<p className="mb-1 font-medium text-muted-foreground text-xs">
										Maintenance Status
									</p>
									<p
										className={`font-bold text-lg ${
											dashboard?.vehicleStatus?.maintenanceDue
												? "text-red-600"
												: "text-green-600"
										}`}
									>
										{dashboard?.vehicleStatus?.maintenanceDue ? "Due" : "OK"}
									</p>
								</div>
								<div className="border-border/50 p-4">
									<p className="mb-1 font-medium text-muted-foreground text-xs">
										Fuel Level
									</p>
									<p className="font-bold text-lg">
										{dashboard?.vehicleStatus?.fuelLevel || "N/A"}
									</p>
								</div>
								<div className="border-border/50 p-4">
									<p className="mb-1 font-medium text-muted-foreground text-xs">
										Odometer
									</p>
									<p className="font-bold text-lg">
										{dashboard?.vehicleStatus?.odometer || "N/A"}
									</p>
								</div>
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
								Vehicle status not available
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Notifications */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.8 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Notifications
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Dispatch messages and alerts
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/driver/support">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{dashboard?.notifications?.length > 0 ? (
							<div className="space-y-3">
								{dashboard.notifications.map((notif, index) => (
									<div
										key={index}
										className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0"
									>
										<div className="flex flex-col">
											<p className="font-medium text-sm">{notif.message}</p>
										</div>
										<div className="text-right text-gray-500 text-xs">
											{notif.time}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex h-[80px] items-center justify-center text-muted-foreground text-xs sm:h-[100px] sm:text-sm">
								No notifications
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
