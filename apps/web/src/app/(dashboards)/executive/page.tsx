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
	ClockIcon,
	TrendingUpIcon,
	UsersIcon,
	WarehouseIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function ExecutiveDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const { data: stats } = trpc.dashboard.getKpis.useQuery({
		branch_id: undefined,
	});

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Executive Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Company-wide overview and key performance indicators
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Company Activity
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/settings">
							<ChartLineIcon className="mr-2 h-4 w-4" /> Settings
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<StaggerList
				className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-6"
				slow
			>
				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/finance")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<BanknoteIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Revenue (Monthly)
									</h3>
									<p className="text-muted-foreground text-xs">
										{formatCurrency(stats?.monthlyRevenue || 0, locale)}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/finance")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<TrendingUpIcon className="h-6 w-6 text-green-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Net Profit (Monthly)
									</h3>
									<p className="text-muted-foreground text-xs">
										{formatCurrency(stats?.netProfit || 0, locale)}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/inventory")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<WarehouseIcon className="h-6 w-6 text-orange-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Inventory Value
									</h3>
									<p className="text-muted-foreground text-xs">
										{formatCurrency(stats?.inventoryValue || 0, locale)}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/sales")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<UsersIcon className="h-6 w-6 text-purple-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Total Customers
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.totalCustomers || 0}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/inventory")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<ClockIcon className="h-6 w-6 text-red-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Low Stock Items
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.lowStockCount || 0}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/admin/employees")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<UsersIcon className="h-6 w-6 text-gray-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Active Employees
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.activeEmployees || 0}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Revenue Trend Chart */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Revenue Trend (6 Months)
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Monthly revenue and expenses trend
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/finance">
								View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{stats?.revenueTrend?.length > 0 ? (
							<div className="h-[200px] w-full">
								{/* In a real app, this would render a chart using a library like recharts or victory */}
								<div className="flex h-full items-center justify-center text-muted-foreground text-sm">
									Revenue trend chart would be displayed here
								</div>
							</div>
						) : (
							<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs">
								No revenue trend data available
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Cash Flow Trend */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.4 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Cash Flow Trend (7 Days)
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Daily cash inflow vs outflow
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/finance/transactions">
								View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{stats?.cashFlowTrend?.length > 0 ? (
							<div className="h-[200px] w-full">
								{/* In a real app, this would render a chart */}
								<div className="flex h-full items-center justify-center text-muted-foreground text-sm">
									Cash flow trend chart would be displayed here
								</div>
							</div>
						) : (
							<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs">
								No cash flow data available
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Branch Performance */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.5 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Branch Performance
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Sales and order performance by branch
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/admin/branches">
								View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{stats?.branchPerformance?.length > 0 ? (
							<div className="space-y-3">
								{stats.branchPerformance.map((branch) => (
									<div
										key={branch.name}
										className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0"
									>
										<div className="flex flex-col">
											<p className="font-medium text-sm">{branch.name}</p>
											<p className="truncate text-muted-foreground text-xs">
												{branch.orders} Orders
											</p>
										</div>
										<div className="flex items-center gap-2 text-right">
											<span className="font-bold text-sm">
												{formatCurrency(branch.sales, locale)}
											</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs">
								No branch performance data
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Recent Company Activity */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.6 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Recent Company Activity
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Latest system-wide activities
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/admin/activity-log">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{stats?.recentNotifications?.length > 0 ? (
							<div className="space-y-3">
								{stats.recentNotifications.map((notification) => (
									<div
										key={notification.id}
										className="flex items-start gap-3 border-border/50 border-b pb-3 last:border-0 last:pb-0"
									>
										<div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
											{notification.type === "sale" && (
												<TrendingUpIcon className="h-4 w-4" />
											)}
											{notification.type === "low_stock" && (
												<ActivityIcon className="h-4 w-4" />
											)}
											{notification.type === "approval" && (
												<ActivityIcon className="h-4 w-4" />
											)}
										</div>
										<div className="flex flex-1 flex-col gap-1">
											<p className="font-medium text-xs sm:text-sm">
												{notification.title}
											</p>
											<p className="text-muted-foreground text-xs">
												{notification.message}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs">
								No recent activity
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
