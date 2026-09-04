"use client";

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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertTriangleIcon,
	BarcodeIcon,
	CameraIcon,
	CheckCircle2Icon,
	Loader2Icon,
	MapPinIcon,
	PackageIcon,
	PlaySquareIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickerActivePage() {
	const trpc = useTRPC();
	const {
		data: currentTaskData,
		isLoading,
		error,
		refetch,
	} = trpc.picker.getCurrentTask.useQuery({});

	const scanMutation = trpc.picker.scanItem.useMutation({
		onSuccess: () => refetch(),
	});

	const confirmMutation = trpc.picker.manualConfirm.useMutation({
		onSuccess: () => {
			refetch();
			setConfirmItem(null);
			setConfirmQty(1);
		},
	});

	const pnaMutation = trpc.picker.reportPNA.useMutation({
		onSuccess: () => refetch(),
	});

	const [confirmItem, setConfirmItem] = useState<any | null>(null);
	const [confirmQty, setConfirmQty] = useState<number>(1);
	const [scannedBarcode, setScannedBarcode] = useState<string>("");
	const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);

	const task = currentTaskData?.task;
	const items = currentTaskData?.items ?? [];

	const handleScanCode = (code: string) => {
		const match = items.find((i) => i.sku === code || i.id.toString() === code);
		if (match) {
			scanMutation.mutate({ item_id: match.id });
			toast.success(`Scanned and verified ${match.product}!`);
		} else {
			toast.error(`No item found in this pick list matching barcode "${code}"`);
		}
	};

	const handleScanBarcodeSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!scannedBarcode.trim()) return;
		handleScanCode(scannedBarcode.trim());
		setScannedBarcode("");
	};

	const handleConfirmSubmit = () => {
		if (!confirmItem) return;
		confirmMutation.mutate({
			item_id: confirmItem.id,
			quantity: Number(confirmQty) || 1,
		});
	};

	const pickedCount = task?.picked_items ?? 0;
	const totalCount = task?.total_items ?? 0;
	const pct = totalCount > 0 ? Math.round((pickedCount / totalCount) * 100) : 0;

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<PlaySquareIcon className="h-7 w-7 text-blue-600" />
						Active Pick Task Execution
					</h1>
					<p className="text-muted-foreground text-sm">
						Scan barcodes using phone camera or barcode gun, confirm item
						quantities, report missing stock.
					</p>
				</div>

				{task && (
					<Button
						className="gap-2 bg-blue-600 text-white shadow-md hover:bg-blue-700"
						onClick={() => setShowCameraScanner(true)}
					>
						<CameraIcon className="h-4 w-4" /> Scan Barcode with Phone Camera
					</Button>
				)}
			</div>

			{isLoading ? (
				<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
					<Loader2Icon className="h-6 w-6 animate-spin text-blue-600" /> Loading
					active pick task...
				</div>
			) : error ? (
				<div className="flex h-40 items-center justify-center text-destructive">
					{error.message || "Error loading active task"}
				</div>
			) : !task ? (
				<Card className="border-border/50 py-12 text-center shadow-sm">
					<CardContent className="flex flex-col items-center gap-3">
						<PackageIcon className="h-12 w-12 text-muted-foreground opacity-40" />
						<h3 className="font-bold text-lg">No Active Task in Progress</h3>
						<p className="max-w-sm text-muted-foreground text-sm">
							You currently have no picking task assigned to you. Go to Pending
							Picks to start one.
						</p>
						<Button
							className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
							onClick={() => (window.location.href = "/picker/pending")}
						>
							View Pending Picks Queue
						</Button>
					</CardContent>
				</Card>
			) : (
				<>
					{/* Progress & Task Card */}
					<Card className="border-blue-200 bg-blue-50/50 shadow-sm dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="space-y-4 p-6">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<h2 className="flex items-center gap-2 font-bold text-blue-900 text-xl dark:text-blue-200">
										<PackageIcon className="h-6 w-6 text-blue-600" />
										Task {task.id} (Order: {task.order_id})
									</h2>
									<p className="mt-1 text-blue-700 text-xs dark:text-blue-400">
										Location Area: {task.area} | Total Items to Pick:{" "}
										{task.total_items}
									</p>
								</div>

								<div className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-800">
									<div className="text-right">
										<p className="text-muted-foreground text-xs">
											Pick Progress
										</p>
										<p className="font-bold text-blue-600 text-xl dark:text-blue-400">
											{task.picked_items} / {task.total_items} ({pct}%)
										</p>
									</div>
								</div>
							</div>

							{/* Progress Bar */}
							<div className="h-3 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
								<div
									className="h-full bg-blue-600 transition-all duration-300"
									style={{ width: `${pct}%` }}
								/>
							</div>

							{/* Barcode Scanner Input + Camera Scanner Button */}
							<form
								onSubmit={handleScanBarcodeSubmit}
								className="flex gap-2 pt-2"
							>
								<div className="relative flex-1">
									<BarcodeIcon className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
									<input
										type="text"
										placeholder="Scan SKU barcode or type item barcode..."
										className="w-full rounded-md border border-input bg-background py-2 pr-3 pl-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										value={scannedBarcode}
										onChange={(e) => setScannedBarcode(e.target.value)}
									/>
								</div>
								<Button
									type="submit"
									className="bg-blue-600 text-white hover:bg-blue-700"
								>
									Scan Item
								</Button>
								<Button
									type="button"
									variant="outline"
									className="gap-1.5 border-blue-600 text-blue-600 hover:bg-blue-50"
									onClick={() => setShowCameraScanner(true)}
								>
									<CameraIcon className="h-4 w-4" /> Camera Scanner
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Pick List Items Table */}
					<Card className="border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<MapPinIcon className="h-5 w-5 text-blue-600" />
								Required Pick Items List
							</CardTitle>
							<CardDescription>
								Locate items in warehouse bins and verify quantities
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Location</TableHead>
											<TableHead>Product Name</TableHead>
											<TableHead>SKU / Barcode</TableHead>
											<TableHead>Batch</TableHead>
											<TableHead>Picked / Required</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{items.map((item) => (
											<TableRow key={item.id} className="hover:bg-muted/50">
												<TableCell className="font-semibold text-blue-600 text-sm dark:text-blue-400">
													{item.location}
												</TableCell>
												<TableCell className="font-bold text-sm">
													{item.product}
												</TableCell>
												<TableCell className="font-mono text-muted-foreground text-xs">
													{item.sku}
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{item.batch}
												</TableCell>
												<TableCell className="font-semibold text-sm">
													<span
														className={
															item.qty_picked >= item.qty_required
																? "font-bold text-green-600"
																: ""
														}
													>
														{item.qty_picked} / {item.qty_required}
													</span>
												</TableCell>
												<TableCell>
													<span
														className={`rounded-full px-2 py-0.5 font-medium text-xs ${
															item.status === "picked"
																? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
																: item.status === "missing"
																	? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
																	: item.status === "partial"
																		? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
																		: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
														}`}
													>
														{item.status || "pending"}
													</span>
												</TableCell>
												<TableCell className="flex items-center justify-end gap-2 text-right">
													<Button
														size="sm"
														variant="outline"
														className="h-8 gap-1"
														onClick={() => {
															setConfirmItem(item);
															setConfirmQty(item.qty_required);
														}}
													>
														<CheckCircle2Icon className="h-3.5 w-3.5 text-green-600" />{" "}
														Confirm Qty
													</Button>
													{item.status !== "missing" && (
														<Button
															size="sm"
															variant="outline"
															className="h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50"
															onClick={() =>
																pnaMutation.mutate({ item_id: item.id })
															}
														>
															<AlertTriangleIcon className="h-3.5 w-3.5 text-red-500" />{" "}
															Missing
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</>
			)}

			{/* Manual Confirm Quantity Modal */}
			{confirmItem && (
				<Dialog
					open={!!confirmItem}
					onOpenChange={(open) => !open && setConfirmItem(null)}
				>
					<DialogContent className="sm:max-w-[420px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<CheckCircle2Icon className="h-5 w-5 text-green-600" />
								Confirm Picked Quantity
							</DialogTitle>
							<DialogDescription>
								Confirm picked count for {confirmItem.product}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2 text-sm">
							<p>
								<strong>SKU:</strong> {confirmItem.sku}
							</p>
							<p>
								<strong>Required Qty:</strong> {confirmItem.qty_required}
							</p>

							<div className="space-y-1">
								<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
									Actual Quantity Picked:
								</label>
								<input
									type="number"
									min="0"
									max={confirmItem.qty_required}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={confirmQty}
									onChange={(e) => setConfirmQty(Number(e.target.value))}
								/>
							</div>
						</div>

						<DialogFooter>
							<Button variant="ghost" onClick={() => setConfirmItem(null)}>
								Cancel
							</Button>
							<Button
								disabled={confirmMutation.isPending}
								onClick={handleConfirmSubmit}
								className="bg-green-600 text-white hover:bg-green-700"
							>
								{confirmMutation.isPending && (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								)}
								Save Pick Count
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* Camera Barcode Scanner Modal */}
			<CameraBarcodeScannerModal
				open={showCameraScanner}
				onOpenChange={setShowCameraScanner}
				onScan={handleScanCode}
				title="Picker Phone Camera Barcode Scanner"
				description="Point your phone camera at the item's barcode to scan and verify picking instantly."
			/>
		</PageTransition>
	);
}
