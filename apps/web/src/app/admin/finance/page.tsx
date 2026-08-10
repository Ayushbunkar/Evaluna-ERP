"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import type { ChartConfig } from "@evaluna/ui/components/chart";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { motion } from "framer-motion";
import {
	ActivityIcon,
	ArrowLeftCircleIcon,
	ArrowRightCircleIcon,
	CalculatorIcon,
	ClockIcon,
	IndianRupeeIcon,
	LandmarkIcon,
	ReceiptIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	TruckIcon,
	UsersIcon,
	WalletIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

const FinanceProfitChart = dynamic(
	() =>
		import("@/components/charts/finance-charts").then(
			(m) => m.FinanceProfitChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
	},
);

const FinanceExpenseChart = dynamic(
	() =>
		import("@/components/charts/finance-charts").then(
			(m) => m.FinanceExpenseChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
	},
);

const FinanceCashFlowChart = dynamic(
	() =>
		import("@/components/charts/finance-charts").then(
			(m) => m.FinanceCashFlowChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[250px] w-full rounded-lg" />,
	},
);

function KPICard({
	title,
	value,
	icon: Icon,
	trendValue,
	trendIsPositive,
	colorClass,
}: {
	title: string;
	value: string | number;
	icon: any;
	trendValue?: string;
	trendIsPositive?: boolean;
	colorClass: string;
}) {
	return (
		<Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 shadow-sm">
			<div
				className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 transition-opacity group-hover:opacity-100`}
			/>
			<CardContent className="p-5">
				<div className="flex items-center justify-between">
					<div className="rounded-lg bg-muted p-2.5 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-primary">
						<Icon className="h-5 w-5" />
					</div>
					{trendValue && (
						<div
							className={`flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${trendIsPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
						>
							{trendIsPositive ? "↑" : "↓"} {trendValue}
						</div>
					)}
				</div>
				<div className="mt-3">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
						{title}
					</p>
					<h3 className="mt-1 font-bold text-2xl tracking-tight">{value}</h3>
				</div>
			</CardContent>
		</Card>
	);
}

