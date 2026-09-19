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
	ClockIcon,
	Loader2Icon,
	PackageIcon,
	RouteIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function LoaderDashboard() {
	const trpc = useTRPC();
	const { data: stats, isLoading: isLoadingStats } =
		trpc.loader.getDashboardStats.useQuery(undefined, {
			refetchInterval: 15000,
		});

	const {
		data: loadingQueue = [],
		isLoading: isLoadingQueue,
	} = trpc.loader.getLoadingQueue.useQuery(undefined, {
		refetchInterval: 10000,
	});

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="font-bold text-2xl tracking-tight text-foreground sm:text-3xl">
					Loader Dashboard
				</h1>
				<p className="text-muted-foreground text-sm">
					Manage vehicle loading and confirm dispatched orders into assigned delivery trips.
				</p>
			</div>

			{/* KPI Metrics Cards */}
			<StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StaggerItem>
					<AnimatedCard className="border-border/60 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Ready for Loading
								</p>
								<h3 className="mt-1 font-bold text-2xl text-foreground">
									{isLoadingStats ? "..." : `${stats?.readyForLoadingTrips || 0} Trips`}
								</h3>
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
									Currently Loading
								</p>
								<h3 className="mt-1 font-bold text-2xl text-amber-600 dark:text-amber-400">
									{isLoadingStats ? "..." : `${stats?.currentlyLoadingTrips || 0} Trips`}
								</h3>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
								<ClockIcon className="h-6 w-6 animate-pulse" />
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
								<h3 className="mt-1 font-bold text-2xl text-emerald-600 dark:text-emerald-400">
									{isLoadingStats ? "..." : `${stats?.loadedTodayTrips || 0} Trips`}
								</h3>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
								<CheckCircle2Icon className="h-6 w-6" />
							</div>
						</div>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard className="border-border/60 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Pending Verification
								</p>
								<h3 className="mt-1 font-bold text-2xl text-purple-600 dark:text-purple-400">
									{isLoadingStats ? "..." : `${stats?.pendingVerificationOrders || 0} Orders`}
								</h3>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
								<PackageIcon className="h-6 w-6" />
							</div>
						</div>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Main Loading Queue Section */}
			<Card className="border-border/60 shadow-sm">
				<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-xl font-bold">
							<TruckIcon className="h-5 w-5 text-primary" />
							Trips Ready for Loading
						</CardTitle>
						<CardDescription className="text-xs">
							Manager created delivery trips awaiting physical vehicle loading verification.
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
		</PageTransition>
	);
}
