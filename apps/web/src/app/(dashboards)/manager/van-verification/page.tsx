"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
	ShieldCheck,
	Truck,
	UserCheck,
	CheckCircle2,
	XCircle,
	RotateCcw,
	AlertTriangle,
	Eye,
	Clock,
	FileText,
	Info,
	User,
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

interface VerifyRowState {
	id: string;
	productName: string;
	sku: string;
	plannedQty: number;
	pickedQty: number;
	packedQty: number;
	damagedQty: number;
	verifiedQty: number;
	isAdditional: boolean;
	additionalReason?: string;
	shortageReason?: string;
	discrepancyReason?: string;
}

export default function VanVerificationPage() {
	const utils = trpc.useUtils();
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [assignedDriverId, setAssignedDriverId] = useState<string>("");
	const [assignedVehicleId, setAssignedVehicleId] = useState<string>("");
	const [managerNotes, setManagerNotes] = useState<string>("");
	const [rejectionReason, setRejectionReason] = useState<string>("");
	const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
	const [rejectActionType, setRejectActionType] = useState<"REJECT" | "SEND_BACK_PICKER" | "SEND_BACK_PACKER">("REJECT");
	const [activeItems, setActiveItems] = useState<VerifyRowState[]>([]);

	// Queries
	const { data: metadata } = trpc.vanStock.getPlanningMetadata.useQuery();
	const { data: plansData, isLoading: loadingPlans } = trpc.vanStock.listPlans.useQuery({
		status: "PENDING_MANAGER_VERIFICATION",
		limit: 50,
	});

	const { data: planDetail } = trpc.vanStock.getPlanDetail.useQuery(
		{ planId: selectedPlanId || "" },
		{ enabled: !!selectedPlanId }
	);

	// Mutations
	const verifyPackingMutation = trpc.vanStock.verifyPacking.useMutation({
		onSuccess: (data) => {
			toast.success(
				data.status === "PENDING_LOADING"
					? "Manifest verified and approved for physical loading!"
					: `Manifest ${data.status}!`
			);
			setSelectedPlanId(null);
			setShowRejectModal(false);
			utils.vanStock.listPlans.invalidate();
		},
		onError: (err) => toast.error(err.message || "Failed to process verification"),
	});

	const handleOpenPlan = (plan: any) => {
		setSelectedPlanId(plan.id);
		setAssignedVehicleId(plan.vehicleId || "");
		setAssignedDriverId(plan.driverId || "");
		setManagerNotes(plan.verificationNotes || "");

		const mapped: VerifyRowState[] = (plan.items || []).map((it: any) => {
			const packed = it.packedQty !== null && it.packedQty !== undefined
				? parseFloat(it.packedQty)
				: parseFloat(it.pickedQty || it.plannedQty);
			return {
				id: it.id,
				productName: it.product?.name || "Product",
				sku: it.product?.sku || "",
				plannedQty: parseFloat(it.plannedQty) || 0,
				pickedQty: parseFloat(it.pickedQty || 0),
				packedQty: packed,
				damagedQty: parseFloat(it.damagedQty || 0),
				verifiedQty: it.verifiedQty !== null && it.verifiedQty !== undefined
					? parseFloat(it.verifiedQty)
					: packed,
				isAdditional: !!it.isAdditional,
				additionalReason: it.additionalReason,
				shortageReason: it.shortageReason,
				discrepancyReason: it.discrepancyReason,
			};
		});
		setActiveItems(mapped);
	};

	const handleVerifiedQtyChange = (idx: number, qty: number) => {
		const updated = [...activeItems];
		updated[idx].verifiedQty = Math.max(0, qty);
		setActiveItems(updated);
	};

	const handleApprove = () => {
		if (!selectedPlanId) return;
		if (!assignedDriverId) {
			toast.error("Please assign a driver before approving for loading");
			return;
		}

		verifyPackingMutation.mutate({
			planId: selectedPlanId,
			decision: "APPROVE",
			driverId: assignedDriverId,
			vehicleId: assignedVehicleId || undefined,
			notes: managerNotes,
			items: activeItems.map((it) => ({
				planItemId: it.id,
				verifiedQty: it.verifiedQty,
			})),
		});
	};

	const handleRejectSubmit = () => {
		if (!selectedPlanId) return;
		if (!rejectionReason.trim()) {
			toast.error("Please provide a mandatory reason for rejection/send-back");
			return;
		}

		verifyPackingMutation.mutate({
			planId: selectedPlanId,
			decision: rejectActionType,
			rejectionReason,
			notes: managerNotes,
		});
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<ShieldCheck className="h-6 w-6 text-primary" />
						Van Stock Verification & Driver Assignment
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Compare planned vs picked vs packed stock, confirm driver and van allocation, and approve for physical loading.
					</p>
				</div>
			</div>

			{/* Pending Verification Manifests */}
			<Card className="border-blue-200 dark:border-blue-900/50">
				<CardHeader className="bg-blue-50/50 dark:bg-blue-950/20">
					<CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-200">
						<Clock className="h-4 w-4 text-blue-600" />
						Awaiting Manager Approval ({plansData?.items?.length || 0} Ready)
					</CardTitle>
					<CardDescription>
						Manifests packed by warehouse staff requiring managerial audit and vehicle/driver confirmation.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-4">
					{loadingPlans ? (
						<div className="py-8 text-center text-xs text-muted-foreground">Loading queue...</div>
					) : plansData?.items?.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
							<div className="font-semibold text-sm text-foreground">All manifests verified!</div>
							<div className="text-xs">No pending packed van stock requiring approval.</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{plansData?.items?.map((plan) => (
								<Card
									key={plan.id}
									className="border border-border cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
									onClick={() => handleOpenPlan(plan)}
								>
									<CardHeader className="p-4 pb-2">
										<div className="flex items-center justify-between">
											<span className="font-mono font-bold text-xs text-primary">
												{plan.planNumber}
											</span>
											<Badge className="bg-blue-600 hover:bg-blue-700">
												Ready for Review
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
										<div className="flex justify-between text-muted-foreground">
											<span>Driver:</span>
											<span className="font-medium text-foreground">
												{plan.driver?.name || "Unassigned"}
											</span>
										</div>
										<Button
											size="sm"
											className="w-full mt-2 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
										>
											<ShieldCheck className="h-3.5 w-3.5" />
											Verify & Assign Driver
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Review & Assignment Modal */}
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
								<ShieldCheck className="h-5 w-5 text-primary" />
								Manager Manifest Verification: {planDetail?.planNumber}
							</DialogTitle>
							<Badge variant="outline" className="font-mono">
								Rev: {planDetail?.revision}
							</Badge>
						</div>
						<DialogDescription className="text-xs">
							Audit the complete chain of custody before physical van loading begins.
						</DialogDescription>
					</DialogHeader>

					{/* Driver & Van Assignment Row */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/40 border rounded-lg">
						<div>
							<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Assign Delivery Driver *
							</label>
							<Select
								value={assignedDriverId}
								onValueChange={setAssignedDriverId}
							>
								<SelectTrigger className="w-full h-8 text-xs bg-background">
									<SelectValue placeholder="Select authenticated driver..." />
								</SelectTrigger>
								<SelectContent>
									{metadata?.drivers.map((d) => (
										<SelectItem key={d.id} value={d.id} className="text-xs">
											{d.name} ({d.email || d.role})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Confirmed Vehicle
							</label>
							<Select
								value={assignedVehicleId}
								onValueChange={setAssignedVehicleId}
							>
								<SelectTrigger className="w-full h-8 text-xs bg-background">
									<SelectValue placeholder="Confirm vehicle..." />
								</SelectTrigger>
								<SelectContent>
									{metadata?.vehicles.map((v) => (
										<SelectItem key={v.id} value={v.id} className="text-xs">
											{v.registrationNumber} ({v.type || "Van"})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Manifest Side-by-side Audit Table */}
					<div className="flex-1 overflow-y-auto my-3 border rounded-lg">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted text-muted-foreground font-semibold border-b sticky top-0">
								<tr>
									<th className="p-2.5">Product & SKU</th>
									<th className="p-2.5 text-center">Planned</th>
									<th className="p-2.5 text-center">Picked</th>
									<th className="p-2.5 text-center">Packed</th>
									<th className="p-2.5 text-center">Damaged</th>
									<th className="p-2.5 text-center bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200">
										Verified Qty *
									</th>
									<th className="p-2.5">Discrepancy / Exception Audit</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{activeItems.map((item, idx) => {
									const hasMismatch =
										item.plannedQty !== item.pickedQty ||
										item.pickedQty !== item.packedQty ||
										item.damagedQty > 0;
									return (
										<tr
											key={item.id}
											className={
												hasMismatch
													? "bg-amber-50/40 dark:bg-amber-950/20"
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
											<td className="p-2.5 text-center font-mono">{item.plannedQty}</td>
											<td className="p-2.5 text-center font-mono">{item.pickedQty}</td>
											<td className="p-2.5 text-center font-mono font-medium">{item.packedQty}</td>
											<td className="p-2.5 text-center font-mono text-rose-600">
												{item.damagedQty > 0 ? item.damagedQty : "-"}
											</td>
											<td className="p-2.5 text-center bg-blue-50/40 dark:bg-blue-950/20">
												<Input
													type="number"
													min="0"
													step="any"
													value={item.verifiedQty}
													onChange={(e) =>
														handleVerifiedQtyChange(idx, parseFloat(e.target.value) || 0)
													}
													className="w-20 text-center h-8 mx-auto font-bold text-xs border-blue-400"
												/>
											</td>
											<td className="p-2.5">
												{item.shortageReason && (
													<div className="text-[11px] text-amber-700 dark:text-amber-400">
														<span className="font-semibold">Shortage:</span> {item.shortageReason}
													</div>
												)}
												{item.discrepancyReason && (
													<div className="text-[11px] text-rose-700 dark:text-rose-400">
														<span className="font-semibold">Packing Note:</span>{" "}
														{item.discrepancyReason}
													</div>
												)}
												{!item.shortageReason && !item.discrepancyReason && (
													<span className="text-emerald-600 text-[11px] flex items-center gap-1">
														<CheckCircle2 className="h-3 w-3" /> Fully matched
													</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
							Manager Approval Notes
						</label>
						<Input
							placeholder="Verification comments, dispatch priority instructions..."
							value={managerNotes}
							onChange={(e) => setManagerNotes(e.target.value)}
							className="text-xs"
						/>
					</div>

					{/* Modal Actions */}
					<div className="flex items-center justify-between pt-4 border-t mt-2">
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setRejectActionType("SEND_BACK_PACKER");
									setShowRejectModal(true);
								}}
								className="text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
							>
								Send Back to Packer
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setRejectActionType("REJECT");
									setShowRejectModal(true);
								}}
								className="text-xs text-rose-600 border-rose-300 hover:bg-rose-50"
							>
								Reject Manifest
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								onClick={() => setSelectedPlanId(null)}
								className="text-xs"
							>
								Cancel
							</Button>
							<Button
								onClick={handleApprove}
								disabled={verifyPackingMutation.isPending || !assignedDriverId}
								className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
							>
								<CheckCircle2 className="h-3.5 w-3.5" />
								Approve & Release to Loading
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Rejection / Send Back Sub-Modal */}
			<Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
				<DialogContent className="max-w-md p-6">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
							<AlertTriangle className="h-4 w-4" />
							{rejectActionType === "REJECT"
								? "Reject Stock Plan"
								: "Send Back for Corrections"}
						</DialogTitle>
						<DialogDescription className="text-xs">
							Please provide a mandatory reason for the audit trail.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 my-2">
						<textarea
							rows={4}
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							placeholder="Enter explicit reason (e.g. quantity discrepancy too high, missing cold chain items...)"
							className="w-full text-xs rounded-md border border-input p-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
							onClick={handleRejectSubmit}
							disabled={verifyPackingMutation.isPending || !rejectionReason.trim()}
							className="text-xs"
						>
							Confirm Action
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
