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
import { Badge } from "@evaluna/ui/components/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import {
	CheckCircle2Icon,
	EyeIcon,
	FileTextIcon,
	IndianRupeeIcon,
	Loader2Icon,
	MapPinIcon,
	PackageIcon,
	QrCodeIcon,
	RefreshCwIcon,
	SearchIcon,
	TruckIcon,
	UserIcon,
	WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function FinanceDriverCollectionsPage() {
	const t = useTranslations();
	const trpc = useTRPC();
	const {
		data: collections = [],
		isLoading,
		isFetching,
		refetch,
	} = trpc.finance.getDriverCollections.useQuery(undefined, {
		refetchInterval: 15000,
	});

	const [searchQuery, setSearchQuery] = useState("");
	const [methodFilter, setMethodFilter] = useState("all");
	const [selectedCollection, setSelectedCollection] = useState<any>(null);

	const totalCash = collections
		.filter((c: any) => c.paymentMethod.toLowerCase().includes("cash"))
		.reduce((acc: number, c: any) => acc + c.amount, 0);

	const totalOnline = collections
		.filter((c: any) => !c.paymentMethod.toLowerCase().includes("cash"))
		.reduce((acc: number, c: any) => acc + c.amount, 0);

	const totalCollected = totalCash + totalOnline;

	const filteredCollections = collections.filter((c: any) => {
		const matchesSearch =
			c.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesMethod =
			methodFilter === "all"
				? true
				: methodFilter === "cash"
					? c.paymentMethod.toLowerCase().includes("cash")
					: !c.paymentMethod.toLowerCase().includes("cash");
		return matchesSearch && matchesMethod;
	});

	return (
		<PageTransition className="container mx-auto space-y-6 p-4 md:p-6">
			{/* Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<TruckIcon className="h-7 w-7 text-blue-600" />
						{t("finance.driverCollections")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("finance.routePaymentAuditLedger")}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isFetching}
					className="gap-2"
				>
					<RefreshCwIcon className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					{isFetching ? t("common.loading") : t("common.update")}
				</Button>
			</div>

			{/* Metric Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-emerald-700 text-sm dark:text-emerald-400">
										{t("common.total")} {t("finance.driverCollections")}
									</p>
									<p className="font-bold text-3xl text-emerald-900 dark:text-emerald-200">
										₹{totalCollected.toLocaleString("en-IN")}
									</p>
									<p className="text-emerald-600 text-xs mt-1 font-medium">
										{collections.length} {t("status.completed")}
									</p>
								</div>
								<IndianRupeeIcon className="h-8 w-8 text-emerald-600" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-amber-700 text-sm dark:text-amber-400">
										{t("finance.cashCollected")}
									</p>
									<p className="font-bold text-3xl text-amber-900 dark:text-amber-200">
										₹{totalCash.toLocaleString("en-IN")}
									</p>
									<p className="text-amber-600 text-xs mt-1 font-medium">
										{collections.filter((c: any) => c.paymentMethod.toLowerCase().includes("cash")).length} {t("driver.handoverCompleted")}
									</p>
								</div>
								<WalletIcon className="h-8 w-8 text-amber-600" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										{t("finance.onlineUpiCollected")}
									</p>
									<p className="font-bold text-3xl text-blue-900 dark:text-blue-200">
										₹{totalOnline.toLocaleString("en-IN")}
									</p>
									<p className="text-blue-600 text-xs mt-1 font-medium">
										{collections.filter((c: any) => !c.paymentMethod.toLowerCase().includes("cash")).length} {t("driver.handoverCompleted")}
									</p>
								</div>
								<QrCodeIcon className="h-8 w-8 text-blue-600" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table */}
			<Card className="shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="text-lg">{t("finance.routePaymentAuditLedger")}</CardTitle>
						<CardDescription>
							{filteredCollections.length} {t("driver.handoverCompleted")}.
						</CardDescription>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<select
							className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
							value={methodFilter}
							onChange={(e) => setMethodFilter(e.target.value)}
						>
							<option value="all">{t("common.all")} {t("sales.paymentMode")}</option>
							<option value="cash">{t("driver.fullCash")}</option>
							<option value="online">{t("driver.fullOnline")}</option>
						</select>

						<div className="relative w-full sm:w-64">
							<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
							<input
								type="text"
								placeholder={t("common.search")}
								className="w-full rounded-md border border-input bg-background py-1.5 pr-3 pl-9 text-sm shadow-sm"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" />
							{t("common.loading")}
						</div>
					) : filteredCollections.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-emerald-500 opacity-40" />
							<p>{t("common.noItemFound")}</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("driver.driverStaff")}</TableHead>
										<TableHead>{t("sales.customerName")}</TableHead>
										<TableHead>{t("sales.paymentMode")}</TableHead>
										<TableHead>{t("common.amount")}</TableHead>
										<TableHead>Ref</TableHead>
										<TableHead>{t("common.date")}</TableHead>
										<TableHead>{t("common.status")}</TableHead>
										<TableHead className="text-right">{t("common.actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredCollections.map((col: any) => (
										<TableRow
											key={col.id}
											className="hover:bg-muted/50 cursor-pointer"
											onClick={() => setSelectedCollection(col)}
										>
											<TableCell className="font-semibold text-sm">
												{col.driverName}
												<div className="text-muted-foreground text-xs font-normal">
													{col.driverEmail}
												</div>
											</TableCell>
											<TableCell className="text-sm">
												<div className="font-medium text-foreground">{col.customerName}</div>
												<div className="text-muted-foreground text-xs">{col.customerPhone}</div>
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className={
														col.paymentMethod.toLowerCase().includes("cash")
															? "border-amber-400 bg-amber-50 text-amber-800"
															: "border-blue-400 bg-blue-50 text-blue-800"
													}
												>
													{col.paymentMethod}
												</Badge>
											</TableCell>
											<TableCell className="font-bold text-sm font-mono text-emerald-700">
												₹{col.amount.toLocaleString("en-IN")}
											</TableCell>
											<TableCell className="font-mono text-xs text-muted-foreground">
												{col.transactionId}
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{col.collectedAt}
											</TableCell>
											<TableCell>
												<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 text-xs dark:bg-emerald-900/40 dark:text-emerald-300">
													<CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
													{t("status.completed")}
												</span>
											</TableCell>
											<TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
												<Button
													size="sm"
													variant="outline"
													className="h-8 gap-1.5 border-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40"
													onClick={() => setSelectedCollection(col)}
												>
													<EyeIcon className="h-3.5 w-3.5" />
													{t("finance.inspectOrder")}
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

			{/* Full Order & Collection Inspection Modal */}
			<Dialog open={!!selectedCollection} onOpenChange={(open) => !open && setSelectedCollection(null)}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between gap-4 text-xl">
							<div className="flex items-center gap-2">
								<FileTextIcon className="h-6 w-6 text-blue-600" />
								{t("finance.collectionDetails")} #{selectedCollection?.id}
							</div>
							<Badge
								variant="outline"
								className={
									selectedCollection?.paymentMethod?.toLowerCase().includes("cash")
										? "border-amber-400 bg-amber-50 text-amber-800 text-sm px-3 py-1"
										: "border-blue-400 bg-blue-50 text-blue-800 text-sm px-3 py-1"
								}
							>
								{selectedCollection?.paymentMethod}
							</Badge>
						</DialogTitle>
						<DialogDescription>
							{t("finance.orderItemsBreakdown")}
						</DialogDescription>
					</DialogHeader>

					{selectedCollection && (
						<div className="space-y-6 pt-2">
							{/* Highlights summary grid */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3.5 rounded-lg border">
								<div>
									<span className="text-xs text-muted-foreground uppercase font-semibold">{t("common.amount")}</span>
									<p className="text-lg font-bold text-emerald-600 font-mono">
										₹{selectedCollection.amount.toLocaleString("en-IN")}
									</p>
								</div>
								<div>
									<span className="text-xs text-muted-foreground uppercase font-semibold">{t("sales.paymentMode")}</span>
									<p className="text-sm font-semibold capitalize text-foreground">
										{selectedCollection.paymentMethod}
									</p>
								</div>
								<div>
									<span className="text-xs text-muted-foreground uppercase font-semibold">Ref</span>
									<p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">
										{selectedCollection.transactionId}
									</p>
								</div>
								<div>
									<span className="text-xs text-muted-foreground uppercase font-semibold">{t("common.date")}</span>
									<p className="text-xs font-medium text-slate-700 dark:text-slate-300">
										{selectedCollection.collectedAt}
									</p>
								</div>
							</div>

							{/* 2-Column: Driver Info & Customer Info */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="border p-4 rounded-lg space-y-2 bg-background">
									<h4 className="flex items-center gap-2 font-semibold text-sm border-b pb-2 text-foreground">
										<TruckIcon className="h-4 w-4 text-blue-600" />
										{t("finance.driverInfo")}
									</h4>
									<div className="text-sm space-y-1">
										<p><span className="text-muted-foreground">{t("common.name")}:</span> <span className="font-medium text-foreground">{selectedCollection.driverName}</span></p>
										<p><span className="text-muted-foreground">{t("common.email")}:</span> <span className="font-medium text-foreground">{selectedCollection.driverEmail}</span></p>
										<p><span className="text-muted-foreground">Trip:</span> <span className="font-mono text-xs text-foreground">TRIP-{selectedCollection.tripId}</span></p>
									</div>
								</div>

								<div className="border p-4 rounded-lg space-y-2 bg-background">
									<h4 className="flex items-center gap-2 font-semibold text-sm border-b pb-2 text-foreground">
										<UserIcon className="h-4 w-4 text-emerald-600" />
										{t("finance.customerInfo")}
									</h4>
									<div className="text-sm space-y-1">
										<p><span className="text-muted-foreground">{t("common.name")}:</span> <span className="font-medium text-foreground">{selectedCollection.customerName}</span></p>
										<p><span className="text-muted-foreground">{t("common.phone")}:</span> <span className="font-medium text-foreground">{selectedCollection.customerPhone}</span></p>
										<p className="flex items-start gap-1">
											<MapPinIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
											<span className="text-xs text-muted-foreground">{selectedCollection.customerAddress}</span>
										</p>
									</div>
								</div>
							</div>

							{/* Linked Customer Orders Section */}
							<div className="space-y-3">
								<h4 className="flex items-center gap-2 font-semibold text-base text-foreground">
									<PackageIcon className="h-5 w-5 text-indigo-600" />
									{t("finance.linkedOrders")} ({selectedCollection.orders?.length || 0})
								</h4>

								{(!selectedCollection.orders || selectedCollection.orders.length === 0) ? (
									<div className="p-4 border rounded-lg text-center text-sm text-muted-foreground">
										{t("common.noItemFound")}
									</div>
								) : (
									selectedCollection.orders.map((order: any) => (
										<div key={order.id} className="border rounded-lg p-4 space-y-3 bg-background">
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
												<div>
													<div className="flex items-center gap-2 font-bold text-base">
														<span>Order #{order.id}</span>
														<Badge variant="secondary" className="capitalize text-xs">
															{t("common.status")}: {order.status}
														</Badge>
														<Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
															{t("sales.driverCollected")}
														</Badge>
													</div>
													<p className="text-xs text-muted-foreground mt-0.5">
														{t("common.date")}: {order.createdAt}
													</p>
												</div>
												<div className="text-right">
													<span className="text-xs text-muted-foreground uppercase font-medium">{t("common.total")}</span>
													<p className="text-lg font-bold text-emerald-600 font-mono">
														₹{order.totalAmount.toLocaleString("en-IN")}
													</p>
												</div>
											</div>

											{/* Order Items Table */}
											<div>
												<h5 className="font-semibold text-xs text-muted-foreground uppercase mb-2">{t("finance.orderItemsBreakdown")}</h5>
												{(!order.items || order.items.length === 0) ? (
													<p className="text-xs text-muted-foreground italic">{t("common.noItemFound")}</p>
												) : (
													<div className="overflow-x-auto rounded border">
														<Table>
															<TableHeader className="bg-muted/40">
																<TableRow>
																	<TableHead className="text-xs py-2">{t("common.name")}</TableHead>
																	<TableHead className="text-xs py-2">{t("common.category")}</TableHead>
																	<TableHead className="text-xs py-2 text-right">{t("pos.qty")}</TableHead>
																	<TableHead className="text-xs py-2 text-right">{t("common.price")}</TableHead>
																	<TableHead className="text-xs py-2 text-right">{t("common.total")}</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{order.items.map((item: any) => (
																	<TableRow key={item.id} className="text-xs">
																		<TableCell className="font-medium py-2">{item.productName}</TableCell>
																		<TableCell className="text-muted-foreground py-2">{item.category}</TableCell>
																		<TableCell className="text-right font-mono py-2">{item.quantity}</TableCell>
																		<TableCell className="text-right font-mono py-2">₹{item.unitPrice.toLocaleString("en-IN")}</TableCell>
																		<TableCell className="text-right font-mono font-semibold text-emerald-700 py-2">
																			₹{item.totalPrice.toLocaleString("en-IN")}
																		</TableCell>
																	</TableRow>
																))}
															</TableBody>
														</Table>
													</div>
												)}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
