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
import {
	ActivityIcon,
	ChartNoAxesCombinedIcon,
	DownloadIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	FileTextIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function FinanceReportsPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	
	const {
		data: reports,
		isLoading,
		error,
	} = trpc.finance.getFinancialReports.useQuery({});

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Financial Reports
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Profit & Loss, Cash Flow, and Financial Analytics
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/finance">
							<ChartNoAxesCombinedIcon className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<DownloadIcon className="mr-1 h-3 w-3" /> Export PDF
					</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="flex h-[200px] items-center justify-center">
					Generating reports...
				</div>
			) : error ? (
				<div className="flex h-[200px] items-center justify-center text-red-500">
					Error generating financial reports
				</div>
			) : !reports ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No report data available.
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2">
					{/* Profit & Loss */}
					<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<FileTextIcon className="h-5 w-5 text-blue-500" />
								Profit & Loss Statement
							</CardTitle>
							<CardDescription>Overall business profitability</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableBody>
									<TableRow>
										<TableCell className="font-medium">Total Revenue</TableCell>
										<TableCell className="text-right text-green-600 font-semibold">{formatCurrency(reports.profitAndLoss.revenue, locale)}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium text-muted-foreground">Less: Cost of Goods Sold</TableCell>
										<TableCell className="text-right text-muted-foreground">({formatCurrency(reports.profitAndLoss.cogs, locale)})</TableCell>
									</TableRow>
									<TableRow className="bg-slate-50 dark:bg-slate-800/50">
										<TableCell className="font-bold">Gross Profit</TableCell>
										<TableCell className="text-right font-bold text-blue-600">{formatCurrency(reports.profitAndLoss.grossProfit, locale)}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium text-muted-foreground">Less: Operating Expenses</TableCell>
										<TableCell className="text-right text-muted-foreground">({formatCurrency(reports.profitAndLoss.operatingExpenses, locale)})</TableCell>
									</TableRow>
									<TableRow className="bg-slate-100 dark:bg-slate-800">
										<TableCell className="font-bold text-lg">Net Profit</TableCell>
										<TableCell className={`text-right font-bold text-lg ${reports.profitAndLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
											{formatCurrency(reports.profitAndLoss.netProfit, locale)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Cash Flow */}
					<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<ActivityIcon className="h-5 w-5 text-emerald-500" />
								Cash Flow Statement
							</CardTitle>
							<CardDescription>Cash inflows and outflows</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableBody>
									<TableRow>
										<TableCell className="font-medium">Total Cash Inflows</TableCell>
										<TableCell className="text-right text-green-600 font-semibold">{formatCurrency(reports.cashFlow.inflows, locale)}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium">Total Cash Outflows</TableCell>
										<TableCell className="text-right text-red-600 font-semibold">({formatCurrency(reports.cashFlow.outflows, locale)})</TableCell>
									</TableRow>
									<TableRow className="bg-slate-100 dark:bg-slate-800">
										<TableCell className="font-bold text-lg">Net Cash Flow</TableCell>
										<TableCell className={`text-right font-bold text-lg ${reports.cashFlow.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
											{formatCurrency(reports.cashFlow.net, locale)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Expense Breakdown */}
					<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl md:col-span-2">
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<TrendingDownIcon className="h-5 w-5 text-orange-500" />
								Expense Breakdown
							</CardTitle>
							<CardDescription>Operating expenses by category</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								{reports.expenseBreakdown.map((exp: any, idx: number) => (
									<div key={idx} className="flex justify-between items-center border-b pb-2 sm:border-0 sm:pb-0">
										<span className="text-sm font-medium capitalize text-muted-foreground">{exp.category}</span>
										<span className="text-sm font-semibold">{formatCurrency(exp.amount, locale)}</span>
									</div>
								))}
								{reports.expenseBreakdown.length === 0 && (
									<div className="col-span-full text-center text-sm text-muted-foreground py-4">
										No expenses recorded.
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</PageTransition>
	);
}
