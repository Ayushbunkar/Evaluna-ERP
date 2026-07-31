"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { motion } from "framer-motion";
import {
	ActivityIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	CheckSquareIcon,
	ClockIcon,
	DollarSignIcon,
	PackageIcon,
	RotateCcwIcon,
	ShoppingCartIcon,
	StarIcon,
	TrendingUpIcon,
	TruckIcon,
	UsersIcon,
	WalletIcon,
} from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

// Premium Animated KPI Card
function KPICard({
	title,
	value,
	icon: Icon,
	trend,
	trendValue,
	trendIsPositive,
	colorClass,
}: {
	title: string;
	value: string | number;
	icon: any;
	trend?: string;
	trendValue?: string;
	trendIsPositive?: boolean;
	colorClass: string;
}) {
	return (
		<Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 shadow-sm">
			<div
				className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 transition-opacity group-hover:opacity-100`}
			/>
			<CardContent className="p-5">
				<div className="flex items-center justify-between">
					<div className="rounded-lg bg-muted p-2.5 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-primary">
						<Icon className="h-5 w-5" />
					</div>
					{trendValue && (
						<div
							className={`flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${trendIsPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
						>
							{trendIsPositive ? "↑" : "↓"} {trendValue}
						</div>
					)}
				</div>
				<div className="mt-3">
					<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
						{title}
					</p>
					<h3 className="mt-1 font-bold text-xl tracking-tight">{value}</h3>
					{trend && (
						<p className="mt-1 text-[10px] text-muted-foreground">{trend}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default function BranchManagerDashboard() {
	const { activeBranchId } = useBranch();

	const { data, isLoading } = trpc.dashboard.getKpis.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
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

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Branch Operations</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Real-time metrics for your branch.
				</p>
			</div>

			{/* KPIs Grid */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-2 gap-4 lg:grid-cols-4"
			>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Today's Sales"
						value={formatCurrency(data.todaySales, "en-US")}
						icon={DollarSignIcon}
						trend="vs yesterday"
						trendValue="12%"
						trendIsPositive={true}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Today's Bills"
						value={data.todayOrders || 0}
						icon={ShoppingCartIcon}
						trend="vs yesterday"
						trendValue="5%"
						trendIsPositive={true}
						colorClass="from-indigo-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Net Profit"
						value={formatCurrency(data.todayProfit, "en-US")}
						icon={TrendingUpIcon}
						trendValue="8%"
						trendIsPositive={data.todayProfit >= 0}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Footfall"
						value={data.footfall || 0}
						icon={UsersIcon}
						colorClass="from-orange-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Pending Orders"
						value={data.pendingDeliveries || 0}
						icon={ClockIcon}
						colorClass="from-amber-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Orders Ready"
						value={data.ordersReady || 0}
						icon={CheckCircle2Icon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Delivery Pending"
						value={data.pendingDeliveries || 0}
						icon={TruckIcon}
						colorClass="from-cyan-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Returns"
						value={data.returnsCount || 0}
						icon={RotateCcwIcon}
						trendValue="Action needed"
						trendIsPositive={false}
						colorClass="from-rose-500/10 to-transparent"
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
				{/* Today's Timeline */}
				<motion.div variants={itemVariants} className="lg:col-span-1">
					<Card className="flex h-full flex-col border-border/50 shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-lg">
								<ActivityIcon className="h-5 w-5 text-primary" /> Today's
								Timeline
							</CardTitle>
							<CardDescription>Live feed of branch operations</CardDescription>
						</CardHeader>
						<CardContent className="flex-1">
							<div className="relative ml-3 space-y-6 border-muted border-l-2">
								{data.todayTimeline?.map((item: any, _i: number) => (
									<div key={item.id} className="relative pl-6">
										<div
											className={`absolute top-1 -left-[9px] h-4 w-4 rounded-full border-2 border-background ${
												item.type === "system"
													? "bg-blue-500"
													: item.type === "delivery"
														? "bg-amber-500"
														: item.type === "alert"
															? "bg-rose-500"
															: item.type === "finance"
																? "bg-emerald-500"
																: "bg-purple-500"
											}`}
										/>
										<h4 className="font-semibold text-sm">{item.title}</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{item.time}
										</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Top Selling Products & Low Stock */}
				<motion.div
					variants={itemVariants}
					className="flex flex-col gap-6 lg:col-span-1"
				>
					<Card className="flex-1 border-border/50 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-lg">
								<PackageIcon className="h-5 w-5 text-primary" /> Top Products
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.topSellingProducts?.map((product: any, idx: number) => (
								<div key={idx} className="flex items-center justify-between">
									<div>
										<h4 className="font-medium text-sm">{product.name}</h4>
										<p className="text-muted-foreground text-xs">
											{product.quantity} sold
										</p>
									</div>
									<div className="font-semibold text-emerald-600 text-sm">
										{formatCurrency(product.revenue, "en-US")}
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="border-border/50 border-rose-500/20 bg-rose-500/5 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-base text-rose-600">
								<AlertTriangleIcon className="h-4 w-4" /> Low Stock Alerts
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-rose-700">
								{data.lowStockCount || 0} Items
							</div>
							<p className="mt-1 text-rose-600/80 text-xs">
								Requires immediate re-ordering.
							</p>
						</CardContent>
					</Card>
				</motion.div>

				{/* Staff & Cash */}
				<motion.div
					variants={itemVariants}
					className="flex flex-col gap-6 lg:col-span-1"
				>
					<Card className="flex-1 border-border/50 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-lg">
								<UsersIcon className="h-5 w-5 text-primary" /> Staff Performance
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.staffPerformance?.map((staff: any, idx: number) => (
								<div key={idx} className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
										{staff.name.charAt(0)}
									</div>
									<div className="min-w-0 flex-1">
										<h4 className="truncate font-medium text-sm">
											{staff.name}
										</h4>
										<p className="text-[10px] text-muted-foreground">
											{staff.role}
										</p>
									</div>
									<div className="text-right">
										<div className="font-semibold text-xs">
											{formatCurrency(staff.sales, "en-US")}
										</div>
										<div className="flex items-center justify-end text-[10px] text-amber-500">
											<StarIcon className="mr-0.5 h-3 w-3 fill-current" />{" "}
											{staff.rating}
										</div>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="border-border/50 border-emerald-500/20 bg-emerald-500/5 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-base text-emerald-700">
								<WalletIcon className="h-4 w-4" /> Cash Collection
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<p className="text-emerald-600/80 text-xs">Cash</p>
									<p className="font-bold text-emerald-700">
										{formatCurrency(data.cashCollection?.cash || 0, "en-US")}
									</p>
								</div>
								<div>
									<p className="text-emerald-600/80 text-xs">Card</p>
									<p className="font-bold text-emerald-700">
										{formatCurrency(data.cashCollection?.card || 0, "en-US")}
									</p>
								</div>
								<div>
									<p className="text-emerald-600/80 text-xs">UPI</p>
									<p className="font-bold text-emerald-700">
										{formatCurrency(data.cashCollection?.upi || 0, "en-US")}
									</p>
								</div>
								<div>
									<p className="text-amber-600/80 text-xs">Pending</p>
									<p className="font-bold text-amber-700">
										{formatCurrency(data.cashCollection?.pending || 0, "en-US")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Manager Tasks & Realtime Alerts */}
				<motion.div
					variants={itemVariants}
					className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-3"
				>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-lg">
								<CheckSquareIcon className="h-5 w-5 text-primary" /> Manager
								Tasks
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{data.managerTasks?.map((task: any) => (
								<div
									key={task.id}
									className="flex items-center gap-3 rounded-xl border border-border/50 p-3 transition-colors hover:bg-muted/50"
								>
									<div
										className={`flex h-4 w-4 items-center justify-center rounded border ${task.status === "completed" ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"}`}
									>
										{task.status === "completed" && (
											<CheckCircle2Icon className="h-3 w-3 text-white" />
										)}
									</div>
									<h4
										className={`flex-1 font-medium text-sm ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}
									>
										{task.title}
									</h4>
									<div
										className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase ${
											task.priority === "high"
												? "bg-rose-500/10 text-rose-500"
												: task.priority === "medium"
													? "bg-amber-500/10 text-amber-500"
													: "bg-slate-500/10 text-slate-500"
										}`}
									>
										{task.priority}
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-lg">
								<AlertTriangleIcon className="h-5 w-5 text-primary" /> Realtime
								Alerts & Activities
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.recentNotifications?.map((notif: any) => (
								<div
									key={notif.id}
									className="group flex cursor-pointer items-start gap-4 rounded-xl p-2"
								>
									<div
										className={`flex-shrink-0 rounded-full p-2 ${
											notif.type === "low_stock"
												? "bg-rose-500/10 text-rose-500"
												: notif.type === "approval"
													? "bg-amber-500/10 text-amber-500"
													: notif.type === "sale"
														? "bg-emerald-500/10 text-emerald-500"
														: "bg-blue-500/10 text-blue-500"
										}`}
									>
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
										<h4 className="font-semibold text-sm transition-colors group-hover:text-primary">
											{notif.title}
										</h4>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{notif.message}
										</p>
										<span className="mt-1 block text-[10px] text-muted-foreground/70">
											{notif.time}
										</span>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
