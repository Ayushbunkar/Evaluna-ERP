"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
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
	ClockIcon,
	CreditCardIcon,
	IndianRupeeIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function BillingPage() {
	const { data, isLoading } = trpc.billing.getDashboardStats.useQuery({});

	const kpis = [
		{
			label: "Today's Bills",
			value: data?.todaysBills?.toString() ?? "0",
			icon: CreditCardIcon,
			color: "text-blue-600",
			bg: "bg-blue-50",
		},
		{
			label: "Revenue Today",
			value: data ? `₹${data.revenue.toLocaleString("en-IN")}` : "₹0",
			icon: IndianRupeeIcon,
			color: "text-green-600",
			bg: "bg-green-50",
		},
		{
			label: "Avg. Bill Value",
			value: data ? `₹${data.averageBill.toLocaleString("en-IN")}` : "₹0",
			icon: TrendingUpIcon,
			color: "text-purple-600",
			bg: "bg-purple-50",
		},
		{
			label: "Pending Bills",
			value: data?.pendingBills?.toString() ?? "0",
			icon: ClockIcon,
			color: "text-yellow-600",
			bg: "bg-yellow-50",
		},
	];

	const paymentCards = [
		{ label: "Cash", value: data?.cashCollected ?? 0, color: "text-green-600" },
		{ label: "Card", value: data?.cardCollected ?? 0, color: "text-blue-600" },
		{ label: "UPI", value: data?.upiCollected ?? 0, color: "text-purple-600" },
	];

	return (
		<motion.div
			className="space-y-6 p-6"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text font-bold text-3xl text-transparent">
						Billing
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Today's billing summary and payment breakdown
					</p>
				</div>
				<Button className="gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white">
					<CreditCardIcon className="h-4 w-4" />
					New Invoice
				</Button>
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
											<Skeleton className="mt-1 h-6 w-20" />
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

			<div className="grid gap-4 md:grid-cols-2">
				<Card className="border-0 shadow-sm">
					<CardHeader>
						<CardTitle className="text-sm">Payment Breakdown</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{paymentCards.map((p) => (
								<div
									key={p.label}
									className="flex items-center justify-between"
								>
									<span className="text-muted-foreground text-sm">
										{p.label}
									</span>
									{isLoading ? (
										<Skeleton className="h-5 w-24" />
									) : (
										<span className={`font-semibold ${p.color}`}>
											₹{p.value.toLocaleString("en-IN")}
										</span>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<UsersIcon className="h-4 w-4" /> Top Cashiers
						</CardTitle>
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
								{(data?.topCashiers ?? []).map((cashier, i) => (
									<div
										key={i}
										className="flex items-center justify-between rounded-lg bg-muted/30 p-2"
									>
										<div>
											<p className="font-medium text-sm">{cashier.name}</p>
											<p className="text-muted-foreground text-xs">
												{cashier.bills} bills
											</p>
										</div>
										<span className="font-semibold text-green-600">
											₹{cashier.revenue.toLocaleString("en-IN")}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCardIcon className="h-5 w-5 text-green-600" />
						Recent Bills
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Invoice No</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Items</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Payment</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(data?.recentBills ?? []).map((bill, i) => (
									<TableRow key={i} className="hover:bg-muted/30">
										<TableCell className="font-medium font-mono">
											{bill.id}
										</TableCell>
										<TableCell>{bill.customer}</TableCell>
										<TableCell>{bill.items}</TableCell>
										<TableCell className="font-semibold">
											₹{bill.amount.toLocaleString("en-IN")}
										</TableCell>
										<TableCell>
											<Badge variant="outline">{bill.payment}</Badge>
										</TableCell>
										<TableCell>
											{bill.status === "paid" ? (
												<Badge className="bg-green-100 text-green-800">
													Paid
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
