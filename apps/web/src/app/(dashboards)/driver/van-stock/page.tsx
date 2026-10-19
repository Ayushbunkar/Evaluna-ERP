"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
	Truck,
	Package,
	RotateCcw,
	CheckCircle2,
	Clock,
	AlertCircle,
	FileText,
	ArrowRight,
	Box,
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

interface ReturnItemState {
	id: string;
	productName: string;
	sku: string;
	loadedQty: number;
	deliveredQty: number;
	returnedQty: number;
	returnReason: string;
}

export default function DriverVanStockPage() {
	const utils = trpc.useUtils();
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [activeItems, setActiveItems] = useState<ReturnItemState[]>([]);
	const [driverReturnNotes, setDriverReturnNotes] = useState("");

	// Queries
	const { data: dispatches = [], isLoading } = trpc.vanStock.getMyDispatches.useQuery();

	const { data: planDetail } = trpc.vanStock.getPlanDetail.useQuery(
		{ planId: selectedPlanId || "" },
		{ enabled: !!selectedPlanId }
	);

	// Mutations
	const submitReturnMutation = trpc.vanStock.submitReturnStock.useMutation({
		onSuccess: () => {
			toast.success("Van Return manifest submitted for Manager Verification!");
			setSelectedPlanId(null);
			utils.vanStock.getMyDispatches.invalidate();
		},
		onError: (err) => toast.error(err.message || "Failed to submit return"),
	});

	const handleOpenPlan = (plan: any) => {
		setSelectedPlanId(plan.id);
		setDriverReturnNotes(plan.driverReturnNotes || "");
		const mapped: ReturnItemState[] = (plan.items || []).map((it: any) => {
			const loaded = parseFloat(it.loadedQty || it.verifiedQty || it.plannedQty);
			const delivered = it.deliveredQty !== null && it.deliveredQty !== undefined
				? parseFloat(it.deliveredQty)
				: loaded;
			const returned = it.returnedQty !== null && it.returnedQty !== undefined
				? parseFloat(it.returnedQty)
				: Math.max(0, loaded - delivered);
			return {
				id: it.id,
				productName: it.product?.name || "Product",
				sku: it.product?.sku || "",
				loadedQty: loaded,
				deliveredQty: delivered,
				returnedQty: returned,
				returnReason: it.returnReason || "CUSTOMER_REJECTED",
			};
		});
		setActiveItems(mapped);
	};

	const handleDeliveredChange = (idx: number, del: number) => {
		const updated = [...activeItems];
		const loaded = updated[idx].loadedQty;
		updated[idx].deliveredQty = Math.max(0, del);
		updated[idx].returnedQty = Math.max(0, loaded - del);
		setActiveItems(updated);
	};

	const handleReturnedChange = (idx: number, ret: number) => {
		const updated = [...activeItems];
		const loaded = updated[idx].loadedQty;
		updated[idx].returnedQty = Math.max(0, ret);
		updated[idx].deliveredQty = Math.max(0, loaded - ret);
		setActiveItems(updated);
	};

	const handleReasonChange = (idx: number, reason: string) => {
		const updated = [...activeItems];
		updated[idx].returnReason = reason;
		setActiveItems(updated);
	};

	const handleSubmitReturn = () => {
		if (!selectedPlanId) return;

		submitReturnMutation.mutate({
			planId: selectedPlanId,
			notes: driverReturnNotes,
			items: activeItems.map((it) => ({
				planItemId: it.id,
				deliveredQty: it.deliveredQty,
				returnedQty: it.returnedQty,
				returnReason: it.returnedQty > 0 ? it.returnReason : undefined,
			})),
		});
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<Truck className="h-6 w-6 text-primary" />
						My Van Stock & Route Manifest
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						View active vehicle inventory, track items delivered to customers, and submit returned stock for warehouse reconciliation.
					</p>
				</div>
			</div>

			{/* Active Dispatches */}
			<Card className="border-emerald-200 dark:border-emerald-900/50">
				<CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20">
					<CardTitle className="text-base flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
						<Clock className="h-4 w-4 text-emerald-600" />
						Assigned Vehicle Dispatches ({dispatches.length})
					</CardTitle>
					<CardDescription>
						Vehicles and manifests currently under your responsibility.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-4">
					{isLoading ? (
						<div className="py-8 text-center text-xs text-muted-foreground">Loading your dispatches...</div>
					) : dispatches.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
							<div className="font-semibold text-sm text-foreground">No active dispatches found!</div>
							<div className="text-xs">You currently have no dispatched van stock assigned.</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{dispatches.map((plan: any) => (
								<Card
									key={plan.id}
									className={`border cursor-pointer transition-all hover:shadow-md ${
										plan.status === "DISPATCHED"
											? "border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20"
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
													plan.status === "DISPATCHED"
														? "bg-emerald-600 hover:bg-emerald-700"
														: plan.status === "PENDING_RETURN_VERIFICATION"
														? "bg-teal-600"
														: "bg-gray-600"
												}
											>
												{plan.status === "DISPATCHED"
													? "Active On Route"
													: plan.status === "PENDING_RETURN_VERIFICATION"
													? "Return Awaiting Approval"
													: plan.status}
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
											<span>Stock Items:</span>
											<span className="font-medium text-foreground">{plan.items?.length || 0}</span>
										</div>
										<Button
											size="sm"
											className="w-full mt-2 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
										>
											<Package className="h-3 w-3" />
											{plan.status === "DISPATCHED"
												? "Manage Van Stock & Returns"
												: "View Manifest"}
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Manage / Return Dialog */}
			<Dialog
				open={!!selectedPlanId}
				onOpenChange={(open) => {
					if (!open) setSelectedPlanId(null);
				}}
			>
				<DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-6">
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle className="text-lg font-bold flex items-center gap-2">
								<Box className="h-5 w-5 text-primary" />
								Van Manifest: {planDetail?.vehicle?.registrationNumber} ({planDetail?.planCode || planDetail?.planNumber})
							</DialogTitle>
							<Badge
								className={
									planDetail?.status === "DISPATCHED"
										? "bg-emerald-600"
										: "bg-teal-600"
								}
							>
								{planDetail?.status}
							</Badge>
						</div>
						<DialogDescription className="text-xs">
							Update delivered vs returned stock quantities at trip end.
						</DialogDescription>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto my-3 border rounded-lg">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted text-muted-foreground font-semibold border-b sticky top-0">
								<tr>
									<th className="p-2.5">Product & SKU</th>
									<th className="p-2.5 text-center">Loaded In Van</th>
									<th className="p-2.5 text-center">Delivered Qty</th>
									<th className="p-2.5 text-center bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200">
										Returned Qty
									</th>
									<th className="p-2.5">Return Reason</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{activeItems.map((item, idx) => (
									<tr key={item.id} className="hover:bg-muted/30">
										<td className="p-2.5">
											<div className="font-semibold text-foreground">{item.productName}</div>
											<div className="text-[11px] font-mono text-muted-foreground">{item.sku}</div>
										</td>
										<td className="p-2.5 text-center font-mono font-bold text-foreground">
											{item.loadedQty}
										</td>
										<td className="p-2.5 text-center">
											<Input
												type="number"
												min="0"
												max={item.loadedQty}
												step="any"
												value={item.deliveredQty}
												disabled={planDetail?.status !== "DISPATCHED"}
												onChange={(e) =>
													handleDeliveredChange(idx, parseFloat(e.target.value) || 0)
												}
												className="w-20 text-center h-8 mx-auto font-bold text-xs"
											/>
										</td>
										<td className="p-2.5 text-center bg-teal-50/30 dark:bg-teal-950/20">
											<Input
												type="number"
												min="0"
												max={item.loadedQty}
												step="any"
												value={item.returnedQty}
												disabled={planDetail?.status !== "DISPATCHED"}
												onChange={(e) =>
													handleReturnedChange(idx, parseFloat(e.target.value) || 0)
												}
												className="w-20 text-center h-8 mx-auto font-bold text-xs border-teal-400"
											/>
										</td>
										<td className="p-2.5">
											{item.returnedQty > 0 ? (
												<select
													value={item.returnReason}
													disabled={planDetail?.status !== "DISPATCHED"}
													onChange={(e) => handleReasonChange(idx, e.target.value)}
													className="w-full text-xs rounded-md border border-input h-8 px-2"
												>
													<option value="CUSTOMER_REJECTED">Customer Rejected</option>
													<option value="CANCELLED_ORDER">Order Cancelled</option>
													<option value="EXCESS_VAN_STOCK">Excess / Unsold Van Stock</option>
													<option value="DAMAGED_ON_ROUTE">Damaged On Route</option>
													<option value="CUSTOMER_NOT_AVAILABLE">Customer Not Available</option>
												</select>
											) : (
												<span className="text-muted-foreground text-[11px] italic">
													Fully delivered
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
							Driver Return Notes / Route Summary
						</label>
						<Input
							placeholder="Return notes, cash reconciliation summary, route notes..."
							value={driverReturnNotes}
							disabled={planDetail?.status !== "DISPATCHED"}
							onChange={(e) => setDriverReturnNotes(e.target.value)}
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
						{planDetail?.status === "DISPATCHED" && (
							<Button
								onClick={handleSubmitReturn}
								disabled={submitReturnMutation.isPending}
								className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
							>
								<RotateCcw className="h-3.5 w-3.5" />
								Submit Van Stock Return for Manager Audit
							</Button>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
