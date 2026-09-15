"use client";

import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClockIcon,
	FileTextIcon,
	ListPlusIcon,
	MapPinIcon,
	PackageIcon,
	PhoneIcon,
	PlusIcon,
	RouteIcon,
	ShieldCheckIcon,
	Trash2Icon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

interface DeliveryManagementDashboardProps {
	initialRoutes: any[];
	initialVehicles: any[];
	drivers: any[];
	branches: any[];
	initialTrips?: any[];
}

export function DeliveryManagementDashboard({
	initialRoutes,
	initialVehicles,
	drivers,
	branches,
	initialTrips,
}: DeliveryManagementDashboardProps) {
	const t = useTranslations("manager");
	const [activeTab, setActiveTab] = useState("overview");

	const { data: routes = initialRoutes, refetch: refetchRoutes } =
		trpc.delivery.listRoutes.useQuery({});
	const { data: trips = initialTrips || [], refetch: refetchTrips } =
		trpc.delivery.listAllTrips.useQuery({});
	const { data: vehiclesData, refetch: refetchVehicles } =
		trpc.vehicles.list.useQuery({});
	const vehicles = vehiclesData || initialVehicles || [];
	const { data: customersResponse } = trpc.customers.list.useQuery() as any;
	const customers = customersResponse || [];

	const { data: listDriversData } = trpc.delivery.listDrivers.useQuery({});
	const finalDrivers = listDriversData || drivers || [];
	const { data: allOrders = [], refetch: refetchOrders } =
		trpc.orders.list.useQuery();
	const { data: driverCollections = [] } =
		trpc.finance.getDriverCollections.useQuery();

	const [assignOrder, setAssignOrder] = useState<any>(null);
	const [isOrderAssignOpen, setIsOrderAssignOpen] = useState(false);
	const [orderDriverId, setOrderDriverId] = useState("");
	const [orderVehicleId, setOrderVehicleId] = useState("");

	// Compute set of customer IDs that already have assigned delivery trips
	const assignedCustomerIds = new Set<number>();
	for (const trip of trips) {
		if (trip.status === "pending" || trip.status === "active") {
			for (const stop of trip.stops || []) {
				if (stop.customer_id) assignedCustomerIds.add(stop.customer_id);
				if (stop.customer?.id) assignedCustomerIds.add(stop.customer.id);
			}
		}
	}

	const unassignedOrders = allOrders.filter((order: any) => {
		if (order.status === "cancelled") return false;
		if (order.status === "pending_review" || order.status === "under_review") return false;
		const custId = order.customer_id || order.customer?.id;
		if (order.driver_id) return false;
		if (custId && assignedCustomerIds.has(custId)) return false;
		return true;
	});

	const createVehicle = trpc.vehicles.create.useMutation({
		onSuccess: () => refetchVehicles(),
	});
	const createRoute = trpc.delivery.createRoute.useMutation({
		onSuccess: () => refetchRoutes(),
	});
	const assignTrip = trpc.delivery.assignTrip.useMutation({
		onSuccess: () => refetchTrips(),
	});
	const cancelTrip = trpc.delivery.cancelTrip.useMutation({
		onSuccess: () => refetchTrips(),
	});
	const createTripDirect = trpc.delivery.createTripDirect.useMutation({
		onSuccess: () => {
			refetchRoutes();
			refetchTrips();
		},
	});
	const optimizeRouteSequence =
		trpc.delivery.optimizeRouteSequence.useMutation();

	// Form States
	const [vehicleName, setVehicleName] = useState("");
	const [vehicleReg, setVehicleReg] = useState("");
	const [vehicleType, setVehicleType] = useState("van");
	const [isVehicleOpen, setIsVehicleOpen] = useState(false);

	const [routeName, setRouteName] = useState("");
	const [routeDesc, setRouteDesc] = useState("");
	const [routeCustomers, setRouteCustomers] = useState<number[]>([]);
	const [customRouteStops, setCustomRouteStops] = useState<
		Array<{ id: string; name: string; phone: string; address: string }>
	>([]);
	const [manualStopName, setManualStopName] = useState("");
	const [manualStopPhone, setManualStopPhone] = useState("");
	const [manualStopAddress, setManualStopAddress] = useState("");
	const [bulkAddressesText, setBulkAddressesText] = useState("");
	const [isRouteOpen, setIsRouteOpen] = useState(false);
	const [routeCreationMode, setRouteCreationMode] = useState<"existing" | "bulk">("existing");

	const [tripRouteId, setTripRouteId] = useState("");
	const [tripDriverId, setTripDriverId] = useState("");
	const [tripVehicleId, setTripVehicleId] = useState("");
	const [isTripOpen, setIsTripOpen] = useState(false);

	// Quick Trip States
	const [quickTripCustomers, setQuickTripCustomers] = useState<number[]>([]);
	const [isQuickTripOpen, setIsQuickTripOpen] = useState(false);

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

	const handleAddManualCustomStop = () => {
		if (!manualStopAddress && !manualStopName && !manualStopPhone) {
			toast.error("Please enter a customer address, name, or phone number.");
			return;
		}
		setCustomRouteStops([
			...customRouteStops,
			{
				id: `custom_${Date.now()}_${Math.random()}`,
				name: manualStopName.trim() || `Customer ${manualStopPhone || customRouteStops.length + 1}`,
				phone: manualStopPhone.trim(),
				address: manualStopAddress.trim(),
			},
		]);
		setManualStopName("");
		setManualStopPhone("");
		setManualStopAddress("");
		toast.success("Stop added to route list.");
	};

	const handleParseBulkAddresses = () => {
		if (!bulkAddressesText.trim()) {
			toast.error("Please paste addresses / phone numbers first.");
			return;
		}

		const lines = bulkAddressesText
			.split("\n")
			.map((l) => l.trim())
			.filter((l) => l.length > 0);

		const parsed: Array<{ id: string; name: string; phone: string; address: string }> = [];

		for (const line of lines) {
			// Extract phone if present (10-12 digits)
			const phoneMatch = line.match(/(?:\+91|91)?[\s-]?[6-9]\d{9}/);
			const phone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, "") : "";
			
			// Remove phone from line to get rest
			let remaining = phoneMatch ? line.replace(phoneMatch[0], "").trim() : line;
			remaining = remaining.replace(/^[,;|-]+|[,;|-]+$/g, "").trim();

			// If line has format: "Name - Address" or "Name, Address"
			let name = "";
			let address = remaining;

			if (remaining.includes(" - ")) {
				const parts = remaining.split(" - ");
				name = parts[0].trim();
				address = parts.slice(1).join(" - ").trim();
			} else if (remaining.includes(",")) {
				const parts = remaining.split(",");
				if (parts.length > 1 && parts[0].trim().split(" ").length <= 3) {
					name = parts[0].trim();
					address = parts.slice(1).join(", ").trim();
				}
			}

			parsed.push({
				id: `bulk_${Date.now()}_${Math.random()}`,
				name: name || (address ? `Stop: ${address.slice(0, 25)}` : `Phone: ${phone}`),
				phone: phone,
				address: address || (phone ? `Contact: ${phone}` : "Standard Delivery"),
			});
		}

		if (parsed.length === 0) {
			toast.error("Could not parse any valid stops from the input.");
			return;
		}

		setCustomRouteStops([...customRouteStops, ...parsed]);
		setBulkAddressesText("");
		toast.success(`Successfully parsed & added ${parsed.length} stop(s)!`);
	};

	const handleCreateRoute = async () => {
		if (!routeName.trim()) {
			toast.error("Please enter a Route Name.");
			return;
		}

		const allStops: Array<{
			customerId?: number;
			sequence: number;
			name?: string;
			phone?: string;
			address?: string;
		}> = [];

		let seq = 1;

		// 1. Add existing registered customers
		for (const custId of routeCustomers) {
			allStops.push({
				customerId: custId,
				sequence: seq++,
			});
		}

		// 2. Add custom / bulk address stops
		for (const cStop of customRouteStops) {
			allStops.push({
				name: cStop.name,
				phone: cStop.phone,
				address: cStop.address,
				sequence: seq++,
			});
		}

		if (allStops.length === 0) {
			toast.error("Please add at least one customer stop or address to this route.");
			return;
		}

		try {
			await createRoute.mutateAsync({
				name: routeName,
				description: routeDesc,
				stops: allStops,
			});
			toast.success(`Route "${routeName}" created with ${allStops.length} stop(s)!`);
			setIsRouteOpen(false);
			setRouteName("");
			setRouteDesc("");
			setRouteCustomers([]);
			setCustomRouteStops([]);
			setBulkAddressesText("");
			setManualStopName("");
			setManualStopPhone("");
			setManualStopAddress("");
		} catch (err: any) {
			toast.error(err.message || "Failed to create route.");
		}
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

	const handleCreateQuickTrip = async () => {
		await createTripDirect.mutateAsync({
			driverId: tripDriverId,
			vehicleId: tripVehicleId ? Number(tripVehicleId) : undefined,
			stops: quickTripCustomers.map((id, index) => ({
				customerId: id,
				sequence: index + 1,
			})),
		});
		setIsQuickTripOpen(false);
		setQuickTripCustomers([]);
		setTripDriverId("");
		setTripVehicleId("");
	};

	const handleOptimizeRoute = async () => {
		if (routeCustomers.length <= 1) return;
		const optimized = await optimizeRouteSequence.mutateAsync({
			customerIds: routeCustomers,
		});
		setRouteCustomers(optimized);
	};

	const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

	// Cancel Trip Modal States
	const [tripToCancel, setTripToCancel] = useState<any>(null);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
	const [cancelReason, setCancelReason] = useState("");

	// Delete Route & Trip Modal States
	const [routeToDelete, setRouteToDelete] = useState<any>(null);
	const [isDeleteRouteModalOpen, setIsDeleteRouteModalOpen] = useState(false);
	const deleteRouteMutation = trpc.delivery.deleteRoute.useMutation({
		onSuccess: () => {
			refetchRoutes();
			refetchTrips();
		},
	});

	const [tripToDelete, setTripToDelete] = useState<any>(null);
	const [isDeleteTripModalOpen, setIsDeleteTripModalOpen] = useState(false);
	const deleteTripMutation = trpc.delivery.deleteTrip.useMutation({
		onSuccess: () => {
			refetchTrips();
			refetchOrders();
		},
	});

	const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
	const clearAllMutation = trpc.delivery.clearAllRoutesAndTrips.useMutation({
		onSuccess: () => {
			refetchRoutes();
			refetchTrips();
			refetchOrders();
		},
	});

	const handleConfirmCancelTrip = async () => {
		if (!tripToCancel) return;
		try {
			await cancelTrip.mutateAsync({ tripId: tripToCancel.id });
			toast.success(
				`Trip #${tripToCancel.id} has been cancelled successfully.`,
			);
			setIsCancelModalOpen(false);
			setTripToCancel(null);
			setCancelReason("");
			refetchTrips();
			refetchOrders();
			refetchRoutes();
		} catch (err: any) {
			toast.error(err.message || "Failed to cancel trip.");
		}
	};

	const handleConfirmDeleteRoute = async () => {
		if (!routeToDelete) return;
		try {
			await deleteRouteMutation.mutateAsync({ routeId: routeToDelete.id });
			toast.success(`Route "${routeToDelete.name}" deleted successfully.`);
			setIsDeleteRouteModalOpen(false);
			setRouteToDelete(null);
		} catch (err: any) {
			toast.error(err.message || "Failed to delete route.");
		}
	};

	const handleConfirmDeleteTrip = async () => {
		if (!tripToDelete) return;
		try {
			await deleteTripMutation.mutateAsync({ tripId: tripToDelete.id });
			toast.success(`Trip #${tripToDelete.id} deleted successfully.`);
			setIsDeleteTripModalOpen(false);
			setTripToDelete(null);
		} catch (err: any) {
			toast.error(err.message || "Failed to delete trip.");
		}
	};

	const handleConfirmClearAll = async () => {
		try {
			await clearAllMutation.mutateAsync();
			toast.success("All routes and trips have been cleared successfully.");
			setIsClearAllModalOpen(false);
		} catch (err: any) {
			toast.error(err.message || "Failed to clear routes and trips.");
		}
	};

	const handleOptimizeQuickTrip = async () => {
		if (quickTripCustomers.length <= 1) return;
		const optimized = await optimizeRouteSequence.mutateAsync({
			customerIds: quickTripCustomers,
		});
		setQuickTripCustomers(optimized);
	};

	const handleAssignOrderRoute = async () => {
		if (!orderDriverId) {
			toast.error("Please select a Driver for this trip.");
			return;
		}

		const ordersToAssign =
			selectedOrderIds.length > 0
				? unassignedOrders.filter((o: any) => selectedOrderIds.includes(o.id))
				: assignOrder
					? [assignOrder]
					: [];

		if (ordersToAssign.length === 0) {
			toast.error("No orders selected for trip assignment.");
			return;
		}

		const customerStops: { customerId: number; sequence: number }[] = [];
		const seenCusts = new Set<number>();
		let seq = 1;

		for (const ord of ordersToAssign) {
			const custId =
				ord.customer_id ||
				ord.customer?.id ||
				(customers.length > 0 ? customers[0].id : 1);
			if (custId && !seenCusts.has(custId)) {
				seenCusts.add(custId);
				customerStops.push({ customerId: custId, sequence: seq++ });
			}
		}

		if (customerStops.length === 0) {
			toast.error("Selected orders do not have valid customer details.");
			return;
		}

		await createTripDirect.mutateAsync({
			driverId: orderDriverId,
			vehicleId: orderVehicleId ? Number(orderVehicleId) : undefined,
			stops: customerStops,
		});

		toast.success(
			`Dispatched 1 Trip with ${customerStops.length} Stop(s) for ${ordersToAssign.length} order(s)! Sent to Packer Queue.`,
		);
		setIsOrderAssignOpen(false);
		setAssignOrder(null);
		setSelectedOrderIds([]);
		setOrderDriverId("");
		setOrderVehicleId("");
		refetchTrips();
		refetchRoutes();
		refetchOrders();
	};

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
			<TabsList>
				<TabsTrigger value="overview">{t("overviewTab")}</TabsTrigger>
				<TabsTrigger value="routes">{t("routesTab")}</TabsTrigger>
				<TabsTrigger value="tracking">{t("trackingTab")}</TabsTrigger>
				<TabsTrigger value="vehicles">{t("vehiclesTab")}</TabsTrigger>
				<TabsTrigger value="settlements">{t("settlementsTab")}</TabsTrigger>
			</TabsList>

			<TabsContent value="overview" className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								{t("activeTripsCard")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">0</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								{t("availableVehiclesCard")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{vehicles.length}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								{t("pendingSettlementsCard")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">0</div>
						</CardContent>
					</Card>
				</div>

				{/* Orders Awaiting Route & Driver Assignment Panel */}
				<Card className="border-border/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-4">
						<div>
							<CardTitle className="flex items-center gap-2 font-bold text-lg">
								<PackageIcon className="h-5 w-5 text-blue-600" />
								{t("ordersAwaitingAssignment")}
							</CardTitle>
							<CardDescription className="text-xs">
								{t("selectMultipleOrdersSub")}
							</CardDescription>
						</div>
						{selectedOrderIds.length > 0 && (
							<Button
								className="bg-emerald-600 font-semibold text-white text-xs shadow-md hover:bg-emerald-700"
								onClick={() => {
									setAssignOrder(null);
									setIsOrderAssignOpen(true);
								}}
							>
								{t("assignSelectedOrdersToTrip", {
									count: selectedOrderIds.length,
								})}
							</Button>
						)}
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead>
									<tr className="border-b bg-muted/30 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										<th className="w-10 px-4 py-3 text-center">
											<input
												type="checkbox"
												className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
												checked={
													unassignedOrders.length > 0 &&
													selectedOrderIds.length === unassignedOrders.length
												}
												onChange={(e) => {
													if (e.target.checked) {
														setSelectedOrderIds(
															unassignedOrders.map((o: any) => o.id),
														);
													} else {
														setSelectedOrderIds([]);
													}
												}}
											/>
										</th>
										<th className="px-4 py-3">{t("orderIdHeader")}</th>
										<th className="px-4 py-3">{t("customerNameHeader")}</th>
										<th className="px-4 py-3">{t("totalAmountHeader")}</th>
										<th className="px-4 py-3">{t("orderDateHeader")}</th>
										<th className="px-4 py-3 text-center">
											{t("routeStatusHeader")}
										</th>
										<th className="px-4 py-3 text-center">
											{t("actionHeader")}
										</th>
									</tr>
								</thead>
								<tbody>
									{unassignedOrders.map((order: any) => {
										const isSelected = selectedOrderIds.includes(order.id);
										return (
											<tr
												key={order.id}
												className={`border-b transition-colors last:border-0 hover:bg-muted/20 ${isSelected ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
											>
												<td className="px-4 py-3 text-center">
													<input
														type="checkbox"
														className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
														checked={isSelected}
														onChange={(e) => {
															if (e.target.checked) {
																setSelectedOrderIds([
																	...selectedOrderIds,
																	order.id,
																]);
															} else {
																setSelectedOrderIds(
																	selectedOrderIds.filter(
																		(id) => id !== order.id,
																	),
																);
															}
														}}
													/>
												</td>
												<td className="px-4 py-3 font-bold font-mono text-blue-600">
													ORD-{order.id}
												</td>
												<td className="px-4 py-3 font-medium">
													{order.customer?.name || "Walk-in Customer"}
												</td>
												<td className="px-4 py-3 font-semibold">
													₹{Number(order.total_amount || 0).toFixed(2)}
												</td>
												<td className="px-4 py-3 text-muted-foreground text-xs">
													{order.created_at
														? new Date(order.created_at).toLocaleDateString()
														: "—"}
												</td>
												<td className="px-4 py-3 text-center">
													<span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-[11px] text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
														{t("unassignedRoute")}
													</span>
												</td>
												<td className="px-4 py-3 text-center">
													<Button
														size="sm"
														className="h-8 bg-blue-600 font-medium text-white text-xs shadow-sm hover:bg-blue-700"
														onClick={() => {
															setSelectedOrderIds([order.id]);
															setAssignOrder(order);
															setIsOrderAssignOpen(true);
														}}
													>
														<RouteIcon className="mr-1.5 h-3.5 w-3.5" />
														{t("assignRouteAndDriver")}
													</Button>
												</td>
											</tr>
										);
									})}
									{(!unassignedOrders || unassignedOrders.length === 0) && (
										<tr>
											<td
												colSpan={7}
												className="py-12 text-center text-muted-foreground"
											>
												<PackageIcon className="mx-auto mb-3 h-10 w-10 opacity-20" />
												<p>{t("noOrdersWaitingRouteAssignment")}</p>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				{/* Assign Order Route & Driver Modal */}
				<Dialog open={isOrderAssignOpen} onOpenChange={setIsOrderAssignOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<TruckIcon className="h-5 w-5 text-blue-600" />
								Assign Route & Driver
							</DialogTitle>
							<DialogDescription>
								Select a driver and vehicle for Order ORD-{assignOrder?.id} (
								{assignOrder?.customer?.name || "Customer"}) to dispatch it to
								the Packer Queue.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Order Ref:</span>
									<span className="font-bold font-mono text-blue-600">
										ORD-{assignOrder?.id}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Customer:</span>
									<span className="font-medium">
										{assignOrder?.customer?.name || "Walk-in Customer"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Amount:</span>
									<span className="font-semibold">
										₹{Number(assignOrder?.total_amount || 0).toFixed(2)}
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="font-medium text-xs">Assign Driver *</Label>
								<Select value={orderDriverId} onValueChange={setOrderDriverId}>
									<SelectTrigger>
										<SelectValue placeholder="Select Driver..." />
									</SelectTrigger>
									<SelectContent>
										{finalDrivers.map((d: any) => (
											<SelectItem key={d.id} value={d.id}>
												👤 {d.name} ({d.email || "Driver"})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="font-medium text-xs">
									Assign Vehicle / Truck
								</Label>
								<Select
									value={orderVehicleId}
									onValueChange={setOrderVehicleId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select Vehicle..." />
									</SelectTrigger>
									<SelectContent>
										{vehicles.map((v: any) => (
											<SelectItem key={v.id} value={v.id.toString()}>
												🚚 {v.name} ({v.registration_number})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsOrderAssignOpen(false)}
							>
								Cancel
							</Button>
							<Button
								className="bg-blue-600 text-white hover:bg-blue-700"
								disabled={createTripDirect.isPending || !orderDriverId}
								onClick={handleAssignOrderRoute}
							>
								{createTripDirect.isPending
									? "Assigning..."
									: "Assign & Send to Packer"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Delete Route Confirmation Modal */}
				<Dialog
					open={isDeleteRouteModalOpen}
					onOpenChange={setIsDeleteRouteModalOpen}
				>
					<DialogContent className="max-w-md border-red-200">
						<DialogHeader>
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
									<Trash2Icon className="h-5 w-5" />
								</div>
								<div>
									<DialogTitle className="font-bold text-lg text-slate-900">
										Delete Delivery Route?
									</DialogTitle>
									<DialogDescription className="text-slate-500 text-xs">
										This will permanently delete the route and all its stops.
										Active trips using this route will be unlinked.
									</DialogDescription>
								</div>
							</div>
						</DialogHeader>

						{routeToDelete && (
							<div className="py-2">
								<div className="space-y-2 rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-sm">
									<div className="flex items-center justify-between border-red-100/80 border-b pb-2 font-semibold text-slate-900">
										<span>{routeToDelete.name}</span>
										<span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-[10px] text-slate-600">
											{routeToDelete.stops?.length || 0} Stop(s)
										</span>
									</div>
									{routeToDelete.description && (
										<p className="text-slate-500 text-xs">
											{routeToDelete.description}
										</p>
									)}
									{routeToDelete.stops?.length > 0 && (
										<div className="space-y-1 pt-1">
											{routeToDelete.stops
												.slice(0, 4)
												.map((stop: any, idx: number) => (
													<div
														key={stop.id}
														className="flex items-center gap-2 text-slate-600 text-xs"
													>
														<div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-[9px] text-primary">
															{idx + 1}
														</div>
														{stop.customer?.name}
													</div>
												))}
											{routeToDelete.stops.length > 4 && (
												<p className="pl-6 text-slate-400 text-xs">
													+{routeToDelete.stops.length - 4} more stop(s)…
												</p>
											)}
										</div>
									)}
								</div>
							</div>
						)}

						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsDeleteRouteModalOpen(false);
									setRouteToDelete(null);
								}}
								disabled={deleteRouteMutation.isPending}
							>
								Keep Route
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={handleConfirmDeleteRoute}
								disabled={deleteRouteMutation.isPending}
								className="font-semibold shadow-sm"
							>
								{deleteRouteMutation.isPending
									? "Deleting..."
									: "Yes, Delete Route"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Delete Trip Confirmation Modal */}
				<Dialog
					open={isDeleteTripModalOpen}
					onOpenChange={setIsDeleteTripModalOpen}
				>
					<DialogContent className="max-w-md border-red-200">
						<DialogHeader>
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
									<Trash2Icon className="h-5 w-5" />
								</div>
								<div>
									<DialogTitle className="font-bold text-lg text-slate-900">
										Delete Delivery Trip?
									</DialogTitle>
									<DialogDescription className="text-slate-500 text-xs">
										This will permanently remove the trip and all its stops.
										Orders will be released back to the dispatch queue.
									</DialogDescription>
								</div>
							</div>
						</DialogHeader>

						{tripToDelete && (
							<div className="py-2">
								<div className="space-y-2.5 rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-sm">
									<div className="flex items-center justify-between border-red-100/80 border-b pb-2 font-semibold text-slate-900">
										<span>
											{tripToDelete.route?.name || `Trip #${tripToDelete.id}`}
										</span>
										<span
											className={`rounded px-2 py-0.5 font-bold text-[10px] uppercase ${
												tripToDelete.status === "cancelled"
													? "bg-red-100 text-red-700"
													: tripToDelete.status === "completed"
														? "bg-emerald-100 text-emerald-700"
														: "bg-blue-100 text-blue-700"
											}`}
										>
											{tripToDelete.status}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-2 text-slate-600 text-xs">
										<div>
											<span className="text-slate-400">Driver:</span>{" "}
											<span className="font-medium text-slate-800">
												{tripToDelete.driver?.name || "Unassigned"}
											</span>
										</div>
										<div>
											<span className="text-slate-400">Vehicle:</span>{" "}
											<span className="font-medium text-slate-800">
												{tripToDelete.vehicle?.name || "N/A"}
											</span>
										</div>
										<div className="col-span-2">
											<span className="text-slate-400">Total Stops:</span>{" "}
											<span className="font-medium text-slate-800">
												{tripToDelete.stops?.length || 0} Stop(s)
											</span>
										</div>
									</div>
								</div>
							</div>
						)}

						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsDeleteTripModalOpen(false);
									setTripToDelete(null);
								}}
								disabled={deleteTripMutation.isPending}
							>
								Keep Trip
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={handleConfirmDeleteTrip}
								disabled={deleteTripMutation.isPending}
								className="font-semibold shadow-sm"
							>
								{deleteTripMutation.isPending
									? "Deleting..."
									: "Yes, Delete Trip"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
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
						<div className="flex items-center space-x-2">
							{(routes.length > 0 || trips.length > 0) && (
								<Button
									variant="outline"
									className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 font-medium"
									onClick={() => setIsClearAllModalOpen(true)}
								>
									<Trash2Icon className="mr-1.5 h-4 w-4" />
									Clear All Routes & Trips
								</Button>
							)}
							<Dialog open={isQuickTripOpen} onOpenChange={setIsQuickTripOpen}>
								<DialogTrigger asChild>
									<Button variant="secondary">Quick Custom Trip</Button>
								</DialogTrigger>
								<DialogContent className="max-w-xl">
									<DialogHeader>
										<DialogTitle>Quick Dispatch</DialogTitle>
										<DialogDescription>
											Assign a custom trip directly without creating a saved
											route.
										</DialogDescription>
									</DialogHeader>
									<div className="max-h-[60vh] space-y-4 overflow-y-auto py-4 pr-2">
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
													{finalDrivers.map((d: any) => (
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
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label>Add Customers (Select to add to sequence)</Label>
												{quickTripCustomers.length > 1 && (
													<Button
														variant="outline"
														size="sm"
														onClick={handleOptimizeQuickTrip}
														disabled={optimizeRouteSequence.isPending}
														className="h-7 border-emerald-200 bg-emerald-50 font-semibold text-emerald-600 text-xs hover:bg-emerald-100"
													>
														✨ Auto-Optimize Route
													</Button>
												)}
											</div>
											<Select
												onValueChange={(val) =>
													setQuickTripCustomers([
														...quickTripCustomers,
														Number(val),
													])
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
											{quickTripCustomers.length > 0 && (
												<div className="mt-2 space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
													{quickTripCustomers.map((id, idx) => {
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
											onClick={handleCreateQuickTrip}
											disabled={
												createTripDirect.isPending ||
												!tripDriverId ||
												quickTripCustomers.length === 0
											}
										>
											Dispatch Trip
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>

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
										{/* Route Creation Mode Selection */}
										<div className="flex rounded-lg border bg-muted/40 p-1">
											<button
												type="button"
												className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
													routeCreationMode === "existing"
														? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
														: "text-muted-foreground hover:text-foreground"
												}`}
												onClick={() => setRouteCreationMode("existing")}
											>
												Registered Customers
											</button>
											<button
												type="button"
												className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
													routeCreationMode === "bulk"
														? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
														: "text-muted-foreground hover:text-foreground"
												}`}
												onClick={() => setRouteCreationMode("bulk")}
											>
												<span className="flex items-center justify-center gap-1.5">
													<ListPlusIcon className="h-3.5 w-3.5 text-primary" />
													Bulk Addresses & Numbers
												</span>
											</button>
										</div>

										{routeCreationMode === "existing" ? (
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<Label className="text-xs font-medium">Select Registered Customers</Label>
													{routeCustomers.length > 1 && (
														<Button
															variant="outline"
															size="sm"
															onClick={handleOptimizeRoute}
															disabled={optimizeRouteSequence.isPending}
															className="h-7 border-emerald-200 bg-emerald-50 font-semibold text-emerald-600 text-xs hover:bg-emerald-100"
														>
															✨ Auto-Optimize Route
														</Button>
													)}
												</div>
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
																{c.name} ({c.phone || "No Phone"}) {c.address ? `— ${c.address.slice(0, 30)}` : ""}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										) : (
											<div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
												<div className="space-y-1.5">
													<div className="flex items-center justify-between">
														<Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-900">
															<FileTextIcon className="h-4 w-4 text-primary" />
															Paste Multiple Addresses & Phone Numbers
														</Label>
													</div>
													<Textarea
														value={bulkAddressesText}
														onChange={(e) => setBulkAddressesText(e.target.value)}
														placeholder={`Paste addresses / phone numbers (one per line):\ne.g. Shop 12, MG Road, Pune - 9876543210\ne.g. Rahul Sharma, Flat 402 Galaxy Apt, Bandra 9820112233\ne.g. 9988776655, Sector 18 Noida`}
														rows={4}
														className="text-xs font-mono bg-white resize-none"
													/>
													<div className="flex justify-between items-center pt-1">
														<p className="text-[11px] text-muted-foreground">
															Supports name, address, and 10-digit Indian phone numbers automatically.
														</p>
														<Button
															type="button"
															size="sm"
															onClick={handleParseBulkAddresses}
															className="h-7 text-xs bg-primary text-white hover:bg-primary/90 shadow-sm"
														>
															<PlusIcon className="mr-1 h-3.5 w-3.5" />
															Parse & Add Stops
														</Button>
													</div>
												</div>

												{/* Quick Single Custom Address Input */}
												<div className="border-t border-primary/10 pt-3 space-y-2">
													<Label className="text-xs font-semibold text-slate-800">
														Or Add Single Custom Stop:
													</Label>
													<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
														<Input
															placeholder="Customer/Shop Name"
															value={manualStopName}
															onChange={(e) => setManualStopName(e.target.value)}
															className="h-8 text-xs bg-white"
														/>
														<Input
															placeholder="Phone (e.g. 9876543210)"
															value={manualStopPhone}
															onChange={(e) => setManualStopPhone(e.target.value)}
															className="h-8 text-xs bg-white"
														/>
														<Input
															placeholder="Full Address / Landmark"
															value={manualStopAddress}
															onChange={(e) => setManualStopAddress(e.target.value)}
															className="h-8 text-xs bg-white"
														/>
													</div>
													<div className="flex justify-end">
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={handleAddManualCustomStop}
															className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
														>
															+ Add Stop
														</Button>
													</div>
												</div>
											</div>
										)}

										{/* Combined Stops Preview List */}
										{(routeCustomers.length > 0 || customRouteStops.length > 0) && (
											<div className="space-y-2 pt-2">
												<div className="flex items-center justify-between">
													<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
														Stops Sequence ({routeCustomers.length + customRouteStops.length} Total)
													</Label>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-6 text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50"
														onClick={() => {
															setRouteCustomers([]);
															setCustomRouteStops([]);
														}}
													>
														Clear All Stops
													</Button>
												</div>

												<div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border bg-muted/20 p-2.5 text-xs">
													{/* Registered customer stops */}
													{routeCustomers.map((id, idx) => {
														const cust = customers.find((c: any) => c.id === id);
														return (
															<div
																key={`reg_${id}_${idx}`}
																className="flex items-center justify-between rounded-md bg-white p-2 shadow-xs dark:bg-slate-800"
															>
																<div className="flex items-center gap-2">
																	<div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-[10px] text-primary">
																		{idx + 1}
																	</div>
																	<div>
																		<span className="font-semibold text-slate-800 dark:text-slate-200">
																			{cust?.name || `Customer #${id}`}
																		</span>
																		{cust?.phone && (
																			<span className="ml-2 text-slate-500 font-mono text-[11px]">
																				📞 {cust.phone}
																			</span>
																		)}
																		{cust?.address && (
																			<p className="text-[11px] text-slate-400">
																				📍 {cust.address}
																			</p>
																		)}
																	</div>
																</div>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6 text-slate-400 hover:text-red-600"
																	onClick={() =>
																		setRouteCustomers(
																			routeCustomers.filter((cid) => cid !== id),
																		)
																	}
																>
																	×
																</Button>
															</div>
														);
													})}

													{/* Custom & Bulk parsed stops */}
													{customRouteStops.map((cStop, idx) => (
														<div
															key={cStop.id}
															className="flex items-center justify-between rounded-md bg-emerald-50/70 border border-emerald-100 p-2 shadow-xs dark:bg-emerald-950/30"
														>
															<div className="flex items-center gap-2">
																<div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">
																	{routeCustomers.length + idx + 1}
																</div>
																<div>
																	<span className="font-semibold text-emerald-950 dark:text-emerald-200">
																		{cStop.name}
																	</span>
																	{cStop.phone && (
																		<span className="ml-2 text-emerald-700 font-mono text-[11px]">
																			📞 {cStop.phone}
																		</span>
																	)}
																	{cStop.address && (
																		<p className="text-[11px] text-emerald-600/90">
																			📍 {cStop.address}
																		</p>
																	)}
																</div>
															</div>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-6 w-6 text-emerald-600 hover:text-red-600"
																onClick={() =>
																	setCustomRouteStops(
																		customRouteStops.filter((s) => s.id !== cStop.id),
																	)
																}
															>
																×
															</Button>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
									<DialogFooter>
										<Button
											onClick={handleCreateRoute}
											disabled={
												createRoute.isPending ||
												(!routeName.trim()) ||
												(routeCustomers.length === 0 && customRouteStops.length === 0)
											}
											className="font-semibold shadow-sm"
										>
											{createRoute.isPending ? "Creating Route..." : "Save Route with Stops"}
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
													{finalDrivers.map((d: any) => (
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
											<div className="mb-1 flex items-start justify-between">
												<h4 className="font-semibold text-base leading-tight">
													{route.name}
												</h4>
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 shrink-0 rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
													onClick={() => {
														setRouteToDelete(route);
														setIsDeleteRouteModalOpen(true);
													}}
												>
													<Trash2Icon className="h-4 w-4" />
												</Button>
											</div>
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

						{/* Trips Section */}
						<div className="mt-8 space-y-4">
							<div className="flex items-center justify-between border-b pb-2">
								<h3 className="font-bold text-xl">Assigned Trips</h3>
							</div>

							{trips.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No trips assigned yet.
								</p>
							) : (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{trips.map((trip: any) => (
										<div
											key={trip.id}
											className="group relative overflow-hidden rounded-md border p-4 shadow-sm"
										>
											<div
												className={`absolute top-0 left-0 h-full w-1 ${
													trip.status === "completed"
														? "bg-emerald-500"
														: trip.status === "active"
															? "bg-amber-500"
															: trip.status === "cancelled"
																? "bg-red-500"
																: "bg-primary"
												}`}
											/>
											<div className="flex items-start justify-between">
												<h4 className="font-semibold text-lg">
													{trip.route?.name || "Custom Trip"}
												</h4>
												<span
													className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase ${
														trip.status === "completed"
															? "bg-emerald-100 text-emerald-700"
															: trip.status === "active"
																? "bg-amber-100 text-amber-700"
																: trip.status === "cancelled"
																	? "bg-red-100 text-red-700"
																	: "bg-blue-100 text-blue-700"
													}`}
												>
													{trip.status}
												</span>
											</div>
											<div className="mt-3 space-y-2 text-muted-foreground text-sm">
												<div className="flex items-center gap-2">
													<div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
														<PackageIcon className="h-3 w-3" />
													</div>
													Driver:{" "}
													<span className="font-medium text-foreground">
														{trip.driver?.name}
													</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
														<TruckIcon className="h-3 w-3" />
													</div>
													Vehicle:{" "}
													<span className="font-medium text-foreground">
														{trip.vehicle?.name || "N/A"}
													</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
														<RouteIcon className="h-3 w-3" />
													</div>
													Stops:{" "}
													<span className="font-medium text-foreground">
														{trip.stops?.length || 0}
													</span>
												</div>
											</div>
											<div className="mt-4 flex gap-2">
												{trip.status === "pending" && (
													<Button
														variant="destructive"
														size="sm"
														className="flex-1 font-semibold shadow-sm transition-all hover:bg-red-700"
														onClick={() => {
															setTripToCancel(trip);
															setIsCancelModalOpen(true);
														}}
													>
														Cancel Trip
													</Button>
												)}
												<Button
													variant="outline"
													size="sm"
													className="shrink-0 border-red-200 text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
													onClick={() => {
														setTripToDelete(trip);
														setIsDeleteTripModalOpen(true);
													}}
												>
													<Trash2Icon className="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Trip Cancellation Confirmation Modal */}
						<Dialog
							open={isCancelModalOpen}
							onOpenChange={setIsCancelModalOpen}
						>
							<DialogContent className="max-w-md border-red-200">
								<DialogHeader>
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
											<AlertTriangleIcon className="h-5 w-5" />
										</div>
										<div>
											<DialogTitle className="font-bold text-lg text-slate-900">
												Cancel Delivery Trip?
											</DialogTitle>
											<DialogDescription className="text-slate-500 text-xs">
												Are you sure you want to cancel this trip? Assigned
												orders will be released back to dispatch.
											</DialogDescription>
										</div>
									</div>
								</DialogHeader>

								{tripToCancel && (
									<div className="space-y-4 py-2">
										<div className="space-y-2.5 rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-sm">
											<div className="flex items-center justify-between border-red-100/80 border-b pb-2 font-semibold text-slate-900">
												<span>
													{tripToCancel.route?.name ||
														`Trip #${tripToCancel.id}`}
												</span>
												<span className="rounded bg-red-100 px-2 py-0.5 font-bold text-[10px] text-red-700 uppercase">
													{tripToCancel.status}
												</span>
											</div>
											<div className="grid grid-cols-2 gap-2 text-slate-600 text-xs">
												<div>
													<span className="text-slate-400">Driver:</span>{" "}
													<span className="font-medium text-slate-800">
														{tripToCancel.driver?.name || "Unassigned"}
													</span>
												</div>
												<div>
													<span className="text-slate-400">Vehicle:</span>{" "}
													<span className="font-medium text-slate-800">
														{tripToCancel.vehicle?.name || "N/A"}
													</span>
												</div>
												<div className="col-span-2">
													<span className="text-slate-400">Total Stops:</span>{" "}
													<span className="font-medium text-slate-800">
														{tripToCancel.stops?.length || 0} Stop(s)
													</span>
												</div>
											</div>
										</div>

										<div className="space-y-1.5">
											<Label className="font-semibold text-slate-700 text-xs">
												Reason for Cancellation (Optional)
											</Label>
											<Select
												value={cancelReason}
												onValueChange={setCancelReason}
											>
												<SelectTrigger className="h-9 text-xs">
													<SelectValue placeholder="Select cancellation reason..." />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="driver_unavailable">
														Driver Unavailable
													</SelectItem>
													<SelectItem value="vehicle_breakdown">
														Vehicle Breakdown / Maintenance
													</SelectItem>
													<SelectItem value="route_reorganization">
														Route Reorganization
													</SelectItem>
													<SelectItem value="customer_reschedule">
														Customer Rescheduled
													</SelectItem>
													<SelectItem value="other">
														Other Operational Reason
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								)}

								<DialogFooter className="gap-2 sm:gap-0">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setIsCancelModalOpen(false);
											setTripToCancel(null);
										}}
										disabled={cancelTrip.isPending}
									>
										Keep Trip
									</Button>
									<Button
										type="button"
										variant="destructive"
										onClick={handleConfirmCancelTrip}
										disabled={cancelTrip.isPending}
										className="font-semibold shadow-sm"
									>
										{cancelTrip.isPending
											? "Cancelling..."
											: "Yes, Cancel Trip"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* Clear All Confirmation Modal */}
						<Dialog
							open={isClearAllModalOpen}
							onOpenChange={setIsClearAllModalOpen}
						>
							<DialogContent className="max-w-md border-red-200">
								<DialogHeader>
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
											<Trash2Icon className="h-5 w-5" />
										</div>
										<div>
											<DialogTitle className="font-bold text-lg text-slate-900">
												Delete All Routes & Trips?
											</DialogTitle>
											<DialogDescription className="text-slate-500 text-xs">
												This will permanently delete all {routes.length} route(s) and {trips.length} trip(s). All orders will be released back to the unassigned queue.
											</DialogDescription>
										</div>
									</div>
								</DialogHeader>

								<div className="py-2">
									<div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800 space-y-1">
										<p className="font-semibold flex items-center gap-1.5">
											<AlertTriangleIcon className="h-4 w-4 shrink-0 text-red-600" />
											Warning: This action cannot be undone!
										</p>
										<p className="text-red-700/90 leading-relaxed">
											All route stops, trip stops, and delivery tracking entries will be erased so you can set up fresh routes from scratch.
										</p>
									</div>
								</div>

								<DialogFooter className="gap-2 sm:gap-0">
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsClearAllModalOpen(false)}
										disabled={clearAllMutation.isPending}
									>
										Cancel
									</Button>
									<Button
										type="button"
										variant="destructive"
										onClick={handleConfirmClearAll}
										disabled={clearAllMutation.isPending}
										className="font-semibold shadow-sm"
									>
										{clearAllMutation.isPending
											? "Deleting Everything..."
											: "Yes, Delete All Routes & Trips"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
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
										Moving at 45 km/h â€¢ ETA 10 mins
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
						<CardTitle>Cash & Online Settlements</CardTitle>
						<CardDescription>
							Verify end-of-day collections brought by drivers from customer
							handovers.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{driverCollections.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No pending or completed driver settlements.
							</p>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm">
									<thead>
										<tr className="border-b text-muted-foreground">
											<th className="px-3 py-2 font-medium">Driver</th>
											<th className="px-3 py-2 font-medium">Method</th>
											<th className="px-3 py-2 font-medium">Amount</th>
											<th className="px-3 py-2 font-medium">Ref / Txn ID</th>
											<th className="px-3 py-2 font-medium">Collected At</th>
											<th className="px-3 py-2 font-medium">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{driverCollections.map((col: any) => (
											<tr key={col.id} className="hover:bg-muted/50">
												<td className="px-3 py-3 font-medium">
													<div>{col.driverName}</div>
													<div className="text-muted-foreground text-xs">
														{col.driverEmail}
													</div>
												</td>
												<td className="px-3 py-3 capitalize">
													<span
														className={`inline-flex items-center rounded px-2 py-0.5 font-medium text-xs ${
															col.paymentMethod?.toLowerCase() === "cash"
																? "bg-amber-100 text-amber-800"
																: "bg-blue-100 text-blue-800"
														}`}
													>
														{col.paymentMethod}
													</span>
												</td>
												<td className="px-3 py-3 font-semibold text-emerald-600">
													₹{Number(col.amount).toLocaleString("en-IN")}
												</td>
												<td className="px-3 py-3 font-mono text-xs">
													{col.transactionId || col.referenceNumber}
												</td>
												<td className="px-3 py-3 text-muted-foreground text-xs">
													{col.collectedAt}
												</td>
												<td className="px-3 py-3">
													<span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 text-xs">
														{col.status}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
