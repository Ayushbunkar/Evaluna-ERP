"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
	RotateCcw,
	Truck,
	CheckCircle2,
	Clock,
	AlertTriangle,
	FileText,
	Box,
	ShieldCheck,
	CheckSquare,
	History,
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

interface ReturnVerifyRowState {
	id: string;
	productName: string;
	sku: string;
	loadedQty: number;
	deliveredQty: number;
	returnedQty: number;
	verifiedReturnQty: number;
	returnReason?: string;
}

export default function VanReturnVerificationPage() {
	const utils = trpc.useUtils();
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [activeItems, setActiveItems] = useState<ReturnVerifyRowState[]>([]);
	const [managerNotes, setManagerNotes] = useState("");

	// Queries
	const { data: plansData, isLoading: loadingPlans } = trpc.vanStock.listPlans.useQuery({
		limit: 50,
	});

	const { data: planDetail } = trpc.vanStock.getPlanDetail.useQuery(
		{ planId: selectedPlanId || "" },
		{ enabled: !!selectedPlanId }
	);

	// Mutations
	const verifyReturnMutation = trpc.vanStock.verifyReturnStock.useMutation({
		onSuccess: (data) => {
			toast.success(
				"Van Stock return successfully verified! Warehouse inventory credited and vehicle released."
			);
			setSelectedPlanId(null);
			utils.vanStock.listPlans.invalidate();
		},
		onError: (err) => toast.error(err.message || "Failed to verify return"),
	});

	const handleOpenPlan = (plan: any) => {
		setSelectedPlanId(plan.id);
		setManagerNotes(plan.returnNotes || "");
		const mapped: ReturnVerifyRowState[] = (plan.items || []).map((it: any) => {
			const loaded = parseFloat(it.loadedQty || it.verifiedQty || it.plannedQty);
			const delivered = parseFloat(it.deliveredQty || 0);
			const returned = parseFloat(it.returnedQty || 0);
			const verifiedReturn = it.verifiedReturnQty !== null && it.verifiedReturnQty !== undefined
				? parseFloat(it.verifiedReturnQty)
				: returned;
			return {
				id: it.id,
				productName: it.product?.name || "Product",
				sku: it.product?.sku || "",
				loadedQty: loaded,
				deliveredQty: delivered,
				returnedQty: returned,
				verifiedReturnQty: verifiedReturn,
				returnReason: it.returnReason,
			};
		});
		setActiveItems(mapped);
	};

	const handleVerifiedReturnChange = (idx: number, qty: number) => {
		const updated = [...activeItems];
		updated[idx].verifiedReturnQty = Math.max(0, qty);
		setActiveItems(updated);
	};

	const handleConfirmReconciliation = () => {
		if (!selectedPlanId) return;

		verifyReturnMutation.mutate({
			planId: selectedPlanId,
			notes: managerNotes,
			items: activeItems.map((it) => ({
				planItemId: it.id,
				verifiedReturnQty: it.verifiedReturnQty,
			})),
		});
	};

	const returnQueue = (plansData?.items || []).filter(
		(p) => p.status === "PENDING_RETURN_VERIFICATION"
	);

	const reconciledPlans = (plansData?.items || []).filter(
		(p) => p.status === "RECONCILED"
	);

	return (
		<div className="space-y-6 pb-12">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<RotateCcw className="h-6 w-6 text-primary" />
						Van Stock Return Verification & Reconciliation
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Audit physical goods brought back from route deliveries, credit inventory to warehouse branch stock, and release vehicles back to available fleet.
					</p>
				</div>
			</div>

			{/* Pending Return Verification Queue */}
			<Card className="border-teal-200 dark:border-teal-900/50">
				<CardHeader className="bg-teal-50/50 dark:bg-teal-950/20">
					<CardTitle className="text-base flex items-center gap-2 text-teal-900 dark:text-teal-200">
						<Clock className="h-4 w-4 text-teal-600" />
						Returns Awaiting Physical Verification ({returnQueue.length})
					</CardTitle>
					<CardDescription>
						Delivery trips completed where drivers have checked in unsold or returned inventory.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-4">
					{loadingPlans ? (
						<div className="py-8 text-center text-xs text-muted-foreground">Loading queue...</div>
					) : returnQueue.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
							<div className="font-semibold text-sm text-foreground">All returns verified!</div>
							<div className="text-xs">No pending vehicle returns awaiting manager audit.</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{returnQueue.map((plan) => (
								<Card
									key={plan.id}
									className="border border-teal-300 dark:border-teal-800 cursor-pointer transition-all hover:shadow-md hover:border-teal-500"
									onClick={() => handleOpenPlan(plan)}
								>
									<CardHeader className="p-4 pb-2">
										<div className="flex items-center justify-between">
											<span className="font-mono font-bold text-xs text-primary">
												{plan.planNumber}
											</span>
											<Badge className="bg-teal-600 hover:bg-teal-700">
												Return Check-in
											</Badge>
										</div>
										<CardTitle className="text-sm font-semibold flex items-center gap-1.5 mt-1">
											<Truck className="h-3.5 w-3.5 text-muted-foreground" />
											{plan.vehicle?.registrationNumber || "Van"}
										</CardTitle>
									</CardHeader>
									<CardContent className="p-4 pt-1 space-y-2 text-xs">
										<div className="flex justify-between text-muted-foreground">
											<span>Driver:</span>
											<span className="font-medium text-foreground">
												{plan.driver?.name || "Assigned Driver"}
											</span>
										</div>
										<div className="flex justify-between text-muted-foreground">
											<span>Dispatch Date:</span>
											<span className="font-medium text-foreground">{plan.dispatchDate}</span>
										</div>
										{plan.driverReturnNotes && (
											<div className="text-[11px] bg-muted/60 p-2 rounded text-muted-foreground line-clamp-2">
												Driver Note: {plan.driverReturnNotes}
											</div>
										)}
										<Button
											size="sm"
											className="w-full mt-2 text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
										>
											<ShieldCheck className="h-3.5 w-3.5" />
											Verify Return & Credit Stock
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Return Verification Dialog */}
			<Dialog
				open={!!selectedPlanId}
				onOpenChange={(open) => {
					if (!open) setSelectedPlanId(null);
				}}
			>
				<DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-6">
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle className="text-lg font-bold flex items-center gap-2">
								<RotateCcw className="h-5 w-5 text-primary" />
								Van Stock Return Audit: {planDetail?.vehicle?.registrationNumber} ({planDetail?.planNumber})
							</DialogTitle>
							<Badge
								className={
									planDetail?.status === "RECONCILED"
										? "bg-gray-800"
										: "bg-teal-600"
								}
							>
								{planDetail?.status}
							</Badge>
						</div>
						<DialogDescription className="text-xs">
							Driver:{" "}
							<span className="font-semibold text-foreground">
								{planDetail?.driver?.name}
							</span>{" "}
							| Dispatch Date:{" "}
							<span className="font-semibold text-foreground">
								{planDetail?.dispatchDate}
							</span>
						</DialogDescription>
					</DialogHeader>

					{planDetail?.driverReturnNotes && (
						<div className="p-3 bg-muted/40 border rounded-lg text-xs">
							<span className="font-semibold text-foreground">Driver Route Summary:</span>{" "}
							<span className="text-muted-foreground">{planDetail.driverReturnNotes}</span>
						</div>
					)}

					{/* Return Reconciliation Table */}
					<div className="flex-1 overflow-y-auto my-3 border rounded-lg">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted text-muted-foreground font-semibold border-b sticky top-0">
								<tr>
									<th className="p-2.5">Product & SKU</th>
									<th className="p-2.5 text-center">Loaded in Van</th>
									<th className="p-2.5 text-center">Delivered</th>
									<th className="p-2.5 text-center">Driver Return</th>
									<th className="p-2.5 text-center bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200">
										Physical Verified Return *
									</th>
									<th className="p-2.5">Driver Reason</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{activeItems.map((item, idx) => (
									<tr key={item.id} className="hover:bg-muted/30">
										<td className="p-2.5">
											<div className="font-semibold text-foreground">{item.productName}</div>
											<div className="text-[11px] font-mono text-muted-foreground">{item.sku}</div>
										</td>
										<td className="p-2.5 text-center font-mono">{item.loadedQty}</td>
										<td className="p-2.5 text-center font-mono text-emerald-600 font-medium">
											{item.deliveredQty}
										</td>
										<td className="p-2.5 text-center font-mono text-teal-700 font-medium">
											{item.returnedQty}
										</td>
										<td className="p-2.5 text-center bg-teal-50/30 dark:bg-teal-950/20">
											<Input
												type="number"
												min="0"
												step="any"
												value={item.verifiedReturnQty}
												disabled={planDetail?.status !== "PENDING_RETURN_VERIFICATION"}
												onChange={(e) =>
													handleVerifiedReturnChange(idx, parseFloat(e.target.value) || 0)
												}
												className="w-20 text-center h-8 mx-auto font-bold text-xs border-teal-400"
											/>
										</td>
										<td className="p-2.5">
											{item.returnReason ? (
												<Badge variant="outline" className="text-[10px]">
													{item.returnReason.replace(/_/g, " ")}
												</Badge>
											) : (
												<span className="text-muted-foreground text-[11px]">-</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
							Manager Return / Restocking Audit Notes
						</label>
						<Input
							placeholder="Restocked bin locations, packaging conditions, notes..."
							value={managerNotes}
							disabled={planDetail?.status !== "PENDING_RETURN_VERIFICATION"}
							onChange={(e) => setManagerNotes(e.target.value)}
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
						{planDetail?.status === "PENDING_RETURN_VERIFICATION" && (
							<Button
								onClick={handleConfirmReconciliation}
								disabled={verifyReturnMutation.isPending}
								className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
							>
								<CheckCircle2 className="h-3.5 w-3.5" />
								Confirm Return, Credit Inventory & Release Van
							</Button>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Reconciled Plans History */}
			<Card className="mt-8">
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<History className="h-4 w-4 text-primary" />
						Reconciled Van Dispatches
					</CardTitle>
					<CardDescription>
						Archive of fully reconciled and closed van manifests.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{reconciledPlans.length === 0 ? (
						<div className="py-8 text-center text-xs text-muted-foreground">
							No reconciled dispatches yet.
						</div>
					) : (
						<div className="overflow-x-auto border rounded-lg">
							<table className="w-full text-left text-xs">
								<thead className="bg-muted text-muted-foreground font-semibold border-b">
									<tr>
										<th className="p-2.5">Plan Number</th>
										<th className="p-2.5">Vehicle</th>
										<th className="p-2.5">Driver</th>
										<th className="p-2.5">Dispatch Date</th>
										<th className="p-2.5 text-center">Items</th>
										<th className="p-2.5 text-center">Status</th>
										<th className="p-2.5 text-center">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{reconciledPlans.map((plan) => (
										<tr key={plan.id} className="hover:bg-muted/30">
											<td className="p-2.5 font-mono font-medium">{plan.planNumber}</td>
											<td className="p-2.5">{plan.vehicle?.registrationNumber}</td>
											<td className="p-2.5">{plan.driver?.name || "Driver"}</td>
											<td className="p-2.5">{plan.dispatchDate}</td>
											<td className="p-2.5 text-center font-mono">{plan.items?.length || 0}</td>
											<td className="p-2.5 text-center">
												<Badge className="bg-gray-800 text-white">Closed</Badge>
											</td>
											<td className="p-2.5 text-center">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleOpenPlan(plan)}
													className="h-7 text-xs"
												>
													View Archive
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
