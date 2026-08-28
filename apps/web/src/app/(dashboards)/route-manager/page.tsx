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
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	MapPinIcon,
	PackageIcon,
	RefreshCwIcon,
	TruckIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion, PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function RouteManagerDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: trips,
		isLoading,
		error,
	} = trpc.routeAudit.listTrips.useQuery(undefined, {
		suspense: true,
	});

	if (isLoading) {
		return (
			<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
				<div className="flex h-[400px] items-center justify-center text-muted-foreground">
					Loading route manager dashboard...
				</div>
			</PageTransition>
		);
	}

	if (error) {
		return (
			<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
				<div className="flex h-[400px] items-center justify-center text-destructive">
					Error loading dashboard: {error.message}
				</div>
			</PageTransition>
		);
	}

	// Calculate summary statistics
	const totalTrips = trips?.length || 0;
	const activeTrips = trips?.filter((t) => t.status === "active")?.length || 0;
	const completedTrips =
		trips?.filter((t) => t.status === "completed")?.length || 0;
	const pendingTrips =
		trips?.filter((t) => t.status === "pending")?.length || 0;
	const tripsWithDeviation = trips?.filter((t) => t.has_deviation)?.length || 0;

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Route Manager Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Route planning, trip monitoring, and deviation management
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Route Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/route-manager/trips">
							<MapPinIcon className="mr-2 h-4 w-4" /> View All Trips
						</Link>
					</Button>
				</div>
			</div>

			{/* Summary Stats */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{/* Total Trips */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
								<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
									<UsersIcon className="h-6 w-6 text-blue-500" />
								</div>
								<h3 className="font-semibold text-base sm:text-lg">
									Total Trips
								</h3>
								<p className="font-bold text-2xl">{totalTrips}</p>
							</div>
						</CardContent>
					</Card>

					{/* Active Trips */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
								<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
									<ActivityIcon className="h-6 w-6 text-green-500" />
								</div>
								<h3 className="font-semibold text-base sm:text-lg">
									Active Trips
								</h3>
								<p className="font-bold text-2xl">{activeTrips}</p>
							</div>
						</CardContent>
					</Card>

					{/* Completed Trips */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
								<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-500/10">
									<CheckCircleIcon className="h-6 w-6 text-gray-500" />
								</div>
								<h3 className="font-semibold text-base sm:text-lg">
									Completed Trips
								</h3>
								<p className="font-bold text-2xl">{completedTrips}</p>
							</div>
						</CardContent>
					</Card>

					{/* Trips with Deviations */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
								<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
									<AlertTriangleIcon className="h-6 w-6 text-red-500" />
								</div>
								<h3 className="font-semibold text-base sm:text-lg">
									Deviations
								</h3>
								<p
									className={`font-bold text-2xl ${
										tripsWithDeviation > 0 ? "text-red-600" : "text-green-600"
									}`}
								>
									{tripsWithDeviation}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</motion.div>

			{/* Active Trips List */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.4 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Active Trips
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Currently active delivery trips
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/route-manager/trips">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{activeTrips > 0 ? (
							<div className="space-y-3">
								{trips
									?.filter((t) => t.status === "active")
									?.map((trip) => (
										<div
											key={trip.id}
											className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0"
										>
											<div className="flex flex-col">
												<p className="font-medium text-sm">Trip #{trip.id}</p>
												<p className="text-muted-foreground text-xs">
													Route: {trip.route_id} â€¢ Driver: {trip.driver_id}
												</p>
											</div>
											<div className="flex items-center gap-2 text-right">
												<span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800 text-xs">
													Active
												</span>
												<span className="text-gray-500 text-xs">
													{new Date(trip.created_at).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
											</div>
										</div>
									))}
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
								No active trips
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Deviations */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.5 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Route Deviations
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Trips with planned vs actual deviations
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/route-manager/deviations">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{tripsWithDeviation > 0 ? (
							<div className="space-y-3">
								{trips
									?.filter((t) => t.has_deviation)
									?.map((trip) => (
										<div
											key={trip.id}
											className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0"
										>
											<div className="flex flex-col">
												<p className="font-medium text-sm">Trip #{trip.id}</p>
												<p className="text-muted-foreground text-xs">
													Stops: {trip.completed_stops}/{trip.expected_stops} (
													{trip.stops_deviation >= 0 ? "+" : ""}
													{trip.stops_deviation})<br />
													Cash:{" "}
													{formatCurrency(
														trip.actual_cash_collection ?? 0,
														locale,
													)}{" "}
													vs{" "}
													{formatCurrency(
														trip.expected_cash_collection ?? 0,
														locale,
													)}{" "}
													({trip.cash_deviation >= 0 ? "+" : ""}
													{formatCurrency(
														Math.abs(trip.cash_deviation),
														locale,
													)}
													)
												</p>
											</div>
											<div className="flex items-center gap-2 text-right">
												<span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800 text-xs">
													Deviation
												</span>
												<span className="text-gray-500 text-xs">
													{new Date(trip.created_at).toLocaleDateString([], {
														month: "short",
														day: "numeric",
													})}
												</span>
											</div>
										</div>
									))}
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
								No route deviations
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Recent Activity */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.6 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Recent Activity
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Latest trip updates and status changes
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/route-manager/reports">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{trips?.length > 0 ? (
							<div className="space-y-3">
								{trips?.slice(0, 5)?.map((trip) => (
									<div
										key={trip.id}
										className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0"
									>
										<div className="flex flex-col">
											<p className="font-medium text-sm">Trip #{trip.id}</p>
											<p className="text-muted-foreground text-xs">
												Status:{" "}
												{trip.status.charAt(0).toUpperCase() +
													trip.status.slice(1)}
											</p>
										</div>
										<div className="flex items-center gap-2 text-right">
											<span
												className={`rounded-full px-2 py-0.5 text-xs ${
													trip.status === "active"
														? "bg-green-100 text-green-800"
														: trip.status === "completed"
															? "bg-gray-100 text-gray-800"
															: trip.status === "pending"
																? "bg-yellow-100 text-yellow-800"
																: "bg-blue-100 text-blue-800"
												}`}
											>
												{trip.status.charAt(0).toUpperCase() +
													trip.status.slice(1)}
											</span>
											<span className="text-gray-500 text-xs">
												{new Date(
													trip.updated_at || trip.created_at,
												).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
								No recent activity
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
