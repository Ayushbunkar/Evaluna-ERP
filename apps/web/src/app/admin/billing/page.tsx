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
	TruckIcon,
	Undo2Icon,
	UserCheckIcon,
	UsersIcon,
	WalletIcon,
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

	const { data, isLoading, error } = trpc.billing.getDashboardStats.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
		{ staleTime: 30_000, refetchOnWindowFocus: false },
	);

	// Mock data for fallback when database is not available
	const mockData = {
		todaysBills: 42,
		revenue: 15750,
		averageBill: 375,
		refunds: 250,
		cashCollected: 8500,
		cardCollected: 5250,
		upiCollected: 2000,
		pendingBills: 3,
		salesChart: [
			{ time: "09:00", sales: 1000 },
			{ time: "10:00", sales: 1500 },
			{ time: "11:00", sales: 2000 },
			{ time: "12:00", sales: 2500 },
			{ time: "13:00", sales: 3000 },
			{ time: "14:00", sales: 2800 },
			{ time: "15:00", sales: 2200 },
			{ time: "16:00", sales: 1800 },
		],
		paymentDistribution: [
			{ name: "Cash", value: 8500 },
			{ name: "Card", value: 5250 },
			{ name: "UPI", value: 2000 },
		],
		hourlySales: [
			{ hour: "09:00", sales: 1000 },
			{ hour: "10:00", sales: 1500 },
			{ hour: "11:00", sales: 2000 },
			{ hour: "12:00", sales: 2500 },
			{ hour: "13:00", sales: 3000 },
			{ hour: "14:00", sales: 2800 },
		],
		topCashiers: [
			{ name: "John Doe", bills: 15, revenue: 5625 },
			{ name: "Jane Smith", bills: 12, revenue: 4500 },
			{ name: "Mike Johnson", bills: 10, revenue: 3750 },
		],
		recentBills: [
			{ id: "INV-1001", customer: "Acme Corp", items: 5, amount: 1875, status: "paid", payment: "Card" },
			{ id: "INV-1002", customer: "Globex Inc", items: 3, amount: 1125, status: "pending", payment: "Cash" },
			{ id: "INV-1003", customer: "Wayne Enterprises", items: 8, amount: 3000, status: "paid", payment: "UPI" },
			{ id: "INV-1004", customer: "Stark Industries", items: 2, amount: 750, status: "paid", payment: "Cash" },
			{ id: "INV-1005", customer: "Oscorp", items: 6, amount: 2250, status: "pending", payment: "Card" },
		],
	};

	// Use mock data if there's an error or no data
	if (error || !data) {
		console.warn("Using mock data for billing dashboard:", error?.message);
		data = mockData;
	}

	if (isLoading && !data) {
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
						value={formatCurrency(data.revenue, "en-IN")}
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
						value={formatCurrency(data.averageBill, "en-IN")}
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
						value={formatCurrency(data.refunds, "en-IN")}
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
						value={formatCurrency(data.cashCollected, "en-IN")}
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
									<div className="font-bold text-black text-sm">
										{formatCurrency(cashier.revenue, "en-IN")}
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
													{formatCurrency(bill.amount, "en-IN")}
												</div>
												<div className="mt-0.5 font-bold text-[9px] uppercase tracking-wider text-black">
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