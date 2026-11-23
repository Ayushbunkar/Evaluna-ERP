"use client";

import { useState } from "react";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertOctagonIcon,
	AlertTriangleIcon,
	BarChart3Icon,
	BoxesIcon,
	CalendarIcon,
	ClockIcon,
	DownloadIcon,
	FileSpreadsheetIcon,
	FilterIcon,
	HelpCircleIcon,
	IndianRupeeIcon,
	LayersIcon,
	PackageCheckIcon,
	PlusIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldAlertIcon,
	TrendingDownIcon,
	WarehouseIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const MONTHS = [
	{ value: 1, label: "January (जनवरी)" },
	{ value: 2, label: "February (फ़रवरी)" },
	{ value: 3, label: "March (मार्च)" },
	{ value: 4, label: "April (अप्रैल)" },
	{ value: 5, label: "May (मई)" },
	{ value: 6, label: "June (जून)" },
	{ value: 7, label: "July (जुलाई)" },
	{ value: 8, label: "August (अगस्त)" },
	{ value: 9, label: "September (सितंबर)" },
	{ value: 10, label: "October (अक्टूबर)" },
	{ value: 11, label: "November (नवंबर)" },
	{ value: 12, label: "December (दिसंबर)" },
];

const YEARS = [2024, 2025, 2026, 2027];

