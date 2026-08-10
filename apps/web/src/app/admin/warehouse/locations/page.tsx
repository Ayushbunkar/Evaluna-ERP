"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Edit2Icon, MapPinIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function WarehouseLocationsPage() {
	const utils = trpc.useUtils();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingLocation, setEditingLocation] = useState<any>(null);

	const [formData, setFormData] = useState({
		name: "",
		section: "",
		aisle: "",
		shelf: "",
		level: "",
		location_type: "storage",
		capacity: 0,
		is_active: true,
	});

	const { data: locations, isLoading } = trpc.warehouse.getLocations.useQuery(
		{},
	);

	const createLocation = trpc.warehouse.createLocation.useMutation({
		onSuccess: () => {
			toast.success("Location created successfully");
			utils.warehouse.getLocations.invalidate();
			setIsModalOpen(false);
			resetForm();
		},
		onError: (error) => toast.error(error.message),
	});

	const updateLocation = trpc.warehouse.updateLocation.useMutation({
		onSuccess: () => {
			toast.success("Location updated successfully");
			utils.warehouse.getLocations.invalidate();
			setIsModalOpen(false);
			resetForm();
		},
		onError: (error) => toast.error(error.message),
	});

	const deleteLocation = trpc.warehouse.deleteLocation.useMutation({
		onSuccess: () => {
			toast.success("Location deleted successfully");
			utils.warehouse.getLocations.invalidate();
		},
		onError: (error) => toast.error(error.message),
	});

	const resetForm = () => {
		setEditingLocation(null);
		setFormData({
			name: "",
			section: "",
			aisle: "",
			shelf: "",
			level: "",
			location_type: "storage",
			capacity: 0,
			is_active: true,
		});
	};

	const handleEdit = (loc: any) => {
		setEditingLocation(loc);
		setFormData({
			name: loc.name || "",
			section: loc.section || "",
			aisle: loc.aisle || "",
			shelf: loc.shelf || "",
			level: loc.level || "",
			location_type: loc.location_type || "storage",
			capacity: loc.capacity || 0,
			is_active: loc.is_active,
		});
		setIsModalOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (editingLocation) {
			updateLocation.mutate({
				id: editingLocation.id,
				...formData,
				capacity: Number(formData.capacity),
			});
		} else {
			createLocation.mutate({
				...formData,
				capacity: Number(formData.capacity),
			});
		}
	};

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
						<MapPinIcon className="h-6 w-6 text-foreground" />
					</div>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Warehouse Locations
						</h1>
						<p className="text-muted-foreground text-sm">
							Manage aisles, racks, and bin locations.
						</p>
					</div>
				</div>

				<Dialog
					open={isModalOpen}
					onOpenChange={(open) => {
						setIsModalOpen(open);
						if (!open) resetForm();
					}}
				>
					<DialogTrigger asChild>
						<Button className="gap-2">
							<PlusIcon className="h-4 w-4" />
							Add Location
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{editingLocation ? "Edit Location" : "Add New Location"}
							</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-4 pt-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Name (e.g., A-01)</Label>
									<Input
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label>Section</Label>
									<Input
										value={formData.section}
										onChange={(e) =>
											setFormData({ ...formData, section: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Aisle</Label>
									<Input
										value={formData.aisle}
										onChange={(e) =>
											setFormData({ ...formData, aisle: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Shelf</Label>
									<Input
										value={formData.shelf}
										onChange={(e) =>
											setFormData({ ...formData, shelf: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Level</Label>
									<Input
										value={formData.level}
										onChange={(e) =>
											setFormData({ ...formData, level: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Capacity (units)</Label>
									<Input
										type="number"
										value={formData.capacity}
										onChange={(e) =>
											setFormData({
												...formData,
												capacity: Number(e.target.value),
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Type</Label>
									<Select
										value={formData.location_type}
										onValueChange={(val) =>
											setFormData({ ...formData, location_type: val })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="storage">Storage</SelectItem>
											<SelectItem value="picking">Picking</SelectItem>
											<SelectItem value="quarantine">Quarantine</SelectItem>
											<SelectItem value="damage">Damage</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Status</Label>
									<Select
										value={formData.is_active ? "active" : "inactive"}
										onValueChange={(val) =>
											setFormData({ ...formData, is_active: val === "active" })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="inactive">Inactive</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="flex justify-end gap-2 pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsModalOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={
										createLocation.isPending || updateLocation.isPending
									}
								>
									{editingLocation ? "Save Changes" : "Create Location"}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="flex-1">
				<CardHeader>
					<CardTitle>All Locations</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : !locations || locations.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							No locations found. Add one to get started.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Path</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Utilization</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{locations.map((loc) => {
									const utilPct =
										loc.capacity && loc.capacity > 0
											? Math.min(
													100,
													Math.round(
														(Number(loc.current_stock || 0) /
															Number(loc.capacity)) *
															100,
													),
												)
											: 0;
									return (
										<TableRow key={loc.id}>
											<TableCell className="font-medium">{loc.name}</TableCell>
											<TableCell>
												<span className="text-muted-foreground text-sm">
													{loc.section || "-"} / {loc.aisle || "-"} /{" "}
													{loc.shelf || "-"} / {loc.level || "-"}
												</span>
											</TableCell>
											<TableCell className="capitalize">
												{loc.location_type}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
														<div
															className="h-full bg-primary"
															style={{ width: `${utilPct}%` }}
														/>
													</div>
													<span className="text-muted-foreground text-xs">
														{loc.current_stock || 0} / {loc.capacity || 0}
													</span>
												</div>
											</TableCell>
											<TableCell>
												{loc.is_active ? (
													<Badge
														variant="outline"
														className="border-green-200 text-green-600 dark:border-green-900"
													>
														Active
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="text-muted-foreground"
													>
														Inactive
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleEdit(loc)}
													>
														<Edit2Icon className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
														onClick={() => {
															if (
																confirm(
																	"Are you sure you want to delete this location? Ensure it is empty first.",
																)
															) {
																deleteLocation.mutate({ id: loc.id });
															}
														}}
													>
														<Trash2Icon className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
