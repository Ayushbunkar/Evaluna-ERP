"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	RotateCcwIcon,
	CheckCircle2Icon,
	Loader2Icon,
	SearchIcon,
	CameraIcon,
} from "lucide-react";
import { Button } from "@evaluna/ui/components/button";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";

export default function SaleReturnPage() {
	const trpc = useTRPC();
	const {
		data: returnsList,
		isLoading,
		error,
	} = trpc.putter.getSaleReturns.useQuery({});

	const [searchQuery, setSearchQuery] = useState("");
	const [showCameraScanner, setShowCameraScanner] = useState(false);

	const filteredList = returnsList?.filter(
		(r) =>
			r.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.sku.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
						<RotateCcwIcon className="h-7 w-7 text-blue-600" />
						Customer Sales Return Processing
					</h1>
					<p className="text-muted-foreground text-sm">
						Verify returned customer parcels, restock sellable items, or route damaged items to quarantine.
					</p>
				</div>

				<Button
					variant="outline"
					className="gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
					onClick={() => setShowCameraScanner(true)}
				>
					<CameraIcon className="h-4 w-4" /> Camera Scan Return Tag
				</Button>
			</div>

			{/* KPI Summary */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Customer Returns</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{returnsList?.length ?? 0}</p>
								</div>
								<RotateCcwIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Restocked Items</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{returnsList?.length ?? 0}</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-purple-700 dark:text-purple-400">Restock Rate</p>
									<p className="text-xl font-bold text-purple-800 dark:text-purple-300">100%</p>
								</div>
								<RotateCcwIcon className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<RotateCcwIcon className="h-5 w-5 text-blue-600" />
							Sales Return Restock Queue
						</CardTitle>
						<CardDescription>Returned customer orders requiring warehouse bin re-shelving</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search return ID, product..."
							className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" /> Loading returns...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading sales returns"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 opacity-30 text-green-500" />
							<p>No customer sales returns pending restock.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Return ID</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead>SKU</TableHead>
										<TableHead>Qty Returned</TableHead>
										<TableHead>Reason</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Return Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((item) => (
										<TableRow key={item.id} className="hover:bg-muted/50">
											<TableCell className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
												{item.id}
											</TableCell>
											<TableCell className="font-semibold text-sm">{item.product}</TableCell>
											<TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
											<TableCell className="font-bold text-sm text-blue-600 dark:text-blue-400">
												{item.qty} units
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">{item.reason}</TableCell>
											<TableCell>
												<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
													{item.status}
												</span>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">{item.date || "Today"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Camera Barcode Scanner Modal */}
			<CameraBarcodeScannerModal
				open={showCameraScanner}
				onOpenChange={setShowCameraScanner}
				onScan={(code) => setSearchQuery(code)}
				title="Return Tag Camera Scanner"
				description="Scan customer parcel return tag barcode."
			/>
		</PageTransition>
	);
}
