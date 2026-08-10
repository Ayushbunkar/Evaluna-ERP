"use client";

import { MapPinIcon, PackageIcon, RouteIcon, TruckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";

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

	const { data: routes = initialRoutes, refetch: refetchRoutes } =
		trpc.delivery.listRoutes.useQuery({});
	const { data: customersResponse } = trpc.customers.list.useQuery() as any;
	const vehicles = initialVehicles || [];
	const customers = customersResponse || [];

	const createVehicle = {
		isPending: false,
		mutateAsync: async (data: any) => {},
	};
	const createRoute = trpc.delivery.createRoute.useMutation({
		onSuccess: () => refetchRoutes(),
	});
	const assignTrip = { isPending: false, mutateAsync: async (data: any) => {} };

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
			stops: routeCustomers.map((id, index) => ({
				customerId: id,
				sequence: index + 1,
			})),
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
							<CardTitle className="font-medium text-sm">
								Active Trips
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">0</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Available Vehicles
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{vehicles.length}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Pending Settlements
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">0</div>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="routes">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Delivery Routes</CardTitle>
							<CardDescription>
								Manage and optimize delivery routes for your customers.
							</CardDescription>
						</div>
						<div className="flex space-x-2">
							<Dialog open={isRouteOpen} onOpenChange={setIsRouteOpen}>
								<DialogTrigger asChild>
									<Button variant="outline">Create New Route</Button>
								</DialogTrigger>
								<DialogContent className="max-w-xl">
									<DialogHeader>
										<DialogTitle>Create Delivery Route</DialogTitle>
										<DialogDescription>
											Define a route and assign customer stops.
										</DialogDescription>
									</DialogHeader>
									<div className="max-h-[60vh] space-y-4 overflow-y-auto py-4 pr-2">
										<div className="space-y-2">
											<Label>Route Name</Label>
											<Input
												value={routeName}
												onChange={(e) => setRouteName(e.target.value)}
												placeholder="e.g. Downtown Morning"
											/>
										</div>
										<div className="space-y-2">
											<Label>Description</Label>
											<Input
												value={routeDesc}
												onChange={(e) => setRouteDesc(e.target.value)}
												placeholder="Route notes..."
											/>
										</div>
										<div className="space-y-2">
											<Label>Add Customers (Select to add to sequence)</Label>
											<Select
												onValueChange={(val) =>
													setRouteCustomers([...routeCustomers, Number(val)])
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Add a customer..." />
												</SelectTrigger>
												<SelectContent>
													{customers.map((c: any) => (
														<SelectItem key={c.id} value={c.id.toString()}>
															{c.name} ({c.phone || "No Phone"})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{routeCustomers.length > 0 && (
												<div className="mt-2 space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
													{routeCustomers.map((id, idx) => {
														const cust = customers.find(
															(c: any) => c.id === id,
														);
														return (
															<div
																key={idx}
																className="flex items-center gap-2"
															>
																<MapPinIcon className="h-4 w-4 text-primary" />{" "}
																<strong>Stop {idx + 1}:</strong> {cust?.name}
															</div>
														);
													})}
												</div>
											)}
										</div>
									</div>
									<DialogFooter>
										<Button
											onClick={handleCreateRoute}
											disabled={createRoute.isPending}
										>
											Save Route
										</Button>
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
										<DialogDescription>
											Assign a route to a driver and vehicle.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4 py-4">
										<div className="space-y-2">
											<Label>Select Route</Label>
											<Select
												value={tripRouteId}
												onValueChange={setTripRouteId}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select Route" />
												</SelectTrigger>
												<SelectContent>
													{routes.map((r: any) => (
														<SelectItem key={r.id} value={r.id.toString()}>
															{r.name} ({r.stops?.length || 0} stops)
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Select Driver</Label>
											<Select
												value={tripDriverId}
												onValueChange={setTripDriverId}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select Driver" />
												</SelectTrigger>
												<SelectContent>
													{drivers.map((d: any) => (
														<SelectItem key={d.id} value={d.id}>
															{d.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Select Vehicle</Label>
											<Select
												value={tripVehicleId}
												onValueChange={setTripVehicleId}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select Vehicle" />
												</SelectTrigger>
												<SelectContent>
													{vehicles.map((v: any) => (
														<SelectItem key={v.id} value={v.id.toString()}>
															{v.name} - {v.registration_number}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
									<DialogFooter>
										<Button
											onClick={handleAssignTrip}
											disabled={
												assignTrip.isPending ||
												!tripRouteId ||
												!tripDriverId ||
												!tripVehicleId
											}
										>
											Dispatch Trip
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{routes.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No routes found.
								</p>
							) : (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{routes.map((route: any) => (
										<div
											key={route.id}
											className="group relative overflow-hidden rounded-md border p-4 shadow-sm"
										>
											<div className="absolute top-0 left-0 h-full w-1 bg-primary" />
											<h4 className="font-semibold text-lg">{route.name}</h4>
											<p className="mb-3 text-muted-foreground text-sm">
												{route.description || "No description"}
											</p>
											<div className="space-y-1">
												<div className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
													Stops Sequence
												</div>
												{route.stops?.map((stop: any) => (
													<div
														key={stop.id}
														className="flex items-center gap-2 text-sm"
													>
														<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-bold text-[10px] text-primary">
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
						<div className="relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-md border bg-slate-100">
							{/* Simulated Map Background */}
							<div
								className="absolute inset-0 opacity-20"
								style={{
									backgroundImage:
										"linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
									backgroundSize: "20px 20px",
								}}
							/>

							<div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-xl bg-white p-4 shadow-lg">
								<div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-primary/10">
									<TruckIcon className="h-5 w-5 text-primary" />
								</div>
								<div>
									<h4 className="font-bold">Truck 01</h4>
									<p className="text-muted-foreground text-xs">
										Moving at 45 km/h • ETA 10 mins
									</p>
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
							<CardDescription>
								Manage your delivery vehicles and their status.
							</CardDescription>
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
										<Input
											value={vehicleName}
											onChange={(e) => setVehicleName(e.target.value)}
											placeholder="e.g. Ford Transit"
										/>
									</div>
									<div className="space-y-2">
										<Label>Registration Number</Label>
										<Input
											value={vehicleReg}
											onChange={(e) => setVehicleReg(e.target.value)}
											placeholder="e.g. XY-1234"
										/>
									</div>
									<div className="space-y-2">
										<Label>Type</Label>
										<Select value={vehicleType} onValueChange={setVehicleType}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="van">Van</SelectItem>
												<SelectItem value="truck">Truck</SelectItem>
												<SelectItem value="bike">Bike</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<DialogFooter>
									<Button
										onClick={handleAddVehicle}
										disabled={createVehicle.isPending}
									>
										Add Vehicle
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{vehicles.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No vehicles found.
								</p>
							) : (
								<div className="grid gap-4 md:grid-cols-3">
									{vehicles.map((vehicle: any) => (
										<div
											key={vehicle.id}
											className="rounded-md border p-4 shadow-sm"
										>
											<div className="mb-2 flex items-start justify-between">
												<div>
													<h4 className="font-bold">{vehicle.name}</h4>
													<p className="mt-1 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs">
														{vehicle.registration_number}
													</p>
												</div>
												<span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-700 text-xs">
													{vehicle.status || "available"}
												</span>
											</div>
											<div className="mt-4 flex items-center justify-between border-t pt-3 text-muted-foreground text-sm">
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
						<CardDescription>
							Verify end-of-day cash and UPI collections from delivery boys.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							No pending settlements.
						</p>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
