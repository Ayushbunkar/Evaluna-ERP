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
	ArchiveIcon,
	CheckCircle2Icon,
	ClockIcon,
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

export default function LoadingHistoryPage() {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");

	const {
		data: history = [],
		isLoading,
	} = trpc.loader.getLoadingHistory.useQuery(
		{ search: searchQuery },
		{ refetchInterval: 15000 },
	);

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="font-bold text-2xl tracking-tight text-foreground sm:text-3xl">
					Loading History
				</h1>
				<p className="text-muted-foreground text-sm">
					Review historical record of completed vehicle loadings and dispatched trips.
				</p>
			</div>

			{/* Search & Filter Bar */}
			<Card className="border-border/60 shadow-xs">
				<CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="relative w-full sm:w-80">
						<SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search Trip ID, Route, Driver, Vehicle..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-8 pl-8 text-xs rounded-lg"
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						Showing <strong>{history.length}</strong> loaded trips
					</p>
				</CardContent>
			</Card>

			{/* History Table */}
			<Card className="border-border/60 shadow-sm">
				<CardHeader className="border-b pb-4">
					<CardTitle className="text-xl font-bold flex items-center gap-2">
						<ArchiveIcon className="h-5 w-5 text-primary" />
						Completed Vehicle Loadings
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary mb-2" />
							<p className="text-sm font-medium">Loading history records...</p>
						</div>
					) : history.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
							<ArchiveIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
							<p className="font-semibold text-base">No loading history available.</p>
							<p className="text-xs text-muted-foreground mt-1">
								Trips marked as Loaded will appear here permanently.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="font-semibold text-xs">TRIP ID</TableHead>
										<TableHead className="font-semibold text-xs">ROUTE</TableHead>
										<TableHead className="font-semibold text-xs">DRIVER</TableHead>
										<TableHead className="font-semibold text-xs">VEHICLE</TableHead>
										<TableHead className="font-semibold text-xs">ORDERS</TableHead>
										<TableHead className="font-semibold text-xs">LOADED AT</TableHead>
										<TableHead className="font-semibold text-xs">STATUS</TableHead>
										<TableHead className="font-semibold text-xs text-right">ACTION</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{history.map((h: any) => (
										<TableRow key={h.tripId} className="hover:bg-muted/40 transition-colors">
											<TableCell className="font-mono font-bold text-xs text-foreground">
												Trip #{h.tripId}
											</TableCell>
											<TableCell className="font-medium text-xs text-foreground">
												{h.routeName}
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												<div className="flex items-center gap-1.5">
													<UserIcon className="h-3.5 w-3.5 text-primary" />
													<span>{h.driverName}</span>
												</div>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												<div className="flex items-center gap-1.5">
													<TruckIcon className="h-3.5 w-3.5 text-primary" />
													<span>{h.vehicle}</span>
												</div>
											</TableCell>
											<TableCell className="text-xs font-semibold">
												<span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-primary">
													<PackageIcon className="h-3 w-3" />
													{h.ordersCount} Orders
												</span>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground font-mono">
												{h.loadedAt ? new Date(h.loadedAt).toLocaleString() : "—"}
											</TableCell>
											<TableCell>
												<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
													<CheckCircle2Icon className="h-3 w-3" />
													{h.status.replace(/_/g, " ")}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Link href={`/loader/loading/${h.tripId}`}>
													<Button variant="ghost" size="sm" className="h-7 text-xs font-semibold">
														View Manifest
													</Button>
												</Link>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
