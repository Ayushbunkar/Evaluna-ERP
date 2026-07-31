"use client";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	AlertTriangle,
	CheckCircle2,
	MapPin,
	Navigation2,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";

export default function DriverMapPage() {
	const [tripId] = useState<number>(1); // Mock active trip ID for the driver
	const { data: trips } = trpc.delivery.getTrips.useQuery();
	const updateLocation = trpc.delivery.updateVehicleLocation.useMutation();
	const updateStop = trpc.delivery.updateStopStatus.useMutation();

	const [currentLocation, setCurrentLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [geoError, setGeoError] = useState<string | null>(null);

	const activeTrip = trips?.find((t) => t.id === tripId);
	const nextStop = activeTrip?.stops.find((s) => s.status === "pending");

	useEffect(() => {
		if (!navigator.geolocation) {
			setGeoError("Geolocation is not supported by your browser");
			return;
		}

		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				setCurrentLocation({ lat: latitude, lng: longitude });

				// Push to server
				updateLocation.mutate({
					trip_id: tripId,
					lat: latitude,
					lng: longitude,
				});
			},
			(error) => {
				setGeoError(error.message);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0,
			},
		);

		// Fallback interval just in case watchPosition doesn't fire often enough
		const interval = setInterval(() => {
			navigator.geolocation.getCurrentPosition((position) => {
				const { latitude, longitude } = position.coords;
				updateLocation.mutate({
					trip_id: tripId,
					lat: latitude,
					lng: longitude,
				});
			});
		}, 10000);

		return () => {
			navigator.geolocation.clearWatch(watchId);
			clearInterval(interval);
		};
	}, [tripId, updateLocation]);

	const handleStopStatus = (status: "reached" | "delivered" | "failed") => {
		if (!nextStop) return;
		updateStop.mutate({ stop_id: nextStop.id, status });
		// In a real app we'd invalidate the trips query here or optimistically update
	};

	return (
		<div className="flex min-h-screen flex-col bg-gray-50 p-4">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-bold text-2xl">Driver App</h1>
				<Badge variant={currentLocation ? "default" : "destructive"}>
					{currentLocation ? "GPS Active" : "GPS Inactive"}
				</Badge>
			</div>

			{geoError && (
				<div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-600 text-sm">
					<AlertTriangle className="h-4 w-4 shrink-0" />
					{geoError}
				</div>
			)}

			{activeTrip && nextStop ? (
				<Card className="flex flex-1 flex-col border-primary/20 shadow-lg">
					<CardHeader className="border-b bg-primary/5 pb-4">
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="flex items-center gap-2 text-primary text-xl">
									<Navigation2 className="h-5 w-5" />
									Next Stop
								</CardTitle>
								<p className="mt-1 text-muted-foreground text-sm">
									Stop ID: #{nextStop.id}
								</p>
							</div>
							<Badge variant="secondary" className="text-sm">
								Pending
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="flex flex-1 flex-col justify-center py-8">
						<div className="mb-8 text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
								<MapPin className="h-8 w-8 text-primary" />
							</div>
							<h2 className="mb-2 font-bold text-2xl">{nextStop.customer}</h2>
							<p className="mx-auto max-w-[250px] text-lg text-muted-foreground">
								{nextStop.address}
							</p>
						</div>

						{currentLocation && (
							<div className="rounded-lg bg-muted p-4 text-center text-muted-foreground text-sm">
								<p>Your Location</p>
								<p className="mt-1 font-mono">
									{currentLocation.lat.toFixed(6)},{" "}
									{currentLocation.lng.toFixed(6)}
								</p>
							</div>
						)}
					</CardContent>
					<CardFooter className="flex flex-col gap-3 border-t bg-gray-50/50 pt-6">
						<Button
							className="h-14 w-full text-lg"
							size="lg"
							onClick={() => handleStopStatus("delivered")}
						>
							<CheckCircle2 className="mr-2 h-6 w-6" />
							Mark Delivered
						</Button>
						<div className="flex w-full gap-3">
							<Button
								variant="outline"
								className="h-12 flex-1"
								onClick={() => handleStopStatus("reached")}
							>
								Reached
							</Button>
							<Button
								variant="destructive"
								className="h-12 flex-1"
								onClick={() => handleStopStatus("failed")}
							>
								<XCircle className="mr-2 h-4 w-4" />
								Failed
							</Button>
						</div>
					</CardFooter>
				</Card>
			) : activeTrip && !nextStop ? (
				<Card className="flex flex-1 flex-col items-center justify-center py-12 shadow-sm">
					<CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
					<h2 className="font-bold text-2xl">All Done!</h2>
					<p className="mt-2 max-w-[250px] text-center text-muted-foreground">
						You have completed all deliveries for this trip.
					</p>
				</Card>
			) : (
				<div className="flex flex-1 items-center justify-center">
					<p className="animate-pulse text-muted-foreground">
						Loading trip data...
					</p>
				</div>
			)}
		</div>
	);
}
