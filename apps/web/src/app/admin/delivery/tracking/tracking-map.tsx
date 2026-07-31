"use client";
import L from "leaflet";
import { useEffect } from "react";
import {
	MapContainer,
	Marker,
	Polyline,
	Popup,
	TileLayer,
	useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { trpc } from "@/lib/trpc/client";

// Custom Icons using SVG
const createIcon = (color: string, iconHtml: string) =>
	L.divIcon({
		html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${iconHtml}</div>`,
		className: "custom-leaflet-icon",
		iconSize: [32, 32],
		iconAnchor: [16, 16],
		popupAnchor: [0, -16],
	});

const warehouseIcon = createIcon(
	"#3b82f6",
	`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-5-7 5v12"/></svg>`,
);
const pendingIcon = createIcon(
	"#9ca3af",
	`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-5.16-5.16a2 2 0 0 0-2.83 0l-5.16 5.16"/><circle cx="12" cy="12" r="10"/></svg>`,
);
const deliveredIcon = createIcon(
	"#22c55e",
	`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
);
const failedIcon = createIcon(
	"#ef4444",
	`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
);
const truckIcon = createIcon(
	"#f59e0b",
	`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
);

function MapUpdater({
	center,
	zoom,
}: {
	center: [number, number];
	zoom: number;
}) {
	const map = useMap();
	useEffect(() => {
		map.setView(center, zoom);
	}, [center, zoom, map]);
	return null;
}

export default function TrackingMap({ trip }: { trip: any }) {
	const { data: tracking } = trpc.delivery.getTrackingData.useQuery(
		{ trip_id: trip.id },
		{ refetchInterval: 5000 }, // Poll every 5s
	);

	const getStopIcon = (status: string) => {
		if (status === "delivered") return deliveredIcon;
		if (status === "failed") return failedIcon;
		return pendingIcon;
	};

	const center: [number, number] = [trip.warehouse.lat, trip.warehouse.lng];
	const polylinePositions: [number, number][] = [
		[trip.warehouse.lat, trip.warehouse.lng],
		...trip.stops.map((s: any) => [s.lat, s.lng] as [number, number]),
	];

	return (
		<MapContainer
			center={center}
			zoom={12}
			style={{ height: "100%", width: "100%", zIndex: 0 }}
		>
			<TileLayer
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			/>

			<MapUpdater center={center} zoom={12} />

			{/* Warehouse */}
			<Marker
				position={[trip.warehouse.lat, trip.warehouse.lng]}
				icon={warehouseIcon}
			>
				<Popup>
					<div className="font-bold">{trip.warehouse.name}</div>
					<div className="text-muted-foreground text-sm">Origin Warehouse</div>
				</Popup>
			</Marker>

			{/* Route Line */}
			<Polyline
				positions={polylinePositions}
				color="#3b82f6"
				weight={4}
				dashArray="8, 8"
				opacity={0.6}
			/>

			{/* Stops */}
			{trip.stops.map((stop: any) => (
				<Marker
					key={stop.id}
					position={[stop.lat, stop.lng]}
					icon={getStopIcon(stop.status)}
				>
					<Popup>
						<div className="font-bold">{stop.customer}</div>
						<div className="text-sm">{stop.address}</div>
						<div
							className={`mt-1 font-bold text-xs uppercase ${stop.status === "delivered" ? "text-green-600" : stop.status === "failed" ? "text-red-600" : "text-gray-600"}`}
						>
							{stop.status}
						</div>
					</Popup>
				</Marker>
			))}

			{/* Moving Truck (Live tracking) */}
			{tracking && (
				<Marker
					position={[
						Number.parseFloat(tracking.lat),
						Number.parseFloat(tracking.lng),
					]}
					icon={truckIcon}
				>
					<Popup>
						<div className="font-bold">{trip.vehicle}</div>
						<div className="text-sm">Driver: {trip.driverName}</div>
						<div className="mt-1 text-muted-foreground text-xs">
							Live Location
						</div>
					</Popup>
				</Marker>
			)}
		</MapContainer>
	);
}
