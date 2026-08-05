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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	BarcodeIcon,
	CheckCircle2Icon,
	KeyboardIcon,
	Loader2Icon,
	PackageIcon,
	SearchIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

export default function WarehouseScannerPage() {
	const { activeBranchId } = useBranch();
	const [barcode, setBarcode] = useState("");
	const [scannedProduct, setScannedProduct] = useState<any>(null);
	const [physicalCount, setPhysicalCount] = useState<string>("");
	const [reason, setReason] = useState<string>("Audit");
	const inputRef = useRef<HTMLInputElement>(null);

	const utils = trpc.useUtils();

	const scanMutation = (trpc.inventory as any).scanBarcode.useMutation({
		onSuccess: (data: any) => {
			setScannedProduct(data);
			setPhysicalCount(data.currentStock.toString());
			toast.success("Product found");
		},
		onError: (error: any) => {
			toast.error(error.message || "Product not found");
			setScannedProduct(null);
			setBarcode("");
			// Keep focus on input for the next scan attempt
			setTimeout(() => inputRef.current?.focus(), 100);
		},
	});

	const adjustMutation = trpc.inventory.adjustStock.useMutation({
		onSuccess: () => {
			toast.success("Inventory adjusted successfully");
			setScannedProduct(null);
			setBarcode("");
			setPhysicalCount("");
			utils.inventory.invalidate();
			// Refocus input for the next item
			setTimeout(() => inputRef.current?.focus(), 100);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to adjust inventory");
		},
	});

	const handleScanSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!barcode.trim()) return;
		scanMutation.mutate({
			barcode: barcode.trim(),
			branchId: activeBranchId === null ? undefined : Number(activeBranchId),
		});
	};

	const handleAdjustmentSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!scannedProduct || physicalCount === "") return;

		const parsedCount = Number.parseInt(physicalCount, 10);
		if (Number.isNaN(parsedCount)) {
			toast.error("Invalid physical count");
			return;
		}

		const variance = parsedCount - scannedProduct.currentStock;
		if (variance === 0 && reason === "Audit") {
			toast.success("Stock matches, no adjustment needed.");
			setScannedProduct(null);
			setBarcode("");
			setPhysicalCount("");
			setTimeout(() => inputRef.current?.focus(), 100);
			return;
		}

		adjustMutation.mutate({
			productId: scannedProduct.product.id,
			branchId:
				activeBranchId === null ? 1 : Number(activeBranchId), // Fallback to 1 if 'all' is somehow active during adjustment
			quantity: variance,
			adjustmentType: reason,
		});
	};

	// Auto-focus input on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
					<BarcodeIcon className="h-6 w-6 text-foreground" />
				</div>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Barcode Scanner</h1>
					<p className="text-muted-foreground text-sm">
						Scan items for inventory adjustments and audits.
					</p>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Scanner Input Section */}
				<Card className="border-0 shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg">Scan Barcode</CardTitle>
						<CardDescription>
							Use a physical scanner or type the SKU/Barcode manually and press
							Enter.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleScanSubmit} className="flex gap-2">
							<div className="relative flex-1">
								<SearchIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
								<Input
									ref={inputRef}
									value={barcode}
									onChange={(e) => setBarcode(e.target.value)}
									placeholder="Scan or type barcode..."
									className="h-14 pl-10 text-lg shadow-inner"
									autoFocus
									disabled={scanMutation.isPending}
								/>
								<div className="absolute top-1/2 right-3 -translate-y-1/2">
									<KeyboardIcon className="h-5 w-5 text-muted-foreground opacity-50" />
								</div>
							</div>
							<Button
								type="submit"
								disabled={!barcode.trim() || scanMutation.isPending}
								className="h-14 w-28 text-lg"
							>
								{scanMutation.isPending ? (
									<Loader2Icon className="h-5 w-5 animate-spin" />
								) : (
									"Search"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Product Details & Adjustment Section */}
				{scannedProduct ? (
					<Card className="border-0 shadow-sm ring-1 ring-border">
						<CardHeader className="pb-4">
							<div className="flex items-start justify-between">
								<div>
									<CardTitle className="text-xl">
										{scannedProduct.product.name}
									</CardTitle>
									<CardDescription className="mt-1 flex items-center gap-2">
										<PackageIcon className="h-4 w-4" />
										SKU: {scannedProduct.product.sku}
									</CardDescription>
								</div>
								<div className="text-right">
									<p className="text-muted-foreground text-sm">
										Current System Stock
									</p>
									<p className="font-bold text-3xl text-foreground">
										{scannedProduct.currentStock}
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<form
								onSubmit={handleAdjustmentSubmit}
								className="space-y-4 rounded-xl border bg-muted/50 p-4"
							>
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<label className="font-medium text-sm">
											Physical Count
										</label>
										<Input
											type="number"
											value={physicalCount}
											onChange={(e) => setPhysicalCount(e.target.value)}
											className="h-12 bg-background text-lg"
											autoFocus
											min="0"
										/>
									</div>
									<div className="space-y-2">
										<label className="font-medium text-sm">Reason</label>
										<Select value={reason} onValueChange={setReason}>
											<SelectTrigger className="h-12 bg-background">
												<SelectValue placeholder="Select Reason" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Audit">Audit Count</SelectItem>
												<SelectItem value="Damage">Damage / Spoiled</SelectItem>
												<SelectItem value="Theft">Theft / Missing</SelectItem>
												<SelectItem value="Found">Found Items</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								{/* Variance Preview */}
								{physicalCount !== "" &&
									!Number.isNaN(Number.parseInt(physicalCount)) && (
										<div className="flex items-center gap-2 text-sm">
											<span className="text-muted-foreground">Variance:</span>
											<span
												className={`font-semibold ${
													Number.parseInt(physicalCount) -
														scannedProduct.currentStock >
													0
														? "text-green-600"
														: Number.parseInt(physicalCount) -
																	scannedProduct.currentStock <
																0
															? "text-red-600"
															: "text-muted-foreground"
												}`}
											>
												{Number.parseInt(physicalCount) -
													scannedProduct.currentStock >
												0
													? "+"
													: ""}
												{Number.parseInt(physicalCount) -
													scannedProduct.currentStock}
											</span>
										</div>
									)}

								<Button
									type="submit"
									className="h-12 w-full gap-2"
									disabled={
										physicalCount === "" || adjustMutation.isPending
									}
								>
									{adjustMutation.isPending ? (
										<Loader2Icon className="h-5 w-5 animate-spin" />
									) : (
										<>
											<CheckCircle2Icon className="h-5 w-5" />
											Submit Adjustment
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				) : (
					<Card className="border border-border border-dashed bg-transparent shadow-none">
						<CardContent className="flex h-full flex-col items-center justify-center py-12 text-center text-muted-foreground">
							<BarcodeIcon className="mb-4 h-12 w-12 opacity-20" />
							<p className="text-lg">Waiting for scan...</p>
							<p className="text-sm">
								Scan a barcode to pull up product details and adjust stock.
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}


