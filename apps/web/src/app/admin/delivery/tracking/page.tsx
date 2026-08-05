// @ts-nocheck
"use client";

import { MapIcon, BatteryCharging, Navigation, BatteryMedium } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { MapWrapper } from "@/components/delivery/map-wrapper";
import { Badge } from "@evaluna/ui/components/badge";

export default function DeliveryTrackingPage() {
	const { data: trips, isLoading } = trpc.delivery.activeTrips.useQuery(undefined, {
		refetchInterval: 10000, // Refetch every 10 seconds for live updates
	});

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col gap-6 p-6">
			<div className="flex shrink-0 items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
					<MapIcon className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Live Tracking
					</h1>
					<p className="text-muted-foreground text-sm">
						Real-time map tracking for active deliveries.
					</p>
				</div>
			</div>
			
			<div className="flex flex-1 gap-6 overflow-hidden">
				{/* Sidebar for Active Drivers */}
				<div className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-4 shadow-sm">
					<h3 className="font-semibold text-lg">Active Drivers</h3>
					
					{isLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-20 w-full rounded-lg" />
							<Skeleton className="h-20 w-full rounded-lg" />
						</div>
					) : trips && trips.length > 0 ? (
						<div className="flex flex-col gap-3">
							{trips.map((trip) => (
								<div
									key={trip.id}
									className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/50"
								>
									<div className="flex items-center justify-between">
										<p className="font-medium text-sm">
											{trip.driver?.name ?? "Unknown Driver"}
										</p>
										{trip.latestLog?.battery_level && (
											<div className="flex items-center gap-1 text-xs text-muted-foreground">
												<BatteryMedium className="h-3 w-3" />
												{trip.latestLog.battery_level}%
											</div>
										)}
									</div>
									
									<div className="flex items-center justify-between">
										<Badge variant="outline" className="text-xs">
											Trip #{trip.id}
										</Badge>
										<div className="flex items-center gap-1 text-xs text-muted-foreground">
											<Navigation className="h-3 w-3" />
											{trip.latestLog?.speed ?? "0"} km/h
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
							<p className="text-sm">No active deliveries</p>
						</div>
					)}
				</div>

				{/* Live Map */}
				<div className="flex-1 rounded-xl">
					{isLoading ? (
						<Skeleton className="h-full w-full rounded-xl" />
					) : (
						<MapWrapper trips={trips || []} />
					)}
				</div>
			</div>
		</div>
	);
}


