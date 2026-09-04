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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	CameraIcon,
	CheckCircle2Icon,
	DownloadIcon,
	Loader2Icon,
	SearchIcon,
	TruckIcon,
} from "lucide-react";
import { useState } from "react";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ReceivingPage() {
	const trpc = useTRPC();
	const {
		data: receivingList,
		isLoading,
		error,
	} = trpc.putter.getReceiving.useQuery({});

	const [searchQuery, setSearchQuery] = useState("");
	const [showCameraScanner, setShowCameraScanner] = useState(false);

	const filteredList = receivingList?.filter(
		(r) =>
			r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.po_ref.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<DownloadIcon className="h-7 w-7 text-blue-600" />
						Goods Receiving & Dock Verification
					</h1>
					<p className="text-muted-foreground text-sm">
						Incoming Goods Received Notes (GRN), purchase shipments, and
						unloading verification.
					</p>
				</div>

				<Button
					variant="outline"
					className="gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
					onClick={() => setShowCameraScanner(true)}
				>
					<CameraIcon className="h-4 w-4" /> Camera Scan GRN
				</Button>
			</div>

			{/* KPI Summary */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Total GRN Receipts
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{receivingList?.length ?? 0}
									</p>
								</div>
								<TruckIcon className="h-8 w-8 text-blue-500" />
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
										Dock Accuracy
									</p>
									<p className="font-bold text-3xl text-green-800 dark:text-green-300">
										100%
									</p>
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
									<p className="font-medium text-purple-700 text-sm dark:text-purple-400">
										Unloading Bay
									</p>
									<p className="font-bold text-purple-800 text-xl dark:text-purple-300">
										Ready
									</p>
								</div>
								<DownloadIcon className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<DownloadIcon className="h-5 w-5 text-blue-600" />
							Incoming Goods Shipments
						</CardTitle>
						<CardDescription>
							GRN receipts awaiting put-away assignment
						</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search GRN, supplier, PO..."
							className="w-full rounded-md border border-input bg-background py-1.5 pr-3 pl-9 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" />{" "}
							Loading receipts...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading receiving records"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-green-500 opacity-30" />
							<p>No incoming goods receiving records found.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>GRN / Ref</TableHead>
										<TableHead>Supplier Name</TableHead>
										<TableHead>Product Items</TableHead>
										<TableHead>Total Quantity</TableHead>
										<TableHead>PO Reference</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((item) => (
										<TableRow key={item.id} className="hover:bg-muted/50">
											<TableCell className="font-bold font-mono text-blue-600 text-xs dark:text-blue-400">
												{item.id}
											</TableCell>
											<TableCell className="font-semibold text-sm">
												{item.supplier}
											</TableCell>
											<TableCell className="text-sm">
												{item.products} products
											</TableCell>
											<TableCell className="font-bold text-blue-600 text-sm dark:text-blue-400">
												{item.qty} units
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-xs">
												{item.po_ref}
											</TableCell>
											<TableCell>
												<span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 text-xs capitalize dark:bg-blue-900/30 dark:text-blue-400">
													{item.status}
												</span>
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

			{/* Camera Barcode Scanner Modal */}
			<CameraBarcodeScannerModal
				open={showCameraScanner}
				onOpenChange={setShowCameraScanner}
				onScan={(code) => setSearchQuery(code)}
				title="Receiving GRN Barcode Scanner"
				description="Scan incoming delivery note barcode."
			/>
		</PageTransition>
	);
}
