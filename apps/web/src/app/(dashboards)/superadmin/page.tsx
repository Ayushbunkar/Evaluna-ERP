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
	CheckCircle2Icon,
	ShieldIcon,
	UsersIcon,
	ArrowRight as ArrowRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
	PageTransition,
	StaggerList,
	StaggerItem,
	AnimatedCard,
	motion,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function SuperAdminDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const { data: stats } = trpc.superadmin.getDashboardStats.useQuery();
	const { data: companies } = trpc.superadmin.getCompanies.useQuery();

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Super Admin Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						System-wide oversight and control panel
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/superadmin/activity-log">
							<ActivityIcon className="mr-2 h-4 w-4" /> System Logs
						</Link>
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/superadmin/settings">
							<ShieldIcon className="mr-2 h-4 w-4" /> Security
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<StaggerList
				className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
				slow
			>
				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/superadmin/companies")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<UsersIcon className="h-6 w-6 text-blue-500" />
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
							onClick={() => (window.location.href = "/superadmin/companies")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<CheckCircle2Icon className="h-6 w-6 text-green-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Active Companies
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.activeCompanies || 0} active
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
							onClick={() => (window.location.href = "/superadmin/users")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<UsersIcon className="h-6 w-6 text-purple-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">Users</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.totalUsers || 0} total
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
							onClick={() => (window.location.href = "/superadmin/billing")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<BanknoteIcon className="h-6 w-6 text-yellow-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Revenue
									</h3>
									<p className="text-muted-foreground text-xs">
										{formatCurrency(stats?.revenue || 0, locale)} total
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
									Company Management
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Create and manage companies
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/superadmin/companies">
									View All <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<div className="flex flex-col gap-3 sm:gap-4">
								{companies?.slice(0, 5).map((company) => (
									<div
										key={company.id}
										className="flex items-center justify-between border-border/50 border-b pb-1.5 last:border-0 last:pb-0 sm:pb-2"
									>
										<div>
											<p className="font-medium text-xs sm:text-sm">
												{company.name}
											</p>
											<p className="text-muted-foreground text-xs">
												{company.status === "active" ? "Active" : "Inactive"}
											</p>
										</div>
										<div className="text-right">
											<Button variant="outline" size="xs" asChild>
												<Link href={`/superadmin/companies`}>
													Manage
												</Link>
											</Button>
										</div>
									</div>
								))}
								{(!companies || companies.length === 0) && (
									<div className="flex h-[80px] items-center justify-center text-muted-foreground text-xs sm:h-[100px] sm:text-sm">
										No companies found
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
									User Management
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Manage system users and roles
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/superadmin/users">
									View All <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<div className="flex h-[80px] items-center justify-center text-muted-foreground text-xs sm:h-[100px] sm:text-sm">
								User management interface
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
									System Health
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Monitor system performance and status
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/superadmin/settings">
									View All <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="text-center">
									<p className="text-muted-foreground text-xs">Server Status</p>
									<p className="font-bold text-lg">
										{stats?.serverStatus || "Online"}
									</p>
								</div>
								<div className="text-center">
									<p className="text-muted-foreground text-xs">Uptime</p>
									<p className="font-bold text-lg">{stats?.uptime || "0%"}</p>
								</div>
								<div className="text-center">
									<p className="text-muted-foreground text-xs">
										Database Latency
									</p>
									<p className="font-bold text-lg">
										{stats?.databaseLatency || "0ms"}
									</p>
								</div>
								<div className="text-center">
									<p className="text-muted-foreground text-xs">Storage Used</p>
									<p className="font-bold text-lg">
										{stats?.storageUsed || "0 GB"}
									</p>
								</div>
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
								Recent System Activity
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Latest system-wide activities
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/superadmin/activity-log">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						<div className="flex flex-col gap-3 sm:gap-4">
							<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
								Recent system activities will appear here
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
