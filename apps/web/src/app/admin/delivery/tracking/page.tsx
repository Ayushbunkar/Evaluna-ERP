"use client";
import { Badge } from "@evaluna/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Factory, MapPin, MapPinOff, Package, Truck } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

// Dynamic map to avoid SSR issues
const TrackingMap = dynamic(() => import("./tracking-map"), {
	ssr: false,
	loading: () => (
		<div className="flex h-full w-full animate-pulse items-center justify-center bg-muted">
			Loading map...
		</div>
	),
});

export default function TrackingPage() {
	const { data: trips } = trpc.delivery.getTrips.useQuery();
	const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

	const selectedTrip =
		trips?.find((t) => t.id === selectedTripId) || trips?.[0];

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col bg-background p-4">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="font-bold text-2xl tracking-tight">Delivery Tracking</h1>
			</div>

			<div className="mb-4 grid grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Active Trips</CardTitle>
						<Truck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{trips?.filter((t) => t.status === "in_transit").length || 0}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Currently on road
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Stops</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{trips?.reduce((acc, trip) => acc + trip.stops.length, 0) || 0}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Across all trips
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Completed</CardTitle>
						<MapPin className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{trips?.reduce(
								(acc, trip) =>
									acc +
									trip.stops.filter((s) => s.status === "delivered").length,
								0,
							) || 0}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Deliveries successful
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Failed</CardTitle>
						<MapPinOff className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-red-600">
							{trips?.reduce(
								(acc, trip) =>
									acc + trip.stops.filter((s) => s.status === "failed").length,
								0,
							) || 0}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Requires attention
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="flex h-[calc(100%-140px)] gap-4 overflow-hidden">
				<Card className="flex h-full w-1/3 flex-col overflow-hidden shadow-sm">
					<CardHeader className="py-4">
						<CardTitle className="text-lg">Active Trips</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-1 flex-col gap-4 overflow-auto p-4">
						{trips?.map((trip) => (
							<div
								key={trip.id}
								className={`cursor-pointer rounded-lg border p-4 transition-colors ${selectedTripId === trip.id || (selectedTripId === null && selectedTrip?.id === trip.id) ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
								onClick={() => setSelectedTripId(trip.id)}
							>
								<div className="mb-2 flex items-center justify-between">
									<div className="flex items-center gap-2 font-bold">
										<Truck className="h-5 w-5 text-primary" />
										{trip.vehicle}
									</div>
									<Badge
										variant={
											trip.status === "in_transit" ? "default" : "secondary"
										}
									>
										{trip.status}
									</Badge>
								</div>
								<div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
									Driver: {trip.driverName}
								</div>
								<div className="text-muted-foreground text-xs">
									Stops:{" "}
									{trip.stops.filter((s) => s.status === "delivered").length}/
									{trip.stops.length} completed
								</div>
							</div>
						))}

						{selectedTrip && (
							<div className="mt-4 border-t pt-4">
								<h3 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
									Stop Sequence
								</h3>
								<div className="relative flex flex-col gap-4 before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-border">
									<div className="relative z-10 flex items-start gap-3">
										<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow">
											<Factory className="h-3 w-3" />
										</div>
										<div className="text-sm">
											<div className="font-medium">
												{selectedTrip.warehouse.name}
											</div>
											<div className="text-muted-foreground">
												Warehouse Origin
											</div>
										</div>
									</div>
									{selectedTrip.stops.map((stop) => (
										<div
											key={stop.id}
											className="relative z-10 flex items-start gap-3"
										>
											<div
												className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow ${stop.status === "delivered" ? "bg-green-500" : stop.status === "failed" ? "bg-red-500" : "bg-gray-400"}`}
											>
												{stop.status === "delivered" ? (
													<MapPin className="h-3 w-3" />
												) : stop.status === "failed" ? (
													<MapPinOff className="h-3 w-3" />
												) : (
													<Package className="h-3 w-3" />
												)}
											</div>
											<div className="text-sm">
												<div className="font-medium">{stop.customer}</div>
												<div className="line-clamp-1 text-muted-foreground">
													{stop.address}
												</div>
												<Badge
													variant="outline"
													className={`mt-1 text-[10px] capitalize ${stop.status === "delivered" ? "border-green-200 text-green-600" : stop.status === "failed" ? "border-red-200 text-red-600" : "text-gray-600"}`}
												>
													{stop.status}
												</Badge>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="h-full flex-1 overflow-hidden p-0 shadow-sm">
					{selectedTrip ? (
						<div className="h-full w-full overflow-hidden rounded-lg">
							<TrackingMap trip={selectedTrip} />
						</div>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
							<MapPin className="mb-4 h-12 w-12 opacity-20" />
							<p>Select a trip from the sidebar to view tracking</p>
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
