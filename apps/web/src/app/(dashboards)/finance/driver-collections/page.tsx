"use client";

import { Badge } from "@evaluna/ui/components/badge";
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
import { useTranslations } from "next-intl";
import { useState } from "react";
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
					<RefreshCwIcon
						className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
					/>
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
									<p className="mt-1 font-medium text-emerald-600 text-xs">
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
									<p className="mt-1 font-medium text-amber-600 text-xs">
										{
											collections.filter((c: any) =>
												c.paymentMethod.toLowerCase().includes("cash"),
											).length
										}{" "}
										{t("driver.handoverCompleted")}
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
									<p className="mt-1 font-medium text-blue-600 text-xs">
										{
											collections.filter(
												(c: any) =>
													!c.paymentMethod.toLowerCase().includes("cash"),
											).length
										}{" "}
										{t("driver.handoverCompleted")}
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
						<CardTitle className="text-lg">
							{t("finance.routePaymentAuditLedger")}
						</CardTitle>
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
							<option value="all">
								{t("common.all")} {t("sales.paymentMode")}
							</option>
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
										<TableHead className="text-right">
											{t("common.actions")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredCollections.map((col: any) => (
										<TableRow
											key={col.id}
											className="cursor-pointer hover:bg-muted/50"
											onClick={() => setSelectedCollection(col)}
										>
											<TableCell className="font-semibold text-sm">
												{col.driverName}
												<div className="font-normal text-muted-foreground text-xs">
													{col.driverEmail}
												</div>
											</TableCell>
											<TableCell className="text-sm">
												<div className="font-medium text-foreground">
													{col.customerName}
												</div>
												<div className="text-muted-foreground text-xs">
													{col.customerPhone}
												</div>
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
											<TableCell className="font-bold font-mono text-emerald-700 text-sm">
												₹{col.amount.toLocaleString("en-IN")}
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-xs">
												{col.transactionId}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{col.collectedAt}
											</TableCell>
											<TableCell>
												<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 text-xs dark:bg-emerald-900/40 dark:text-emerald-300">
													<CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
													{t("status.completed")}
												</span>
											</TableCell>
											<TableCell
												className="text-right"
												onClick={(e) => e.stopPropagation()}
											>
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
			<Dialog
				open={!!selectedCollection}
				onOpenChange={(open) => !open && setSelectedCollection(null)}
			>
				<DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between gap-4 text-xl">
							<div className="flex items-center gap-2">
								<FileTextIcon className="h-6 w-6 text-blue-600" />
								{t("finance.collectionDetails")} #{selectedCollection?.id}
							</div>
							<Badge
								variant="outline"
								className={
									selectedCollection?.paymentMethod
										?.toLowerCase()
										.includes("cash")
										? "border-amber-400 bg-amber-50 px-3 py-1 text-amber-800 text-sm"
										: "border-blue-400 bg-blue-50 px-3 py-1 text-blue-800 text-sm"
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
							<div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3.5 sm:grid-cols-4">
								<div>
									<span className="font-semibold text-muted-foreground text-xs uppercase">
										{t("common.amount")}
									</span>
									<p className="font-bold font-mono text-emerald-600 text-lg">
										₹{selectedCollection.amount.toLocaleString("en-IN")}
									</p>
								</div>
								<div>
									<span className="font-semibold text-muted-foreground text-xs uppercase">
										{t("sales.paymentMode")}
									</span>
									<p className="font-semibold text-foreground text-sm capitalize">
										{selectedCollection.paymentMethod}
									</p>
								</div>
								<div>
									<span className="font-semibold text-muted-foreground text-xs uppercase">
										Ref
									</span>
									<p className="truncate font-mono font-semibold text-slate-700 text-xs dark:text-slate-300">
										{selectedCollection.transactionId}
									</p>
								</div>
								<div>
									<span className="font-semibold text-muted-foreground text-xs uppercase">
										{t("common.date")}
									</span>
									<p className="font-medium text-slate-700 text-xs dark:text-slate-300">
										{selectedCollection.collectedAt}
									</p>
								</div>
							</div>

							{/* 2-Column: Driver Info & Customer Info */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2 rounded-lg border bg-background p-4">
									<h4 className="flex items-center gap-2 border-b pb-2 font-semibold text-foreground text-sm">
										<TruckIcon className="h-4 w-4 text-blue-600" />
										{t("finance.driverInfo")}
									</h4>
									<div className="space-y-1 text-sm">
										<p>
											<span className="text-muted-foreground">
												{t("common.name")}:
											</span>{" "}
											<span className="font-medium text-foreground">
												{selectedCollection.driverName}
											</span>
										</p>
										<p>
											<span className="text-muted-foreground">
												{t("common.email")}:
											</span>{" "}
											<span className="font-medium text-foreground">
												{selectedCollection.driverEmail}
											</span>
										</p>
										<p>
											<span className="text-muted-foreground">Trip:</span>{" "}
											<span className="font-mono text-foreground text-xs">
												TRIP-{selectedCollection.tripId}
											</span>
										</p>
									</div>
								</div>

								<div className="space-y-2 rounded-lg border bg-background p-4">
									<h4 className="flex items-center gap-2 border-b pb-2 font-semibold text-foreground text-sm">
										<UserIcon className="h-4 w-4 text-emerald-600" />
										{t("finance.customerInfo")}
									</h4>
									<div className="space-y-1 text-sm">
										<p>
											<span className="text-muted-foreground">
												{t("common.name")}:
											</span>{" "}
											<span className="font-medium text-foreground">
												{selectedCollection.customerName}
											</span>
										</p>
										<p>
											<span className="text-muted-foreground">
												{t("common.phone")}:
											</span>{" "}
											<span className="font-medium text-foreground">
												{selectedCollection.customerPhone}
											</span>
										</p>
										<p className="flex items-start gap-1">
											<MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
											<span className="text-muted-foreground text-xs">
												{selectedCollection.customerAddress}
											</span>
										</p>
									</div>
								</div>
							</div>

							{/* Linked Customer Orders Section */}
							<div className="space-y-3">
								<h4 className="flex items-center gap-2 font-semibold text-base text-foreground">
									<PackageIcon className="h-5 w-5 text-indigo-600" />
									{t("finance.linkedOrders")} (
									{selectedCollection.orders?.length || 0})
								</h4>

								{!selectedCollection.orders ||
								selectedCollection.orders.length === 0 ? (
									<div className="rounded-lg border p-4 text-center text-muted-foreground text-sm">
										{t("common.noItemFound")}
									</div>
								) : (
									selectedCollection.orders.map((order: any) => (
										<div
											key={order.id}
											className="space-y-3 rounded-lg border bg-background p-4"
										>
											<div className="flex flex-col justify-between gap-2 border-b pb-3 sm:flex-row sm:items-center">
												<div>
													<div className="flex items-center gap-2 font-bold text-base">
														<span>Order #{order.id}</span>
														<Badge
															variant="secondary"
															className="text-xs capitalize"
														>
															{t("common.status")}: {order.status}
														</Badge>
														<Badge className="border-emerald-300 bg-emerald-100 text-emerald-800 text-xs">
															{t("sales.driverCollected")}
														</Badge>
													</div>
													<p className="mt-0.5 text-muted-foreground text-xs">
														{t("common.date")}: {order.createdAt}
													</p>
												</div>
												<div className="text-right">
													<span className="font-medium text-muted-foreground text-xs uppercase">
														{t("common.total")}
													</span>
													<p className="font-bold font-mono text-emerald-600 text-lg">
														₹{order.totalAmount.toLocaleString("en-IN")}
													</p>
												</div>
											</div>

											{/* Order Items Table */}
											<div>
												<h5 className="mb-2 font-semibold text-muted-foreground text-xs uppercase">
													{t("finance.orderItemsBreakdown")}
												</h5>
												{!order.items || order.items.length === 0 ? (
													<p className="text-muted-foreground text-xs italic">
														{t("common.noItemFound")}
													</p>
												) : (
													<div className="overflow-x-auto rounded border">
														<Table>
															<TableHeader className="bg-muted/40">
																<TableRow>
																	<TableHead className="py-2 text-xs">
																		{t("common.name")}
																	</TableHead>
																	<TableHead className="py-2 text-xs">
																		{t("common.category")}
																	</TableHead>
																	<TableHead className="py-2 text-right text-xs">
																		{t("pos.qty")}
																	</TableHead>
																	<TableHead className="py-2 text-right text-xs">
																		{t("common.price")}
																	</TableHead>
																	<TableHead className="py-2 text-right text-xs">
																		{t("common.total")}
																	</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{order.items.map((item: any) => (
																	<TableRow key={item.id} className="text-xs">
																		<TableCell className="py-2 font-medium">
																			{item.productName}
																		</TableCell>
																		<TableCell className="py-2 text-muted-foreground">
																			{item.category}
																		</TableCell>
																		<TableCell className="py-2 text-right font-mono">
																			{item.quantity}
																		</TableCell>
																		<TableCell className="py-2 text-right font-mono">
																			₹{item.unitPrice.toLocaleString("en-IN")}
																		</TableCell>
																		<TableCell className="py-2 text-right font-mono font-semibold text-emerald-700">
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
