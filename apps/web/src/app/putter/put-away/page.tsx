"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CameraIcon,
	CheckCircle2Icon,
	ClockIcon,
	DownloadIcon,
	FilterIcon,
	InfoIcon,
	Loader2Icon,
	MapPinIcon,
	PackageCheckIcon,
	PackagePlusIcon,
	RotateCcwIcon,
	SearchIcon,
	ShieldAlertIcon,
	TruckIcon,
	XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

type TabSource = "ALL" | "SUPPLIER_GRN" | "VAN_RETURN" | "VAN_MANIFEST_REJECTION";

interface ItemPutawayRowState {
	itemId: number;
	productId: number;
	productName: string;
	sku: string;
	expectedQty: number;
	verifiedQty: number;
	putawayQty: number;
	alreadyPutawayQty: number;
	remainingQty: number;
	damagedQty: number;
	rejectedQty: number;
	condition: "USABLE" | "DAMAGED" | "EXPIRED" | "DISPUTED";
	locationName: string;
	locationId?: number;
	discrepancyReason?: string;
}

export default function PutAwayTasksPage() {
	const trpc = useTRPC();
	const [activeTab, setActiveTab] = useState<TabSource>("ALL");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTask, setSelectedTask] = useState<any | null>(null);
	const [activeItems, setActiveItems] = useState<ItemPutawayRowState[]>([]);
	const [generalNotes, setGeneralNotes] = useState("");
	const [showCameraScanner, setShowCameraScanner] = useState(false);
	const [activeScanningItemIdx, setActiveScanningItemIdx] = useState<number | null>(null);

	// Queries
	const {
		data: pendingTasks,
		isLoading,
		error,
		refetch,
	} = trpc.putter.getPendingPutaway.useQuery({
		source: activeTab,
		search: searchQuery,
	});

	const { data: storageLocations } = trpc.putter.getStorageLocations.useQuery({});

	// Mutation to confirm putaway
	const confirmMutation = trpc.putter.confirmPutAway.useMutation({
		onSuccess: (data) => {
			toast.success(
				data.allCompleted
					? "Put-away completed! Stock successfully added to warehouse inventory."
					: "Partial put-away confirmed! Inventory updated for shelved items.",
			);
			refetch();
			setSelectedTask(null);
			setActiveItems([]);
			setGeneralNotes("");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to confirm put-away");
		},
	});

	// When a task is selected, populate items for editing
	const handleOpenTask = (task: any) => {
		setSelectedTask(task);
		setGeneralNotes("");
		const mapped: ItemPutawayRowState[] = (task.items || []).map((it: any) => {
			const expected = Number(it.expectedQty || 0);
			const alreadyPutaway = Number(it.putawayQty || 0);
			const remaining = Number(it.remainingQty ?? Math.max(0, expected - alreadyPutaway));
			const defaultLocation =
				task.sourceType === "VAN_MANIFEST_REJECTION"
					? "Rack B-01 / Shelf 1"
					: task.sourceType === "VAN_RETURN"
						? "Returns Restock Bay R-01"
						: "Rack A-01 / Shelf 1";

			return {
				itemId: it.id,
				productId: it.productId,
				productName: it.productName,
				sku: it.sku,
				expectedQty: expected,
				verifiedQty: it.verifiedQty > 0 ? it.verifiedQty : remaining,
				putawayQty: remaining, // default full remaining
				alreadyPutawayQty: alreadyPutaway,
				remainingQty: remaining,
				damagedQty: Number(it.damagedQty || 0),
				rejectedQty: Number(it.rejectedQty || 0),
				condition: it.condition || "USABLE",
				locationName: it.locationName || defaultLocation,
				discrepancyReason: "",
			};
		});
		setActiveItems(mapped);
	};

	const handleVerifiedChange = (idx: number, val: number) => {
		const updated = [...activeItems];
		updated[idx].verifiedQty = Math.max(0, val);
		// Auto adjust putaway qty to not exceed verified qty
		if (updated[idx].putawayQty > updated[idx].verifiedQty) {
			updated[idx].putawayQty = updated[idx].verifiedQty;
		}
		setActiveItems(updated);
	};

	const handlePutawayQtyChange = (idx: number, val: number) => {
		const updated = [...activeItems];
		const maxAllowed = updated[idx].remainingQty;
		updated[idx].putawayQty = Math.min(Math.max(0, val), maxAllowed);
		setActiveItems(updated);
	};

	const handleLocationChange = (idx: number, locName: string, locId?: number) => {
		const updated = [...activeItems];
		updated[idx].locationName = locName;
		if (locId) updated[idx].locationId = locId;
		setActiveItems(updated);
	};

	const handleConditionChange = (idx: number, cond: any) => {
		const updated = [...activeItems];
		updated[idx].condition = cond;
		setActiveItems(updated);
	};

	const handleDiscrepancyReasonChange = (idx: number, reason: string) => {
		const updated = [...activeItems];
		updated[idx].discrepancyReason = reason;
		setActiveItems(updated);
	};

	const handleConfirmSubmit = () => {
		if (!selectedTask || activeItems.length === 0) return;

		// Validation: check if verified != expected and reason is missing
		for (const it of activeItems) {
			if (it.verifiedQty !== it.expectedQty && !it.discrepancyReason?.trim()) {
				toast.error(
					`Please provide a discrepancy reason for ${it.productName} (verified ${it.verifiedQty} vs expected ${it.expectedQty})`,
				);
				return;
			}
		}

		confirmMutation.mutate({
			taskId: selectedTask.id,
			notes: generalNotes,
			items: activeItems.map((it) => ({
				itemId: it.itemId,
				verifiedQty: it.verifiedQty,
				putawayQty: it.putawayQty,
				damagedQty: it.damagedQty,
				rejectedQty: it.rejectedQty,
				locationId: it.locationId,
				locationName: it.locationName,
				condition: it.condition,
				discrepancyReason: it.discrepancyReason,
			})),
		});
	};

	// Task counts per category
	const counts = useMemo(() => {
		if (!pendingTasks) return { all: 0, supplier: 0, vanReturn: 0, rejected: 0 };
		return {
			all: pendingTasks.length,
			supplier: pendingTasks.filter((t) => t.sourceType === "SUPPLIER_GRN").length,
			vanReturn: pendingTasks.filter((t) => t.sourceType === "VAN_RETURN").length,
			rejected: pendingTasks.filter((t) => t.sourceType === "VAN_MANIFEST_REJECTION").length,
		};
	}, [pendingTasks]);

	return (
		<PageTransition className="container mx-auto space-y-6 pb-12">
			{/* Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b pb-4">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2.5 font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
						<PackagePlusIcon className="h-8 w-8 text-blue-600" />
						Warehouse Inventory Put-Away
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Physically verify accepted supplier goods, approved van returns, and rejected manifests before committing stock to warehouse inventory.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="gap-2 border-blue-600 text-blue-700 hover:bg-blue-50 text-xs font-medium"
						onClick={() => {
							setActiveScanningItemIdx(null);
							setShowCameraScanner(true);
						}}
					>
						<CameraIcon className="h-4 w-4" /> Camera Scan Bin Barcode
					</Button>
				</div>
			</div>

			{/* Filter Tabs (Section 4.B) */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap gap-2 border-b sm:border-0 pb-2 sm:pb-0">
					<Button
						variant={activeTab === "ALL" ? "default" : "outline"}
						size="sm"
						onClick={() => setActiveTab("ALL")}
						className={
							activeTab === "ALL"
								? "bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold"
								: "text-xs"
						}
					>
						All Tasks ({counts.all})
					</Button>
					<Button
						variant={activeTab === "SUPPLIER_GRN" ? "default" : "outline"}
						size="sm"
						onClick={() => setActiveTab("SUPPLIER_GRN")}
						className={
							activeTab === "SUPPLIER_GRN"
								? "bg-sky-600 text-white hover:bg-sky-700 text-xs font-semibold"
								: "text-xs text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800"
						}
					>
						<DownloadIcon className="mr-1.5 h-3.5 w-3.5" />
						Supplier Inward ({counts.supplier})
					</Button>
					<Button
						variant={activeTab === "VAN_RETURN" ? "default" : "outline"}
						size="sm"
						onClick={() => setActiveTab("VAN_RETURN")}
						className={
							activeTab === "VAN_RETURN"
								? "bg-purple-600 text-white hover:bg-purple-700 text-xs font-semibold"
								: "text-xs text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800"
						}
					>
						<RotateCcwIcon className="mr-1.5 h-3.5 w-3.5" />
						Van Returns ({counts.vanReturn})
					</Button>
					<Button
						variant={activeTab === "VAN_MANIFEST_REJECTION" ? "default" : "outline"}
						size="sm"
						onClick={() => setActiveTab("VAN_MANIFEST_REJECTION")}
						className={
							activeTab === "VAN_MANIFEST_REJECTION"
								? "bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
								: "text-xs text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
						}
					>
						<ShieldAlertIcon className="mr-1.5 h-3.5 w-3.5" />
						Rejected Van Manifests ({counts.rejected})
					</Button>
				</div>

				{/* Search box */}
				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search SKU, Product, Ref, Driver..."
						className="pl-9 h-9 text-xs"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* Main Task List */}
			<Card className="border-border/60 shadow-sm">
				<CardHeader className="p-4 pb-2">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-base font-bold flex items-center gap-2">
								<PackageCheckIcon className="h-5 w-5 text-blue-600" />
								Pending Verification & Put-Away Tasks
							</CardTitle>
							<CardDescription className="text-xs">
								Select any task to physically count, assign storage bins, and credit to warehouse stock
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0 sm:p-4">
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground text-sm">
							<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" /> Loading put-away tasks...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive text-sm">
							{error.message || "Failed to load tasks"}
						</div>
					) : !pendingTasks || pendingTasks.length === 0 ? (
						<div className="flex h-48 flex-col items-center justify-center gap-2 text-center p-6">
							<CheckCircle2Icon className="h-10 w-10 text-emerald-500 opacity-60" />
							<p className="font-semibold text-foreground text-sm">
								No pending put-away tasks for this filter!
							</p>
							<p className="text-xs text-muted-foreground max-w-md">
								All supplier goods, van returns, and rejected manifests have been physically verified and placed in warehouse bins.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="text-xs">
										<TableHead>Task Number</TableHead>
										<TableHead>Source Type</TableHead>
										<TableHead>Source Reference</TableHead>
										<TableHead>Supplier / Driver</TableHead>
										<TableHead className="text-center">Items</TableHead>
										<TableHead className="text-right">Expected Qty</TableHead>
										<TableHead className="text-right">Remaining Putaway</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pendingTasks.map((task: any) => {
										const isRejected = task.sourceType === "VAN_MANIFEST_REJECTION";
										const isSupplier = task.sourceType === "SUPPLIER_GRN";
										const isVanReturn = task.sourceType === "VAN_RETURN";

										return (
											<TableRow
												key={task.id}
												className="hover:bg-muted/40 cursor-pointer text-xs"
												onClick={() => handleOpenTask(task)}
											>
												<TableCell className="font-mono font-bold text-primary">
													{task.taskNumber}
												</TableCell>
												<TableCell>
													{isSupplier && (
														<Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-300">
															Supplier GRN
														</Badge>
													)}
													{isVanReturn && (
														<Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300">
															Van Return
														</Badge>
													)}
													{isRejected && (
														<Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300">
															Rejected Manifest
														</Badge>
													)}
												</TableCell>
												<TableCell className="font-mono font-medium">
													{task.sourceReference}
												</TableCell>
												<TableCell className="text-muted-foreground">
													{isSupplier
														? task.supplierName || "Supplier"
														: task.driverName
															? `${task.driverName} (${task.vehicleNumber || "Van"})`
															: "Van Fleet"}
												</TableCell>
												<TableCell className="text-center font-semibold">
													{task.totalItems} products
												</TableCell>
												<TableCell className="text-right font-medium text-muted-foreground">
													{task.totalExpectedQty} units
												</TableCell>
												<TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
													{task.remainingQty} units
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={
															task.status === "COMPLETED"
																? "text-emerald-700 border-emerald-300"
																: task.status === "PARTIALLY_COMPLETED"
																	? "text-amber-700 border-amber-300"
																	: "text-blue-700 border-blue-300"
														}
													>
														{task.status?.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<Button
														size="sm"
														className="h-8 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
														onClick={(e) => {
															e.stopPropagation();
															handleOpenTask(task);
														}}
													>
														<PackagePlusIcon className="mr-1 h-3.5 w-3.5" />
														Put Away
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Comprehensive Put-Away Modal (Sections 2, 3, 4) */}
			{selectedTask && (
				<Dialog
					open={!!selectedTask}
					onOpenChange={(open) => !open && setSelectedTask(null)}
				>
					<DialogContent className="max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<div className="flex items-center justify-between">
								<DialogTitle className="flex items-center gap-2 text-lg font-bold">
									<PackagePlusIcon className="h-5 w-5 text-blue-600" />
									Physical Stock Verification & Put-Away
								</DialogTitle>
								<Badge
									className={
										selectedTask.sourceType === "VAN_MANIFEST_REJECTION"
											? "bg-rose-600 text-white"
											: selectedTask.sourceType === "VAN_RETURN"
												? "bg-purple-600 text-white"
												: "bg-sky-600 text-white"
									}
								>
									{selectedTask.sourceType?.replace(/_/g, " ")}
								</Badge>
							</div>
							<DialogDescription className="text-xs">
								Task: <span className="font-mono font-semibold text-foreground">{selectedTask.taskNumber}</span> | Ref: <span className="font-mono font-semibold text-foreground">{selectedTask.sourceReference}</span>
							</DialogDescription>
						</DialogHeader>

						{/* Banner for Rejected Manifests */}
						{selectedTask.sourceType === "VAN_MANIFEST_REJECTION" && (
							<div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 flex items-start gap-2.5">
								<ShieldAlertIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
								<div>
									<div className="font-bold">Manager Rejected Van Manifest Restock:</div>
									<div className="mt-0.5">
										Reason: <span className="font-semibold">{selectedTask.rejectionReason || "Manager rejected manifest during verification"}</span>
									</div>
									<div className="text-[11px] text-rose-700 dark:text-rose-400 mt-1">
										Goods were physically picked from shelves for this manifest. Confirming put-away will return them to warehouse stock and clear inventory reservations.
									</div>
								</div>
							</div>
						)}

						{/* Product Items Table */}
						<div className="space-y-4 py-2">
							<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								Line Items to Verify & Shelve ({activeItems.length})
							</div>

							<div className="overflow-x-auto rounded-md border">
								<Table>
									<TableHeader>
										<TableRow className="text-xs bg-muted/30">
											<TableHead>Product & SKU</TableHead>
											<TableHead className="text-center w-20">Expected</TableHead>
											<TableHead className="text-center w-24">Verified Count *</TableHead>
											<TableHead className="text-center w-28">Shelve Qty *</TableHead>
											<TableHead className="w-48">Target Storage Bin *</TableHead>
											<TableHead className="w-28">Condition</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{activeItems.map((item, idx) => {
											const hasDiscrepancy = item.verifiedQty !== item.expectedQty;

											return (
												<TableRow key={item.itemId} className="text-xs">
													<TableCell>
														<div className="font-semibold text-foreground">
															{item.productName}
														</div>
														<div className="font-mono text-[10px] text-muted-foreground">
															{item.sku}
														</div>
														{hasDiscrepancy && (
															<div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
																<AlertTriangleIcon className="h-3.5 w-3.5" />
																Mismatch: Expected {item.expectedQty}, Verified {item.verifiedQty}
															</div>
														)}
													</TableCell>

													<TableCell className="text-center font-bold text-muted-foreground">
														{item.expectedQty}
													</TableCell>

													<TableCell className="text-center">
														<Input
															type="number"
															step="0.001"
															min="0"
															value={item.verifiedQty}
															onChange={(e) =>
																handleVerifiedChange(idx, parseFloat(e.target.value) || 0)
															}
															className="h-8 text-xs text-center font-semibold border-input"
														/>
													</TableCell>

													<TableCell className="text-center">
														<Input
															type="number"
															step="0.001"
															min="0"
															max={item.remainingQty}
															value={item.putawayQty}
															onChange={(e) =>
																handlePutawayQtyChange(idx, parseFloat(e.target.value) || 0)
															}
															className="h-8 text-xs text-center font-bold text-blue-600 dark:text-blue-400 border-blue-200"
														/>
													</TableCell>

													<TableCell>
														<div className="space-y-1">
															<select
																className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
																value={item.locationName}
																onChange={(e) => handleLocationChange(idx, e.target.value)}
															>
																{(storageLocations || []).map((loc: any) => (
																	<option key={loc.id} value={loc.name}>
																		{loc.name}
																	</option>
																))}
																<option value="Quarantine Bay Q-01">Quarantine Bay Q-01</option>
																<option value="Returns Restock Bay R-01">Returns Restock Bay R-01</option>
																<option value="Warehouse Main Storage">Warehouse Main Storage</option>
															</select>
														</div>
													</TableCell>

													<TableCell>
														<select
															className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
															value={item.condition}
															onChange={(e) => handleConditionChange(idx, e.target.value)}
														>
															<option value="USABLE">Usable</option>
															<option value="DAMAGED">Damaged</option>
															<option value="EXPIRED">Expired</option>
															<option value="DISPUTED">Disputed</option>
														</select>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>

							{/* Discrepancy Reasons Box if count mismatches */}
							{activeItems.some((it) => it.verifiedQty !== it.expectedQty) && (
								<div className="space-y-2 rounded-md border border-amber-300 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
									<div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
										<AlertTriangleIcon className="h-4 w-4 text-amber-600" />
										Mandatory Discrepancy Remarks Required
									</div>
									<div className="grid gap-2">
										{activeItems
											.filter((it) => it.verifiedQty !== it.expectedQty)
											.map((it, idx) => (
												<div key={it.itemId} className="flex flex-col gap-1">
													<label className="text-[11px] font-medium text-amber-900 dark:text-amber-200">
														Reason for {it.productName} (Diff: {(it.verifiedQty - it.expectedQty).toFixed(3)}):
													</label>
													<Input
														type="text"
														placeholder="e.g. Broken in transit, supplier shortage, physically missing on cart..."
														className="h-8 text-xs bg-white dark:bg-black/40 border-amber-300"
														value={it.discrepancyReason || ""}
														onChange={(e) =>
															handleDiscrepancyReasonChange(idx, e.target.value)
														}
													/>
												</div>
											))}
									</div>
								</div>
							)}

							{/* Remarks */}
							<div className="space-y-1">
								<label className="text-xs font-medium text-foreground">
									Putter Audit & Restock Notes (Optional):
								</label>
								<Input
									type="text"
									placeholder="Add any specific bin placement notes or condition comments..."
									className="text-xs h-9"
									value={generalNotes}
									onChange={(e) => setGeneralNotes(e.target.value)}
								/>
							</div>
						</div>

						<DialogFooter className="border-t pt-4 flex items-center justify-between">
							<Button variant="outline" size="sm" onClick={() => setSelectedTask(null)}>
								Cancel
							</Button>
							<Button
								size="sm"
								disabled={confirmMutation.isPending}
								onClick={handleConfirmSubmit}
								className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
							>
								{confirmMutation.isPending && (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								)}
								<CheckCircle2Icon className="h-4 w-4" />
								Confirm Put-Away to Warehouse Stock
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* Camera Barcode Scanner Modal */}
			<CameraBarcodeScannerModal
				open={showCameraScanner}
				onOpenChange={setShowCameraScanner}
				onScan={(code) => {
					if (activeScanningItemIdx !== null && activeItems[activeScanningItemIdx]) {
						handleLocationChange(activeScanningItemIdx, code);
					}
					toast.success(`Scanned Bin Barcode: ${code}`);
					setShowCameraScanner(false);
				}}
				title="Scan Shelf Bin Location Barcode"
				description="Point phone camera at shelf bin barcode sticker."
			/>
		</PageTransition>
	);
}