export default function FinanceDashboard() {
	const { activeBranchId } = useBranch();

	const { data, isLoading } = trpc.finance.getDashboardStats.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
		{ staleTime: 30_000, refetchOnWindowFocus: false },
	);

	if (isLoading || !data) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Skeleton className="h-32 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
				</div>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Skeleton className="h-64 w-full rounded-xl" />
					<Skeleton className="h-64 w-full rounded-xl" />
				</div>
			</div>
		);
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: { staggerChildren: 0.04 },
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 10 },
		show: {
			opacity: 1,
			y: 0,
			transition: { type: "spring", stiffness: 300, damping: 24 },
		},
	};

	const pieColors = [
		"hsl(var(--chart-1))",
		"hsl(var(--chart-2))",
		"hsl(var(--chart-3))",
		"hsl(var(--chart-4))",
		"hsl(var(--chart-5))",
		"hsl(var(--chart-1))",
	];

	const chartConfig = {
		revenue: { label: "Revenue", color: "hsl(var(--chart-2))" },
		expenses: { label: "Expenses", color: "hsl(var(--chart-4))" },
		in: { label: "Cash In", color: "hsl(var(--chart-2))" },
		out: { label: "Cash Out", color: "hsl(var(--chart-4))" },
		amount: { label: "Amount", color: "hsl(var(--chart-1))" },
	} satisfies ChartConfig;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Finance Command Center
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Real-time accounting, taxation, and cash flow.
				</p>
			</div>

			{/* KPIs Grid */}
			<motion.div
				variants={containerVariants as any}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
			>
				<motion.div variants={itemVariants as any}>
					<KPICard
						title="Today's Cash"
						value={formatCurrency(data.todaysCash, "en-IN")}
						icon={WalletIcon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any}>
					<KPICard
						title="Monthly Revenue"
						value={formatCurrency(data.monthlyRevenue, "en-IN")}
						icon={TrendingUpIcon}
						trendValue="12%"
						trendIsPositive={true}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any}>
					<KPICard
						title="Total Expenses"
						value={formatCurrency(data.totalExpenses, "en-IN")}
						icon={TrendingDownIcon}
						trendValue="4%"
						trendIsPositive={false}
						colorClass="from-rose-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any}>
					<KPICard
						title="Net Profit"
						value={formatCurrency(data.netProfit, "en-IN")}
						icon={IndianRupeeIcon}
						trendValue="15%"
						trendIsPositive={true}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any}>
					<KPICard
						title="GST Liability"
						value={formatCurrency(data.gstLiability, "en-IN")}
						icon={CalculatorIcon}
						colorClass="from-amber-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any}>
					<KPICard
						title="Receivables (To Collect)"
						value={formatCurrency(data.totalReceivables, "en-IN")}
						icon={ArrowRightCircleIcon}
						colorClass="from-indigo-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any}>
					<KPICard
						title="Payables (To Pay)"
						value={formatCurrency(data.totalPayables, "en-IN")}
						icon={ArrowLeftCircleIcon}
						colorClass="from-purple-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any}>
					<KPICard
						title="Cash Flow"
						value={formatCurrency(data.cashFlow, "en-IN")}
						icon={ActivityIcon}
						colorClass="from-cyan-500/10 to-transparent"
					/>
				</motion.div>
			</motion.div>

			{/* Main Widgets Bento Grid */}
			<motion.div
				variants={containerVariants as any}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 gap-6 lg:grid-cols-3"
			>
				{/* Profit Chart */}
				<motion.div variants={itemVariants as any} className="lg:col-span-2">
					<Card className="flex h-full flex-col border-border/50 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle>Profit & Loss Trend</CardTitle>
							<CardDescription>
								Revenue vs. Expenses over 6 months
							</CardDescription>
						</CardHeader>
						<CardContent className="min-h-[300px] flex-1">
							{data.profitChart ? (
								<FinanceProfitChart data={data.profitChart} />
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Expense Breakdown */}
				<motion.div variants={itemVariants as any}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Expense Breakdown</CardTitle>
							<CardDescription>Categorized spending analysis</CardDescription>
						</CardHeader>
						<CardContent>
							{data.expenseBreakdown ? (
								<FinanceExpenseChart data={data.expenseBreakdown} />
							) : (
								<div className="flex h-[300px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Cash Flow */}
				<motion.div variants={itemVariants as any} className="lg:col-span-2">
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Weekly Cash Flow</CardTitle>
							<CardDescription>
								Incoming and outgoing cash analysis
							</CardDescription>
						</CardHeader>
						<CardContent>
							{data.cashFlowData ? (
								<FinanceCashFlowChart data={data.cashFlowData} />
							) : (
								<div className="flex h-[250px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Bank Balances & GST Summary */}
				<motion.div
					variants={itemVariants as any}
					className="flex h-full flex-col gap-6"
				>
					<Card className="flex-1 border-blue-500/20 border-border/50 bg-gradient-to-br from-blue-500/5 to-transparent shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<LandmarkIcon className="h-4 w-4 text-blue-600" /> Bank Balances
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.bankBalances?.map((bank: any, idx: number) => (
								<div key={idx} className="flex items-center justify-between">
									<div>
										<h4 className="font-medium text-sm">
											{bank.bank || bank.account}
										</h4>
										<p className="text-[10px] text-muted-foreground uppercase">
											{bank.type}
										</p>
									</div>
									<div className="font-bold text-sm">
										{formatCurrency(bank.balance, "en-IN")}
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="border-amber-500/20 border-border/50 bg-amber-500/5 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-amber-700 text-base">
								<ReceiptIcon className="h-4 w-4" /> GST Summary
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="mt-2 grid grid-cols-2 gap-2">
								<div>
									<p className="text-muted-foreground text-xs">
										Input Tax (Purchases)
									</p>
									<p className="font-semibold text-emerald-600">
										{formatCurrency(data.gstSummary?.inputTax || 0, "en-IN")}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										Output Tax (Sales)
									</p>
									<p className="font-semibold text-rose-600">
										{formatCurrency(data.gstSummary?.outputTax || 0, "en-IN")}
									</p>
								</div>
							</div>
							<div className="mt-4 flex items-center justify-between border-amber-500/20 border-t pt-3">
								<span className="font-medium text-sm">Net Liability</span>
								<span className="font-bold text-amber-700 text-lg">
									{formatCurrency(data.gstSummary?.netLiability || 0, "en-IN")}
								</span>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Outstanding Payments & Recent Transactions */}
				<motion.div
					variants={itemVariants as any}
					className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3"
				>
					<Card className="h-full border-border/50 shadow-sm lg:col-span-1">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<ClockIcon className="h-4 w-4 text-primary" /> Outstanding
								Payments
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.outstandingPayments &&
							data.outstandingPayments.length > 0 ? (
								data.outstandingPayments.map((payment: any) => (
									<div
										key={payment.id}
										className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-2.5 transition-colors hover:border-primary/30"
									>
										<div className="min-w-0 flex-1">
											<h4 className="truncate font-medium text-sm">
												{payment.party}
											</h4>
											<div className="mt-0.5 flex items-center gap-2">
												<span
													className={`rounded px-1.5 py-0.5 font-bold text-[9px] uppercase ${payment.type === "Receivable" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
												>
													{payment.type}
												</span>
												<span className="text-[10px] text-muted-foreground">
													{payment.id}
												</span>
											</div>
										</div>
										<div className="ml-2 text-right">
											<div className="font-bold text-sm">
												{formatCurrency(payment.amount, "en-IN")}
											</div>
											<div
												className={`text-[10px] ${payment.due === "Overdue" ? "font-bold text-rose-500" : "text-muted-foreground"}`}
											>
												{payment.due}
											</div>
										</div>
									</div>
								))
							) : (
								<div className="flex h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
									<p className="text-sm">No outstanding payments</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="h-full border-border/50 shadow-sm lg:col-span-2">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<ActivityIcon className="h-4 w-4 text-primary" /> Recent
								Transactions
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{data.recentTransactions && data.recentTransactions.length > 0 ? (
								data.recentTransactions.map((tx: any) => (
									<div
										key={tx.id}
										className="flex items-center gap-4 rounded-lg border border-border/40 bg-muted/20 p-3 transition-colors hover:border-primary/30"
									>
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
											{tx.type === "IN" ? (
												<ArrowRightCircleIcon className="h-5 w-5 text-emerald-500" />
											) : (
												<ArrowLeftCircleIcon className="h-5 w-5 text-rose-500" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<h4 className="truncate font-medium text-sm">
												{tx.description}
											</h4>
											<div className="flex items-center gap-2 text-[11px] text-muted-foreground">
												<span>{tx.date}</span>
												<span>&bull;</span>
												<span className="capitalize">{tx.category}</span>
												<span>&bull;</span>
												<span>{tx.method}</span>
											</div>
										</div>
										<div
											className={`font-bold text-sm ${tx.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}
										>
											{tx.type === "IN" ? "+" : "-"}
											{formatCurrency(tx.amount, "en-IN")}
										</div>
									</div>
								))
							) : (
								<div className="flex h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
									<p className="text-sm">No recent transactions</p>
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
