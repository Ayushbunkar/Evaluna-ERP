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
	CameraIcon,
	CheckCircle2Icon,
	Loader2Icon,
	PackageIcon,
	PlusIcon,
	SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function MissingStockPage() {
	const trpc = useTRPC();
	const {
		data: missingStockList,
		isLoading,
		error,
		refetch,
	} = trpc.putter.getMissingStock.useQuery({});

	const createMutation = trpc.putter.createMissingStock.useMutation({
		onSuccess: () => {
			toast.success("Missing stock report created successfully!");
			refetch();
			setShowCreateModal(false);
			setProductId("");
			setExpectedQty("10");
			setFoundQty("0");
			setNotes("");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create missing stock report");
		},
	});

	const [searchQuery, setSearchQuery] = useState("");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showCameraScanner, setShowCameraScanner] = useState(false);

	const [productId, setProductId] = useState("");
	const [expectedQty, setExpectedQty] = useState("10");
	const [foundQty, setFoundQty] = useState("0");
	const [location, setLocation] = useState("Warehouse A-01");
	const [notes, setNotes] = useState("");

	const handleCreateSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!productId) {
			toast.error("Please select or type product ID");
			return;
		}
		createMutation.mutate({
			product_id: Number(productId) || 1,
			expected_qty: Number(expectedQty) || 0,
			found_qty: Number(foundQty) || 0,
			location: location || "Warehouse",
			notes: notes || "Missing stock reported during put-away audit",
		});
	};

	const filteredList = missingStockList?.filter(
		(r) =>
			r.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.id.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<AlertTriangleIcon className="h-7 w-7 text-amber-600" />
						Missing Stock Audit Queue
					</h1>
					<p className="text-muted-foreground text-sm">
						Track inventory discrepancies, expected vs actual stock counts, and
						log missing bin items.
					</p>
				</div>

				<div className="flex gap-2">
					<Button
						variant="outline"
						className="gap-2 border-amber-600 text-amber-700 hover:bg-amber-50"
						onClick={() => setShowCameraScanner(true)}
					>
						<CameraIcon className="h-4 w-4" /> Camera Scan
					</Button>
					<Button
						className="gap-2 bg-amber-600 text-white shadow-sm hover:bg-amber-700"
						onClick={() => setShowCreateModal(true)}
					>
						<PlusIcon className="h-4 w-4" /> + Report Missing Stock
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-amber-700 text-sm dark:text-amber-400">
										Total Missing Items
									</p>
									<p className="font-bold text-3xl text-amber-800 dark:text-amber-300">
										{missingStockList?.length ?? 0}
									</p>
								</div>
								<AlertTriangleIcon className="h-8 w-8 text-amber-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-red-700 text-sm dark:text-red-400">
										Critical Discrepancies
									</p>
									<p className="font-bold text-3xl text-red-800 dark:text-red-300">
										{missingStockList?.filter((i) => i.quantity_needed > 5)
											.length ?? 0}
									</p>
								</div>
								<PackageIcon className="h-8 w-8 text-red-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-green-700 text-sm dark:text-green-400">
										Audit Status
									</p>
									<p className="font-bold text-green-800 text-xl dark:text-green-300">
										Monitored
									</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table Card */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<AlertTriangleIcon className="h-5 w-5 text-amber-600" />
							Missing Stock Audit Records
						</CardTitle>
						<CardDescription>
							Live database list of inventory discrepancies requiring putaway
							resolution
						</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search product, SKU or ID..."
							className="w-full rounded-md border border-input bg-background py-1.5 pr-3 pl-9 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-amber-600" />{" "}
							Loading missing stock records...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading missing stock data"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-green-500 opacity-30" />
							<p>No missing stock records logged.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Record ID</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead>SKU</TableHead>
										<TableHead>Qty Needed</TableHead>
										<TableHead>Location Bin</TableHead>
										<TableHead>Reason</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((item) => (
										<TableRow key={item.id} className="hover:bg-muted/50">
											<TableCell className="font-mono font-semibold text-xs">
												{item.id}
											</TableCell>
											<TableCell className="font-bold text-sm">
												{item.product}
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-xs">
												{item.sku}
											</TableCell>
											<TableCell className="font-bold text-red-600 text-sm dark:text-red-400">
												{item.quantity_needed} units missing
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{item.location}
											</TableCell>
											<TableCell className="font-medium text-amber-700 text-xs dark:text-amber-400">
												{item.reason}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{item.date || "Today"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Create Missing Stock Modal */}
			{showCreateModal && (
				<Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
					<DialogContent className="sm:max-w-[480px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<AlertTriangleIcon className="h-5 w-5 text-amber-600" />
								Report Missing Stock Discrepancy
							</DialogTitle>
							<DialogDescription>
								Log an inventory discrepancy found during warehouse putaway
								audits.
							</DialogDescription>
						</DialogHeader>

						<form
							onSubmit={handleCreateSubmit}
							className="space-y-4 py-2 text-sm"
						>
							<div className="space-y-1">
								<label className="font-semibold text-xs">Product ID</label>
								<input
									type="number"
									required
									placeholder="e.g. 1"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={productId}
									onChange={(e) => setProductId(e.target.value)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="font-semibold text-xs">Expected Qty</label>
									<input
										type="number"
										required
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={expectedQty}
										onChange={(e) => setExpectedQty(e.target.value)}
									/>
								</div>

								<div className="space-y-1">
									<label className="font-semibold text-xs">
										Actual Found Qty
									</label>
									<input
										type="number"
										required
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={foundQty}
										onChange={(e) => setFoundQty(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-1">
								<label className="font-semibold text-xs">Location / Bin</label>
								<input
									type="text"
									placeholder="e.g. Bin A-12"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={location}
									onChange={(e) => setLocation(e.target.value)}
								/>
							</div>

							<div className="space-y-1">
								<label className="font-semibold text-xs">
									Audit Notes / Reason
								</label>
								<textarea
									rows={2}
									placeholder="Reason for missing stock..."
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>

							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="ghost"
									onClick={() => setShowCreateModal(false)}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={createMutation.isPending}
									className="bg-amber-600 text-white hover:bg-amber-700"
								>
									{createMutation.isPending && (
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									)}
									Save Missing Stock Record
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}

			{/* Camera Barcode Scanner Modal */}
			<CameraBarcodeScannerModal
				open={showCameraScanner}
				onOpenChange={setShowCameraScanner}
				onScan={(code) => setSearchQuery(code)}
				title="Missing Stock Camera Barcode Scanner"
				description="Scan product barcode to search missing stock queue."
			/>
		</PageTransition>
	);
}
