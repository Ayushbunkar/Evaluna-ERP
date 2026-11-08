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
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	PaperclipIcon,
	PlusIcon,
	SearchIcon,
	UsersIcon,
	WalletCardsIcon,
	XCircleIcon,
	FuelIcon,
	CalendarIcon,
	FilterIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	ArrowUpRightIcon,
	ArrowDownRightIcon,
	CalculatorIcon,
	ReceiptIcon,
	UtensilsIcon,
	TruckIcon,
	BuildingIcon,
	CoinsIcon,
	IndianRupeeIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { QuickExpenseModal } from "@/components/finance/QuickExpenseModal";
import { TransportFuelExpenseModal } from "@/components/finance/TransportFuelExpenseModal";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function FinanceExpensesPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [fuelModalOpen, setFuelModalOpen] = useState(false);
	const [quickExpenseModalOpen, setQuickExpenseModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<
		"my_claims" | "supervisor_review" | "payouts"
	>("my_claims");
	const [searchQuery, setSearchQuery] = useState("");

	// Day-wise filtering state
	const [datePreset, setDatePreset] = useState<
		"today" | "yesterday" | "last7" | "month" | "all" | "custom"
	>("today");
	const [customDate, setCustomDate] = useState(() => {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, "0");
		const d = String(now.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	});
	const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
	const [scope, setScope] = useState<"all" | "mine">("all");

	// Queries
	const { data: myExpenses, isLoading: myLoading } =
		trpc.employeeExpenses.listMine.useQuery();
	const { data: allBranchClaims, isLoading: allLoading } =
		trpc.employeeExpenses.list.useQuery({ limit: 200 });
	const { data: submittedClaims, isLoading: reviewLoading } =
		trpc.employeeExpenses.list.useQuery({ status: "submitted" });
	const { data: approvedClaims, isLoading: payoutsLoading } =
		trpc.employeeExpenses.list.useQuery({ status: "approved" });
	const { data: bankAccountsList } = trpc.finance.getBankAccounts.useQuery();

	// Active date range calculation for sales & profit query
	const { reportStartDate, reportEndDate } = useMemo(() => {
		if (datePreset === "today") {
			return { reportStartDate: todayKey, reportEndDate: todayKey };
		}
		if (datePreset === "yesterday") {
			return { reportStartDate: yesterdayKey, reportEndDate: yesterdayKey };
		}
		if (datePreset === "custom") {
			return { reportStartDate: customDate, reportEndDate: customDate };
		}
		if (datePreset === "last7") {
			const d = new Date();
			d.setDate(d.getDate() - 7);
			return { reportStartDate: toDateKey(d), reportEndDate: todayKey };
		}
		if (datePreset === "month") {
			const now = new Date();
			const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
			return { reportStartDate: start, reportEndDate: todayKey };
		}
		return { reportStartDate: undefined, reportEndDate: undefined };
	}, [datePreset, customDate, todayKey, yesterdayKey]);

	// Day-wise sales & procurement cost query to compute Gross Profit & Net Profit
	const { data: salesReport, isLoading: salesLoading } =
		trpc.reports.getDayWiseSalesMarginReport.useQuery(
			{
				startDate: reportStartDate,
				endDate: reportEndDate,
			},
			{
				staleTime: 1000 * 30, // 30 seconds
			},
		);

	// Mutations
	const submitExpenseMutation = trpc.employeeExpenses.submit.useMutation({
		onSuccess: () => {
			toast.success("Expense recorded and added to Cash Book successfully!");
			utils.employeeExpenses.listMine.invalidate();
			utils.employeeExpenses.list.invalidate();
			utils.finance.getDashboardStats.invalidate();
			utils.cashbook.getDailySummary.invalidate();
			utils.cashbook.getLedger.invalidate();
			setIsSubmitModalOpen(false);
			setClaimAmount("");
			setClaimCategory("1");
			setClaimDesc("");
			setClaimPurpose("");
		},
		onError: (err) => {
			toast.error(`Submission failed: ${err.message}`);
		},
	});

	const reviewExpenseMutation = trpc.employeeExpenses.review.useMutation({
		onSuccess: () => {
			toast.success("Review decision successfully logged!");
			utils.employeeExpenses.list.invalidate();
			utils.employeeExpenses.listMine.invalidate();
			utils.finance.getDashboardStats.invalidate();
			setIsReviewModalOpen(false);
			setReviewNotes("");
		},
		onError: (err) => {
			toast.error(`Review failed: ${err.message}`);
		},
	});

	const payExpenseMutation = trpc.employeeExpenses.pay.useMutation({
		onSuccess: () => {
			toast.success(
				"Reimbursement payment completed. Transaction ledger updated!",
			);
			utils.employeeExpenses.list.invalidate();
			utils.employeeExpenses.listMine.invalidate();
			utils.finance.getDashboardStats.invalidate();
			utils.cashbook.getDailySummary.invalidate();
			utils.cashbook.getLedger.invalidate();
			setIsPayModalOpen(false);
			setPayRefNumber("");
		},
		onError: (err) => {
			toast.error(`Payment failed: ${err.message}`);
		},
	});

	// Modal State
	const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
	const [isPayModalOpen, setIsPayModalOpen] = useState(false);

	// Submit Claim Form State
	const [claimAmount, setClaimAmount] = useState("");
	const [claimCategory, setClaimCategory] = useState("1"); // 1 for Food, 2 for Travel etc.
	const [claimDesc, setClaimDesc] = useState("");
	const [claimPurpose, setClaimPurpose] = useState("");
	const [claimPaymentMethod, setClaimPaymentMethod] = useState("Cash");

	// Review Form State
	const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);
	const [reviewDecision, setReviewDecision] = useState<"approve" | "reject">(
		"approve",
	);
	const [reviewNotes, setReviewNotes] = useState("");

	// Pay Form State
	const [payBankAccountId, setPayBankAccountId] = useState("1");
	const [payRefNumber, setPayRefNumber] = useState("");

	const handleReviewClaim = async () => {
		if (!selectedClaimId) return;
		await reviewExpenseMutation.mutateAsync({
			id: selectedClaimId,
			decision: reviewDecision,
			review_notes: reviewNotes,
		});
	};

	const handlePayClaim = async () => {
		if (!selectedClaimId) return;
		await payExpenseMutation.mutateAsync({
			id: selectedClaimId,
			bank_account_id: Number.parseInt(payBankAccountId),
			reference_number: payRefNumber,
		});
	};

	const CATEGORY_MAP: Record<string, { id: number; name: string }> = {
		"1": { id: 1, name: "Food & Meals" },
		"2": { id: 2, name: "Travel & Transport" },
		"3": { id: 3, name: "Fuel & Logistics" },
		"4": { id: 4, name: "Office Supplies" },
	};

	const handleSubmitClaim = async () => {
		if (!claimAmount) {
			toast.error("Please enter a claim amount.");
			return;
		}

		const parsedAmt = Number.parseFloat(claimAmount);
		if (Number.isNaN(parsedAmt) || parsedAmt <= 0) {
			toast.error("Please enter a valid positive amount.");
			return;
		}

		// Duplicate claims detection check
		const isDuplicate = myExpenses?.some(
			(exp) =>
				Number(exp.amount) === parsedAmt &&
				exp.description === claimDesc &&
				(exp.status === "submitted" || exp.status === "paid"),
		);

		if (isDuplicate) {
			toast.warning(
				"Possible duplicate expense detected. Check your recorded expenses first!",
			);
			return;
		}

		const selectedCat = CATEGORY_MAP[claimCategory] || { id: 1, name: "Food & Meals" };

		await submitExpenseMutation.mutateAsync({
			amount: parsedAmt,
			category_id: selectedCat.id,
			custom_category_name: selectedCat.name,
			description: claimDesc || selectedCat.name,
			business_purpose: claimPurpose || claimDesc || selectedCat.name,
			payment_method: claimPaymentMethod || "Cash",
			direct_payout: true,
		});
	};

	const toDateKey = (dateVal: string | Date | null | undefined): string => {
		if (!dateVal) return "";
		const d = new Date(dateVal);
		if (Number.isNaN(d.getTime())) return "";
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`;
	};

	const todayKey = useMemo(() => toDateKey(new Date()), []);
	const yesterdayKey = useMemo(() => {
		const y = new Date();
		y.setDate(y.getDate() - 1);
		return toDateKey(y);
	}, []);

	// 1. Base date-filtered expenses (before category filtering) so category breakdown stays complete
	const baseExpensesForDate = useMemo(() => {
		const base =
			scope === "all" ? (allBranchClaims?.items ?? []) : (myExpenses ?? []);

		return base.filter((exp: any) => {
			const expDate = new Date(exp.expense_date || exp.created_at);
			const expDateKey = toDateKey(expDate);

			// Date filter
			if (datePreset === "today" && expDateKey !== todayKey) return false;
			if (datePreset === "yesterday" && expDateKey !== yesterdayKey) return false;
			if (datePreset === "custom" && expDateKey !== customDate) return false;
			if (datePreset === "last7") {
				const d = new Date();
				d.setDate(d.getDate() - 7);
				d.setHours(0, 0, 0, 0);
				if (expDate < d) return false;
			}
			if (datePreset === "month") {
				const now = new Date();
				if (
					expDate.getFullYear() !== now.getFullYear() ||
					expDate.getMonth() !== now.getMonth()
				)
					return false;
			}

			// Search query
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const matchNum = exp.expense_number?.toLowerCase().includes(q);
				const matchDesc = exp.description?.toLowerCase().includes(q);
				const matchPurpose = exp.business_purpose?.toLowerCase().includes(q);
				const matchStaff = exp.staffMember?.name?.toLowerCase().includes(q);
				if (!matchNum && !matchDesc && !matchPurpose && !matchStaff) return false;
			}

			return true;
		});
	}, [
		scope,
		allBranchClaims?.items,
		myExpenses,
		datePreset,
		customDate,
		searchQuery,
		todayKey,
		yesterdayKey,
	]);

	// 2. Particular category breakdown: Fuels, Travel, Food, Office, Other
	const categoryBreakdown = useMemo(() => {
		const cats = {
			fuel: { id: "fuel", name: "Fuels & Transport", hindi: "ईंधन / फ्यूल", total: 0, count: 0, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", barColor: "bg-amber-500", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: FuelIcon },
			travel: { id: "travel", name: "Travel & Conveyance", hindi: "यात्रा व आवागमन", total: 0, count: 0, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500", barColor: "bg-blue-500", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", icon: TruckIcon },
			food: { id: "food", name: "Food & Meals", hindi: "खान-पान व जलपान", total: 0, count: 0, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", barColor: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", icon: UtensilsIcon },
			office: { id: "office", name: "Office Supplies", hindi: "कार्यालय सामग्री", total: 0, count: 0, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500", barColor: "bg-purple-500", badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20", icon: BuildingIcon },
			other: { id: "other", name: "Other Operational", hindi: "विविध व अन्य खर्च", total: 0, count: 0, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500", barColor: "bg-slate-500", badge: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20", icon: WalletCardsIcon },
		};

		let grand = 0;
		for (const exp of baseExpensesForDate) {
			const amt = Number(exp.amount) || 0;
			grand += amt;
			const catText = (
				(exp.custom_category_name || "") + " " +
				(exp.category?.name || "") + " " +
				(exp.description || "") + " " +
				(exp.business_purpose || "")
			).toLowerCase();

			if (
				catText.includes("fuel") ||
				catText.includes("diesel") ||
				catText.includes("petrol") ||
				catText.includes("cng") ||
				catText.includes("mileage") ||
				catText.includes("vehicle")
			) {
				cats.fuel.total += amt;
				cats.fuel.count += 1;
			} else if (
				catText.includes("travel") ||
				catText.includes("conveyance") ||
				catText.includes("toll") ||
				catText.includes("fare") ||
				catText.includes("transport") ||
				catText.includes("auto") ||
				catText.includes("taxi")
			) {
				cats.travel.total += amt;
				cats.travel.count += 1;
			} else if (
				catText.includes("food") ||
				catText.includes("meal") ||
				catText.includes("lunch") ||
				catText.includes("dinner") ||
				catText.includes("tea") ||
				catText.includes("snack")
			) {
				cats.food.total += amt;
				cats.food.count += 1;
			} else if (
				catText.includes("office") ||
				catText.includes("stationary") ||
				catText.includes("stationery") ||
				catText.includes("paper") ||
				catText.includes("supplies")
			) {
				cats.office.total += amt;
				cats.office.count += 1;
			} else {
				cats.other.total += amt;
				cats.other.count += 1;
			}
		}

		return {
			items: [cats.fuel, cats.travel, cats.food, cats.office, cats.other],
			grandTotal: grand,
			byKey: cats,
		};
	}, [baseExpensesForDate]);

	// 3. Filtered expenses according to category filter
	const filteredExpenses = useMemo(() => {
		if (selectedCategoryFilter === "all") return baseExpensesForDate;

		return baseExpensesForDate.filter((exp: any) => {
			const catText = (
				(exp.custom_category_name || "") + " " +
				(exp.category?.name || "") + " " +
				(exp.description || "") + " " +
				(exp.business_purpose || "")
			).toLowerCase();

			if (selectedCategoryFilter === "fuel") {
				return (
					catText.includes("fuel") ||
					catText.includes("diesel") ||
					catText.includes("petrol") ||
					catText.includes("cng") ||
					catText.includes("mileage") ||
					catText.includes("vehicle")
				);
			}
			if (selectedCategoryFilter === "travel") {
				return (
					catText.includes("travel") ||
					catText.includes("conveyance") ||
					catText.includes("toll") ||
					catText.includes("fare") ||
					catText.includes("transport") ||
					catText.includes("auto") ||
					catText.includes("taxi")
				);
			}
			if (selectedCategoryFilter === "food") {
				return (
					catText.includes("food") ||
					catText.includes("meal") ||
					catText.includes("lunch") ||
					catText.includes("dinner") ||
					catText.includes("tea") ||
					catText.includes("snack")
				);
			}
			if (selectedCategoryFilter === "office") {
				return (
					catText.includes("office") ||
					catText.includes("stationary") ||
					catText.includes("stationery") ||
					catText.includes("paper") ||
					catText.includes("supplies")
				);
			}
			if (selectedCategoryFilter === "other") {
				const isFuel =
					catText.includes("fuel") ||
					catText.includes("diesel") ||
					catText.includes("petrol") ||
					catText.includes("cng") ||
					catText.includes("mileage") ||
					catText.includes("vehicle");
				const isTravel =
					catText.includes("travel") ||
					catText.includes("conveyance") ||
					catText.includes("toll") ||
					catText.includes("fare") ||
					catText.includes("transport") ||
					catText.includes("auto") ||
					catText.includes("taxi");
				const isFood =
					catText.includes("food") ||
					catText.includes("meal") ||
					catText.includes("lunch") ||
					catText.includes("dinner") ||
					catText.includes("tea") ||
					catText.includes("snack");
				const isOffice =
					catText.includes("office") ||
					catText.includes("stationary") ||
					catText.includes("stationery") ||
					catText.includes("paper") ||
					catText.includes("supplies");
				return !isFuel && !isTravel && !isFood && !isOffice;
			}
			return true;
		});
	}, [baseExpensesForDate, selectedCategoryFilter]);

	// 4. Gross Profit & Net Profit calculation for the selected period
	const profitMetrics = useMemo(() => {
		const totalSelling = Number(salesReport?.summary?.totalSelling || 0);
		const totalCost = Number(salesReport?.summary?.totalCost || 0);
		const grossProfit = Number(
			salesReport?.summary?.grossProfit ?? Math.max(0, totalSelling - totalCost),
		);
		const grossMargin =
			totalSelling > 0 ? (grossProfit / totalSelling) * 100 : 0;

		const totalOperatingExpenses = categoryBreakdown.grandTotal;
		const netProfit = grossProfit - totalOperatingExpenses;
		const netMargin =
			totalSelling > 0 ? (netProfit / totalSelling) * 100 : 0;

		return {
			totalSelling,
			totalCost,
			grossProfit,
			grossMargin,
			totalOperatingExpenses,
			netProfit,
			netMargin,
			ordersCount: salesReport?.summary?.totalOrders || 0,
		};
	}, [salesReport, categoryBreakdown.grandTotal]);

	const expenseStats = useMemo(() => {
		let total = 0;
		let paid = 0;
		let pending = 0;
		for (const exp of filteredExpenses) {
			const amt = Number(exp.amount) || 0;
			total += amt;
			if (exp.status === "paid") paid += amt;
			else if (exp.status === "submitted" || exp.status === "draft")
				pending += amt;
		}
		return {
			total,
			paid,
			pending,
			count: filteredExpenses.length,
		};
	}, [filteredExpenses]);

	const groupedByDay = useMemo(() => {
		const groups: Record<
			string,
			{ dateKey: string; items: any[]; dayTotal: number }
		> = {};
		for (const exp of filteredExpenses) {
			const key = toDateKey(exp.expense_date || exp.created_at);
			if (!groups[key]) {
				groups[key] = { dateKey: key, items: [], dayTotal: 0 };
			}
			groups[key].items.push(exp);
			groups[key].dayTotal += Number(exp.amount) || 0;
		}
		return Object.values(groups).sort((a, b) =>
			b.dateKey.localeCompare(a.dateKey),
		);
	}, [filteredExpenses]);

	const formatDayLabel = (key: string) => {
		if (key === todayKey) return "Today";
		if (key === yesterdayKey) return "Yesterday";
		const parts = key.split("-").map(Number);
		if (parts.length === 3) {
			const d = new Date(parts[0], parts[1] - 1, parts[2]);
			return d.toLocaleDateString("en-IN", {
				weekday: "short",
				day: "2-digit",
				month: "short",
				year: "numeric",
			});
		}
		return key;
	};

	return (
		<PageTransition className="container mx-auto space-y-6 p-4 sm:p-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Employee Expense Claims Console
					</h2>
					<p className="text-muted-foreground text-sm">
						Record operational claims, review submissions, and complete payouts securely.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						onClick={() => setFuelModalOpen(true)}
						className="h-9 bg-amber-600 font-bold text-white text-xs shadow-sm hover:bg-amber-700"
					>
						<FuelIcon className="mr-1.5 h-4 w-4" /> Transport & Fuel Expense
					</Button>
					<Button
						onClick={() => setQuickExpenseModalOpen(true)}
						className="h-9 bg-blue-600 font-bold text-white text-xs shadow-sm hover:bg-blue-700"
					>
						<PlusIcon className="mr-1.5 h-4 w-4" /> Direct Business Expense
					</Button>
					<Button
						variant="outline"
						onClick={() => setIsSubmitModalOpen(true)}
						className="h-9 font-bold text-xs shadow-sm"
					>
						<PaperclipIcon className="mr-1.5 h-4 w-4" /> Employee Claim
					</Button>
				</div>
			</div>

			{/* Tabs Selector */}
			<div className="flex space-x-4 overflow-x-auto border-gray-200 border-b">
				{[
					{
						id: "my_claims",
						label: "My Expense Claims",
						icon: WalletCardsIcon,
					},
					{
						id: "supervisor_review",
						label: "HR / Supervisor Review",
						icon: UsersIcon,
						badge: submittedClaims?.total,
					},
					{
						id: "payouts",
						label: "Finance Payout Queue",
						icon: ClockIcon,
						badge: approvedClaims?.total,
					},
				].map((tab) => {
					const Icon = tab.icon;
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id as any)}
							className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 font-semibold text-sm transition-colors ${
								activeTab === tab.id
									? "border-blue-600 text-blue-600"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<Icon className="h-4 w-4" />
							{tab.label}
							{tab.badge !== undefined && tab.badge > 0 ? (
								<span className="ml-1 animate-pulse rounded-full bg-blue-500 px-1.5 py-0.5 font-bold text-[10px] text-white">
									{tab.badge}
								</span>
							) : null}
						</button>
					);
				})}
			</div>

			{/* TABS CONTENT */}
			<div className="min-h-[300px]">
				{/* MY CLAIMS & COMPANY EXPENSES TAB */}
				{activeTab === "my_claims" && (
					<div className="space-y-4">
						{/* Top Control Bar: Scope, Filters, and Search */}
						<Card className="shadow-sm">
							<CardHeader className="pb-3">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<CardTitle className="font-bold text-base">
											Expense Claims & Outflow Ledger
										</CardTitle>
										<CardDescription className="text-xs">
											Day-wise breakdown, date filters, and settlement status tracking
										</CardDescription>
									</div>

									{/* Scope Switcher */}
									<div className="flex items-center rounded-lg border bg-slate-50 p-1 dark:bg-slate-900">
										<button
											type="button"
											onClick={() => setScope("all")}
											className={`rounded-md px-3 py-1 font-bold text-xs transition-colors ${
												scope === "all"
													? "bg-white text-blue-600 shadow-sm dark:bg-slate-800"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											All Company ({allBranchClaims?.items?.length ?? 0})
										</button>
										<button
											type="button"
											onClick={() => setScope("mine")}
											className={`rounded-md px-3 py-1 font-bold text-xs transition-colors ${
												scope === "mine"
													? "bg-white text-blue-600 shadow-sm dark:bg-slate-800"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											My Submissions ({myExpenses?.length ?? 0})
										</button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4 pt-0">
								{/* Day Filter Buttons & Inputs */}
								<div className="flex flex-wrap items-center gap-2 border-t pt-3">
									<div className="flex flex-wrap items-center gap-1.5">
										<Button
											type="button"
											size="sm"
											variant={datePreset === "today" ? "default" : "outline"}
											onClick={() => setDatePreset("today")}
											className="h-8 text-xs font-bold"
										>
											Today
										</Button>
										<Button
											type="button"
											size="sm"
											variant={datePreset === "yesterday" ? "default" : "outline"}
											onClick={() => setDatePreset("yesterday")}
											className="h-8 text-xs font-bold"
										>
											Yesterday
										</Button>
										<Button
											type="button"
											size="sm"
											variant={datePreset === "last7" ? "default" : "outline"}
											onClick={() => setDatePreset("last7")}
											className="h-8 text-xs font-bold"
										>
											Last 7 Days
										</Button>
										<Button
											type="button"
											size="sm"
											variant={datePreset === "month" ? "default" : "outline"}
											onClick={() => setDatePreset("month")}
											className="h-8 text-xs font-bold"
										>
											This Month
										</Button>
										<Button
											type="button"
											size="sm"
											variant={datePreset === "all" ? "default" : "outline"}
											onClick={() => setDatePreset("all")}
											className="h-8 text-xs font-bold"
										>
											All Dates
										</Button>
									</div>

									{/* Custom Date Input */}
									<div className="flex items-center gap-1.5 ml-auto">
										<span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
											<CalendarIcon className="h-3.5 w-3.5" /> Pick Date:
										</span>
										<Input
											type="date"
											value={customDate}
											onChange={(e) => {
												setCustomDate(e.target.value);
												setDatePreset("custom");
											}}
											className="h-8 w-36 text-xs font-semibold"
										/>
									</div>
								</div>

								{/* Category & Search Filter Bar */}
								<div className="grid gap-2 sm:grid-cols-3">
									<div className="relative">
										<SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
										<Input
											placeholder="Search by #, purpose, submitter..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="h-8 pl-8 text-xs"
										/>
									</div>
									<div>
										<select
											value={selectedCategoryFilter}
											onChange={(e) => setSelectedCategoryFilter(e.target.value)}
											className="h-8 w-full rounded border border-input bg-background px-2 text-xs font-semibold dark:bg-slate-950"
										>
											<option value="all">All Categories</option>
											<option value="food">Food & Meals</option>
											<option value="travel">Travel & Transport</option>
											<option value="fuel">Fuel & Logistics</option>
											<option value="office">Office Supplies</option>
										</select>
									</div>
									<div className="flex items-center justify-end">
										<span className="text-[11px] font-bold text-muted-foreground">
											Showing: {formatDayLabel(datePreset === "custom" ? customDate : datePreset === "yesterday" ? yesterdayKey : datePreset === "today" ? todayKey : datePreset)}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						
						{/* 1. Gross Profit & Net Profit Performance Analysis Card */}
						<Card className="border-border/80 shadow-md bg-gradient-to-br from-slate-50/70 via-background to-blue-50/30 dark:from-slate-900/60 dark:via-background dark:to-blue-950/20">
							<CardHeader className="pb-3 border-b border-border/50">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
									<div className="flex items-center gap-2.5">
										<div className="h-8 w-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
											<CalculatorIcon className="h-4.5 w-4.5" />
										</div>
										<div>
											<CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
												Gross Profit & Net Profit Overview
												<Badge variant="outline" className="font-semibold text-xs border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400">
													सकल व शुद्ध लाभ
												</Badge>
											</CardTitle>
											<CardDescription className="text-xs">
												Selling Price − Cost of Goods (COGS) − Operating Expenses (Fuel & Claims)
											</CardDescription>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
											Period: {formatDayLabel(datePreset === "custom" ? customDate : datePreset === "yesterday" ? yesterdayKey : datePreset === "today" ? todayKey : datePreset)}
										</Badge>
										{salesLoading && (
											<Loader2Icon className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
										)}
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4 pt-4">
								{/* 4-Box Metric Grid */}
								<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
									{/* Selling / Revenue */}
									<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background p-3.5 shadow-sm">
										<div className="flex items-center justify-between text-muted-foreground">
											<span className="text-[11px] font-bold uppercase tracking-wider">
												1. Sales / Revenue (कुल बिक्री)
											</span>
											<TrendingUpIcon className="h-3.5 w-3.5 text-blue-600" />
										</div>
										<p className="mt-1.5 text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
											₹{profitMetrics.totalSelling.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
										</p>
										<p className="text-[11px] text-muted-foreground mt-0.5">
											{profitMetrics.ordersCount} bill(s) invoiced
										</p>
									</div>

									{/* Cost of Goods Sold (COGS) */}
									<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background p-3.5 shadow-sm">
										<div className="flex items-center justify-between text-muted-foreground">
											<span className="text-[11px] font-bold uppercase tracking-wider">
												2. Cost of Goods (COGS खरीद)
											</span>
											<CoinsIcon className="h-3.5 w-3.5 text-amber-600" />
										</div>
										<p className="mt-1.5 text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300">
											₹{profitMetrics.totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
										</p>
										<p className="text-[11px] text-muted-foreground mt-0.5">
											Product procurement cost
										</p>
									</div>

									{/* Gross Profit */}
									<div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 shadow-sm">
										<div className="flex items-center justify-between">
											<span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
												3. Gross Profit (सकल लाभ)
											</span>
											<Badge variant="outline" className="text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
												{profitMetrics.grossMargin.toFixed(1)}% Margin
											</Badge>
										</div>
										<p className="mt-1.5 text-lg sm:text-xl font-black text-blue-700 dark:text-blue-400">
											₹{profitMetrics.grossProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
										</p>
										<p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
											Selling Price − Cost Price
										</p>
									</div>

									{/* Net Profit (Gross Profit - Expenses) */}
									<div className={`rounded-xl border p-3.5 shadow-sm ${
										profitMetrics.netProfit >= 0
											? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30"
											: "border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30"
									}`}>
										<div className="flex items-center justify-between">
											<span className={`text-[11px] font-bold uppercase tracking-wider ${
												profitMetrics.netProfit >= 0 ? "text-emerald-900 dark:text-emerald-300" : "text-rose-900 dark:text-rose-300"
											}`}>
												4. Net Profit (शुद्ध लाभ)
											</span>
											<Badge className={`text-[10px] font-bold ${
												profitMetrics.netProfit >= 0
													? "bg-emerald-600 text-white"
													: "bg-rose-600 text-white"
											}`}>
												{profitMetrics.netProfit >= 0 ? "PROFIT लाभ" : "NET LOSS हानि"}
											</Badge>
										</div>
										<p className={`mt-1.5 text-lg sm:text-xl font-black flex items-center gap-1 ${
											profitMetrics.netProfit >= 0
												? "text-emerald-600 dark:text-emerald-400"
												: "text-rose-600 dark:text-rose-400"
										}`}>
											{profitMetrics.netProfit >= 0 ? "+" : ""}₹{profitMetrics.netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
										</p>
										<p className={`text-[11px] mt-0.5 ${
											profitMetrics.netProfit >= 0 ? "text-emerald-700/80 dark:text-emerald-400/80" : "text-rose-700/80 dark:text-rose-400/80"
										}`}>
											{profitMetrics.netMargin.toFixed(1)}% Net Margin (Gross Profit − कुल खर्च ₹{profitMetrics.totalOperatingExpenses.toFixed(2)})
										</p>
									</div>
								</div>

								{/* Accounting Calculation Waterfall Trail */}
								<div className="rounded-lg bg-slate-100/80 dark:bg-slate-900/80 px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
									<div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
										<span className="font-bold text-foreground">Formula:</span>
										<span>बिक्री ₹{profitMetrics.totalSelling.toFixed(2)}</span>
										<span className="text-slate-400">−</span>
										<span>COGS लागत ₹{profitMetrics.totalCost.toFixed(2)}</span>
										<span className="text-slate-400">=</span>
										<span className="text-blue-600 font-bold">सकल लाभ ₹{profitMetrics.grossProfit.toFixed(2)}</span>
										<span className="text-slate-400">−</span>
										<span className="text-amber-600 font-bold">कुल खर्च ₹{profitMetrics.totalOperatingExpenses.toFixed(2)}</span>
										<span className="text-slate-400">=</span>
										<span className={`font-black ${profitMetrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
											शुद्ध लाभ ₹{profitMetrics.netProfit.toFixed(2)}
										</span>
									</div>
									<div className="text-[11px] text-muted-foreground font-mono">
										Net Margin: {profitMetrics.netMargin.toFixed(1)}%
									</div>
								</div>
							</CardContent>
						</Card>

						{/* 2. Particulars Expense Allocation Box (किसमें कितना खर्च लगा - Fuels vs Others) */}
						<Card className="border-border/80 shadow-sm">
							<CardHeader className="pb-3 border-b">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
									<div>
										<CardTitle className="text-base font-bold flex items-center gap-2">
											<ReceiptIcon className="h-4.5 w-4.5 text-amber-600" />
											Expenditure by Particulars (खर्च किसमें कितना लगा)
										</CardTitle>
										<CardDescription className="text-xs">
											Fuel, transport, meals, and operating cost distribution. Click any box to filter the list below.
										</CardDescription>
									</div>

									<div className="flex items-center gap-2">
										<Badge variant="outline" className="font-bold text-xs bg-slate-100 dark:bg-slate-900">
											Total Outflow: ₹{categoryBreakdown.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
										</Badge>
										{selectedCategoryFilter !== "all" && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => setSelectedCategoryFilter("all")}
												className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700"
											>
												Reset Filter
											</Button>
										)}
									</div>
								</div>
							</CardHeader>

							<CardContent className="space-y-4 pt-4">
								{/* Multi-segment proportional visual bar */}
								<div className="space-y-1.5">
									<div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
										<span>Category Distribution Ratio</span>
										<span>{categoryBreakdown.grandTotal > 0 ? "100% Allocated" : "No Expenses Yet"}</span>
									</div>
									<div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
										{categoryBreakdown.items.map((cat) => {
											const pct =
												categoryBreakdown.grandTotal > 0
													? (cat.total / categoryBreakdown.grandTotal) * 100
													: 0;
											if (pct <= 0) return null;
											return (
												<div
													key={cat.id}
													className={`h-full ${cat.barColor} transition-all duration-300`}
													style={{ width: `${pct}%` }}
													title={`${cat.name}: ₹${cat.total.toFixed(2)} (${pct.toFixed(1)}%)`}
												/>
											);
										})}
									</div>
								</div>

								{/* 5-Category Highlight Cards Grid */}
								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
									{categoryBreakdown.items.map((cat) => {
										const Icon = cat.icon;
										const pct =
											categoryBreakdown.grandTotal > 0
												? (cat.total / categoryBreakdown.grandTotal) * 100
												: 0;
										const isSelected = selectedCategoryFilter === cat.id;

										return (
											<button
												key={cat.id}
												type="button"
												onClick={() =>
													setSelectedCategoryFilter(
														selectedCategoryFilter === cat.id ? "all" : cat.id,
													)
												}
												className={`text-left rounded-xl p-3 border transition-all duration-200 relative group ${
													isSelected
														? "ring-2 ring-blue-600 border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md"
														: "border-border/70 hover:border-border hover:shadow-sm bg-background hover:bg-slate-50/60 dark:hover:bg-slate-900/60"
												}`}
											>
												<div className="flex items-center justify-between">
													<div className={`h-7 w-7 rounded-lg flex items-center justify-center ${cat.badge}`}>
														<Icon className="h-4 w-4" />
													</div>
													<Badge variant="outline" className={`text-[10px] font-bold ${cat.badge}`}>
														{pct.toFixed(0)}%
													</Badge>
												</div>

												<p className="mt-2 text-xs font-bold text-foreground truncate">
													{cat.name}
												</p>
												<p className="text-[10px] text-muted-foreground truncate">
													{cat.hindi}
												</p>

												<p className={`mt-1.5 text-base font-black ${cat.color}`}>
													₹{cat.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
												</p>

												<div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
													<span>{cat.count} entry(s)</span>
													{isSelected && (
														<span className="font-bold text-blue-600 dark:text-blue-400">
															Active Filter
														</span>
													)}
												</div>
											</button>
										);
									})}
								</div>
							</CardContent>
						</Card>

						{/* Day Summary KPI Cards */}
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<Card className="border-l-4 border-l-blue-600 p-3 shadow-sm">
								<p className="text-[11px] font-bold text-muted-foreground uppercase">
									{datePreset === "today" ? "Today's Total" : datePreset === "yesterday" ? "Yesterday's Total" : datePreset === "custom" ? "Date Total" : "Selected Total"}
								</p>
								<p className="mt-1 font-bold text-lg text-blue-600 sm:text-xl">
									₹{expenseStats.total.toFixed(2)}
								</p>
								<p className="text-[10px] text-muted-foreground">
									{expenseStats.count} total records
								</p>
							</Card>

							<Card className="border-l-4 border-l-emerald-600 p-3 shadow-sm">
								<p className="text-[11px] font-bold text-muted-foreground uppercase">
									Settled & Paid
								</p>
								<p className="mt-1 font-bold text-lg text-emerald-600 sm:text-xl">
									₹{expenseStats.paid.toFixed(2)}
								</p>
								<p className="text-[10px] text-muted-foreground">
									Disbursed / Cash Book
								</p>
							</Card>

							<Card className="border-l-4 border-l-amber-500 p-3 shadow-sm">
								<p className="text-[11px] font-bold text-muted-foreground uppercase">
									Pending Review
								</p>
								<p className="mt-1 font-bold text-lg text-amber-600 sm:text-xl">
									₹{expenseStats.pending.toFixed(2)}
								</p>
								<p className="text-[10px] text-muted-foreground">
									Awaiting verification
								</p>
							</Card>

							<Card className="border-l-4 border-l-slate-400 p-3 shadow-sm">
								<p className="text-[11px] font-bold text-muted-foreground uppercase">
									Avg / Expense
								</p>
								<p className="mt-1 font-bold text-lg text-slate-800 dark:text-slate-100 sm:text-xl">
									₹{expenseStats.count > 0 ? (expenseStats.total / expenseStats.count).toFixed(2) : "0.00"}
								</p>
								<p className="text-[10px] text-muted-foreground">
									Per claim entry
								</p>
							</Card>
						</div>

						{/* Day-wise Grouped or Single Day Table */}
						{(myLoading || allLoading) ? (
							<div className="flex justify-center py-12">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : filteredExpenses.length === 0 ? (
							<Card className="shadow-sm">
								<CardContent className="py-12 text-center text-muted-foreground">
									<WalletCardsIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
									<p className="font-bold text-sm">
										No expenses found for {formatDayLabel(datePreset === "custom" ? customDate : datePreset === "yesterday" ? yesterdayKey : datePreset === "today" ? todayKey : datePreset)}.
									</p>
									<p className="mt-1 text-xs">
										Try picking another date or click "Today" / "All Dates" to view claims.
									</p>
								</CardContent>
							</Card>
						) : (datePreset === "last7" || datePreset === "month" || datePreset === "all") ? (
							/* Multi-day Grouped View */
							<div className="space-y-4">
								{groupedByDay.map((group) => (
									<Card key={group.dateKey} className="overflow-hidden shadow-sm">
										<div className="flex items-center justify-between border-b bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
											<span className="font-bold text-xs text-slate-800 dark:text-slate-200">
												📅 {formatDayLabel(group.dateKey)} ({group.dateKey})
											</span>
											<span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-xs text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
												Day Total: ₹{group.dayTotal.toFixed(2)} • {group.items.length} records
											</span>
										</div>
										<CardContent className="p-0">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Claim #</TableHead>
														<TableHead>Time Logged</TableHead>
														{scope === "all" && <TableHead>Staff Member</TableHead>}
														<TableHead>Category</TableHead>
														<TableHead>Business Purpose</TableHead>
														<TableHead>Payment Method</TableHead>
														<TableHead>Amount</TableHead>
														<TableHead className="text-right">Approval Status</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{group.items.map((exp: any) => (
														<TableRow key={exp.id}>
															<TableCell className="font-bold text-blue-600 text-xs">
																{exp.expense_number}
															</TableCell>
															<TableCell className="text-slate-500 text-xs">
																{new Date(exp.expense_date || exp.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
															</TableCell>
															{scope === "all" && (
																<TableCell className="font-semibold text-xs text-slate-700 dark:text-slate-300">
																	{exp.staffMember?.name || "Finance / Self"}
																</TableCell>
															)}
															<TableCell className="text-xs font-medium">
																{exp.custom_category_name || exp.category?.name || "Operational"}
															</TableCell>
															<TableCell className="max-w-[200px] truncate text-xs">
																{exp.business_purpose || exp.description || "-"}
															</TableCell>
															<TableCell className="text-slate-500 text-xs">
																{exp.payment_method || "Cash"}
															</TableCell>
															<TableCell className="font-bold text-xs">
																₹{Number(exp.amount).toFixed(2)}
															</TableCell>
															<TableCell className="text-right">
																<Badge
																	variant={
																		exp.status === "paid"
																			? "default"
																			: exp.status === "rejected"
																				? "destructive"
																				: "outline"
																	}
																	className={
																		exp.status === "submitted"
																			? "border-amber-200 bg-amber-50 text-amber-700"
																			: ""
																	}
																>
																	{exp.status}
																</Badge>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							/* Single Day View (Today, Yesterday, Custom) */
							<Card className="shadow-sm">
								<CardHeader className="py-3 border-b bg-slate-50 dark:bg-slate-900">
									<div className="flex items-center justify-between">
										<span className="font-bold text-xs text-slate-800 dark:text-slate-200">
											📅 Day: {formatDayLabel(datePreset === "custom" ? customDate : datePreset === "yesterday" ? yesterdayKey : todayKey)}
										</span>
										<span className="font-bold text-xs text-blue-600">
											Total: ₹{expenseStats.total.toFixed(2)} ({expenseStats.count} entries)
										</span>
									</div>
								</CardHeader>
								<CardContent className="p-0">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Claim #</TableHead>
												<TableHead>Time Logged</TableHead>
												{scope === "all" && <TableHead>Staff Member</TableHead>}
												<TableHead>Category</TableHead>
												<TableHead>Business Purpose</TableHead>
												<TableHead>Payment Method</TableHead>
												<TableHead>Amount</TableHead>
												<TableHead className="text-right">Approval Status</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredExpenses.map((exp: any) => (
												<TableRow key={exp.id}>
													<TableCell className="font-bold text-blue-600 text-xs">
														{exp.expense_number}
													</TableCell>
													<TableCell className="text-slate-500 text-xs">
														{new Date(exp.expense_date || exp.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
													</TableCell>
													{scope === "all" && (
														<TableCell className="font-semibold text-xs text-slate-700 dark:text-slate-300">
															{exp.staffMember?.name || "Finance / Self"}
														</TableCell>
													)}
													<TableCell className="text-xs font-medium">
														{exp.custom_category_name || exp.category?.name || "Operational"}
													</TableCell>
													<TableCell className="max-w-[200px] truncate text-xs">
														{exp.business_purpose || exp.description || "-"}
													</TableCell>
													<TableCell className="text-slate-500 text-xs">
														{exp.payment_method || "Cash"}
													</TableCell>
													<TableCell className="font-bold text-xs">
														₹{Number(exp.amount).toFixed(2)}
													</TableCell>
													<TableCell className="text-right">
														<Badge
															variant={
																exp.status === "paid"
																	? "default"
																	: exp.status === "rejected"
																		? "destructive"
																		: "outline"
															}
															className={
																exp.status === "submitted"
																	? "border-amber-200 bg-amber-50 text-amber-700"
																	: ""
															}
														>
															{exp.status}
														</Badge>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						)}
					</div>
				)}

				{/* SUPERVISOR REVIEW TAB */}
				{activeTab === "supervisor_review" && (
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="font-bold text-base">
								Manager & HR Review Console
							</CardTitle>
							<CardDescription>
								Evaluate policy compliance limits of active claims and approve
								them to the payout queue
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							{reviewLoading ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Claim ID</TableHead>
											<TableHead>Employee Name</TableHead>
											<TableHead>Business Purpose</TableHead>
											<TableHead>Requested Date</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{submittedClaims?.items?.map((claim: any) => (
											<TableRow key={claim.id}>
												<TableCell className="font-bold text-blue-600 text-xs">
													{claim.expense_number}
												</TableCell>
												<TableCell className="font-bold text-slate-900 dark:text-slate-100">
													{claim.staffMember?.name}
												</TableCell>
												<TableCell className="max-w-[200px] truncate text-xs">
													{claim.business_purpose || "-"}
												</TableCell>
												<TableCell className="text-slate-500 text-xs">
													{new Date(claim.expense_date).toLocaleDateString()}
												</TableCell>
												<TableCell className="font-bold text-xs">
													₹{Number(claim.amount).toFixed(2)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														size="sm"
														onClick={() => {
															setSelectedClaimId(claim.id);
															setIsReviewModalOpen(true);
														}}
														className="h-8 text-xs shadow-sm"
													>
														Review Request
													</Button>
												</TableCell>
											</TableRow>
										))}
										{submittedClaims?.items?.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={6}
													className="py-12 text-center text-muted-foreground"
												>
													<UsersIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
													<p className="font-bold text-sm">
														No claims awaiting supervisor review.
													</p>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				)}

				{/* APPROVED PAYOUTS TAB */}
				{activeTab === "payouts" && (
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="font-bold text-base">
								Approved Reimbursement Payout Desk
							</CardTitle>
							<CardDescription>
								Select bank account, register payment reference, and complete
								employee payouts
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							{payoutsLoading ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Claim ID</TableHead>
											<TableHead>Employee Name</TableHead>
											<TableHead>Category Type</TableHead>
											<TableHead>Approved Date</TableHead>
											<TableHead>Net Payable</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{approvedClaims?.items?.map((claim: any) => (
											<TableRow key={claim.id}>
												<TableCell className="font-bold text-blue-600 text-xs">
													{claim.expense_number}
												</TableCell>
												<TableCell className="font-bold text-slate-900 dark:text-slate-100">
													{claim.staffMember?.name}
												</TableCell>
												<TableCell className="font-semibold text-xs">
													{claim.category?.name || "Operational"}
												</TableCell>
												<TableCell className="text-slate-500 text-xs">
													{claim.reviewed_at
														? new Date(claim.reviewed_at).toLocaleDateString()
														: "Today"}
												</TableCell>
												<TableCell className="font-bold text-green-600 text-xs">
													₹{Number(claim.amount).toFixed(2)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														size="sm"
														variant="secondary"
														onClick={() => {
															setSelectedClaimId(claim.id);
															setIsPayModalOpen(true);
														}}
														className="h-8 text-xs shadow-sm"
													>
														Mark as Paid
													</Button>
												</TableCell>
											</TableRow>
										))}
										{approvedClaims?.items?.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={6}
													className="py-12 text-center text-muted-foreground"
												>
													<CheckCircle2Icon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
													<p className="font-bold text-sm">
														No approved claims awaiting finance payout.
													</p>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{/* RECORD DIRECT EXPENSE CLAIM MODAL */}
			<Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
				<DialogContent className="max-w-xl border-border bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Record Direct Expense Claim
						</DialogTitle>
						<DialogDescription>
							Directly record and settle employee expense claim into the Cash Book and financial ledger.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Claim Category Type
								</Label>
								<select
									className="mt-1 h-9 w-full cursor-pointer rounded border border-input bg-background p-2 font-bold text-foreground text-xs dark:bg-slate-950"
									value={claimCategory}
									onChange={(e) => setClaimCategory(e.target.value)}
								>
									<option value="1">Food & Meals (Max ₹500)</option>
									<option value="2">Travel & Transport (Max ₹5000)</option>
									<option value="3">Fuel & Logistics</option>
									<option value="4">Office Supplies</option>
								</select>
							</div>
							<div>
								<Label className="font-bold text-slate-700 text-xs">
									Claim Amount (₹)
								</Label>
								<Input
									type="number"
									placeholder="E.g. 750"
									value={claimAmount}
									onChange={(e) => setClaimAmount(e.target.value)}
									className="mt-1 h-9 font-bold text-xs"
								/>
							</div>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Detailed Description
							</Label>
							<Input
								placeholder="E.g. Bought dinner for business project team"
								value={claimDesc}
								onChange={(e) => setClaimDesc(e.target.value)}
								className="mt-1 h-9 font-semibold text-xs"
							/>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Business Purpose & Context
							</Label>
							<Textarea
								placeholder="Specify clients present, project details, cost center..."
								value={claimPurpose}
								onChange={(e) => setClaimPurpose(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>

						<div className="flex items-center justify-between rounded-lg border border-dashed bg-slate-50 p-3">
							<span className="flex items-center gap-1.5 font-semibold text-muted-foreground text-xs">
								<PaperclipIcon className="h-4 w-4" /> Bill Receipt Screenshot
								(.PNG/.PDF)
							</span>
							<Button size="sm" variant="outline" className="h-7 text-xs">
								Upload Receipt
							</Button>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsSubmitModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSubmitClaim}
							disabled={submitExpenseMutation.isPending}
						>
							{submitExpenseMutation.isPending
								? "Submitting..."
								: "Submit"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* SUPERVISOR REVIEW MODAL */}
			<Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
				<DialogContent className="border-border bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Review Claim Request
						</DialogTitle>
						<DialogDescription>
							Validate claim details against leave, attendance, and expense
							policy limits.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Decision Outcome
							</Label>
							<select
								className="mt-1 h-9 w-full cursor-pointer rounded border border-input bg-background p-2 font-bold text-foreground text-xs dark:bg-slate-950"
								value={reviewDecision}
								onChange={(e) => setReviewDecision(e.target.value as any)}
							>
								<option value="approve">Approve Request</option>
								<option value="reject">Reject Request</option>
							</select>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Reviewer Audit Notes
							</Label>
							<Textarea
								placeholder="E.g. Approved. Verified within food category ₹500 daily allowance."
								value={reviewNotes}
								onChange={(e) => setReviewNotes(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsReviewModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleReviewClaim}
							disabled={reviewExpenseMutation.isPending}
						>
							{reviewExpenseMutation.isPending
								? "Logging..."
								: "Confirm Decision"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* MARK AS PAID / CONFIRM DISBURSEMENT DIALOG */}
			<Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
				<DialogContent className="border-border bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Record Disbursement & Mark as Paid
						</DialogTitle>
						<DialogDescription>
							Input payment bank transactional reference number and close
							reimbursement.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Source Bank Account
							</Label>
							<select
								className="mt-1 h-9 w-full cursor-pointer rounded border border-input bg-background p-2 font-bold text-foreground text-xs dark:bg-slate-950"
								value={payBankAccountId}
								onChange={(e) => setPayBankAccountId(e.target.value)}
							>
								{bankAccountsList?.map((b) => (
									<option key={b.id} value={b.id}>
										{b.bank_name} — {b.account_number} (Balance: ₹
										{b.current_balance})
									</option>
								))}
							</select>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Payment Reference Number (UTR/UPI Ref)
							</Label>
							<Input
								placeholder="E.g. UTR-2026-9851475"
								value={payRefNumber}
								onChange={(e) => setPayRefNumber(e.target.value)}
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPayModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handlePayClaim}
							disabled={payExpenseMutation.isPending}
						>
							{payExpenseMutation.isPending
								? "Confirming..."
								: "Record Payment & Complete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
