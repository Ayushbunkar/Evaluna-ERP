"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
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
	ActivityIcon,
	BanknoteIcon,
	ClockIcon,
	CreditCardIcon,
	HistoryIcon,
	MonitorSmartphoneIcon,
	PlusCircleIcon,
	ReceiptTextIcon,
	TrendingUpIcon,
	Undo2Icon,
	UserCheckIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

const BillingSalesChart = dynamic(
	() => import("@/components/charts/billing-charts").then((m) => m.BillingSalesChart),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[250px] w-full rounded-lg" />,
	},
);

const BillingHourlyChart = dynamic(
	() => import("@/components/charts/billing-charts").then((m) => m.BillingHourlyChart),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[200px] w-full rounded-lg" />,
	},
);

const BillingPaymentChart = dynamic(
	() => import("@/components/charts/billing-charts").then((m) => m.BillingPaymentChart),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[200px] w-full rounded-lg" />,
	},
);

function KPICard({
	title,
	value,
	icon: Icon,
	colorClass,
}: {
	title: string;
	value: string | number;
	icon: any;
	colorClass: string;
}) {
	return (
		<Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 shadow-sm">
			<div
				className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 transition-opacity group-hover:opacity-100`}
			/>
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-primary">
						<Icon className="h-4 w-4" />
					</div>
				</div>
				<div className="mt-3">
					<p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
						{title}
					</p>
					<h3 className="mt-1 font-bold text-xl tracking-tight">{value}</h3>
				</div>
			</CardContent>
		</Card>
	);
}

export default function BillingDashboard() {
	const { activeBranchId } = useBranch();

	const { data, isLoading } = trpc.billing.getDashboardStats.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
		{ staleTime: 30_000, refetchOnWindowFocus: false },
	);

	if (isLoading || !data) {
		return (
			<div className="flex h-full min-h-[400px] items-center justify-center">
				<div className="h-10 w-10 animate-spin rounded-full border-primary border-b-2" />
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

	const paymentColors = [
		"hsl(var(--chart-2))",
		"hsl(var(--chart-1))",
		"hsl(var(--chart-3))",
	];

	const chartConfig = {
		sales: { label: "Sales", color: "hsl(var(--chart-1))" },
		amount: { label: "Amount", color: "hsl(var(--chart-2))" },
		value: { label: "Value", color: "hsl(var(--chart-3))" },
	} satisfies ChartConfig;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Billing & POS Overview
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Real-time point of sale and transaction metrics.
				</p>
			</div>

			{/* KPIs Grid */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8"
			>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Today's Bills"
						value={data.todaysBills}
						icon={ReceiptTextIcon}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-2"
				>
					<KPICard
						title="Revenue"
						value={formatCurrency(data.revenue, "en-US")}
						icon={TrendingUpIcon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Avg Bill"
						value={formatCurrency(data.averageBill, "en-US")}
						icon={ActivityIcon}
						colorClass="from-indigo-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Refunds"
						value={formatCurrency(data.refunds, "en-US")}
						icon={Undo2Icon}
						colorClass="from-rose-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Cash"
						value={formatCurrency(data.cashCollected, "en-US")}
						icon={BanknoteIcon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Card & UPI"
						value={formatCurrency(
							data.cardCollected + data.upiCollected,
							"en-US",
						)}
						icon={CreditCardIcon}
						colorClass="from-cyan-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Pending"
						value={data.pendingBills}
						icon={ClockIcon}
						colorClass="from-amber-500/10 to-transparent"
					/>
				</motion.div>
			</motion.div>

			{/* Main Widgets Bento Grid */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 gap-6 lg:grid-cols-3"
			>
				{/* Sales Chart */}
				<motion.div variants={itemVariants} className="lg:col-span-2">
					<Card className="flex h-full flex-col border-border/50 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle>Sales Timeline</CardTitle>
							<CardDescription>Intra-day sales progression</CardDescription>
						</CardHeader>
						<CardContent className="min-h-[250px] flex-1">
							{data.salesChart ? (
								<BillingSalesChart data={data.salesChart} />
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Quick Actions & Top Cashier */}
				<motion.div variants={itemVariants} className="flex flex-col gap-6">
					<Card className="border-border/50 border-primary/20 bg-primary/5 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<MonitorSmartphoneIcon className="h-4 w-4 text-primary" /> Quick
								POS Actions
							</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-2 gap-3">
							<Button className="w-full justify-start gap-2" size="sm">
								<PlusCircleIcon className="h-4 w-4" /> New Bill
							</Button>
							<Button
								className="w-full justify-start gap-2"
								variant="secondary"
								size="sm"
							>
								<Undo2Icon className="h-4 w-4" /> Return
							</Button>
							<Button
								className="w-full justify-start gap-2"
								variant="outline"
								size="sm"
							>
								<HistoryIcon className="h-4 w-4" /> Hold Bill
							</Button>
							<Button
								className="w-full justify-start gap-2"
								variant="outline"
								size="sm"
							>
								<BanknoteIcon className="h-4 w-4" /> Day Close
							</Button>
						</CardContent>
					</Card>

					<Card className="flex-1 border-border/50 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<UserCheckIcon className="h-4 w-4 text-emerald-600" /> Top
								Cashiers
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.topCashiers?.map((cashier: any, idx: number) => (
								<div key={idx} className="flex items-center justify-between">
									<div>
										<h4 className="font-medium text-sm leading-none">
											{cashier.name}
										</h4>
										<p className="mt-1 text-[10px] text-muted-foreground">
											{cashier.bills} bills punched
										</p>
									</div>
									<div className="font-bold text-emerald-600 text-sm">
										{formatCurrency(cashier.revenue, "en-US")}
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</motion.div>

				{/* Hourly Sales */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Hourly Sales</CardTitle>
							<CardDescription>Revenue by the hour</CardDescription>
						</CardHeader>
						<CardContent>
							{data.hourlySales ? (
								<BillingHourlyChart data={data.hourlySales} />
							) : (
								<div className="flex h-[200px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Payment Distribution */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Payment Methods</CardTitle>
							<CardDescription>Collection breakdown</CardDescription>
						</CardHeader>
						<CardContent>
							{data.paymentDistribution ? (
								<BillingPaymentChart data={data.paymentDistribution} />
							) : (
								<div className="flex h-[200px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Recent Bills */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader className="border-border/50 border-b pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 text-base">
									<ReceiptTextIcon className="h-4 w-4 text-primary" /> Recent
									Bills
								</CardTitle>
								<Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
									View All
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="text-[10px]">Invoice</TableHead>
										<TableHead className="text-[10px]">Customer</TableHead>
										<TableHead className="text-right text-[10px]">
											Amount
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.recentBills?.map((bill: any) => (
										<TableRow key={bill.id}>
											<TableCell className="font-medium text-xs">
												{bill.id}
											</TableCell>
											<TableCell>
												<div className="text-xs">{bill.customer}</div>
												<div className="text-[9px] text-muted-foreground uppercase">
													{bill.payment} • {bill.items} items
												</div>
											</TableCell>
											<TableCell className="text-right">
												<div className="font-bold text-xs">
													{formatCurrency(bill.amount, "en-US")}
												</div>
												<div
													className={`mt-0.5 font-bold text-[9px] uppercase tracking-wider ${bill.status === "paid" ? "text-emerald-500" : "text-amber-500"}`}
												>
													{bill.status}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
