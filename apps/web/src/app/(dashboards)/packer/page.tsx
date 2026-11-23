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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import JsBarcode from "jsbarcode";
import {
	ArchiveIcon,
	ArrowRightIcon,
	BoxIcon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	PackageIcon,
	PrinterIcon,
	TrendingUpIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import {
	PackVerificationModal,
	type PackVerificationParcel,
} from "@/components/packer/PackVerificationModal";
import { useTRPC } from "@/lib/trpc/client";

export default function PackerDashboard() {
	const t = useTranslations("packer");
	const tCommon = useTranslations("common");
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const { data: stats } = trpc.packer.getDashboardStats.useQuery();
	const {
		data: pendingPickLists,
		isLoading: isLoadingPending,
		refetch: refetchPending,
	} = trpc.packer.getPendingToPack.useQuery(undefined, {
		refetchInterval: 15000,
		refetchIntervalInBackground: false,
	});
	const { data: historyList } = trpc.packer.getPackingHistory.useQuery({});

	const packMutation = trpc.packer.packOrder.useMutation({
		onSuccess: () => {
			refetchPending();
			setSelectedPickList(null);
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPackingQueue.invalidate();
			utils.warehouse.getPipelineHealth.invalidate();
			utils.packer.getDashboardStats.invalidate();
		},
	});

	// State for Pack Modal
	const [selectedPickList, setSelectedPickList] =
		useState<PackVerificationParcel | null>(null);

	// Print Shipping Tag State
	const [printPackage, setPrintPackage] = useState<{
		number: string;
		orderRef: string;
	} | null>(null);
	const printSvgRef = useRef<SVGSVGElement | null>(null);
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

	useEffect(() => {
		if (printSvgRef.current && printPackage?.number) {
			try {
				JsBarcode(printSvgRef.current, printPackage.number, {
					format: "CODE128",
					width: 2,
					height: 50,
					displayValue: true,
					fontSize: 12,
					margin: 5,
				});
			} catch (e) {
				console.error("Barcode print error:", e);
			}
		}
	}, [printPackage]);
	useEffect(() => {
		if (printPackage?.number) {
			QRCode.toDataURL(
				printPackage.number,
				{ width: 140, margin: 1, color: { dark: "#000000", light: "#ffffff" } },
				(err, url) => {
					if (!err && url) setQrCodeDataUrl(url);
				},
			);
		}
	}, [printPackage]);

	const handleConfirmPack = (data: {
		order_id: number;
		pick_list_id?: number;
		weight: number;
		dimensions: string;
		package_type?: string;
		notes?: string;
	}) => {
		packMutation.mutate({
			pick_list_id: data.pick_list_id,
			order_id: data.order_id,
			weight: data.weight,
			dimensions: data.dimensions,
			package_type: data.package_type,
			packing_notes: data.notes,
		});
	};

	const handlePrintLabel = (pkgNum: string, orderRef: string) => {
		setPrintPackage({ number: pkgNum, orderRef });
		setTimeout(() => {
			window.print();
		}, 300);
	};

	return (
		<PageTransition className="flex w-full min-w-0 max-w-full flex-col gap-4 sm:gap-6">
			{/* Printable Thermal Shipping Label */}
			<div className="hidden print:fixed print:inset-0 print:z-[9999] print:flex print:items-start print:justify-center print:bg-white print:p-2">
				<style
					dangerouslySetInnerHTML={{
						__html: `
					@media print {
						@page { size: 100mm 150mm; margin: 2mm; }
						body { margin: 0; padding: 0; }
					}
				`,
					}}
				/>
				{printPackage && (
					<div className="mx-auto flex w-[280px] flex-col items-center justify-center border-2 border-black p-4 text-center font-sans">
						<p className="font-bold text-sm">SHIPMENT PARCEL LABEL</p>
						<p className="mt-1 font-semibold text-gray-700 text-xs">
							Ref: {printPackage.orderRef}
						</p>
						<div className="my-2 flex flex-col items-center">
							<svg ref={printSvgRef} className="max-w-[240px]" />
							{qrCodeDataUrl && (
								<div className="mt-2 flex flex-col items-center border border-black bg-white p-1">
									<img
										src={qrCodeDataUrl}
										alt="QR Code"
										className="h-20 w-20 object-contain"
									/>
									<span className="font-bold font-mono text-[8px] text-black uppercase">
										Driver Scan QR
									</span>
								</div>
							)}
						</div>
						<p className="text-[10px] text-gray-500">
							PACKED & VERIFIED BY EVALUNA LOGISTICS
						</p>
					</div>
				)}
			</div>

			{/* Page Header */}
			<div className="flex w-full min-w-0 max-w-full flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex min-w-0 flex-col gap-1">
					<h1 className="truncate font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						{t("packerWorkspace")}
					</h1>
					<p className="line-clamp-2 text-muted-foreground text-xs sm:line-clamp-none sm:text-sm">
						{t("packerWorkspaceSub")}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-1 sm:gap-2">
					<Button
						className="h-8 bg-blue-600 px-3 text-xs shadow-sm hover:bg-blue-700 sm:h-9 sm:px-4 sm:text-sm"
						asChild
					>
						<Link href="/packer/pending">
							<PackageIcon className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> {t("viewPendingPacking")}
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<StaggerList
				className="grid w-full min-w-0 max-w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
				slow
			>
				<StaggerItem className="w-full min-w-0">
					<AnimatedCard className="w-full min-w-0">
						<Card
							className="group w-full min-w-0 cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/packer/pending")}
						>
							<CardContent className="w-full min-w-0 p-4 sm:p-5 md:p-6">
								<div className="flex w-full min-w-0 flex-col items-center justify-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<ClockIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										{t("pendingToPack")}
									</h3>
									<p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
										{stats?.pendingToPack || 0}
									</p>
									<p className="flex items-center gap-1 text-[11px] text-muted-foreground">
										<span>Open pending queue</span>
										<ArrowRightIcon className="h-3 w-3" />
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem className="w-full min-w-0">
					<AnimatedCard className="w-full min-w-0">
						<Card
							className="group w-full min-w-0 cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/packer/history")}
						>
							<CardContent className="w-full min-w-0 p-4 sm:p-5 md:p-6">
								<div className="flex w-full min-w-0 flex-col items-center justify-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<ArchiveIcon className="h-6 w-6 text-green-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										{t("packedToday")}
									</h3>
									<p className="font-bold text-2xl text-green-600 dark:text-green-400">
										{stats?.packedToday || 0}
									</p>
									<p className="flex items-center gap-1 text-[11px] text-muted-foreground">
										<span>View packing history</span>
										<ArrowRightIcon className="h-3 w-3" />
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem className="w-full min-w-0">
					<AnimatedCard className="w-full min-w-0">
						<Card
							className="group w-full min-w-0 cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/packer/reports")}
						>
							<CardContent className="w-full min-w-0 p-4 sm:p-5 md:p-6">
								<div className="flex w-full min-w-0 flex-col items-center justify-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<TrendingUpIcon className="h-6 w-6 text-yellow-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										{t("packingEfficiency")}
									</h3>
									<p className="font-bold text-2xl text-yellow-600 dark:text-yellow-400">
										{stats?.packingEfficiency ? `${stats.packingEfficiency.toFixed(1)}%` : "100%"}
									</p>
									<p className="flex items-center gap-1 text-[11px] text-muted-foreground">
										<span>View station reports</span>
										<ArrowRightIcon className="h-3 w-3" />
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem className="w-full min-w-0">
					<AnimatedCard className="w-full min-w-0">
						<Card
							className="group w-full min-w-0 cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/packer/history")}
						>
							<CardContent className="w-full min-w-0 p-4 sm:p-5 md:p-6">
								<div className="flex w-full min-w-0 flex-col items-center justify-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<TruckIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										{t("readyForDispatch")}
									</h3>
									<p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
										{stats?.packedToday || 0}
									</p>
									<p className="flex items-center gap-1 text-[11px] text-muted-foreground">
										<span>Ready for dispatch</span>
										<ArrowRightIcon className="h-3 w-3" />
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Pending Packing Orders Table */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
				className="w-full min-w-0 max-w-full"
			>
				<Card className="w-full min-w-0 max-w-full overflow-hidden border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="min-w-0 space-y-0.5">
							<CardTitle className="flex items-center gap-2 truncate text-base sm:text-lg">
								<BoxIcon className="h-5 w-5 shrink-0 text-blue-600" />
								<span className="truncate">{t("pendingOrdersReadyForPacking")}</span>
							</CardTitle>
							<CardDescription className="line-clamp-1 text-xs sm:line-clamp-none sm:text-sm">
								{t("completedPicklistsWaiting")}
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" className="shrink-0 text-xs sm:text-sm" asChild>
							<Link href="/packer/pending">
								<span className="hidden sm:inline">{t("viewPendingPacking")}</span>
								<span className="sm:hidden">View All</span>
								<ArrowRightIcon className="ml-1 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{isLoadingPending ? (
							<div className="flex h-32 items-center justify-center gap-2 text-muted-foreground text-xs">
								<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" />{" "}
								{tCommon("loading")}
							</div>
						) : !pendingPickLists || pendingPickLists.length === 0 ? (
							<div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground text-xs sm:text-sm">
								<CheckCircle2Icon className="h-8 w-8 text-green-500 opacity-60" />
								<span>{tCommon("noItemFound")}</span>
							</div>
						) : (
							<>
								{/* Mobile View: Clean, high-contrast touch cards */}
								<div className="space-y-3 sm:hidden">
									{pendingPickLists.slice(0, 5).map((pl) => (
										<div
											key={pl.id}
											className="rounded-xl border border-border/70 bg-card p-3 shadow-xs"
										>
											<div className="mb-2 flex items-center justify-between gap-2">
												<div className="min-w-0 flex items-center gap-1.5">
													<span className="truncate font-bold text-foreground text-sm">
														{pl.order_ref}
													</span>
													<span className="font-mono text-muted-foreground text-xs">
														(#{pl.id})
													</span>
												</div>
												<span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-[10px] text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
													{t("pendingPacking")}
												</span>
											</div>
											<div className="mb-2 flex items-center gap-1.5 text-xs">
												<UserIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
												<span className="truncate font-medium text-foreground">
													{pl.customerName || "Customer"}
												</span>
											</div>
											<div className="mb-3 text-[11px] text-muted-foreground">
												Picked at: {pl.completed_at || "Recent"}
											</div>
											<Button
												size="sm"
												className="h-9 w-full bg-blue-600 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99]"
												onClick={() => setSelectedPickList(pl)}
											>
												<BoxIcon className="mr-1.5 h-3.5 w-3.5" /> {t("packParcel")}
											</Button>
										</div>
									))}
								</div>

								{/* Desktop/Tablet View: Full Table */}
								<div className="hidden sm:block w-full min-w-0 max-w-full overflow-x-auto">
									<Table className="min-w-[550px]">
										<TableHeader>
											<TableRow>
												<TableHead>Picklist Ref</TableHead>
												<TableHead>{t("orderRef")}</TableHead>
												<TableHead>Customer Name</TableHead>
												<TableHead>{t("packedDate")}</TableHead>
												<TableHead>{tCommon("status")}</TableHead>
												<TableHead className="text-right">
													{tCommon("actions")}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{pendingPickLists.slice(0, 5).map((pl) => (
												<TableRow key={pl.id}>
													<TableCell className="font-mono font-semibold text-xs">
														{pl.id}
													</TableCell>
													<TableCell className="font-semibold text-sm">
														{pl.order_ref}
													</TableCell>
													<TableCell className="font-medium text-foreground text-xs">
														<div className="flex items-center gap-1.5">
															<UserIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
															<span className="font-semibold text-gray-900 dark:text-gray-100">
																{pl.customerName || "Customer"}
															</span>
														</div>
													</TableCell>
													<TableCell className="text-muted-foreground text-xs">
														{pl.completed_at}
													</TableCell>
													<TableCell>
														<span className="rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
															{t("pendingPacking")}
														</span>
													</TableCell>
													<TableCell className="text-right">
														<Button
															size="sm"
															className="h-8 bg-blue-600 text-white hover:bg-blue-700"
															onClick={() => setSelectedPickList(pl)}
														>
															<BoxIcon className="mr-1 h-3.5 w-3.5" />{" "}
															{t("packParcel")}
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Recent Packing History */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.4 }}
				className="w-full min-w-0 max-w-full"
			>
				<Card className="w-full min-w-0 max-w-full overflow-hidden border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="min-w-0 space-y-0.5">
							<CardTitle className="flex items-center gap-2 truncate text-base sm:text-lg">
								<ArchiveIcon className="h-5 w-5 shrink-0 text-blue-600" />
								<span className="truncate">{t("recentPackingHistory")}</span>
							</CardTitle>
							<CardDescription className="line-clamp-1 text-xs sm:line-clamp-none sm:text-sm">
								{t("packagesReadyForDispatch")}
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" className="shrink-0 text-xs sm:text-sm" asChild>
							<Link href="/packer/history">
								<span className="hidden sm:inline">{t("viewPendingPacking")}</span>
								<span className="sm:hidden">View All</span>
								<ArrowRightIcon className="ml-1 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{!historyList || historyList.length === 0 ? (
							<div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
								<ArchiveIcon className="h-8 w-8 opacity-30" />
								<span>{tCommon("noItemFound")}</span>
							</div>
						) : (
							<>
								{/* Mobile View: History Cards */}
								<div className="space-y-3 sm:hidden">
									{historyList.slice(0, 5).map((pkg, idx) => (
										<div
											key={idx}
											className="rounded-xl border border-border/70 bg-card p-3 shadow-xs"
										>
											<div className="mb-1.5 flex items-center justify-between gap-2">
												<span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
													{pkg.packageNumber}
												</span>
												<span className="font-semibold text-xs text-foreground">
													Ref: {pkg.orderId}
												</span>
											</div>
											<div className="mb-1 flex items-center gap-1.5 text-xs text-foreground">
												<UserIcon className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
												<span className="truncate font-medium">
													{pkg.customerName || "Customer Order"}
												</span>
											</div>
											<div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
												<span>Packed by: {pkg.packedBy || "Packer"}</span>
												<span>{pkg.packedAt}</span>
											</div>
											<Button
												variant="outline"
												size="sm"
												className="h-8 w-full gap-1 text-xs"
												onClick={() =>
													handlePrintLabel(pkg.packageNumber, pkg.orderId)
												}
											>
												<PrinterIcon className="h-3.5 w-3.5 text-gray-600" />{" "}
												{t("printLabel")}
											</Button>
										</div>
									))}
								</div>

								{/* Desktop/Tablet View: Table */}
								<div className="hidden sm:block w-full min-w-0 max-w-full overflow-x-auto">
									<Table className="min-w-[620px]">
										<TableHeader>
											<TableRow>
												<TableHead>{t("packageBarcode")}</TableHead>
												<TableHead>{t("orderRef")}</TableHead>
												<TableHead>{t("customerName")}</TableHead>
												<TableHead>{t("packedBy")}</TableHead>
												<TableHead>{t("packedDate")}</TableHead>
												<TableHead className="text-right">
													{t("labelAction")}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{historyList.slice(0, 5).map((pkg, idx) => (
												<TableRow key={idx}>
													<TableCell className="font-bold font-mono text-blue-600 text-xs dark:text-blue-400">
														{pkg.packageNumber}
													</TableCell>
													<TableCell className="font-semibold text-sm">
														{pkg.orderId}
													</TableCell>
													<TableCell className="font-medium text-foreground text-xs">
														<div className="flex items-center gap-1.5">
															<UserIcon className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
															<span className="font-semibold text-foreground">
																{pkg.customerName || "Customer Order"}
															</span>
														</div>
													</TableCell>
													<TableCell className="text-muted-foreground text-xs">
														{pkg.packedBy}
													</TableCell>
													<TableCell className="text-muted-foreground text-xs">
														{pkg.packedAt}
													</TableCell>
													<TableCell className="text-right">
														<Button
															variant="outline"
															size="sm"
															className="h-8 gap-1"
															onClick={() =>
																handlePrintLabel(pkg.packageNumber, pkg.orderId)
															}
														>
															<PrinterIcon className="h-3.5 w-3.5 text-gray-600" />{" "}
															{t("printLabel")}
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Double Verification Item Checklist & Pack Order Modal */}
			<PackVerificationModal
				open={!!selectedPickList}
				onOpenChange={(open) => !open && setSelectedPickList(null)}
				parcel={selectedPickList}
				isSubmitting={packMutation.isPending}
				onConfirmPack={handleConfirmPack}
			/>
		</PageTransition>
	);
}
