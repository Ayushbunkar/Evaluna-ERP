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
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PackerPendingPage() {
	const t = useTranslations("packer");
	const tCommon = useTranslations("common");
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
					<div className="mx-auto max-w-[650px] border-2 border-gray-400 border-dashed p-6 font-sans text-black">
						{/* Header */}
						<div className="mb-4 flex items-start justify-between border-black border-b-2 pb-4">
							<div>
								<h1 className="font-bold text-2xl tracking-tight">
									EVALUNA LOGISTICS
								</h1>
								<p className="text-gray-500 text-xs">
									Fast, Verified & Reliable Warehouse Delivery
								</p>
							</div>
							<div className="text-right">
								<p className="inline-block bg-black px-2 py-1 font-bold text-sm text-white">
									PACKING SLIP
								</p>
								<p className="mt-1 font-mono text-xs">
									Ref: {printPackage.orderRef}
								</p>
							</div>
						</div>

						{/* Grid for details */}
						<div className="mb-6 grid grid-cols-2 gap-4 text-xs">
							<div className="rounded border border-gray-300 p-3">
								<p className="mb-1 border-gray-200 border-b pb-1 font-bold text-gray-700">
									🚚 SHIP TO:
								</p>
								<p className="font-bold text-sm">{printPackage.customerName}</p>
								<p className="mt-1">📞 {printPackage.customerPhone}</p>
								<p className="mt-1 text-gray-600 leading-tight">
									📍 {printPackage.customerAddress}
								</p>
							</div>

							<div className="rounded border border-gray-300 p-3">
								<p className="mb-1 border-gray-200 border-b pb-1 font-bold text-gray-700">
									📦 PARCEL SPECS:
								</p>
								<p>
									<strong>Pkg No:</strong> {printPackage.number}
								</p>
								<p className="mt-1">
									<strong>Weight:</strong> {printPackage.weight} kg
								</p>
								<p className="mt-1">
									<strong>Box Size:</strong> {printPackage.dimensions}
								</p>
								<p className="mt-1">
									<strong>Date:</strong> {new Date().toLocaleDateString()}
								</p>
							</div>
						</div>

						{/* Itemized list */}
						<div className="mb-6">
							<p className="mb-2 font-bold text-gray-700 text-xs uppercase tracking-wide">
								📋 Itemized Product Checklist
							</p>
							<table className="w-full border-collapse text-xs">
								<thead>
									<tr className="border-gray-300 border-b bg-gray-100">
										<th className="border border-gray-300 px-3 py-1.5 text-left">
											Product Name
										</th>
										<th className="border border-gray-300 px-3 py-1.5 text-left">
											SKU
										</th>
										<th className="w-20 border border-gray-300 px-3 py-1.5 text-center">
											Qty Ordered
										</th>
										<th className="w-20 border border-gray-300 px-3 py-1.5 text-center">
											Status
										</th>
									</tr>
								</thead>
								<tbody>
									{printPackage.items && printPackage.items.length > 0 ? (
										printPackage.items.map((it, idx) => (
											<tr key={idx} className="border-gray-200 border-b">
												<td className="border border-gray-300 px-3 py-1.5 font-bold">
													{it.productName}
												</td>
												<td className="border border-gray-300 px-3 py-1.5 font-mono">
													{it.sku}
												</td>
												<td className="border border-gray-300 px-3 py-1.5 text-center font-bold">
													{it.quantity}
												</td>
												<td className="border border-gray-300 px-3 py-1.5 text-center font-bold text-green-600">
													✓ Packed
												</td>
											</tr>
										))
									) : (
										<tr>
											<td
												colSpan={4}
												className="border border-gray-300 px-3 py-4 text-center text-gray-500"
											>
												No items registered.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>

						{/* Barcode Shipment Sticker */}
						<div className="flex flex-col items-center justify-center border-black border-t-2 pt-4">
							<p className="mb-1 font-bold text-[10px] text-gray-500 tracking-widest">
								SCAN TO CONFIRM LOADING / DELIVERY
							</p>
							<svg ref={printSvgRef} className="my-1" />
							<p className="mt-1 text-[9px] text-gray-400">
								PACKED & VERIFIED BY EVALUNA LOGISTICS
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
					<PackageIcon className="h-7 w-7 text-blue-600" />
					{t("pendingPackingQueue")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("pendingPackingQueueSub")}
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
										{t("totalPendingToPack")}
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
										{t("pickingVerified")}
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
										{t("stationStatus")}
									</p>
									<p className="font-bold text-green-800 text-xl dark:text-green-300">
										{tCommon("active")}
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
							{t("pendingPackQueue")}
						</CardTitle>
						<CardDescription>{t("ordersWaitingToPack")}</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder={t("searchPicklistOrRef")}
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
							{t("loadingQueue")}
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading pending queue"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-green-500 opacity-30" />
							<p>{t("noOrdersWaitingToPack")}</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("orderRef")}</TableHead>
										<TableHead>{t("orderRef")}</TableHead>
										<TableHead>{t("assignedRoute")}</TableHead>
										<TableHead>{t("driverAndTruck")}</TableHead>
										<TableHead>{t("pickingCompletionTime")}</TableHead>
										<TableHead>{tCommon("status")}</TableHead>
										<TableHead className="text-right">
											{tCommon("actions")}
										</TableHead>
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
											<TableCell className="font-semibold text-blue-600 text-xs dark:text-blue-400">
												📍 {pl.routeName}
											</TableCell>
											<TableCell className="text-xs">
												<div className="font-medium text-gray-800 dark:text-gray-200">
													👤 {pl.driverName}
												</div>
												<div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
													🚛 {pl.vehiclePlate}
												</div>
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{pl.completed_at}
											</TableCell>
											<TableCell>
												<span className="rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
													{t("readyToPack")}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													className="h-8 bg-blue-600 text-white hover:bg-blue-700"
													onClick={() => setSelectedPickList(pl)}
												>
													<BoxIcon className="mr-1 h-3.5 w-3.5" />{" "}
													{t("packParcel")}
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
								{t("packParcel")} {selectedPickList.order_ref}
							</DialogTitle>
							<DialogDescription>{t("recordParcelWeight")}</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2 text-sm">
							<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900 text-xs dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
								<p>
									<strong>Picklist:</strong> {selectedPickList.id}
								</p>
								<p>
									<strong>{t("orderRef")}:</strong> {selectedPickList.order_ref}
								</p>
								<p>
									<strong>{tCommon("status")}:</strong> {t("readyToPack")}
								</p>
								<p className="mt-1.5 border-blue-200/30 border-t pt-1.5">
									<strong>🚚 {t("driverAndTruck")}:</strong>{" "}
									{selectedPickList.vehiclePlate} ({selectedPickList.driverName}
									)
								</p>
								<p className="mt-0.5">
									<strong>📍 {t("assignedRoute")}:</strong>{" "}
									{selectedPickList.routeName}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										{t("parcelWeight")}
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
										{t("boxDimensions")}
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
								{tCommon("cancel")}
							</Button>
							<Button
								disabled={packMutation.isPending}
								onClick={handlePackSubmit}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								{packMutation.isPending && (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								)}
								{t("completePackingAndSave")}
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
					<DialogContent className="border-emerald-200 sm:max-w-[460px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-emerald-700 text-lg">
								<CheckCircle2Icon className="h-6 w-6 text-emerald-600" />
								{t("packingLabelPrinted")}
							</DialogTitle>
							<DialogDescription className="text-muted-foreground text-xs">
								{t("packagePackedPrintedSub", { number: printPackage.number })}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2 text-sm">
							<div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs">
								<div className="flex items-center justify-between border-emerald-200/50 border-b pb-2">
									<span className="font-semibold text-gray-700">
										{t("packageNumber")}:
									</span>
									<span className="font-bold font-mono text-emerald-800 text-sm">
										{printPackage.number}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">{t("orderRef")}:</span>
									<span className="font-semibold text-gray-900">
										{printPackage.orderRef}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">{tCommon("name")}:</span>
									<span className="font-medium text-gray-900">
										{printPackage.customerName}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">{t("assignedPicker")}:</span>
									<span className="font-semibold text-blue-700">
										👤 {printPackage.driverName || t("unassigned")}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">{t("driverAndTruck")}:</span>
									<span className="font-medium font-mono text-gray-800">
										🚛 {printPackage.vehiclePlate || "N/A"}
									</span>
								</div>
								<div className="mt-1 flex justify-between border-emerald-200/50 border-t pt-1.5">
									<span className="text-gray-500">{t("boxDimensions")}:</span>
									<span className="font-medium text-gray-800">
										{printPackage.weight} kg • {printPackage.dimensions}
									</span>
								</div>
							</div>

							<div className="flex items-center justify-between pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="border-gray-300 text-xs shadow-sm"
									onClick={() => window.print()}
								>
									<PrinterIcon className="mr-1.5 h-3.5 w-3.5 text-gray-600" />
									{t("reprintPackingSlip")}
								</Button>

								<Button
									type="button"
									size="sm"
									className="bg-emerald-600 font-semibold text-white text-xs shadow-sm hover:bg-emerald-700"
									onClick={() => {
										toast.success(
											`Package ${printPackage.number} confirmed & handed over to driver!`,
										);
										setPrintPackage(null);
										refetch();
									}}
								>
									<CheckCircle2Icon className="mr-1.5 h-4 w-4" />
									{t("confirmTransferAndComplete")}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</PageTransition>
	);
}
