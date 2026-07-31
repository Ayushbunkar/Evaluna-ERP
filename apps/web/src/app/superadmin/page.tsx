"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Progress } from "@evaluna/ui/components/progress";
import { motion } from "framer-motion";
import {
	ActivityIcon,
	ArrowDownRightIcon,
	ArrowUpRightIcon,
	Building2Icon,
	CreditCardIcon,
	DatabaseZapIcon,
	UsersIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// Simulated animated counter component for the dashboard
function AnimatedCounter({
	value,
	prefix = "",
	suffix = "",
}: {
	value: number;
	prefix?: string;
	suffix?: string;
}) {
	// In a real app we'd use framer-motion useSpring here
	return (
		<span className="tabular-nums">
			{prefix}
			{value.toLocaleString()}
			{suffix}
		</span>
	);
}

export default function SuperAdminDashboard() {
	const { data: stats, isLoading } =
		trpc.superadmin.getDashboardStats.useQuery();
	const { data: health } = trpc.superadmin.getSystemHealth.useQuery();

	if (isLoading) {
		return (
			<div className="flex h-full min-h-[400px] items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	const container = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: {
			opacity: 1,
			y: 0,
			transition: { type: "spring", stiffness: 300, damping: 24 },
		},
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Super Admin Dashboard
					</h1>
					<p className="mt-1 text-muted-foreground">
						Enterprise management overview and system health.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" className="gap-2">
						<DatabaseZapIcon className="h-4 w-4 text-emerald-500" />
						System Status: Optimal
					</Button>
					<Button className="gap-2 border-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/20 shadow-lg hover:from-indigo-700 hover:to-purple-700">
						<Building2Icon className="h-4 w-4" />
						Add Company
					</Button>
				</div>
			</div>

			<motion.div
				variants={container}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
			>
				<motion.div variants={item}>
					<Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 shadow-sm">
						<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
									<Building2Icon className="h-6 w-6" />
								</div>
								<div className="flex items-center rounded-full bg-emerald-500/10 px-2 py-1 font-medium text-emerald-500 text-sm">
									<ArrowUpRightIcon className="mr-1 h-3 w-3" />
									12%
								</div>
							</div>
							<div className="mt-4">
								<p className="font-medium text-muted-foreground text-sm">
									Total Companies
								</p>
								<h3 className="mt-1 font-bold text-3xl">
									<AnimatedCounter value={stats?.totalCompanies || 0} />
								</h3>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div variants={item}>
					<Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 shadow-sm">
						<div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="rounded-xl bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
									<CreditCardIcon className="h-6 w-6" />
								</div>
								<div className="flex items-center rounded-full bg-emerald-500/10 px-2 py-1 font-medium text-emerald-500 text-sm">
									<ArrowUpRightIcon className="mr-1 h-3 w-3" />
									{stats?.monthlyGrowth || "0%"}
								</div>
							</div>
							<div className="mt-4">
								<p className="font-medium text-muted-foreground text-sm">
									Total Revenue
								</p>
								<h3 className="mt-1 font-bold text-3xl">
									<AnimatedCounter value={stats?.revenue || 0} prefix="$" />
								</h3>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div variants={item}>
					<Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 shadow-sm">
						<div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="rounded-xl bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
									<UsersIcon className="h-6 w-6" />
								</div>
								<div className="flex items-center rounded-full bg-emerald-500/10 px-2 py-1 font-medium text-emerald-500 text-sm">
									<ArrowUpRightIcon className="mr-1 h-3 w-3" />
									8%
								</div>
							</div>
							<div className="mt-4">
								<p className="font-medium text-muted-foreground text-sm">
									Active Users
								</p>
								<h3 className="mt-1 font-bold text-3xl">
									<AnimatedCounter value={stats?.totalUsers || 0} />
								</h3>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div variants={item}>
					<Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 shadow-sm">
						<div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
									<ActivityIcon className="h-6 w-6" />
								</div>
								<div className="flex items-center rounded-full bg-rose-500/10 px-2 py-1 font-medium text-rose-500 text-sm">
									<ArrowDownRightIcon className="mr-1 h-3 w-3" />
									2ms
								</div>
							</div>
							<div className="mt-4">
								<p className="font-medium text-muted-foreground text-sm">
									Avg Latency
								</p>
								<h3 className="mt-1 font-bold text-3xl">
									<AnimatedCounter
										value={Number.parseInt(health?.databaseLatency || "24", 10)}
										suffix="ms"
									/>
								</h3>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>

			{/* Bento Grid layout */}
			<motion.div
				variants={container}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 gap-6 lg:grid-cols-3"
			>
				{/* Main Chart Area */}
				<motion.div variants={item} className="lg:col-span-2">
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Revenue Overview</CardTitle>
							<CardDescription>
								Monthly recurring revenue across all tenants
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex h-[300px] w-full items-center justify-center rounded-xl border border-border/60 border-dashed bg-muted/20">
								<p className="flex items-center gap-2 text-muted-foreground">
									<LineChartIcon className="h-5 w-5" /> Chart placeholder
									(Recharts implementation pending)
								</p>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* System Health */}
				<motion.div variants={item} className="flex flex-col gap-6">
					<Card className="flex-1 border-border/50 shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-lg">
								<DatabaseZapIcon className="h-5 w-5 text-emerald-500" /> System
								Health
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium text-muted-foreground">
										CPU Usage
									</span>
									<span className="font-bold">{health?.cpuUsage}%</span>
								</div>
								<Progress
									value={health?.cpuUsage}
									className="h-2 bg-muted/50"
								/>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium text-muted-foreground">
										Memory
									</span>
									<span className="font-bold">{health?.memoryUsage}%</span>
								</div>
								<Progress
									value={health?.memoryUsage}
									className="h-2 bg-muted/50"
								/>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium text-muted-foreground">
										Storage ({health?.storageUsed})
									</span>
									<span className="font-bold">78%</span>
								</div>
								<Progress value={78} className="h-2 bg-muted/50" />
							</div>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden border-0 bg-primary text-primary-foreground">
						<div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl" />
						<CardContent className="p-6">
							<h3 className="mb-1 font-bold text-lg">
								Generate Monthly Report
							</h3>
							<p className="mb-4 text-primary-foreground/70 text-sm">
								Export full billing and usage analytics across all registered
								tenants.
							</p>
							<Button variant="secondary" className="w-full">
								Download CSV
							</Button>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
