"use client";

import { Badge } from "@evaluna/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { motion } from "framer-motion";
import {
	ArrowDownLeftIcon,
	ArrowUpRightIcon,
	IndianRupeeIcon,
	LandmarkIcon,
	TrendingDownIcon,
	TrendingUpIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function FinancePage() {
	const { data, isLoading } = trpc.finance.getDashboardStats.useQuery({});

	const kpis = [
		{
			label: "Monthly Revenue",
			value: data ? `₹${data.monthlyRevenue.toLocaleString("en-IN")}` : "—",
			icon: TrendingUpIcon,
			color: "text-green-600",
			bg: "bg-green-50",
		},
		{
			label: "Total Expenses",
			value: data ? `₹${data.totalExpenses.toLocaleString("en-IN")}` : "—",
			icon: TrendingDownIcon,
			color: "text-red-600",
			bg: "bg-red-50",
		},
		{
			label: "Net Profit",
			value: data ? `₹${data.netProfit.toLocaleString("en-IN")}` : "—",
			icon: IndianRupeeIcon,
			color: "text-blue-600",
			bg: "bg-blue-50",
		},
		{
			label: "GST Liability",
			value: data ? `₹${data.gstLiability.toLocaleString("en-IN")}` : "—",
			icon: LandmarkIcon,
			color: "text-purple-600",
			bg: "bg-purple-50",
		},
	];

	const secondRow = [
		{
			label: "Total Receivables",
			value: data ? `₹${data.totalReceivables.toLocaleString("en-IN")}` : "—",
			color: "text-green-600",
		},
		{
			label: "Total Payables",
			value: data ? `₹${data.totalPayables.toLocaleString("en-IN")}` : "—",
			color: "text-red-600",
		},
		{
			label: "Cash Flow",
			value: data ? `₹${data.cashFlow.toLocaleString("en-IN")}` : "—",
			color: "text-blue-600",
		},
		{
			label: "Today's Cash",
			value: data ? `₹${data.todaysCash.toLocaleString("en-IN")}` : "—",
			color: "text-teal-600",
		},
	];

	return (
		<motion.div
			className="space-y-6 p-6"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div>
				<h1 className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text font-bold text-3xl text-transparent">
					Finance
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Complete financial overview — revenue, expenses, GST, and cash flow
				</p>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{kpis.map((kpi, i) => (
					<motion.div
						key={kpi.label}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: i * 0.07 }}
					>
						<Card className="border-0 shadow-sm">
							<CardContent className="pt-6">
								<div className="flex items-center gap-3">
									<div className={`${kpi.bg} rounded-lg p-2`}>
										<kpi.icon className={`h-5 w-5 ${kpi.color}`} />
									</div>
									<div>
										<p className="text-muted-foreground text-sm">{kpi.label}</p>
										{isLoading ? (
											<Skeleton className="mt-1 h-6 w-24" />
										) : (
											<p className="font-bold text-xl">{kpi.value}</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				{secondRow.map((item) => (
					<Card key={item.label} className="border-0 shadow-sm">
						<CardContent className="pt-6">
							<p className="text-muted-foreground text-sm">{item.label}</p>
							{isLoading ? (
								<Skeleton className="mt-2 h-8 w-32" />
							) : (
								<p className={`mt-1 font-bold text-2xl ${item.color}`}>
									{item.value}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card className="border-0 shadow-sm">
					<CardHeader>
						<CardTitle className="text-sm">Bank Balances</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-3">
								{[...Array(3)].map((_, i) => (
									<Skeleton key={i} className="h-10 w-full" />
								))}
							</div>
						) : (
							<div className="space-y-3">
								{(data?.bankBalances ?? []).map((bank, i) => (
									<div
										key={i}
										className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
									>
										<div>
											<p className="font-medium text-sm">{bank.account}</p>
											<p className="text-muted-foreground text-xs">
												{bank.type}
											</p>
										</div>
										<span className="font-bold text-green-600">
											₹{bank.balance.toLocaleString("en-IN")}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-0 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<LandmarkIcon className="h-4 w-4" /> GST Summary
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">
									Input Tax Credit
								</span>
								{isLoading ? (
									<Skeleton className="h-5 w-20" />
								) : (
									<span className="font-semibold text-green-600">
										₹{data?.gstSummary?.inputTax?.toLocaleString("en-IN")}
									</span>
								)}
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">
									Output Tax
								</span>
								{isLoading ? (
									<Skeleton className="h-5 w-20" />
								) : (
									<span className="font-semibold text-red-600">
										₹{data?.gstSummary?.outputTax?.toLocaleString("en-IN")}
									</span>
								)}
							</div>
							<div className="flex items-center justify-between border-t pt-3">
								<span className="font-semibold">Net GST Liability</span>
								{isLoading ? (
									<Skeleton className="h-6 w-24" />
								) : (
									<span className="font-bold text-purple-600 text-xl">
										₹{data?.gstSummary?.netLiability?.toLocaleString("en-IN")}
									</span>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<IndianRupeeIcon className="h-5 w-5 text-purple-600" />
						Recent Transactions
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(4)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Ref ID</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Description</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(data?.recentTransactions ?? []).map((tx, i) => (
									<TableRow key={i} className="hover:bg-muted/30">
										<TableCell className="font-mono text-sm">{tx.id}</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{tx.date}
										</TableCell>
										<TableCell>{tx.description}</TableCell>
										<TableCell>
											{tx.type === "credit" ? (
												<div className="flex items-center gap-1 text-green-600 text-sm">
													<ArrowDownLeftIcon className="h-3 w-3" />
													Credit
												</div>
											) : (
												<div className="flex items-center gap-1 text-red-600 text-sm">
													<ArrowUpRightIcon className="h-3 w-3" />
													Debit
												</div>
											)}
										</TableCell>
										<TableCell
											className={`font-semibold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}
										>
											{tx.type === "credit" ? "+" : "-"}₹
											{tx.amount.toLocaleString("en-IN")}
										</TableCell>
										<TableCell>
											{tx.status === "completed" ? (
												<Badge className="bg-green-100 text-green-800">
													Completed
												</Badge>
											) : (
												<Badge className="bg-yellow-100 text-yellow-800">
													Pending
												</Badge>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}
