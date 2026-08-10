"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Checkbox } from "@evaluna/ui/components/checkbox";
import { Input } from "@evaluna/ui/components/input";
import {
	AlertCircle,
	Barcode,
	CheckCircle,
	Package,
	Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function PackItemsPage() {
	const t = useTranslations("nav");
	const [searchTerm, setSearchTerm] = useState("");
	const [scannedItem, setScannedItem] = useState("");
	const [packingInProgress, setPackingInProgress] = useState(false);

	// Fetch pending orders
	const { data: pendingOrders, isLoading } =
		useTRPC().packer.getPendingOrders.useQuery();

	// Transform backend data to match our component structure
	const ordersToDisplay =
		pendingOrders?.map((order) => ({
			orderId: order.id,
			customer: order.customerName,
			items: order.items.map((item) => ({
				id: item.id,
				name: item.productName,
				barcode: item.barcode,
				packed: item.status === "packed",
			})),
			status: order.status,
		})) || [];

	const handleScan = (barcode: string) => {
		setScannedItem(barcode);
		// In a real app, this would verify the item and mark it as packed
		setTimeout(() => {
			setScannedItem("");
		}, 2000);
	};

	const handleStartPacking = () => {
		setPackingInProgress(true);
	};

	const handleCompletePacking = () => {
		setPackingInProgress(false);
		// In a real app, this would submit the packed order to the backend
	};

	const filteredOrders = ordersToDisplay.filter(
		(order) =>
			order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.customer.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<h1 className="font-bold text-2xl">{t("Pack Items")}</h1>
				<div className="flex gap-2">
					{!packingInProgress ? (
						<Button size="sm" onClick={handleStartPacking}>
							<Package className="mr-2 h-4 w-4" />
							Start Packing
						</Button>
					) : (
						<Button
							size="sm"
							onClick={handleCompletePacking}
							className="bg-green-600 hover:bg-green-700"
						>
							<CheckCircle className="mr-2 h-4 w-4" />
							Complete Packing
						</Button>
					)}
				</div>
			</div>

			{/* Barcode Scanner Section */}
			<Card>
				<CardHeader>
					<CardTitle>Barcode Scanner</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center gap-4 sm:flex-row">
						<div className="flex-1">
							<Input
								placeholder="Scan or enter barcode..."
								value={scannedItem}
								onChange={(e) => setScannedItem(e.target.value)}
								className="text-lg"
								onKeyPress={(e) => e.key === "Enter" && handleScan(scannedItem)}
							/>
						</div>
						<Button
							onClick={() => handleScan(scannedItem)}
							disabled={!scannedItem}
							className="w-full sm:w-auto"
						>
							<Barcode className="mr-2 h-4 w-4" />
							Scan Item
						</Button>
					</div>

					{scannedItem && (
						<div className="mt-4 flex items-center rounded-lg bg-green-50 p-3">
							<CheckCircle className="mr-2 h-5 w-5 text-green-600" />
							<span className="text-green-700">
								Item {scannedItem} scanned successfully!
							</span>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Orders Section */}
			<Card>
				<CardHeader>
					<CardTitle>Pending Orders</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-4">
						<div className="relative">
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search orders..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>

					{isLoading ? (
						<div className="flex h-32 items-center justify-center">
							<div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
						</div>
					) : filteredOrders.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							<Package className="mx-auto mb-2 h-8 w-8" />
							<p>No pending orders found</p>
						</div>
					) : (
						<div className="space-y-6">
							{filteredOrders.map((order) => (
								<div key={order.orderId} className="rounded-lg border p-4">
									<div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
										<div>
											<h3 className="font-semibold">{order.orderId}</h3>
											<p className="text-muted-foreground text-sm">
												{order.customer}
											</p>
										</div>
										<Badge
											variant={
												order.status === "pending" ? "secondary" : "default"
											}
										>
											{order.status}
										</Badge>
									</div>

									<div className="space-y-3">
										{order.items.map((item: any) => (
											<div
												key={item.id}
												className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
											>
												<div className="flex items-center gap-3">
													<Checkbox
														id={item.id}
														checked={item.packed}
														onCheckedChange={() => handleScan(item.barcode)}
														disabled={!packingInProgress}
													/>
													<label htmlFor={item.id} className="flex flex-col">
														<span className="font-medium">{item.name}</span>
														<span className="text-muted-foreground text-sm">
															Barcode: {item.barcode}
														</span>
													</label>
												</div>
												{item.packed ? (
													<CheckCircle className="h-5 w-5 text-green-500" />
												) : (
													<AlertCircle className="h-5 w-5 text-yellow-500" />
												)}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Packing Instructions */}
			<Card>
				<CardHeader>
					<CardTitle>Packing Instructions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0">
								<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
									1
								</span>
							</div>
							<div>
								<h4 className="font-medium">Scan Items</h4>
								<p className="text-muted-foreground text-sm">
									Use the barcode scanner to verify each item before packing
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="flex-shrink-0">
								<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
									2
								</span>
							</div>
							<div>
								<h4 className="font-medium">Verify Order</h4>
								<p className="text-muted-foreground text-sm">
									Ensure all items match the order requirements
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="flex-shrink-0">
								<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
									3
								</span>
							</div>
							<div>
								<h4 className="font-medium">Complete Packing</h4>
								<p className="text-muted-foreground text-sm">
									Click "Complete Packing" when all items are scanned and packed
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
