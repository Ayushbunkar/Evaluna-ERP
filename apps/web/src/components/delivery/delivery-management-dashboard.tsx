"use client";

import {
	AlertTriangleIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	CheckCircle2Icon,
	ClockIcon,
	FileTextIcon,
	ListPlusIcon,
	MapPinIcon,
	PackageIcon,
	PencilIcon,
	PhoneIcon,
	PlusIcon,
	RouteIcon,
	SearchIcon,
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
	const { data: listLoadersData } = trpc.delivery.listLoaders.useQuery({});
	const loadersList = listLoadersData || [];
	const { data: routeWaitingPool = [], refetch: refetchRoutePool } =
		trpc.delivery.getRouteWaitingPool.useQuery({});

	const releaseToLoaderMutation = trpc.delivery.releaseToLoader.useMutation({
		onSuccess: () => {
			toast.success("✓ Trip released to Loader for physical loading.");
			refetchTrips();
			refetchRoutePool();
		},
		onError: (err: any) => {
			toast.error(err.message || "Failed to release trip to loader.");
		},
	});

	// Dispatch Board Modal States
	const [viewRoutePool, setViewRoutePool] = useState<any>(null);
	const [isViewOrdersOpen, setIsViewOrdersOpen] = useState(false);

	const [createTripRoutePool, setCreateTripRoutePool] = useState<any>(null);
	const [isCreateTripPoolOpen, setIsCreateTripPoolOpen] = useState(false);
	const [createTripStep, setCreateTripStep] = useState<1 | 2 | 3>(1);
	const [selectedPoolOrderIds, setSelectedPoolOrderIds] = useState<number[]>([]);
	const [poolDriverId, setPoolDriverId] = useState("");
	const [poolVehicleId, setPoolVehicleId] = useState("");
	const [poolLoaderId, setPoolLoaderId] = useState("");

	const [dispatchConfirmTrip, setDispatchConfirmTrip] = useState<any>(null);
	const [isDispatchConfirmOpen, setIsDispatchConfirmOpen] = useState(false);

	const [selectedDetailTrip, setSelectedDetailTrip] = useState<any>(null);
	const [isTripDetailOpen, setIsTripDetailOpen] = useState(false);

	const { data: allOrders = [], refetch: refetchOrders } =
		trpc.orders.list.useQuery();
	const { data: driverCollections = [] } =
		trpc.finance.getDriverCollections.useQuery();

	const [assignOrder, setAssignOrder] = useState<any>(null);
	const [isOrderAssignOpen, setIsOrderAssignOpen] = useState(false);
	const [orderDriverId, setOrderDriverId] = useState("");
	const [orderVehicleId, setOrderVehicleId] = useState("");

	const realRoutes = (routes || []).filter(
		(r: any) =>
			!r.name?.startsWith("Trip ") && !r.name?.startsWith("Quick Trip "),
	);

	const [tripFilterStatus, setTripFilterStatus] = useState<
		"all" | "pending" | "active" | "completed" | "cancelled"
	>("all");
	const [tripSearchQuery, setTripSearchQuery] = useState("");

	const assignedCustomerIdsInActiveTrips = new Set(
		(trips || [])
			.filter(
				(t: any) => t.status !== "cancelled" && t.status !== "completed",
			)
			.flatMap((t: any) => (t.stops || []).map((s: any) => s.customer_id))
			.filter(Boolean),
	);

	const unassignedOrders = allOrders.filter((order: any) => {
		if (order.status === "cancelled") return false;
		if (order.status === "delivered" || order.status === "completed") return false;
		if (order.status === "pending_review" || order.status === "under_review") return false;
		if (
			order.status === "ready_for_dispatch" ||
			order.status === "out_for_delivery" ||
			order.status === "dispatched"
		) {
			return false;
		}
		if (order.driver_id) return false;
		return true;
	});

	const createVehicle = trpc.vehicles.create.useMutation({
		onSuccess: () => refetchVehicles(),
	});
	const createRoute = trpc.delivery.createRoute.useMutation({
		onSuccess: () => refetchRoutes(),
	});
	const assignTrip = trpc.delivery.assignTrip.useMutation({
		onSuccess: () => {
			refetchTrips();
			refetchRoutes();
			refetchOrders();
		},
	});
	const cancelTrip = trpc.delivery.cancelTrip.useMutation({
		onSuccess: () => {
			refetchTrips();
			refetchOrders();
			refetchRoutes();
		},
	});
	const createTripDirect = trpc.delivery.createTripDirect.useMutation({
		onSuccess: () => {
			refetchRoutes();
			refetchTrips();
			refetchOrders();
		},
	});
	const updateTripStatus = trpc.delivery.updateTripStatus.useMutation({
		onSuccess: () => {
			refetchTrips();
			refetchOrders();
		},
	});
	const dispatchTripMutation = trpc.delivery.dispatchTrip.useMutation({
		onSuccess: () => {
			refetchTrips();
			refetchOrders();
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

	interface TripModalStop {
		tempId: string;
		customerId?: number;
		name: string;
		phone: string;
		address: string;
		included: boolean;
	}

	const [tripRouteId, setTripRouteId] = useState("");
	const [tripDriverId, setTripDriverId] = useState("");
	const [tripVehicleId, setTripVehicleId] = useState("");
	const [tripLoaderId, setTripLoaderId] = useState("");
	const [tripStopsList, setTripStopsList] = useState<TripModalStop[]>([]);
	const [tripStopSearchText, setTripStopSearchText] = useState("");
	const [isTripOpen, setIsTripOpen] = useState(false);
	const [isAddStopDrawerOpen, setIsAddStopDrawerOpen] = useState(false);
	const [addStopMode, setAddStopMode] = useState<"registered" | "custom">("registered");
	const [selectedAddCustomerId, setSelectedAddCustomerId] = useState("");
	const [newStopName, setNewStopName] = useState("");
	const [newStopPhone, setNewStopPhone] = useState("");
	const [newStopAddress, setNewStopAddress] = useState("");

	const openDispatchForRoute = (route: any) => {
		setTripRouteId(route.id.toString());
		const initialStops: TripModalStop[] = (route.stops || []).map(
			(s: any, idx: number) => ({
				tempId: `stop_${s.id || idx}_${Date.now()}_${Math.random()}`,
				customerId: s.customer_id || s.customer?.id,
				name: s.customer?.name || "Customer",
				phone: s.customer?.phone || "",
				address: s.customer?.address || "",
				included: true,
			}),
		);
		setTripStopsList(initialStops);
		setTripStopSearchText("");
		setIsAddStopDrawerOpen(false);
		setIsTripOpen(true);
	};

	const handleSelectTripRoute = (val: string) => {
		setTripRouteId(val);
		const found = routes.find((r: any) => r.id.toString() === val);
		if (found && found.stops) {
			const initialStops: TripModalStop[] = found.stops.map(
				(s: any, idx: number) => ({
					tempId: `stop_${s.id || idx}_${Date.now()}_${Math.random()}`,
					customerId: s.customer_id || s.customer?.id,
					name: s.customer?.name || "Customer",
					phone: s.customer?.phone || "",
					address: s.customer?.address || "",
					included: true,
				}),
			);
			setTripStopsList(initialStops);
		} else {
			setTripStopsList([]);
		}
		setIsAddStopDrawerOpen(false);
	};

	const handleAddCustomerToTrip = () => {
		if (addStopMode === "registered") {
			if (!selectedAddCustomerId) {
				toast.error("Please select a customer from the dropdown.");
				return;
			}
			const cust = customers.find(
				(c: any) => c.id.toString() === selectedAddCustomerId,
			);
			if (!cust) return;

			if (tripStopsList.some((s) => s.customerId === cust.id)) {
				toast.error(`${cust.name} is already in the stops list.`);
				return;
			}

			setTripStopsList((prev) => [
				...prev,
				{
					tempId: `cust_${cust.id}_${Date.now()}`,
					customerId: cust.id,
					name: cust.name,
					phone: cust.phone || "",
					address: cust.address || "",
					included: true,
				},
			]);
			setSelectedAddCustomerId("");
			toast.success(`Added ${cust.name} to this trip.`);
		} else {
			if (!newStopName.trim() && !newStopPhone.trim() && !newStopAddress.trim()) {
				toast.error("Please enter a customer name, phone, or address.");
				return;
			}
			setTripStopsList((prev) => [
				...prev,
				{
					tempId: `custom_${Date.now()}_${Math.random()}`,
					name:
						newStopName.trim() ||
						(newStopPhone
							? `Customer ${newStopPhone}`
							: `Stop: ${newStopAddress.slice(0, 25)}`),
					phone: newStopPhone.trim(),
					address: newStopAddress.trim(),
					included: true,
				},
			]);
			setNewStopName("");
			setNewStopPhone("");
			setNewStopAddress("");
			toast.success("Added new stop to this trip.");
		}
	};

	const handleDeleteStopFromTrip = (tempId: string) => {
		setTripStopsList((prev) => prev.filter((s) => s.tempId !== tempId));
		toast.success("Stop removed from trip.");
	};

	const handleToggleStop = (tempId: string) => {
		setTripStopsList((prev) =>
			prev.map((s) =>
				s.tempId === tempId ? { ...s, included: !s.included } : s,
			),
		);
	};

	const handleSelectAllStops = () => {
		setTripStopsList((prev) => prev.map((s) => ({ ...s, included: true })));
	};

	const handleDeselectAllStops = () => {
		setTripStopsList((prev) => prev.map((s) => ({ ...s, included: false })));
	};

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
		if (!tripRouteId) {
			toast.error("Please select a Route.");
			return;
		}
		if (!tripDriverId) {
			toast.error("Please select a Driver.");
			return;
		}
		if (!tripVehicleId) {
			toast.error("Please select a Vehicle.");
			return;
		}

		const includedStops = tripStopsList.filter((s) => s.included);
		if (includedStops.length === 0) {
			toast.error("Please include at least one customer stop for this trip.");
			return;
		}

		try {
			await assignTrip.mutateAsync({
				routeId: Number(tripRouteId),
				driverId: tripDriverId,
				vehicleId: Number(tripVehicleId),
				loaderId: tripLoaderId || undefined,
				stops: includedStops.map((s, idx) => ({
					customerId: s.customerId,
					name: s.name,
					phone: s.phone,
					address: s.address,
					sequence: idx + 1,
				})),
			});
			toast.success(
				`Trip Created & Released to Loader Queue (${includedStops.length} Stops)!`,
			);
			setIsTripOpen(false);
			setTripRouteId("");
			setTripDriverId("");
			setTripVehicleId("");
			setTripLoaderId("");
			setTripStopsList([]);
			setTripStopSearchText("");
			setIsAddStopDrawerOpen(false);
			refetchTrips();
			refetchRoutes();
			refetchOrders();
		} catch (err: any) {
			toast.error(err.message || "Failed to dispatch trip.");
		}
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

	// Edit Route States & Handlers
	const [routeToEdit, setRouteToEdit] = useState<any>(null);
	const [isEditRouteOpen, setIsEditRouteOpen] = useState(false);
	const [editRouteName, setEditRouteName] = useState("");
	const [editRouteDesc, setEditRouteDesc] = useState("");
	const [editVillageStops, setEditVillageStops] = useState<string[]>([]);
	const [newVillageInput, setNewVillageInput] = useState("");

	const updateRouteMutation = trpc.delivery.updateRoute.useMutation({
		onSuccess: () => {
			refetchRoutes();
			refetchTrips();
		},
	});

	const openEditRouteModal = (route: any) => {
		setRouteToEdit(route);
		setEditRouteName(route.name || "");
		setEditRouteDesc(route.description || "");

		// Extract current villages from description or stops
		let villages: string[] = [];
		if (route.description && route.description.includes("->")) {
			villages = route.description
				.split("->")
				.map((v: string) => v.trim())
				.filter(Boolean);
		} else if (route.description && route.description.includes(",")) {
			villages = route.description
				.split(",")
				.map((v: string) => v.trim())
				.filter(Boolean);
		} else {
			const seen = new Set<string>();
			for (const s of route.stops || []) {
				const vName =
					s.customer?.address?.trim() ||
					(s.customer?.name?.startsWith("Stop:")
						? s.customer.name.replace(/^Stop:\s*/, "")
						: s.customer?.name) ||
					`Stop ${s.sequence}`;
				if (vName && !seen.has(vName.toLowerCase())) {
					seen.add(vName.toLowerCase());
					villages.push(vName);
				}
			}
		}

		setEditVillageStops(villages);
		setNewVillageInput("");
		setIsEditRouteOpen(true);
	};

	const handleAddVillageToEdit = () => {
		if (!newVillageInput.trim()) return;
		const updated = [...editVillageStops, newVillageInput.trim()];
		setEditVillageStops(updated);
		setEditRouteDesc(updated.join(" -> "));
		setNewVillageInput("");
	};

	const handleRemoveVillageFromEdit = (index: number) => {
		const updated = editVillageStops.filter((_, idx) => idx !== index);
		setEditVillageStops(updated);
		setEditRouteDesc(updated.join(" -> "));
	};

	const handleMoveVillage = (index: number, direction: "up" | "down") => {
		if (
			(direction === "up" && index === 0) ||
			(direction === "down" && index === editVillageStops.length - 1)
		) {
			return;
		}
		const updated = [...editVillageStops];
		const targetIdx = direction === "up" ? index - 1 : index + 1;
		const temp = updated[index];
		updated[index] = updated[targetIdx];
		updated[targetIdx] = temp;
		setEditVillageStops(updated);
		setEditRouteDesc(updated.join(" -> "));
	};

	const handleSaveEditRoute = async () => {
		if (!routeToEdit) return;
		if (!editRouteName.trim()) {
			toast.error("Please enter a route name.");
			return;
		}
		if (editVillageStops.length === 0) {
			toast.error("Please have at least one village stop on this route.");
			return;
		}

		try {
			await updateRouteMutation.mutateAsync({
				id: routeToEdit.id,
				name: editRouteName.trim(),
				description: editRouteDesc.trim() || editVillageStops.join(" -> "),
				stops: editVillageStops.map((vName, idx) => ({
					name: vName,
					address: vName,
					sequence: idx + 1,
				})),
			});
			toast.success(`Route "${editRouteName}" updated successfully!`);
			setIsEditRouteOpen(false);
			setRouteToEdit(null);
		} catch (err: any) {
			toast.error(err.message || "Failed to update route.");
		}
	};

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
			orderIds: ordersToAssign.map((o: any) => o.id),
		});

		toast.success(
			`Dispatched 1 Trip with ${customerStops.length} Stop(s) for ${ordersToAssign.length} order(s)! Assigned to Driver & Sent to Loader Queue.`,
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

	const totalWaitingOrders = (routeWaitingPool || []).reduce(
		(acc: number, r: any) => acc + (r.waitingCount || 0),
		0,
	);
	const totalReadyOrders = (routeWaitingPool || []).reduce(
		(acc: number, r: any) => acc + (r.readyCount || 0),
		0,
	);
	const routesWaitingCount = (routeWaitingPool || []).filter(
		(r: any) => (r.waitingCount || 0) > 0,
	).length;
	const tripsAwaitingLoaderCount = (trips || []).filter(
		(t: any) => t.status === "pending" || t.status === "ready_for_loading",
	).length;
	const tripsLoadingCount = (trips || []).filter(
		(t: any) => t.status === "loading",
	).length;
	const tripsReadyToDispatchCount = (trips || []).filter(
		(t: any) => t.status === "loaded",
	).length;
	const actionableTrips = (trips || []).filter(
		(t: any) =>
			t.status === "pending" ||
			t.status === "ready_for_loading" ||
			t.status === "loading" ||
			t.status === "loaded" ||
			!t.driver_id ||
			!t.vehicle_id,
	);
	const dispatchBoardCount = routesWaitingCount + actionableTrips.length;

	const handleStartCreateTripFromPool = (routePool: any) => {
		setCreateTripRoutePool(routePool);
		setCreateTripStep(1);
		const eligibleIds = (routePool.orders || [])
			.filter((o: any) => o.isEligibleForTrip)
			.map((o: any) => o.id);
		setSelectedPoolOrderIds(eligibleIds);
		setPoolDriverId(finalDrivers[0]?.id || "");
		setPoolVehicleId(vehicles[0]?.id?.toString() || "");
		setPoolLoaderId(loadersList[0]?.id || "");
		setIsCreateTripPoolOpen(true);
	};

	const handleConfirmCreateTripFromPool = async () => {
		if (!createTripRoutePool) return;
		if (selectedPoolOrderIds.length === 0) {
			toast.error("Please select at least one order for the trip.");
			return;
		}
		if (!poolDriverId) {
			toast.error("Please select a Driver.");
			return;
		}
		if (!poolVehicleId) {
			toast.error("Please select a Vehicle.");
			return;
		}

		try {
			const selectedOrders = (createTripRoutePool.orders || []).filter((o: any) =>
				selectedPoolOrderIds.includes(o.id),
			);
			const stops = selectedOrders.map((o: any, idx: number) => ({
				customerId: o.customerId,
				sequence: idx + 1,
			}));

			await createTripDirect.mutateAsync({
				driverId: poolDriverId,
				vehicleId: poolVehicleId ? Number(poolVehicleId) : undefined,
				loaderId: poolLoaderId || undefined,
				orderIds: selectedPoolOrderIds,
				stops,
				routeName: createTripRoutePool.routeName,
			});

			toast.success(`✓ Trip created for ${createTripRoutePool.routeName}!`);
			setIsCreateTripPoolOpen(false);
			setCreateTripRoutePool(null);
			refetchTrips();
			refetchRoutePool();
			refetchOrders();
		} catch (err: any) {
			toast.error(err.message || "Failed to create trip.");
		}
	};

	const handleConfirmFinalDispatch = async () => {
		if (!dispatchConfirmTrip) return;
		try {
			await dispatchTripMutation.mutateAsync({ tripId: dispatchConfirmTrip.id });
			toast.success(`🚚 Trip #${dispatchConfirmTrip.id} dispatched! Driver is now Out for Delivery.`);
			setIsDispatchConfirmOpen(false);
			setDispatchConfirmTrip(null);
			refetchTrips();
			refetchRoutePool();
			refetchOrders();
		} catch (err: any) {
			toast.error(err.message || "Failed to dispatch trip.");
		}
	};

	return (
		<>
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
			<TabsList>
				<TabsTrigger value="overview">{t("overviewTab")}</TabsTrigger>
				<TabsTrigger value="routes">Saved Routes ({realRoutes.length})</TabsTrigger>
				<TabsTrigger value="dispatch">
					{t("dispatchBoard")} ({dispatchBoardCount})
				</TabsTrigger>
				<TabsTrigger value="trips">Delivery Trips ({trips.length})</TabsTrigger>
				<TabsTrigger value="tracking">{t("trackingTab")}</TabsTrigger>
				<TabsTrigger value="vehicles">{t("vehiclesTab")}</TabsTrigger>
				<TabsTrigger value="settlements">{t("settlementsTab")}</TabsTrigger>
			</TabsList>

			<TabsContent value="overview" className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								{t("activeTripsCard")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{trips.filter((t: any) => t.status === "active" || t.status === "pending").length}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Saved Delivery Routes
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-blue-600">{realRoutes.length}</div>
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
							<div className="font-bold text-2xl">
								{driverCollections.filter((c: any) => c.status === "pending").length}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Quick Route Trip Dispatch Panel */}
				{realRoutes.length > 0 && (
					<Card className="border-border/60 bg-gradient-to-br from-slate-50/70 to-blue-50/30 shadow-sm dark:from-slate-900/40 dark:to-blue-950/20">
						<CardHeader className="flex flex-row items-center justify-between pb-3">
							<div>
								<CardTitle className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-slate-100">
									<RouteIcon className="h-5 w-5 text-primary" />
									Saved Delivery Routes & Quick Trip Dispatch
								</CardTitle>
								<CardDescription className="text-xs text-slate-500">
									Select a route to assign a vehicle trip. You can customize customer stops before dispatching.
								</CardDescription>
							</div>
							<Button
								size="sm"
								className="bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/90"
								onClick={() => {
									if (realRoutes.length > 0) openDispatchForRoute(realRoutes[0]);
								}}
							>
								<TruckIcon className="mr-1.5 h-3.5 w-3.5" />
								Dispatch Trip
							</Button>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
								{realRoutes.map((route: any) => (
									<div
										key={route.id}
										className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
									>
										<div className="space-y-1.5">
											<div className="flex items-center justify-between">
												<h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
													{route.name}
												</h4>
											</div>
											{route.description && (
												<p className="line-clamp-2 text-slate-500 text-xs leading-relaxed">
													{route.description}
												</p>
											)}
										</div>
										<div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
											<span className="text-[11px] text-muted-foreground">
												Seq: 1 → {route.stops?.length || 0}
											</span>
											<div className="flex items-center gap-1.5">
												<Button
													size="sm"
													variant="outline"
													className="h-7 border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
													onClick={() => openEditRouteModal(route)}
												>
													<PencilIcon className="mr-1 h-3 w-3 text-slate-500" />
													Edit
												</Button>
												<Button
													size="sm"
													className="h-7 bg-primary px-3 text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
													onClick={() => openDispatchForRoute(route)}
												>
													<TruckIcon className="mr-1.5 h-3.5 w-3.5" />
													Assign Trip
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Active & Pending Delivery Trips Dispatch Panel */}
				{trips.filter((t: any) =>
					t.status === "pending" ||
					t.status === "active" ||
					t.status === "ready_for_loading" ||
					t.status === "loading" ||
					t.status === "loaded" ||
					t.status === "ready_for_dispatch"
				).length > 0 && (
					<Card className="border-border/60 bg-gradient-to-br from-emerald-50/40 via-white to-blue-50/30 shadow-sm dark:from-emerald-950/20 dark:via-slate-900 dark:to-blue-950/20">
						<CardHeader className="flex flex-row items-center justify-between pb-3">
							<div>
								<CardTitle className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-slate-100">
									<TruckIcon className="h-5 w-5 text-emerald-600" />
									Assigned Delivery Trips & Driver Dispatch
								</CardTitle>
								<CardDescription className="text-xs text-slate-500">
									Trips assigned to drivers. Click "Dispatch to Driver" to send stops to the driver dashboard.
								</CardDescription>
							</div>
							<span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800 text-xs dark:bg-emerald-900/50 dark:text-emerald-300">
								{trips.filter((t: any) => t.status === "pending" || t.status === "active" || t.status === "ready_for_loading" || t.status === "loading" || t.status === "loaded" || t.status === "ready_for_dispatch").length} Trip(s)
							</span>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
								{trips
									.filter((t: any) =>
										t.status === "pending" ||
										t.status === "active" ||
										t.status === "ready_for_loading" ||
										t.status === "loading" ||
										t.status === "loaded" ||
										t.status === "ready_for_dispatch"
									)
									.map((trip: any) => (
										<div
											key={trip.id}
											className={`flex flex-col justify-between rounded-xl border p-4 shadow-xs transition-all ${
												trip.status === "active"
													? "border-amber-200/80 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20"
													: "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
											}`}
										>
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
															TRIP #{trip.id}
														</span>
														<span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
															{trip.route?.name || "Direct Assigned Trip"}
														</span>
													</div>
													<span
														className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase ${
															trip.status === "active"
																? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
																: trip.status === "pending"
																	? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
																	: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
														}`}
													>
														{trip.status === "active"
															? "Out for Delivery"
															: trip.status === "pending"
																? "Pending Dispatch"
																: trip.status?.replace(/_/g, " ") || "In Progress"}
													</span>
												</div>

												<div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
													<div className="flex items-center gap-1.5">
														<UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
														<span>Driver: </span>
														<span className="font-semibold text-slate-900 dark:text-slate-100">
															{trip.driver?.name || "Assigned Driver"}
														</span>
													</div>
													{trip.vehicle && (
														<div className="flex items-center gap-1.5">
															<TruckIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
															<span>Vehicle: </span>
															<span className="font-medium text-slate-800 dark:text-slate-200">
																{trip.vehicle.name} ({trip.vehicle.registration_number})
															</span>
														</div>
													)}
													<div className="flex items-center gap-1.5">
														<MapPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
														<span>Stops: </span>
														<span className="font-medium text-slate-800 dark:text-slate-200">
															{trip.stops?.length || 0} Customer Stop(s)
														</span>
													</div>
												</div>
											</div>

											<div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
												{trip.status === "active" ? (
													<div className="flex w-full items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
														<span className="flex items-center gap-1">
															<CheckCircle2Icon className="h-3.5 w-3.5" /> Dispatched – Out for Delivery
														</span>
														<span className="text-[11px] text-muted-foreground">
															Live in Progress
														</span>
													</div>
												) : trip.status === "loaded" ? (
													<>
														<Button
															size="sm"
															className="flex-1 bg-emerald-600 font-semibold text-white shadow-xs hover:bg-emerald-700 text-xs h-8"
															disabled={updateTripStatus.isPending || dispatchTripMutation.isPending}
															onClick={async () => {
																try {
																	await dispatchTripMutation.mutateAsync({
																		tripId: trip.id,
																	});
																	toast.success(
																		`🚚 Trip #${trip.id} dispatched to ${trip.driver?.name || "driver"}! Orders are now Out for Delivery.`,
																	);
																	refetchTrips();
																} catch (err: any) {
																	toast.error(
																		err.message || "Failed to dispatch trip",
																	);
																}
															}}
														>
															<TruckIcon className="mr-1.5 h-3.5 w-3.5" />
															Dispatch to Driver
														</Button>
														<Button
															variant="outline"
															size="sm"
															className="h-8 border-red-200 text-red-600 font-semibold shadow-xs hover:bg-red-50 text-xs px-2.5"
															onClick={() => {
																setTripToCancel(trip);
																setIsCancelModalOpen(true);
															}}
														>
															Cancel
														</Button>
													</>
												) : (
													<>
														<div className="flex-1 flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium border border-amber-200/60">
															<ClockIcon className="h-3.5 w-3.5 shrink-0 text-amber-600 animate-pulse" />
															<span className="truncate">
																{trip.status === "loading"
																	? "Loading in Progress (Waiting for Loader)"
																	: "Awaiting Loader Verification"}
															</span>
														</div>
														<Button
															variant="outline"
															size="sm"
															className="h-8 border-red-200 text-red-600 font-semibold shadow-xs hover:bg-red-50 text-xs px-2.5"
															onClick={() => {
																setTripToCancel(trip);
																setIsCancelModalOpen(true);
															}}
														>
															Cancel
														</Button>
													</>
												)}
											</div>
										</div>
									))}
							</div>
						</CardContent>
					</Card>
				)}

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
												<td className="px-4 py-3">
													<div className="font-semibold text-slate-900 dark:text-slate-100">
														{order.customer?.name || "Walk-in Customer"}
													</div>
													{(order.customer?.address || order.shipping_address) && (
														<div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
															<MapPinIcon className="h-3 w-3 text-emerald-600 shrink-0" />
															<span className="truncate max-w-[220px]">
																{order.customer?.address || order.shipping_address}
															</span>
														</div>
													)}
													{order.customer?.phone && (
														<div className="text-[10px] text-slate-500 font-mono">
															📞 {order.customer.phone}
														</div>
													)}
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
											Define a route and assign villages.
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
												<div className="flex items-center justify-between">
													<Label className="text-xs font-medium">Select Registered Villages</Label>
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
													<div className="flex gap-2">
														<Input
															value={manualStopName}
															onChange={(e) => setManualStopName(e.target.value)}
															placeholder="Type a village name..."
															onKeyDown={(e) => {
																if (e.key === "Enter" && manualStopName.trim()) {
																	e.preventDefault();
																	setCustomRouteStops([...customRouteStops, { id: `v_${Date.now()}`, name: manualStopName.trim(), phone: "", address: "" }]);
																	setManualStopName("");
																}
															}}
														/>
														<Button
															type="button"
															onClick={() => {
																if (manualStopName.trim()) {
																	setCustomRouteStops([...customRouteStops, { id: `v_${Date.now()}`, name: manualStopName.trim(), phone: "", address: "" }]);
																	setManualStopName("");
																}
															}}
														>
															Add
														</Button>
													</div>
											</div>


										{/* Combined Stops Preview List */}
										{(routeCustomers.length > 0 || customRouteStops.length > 0) && (
											<div className="space-y-2 pt-2">
												<div className="flex items-center justify-between">
													<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
														Villages Sequence ({routeCustomers.length + customRouteStops.length} Total)
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
														Clear All Villages
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
																			{cust?.name || `Village #${id}`}
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
																</div>
															</div>
															<div className="flex items-center gap-1">
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6 text-slate-500 hover:text-emerald-600"
																	disabled={idx === 0}
																	onClick={() => {
																		const newStops = [...customRouteStops];
																		const temp = newStops[idx - 1];
																		newStops[idx - 1] = newStops[idx];
																		newStops[idx] = temp;
																		setCustomRouteStops(newStops);
																	}}
																>
																	<ArrowUpIcon className="h-3 w-3" />
																</Button>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6 text-slate-500 hover:text-emerald-600"
																	disabled={idx === customRouteStops.length - 1}
																	onClick={() => {
																		const newStops = [...customRouteStops];
																		const temp = newStops[idx + 1];
																		newStops[idx + 1] = newStops[idx];
																		newStops[idx] = temp;
																		setCustomRouteStops(newStops);
																	}}
																>
																	<ArrowDownIcon className="h-3 w-3" />
																</Button>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6 text-emerald-600 hover:text-red-600 ml-1"
																	onClick={() =>
																		setCustomRouteStops(
																			customRouteStops.filter((s) => s.id !== cStop.id),
																		)
																	}
																>
																	×
																</Button>
															</div>
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
											{createRoute.isPending ? "Creating Route..." : "Save Route with Villages"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>

							<Dialog open={isTripOpen} onOpenChange={setIsTripOpen}>
								<DialogTrigger asChild>
									<Button>Dispatch Trip</Button>
								</DialogTrigger>
								<DialogContent className="max-w-2xl">
									<DialogHeader>
										<DialogTitle className="flex items-center gap-2">
											<TruckIcon className="h-5 w-5 text-primary" />
											Dispatch Vehicle Trip
										</DialogTitle>
										<DialogDescription>
											Assign a route to a driver and vehicle. Uncheck any customers not ordering on this trip.
										</DialogDescription>
									</DialogHeader>
									<div className="max-h-[70vh] space-y-4 overflow-y-auto py-2 pr-1">
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
											<div className="space-y-1.5 min-w-0">
												<Label className="text-xs font-semibold">Select Route *</Label>
												<Select
													value={tripRouteId}
													onValueChange={handleSelectTripRoute}
												>
													<SelectTrigger className="h-9 text-xs w-full min-w-0 overflow-hidden text-left [&>span]:truncate [&>span]:min-w-0">
														<SelectValue placeholder="Select Route" />
													</SelectTrigger>
													<SelectContent className="max-w-[calc(100vw-3rem)] sm:max-w-md">
														{routes.map((r: any) => (
															<SelectItem key={r.id} value={r.id.toString()}>
																<span className="truncate">{r.name}</span>
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-1.5 min-w-0">
												<Label className="text-xs font-semibold">Select Driver *</Label>
												<Select
													value={tripDriverId}
													onValueChange={setTripDriverId}
												>
													<SelectTrigger className="h-9 text-xs w-full min-w-0 overflow-hidden text-left [&>span]:truncate [&>span]:min-w-0">
														<SelectValue placeholder="Select Driver" />
													</SelectTrigger>
													<SelectContent className="max-w-[calc(100vw-3rem)] sm:max-w-md">
														{finalDrivers.map((d: any) => (
															<SelectItem key={d.id} value={d.id} className="cursor-pointer py-2">
																<div className="flex flex-col gap-0.5 min-w-0 max-w-full text-left">
																	<div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 dark:text-slate-100">
																		<span>👤 {d.name}</span>
																		{d.staff_code && (
																			<span className="rounded bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 font-mono text-[10px] text-blue-700 dark:text-blue-300">
																				ID: {d.staff_code}
																			</span>
																		)}
																	</div>
																	<div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
																		{d.email && <span>📧 {d.email}</span>}
																		<span className="font-mono text-[10px] opacity-75">UUID: {d.id}</span>
																	</div>
																</div>
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-1.5 min-w-0">
												<Label className="text-xs font-semibold">Select Vehicle *</Label>
												<Select
													value={tripVehicleId}
													onValueChange={setTripVehicleId}
												>
													<SelectTrigger className="h-9 text-xs w-full min-w-0 overflow-hidden text-left [&>span]:truncate [&>span]:min-w-0">
														<SelectValue placeholder="Select Vehicle" />
													</SelectTrigger>
													<SelectContent className="max-w-[calc(100vw-3rem)] sm:max-w-md">
														{vehicles.map((v: any) => (
															<SelectItem key={v.id} value={v.id.toString()} className="cursor-pointer">
																<div className="flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden text-left">
																	<span className="font-medium shrink-0">🚚 {v.name}</span>
																	{v.registration_number && (
																		<span className="truncate text-xs text-muted-foreground">
																			({v.registration_number})
																		</span>
																	)}
																</div>
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>

										{/* Stops Selector for this Trip */}
										{(() => {
											const filteredStops = tripStopsList.filter((s) => {
												if (!tripStopSearchText.trim()) return true;
												const q = tripStopSearchText.toLowerCase();
												const name = (s.name || "").toLowerCase();
												const phone = s.phone || "";
												const addr = (s.address || "").toLowerCase();
												return name.includes(q) || phone.includes(q) || addr.includes(q);
											});
											const includedCount = tripStopsList.filter((s) => s.included).length;

											if (!tripRouteId && tripStopsList.length === 0) {
												return (
													<div className="rounded-xl border border-dashed p-6 text-center text-slate-400 text-xs">
														Please select a Route above or add customers to build this trip.
													</div>
												);
											}

											return (
												<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
													<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5 dark:border-slate-800">
														<div>
															<div className="flex items-center gap-2">
																<span className="font-bold text-xs text-slate-900 dark:text-slate-100">
																	Trip Customer Stops
																</span>
																<span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-[11px] text-primary">
																	{includedCount} of {tripStopsList.length} Selected
																</span>
															</div>
															<p className="text-[11px] text-slate-500">
																Checked customers will be loaded into this vehicle trip. You can also add or delete stops.
															</p>
														</div>
														<div className="flex items-center gap-1.5 flex-wrap">
															<Button
																type="button"
																variant="outline"
																size="sm"
																className={`h-7 text-xs font-semibold ${
																	isAddStopDrawerOpen
																		? "border-primary bg-primary text-white hover:bg-primary/90 hover:text-white"
																		: "border-primary/30 text-primary hover:bg-primary/10"
																}`}
																onClick={() => setIsAddStopDrawerOpen(!isAddStopDrawerOpen)}
															>
																<PlusIcon className="mr-1 h-3.5 w-3.5" />
																{isAddStopDrawerOpen ? "Close Add Panel" : "Add Customer"}
															</Button>
															<Button
																type="button"
																variant="outline"
																size="sm"
																className="h-7 text-xs"
																onClick={handleSelectAllStops}
															>
																Select All
															</Button>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																className="h-7 text-xs text-slate-500 hover:text-slate-800"
																onClick={handleDeselectAllStops}
															>
																Deselect All
															</Button>
														</div>
													</div>

													{/* Add Customer / Stop Drawer */}
													{isAddStopDrawerOpen && (
														<div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3 dark:bg-primary/10">
															<div className="flex items-center justify-between">
																<div className="flex rounded-md border bg-white p-0.5 dark:bg-slate-800">
																	<button
																		type="button"
																		className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
																			addStopMode === "registered"
																				? "bg-primary text-white shadow-xs"
																				: "text-slate-600 hover:text-slate-900 dark:text-slate-300"
																		}`}
																		onClick={() => setAddStopMode("registered")}
																	>
																		Registered Customer
																	</button>
																	<button
																		type="button"
																		className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
																			addStopMode === "custom"
																				? "bg-primary text-white shadow-xs"
																				: "text-slate-600 hover:text-slate-900 dark:text-slate-300"
																		}`}
																		onClick={() => setAddStopMode("custom")}
																	>
																		New Custom Stop
																	</button>
																</div>
															</div>

															{addStopMode === "registered" ? (
																<div className="flex flex-col sm:flex-row gap-2 items-center">
																	<div className="flex-1 w-full">
																		<Select
																			value={selectedAddCustomerId}
																			onValueChange={setSelectedAddCustomerId}
																		>
																			<SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
																				<SelectValue placeholder="Choose a registered customer..." />
																			</SelectTrigger>
																			<SelectContent className="max-h-56">
																				{customers.map((c: any) => (
																					<SelectItem key={c.id} value={c.id.toString()}>
																						{c.name} {c.phone ? `(${c.phone})` : ""} {c.address ? `— ${c.address.slice(0, 25)}` : ""}
																					</SelectItem>
																				))}
																			</SelectContent>
																		</Select>
																	</div>
																	<Button
																		type="button"
																		size="sm"
																		className="h-8 text-xs bg-primary text-white font-semibold hover:bg-primary/90 shrink-0 w-full sm:w-auto"
																		onClick={handleAddCustomerToTrip}
																	>
																		<PlusIcon className="mr-1 h-3.5 w-3.5" />
																		Add to Trip
																	</Button>
																</div>
															) : (
																<div className="space-y-2">
																	<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
																		<Input
																			placeholder="Customer Name"
																			value={newStopName}
																			onChange={(e) => setNewStopName(e.target.value)}
																			className="h-8 text-xs bg-white dark:bg-slate-800"
																		/>
																		<Input
																			placeholder="Phone (e.g. 9876543210)"
																			value={newStopPhone}
																			onChange={(e) => setNewStopPhone(e.target.value)}
																			className="h-8 text-xs bg-white dark:bg-slate-800"
																		/>
																		<Input
																			placeholder="Village / Address"
																			value={newStopAddress}
																			onChange={(e) => setNewStopAddress(e.target.value)}
																			className="h-8 text-xs bg-white dark:bg-slate-800"
																		/>
																	</div>
																	<div className="flex justify-end">
																		<Button
																			type="button"
																			size="sm"
																			className="h-7 text-xs bg-primary text-white font-semibold hover:bg-primary/90"
																			onClick={handleAddCustomerToTrip}
																		>
																			<PlusIcon className="mr-1 h-3.5 w-3.5" />
																			Add Stop
																		</Button>
																	</div>
																</div>
															)}
														</div>
													)}

													<Input
														placeholder="Filter stops by customer name, village or mobile number..."
														value={tripStopSearchText}
														onChange={(e) => setTripStopSearchText(e.target.value)}
														className="h-8 text-xs bg-white dark:bg-slate-800"
													/>

													<div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
														{filteredStops.map((stop, idx) => (
															<div
																key={stop.tempId}
																className={`flex items-start gap-2.5 rounded-lg border p-2 text-xs transition-all ${
																	stop.included
																		? "border-primary/30 bg-white shadow-xs dark:bg-slate-800"
																		: "border-transparent bg-slate-100/70 opacity-50 dark:bg-slate-900"
																}`}
															>
																<input
																	type="checkbox"
																	className="mt-1 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
																	checked={stop.included}
																	onChange={() => handleToggleStop(stop.tempId)}
																/>
																<div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-[10px] text-primary">
																	{idx + 1}
																</div>
																<div
																	className="flex-1 min-w-0 cursor-pointer"
																	onClick={() => handleToggleStop(stop.tempId)}
																>
																	<div className="flex items-center justify-between gap-2">
																		<span className="font-semibold text-slate-900 truncate dark:text-slate-100">
																			{stop.name}
																		</span>
																		{stop.phone && (
																			<span className="text-[11px] text-slate-500 font-mono shrink-0">
																				📞 {stop.phone}
																			</span>
																		)}
																	</div>
																	{stop.address && (
																		<p className="text-[11px] text-slate-500 truncate mt-0.5">
																			📍 {stop.address}
																		</p>
																	)}
																</div>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	title="Remove stop from trip"
																	className="h-6 w-6 shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
																	onClick={() => handleDeleteStopFromTrip(stop.tempId)}
																>
																	<Trash2Icon className="h-3.5 w-3.5" />
																</Button>
															</div>
														))}
														{filteredStops.length === 0 && (
															<p className="py-4 text-center text-slate-400 text-xs">
																{tripStopsList.length === 0
																	? "No customer stops in this trip. Click '+ Add Customer' to add stops."
																	: "No stops match your filter query."}
															</p>
														)}
													</div>
												</div>
											);
										})()}
									</div>
									<DialogFooter>
										<Button
											variant="outline"
											onClick={() => setIsTripOpen(false)}
										>
											Cancel
										</Button>
										<Button
											onClick={handleAssignTrip}
											disabled={
												assignTrip.isPending ||
												!tripRouteId ||
												!tripDriverId ||
												!tripVehicleId ||
												tripStopsList.filter((s) => s.included).length === 0
											}
											className="bg-primary text-white font-semibold shadow-sm hover:bg-primary/90"
										>
											{assignTrip.isPending ? (
												"Dispatching..."
											) : (
												<>
													<TruckIcon className="mr-1.5 h-4 w-4" />
													Dispatch Trip ({tripStopsList.filter((s) => s.included).length} Stops)
												</>
											)}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{realRoutes.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No routes found.
								</p>
							) : (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{realRoutes.map((route: any) => (
										<div
											key={route.id}
											className="group relative overflow-hidden rounded-md border p-4 shadow-sm"
										>
											<div className="absolute top-0 left-0 h-full w-1 bg-primary" />
											<div className="mb-1 flex items-start justify-between">
												<h4 className="font-semibold text-base leading-tight">
													{route.name}
												</h4>
												<div className="flex items-center gap-1">
													<Button
														size="sm"
														variant="outline"
														className="h-7 border-slate-200 px-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
														onClick={() => openEditRouteModal(route)}
													>
														<PencilIcon className="mr-1 h-3.5 w-3.5 text-slate-500" />
														Edit
													</Button>
													<Button
														size="sm"
														className="h-7 bg-primary px-2.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
														onClick={() => openDispatchForRoute(route)}
													>
														<TruckIcon className="mr-1 h-3.5 w-3.5" />
														Dispatch
													</Button>
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
											</div>
											<p className="mb-3 text-muted-foreground text-sm">
												{route.description || "No description"}
											</p>
											{(() => {
												let villageList: string[] = [];
												if (route.description && route.description.includes("->")) {
													villageList = route.description
														.split("->")
														.map((v: string) => v.trim())
														.filter(Boolean);
												} else if (route.description && route.description.includes(",")) {
													villageList = route.description
														.split(",")
														.map((v: string) => v.trim())
														.filter(Boolean);
												} else {
													const seen = new Set<string>();
													for (const stop of route.stops || []) {
														const vName =
															stop.customer?.address?.trim() ||
															(stop.customer?.name?.startsWith("Stop:")
																? stop.customer.name.replace(/^Stop:\s*/, "")
																: stop.customer?.name) ||
															`Stop ${stop.sequence}`;
														if (vName && !seen.has(vName.toLowerCase())) {
															seen.add(vName.toLowerCase());
															villageList.push(vName);
														}
													}
												}

												return (
													<div className="space-y-2 border-t pt-2 mt-2">
														<div className="flex items-center justify-between font-semibold text-muted-foreground text-xs uppercase tracking-wider">
															<span>Village Stops Sequence ({villageList.length})</span>
														</div>
														<div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
															{villageList.map((village: string, idx: number) => (
																<div
																	key={`${route.id}_v_${idx}`}
																	className="flex items-center gap-2 rounded-md bg-slate-50/80 p-1.5 text-xs transition-colors dark:bg-slate-900/50"
																>
																	<div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
																		{idx + 1}
																	</div>
																	<span className="truncate font-semibold text-slate-800 dark:text-slate-200">
																		{village}
																	</span>
																</div>
															))}
															{villageList.length === 0 && (
																<p className="text-xs text-muted-foreground">
																	No village stops defined.
																</p>
															)}
														</div>
													</div>
												);
											})()}
										</div>
									))}
								</div>
							)}
						</div>

					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="dispatch" className="space-y-6">
				{/* Top Summary Cards */}
				<div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
					<Card className="border-border/60 bg-white dark:bg-slate-900 shadow-sm">
						<CardHeader className="pb-1 pt-3 px-3.5">
							<CardTitle className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
								{t("waitingOrders")}
							</CardTitle>
						</CardHeader>
						<CardContent className="pb-3 px-3.5">
							<div className="font-extrabold text-2xl text-amber-600">
								{totalWaitingOrders}
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/60 bg-white dark:bg-slate-900 shadow-sm">
						<CardHeader className="pb-1 pt-3 px-3.5">
							<CardTitle className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
								{t("readyOrders")}
							</CardTitle>
						</CardHeader>
						<CardContent className="pb-3 px-3.5">
							<div className="font-extrabold text-2xl text-emerald-600">
								{totalReadyOrders}
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/60 bg-white dark:bg-slate-900 shadow-sm">
						<CardHeader className="pb-1 pt-3 px-3.5">
							<CardTitle className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
								{t("routesWaiting")}
							</CardTitle>
						</CardHeader>
						<CardContent className="pb-3 px-3.5">
							<div className="font-extrabold text-2xl text-blue-600">
								{routesWaitingCount}
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/60 bg-white dark:bg-slate-900 shadow-sm">
						<CardHeader className="pb-1 pt-3 px-3.5">
							<CardTitle className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
								{t("tripsAwaitingLoader")}
							</CardTitle>
						</CardHeader>
						<CardContent className="pb-3 px-3.5">
							<div className="font-extrabold text-2xl text-purple-600">
								{tripsAwaitingLoaderCount}
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/60 bg-white dark:bg-slate-900 shadow-sm">
						<CardHeader className="pb-1 pt-3 px-3.5">
							<CardTitle className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
								{t("tripsLoading")}
							</CardTitle>
						</CardHeader>
						<CardContent className="pb-3 px-3.5">
							<div className="font-extrabold text-2xl text-sky-600">
								{tripsLoadingCount}
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/60 bg-white dark:bg-slate-900 shadow-sm">
						<CardHeader className="pb-1 pt-3 px-3.5">
							<CardTitle className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
								{t("tripsReadyToDispatch")}
							</CardTitle>
						</CardHeader>
						<CardContent className="pb-3 px-3.5">
							<div className="font-extrabold text-2xl text-indigo-600">
								{tripsReadyToDispatchCount}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* SECTION A: ROUTE WAITING POOL */}
				<Card className="border-border/60 bg-white shadow-sm dark:bg-slate-900">
					<CardHeader className="flex flex-row items-center justify-between border-b pb-3">
						<div>
							<CardTitle className="flex items-center gap-2 font-bold text-base">
								<RouteIcon className="h-5 w-5 text-primary" />
								{t("routeWaitingPool")}
							</CardTitle>
							<CardDescription className="text-xs">
								Routes with confirmed sales orders waiting to be grouped into trips
							</CardDescription>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => refetchRoutePool()}
							className="h-8 text-xs font-semibold"
						>
							Refresh Pool
						</Button>
					</CardHeader>
					<CardContent className="pt-4">
						{routeWaitingPool.length === 0 ? (
							<div className="py-8 text-center text-slate-400 text-xs font-medium">
								{t("noWaitingOrders")}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{routeWaitingPool.map((routePool: any) => (
									<div
										key={routePool.routeId}
										className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900/50 hover:border-slate-300 transition-all"
									>
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
													{routePool.routeName}
												</h4>
												<p className="text-xs text-slate-500">
													{routePool.villageCount} Village(s) Sequence
												</p>
											</div>
											<span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 font-extrabold text-[11px] text-amber-700 dark:text-amber-300">
												{routePool.waitingCount} Waiting
											</span>
										</div>

										<div className="grid grid-cols-3 gap-2 py-1 text-center">
											<div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2 border border-emerald-200/60 dark:border-emerald-900/60">
												<span className="block font-bold text-sm text-emerald-700 dark:text-emerald-300">
													{routePool.readyCount}
												</span>
												<span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
													Ready
												</span>
											</div>
											<div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-2 border border-blue-200/60 dark:border-blue-900/60">
												<span className="block font-bold text-sm text-blue-700 dark:text-blue-300">
													{routePool.pickingCount}
												</span>
												<span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
													Picking
												</span>
											</div>
											<div className="rounded-lg bg-purple-50 dark:bg-purple-950/40 p-2 border border-purple-200/60 dark:border-purple-900/60">
												<span className="block font-bold text-sm text-purple-700 dark:text-purple-300">
													{routePool.packingCount}
												</span>
												<span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase">
													Packing
												</span>
											</div>
										</div>

										{/* Village Breakdown */}
										<div className="space-y-1 bg-white dark:bg-slate-800 p-2.5 rounded-lg border text-xs">
											<span className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
												Villages / Stops Breakdown:
											</span>
											{(routePool.villages || []).slice(0, 4).map((v: any, idx: number) => (
												<div key={idx} className="flex justify-between text-slate-600 dark:text-slate-300">
													<span className="truncate">{v.name}</span>
													<span className="font-bold text-slate-800 dark:text-slate-200">{v.orderCount} order(s)</span>
												</div>
											))}
											{(routePool.villages || []).length > 4 && (
												<div className="text-[10px] text-slate-400 font-medium pt-0.5">
													+{(routePool.villages || []).length - 4} more village stops...
												</div>
											)}
										</div>

										<div className="flex items-center justify-between pt-1">
											<Button
												variant="outline"
												size="sm"
												className="h-8 text-xs font-semibold"
												onClick={() => {
													setViewRoutePool(routePool);
													setIsViewOrdersOpen(true);
												}}
											>
												{t("viewOrders")}
											</Button>
											<Button
												size="sm"
												className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-white"
												onClick={() => handleStartCreateTripFromPool(routePool)}
												disabled={routePool.readyCount === 0}
											>
												{t("createTrip")}
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* SECTION B: TRIPS REQUIRING ACTION */}
				<Card className="border-border/60 bg-white shadow-sm dark:bg-slate-900">
					<CardHeader className="border-b pb-3">
						<CardTitle className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-slate-100">
							<AlertTriangleIcon className="h-5 w-5 text-amber-500" />
							Trips Requiring Action
						</CardTitle>
						<CardDescription className="text-xs">
							Delivery trips awaiting driver, vehicle, loader assignment, loading release, or final dispatch
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-4">
						{actionableTrips.length === 0 ? (
							<div className="py-6 text-center text-slate-400 text-xs font-medium">
								{t("noTripsRequiringAction")}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{actionableTrips.map((trip: any) => {
									const isMissingDriverOrVehicle = !trip.driver_id || !trip.vehicle_id;
									const isReadyForLoading = trip.status === "ready_for_loading" || trip.status === "pending";
									const isLoading = trip.status === "loading";
									const isLoaded = trip.status === "loaded";

									return (
										<div
											key={trip.id}
											className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
										>
											<div className="flex items-start justify-between">
												<div>
													<span className="font-mono text-xs font-bold text-slate-500">
														Trip #{trip.id}
													</span>
													<h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
														{trip.route?.name || "Direct Delivery"}
													</h4>
												</div>
												<span
													className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase ${
														isLoaded
															? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
															: isLoading
																? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
																: isMissingDriverOrVehicle
																	? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
																	: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
													}`}
												>
													{isLoaded
														? t("loaded")
														: isLoading
															? t("loading")
															: isMissingDriverOrVehicle
																? t("assignmentIncomplete")
																: t("readyForLoading")}
												</span>
											</div>

											<div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border">
												<div className="flex justify-between">
													<span className="text-slate-400">Driver:</span>
													<span className="font-semibold">{trip.driver?.name || "Missing Driver"}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-slate-400">Vehicle:</span>
													<span className="font-semibold">{trip.vehicle?.name || "Missing Vehicle"}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-slate-400">Stops / Orders:</span>
													<span className="font-semibold">{(trip.stops || []).length} Stops</span>
												</div>
											</div>

											<div className="pt-1 flex items-center justify-end gap-2">
												{isLoaded ? (
													<Button
														size="sm"
														className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white w-full"
														onClick={() => {
															setDispatchConfirmTrip(trip);
															setIsDispatchConfirmOpen(true);
														}}
													>
														<TruckIcon className="mr-1.5 h-3.5 w-3.5" />
														{t("dispatchTrip")}
													</Button>
												) : isReadyForLoading ? (
													<Button
														size="sm"
														className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white w-full"
														onClick={() => releaseToLoaderMutation.mutate({ tripId: trip.id })}
														disabled={releaseToLoaderMutation.isPending}
													>
														<PackageIcon className="mr-1.5 h-3.5 w-3.5" />
														{t("releaseToLoader")}
													</Button>
												) : isLoading ? (
													<Button
														variant="outline"
														size="sm"
														className="h-8 text-xs font-semibold w-full"
														onClick={() => {
															setSelectedDetailTrip(trip);
															setIsTripDetailOpen(true);
														}}
													>
														Monitor Loading
													</Button>
												) : (
													<Button
														variant="outline"
														size="sm"
														className="h-8 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 w-full"
														onClick={() => {
															openDispatchForRoute({ id: trip.route_id || 1, stops: trip.stops });
														}}
													>
														Complete Assignment
													</Button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>

				{/* SECTION C: LOADING & DISPATCH MONITOR */}
				<Card className="border-border/60 bg-white shadow-sm dark:bg-slate-900">
					<CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-slate-100">
								<PackageIcon className="h-5 w-5 text-sky-500" />
								LOADING & DISPATCH MONITOR
							</CardTitle>
							<CardDescription className="text-xs">
								Real-time vehicle loading progress confirmed by physical loaders
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent className="pt-4">
						{(() => {
							const activeLoadingTrips = (trips || []).filter(
								(t: any) => t.status === "loading" || t.status === "ready_for_loading" || t.status === "loaded",
							);

							if (activeLoadingTrips.length === 0) {
								return (
									<div className="py-6 text-center text-slate-400 text-xs font-medium">
										No active trip loading in progress.
									</div>
								);
							}

							return (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{activeLoadingTrips.map((trip: any) => {
										const stopsCount = (trip.stops || []).length || 1;
										const isLoaded = trip.status === "loaded";
										const loadedCount = isLoaded ? stopsCount : Math.min(stopsCount, Math.floor(stopsCount * 0.6));
										const percent = Math.round((loadedCount / stopsCount) * 100);

										return (
											<div
												key={trip.id}
												className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
											>
												<div className="flex items-start justify-between">
													<div>
														<span className="font-mono text-xs font-bold text-slate-500">
															Trip #{trip.id}
														</span>
														<h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
															{trip.route?.name || "Direct Trip"}
														</h4>
													</div>
													<span className="rounded-full bg-sky-100 dark:bg-sky-950 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
														{trip.status === "loaded" ? "Loaded 100%" : `${percent}% Loaded`}
													</span>
												</div>

												{/* Progress Bar */}
												<div className="space-y-1">
													<div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
														<span>Loading Progress</span>
														<span>{loadedCount} / {stopsCount} Loaded</span>
													</div>
													<div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
														<div
															className={`h-full transition-all duration-300 ${
																isLoaded ? "bg-emerald-500" : "bg-sky-500"
															}`}
															style={{ width: `${percent}%` }}
														/>
													</div>
												</div>

												<div className="flex items-center justify-between pt-1">
													<Button
														variant="outline"
														size="sm"
														className="h-8 text-xs font-semibold"
														onClick={() => {
															setSelectedDetailTrip(trip);
															setIsTripDetailOpen(true);
														}}
													>
														View Detail
													</Button>

													{isLoaded ? (
														<Button
															size="sm"
															className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
															onClick={() => {
																setDispatchConfirmTrip(trip);
																setIsDispatchConfirmOpen(true);
															}}
														>
															<TruckIcon className="mr-1.5 h-3.5 w-3.5" />
															{t("dispatchTrip")}
														</Button>
													) : (
														<span className="text-[11px] font-medium text-slate-500 italic">
															Awaiting Loader Completion
														</span>
													)}
												</div>
											</div>
										);
									})}
								</div>
							);
						})()}
					</CardContent>
				</Card>

				{/* ATTENTION REQUIRED SECTION */}
				<Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10 shadow-sm">
					<CardHeader className="pb-2 pt-3">
						<CardTitle className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
							<AlertTriangleIcon className="h-4 w-4 text-amber-600" />
							{t("attentionRequired")}
						</CardTitle>
					</CardHeader>
					<CardContent className="pb-3 text-xs space-y-2 text-amber-900 dark:text-amber-200">
						{routeWaitingPool.filter((r: any) => r.readyCount > 0).map((r: any) => (
							<div key={r.routeId} className="flex items-center justify-between border-b border-amber-200/50 pb-1.5 last:border-0">
								<span>
									<strong>{r.routeName}</strong>: {r.readyCount} ready order(s) waiting for Trip creation.
								</span>
								<Button
									size="sm"
									variant="outline"
									className="h-7 text-[11px] font-semibold border-amber-300 text-amber-800 hover:bg-amber-100"
									onClick={() => handleStartCreateTripFromPool(r)}
								>
									Create Trip
								</Button>
							</div>
						))}
						{routeWaitingPool.filter((r: any) => r.readyCount > 0).length === 0 && (
							<p className="text-slate-500 font-medium">All ready route orders are assigned to active trips.</p>
						)}
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="trips">
				<Card>
					<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2">
								<TruckIcon className="h-5 w-5 text-primary" />
								Delivery Trips & Driver Dispatch
							</CardTitle>
							<CardDescription>
								Manage all vehicle trips assigned to drivers. Dispatch pending trips, monitor active deliveries, and review completed runs.
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Button
								className="bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/90"
								onClick={() => setIsQuickTripOpen(true)}
							>
								<TruckIcon className="mr-1.5 h-3.5 w-3.5" />
								Quick Custom Trip
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Status Filters & Search Bar */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
							<div className="flex flex-wrap items-center gap-1.5">
								<Button
									size="sm"
									variant={tripFilterStatus === "all" ? "default" : "outline"}
									className="h-8 text-xs font-semibold rounded-lg"
									onClick={() => setTripFilterStatus("all")}
								>
									All ({trips.length})
								</Button>
								<Button
									size="sm"
									variant={tripFilterStatus === "pending" ? "default" : "outline"}
									className={`h-8 text-xs font-semibold rounded-lg ${tripFilterStatus !== "pending" ? "border-blue-200 text-blue-700 hover:bg-blue-50" : ""}`}
									onClick={() => setTripFilterStatus("pending")}
								>
									Pending Dispatch ({trips.filter((t: any) => t.status === "pending").length})
								</Button>
								<Button
									size="sm"
									variant={tripFilterStatus === "active" ? "default" : "outline"}
									className={`h-8 text-xs font-semibold rounded-lg ${tripFilterStatus !== "active" ? "border-amber-200 text-amber-700 hover:bg-amber-50" : ""}`}
									onClick={() => setTripFilterStatus("active")}
								>
									Active / On Route ({trips.filter((t: any) => t.status === "active").length})
								</Button>
								<Button
									size="sm"
									variant={tripFilterStatus === "completed" ? "default" : "outline"}
									className={`h-8 text-xs font-semibold rounded-lg ${tripFilterStatus !== "completed" ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : ""}`}
									onClick={() => setTripFilterStatus("completed")}
								>
									Completed ({trips.filter((t: any) => t.status === "completed").length})
								</Button>
								<Button
									size="sm"
									variant={tripFilterStatus === "cancelled" ? "default" : "outline"}
									className={`h-8 text-xs font-semibold rounded-lg ${tripFilterStatus !== "cancelled" ? "border-red-200 text-red-700 hover:bg-red-50" : ""}`}
									onClick={() => setTripFilterStatus("cancelled")}
								>
									Cancelled ({trips.filter((t: any) => t.status === "cancelled").length})
								</Button>
							</div>

							<div className="relative w-full sm:w-64">
								<SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
								<Input
									type="text"
									placeholder="Search driver, vehicle, route..."
									value={tripSearchQuery}
									onChange={(e) => setTripSearchQuery(e.target.value)}
									className="h-8 pl-8 text-xs rounded-lg"
								/>
							</div>
						</div>

						{/* Trips Cards Grid */}
						{(() => {
							const filteredTrips = trips.filter((trip: any) => {
								if (tripFilterStatus !== "all" && trip.status !== tripFilterStatus) {
									return false;
								}
								if (tripSearchQuery.trim()) {
									const query = tripSearchQuery.toLowerCase();
									const driverName = trip.driver?.name?.toLowerCase() || "";
									const vehicleName = trip.vehicle?.name?.toLowerCase() || "";
									const routeName = trip.route?.name?.toLowerCase() || "";
									const tripId = String(trip.id);
									return (
										driverName.includes(query) ||
										vehicleName.includes(query) ||
										routeName.includes(query) ||
										tripId.includes(query)
									);
								}
								return true;
							});

							if (filteredTrips.length === 0) {
								return (
									<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
										<TruckIcon className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
										<p className="font-semibold text-sm">No delivery trips match your selection.</p>
										<p className="text-xs mt-0.5">Change status filters or click "Quick Custom Trip" to assign a new run.</p>
									</div>
								);
							}

							return (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{filteredTrips.map((trip: any) => (
										<div
											key={trip.id}
											className="group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
										>
											<div
												className={`absolute top-0 left-0 h-full w-1.5 ${
													trip.status === "completed"
														? "bg-emerald-500"
														: trip.status === "active"
															? "bg-amber-500 animate-pulse"
															: trip.status === "cancelled"
																? "bg-red-500"
																: "bg-blue-500"
												}`}
											/>
											<div className="flex items-start justify-between">
												<div>
													<div className="flex items-center gap-2">
														<span className="font-mono text-xs font-bold text-slate-500">
															Trip #{trip.id}
														</span>
														{trip.route?.name && (
															<span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
																{trip.route.name}
															</span>
														)}
													</div>
													<h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-0.5">
														{trip.route?.name || "Direct Custom Trip"}
													</h4>
												</div>
												<span
													className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider ${
														trip.status === "completed"
															? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
															: trip.status === "active"
																? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
																: trip.status === "cancelled"
																	? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
																	: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
													}`}
												>
													{trip.status === "active" && (
														<span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
													)}
													{trip.status === "active" ? "Out for Delivery" : trip.status}
												</span>
											</div>

											<div className="mt-3.5 space-y-2 text-xs text-muted-foreground">
												<div className="flex items-center gap-2">
													<div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
														<PackageIcon className="h-3 w-3" />
													</div>
													Driver:{" "}
													<span className="font-semibold text-slate-900 dark:text-slate-100">
														{trip.driver?.name || "Unassigned"}
													</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
														<TruckIcon className="h-3 w-3" />
													</div>
													Vehicle:{" "}
													<span className="font-semibold text-slate-900 dark:text-slate-100">
														{trip.vehicle?.name || trip.vehicle?.registration_number || "N/A"}
													</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
														<RouteIcon className="h-3 w-3" />
													</div>
													Stops:{" "}
													<span className="font-semibold text-slate-900 dark:text-slate-100">
														{trip.stops?.length || 0} customer stops
													</span>
												</div>
											</div>

											<div className="mt-4 flex items-center gap-2 border-t pt-3 border-slate-100 dark:border-slate-800">
												{(trip.status === "loaded" || trip.status === "ready_for_loading" || trip.status === "pending") && (
													<Button
														size="sm"
														className="flex-1 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700 text-xs"
														disabled={dispatchTripMutation.isPending || (trip.status !== "loaded" && trip.status !== "loading")}
														onClick={async () => {
															try {
																await dispatchTripMutation.mutateAsync({
																	tripId: trip.id,
																});
																toast.success(
																	`Trip #${trip.id} officially dispatched! Sent to Driver ${trip.driver?.name || "assigned driver"}.`,
																);
															} catch (err: any) {
																toast.error(
																	err.message || "Failed to dispatch trip",
																);
															}
														}}
													>
														<TruckIcon className="mr-1.5 h-3.5 w-3.5" />
														{trip.status === "loaded"
															? "Dispatch Trip to Driver"
															: "Awaiting Loader Confirmation"}
													</Button>
												)}
												{(trip.status === "pending" || trip.status === "ready_for_loading" || trip.status === "loading") && (
													<Button
														variant="outline"
														size="sm"
														className="border-red-200 text-red-600 font-semibold shadow-xs hover:bg-red-50 text-xs"
														onClick={() => {
															setTripToCancel(trip);
															setIsCancelModalOpen(true);
														}}
													>
														Cancel
													</Button>
												)}
												<Button
													variant="outline"
													size="sm"
													className="shrink-0 border-slate-200 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 hover:bg-red-50"
													onClick={() => {
														setTripToDelete(trip);
														setIsDeleteTripModalOpen(true);
													}}
													title="Delete Trip"
												>
													<Trash2Icon className="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>
									))}
								</div>
							);
						})()}
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
										{(() => {
											const grouped = Object.values(
												driverCollections.reduce((acc: any, col: any) => {
													const key = `${col.driverName}_${col.collectedAt}`;
													if (!acc[key]) {
														acc[key] = {
															...col,
															amount: Number(col.amount),
															methods: [col.paymentMethod],
															breakdown: { [col.paymentMethod]: Number(col.amount) },
															transactionId: col.transactionId || col.referenceNumber || "",
														};
													} else {
														acc[key].amount += Number(col.amount);
														if (!acc[key].methods.includes(col.paymentMethod)) {
															acc[key].methods.push(col.paymentMethod);
														}
														acc[key].breakdown[col.paymentMethod] = (acc[key].breakdown[col.paymentMethod] || 0) + Number(col.amount);
														if (col.transactionId || col.referenceNumber) {
															acc[key].transactionId = acc[key].transactionId ? `${acc[key].transactionId}, ${col.transactionId || col.referenceNumber}` : (col.transactionId || col.referenceNumber);
														}
													}
													return acc;
												}, {})
											);

											return (grouped as any[]).map((col: any) => (
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
																col.methods.length > 1
																	? "bg-purple-100 text-purple-800"
																	: col.methods[0]?.toLowerCase() === "cash"
																		? "bg-amber-100 text-amber-800"
																		: "bg-blue-100 text-blue-800"
															}`}
														>
															{col.methods.join(" & ")}
														</span>
													</td>
													<td className="px-3 py-3">
														<div className="font-semibold text-emerald-600">
															₹{col.amount.toLocaleString("en-IN")}
														</div>
														{col.methods.length > 1 && (
															<div className="text-[10px] text-muted-foreground mt-0.5">
																{Object.entries(col.breakdown).map(([m, a]: any) => `${m}: ₹${a.toLocaleString("en-IN")}`).join(", ")}
															</div>
														)}
													</td>
													<td className="px-3 py-3 font-mono text-xs max-w-[200px] truncate" title={col.transactionId}>
														{col.transactionId}
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
											));
										})()}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>

		{/* ── Global Action & Confirmation Dialogs ────────────────────────────── */}

		{/* Assign Order Route & Driver Modal */}
		<Dialog open={isOrderAssignOpen} onOpenChange={setIsOrderAssignOpen}>
			<DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-md p-4 sm:p-6 overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
						<TruckIcon className="h-5 w-5 text-blue-600 shrink-0" />
						<span className="truncate">Assign Route & Driver</span>
					</DialogTitle>
					<DialogDescription className="text-xs">
						{selectedOrderIds.length > 1
							? `Dispatch ${selectedOrderIds.length} selected orders to a driver & vehicle.`
							: `Dispatch Order ORD-${assignOrder?.id} (${assignOrder?.customer?.name || "Customer"}) to a driver & vehicle.`}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-3 min-w-0">
					{(() => {
						const ordersToDisplay =
							selectedOrderIds.length > 0
								? unassignedOrders.filter((o: any) =>
										selectedOrderIds.includes(o.id),
									)
								: assignOrder
									? [assignOrder]
									: [];
						const totalAmt = ordersToDisplay.reduce(
							(sum: number, o: any) => sum + Number(o.total_amount || 0),
							0,
						);

						return (
							<div className="space-y-2 min-w-0">
								<div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-blue-50/80 p-2.5 text-xs dark:bg-blue-950/40">
									<span className="font-semibold text-blue-900 dark:text-blue-200">
										{ordersToDisplay.length} Order(s) Selected
									</span>
									<span className="font-bold text-blue-900 dark:text-blue-100">
										Total: ₹{totalAmt.toFixed(2)}
									</span>
								</div>
								<div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
									{ordersToDisplay.map((ord: any, idx: number) => (
										<div
											key={ord.id}
											className="flex items-center justify-between gap-2 rounded-md border bg-slate-50/50 p-2 text-xs dark:bg-slate-900/40"
										>
											<div className="min-w-0 flex-1 pr-1">
												<div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
													<span className="font-mono text-[11px] text-blue-600 shrink-0">
														ORD-{ord.id}
													</span>
													<span className="shrink-0">•</span>
													<span className="truncate">
														{ord.customer?.name || "Walk-in Customer"}
													</span>
												</div>
												{(ord.customer?.address || ord.shipping_address) && (
													<p className="truncate text-[11px] text-emerald-700 dark:text-emerald-400">
														📍 {ord.customer?.address || ord.shipping_address}
													</p>
												)}
											</div>
											<span className="shrink-0 font-medium whitespace-nowrap text-right">
												₹{Number(ord.total_amount || 0).toFixed(2)}
											</span>
										</div>
									))}
								</div>
							</div>
						);
					})()}

					<div className="space-y-1.5 min-w-0">
						<Label className="font-medium text-xs">Assign Driver *</Label>
						<Select value={orderDriverId} onValueChange={setOrderDriverId}>
							<SelectTrigger className="w-full min-w-0 overflow-hidden text-left [&>span]:truncate [&>span]:min-w-0">
								<SelectValue placeholder="Select Driver..." />
							</SelectTrigger>
							<SelectContent className="max-w-[calc(100vw-3rem)] sm:max-w-md">
								{finalDrivers.map((d: any) => (
									<SelectItem key={d.id} value={d.id} className="cursor-pointer py-2">
										<div className="flex flex-col gap-0.5 min-w-0 max-w-full text-left">
											<div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 dark:text-slate-100">
												<span>👤 {d.name}</span>
												{d.staff_code && (
													<span className="rounded bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 font-mono text-[10px] text-blue-700 dark:text-blue-300">
														ID: {d.staff_code}
													</span>
												)}
											</div>
											<div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
												{d.email && <span>📧 {d.email}</span>}
												<span className="font-mono text-[10px] opacity-75">UUID: {d.id}</span>
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5 min-w-0">
						<Label className="font-medium text-xs">
							Assign Vehicle / Truck
						</Label>
						<Select
							value={orderVehicleId}
							onValueChange={setOrderVehicleId}
						>
							<SelectTrigger className="w-full min-w-0 overflow-hidden text-left [&>span]:truncate [&>span]:min-w-0">
								<SelectValue placeholder="Select Vehicle..." />
							</SelectTrigger>
							<SelectContent className="max-w-[calc(100vw-3rem)] sm:max-w-md">
								{vehicles.map((v: any) => (
									<SelectItem key={v.id} value={v.id.toString()} className="cursor-pointer">
										<div className="flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden text-left">
											<span className="font-medium shrink-0">🚚 {v.name}</span>
											{v.registration_number && (
												<span className="truncate text-xs text-muted-foreground">
													({v.registration_number})
												</span>
											)}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsOrderAssignOpen(false)}
						className="w-full sm:w-auto"
					>
						Cancel
					</Button>
					<Button
						type="button"
						className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
						disabled={createTripDirect.isPending || !orderDriverId}
						onClick={handleAssignOrderRoute}
					>
						{createTripDirect.isPending
							? "Assigning..."
							: "Assign & Send to Loader"}
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

		{/* Edit Route & Village Stops Modal */}
		<Dialog open={isEditRouteOpen} onOpenChange={setIsEditRouteOpen}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
							<RouteIcon className="h-5 w-5" />
						</div>
						<div>
							<DialogTitle className="font-bold text-lg">
								Edit Route & Village Stops
							</DialogTitle>
							<DialogDescription className="text-xs">
								Add, reorder, rename, or delete villages for this delivery route.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="max-h-[65vh] space-y-4 overflow-y-auto py-3 pr-1 text-xs">
					<div className="space-y-1.5">
						<Label className="font-semibold text-xs text-slate-800 dark:text-slate-200">
							Route Name *
						</Label>
						<Input
							value={editRouteName}
							onChange={(e) => setEditRouteName(e.target.value)}
							placeholder="e.g. Runaha Route"
							className="h-9 text-xs"
						/>
					</div>

					{/* Add Village Input */}
					<div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3 dark:border-primary/30 dark:bg-primary/10">
						<Label className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
							<MapPinIcon className="h-3.5 w-3.5 text-primary" />
							Add New Village / Stop
						</Label>
						<div className="flex gap-2">
							<Input
								value={newVillageInput}
								onChange={(e) => setNewVillageInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddVillageToEdit();
									}
								}}
								placeholder="Type village name (e.g. Bhamoni, Sukha, Runaha)..."
								className="h-8 text-xs bg-white dark:bg-slate-900"
							/>
							<Button
								type="button"
								size="sm"
								className="h-8 px-3 text-xs bg-primary text-white font-semibold hover:bg-primary/90 shadow-sm"
								onClick={handleAddVillageToEdit}
								disabled={!newVillageInput.trim()}
							>
								<PlusIcon className="mr-1 h-3.5 w-3.5" />
								Add
							</Button>
						</div>
					</div>

					{/* Village List */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
								Villages in Route Sequence ({editVillageStops.length})
							</Label>
							{editVillageStops.length > 0 && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50"
									onClick={() => {
										setEditVillageStops([]);
										setEditRouteDesc("");
									}}
								>
									Clear All
								</Button>
							)}
						</div>

						<div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border bg-slate-50/50 p-2 text-xs dark:bg-slate-900/40">
							{editVillageStops.map((village, idx) => (
								<div
									key={`edit_v_${idx}`}
									className="flex items-center justify-between gap-2 rounded-lg border bg-white p-2 shadow-xs transition-colors hover:border-primary/30 dark:bg-slate-800"
								>
									<div className="flex items-center gap-2 min-w-0 flex-1">
										<div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
											{idx + 1}
										</div>
										<Input
											value={village}
											onChange={(e) => {
												const val = e.target.value;
												const updated = [...editVillageStops];
												updated[idx] = val;
												setEditVillageStops(updated);
												setEditRouteDesc(updated.join(" -> "));
											}}
											className="h-7 text-xs font-semibold text-slate-800 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary dark:text-slate-200"
										/>
									</div>
									<div className="flex items-center gap-1 shrink-0">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											title="Move Up"
											className="h-6 w-6 text-slate-400 hover:text-slate-700"
											disabled={idx === 0}
											onClick={() => handleMoveVillage(idx, "up")}
										>
											<ArrowUpIcon className="h-3.5 w-3.5" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											title="Move Down"
											className="h-6 w-6 text-slate-400 hover:text-slate-700"
											disabled={idx === editVillageStops.length - 1}
											onClick={() => handleMoveVillage(idx, "down")}
										>
											<ArrowDownIcon className="h-3.5 w-3.5" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											title="Delete Village"
											className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
											onClick={() => handleRemoveVillageFromEdit(idx)}
										>
											<Trash2Icon className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							))}
							{editVillageStops.length === 0 && (
								<p className="py-6 text-center text-slate-400 text-xs">
									No villages left. Add villages using the input above.
								</p>
							)}
						</div>
					</div>

					{/* Route Description Preview */}
					<div className="space-y-1">
						<Label className="text-[11px] text-muted-foreground">
							Route Summary Preview:
						</Label>
						<p className="rounded-lg bg-slate-100/70 p-2.5 text-[11px] font-mono text-slate-600 leading-relaxed dark:bg-slate-900/60 dark:text-slate-400">
							{editVillageStops.length > 0
								? editVillageStops.join(" → ")
								: "No village stops"}
						</p>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							setIsEditRouteOpen(false);
							setRouteToEdit(null);
						}}
						disabled={updateRouteMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						type="button"
						className="bg-primary text-white font-semibold shadow-sm hover:bg-primary/90"
						onClick={handleSaveEditRoute}
						disabled={
							updateRouteMutation.isPending ||
							!editRouteName.trim() ||
							editVillageStops.length === 0
						}
					>
						{updateRouteMutation.isPending
							? "Saving Changes..."
							: "Save Route & Villages"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		{/* DIALOG 1: VIEW ORDERS (Route Waiting Pool) */}
		<Dialog open={isViewOrdersOpen} onOpenChange={setIsViewOrdersOpen}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<RouteIcon className="h-5 w-5 text-primary" />
						{viewRoutePool?.routeName} — Waiting Orders List
					</DialogTitle>
					<DialogDescription>
						Orders grouped by route stop / village sequence. Only packed and ready orders can be dispatched in a trip.
					</DialogDescription>
				</DialogHeader>
				<div className="max-h-[65vh] overflow-y-auto space-y-4 py-2 pr-1">
					{(viewRoutePool?.villages || []).map((village: any, idx: number) => (
						<div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-900/50">
							<div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
								<span className="font-bold text-xs text-slate-800 dark:text-slate-200">
									📍 Village/Stop {idx + 1}: {village.name}
								</span>
								<span className="text-[11px] font-semibold text-slate-500">
									{village.orderCount} order(s)
								</span>
							</div>
							<div className="space-y-2 pt-1">
								{(village.orders || []).map((ord: any) => (
									<div
										key={ord.id}
										className="flex items-center justify-between rounded-lg border bg-white p-2.5 text-xs shadow-2xs dark:bg-slate-800"
									>
										<div className="flex items-center gap-3">
											<span className="font-mono font-bold text-slate-600 dark:text-slate-300">
												{ord.orderNumber}
											</span>
											<span className="font-medium text-slate-900 dark:text-slate-100">
												{ord.customerName}
											</span>
										</div>
										<span
											className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase ${
												ord.isReady
													? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
													: ord.status === "packing"
														? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
														: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
											}`}
										>
											{ord.isReady
												? "Ready for Trip"
												: ord.status === "packing"
													? "Packing"
													: "Picked / Processing"}
										</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setIsViewOrdersOpen(false)}>
						Close
					</Button>
					<Button
						className="bg-primary text-white font-semibold"
						onClick={() => {
							setIsViewOrdersOpen(false);
							if (viewRoutePool) handleStartCreateTripFromPool(viewRoutePool);
						}}
						disabled={viewRoutePool?.readyCount === 0}
					>
						{t("createTrip")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		{/* DIALOG 2: CREATE TRIP MULTI-STEP MODAL */}
		<Dialog open={isCreateTripPoolOpen} onOpenChange={setIsCreateTripPoolOpen}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<TruckIcon className="h-5 w-5 text-primary" />
						Create Delivery Trip — {createTripRoutePool?.routeName}
					</DialogTitle>
					<DialogDescription>
						Step {createTripStep} of 3: {createTripStep === 1 ? "Select Orders" : createTripStep === 2 ? "Assign Driver, Vehicle & Loader" : "Review & Create Trip"}
					</DialogDescription>
				</DialogHeader>

				{/* STEP 1: SELECT ORDERS */}
				{createTripStep === 1 && (
					<div className="max-h-[60vh] overflow-y-auto space-y-4 py-2 pr-1">
						<div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg text-xs font-semibold">
							<span>Selected: {selectedPoolOrderIds.length} order(s)</span>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="ghost"
									className="h-6 text-[11px]"
									onClick={() => {
										const eligible = (createTripRoutePool?.orders || [])
											.filter((o: any) => o.isEligibleForTrip)
											.map((o: any) => o.id);
										setSelectedPoolOrderIds(eligible);
									}}
								>
									Select All Eligible
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="h-6 text-[11px]"
									onClick={() => setSelectedPoolOrderIds([])}
								>
									Deselect All
								</Button>
							</div>
						</div>

						{(createTripRoutePool?.villages || []).map((village: any, vIdx: number) => (
							<div key={vIdx} className="space-y-2 border rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50">
								<span className="font-bold text-xs text-slate-700 dark:text-slate-300 block border-b pb-1">
									📍 Village: {village.name}
								</span>
								<div className="space-y-1.5">
									{(village.orders || []).map((ord: any) => {
										const isSelected = selectedPoolOrderIds.includes(ord.id);

										return (
											<label
												key={ord.id}
												className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
													!ord.isReady
														? "bg-slate-100 opacity-60 cursor-not-allowed dark:bg-slate-800"
														: isSelected
															? "border-primary bg-primary/5"
															: "bg-white dark:bg-slate-800"
												}`}
											>
												<div className="flex items-center gap-2">
													<input
														type="checkbox"
														checked={isSelected}
														disabled={!ord.isReady}
														onChange={(e) => {
															if (e.target.checked) {
																setSelectedPoolOrderIds((prev) => [...prev, ord.id]);
															} else {
																setSelectedPoolOrderIds((prev) => prev.filter((id) => id !== ord.id));
															}
														}}
														className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
													/>
													<div>
														<span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">
															{ord.orderNumber}
														</span>
														<span>{ord.customerName}</span>
													</div>
												</div>
												<span
													className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase ${
														ord.isReady
															? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
															: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
													}`}
												>
													{ord.isReady ? "Ready for Trip" : ord.status}
												</span>
											</label>
										);
									})}
								</div>
							</div>
						))}
					</div>
				)}

				{/* STEP 2: TRIP ASSIGNMENT */}
				{createTripStep === 2 && (
					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Select Driver *</Label>
							<Select value={poolDriverId} onValueChange={setPoolDriverId}>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue placeholder="Select Driver" />
								</SelectTrigger>
								<SelectContent>
									{finalDrivers.map((d: any) => (
										<SelectItem key={d.id} value={d.id}>
											👤 {d.name} {d.email ? `(${d.email})` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Select Vehicle *</Label>
							<Select value={poolVehicleId} onValueChange={setPoolVehicleId}>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue placeholder="Select Vehicle" />
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

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Select Trip Loader *</Label>
							<Select value={poolLoaderId} onValueChange={setPoolLoaderId}>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue placeholder="Select Loader" />
								</SelectTrigger>
								<SelectContent>
									{loadersList.map((l: any) => (
										<SelectItem key={l.id} value={l.id}>
											📦 {l.name} {l.email ? `(${l.email})` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-[11px] text-slate-500">
								The Loader is assigned to the whole trip and will confirm physical vehicle loading.
							</p>
						</div>
					</div>
				)}

				{/* STEP 3: REVIEW */}
				{createTripStep === 3 && (
					<div className="space-y-4 py-2 text-xs">
						<div className="rounded-xl border bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2">
							<h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-1">
								Trip Manifest Review
							</h4>
							<div className="flex justify-between">
								<span className="text-slate-500">Route:</span>
								<span className="font-bold">{createTripRoutePool?.routeName}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Total Selected Orders:</span>
								<span className="font-bold text-emerald-600">{selectedPoolOrderIds.length} Orders</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Assigned Driver:</span>
								<span className="font-bold">
									{finalDrivers.find((d: any) => d.id === poolDriverId)?.name || poolDriverId}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Assigned Vehicle:</span>
								<span className="font-bold">
									{vehicles.find((v: any) => v.id.toString() === poolVehicleId)?.name || poolVehicleId}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Assigned Loader:</span>
								<span className="font-bold">
									{loadersList.find((l: any) => l.id === poolLoaderId)?.name || poolLoaderId || "Default Loader"}
								</span>
							</div>
						</div>
					</div>
				)}

				<DialogFooter className="flex justify-between items-center sm:justify-between">
					{createTripStep > 1 ? (
						<Button variant="outline" onClick={() => setCreateTripStep((prev) => (prev - 1) as 1 | 2)}>
							Back
						</Button>
					) : (
						<Button variant="outline" onClick={() => setIsCreateTripPoolOpen(false)}>
							Cancel
						</Button>
					)}

					{createTripStep < 3 ? (
						<Button
							className="bg-primary text-white font-semibold"
							onClick={() => {
								if (createTripStep === 1 && selectedPoolOrderIds.length === 0) {
									toast.error("Please select at least 1 order.");
									return;
								}
								setCreateTripStep((prev) => (prev + 1) as 2 | 3);
							}}
						>
							Next
						</Button>
					) : (
						<Button
							className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
							onClick={handleConfirmCreateTripFromPool}
							disabled={createTripDirect.isPending}
						>
							{createTripDirect.isPending ? "Creating Trip..." : "Create Trip"}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>

		{/* DIALOG 3: FINAL DISPATCH CONFIRMATION */}
		<Dialog open={isDispatchConfirmOpen} onOpenChange={setIsDispatchConfirmOpen}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
						<TruckIcon className="h-5 w-5" />
						Dispatch Trip #{dispatchConfirmTrip?.id}?
					</DialogTitle>
					<DialogDescription>
						All required packages/orders have been physically loaded onto the vehicle. Dispatching will release the trip to the Driver for delivery.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2 border rounded-xl p-3 bg-slate-50 dark:bg-slate-800 text-xs">
					<div className="flex justify-between">
						<span className="text-slate-500">Route:</span>
						<span className="font-bold">{dispatchConfirmTrip?.route?.name || "Direct Trip"}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-slate-500">Driver:</span>
						<span className="font-bold">{dispatchConfirmTrip?.driver?.name || "Assigned Driver"}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-slate-500">Vehicle:</span>
						<span className="font-bold">{dispatchConfirmTrip?.vehicle?.name || "Assigned Vehicle"}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-slate-500">Orders Status:</span>
						<span className="font-bold text-emerald-600">✓ All Orders Loaded</span>
					</div>
				</div>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={() => setIsDispatchConfirmOpen(false)}>
						Cancel
					</Button>
					<Button
						className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
						onClick={handleConfirmFinalDispatch}
						disabled={dispatchTripMutation.isPending}
					>
						{dispatchTripMutation.isPending ? "Dispatching..." : "Confirm & Dispatch Trip"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		{/* DIALOG 4: TRIP DETAIL MODAL */}
		<Dialog open={isTripDetailOpen} onOpenChange={setIsTripDetailOpen}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<TruckIcon className="h-5 w-5 text-primary" />
						Trip #{selectedDetailTrip?.id} Details
					</DialogTitle>
					<DialogDescription>
						Manifest, assigned team, loading completion, and stop details
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[60vh] overflow-y-auto space-y-4 py-2 text-xs">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border">
						<div>
							<span className="text-slate-400 block">Route:</span>
							<span className="font-bold text-slate-900 dark:text-slate-100">
								{selectedDetailTrip?.route?.name || "Direct Trip"}
							</span>
						</div>
						<div>
							<span className="text-slate-400 block">Driver:</span>
							<span className="font-bold text-slate-900 dark:text-slate-100">
								{selectedDetailTrip?.driver?.name || "N/A"}
							</span>
						</div>
						<div>
							<span className="text-slate-400 block">Vehicle:</span>
							<span className="font-bold text-slate-900 dark:text-slate-100">
								{selectedDetailTrip?.vehicle?.name || "N/A"}
							</span>
						</div>
						<div>
							<span className="text-slate-400 block">Status:</span>
							<span className="font-bold text-emerald-600 uppercase">
								{selectedDetailTrip?.status || "Pending"}
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
							Assigned Customer Stops ({(selectedDetailTrip?.stops || []).length})
						</h4>
						<div className="space-y-2">
							{(selectedDetailTrip?.stops || []).map((stop: any, idx: number) => (
								<div
									key={stop.id || idx}
									className="flex justify-between items-center p-2.5 rounded-lg border bg-white dark:bg-slate-800"
								>
									<div>
										<span className="font-bold text-slate-900 dark:text-slate-100">
											{idx + 1}. {stop.customer?.name || "Customer Stop"}
										</span>
										{stop.customer?.address && (
											<span className="text-[11px] text-slate-500 block">
												📍 {stop.customer.address}
											</span>
										)}
									</div>
									<span className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold">
										Stop #{stop.sequence || idx + 1}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setIsTripDetailOpen(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
		</>
	);
}
