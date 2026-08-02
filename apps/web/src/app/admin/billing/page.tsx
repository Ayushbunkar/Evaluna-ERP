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
import { cookies } from "next/headers";
import { getServerClient } from "@/lib/trpc/serverClient";
import { formatCurrency } from "@/lib/utils";
import { BillingSalesChart, BillingHourlyChart, BillingPaymentChart } from "@/components/charts/billing-charts";

function KPICard({
	title,
	value,
	icon: Icon,
}: {
	title: string;
	value: string | number;
	icon: any;
}) {
	return (
		<Card className="shadow-sm">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="rounded-lg bg-gray-100 p-2 text-gray-900">
						<Icon className="h-4 w-4" />
					</div>
				</div>
				<div className="mt-3">
					<p className="font-medium text-[10px] text-gray-500 uppercase tracking-wider">
						{title}
					</p>
					<h3 className="mt-1 font-bold text-xl text-gray-900 tracking-tight">{value}</h3>
				</div>
			</CardContent>
		</Card>
	);
}

export default async function BillingDashboard() {
	const branchCookie = cookies().get("evaluna.branch_context")?.value;
	const activeBranchId = branchCookie ? Number(branchCookie) : undefined;

	const serverClient = await getServerClient();
	const apiData = await serverClient.billing.getDashboardStats(
		activeBranchId ? { branch_id: activeBranchId } : {}
	).catch(() => null);

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
			{ name: "Sarah Williams", bills: 5, revenue: 1875 },
		],
		recentTransactions: [
			{
				id: "TRX-1001",
				time: "16:45",
				cashier: "John Doe",
				amount: 1250,
				method: "Card",
				status: "Completed",
			},
			{
				id: "TRX-1002",
				time: "16:30",
				cashier: "Jane Smith",
				amount: 850,
				method: "UPI",
				status: "Completed",
			},
			{
				id: "TRX-1003",
				time: "16:15",
				cashier: "Mike Johnson",
				amount: 450,
				method: "Cash",
				status: "Completed",
			},
			{
				id: "TRX-1004",
				time: "16:00",
				cashier: "Sarah Williams",
				amount: 2200,
				method: "Card",
				status: "Pending",
			},
			{
				id: "TRX-1005",
				time: "15:45",
				cashier: "John Doe",
				amount: 150,
				method: "Cash",
				status: "Refunded",
			},
		],
	};

	const data = apiData || mockData;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight">
						Billing Dashboard
					</h1>
					<p className="mt-1 text-gray-500">
						Overview of sales, payments, and cashier performance.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" className="gap-2 border-gray-300 text-gray-900 hover:bg-gray-50">
						<HistoryIcon className="h-4 w-4" /> History
					</Button>
					<Button className="gap-2 bg-gray-900 text-white hover:bg-gray-800">
						<PlusCircleIcon className="h-4 w-4" /> New Bill
					</Button>
				</div>
			</div>

			{/* KPIs Grid */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
				<div className="col-span-2">
					<KPICard
						title="Today's Revenue"
						value={formatCurrency(data.revenue, "en-IN")}
						icon={BanknoteIcon}
					/>
				</div>
				<div className="col-span-2">
					<KPICard
						title="Total Bills"
						value={data.todaysBills}
						icon={ReceiptTextIcon}
					/>
				</div>
				<div className="col-span-2">
					<KPICard
						title="Average Bill Value"
						value={formatCurrency(data.averageBill, "en-IN")}
						icon={TrendingUpIcon}
					/>
				</div>
				<div className="col-span-2">
					<KPICard
						title="Refunds/Returns"
						value={formatCurrency(data.refunds, "en-IN")}
						icon={Undo2Icon}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KPICard
					title="Cash Collected"
					value={formatCurrency(data.cashCollected, "en-IN")}
					icon={WalletIcon}
				/>
				<KPICard
					title="Card Payments"
					value={formatCurrency(data.cardCollected, "en-IN")}
					icon={CreditCardIcon}
				/>
				<KPICard
					title="UPI/Digital"
					value={formatCurrency(data.upiCollected, "en-IN")}
					icon={MonitorSmartphoneIcon}
				/>
				<KPICard
					title="Pending Bills"
					value={data.pendingBills}
					icon={ClockIcon}
				/>
			</div>

			{/* Charts Row 1 */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Card className="flex h-full flex-col shadow-sm">
						<CardHeader>
							<CardTitle className="text-gray-900">Today's Sales Trend</CardTitle>
							<CardDescription className="text-gray-500">Hourly revenue progression</CardDescription>
						</CardHeader>
						<CardContent className="min-h-[250px] flex-1">
							<BillingSalesChart data={data.salesChart} />
						</CardContent>
					</Card>
				</div>
				<div>
					<Card className="flex h-full flex-col shadow-sm">
						<CardHeader>
							<CardTitle className="text-gray-900">Payment Methods</CardTitle>
							<CardDescription className="text-gray-500">Distribution by volume</CardDescription>
						</CardHeader>
						<CardContent className="flex min-h-[250px] flex-1 items-center justify-center">
							<BillingPaymentChart data={data.paymentDistribution} />
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Charts Row 2 */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Card className="flex h-full flex-col shadow-sm">
						<CardHeader>
							<CardTitle className="text-gray-900">Hourly Transaction Volume</CardTitle>
							<CardDescription className="text-gray-500">Number of bills processed per hour</CardDescription>
						</CardHeader>
						<CardContent className="min-h-[200px] flex-1">
							<BillingHourlyChart data={data.hourlySales} />
						</CardContent>
					</Card>
				</div>
				<div>
					<Card className="flex h-full flex-col shadow-sm">
						<CardHeader>
							<CardTitle className="text-gray-900">Top Cashiers</CardTitle>
							<CardDescription className="text-gray-500">By revenue generated today</CardDescription>
						</CardHeader>
						<CardContent className="flex-1">
							<div className="space-y-4">
								{data.topCashiers.map((cashier: any, index: number) => (
									<div
										key={index}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-900 text-xs">
												{cashier.name.charAt(0)}
											</div>
											<div>
												<p className="font-medium text-sm text-gray-900">
													{cashier.name}
												</p>
												<p className="text-xs text-gray-500">
													{cashier.bills} bills
												</p>
											</div>
										</div>
										<div className="font-semibold text-gray-900 text-sm">
											{formatCurrency(cashier.revenue, "en-IN")}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Recent Transactions Table */}
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="text-gray-900">Recent Transactions</CardTitle>
					<CardDescription className="text-gray-500">Latest billing activity across all registers</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow className="border-b border-gray-200">
								<TableHead className="w-[100px] text-gray-900">Txn ID</TableHead>
								<TableHead className="text-gray-900">Time</TableHead>
								<TableHead className="text-gray-900">Cashier</TableHead>
								<TableHead className="text-gray-900">Method</TableHead>
								<TableHead className="text-gray-900">Status</TableHead>
								<TableHead className="text-right text-gray-900">Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.recentTransactions.map((txn: any) => (
								<TableRow key={txn.id} className="border-b border-gray-100">
									<TableCell className="font-medium text-gray-900">{txn.id}</TableCell>
									<TableCell className="text-gray-500">{txn.time}</TableCell>
									<TableCell className="text-gray-900">{txn.cashier}</TableCell>
									<TableCell className="text-gray-900">{txn.method}</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
												txn.status === "Completed"
													? "bg-gray-100 text-gray-900"
													: txn.status === "Pending"
														? "bg-gray-100 text-gray-700"
														: "bg-gray-100 text-gray-500"
											}`}
										>
											{txn.status}
										</span>
									</TableCell>
									<TableCell className="text-right font-medium text-gray-900">
										{formatCurrency(txn.amount, "en-IN")}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
