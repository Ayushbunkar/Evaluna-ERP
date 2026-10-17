"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
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
	AlertCircle,
	ArrowLeft,
	Box,
	CheckCircle,
	PackagePlus,
	Plus,
	RefreshCw,
	Search,
	ShieldCheck,
	Truck,
	User,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

type AvailableWarehouseItem = {
	id: number;
	name: string;
	sku: string;
	price: number;
	warehouseStock: number;
};

export default function PutterVehicleStockPage() {
	const trpc = useTRPC();
	const {
		data: vehicleList,
		isLoading,
		refetch,
	} = trpc.putter.getVehicleStockList.useQuery();
	const { data: productsData, isLoading: isLoadingProducts } =
		trpc.products.list.useQuery({ limit: 100 });

	const allocateStock = trpc.putter.allocateVehicleStock.useMutation({
		onSuccess: () => {
			toast.success("Extra buffer inventory successfully loaded into vehicle!");
			setAddModalOpen(false);
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to allocate vehicle stock.");
		},
	});

	const [selectedVehicleId, setSelectedVehicleId] = useState<number>(1);
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedItemToLoad, setSelectedItemToLoad] =
		useState<AvailableWarehouseItem | null>(null);
	const [qtyToLoad, setQtyToLoad] = useState<number>(5);

	const availableWarehouseItems: AvailableWarehouseItem[] = useMemo(() => {
		if (!productsData) return [];
		return productsData.map((p) => ({
			id: p.id,
			name: p.name,
			sku: p.sku || `SKU-${p.id}`,
			price: p.baseSellingPrice || 0,
			warehouseStock: Number(p.stock) || 0,
		}));
	}, [productsData]);

	const activeVehicle =
		vehicleList?.find((v) => v.vehicleId === selectedVehicleId) ||
		vehicleList?.[0];

	const filteredWarehouseItems = availableWarehouseItems.filter(
		(item) =>
			item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleConfirmLoad = () => {
		if (!selectedItemToLoad || qtyToLoad <= 0) {
			toast.error("Please select a valid item and quantity.");
			return;
		}

		allocateStock.mutate({
			vehicleId: activeVehicle?.vehicleId || 1,
			items: [
				{
					productId: selectedItemToLoad.id,
					name: selectedItemToLoad.name,
					qty: qtyToLoad,
					price: selectedItemToLoad.price,
				},
			],
		});
	};

	return (
		<div className="min-h-screen bg-gray-50/50 p-4 md:p-6 dark:bg-gray-900">
			<div className="mx-auto max-w-6xl space-y-6">
				{/* Top Bar Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center space-x-3">
						<Link href="/putter">
							<Button variant="outline" size="icon">
								<ArrowLeft className="h-4 w-4" />
							</Button>
						</Link>
						<div>
							<h1 className="font-bold text-2xl text-gray-900 tracking-tight dark:text-white">
								Vehicle Buffer Stock & Truck Loading
							</h1>
							<p className="text-gray-500 text-sm dark:text-gray-400">
								Manage extra items loaded in delivery vehicles for live customer
								add-ons.
							</p>
						</div>
					</div>
					<Button
						onClick={() => setAddModalOpen(true)}
						className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
					>
						<PackagePlus className="h-4 w-4" /> Load Extra Stock to Vehicle
					</Button>
				</div>

				{/* Vehicle Selector */}
				<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
					{vehicleList?.map((vehicle) => (
						<Card
							key={vehicle.vehicleId}
							onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
							className={`cursor-pointer border-2 transition-all ${
								selectedVehicleId === vehicle.vehicleId ||
								(!selectedVehicleId && vehicle === activeVehicle)
									? "border-blue-600 bg-blue-50/30 shadow-md dark:border-blue-500 dark:bg-blue-950/20"
									: "hover:border-gray-300"
							}`}
						>
							<CardHeader className="p-4 pb-2">
								<div className="flex items-center justify-between">
									<Badge
										variant="outline"
										className="border-blue-400 bg-blue-50 font-mono text-blue-700 text-xs"
									>
										<Truck className="mr-1 h-3 w-3" /> {vehicle.vehiclePlate}
									</Badge>
									<Badge variant="secondary" className="text-[10px]">
										Active Route
									</Badge>
								</div>
								<CardTitle className="mt-2 flex items-center gap-1.5 text-base">
									<User className="h-4 w-4 text-gray-500" />{" "}
									{vehicle.driverName}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex justify-between p-4 pt-1 text-gray-500 text-xs">
								<span>Buffer Stock Loaded:</span>
								<span className="font-bold font-mono text-gray-900 dark:text-white">
									{vehicle.allocatedItems.reduce(
										(acc, i) => acc + i.loadedQty,
										0,
									)}{" "}
									Items
								</span>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Vehicle Active Stock Inventory Breakdown */}
				{activeVehicle && (
					<Card className="shadow-sm">
						<CardHeader className="border-b bg-gray-50/50 pb-4 dark:bg-gray-800/50">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<CardTitle className="flex items-center gap-2 text-base">
										<Box className="h-5 w-5 text-blue-600" />
										Current Van Inventory in {activeVehicle.vehiclePlate} (
										{activeVehicle.driverName})
									</CardTitle>
									<CardDescription className="text-xs">
										Real-time stock carried by the driver for on-the-spot
										customer sales.
									</CardDescription>
								</div>
								<Badge
									variant="outline"
									className="w-fit border-emerald-300 bg-emerald-50 text-emerald-700 text-xs"
								>
									<ShieldCheck className="mr-1 h-3.5 w-3.5" /> Warehouse Stock
									Deducted
								</Badge>
							</div>
						</CardHeader>

						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm">
									<thead className="border-b bg-gray-100/50 font-semibold text-gray-600 text-xs dark:bg-gray-800 dark:text-gray-300">
										<tr>
											<th className="p-3 pl-4">Item & SKU</th>
											<th className="p-3">Source & Category</th>
											<th className="p-3">Unit Price</th>
											<th className="p-3">Loaded / Returned Qty</th>
											<th className="p-3">In Vehicle</th>
											<th className="p-3">Sold on Delivery</th>
											<th className="p-3 pr-4 text-right">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{activeVehicle.allocatedItems.length === 0 ? (
											<tr>
												<td
													colSpan={7}
													className="p-8 text-center text-gray-500 text-xs"
												>
													<Box className="mx-auto mb-2 h-7 w-7 opacity-30 text-blue-500" />
													<p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
														No items currently carried in this vehicle
													</p>
													<p className="mt-1 text-gray-400">
														Load extra truck buffer stock above, or customer returns from live delivery stops will automatically appear here.
													</p>
												</td>
											</tr>
										) : (
											activeVehicle.allocatedItems.map((item) => {
												const soldQty = item.loadedQty - item.remainingQty;
												const isReturn = item.source === "customer_return";
												return (
													<tr
														key={item.id}
														className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
													>
														<td className="p-3 pl-4">
															<div className="font-medium text-gray-900 dark:text-white">
																{item.name}
															</div>
															<div className="font-mono text-[11px] text-gray-500">
																{item.sku}
															</div>
															{isReturn && item.customerName && (
																<div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
																	Customer: {item.customerName}
																</div>
															)}
														</td>
														<td className="p-3">
															{isReturn ? (
																<div className="space-y-0.5">
																	<Badge
																		variant="outline"
																		className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-bold"
																	>
																		🔄 Customer Return
																	</Badge>
																	{item.reason && (
																		<div className="text-[10px] text-muted-foreground line-clamp-1">
																			{item.reason}
																		</div>
																	)}
																</div>
															) : (
																<Badge
																	variant="outline"
																	className="border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[10px]"
																>
																	📦 Buffer Stock
																</Badge>
															)}
														</td>
														<td className="p-3 font-mono">₹{item.price}</td>
														<td className="p-3 font-mono font-semibold">
															{item.loadedQty} units
														</td>
														<td className="p-3 font-bold font-mono text-blue-600 dark:text-blue-400">
															{item.remainingQty} units
														</td>
														<td className="p-3 font-medium font-mono text-emerald-600 dark:text-emerald-400">
															{soldQty > 0 ? `${soldQty} sold` : "0 sold"}
														</td>
														<td className="p-3 pr-4 text-right">
															<Badge
																variant={
																	isReturn
																		? "outline"
																		: item.remainingQty > 0
																			? "secondary"
																			: "destructive"
																}
																className={`text-[10px] ${
																	isReturn
																		? "border-amber-400 bg-amber-50/80 text-amber-900 font-semibold dark:bg-amber-950/30 dark:text-amber-200"
																		: ""
																}`}
															>
																{isReturn
																	? "Returned in Van"
																	: item.remainingQty > 0
																		? "Available in Van"
																		: "Out of Stock"}
															</Badge>
														</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Load Stock Modal */}
			<Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<PackagePlus className="h-5 w-5 text-blue-600" />
							Load Stock into {activeVehicle?.vehiclePlate} (
							{activeVehicle?.driverName})
						</DialogTitle>
						<DialogDescription className="text-xs">
							Select items from main warehouse inventory to allocate as truck
							buffer stock.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Search Bar */}
						<div className="relative">
							<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search warehouse stock by name or SKU..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9 text-xs"
							/>
						</div>

						{/* Available Items List */}
						<div className="max-h-52 divide-y overflow-y-auto rounded-md border">
							{filteredWarehouseItems.map((item) => (
								<div
									key={item.id}
									onClick={() => setSelectedItemToLoad(item)}
									className={`flex cursor-pointer items-center justify-between p-3 text-xs transition-colors ${
										selectedItemToLoad?.id === item.id
											? "bg-blue-50 font-semibold text-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
											: "hover:bg-gray-50 dark:hover:bg-gray-800"
									}`}
								>
									<div>
										<div className="font-medium">{item.name}</div>
										<div className="font-mono text-[10px] text-gray-500">
											{item.sku} | ₹{item.price}
										</div>
									</div>
									<Badge variant="outline" className="font-mono text-[10px]">
										Available: {item.warehouseStock} units
									</Badge>
								</div>
							))}
						</div>

						{selectedItemToLoad && (
							<div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
								<div className="flex items-center justify-between font-semibold text-xs">
									<span>Selected: {selectedItemToLoad.name}</span>
									<span className="font-mono text-blue-600">
										₹{selectedItemToLoad.price} / unit
									</span>
								</div>
								<div className="flex items-center space-x-3">
									<Label className="text-gray-600 text-xs dark:text-gray-300">
										Quantity to Load into Van:
									</Label>
									<Input
										type="number"
										min={1}
										max={selectedItemToLoad.warehouseStock}
										value={qtyToLoad}
										onChange={(e) => setQtyToLoad(Number(e.target.value))}
										className="h-8 w-24 font-mono text-xs"
									/>
								</div>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setAddModalOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmLoad}
							disabled={allocateStock.isPending || !selectedItemToLoad}
							className="bg-blue-600 text-white hover:bg-blue-700"
						>
							{allocateStock.isPending ? (
								<RefreshCw className="mr-1 h-4 w-4 animate-spin" />
							) : null}
							Confirm & Load Stock
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
