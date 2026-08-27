"use client";

import {
	AlertTriangle,
	Banknote,
	MapPin,
	Navigation,
	PackageCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTRPC } from "@/lib/trpc/client";

interface DeliveryBoyDashboardProps {
	activeTrip: any;
	allTrips: any[];
}

export function DeliveryBoyDashboard({
	activeTrip,
	allTrips,
}: DeliveryBoyDashboardProps) {
	const trpc = useTRPC();
	const [currentStopIndex, setCurrentStopIndex] = useState(0);

	const startTrip = trpc.delivery.updateTripStatus.useMutation({
		onSuccess: () => {
			toast.success("Trip started!");
			// Would typically trigger a router.refresh() or trpc utils invalidate
		},
	});

	const logGps = trpc.delivery.logGps.useMutation();

	// Mock function for simulating GPS ping
	const handleSimulateGPS = () => {
		if (activeTrip) {
			logGps.mutate({
				tripId: activeTrip.id,
				lat: 19.076, // Mumbai coord
				lng: 72.8777,
				speed: 40,
			});
			toast.info("GPS Pinged");
		}
	};

	if (!activeTrip) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center space-y-4 p-6 text-center">
				<div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200">
					<PackageCheck className="h-10 w-10 text-slate-500" />
				</div>
				<h2 className="font-bold text-2xl">No Active Trips</h2>
				<p className="text-muted-foreground">
					You do not have any active delivery trips assigned for today.
				</p>
				<Button variant="outline" onClick={() => window.location.reload()}>
					Refresh
				</Button>
			</div>
		);
	}

	const stops = activeTrip.stops || [];
	const currentStop = stops[currentStopIndex];
	const isTripStarted = activeTrip.status === "active";

	return (
		<div className="flex flex-1 flex-col pb-20">
			{/* Top Bar */}
			<div className="sticky top-0 z-10 flex items-center justify-between bg-primary p-4 text-primary-foreground shadow-md">
				<div>
					<h1 className="font-bold text-lg">
						{activeTrip.route?.name || "Assigned Route"}
					</h1>
					<p className="text-xs opacity-80">{stops.length} Stops Total</p>
				</div>
				<div>
					<Button variant="secondary" size="sm" onClick={handleSimulateGPS}>
						Ping GPS
					</Button>
				</div>
			</div>

			<div className="flex-1 space-y-4 overflow-y-auto p-4">
				{!isTripStarted ? (
					<Card>
						<CardHeader>
							<CardTitle>Ready to start?</CardTitle>
						</CardHeader>
						<CardContent>
							<Button
								className="h-14 w-full text-lg"
								onClick={() =>
									startTrip.mutate({ tripId: activeTrip.id, status: "active" })
								}
							>
								Start Trip & Mark Attendance
							</Button>
						</CardContent>
					</Card>
				) : (
					<>
						{/* Current Stop Info */}
						{currentStop ? (
							<Card className="border-primary/50 shadow-md">
								<CardHeader className="border-b pb-2">
									<div className="flex items-center justify-between">
										<CardTitle className="text-xl">
											Stop {currentStopIndex + 1} of {stops.length}
										</CardTitle>
										<span className="rounded-full bg-amber-100 px-2 py-1 font-bold text-amber-800 text-xs">
											{currentStop.status.toUpperCase()}
										</span>
									</div>
								</CardHeader>
								<CardContent className="space-y-4 pt-4">
									<div>
										<h2 className="font-bold text-2xl">
											{currentStop.customer?.name}
										</h2>
										<p className="mt-1 flex items-start gap-1 text-muted-foreground">
											<MapPin className="mt-0.5 h-4 w-4 shrink-0" />
											<span>
												{currentStop.customer?.address ||
													"Address not provided"}
											</span>
										</p>
									</div>

									<div className="grid grid-cols-2 gap-2 pt-4">
										<Button className="h-12 bg-blue-600 hover:bg-blue-700">
											<Navigation className="mr-2 h-5 w-5" />
											Navigate
										</Button>
										<Button
											variant="outline"
											className="h-12 border-primary text-primary"
										>
											Call Customer
										</Button>
									</div>

									<div className="mt-4 grid grid-cols-1 gap-2 border-t pt-2">
										<Button
											className="h-14 bg-green-600 text-lg hover:bg-green-700"
											onClick={() =>
												alert(
													"Open Delivery Confirmation UI (To Be Implemented)",
												)
											}
										>
											<PackageCheck className="mr-2 h-6 w-6" />
											Confirm Delivery
										</Button>

										<Button
											variant="secondary"
											className="h-12"
											onClick={() => alert("Open Collection UI")}
										>
											<Banknote className="mr-2 h-5 w-5" />
											Collect Payment
										</Button>

										<Button
											variant="outline"
											className="h-12 border-red-200 text-red-600 hover:bg-red-50"
											onClick={() => alert("Open Skip/Return UI")}
										>
											<AlertTriangle className="mr-2 h-5 w-5" />
											Issue / Return
										</Button>
									</div>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="p-6 text-center">
									<h2 className="mb-2 font-bold text-xl">
										All Stops Completed!
									</h2>
									<p className="mb-4 text-muted-foreground">
										You have visited all customers on this route.
									</p>
									<Button
										className="w-full"
										variant="default"
										onClick={() =>
											startTrip.mutate({
												tripId: activeTrip.id,
												status: "completed",
											})
										}
									>
										End Trip & Settle Cash
									</Button>
								</CardContent>
							</Card>
						)}
					</>
				)}
			</div>
		</div>
	);
}

