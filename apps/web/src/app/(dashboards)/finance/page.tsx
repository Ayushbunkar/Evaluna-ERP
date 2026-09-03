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
	ActivityIcon,
	BanknoteIcon,
	ChartLineIcon,
	CreditCardIcon,
	TrendingUpIcon,
	AlertCircleIcon,
	FileTextIcon,
	CalculatorIcon,
	ArrowRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition, AnimatedCard, StaggerList, StaggerItem } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@evaluna/ui/components/skeleton";

export default function FinanceDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const { data: stats, isLoading, error } = trpc.finance.getDashboardStats.useQuery({});

	if (isLoading) {
		return (
			<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
				<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
					<div className="flex flex-col gap-1">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-48" />
					</div>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
					{[...Array(8)].map((_, i) => (
						<Skeleton key={i} className="h-32 w-full rounded-xl" />
					))}
				</div>
			</PageTransition>
		);
	}

	if (error) {
		return (
			<div className="flex h-64 items-center justify-center text-red-500">
				Failed to load dashboard data. Please try again.
			</div>
		);
	}

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Finance Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Financial overview and monetary management
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/finance/invoices">
							<FileTextIcon className="mr-2 h-4 w-4" /> Invoices
						</Link>
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/finance/transactions">
							<BanknoteIcon className="mr-2 h-4 w-4" /> Transactions
						</Link>
					</Button>
				</div>
			</div>

			{/* KPI Stats Grid */}
			<StaggerList
				className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
				slow
			>
				{[
					{
						title: "Total Revenue",
						value: stats?.monthlyRevenue,
						icon: <TrendingUpIcon className="h-6 w-6 text-green-500" />,
						bg: "bg-green-500/10",
					},
					{
						title: "Total Expenses",
						value: stats?.totalExpenses,
						icon: <ChartLineIcon className="h-6 w-6 text-red-500" />,
						bg: "bg-red-500/10",
					},
					{
						title: "Gross Profit",
						value: stats?.grossProfit,
						icon: <BanknoteIcon className="h-6 w-6 text-blue-500" />,
						bg: "bg-blue-500/10",
					},
					{
						title: "Net Profit",
						value: stats?.netProfit,
						icon: <ActivityIcon className="h-6 w-6 text-emerald-500" />,
						bg: "bg-emerald-500/10",
					},
					{
						title: "Cash Balance",
						value: stats?.todaysCash, // Simplified
						icon: <CreditCardIcon className="h-6 w-6 text-yellow-500" />,
						bg: "bg-yellow-500/10",
					},
					{
						title: "Accounts Receivable",
						value: stats?.totalReceivables,
						icon: <FileTextIcon className="h-6 w-6 text-indigo-500" />,
						bg: "bg-indigo-500/10",
					},
					{
						title: "Accounts Payable",
						value: stats?.totalPayables,
						icon: <FileTextIcon className="h-6 w-6 text-orange-500" />,
						bg: "bg-orange-500/10",
					},
					{
						title: "Overdue Receivables",
						value: stats?.overdueReceivables,
						icon: <AlertCircleIcon className="h-6 w-6 text-red-600" />,
						bg: "bg-red-600/10",
					},
					{
						title: "Overdue Payables",
						value: stats?.overduePayables,
						icon: <AlertCircleIcon className="h-6 w-6 text-orange-600" />,
						bg: "bg-orange-600/10",
					},
					{
						title: "GST/Tax Payable",
						value: stats?.gstLiability,
						icon: <CalculatorIcon className="h-6 w-6 text-purple-500" />,
						bg: "bg-purple-500/10",
					},
				].map((kpi, index) => (
					<StaggerItem key={index}>
						<AnimatedCard>
							<Card className="group border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
								<CardContent className="p-4 sm:p-6">
									<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
										<div className={`transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full ${kpi.bg} group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12`}>
											{kpi.icon}
										</div>
										<h3 className="font-semibold text-base sm:text-lg">
											{kpi.title}
										</h3>
										<p className="text-muted-foreground text-xs sm:text-sm">
											{formatCurrency(kpi.value || 0, locale)}
										</p>
									</div>
								</CardContent>
							</Card>
						</AnimatedCard>
					</StaggerItem>
				))}
				
				<StaggerItem>
					<AnimatedCard>
						<Card className="group border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<FileTextIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Unpaid Invoices
									</h3>
									<p className="text-muted-foreground text-xs sm:text-sm">
										{stats?.unpaidInvoicesCount || 0} pending
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Recent Transactions */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Recent Transactions
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Latest financial transactions
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/finance/transactions">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{stats?.recentTransactions?.length ? (
							<div className="space-y-4">
								{stats.recentTransactions.map((tx: any) => (
									<div key={tx.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
										<div>
											<p className="font-medium text-sm">{tx.description}</p>
											<p className="text-xs text-muted-foreground">{tx.date}</p>
										</div>
										<div className={`font-medium ${tx.type === 'in' || tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
											{tx.type === 'in' || tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, locale)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
								Recent transactions will appear here
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
