"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { PackageIcon, RouteIcon, TruckIcon, MapPinIcon } from "lucide-react";

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
	
	const { data: routes = initialRoutes, refetch: refetchRoutes } = trpc.delivery.listRoutes.useQuery({});
	const { data: vehicles = initialVehicles, refetch: refetchVehicles } = trpc.vehicles.list.useQuery({});
	const { data: customersResponse } = trpc.customers.list.useQuery({ limit: 100 });
	const customers = customersResponse?.items || [];

	const createVehicle = trpc.vehicles.create.useMutation({
		onSuccess: () => refetchVehicles()
	});
	const createRoute = trpc.delivery.createRoute.useMutation({
		onSuccess: () => refetchRoutes()
	});
	const assignTrip = trpc.delivery.assignTrip.useMutation();

	// Form States
	const [vehicleName, setVehicleName] = useState("");
	const [vehicleReg, setVehicleReg] = useState("");
	const [vehicleType, setVehicleType] = useState("van");
	const [isVehicleOpen, setIsVehicleOpen] = useState(false);

	const [routeName, setRouteName] = useState("");
	const [routeDesc, setRouteDesc] = useState("");
	const [routeCustomers, setRouteCustomers] = useState<number[]>([]);
	const [isRouteOpen, setIsRouteOpen] = useState(false);

	const [tripRouteId, setTripRouteId] = useState("");
	const [tripDriverId, setTripDriverId] = useState("");
	const [tripVehicleId, setTripVehicleId] = useState("");
	const [isTripOpen, setIsTripOpen] = useState(false);

	const handleAddVehicle = async () => {
		await createVehicle.mutateAsync({
			name: vehicleName,
			registration_number: vehicleReg,
			type: vehicleType,
		});
		setIsVehicleOpen(false);
		setVehicleName("");
		setVehicleReg("");
	};

	const handleCreateRoute = async () => {
		await createRoute.mutateAsync({
			name: routeName,
			description: routeDesc,
			stops: routeCustomers.map((id, index) => ({ customerId: id, sequence: index + 1 }))
		});
		setIsRouteOpen(false);
		setRouteName("");
		setRouteDesc("");
		setRouteCustomers([]);
	};

	const handleAssignTrip = async () => {
		await assignTrip.mutateAsync({
			routeId: Number(tripRouteId),
			driverId: tripDriverId,
			vehicleId: Number(tripVehicleId),
		});
		setIsTripOpen(false);
		setTripRouteId("");
		setTripDriverId("");
		setTripVehicleId("");
	};

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
			<TabsList>
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="routes">Routes & Trips</TabsTrigger>
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
							<div className="text-2xl font-bold">{vehicles.length}</div>
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
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Delivery Routes</CardTitle>
							<CardDescription>Manage and optimize delivery routes for your customers.</CardDescription>
						</div>
						<div className="flex space-x-2">
							<Dialog open={isRouteOpen} onOpenChange={setIsRouteOpen}>
								<DialogTrigger asChild>
									<Button variant="outline">Create New Route</Button>
								</DialogTrigger>
								<DialogContent className="max-w-xl">
									<DialogHeader>
										<DialogTitle>Create Delivery Route</DialogTitle>
										<DialogDescription>Define a route and assign customer stops.</DialogDescription>
									</DialogHeader>
									<div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
										<div className="space-y-2">
											<Label>Route Name</Label>
											<Input value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="e.g. Downtown Morning" />
										</div>
										<div className="space-y-2">
											<Label>Description</Label>
											<Input value={routeDesc} onChange={e => setRouteDesc(e.target.value)} placeholder="Route notes..." />
										</div>
										<div className="space-y-2">
											<Label>Add Customers (Select to add to sequence)</Label>
											<Select onValueChange={(val) => setRouteCustomers([...routeCustomers, Number(val)])}>
												<SelectTrigger>
													<SelectValue placeholder="Add a customer..." />
												</SelectTrigger>
												<SelectContent>
													{customers.map((c: any) => (
														<SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.phone || "No Phone"})</SelectItem>
													))}
												</SelectContent>
											</Select>
											{routeCustomers.length > 0 && (
												<div className="p-3 mt-2 border rounded-md text-sm space-y-1 bg-muted/30">
													{routeCustomers.map((id, idx) => {
														const cust = customers.find((c: any) => c.id === id);
														return <div key={idx} className="flex gap-2 items-center"><MapPinIcon className="w-4 h-4 text-primary"/> <strong>Stop {idx + 1}:</strong> {cust?.name}</div>;
													})}
												</div>
											)}
										</div>
									</div>
									<DialogFooter>
										<Button onClick={handleCreateRoute} disabled={createRoute.isPending}>Save Route</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>

							<Dialog open={isTripOpen} onOpenChange={setIsTripOpen}>
								<DialogTrigger asChild>
									<Button>Dispatch Trip</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Dispatch Delivery Trip</DialogTitle>
										<DialogDescription>Assign a route to a driver and vehicle.</DialogDescription>
									</DialogHeader>
									<div className="space-y-4 py-4">
										<div className="space-y-2">
											<Label>Select Route</Label>
											<Select value={tripRouteId} onValueChange={setTripRouteId}>
												<SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
												<SelectContent>
													{routes.map((r: any) => (
														<SelectItem key={r.id} value={r.id.toString()}>{r.name} ({r.stops?.length || 0} stops)</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Select Driver</Label>
											<Select value={tripDriverId} onValueChange={setTripDriverId}>
												<SelectTrigger><SelectValue placeholder="Select Driver" /></SelectTrigger>
												<SelectContent>
													{drivers.map((d: any) => (
														<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Select Vehicle</Label>
											<Select value={tripVehicleId} onValueChange={setTripVehicleId}>
												<SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
												<SelectContent>
													{vehicles.map((v: any) => (
														<SelectItem key={v.id} value={v.id.toString()}>{v.name} - {v.registration_number}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
									<DialogFooter>
										<Button onClick={handleAssignTrip} disabled={assignTrip.isPending || !tripRouteId || !tripDriverId || !tripVehicleId}>Dispatch Trip</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{routes.length === 0 ? (
								<p className="text-sm text-muted-foreground">No routes found.</p>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{routes.map((route: any) => (
										<div key={route.id} className="p-4 border rounded-md shadow-sm relative overflow-hidden group">
											<div className="absolute top-0 left-0 w-1 h-full bg-primary" />
											<h4 className="font-semibold text-lg">{route.name}</h4>
											<p className="text-sm text-muted-foreground mb-3">{route.description || "No description"}</p>
											<div className="space-y-1">
												<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stops Sequence</div>
												{route.stops?.map((stop: any) => (
													<div key={stop.id} className="flex items-center text-sm gap-2">
														<div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
															{stop.sequence}
														</div>
														{stop.customer?.name}
													</div>
												))}
											</div>
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
						<CardDescription>Simulated view of active trips.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[400px] w-full bg-slate-100 rounded-md border flex items-center justify-center overflow-hidden relative">
							{/* Simulated Map Background */}
							<div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
							
							<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-white shadow-lg rounded-xl flex items-center gap-3">
								<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
									<TruckIcon className="text-primary w-5 h-5" />
								</div>
								<div>
									<h4 className="font-bold">Truck 01</h4>
									<p className="text-xs text-muted-foreground">Moving at 45 km/h • ETA 10 mins</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</TabsContent>
            
			<TabsContent value="vehicles">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Vehicle Fleet</CardTitle>
							<CardDescription>Manage your delivery vehicles and their status.</CardDescription>
						</div>
						<Dialog open={isVehicleOpen} onOpenChange={setIsVehicleOpen}>
							<DialogTrigger asChild>
								<Button>Add Vehicle</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add New Vehicle</DialogTitle>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div className="space-y-2">
										<Label>Vehicle Name/Model</Label>
										<Input value={vehicleName} onChange={e => setVehicleName(e.target.value)} placeholder="e.g. Ford Transit" />
									</div>
									<div className="space-y-2">
										<Label>Registration Number</Label>
										<Input value={vehicleReg} onChange={e => setVehicleReg(e.target.value)} placeholder="e.g. XY-1234" />
									</div>
									<div className="space-y-2">
										<Label>Type</Label>
										<Select value={vehicleType} onValueChange={setVehicleType}>
											<SelectTrigger><SelectValue /></SelectTrigger>
											<SelectContent>
												<SelectItem value="van">Van</SelectItem>
												<SelectItem value="truck">Truck</SelectItem>
												<SelectItem value="bike">Bike</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<DialogFooter>
									<Button onClick={handleAddVehicle} disabled={createVehicle.isPending}>Add Vehicle</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{vehicles.length === 0 ? (
								<p className="text-sm text-muted-foreground">No vehicles found.</p>
							) : (
								<div className="grid gap-4 md:grid-cols-3">
									{vehicles.map((vehicle: any) => (
										<div key={vehicle.id} className="p-4 border rounded-md shadow-sm">
											<div className="flex justify-between items-start mb-2">
												<div>
													<h4 className="font-bold">{vehicle.name}</h4>
													<p className="text-xs font-mono bg-muted px-2 py-0.5 rounded mt-1 inline-block">{vehicle.registration_number}</p>
												</div>
												<span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold">
													{vehicle.status || "available"}
												</span>
											</div>
											<div className="mt-4 flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
												<span>Type: {vehicle.type}</span>
												<span>Cap: {vehicle.capacity_kg || "N/A"} kg</span>
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
