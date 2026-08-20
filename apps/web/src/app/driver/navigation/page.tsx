"use client";

import { Button } from "@evaluna/ui/components/button";
import { ArrowLeftIcon, MapIcon, Navigation2Icon, PhoneIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";

export default function NavigationPage() {
	const { data: dashboardData, isLoading } = trpc.driver.getMobileDashboard.useQuery({});
	const logGPS = trpc.driver.logGPSPosition.useMutation();

	const [position, setPosition] = useState<GeolocationPosition | null>(null);
	const [geoError, setGeoError] = useState<string | null>(null);

	// Start Live GPS Tracking
	useEffect(() => {
		if (!navigator.geolocation) {
			setGeoError("Geolocation is not supported by your browser");
			return;
		}

		const watchId = navigator.geolocation.watchPosition(
			(pos) => {
				setPosition(pos);
				// Optionally sync to backend periodically if the speed/location changes significantly
				// To save API calls, we'll sync roughly every 15 seconds or so depending on the device's polling rate
				logGPS.mutate({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
					speed: pos.coords.speed,
					heading: pos.coords.heading
				});
			},
			(err) => {
				setGeoError(err.message);
			},
			{ enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
		);

		return () => navigator.geolocation.clearWatch(watchId);
	}, []);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-muted/30">
				<Loader2Icon className="h-10 w-10 animate-spin text-primary" />
			</div>
		);
	}

	const nextDelivery = dashboardData?.nextDelivery;

	// OpenStreetMap Embed URL centered on driver's live location
	// Fallback to Mumbai (19.0760, 72.8777) if location is not yet acquired
	const lat = position?.coords.latitude || 19.0760;
	const lng = position?.coords.longitude || 72.8777;
	const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;

	return (
		<div className="flex h-screen flex-col bg-muted/30 relative overflow-hidden">
			{/* Floating Header */}
			<header className="absolute top-0 left-0 right-0 z-10 flex items-center gap-4 bg-gradient-to-b from-background/90 via-background/50 to-transparent p-4 pb-12 pointer-events-none">
				<Button variant="secondary" size="icon" className="rounded-full shadow-lg pointer-events-auto" asChild>
					<Link href="/driver/route">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				{geoError && (
					<div className="bg-destructive/90 text-destructive-foreground text-xs px-3 py-1.5 rounded-full font-medium">
						GPS Error: {geoError}
					</div>
				)}
			</header>

			{/* Live Map Area */}
			<main className="relative flex-1 bg-muted">
				{/* OpenStreetMap iframe rendering the live GPS location */}
				<iframe 
					src={mapSrc}
					className="absolute inset-0 w-full h-full border-0 grayscale-[20%]"
					title="Live Navigation Map"
					loading="lazy"
				/>

				{/* Floating Bottom Card */}
				<div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t bg-background p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-20">
					{nextDelivery ? (
						<>
							<div className="mb-6 flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-bold text-foreground">
										{position?.coords.speed ? Math.round(position.coords.speed * 3.6) : "0"} km/h
									</h2>
									<p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
										<Navigation2Icon className="h-4 w-4" /> 
										Live Tracking Active
									</p>
								</div>
								<Button size="icon" variant="outline" className="h-12 w-12 rounded-full border-primary/20 text-primary">
									<MapIcon className="h-5 w-5" />
								</Button>
							</div>

							<div className="mb-6 rounded-xl bg-primary/5 p-4 border border-primary/10">
								<p className="font-semibold text-lg line-clamp-1">{nextDelivery.address}</p>
								<p className="text-sm text-muted-foreground mt-1">Drop-off for <span className="font-medium text-foreground">{nextDelivery.customerName}</span></p>
							</div>

							<div className="flex gap-3">
								<Button variant="destructive" className="flex-1 py-6 text-lg rounded-xl font-semibold bg-red-500/10 text-red-600 hover:bg-red-500/20" asChild>
									<Link href="/driver/scan">
										Exit
									</Link>
								</Button>
								<Button variant="default" className="flex-[2] py-6 text-lg rounded-xl font-semibold shadow-lg shadow-primary/25" asChild>
									<a href={`tel:${nextDelivery.phone || ""}`}>
										<PhoneIcon className="mr-2 h-5 w-5" /> Contact Customer
									</a>
								</Button>
							</div>
						</>
					) : (
						<div className="text-center py-6">
							<h3 className="text-lg font-bold">No Active Route</h3>
							<p className="text-muted-foreground mb-6">You don't have a next drop-off assigned right now.</p>
							<Button variant="default" className="w-full py-6 text-lg rounded-xl" asChild>
								<Link href="/driver">Return to Dashboard</Link>
							</Button>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
