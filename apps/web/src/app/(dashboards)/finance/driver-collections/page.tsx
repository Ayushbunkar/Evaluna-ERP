// @ts-nocheck
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	AlertTriangle,
	Banknote,
	CheckCircle2,
	CheckCircle2Icon,
	EyeIcon,
	FileText,
	FileTextIcon,
	IndianRupee,
	IndianRupeeIcon,
	Layers,
	Loader2Icon,
	MapPin,
	MapPinIcon,
	Package,
	PackageCheck,
	PackageIcon,
	Phone,
	QrCode,
	QrCodeIcon,
	RefreshCwIcon,
	SearchIcon,
	ShoppingCart,
	TrendingUp,
	TrendingUpIcon,
	Truck,
	TruckIcon,
	User,
	UserIcon,
	WalletIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { DateFilterBar } from "@/components/shared/filters/date-filter-bar";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function FinanceDriverCollectionsPage() {
	const t = useTranslations();
	const trpc = useTRPC();
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [datePreset, setDatePreset] = useState("all");

	const {
		data: collections = [],
		isLoading,
		isFetching,
		refetch,
	} = trpc.finance.getDriverCollections.useQuery(
		{
			startDate: startDate || undefined,
			endDate: endDate || undefined,
		},
		{
			refetchInterval: 15000,
		},
	);

	const [searchQuery, setSearchQuery] = useState("");
	const [methodFilter, setMethodFilter] = useState("all");
	const [selectedCollection, setSelectedCollection] = useState<any>(null);
	const [inspectTab, setInspectTab] = useState("bill2");

	// Consolidate multi-method payments for the same customer delivery stop into one row
	const groupedCollections = useMemo(() => {
		const groupsMap: Record<string, any> = {};

		for (const col of collections) {
			let groupKey = "";
			if (col.stopId) {
				groupKey = `stop_${col.tripId}_${col.stopId}`;
			} else if (col.referenceNumber && col.referenceNumber.startsWith("STOP-")) {
				groupKey = `ref_${col.tripId}_${col.referenceNumber}`;
			} else if (col.customerId && col.tripId) {
				groupKey = `cust_${col.tripId}_${col.customerId}`;
			} else {
				groupKey = `drv_${col.driverName}_${(col.collectedAt || "").substring(0, 10)}_${col.customerName || ""}`;
			}

			const amt = Number(col.amount || 0);
			const isCash = (col.paymentMethod || "").toLowerCase().includes("cash");

			if (!groupsMap[groupKey]) {
				groupsMap[groupKey] = {
					...col,
					amount: amt,
					cashAmount: isCash ? amt : 0,
					onlineAmount: !isCash ? amt : 0,
					paymentMethods: [col.paymentMethod || "Cash"],
					transactionIds: [col.transactionId || col.referenceNumber].filter(Boolean),
					allCollections: [col],
					orders: col.orders || [],
					returnedItems: col.returnedItems || [],
					deliveryNotes: col.deliveryNotes || "",
				};
			} else {
				groupsMap[groupKey].amount += amt;
				if (isCash) {
					groupsMap[groupKey].cashAmount += amt;
				} else {
					groupsMap[groupKey].onlineAmount += amt;
				}
				const methodStr = col.paymentMethod || "Cash";
				if (!groupsMap[groupKey].paymentMethods.includes(methodStr)) {
					groupsMap[groupKey].paymentMethods.push(methodStr);
				}
				const txnId = col.transactionId || col.referenceNumber;
				if (txnId && !groupsMap[groupKey].transactionIds.includes(txnId)) {
					groupsMap[groupKey].transactionIds.push(txnId);
				}
				groupsMap[groupKey].allCollections.push(col);

				if (col.orders && col.orders.length > 0) {
					for (const o of col.orders) {
						if (!groupsMap[groupKey].orders.some((existing: any) => existing.id === o.id)) {
							groupsMap[groupKey].orders.push(o);
						}
					}
				}
				if (col.returnedItems && col.returnedItems.length > 0) {
					for (const r of col.returnedItems) {
						if (
							!groupsMap[groupKey].returnedItems.some(
								(existing: any) => existing.id === r.id || existing.name === r.name
							)
						) {
							groupsMap[groupKey].returnedItems.push(r);
						}
					}
				}
			}
		}

		return Object.values(groupsMap).map((group: any) => {
			let displayMethod = group.paymentMethods.join(" & ");
			if (group.cashAmount > 0 && group.onlineAmount > 0) {
				displayMethod = "Online/UPI & Cash";
			}

			// Calculate cost price and selling price taking doorstep returns into account
			let groupCost = 0;
			let groupSelling = 0;

			if (group.orders && group.orders.length > 0) {
				for (const o of group.orders) {
					let ordDeliveredCost = 0;
					let ordDeliveredSelling = 0;
					for (const it of o.items || []) {
						const ret = (group.returnedItems || []).find(
							(r: any) =>
								(r.name || r.productName)?.toLowerCase() ===
								(it.productName || "").toLowerCase(),
						);
						const retQty = ret ? Number(ret.qty || ret.quantity || 1) : 0;
						const acceptedQty = Math.max(0, Number(it.quantity || 1) - retQty);
						const itCost =
							acceptedQty * Number(it.costPrice || Number(it.unitPrice || 0) * 0.8);
						const itSelling = acceptedQty * Number(it.unitPrice || 0);
						ordDeliveredCost += itCost;
						ordDeliveredSelling += itSelling;
					}
					groupCost += ordDeliveredCost;
					groupSelling +=
						ordDeliveredSelling > 0
							? ordDeliveredSelling
							: Number(o.sellingPrice || o.totalAmount || 0);
				}
			}

			if (groupSelling === 0 && group.amount > 0) {
				groupSelling = group.amount;
				if (groupCost === 0) {
					groupCost = group.amount * 0.8;
				}
			}

			const groupNetProfit = groupSelling - groupCost;
			const groupMargin =
				groupSelling > 0 ? (groupNetProfit / groupSelling) * 100 : 0;

			return {
				...group,
				paymentMethodLabel: displayMethod,
				transactionIdLabel: group.transactionIds.join(", "),
				costPrice: Number(groupCost.toFixed(2)),
				sellingPrice: Number(groupSelling.toFixed(2)),
				netProfit: Number(groupNetProfit.toFixed(2)),
				marginPercent: Number(groupMargin.toFixed(1)),
			};
		});
	}, [collections]);

	const filteredCollections = useMemo(() => {
		return groupedCollections.filter((c: any) => {
			const q = searchQuery.toLowerCase();
			const matchesSearch =
				!searchQuery ||
				c.driverName?.toLowerCase().includes(q) ||
				c.customerName?.toLowerCase().includes(q) ||
				c.transactionIdLabel?.toLowerCase().includes(q) ||
				c.referenceNumber?.toLowerCase().includes(q);

			const matchesMethod =
				methodFilter === "all"
					? true
					: methodFilter === "cash"
						? c.cashAmount > 0
						: c.onlineAmount > 0;

			let matchesDate = true;
			if (startDate) {
				const itemDate = (c.rawCollectedAt || "").substring(0, 10);
				if (itemDate && itemDate < startDate) matchesDate = false;
			}
			if (endDate) {
				const itemDate = (c.rawCollectedAt || "").substring(0, 10);
				if (itemDate && itemDate > endDate) matchesDate = false;
			}

			return matchesSearch && matchesMethod && matchesDate;
		});
	}, [groupedCollections, searchQuery, methodFilter, startDate, endDate]);

	const totalCash = useMemo(() => {
		return filteredCollections.reduce(
			(acc: number, c: any) => acc + (Number(c.cashAmount) || 0),
			0,
		);
	}, [filteredCollections]);

	const totalOnline = useMemo(() => {
		return filteredCollections.reduce(
			(acc: number, c: any) => acc + (Number(c.onlineAmount) || 0),
			0,
		);
	}, [filteredCollections]);

	const totalCollected = totalCash + totalOnline;

	const totalSellingPrice = useMemo(() => {
		return filteredCollections.reduce(
			(acc: number, c: any) => acc + (Number(c.sellingPrice) || 0),
			0,
		);
	}, [filteredCollections]);

	const totalCostPrice = useMemo(() => {
		return filteredCollections.reduce(
			(acc: number, c: any) => acc + (Number(c.costPrice) || 0),
			0,
		);
	}, [filteredCollections]);

	const totalNetProfit = totalSellingPrice - totalCostPrice;
	const netProfitMargin =
		totalSellingPrice > 0 ? (totalNetProfit / totalSellingPrice) * 100 : 0;

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
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				{/* 1. Total Collections */}
				<StaggerItem>
					<Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20 shadow-xs">
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
										{filteredCollections.length} Handover Collections
									</p>
								</div>
								<IndianRupeeIcon className="h-8 w-8 text-emerald-600" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				{/* 2. Cash Collected */}
				<StaggerItem>
					<Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 shadow-xs">
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
										Cash Handover Portion
									</p>
								</div>
								<WalletIcon className="h-8 w-8 text-amber-600" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				{/* 3. Online / UPI Collected */}
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 shadow-xs">
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
										Online / UPI Portion
									</p>
								</div>
								<QrCodeIcon className="h-8 w-8 text-blue-600" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				{/* 4. Net Profit Card (Selling Price - Cost Price) */}
				<StaggerItem>
					<Card className="border-purple-200 bg-purple-50/60 dark:border-purple-900/50 dark:bg-purple-950/20 shadow-xs">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<div className="flex items-center gap-1.5">
										<p className="font-medium text-purple-700 text-sm dark:text-purple-400">
											Net Profit (शुद्ध लाभ)
										</p>
										<span
											className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
												totalNetProfit >= 0
													? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300"
													: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300"
											}`}
										>
											{netProfitMargin.toFixed(1)}% Margin
										</span>
									</div>
									<p
										className={`font-bold text-3xl font-mono mt-0.5 ${
											totalNetProfit >= 0
												? "text-purple-950 dark:text-purple-100"
												: "text-rose-700 dark:text-rose-400"
										}`}
									>
										{totalNetProfit >= 0 ? "+" : ""}₹{totalNetProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
									</p>
									<p className="mt-1 font-medium text-purple-700/80 text-xs dark:text-purple-300/80">
										Selling ₹{totalSellingPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })} − Cost ₹{totalCostPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
									</p>
								</div>
								<div className="rounded-xl bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
									<TrendingUp className="h-7 w-7" />
								</div>
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table */}
			<Card className="shadow-sm">
				<CardHeader className="space-y-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="text-lg">
								{t("finance.routePaymentAuditLedger")}
							</CardTitle>
							<CardDescription>
								{filteredCollections.length} Customer Handovers Completed.
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
					</div>

					<DateFilterBar
						startDate={startDate}
						endDate={endDate}
						datePreset={datePreset}
						totalCount={filteredCollections.length}
						countLabel="handovers"
						totalAmount={totalCollected}
						amountLabel="Total Collections:"
						onDateChange={(start, end, preset) => {
							setStartDate(start);
							setEndDate(end);
							setDatePreset(preset);
						}}
					/>
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
										<TableHead>Net Profit (शुद्ध लाभ)</TableHead>
										<TableHead>Ref / Txn ID</TableHead>
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
											onClick={() => {
												setSelectedCollection(col);
												setInspectTab("bill2");
											}}
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
														col.cashAmount > 0 && col.onlineAmount > 0
															? "border-purple-400 bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-300 font-semibold"
															: col.cashAmount > 0
																? "border-amber-400 bg-amber-50 text-amber-800"
																: "border-blue-400 bg-blue-50 text-blue-800"
													}
												>
													{col.paymentMethodLabel}
												</Badge>
											</TableCell>
											<TableCell className="font-bold font-mono text-emerald-700 text-sm">
												<div>₹{col.amount.toLocaleString("en-IN")}</div>
												{col.cashAmount > 0 && col.onlineAmount > 0 && (
													<div className="text-[11px] text-muted-foreground font-normal flex items-center gap-1.5 mt-0.5">
														<span className="flex items-center gap-0.5 text-amber-700 dark:text-amber-400 font-semibold">
															<Banknote className="h-3 w-3 text-amber-600" /> ₹{col.cashAmount}
														</span>
														<span>•</span>
														<span className="flex items-center gap-0.5 text-blue-700 dark:text-blue-400 font-semibold">
															<QrCode className="h-3 w-3 text-blue-600" /> ₹{col.onlineAmount}
														</span>
													</div>
												)}
											</TableCell>
											<TableCell className="text-sm font-medium">
												<div
													className={`font-bold font-mono ${
														(col.netProfit ?? 0) >= 0
															? "text-purple-700 dark:text-purple-400"
															: "text-rose-600"
													}`}
												>
													{(col.netProfit ?? 0) >= 0 ? "+" : ""}₹
													{(col.netProfit || 0).toLocaleString("en-IN", {
														maximumFractionDigits: 0,
													})}
												</div>
												<div className="text-[11px] text-muted-foreground whitespace-nowrap">
													Cost: ₹{(col.costPrice || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} • {col.marginPercent || 0}%
												</div>
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-xs max-w-[180px] truncate">
												{col.transactionIdLabel}
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
													className="h-8 gap-1.5 border-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 font-semibold"
													onClick={() => {
														setSelectedCollection(col);
														setInspectTab("bill2");
													}}
												>
													<EyeIcon className="h-3.5 w-3.5 text-blue-600" />
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

			{/* Full Order & Two-Bill Inspection Modal */}
			<Dialog
				open={!!selectedCollection}
				onOpenChange={(open) => !open && setSelectedCollection(null)}
			>
				<DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-6">
					<DialogHeader className="border-b pb-3">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
								<FileTextIcon className="h-6 w-6 text-blue-600" />
								Order Audit & Collection Details
							</DialogTitle>
							<Badge
								variant="outline"
								className={
									selectedCollection?.cashAmount > 0 && selectedCollection?.onlineAmount > 0
										? "border-purple-400 bg-purple-50 text-purple-900 px-3 py-1 text-sm font-bold"
										: "border-emerald-400 bg-emerald-50 text-emerald-900 px-3 py-1 text-sm font-bold"
								}
							>
								{selectedCollection?.paymentMethodLabel}
							</Badge>
						</div>
						<DialogDescription className="text-xs text-muted-foreground mt-1">
							Compare Initial Out-for-Delivery Bill vs Doorstep Final Settled Bill
						</DialogDescription>
					</DialogHeader>

					{selectedCollection && (
						<div className="space-y-5 pt-2">
							{/* Summary Grid */}
							<div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3.5 sm:grid-cols-5">
								<div>
									<span className="font-semibold text-muted-foreground text-xs uppercase">
										Initial Out Bill
									</span>
									<p className="font-extrabold font-mono text-blue-600 text-xl">
										₹{(selectedCollection.orders?.[0]?.totalAmount || selectedCollection.amount).toLocaleString("en-IN")}
									</p>
									<span className="text-[11px] text-muted-foreground block mt-0.5">
										Dispatched Total
									</span>
								</div>
								<div>
									<span className="font-semibold text-muted-foreground text-xs uppercase">
										Final Settled Bill
									</span>
									<p className="font-extrabold font-mono text-emerald-600 text-xl">
										₹{selectedCollection.amount.toLocaleString("en-IN")}
									</p>
									{selectedCollection.cashAmount > 0 && selectedCollection.onlineAmount > 0 ? (
										<span className="text-[11px] text-muted-foreground block mt-0.5">
											Cash: ₹{selectedCollection.cashAmount} • UPI: ₹{selectedCollection.onlineAmount}
										</span>
									) : (
										<span className="text-[11px] text-muted-foreground block mt-0.5">
											Collected by Driver
										</span>
									)}
								</div>
								<div>
									<span className="font-semibold text-muted-foreground text-xs uppercase">
										Payment Mode
									</span>
									<p className="font-semibold text-foreground text-sm mt-0.5">
										{selectedCollection.paymentMethodLabel}
									</p>
								</div>
								<div>
									<span className="font-semibold text-muted-foreground text-xs uppercase">
										Ref / Txn ID
									</span>
									<p className="truncate font-mono font-semibold text-slate-700 text-xs mt-0.5 dark:text-slate-300">
										{selectedCollection.transactionIdLabel}
									</p>
								</div>
								<div>
									<span className="font-semibold text-muted-foreground text-xs uppercase">
										Handover Time
									</span>
									<p className="font-medium text-slate-700 text-xs mt-0.5 dark:text-slate-300">
										{selectedCollection.collectedAt}
									</p>
								</div>
							</div>

							{/* Driver & Customer Cards */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2 rounded-lg border bg-card p-4 shadow-xs">
									<h4 className="flex items-center gap-2 border-b pb-2 font-bold text-foreground text-sm">
										<Truck className="h-4 w-4 text-blue-600" />
										Driver & Vehicle Info
									</h4>
									<div className="space-y-1 text-xs">
										<p>
											<span className="text-muted-foreground">Driver Staff:</span>{" "}
											<span className="font-semibold text-foreground">
												{selectedCollection.driverName}
											</span>
										</p>
										<p>
											<span className="text-muted-foreground">Email:</span>{" "}
											<span className="font-medium text-foreground">
												{selectedCollection.driverEmail}
											</span>
										</p>
										<p>
											<span className="text-muted-foreground">Delivery Trip:</span>{" "}
											<span className="font-mono font-semibold text-blue-600">
												TRIP-{selectedCollection.tripId}
											</span>
										</p>
									</div>
								</div>

								<div className="space-y-2 rounded-lg border bg-card p-4 shadow-xs">
									<h4 className="flex items-center gap-2 border-b pb-2 font-bold text-foreground text-sm">
										<User className="h-4 w-4 text-emerald-600" />
										Customer Delivery Info
									</h4>
									<div className="space-y-1 text-xs">
										<p>
											<span className="text-muted-foreground">Customer Name:</span>{" "}
											<span className="font-semibold text-foreground">
												{selectedCollection.customerName}
											</span>
										</p>
										<p>
											<span className="text-muted-foreground">Contact:</span>{" "}
											<span className="font-medium text-foreground">
												{selectedCollection.customerPhone}
											</span>
										</p>
										<p className="flex items-start gap-1">
											<MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
											<span className="text-muted-foreground">
												{selectedCollection.customerAddress}
											</span>
										</p>
									</div>
								</div>
							</div>

							{/* 2 BILLS AUDIT TABS */}
							<div className="space-y-3 pt-2">
								<div className="flex items-center justify-between border-b pb-2">
									<h3 className="text-sm font-bold text-foreground flex items-center gap-2">
										<Layers className="h-4 w-4 text-indigo-600" />
										2-Bill Handover Lifecycle Audit (दोनों बिलों का विवरण)
									</h3>
								</div>

								<Tabs value={inspectTab} onValueChange={setInspectTab} className="w-full space-y-4">
									<TabsList className="grid grid-cols-2 w-full bg-muted/70 p-1">
										<TabsTrigger value="bill1" className="text-xs font-semibold py-2">
											1️⃣ Initial Bill (जो ड्राइवर लेके निकला था)
										</TabsTrigger>
										<TabsTrigger value="bill2" className="text-xs font-semibold py-2">
											2️⃣ Final Doorstep & Collection Bill (अंतिम संग्रह बिल)
										</TabsTrigger>
									</TabsList>

									{/* BILL 1: INITIAL OUT-FOR-DELIVERY BILL */}
									<TabsContent value="bill1">
										<Card className="border-blue-200 dark:border-blue-900/40">
											<CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 py-3">
												<div className="flex items-center justify-between">
													<div>
														<CardTitle className="text-sm font-bold text-blue-950 dark:text-blue-200 flex items-center gap-2">
															<ShoppingCart className="h-4 w-4 text-blue-600" />
															Bill 1: Initial Out-for-Delivery Invoice (आरंभिक बिल)
														</CardTitle>
														<CardDescription className="text-xs">
															The original items and amounts loaded on the vehicle when driver departed for delivery.
														</CardDescription>
													</div>
													<Badge className="bg-blue-600 text-white font-semibold">Initial Bill</Badge>
												</div>
											</CardHeader>
											<CardContent className="p-4 space-y-4">
												{(!selectedCollection.orders || selectedCollection.orders.length === 0) ? (
													<p className="text-xs text-muted-foreground text-center py-4">No order items recorded.</p>
												) : (
													selectedCollection.orders.map((order: any) => (
														<div key={order.id} className="space-y-2">
															<div className="flex items-center justify-between text-xs font-bold bg-muted/40 p-2 rounded border">
																<span>Order #{order.id}</span>
																<span className="text-blue-600 font-mono text-sm">
																	Initial Total: ₹{(order.totalAmount || 0).toLocaleString("en-IN")}
																</span>
															</div>

															<Table>
																<TableHeader>
																	<TableRow className="text-xs">
																		<TableHead>Product Name</TableHead>
																		<TableHead className="text-center">Dispatched Qty</TableHead>
																		<TableHead className="text-right">Unit Rate</TableHead>
																		<TableHead className="text-right">Subtotal</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{(order.items || []).map((item: any) => (
																		<TableRow key={item.id} className="text-xs">
																			<TableCell className="font-medium">
																				{item.productName}
																			</TableCell>
																			<TableCell className="text-center font-bold text-blue-700">
																				{item.quantity}
																			</TableCell>
																			<TableCell className="text-right">
																				₹{(item.unitPrice || 0).toLocaleString("en-IN")}
																			</TableCell>
																			<TableCell className="text-right font-medium">
																				₹{(item.totalPrice || item.unitPrice * item.quantity || 0).toLocaleString("en-IN")}
																			</TableCell>
																		</TableRow>
																	))}
																</TableBody>
															</Table>
														</div>
													))
												)}
											</CardContent>
										</Card>
									</TabsContent>

									{/* BILL 2: FINAL DOORSTEP SETTLEMENT BILL */}
									<TabsContent value="bill2">
										<Card className="border-emerald-200 dark:border-emerald-900/40">
											<CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 py-3">
												<div className="flex items-center justify-between">
													<div>
														<CardTitle className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
															<PackageCheck className="h-4 w-4 text-emerald-600" />
															Bill 2: Doorstep Delivered & Settled Bill (अंतिम संग्रह बिल)
														</CardTitle>
														<CardDescription className="text-xs">
															Final doorstep handover — verified accepted items, returns/damage deductions, and payment collected.
														</CardDescription>
													</div>
													<Badge className="bg-emerald-600 text-white font-semibold">Final Settled</Badge>
												</div>
											</CardHeader>
											<CardContent className="p-4 space-y-5">
												{/* Settled Items Table */}
												{(!selectedCollection.orders || selectedCollection.orders.length === 0) ? (
													<p className="text-xs text-muted-foreground text-center py-4">No delivered item details recorded.</p>
												) : (
													selectedCollection.orders.map((order: any) => {
														const retItems = selectedCollection.returnedItems || [];
														return (
															<div key={order.id} className="space-y-2">
																<div className="flex items-center justify-between text-xs font-bold bg-emerald-50/80 p-2 rounded border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50">
																	<span>Delivered Order #{order.id} Items</span>
																	<span className="text-emerald-700 font-mono text-sm dark:text-emerald-400">
																		Settled Total: ₹{(selectedCollection.amount || order.totalAmount || 0).toLocaleString("en-IN")}
																	</span>
																</div>

																<Table>
																	<TableHeader>
																		<TableRow className="text-xs">
																			<TableHead>Product Name</TableHead>
																			<TableHead className="text-center">Dispatched Qty</TableHead>
																			<TableHead className="text-center">Accepted / Delivered Qty</TableHead>
																			<TableHead className="text-right">Unit Rate</TableHead>
																			<TableHead className="text-right">Unit Cost</TableHead>
																			<TableHead className="text-right">Final Subtotal</TableHead>
																			<TableHead className="text-right">Net Profit</TableHead>
																		</TableRow>
																	</TableHeader>
																	<TableBody>
																		{(order.items || []).map((item: any) => {
																			const ret = retItems.find(
																				(r: any) => (r.name || r.productName)?.toLowerCase() === (item.productName || "").toLowerCase()
																			);
																			const retQty = ret ? Number(ret.qty || ret.quantity || 1) : 0;
																			const acceptedQty = Math.max(0, Number(item.quantity || 1) - retQty);
																			const subtotal = acceptedQty * Number(item.unitPrice || 0);
																			const itemCostRate = Number(item.costPrice || Number(item.unitPrice || 0) * 0.8);
																			const totalItemCost = acceptedQty * itemCostRate;
																			const itemProfit = subtotal - totalItemCost;

																			return (
																				<TableRow key={item.id} className="text-xs">
																					<TableCell className="font-medium">
																						{item.productName}
																						{retQty > 0 && (
																							<span className="ml-2 text-[10px] text-red-600 font-bold">
																								({retQty} Returned at Doorstep)
																							</span>
																						)}
																					</TableCell>
																					<TableCell className="text-center font-medium text-slate-500">
																						{item.quantity}
																					</TableCell>
																					<TableCell className="text-center font-bold text-emerald-700 dark:text-emerald-400">
																						{acceptedQty}
																					</TableCell>
																					<TableCell className="text-right">
																						₹{(item.unitPrice || 0).toLocaleString("en-IN")}
																					</TableCell>
																					<TableCell className="text-right font-mono text-muted-foreground">
																						₹{itemCostRate.toLocaleString("en-IN")}
																					</TableCell>
																					<TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
																						₹{subtotal.toLocaleString("en-IN")}
																					</TableCell>
																					<TableCell
																						className={`text-right font-bold font-mono ${
																							itemProfit >= 0
																								? "text-purple-700 dark:text-purple-400"
																								: "text-rose-600"
																						}`}
																					>
																						{itemProfit >= 0 ? "+" : ""}₹{itemProfit.toLocaleString("en-IN")}
																					</TableCell>
																				</TableRow>
																			);
																		})}
																	</TableBody>
																</Table>
															</div>
														);
													})
												)}

												{/* Doorstep Returns Alert if present */}
												{selectedCollection.returnedItems && selectedCollection.returnedItems.length > 0 ? (
													<div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
														<div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs">
															<AlertTriangle className="h-4 w-4" />
															<span>Doorstep Returned / Damaged Items ({selectedCollection.returnedItems.length})</span>
														</div>
														<div className="space-y-1 text-xs">
															{selectedCollection.returnedItems.map((ret: any, idx: number) => (
																<div key={idx} className="flex justify-between items-center text-red-800 dark:text-red-300 border-b border-red-500/10 pb-1">
																	<span>• {ret.name || ret.productName} (Qty: {ret.qty || ret.quantity || 1})</span>
																	<span className="font-mono font-medium">Reason: {ret.reason || "Rejected at doorstep"}</span>
																</div>
															))}
														</div>
													</div>
												) : (
													<div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
														<CheckCircle2 className="h-4 w-4 text-emerald-600" />
														<span>All items accepted in full at doorstep without returns or damage.</span>
													</div>
												)}

												{/* Payment & Profit Breakdown Cards */}
												<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
													<div className="p-3 rounded-lg bg-card border shadow-xs flex items-center gap-3">
														<div className="p-2 rounded-full bg-amber-500/10 text-amber-600">
															<Banknote className="h-5 w-5" />
														</div>
														<div>
															<div className="text-[11px] text-muted-foreground">Cash Collected</div>
															<div className="text-base font-bold text-amber-700 dark:text-amber-400">
																₹{(selectedCollection.cashAmount || 0).toLocaleString("en-IN")}
															</div>
														</div>
													</div>

													<div className="p-3 rounded-lg bg-card border shadow-xs flex items-center gap-3">
														<div className="p-2 rounded-full bg-blue-500/10 text-blue-600">
															<QrCode className="h-5 w-5" />
														</div>
														<div>
															<div className="text-[11px] text-muted-foreground">Online / UPI Collected</div>
															<div className="text-base font-bold text-blue-700 dark:text-blue-400">
																₹{(selectedCollection.onlineAmount || 0).toLocaleString("en-IN")}
															</div>
														</div>
													</div>

													<div className="p-3 rounded-lg bg-emerald-600 text-white shadow-xs flex items-center gap-3">
														<div className="p-2 rounded-full bg-white/20 text-white">
															<CheckCircle2 className="h-5 w-5" />
														</div>
														<div>
															<div className="text-[11px] text-white/80">Total Bill Settled</div>
															<div className="text-lg font-black">
																₹{(selectedCollection.amount || 0).toLocaleString("en-IN")}
															</div>
														</div>
													</div>

													<div className="p-3 rounded-lg bg-purple-50 border border-purple-200 dark:bg-purple-950/30 dark:border-purple-900/50 shadow-xs flex items-center gap-3">
														<div className="p-2 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
															<TrendingUp className="h-5 w-5" />
														</div>
														<div>
															<div className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">
																Net Profit ({selectedCollection.marginPercent || 0}% Margin)
															</div>
															<div
																className={`text-base font-bold font-mono ${
																	(selectedCollection.netProfit ?? 0) >= 0
																		? "text-purple-950 dark:text-purple-200"
																		: "text-rose-600"
																}`}
															>
																{(selectedCollection.netProfit ?? 0) >= 0 ? "+" : ""}₹
																{(selectedCollection.netProfit || 0).toLocaleString("en-IN")}
															</div>
															<div className="text-[10px] text-purple-600/80 dark:text-purple-400/80">
																Cost: ₹{(selectedCollection.costPrice || 0).toLocaleString("en-IN")}
															</div>
														</div>
													</div>
												</div>

												{/* Driver Delivery Remarks */}
												{selectedCollection.deliveryNotes && (
													<div className="p-3 rounded bg-muted/40 border text-xs">
														<span className="font-semibold text-foreground">Driver Remarks:</span>{" "}
														<span className="text-muted-foreground">{selectedCollection.deliveryNotes}</span>
													</div>
												)}
											</CardContent>
										</Card>
									</TabsContent>
								</Tabs>
							</div>
						</div>
					)}

					<DialogFooter className="border-t pt-3">
						<Button
							variant="outline"
							onClick={() => setSelectedCollection(null)}
						>
							Close Audit
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
