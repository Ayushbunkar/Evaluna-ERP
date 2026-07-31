"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@evaluna/ui/components/chart";
import { motion } from "framer-motion";
import {
	ActivityIcon,
	AlertTriangleIcon,
	ArrowRightLeftIcon,
	Building2Icon,
	CalendarDaysIcon,
	DollarSignIcon,
	PackageIcon,
	SkullIcon,
	TargetIcon,
	TimerIcon,
} from "lucide-react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	XAxis,
	YAxis,
} from "recharts";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

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
				<motion.div variants={itemVariants} className="col-span-1">
					<KPICard
						title="Total Value"
						value={formatCurrency(data.inventoryValue, "en-US")}
						icon={DollarSignIcon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants} className="col-span-1">
					<KPICard
						title="Products"
						value={data.totalProducts}
						icon={PackageIcon}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants} className="col-span-1">
					<KPICard
						title="Low Stock"
						value={data.lowStockItems}
						icon={AlertTriangleIcon}
						colorClass="from-rose-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants} className="col-span-1">
					<KPICard
						title="Expiring Soon"
						value={data.expiringSoon}
						icon={TimerIcon}
						colorClass="from-orange-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants} className="col-span-1">
					<KPICard
						title="Dead Stock"
						value={data.deadStock}
						icon={SkullIcon}
						colorClass="from-zinc-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants} className="col-span-1">
					<KPICard
						title="Accuracy"
						value={`${data.stockAccuracy}%`}
						icon={TargetIcon}
						colorClass="from-indigo-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants} className="col-span-1">
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
				<motion.div variants={itemVariants} className="lg:col-span-2">
					<Card className="flex h-full flex-col border-border/50 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle>Inventory Value Trend</CardTitle>
							<CardDescription>
								Historical total stock value over time
							</CardDescription>
						</CardHeader>
						<CardContent className="min-h-[300px] flex-1">
							{data.inventoryTrend ? (
								<ChartContainer config={chartConfig} className="h-full w-full">
									<AreaChart
										data={data.inventoryTrend}
										margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
									>
										<defs>
											<linearGradient
												id="colorValue"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="5%"
													stopColor="hsl(var(--chart-1))"
													stopOpacity={0.3}
												/>
												<stop
													offset="95%"
													stopColor="hsl(var(--chart-1))"
													stopOpacity={0}
												/>
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="month" tickLine={false} axisLine={false} />
										<YAxis
											tickLine={false}
											axisLine={false}
											tickFormatter={(v) => `$${v / 1000}k`}
										/>
										<ChartTooltip content={<ChartTooltipContent />} />
										<Area
											type="monotone"
											dataKey="value"
											stroke="hsl(var(--chart-1))"
											fillOpacity={1}
											fill="url(#colorValue)"
										/>
									</AreaChart>
								</ChartContainer>
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									No trend data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Category Distribution */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Category Distribution</CardTitle>
							<CardDescription>Stock allocation by category</CardDescription>
						</CardHeader>
						<CardContent>
							{data.categoryDistribution ? (
								<ChartContainer
									config={chartConfig}
									className="h-[250px] w-full"
								>
									<PieChart>
										<ChartTooltip content={<ChartTooltipContent />} />
										<Pie
											data={data.categoryDistribution}
											dataKey="value"
											nameKey="name"
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={80}
											paddingAngle={2}
										>
											{data.categoryDistribution.map(
												(_entry: any, index: number) => (
													<Cell
														key={`cell-${index}`}
														fill={categoryColors[index % categoryColors.length]}
													/>
												),
											)}
										</Pie>
									</PieChart>
								</ChartContainer>
							) : (
								<div className="flex h-[250px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* ABC Analysis */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>ABC Classification</CardTitle>
							<CardDescription>Value vs Volume ratio</CardDescription>
						</CardHeader>
						<CardContent>
							{data.abcAnalysis ? (
								<ChartContainer
									config={chartConfig}
									className="h-[250px] w-full"
								>
									<RadarChart
										data={data.abcAnalysis}
										margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
									>
										<PolarGrid />
										<PolarAngleAxis dataKey="class" />
										<PolarRadiusAxis angle={30} domain={[0, 100]} />
										<Radar
											name="Value %"
											dataKey="value"
											stroke="hsl(var(--chart-1))"
											fill="hsl(var(--chart-1))"
											fillOpacity={0.5}
										/>
										<Radar
											name="Volume %"
											dataKey="percentage"
											stroke="hsl(var(--chart-2))"
											fill="hsl(var(--chart-2))"
											fillOpacity={0.5}
										/>
										<ChartTooltip content={<ChartTooltipContent />} />
									</RadarChart>
								</ChartContainer>
							) : (
								<div className="flex h-[250px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Warehouse Distribution */}
				<motion.div variants={itemVariants}>
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
								<ChartContainer
									config={chartConfig}
									className="h-[250px] w-full"
								>
									<BarChart data={data.warehouseDistribution}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="name" tickLine={false} axisLine={false} />
										<ChartTooltip content={<ChartTooltipContent />} />
										<Bar
											dataKey="stock"
											fill="hsl(var(--chart-3))"
											radius={[4, 4, 0, 0]}
											barSize={30}
										/>
									</BarChart>
								</ChartContainer>
							) : (
								<div className="flex h-[250px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Top Moving & Recent Movements */}
				<motion.div variants={itemVariants} className="flex flex-col gap-6">
					<Card className="flex-1 border-border/50 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<ActivityIcon className="h-4 w-4 text-primary" /> Top Moving
								Items
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.topMovingItems?.map((item: any, idx: number) => (
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
							))}
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
							{data.recentMovements?.map((move: any) => (
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
							))}
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
