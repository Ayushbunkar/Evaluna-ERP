"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
	Package,
	Truck,
	Clock,
	CheckCircle2,
	AlertTriangle,
	Play,
	Save,
	Search,
	FileText,
	Box,
	ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface PackRowState {
	id: string;
	productId: string;
	productName: string;
	sku: string;
	plannedQty: number;
	pickedQty: number;
	packedQty: number;
	damagedQty: number;
	packingStatus: "PACKED" | "SHORT" | "DAMAGED" | "REJECTED";
	discrepancyReason: string;
	notes: string;
	isAdditional: boolean;
	additionalReason?: string;
}

export default function PackerVanStockPage() {
	const utils = trpc.useUtils();
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [activeItems, setActiveItems] = useState<PackRowState[]>([]);
	const [packerNotes, setPackerNotes] = useState("");

	// Queries
	const { data: plansData, isLoading: loadingPlans } = trpc.vanStock.listPlans.useQuery({
		limit: 50,
	});

	const { data: planDetail } = trpc.vanStock.getPlanDetail.useQuery(
		{ planId: selectedPlanId || "" },
		{ enabled: !!selectedPlanId }
	);

	// Mutations
	const startPackingMutation = trpc.vanStock.startPacking.useMutation({
		onSuccess: () => {
			toast.success("Packing started for this van!");
			utils.vanStock.listPlans.invalidate();
			if (selectedPlanId) utils.vanStock.getPlanDetail.invalidate({ planId: selectedPlanId });
		},
		onError: (err) => toast.error(err.message || "Failed to start packing"),
	});

	const submitPackingMutation = trpc.vanStock.submitPacking.useMutation({
		onSuccess: () => {
			toast.success("Packing manifest submitted for Manager Verification!");
			setSelectedPlanId(null);
			utils.vanStock.listPlans.invalidate();
		},
		onError: (err) => toast.error(err.message || "Failed to submit packing"),
	});

	const handleOpenPlan = (plan: any) => {
		setSelectedPlanId(plan.id);
		setPackerNotes(plan.packerNotes || "");
		const mapped: PackRowState[] = (plan.items || []).map((it: any) => {
			const picked = it.pickedQty !== null && it.pickedQty !== undefined
				? parseFloat(it.pickedQty)
				: parseFloat(it.plannedQty);
			const packed = it.packedQty !== null && it.packedQty !== undefined
				? parseFloat(it.packedQty)
				: picked;
			const damaged = parseFloat(it.damagedQty) || 0;
			return {
				id: it.id,
				productId: it.productId,
				productName: it.product?.name || "Product",
				sku: it.product?.sku || "",
				plannedQty: parseFloat(it.plannedQty) || 0,
				pickedQty: picked,
				packedQty: packed,
				damagedQty: damaged,
				packingStatus: (it.packingStatus as any) || (packed === picked ? "PACKED" : "SHORT"),
				discrepancyReason: it.discrepancyReason || "",
				notes: it.notes || "",
				isAdditional: !!it.isAdditional,
				additionalReason: it.additionalReason,
			};
		});
		setActiveItems(mapped);
	};

	const handlePackedQtyChange = (idx: number, packed: number) => {
		const updated = [...activeItems];
		const picked = updated[idx].pickedQty;
		updated[idx].packedQty = Math.max(0, packed);
		if (packed < picked && updated[idx].damagedQty === 0) {
			updated[idx].packingStatus = "SHORT";
		} else if (packed === picked && updated[idx].damagedQty === 0) {
			updated[idx].packingStatus = "PACKED";
		}
		setActiveItems(updated);
	};

	const handleDamagedQtyChange = (idx: number, damaged: number) => {
		const updated = [...activeItems];
		updated[idx].damagedQty = Math.max(0, damaged);
		if (damaged > 0) {
			updated[idx].packingStatus = "DAMAGED";
		}
		setActiveItems(updated);
	};

	const handleStatusChange = (idx: number, status: "PACKED" | "SHORT" | "DAMAGED" | "REJECTED") => {
		const updated = [...activeItems];
		updated[idx].packingStatus = status;
		setActiveItems(updated);
	};

	const handleDiscrepancyReasonChange = (idx: number, reason: string) => {
		const updated = [...activeItems];
		updated[idx].discrepancyReason = reason;
		setActiveItems(updated);
	};

	const handleStartPack = () => {
		if (!selectedPlanId) return;
		startPackingMutation.mutate({ planId: selectedPlanId });
	};

	const handleSubmitPack = () => {
		if (!selectedPlanId) return;

		for (const it of activeItems) {
			if (
				(it.packingStatus === "SHORT" || it.packingStatus === "DAMAGED" || it.packingStatus === "REJECTED") &&
				!it.discrepancyReason.trim()
			) {
				toast.error(`Please provide a discrepancy reason for ${it.productName}`);
				return;
			}
		}

		submitPackingMutation.mutate({
			planId: selectedPlanId,
			packerNotes,
			items: activeItems.map((it) => ({
				planItemId: it.id,
				packedQty: it.packedQty,
				damagedQty: it.damagedQty,
				packingStatus: it.packingStatus,
				discrepancyReason: it.discrepancyReason || undefined,
				notes: it.notes || undefined,
			})),
		});
	};

	const packingQueue = (plansData?.items || []).filter(
		(p: any) => p.status === "PENDING_PACKING" || p.status === "PACKING_IN_PROGRESS"
	);

	return (
		<div className="space-y-6 pb-12">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<Box className="h-6 w-6 text-primary" />
						Van Stock Packing
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Inspect and pack picked goods for vehicle loading. Record physical packaging verification, damaged stock, and discrepancy causes.
					</p>
				</div>
			</div>

			{/* Active Packing Queue */}
			<Card className="border-purple-200 dark:border-purple-900/50">
				<CardHeader className="bg-purple-50/50 dark:bg-purple-950/20">
					<CardTitle className="text-base flex items-center gap-2 text-purple-900 dark:text-purple-200">
						<Clock className="h-4 w-4 text-purple-600" />
						Active Packing Queue ({packingQueue.length} Ready)
					</CardTitle>
					<CardDescription>
						Van stock manifests that have finished warehouse picking and await physical packaging.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-4">
					{loadingPlans ? (
						<div className="py-8 text-center text-xs text-muted-foreground">Loading queue...</div>
					) : packingQueue.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
							<div className="font-semibold text-sm text-foreground">Packing queue is clear!</div>
							<div className="text-xs">No pending van stock manifests ready for packing.</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{packingQueue.map((plan: any) => (
								<Card
									key={plan.id}
									className={`border cursor-pointer transition-all hover:shadow-md ${
										plan.status === "PACKING_IN_PROGRESS"
											? "border-purple-500 bg-purple-50/20 dark:bg-purple-950/20"
											: "border-border"
									}`}
									onClick={() => handleOpenPlan(plan)}
								>
									<CardHeader className="p-4 pb-2">
										<div className="flex items-center justify-between">
											<span className="font-mono font-bold text-xs text-primary">
												{plan.planNumber}
											</span>
											<Badge
												className={
													plan.status === "PACKING_IN_PROGRESS"
														? "bg-purple-600 hover:bg-purple-700"
														: "bg-purple-500 hover:bg-purple-600"
												}
											>
												{plan.status === "PACKING_IN_PROGRESS"
													? "Packing In Progress"
													: "Ready to Pack"}
											</Badge>
										</div>
										<CardTitle className="text-sm font-semibold flex items-center gap-1.5 mt-1">
											<Truck className="h-3.5 w-3.5 text-muted-foreground" />
											{plan.vehicle?.registrationNumber || "Van"}
										</CardTitle>
									</CardHeader>
									<CardContent className="p-4 pt-1 space-y-2 text-xs">
										<div className="flex justify-between text-muted-foreground">
											<span>Dispatch Date:</span>
											<span className="font-medium text-foreground">{plan.dispatchDate}</span>
										</div>
										<div className="flex justify-between text-muted-foreground">
											<span>Total Items:</span>
											<span className="font-medium text-foreground">{plan.items?.length || 0}</span>
										</div>
										{plan.pickerNotes && (
											<div className="text-[11px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-2 rounded text-amber-900 dark:text-amber-200">
												Picker Note: {plan.pickerNotes}
											</div>
										)}
										<Button
											size="sm"
											className="w-full mt-2 text-xs gap-1.5"
											variant={plan.status === "PACKING_IN_PROGRESS" ? "default" : "secondary"}
										>
											<Play className="h-3 w-3" />
											{plan.status === "PACKING_IN_PROGRESS"
												? "Continue Packing"
												: "Open Packing Station"}
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Packing Dialog Modal */}
			<Dialog
				open={!!selectedPlanId}
				onOpenChange={(open) => {
					if (!open) setSelectedPlanId(null);
				}}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle className="text-lg font-bold flex items-center gap-2">
								<Box className="h-5 w-5 text-primary" />
								Packing Station: {planDetail?.planCode || planDetail?.planNumber}
							</DialogTitle>
							<Badge variant="outline" className="font-mono">
								Rev: {planDetail?.revision}
							</Badge>
						</div>
						<DialogDescription className="text-xs">
							Vehicle:{" "}
							<span className="font-semibold text-foreground">
								{planDetail?.vehicle?.registrationNumber}
							</span>{" "}
							| Dispatch Date:{" "}
							<span className="font-semibold text-foreground">
								{planDetail?.dispatchDate}
							</span>
						</DialogDescription>
					</DialogHeader>

					{planDetail?.status === "PENDING_PACKING" && (
						<div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg flex items-center justify-between">
							<div className="text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
								<AlertTriangle className="h-4 w-4 text-purple-600" />
								This manifest is ready for packaging. Click "Start Packing" to claim.
							</div>
							<Button
								size="sm"
								onClick={handleStartPack}
								disabled={startPackingMutation.isPending}
								className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white"
							>
								<Play className="h-3.5 w-3.5" />
								Start Packing
							</Button>
						</div>
					)}

					<div className="flex-1 overflow-y-auto my-3 border rounded-lg">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted text-muted-foreground font-semibold border-b sticky top-0">
								<tr>
									<th className="p-2.5">Product</th>
									<th className="p-2.5 text-center">Picked Qty</th>
									<th className="p-2.5 text-center">Packed Qty</th>
									<th className="p-2.5 text-center">Damaged Qty</th>
									<th className="p-2.5 text-center">Status</th>
									<th className="p-2.5">Discrepancy Reason</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{activeItems.map((item, idx) => (
									<tr
										key={item.id}
										className={
											item.packingStatus !== "PACKED"
												? "bg-amber-50/50 dark:bg-amber-950/20"
												: "hover:bg-muted/30"
										}
									>
										<td className="p-2.5">
											<div className="font-semibold text-foreground">{item.productName}</div>
											<div className="text-[11px] font-mono text-muted-foreground">{item.sku}</div>
										</td>
										<td className="p-2.5 text-center font-mono font-bold text-foreground">
											{item.pickedQty}
										</td>
										<td className="p-2.5 text-center">
											<Input
												type="number"
												min="0"
												step="any"
												value={item.packedQty}
												disabled={planDetail?.status !== "PACKING_IN_PROGRESS"}
												onChange={(e) =>
													handlePackedQtyChange(idx, parseFloat(e.target.value) || 0)
												}
												className="w-18 text-center h-8 mx-auto font-bold text-xs"
											/>
										</td>
										<td className="p-2.5 text-center">
											<Input
												type="number"
												min="0"
												step="any"
												value={item.damagedQty}
												disabled={planDetail?.status !== "PACKING_IN_PROGRESS"}
												onChange={(e) =>
													handleDamagedQtyChange(idx, parseFloat(e.target.value) || 0)
												}
												className="w-18 text-center h-8 mx-auto font-bold text-xs text-rose-600"
											/>
										</td>
										<td className="p-2.5 text-center">
											<Select
												value={item.packingStatus}
												onValueChange={(val: any) => handleStatusChange(idx, val)}
												disabled={planDetail?.status !== "PACKING_IN_PROGRESS"}
											>
												<SelectTrigger className="w-28 h-8 text-xs mx-auto">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="PACKED">Packed</SelectItem>
													<SelectItem value="SHORT">Short</SelectItem>
													<SelectItem value="DAMAGED">Damaged</SelectItem>
													<SelectItem value="REJECTED">Rejected</SelectItem>
												</SelectContent>
											</Select>
										</td>
										<td className="p-2.5">
											{item.packingStatus !== "PACKED" ? (
												<Input
													placeholder="Reason for damage/shortage..."
													value={item.discrepancyReason}
													disabled={planDetail?.status !== "PACKING_IN_PROGRESS"}
													onChange={(e) =>
														handleDiscrepancyReasonChange(idx, e.target.value)
													}
													className="text-xs h-8 border-amber-300 dark:border-amber-800"
												/>
											) : (
												<span className="text-muted-foreground text-[11px] italic">
													Verified & packed
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
							Packer Packaging Notes
						</label>
						<Input
							placeholder="Condition of boxes, strapping, sealing tags..."
							value={packerNotes}
							disabled={planDetail?.status !== "PACKING_IN_PROGRESS"}
							onChange={(e) => setPackerNotes(e.target.value)}
							className="text-xs"
						/>
					</div>

					<div className="flex items-center justify-end gap-2 pt-4 border-t mt-2">
						<Button
							variant="outline"
							onClick={() => setSelectedPlanId(null)}
							className="text-xs"
						>
							Close
						</Button>
						<Button
							onClick={handleSubmitPack}
							disabled={
								submitPackingMutation.isPending ||
								planDetail?.status !== "PACKING_IN_PROGRESS"
							}
							className="text-xs gap-1.5 bg-primary hover:bg-primary/90"
						>
							<CheckCircle2 className="h-3.5 w-3.5" />
							Complete Packaging & Submit for Manager Verification
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
