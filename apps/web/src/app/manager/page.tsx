import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	ActivityIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	CheckSquareIcon,
	ClockIcon,
	IndianRupeeIcon,
	PackageIcon,
	RotateCcwIcon,
	ShoppingCartIcon,
	StarIcon,
	TrendingUpIcon,
	TruckIcon,
	UsersIcon,
	WalletIcon,
} from "lucide-react";
import { cookies } from "next/headers";
import { getServerClient } from "@/lib/trpc/serverClient";
import { formatCurrency } from "@/lib/utils";

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
			<CardContent className="p-5">
				<div className="flex items-center justify-between">
					<div className="rounded-lg bg-gray-100 p-2.5 text-gray-900">
						<Icon className="h-5 w-5" />
					</div>
					{trendValue && (
						<div className="font-medium text-gray-900 text-xs">
							{trendIsPositive ? "↑" : "↓"} {trendValue}
						</div>
					)}
				</div>
				<div className="mt-3">
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wider">
						{title}
					</p>
					<h3 className="mt-1 font-bold text-gray-900 text-xl tracking-tight">
						{value}
					</h3>
					{trend && <p className="mt-1 text-[10px] text-gray-500">{trend}</p>}
				</div>
			</CardContent>
		</Card>
	);
}

export default async function BranchManagerDashboard() {
	const cookieStore = await cookies();
	const branchCookie = cookieStore.get("evaluna.branch_context")?.value;
	const activeBranchId = branchCookie ? Number(branchCookie) : undefined;

	const serverClient = await getServerClient();
	const data = await serverClient.dashboard.getKpis(
		activeBranchId ? { branch_id: activeBranchId } : {},
	);

	if (!data) return <div>No data available</div>;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div>
				<h1 className="font-bold text-2xl text-gray-900 tracking-tight">
					Branch Operations
				</h1>
				<p className="mt-1 text-gray-500 text-sm">
					Real-time metrics for your branch.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<KPICard
					title="Today's Sales"
					value={formatCurrency(data.todaySales, "en-IN")}
					icon={IndianRupeeIcon}
					trend={data.salesTrendPct !== 0 ? "vs yesterday" : undefined}
					trendValue={
						data.salesTrendPct !== 0
							? `${Math.abs(data.salesTrendPct)}%`
							: undefined
					}
					trendIsPositive={data.salesTrendIsPositive}
				/>
				<KPICard
					title="Today's Bills"
					value={data.todayOrders || 0}
					icon={ShoppingCartIcon}
					trend={data.billsTrendPct !== 0 ? "vs yesterday" : undefined}
					trendValue={
						data.billsTrendPct !== 0
							? `${Math.abs(data.billsTrendPct)}%`
							: undefined
					}
					trendIsPositive={data.billsTrendIsPositive}
				/>
				<KPICard
					title="Net Profit"
					value={formatCurrency(data.todayProfit, "en-IN")}
					icon={TrendingUpIcon}
					trendIsPositive={data.todayProfit >= 0}
				/>
				<KPICard title="Footfall" value={data.footfall || 0} icon={UsersIcon} />
				<KPICard
					title="Pending Orders"
					value={data.pendingDeliveries || 0}
					icon={ClockIcon}
				/>
				<KPICard
					title="Orders Ready"
					value={data.ordersReady || 0}
					icon={CheckCircle2Icon}
				/>
				<KPICard
					title="Delivery Pending"
					value={data.pendingDeliveries || 0}
					icon={TruckIcon}
				/>
				<KPICard
					title="Returns"
					value={data.returnsCount || 0}
					icon={RotateCcwIcon}
					trendValue="Action needed"
					trendIsPositive={false}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-1">
					<Card className="flex h-full flex-col shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
								<ActivityIcon className="h-5 w-5 text-gray-900" /> Today's
								Timeline
							</CardTitle>
							<CardDescription className="text-gray-500">
								Live feed of branch operations
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-1">
							<div className="relative ml-3 space-y-6 border-gray-200 border-l-2">
								{data.todayTimeline?.map((item: any) => (
									<div key={item.id} className="relative pl-6">
										<div className="absolute top-1 -left-[9px] h-4 w-4 rounded-full border-2 border-white bg-gray-400" />
										<h4 className="font-semibold text-gray-900 text-sm">
											{item.title}
										</h4>
										<p className="mt-0.5 text-gray-500 text-xs">{item.time}</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-6 lg:col-span-1">
					<Card className="flex-1 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
								<PackageIcon className="h-5 w-5 text-gray-900" /> Top Products
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.topSellingProducts?.map((product: any, idx: number) => (
								<div key={idx} className="flex items-center justify-between">
									<div>
										<h4 className="font-medium text-gray-900 text-sm">
											{product.name}
										</h4>
										<p className="text-gray-500 text-xs">
											{product.quantity} sold
										</p>
									</div>
									<div className="font-semibold text-gray-900 text-sm">
										{formatCurrency(product.revenue, "en-IN")}
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="border border-gray-200 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-base text-gray-900">
								<AlertTriangleIcon className="h-4 w-4" /> Low Stock Alerts
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-gray-900">
								{data.lowStockCount || 0} Items
							</div>
							<p className="mt-1 text-gray-500 text-xs">
								Requires immediate re-ordering.
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-6 lg:col-span-1">
					<Card className="flex-1 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
								<UsersIcon className="h-5 w-5 text-gray-900" /> Staff
								Performance
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.staffPerformance?.map((staff: any, idx: number) => (
								<div key={idx} className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-900 text-xs">
										{staff.name.charAt(0)}
									</div>
									<div className="min-w-0 flex-1">
										<h4 className="truncate font-medium text-gray-900 text-sm">
											{staff.name}
										</h4>
										<p className="text-[10px] text-gray-500">{staff.role}</p>
									</div>
									<div className="text-right">
										<div className="font-semibold text-gray-900 text-xs">
											{formatCurrency(staff.sales, "en-IN")}
										</div>
										<div className="flex items-center justify-end text-[10px] text-gray-500">
											<StarIcon className="mr-0.5 h-3 w-3 fill-current text-gray-400" />{" "}
											{staff.rating}
										</div>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="border border-gray-200 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-base text-gray-900">
								<WalletIcon className="h-4 w-4" /> Cash Collection
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<p className="text-gray-500 text-xs">Cash</p>
									<p className="font-bold text-gray-900">
										{formatCurrency(data.cashCollection?.cash || 0, "en-IN")}
									</p>
								</div>
								<div>
									<p className="text-gray-500 text-xs">Card</p>
									<p className="font-bold text-gray-900">
										{formatCurrency(data.cashCollection?.card || 0, "en-IN")}
									</p>
								</div>
								<div>
									<p className="text-gray-500 text-xs">UPI</p>
									<p className="font-bold text-gray-900">
										{formatCurrency(data.cashCollection?.upi || 0, "en-IN")}
									</p>
								</div>
								<div>
									<p className="text-gray-500 text-xs">Pending</p>
									<p className="font-bold text-gray-900">
										{formatCurrency(data.cashCollection?.pending || 0, "en-IN")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-3">
					<Card className="h-full shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
								<CheckSquareIcon className="h-5 w-5 text-gray-900" /> Manager
								Tasks
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{data.managerTasks?.map((task: any) => (
								<div
									key={task.id}
									className="flex items-center gap-3 rounded-xl border border-gray-200 p-3"
								>
									<div className="flex h-4 w-4 items-center justify-center rounded border border-gray-300">
										{task.status === "completed" && (
											<CheckCircle2Icon className="h-3 w-3 text-gray-900" />
										)}
									</div>
									<h4
										className={`flex-1 font-medium text-sm ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}
									>
										{task.title}
									</h4>
									<div className="rounded-full bg-gray-100 px-2 py-0.5 font-bold text-[10px] text-gray-900 uppercase">
										{task.priority}
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="h-full shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
								<AlertTriangleIcon className="h-5 w-5 text-gray-900" /> Realtime
								Alerts & Activities
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.recentNotifications?.map((notif: any) => (
								<div
									key={notif.id}
									className="flex items-start gap-4 border-gray-100 border-b p-2 last:border-0"
								>
									<div className="flex-shrink-0 rounded-full bg-gray-100 p-2 text-gray-900">
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
										<h4 className="font-semibold text-gray-900 text-sm">
											{notif.title}
										</h4>
										<p className="mt-0.5 text-gray-500 text-xs">
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
				</div>
			</div>
		</div>
	);
}
