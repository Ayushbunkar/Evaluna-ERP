"use client";

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
import L from "leaflet";
import { BatteryFullIcon, UserCheckIcon } from "lucide-react";

// Fix Leaflet's default icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
	iconUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
	shadowUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// A custom pulsing icon for the warehouse/hub
const hubIcon = new L.DivIcon({
	html: `<div class="relative h-6 w-6">
          <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          <div class="relative h-6 w-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
          </div>
        </div>`,
	className: "hub-icon-marker",
	iconSize: [24, 24],
	iconAnchor: [12, 12],
});

// A custom icon generator for drivers
const createDriverIcon = (status: string) => {
	const color =
		status === "delivering"
			? "bg-amber-500"
			: status === "idle"
				? "bg-slate-400"
				: "bg-emerald-500";
	return new L.DivIcon({
		html: `<div class="relative group">
            <div class="h-4 w-4 rounded-full border-2 border-white shadow-lg ${color}"></div>
          </div>`,
		className: "driver-icon-marker",
		iconSize: [16, 16],
		iconAnchor: [8, 8],
	});
};

const createDestinationIcon = () => {
	return new L.DivIcon({
		html: `<div class="h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow-md"></div>`,
		className: "dest-icon-marker",
		iconSize: [12, 12],
		iconAnchor: [6, 6],
	});
};

// Component to dynamically fit bounds
function FitBounds({ drivers }: { drivers: any[] }) {
	const map = useMap();
	useEffect(() => {
		if (drivers && drivers.length > 0) {
			const bounds = L.latLngBounds([[19.076, 72.8777]]); // Hub
			drivers.forEach((d) => {
				if (d.currentLocation) {
					bounds.extend([d.currentLocation.lat, d.currentLocation.lng]);
				}
				if (d.destination) {
					bounds.extend([d.destination.lat, d.destination.lng]);
				}
			});
			map.fitBounds(bounds, { padding: [50, 50] });
		}
	}, [drivers, map]);
	return null;
}

export default function MapComponent({ drivers }: { drivers: any[] }) {
	// Mumbai Hub
	const hubLocation: [number, number] = [19.076, 72.8777];

	return (
		<div className="relative z-0 h-full w-full">
			<MapContainer
				center={hubLocation}
				zoom={12}
				style={{
					height: "100%",
					width: "100%",
					borderRadius: "inherit",
					zIndex: 0,
				}}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					className="map-tiles"
				/>

				<FitBounds drivers={drivers} />

				{/* Hub Marker */}
				<Marker position={hubLocation} icon={hubIcon}>
					<Popup>
						<div className="font-semibold text-gray-900">Main Hub (Mumbai)</div>
						<div className="text-gray-500 text-xs">Dispatch Center</div>
					</Popup>
				</Marker>

				{/* Drivers and Routes */}
				{drivers?.map((driver) => {
					if (!driver.currentLocation || !driver.route) return null;

					const routePositions: [number, number][] = driver.route.map(
						(r: any) => [r.lat, r.lng],
					);

					return (
						<div key={driver.id}>
							{/* Route line */}
							<Polyline
								positions={routePositions}
								color={driver.status === "delivering" ? "#f59e0b" : "#10b981"}
								weight={3}
								opacity={0.6}
								dashArray="5, 10"
							/>

							{/* Destination Marker */}
							{driver.destination && (
								<Marker
									position={[driver.destination.lat, driver.destination.lng]}
									icon={createDestinationIcon()}
								>
									<Popup>
										<div className="font-semibold text-gray-900 text-xs">
											Destination
										</div>
									</Popup>
								</Marker>
							)}

							{/* Driver Marker */}
							<Marker
								position={[
									driver.currentLocation.lat,
									driver.currentLocation.lng,
								]}
								icon={createDriverIcon(driver.status)}
							>
								<Popup>
									<div className="min-w-[120px] p-1">
										<div className="flex items-center gap-1 font-bold text-gray-900">
											<UserCheckIcon className="h-3 w-3" /> {driver.name}
										</div>
										<div className="my-1 border-b pb-1 text-muted-foreground text-xs capitalize">
											Status: {driver.status}
										</div>
										<div className="mt-1 flex items-center gap-1 text-gray-600 text-xs">
											<BatteryFullIcon className="h-3 w-3 text-emerald-500" />
											{driver.battery}% Battery
										</div>
									</div>
								</Popup>
							</Marker>
						</div>
					);
				})}
			</MapContainer>

			{/* Legend overlay */}
			<div className="absolute bottom-3 left-3 z-[1000] rounded border border-border bg-background/90 p-2 text-[10px] shadow-md backdrop-blur-md">
				<div className="flex gap-3 font-medium">
					<span className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full bg-blue-500" /> Hub
					</span>
					<span className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full bg-emerald-500" /> Driving
					</span>
					<span className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full bg-amber-500" /> Delivering
					</span>
					<span className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full bg-slate-400" /> Idle
					</span>
				</div>
			</div>
			<style jsx global>{`
        .leaflet-container {
          background-color: transparent;
        }
        .hub-icon-marker, .driver-icon-marker, .dest-icon-marker {
          background: transparent;
          border: none;
        }
      `}</style>
		</div>
	);
}
