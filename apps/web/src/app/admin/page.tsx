import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClockIcon,
	IndianRupeeIcon,
	PackageIcon,
	ShoppingCartIcon,
	TrendingUpIcon,
	TruckIcon,
	UsersIcon,
	WarehouseIcon,
} from "lucide-react";
import { cookies } from "next/headers";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { getServerClient } from "@/lib/trpc/serverClient";
import { formatCurrency } from "@/lib/utils";
import { AdminSalesTrendChart, AdminBranchPerformanceChart, AdminCashFlowChart } from "@/components/charts/admin-charts";

function KPICard({
	title,
	value,
	icon: Icon,
	trend,
	trendValue,
	trendIsPositive,
}: {
	title: string;
	value: string | number;
	icon: any;
	trend?: string;
	trendValue?: string;
	trendIsPositive?: boolean;
}) {
	return (
		<Card className="shadow-sm">
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div className="rounded-xl bg-gray-100 p-3 text-gray-900">
						<Icon className="h-6 w-6" />
					</div>
					{trendValue && (
						<div className="text-gray-900 font-medium text-sm">
							{trendIsPositive ? "↑" : "↓"} {trendValue}
						</div>
					)}
				</div>
				<div className="mt-4">
					<p className="font-medium text-gray-500 text-sm">{title}</p>
					<h3 className="mt-1 font-bold text-2xl text-gray-900 tracking-tight">{value}</h3>
					{trend && (
						<p className="mt-2 text-gray-500 text-xs">{trend}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default async function CompanyAdminDashboard() {
	const cookieStore = await cookies();
	const branchCookie = cookieStore.get("evaluna.branch_context")?.value;
	const activeBranchId = branchCookie ? Number(branchCookie) : undefined;

	const serverClient = await getServerClient();
	const data = await serverClient.dashboard.getKpis(
		activeBranchId ? { branch_id: activeBranchId } : {}
	);

	if (!data) return <div>No data available</div>;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div>
				<h1 className="font-bold text-3xl text-gray-900 tracking-tight">
					Dashboard Overview
				</h1>
				<p className="mt-1 text-gray-500">
					Real-time metrics and insights for your company.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<KPICard
					title="Today's Sales"
					value={formatCurrency(data.todaySales, "en-IN")}
					icon={IndianRupeeIcon}
					trend={data.salesTrendPct !== 0 ? "vs yesterday" : undefined}
					trendValue={data.salesTrendPct !== 0 ? `${Math.abs(data.salesTrendPct)}%` : undefined}
					trendIsPositive={data.salesTrendIsPositive}
				/>
				<KPICard
					title="Today's Orders"
					value={data.todayOrders || 0}
					icon={ShoppingCartIcon}
					trend={data.billsTrendPct !== 0 ? "vs yesterday" : undefined}
					trendValue={data.billsTrendPct !== 0 ? `${Math.abs(data.billsTrendPct)}%` : undefined}
					trendIsPositive={data.billsTrendIsPositive}
				/>
				<KPICard
					title="Today's Profit"
					value={formatCurrency(data.todayProfit, "en-IN")}
					icon={TrendingUpIcon}
					trendIsPositive={data.todayProfit >= 0}
				/>
				<KPICard
					title="Total Products"
					value={data.totalProducts}
					icon={PackageIcon}
				/>
				<KPICard
					title="Pending Deliveries"
					value={data.pendingDeliveries || 0}
					icon={TruckIcon}
				/>
				<KPICard
					title="Warehouse Capacity"
					value={`${data.warehouseCapacity || 0}%`}
					icon={WarehouseIcon}
					trend="Utilized space"
				/>
				<KPICard
					title="Active Employees"
					value={data.activeEmployees || 0}
					icon={UsersIcon}
				/>
				<KPICard
					title="Low Stock Items"
					value={data.lowStockCount || 0}
					icon={AlertTriangleIcon}
					trendValue="Action needed"
					trendIsPositive={false}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<ErrorBoundary>
						<Card className="flex h-full flex-col shadow-sm">
							<CardHeader>
								<CardTitle className="text-gray-900">Revenue & Expenses Trend</CardTitle>
								<CardDescription className="text-gray-500">
									Monthly comparison across all branches
								</CardDescription>
							</CardHeader>
							<CardContent className="min-h-[300px] flex-1">
								{data.revenueTrend ? (
									<AdminSalesTrendChart data={data.revenueTrend} />
								) : (
									<div className="flex h-[250px] items-center justify-center text-gray-500">
										No trend data available
									</div>
								)}
							</CardContent>
						</Card>
					</ErrorBoundary>
				</div>

				<div className="flex flex-col">
					<ErrorBoundary>
						<Card className="h-full shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="text-lg text-gray-900">Recent Activities</CardTitle>
								<CardDescription className="text-gray-500">
									System alerts and notifications
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{data.recentNotifications?.map((notif: any) => (
									<div
										key={notif.id}
										className="flex items-start gap-4 p-3 border-b border-gray-100 last:border-0"
									>
										<div className="flex-shrink-0 rounded-full p-2 bg-gray-100 text-gray-900">
											{notif.type === "low_stock" && (
												<AlertTriangleIcon className="h-4 w-4" />
											)}
											{notif.type === "approval" && (
												<ClockIcon className="h-4 w-4" />
											)}
											{notif.type === "sale" && (
												<CheckCircle2Icon className="h-4 w-4" />
											)}
											{notif.type === "delivery" && (
												<TruckIcon className="h-4 w-4" />
											)}
										</div>
										<div>
											<h4 className="font-semibold text-sm text-gray-900">
												{notif.title}
											</h4>
											<p className="mt-0.5 line-clamp-1 text-gray-500 text-xs">
												{notif.message}
											</p>
											<span className="mt-1 block text-[10px] text-gray-400">
												{notif.time}
											</span>
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					</ErrorBoundary>
				</div>

				<div>
					<ErrorBoundary>
						<Card className="h-full shadow-sm">
							<CardHeader>
								<CardTitle className="text-gray-900">Branch Performance</CardTitle>
								<CardDescription className="text-gray-500">Sales vs Targets</CardDescription>
							</CardHeader>
							<CardContent>
								{data.branchPerformance ? (
									<AdminBranchPerformanceChart data={data.branchPerformance} />
								) : (
									<div className="flex h-[250px] items-center justify-center text-gray-500">
										No data
									</div>
								)}
							</CardContent>
						</Card>
					</ErrorBoundary>
				</div>

				<div>
					<ErrorBoundary>
						<Card className="h-full shadow-sm">
							<CardHeader>
								<CardTitle className="text-gray-900">Cash Flow</CardTitle>
								<CardDescription className="text-gray-500">Daily net cash balance</CardDescription>
							</CardHeader>
							<CardContent>
								{data.cashFlowTrend ? (
									<AdminCashFlowChart data={data.cashFlowTrend} />
								) : (
									<div className="flex h-[250px] items-center justify-center text-gray-500">
										No data
									</div>
								)}
							</CardContent>
						</Card>
					</ErrorBoundary>
				</div>

				<div>
					<ErrorBoundary>
						<Card className="h-full shadow-sm bg-white border border-gray-200">
							<CardHeader>
								<CardTitle className="text-gray-900">
									Total Inventory Value
								</CardTitle>
								<CardDescription className="text-gray-500">
									Across all warehouses
								</CardDescription>
							</CardHeader>
							<CardContent className="mt-8">
								<h2 className="font-black text-4xl text-gray-900">
									{formatCurrency(data.inventoryValue || 0, "en-IN")}
								</h2>
								<div className="mt-4 flex w-fit items-center text-gray-500 font-medium text-sm">
									<TrendingUpIcon className="mr-1 h-4 w-4" />
									{data.warehouseCapacity}% warehouse utilized
								</div>
							</CardContent>
						</Card>
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
}
