"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
	Send,
	Truck,
	CheckCircle2,
	AlertTriangle,
	Clock,
	FileText,
	ShieldCheck,
	CheckSquare,
	User,
	XCircle,
	Package,
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

export default function DispatchApprovalPage() {
	const utils = trpc.useUtils();
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [dispatchNotes, setDispatchNotes] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");
	const [showRejectModal, setShowRejectModal] = useState(false);

	// Exception resolution state
	const [resolvingExceptionId, setResolvingExceptionId] = useState<string | null>(null);
	const [exceptionDecision, setExceptionDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
	const [exceptionResolutionNotes, setExceptionResolutionNotes] = useState("");

	// Queries
	const { data: plansData, isLoading: loadingPlans } = trpc.vanStock.listPlans.useQuery({
		status: "PENDING_FINAL_DISPATCH_APPROVAL",
		limit: 50,
	});

	const { data: planDetail } = trpc.vanStock.getPlanDetail.useQuery(
		{ planId: selectedPlanId || "" },
		{ enabled: !!selectedPlanId }
	);

	// Mutations
	const approveDispatchMutation = trpc.vanStock.approveFinalDispatch.useMutation({
		onSuccess: (data) => {
			toast.success(
				data.status === "DISPATCHED"
					? "Van dispatched successfully! Inventory deducted and ledger updated."
					: `Plan status updated to ${data.status}!`
			);
			setSelectedPlanId(null);
			setShowRejectModal(false);
			utils.vanStock.listPlans.invalidate();
		},
		onError: (err) => toast.error(err.message || "Failed to approve dispatch"),
	});

	const resolveExceptionMutation = trpc.vanStock.resolveException.useMutation({
		onSuccess: () => {
			toast.success("Exception decision saved!");
			setResolvingExceptionId(null);
			setExceptionResolutionNotes("");
			if (selectedPlanId) utils.vanStock.getPlanDetail.invalidate({ planId: selectedPlanId });
		},
		onError: (err) => toast.error(err.message || "Failed to resolve exception"),
	});

	const handleOpenPlan = (plan: any) => {
		setSelectedPlanId(plan.id);
		setDispatchNotes(plan.dispatchNotes || "");
	};

	const handleApproveDispatch = () => {
		if (!selectedPlanId) return;

		approveDispatchMutation.mutate({
			planId: selectedPlanId,
			decision: "APPROVE",
			notes: dispatchNotes,
		});
	};

	const handleRejectDispatch = () => {
		if (!selectedPlanId) return;
		if (!rejectionReason.trim()) {
			toast.error("Please provide a mandatory rejection reason");
			return;
		}

		approveDispatchMutation.mutate({
			planId: selectedPlanId,
			decision: "REJECT",
			rejectionReason,
			notes: dispatchNotes,
		});
	};

	const handleResolveExceptionSubmit = () => {
		if (!resolvingExceptionId) return;

		resolveExceptionMutation.mutate({
			exceptionId: resolvingExceptionId,
			decision: exceptionDecision,
			resolutionNotes: exceptionResolutionNotes,
		});
	};

	const pendingExceptions = (planDetail?.exceptions || []).filter((e) => e.status === "PENDING");
	const checklist = (planDetail?.checklist as any) || {};

	return (
		<div className="space-y-6 pb-12">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<Send className="h-6 w-6 text-primary" />
						Final Dispatch Approval Gate
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Final authorization before vehicles depart. Confirm loaded manifests, resolve physical loading exceptions, and trigger stock ledger deduction.
					</p>
				</div>
			</div>

			{/* Pending Dispatch Queue */}
			<Card className="border-orange-200 dark:border-orange-900/50">
				<CardHeader className="bg-orange-50/50 dark:bg-orange-950/20">
					<CardTitle className="text-base flex items-center gap-2 text-orange-900 dark:text-orange-200">
						<Clock className="h-4 w-4 text-orange-600" />
						Ready for Final Dispatch Authorization ({plansData?.items?.length || 0} Vehicles)
					</CardTitle>
					<CardDescription>
						Vehicles fully loaded by warehouse staff awaiting managerial clearance and gate pass.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-4">
					{loadingPlans ? (
						<div className="py-8 text-center text-xs text-muted-foreground">Loading queue...</div>
					) : plansData?.items?.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
							<div className="font-semibold text-sm text-foreground">No vehicles waiting for dispatch!</div>
							<div className="text-xs">All loaded vehicles have been authorized or are currently en route.</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{plansData?.items?.map((plan) => (
								<Card
									key={plan.id}
									className="border border-border cursor-pointer transition-all hover:shadow-md hover:border-orange-400"
									onClick={() => handleOpenPlan(plan)}
								>
									<CardHeader className="p-4 pb-2">
										<div className="flex items-center justify-between">
											<span className="font-mono font-bold text-xs text-primary">
												{plan.planNumber}
											</span>
											<Badge className="bg-orange-600 hover:bg-orange-700 animate-pulse">
												Awaiting Clearance
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
										<div className="flex justify-between text-muted-foreground">
											<span>Loaded Items:</span>
											<span className="font-medium text-foreground">{plan.items?.length || 0}</span>
										</div>
										{plan.loaderNotes && (
											<div className="text-[11px] bg-muted/60 p-2 rounded text-muted-foreground">
												Loader: {plan.loaderNotes}
											</div>
										)}
										<Button
											size="sm"
											className="w-full mt-2 text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
										>
											<ShieldCheck className="h-3.5 w-3.5" />
											Authorize Dispatch
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Review & Dispatch Modal */}
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
								<Send className="h-5 w-5 text-primary" />
								Final Dispatch Gate: {planDetail?.vehicle?.registrationNumber} ({planDetail?.planNumber})
							</DialogTitle>
							<Badge variant="outline" className="font-mono">
								Rev: {planDetail?.revision}
							</Badge>
						</div>
						<DialogDescription className="text-xs">
							Assigned Driver:{" "}
							<span className="font-semibold text-foreground">
								{planDetail?.driver?.name}
							</span>{" "}
							| Dispatch Date:{" "}
							<span className="font-semibold text-foreground">
								{planDetail?.dispatchDate}
							</span>
						</DialogDescription>
					</DialogHeader>

					{/* Loading Checklist Summary */}
					<div className="p-3 bg-muted/40 border rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
						<div className="font-semibold flex items-center gap-1.5 text-foreground">
							<CheckSquare className="h-4 w-4 text-primary" />
							Loader Sign-Off Checklist:
						</div>
						<div className="flex items-center gap-3">
							<span className={checklist.vehicleClean ? "text-emerald-600" : "text-rose-600"}>
								✓ Clean Cargo
							</span>
							<span className={checklist.temperatureOk ? "text-emerald-600" : "text-rose-600"}>
								✓ Temperature OK
							</span>
							<span className={checklist.doorsSecure ? "text-emerald-600" : "text-rose-600"}>
								✓ Doors Locked
							</span>
							<span className={checklist.strapsTight ? "text-emerald-600" : "text-rose-600"}>
								✓ Straps Secured
							</span>
						</div>
						{planDetail?.loaderNotes && (
							<div className="w-full text-[11px] text-muted-foreground pt-1 border-t">
								<span className="font-semibold">Loader Note:</span> {planDetail.loaderNotes}
							</div>
						)}
					</div>

					{/* Exceptions Resolution Section */}
					{(planDetail?.exceptions || []).length > 0 && (
						<div className="border border-amber-300 dark:border-amber-800 rounded-lg p-3 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
							<div className="font-semibold text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
								<span className="flex items-center gap-1.5">
									<AlertTriangle className="h-4 w-4 text-amber-600" />
									Loading Exceptions ({planDetail?.exceptions?.length})
								</span>
								{pendingExceptions.length > 0 ? (
									<Badge variant="destructive" className="text-[10px]">
										{pendingExceptions.length} Unresolved (Action Required)
									</Badge>
								) : (
									<Badge className="bg-emerald-600 text-[10px]">All Resolved</Badge>
								)}
							</div>
							<div className="divide-y border rounded bg-background">
								{planDetail?.exceptions?.map((exc) => (
									<div key={exc.id} className="p-2.5 flex items-center justify-between text-xs">
										<div>
											<span className="font-semibold">{exc.type}</span>: Qty {exc.quantity}
											<div className="text-[11px] text-muted-foreground">"{exc.reason}"</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge
												className={
													exc.status === "APPROVED"
														? "bg-emerald-600"
														: exc.status === "REJECTED"
														? "bg-rose-600"
														: "bg-amber-600"
												}
											>
												{exc.status}
											</Badge>
											{exc.status === "PENDING" && (
												<Button
													size="sm"
													variant="outline"
													onClick={() => {
														setResolvingExceptionId(exc.id);
														setExceptionDecision("APPROVE");
													}}
													className="h-7 text-xs"
												>
													Resolve
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Final Manifest Breakdown */}
					<div className="flex-1 overflow-y-auto my-3 border rounded-lg">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted text-muted-foreground font-semibold border-b sticky top-0">
								<tr>
									<th className="p-2.5">Product & SKU</th>
									<th className="p-2.5 text-center">Planned</th>
									<th className="p-2.5 text-center">Picked</th>
									<th className="p-2.5 text-center">Packed</th>
									<th className="p-2.5 text-center">Verified</th>
									<th className="p-2.5 text-center bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
										Loaded Qty
									</th>
									<th className="p-2.5 text-center">Status</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{planDetail?.items?.map((item: any) => (
									<tr key={item.id} className="hover:bg-muted/30">
										<td className="p-2.5">
											<div className="font-semibold text-foreground">{item.product?.name}</div>
											<div className="text-[11px] font-mono text-muted-foreground">
												{item.product?.sku}
											</div>
										</td>
										<td className="p-2.5 text-center font-mono">{item.plannedQty}</td>
										<td className="p-2.5 text-center font-mono">{item.pickedQty}</td>
										<td className="p-2.5 text-center font-mono">{item.packedQty}</td>
										<td className="p-2.5 text-center font-mono">{item.verifiedQty}</td>
										<td className="p-2.5 text-center font-mono font-bold bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
											{item.loadedQty}
										</td>
										<td className="p-2.5 text-center">
											<Badge variant="outline" className="text-emerald-600 border-emerald-300">
												Ready
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
							Final Gate Pass / Dispatch Comments
						</label>
						<Input
							placeholder="Gate clearance pass code, odometer reading, seal verified..."
							value={dispatchNotes}
							onChange={(e) => setDispatchNotes(e.target.value)}
							className="text-xs"
						/>
					</div>

					{/* Modal Actions */}
					<div className="flex items-center justify-between pt-4 border-t mt-2">
						<Button
							variant="outline"
							onClick={() => setShowRejectModal(true)}
							className="text-xs text-rose-600 border-rose-300 hover:bg-rose-50"
						>
							Reject & Abort Dispatch
						</Button>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								onClick={() => setSelectedPlanId(null)}
								className="text-xs"
							>
								Cancel
							</Button>
							<Button
								onClick={handleApproveDispatch}
								disabled={
									approveDispatchMutation.isPending ||
									pendingExceptions.length > 0
								}
								className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
							>
								<CheckCircle2 className="h-3.5 w-3.5" />
								Authorize Final Dispatch (Deduct Stock & Issue Gate Pass)
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Resolve Exception Sub-Modal */}
			<Dialog
				open={!!resolvingExceptionId}
				onOpenChange={(open) => {
					if (!open) setResolvingExceptionId(null);
				}}
			>
				<DialogContent className="max-w-md p-6">
					<DialogHeader>
						<DialogTitle className="text-base font-bold flex items-center gap-2">
							<AlertTriangle className="h-4 w-4 text-amber-600" />
							Resolve Loading Exception
						</DialogTitle>
						<DialogDescription className="text-xs">
							Approve or reject this loader exception.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 my-2">
						<div>
							<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Manager Decision
							</label>
							<select
								value={exceptionDecision}
								onChange={(e) => setExceptionDecision(e.target.value as any)}
								className="w-full text-xs rounded-md border border-input h-8 px-2"
							>
								<option value="APPROVE">Approve Exception (Include in Dispatch)</option>
								<option value="REJECT">Reject Exception (Do Not Load)</option>
							</select>
						</div>

						<div>
							<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Resolution Notes
							</label>
							<textarea
								rows={3}
								value={exceptionResolutionNotes}
								onChange={(e) => setExceptionResolutionNotes(e.target.value)}
								placeholder="Manager comments on this decision..."
								className="w-full text-xs rounded-md border border-input p-2 text-xs"
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2 border-t">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setResolvingExceptionId(null)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleResolveExceptionSubmit}
							disabled={resolveExceptionMutation.isPending}
							className="text-xs bg-primary text-white"
						>
							Save Resolution
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Rejection Sub-Modal */}
			<Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
				<DialogContent className="max-w-md p-6">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
							<AlertTriangle className="h-4 w-4" />
							Reject Final Dispatch
						</DialogTitle>
						<DialogDescription className="text-xs">
							State the reason why this vehicle cannot be dispatched.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 my-2">
						<textarea
							rows={4}
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							placeholder="Enter mandatory rejection reason..."
							className="w-full text-xs rounded-md border border-input p-2"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2 border-t">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowRejectModal(false)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleRejectDispatch}
							disabled={approveDispatchMutation.isPending || !rejectionReason.trim()}
							className="text-xs"
						>
							Confirm Dispatch Rejection
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
