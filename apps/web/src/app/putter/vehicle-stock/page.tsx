"use client";

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
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";
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

type AvailableWarehouseItem = {
	id: number;
	name: string;
	sku: string;
	price: number;
	warehouseStock: number;
};

export default function PutterVehicleStockPage() {
	const trpc = useTRPC();
	const { data: vehicleList, isLoading, refetch } = trpc.putter.getVehicleStockList.useQuery();
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
	const [selectedItemToLoad, setSelectedItemToLoad] = useState<AvailableWarehouseItem | null>(null);
	const [qtyToLoad, setQtyToLoad] = useState<number>(5);

	const availableWarehouseItems: AvailableWarehouseItem[] = [
		{ id: 101, name: "Sugar 1kg", sku: "SUG-1KG", price: 45, warehouseStock: 120 },
		{ id: 102, name: "Fortune Soyabean Oil 1L", sku: "OIL-1L", price: 140, warehouseStock: 85 },
		{ id: 103, name: "Taj Mahal Tea 250g", sku: "TEA-250G", price: 180, warehouseStock: 40 },
		{ id: 104, name: "Amul Pure Ghee 1L", sku: "GHEE-1L", price: 620, warehouseStock: 30 },
		{ id: 105, name: "Tata Salt 1kg", sku: "SALT-1KG", price: 28, warehouseStock: 200 },
	];

	const activeVehicle = vehicleList?.find((v) => v.vehicleId === selectedVehicleId) || vehicleList?.[0];

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
								Manage extra items loaded in delivery vehicles for live customer add-ons.
							</p>
						</div>
					</div>
					<Button
						onClick={() => setAddModalOpen(true)}
						className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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
							className={`cursor-pointer transition-all border-2 ${
								(selectedVehicleId === vehicle.vehicleId || (!selectedVehicleId && vehicle === activeVehicle))
									? "border-blue-600 bg-blue-50/30 dark:border-blue-500 dark:bg-blue-950/20 shadow-md"
									: "hover:border-gray-300"
							}`}
						>
							<CardHeader className="p-4 pb-2">
								<div className="flex items-center justify-between">
									<Badge variant="outline" className="font-mono text-xs border-blue-400 bg-blue-50 text-blue-700">
										<Truck className="mr-1 h-3 w-3" /> {vehicle.vehiclePlate}
									</Badge>
									<Badge variant="secondary" className="text-[10px]">
										Active Route
									</Badge>
								</div>
								<CardTitle className="text-base mt-2 flex items-center gap-1.5">
									<User className="h-4 w-4 text-gray-500" /> {vehicle.driverName}
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-1 text-xs text-gray-500 flex justify-between">
								<span>Buffer Stock Loaded:</span>
								<span className="font-bold font-mono text-gray-900 dark:text-white">
									{vehicle.allocatedItems.reduce((acc, i) => acc + i.loadedQty, 0)} Items
								</span>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Vehicle Active Stock Inventory Breakdown */}
				{activeVehicle && (
					<Card className="shadow-sm">
						<CardHeader className="border-b bg-gray-50/50 pb-4 dark:bg-gray-800/50">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
								<div>
									<CardTitle className="text-base flex items-center gap-2">
										<Box className="h-5 w-5 text-blue-600" />
										Current Van Inventory in {activeVehicle.vehiclePlate} ({activeVehicle.driverName})
									</CardTitle>
									<CardDescription className="text-xs">
										Real-time stock carried by the driver for on-the-spot customer sales.
									</CardDescription>
								</div>
								<Badge variant="outline" className="w-fit text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
									<ShieldCheck className="mr-1 h-3.5 w-3.5" /> Warehouse Stock Deducted
								</Badge>
							</div>
						</CardHeader>

						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm">
									<thead className="border-b bg-gray-100/50 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
										<tr>
											<th className="p-3 pl-4">Item & SKU</th>
											<th className="p-3">Unit Price</th>
											<th className="p-3">Initial Loaded Qty</th>
											<th className="p-3">Remaining in Truck</th>
											<th className="p-3">Sold on Delivery</th>
											<th className="p-3 pr-4 text-right">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{activeVehicle.allocatedItems.map((item) => {
											const soldQty = item.loadedQty - item.remainingQty;
											return (
												<tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
													<td className="p-3 pl-4">
														<div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
														<div className="font-mono text-[11px] text-gray-500">{item.sku}</div>
													</td>
													<td className="p-3 font-mono">₹{item.price}</td>
													<td className="p-3 font-mono font-semibold">{item.loadedQty} units</td>
													<td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
														{item.remainingQty} units
													</td>
													<td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
														{soldQty > 0 ? `${soldQty} sold` : "0 sold"}
													</td>
													<td className="p-3 pr-4 text-right">
														<Badge
															variant={item.remainingQty > 0 ? "secondary" : "destructive"}
															className="text-[10px]"
														>
															{item.remainingQty > 0 ? "Available in Van" : "Out of Stock"}
														</Badge>
													</td>
												</tr>
											);
										})}
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
							Load Stock into {activeVehicle?.vehiclePlate} ({activeVehicle?.driverName})
						</DialogTitle>
						<DialogDescription className="text-xs">
							Select items from main warehouse inventory to allocate as truck buffer stock.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Search Bar */}
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search warehouse stock by name or SKU..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9 text-xs"
							/>
						</div>

						{/* Available Items List */}
						<div className="max-h-52 overflow-y-auto border rounded-md divide-y">
							{filteredWarehouseItems.map((item) => (
								<div
									key={item.id}
									onClick={() => setSelectedItemToLoad(item)}
									className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
										selectedItemToLoad?.id === item.id
											? "bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100 font-semibold"
											: "hover:bg-gray-50 dark:hover:bg-gray-800"
									}`}
								>
									<div>
										<div className="font-medium">{item.name}</div>
										<div className="text-gray-500 text-[10px] font-mono">{item.sku} | ₹{item.price}</div>
									</div>
									<Badge variant="outline" className="font-mono text-[10px]">
										Available: {item.warehouseStock} units
									</Badge>
								</div>
							))}
						</div>

						{selectedItemToLoad && (
							<div className="rounded-lg bg-blue-50/50 p-3 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 space-y-2">
								<div className="flex justify-between items-center text-xs font-semibold">
									<span>Selected: {selectedItemToLoad.name}</span>
									<span className="font-mono text-blue-600">₹{selectedItemToLoad.price} / unit</span>
								</div>
								<div className="flex items-center space-x-3">
									<Label className="text-xs text-gray-600 dark:text-gray-300">Quantity to Load into Van:</Label>
									<Input
										type="number"
										min={1}
										max={selectedItemToLoad.warehouseStock}
										value={qtyToLoad}
										onChange={(e) => setQtyToLoad(Number(e.target.value))}
										className="w-24 h-8 text-xs font-mono"
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
							className="bg-blue-600 hover:bg-blue-700 text-white"
						>
							{allocateStock.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : null}
							Confirm & Load Stock
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
