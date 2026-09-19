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
	ArrowRightIcon,
	CheckCircle2Icon,
	ClockIcon,
	FilterIcon,
	Loader2Icon,
	PackageIcon,
	SearchIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function LoadingQueuePage() {
	const trpc = useTRPC();
	const [statusFilter, setStatusFilter] = useState<"all" | "ready_for_loading" | "loading" | "loaded">("all");
	const [searchQuery, setSearchQuery] = useState("");

	const {
		data: loadingQueue = [],
		isLoading,
		refetch,
	} = trpc.loader.getLoadingQueue.useQuery(
		{ status: statusFilter, search: searchQuery },
		{ refetchInterval: 10000 },
	);

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="font-bold text-2xl tracking-tight text-foreground sm:text-3xl">
					Loading Queue
				</h1>
				<p className="text-muted-foreground text-sm">
					View and process manager-dispatched trips ready for vehicle loading verification.
				</p>
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
							All Trips
						</Button>
						<Button
							size="sm"
							variant={statusFilter === "ready_for_loading" ? "default" : "outline"}
							className={`h-8 text-xs font-semibold rounded-lg ${
								statusFilter !== "ready_for_loading" ? "border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300" : ""
							}`}
							onClick={() => setStatusFilter("ready_for_loading")}
						>
							Ready for Loading
						</Button>
						<Button
							size="sm"
							variant={statusFilter === "loading" ? "default" : "outline"}
							className={`h-8 text-xs font-semibold rounded-lg ${
								statusFilter !== "loading" ? "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300" : ""
							}`}
							onClick={() => setStatusFilter("loading")}
						>
							Currently Loading
						</Button>
						<Button
							size="sm"
							variant={statusFilter === "loaded" ? "default" : "outline"}
							className={`h-8 text-xs font-semibold rounded-lg ${
								statusFilter !== "loaded" ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300" : ""
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
							placeholder="Search Trip ID, Route, Driver, Vehicle..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-8 pl-8 text-xs rounded-lg"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Queue Cards Grid */}
			<Card className="border-border/60 shadow-sm">
				<CardHeader className="border-b pb-4">
					<CardTitle className="text-xl font-bold flex items-center justify-between">
						<span className="flex items-center gap-2">
							<TruckIcon className="h-5 w-5 text-primary" />
							Dispatched Trips ({loadingQueue.length})
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-6">
					{isLoading ? (
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
		</PageTransition>
	);
}
