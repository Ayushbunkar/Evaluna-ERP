"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
	Truck,
	CheckSquare,
	Clock,
	CheckCircle2,
	AlertTriangle,
	Play,
	PlusCircle,
	ShieldAlert,
	Check,
	Info,
	FileText,
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

interface LoadItemRow {
	id: string;
	productId: string;
	productName: string;
	sku: string;
	verifiedQty: number;
	loadedQty: number;
}

export default function LoaderVanLoadingPage() {
	const utils = trpc.useUtils();
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [activeItems, setActiveItems] = useState<LoadItemRow[]>([]);
	const [loaderNotes, setLoaderNotes] = useState("");

	// Checklist
	const [checklist, setChecklist] = useState({
		vehicleClean: true,
		temperatureOk: true,
		doorsSecure: true,
		strapsTight: true,
	});

	// Exception modal
	const [showExceptionModal, setShowExceptionModal] = useState(false);
	const [exceptionPlanItemId, setExceptionPlanItemId] = useState("");
	const [exceptionType, setExceptionType] = useState<"EXTRA_STOCK_FOUND" | "DAMAGED_DURING_LOADING">("EXTRA_STOCK_FOUND");
	const [exceptionQty, setExceptionQty] = useState<number>(1);
	const [exceptionReason, setExceptionReason] = useState("");

	// Queries
	const { data: plansData, isLoading: loadingPlans } = trpc.vanStock.listPlans.useQuery({
		limit: 50,
	});

	const { data: planDetail } = trpc.vanStock.getPlanDetail.useQuery(
		{ planId: selectedPlanId || "" },
		{ enabled: !!selectedPlanId }
	);

	// Mutations
	const startLoadingMutation = trpc.vanStock.startLoading.useMutation({
		onSuccess: () => {
			toast.success("Physical loading started for this van!");
			utils.vanStock.listPlans.invalidate();
			if (selectedPlanId) utils.vanStock.getPlanDetail.invalidate({ planId: selectedPlanId });
		},
		onError: (err) => toast.error(err.message || "Failed to start loading"),
	});

	const reportExceptionMutation = trpc.vanStock.reportLoadingException.useMutation({
		onSuccess: () => {
			toast.success("Exception reported to Manager for approval!");
			setShowExceptionModal(false);
			setExceptionReason("");
			setExceptionQty(1);
			if (selectedPlanId) utils.vanStock.getPlanDetail.invalidate({ planId: selectedPlanId });
		},
		onError: (err) => toast.error(err.message || "Failed to report exception"),
	});

	const submitLoadingMutation = trpc.vanStock.submitLoading.useMutation({
		onSuccess: () => {
			toast.success("Loading signed off and submitted for Manager Final Dispatch Approval!");
			setSelectedPlanId(null);
			utils.vanStock.listPlans.invalidate();
		},
		onError: (err) => toast.error(err.message || "Failed to sign off loading"),
	});

	const handleOpenPlan = (plan: any) => {
		setSelectedPlanId(plan.id);
		setLoaderNotes(plan.loaderNotes || "");
		const mapped: LoadItemRow[] = (plan.items || []).map((it: any) => {
			const verified = it.verifiedQty !== null && it.verifiedQty !== undefined
				? parseFloat(it.verifiedQty)
				: parseFloat(it.packedQty || it.plannedQty);
			const loaded = it.loadedQty !== null && it.loadedQty !== undefined
				? parseFloat(it.loadedQty)
				: verified;
			return {
				id: it.id,
				productId: it.productId,
				productName: it.product?.name || "Product",
				sku: it.product?.sku || "",
				verifiedQty: verified,
				loadedQty: loaded,
			};
		});
		setActiveItems(mapped);
	};

	const handleLoadedQtyChange = (idx: number, loaded: number) => {
		const updated = [...activeItems];
		updated[idx].loadedQty = Math.max(0, loaded);
		setActiveItems(updated);
	};

	const handleStartLoading = () => {
		if (!selectedPlanId) return;
		startLoadingMutation.mutate({ planId: selectedPlanId });
	};

	const handleReportExceptionSubmit = () => {
		if (!selectedPlanId || !exceptionPlanItemId) {
			toast.error("Please select an item");
			return;
		}
		if (exceptionQty <= 0) {
			toast.error("Quantity must be greater than zero");
			return;
		}
		if (!exceptionReason.trim()) {
			toast.error("Please state the reason for this exception");
			return;
		}

		reportExceptionMutation.mutate({
			planId: selectedPlanId,
			planItemId: exceptionPlanItemId,
			type: exceptionType,
			quantity: exceptionQty,
			reason: exceptionReason,
		});
	};

	const handleSubmitLoading = () => {
		if (!selectedPlanId) return;

		submitLoadingMutation.mutate({
			planId: selectedPlanId,
			loaderNotes,
			checklist,
			items: activeItems.map((it) => ({
				planItemId: it.id,
				loadedQty: it.loadedQty,
			})),
		});
	};

	const loadingQueue = (plansData?.items || []).filter(
		(p) => p.status === "PENDING_LOADING" || p.status === "LOADING_IN_PROGRESS"
	);

	const pendingExceptions = (planDetail?.exceptions || []).filter((e) => e.status === "PENDING");

	return (
		<div className="space-y-6 pb-12">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<Truck className="h-6 w-6 text-primary" />
						Van Loading & Physical Check
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Conduct physical vehicle checks, load verified stock into the van, report exceptions, and sign off for final dispatch.
					</p>
				</div>
			</div>

			{/* Loading Queue */}
			<Card className="border-indigo-200 dark:border-indigo-900/50">
				<CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20">
					<CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
						<Clock className="h-4 w-4 text-indigo-600" />
						Active Loading Queue ({loadingQueue.length} Ready)
					</CardTitle>
					<CardDescription>
						Manifests verified by the Manager waiting to be physically staged and loaded into vehicles.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-4">
					{loadingPlans ? (
						<div className="py-8 text-center text-xs text-muted-foreground">Loading queue...</div>
					) : loadingQueue.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
							<div className="font-semibold text-sm text-foreground">Loading queue is clear!</div>
							<div className="text-xs">No pending vehicles ready for physical loading.</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{loadingQueue.map((plan) => (
								<Card
									key={plan.id}
									className={`border cursor-pointer transition-all hover:shadow-md ${
										plan.status === "LOADING_IN_PROGRESS"
											? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20"
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
													plan.status === "LOADING_IN_PROGRESS"
														? "bg-indigo-600 hover:bg-indigo-700"
														: "bg-indigo-500 hover:bg-indigo-600"
												}
											>
												{plan.status === "LOADING_IN_PROGRESS"
													? "Loading In Progress"
													: "Ready to Load"}
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
												{plan.driver?.name || "Assigned"}
											</span>
										</div>
										<div className="flex justify-between text-muted-foreground">
											<span>Dispatch Date:</span>
											<span className="font-medium text-foreground">{plan.dispatchDate}</span>
										</div>
										<div className="flex justify-between text-muted-foreground">
											<span>Total Items:</span>
											<span className="font-medium text-foreground">{plan.items?.length || 0}</span>
										</div>
										<Button
											size="sm"
											className="w-full mt-2 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
										>
											<Play className="h-3 w-3" />
											{plan.status === "LOADING_IN_PROGRESS"
												? "Continue Loading"
												: "Start Vehicle Loading"}
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Loading Dialog */}
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
								<Truck className="h-5 w-5 text-primary" />
								Vehicle Loading: {planDetail?.vehicle?.registrationNumber} ({planDetail?.planNumber})
							</DialogTitle>
							<Badge variant="outline" className="font-mono">
								Rev: {planDetail?.revision}
							</Badge>
						</div>
						<DialogDescription className="text-xs">
							Driver:{" "}
							<span className="font-semibold text-foreground">
								{planDetail?.driver?.name || "Assigned Driver"}
							</span>{" "}
							| Dispatch Date:{" "}
							<span className="font-semibold text-foreground">
								{planDetail?.dispatchDate}
							</span>
						</DialogDescription>
					</DialogHeader>

					{planDetail?.status === "PENDING_LOADING" && (
						<div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-lg flex items-center justify-between">
							<div className="text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
								<AlertTriangle className="h-4 w-4 text-indigo-600" />
								Manifest verified by Manager. Click "Start Loading" to begin staging.
							</div>
							<Button
								size="sm"
								onClick={handleStartLoading}
								disabled={startLoadingMutation.isPending}
								className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
							>
								<Play className="h-3.5 w-3.5" />
								Start Loading
							</Button>
						</div>
					)}

					{/* Vehicle Physical Checklist */}
					<div className="p-3 bg-muted/40 border rounded-lg space-y-2">
						<div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
							<CheckSquare className="h-4 w-4 text-primary" />
							Physical Van Inspection Checklist
						</div>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={checklist.vehicleClean}
									disabled={planDetail?.status !== "LOADING_IN_PROGRESS"}
									onChange={(e) =>
										setChecklist({ ...checklist, vehicleClean: e.target.checked })
									}
									className="rounded"
								/>
								<span>Van Cargo Clean</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={checklist.temperatureOk}
									disabled={planDetail?.status !== "LOADING_IN_PROGRESS"}
									onChange={(e) =>
										setChecklist({ ...checklist, temperatureOk: e.target.checked })
									}
									className="rounded"
								/>
								<span>Temp Normal</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={checklist.doorsSecure}
									disabled={planDetail?.status !== "LOADING_IN_PROGRESS"}
									onChange={(e) =>
										setChecklist({ ...checklist, doorsSecure: e.target.checked })
									}
									className="rounded"
								/>
								<span>Doors Secure</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={checklist.strapsTight}
									disabled={planDetail?.status !== "LOADING_IN_PROGRESS"}
									onChange={(e) =>
										setChecklist({ ...checklist, strapsTight: e.target.checked })
									}
									className="rounded"
								/>
								<span>Straps / Racks Tied</span>
							</label>
						</div>
					</div>

					{/* Items to Load */}
					<div className="flex-1 overflow-y-auto my-3 border rounded-lg">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted text-muted-foreground font-semibold border-b sticky top-0">
								<tr>
									<th className="p-2.5">Product & SKU</th>
									<th className="p-2.5 text-center">Verified Qty</th>
									<th className="p-2.5 text-center">Loaded Qty</th>
									<th className="p-2.5 text-center">Status</th>
									<th className="p-2.5 text-center">Exceptions</th>
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
											{item.verifiedQty}
										</td>
										<td className="p-2.5 text-center">
											<Input
												type="number"
												min="0"
												step="any"
												value={item.loadedQty}
												disabled={planDetail?.status !== "LOADING_IN_PROGRESS"}
												onChange={(e) =>
													handleLoadedQtyChange(idx, parseFloat(e.target.value) || 0)
												}
												className="w-20 text-center h-8 mx-auto font-bold text-xs"
											/>
										</td>
										<td className="p-2.5 text-center">
											{item.loadedQty === item.verifiedQty ? (
												<Badge variant="outline" className="text-emerald-600 border-emerald-300">
													Loaded
												</Badge>
											) : (
												<Badge variant="destructive">Discrepancy</Badge>
											)}
										</td>
										<td className="p-2.5 text-center">
											<Button
												variant="ghost"
												size="sm"
												disabled={planDetail?.status !== "LOADING_IN_PROGRESS"}
												onClick={() => {
													setExceptionPlanItemId(item.id);
													setShowExceptionModal(true);
												}}
												className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 text-xs gap-1"
											>
												<AlertTriangle className="h-3 w-3" />
												Report Exception
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Exception Warnings Banner */}
					{pendingExceptions.length > 0 && (
						<div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg space-y-1">
							<div className="font-semibold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
								<AlertTriangle className="h-4 w-4 text-amber-600" />
								{pendingExceptions.length} Unresolved Exception(s) Recorded
							</div>
							<div className="text-[11px] text-amber-800 dark:text-amber-300">
								Manager approval is required for these exceptions before final dispatch.
							</div>
						</div>
					)}

					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
							Loader Notes / Seal Number
						</label>
						<Input
							placeholder="Van seal number, load distribution comments..."
							value={loaderNotes}
							disabled={planDetail?.status !== "LOADING_IN_PROGRESS"}
							onChange={(e) => setLoaderNotes(e.target.value)}
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
							onClick={handleSubmitLoading}
							disabled={
								submitLoadingMutation.isPending ||
								planDetail?.status !== "LOADING_IN_PROGRESS" ||
								pendingExceptions.length > 0
							}
							className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
						>
							<CheckCircle2 className="h-3.5 w-3.5" />
							Sign Off Loading & Request Dispatch Approval
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Report Exception Sub-Modal */}
			<Dialog open={showExceptionModal} onOpenChange={setShowExceptionModal}>
				<DialogContent className="max-w-md p-6">
					<DialogHeader>
						<DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-600">
							<AlertTriangle className="h-5 w-5" />
							Report Physical Loading Exception
						</DialogTitle>
						<DialogDescription className="text-xs">
							Report extra stock found or goods damaged during physical vehicle loading.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 my-2">
						<div>
							<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Exception Type
							</label>
							<select
								value={exceptionType}
								onChange={(e) => setExceptionType(e.target.value as any)}
								className="w-full text-xs rounded-md border border-input h-8 px-2"
							>
								<option value="EXTRA_STOCK_FOUND">Extra Stock Found During Loading</option>
								<option value="DAMAGED_DURING_LOADING">Damaged During Loading</option>
							</select>
						</div>

						<div>
							<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Quantity
							</label>
							<Input
								type="number"
								min="1"
								step="any"
								value={exceptionQty}
								onChange={(e) => setExceptionQty(parseFloat(e.target.value) || 0)}
								className="text-xs"
							/>
						</div>

						<div>
							<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Reason / Explanation *
							</label>
							<textarea
								rows={3}
								value={exceptionReason}
								onChange={(e) => setExceptionReason(e.target.value)}
								placeholder="Explain how extra stock was found or damage occurred..."
								className="w-full text-xs rounded-md border border-input p-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2 border-t">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowExceptionModal(false)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleReportExceptionSubmit}
							disabled={reportExceptionMutation.isPending || !exceptionReason.trim()}
							className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
						>
							Submit Exception
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
