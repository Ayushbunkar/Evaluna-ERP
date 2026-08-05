"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon issues in Next.js
const customIcon = new L.Icon({
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

interface Trip {
	id: number;
	driver: {
		name: string;
		email: string;
	};
	latestLog?: {
		lat: string;
		lng: string;
		speed?: string;
		battery_level?: number;
		timestamp: string;
	};
}

export default function LiveMap({ trips }: { trips: Trip[] }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	// Default center (can be dynamically set based on branch or first trip)
	const defaultCenter: [number, number] = [28.6139, 77.209]; // Default to New Delhi if no trips

	const activeMarkers = trips.filter(
		(t) => t.latestLog && t.latestLog.lat && t.latestLog.lng
	);

	const center: [number, number] =
		activeMarkers.length > 0
			? [
					Number.parseFloat(activeMarkers[0].latestLog!.lat),
					Number.parseFloat(activeMarkers[0].latestLog!.lng),
				]
			: defaultCenter;

	return (
		<MapContainer
			center={center}
			zoom={13}
			scrollWheelZoom={true}
			className="h-full w-full z-0 relative"
			style={{ minHeight: "500px" }}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			
			{activeMarkers.map((trip) => (
				<Marker
					key={trip.id}
					position={[
						Number.parseFloat(trip.latestLog!.lat),
						Number.parseFloat(trip.latestLog!.lng),
					]}
					icon={customIcon}
				>
					<Popup>
						<div className="flex flex-col gap-1 p-1">
							<h3 className="font-semibold text-sm">{trip.driver.name}</h3>
							<div className="text-xs text-muted-foreground">
								<p>Speed: {trip.latestLog?.speed ?? "0"} km/h</p>
								<p>Battery: {trip.latestLog?.battery_level ?? "N/A"}%</p>
								<p>
									Updated:{" "}
									{new Date(trip.latestLog!.timestamp).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						</div>
					</Popup>
				</Marker>
			))}
		</MapContainer>
	);
}
