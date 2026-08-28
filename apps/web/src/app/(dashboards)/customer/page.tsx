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
	ArrowRightIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	DollarSignIcon,
	PackageIcon,
	RefreshCwIcon,
	TruckIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion, PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function CustomerDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: stats,
		isLoading,
		error,
	} = trpc.customer.getDashboardStats.useQuery(undefined, {
		suspense: true,
	});

	if (isLoading) {
		return (
			<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
				<div className="flex h-[400px] items-center justify-center text-muted-foreground">
					Loading customer dashboard...
				</div>
			</PageTransition>
		);
	}

	if (error) {
		return (
			<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
				<div className="flex h-[400px] items-center justify-center text-destructive">
					Error loading dashboard: {error.message}
				</div>
			</PageTransition>
		);
	}

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Customer Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Customer relationship management, order tracking, and service
						overview
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Customer Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/customer/orders">
							<PackageIcon className="mr-2 h-4 w-4" /> View Orders
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{/* Total Customers */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
								<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
									<UsersIcon className="h-6 w-6 text-blue-500" />
								</div>
								<h3 className="font-semibold text-base sm:text-lg">
									Total Customers
								</h3>
								<p className="font-bold text-2xl">
									{stats?.totalCustomers || 0}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Active Customers */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
								<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
									<CheckCircleIcon className="h-6 w-6 text-green-500" />
								</div>
								<h3 className="font-semibold text-base sm:text-lg">
									Active Customers
								</h3>
								<p className="font-bold text-2xl">
									{stats?.activeCustomers || 0}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Today's Orders */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
								<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
									<CalendarIcon className="h-6 w-6 text-purple-500" />
								</div>
								<h3 className="font-semibold text-base sm:text-lg">
									Orders Today
								</h3>
								<p className="font-bold text-2xl">{stats?.ordersToday || 0}</p>
							</div>
						</CardContent>
					</Card>

					{/* Revenue Today */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
								<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
									<DollarSignIcon className="h-6 w-6 text-green-500" />
								</div>
								<h3 className="font-semibold text-base sm:text-lg">
									Revenue Today
								</h3>
								<p className="font-bold text-2xl">
									{formatCurrency(stats?.revenueToday || 0, locale)}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</motion.div>

			{/* Recent Orders */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.4 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Recent Orders
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Latest customer orders
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/customer/orders">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{stats?.recentOrders?.length > 0 ? (
							<div className="space-y-3">
								{stats.recentOrders.map((order) => (
									<div
										key={order.id}
										className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0"
									>
										<div className="flex flex-col">
											<p className="font-medium text-sm">Order #{order.id}</p>
											<p className="text-muted-foreground text-xs">
												{order.customerName} â€¢ {order.items} items
											</p>
										</div>
										<div className="flex items-center gap-2 text-right">
											<span
												className={`rounded-full px-2 py-0.5 text-xs ${
													order.status === "delivered"
														? "bg-green-100 text-green-800"
														: order.status === "pending"
															? "bg-yellow-100 text-yellow-800"
															: order.status === "processing"
																? "bg-blue-100 text-blue-800"
																: "bg-gray-100 text-gray-800"
												}`}
											>
												{order.status.charAt(0).toUpperCase() +
													order.status.slice(1)}
											</span>
											<span className="text-gray-500 text-xs">
												{formatCurrency(order.total, locale)}
											</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
								No recent orders
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			{/* Customer Analytics */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.5 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Customer Analytics
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Insights and trends
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/customer/analytics">
								View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Customer Satisfaction
								</p>
								<p className="font-bold text-2xl text-green-600">
									{stats?.satisfactionScore?.toFixed(1)}%
								</p>
							</div>
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Repeat Customer Rate
								</p>
								<p className="font-bold text-2xl text-blue-600">
									{stats?.repeatCustomerRate?.toFixed(1)}%
								</p>
							</div>
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Average Order Value
								</p>
								<p className="font-bold text-2xl text-purple-600">
									{formatCurrency(stats?.avgOrderValue || 0, locale)}
								</p>
							</div>
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Support Tickets
								</p>
								<p className="font-bold text-2xl text-orange-600">
									{stats?.supportTickets || 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
