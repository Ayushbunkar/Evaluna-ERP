"use client";

import { Badge } from "@evaluna/ui/components/badge";
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
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	FileSpreadsheetIcon,
	Loader2Icon,
	PackageIcon,
	SearchIcon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PackingPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: packingQueue, isLoading: packingLoading } =
		trpc.warehouse.getPackingQueue.useQuery();
	const { data: isEWayBillConfigured } =
		trpc.warehouse.isEWayBillConfigured.useQuery();

	// Mutations
	const packPackageMutation = trpc.warehouse.packPackage.useMutation({
		onSuccess: () => {
			toast.success("Package successfully sealed & routed to fleet hand-off!");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPackingQueue.invalidate();
		},
		onError: (err) => {
			toast.error(`Packing failed: ${err.message}`);
		},
	});

	const generateEWayBillMutation = trpc.warehouse.generateEWayBill.useMutation({
		onSuccess: (res) => {
			if (res.success) {
				toast.success(`Government E-Way Bill generated: ${res.eWayBillNo}`);
				utils.warehouse.getPackingQueue.invalidate();
			} else {
				toast.error(`E-Way Bill Error: ${res.error}`);
			}
		},
		onError: (err) => {
			toast.error(`API Gate Failure: ${err.message}`);
		},
	});

	// Packing Modal State
	const [selectedPackage, setSelectedPackage] = useState<any>(null);
	const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
	const [pkgWeight, setPkgWeight] = useState("");
	const [pkgDimensions, setPkgDimensions] = useState("");
	const [pkgNotes, setPkgNotes] = useState("");

	// E-Way Bill Modal State
	const [selectedEWayPackage, setSelectedEWayPackage] = useState<any>(null);
	const [isEWayModalOpen, setIsEWayModalOpen] = useState(false);
	const [vehicleNo, setVehicleNo] = useState("");
	const [transporterName, setTransporterName] = useState("");
	const [approxDistance, setApproxDistance] = useState("120");
	const [modeOfTransport, setModeOfTransport] = useState<
		"road" | "rail" | "air" | "ship"
	>("road");

	const openPackingModal = (pkg: any) => {
		setSelectedPackage(pkg);
		setIsPackingModalOpen(true);
	};

	const openEWayModal = (pkg: any) => {
		setSelectedEWayPackage(pkg);
		setIsEWayModalOpen(true);
	};

	const handleCompletePacking = async () => {
		if (!selectedPackage) return;
		await packPackageMutation.mutateAsync({
			packageId: selectedPackage.id,
			weight: Number.parseFloat(pkgWeight) || undefined,
			dimensions: pkgDimensions,
			notes: pkgNotes,
		});
		setIsPackingModalOpen(false);
		setPkgWeight("");
		setPkgDimensions("");
		setPkgNotes("");
	};

	const handleGenerateEWayBill = async () => {
		if (!selectedEWayPackage) return;
		await generateEWayBillMutation.mutateAsync({
			orderId: selectedEWayPackage.order_id,
			vehicleNo: vehicleNo,
			modeOfTransport: modeOfTransport,
			approxDistanceKm: Number.parseInt(approxDistance, 10) || 100,
			transporterName: transporterName || undefined,
		});
		setIsEWayModalOpen(false);
		setVehicleNo("");
		setTransporterName("");
		setApproxDistance("120");
	};

	const filteredPackages =
		packingQueue?.filter(
			(pkg) =>
				pkg.package_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				String(pkg.order_id).includes(searchQuery),
		) || [];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Outbound Packing & Fleet Hand-off
					</h2>
					<p className="text-muted-foreground text-sm">
						Check picked lines, pack box containers with weights/sizes, and
						generate routing hand-offs.
					</p>
				</div>
				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search package ref, order ID..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						In-Progress Packing & Dispatch Handoff Queue
					</CardTitle>
					<CardDescription>
						Perform quality audits on items, pack them in boxes and register
						shipment volumetric dimensions
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{packingLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Package Number</TableHead>
										<TableHead>Sales Order ID</TableHead>
										<TableHead>Current State</TableHead>
										<TableHead>Sealed Operator</TableHead>
										<TableHead>E-Way Bill Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPackages.map((pkg) => (
										<TableRow key={pkg.id}>
											<TableCell className="font-semibold text-slate-900 dark:text-slate-100">
												{pkg.package_number}
											</TableCell>
											<TableCell className="font-bold text-slate-800">
												ORD-#{pkg.order_id}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														pkg.status === "packed" ? "default" : "outline"
													}
													className={
														pkg.status === "packing"
															? "border-amber-200 bg-amber-50 text-amber-700"
															: ""
													}
												>
													{pkg.status}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-xs">
													<UsersIcon className="h-4 w-4 text-slate-400" />
													<span className="font-medium">
														{pkg.worker_name ?? "System Picker"}
													</span>
												</div>
											</TableCell>
											<TableCell>
												{pkg.e_way_bill_no ? (
													<Badge className="border-emerald-200 bg-emerald-100 font-mono text-[10px] text-emerald-800">
														{pkg.e_way_bill_no}
													</Badge>
												) : Number(pkg.total_amount || 0) >= 50000 ? (
													<Badge
														variant="destructive"
														className="animate-pulse text-[10px]"
													>
														Required (₹
														{Number(pkg.total_amount).toLocaleString()})
													</Badge>
												) : (
													<span className="text-slate-400 text-xs">
														Optional
													</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													{pkg.status === "packing" ? (
														<Button
															size="sm"
															onClick={() => openPackingModal(pkg)}
															className="h-8 text-xs shadow-sm"
														>
															Seal Box Container
														</Button>
													) : (
														<div className="flex items-center gap-2">
															{!pkg.e_way_bill_no && (
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => openEWayModal(pkg)}
																	className="h-8 border-blue-200 text-blue-600 text-xs shadow-sm hover:bg-blue-50"
																>
																	<FileSpreadsheetIcon className="mr-1 h-3.5 w-3.5" />
																	E-Way Bill
																</Button>
															)}
															<div className="flex items-center gap-1 font-bold text-green-600 text-xs">
																<CheckCircle2Icon className="h-4 w-4" /> Sealed
															</div>
														</div>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
									{filteredPackages.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-12 text-center text-muted-foreground"
											>
												<PackageIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													No packages in dispatch queue.
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* PACK BOX DIALOG MODAL */}
			<Dialog open={isPackingModalOpen} onOpenChange={setIsPackingModalOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Seal Package Box — {selectedPackage?.package_number}
						</DialogTitle>
						<DialogDescription>
							Validate container dimensions, weight, and hand-off to the
							shipping fleet.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Lot Weight (kg)
							</Label>
							<Input
								type="number"
								placeholder="E.g. 5.4"
								value={pkgWeight}
								onChange={(e) => setPkgWeight(e.target.value)}
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Box Dimensions (L x W x H cm)
							</Label>
							<Input
								placeholder="E.g. 30x20x15"
								value={pkgDimensions}
								onChange={(e) => setPkgDimensions(e.target.value)}
								className="mt-1 h-9 text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Fulfillment Sealing Notes
							</Label>
							<Textarea
								placeholder="Bubble wrapped, fragile label attached..."
								value={pkgNotes}
								onChange={(e) => setPkgNotes(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPackingModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleCompletePacking}
							disabled={packPackageMutation.isPending}
						>
							{packPackageMutation.isPending
								? "Sealing..."
								: "Seal Container & Fleet Handoff"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* GENERATE GOVERNMENT E-WAY BILL MODAL */}
			<Dialog open={isEWayModalOpen} onOpenChange={setIsEWayModalOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-1.5 font-bold text-lg text-slate-900">
							<FileSpreadsheetIcon className="h-5 w-5 text-blue-500" />
							Government GST E-Way Bill Integration
						</DialogTitle>
						<DialogDescription>
							Register inter-state logistics transits for Order ORD-#
							{selectedEWayPackage?.order_id} directly with GST NIC Portal.
						</DialogDescription>
					</DialogHeader>

					{!isEWayBillConfigured ? (
						<div className="my-2 flex gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-xs">
							<AlertTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600" />
							<div className="space-y-1 text-red-700">
								<p className="font-bold">
									E-Way Bill integration not configured
								</p>
								<p className="leading-relaxed">
									Missing GSP credentials or configuration API endpoints. Please
									set{" "}
									<code className="border bg-white px-1 py-0.5 font-mono">
										EWAY_BILL_USERNAME
									</code>{" "}
									and{" "}
									<code className="border bg-white px-1 py-0.5 font-mono">
										EWAY_BILL_API_KEY
									</code>{" "}
									environment variables to initiate official connections.
								</p>
							</div>
						</div>
					) : (
						<div className="my-2 rounded-md border border-blue-200 bg-blue-50 p-3 font-medium text-[11px] text-blue-800">
							API Active: Government Sandbox Endpoint is configured and ready.
						</div>
					)}

					<div className="my-2 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="font-bold text-slate-700 text-xs">
									Vehicle Number (Required)
								</Label>
								<Input
									placeholder="E.g. MP-04-HE-1234"
									value={vehicleNo}
									onChange={(e) => setVehicleNo(e.target.value)}
									className="mt-1 h-9 font-bold text-xs uppercase"
									disabled={!isEWayBillConfigured}
								/>
							</div>
							<div>
								<Label className="font-bold text-slate-700 text-xs">
									Approx. Distance (km)
								</Label>
								<Input
									type="number"
									placeholder="E.g. 150"
									value={approxDistance}
									onChange={(e) => setApproxDistance(e.target.value)}
									className="mt-1 h-9 text-xs"
									disabled={!isEWayBillConfigured}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="font-bold text-slate-700 text-xs">
									Transporter Name
								</Label>
								<Input
									placeholder="E.g. DTDC Express"
									value={transporterName}
									onChange={(e) => setTransporterName(e.target.value)}
									className="mt-1 h-9 text-xs"
									disabled={!isEWayBillConfigured}
								/>
							</div>
							<div>
								<Label className="font-bold text-slate-700 text-xs">
									Transport Mode
								</Label>
								<select
									value={modeOfTransport}
									onChange={(e: any) => setModeOfTransport(e.target.value)}
									className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm"
									disabled={!isEWayBillConfigured}
								>
									<option value="road">Roadway</option>
									<option value="rail">Railway</option>
									<option value="air">Airway</option>
									<option value="ship">Shipment</option>
								</select>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsEWayModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleGenerateEWayBill}
							disabled={
								!isEWayBillConfigured || generateEWayBillMutation.isPending
							}
						>
							{generateEWayBillMutation.isPending
								? "Connecting..."
								: "Generate GST E-Way Bill"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
