"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
	PackageCheck,
	Truck,
	Clock,
	CheckCircle2,
	AlertTriangle,
	Play,
	Save,
	Search,
	FileText,
	Eye,
	XCircle,
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

interface PickRowState {
	id: string;
	productId: string;
	productName: string;
	sku: string;
	plannedQty: number;
	pickedQty: number;
	shortageQty: number;
	shortageReason: string;
	notes: string;
	isAdditional: boolean;
	additionalReason?: string;
}

export default function PickerVanStockPage() {
	const utils = trpc.useUtils();
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [filterSearch, setFilterSearch] = useState("");
	const [activeItems, setActiveItems] = useState<PickRowState[]>([]);
	const [pickerNotes, setPickerNotes] = useState("");

	// Queries
	const { data: plansData, isLoading: loadingPlans } = trpc.vanStock.listPlans.useQuery({
		limit: 50,
	});

	const { data: planDetail, isLoading: loadingDetail } = trpc.vanStock.getPlanDetail.useQuery(
		{ planId: selectedPlanId || "" },
		{ enabled: !!selectedPlanId }
	);

	// Mutations
	const startPickingMutation = trpc.vanStock.startPicking.useMutation({
		onSuccess: () => {
			toast.success("Picking started for this van!");
			utils.vanStock.listPlans.invalidate();
			if (selectedPlanId) utils.vanStock.getPlanDetail.invalidate({ planId: selectedPlanId });
		},
		onError: (err) => toast.error(err.message || "Failed to start picking"),
	});

	const submitPickingMutation = trpc.vanStock.submitPicking.useMutation({
		onSuccess: () => {
			toast.success("Van Stock picking completed and moved to Packer queue!");
			setSelectedPlanId(null);
			utils.vanStock.listPlans.invalidate();
		},
		onError: (err) => toast.error(err.message || "Failed to submit picking"),
	});

	const handleOpenPlan = (plan: any) => {
		setSelectedPlanId(plan.id);
		setPickerNotes(plan.pickerNotes || "");
		const mapped: PickRowState[] = (plan.items || []).map((it: any) => ({
			id: it.id,
			productId: it.productId,
			productName: it.product?.name || "Product",
			sku: it.product?.sku || "",
			plannedQty: parseFloat(it.plannedQty) || 0,
			pickedQty: it.pickedQty !== null && it.pickedQty !== undefined
				? parseFloat(it.pickedQty)
				: parseFloat(it.plannedQty),
			shortageQty: parseFloat(it.shortageQty) || 0,
			shortageReason: it.shortageReason || "",
			notes: it.notes || "",
			isAdditional: !!it.isAdditional,
			additionalReason: it.additionalReason,
		}));
		setActiveItems(mapped);
	};

	const handleQtyChange = (idx: number, picked: number) => {
		const updated = [...activeItems];
		const planned = updated[idx].plannedQty;
		updated[idx].pickedQty = Math.max(0, picked);
		if (picked < planned) {
			updated[idx].shortageQty = planned - picked;
		} else {
			updated[idx].shortageQty = 0;
			updated[idx].shortageReason = "";
		}
		setActiveItems(updated);
	};

	const handleShortageReasonChange = (idx: number, reason: string) => {
		const updated = [...activeItems];
		updated[idx].shortageReason = reason;
		setActiveItems(updated);
	};

	const handleStartPick = () => {
		if (!selectedPlanId) return;
		startPickingMutation.mutate({ planId: selectedPlanId });
	};

	const handleSubmitPick = () => {
		if (!selectedPlanId) return;

		// Validation: if there is shortage, reason must be provided
		for (const it of activeItems) {
			if (it.shortageQty > 0 && !it.shortageReason.trim()) {
				toast.error(`Please provide a shortage reason for ${it.productName}`);
				return;
			}
		}

		submitPickingMutation.mutate({
			planId: selectedPlanId,
			pickerNotes,
			items: activeItems.map((it) => ({
				planItemId: it.id,
				pickedQty: it.pickedQty,
				shortageQty: it.shortageQty,
				shortageReason: it.shortageReason || undefined,
				notes: it.notes || undefined,
			})),
		});
	};

	// Filter active picking queue vs past
	const pickingQueue = (plansData?.items || []).filter(
		(p: any) => p.status === "PENDING_PICKING" || p.status === "PICKING_IN_PROGRESS"
	);

	const otherPlans = (plansData?.items || []).filter(
		(p: any) => p.status !== "PENDING_PICKING" && p.status !== "PICKING_IN_PROGRESS"
	);

	return (
		<div className="space-y-6 pb-12">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<PackageCheck className="h-6 w-6 text-primary" />
						Van Stock Picking
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Fulfill vehicle stock plans, record actual picked quantities, log shortages, and reserve inventory.
					</p>
				</div>
			</div>

			{/* Active Picking Queue */}
			<Card className="border-amber-200 dark:border-amber-900/50">
				<CardHeader className="bg-amber-50/50 dark:bg-amber-950/20">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-200">
								<Clock className="h-4 w-4 text-amber-600" />
								Active Picking Queue ({pickingQueue.length} Pending)
							</CardTitle>
							<CardDescription>
								Van manifests released by Managers requiring warehouse picking.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-4">
					{loadingPlans ? (
						<div className="py-8 text-center text-xs text-muted-foreground">Loading queue...</div>
					) : pickingQueue.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
							<div className="font-semibold text-sm text-foreground">Picking queue is clear!</div>
							<div className="text-xs">No pending van stock plans at this time.</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{pickingQueue.map((plan: any) => (
								<Card
									key={plan.id}
									className={`border cursor-pointer transition-all hover:shadow-md ${
										plan.status === "PICKING_IN_PROGRESS"
											? "border-blue-400 bg-blue-50/20 dark:bg-blue-950/20"
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
													plan.status === "PICKING_IN_PROGRESS"
														? "bg-blue-600 hover:bg-blue-700"
														: "bg-amber-500 hover:bg-amber-600"
												}
											>
												{plan.status === "PICKING_IN_PROGRESS"
													? "In Progress"
													: "Ready to Pick"}
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
										{plan.notes && (
											<div className="text-[11px] bg-muted/60 p-2 rounded text-muted-foreground line-clamp-2">
												Note: {plan.notes}
											</div>
										)}
										<Button
											size="sm"
											className="w-full mt-2 text-xs gap-1.5"
											variant={plan.status === "PICKING_IN_PROGRESS" ? "default" : "secondary"}
										>
											{plan.status === "PICKING_IN_PROGRESS" ? (
												<>
													<Play className="h-3 w-3 fill-current" />
													Continue Picking
												</>
											) : (
												<>
													<Play className="h-3 w-3" />
													Start Picking
												</>
											)}
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Picking Dialog Modal */}
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
								<PackageCheck className="h-5 w-5 text-primary" />
								Picking Manifest: {planDetail?.planCode || planDetail?.planNumber}
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

					{planDetail?.status === "PENDING_PICKING" && (
						<div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex items-center justify-between">
							<div className="text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
								<AlertTriangle className="h-4 w-4 text-amber-600" />
								This plan is pending. Click "Start Picking" to claim and begin.
							</div>
							<Button
								size="sm"
								onClick={handleStartPick}
								disabled={startPickingMutation.isPending}
								className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
							>
								<Play className="h-3.5 w-3.5" />
								Start Picking
							</Button>
						</div>
					)}

					<div className="flex-1 overflow-y-auto my-3 border rounded-lg">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted text-muted-foreground font-semibold border-b sticky top-0">
								<tr>
									<th className="p-2.5">Product</th>
									<th className="p-2.5 text-center">Planned Qty</th>
									<th className="p-2.5 text-center">Actual Picked</th>
									<th className="p-2.5 text-center">Shortage</th>
									<th className="p-2.5">Shortage Reason</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{activeItems.map((item, idx) => (
									<tr
										key={item.id}
										className={
											item.shortageQty > 0
												? "bg-rose-50/50 dark:bg-rose-950/20"
												: "hover:bg-muted/30"
										}
									>
										<td className="p-2.5">
											<div className="font-semibold text-foreground">{item.productName}</div>
											<div className="text-[11px] font-mono text-muted-foreground">{item.sku}</div>
											{item.isAdditional && (
												<Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 text-[10px] mt-1">
													Extra: {item.additionalReason}
												</Badge>
											)}
										</td>
										<td className="p-2.5 text-center font-mono font-bold text-foreground">
											{item.plannedQty}
										</td>
										<td className="p-2.5 text-center">
											<Input
												type="number"
												min="0"
												max={item.plannedQty}
												step="any"
												value={item.pickedQty}
												disabled={planDetail?.status !== "PICKING_IN_PROGRESS"}
												onChange={(e) =>
													handleQtyChange(idx, parseFloat(e.target.value) || 0)
												}
												className="w-20 text-center h-8 mx-auto font-bold text-xs"
											/>
										</td>
										<td className="p-2.5 text-center font-mono font-semibold">
											{item.shortageQty > 0 ? (
												<span className="text-rose-600 dark:text-rose-400">
													-{item.shortageQty}
												</span>
											) : (
												<span className="text-emerald-600">0</span>
											)}
										</td>
										<td className="p-2.5">
											{item.shortageQty > 0 ? (
												<Input
													placeholder="Required reason for shortage..."
													value={item.shortageReason}
													disabled={planDetail?.status !== "PICKING_IN_PROGRESS"}
													onChange={(e) =>
														handleShortageReasonChange(idx, e.target.value)
													}
													className="text-xs h-8 border-rose-300 dark:border-rose-800"
												/>
											) : (
												<span className="text-muted-foreground text-[11px] italic">
													Fully picked
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
							Picker Notes / Exception Summary
						</label>
						<Input
							placeholder="Add general picking feedback or notes..."
							value={pickerNotes}
							disabled={planDetail?.status !== "PICKING_IN_PROGRESS"}
							onChange={(e) => setPickerNotes(e.target.value)}
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
							onClick={handleSubmitPick}
							disabled={
								submitPickingMutation.isPending ||
								planDetail?.status !== "PICKING_IN_PROGRESS"
							}
							className="text-xs gap-1.5 bg-primary hover:bg-primary/90"
						>
							<CheckCircle2 className="h-3.5 w-3.5" />
							Complete Picking & Send to Packing
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
