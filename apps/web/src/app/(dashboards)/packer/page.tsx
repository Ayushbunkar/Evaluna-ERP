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
import JsBarcode from "jsbarcode";
import {
	ActivityIcon,
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
import { useEffect, useRef, useState } from "react";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PackerDashboard() {
	const t = useTranslations("packer");
	const tCommon = useTranslations("common");
	const trpc = useTRPC();
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
			setWeight("1.5");
			setDimensions("30x20x10 cm");
		},
	});

	// State for Pack Modal
	const [selectedPickList, setSelectedPickList] = useState<any | null>(null);
	const [weight, setWeight] = useState("1.5");
	const [dimensions, setDimensions] = useState("30x20x10 cm");

	// Print Shipping Tag State
	const [printPackage, setPrintPackage] = useState<{
		number: string;
		orderRef: string;
	} | null>(null);
	const printSvgRef = useRef<SVGSVGElement | null>(null);

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

	const handlePackSubmit = () => {
		if (!selectedPickList) return;
		packMutation.mutate({
			pick_list_id: selectedPickList.pick_list_id,
			order_id: selectedPickList.id
				? Number.parseInt(selectedPickList.id.replace(/\D/g, "") || "1", 10)
				: 1,
			weight: Number.parseFloat(weight) || 1.0,
			dimensions: dimensions || "Standard Box",
		});
	};

	const handlePrintLabel = (pkgNum: string, orderRef: string) => {
		setPrintPackage({ number: pkgNum, orderRef });
		setTimeout(() => {
			window.print();
		}, 300);
	};

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			{/* Printable Thermal Shipping Label */}
			<div className="hidden print:fixed print:inset-0 print:z-[9999] print:block print:bg-white print:p-4">
				{printPackage && (
					<div className="mx-auto flex w-[280px] flex-col items-center justify-center border-2 border-black p-4 text-center font-sans">
						<p className="font-bold text-sm">SHIPMENT PARCEL LABEL</p>
						<p className="mt-1 font-semibold text-gray-700 text-xs">
							Ref: {printPackage.orderRef}
						</p>
						<svg ref={printSvgRef} className="my-2" />
						<p className="text-[10px] text-gray-500">
							PACKED & VERIFIED BY EVALUNA LOGISTICS
						</p>
					</div>
				)}
			</div>

			{/* Page Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						{t("packerWorkspace")}
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						{t("packerWorkspaceSub")}
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button
						className="bg-blue-600 text-xs shadow-sm hover:bg-blue-700 sm:text-sm"
						asChild
					>
						<Link href="/packer/pending">
							<PackageIcon className="mr-2 h-4 w-4" /> {t("viewPendingPacking")}
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<StaggerList
				className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
				slow
			>
				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/packer/pending")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<ClockIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										{t("pendingToPack")}
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.pendingToPack || 0}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
							onClick={() => (window.location.href = "/packer/history")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<ArchiveIcon className="h-6 w-6 text-green-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										{t("packedToday")}
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.packedToday || 0}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
							onClick={() => (window.location.href = "/packer/reports")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<TrendingUpIcon className="h-6 w-6 text-yellow-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										{t("packingEfficiency")}
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.packingEfficiency?.toFixed(1)}%
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
							onClick={() => (window.location.href = "/packer/history")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<TruckIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										{t("readyForDispatch")}
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.packedToday || 0}
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
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
								<BoxIcon className="h-5 w-5 text-blue-600" />
								{t("pendingOrdersReadyForPacking")}
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								{t("completedPicklistsWaiting")}
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/packer/pending">
								{t("viewPendingPacking")}{" "}
								<ArrowRightIcon className="ml-2 h-4 w-4" />
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
							<div className="overflow-x-auto">
								<Table>
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
												<TableCell className="font-medium text-xs text-foreground">
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
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Recent Packing History */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.4 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
								<ArchiveIcon className="h-5 w-5 text-blue-600" />
								{t("recentPackingHistory")}
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								{t("packagesReadyForDispatch")}
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/packer/history">
								{t("viewPendingPacking")}{" "}
								<ArrowRightIcon className="ml-2 h-4 w-4" />
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
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("packageBarcode")}</TableHead>
											<TableHead>{t("orderRef")}</TableHead>
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
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Pack Order Modal */}
			{selectedPickList && (
				<Dialog
					open={!!selectedPickList}
					onOpenChange={(open) => !open && setSelectedPickList(null)}
				>
					<DialogContent className="sm:max-w-[480px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<BoxIcon className="h-5 w-5 text-blue-600" />
								{t("packParcel")} {selectedPickList.order_ref}
							</DialogTitle>
							<DialogDescription>{t("recordParcelWeight")}</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2 text-sm">
							<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900 text-xs dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
								<p>
									<strong>Picklist:</strong> {selectedPickList.id}
								</p>
								<p>
									<strong>{t("orderRef")}:</strong> {selectedPickList.order_ref}
								</p>
								<p>
									<strong>{tCommon("status")}:</strong> {t("pendingPacking")}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										{t("parcelWeight")}
									</label>
									<input
										type="number"
										step="0.1"
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={weight}
										onChange={(e) => setWeight(e.target.value)}
									/>
								</div>

								<div className="space-y-1">
									<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										{t("boxDimensions")}
									</label>
									<input
										type="text"
										placeholder="e.g. 30x20x10 cm"
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={dimensions}
										onChange={(e) => setDimensions(e.target.value)}
									/>
								</div>
							</div>
						</div>

						<DialogFooter className="flex justify-end gap-2">
							<Button variant="ghost" onClick={() => setSelectedPickList(null)}>
								{tCommon("cancel")}
							</Button>
							<Button
								disabled={packMutation.isPending}
								onClick={handlePackSubmit}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								{packMutation.isPending && (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								)}
								{t("completePackingAndSave")}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</PageTransition>
	);
}
