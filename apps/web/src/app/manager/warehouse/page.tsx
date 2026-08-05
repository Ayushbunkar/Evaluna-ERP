"use client";

import { Loader2Icon, MapPinIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
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
import { trpc } from "@/lib/trpc/client";

export default function WarehouseDashboard() {
	const [search, setSearch] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newLocation, setNewLocation] = useState({
		name: "",
		location_type: "storage",
		capacity: 0,
	});

	const utils = trpc.useUtils();
	const { data: locations, isLoading } = trpc.warehouse.getLocations.useQuery({} as any);
	const createLocation = trpc.warehouse.createLocation.useMutation({
		onSuccess: () => {
			toast.success("Location created successfully");
			setIsCreateOpen(false);
			utils.warehouse.getLocations.invalidate();
			setNewLocation({ name: "", location_type: "storage", capacity: 0 });
		},
		onError: (error) => {
			toast.error(`Error: ${error.message}`);
		},
	});

	const handleCreate = () => {
		if (!newLocation.name) return toast.error("Name is required");
		createLocation.mutate({
			name: newLocation.name,
			location_type: newLocation.location_type,
			capacity: Number(newLocation.capacity),
		});
	};

	return (
		<div className="fade-in zoom-in-95 container mx-auto animate-in space-y-6 p-6 duration-500">
			<div className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 p-8 text-white shadow-2xl sm:flex-row sm:items-center">
				<div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
				<div className="relative z-10">
					<h1 className="flex items-center gap-3 font-black text-4xl tracking-tight">
						<MapPinIcon className="h-10 w-10 text-blue-300" />
						Warehouse Locations
					</h1>
					<p className="mt-2 font-medium text-blue-200 text-lg">
						Manage your physical storage bins and quarantine zones.
					</p>
				</div>
				<div className="relative z-10 flex gap-3">
					<Link href="/admin/warehouse/scanner">
						<Button
							variant="secondary"
							className="font-semibold shadow-lg transition-transform hover:scale-105"
						>
							Open Scanner
						</Button>
					</Link>
					<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
						<DialogTrigger asChild>
							<Button className="border-0 bg-blue-500 font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-400">
								<PlusIcon className="mr-2 h-5 w-5" />
								New Location
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>Add New Location</DialogTitle>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="name">Location Name / Code</Label>
									<Input
										id="name"
										placeholder="e.g. A-01-B"
										value={newLocation.name}
										onChange={(e) =>
											setNewLocation({ ...newLocation, name: e.target.value })
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="type">Location Type</Label>
									<Select
										value={newLocation.location_type}
										onValueChange={(val) =>
											setNewLocation({ ...newLocation, location_type: val })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="storage">Standard Storage</SelectItem>
											<SelectItem value="picking">Picking Bin</SelectItem>
											<SelectItem value="quarantine">
												Quarantine / Damage
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="capacity">Capacity (Units)</Label>
									<Input
										id="capacity"
										type="number"
										min="0"
										value={newLocation.capacity}
										onChange={(e) =>
											setNewLocation({
												...newLocation,
												capacity: Number(e.target.value),
											})
										}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={handleCreate}
									disabled={createLocation.isPending}
								>
									{createLocation.isPending && (
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									)}
									Save Location
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<Input
					placeholder="Search locations..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-md border-gray-200 shadow-sm"
				/>
			</div>

			{isLoading ? (
				<div className="flex justify-center p-12">
					<Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{locations?.map((loc) => (
						<Card
							key={loc.id}
							className="group overflow-hidden border-t-4 border-t-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
						>
							<CardHeader className="bg-gray-50/50 pb-4">
								<CardTitle className="flex items-center justify-between text-xl">
									{loc.name}
									<span
										className={`rounded-full px-2 py-1 font-bold text-xs uppercase tracking-wider ${
											loc.location_type === "storage"
												? "bg-green-100 text-green-700"
												: loc.location_type === "quarantine"
													? "bg-red-100 text-red-700"
													: "bg-blue-100 text-blue-700"
										}`}
									>
										{loc.location_type}
									</span>
								</CardTitle>
								<CardDescription>
									ID: {loc.id}
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-4">
								<div className="flex flex-col gap-2 text-gray-600 text-sm">
									<div className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
										<span className="font-medium">Capacity</span>
										<span className="font-bold text-gray-900">
											{(loc.capacity ?? 0) > 0 ? loc.capacity : "Unlimited"}
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
										<span className="font-medium">Current Stock</span>
										<span className="font-bold text-gray-900">--</span>
									</div>
								</div>
								<div className="mt-4 flex justify-end border-t pt-4 opacity-0 transition-opacity group-hover:opacity-100">
									<Button variant="outline" size="sm" className="w-full">
										Print Barcode
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
					{locations?.length === 0 && (
						<div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-gray-200 border-dashed bg-gray-50 p-12 text-gray-500">
							<MapPinIcon className="mb-4 h-12 w-12 text-gray-300" />
							<p className="font-medium text-lg">No locations found</p>
							<p className="text-sm">
								Try adjusting your search or create a new location.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