export default function WarehouseDiscrepancyReportPage() {
	const trpc = useTRPC();
	const now = new Date();

	const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
	const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
	const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
	const [selectedType, setSelectedType] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");

	// Queries
	const { data: branchesList = [] } = trpc.branches.list.useQuery();

	const {
		data: reportData,
		isLoading,
		isRefetching,
		refetch,
	} = trpc.audit.getMonthlyDiscrepancyReport.useQuery({
		month: selectedMonth,
		year: selectedYear,
		branchId: selectedBranchId,
		discrepancyType: selectedType,
		search: searchQuery || undefined,
	});

	const summary = reportData?.summary ?? {
		totalLossValue: 0,
		totalVarianceUnits: 0,
		theftCount: 0,
		theftLossValue: 0,
		theftLineCount: 0,
		damageCount: 0,
		damageLossValue: 0,
		damageLineCount: 0,
		missingCount: 0,
		missingLossValue: 0,
		missingLineCount: 0,
		expiryCount: 0,
		expiryLossValue: 0,
		excessCount: 0,
		excessGainValue: 0,
		auditsWithDiscrepancyCount: 0,
	};

	const items = reportData?.items ?? [];
	const byCategory = reportData?.byCategory ?? [];

	// CSV Export Handler
	const handleExportCSV = () => {
		if (items.length === 0) {
			toast.info("No discrepancy records available to export for this month.");
			return;
		}

		const headers = [
			"Audit Number",
			"Audit Date",
			"Branch",
			"Product Name",
			"SKU",
			"Category",
			"Expected Qty",
			"Counted Qty",
			"Variance Qty",
			"Discrepancy Type",
			"Reason & Remarks",
			"Unit Cost (INR)",
			"Loss Value (INR)",
			"Counter / Auditor",
			"Resolution Status",
		];

		const rows = items.map((item) => [
			`"${item.auditNumber}"`,
			`"${new Date(item.auditDate).toLocaleDateString("en-IN")}"`,
			`"${item.branchName || ""}"`,
			`"${item.productName.replace(/"/g, '""')}"`,
			`"${item.sku || ""}"`,
			`"${item.category || ""}"`,
			item.expectedQty,
			item.countedQty ?? "N/A",
			item.varianceQty,
			`"${item.discrepancyType.toUpperCase()}"`,
			`"${(item.discrepancyReason || "").replace(/"/g, '""')}"`,
			item.unitPrice.toFixed(2),
			item.lossValue.toFixed(2),
			`"${item.auditorName || ""}"`,
			`"${item.resolutionStatus || ""}"`,
		]);

		const csvContent =
			"data:text/csv;charset=utf-8," +
			[headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute(
			"download",
			`inventory-discrepancy-report-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		toast.success("Discrepancy report exported to CSV!");
	};

	return (
		<PageTransition className="container mx-auto space-y-6 p-4 sm:p-6">
			{/* Command Header Banner */}
			<div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card/90 p-5 sm:p-6 shadow-xs backdrop-blur-md md:flex-row md:items-center">
				<div className="space-y-1">
					<div className="flex items-center gap-2.5">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
							<ShieldAlertIcon className="h-5 w-5" />
						</span>
						<div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Monthly Physical Count & Loss Report
							</h1>
							<p className="text-muted-foreground text-xs sm:text-sm">
								मासिक स्टॉक विसंगति, चोरी (Theft) एवं टूटा-फूटा (Damage) ट्रैकिंग व नुकसान ऑडिट रिपोर्ट।
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLoading || isRefetching}
						className="h-9 gap-1.5 text-xs font-medium"
					>
						<RefreshCwIcon
							className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>

					<Button
						variant="default"
						size="sm"
						onClick={handleExportCSV}
						className="h-9 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
					>
						<DownloadIcon className="h-3.5 w-3.5" />
						Export CSV
					</Button>
				</div>
			</div>

			{/* Filter Controls Bar */}
			<Card className="border-border/60 shadow-xs">
				<CardContent className="p-4 sm:p-5">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
						{/* Month Selector */}
						<div>
							<label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Month / महीना
							</label>
							<select
								value={selectedMonth}
								onChange={(e) => setSelectedMonth(Number(e.target.value))}
								className="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
							>
								{MONTHS.map((m) => (
									<option key={m.value} value={m.value}>
										{m.label}
									</option>
								))}
							</select>
						</div>

						{/* Year Selector */}
						<div>
							<label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Year / वर्ष
							</label>
							<select
								value={selectedYear}
								onChange={(e) => setSelectedYear(Number(e.target.value))}
								className="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
							>
								{YEARS.map((y) => (
									<option key={y} value={y}>
										{y}
									</option>
								))}
							</select>
						</div>

						{/* Branch Selector */}
						<div>
							<label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Warehouse Branch / शाखा
							</label>
							<select
								value={selectedBranchId ?? ""}
								onChange={(e) =>
									setSelectedBranchId(
										e.target.value ? Number(e.target.value) : undefined,
									)
								}
								className="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
							>
								<option value="">All Branches / सभी शाखाएं</option>
								{branchesList.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name}
									</option>
								))}
							</select>
						</div>

						{/* Search Input */}
						<div>
							<label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
								Search Product / SKU / Audit
							</label>
							<div className="relative">
								<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search item, code, audit..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-9 pl-8 text-xs bg-background"
								/>
							</div>
						</div>
					</div>

					{/* Category & Type Filter Pills */}
					<div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/50">
						<span className="text-[11px] font-semibold text-muted-foreground mr-1">
							Classification:
						</span>
						{[
							{ id: "all", label: "All Discrepancies", icon: null },
							{ id: "theft", label: "Theft / चोरी", icon: ShieldAlertIcon },
							{ id: "damage", label: "Damaged / क्षतिग्रस्त", icon: AlertOctagonIcon },
							{ id: "missing", label: "Missing / गायब", icon: HelpCircleIcon },
							{ id: "expiry", label: "Expired / समाप्त", icon: ClockIcon },
							{ id: "excess", label: "Excess / अधिशेष", icon: PlusIcon },
						].map((tab) => {
							const TabIcon = tab.icon;
							return (
								<Button
									key={tab.id}
									variant={selectedType === tab.id ? "default" : "outline"}
									size="sm"
									onClick={() => setSelectedType(tab.id)}
									className={`h-7 rounded-lg text-xs font-medium px-2.5 gap-1.5 ${
										selectedType === tab.id
											? tab.id === "theft"
												? "bg-rose-600 hover:bg-rose-700 text-white"
												: tab.id === "damage"
													? "bg-amber-600 hover:bg-amber-700 text-white"
													: ""
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{TabIcon && <TabIcon className="h-3 w-3" />}
									{tab.label}
								</Button>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* KPI Summary Cards */}
			<StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Total Financial Loss */}
				<StaggerItem>
					<AnimatedCard className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-xs">
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
								<TrendingDownIcon className="h-4 w-4" />
								Total Discrepancy Loss (कुल नुकसान)
							</span>
							<span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
								<IndianRupeeIcon className="h-4 w-4" />
							</span>
						</div>
						<div className="mt-2">
							<p className="text-2xl font-black text-rose-700 dark:text-rose-300">
								₹{summary.totalLossValue.toLocaleString("en-IN", {
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
								})}
							</p>
							<p className="text-[11px] text-muted-foreground mt-0.5">
								Across {summary.auditsWithDiscrepancyCount} physical count audits
							</p>
						</div>
					</AnimatedCard>
				</StaggerItem>

				{/* Theft Losses */}
				<StaggerItem>
					<AnimatedCard className="rounded-2xl border border-rose-500/25 bg-card p-4 shadow-xs">
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
								<ShieldAlertIcon className="h-4 w-4" />
								Theft Loss (चोरी)
							</span>
							<Badge
								variant="outline"
								className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold"
							>
								{summary.theftCount} pcs
							</Badge>
						</div>
						<div className="mt-2">
							<p className="text-2xl font-black text-foreground">
								₹{summary.theftLossValue.toLocaleString("en-IN", {
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
								})}
							</p>
							<p className="text-[11px] text-muted-foreground mt-0.5">
								{summary.theftLineCount} line items classified as theft
							</p>
						</div>
					</AnimatedCard>
				</StaggerItem>

				{/* Damaged Goods */}
				<StaggerItem>
					<AnimatedCard className="rounded-2xl border border-amber-500/25 bg-card p-4 shadow-xs">
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
								<AlertOctagonIcon className="h-4 w-4" />
								Damaged (टूटा-फूटा)
							</span>
							<Badge
								variant="outline"
								className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold"
							>
								{summary.damageCount} pcs
							</Badge>
						</div>
						<div className="mt-2">
							<p className="text-2xl font-black text-foreground">
								₹{summary.damageLossValue.toLocaleString("en-IN", {
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
								})}
							</p>
							<p className="text-[11px] text-muted-foreground mt-0.5">
								{summary.damageLineCount} line items damaged / expired
							</p>
						</div>
					</AnimatedCard>
				</StaggerItem>

				{/* Missing / Unaccounted */}
				<StaggerItem>
					<AnimatedCard className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
								<HelpCircleIcon className="h-4 w-4" />
								Missing / Unaccounted
							</span>
							<Badge
								variant="outline"
								className="border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold"
							>
								{summary.missingCount} pcs
							</Badge>
						</div>
						<div className="mt-2">
							<p className="text-2xl font-black text-foreground">
								₹{summary.missingLossValue.toLocaleString("en-IN", {
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
								})}
							</p>
							<p className="text-[11px] text-muted-foreground mt-0.5">
								{summary.missingLineCount} unresolved shortage lines
							</p>
						</div>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Category Breakdown (if any) */}
			{byCategory.length > 0 && (
				<Card className="border-border/60 shadow-xs">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-2">
							<BarChart3Icon className="h-4 w-4 text-primary" />
							<CardTitle className="text-sm font-bold">
								Loss Valuation by Product Category
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
							{byCategory.slice(0, 6).map((cat) => (
								<div
									key={cat.category}
									className="rounded-xl border border-border/70 bg-muted/20 p-2.5"
								>
									<p className="text-[10px] uppercase font-bold text-muted-foreground truncate">
										{cat.category}
									</p>
									<p className="text-sm font-bold text-foreground mt-0.5">
										₹{cat.lossValue.toLocaleString("en-IN")}
									</p>
									<p className="text-[10px] text-muted-foreground">
										{cat.units} pcs variance
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Detailed Items Table */}
			<Card className="border-border/60 shadow-xs overflow-hidden">
				<CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
						<div>
							<CardTitle className="text-base font-bold text-foreground">
								Itemized Discrepancy Registry
							</CardTitle>
							<CardDescription className="text-xs">
								Showing {items.length} variance lines for{" "}
								{MONTHS.find((m) => m.value === selectedMonth)?.label},{" "}
								{selectedYear}
							</CardDescription>
						</div>

						<Badge variant="outline" className="text-xs font-mono">
							Total Variance: {summary.totalVarianceUnits} units
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{isLoading ? (
						<div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
							<RefreshCwIcon className="h-5 w-5 animate-spin text-primary" />
							<span>Loading physical count audit records...</span>
						</div>
					) : items.length === 0 ? (
						<div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
							<PackageCheckIcon className="h-10 w-10 text-emerald-500/70" />
							<div>
								<p className="text-sm font-bold text-foreground">
									No Discrepancies Recorded
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									All physical stock counts matched system inventory 100% for this selection!
								</p>
							</div>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-muted/40">
									<TableRow className="text-xs">
										<TableHead className="w-12 text-center">#</TableHead>
										<TableHead>Audit & Date</TableHead>
										<TableHead>Branch</TableHead>
										<TableHead>Product Details</TableHead>
										<TableHead className="text-right">Expected</TableHead>
										<TableHead className="text-right">Counted</TableHead>
										<TableHead className="text-right">Variance</TableHead>
										<TableHead>Classification & Reason</TableHead>
										<TableHead className="text-right">Unit Price</TableHead>
										<TableHead className="text-right">Loss (₹)</TableHead>
										<TableHead>Auditor</TableHead>
										<TableHead className="text-center">Status</TableHead>
									</TableRow>
								</TableHeader>

								<TableBody>
									{items.map((row, idx) => {
										const isNegative = row.varianceQty < 0;
										const isTheft = row.discrepancyType === "theft";
										const isDamage = row.discrepancyType === "damage";
										const isExpiry = row.discrepancyType === "expiry";

										return (
											<TableRow
												key={`${row.auditId}-${row.auditItemId}-${idx}`}
												className={`text-xs transition-colors hover:bg-muted/30 ${
													isTheft
														? "bg-rose-500/5 hover:bg-rose-500/10"
														: isDamage
															? "bg-amber-500/5 hover:bg-amber-500/10"
															: ""
												}`}
											>
												{/* Index */}
												<TableCell className="text-center font-mono text-muted-foreground text-[11px]">
													{idx + 1}
												</TableCell>

												{/* Audit ID & Date */}
												<TableCell>
													<div className="space-y-0.5">
														<span className="font-bold text-foreground font-mono">
															{row.auditNumber}
														</span>
														<p className="text-[10px] text-muted-foreground">
															{new Date(row.auditDate).toLocaleDateString(
																"en-IN",
																{
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																},
															)}
														</p>
													</div>
												</TableCell>

												{/* Branch */}
												<TableCell className="text-muted-foreground text-[11px]">
													{row.branchName}
												</TableCell>

												{/* Product Details */}
												<TableCell>
													<div className="space-y-0.5">
														<p className="font-semibold text-foreground text-xs">
															{row.productName}
														</p>
														<div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
															<span>SKU: {row.sku}</span>
															<span>•</span>
															<span>Cat: {row.category}</span>
														</div>
													</div>
												</TableCell>

												{/* Expected */}
												<TableCell className="text-right font-mono font-medium">
													{row.expectedQty}
												</TableCell>

												{/* Counted */}
												<TableCell className="text-right font-mono font-semibold">
													{row.countedQty ?? "—"}
												</TableCell>

												{/* Variance */}
												<TableCell className="text-right">
													<Badge
														variant="outline"
														className={`text-[10px] font-mono font-bold ${
															row.varianceQty === 0
																? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
																: isNegative
																	? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
																	: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
														}`}
													>
														{row.varianceQty > 0
															? `+${row.varianceQty}`
															: row.varianceQty}
													</Badge>
												</TableCell>

												{/* Classification & Reason */}
												<TableCell>
													<div className="space-y-1">
														{isTheft ? (
															<Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-semibold gap-1.5">
																<ShieldAlertIcon className="h-3 w-3" />
																Theft / चोरी
															</Badge>
														) : isDamage ? (
															<Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-semibold gap-1.5">
																<AlertOctagonIcon className="h-3 w-3" />
																Damaged / टूटा
															</Badge>
														) : isExpiry ? (
															<Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30 text-[10px] font-semibold gap-1.5">
																<ClockIcon className="h-3 w-3" /> Expired / समाप्त
															</Badge>
														) : row.discrepancyType === "excess" ? (
															<Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-semibold gap-1.5">
																<PlusIcon className="h-3 w-3" /> Excess / अधिशेष
															</Badge>
														) : (
															<Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 text-[10px] font-semibold gap-1.5">
																<HelpCircleIcon className="h-3 w-3" /> Missing / गायब
															</Badge>
														)}

														{row.discrepancyReason && (
															<p
																className="text-[10px] text-muted-foreground truncate max-w-[160px]"
																title={row.discrepancyReason}
															>
																{row.discrepancyReason}
															</p>
														)}
													</div>
												</TableCell>

												{/* Unit Price */}
												<TableCell className="text-right font-mono text-[11px] text-muted-foreground">
													₹{row.unitPrice.toFixed(2)}
												</TableCell>

												{/* Loss Value */}
												<TableCell className="text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
													₹{row.lossValue.toLocaleString("en-IN", {
														minimumFractionDigits: 0,
														maximumFractionDigits: 2,
													})}
												</TableCell>

												{/* Auditor */}
												<TableCell className="text-[11px] text-muted-foreground">
													{row.auditorName}
												</TableCell>

												{/* Resolution Status */}
												<TableCell className="text-center">
													<Badge
														variant="outline"
														className={`text-[10px] capitalize ${
															row.resolutionStatus === "approved" ||
															row.resolutionStatus === "reconciled"
																? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
																: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
														}`}
													>
														{row.resolutionStatus}
													</Badge>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
