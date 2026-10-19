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
import { Checkbox } from "@evaluna/ui/components/checkbox";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
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
	AlertCircleIcon,
	AlertTriangleIcon,
	ArrowLeftIcon,
	Building2Icon,
	CheckCircle2Icon,
	ChevronRightIcon,
	Loader2Icon,
	PackageCheckIcon,
	PackagePlusIcon,
	Trash2Icon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

interface ReceivingLineItem {
	key: string;
	purchaseItemId?: number;
	productId?: number;
	productName: string;
	productSku: string;
	orderedQuantity: number;
	receivedQuantity: number;
	acceptedQuantity: number;
	rejectedQuantity: number;
	damagedQuantity: number;
	unitCost: number;
	batchNumber: string;
	inspectionNotes: string;
	isVerified: boolean;
	isExtraItem?: boolean;
	customCategory?: string;
	customUnit?: string;
}

export default function PurchaseOrderInspectionPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const rawParam = params?.id ? decodeURIComponent(params.id) : "0";
	const parsedId = Number.parseInt(rawParam, 10);
	const queryId =
		!Number.isNaN(parsedId) && String(parsedId) === rawParam
			? parsedId
			: rawParam;

	// Queries
	const {
		data: po,
		isLoading: poLoading,
		error: poError,
	} = trpc.procurement.getPO.useQuery(
		{ id: queryId },
		{ enabled: Boolean(rawParam && rawParam !== "0") },
	);

	const resolvedPoId = po?.id || (Number.isFinite(parsedId) ? parsedId : 0);

	const { data: suppliersList } = trpc.procurement.listSuppliers.useQuery();
	const { data: catalogProducts } = trpc.products.list.useQuery({
		limit: 100,
	});

	// Receiving shipment details
	const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
	const [vehicleNumber, setVehicleNumber] = useState("");
	const [gateNotes, setGateNotes] = useState("");

	// Checklist line items state
	const [lineItems, setLineItems] = useState<ReceivingLineItem[]>([]);
	const [initializedPoId, setInitializedPoId] = useState<number | null>(null);

	// Supplier / Company change modal
	const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
	const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

	// Delete / Cancel PO modal
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [deleteReason, setDeleteReason] = useState("");

	// Add extra / new supplier item modal
	const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
	const [itemMode, setItemMode] = useState<"catalog" | "custom">("catalog");
	const [selectedCatalogProductId, setSelectedCatalogProductId] =
		useState<string>("");
	const [customItemName, setCustomItemName] = useState("");
	const [customItemSku, setCustomItemSku] = useState("");
	const [customItemCategory, setCustomItemCategory] = useState("General");
	const [customItemUnit, setCustomItemUnit] = useState("pcs");
	const [newItemQty, setNewItemQty] = useState<number>(1);
	const [newItemCost, setNewItemCost] = useState<number>(0);
	const [newItemBatch, setNewItemBatch] = useState("");
	const [newItemNotes, setNewItemNotes] = useState("");

	// Initialize form when PO loads
	useEffect(() => {
		if (po && initializedPoId !== po.id) {
			setDeliveryNoteNumber(
				po.grns?.[0]?.delivery_note_number ||
					`DN-${Date.now().toString().slice(-6)}`,
			);
			if (po.grns?.[0]?.vehicle_number) {
				setVehicleNumber(po.grns[0].vehicle_number);
			}
			if (po.grns?.[0]?.notes) {
				setGateNotes(po.grns[0].notes);
			}
			setSelectedSupplierId(po.supplier_id ? String(po.supplier_id) : "");

			if (po.items && po.items.length > 0) {
				const isAlreadyReceived =
					po.receiving_status === "received" || po.receiving_status === "partial";
				const initialItems: ReceivingLineItem[] = po.items.map((it: any) => {
					const qty = Number(it.quantity) || 0;
					const price = Number(it.price) || 0;
					const hasGrn =
						it.has_grn_record ||
						(it.received_quantity !== undefined && Number(it.received_quantity) > 0) ||
						(it.damaged_quantity !== undefined && Number(it.damaged_quantity) > 0) ||
						(it.rejected_quantity !== undefined && Number(it.rejected_quantity) > 0);

					const receivedQty = hasGrn
						? Number(it.received_quantity) || 0
						: isAlreadyReceived
							? qty
							: 0;
					const acceptedQty = hasGrn
						? Number(it.accepted_quantity) || 0
						: isAlreadyReceived
							? qty
							: 0;
					const damagedQty = hasGrn ? Number(it.damaged_quantity) || 0 : 0;
					const rejectedQty = hasGrn ? Number(it.rejected_quantity) || 0 : 0;
					const batchNum =
						it.batch_number || `B-${Date.now().toString().slice(-4)}`;
					const notes =
						it.inspection_notes ||
						(damagedQty > 0
							? `Damaged: ${damagedQty} units`
							: isAlreadyReceived
								? "Inspected & in good condition"
								: "");

					return {
						key: `item-${it.id}`,
						purchaseItemId: it.id ? Number(it.id) : undefined,
						productId: it.product_id ? Number(it.product_id) : undefined,
						productName: it.product_name || "Unnamed Product",
						productSku: it.product_sku || "N/A",
						orderedQuantity: qty,
						receivedQuantity: receivedQty,
						acceptedQuantity: acceptedQty,
						rejectedQuantity: rejectedQty,
						damagedQuantity: damagedQty,
						unitCost: price,
						batchNumber: batchNum,
						inspectionNotes: notes,
						isVerified: isAlreadyReceived || hasGrn,
						isExtraItem: false,
					};
				});
				setLineItems(initialItems);
			} else {
				setLineItems([]);
			}
			setInitializedPoId(po.id);
		}
	}, [po, initializedPoId]);

	// Mutations
	const recordReceiptMutation = trpc.procurement.recordReceipt.useMutation({
		onSuccess: (grn) => {
			toast.success(
				`Goods Receipt #${grn.grn_number} posted successfully! Stock ledger and inventory updated.`,
			);
			utils.procurement.getPO.invalidate({ id: queryId });
			utils.procurement.listPOs.invalidate();
			utils.procurement.listGRNs.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			utils.warehouse.getReceivingPOs.invalidate();
			utils.inventory.list.invalidate();
			router.push("/procurement/incoming");
		},
		onError: (err) => {
			toast.error(`Receipt posting failed: ${err.message}`);
		},
	});

	const updateSupplierMutation = trpc.procurement.updatePOSupplier.useMutation({
		onSuccess: () => {
			toast.success("Order supplier updated successfully!");
			utils.procurement.getPO.invalidate({ id: queryId });
			utils.procurement.listPOs.invalidate();
			setIsSupplierModalOpen(false);
		},
		onError: (err) => {
			toast.error(`Failed to update supplier: ${err.message}`);
		},
	});

	const deletePOMutation = trpc.procurement.deletePO.useMutation({
		onSuccess: (res) => {
			if (res.mode === "deleted") {
				toast.success("Purchase order permanently deleted.");
			} else {
				toast.success("Purchase order cancelled with reason recorded.");
			}
			utils.procurement.listPOs.invalidate();
			utils.procurement.getProcurementKpis.invalidate();
			router.push("/procurement/incoming");
		},
		onError: (err) => {
			toast.error(`Action failed: ${err.message}`);
		},
	});

	// Checkbox toggle for item verification
	const handleToggleVerify = (index: number, forceValue?: boolean) => {
		setLineItems((prev) => {
			const updated = [...prev];
			const current = { ...updated[index] };
			const nextVerified =
				typeof forceValue === "boolean" ? forceValue : !current.isVerified;
			current.isVerified = nextVerified;

			if (nextVerified) {
				// Restore to ordered quantity
				current.receivedQuantity = current.orderedQuantity;
				current.rejectedQuantity = 0;
				current.damagedQuantity = 0;
				current.acceptedQuantity = current.orderedQuantity;
			} else {
				// Reset received and accepted to 0
				current.receivedQuantity = 0;
				current.acceptedQuantity = 0;
				current.rejectedQuantity = 0;
				current.damagedQuantity = 0;
			}

			updated[index] = current;
			return updated;
		});
	};

	// Mark all verified
	const handleMarkAllVerified = (allChecked: boolean) => {
		setLineItems((prev) =>
			prev.map((it) => ({
				...it,
				isVerified: allChecked,
				receivedQuantity: allChecked ? it.orderedQuantity : 0,
				acceptedQuantity: allChecked ? it.orderedQuantity : 0,
				rejectedQuantity: 0,
				damagedQuantity: 0,
			})),
		);
	};

	// Line item quantity updates
	const handleItemChange = (
		index: number,
		field: keyof ReceivingLineItem,
		val: any,
	) => {
		setLineItems((prev) => {
			const updated = [...prev];
			const current = { ...updated[index], [field]: val };

			const numReceived = Math.max(0, Number(current.receivedQuantity) || 0);
			const numAccepted = Math.max(0, Number(current.acceptedQuantity) || 0);
			const numRejected = Math.max(0, Number(current.rejectedQuantity) || 0);
			const numDamaged = Math.max(0, Number(current.damagedQuantity) || 0);

			if (field === "receivedQuantity") {
				current.receivedQuantity = numReceived;
				current.acceptedQuantity = Math.max(
					0,
					numReceived - (numRejected + numDamaged),
				);
				current.isVerified = numReceived > 0;
			} else if (field === "acceptedQuantity") {
				current.acceptedQuantity = numAccepted;
				// Total received automatically syncs to accepted + damaged + rejected
				current.receivedQuantity = numAccepted + numDamaged + numRejected;
				current.isVerified = current.receivedQuantity > 0;
			} else if (field === "damagedQuantity" || field === "rejectedQuantity") {
				current.damagedQuantity = numDamaged;
				current.rejectedQuantity = numRejected;

				const badTotal = numDamaged + numRejected;
				// If total bad items plus currently accepted exceeds previous received,
				// auto-expand received so acceptedQuantity is NOT wiped out to zero!
				if (numReceived < numAccepted + badTotal) {
					current.receivedQuantity = numAccepted + badTotal;
				} else {
					// Received count was high enough, calculate accepted as remainder
					current.acceptedQuantity = Math.max(0, numReceived - badTotal);
				}
				current.isVerified = current.receivedQuantity > 0;
			}

			updated[index] = current;
			return updated;
		});
	};

	// Remove an extra item
	const handleRemoveLineItem = (index: number) => {
		setLineItems((prev) => prev.filter((_, i) => i !== index));
		toast.info("Extra item removed from receipt queue.");
	};

	// Add Extra Item submission
	const handleAddExtraItem = () => {
		if (itemMode === "catalog") {
			const catProd = catalogProducts?.find(
				(p) => String(p.id) === selectedCatalogProductId,
			);
			if (!catProd) {
				toast.error("Please select a catalog product.");
				return;
			}

			const newItem: ReceivingLineItem = {
				key: `extra-cat-${Date.now()}`,
				productId: catProd.id,
				productName: catProd.name,
				productSku: catProd.sku || `SKU-${catProd.id}`,
				orderedQuantity: 0,
				receivedQuantity: Number(newItemQty) || 1,
				acceptedQuantity: Number(newItemQty) || 1,
				rejectedQuantity: 0,
				damagedQuantity: 0,
				unitCost:
					Number(newItemCost) || Number(catProd.baseProcurementPrice) || 0,
				batchNumber: newItemBatch || `B-${Date.now().toString().slice(-4)}`,
				inspectionNotes:
					newItemNotes || "Extra unlisted item delivered by supplier",
				isVerified: true,
				isExtraItem: true,
			};

			setLineItems((prev) => [...prev, newItem]);
			toast.success(`Extra item "${catProd.name}" added to receiving queue.`);
		} else {
			if (!customItemName.trim()) {
				toast.error("Please enter a product name.");
				return;
			}

			const autoSku =
				customItemSku.trim() || `SKU-SUPP-${Date.now().toString().slice(-5)}`;

			const newItem: ReceivingLineItem = {
				key: `extra-custom-${Date.now()}`,
				productName: customItemName.trim(),
				productSku: autoSku,
				customCategory: customItemCategory.trim(),
				customUnit: customItemUnit.trim(),
				orderedQuantity: 0,
				receivedQuantity: Number(newItemQty) || 1,
				acceptedQuantity: Number(newItemQty) || 1,
				rejectedQuantity: 0,
				damagedQuantity: 0,
				unitCost: Number(newItemCost) || 0,
				batchNumber: newItemBatch || `B-${Date.now().toString().slice(-4)}`,
				inspectionNotes:
					newItemNotes || "Brand new supplier product added at gate",
				isVerified: true,
				isExtraItem: true,
			};

			setLineItems((prev) => [...prev, newItem]);
			toast.success(
				`New product "${customItemName.trim()}" added to receiving queue and catalog!`,
			);
		}

		// Reset modal fields
		setSelectedCatalogProductId("");
		setCustomItemName("");
		setCustomItemSku("");
		setNewItemQty(1);
		setNewItemCost(0);
		setNewItemBatch("");
		setNewItemNotes("");
		setIsAddItemModalOpen(false);
	};

	// Save changed supplier
	const handleConfirmSupplierChange = () => {
		const supIdNum = Number.parseInt(selectedSupplierId, 10);
		if (!supIdNum || supIdNum <= 0) {
			toast.error("Please select a valid supplier/company.");
			return;
		}
		updateSupplierMutation.mutate({
			purchaseId: resolvedPoId,
			supplierId: supIdNum,
		});
	};

	// Confirm delete/cancel order
	const handleConfirmDelete = () => {
		if (!deleteReason.trim()) {
			toast.error(
				"Please enter a mandatory reason for deleting/cancelling this order.",
			);
			return;
		}
		deletePOMutation.mutate({
			purchaseId: resolvedPoId,
			reason: deleteReason.trim(),
		});
	};

	// Submit complete Goods Receipt
	const handleSubmitReceipt = () => {
		const verifiedItems = lineItems.filter(
			(it) => it.isVerified && it.receivedQuantity > 0,
		);

		if (verifiedItems.length === 0) {
			toast.error(
				"Please verify and enter received quantities for at least one item before posting the receipt.",
			);
			return;
		}

		recordReceiptMutation.mutate({
			purchaseId: resolvedPoId,
			deliveryNoteNumber: deliveryNoteNumber || undefined,
			vehicleNumber: vehicleNumber || undefined,
			notes: gateNotes || undefined,
			items: verifiedItems.map((it) => ({
				purchaseItemId: it.purchaseItemId,
				productId: it.productId,
				customProductName:
					it.isExtraItem && !it.productId ? it.productName : undefined,
				customSku: it.isExtraItem && !it.productId ? it.productSku : undefined,
				customCategory: it.customCategory,
				customUnit: it.customUnit,
				orderedQuantity: it.orderedQuantity,
				receivedQuantity: it.receivedQuantity,
				acceptedQuantity: it.acceptedQuantity,
				rejectedQuantity: it.rejectedQuantity,
				damagedQuantity: it.damagedQuantity,
				shortageQuantity: Math.max(0, it.orderedQuantity - it.receivedQuantity),
				unitCost: it.unitCost,
				batchNumber: it.batchNumber || undefined,
				inspectionNotes: it.inspectionNotes || undefined,
			})),
		});
	};

	// Calculations
	const totals = useMemo(() => {
		let totalOrdered = 0;
		let totalReceived = 0;
		let totalAccepted = 0;
		let totalDamaged = 0;
		let totalRejected = 0;
		let totalAcceptedValue = 0;

		for (const it of lineItems) {
			totalOrdered += it.orderedQuantity;
			totalReceived += it.receivedQuantity;
			totalAccepted += it.acceptedQuantity;
			totalDamaged += it.damagedQuantity;
			totalRejected += it.rejectedQuantity;
			totalAcceptedValue += it.acceptedQuantity * it.unitCost;
		}

		return {
			totalOrdered,
			totalReceived,
			totalAccepted,
			totalDamaged,
			totalRejected,
			totalAcceptedValue,
		};
	}, [lineItems]);

	if (poLoading) {
		return (
			<div className="flex h-96 flex-col items-center justify-center gap-3">
				<Loader2Icon className="h-8 w-8 animate-spin text-emerald-600" />
				<p className="font-medium text-muted-foreground text-sm">
					Loading Purchase Order #{rawParam} receiving console...
				</p>
			</div>
		);
	}

	if (poError || !po) {
		return (
			<div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
				<AlertCircleIcon className="h-12 w-12 text-destructive" />
				<div>
					<h2 className="font-bold text-xl">Purchase Order Not Found</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						The requested order #{rawParam} does not exist or may have been deleted.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/procurement/incoming">
						<ArrowLeftIcon className="mr-2 h-4 w-4" />
						Back to Inbound Shipments
					</Link>
				</Button>
			</div>
		);
	}

	const isCompleted = po.receiving_status === "received";

	return (
		<PageTransition>
			<div className="space-y-6 pb-12">
				{/* Top Navigation & Status Bar */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<div className="flex items-center gap-2 font-semibold text-muted-foreground text-xs">
							<Link
								href="/procurement/incoming"
								className="flex items-center gap-1 transition-colors hover:text-foreground"
							>
								<ArrowLeftIcon className="h-3.5 w-3.5" />
								Inbound Queue
							</Link>
							<ChevronRightIcon className="h-3 w-3" />
							<span className="text-foreground">
								Order Inspection & Receiving
							</span>
						</div>
						<div className="flex flex-wrap items-center gap-3 pt-1">
							<h1 className="font-extrabold text-2xl text-foreground tracking-tight sm:text-3xl">
								{po.po_number || `PO-${po.id}`}
							</h1>
							<Badge
								variant="outline"
								className={
									isCompleted
										? "border-emerald-500/30 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400"
										: po.receiving_status === "partial"
											? "border-blue-500/30 bg-blue-500/10 font-bold text-blue-600 dark:text-blue-400"
											: "border-amber-500/30 bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400"
								}
							>
								{po.receiving_status?.toUpperCase() || "PENDING"}
							</Badge>
							{po.status === "cancelled" && (
								<Badge variant="destructive">CANCELLED</Badge>
							)}
						</div>
						<p className="text-muted-foreground text-xs sm:text-sm">
							Supplier:{" "}
							<span className="font-semibold text-foreground">
								{po.supplier_name || "Unknown Supplier"}
							</span>{" "}
							&bull; Expected:{" "}
							<span className="font-semibold text-foreground">
								{po.expected_delivery_date
									? new Date(po.expected_delivery_date).toLocaleDateString()
									: "Not scheduled"}
							</span>
						</p>
					</div>

					{/* Action Controls */}
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsSupplierModalOpen(true)}
							className="gap-2 border-border/80 font-semibold text-xs hover:bg-muted"
							disabled={isCompleted}
						>
							<Building2Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
							Change Supplier / Company
						</Button>

						<Button
							variant="destructive"
							size="sm"
							onClick={() => {
								setDeleteReason("");
								setIsDeleteModalOpen(true);
							}}
							className="gap-2 font-semibold text-xs"
							disabled={isCompleted}
						>
							<Trash2Icon className="h-3.5 w-3.5" />
							Delete / Reject Order
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsAddItemModalOpen(true)}
							className="gap-2 border-emerald-500/40 bg-emerald-500/10 font-semibold text-emerald-700 text-xs hover:bg-emerald-500/20 dark:text-emerald-400"
							disabled={isCompleted}
						>
							<PackagePlusIcon className="h-3.5 w-3.5" />+ Add Extra Supplier
							Item
						</Button>
					</div>
				</div>

				{/* Delivery & Gate Details Card */}
				<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
					<CardHeader className="border-border/60 border-b p-4">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle className="flex items-center gap-2 font-bold text-base text-foreground">
									<TruckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
									Dock Arrival & Delivery Note Details
								</CardTitle>
								<CardDescription className="mt-0.5 text-muted-foreground text-xs">
									Enter delivery challan and gate inspection info prior to
									inventory posting.
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleMarkAllVerified(true)}
									className="h-8 font-medium text-xs"
									disabled={isCompleted}
								>
									Mark All Verified
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleMarkAllVerified(false)}
									className="h-8 font-medium text-xs"
									disabled={isCompleted}
								>
									Uncheck All
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">
								Delivery Note / Challan #
							</Label>
							<Input
								value={deliveryNoteNumber}
								onChange={(e) => setDeliveryNoteNumber(e.target.value)}
								placeholder="e.g. DN-98432"
								disabled={isCompleted}
								className="h-9 bg-background/50 text-xs"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">
								Vehicle / Driver Reg #
							</Label>
							<Input
								value={vehicleNumber}
								onChange={(e) => setVehicleNumber(e.target.value)}
								placeholder="e.g. MH-12-AB-3421"
								disabled={isCompleted}
								className="h-9 bg-background/50 text-xs"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">
								Dock Inspection Remarks
							</Label>
							<Input
								value={gateNotes}
								onChange={(e) => setGateNotes(e.target.value)}
								placeholder="e.g. Physical seal intact, goods inspected"
								disabled={isCompleted}
								className="h-9 bg-background/50 text-xs"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Items Receiving Checklist */}
				<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
					<CardHeader className="border-border/60 border-b p-4">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle className="flex items-center gap-2 font-bold text-base text-foreground">
									<PackageCheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
									Physical Goods Receiving Checklist ({lineItems.length} Items)
								</CardTitle>
								<CardDescription className="mt-0.5 text-muted-foreground text-xs">
									Tick each item delivered by the supplier. Verify actual
									received count vs ordered count and enter damaged/rejected
									units.
								</CardDescription>
							</div>
							<div className="rounded-md bg-muted/60 px-3 py-1.5 font-semibold text-muted-foreground text-xs">
								Accepted Units:{" "}
								<span className="font-bold text-emerald-600 dark:text-emerald-400">
									{totals.totalAccepted}
								</span>{" "}
								/ {totals.totalOrdered} Ordered
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-muted/40">
									<TableRow>
										<TableHead className="w-12 text-center">
											<div className="flex items-center justify-center">
												<Checkbox
													checked={
														lineItems.length > 0 &&
														lineItems.every((it) => it.isVerified)
													}
													onCheckedChange={(checked) =>
														handleMarkAllVerified(Boolean(checked))
													}
													disabled={isCompleted || lineItems.length === 0}
													title="Tick / Untick All Items"
													aria-label="Tick All Items"
													className="h-4 w-4 cursor-pointer"
												/>
											</div>
										</TableHead>
										<TableHead className="min-w-[180px]">
											Product / SKU
										</TableHead>
										<TableHead className="w-24 text-center">Ordered</TableHead>
										<TableHead className="w-28 text-center">Received</TableHead>
										<TableHead className="w-28 text-center">Accepted</TableHead>
										<TableHead className="w-24 text-center">Damaged</TableHead>
										<TableHead className="w-24 text-center">Rejected</TableHead>
										<TableHead className="min-w-[120px]">Batch #</TableHead>
										<TableHead className="min-w-[140px]">
											Unit Cost (₹)
										</TableHead>
										<TableHead className="w-16 text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{lineItems.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={10}
												className="h-28 text-center text-muted-foreground text-sm"
											>
												No line items found for this purchase order. Click "+
												Add Extra Supplier Item" to add delivered goods.
											</TableCell>
										</TableRow>
									) : (
										lineItems.map((item, idx) => {
											const isShort =
												item.receivedQuantity < item.orderedQuantity;
											const hasDamage =
												item.damagedQuantity > 0 || item.rejectedQuantity > 0;

											return (
												<TableRow
													key={item.key}
													className={`transition-colors ${
														!item.isVerified
															? "bg-muted/20 opacity-60"
															: item.isExtraItem
																? "bg-emerald-500/5 hover:bg-emerald-500/10"
																: "hover:bg-muted/40"
													}`}
												>
													{/* Checkbox Tick */}
													<TableCell
														className="text-center cursor-pointer select-none"
														onClick={(e) => {
															if (!isCompleted && !(e.target as HTMLElement).closest("input")) {
																handleToggleVerify(idx);
															}
														}}
													>
														<div className="flex items-center justify-center">
															<Checkbox
																checked={Boolean(item.isVerified)}
																onCheckedChange={(checked) =>
																	handleToggleVerify(idx, Boolean(checked))
																}
																disabled={isCompleted}
																className="h-5 w-5 cursor-pointer"
																aria-label={`Tick ${item.productName}`}
															/>
														</div>
													</TableCell>

													{/* Product info */}
													<TableCell>
														<div className="space-y-0.5">
															<div className="flex flex-wrap items-center gap-1.5">
																<p className="font-semibold text-foreground text-xs">
																	{item.productName}
																</p>
																{item.isExtraItem && (
																	<Badge
																		variant="outline"
																		className="h-4 border-purple-500/30 bg-purple-500/10 px-1 font-bold text-[9px] text-purple-600 dark:text-purple-400"
																	>
																		EXTRA ITEM
																	</Badge>
																)}
																{isShort &&
																	!item.isExtraItem &&
																	item.isVerified && (
																		<Badge
																			variant="outline"
																			className="h-4 border-amber-500/30 bg-amber-500/10 px-1 font-bold text-[9px] text-amber-600 dark:text-amber-400"
																		>
																			SHORTAGE
																		</Badge>
																	)}
																{hasDamage && item.isVerified && (
																	<Badge
																		variant="outline"
																		className="h-4 border-red-500/30 bg-red-500/10 px-1 font-bold text-[9px] text-red-600 dark:text-red-400"
																	>
																		DAMAGE / REJECT
																	</Badge>
																)}
															</div>
															<p className="font-mono text-[11px] text-muted-foreground">
																SKU: {item.productSku}
															</p>
														</div>
													</TableCell>

													{/* Ordered Quantity */}
													<TableCell className="text-center font-bold font-mono text-muted-foreground text-xs">
														{item.orderedQuantity}
													</TableCell>

													{/* Received Quantity Input */}
													<TableCell className="text-center">
														<Input
															type="number"
															min={0}
															value={item.receivedQuantity}
															onChange={(e) =>
																handleItemChange(
																	idx,
																	"receivedQuantity",
																	Number(e.target.value),
																)
															}
															disabled={!item.isVerified || isCompleted}
															className="mx-auto h-8 w-20 bg-background/50 text-center font-bold text-xs"
														/>
													</TableCell>

													{/* Accepted Quantity */}
													<TableCell className="text-center">
														<Input
															type="number"
															min={0}
															value={item.acceptedQuantity}
															onChange={(e) =>
																handleItemChange(
																	idx,
																	"acceptedQuantity",
																	Number(e.target.value),
																)
															}
															disabled={!item.isVerified || isCompleted}
															className="mx-auto h-8 w-20 border-emerald-500/30 bg-emerald-500/10 text-center font-bold text-emerald-700 text-xs dark:text-emerald-300"
														/>
													</TableCell>

													{/* Damaged Quantity */}
													<TableCell className="text-center">
														<Input
															type="number"
															min={0}
															value={item.damagedQuantity}
															onChange={(e) =>
																handleItemChange(
																	idx,
																	"damagedQuantity",
																	Number(e.target.value),
																)
															}
															disabled={!item.isVerified || isCompleted}
															className="mx-auto h-8 w-18 border-amber-500/30 bg-amber-500/10 text-center text-amber-700 text-xs dark:text-amber-400"
														/>
													</TableCell>

													{/* Rejected Quantity */}
													<TableCell className="text-center">
														<Input
															type="number"
															min={0}
															value={item.rejectedQuantity}
															onChange={(e) =>
																handleItemChange(
																	idx,
																	"rejectedQuantity",
																	Number(e.target.value),
																)
															}
															disabled={!item.isVerified || isCompleted}
															className="mx-auto h-8 w-18 border-red-500/30 bg-red-500/10 text-center text-red-700 text-xs dark:text-red-400"
														/>
													</TableCell>

													{/* Batch Number */}
													<TableCell>
														<Input
															value={item.batchNumber}
															onChange={(e) =>
																handleItemChange(
																	idx,
																	"batchNumber",
																	e.target.value,
																)
															}
															disabled={!item.isVerified || isCompleted}
															placeholder="Batch #"
															className="h-8 bg-background/50 font-mono text-xs"
														/>
													</TableCell>

													{/* Unit Cost */}
													<TableCell>
														<div className="flex items-center gap-1 font-mono font-semibold text-xs">
															<span>₹</span>
															<Input
																type="number"
																step="0.01"
																min={0}
																value={item.unitCost}
																onChange={(e) =>
																	handleItemChange(
																		idx,
																		"unitCost",
																		Number(e.target.value),
																	)
																}
																disabled={!item.isExtraItem || isCompleted}
																className="h-8 w-20 bg-background/50 text-xs"
															/>
														</div>
													</TableCell>

													{/* Delete action for extra items */}
													<TableCell className="text-right">
														{item.isExtraItem && !isCompleted ? (
															<Button
																size="icon"
																variant="ghost"
																onClick={() => handleRemoveLineItem(idx)}
																className="h-7 w-7 text-muted-foreground hover:text-destructive"
																title="Remove extra item"
															>
																<Trash2Icon className="h-3.5 w-3.5" />
															</Button>
														) : (
															<span className="font-mono text-[10px] text-muted-foreground">
																#{idx + 1}
															</span>
														)}
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{/* Summary & Post Receipt Footer */}
				<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
					<CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
							<div>
								<span className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
									Total Ordered
								</span>
								<span className="font-bold text-base text-foreground">
									{totals.totalOrdered} units
								</span>
							</div>

							<div>
								<span className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
									Total Received
								</span>
								<span className="font-bold text-base text-blue-600 dark:text-blue-400">
									{totals.totalReceived} units
								</span>
							</div>

							<div>
								<span className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
									Accepted for Stock
								</span>
								<span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
									{totals.totalAccepted} units
								</span>
							</div>

							<div>
								<span className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
									Damaged / Rejected
								</span>
								<span className="font-bold text-base text-red-600 dark:text-red-400">
									{totals.totalDamaged + totals.totalRejected} units
								</span>
							</div>

							<div>
								<span className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
									Accepted Inventory Value
								</span>
								<span className="font-bold text-base text-foreground">
									₹
									{totals.totalAcceptedValue.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Button asChild variant="outline" size="sm">
								<Link href="/procurement/incoming">Cancel</Link>
							</Button>

							<Button
								size="sm"
								onClick={handleSubmitReceipt}
								disabled={
									recordReceiptMutation.isPending ||
									isCompleted ||
									totals.totalReceived === 0
								}
								className="h-9 gap-2 bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700"
							>
								{recordReceiptMutation.isPending ? (
									<>
										<Loader2Icon className="h-4 w-4 animate-spin" />
										Posting Receipt...
									</>
								) : (
									<>
										<CheckCircle2Icon className="h-4 w-4" />
										Post Goods Receipt Note (GRN)
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* ─────────────────────────────────────────────────────────────────── */}
				{/* GOODS RECEIPT & INSPECTION HISTORY */}
				{/* ─────────────────────────────────────────────────────────────────── */}
				{po.grns && po.grns.length > 0 && (
					<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
						<CardHeader className="border-border/60 border-b p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<PackageCheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
									<div>
										<CardTitle className="font-bold text-base text-foreground">
											Goods Receipt & Quality Inspection History ({po.grns.length})
										</CardTitle>
										<CardDescription className="text-muted-foreground text-xs">
											Saved warehouse receiving logs, batches, and inspected damaged / rejected breakdown
										</CardDescription>
									</div>
								</div>
								<Badge
									variant="outline"
									className="border-emerald-500/30 bg-emerald-500/10 font-bold text-emerald-600 text-xs dark:text-emerald-400"
								>
									{po.grns.length} Receipt{po.grns.length > 1 ? "s" : ""} Recorded
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-6 p-4">
							{po.grns.map((grn: any) => {
								const grnItems = grn.items || [];
								const totalRcvd = grnItems.reduce(
									(acc: number, it: any) =>
										acc + (Number(it.received_quantity) || 0),
									0,
								);
								const totalAcc = grnItems.reduce(
									(acc: number, it: any) =>
										acc + (Number(it.accepted_quantity) || 0),
									0,
								);
								const totalDmg = grnItems.reduce(
									(acc: number, it: any) =>
										acc + (Number(it.damaged_quantity) || 0),
									0,
								);
								const totalRej = grnItems.reduce(
									(acc: number, it: any) =>
										acc + (Number(it.rejected_quantity) || 0),
									0,
								);

								return (
									<div
										key={grn.id}
										className="space-y-3 rounded-lg border border-border/70 bg-background/60 p-4"
									>
										<div className="flex flex-wrap items-center justify-between gap-2 border-border/40 border-b pb-3">
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-bold font-mono text-foreground text-sm">
													{grn.grn_number}
												</span>
												<Badge
													variant="outline"
													className={
														grn.status === "accepted"
															? "border-emerald-500/30 bg-emerald-500/10 font-bold text-[10px] text-emerald-600 dark:text-emerald-400"
															: "border-amber-500/30 bg-amber-500/10 font-bold text-[10px] text-amber-600 dark:text-amber-400"
													}
												>
													{(grn.status || "ACCEPTED").toUpperCase()}
												</Badge>
												<span className="text-muted-foreground text-xs">
													Received:{" "}
													<strong className="text-foreground">
														{grn.received_at
															? new Date(grn.received_at).toLocaleString()
															: "N/A"}
													</strong>
												</span>
												<span className="text-muted-foreground text-xs">
													By:{" "}
													<strong className="text-foreground">
														{grn.received_by || "Staff"}
													</strong>
												</span>
											</div>

											<div className="flex flex-wrap items-center gap-2 text-xs">
												{grn.delivery_note_number && (
													<span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
														Challan: {grn.delivery_note_number}
													</span>
												)}
												{grn.vehicle_number && (
													<span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
														Vehicle: {grn.vehicle_number}
													</span>
												)}
											</div>
										</div>

										{/* Items inspection table */}
										{grnItems.length > 0 ? (
											<div className="overflow-x-auto rounded border border-border/40">
												<Table>
													<TableHeader className="bg-muted/40">
														<TableRow>
															<TableHead className="text-xs">
																Product Line Item
															</TableHead>
															<TableHead className="text-center text-xs">
																Ordered
															</TableHead>
															<TableHead className="text-center text-xs">
																Delivered
															</TableHead>
															<TableHead className="text-center text-xs">
																Accepted (Stock+)
															</TableHead>
															<TableHead className="text-center text-xs">
																Damaged
															</TableHead>
															<TableHead className="text-center text-xs">
																Rejected
															</TableHead>
															<TableHead className="text-xs">Batch #</TableHead>
															<TableHead className="text-xs">
																Remarks / Notes
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{grnItems.map((gi: any) => (
															<TableRow key={gi.id} className="text-xs">
																<TableCell className="font-semibold text-foreground">
																	<div>{gi.product_name}</div>
																	<div className="font-mono text-[10px] text-muted-foreground">
																		{gi.product_sku}
																	</div>
																</TableCell>
																<TableCell className="text-center font-mono">
																	{Number(gi.ordered_quantity) || 0}
																</TableCell>
																<TableCell className="text-center font-bold font-mono text-blue-600 dark:text-blue-400">
																	{Number(gi.received_quantity) || 0}
																</TableCell>
																<TableCell className="text-center font-mono">
																	<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
																		{Number(gi.accepted_quantity) || 0}
																	</span>
																</TableCell>
																<TableCell className="text-center font-mono">
																	{Number(gi.damaged_quantity) > 0 ? (
																		<span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-bold text-amber-600 dark:text-amber-400">
																			{Number(gi.damaged_quantity)}
																		</span>
																	) : (
																		<span className="text-muted-foreground">
																			0
																		</span>
																	)}
																</TableCell>
																<TableCell className="text-center font-mono">
																	{Number(gi.rejected_quantity) > 0 ? (
																		<span className="rounded-full bg-red-500/10 px-2 py-0.5 font-bold text-red-600 dark:text-red-400">
																			{Number(gi.rejected_quantity)}
																		</span>
																	) : (
																		<span className="text-muted-foreground">
																			0
																		</span>
																	)}
																</TableCell>
																<TableCell className="font-mono text-[11px] text-foreground">
																	{gi.batch_number || "—"}
																</TableCell>
																<TableCell className="text-[11px] text-muted-foreground">
																	{gi.inspection_notes || "—"}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										) : (
											<p className="text-muted-foreground text-xs italic">
												No line items recorded for this receipt.
											</p>
										)}

										{grn.notes && (
											<div className="rounded bg-muted/40 p-2 text-muted-foreground text-xs">
												<strong className="text-foreground">
													Gate / Receiving Remarks:{" "}
												</strong>
												{grn.notes}
											</div>
										)}
									</div>
								);
							})}
						</CardContent>
					</Card>
				)}

				{/* ─────────────────────────────────────────────────────────────────── */}
				{/* MODAL 1: CHANGE SUPPLIER / COMPANY */}
				{/* ─────────────────────────────────────────────────────────────────── */}
				<Dialog
					open={isSupplierModalOpen}
					onOpenChange={setIsSupplierModalOpen}
				>
					<DialogContent className="max-w-md border-border/80 bg-card">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-foreground">
								<Building2Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								Change Supplier / Vendor
							</DialogTitle>
							<DialogDescription className="text-muted-foreground text-xs">
								Select an alternate supplier or sister company responsible for
								this delivery.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div className="space-y-1.5">
								<Label className="font-semibold text-xs">
									Current Supplier
								</Label>
								<div className="rounded-md bg-muted/60 p-2 font-bold text-foreground text-xs">
									{po.supplier_name || "None"}
								</div>
							</div>

							<div className="space-y-1.5">
								<Label className="font-semibold text-xs">
									Select New Supplier / Company
								</Label>
								<Select
									value={selectedSupplierId}
									onValueChange={setSelectedSupplierId}
								>
									<SelectTrigger className="h-9 bg-background/50 text-xs">
										<SelectValue placeholder="Choose supplier from list" />
									</SelectTrigger>
									<SelectContent>
										{suppliersList?.map((sup) => (
											<SelectItem
												key={sup.id}
												value={String(sup.id)}
												className="text-xs"
											>
												{sup.name} {sup.phone ? `(${sup.phone})` : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<DialogFooter className="gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsSupplierModalOpen(false)}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleConfirmSupplierChange}
								disabled={updateSupplierMutation.isPending}
								className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
							>
								{updateSupplierMutation.isPending
									? "Updating..."
									: "Save Supplier"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ─────────────────────────────────────────────────────────────────── */}
				{/* MODAL 2: DELETE / CANCEL ORDER WITH MANDATORY REASON */}
				{/* ─────────────────────────────────────────────────────────────────── */}
				<Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
					<DialogContent className="max-w-md border-border/80 bg-card">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-destructive">
								<AlertTriangleIcon className="h-5 w-5 text-destructive" />
								Delete / Reject Purchase Order
							</DialogTitle>
							<DialogDescription className="text-muted-foreground text-xs">
								Provide a mandatory reason why this order is being deleted or
								why delivery did not arrive.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-xs">
								<strong>Warning:</strong> Deleting will remove this order from
								the inbound receiving queue. If a Goods Receipt has already been
								posted, the order will be marked as cancelled.
							</div>

							<div className="space-y-1.5">
								<Label className="font-semibold text-foreground text-xs">
									Reason for Deletion / Rejection (Mandatory) *
								</Label>
								<Textarea
									rows={3}
									value={deleteReason}
									onChange={(e) => setDeleteReason(e.target.value)}
									placeholder="e.g. Order cancelled by supplier, shipment refused at gate due to damage, duplicate entry..."
									className="bg-background/50 text-xs"
								/>
							</div>
						</div>

						<DialogFooter className="gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsDeleteModalOpen(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={handleConfirmDelete}
								disabled={deletePOMutation.isPending || !deleteReason.trim()}
								className="font-semibold"
							>
								{deletePOMutation.isPending
									? "Processing..."
									: "Confirm Delete / Cancel"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ─────────────────────────────────────────────────────────────────── */}
				{/* MODAL 3: ADD EXTRA / UNLISTED ITEM FROM SUPPLIER */}
				{/* ─────────────────────────────────────────────────────────────────── */}
				<Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
					<DialogContent className="max-w-lg border-border/80 bg-card">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-foreground">
								<PackagePlusIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
								Add Extra / Unlisted Item From Supplier
							</DialogTitle>
							<DialogDescription className="text-muted-foreground text-xs">
								If the supplier delivered unexpected or bonus items, register
								them immediately into this goods receipt and inventory.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							{/* Item Mode Switch */}
							<div className="flex rounded-lg bg-muted/60 p-1">
								<button
									type="button"
									onClick={() => setItemMode("catalog")}
									className={`flex-1 rounded-md py-1.5 font-bold text-xs transition-all ${
										itemMode === "catalog"
											? "bg-background text-foreground shadow-xs"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Pick Existing Catalog Product
								</button>
								<button
									type="button"
									onClick={() => setItemMode("custom")}
									className={`flex-1 rounded-md py-1.5 font-bold text-xs transition-all ${
										itemMode === "custom"
											? "bg-background text-foreground shadow-xs"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									+ Create Brand New Item
								</button>
							</div>

							{itemMode === "catalog" ? (
								<div className="space-y-3">
									<div className="space-y-1.5">
										<Label className="font-semibold text-xs">
											Select Product from Catalog *
										</Label>
										<Select
											value={selectedCatalogProductId}
											onValueChange={(val) => {
												setSelectedCatalogProductId(val);
												const prod = catalogProducts?.find(
													(p) => String(p.id) === val,
												);
												if (prod) {
													setNewItemCost(
														Number(prod.baseProcurementPrice) || 0,
													);
												}
											}}
										>
											<SelectTrigger className="h-9 bg-background/50 text-xs">
												<SelectValue placeholder="Search / select product" />
											</SelectTrigger>
											<SelectContent>
												{catalogProducts?.map((p) => (
													<SelectItem
														key={p.id}
														value={String(p.id)}
														className="text-xs"
													>
														{p.name} (SKU: {p.sku || p.id}) &bull; ₹
														{p.baseProcurementPrice}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							) : (
								<div className="space-y-3">
									<div className="space-y-1.5">
										<Label className="font-semibold text-xs">
											Product Name *
										</Label>
										<Input
											value={customItemName}
											onChange={(e) => setCustomItemName(e.target.value)}
											placeholder="e.g. Premium Basmati Rice 5kg"
											className="h-9 bg-background/50 text-xs"
										/>
									</div>

									<div className="grid grid-cols-3 gap-3">
										<div className="space-y-1.5">
											<Label className="font-semibold text-xs">
												SKU (Optional)
											</Label>
											<Input
												value={customItemSku}
												onChange={(e) => setCustomItemSku(e.target.value)}
												placeholder="Auto-generated"
												className="h-9 bg-background/50 text-xs"
											/>
										</div>

										<div className="space-y-1.5">
											<Label className="font-semibold text-xs">Category</Label>
											<Input
												value={customItemCategory}
												onChange={(e) => setCustomItemCategory(e.target.value)}
												placeholder="General, Staples..."
												className="h-9 bg-background/50 text-xs"
											/>
										</div>

										<div className="space-y-1.5">
											<Label className="font-semibold text-xs">
												Unit of Measure
											</Label>
											<Input
												value={customItemUnit}
												onChange={(e) => setCustomItemUnit(e.target.value)}
												placeholder="pcs, kg, box"
												className="h-9 bg-background/50 text-xs"
											/>
										</div>
									</div>
								</div>
							)}

							<div className="grid grid-cols-2 gap-3 pt-1">
								<div className="space-y-1.5">
									<Label className="font-semibold text-xs">
										Quantity Delivered *
									</Label>
									<Input
										type="number"
										min={1}
										value={newItemQty}
										onChange={(e) => setNewItemQty(Number(e.target.value))}
										className="h-9 bg-background/50 text-xs"
									/>
								</div>

								<div className="space-y-1.5">
									<Label className="font-semibold text-xs">
										Unit Cost (₹) *
									</Label>
									<Input
										type="number"
										step="0.01"
										min={0}
										value={newItemCost}
										onChange={(e) => setNewItemCost(Number(e.target.value))}
										className="h-9 bg-background/50 text-xs"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="font-semibold text-xs">Batch / Lot #</Label>
									<Input
										value={newItemBatch}
										onChange={(e) => setNewItemBatch(e.target.value)}
										placeholder="e.g. B-9821"
										className="h-9 bg-background/50 font-mono text-xs"
									/>
								</div>

								<div className="space-y-1.5">
									<Label className="font-semibold text-xs">Notes</Label>
									<Input
										value={newItemNotes}
										onChange={(e) => setNewItemNotes(e.target.value)}
										placeholder="e.g. Extra promotion sample"
										className="h-9 bg-background/50 text-xs"
									/>
								</div>
							</div>
						</div>

						<DialogFooter className="gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsAddItemModalOpen(false)}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleAddExtraItem}
								className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
							>
								Add to Inspection Queue
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PageTransition>
	);
}
