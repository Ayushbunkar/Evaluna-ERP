"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTRPC } from "@/lib/trpc/client";
import { MapPin, Navigation, PackageCheck, Banknote, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeliveryBoyDashboardProps {
	activeTrip: any;
	allTrips: any[];
}

export function DeliveryBoyDashboard({ activeTrip, allTrips }: DeliveryBoyDashboardProps) {
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
				lat: 19.0760, // Mumbai coord
				lng: 72.8777,
				speed: 40,
			});
			toast.info("GPS Pinged");
		}
	};

	if (!activeTrip) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
				<div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center">
					<PackageCheck className="h-10 w-10 text-slate-500" />
				</div>
				<h2 className="text-2xl font-bold">No Active Trips</h2>
				<p className="text-muted-foreground">You do not have any active delivery trips assigned for today.</p>
				<Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
			</div>
		);
	}

	const stops = activeTrip.stops || [];
	const currentStop = stops[currentStopIndex];
	const isTripStarted = activeTrip.status === "active";

	return (
		<div className="flex flex-col flex-1 pb-20">
			{/* Top Bar */}
			<div className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
				<div>
					<h1 className="font-bold text-lg">{activeTrip.route?.name || "Assigned Route"}</h1>
					<p className="text-xs opacity-80">{stops.length} Stops Total</p>
				</div>
				<div>
					<Button variant="secondary" size="sm" onClick={handleSimulateGPS}>Ping GPS</Button>
				</div>
			</div>

			<div className="p-4 space-y-4 flex-1 overflow-y-auto">
				{!isTripStarted ? (
					<Card>
						<CardHeader>
							<CardTitle>Ready to start?</CardTitle>
						</CardHeader>
						<CardContent>
							<Button 
								className="w-full h-14 text-lg" 
								onClick={() => startTrip.mutate({ tripId: activeTrip.id, status: "active" })}
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
								<CardHeader className="pb-2 border-b">
									<div className="flex justify-between items-center">
										<CardTitle className="text-xl">Stop {currentStopIndex + 1} of {stops.length}</CardTitle>
										<span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
											{currentStop.status.toUpperCase()}
										</span>
									</div>
								</CardHeader>
								<CardContent className="pt-4 space-y-4">
									<div>
										<h2 className="text-2xl font-bold">{currentStop.customer?.name}</h2>
										<p className="text-muted-foreground flex items-start gap-1 mt-1">
											<MapPin className="h-4 w-4 mt-0.5 shrink-0" />
											<span>{currentStop.customer?.address || "Address not provided"}</span>
										</p>
									</div>

									<div className="grid grid-cols-2 gap-2 pt-4">
										<Button className="h-12 bg-blue-600 hover:bg-blue-700">
											<Navigation className="h-5 w-5 mr-2" />
											Navigate
										</Button>
										<Button variant="outline" className="h-12 border-primary text-primary">
											Call Customer
										</Button>
									</div>

									<div className="grid grid-cols-1 gap-2 pt-2 border-t mt-4">
										<Button 
											className="h-14 bg-green-600 hover:bg-green-700 text-lg"
											onClick={() => alert("Open Delivery Confirmation UI (To Be Implemented)")}
										>
											<PackageCheck className="h-6 w-6 mr-2" />
											Confirm Delivery
										</Button>
										
										<Button 
											variant="secondary" 
											className="h-12"
											onClick={() => alert("Open Collection UI")}
										>
											<Banknote className="h-5 w-5 mr-2" />
											Collect Payment
										</Button>

										<Button 
											variant="destructive" 
											variant="outline" 
											className="h-12 text-red-600 border-red-200 hover:bg-red-50"
											onClick={() => alert("Open Skip/Return UI")}
										>
											<AlertTriangle className="h-5 w-5 mr-2" />
											Issue / Return
										</Button>
									</div>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="p-6 text-center">
									<h2 className="text-xl font-bold mb-2">All Stops Completed!</h2>
									<p className="text-muted-foreground mb-4">You have visited all customers on this route.</p>
									<Button 
										className="w-full" 
										variant="default"
										onClick={() => startTrip.mutate({ tripId: activeTrip.id, status: "completed" })}
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
