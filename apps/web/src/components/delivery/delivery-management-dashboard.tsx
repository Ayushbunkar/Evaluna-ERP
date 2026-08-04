"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DeliveryManagementDashboardProps {
	initialRoutes: any[];
	initialVehicles: any[];
	drivers: any[];
	branches: any[];
}

export function DeliveryManagementDashboard({
	initialRoutes,
	initialVehicles,
	drivers,
	branches,
}: DeliveryManagementDashboardProps) {
	const [activeTab, setActiveTab] = useState("overview");

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
			<TabsList>
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="routes">Routes</TabsTrigger>
				<TabsTrigger value="tracking">Live Tracking</TabsTrigger>
				<TabsTrigger value="vehicles">Vehicles</TabsTrigger>
				<TabsTrigger value="settlements">Settlements</TabsTrigger>
			</TabsList>

			<TabsContent value="overview" className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Active Trips</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">0</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Available Vehicles</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{initialVehicles.length}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">0</div>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="routes">
				<Card>
					<CardHeader>
						<CardTitle>Delivery Routes</CardTitle>
						<CardDescription>Manage and optimize delivery routes for your customers.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<Button>Create New Route</Button>
							{initialRoutes.length === 0 ? (
								<p className="text-sm text-muted-foreground">No routes found.</p>
							) : (
								<div className="space-y-2">
									{initialRoutes.map(route => (
										<div key={route.id} className="p-4 border rounded-md">
											<h4 className="font-semibold">{route.name}</h4>
											<p className="text-sm text-muted-foreground">{route.description}</p>
											<p className="text-sm">Stops: {route.stops?.length || 0}</p>
										</div>
									))}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="tracking">
				<Card>
					<CardHeader>
						<CardTitle>Live GPS Tracking</CardTitle>
						<CardDescription>Monitor active deliveries in real-time.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[400px] w-full bg-slate-100 rounded-md border flex items-center justify-center">
							<p className="text-muted-foreground">Map will load here (Leaflet integration pending)</p>
						</div>
					</CardContent>
				</Card>
			</TabsContent>
            
			<TabsContent value="vehicles">
				<Card>
					<CardHeader>
						<CardTitle>Vehicle Fleet</CardTitle>
						<CardDescription>Manage your delivery vehicles and their status.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<Button>Add Vehicle</Button>
							{initialVehicles.length === 0 ? (
								<p className="text-sm text-muted-foreground">No vehicles found.</p>
							) : (
								<div className="space-y-2">
									{initialVehicles.map(vehicle => (
										<div key={vehicle.id} className="p-4 border rounded-md flex justify-between items-center">
											<div>
												<h4 className="font-semibold">{vehicle.name} ({vehicle.registration_number})</h4>
												<p className="text-sm text-muted-foreground">Type: {vehicle.type} | Capacity: {vehicle.capacity_kg} kg</p>
											</div>
											<div>
												<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
													{vehicle.status}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</TabsContent>
            
			<TabsContent value="settlements">
				<Card>
					<CardHeader>
						<CardTitle>Cash Settlements</CardTitle>
						<CardDescription>Verify end-of-day cash and UPI collections from delivery boys.</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">No pending settlements.</p>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
