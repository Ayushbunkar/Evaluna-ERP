"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { ArrowRightIcon, BoxIcon, MoveIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function WarehouseMovementPage() {
	const utils = trpc.useUtils();

	const [sourceLocationId, setSourceLocationId] = useState<string>("");
	const [destLocationId, setDestLocationId] = useState<string>("");
	const [selectedStockId, setSelectedStockId] = useState<string>("");
	const [quantity, setQuantity] = useState<number>(0);

	// Fetch all locations to populate the dropdowns
	const { data: locations, isLoading: loadingLocs } =
		trpc.warehouse.getLocations.useQuery({});

	// Fetch stock present in the selected source location
	const { data: sourceStock, isLoading: loadingStock } =
		trpc.warehouse.getStockByLocation.useQuery(
			{ locationId: Number(sourceLocationId) },
			{ enabled: !!sourceLocationId },
		);

	// Find the selected stock details for max quantity validation
	const selectedStock = sourceStock?.find(
		(s) => s.id === Number(selectedStockId),
	);

	const moveStock = trpc.warehouse.moveStock.useMutation({
		onSuccess: () => {
			toast.success("Stock moved successfully.");
			utils.warehouse.getStockByLocation.invalidate();
			utils.warehouse.getLocations.invalidate();

			// Reset form
			setSourceLocationId("");
			setDestLocationId("");
			setSelectedStockId("");
			setQuantity(0);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleMove = (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!sourceLocationId ||
			!destLocationId ||
			!selectedStockId ||
			quantity <= 0
		) {
			toast.error("Please fill all required fields correctly.");
			return;
		}

		if (sourceLocationId === destLocationId) {
			toast.error("Source and destination locations must be different.");
			return;
		}

		if (selectedStock && quantity > selectedStock.quantity) {
			toast.error("Quantity exceeds available stock in location.");
			return;
		}

		moveStock.mutate({
			batch_stock_id: Number(selectedStockId),
			from_location_id: Number(sourceLocationId),
			to_location_id: Number(destLocationId),
			quantity: Number(quantity),
		});
	};

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
					<MoveIcon className="h-6 w-6 text-foreground" />
				</div>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Warehouse Movement
					</h1>
					<p className="text-muted-foreground text-sm">
						Track inventory movement across warehouse locations.
					</p>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Movement Form */}
				<Card>
					<CardHeader>
						<CardTitle>Execute Movement</CardTitle>
						<CardDescription>
							Move stock from one physical bin to another.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleMove} className="space-y-6">
							<div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
								<div className="space-y-2">
									<Label>Source Location</Label>
									<Select
										value={sourceLocationId}
										onValueChange={(val) => {
											setSourceLocationId(val);
											setSelectedStockId("");
											setQuantity(0);
										}}
									>
										<SelectTrigger disabled={loadingLocs}>
											<SelectValue placeholder="Select origin bin..." />
										</SelectTrigger>
										<SelectContent>
											{locations?.map((loc) => (
												<SelectItem key={loc.id} value={loc.id.toString()}>
													{loc.name} ({loc.location_type})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{sourceLocationId && (
									<div className="space-y-2">
										<Label>Select Item to Move</Label>
										<Select
											value={selectedStockId}
											onValueChange={setSelectedStockId}
										>
											<SelectTrigger disabled={loadingStock}>
												<SelectValue placeholder="Select item..." />
											</SelectTrigger>
											<SelectContent>
												{sourceStock?.length === 0 ? (
													<SelectItem value="none" disabled>
														No stock in this location
													</SelectItem>
												) : (
													sourceStock?.map((stock) => (
														<SelectItem
															key={stock.id}
															value={stock.id.toString()}
														>
															{stock.product_name} (Batch: {stock.batch_number})
															- {stock.quantity} available
														</SelectItem>
													))
												)}
											</SelectContent>
										</Select>
									</div>
								)}
							</div>

							<div className="flex justify-center">
								<ArrowRightIcon className="h-6 w-6 rotate-90 text-zinc-400 md:rotate-0" />
							</div>

							<div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
								<div className="space-y-2">
									<Label>Destination Location</Label>
									<Select
										value={destLocationId}
										onValueChange={setDestLocationId}
									>
										<SelectTrigger disabled={loadingLocs}>
											<SelectValue placeholder="Select destination bin..." />
										</SelectTrigger>
										<SelectContent>
											{locations?.map((loc) => (
												<SelectItem key={loc.id} value={loc.id.toString()}>
													{loc.name} ({loc.location_type})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label>Quantity to Move</Label>
									<div className="flex items-center gap-2">
										<Input
											type="number"
											min={1}
											max={selectedStock?.quantity || 9999}
											value={quantity || ""}
											onChange={(e) => setQuantity(Number(e.target.value))}
											disabled={!selectedStockId}
											className="w-32"
										/>
										<span className="text-muted-foreground text-sm">
											/ {selectedStock?.quantity || 0} max
										</span>
										{selectedStock && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => setQuantity(selectedStock.quantity)}
											>
												Max
											</Button>
										)}
									</div>
								</div>
							</div>

							<Button
								type="submit"
								className="w-full gap-2"
								disabled={moveStock.isPending}
							>
								<BoxIcon className="h-4 w-4" />
								Confirm Movement
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Quick Info / Recent Moves */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Movement Guidelines</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 text-muted-foreground text-sm">
							<p>
								1. Select the <strong>Source Location</strong> where the item
								currently resides.
							</p>
							<p>
								2. Choose the specific batch of items you wish to move. Only
								items physically recorded in the selected bin will appear.
							</p>
							<p>
								3. Select the <strong>Destination Location</strong>. Ensure the
								destination has enough physical capacity.
							</p>
							<p>
								4. Confirm the quantity. The system will update the stock ledger
								to reflect this internal transfer.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
