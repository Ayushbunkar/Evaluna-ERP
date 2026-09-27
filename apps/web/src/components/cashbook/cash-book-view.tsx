"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
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
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	ActivityIcon,
	AlertCircleIcon,
	ArrowDownRight,
	ArrowUpRight,
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
	CreditCardIcon,
	FileTextIcon,
	FilterIcon,
	Loader2Icon,
	PlusIcon,
	ReceiptIcon,
	RefreshCwIcon,
	SearchIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	Wallet,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

interface CashBookViewProps {
	title?: string;
	subtitle?: string;
}

export function CashBookView({ title, subtitle }: CashBookViewProps) {
	const locale = useLocale();
	const [open, setOpen] = useState(false);
	const [type, setType] = useState<"in" | "out">("in");
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("manual");

	// Filters
	const [period, setPeriod] = useState<"today" | "week" | "month" | "all">(
		"today",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out">("all");
	const [categoryFilter, setCategoryFilter] = useState("all");

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// Translations Dictionary
	const t = {
		title: title || (locale === "hi" ? "दैनिक कैशबुक" : "Warehouse & Operations Cash Book"),
		subtitle:
			subtitle ||
			(locale === "hi"
				? "ऑपरेशन्स, बिक्री, लॉजिस्टिक्स और खर्चों का लाइव कैश फ्लो ट्रैक करें।"
				: "Live real-time ledger tracking operational cash flows, order receipts, logistics collections, and supplier settlements."),
		cashInBtn: locale === "hi" ? "कैश इन (Cash In)" : "Cash In",
		cashOutBtn: locale === "hi" ? "कैश आउट (Cash Out)" : "Cash Out",

		addTitleIn: locale === "hi" ? "कैश इन जोड़ें (Cash In)" : "Record Cash Inflow",
		addTitleOut: locale === "hi" ? "कैश आउट जोड़ें (Cash Out)" : "Record Cash Outflow",
		amountLabel: locale === "hi" ? "राशि (₹) *" : "Amount (₹) *",
		descLabel: locale === "hi" ? "विवरण / कारण *" : "Description / Purpose *",
		descPlaceholder:
			locale === "hi" ? "कैश प्रविष्टि का कारण दर्ज करें" : "E.g. Delivery cash collection, fuel expense, loading charge",
		saveBtn: locale === "hi" ? "प्रविष्टि सहेजें" : "Save Entry",
		saving: locale === "hi" ? "सहेजा जा रहा है..." : "Saving...",

		cardIn: locale === "hi" ? "कुल कैश इन (Inflow)" : "Total Cash In",
		salesLabel: locale === "hi" ? "बिक्री / आमद:" : "Sales / Orders:",
		cardOut: locale === "hi" ? "कुल कैश आउट (Outflow)" : "Total Cash Out",
		expensesLabel: locale === "hi" ? "खर्चे / निकासी:" : "Expenses / Outflow:",
		cardNet: locale === "hi" ? "शुद्ध कैश प्रवाह" : "Net Cash Balance",
		netMovement: locale === "hi" ? "चयनित अवधि का शुद्ध कैश प्रवाह" : "Net movement for period",

		recentTxTitle: locale === "hi" ? "लाइव कैश लेनदेन रजिस्टर" : "Live Cash & Transaction Ledger",
		thDate: locale === "hi" ? "तारीख और समय" : "Date & Time",
		thType: locale === "hi" ? "प्रकार" : "Type",
		thCategory: locale === "hi" ? "श्रेणी" : "Category",
		thDesc: locale === "hi" ? "विवरण" : "Description / Reference",
		thAmount: locale === "hi" ? "राशि" : "Amount",
		noTx:
			locale === "hi"
				? "कोई कैश लेनदेन नहीं मिला।"
				: "No cash transactions recorded for this period.",
		toastSuccess: locale === "hi" ? "कैश प्रविष्टि सफलतापूर्वक जोड़ी गई" : "Cash entry recorded successfully",
		toastErrAmount:
			locale === "hi" ? "वैध राशि आवश्यक है" : "Valid positive amount required",
		toastErrDesc: locale === "hi" ? "विवरण आवश्यक है" : "Description is required",
	};

	// Live Queries
	const {
		data: summary,
		isLoading: summaryLoading,
		isRefetching: summaryRefetching,
		refetch: refetchSummary,
	} = trpc.cashbook.getDailySummary.useQuery(
		{ period },
		{
			refetchInterval: 15000,
			refetchOnWindowFocus: true,
		},
	);

	const {
		data: ledger,
		isLoading: ledgerLoading,
		isRefetching: ledgerRefetching,
		refetch: refetchLedger,
	} = trpc.cashbook.getLedger.useQuery(
		{
			limit: 100,
			type: typeFilter,
			category: categoryFilter !== "all" ? categoryFilter : undefined,
			search: searchQuery || undefined,
		},
		{
			refetchInterval: 15000,
			refetchOnWindowFocus: true,
		},
	);

	const addEntry = trpc.cashbook.addEntry.useMutation({
		onSuccess: () => {
			toast.success(t.toastSuccess);
			setOpen(false);
			setAmount("");
			setDescription("");
			setCategory("manual");
			queryClient.invalidateQueries({
				queryKey: [["cashbook", "getDailySummary"]],
			});
			queryClient.invalidateQueries({ queryKey: [["cashbook", "getLedger"]] });
		},
		onError: (err) => toast.error(err.message),
	});

	const handleSave = () => {
		const parsedAmount = Number.parseFloat(amount);
		if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0)
			return toast.error(t.toastErrAmount);
		if (!description.trim()) return toast.error(t.toastErrDesc);

		addEntry.mutate({
			amount: parsedAmount,
			type,
			description: description.trim(),
			category,
		});
	};

	const isRefetching = summaryRefetching || ledgerRefetching;
	const refetchAll = () => {
		refetchSummary();
		refetchLedger();
	};

	// Determine active values to display in KPI cards
	const displayStats = useMemo(() => {
		const totalIn = summary?.totalIn ?? 0;
		const totalOut = summary?.totalOut ?? 0;
		const sales = summary?.sales ?? 0;
		const expenses = summary?.expenses ?? 0;
		const net = summary?.net ?? 0;
		const count = summary?.count ?? 0;
		const allTimeNet = summary?.allTimeNet ?? 0;
		const allTimeIn = summary?.allTimeIn ?? 0;
		const allTimeOut = summary?.allTimeOut ?? 0;

		return {
			totalIn,
			totalOut,
			sales,
			expenses,
			net,
			count,
			allTimeNet,
			allTimeIn,
			allTimeOut,
		};
	}, [summary]);

	return (
		<PageTransition className="flex flex-col gap-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
							{t.title}
						</h1>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE
						</span>
					</div>
					<p className="text-muted-foreground text-sm">{t.subtitle}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={refetchAll}
						disabled={isRefetching}
						className="gap-1.5"
					>
						<RefreshCwIcon
							className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
						/>
						<span className="hidden sm:inline">Sync</span>
					</Button>

					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<Button
								onClick={() => {
									setType("in");
									setCategory("manual");
								}}
								className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
								size="sm"
							>
								<ArrowDownRight className="mr-1.5 h-4 w-4" /> {t.cashInBtn}
							</Button>
						</DialogTrigger>
						<DialogTrigger asChild>
							<Button
								onClick={() => {
									setType("out");
									setCategory("manual");
								}}
								variant="destructive"
								size="sm"
								className="shadow-sm"
							>
								<ArrowUpRight className="mr-1.5 h-4 w-4" /> {t.cashOutBtn}
							</Button>
						</DialogTrigger>

						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle className="flex items-center gap-2">
									{type === "in" ? (
										<ArrowDownRight className="h-5 w-5 text-emerald-600" />
									) : (
										<ArrowUpRight className="h-5 w-5 text-red-600" />
									)}
									{type === "in" ? t.addTitleIn : t.addTitleOut}
								</DialogTitle>
								<DialogDescription>
									{type === "in"
										? "Record cash collection, petty cash reimbursement, or sales inflow."
										: "Record cash payment, operational expense, or vendor settlement."}
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-2">
								<div className="grid gap-1.5">
									<Label>{t.amountLabel}</Label>
									<Input
										type="number"
										min="0.01"
										step="0.01"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										placeholder="0.00"
										className="font-bold text-lg"
									/>
								</div>

								<div className="grid gap-1.5">
									<Label>Category</Label>
									<select
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
										value={category}
										onChange={(e) => setCategory(e.target.value)}
									>
										{type === "in" ? (
											<>
												<option value="manual">Manual Cash In</option>
												<option value="sale">Order / Sales Collection</option>
												<option value="petty_cash">Petty Cash Deposit</option>
												<option value="driver_cash">Driver Logistics Cash</option>
												<option value="other">Other Inflow</option>
											</>
										) : (
											<>
												<option value="manual">Manual Cash Out</option>
												<option value="expense">Operational Expense</option>
												<option value="purchase">Supplier / Vendor Settlement</option>
												<option value="petty_cash">Petty Cash Disbursement</option>
												<option value="logistics">Freight / Transport Cost</option>
												<option value="other">Other Outflow</option>
											</>
										)}
									</select>
								</div>

								<div className="grid gap-1.5">
									<Label>{t.descLabel}</Label>
									<Input
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder={t.descPlaceholder}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={handleSave}
									disabled={addEntry.isPending}
									className="w-full"
								>
									{addEntry.isPending ? t.saving : t.saveBtn}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Period Filter Selector */}
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-2">
				<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
					<CalendarIcon className="h-4 w-4 text-primary" />
					<span className="font-semibold text-foreground">Time Horizon:</span>
				</div>
				<div className="flex flex-wrap gap-1">
					<Button
						variant={period === "today" ? "default" : "ghost"}
						size="sm"
						onClick={() => setPeriod("today")}
						className="h-7 text-xs"
					>
						Today
					</Button>
					<Button
						variant={period === "week" ? "default" : "ghost"}
						size="sm"
						onClick={() => setPeriod("week")}
						className="h-7 text-xs"
					>
						Last 7 Days
					</Button>
					<Button
						variant={period === "month" ? "default" : "ghost"}
						size="sm"
						onClick={() => setPeriod("month")}
						className="h-7 text-xs"
					>
						Last 30 Days
					</Button>
					<Button
						variant={period === "all" ? "default" : "ghost"}
						size="sm"
						onClick={() => setPeriod("all")}
						className="h-7 text-xs"
					>
						All Time
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 md:grid-cols-4" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-emerald-200/70 bg-emerald-50/30 shadow-sm transition-all hover:shadow-md dark:border-emerald-900/40 dark:bg-emerald-950/10">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.cardIn}
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
									<ArrowDownRight className="h-4 w-4 text-emerald-600" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-emerald-600 tracking-tight sm:text-3xl">
									₹{displayStats.totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</div>
								<div className="mt-1 flex items-center justify-between text-muted-foreground text-xs">
									<span>{t.salesLabel} ₹{displayStats.sales.toFixed(2)}</span>
									<span className="font-semibold text-[11px] text-emerald-700 dark:text-emerald-400">
										All: ₹{displayStats.allTimeIn.toFixed(0)}
									</span>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card className="border-red-200/70 bg-red-50/30 shadow-sm transition-all hover:shadow-md dark:border-red-900/40 dark:bg-red-950/10">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.cardOut}
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
									<ArrowUpRight className="h-4 w-4 text-red-600" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-red-600 tracking-tight sm:text-3xl">
									₹{displayStats.totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</div>
								<div className="mt-1 flex items-center justify-between text-muted-foreground text-xs">
									<span>{t.expensesLabel} ₹{displayStats.expenses.toFixed(2)}</span>
									<span className="font-semibold text-[11px] text-red-700 dark:text-red-400">
										All: ₹{displayStats.allTimeOut.toFixed(0)}
									</span>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card className="border-blue-200/70 bg-blue-50/30 shadow-sm transition-all hover:shadow-md dark:border-blue-900/40 dark:bg-blue-950/10">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.cardNet}
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
									<Wallet className="h-4 w-4 text-blue-600" />
								</div>
							</CardHeader>
							<CardContent>
								<div
									className={`font-bold text-2xl tracking-tight sm:text-3xl ${displayStats.net >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600"}`}
								>
									{displayStats.net >= 0 ? "+" : ""}₹{displayStats.net.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</div>
								<div className="mt-1 flex items-center justify-between text-muted-foreground text-xs">
									<span>{t.netMovement}</span>
									<span className="font-semibold text-[11px] text-blue-700 dark:text-blue-400">
										Net All: ₹{displayStats.allTimeNet.toFixed(0)}
									</span>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/60 shadow-sm transition-all hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Tx Volume
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
									<ActivityIcon className="h-4 w-4 text-purple-600" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
									{summaryLoading ? "..." : displayStats.count}
								</div>
								<p className="mt-1 text-muted-foreground text-xs">
									Total active transactions
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Main Transactions Ledger Card */}
			<Card className="border-border/50 bg-card shadow-sm">
				<CardHeader className="border-b pb-4">
					<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
						<div>
							<CardTitle className="font-bold text-base">
								{t.recentTxTitle}
							</CardTitle>
							<p className="text-muted-foreground text-xs">
								Real-time transaction stream from sales orders, point of sale,
								logistics, and warehouse petty cash.
							</p>
						</div>

						{/* Search & Filter Controls */}
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative w-full sm:w-56">
								<SearchIcon className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search description, order #..."
									className="h-8 pl-8 text-xs"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>

							<select
								className="h-8 rounded-md border border-input bg-background px-2.5 font-semibold text-xs shadow-sm focus:outline-none"
								value={typeFilter}
								onChange={(e) => setTypeFilter(e.target.value as any)}
							>
								<option value="all">All Flow</option>
								<option value="in">Cash In (+)</option>
								<option value="out">Cash Out (-)</option>
							</select>

							<select
								className="h-8 rounded-md border border-input bg-background px-2.5 font-semibold text-xs shadow-sm focus:outline-none"
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
							>
								<option value="all">All Categories</option>
								<option value="sale">Sales & Orders</option>
								<option value="expense">Expenses</option>
								<option value="purchase">Purchases / Vendor</option>
								<option value="manual">Manual Entries</option>
								<option value="driver_cash">Logistics Collection</option>
							</select>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{ledgerLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							<p className="mt-2 text-muted-foreground text-xs">
								Loading transactions ledger...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse text-left text-sm">
								<thead>
									<tr className="border-border/50 border-b bg-muted/30 text-muted-foreground text-xs">
										<th className="py-3 px-4 font-semibold">{t.thDate}</th>
										<th className="px-3 font-semibold">{t.thType}</th>
										<th className="px-3 font-semibold">{t.thCategory}</th>
										<th className="px-3 font-semibold">{t.thDesc}</th>
										<th className="px-3 text-right font-semibold">Original ₹</th>
										<th className="px-3 text-right font-semibold">Adjustment</th>
										<th className="px-4 text-right font-semibold">{t.thAmount}</th>
										<th className="px-4 text-center font-semibold">Status</th>
									</tr>
								</thead>
								<tbody>
									{ledger?.items?.map((tx) => {
										const originalAmt = tx.original_amount
											? Number(tx.original_amount)
											: Number(tx.amount);
										const finalAmt = Number(tx.amount);
										const adjustment = Number(tx.adjustment_amount || 0);
										const hasAdjustment = adjustment !== 0;
										const isReconciled =
											tx.reconciliation_status === "reconciled";
										const isIncome = tx.type === "in";

										return (
											<tr
												key={tx.id}
												className="border-border/30 border-b transition-colors last:border-0 hover:bg-muted/20"
											>
												<td className="whitespace-nowrap py-3 px-4 text-muted-foreground text-xs">
													{format(
														new Date(tx.created_at || new Date()),
														"MMM dd, yyyy · p",
													)}
												</td>
												<td className="px-3">
													<span
														className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider ${isIncome ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}
													>
														{isIncome ? (
															<ArrowDownRight className="h-3 w-3" />
														) : (
															<ArrowUpRight className="h-3 w-3" />
														)}
														{isIncome ? "Cash In" : "Cash Out"}
													</span>
												</td>
												<td className="px-3">
													<Badge
														variant="outline"
														className="text-[10px] capitalize"
													>
														{tx.category || "manual"}
													</Badge>
												</td>
												<td className="max-w-[240px] px-3 font-medium text-xs">
													<div className="flex flex-col">
														<span className="truncate text-slate-900 dark:text-slate-100">
															{tx.description || `Transaction #${tx.id}`}
														</span>
														{tx.order_id && (
															<span className="font-mono text-[10px] text-muted-foreground">
																Ref: Order #{tx.order_id}
															</span>
														)}
													</div>
												</td>
												<td className="px-3 text-right text-muted-foreground text-xs">
													₹{originalAmt.toFixed(2)}
												</td>
												<td
													className={`px-3 text-right font-medium text-xs ${hasAdjustment ? (adjustment < 0 ? "text-red-500" : "text-emerald-500") : "text-muted-foreground"}`}
												>
													{hasAdjustment
														? (adjustment >= 0 ? "+" : "") +
															`₹${adjustment.toFixed(2)}`
														: "—"}
												</td>
												<td
													className={`px-4 text-right font-bold text-xs ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
												>
													{isIncome ? "+" : "-"}₹{finalAmt.toFixed(2)}
												</td>
												<td className="px-4 text-center">
													<span
														className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase ${isReconciled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}
													>
														{isReconciled ? "Reconciled" : "Pending"}
													</span>
												</td>
											</tr>
										);
									})}
									{(!ledger?.items || ledger.items.length === 0) && (
										<tr>
											<td
												colSpan={8}
												className="py-16 text-center text-muted-foreground"
											>
												<Wallet className="mx-auto mb-3 h-12 w-12 text-slate-300 opacity-30 dark:text-slate-600" />
												<p className="font-semibold text-sm">{t.noTx}</p>
												<p className="mt-1 text-xs">
													Orders and payments confirmed in the ERP automatically
													stream into this cash book.
												</p>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
