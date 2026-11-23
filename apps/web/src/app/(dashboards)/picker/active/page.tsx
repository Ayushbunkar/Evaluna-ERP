"use client";

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
import {
	AlertTriangleIcon,
	BarcodeIcon,
	CameraIcon,
	CheckCircle2Icon,
	Loader2Icon,
	MapPinIcon,
	NavigationIcon,
	PackageIcon,
	PhoneIcon,
	PlaySquareIcon,
	UserIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickerActivePage() {
	const t = useTranslations("picker");
	const tCommon = useTranslations("common");
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const router = useRouter();
	const searchParams = useSearchParams();
	const activePickId = searchParams.get("id");

	const {
		data: currentTaskData,
		isLoading,
		error,
		refetch,
	} = trpc.picker.getCurrentTask.useQuery({
		pickListId: activePickId ? Number(activePickId) : undefined,
	});

	const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

	const scanMutation = trpc.picker.scanItem.useMutation({
		onSuccess: () => refetch(),
	});

	const confirmExceptionMutation =
		trpc.picker.confirmQuantityWithException.useMutation({
			onSuccess: () => {
				toast.success(
					"Pick quantity & exception report recorded successfully.",
				);
				refetch();
				setConfirmItem(null);
				setConfirmQty(1);
				setDamagedQty(0);
				setMissingQty(0);
				setExceptionRemarks("");
				setPhotoEvidence("");
			},
			onError: (err) => {
				toast.error(err.message || "Failed to confirm quantity.");
			},
		});

	const confirmMutation = trpc.picker.manualConfirm.useMutation({
		onSuccess: () => {
			refetch();
			setConfirmItem(null);
			setConfirmQty(1);
		},
	});

	const pnaMutation = trpc.picker.reportPNA.useMutation({
		onSuccess: () => refetch(),
	});

	const completeMutation = trpc.warehouse.completePickingTask.useMutation({
		onSuccess: () => {
			setShowSuccessModal(true);
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPickingQueue.invalidate();
			utils.warehouse.getPackingQueue.invalidate();
			utils.warehouse.getPipelineHealth.invalidate();
			utils.picker.getDashboardStats.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to complete picking task.");
		},
	});

	const handleCompleteTask = () => {
		if (!task) return;
		const numericId = Number(task.id.replace("PL-", ""));
		completeMutation.mutate({ pickListId: numericId });
	};

	const [confirmItem, setConfirmItem] = useState<any | null>(null);
	const [confirmQty, setConfirmQty] = useState<number | string>(1);
	const [damagedQty, setDamagedQty] = useState<number | string>(0);
	const [missingQty, setMissingQty] = useState<number | string>(0);
	const [exceptionReason, setExceptionReason] =
		useState<string>("Damaged items");
	const [exceptionRemarks, setExceptionRemarks] = useState<string>("");
	const [photoEvidence, setPhotoEvidence] = useState<string>("");
	const [scannedBarcode, setScannedBarcode] = useState<string>("");
	const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);

	const task = currentTaskData?.task;
	const items = currentTaskData?.items ?? [];

	const openConfirmModal = (item: any) => {
		setConfirmItem(item);
		setConfirmQty(item.qty_picked > 0 ? item.qty_picked : item.qty_required);
		if (item.exception) {
			setDamagedQty(item.exception.quantity_damaged ?? 0);
			setMissingQty(item.exception.quantity_missing ?? 0);
			setExceptionReason(item.exception.reason ?? "Damaged items");
			setExceptionRemarks(item.exception.remarks ?? "");
			setPhotoEvidence(item.exception.photo_url ?? "");
		} else {
			setDamagedQty(0);
			setMissingQty(0);
			setExceptionReason("Damaged items");
			setExceptionRemarks("");
			setPhotoEvidence("");
		}
	};

	const handleScanCode = (code: string) => {
		const match = items.find((i) => i.sku === code || i.id.toString() === code);
		if (match) {
			scanMutation.mutate({ item_id: match.id });
			toast.success(`Scanned and verified ${match.product}!`);
		} else {
			toast.error(`No item found in this pick list matching barcode "${code}"`);
		}
	};

	const handleScanBarcodeSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!scannedBarcode.trim()) return;
		handleScanCode(scannedBarcode.trim());
		setScannedBarcode("");
	};

	const handleConfirmSubmit = () => {
		if (!confirmItem) return;
		const reqQty = Number(confirmItem.qty_required) || 1;
		let picked = Number(confirmQty);
		if (Number.isNaN(picked) || picked < 0) {
			toast.error("Please enter a valid picked quantity.");
			return;
		}
		if (picked > reqQty) {
			toast.error(
				`Picked quantity (${picked}) cannot exceed required quantity (${reqQty})`,
			);
			return;
		}

		const shortfall = Math.round((reqQty - picked) * 1000) / 1000;

		if (shortfall > 0) {
			const dmg = Number(damagedQty) || 0;
			const miss = Number(missingQty) || 0;
			const totalReported = Math.round((dmg + miss) * 1000) / 1000;

			if (totalReported === 0) {
				toast.error(
					`Remaining ${shortfall} units must be accounted for as damaged or missing.`,
				);
				return;
			}
			if (totalReported !== shortfall) {
				toast.error(
					`Damaged (${dmg}) + Missing (${miss}) must equal shortfall (${shortfall}).`,
				);
				return;
			}
			if (
				!exceptionRemarks.trim() &&
				(dmg > 0 || miss > 0 || exceptionReason === "Damaged items")
			) {
				toast.error("Remarks are required for damaged or missing items.");
				return;
			}

			confirmExceptionMutation.mutate({
				item_id: confirmItem.id,
				quantity_picked: picked,
				quantity_damaged: dmg,
				quantity_missing: miss,
				reason: exceptionReason as any,
				remarks: exceptionRemarks,
				photo_url: photoEvidence || undefined,
			});
		} else {
			confirmExceptionMutation.mutate({
				item_id: confirmItem.id,
				quantity_picked: picked,
				quantity_damaged: 0,
				quantity_missing: 0,
			});
		}
	};

	const pickedCount = task?.picked_items ?? 0;
	const totalCount = task?.total_items ?? 0;
	const pct = totalCount > 0 ? Math.round((pickedCount / totalCount) * 100) : 0;

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<PlaySquareIcon className="h-7 w-7 text-blue-600" />
						{t("activePickTaskExecution")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("activePickTaskExecutionSub")}
					</p>
				</div>

				{task && (
					<Button
						className="gap-2 bg-blue-600 text-white shadow-md hover:bg-blue-700"
						onClick={() => setShowCameraScanner(true)}
					>
						<CameraIcon className="h-4 w-4" /> {t("scanBarcodePhoneCamera")}
					</Button>
				)}
			</div>

			{isLoading ? (
				<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
					<Loader2Icon className="h-6 w-6 animate-spin text-blue-600" />{" "}
					{t("loadingActiveTask")}
				</div>
			) : error ? (
				<div className="flex h-40 items-center justify-center text-destructive">
					{error.message || "Error loading active task"}
				</div>
			) : !task ? (
				<Card className="border-border/50 py-12 text-center shadow-sm">
					<CardContent className="flex flex-col items-center gap-3">
						<PackageIcon className="h-12 w-12 text-muted-foreground opacity-40" />
						<h3 className="font-bold text-lg">{t("noActiveTask")}</h3>
						<p className="max-w-sm text-muted-foreground text-sm">
							{t("noActiveTaskSub")}
						</p>
						<Button
							className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
							onClick={() => (window.location.href = "/picker/pending")}
						>
							{t("viewPendingPicksQueue")}
						</Button>
					</CardContent>
				</Card>
			) : (
				<>
					{/* Progress & Task Card */}
					<Card className="border-blue-200 bg-blue-50/50 shadow-sm dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="space-y-4 p-6">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div className="space-y-2.5">
									<div className="flex flex-wrap items-center gap-2">
										<h2 className="flex items-center gap-2 font-bold text-blue-900 text-xl dark:text-blue-200">
											<PackageIcon className="h-6 w-6 text-blue-600" />
											{t("task")} {task.id} ({t("order")}: {task.order_id})
										</h2>
										{task.route_name && (
											<span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-800 text-xs dark:bg-blue-900/60 dark:text-blue-200">
												<NavigationIcon className="h-3 w-3" />
												{task.route_name}
											</span>
										)}
									</div>

									{/* Customer Details: Name, Phone Number, Delivery Address */}
									<div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs shadow-xs dark:border-blue-800/80 dark:bg-blue-950/60">
										<div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
											<UserIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
											<span>{task.customer_name || "N/A"}</span>
										</div>

										<span className="text-slate-400 dark:text-slate-500">
											•
										</span>

										<div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
											<PhoneIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
											{task.customer_phone && task.customer_phone !== "N/A" ? (
												<a
													href={`tel:${task.customer_phone}`}
													className="font-mono text-slate-800 hover:text-emerald-600 hover:underline dark:text-slate-200 dark:hover:text-emerald-400"
												>
													{task.customer_phone}
												</a>
											) : (
												<span className="font-mono text-slate-400 dark:text-slate-500">
													N/A
												</span>
											)}
										</div>

										<span className="text-slate-400 dark:text-slate-500">
											•
										</span>

										<div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
											<MapPinIcon className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
											<span
												className="truncate max-w-[280px] sm:max-w-[360px] dark:text-slate-200"
												title={task.customer_address || "N/A"}
											>
												{task.customer_address || "N/A"}
											</span>
										</div>
									</div>

									<p className="text-blue-700 text-xs dark:text-blue-400">
										{t("locationArea")}: {task.area} | {t("totalItemsToPick")}:{" "}
										{task.total_items}
									</p>
								</div>

								<div className="flex flex-wrap items-center gap-4">
									<div className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-800">
										<div className="text-right">
											<p className="text-muted-foreground text-xs">
												{t("pickProgress")}
											</p>
											<p className="font-bold text-blue-600 text-xl dark:text-blue-400">
												{task.picked_items} / {task.total_items} ({pct}%)
											</p>
										</div>
									</div>

									<Button
										className={`h-14 px-6 font-bold text-white shadow-md transition-all flex items-center gap-2 ${
											task.all_accounted || pct === 100
												? "animate-bounce bg-green-600 hover:bg-green-700"
												: "bg-gray-400 cursor-not-allowed opacity-70"
										}`}
										onClick={() => {
											if (!task.all_accounted && pct < 100) {
												const pendingCount = totalCount - pickedCount;
												toast.error(
													`Picking cannot be completed. ${pendingCount} item(s) are still pending confirmation or exception reporting.`,
												);
												return;
											}
											handleCompleteTask();
										}}
										disabled={completeMutation.isPending}
									>
										{completeMutation.isPending ? (
											<Loader2Icon className="h-5 w-5 animate-spin" />
										) : (
											<CheckCircle2Icon className="h-5 w-5" />
										)}
										<span>
											{completeMutation.isPending
												? t("completing")
												: t("completePicking")}
										</span>
									</Button>
								</div>
							</div>

							{/* Progress Bar */}
							<div className="h-3 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
								<div
									className="h-full bg-blue-600 transition-all duration-300"
									style={{ width: `${pct}%` }}
								/>
							</div>

							{/* Barcode Scanner Input + Camera Scanner Button */}
							<form
								onSubmit={handleScanBarcodeSubmit}
								className="flex gap-2 pt-2"
							>
								<div className="relative flex-1">
									<BarcodeIcon className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
									<input
										type="text"
										placeholder={t("scanPlaceholder")}
										className="w-full rounded-md border border-input bg-background py-2 pr-3 pl-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										value={scannedBarcode}
										onChange={(e) => setScannedBarcode(e.target.value)}
									/>
								</div>
								<Button
									type="submit"
									className="bg-blue-600 text-white hover:bg-blue-700"
								>
									{t("scanItem")}
								</Button>
								<Button
									type="button"
									variant="outline"
									className="gap-1.5 border-blue-600 text-blue-600 hover:bg-blue-50"
									onClick={() => setShowCameraScanner(true)}
								>
									<CameraIcon className="h-4 w-4" /> {t("cameraScanner")}
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Pick List Items Table */}
					<Card className="border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<MapPinIcon className="h-5 w-5 text-blue-600" />
								{t("requiredPickItemsList")}
							</CardTitle>
							<CardDescription>{t("locateItemsSub")}</CardDescription>
						</CardHeader>
						<CardContent>
							{/* Mobile View: High-Contrast Touch Cards (Phone-First) */}
							<div className="space-y-3 pb-12 sm:hidden sm:pb-0">
								{items.map((item) => {
									const isPicked = item.qty_picked >= item.qty_required;
									return (
										<div
											key={item.id}
											className={`rounded-xl border p-3.5 shadow-xs transition-all ${
												isPicked
													? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
													: item.status === "missing"
														? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
														: "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700"
											}`}
										>
											<div className="flex items-center justify-between gap-2 mb-2">
												<span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800 text-xs dark:bg-blue-900/60 dark:text-blue-200">
													<MapPinIcon className="h-3 w-3" />
													{item.location}
												</span>
												<span
													className={`rounded-full px-2 py-0.5 font-bold text-[11px] ${
														item.status === "picked"
															? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
															: item.status === "missing"
																? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
																: item.status === "partial"
																	? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
																	: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
													}`}
												>
													{item.status === "picked"
														? tCommon("picked")
														: item.status === "missing"
															? tCommon("missing")
															: item.status === "partial"
																? tCommon("partial")
																: tCommon("pending")}
												</span>
											</div>

											<div className="font-bold text-gray-900 text-base dark:text-gray-100">
												{item.product}
											</div>

											<div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
												<span>SKU: {item.sku}</span>
												{item.barcode && item.barcode !== item.sku && (
													<>
														<span>•</span>
														<span>Barcode: {item.barcode}</span>
													</>
												)}
												{item.batch && item.batch !== "Any" && (
													<>
														<span>•</span>
														<span>Batch: {item.batch}</span>
													</>
												)}
											</div>

											{/* Quantity Breakdown Grid */}
											<div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
												<div>
													<span className="text-muted-foreground">
														Required:
													</span>{" "}
													<strong className="font-mono text-foreground">
														{item.qty_required}
													</strong>
												</div>
												<div>
													<span className="text-muted-foreground">
														Avail Stock:
													</span>{" "}
													<strong className="font-mono text-foreground">
														{item.available_stock ?? "—"}
													</strong>
												</div>
												<div>
													<span className="text-muted-foreground">Picked:</span>{" "}
													<strong
														className={`font-mono font-bold ${
															isPicked
																? "text-green-600 dark:text-green-400"
																: "text-blue-600 dark:text-blue-400"
														}`}
													>
														{item.qty_picked}
													</strong>
												</div>
												<div>
													<span className="text-muted-foreground">
														Remaining:
													</span>{" "}
													<strong
														className={`font-mono ${item.remaining_qty > 0 ? "text-amber-600 font-bold" : "text-foreground"}`}
													>
														{item.remaining_qty}
													</strong>
												</div>
											</div>

											{item.exception && (
												<div className="mt-2 rounded-md bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
													<div className="font-semibold flex items-center gap-1">
														<AlertTriangleIcon className="h-3 w-3 text-amber-600" />
														Exception: {item.exception.reason} (
														{item.exception.status})
													</div>
													<div className="text-muted-foreground mt-0.5">
														Damaged: {item.exception.quantity_damaged} |
														Missing: {item.exception.quantity_missing}
													</div>
													{item.exception.remarks && (
														<div className="italic mt-0.5">
															&quot;{item.exception.remarks}&quot;
														</div>
													)}
												</div>
											)}

											{/* Action Buttons (Touch Friendly 44px Targets) */}
											<div className="mt-3 grid grid-cols-2 gap-2">
												<Button
													size="default"
													className={`min-h-[44px] font-semibold text-xs transition-all ${
														isPicked
															? "bg-green-600 text-white hover:bg-green-700"
															: "bg-blue-600 text-white hover:bg-blue-700"
													}`}
													onClick={() => openConfirmModal(item)}
												>
													<CheckCircle2Icon className="mr-1.5 h-4 w-4" />
													{isPicked ? "Update Qty" : t("confirmQty")}
												</Button>

												{item.status !== "missing" ? (
													<Button
														size="default"
														variant="outline"
														className="min-h-[44px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 text-xs font-semibold"
														onClick={() =>
															openConfirmModal({ ...item, qty_picked: 0 })
														}
													>
														<AlertTriangleIcon className="mr-1.5 h-4 w-4 text-red-500" />
														Report Shortage
													</Button>
												) : (
													<div className="flex items-center justify-center text-xs font-medium text-red-600">
														Marked Missing
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>

							{/* Desktop/Tablet Table View */}
							<div className="hidden sm:block overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("location")}</TableHead>
											<TableHead>{t("productName")}</TableHead>
											<TableHead>{t("skuBarcode")}</TableHead>
											<TableHead className="text-center">
												Req / Avail / Rem
											</TableHead>
											<TableHead className="text-center">Picked</TableHead>
											<TableHead>{tCommon("status")}</TableHead>
											<TableHead className="text-right">
												{tCommon("actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{items.map((item) => (
											<TableRow key={item.id} className="hover:bg-muted/50">
												<TableCell className="font-semibold text-blue-600 text-sm dark:text-blue-400">
													{item.location}
												</TableCell>
												<TableCell className="font-bold text-sm">
													<div>{item.product}</div>
													{item.exception && (
														<span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 mt-1">
															⚠️ {item.exception.reason}: Dmg{" "}
															{item.exception.quantity_damaged}, Miss{" "}
															{item.exception.quantity_missing}
														</span>
													)}
												</TableCell>
												<TableCell className="font-mono text-muted-foreground text-xs">
													<div>{item.sku}</div>
													{item.barcode && item.barcode !== item.sku && (
														<div className="text-[11px] text-gray-500">
															BC: {item.barcode}
														</div>
													)}
												</TableCell>
												<TableCell className="text-center text-xs font-mono">
													<div className="font-bold text-foreground">
														Req: {item.qty_required}
													</div>
													<div className="text-muted-foreground">
														Avail: {item.available_stock ?? "—"}
													</div>
													{item.remaining_qty > 0 && (
														<div className="font-bold text-amber-600">
															Rem: {item.remaining_qty}
														</div>
													)}
												</TableCell>
												<TableCell className="text-center font-semibold text-sm">
													<span
														className={
															item.qty_picked >= item.qty_required
																? "font-bold text-green-600"
																: item.qty_picked > 0
																	? "font-bold text-amber-600"
																	: "text-muted-foreground"
														}
													>
														{item.qty_picked}
													</span>
												</TableCell>
												<TableCell>
													<span
														className={`rounded-full px-2 py-0.5 font-medium text-xs ${
															item.status === "picked"
																? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
																: item.status === "missing"
																	? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
																	: item.status === "partial"
																		? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
																		: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
														}`}
													>
														{item.status === "picked"
															? tCommon("picked")
															: item.status === "missing"
																? tCommon("missing")
																: item.status === "partial"
																	? tCommon("partial")
																	: item.status === "completed"
																		? tCommon("completed")
																		: tCommon("pending")}
													</span>
												</TableCell>
												<TableCell className="flex items-center justify-end gap-2 text-right">
													<Button
														size="sm"
														variant="outline"
														className="h-8 gap-1"
														onClick={() => openConfirmModal(item)}
													>
														<CheckCircle2Icon className="h-3.5 w-3.5 text-green-600" />{" "}
														{item.qty_picked >= item.qty_required
															? "Update Qty"
															: t("confirmQty")}
													</Button>
													{item.status !== "missing" && (
														<Button
															size="sm"
															variant="outline"
															className="h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50"
															onClick={() =>
																openConfirmModal({ ...item, qty_picked: 0 })
															}
														>
															<AlertTriangleIcon className="h-3.5 w-3.5 text-red-500" />{" "}
															Report Shortage
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</>
			)}

			{/* Partial Picking & Stock Exception Confirmation Modal */}
			{confirmItem && (
				<Dialog
					open={!!confirmItem}
					onOpenChange={(open) => !open && setConfirmItem(null)}
				>
					<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-lg">
								<CheckCircle2Icon className="h-5 w-5 text-green-600" />
								Confirm Quantity & Verify Stock
							</DialogTitle>
							<DialogDescription>
								Confirm pick for{" "}
								<strong className="text-foreground">
									{confirmItem.product}
								</strong>
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2 text-sm">
							{/* Context Info Banner */}
							<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-xs">
								<div>
									<span className="text-muted-foreground">Order ID:</span>{" "}
									<strong className="text-foreground">
										{task?.order_id || "N/A"}
									</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Customer:</span>{" "}
									<strong className="text-foreground">
										{task?.customer_name || "N/A"}
									</strong>
								</div>
								<div>
									<span className="text-muted-foreground">SKU / Barcode:</span>{" "}
									<span className="font-mono text-foreground">
										{confirmItem.sku}
									</span>
								</div>
								<div>
									<span className="text-muted-foreground">
										Shelf / Location:
									</span>{" "}
									<span className="font-semibold text-blue-600 dark:text-blue-400">
										{confirmItem.location}
									</span>
								</div>
								<div>
									<span className="text-muted-foreground">Ordered Qty:</span>{" "}
									<strong className="text-foreground font-mono">
										{confirmItem.qty_required}
									</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Avail Stock:</span>{" "}
									<strong className="text-foreground font-mono">
										{confirmItem.available_stock ?? "—"}
									</strong>
								</div>
							</div>

							{/* Actual Picked Input */}
							<div className="space-y-1.5">
								<label className="font-semibold text-gray-800 text-xs dark:text-gray-200">
									Successfully Picked Quantity (Good Units):
								</label>
								<input
									type="number"
									min="0"
									step="any"
									max={confirmItem.qty_required}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 font-mono font-bold"
									value={confirmQty}
									onChange={(e) => {
										const rawVal = e.target.value;
										if (rawVal === "") {
											setConfirmQty("" as any);
											return;
										}
										const val = Number(rawVal);
										const maxAllowed = confirmItem.qty_required || 1;
										if (val > maxAllowed) {
											toast.error(
												`Picked quantity cannot exceed ordered quantity (${maxAllowed})`,
											);
											setConfirmQty(maxAllowed);
										} else {
											const cleanVal = val < 0 ? 0 : val;
											setConfirmQty(cleanVal);
											const diff = Math.max(0, maxAllowed - cleanVal);
											if (
												diff > 0 &&
												Number(damagedQty) + Number(missingQty) === 0
											) {
												setMissingQty(diff);
											}
										}
									}}
								/>
								<div className="flex justify-between text-[11px] text-muted-foreground font-mono">
									<span>Ordered: {confirmItem.qty_required}</span>
									<span
										className={
											Number(confirmQty) < confirmItem.qty_required
												? "text-amber-600 font-bold"
												: "text-green-600 font-bold"
										}
									>
										Remaining Shortfall:{" "}
										{Math.max(
											0,
											Math.round(
												((confirmItem.qty_required || 0) -
													(Number(confirmQty) || 0)) *
													1000,
											) / 1000,
										)}
									</span>
								</div>
							</div>

							{/* Partial Picking Shortfall Exception Section */}
							{Number(confirmQty) < confirmItem.qty_required && (
								<div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20">
									<div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
										<AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
										<span>
											Shortage / Exception Details (Warehouse Manager Approval
											Required)
										</span>
									</div>
									<p className="text-[11px] text-amber-800 dark:text-amber-300">
										You are confirming {Number(confirmQty) || 0} out of{" "}
										{confirmItem.qty_required} units. Allocate the shortfall (
										{Math.max(
											0,
											Math.round(
												((confirmItem.qty_required || 0) -
													(Number(confirmQty) || 0)) *
													1000,
											) / 1000,
										)}{" "}
										units) below:
									</p>

									<div className="grid grid-cols-2 gap-2">
										<div className="space-y-1">
											<label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
												Damaged Units:
											</label>
											<input
												type="number"
												min="0"
												step="any"
												className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-sm font-mono"
												value={damagedQty}
												onChange={(e) => {
													const val = Number(e.target.value) || 0;
													setDamagedQty(val);
													const shortfall = Math.max(
														0,
														confirmItem.qty_required - Number(confirmQty),
													);
													setMissingQty(Math.max(0, shortfall - val));
												}}
											/>
										</div>

										<div className="space-y-1">
											<label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
												Missing / Not Found:
											</label>
											<input
												type="number"
												min="0"
												step="any"
												className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-sm font-mono"
												value={missingQty}
												onChange={(e) => {
													const val = Number(e.target.value) || 0;
													setMissingQty(val);
													const shortfall = Math.max(
														0,
														confirmItem.qty_required - Number(confirmQty),
													);
													setDamagedQty(Math.max(0, shortfall - val));
												}}
											/>
										</div>
									</div>

									<div className="space-y-1">
										<label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
											Reason for Shortage / Exception{" "}
											<span className="text-red-500">*</span>:
										</label>
										<select
											className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-sm"
											value={exceptionReason}
											onChange={(e) => setExceptionReason(e.target.value)}
										>
											<option value="Damaged items">Damaged items</option>
											<option value="Stock not found">Stock not found</option>
											<option value="Wrong shelf location">
												Wrong shelf location
											</option>
											<option value="Expired items">Expired items</option>
											<option value="Inventory mismatch">
												Inventory mismatch
											</option>
											<option value="Other">Other</option>
										</select>
									</div>

									<div className="space-y-1">
										<label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
											Remarks / Defect Details{" "}
											<span className="text-red-500">*</span>:
										</label>
										<textarea
											rows={2}
											placeholder="Describe damage, seal broken, shelf empty, etc."
											className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-sm"
											value={exceptionRemarks}
											onChange={(e) => setExceptionRemarks(e.target.value)}
										/>
									</div>

									<div className="space-y-1">
										<label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
											Photo Evidence (Optional):
										</label>
										<div className="flex items-center gap-2">
											<input
												type="file"
												accept="image/*"
												className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file) {
														const reader = new FileReader();
														reader.onload = () => {
															setPhotoEvidence(reader.result as string);
														};
														reader.readAsDataURL(file);
													}
												}}
											/>
											{photoEvidence && (
												<span className="text-xs text-green-600 font-semibold">
													✓ Attached
												</span>
											)}
										</div>
										{photoEvidence && (
											<div className="mt-1">
												<img
													src={photoEvidence}
													alt="Evidence"
													className="h-16 w-16 object-cover rounded border"
												/>
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						<DialogFooter className="gap-2 sm:gap-0">
							<Button variant="ghost" onClick={() => setConfirmItem(null)}>
								{tCommon("cancel")}
							</Button>
							<Button
								disabled={
									confirmExceptionMutation.isPending ||
									confirmMutation.isPending
								}
								onClick={handleConfirmSubmit}
								className={`${
									Number(confirmQty) < confirmItem.qty_required
										? "bg-amber-600 hover:bg-amber-700 text-white"
										: "bg-green-600 hover:bg-green-700 text-white"
								}`}
							>
								{(confirmExceptionMutation.isPending ||
									confirmMutation.isPending) && (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								)}
								{Number(confirmQty) < confirmItem.qty_required
									? "Confirm Quantity & Submit Exception"
									: t("savePickCount")}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* Camera Barcode Scanner Modal */}
			<CameraBarcodeScannerModal
				open={showCameraScanner}
				onOpenChange={setShowCameraScanner}
				onScan={handleScanCode}
				title={t("cameraScannerTitle")}
				description={t("cameraScannerSub")}
			/>

			{/* Celebratory Completion Success Modal */}
			<Dialog
				open={showSuccessModal}
				onOpenChange={(open) => {
					if (!open) {
						setShowSuccessModal(false);
						router.push("/picker/pending");
					}
				}}
			>
				<DialogContent className="text-center sm:max-w-[420px]">
					<DialogHeader className="flex flex-col items-center justify-center pt-4">
						<div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
							<CheckCircle2Icon className="h-10 w-10 animate-pulse text-green-600" />
						</div>
						<DialogTitle className="font-bold text-green-800 text-xl dark:text-green-400">
							{t("taskCompletedTitle")}
						</DialogTitle>
						<DialogDescription className="mt-1 text-muted-foreground text-sm">
							{t("taskCompletedSub")}
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-2 border-border/50 border-y py-4 text-sm">
						<p className="flex justify-between">
							<span className="text-muted-foreground">
								{t("pickProgress")}:
							</span>
							<span className="font-bold text-green-600">
								{t("pickingStatusVerified")}
							</span>
						</p>
						<p className="flex justify-between">
							<span className="text-muted-foreground">{t("routingStep")}</span>
							<span className="font-semibold text-blue-600">
								{t("nextPackerQueue")}
							</span>
						</p>
					</div>

					<DialogFooter className="flex pt-2 sm:justify-center">
						<Button
							className="w-full bg-blue-600 text-white hover:bg-blue-700"
							onClick={() => {
								setShowSuccessModal(false);
								router.push("/picker/pending");
							}}
						>
							{t("returnToPendingPicks")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
