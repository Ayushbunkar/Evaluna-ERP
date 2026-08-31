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
	CurrencyIcon,
	TrendingDownIcon,
	TrendingUpIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { DataError, TableLoading } from "@/components/admin/data-states";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function AdminFinancePage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: stats,
		isLoading,
		error,
		refetch,
	} = trpc.admin.getFinancialSummary.useQuery();

	const fmt = (n: number) => formatCurrency(Number(n) || 0, locale);

	const profitMargin =
		stats && stats.totalRevenue > 0
			? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1) + "%"
			: "0%";

	const metrics: {
		title: string;
		description: string;
		icon: LucideIcon;
		iconBg: string;
		iconColor: string;
		value: string;
	}[] = stats
		? [
				{
					title: "Cash Balance",
					description: "Net cash from transactions",
					icon: CurrencyIcon,
					iconBg: "bg-indigo-500/10",
					iconColor: "text-indigo-500",
					value: fmt(stats.cashBalance),
				},
				{
					title: "Total Revenue",
					description: "All-time income",
					icon: TrendingUpIcon,
					iconBg: "bg-green-500/10",
					iconColor: "text-green-500",
					value: fmt(stats.totalRevenue),
				},
				{
					title: "Total Expenses",
					description: "All-time expenses",
					icon: TrendingDownIcon,
					iconBg: "bg-red-500/10",
					iconColor: "text-red-500",
					value: fmt(stats.totalExpenses),
				},
				{
					title: "Net Profit",
					description: "Revenue minus expenses",
					icon: BanknoteIcon,
					iconBg: "bg-blue-500/10",
					iconColor: "text-blue-500",
					value: fmt(stats.netProfit),
				},
				{
					title: "Receivables",
					description: "Amount owed by customers",
					icon: CurrencyIcon,
					iconBg: "bg-yellow-500/10",
					iconColor: "text-yellow-500",
					value: fmt(stats.totalReceivables),
				},
				{
					title: "Payables",
					description: "Amount owed to suppliers",
					icon: CurrencyIcon,
					iconBg: "bg-purple-500/10",
					iconColor: "text-purple-500",
					value: fmt(stats.totalPayables),
				},
				{
					title: "Bank Balance",
					description: "Total bank account balances",
					icon: BanknoteIcon,
					iconBg: "bg-gray-500/10",
					iconColor: "text-gray-500",
					value: fmt(stats.bankBalance),
				},
				{
					title: "Profit Margin",
					description: "Profit as percentage of revenue",
					icon: ChartLineIcon,
					iconBg: "bg-green-500/10",
					iconColor: "text-green-500",
					value: profitMargin,
				},
			]
		: [];

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Finance Overview
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Financial summary and key metrics
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Financial Activities
					</Button>
				</div>
			</div>

			<div className="mt-6">
				{isLoading ? (
					<TableLoading columns={4} rows={2} />
				) : error || !stats ? (
					<DataError
						title="Error loading financial data"
						message={error?.message}
						onRetry={() => refetch()}
					/>
				) : (
					<>
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
							{metrics.map((m) => (
								<Card
									key={m.title}
									className="border-border/50 bg-card/50 shadow-sm"
								>
									<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
										<div className="space-y-0.5">
											<CardTitle className="text-base sm:text-lg">
												{m.title}
											</CardTitle>
											<CardDescription className="text-xs sm:text-sm">
												{m.description}
											</CardDescription>
										</div>
									</CardHeader>
									<CardContent className="pt-1 sm:pt-2">
										<div className="flex flex-col items-center gap-2 text-center">
											<div
												className={`flex h-12 w-12 items-center justify-center rounded-full ${m.iconBg}`}
											>
												<m.icon className={`h-6 w-6 ${m.iconColor}`} />
											</div>
											<p className="font-bold text-2xl">{m.value}</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						<div className="mt-8">
							<h2 className="mb-4 font-bold text-foreground text-lg tracking-tight">
								Financial Details
							</h2>
							<div className="grid gap-6 sm:grid-cols-2">
								<div className="rounded-lg border border-border/50 bg-card/50 p-6">
									<h3 className="mb-3 font-semibold text-foreground">
										Cash Flow Summary
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between text-sm">
											<span>Total Inflow:</span>
											<span className="font-medium">
												{fmt(stats.totalRevenue)}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Total Outflow:</span>
											<span className="font-medium">
												{fmt(stats.totalExpenses)}
											</span>
										</div>
										<div className="flex justify-between border-border/50 border-t pt-3 font-semibold text-sm">
											<span>Net Cash Flow:</span>
											<span
												className={
													stats.netProfit >= 0
														? "text-green-600"
														: "text-red-600"
												}
											>
												{fmt(stats.netProfit)}
											</span>
										</div>
									</div>
								</div>

								<div className="rounded-lg border border-border/50 bg-card/50 p-6">
									<h3 className="mb-3 font-semibold text-foreground">
										Outstanding Balances
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between text-sm">
											<span>Receivables (Customers):</span>
											<span className="font-medium">
												{fmt(stats.totalReceivables)}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Payables (Suppliers):</span>
											<span className="font-medium">
												{fmt(stats.totalPayables)}
											</span>
										</div>
										<div className="flex justify-between border-border/50 border-t pt-3 font-semibold text-sm">
											<span>Bank Balance:</span>
											<span className="font-medium">
												{fmt(stats.bankBalance)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</PageTransition>
	);
}
