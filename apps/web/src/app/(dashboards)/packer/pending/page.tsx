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
import JsBarcode from "jsbarcode";
import {
	BoxIcon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	PackageIcon,
	PrinterIcon,
	SearchIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PackerPendingPage() {
	const trpc = useTRPC();
	const {
		data: pendingList,
		isLoading,
		error,
		refetch,
	} = trpc.packer.getPendingToPack.useQuery();

	const [printPackage, setPrintPackage] = useState<{
		number: string;
		orderRef: string;
		customerName?: string;
		customerPhone?: string;
		customerAddress?: string;
		driverName?: string;
		routeName?: string;
		vehiclePlate?: string;
		weight?: string;
		dimensions?: string;
		items?: Array<{ productName: string; sku: string; quantity: number }>;
	} | null>(null);
	const printSvgRef = useRef<SVGSVGElement | null>(null);

	const packMutation = trpc.packer.packOrder.useMutation({
		onSuccess: (data) => {
			refetch();
			if (selectedPickList) {
				setPrintPackage({
					number: data.package_number,
					orderRef: selectedPickList.order_ref,
					customerName: selectedPickList.customerName,
					customerPhone: selectedPickList.customerPhone,
					customerAddress: selectedPickList.customerAddress,
					driverName: selectedPickList.driverName,
					routeName: selectedPickList.routeName,
					vehiclePlate: selectedPickList.vehiclePlate,
					weight: weight,
					dimensions: dimensions,
					items: selectedPickList.items,
				});
			}
			setSelectedPickList(null);
			setWeight("1.5");
			setDimensions("30x20x10 cm");

			// Trigger print window after label renders
			setTimeout(() => {
				window.print();
			}, 400);
		},
	});

	useEffect(() => {
		if (printSvgRef.current && printPackage?.number) {
			try {
				JsBarcode(printSvgRef.current, printPackage.number, {
					format: "CODE128",
					width: 2,
					height: 50,
					displayValue: true,
					fontSize: 12,
					margin: 5,
				});
			} catch (e) {
				console.error("Barcode print error:", e);
			}
		}
	}, [printPackage]);

	const [selectedPickList, setSelectedPickList] = useState<any | null>(null);
	const [weight, setWeight] = useState("1.5");
	const [dimensions, setDimensions] = useState("30x20x10 cm");
	const [searchQuery, setSearchQuery] = useState("");

	const handlePackSubmit = () => {
		if (!selectedPickList) return;
		packMutation.mutate({
			pick_list_id: selectedPickList.pick_list_id,
			order_id: selectedPickList.id
				? Number.parseInt(selectedPickList.id.replace(/\D/g, "") || "1", 10)
				: 1,
			weight: Number.parseFloat(weight) || 1.0,
			dimensions: dimensions || "Standard Box",
		});
	};

	const filteredList = pendingList?.filter(
		(pl) =>
			pl.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			pl.order_ref.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Printable A4-Optimized Unified Packing Slip & Shipping Label */}
			<div className="hidden print:fixed print:inset-0 print:z-[9999] print:block print:bg-white print:p-8">
				{printPackage && (
					<div className="mx-auto max-w-[650px] border-2 border-dashed border-gray-400 p-6 font-sans text-black">
						{/* Header */}
						<div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
							<div>
								<h1 className="font-bold text-2xl tracking-tight">EVALUNA LOGISTICS</h1>
								<p className="text-xs text-gray-500">Fast, Verified & Reliable Warehouse Delivery</p>
							</div>
							<div className="text-right">
								<p className="font-bold text-sm bg-black text-white px-2 py-1 inline-block">PACKING SLIP</p>
								<p className="text-xs font-mono mt-1">Ref: {printPackage.orderRef}</p>
							</div>
						</div>

						{/* Grid for details */}
						<div className="grid grid-cols-2 gap-4 text-xs mb-6">
							<div className="border border-gray-300 p-3 rounded">
								<p className="font-bold border-b border-gray-200 pb-1 mb-1 text-gray-700">🚚 SHIP TO:</p>
								<p className="font-bold text-sm">{printPackage.customerName}</p>
								<p className="mt-1">📞 {printPackage.customerPhone}</p>
								<p className="mt-1 text-gray-600 leading-tight">📍 {printPackage.customerAddress}</p>
							</div>

							<div className="border border-gray-300 p-3 rounded">
								<p className="font-bold border-b border-gray-200 pb-1 mb-1 text-gray-700">📦 PARCEL SPECS:</p>
								<p><strong>Pkg No:</strong> {printPackage.number}</p>
								<p className="mt-1"><strong>Weight:</strong> {printPackage.weight} kg</p>
								<p className="mt-1"><strong>Box Size:</strong> {printPackage.dimensions}</p>
								<p className="mt-1"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
							</div>
						</div>

						{/* Itemized list */}
						<div className="mb-6">
							<p className="font-bold text-xs text-gray-700 mb-2 uppercase tracking-wide">📋 Itemized Product Checklist</p>
							<table className="w-full border-collapse text-xs">
								<thead>
									<tr className="bg-gray-100 border-b border-gray-300">
										<th className="border border-gray-300 px-3 py-1.5 text-left">Product Name</th>
										<th className="border border-gray-300 px-3 py-1.5 text-left">SKU</th>
										<th className="border border-gray-300 px-3 py-1.5 text-center w-20">Qty Ordered</th>
										<th className="border border-gray-300 px-3 py-1.5 text-center w-20">Status</th>
									</tr>
								</thead>
								<tbody>
									{printPackage.items && printPackage.items.length > 0 ? (
										printPackage.items.map((it, idx) => (
											<tr key={idx} className="border-b border-gray-200">
												<td className="border border-gray-300 px-3 py-1.5 font-bold">{it.productName}</td>
												<td className="border border-gray-300 px-3 py-1.5 font-mono">{it.sku}</td>
												<td className="border border-gray-300 px-3 py-1.5 text-center font-bold">{it.quantity}</td>
												<td className="border border-gray-300 px-3 py-1.5 text-center text-green-600 font-bold">✓ Packed</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={4} className="border border-gray-300 px-3 py-4 text-center text-gray-500">No items registered.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>

						{/* Barcode Shipment Sticker */}
						<div className="flex flex-col items-center justify-center border-t-2 border-black pt-4">
							<p className="font-bold text-[10px] tracking-widest text-gray-500 mb-1">SCAN TO CONFIRM LOADING / DELIVERY</p>
							<svg ref={printSvgRef} className="my-1" />
							<p className="text-[9px] text-gray-400 mt-1">PACKED & VERIFIED BY EVALUNA LOGISTICS</p>
						</div>
					</div>
				)}
			</div>

			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
					<PackageIcon className="h-7 w-7 text-blue-600" />
					Pending Packing Queue
				</h1>
				<p className="text-muted-foreground text-sm">
					Picklists that have completed picking and are ready for box packaging,
					weight recording, and parcel labeling.
				</p>
			</div>

			{/* Stats */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Total Pending to Pack
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{pendingList?.length ?? 0}
									</p>
								</div>
								<ClockIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Picking Verified
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{pendingList?.length ?? 0}
									</p>
								</div>
								<PackageIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-green-700 text-sm dark:text-green-400">
										Station Status
									</p>
									<p className="font-bold text-green-800 text-xl dark:text-green-300">
										Ready
									</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Table Card */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<BoxIcon className="h-5 w-5 text-blue-600" />
							Pending Pack Queue
						</CardTitle>
						<CardDescription>
							Orders waiting to be packed into shipping boxes
						</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search picklist or order ref..."
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
							Loading queue...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading pending queue"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-green-500 opacity-30" />
							<p>No orders currently waiting for packing.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Picklist ID</TableHead>
										<TableHead>Order Ref</TableHead>
										<TableHead>Assigned Route</TableHead>
										<TableHead>Driver & Truck</TableHead>
										<TableHead>Picking Completion Time</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((pl) => (
										<TableRow key={pl.id} className="hover:bg-muted/50">
											<TableCell className="font-mono font-semibold text-xs">
												{pl.id}
											</TableCell>
											<TableCell className="font-semibold text-sm">
												{pl.order_ref}
											</TableCell>
											<TableCell className="font-semibold text-xs text-blue-600 dark:text-blue-400">
												📍 {pl.routeName}
											</TableCell>
											<TableCell className="text-xs">
												<div className="font-medium text-gray-800 dark:text-gray-200">👤 {pl.driverName}</div>
												<div className="text-muted-foreground text-[10px] mt-0.5 font-mono">🚛 {pl.vehiclePlate}</div>
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{pl.completed_at}
											</TableCell>
											<TableCell>
												<span className="rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
													Ready to Pack
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													className="h-8 bg-blue-600 text-white hover:bg-blue-700"
													onClick={() => setSelectedPickList(pl)}
												>
													<BoxIcon className="mr-1 h-3.5 w-3.5" /> Pack Parcel
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Pack Order Modal */}
			{selectedPickList && (
				<Dialog
					open={!!selectedPickList}
					onOpenChange={(open) => !open && setSelectedPickList(null)}
				>
					<DialogContent className="sm:max-w-[480px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<BoxIcon className="h-5 w-5 text-blue-600" />
								Pack Order {selectedPickList.order_ref}
							</DialogTitle>
							<DialogDescription>
								Record parcel weight and dimensions to create package & generate
								shipping barcode sticker.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2 text-sm">
							<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900 text-xs dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
								<p>
									<strong>Picklist:</strong> {selectedPickList.id}
								</p>
								<p>
									<strong>Order Reference:</strong> {selectedPickList.order_ref}
								</p>
								<p>
									<strong>Status:</strong> Ready for Packaging
								</p>
								<p className="mt-1.5 pt-1.5 border-t border-blue-200/30">
									<strong>🚚 Load on Truck:</strong> {selectedPickList.vehiclePlate} ({selectedPickList.driverName})
								</p>
								<p className="mt-0.5">
									<strong>📍 Route:</strong> {selectedPickList.routeName}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										Parcel Weight (kg)
									</label>
									<input
										type="number"
										step="0.1"
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={weight}
										onChange={(e) => setWeight(e.target.value)}
									/>
								</div>

								<div className="space-y-1">
									<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										Box Dimensions
									</label>
									<input
										type="text"
										placeholder="e.g. 30x20x10 cm"
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={dimensions}
										onChange={(e) => setDimensions(e.target.value)}
									/>
								</div>
							</div>
						</div>

						<DialogFooter className="flex justify-end gap-2">
							<Button variant="ghost" onClick={() => setSelectedPickList(null)}>
								Cancel
							</Button>
							<Button
								disabled={packMutation.isPending}
								onClick={handlePackSubmit}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								{packMutation.isPending && (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								)}
								Complete Packing & Save Package
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* Post-Print Handover & Completion Confirmation Modal */}
			{printPackage && (
				<Dialog
					open={!!printPackage}
					onOpenChange={(open) => !open && setPrintPackage(null)}
				>
					<DialogContent className="sm:max-w-[460px] border-emerald-200">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-emerald-700 text-lg">
								<CheckCircle2Icon className="h-6 w-6 text-emerald-600" />
								Packing & Label Printed Successfully!
							</DialogTitle>
							<DialogDescription className="text-xs text-muted-foreground">
								Package <strong>{printPackage.number}</strong> has been packed and printed. Confirm handover to complete dispatch.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2 text-sm">
							<div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 space-y-2 text-xs">
								<div className="flex justify-between items-center border-b border-emerald-200/50 pb-2">
									<span className="font-semibold text-gray-700">Package No:</span>
									<span className="font-mono font-bold text-emerald-800 text-sm">{printPackage.number}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Order Ref:</span>
									<span className="font-semibold text-gray-900">{printPackage.orderRef}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Customer:</span>
									<span className="font-medium text-gray-900">{printPackage.customerName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Assigned Driver:</span>
									<span className="font-semibold text-blue-700">👤 {printPackage.driverName || "Assigned Driver"}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Truck / Vehicle:</span>
									<span className="font-mono font-medium text-gray-800">🚛 {printPackage.vehiclePlate || "N/A"}</span>
								</div>
								<div className="flex justify-between border-t border-emerald-200/50 pt-1.5 mt-1">
									<span className="text-gray-500">Parcel Specs:</span>
									<span className="font-medium text-gray-800">{printPackage.weight} kg • {printPackage.dimensions}</span>
								</div>
							</div>

							<div className="flex items-center justify-between pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="text-xs border-gray-300 shadow-sm"
									onClick={() => window.print()}
								>
									<PrinterIcon className="mr-1.5 h-3.5 w-3.5 text-gray-600" />
									Re-Print Packing Slip
								</Button>

								<Button
									type="button"
									size="sm"
									className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-sm text-xs"
									onClick={() => {
										toast.success(`Package ${printPackage.number} confirmed & handed over to driver!`);
										setPrintPackage(null);
										refetch();
									}}
								>
									<CheckCircle2Icon className="mr-1.5 h-4 w-4" />
									Confirm Transfer & Complete
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</PageTransition>
	);
}
