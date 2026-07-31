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
	DollarSignIcon,
	ShoppingCartIcon,
	TargetIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

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
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div className="rounded-xl bg-muted p-3 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-primary">
						<Icon className="h-6 w-6" />
					</div>
					{trendValue && (
						<div
							className={`flex items-center rounded-full px-2 py-1 font-medium text-sm ${trendIsPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
						>
							{trendIsPositive ? "↑" : "↓"} {trendValue}
						</div>
					)}
				</div>
				<div className="mt-4">
					<p className="font-medium text-muted-foreground text-sm">{title}</p>
					<h3 className="mt-1 font-bold text-2xl tracking-tight">{value}</h3>
					{trend && (
						<p className="mt-2 text-muted-foreground text-xs">{trend}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default function SalesDashboard() {
	const { activeBranchId } = useBranch();

	// Reuse dashboard KPI for now, or orders if available
	const { data, isLoading } = trpc.dashboard.getKpis.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
	);

	if (isLoading || !data) {
		return (
			<div className="flex h-full min-h-[400px] items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: { staggerChildren: 0.05 },
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 15 },
		show: {
			opacity: 1,
			y: 0,
			transition: { type: "spring", stiffness: 300, damping: 24 },
		},
	};

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 pb-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Sales Dashboard</h1>
					<p className="mt-1 text-muted-foreground">
						Overview of sales performance and metrics.
					</p>
				</div>
				<div className="flex gap-4">
					<Link
						href="/sales/orders"
						className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
					>
						View Orders
					</Link>
					<Link
						href="/sales/targets"
						className="rounded-md bg-secondary px-4 py-2 font-medium text-secondary-foreground text-sm transition-colors hover:bg-secondary/80"
					>
						Sales Targets
					</Link>
				</div>
			</div>

			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
			>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Today's Revenue"
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
						title="Total Orders"
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
						title="Sales Profit"
						value={formatCurrency(data.todayProfit, "en-US")}
						icon={TrendingUpIcon}
						trendValue="8%"
						trendIsPositive={data.todayProfit >= 0}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Monthly Target"
						value="85%"
						icon={TargetIcon}
						trend="On track"
						trendIsPositive={true}
						colorClass="from-purple-500/10 to-transparent"
					/>
				</motion.div>
			</motion.div>

			<motion.div
				variants={itemVariants}
				initial="hidden"
				animate="show"
				className="mt-8"
			>
				<Card>
					<CardHeader>
						<CardTitle>Recent Sales Activity</CardTitle>
						<CardDescription>
							Latest transactions across your branches
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex h-[200px] items-center justify-center text-muted-foreground">
							Sales activity chart/list will be rendered here.
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
