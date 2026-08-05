// @ts-nocheck
"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { motion } from "framer-motion";
import {
	ActivityIcon,
	AlertTriangleIcon,
	ArrowRightLeftIcon,
	Building2Icon,
	CalendarDaysIcon,
	IndianRupeeIcon,
	PackageIcon,
	SkullIcon,
	TargetIcon,
	TimerIcon,
	TrendingUpIcon,
	TruckIcon,
	UsersIcon,
	WalletIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

const InventoryValueChart = dynamic(
	() =>
		import("@/components/charts/inventory-charts").then(
			(m) => m.InventoryValueChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
	},
);

const InventoryCategoryChart = dynamic(
	() =>
		import("@/components/charts/inventory-charts").then(
			(m) => m.InventoryCategoryChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[250px] w-full rounded-lg" />,
	},
);

const InventoryAbcChart = dynamic(
	() =>
		import("@/components/charts/inventory-charts").then(
			(m) => m.InventoryAbcChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[250px] w-full rounded-lg" />,
	},
);

const InventoryWarehouseChart = dynamic(
	() =>
		import("@/components/charts/inventory-charts").then(
			(m) => m.InventoryWarehouseChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[250px] w-full rounded-lg" />,
	},
);

function KPICard({
	title,
	value,
	icon: Icon,
	colorClass,
}: {
	title: string;
	value: string | number;
	icon: any;
	colorClass: string;
}) {
	return (
		<Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 shadow-sm">
			<div
				className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 transition-opacity group-hover:opacity-100`}
			/>
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-primary">
						<Icon className="h-4 w-4" />
					</div>
				</div>
				<div className="mt-3">
					<p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
						{title}
					</p>
					<h3 className="mt-1 font-bold text-xl tracking-tight">{value}</h3>
				</div>
			</CardContent>
		</Card>
	);
}

export default function InventoryDashboard() {
	const { activeBranchId } = useBranch();

	const { data, isLoading } = trpc.inventory.getDashboardStats.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
		{ staleTime: 30_000, refetchOnWindowFocus: false },
	);

	if (isLoading || !data) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Skeleton className="h-32 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
				</div>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Skeleton className="h-64 w-full rounded-xl" />
					<Skeleton className="h-64 w-full rounded-xl" />
				</div>
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

	const categoryColors = [
		"hsl(var(--chart-1))",
		"hsl(var(--chart-2))",
		"hsl(var(--chart-3))",
		"hsl(var(--chart-4))",
	];

	const chartConfig = {
		value: { label: "Value", color: "hsl(var(--chart-1))" },
		stock: { label: "Stock Units", color: "hsl(var(--chart-2))" },
		percentage: { label: "Percentage %", color: "hsl(var(--chart-3))" },
	} satisfies ChartConfig;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Inventory Management
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Comprehensive stock tracking and analysis.
				</p>
			</div>

			{/* KPIs Grid */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7"
			>
				<motion.div variants={itemVariants as any} className="col-span-1">
					<KPICard
						title="Total Value"
						value={formatCurrency(data.inventoryValue, "en-IN")}
						icon={IndianRupeeIcon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any} className="col-span-1">
					<KPICard
						title="Products"
						value={data.totalProducts}
						icon={PackageIcon}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any} className="col-span-1">
					<KPICard
						title="Low Stock"
						value={data.lowStockItems}
						icon={AlertTriangleIcon}
						colorClass="from-rose-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any} className="col-span-1">
					<KPICard
						title="Expiring Soon"
						value={data.expiringSoon}
						icon={TimerIcon}
						colorClass="from-orange-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any} className="col-span-1">
					<KPICard
						title="Dead Stock"
						value={data.deadStock}
						icon={SkullIcon}
						colorClass="from-zinc-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any} className="col-span-1">
					<KPICard
						title="Accuracy"
						value={`${data.stockAccuracy}%`}
						icon={TargetIcon}
						colorClass="from-indigo-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants as any} className="col-span-1">
					<KPICard
						title="Avg Stock Days"
						value={data.averageStockDays}
						icon={CalendarDaysIcon}
						colorClass="from-purple-500/10 to-transparent"
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
				{/* Inventory Trend */}
				<motion.div variants={itemVariants as any} className="md:col-span-2">
					<Card className="flex h-full flex-col border-border/50 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle>Inventory Value Trend</CardTitle>
							<CardDescription>
								Historical total stock value over time
							</CardDescription>
						</CardHeader>
						<CardContent className="min-h-[300px] flex-1">
							{data.inventoryTrend ? (
								<InventoryValueChart data={data.inventoryTrend} />
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									No trend data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Category Distribution */}
				<motion.div variants={itemVariants as any}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Category Distribution</CardTitle>
							<CardDescription>Stock allocation by category</CardDescription>
						</CardHeader>
						<CardContent>
							{data.categoryDistribution ? (
								<InventoryCategoryChart data={data.categoryDistribution} />
							) : (
								<div className="flex h-[250px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* ABC Analysis */}
				<motion.div variants={itemVariants as any}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>ABC Classification</CardTitle>
							<CardDescription>Value vs Volume ratio</CardDescription>
						</CardHeader>
						<CardContent>
							{data.abcAnalysis ? (
								<InventoryAbcChart data={data.abcAnalysis} />
							) : (
								<div className="flex h-[250px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Warehouse Distribution */}
				<motion.div variants={itemVariants as any}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building2Icon className="h-5 w-5 text-primary" /> Warehouse
								Distribution
							</CardTitle>
							<CardDescription>Stock units across locations</CardDescription>
						</CardHeader>
						<CardContent>
							{data.warehouseDistribution ? (
								<InventoryWarehouseChart data={data.warehouseDistribution} />
							) : (
								<div className="flex h-[250px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Top Moving & Recent Movements */}
				<motion.div variants={itemVariants as any} className="flex flex-col gap-6">
					<Card className="flex-1 border-border/50 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<ActivityIcon className="h-4 w-4 text-primary" /> Top Moving
								Items
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.topMovingItems && data.topMovingItems.length > 0 ? (
								data.topMovingItems.map((item: any, idx: number) => (
									<div
										key={idx}
										className="flex items-center justify-between rounded p-2 transition-colors hover:bg-muted/50"
									>
										<div>
											<h4 className="font-medium text-sm">{item.name}</h4>
											<p className="text-[10px] text-muted-foreground">
												{item.category}
											</p>
										</div>
										<div className="text-right">
											<div className="font-bold text-emerald-600 text-sm">
												{item.turns}x
											</div>
											<div className="text-[10px] text-muted-foreground uppercase">
												Turns/Yr
											</div>
										</div>
									</div>
								))
							) : (
								<div className="flex h-[150px] items-center justify-center text-muted-foreground">
									No data available
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="flex-1 border-border/50 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<ArrowRightLeftIcon className="h-4 w-4 text-primary" /> Recent
								Movements
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{data.recentMovements && data.recentMovements.length > 0 ? (
								data.recentMovements.map((move: any) => (
									<div
										key={move.id}
										className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-2.5 transition-colors hover:border-primary/30"
									>
										<div
											className={`mt-0.5 flex-shrink-0 rounded px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider ${
												move.type === "in"
													? "bg-emerald-500/10 text-emerald-500"
													: move.type === "out"
														? "bg-rose-500/10 text-rose-500"
														: "bg-blue-500/10 text-blue-500"
											}`}
										>
											{move.type}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex justify-between">
												<h4 className="truncate pr-2 font-medium text-sm leading-tight">
													{move.product}
												</h4>
												<span
													className={`font-bold text-sm ${move.qty > 0 ? "text-emerald-500" : "text-rose-500"}`}
												>
													{move.qty > 0 ? "+" : ""}
													{move.qty}
												</span>
											</div>
											<p className="mt-1 text-[10px] text-muted-foreground">
												{move.time}
											</p>
										</div>
									</div>
								))
							) : (
								<div className="flex h-[150px] items-center justify-center text-muted-foreground">
									No movements recorded
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}




