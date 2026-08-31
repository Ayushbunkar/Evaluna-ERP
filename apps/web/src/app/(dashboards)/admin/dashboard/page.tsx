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
	BanknoteIcon,
	CalendarCheckIcon,
	ChartLineIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: stats,
		isLoading: statsLoading,
		error: statsError,
	} = trpc.admin.getDashboardStats.useQuery();
	const {
		data: employees,
		isLoading: employeesLoading,
		error: employeesError,
	} = trpc.admin.getEmployees.useQuery();
	const {
		data: suppliers,
		isLoading: suppliersLoading,
		error: suppliersError,
	} = trpc.admin.getSuppliers.useQuery();
	const {
		data: customers,
		isLoading: customersLoading,
		error: customersError,
	} = trpc.admin.getCustomers.useQuery();

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Admin Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Overview of company, employees, and system status
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Activity Log
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/settings">
							<CalendarCheckIcon className="mr-2 h-4 w-4" /> Settings
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
							onClick={() => (window.location.href = "/admin/employees")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<UsersIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Employees
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.totalEmployees || 0} total
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
							onClick={() => (window.location.href = "/admin/suppliers")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<BanknoteIcon className="h-6 w-6 text-green-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Suppliers
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.totalSuppliers || 0} total
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
							onClick={() => (window.location.href = "/admin/customers")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<UsersIcon className="h-6 w-6 text-purple-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Customers
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.totalCustomers || 0} total
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
							onClick={() => (window.location.href = "/admin/companies")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<ChartLineIcon className="h-6 w-6 text-indigo-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Companies
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.totalCompanies || 0} total
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
							onClick={() => (window.location.href = "/admin/branches")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<CalendarCheckIcon className="h-6 w-6 text-gray-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Branches
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.totalBranches || 0} total
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
							onClick={() => (window.location.href = "/admin/finance")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<BanknoteIcon className="h-6 w-6 text-yellow-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Finance
									</h3>
									<p className="text-muted-foreground text-xs">
										{formatCurrency(stats?.monthlyRevenue || 0, locale)} monthly
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Quick Actions */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Employee Management
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									View, add, and manage employees
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/admin/employees">
									View All <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<div className="flex flex-col gap-3 sm:gap-4">
								{employees?.slice(0, 5).map((emp) => (
									<div
										key={emp.id}
										className="flex items-center justify-between border-border/50 border-b pb-1.5 last:border-0 last:pb-0 sm:pb-2"
									>
										<div>
											<p className="font-medium text-xs sm:text-sm">
												{emp.name}
											</p>
											<p className="text-muted-foreground text-xs">
												{emp.role || "Staff"}
											</p>
										</div>
										<div className="text-right">
											<p className="text-xs sm:text-sm">{emp.status}</p>
										</div>
									</div>
								))}
								{(!employees || employees.length === 0) && (
									<div className="flex h-[80px] items-center justify-center text-muted-foreground text-xs sm:h-[100px] sm:text-sm">
										No employees found
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Supplier Management
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Manage vendor relationships
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/admin/suppliers">
									View All <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<div className="flex flex-col gap-3 sm:gap-4">
								{suppliers?.slice(0, 5).map((sup) => (
									<div
										key={sup.id}
										className="flex items-center justify-between border-border/50 border-b pb-1.5 last:border-0 last:pb-0 sm:pb-2"
									>
										<div>
											<p className="font-medium text-xs sm:text-sm">
												{sup.name}
											</p>
											<p className="text-muted-foreground text-xs">
												{sup.email || "N/A"}
											</p>
										</div>
										<div className="text-right">
											<p className="text-xs sm:text-sm">
												{formatCurrency(
													Number(sup.outstanding_balance),
													locale,
												)}
											</p>
										</div>
									</div>
								))}
								{(!suppliers || suppliers.length === 0) && (
									<div className="flex h-[80px] items-center justify-center text-muted-foreground text-xs sm:h-[100px] sm:text-sm">
										No suppliers found
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.5 }}
				>
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Customer Management
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									View and manage customer accounts
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/admin/customers">
									View All <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<div className="flex flex-col gap-3 sm:gap-4">
								{customers?.slice(0, 5).map((cust) => (
									<div
										key={cust.id}
										className="flex items-center justify-between border-border/50 border-b pb-1.5 last:border-0 last:pb-0 sm:pb-2"
									>
										<div>
											<p className="font-medium text-xs sm:text-sm">
												{cust.name}
											</p>
											<p className="text-muted-foreground text-xs">
												{cust.email || "N/A"}
											</p>
										</div>
										<div className="text-right">
											<p className="font-bold text-xs sm:text-sm">
												{formatCurrency(Number(cust.credit_used), locale)}
											</p>
											<p className="text-muted-foreground text-xs">
												/ {formatCurrency(Number(cust.credit_limit), locale)}
											</p>
										</div>
									</div>
								))}
								{(!customers || customers.length === 0) && (
									<div className="flex h-[80px] items-center justify-center text-muted-foreground text-xs sm:h-[100px] sm:text-sm">
										No customers found
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{/* Recent Activity */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.6 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Recent Activity
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Latest system activities
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/admin/activity-log">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						<div className="flex flex-col gap-3 sm:gap-4">
							{stats?.recentActivities?.map((activity) => (
								<div
									key={activity.id}
									className="flex items-start gap-3 border-border/50 border-b pb-3 last:border-0 last:pb-0 sm:pb-4"
								>
									<div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
										{activity.type === "employee" && (
											<UsersIcon className="h-4 w-4" />
										)}
										{activity.type === "supplier" && (
											<BanknoteIcon className="h-4 w-4" />
										)}
										{activity.type === "customer" && (
											<UsersIcon className="h-4 w-4" />
										)}
										{activity.type === "company" && (
											<ChartLineIcon className="h-4 w-4" />
										)}
										{activity.type === "branch" && (
											<CalendarCheckIcon className="h-4 w-4" />
										)}
									</div>
									<div className="flex flex-1 flex-col gap-1">
										<p className="font-medium text-xs sm:text-sm">
											{activity.description}
										</p>
										<p className="text-muted-foreground text-xs">
											{activity.timestamp}
										</p>
									</div>
								</div>
							))}
							{(!stats?.recentActivities ||
								stats.recentActivities.length === 0) && (
								<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
									No recent activity found
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
