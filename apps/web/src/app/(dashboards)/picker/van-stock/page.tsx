"use client";

import { useState, useEffect, useMemo } from "react";
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
	Calendar as CalendarIcon,
	Filter as FilterIcon,
	RefreshCw,
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

function toDateKey(dateVal: string | Date | null | undefined): string {
	if (!dateVal) return "";
	const d = new Date(dateVal);
	if (Number.isNaN(d.getTime())) return "";
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function getTodayLocalDateStr(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function getYesterdayLocalDateStr(): string {
	const y = new Date();
	y.setDate(y.getDate() - 1);
	const yr = y.getFullYear();
	const m = String(y.getMonth() + 1).padStart(2, "0");
	const d = String(y.getDate()).padStart(2, "0");
	return `${yr}-${m}-${d}`;
}

export default function PickerVanStockPage() {
	const utils = trpc.useUtils();
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [filterSearch, setFilterSearch] = useState("");
	const [activeItems, setActiveItems] = useState<PickRowState[]>([]);
	const [pickerNotes, setPickerNotes] = useState("");

	// Day-wise filter states
	const todayKey = useMemo(() => getTodayLocalDateStr(), []);
	const yesterdayKey = useMemo(() => getYesterdayLocalDateStr(), []);
	const [datePreset, setDatePreset] = useState<"all" | "today" | "yesterday" | "custom">("all");
	const [customDate, setCustomDate] = useState<string>(todayKey);

	// Compute effective dispatchDate parameter for query
	const effectiveDispatchDate = useMemo(() => {
		if (datePreset === "all") return undefined;
		if (datePreset === "today") return todayKey;
		if (datePreset === "yesterday") return yesterdayKey;
		if (datePreset === "custom") return customDate;
		return undefined;
	}, [datePreset, todayKey, yesterdayKey, customDate]);

	// Queries
	const {
		data: plansData,
		isLoading: loadingPlans,
		isFetching: fetchingPlans,
		refetch: refetchPlans,
	} = trpc.vanStock.listPlans.useQuery({
		limit: 100,
		dispatchDate: effectiveDispatchDate,
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

	// Sync items whenever planDetail changes
	useEffect(() => {
		if (planDetail?.items && planDetail.items.length > 0) {
			const mapped: PickRowState[] = planDetail.items.map((it: any) => {
				const planned = parseFloat(it.plannedQty ?? it.plannedQuantity) || 0;
				const rawPicked = parseFloat(it.pickedQty ?? it.pickedQuantity) || 0;
				const picked = rawPicked > 0 ? rawPicked : planned;
				return {
					id: it.id,
					productId: it.productId,
					productName: it.productName || it.product?.name || "Product",
					sku: it.sku || it.product?.sku || "",
					plannedQty: planned,
					pickedQty: picked,
					shortageQty: parseFloat(it.shortageQty ?? it.pickingShortage) || 0,
					shortageReason: it.shortageReason || it.pickingNotes || "",
					notes: it.notes || "",
					isAdditional: !!it.isAdditional,
					additionalReason: it.additionalReason,
				};
			});
			setActiveItems(mapped);
		}
	}, [planDetail]);

	const handleOpenPlan = (plan: any) => {
		setSelectedPlanId(plan.id);
		setPickerNotes(plan.pickerNotes || plan.notes || "");
		if (plan.items && plan.items.length > 0) {
			const mapped: PickRowState[] = plan.items.map((it: any) => {
				const planned = parseFloat(it.plannedQty ?? it.plannedQuantity) || 0;
				const rawPicked = parseFloat(it.pickedQty ?? it.pickedQuantity) || 0;
				const picked = rawPicked > 0 ? rawPicked : planned;
				return {
					id: it.id,
					productId: it.productId,
					productName: it.productName || it.product?.name || "Product",
					sku: it.sku || it.product?.sku || "",
					plannedQty: planned,
					pickedQty: picked,
					shortageQty: parseFloat(it.shortageQty ?? it.pickingShortage) || 0,
					shortageReason: it.shortageReason || it.pickingNotes || "",
					notes: it.notes || "",
					isAdditional: !!it.isAdditional,
					additionalReason: it.additionalReason,
				};
			});
			setActiveItems(mapped);
		}
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

	// Safely normalize all plans
	const rawPlans = Array.isArray(plansData) ? plansData : (plansData?.items || []);

	// Client-side date filter safeguard
	const dateFilteredPlans = useMemo(() => {
		if (!rawPlans) return [];
		return rawPlans.filter((p: any) => {
			if (datePreset === "all") return true;
			const planDate = p.dispatchDate || (p.createdAt ? toDateKey(p.createdAt) : "");
			if (!planDate) return true;
			if (datePreset === "today") return planDate === todayKey;
			if (datePreset === "yesterday") return planDate === yesterdayKey;
			if (datePreset === "custom") return planDate === customDate;
			return true;
		});
	}, [rawPlans, datePreset, todayKey, yesterdayKey, customDate]);

	// Search filter
	const searchFilteredPlans = useMemo(() => {
		const q = filterSearch.toLowerCase().trim();
		if (!q) return dateFilteredPlans;
		return dateFilteredPlans.filter((p: any) => {
			const code = (p.planCode || p.planNumber || "").toLowerCase();
			const vehicle = (p.vehicle?.registrationNumber || p.vehicle?.name || "").toLowerCase();
			const driver = (p.driver?.name || p.driverName || "").toLowerCase();
			return code.includes(q) || vehicle.includes(q) || driver.includes(q);
		});
	}, [dateFilteredPlans, filterSearch]);

	// Filter active picking queue vs past
	const pickingQueue = searchFilteredPlans.filter(
		(p: any) => p.status === "PENDING_PICKING" || p.status === "PICKING_IN_PROGRESS"
	);

	const otherPlans = searchFilteredPlans.filter(
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
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetchPlans()}
						disabled={fetchingPlans}
						className="gap-1.5 text-xs"
					>
						<RefreshCw className={`h-3.5 w-3.5 ${fetchingPlans ? "animate-spin" : ""}`} />
						{fetchingPlans ? "Refreshing..." : "Refresh"}
					</Button>
				</div>
			</div>

			{/* Day-Wise Filter Bar */}
			<Card className="border-border/60 bg-card/60 shadow-xs backdrop-blur-sm">
				<CardContent className="p-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
								<FilterIcon className="h-3.5 w-3.5 text-amber-600" />
								Dispatch Day:
							</span>
							<Button
								type="button"
								size="sm"
								variant={datePreset === "all" ? "default" : "outline"}
								className={
									datePreset === "all"
										? "bg-amber-600 text-white hover:bg-amber-700 h-8 text-xs font-medium"
										: "h-8 text-xs font-medium"
								}
								onClick={() => setDatePreset("all")}
							>
								All Dates
							</Button>
							<Button
								type="button"
								size="sm"
								variant={datePreset === "today" ? "default" : "outline"}
								className={
									datePreset === "today"
										? "bg-amber-600 text-white hover:bg-amber-700 h-8 text-xs font-medium"
										: "h-8 text-xs font-medium"
								}
								onClick={() => setDatePreset("today")}
							>
								<CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
								Today
							</Button>
							<Button
								type="button"
								size="sm"
								variant={datePreset === "yesterday" ? "default" : "outline"}
								className={
									datePreset === "yesterday"
										? "bg-amber-600 text-white hover:bg-amber-700 h-8 text-xs font-medium"
										: "h-8 text-xs font-medium"
								}
								onClick={() => setDatePreset("yesterday")}
							>
								Yesterday
							</Button>

							<div className="flex items-center gap-1.5 pl-1">
								<span className="text-xs text-muted-foreground">Custom:</span>
								<input
									type="date"
									value={customDate}
									onChange={(e) => {
										if (e.target.value) {
											setCustomDate(e.target.value);
											setDatePreset("custom");
										}
									}}
									className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
								/>
							</div>
						</div>

						{/* Active Filter Indicator & Search */}
						<div className="flex flex-wrap items-center gap-3">
							<Badge
								variant="secondary"
								className="text-xs font-normal border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1"
							>
								<CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
								{datePreset === "all" && "Showing: All Dates"}
								{datePreset === "today" && `Showing: Today (${todayKey})`}
								{datePreset === "yesterday" && `Showing: Yesterday (${yesterdayKey})`}
								{datePreset === "custom" && `Showing: Selected Date (${customDate})`}
							</Badge>

							<div className="relative w-48 sm:w-56">
								<Search className="absolute top-2 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
								<Input
									type="text"
									placeholder="Search vehicle or code..."
									value={filterSearch}
									onChange={(e) => setFilterSearch(e.target.value)}
									className="h-8 pl-8 text-xs"
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

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
								Van manifests released by Managers requiring warehouse picking for the selected date.
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
							<div className="font-semibold text-sm text-foreground">
								{searchFilteredPlans.length === 0
									? `No van stock picking plans found for ${
											datePreset === "all"
												? "any date"
												: datePreset === "today"
													? `Today (${todayKey})`
													: datePreset === "yesterday"
														? `Yesterday (${yesterdayKey})`
														: `Date (${customDate})`
										}`
									: "Picking queue is clear for the selected date!"}
							</div>
							<div className="text-xs mt-1">
								{datePreset !== "all" ? (
									<button
										type="button"
										onClick={() => setDatePreset("all")}
										className="text-amber-600 hover:underline font-medium"
									>
										Click here to view All Dates
									</button>
								) : (
									"No pending van stock plans at this time."
								)}
							</div>
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
												{plan.planCode || plan.planNumber}
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
											{plan.vehicle?.registrationNumber || plan.vehicle?.name || "Van"}
										</CardTitle>
									</CardHeader>
									<CardContent className="p-4 pt-1 space-y-2 text-xs">
										<div className="flex justify-between text-muted-foreground">
											<span>Dispatch Date:</span>
											<span className="font-medium text-foreground">
												{plan.dispatchDate || "N/A"}
											</span>
										</div>
										<div className="flex justify-between text-muted-foreground">
											<span>Driver:</span>
											<span className="font-medium text-foreground">
												{plan.driver?.name || plan.driverName || "Assigned Driver"}
											</span>
										</div>
										<div className="flex justify-between text-muted-foreground">
											<span>Total Items:</span>
											<span className="font-medium text-foreground">
												{plan.itemCount ?? plan.items?.length ?? 0} products
											</span>
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

			{/* Other Plans Section (Packed / Verified / Loaded for selected day) */}
			{otherPlans.length > 0 && (
				<Card className="border-border">
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<PackageCheck className="h-4 w-4 text-muted-foreground" />
							Other Van Stock Plans for Selected Date ({otherPlans.length})
						</CardTitle>
						<CardDescription className="text-xs">
							Plans that have moved forward into Packing, Verification, or Loading.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-2">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
							{otherPlans.map((plan: any) => (
								<div
									key={plan.id}
									className="border rounded-md p-3 text-xs flex flex-col justify-between gap-2 bg-muted/20"
								>
									<div className="flex items-center justify-between">
										<span className="font-mono font-bold text-xs">
											{plan.planCode || plan.planNumber}
										</span>
										<Badge variant="outline" className="text-[10px]">
											{plan.status.replace(/_/g, " ")}
										</Badge>
									</div>
									<div className="flex items-center gap-1.5 text-muted-foreground">
										<Truck className="h-3.5 w-3.5" />
										<span className="font-medium text-foreground">
											{plan.vehicle?.registrationNumber || plan.vehicle?.name || "Van"}
										</span>
										<span className="mx-1">•</span>
										<span>{plan.dispatchDate}</span>
									</div>
									<div className="flex justify-between items-center pt-1 border-t text-muted-foreground">
										<span>Items: {plan.itemCount ?? plan.items?.length ?? 0}</span>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 text-[11px] gap-1"
											onClick={() => handleOpenPlan(plan)}
										>
											<Eye className="h-3 w-3" />
											View Details
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

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
								{planDetail?.vehicle?.registrationNumber || planDetail?.vehicle?.name || "Vehicle"}
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