"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	CheckCircle2Icon,
	ClockIcon,
	FilterIcon,
	Loader2Icon,
	MapPinIcon,
	PlusIcon,
	RadioIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	Trash2Icon,
	TruckIcon,
	UserCheckIcon,
	UserPlusIcon,
	UsersIcon,
	WrenchIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

type DepartmentFilter = "all" | "picker" | "packer" | "putter" | "auditor" | "driver" | "manager";

export default function WorkforcePage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRoleFilter, setSelectedRoleFilter] = useState<DepartmentFilter>("all");

	// Live Staff Query
	const {
		data: staffList,
		isLoading: staffLoading,
		isRefetching,
		refetch,
	} = trpc.staff.list.useQuery(
		{ limit: 200 },
		{
			refetchInterval: 15000,
			refetchOnWindowFocus: true,
		},
	);

	// Mutations
	const createStaffMutation = trpc.staff.create.useMutation({
		onSuccess: (newStaff) => {
			toast.success(`Operator ${newStaff.name} created successfully!`);
			utils.staff.list.invalidate();
			utils.warehouse.getPickingQueue.invalidate();
			utils.warehouse.getPutAwayQueue.invalidate();
		},
		onError: (err) => {
			toast.error(`Creation failed: ${err.message}`);
		},
	});

	const deleteStaffMutation = trpc.staff.delete.useMutation({
		onSuccess: () => {
			toast.success("Employee removed successfully!");
			utils.staff.list.invalidate();
		},
		onError: (err) => {
			toast.error(`Deletion failed: ${err.message}`);
		},
	});

	const cleanAndSeedMutation = trpc.staff.cleanAndSeedRealStaff.useMutation({
		onSuccess: () => {
			toast.success("Fake staff records purged and real depot team loaded cleanly!");
			utils.staff.list.invalidate();
			utils.warehouse.getPickingQueue.invalidate();
			utils.warehouse.getPutAwayQueue.invalidate();
		},
		onError: (err) => {
			toast.error(`Purge failed: ${err.message}`);
		},
	});

	// Add Operator Modal State
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [newRole, setNewRole] = useState("picker");
	const [newDepartment, setNewDepartment] = useState("Outbound Logistics");
	const [newSalary, setNewSalary] = useState("28000");
	const [newJoinDate, setNewJoinDate] = useState(
		new Date().toISOString().split("T")[0],
	);

	// Geofence Modal State & Query
	const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
	const [geoLat, setGeoLat] = useState("23.259933");
	const [geoLng, setGeoLng] = useState("77.412615");
	const [geoRadius, setGeoRadius] = useState("250");
	const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);

	const { data: existingGeofence, refetch: refetchGeofence } =
		trpc.attendance.getGeofence.useQuery({ branchId: 1 });

	useEffect(() => {
		if (existingGeofence) {
			if (existingGeofence.latitude) setGeoLat(String(existingGeofence.latitude));
			if (existingGeofence.longitude) setGeoLng(String(existingGeofence.longitude));
			if (existingGeofence.radius) setGeoRadius(String(existingGeofence.radius));
		}
	}, [existingGeofence]);

	const setGeofenceMutation = trpc.attendance.setGeofence.useMutation({
		onSuccess: () => {
			toast.success("Warehouse Geofence location updated successfully!");
			refetchGeofence();
			setIsGeofenceModalOpen(false);
		},
		onError: (err) => {
			toast.error(`Failed to save geofence: ${err.message}`);
		},
	});

	const handleGetCurrentLocation = () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not supported by your browser.");
			return;
		}
		setIsGettingCurrentLocation(true);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setGeoLat(pos.coords.latitude.toFixed(6));
				setGeoLng(pos.coords.longitude.toFixed(6));
				setIsGettingCurrentLocation(false);
				toast.success("Current GPS coordinates captured!");
			},
			(err) => {
				setIsGettingCurrentLocation(false);
				toast.error(`Could not get current location: ${err.message}`);
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	const handleSaveGeofence = () => {
		const lat = Number.parseFloat(geoLat);
		const lng = Number.parseFloat(geoLng);
		const rad = Number.parseInt(geoRadius, 10);
		if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(rad)) {
			toast.error("Please enter valid latitude, longitude, and radius numbers.");
			return;
		}
		setGeofenceMutation.mutate({
			branchId: 1,
			latitude: lat,
			longitude: lng,
			radius: rad,
			isActive: true,
		});
	};

	const handleAddOperator = async () => {
		if (!newName.trim() || !newEmail.trim()) {
			toast.error("Please enter a valid operator name and email address.");
			return;
		}

		await createStaffMutation.mutateAsync({
			name: newName.trim(),
			email: newEmail.trim().toLowerCase(),
			phone: newPhone.trim() || undefined,
			role: newRole,
			department: newDepartment,
			salary: Number.parseInt(newSalary, 10) || 25000,
			join_date: new Date(newJoinDate).toISOString(),
		});

		setIsAddModalOpen(false);
		setNewName("");
		setNewEmail("");
		setNewPhone("");
	};

	const handleDeleteStaff = async (id: number, name: string) => {
		if (window.confirm(`Are you sure you want to remove ${name}?`)) {
			await deleteStaffMutation.mutateAsync({ id });
		}
	};

	// Filter and Sort Staff
	const filteredStaff = useMemo(() => {
		if (!staffList) return [];

		return staffList.filter((s) => {
			// Role Filter
			if (selectedRoleFilter !== "all") {
				const r = s.role?.toLowerCase() || "";
				if (selectedRoleFilter === "picker" && !r.includes("pick")) return false;
				if (selectedRoleFilter === "packer" && !r.includes("pack")) return false;
				if (selectedRoleFilter === "putter" && !r.includes("put")) return false;
				if (selectedRoleFilter === "auditor" && !r.includes("audit") && !r.includes("check")) return false;
				if (selectedRoleFilter === "driver" && !r.includes("driv") && !r.includes("fleet")) return false;
				if (selectedRoleFilter === "manager" && !r.includes("admin") && !r.includes("manag") && !r.includes("super")) return false;
			}

			// Search Query
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				return (
					s.name.toLowerCase().includes(q) ||
					s.email.toLowerCase().includes(q) ||
					(s.staff_code && s.staff_code.toLowerCase().includes(q)) ||
					(s.role && s.role.toLowerCase().includes(q)) ||
					(s.department && s.department.toLowerCase().includes(q)) ||
					(s.phone && s.phone.includes(q))
				);
			}

			return true;
		});
	}, [staffList, selectedRoleFilter, searchQuery]);

	// Stats
	const stats = useMemo(() => {
		const total = staffList?.length || 0;
		const pickers = staffList?.filter((s) => s.role?.toLowerCase().includes("pick")).length || 0;
		const putters = staffList?.filter((s) => s.role?.toLowerCase().includes("put")).length || 0;
		const packers = staffList?.filter((s) => s.role?.toLowerCase().includes("pack")).length || 0;
		const auditors = staffList?.filter((s) => s.role?.toLowerCase().includes("audit") || s.role?.toLowerCase().includes("check")).length || 0;
		const drivers = staffList?.filter((s) => s.role?.toLowerCase().includes("driv")).length || 0;

		return { total, pickers, putters, packers, auditors, drivers };
	}, [staffList]);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							Depot Operator Workforce Registry
						</h2>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE REAL-TIME
						</span>
					</div>
					<p className="text-muted-foreground text-sm">
						Monitor real employee roster, assign operators, and register new warehouse personnel.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					{/* Active Geofence Badge & Configure Button */}
					<div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 dark:border-blue-900/60 dark:bg-blue-950/40">
						<MapPinIcon className="h-4 w-4 text-blue-600 shrink-0" />
						<div className="text-xs">
							<div className="flex items-center gap-1.5 font-semibold text-blue-950 dark:text-blue-100">
								<span className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Active Geofence:</span>
								{existingGeofence ? (
									<span className="font-mono text-blue-700 dark:text-blue-300 font-bold">
										{Number(existingGeofence.latitude).toFixed(6)}, {Number(existingGeofence.longitude).toFixed(6)}
										<span className="ml-1 text-[11px] text-slate-500 font-normal">
											(±{existingGeofence.radius}m)
										</span>
									</span>
								) : (
									<span className="text-amber-600 dark:text-amber-400 font-medium">Not configured</span>
								)}
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsGeofenceModalOpen(true)}
							className="h-7 px-2.5 text-xs font-bold border-blue-300 bg-white hover:bg-blue-100 text-blue-700 dark:bg-slate-900 dark:text-blue-300 dark:border-blue-800"
						>
							Configure
						</Button>
					</div>

					<Button
						onClick={() => setIsAddModalOpen(true)}
						className="h-9 gap-1.5 font-bold text-xs shadow-sm"
					>
						<UserPlusIcon className="h-4 w-4" />
						+ Add New Operator
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => cleanAndSeedMutation.mutate()}
						disabled={cleanAndSeedMutation.isPending}
						className="h-9 gap-1.5 font-semibold text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
					>
						<Trash2Icon className="h-3.5 w-3.5" />
						{cleanAndSeedMutation.isPending ? "Purging..." : "Purge Fake Data"}
					</Button>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search operator, email, role..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="gap-1.5"
					>
						<RefreshCwIcon
							className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
						/>
						Sync
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${selectedRoleFilter === "all" ? "border-primary ring-1 ring-primary" : ""}`}
					onClick={() => setSelectedRoleFilter("all")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
							<UsersIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Total Staff</p>
							<p className="font-bold text-slate-900 text-xl dark:text-slate-100">
								{stats.total}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${selectedRoleFilter === "picker" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
					onClick={() => setSelectedRoleFilter("picker")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
							<UserCheckIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Pickers</p>
							<p className="font-bold text-blue-600 text-xl dark:text-blue-400">
								{stats.pickers}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${selectedRoleFilter === "putter" ? "border-purple-500 ring-1 ring-purple-500" : ""}`}
					onClick={() => setSelectedRoleFilter("putter")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
							<WrenchIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Put-Away</p>
							<p className="font-bold text-purple-600 text-xl dark:text-purple-400">
								{stats.putters}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${selectedRoleFilter === "packer" ? "border-amber-500 ring-1 ring-amber-500" : ""}`}
					onClick={() => setSelectedRoleFilter("packer")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
							<CheckCircle2Icon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Packers</p>
							<p className="font-bold text-amber-600 text-xl dark:text-amber-400">
								{stats.packers}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${selectedRoleFilter === "auditor" ? "border-teal-500 ring-1 ring-teal-500" : ""}`}
					onClick={() => setSelectedRoleFilter("auditor")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
							<ShieldCheckIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">QA & Audit</p>
							<p className="font-bold text-teal-600 text-xl dark:text-teal-400">
								{stats.auditors}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer transition-all hover:shadow-md ${selectedRoleFilter === "driver" ? "border-indigo-500 ring-1 ring-indigo-500" : ""}`}
					onClick={() => setSelectedRoleFilter("driver")}
				>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
							<TruckIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-xs">Drivers</p>
							<p className="font-bold text-indigo-600 text-xl dark:text-indigo-400">
								{stats.drivers}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Staff Registry Table */}
			<Card className="shadow-sm">
				<CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="font-bold text-base">
							WMS Operators Directory
						</CardTitle>
						<CardDescription>
							Official active employee records from HRMS database
						</CardDescription>
					</div>

					{/* Department Filter Tabs */}
					<div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
						<Button
							variant={selectedRoleFilter === "all" ? "default" : "ghost"}
							size="sm"
							onClick={() => setSelectedRoleFilter("all")}
							className="h-7 text-xs"
						>
							All ({stats.total})
						</Button>
						<Button
							variant={selectedRoleFilter === "picker" ? "default" : "ghost"}
							size="sm"
							onClick={() => setSelectedRoleFilter("picker")}
							className="h-7 text-xs"
						>
							Pickers ({stats.pickers})
						</Button>
						<Button
							variant={selectedRoleFilter === "putter" ? "default" : "ghost"}
							size="sm"
							onClick={() => setSelectedRoleFilter("putter")}
							className="h-7 text-xs"
						>
							Put-Away ({stats.putters})
						</Button>
						<Button
							variant={selectedRoleFilter === "packer" ? "default" : "ghost"}
							size="sm"
							onClick={() => setSelectedRoleFilter("packer")}
							className="h-7 text-xs"
						>
							Packers ({stats.packers})
						</Button>
						<Button
							variant={selectedRoleFilter === "auditor" ? "default" : "ghost"}
							size="sm"
							onClick={() => setSelectedRoleFilter("auditor")}
							className="h-7 text-xs"
						>
							QA / Audit ({stats.auditors})
						</Button>
						<Button
							variant={selectedRoleFilter === "driver" ? "default" : "ghost"}
							size="sm"
							onClick={() => setSelectedRoleFilter("driver")}
							className="h-7 text-xs"
						>
							Drivers ({stats.drivers})
						</Button>
					</div>
				</CardHeader>

				<CardContent className="p-0 sm:p-6">
					{staffLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							<p className="mt-2 text-muted-foreground text-xs">
								Loading real employee roster...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead>Staff Name</TableHead>
										<TableHead>Employee Code</TableHead>
										<TableHead>Email & Contact</TableHead>
										<TableHead>Department & Role</TableHead>
										<TableHead>Joining Date</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredStaff.map((s) => {
										const r = s.role?.toLowerCase() || "";
										const badgeColor =
											r.includes("pick")
												? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
												: r.includes("put")
													? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
													: r.includes("pack")
														? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
														: r.includes("audit") || r.includes("check")
															? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300"
															: r.includes("driv")
																? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300"
																: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";

										return (
											<TableRow key={s.id} className="hover:bg-muted/20">
												{/* Name with initial avatar */}
												<TableCell>
													<div className="flex items-center gap-2.5">
														<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
															{s.name.charAt(0).toUpperCase()}
														</span>
														<div className="flex flex-col">
															<span className="font-bold text-slate-900 text-xs dark:text-slate-100">
																{s.name}
															</span>
															<span className="text-[11px] text-muted-foreground">
																{s.department || "Operations"}
															</span>
														</div>
													</div>
												</TableCell>

												{/* Employee Code */}
												<TableCell className="font-mono font-semibold text-slate-600 text-xs dark:text-slate-300">
													{s.staff_code || `EMP-${s.id}`}
												</TableCell>

												{/* Email & Phone */}
												<TableCell>
													<div className="flex flex-col">
														<span className="font-medium text-slate-700 text-xs dark:text-slate-300">
															{s.email}
														</span>
														{s.phone && (
															<span className="text-[11px] text-muted-foreground">
																{s.phone}
															</span>
														)}
													</div>
												</TableCell>

												{/* Role */}
												<TableCell>
													<span
														className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-[11px] capitalize ${badgeColor}`}
													>
														{s.role.replace(/_/g, " ")}
													</span>
												</TableCell>

												{/* Joining Date */}
												<TableCell className="text-slate-500 text-xs">
													{s.join_date
														? new Date(s.join_date).toLocaleDateString()
														: "—"}
												</TableCell>

												{/* Status */}
												<TableCell>
													<Badge
														variant="outline"
														className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700 text-xs dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
													>
														Online & Active
													</Badge>
												</TableCell>

												{/* Action Buttons */}
												<TableCell className="text-right">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleDeleteStaff(s.id, s.name)}
														disabled={deleteStaffMutation.isPending}
														className="h-7 w-7 p-0 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
														title="Remove Employee"
													>
														<Trash2Icon className="h-3.5 w-3.5" />
													</Button>
												</TableCell>
											</TableRow>
										);
									})}

									{filteredStaff.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={7}
												className="py-12 text-center text-muted-foreground"
											>
												<UsersIcon className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-700" />
												<p className="font-bold text-sm">
													No operators found matching the criteria.
												</p>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setIsAddModalOpen(true)}
													className="mt-3 text-xs"
												>
													+ Add First Operator
												</Button>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* ADD NEW OPERATOR MODAL */}
			<Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
				<DialogContent className="bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg text-slate-900 dark:text-slate-100">
							Add New Depot Operator / Employee
						</DialogTitle>
						<DialogDescription>
							Register official personnel into Evaluna HRMS & Warehouse task distribution.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Full Name *
								</Label>
								<Input
									placeholder="E.g. Kailash Bharati"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									className="mt-1 h-9 font-medium text-xs"
								/>
							</div>

							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Email Address *
								</Label>
								<Input
									type="email"
									placeholder="kailash@evaluna.com"
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
									className="mt-1 h-9 font-medium text-xs"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Phone Number
								</Label>
								<Input
									placeholder="+91 98765 43210"
									value={newPhone}
									onChange={(e) => setNewPhone(e.target.value)}
									className="mt-1 h-9 font-medium text-xs"
								/>
							</div>

							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Joining Date
								</Label>
								<Input
									type="date"
									value={newJoinDate}
									onChange={(e) => setNewJoinDate(e.target.value)}
									className="mt-1 h-9 font-medium text-xs"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Warehouse Role *
								</Label>
								<select
									className="mt-1 w-full rounded-md border border-input bg-background p-2 font-semibold text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
									value={newRole}
									onChange={(e) => setNewRole(e.target.value)}
								>
									<option value="picker">Picker (Outbound Fulfillment)</option>
									<option value="packer">Packer (Box Packaging & Seal)</option>
									<option value="putter">Putter (Inbound Placement)</option>
									<option value="loader">Loader (Vehicle Dispatch)</option>
									<option value="driver">Driver (Logistics Fleet)</option>
									<option value="checker">Checker (Quality Verification)</option>
									<option value="auditor">Auditor (QA & Stock Finding)</option>
									<option value="warehouse_manager">Warehouse Manager</option>
									<option value="manager">Operations Manager</option>
									<option value="cashier">Cashier</option>
									<option value="sales_person">Sales Person</option>
								</select>
							</div>

							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Department
								</Label>
								<select
									className="mt-1 w-full rounded-md border border-input bg-background p-2 font-semibold text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
									value={newDepartment}
									onChange={(e) => setNewDepartment(e.target.value)}
								>
									<option value="Outbound Logistics">Outbound Logistics</option>
									<option value="Inbound Receiving">Inbound Receiving</option>
									<option value="Quality Assurance">Quality Assurance</option>
									<option value="Inventory Control">Inventory Control</option>
									<option value="Packing & Dispatch">Packing & Dispatch</option>
									<option value="Fleet & Delivery">Fleet & Delivery</option>
									<option value="Warehouse Administration">Warehouse Administration</option>
								</select>
							</div>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Monthly Salary (₹)
							</Label>
							<Input
								type="number"
								placeholder="28000"
								value={newSalary}
								onChange={(e) => setNewSalary(e.target.value)}
								className="mt-1 h-9 font-medium text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsAddModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleAddOperator}
							disabled={createStaffMutation.isPending}
							className="font-bold"
						>
							{createStaffMutation.isPending
								? "Registering..."
								: "Register Operator"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* CONFIGURE WAREHOUSE GPS GEOFENCE MODAL */}
			<Dialog open={isGeofenceModalOpen} onOpenChange={setIsGeofenceModalOpen}>
				<DialogContent className="max-w-md bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-100">
							<MapPinIcon className="h-5 w-5 text-blue-600" />
							Configure Warehouse GPS Geofence
						</DialogTitle>
						<DialogDescription>
							Set the official GPS coordinates and allowed radius for Bhopal Main Warehouse. Staff check-in & check-out selfie validation is enforced against this boundary.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						{/* PREVIOUSLY / CURRENTLY SAVED COORDINATES BANNER */}
						{existingGeofence ? (
							<div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/60">
								<div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200 mb-2">
									<span className="flex items-center gap-1.5 font-bold text-xs">
										<ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
										Pehle se Saved Coordinates (Currently Active):
									</span>
									<span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold dark:bg-emerald-950 dark:text-emerald-300">
										<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
										Active
									</span>
								</div>
								<div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-md border border-slate-200 dark:border-slate-700/80 shadow-2xs">
									<div>
										<span className="text-slate-400 block text-[10px] font-sans">Latitude:</span>
										<span className="font-bold text-slate-900 dark:text-slate-100">
											{Number(existingGeofence.latitude).toFixed(6)}
										</span>
									</div>
									<div>
										<span className="text-slate-400 block text-[10px] font-sans">Longitude:</span>
										<span className="font-bold text-slate-900 dark:text-slate-100">
											{Number(existingGeofence.longitude).toFixed(6)}
										</span>
									</div>
									<div>
										<span className="text-slate-400 block text-[10px] font-sans">Radius:</span>
										<span className="font-bold text-slate-900 dark:text-slate-100">
											{existingGeofence.radius} m
										</span>
									</div>
								</div>
								{existingGeofence.updatedAt && (
									<div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
										<span>Last Updated: {new Date(existingGeofence.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
										<button
											type="button"
											onClick={() => {
												if (existingGeofence.latitude) setGeoLat(String(existingGeofence.latitude));
												if (existingGeofence.longitude) setGeoLng(String(existingGeofence.longitude));
												if (existingGeofence.radius) setGeoRadius(String(existingGeofence.radius));
											}}
											className="text-blue-600 hover:underline font-semibold"
										>
											Reset to Saved
										</button>
									</div>
								)}
							</div>
						) : (
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
								⚠️ No geofence coordinates saved yet for this branch. Please set coordinates below.
							</div>
						)}

						<div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
							<div className="flex items-center justify-between">
								<span className="font-semibold">Quick Setup via Browser GPS:</span>
								<Button
									size="sm"
									variant="outline"
									onClick={handleGetCurrentLocation}
									disabled={isGettingCurrentLocation}
									className="h-7 text-xs border-blue-300 bg-white hover:bg-blue-100 dark:bg-slate-800"
								>
									{isGettingCurrentLocation ? (
										<Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
									) : (
										<RadioIcon className="mr-1 h-3.5 w-3.5 text-blue-600" />
									)}
									Use Current Location
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Latitude *
								</Label>
								<Input
									placeholder="23.259933"
									value={geoLat}
									onChange={(e) => setGeoLat(e.target.value)}
									className="mt-1 h-9 font-mono text-xs"
								/>
							</div>

							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Longitude *
								</Label>
								<Input
									placeholder="77.412615"
									value={geoLng}
									onChange={(e) => setGeoLng(e.target.value)}
									className="mt-1 h-9 font-mono text-xs"
								/>
							</div>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Geofence Radius (Meters) *
							</Label>
							<Input
								type="number"
								placeholder="250"
								value={geoRadius}
								onChange={(e) => setGeoRadius(e.target.value)}
								className="mt-1 h-9 font-mono text-xs"
							/>
							<p className="mt-1 text-[11px] text-muted-foreground">
								Staff attempting to clock in outside this radius will be flagged or rejected.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsGeofenceModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveGeofence}
							disabled={setGeofenceMutation.isPending}
							className="bg-blue-600 text-white font-bold hover:bg-blue-700"
						>
							{setGeofenceMutation.isPending && (
								<Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							)}
							Save Geofence
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
