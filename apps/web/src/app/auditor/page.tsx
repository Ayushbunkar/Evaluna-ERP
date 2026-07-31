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
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@evaluna/ui/components/chart";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { motion } from "framer-motion";
import {
	AlertTriangleIcon,
	BellIcon,
	CheckCircle2Icon,
	ClipboardListIcon,
	ClockIcon,
	InfoIcon,
	PackageXIcon,
	ScanIcon,
	SearchXIcon,
	TargetIcon,
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
	XAxis,
	YAxis,
} from "recharts";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

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

export default function AuditorDashboard() {
	const { activeBranchId } = useBranch();

	const { data, isLoading } = trpc.auditor.getDashboardStats.useQuery(
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

	const issueColors = [
		"hsl(var(--chart-1))",
		"hsl(var(--chart-2))",
		"hsl(var(--chart-3))",
		"hsl(var(--chart-4))",
	];

	const chartConfig = {
		count: { label: "Count", color: "hsl(var(--chart-1))" },
		value: { label: "Value", color: "hsl(var(--chart-2))" },
	} satisfies ChartConfig;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div className="flex items-end justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Auditor Control Center
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Monitor stock integrity, cycle counts, and compliance.
					</p>
				</div>
				<Button className="gap-2">
					<ScanIcon className="h-4 w-4" /> Start Audit Scan
				</Button>
			</div>

			{/* KPIs Grid */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
			>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Pending Audits"
						value={data.pendingAudits}
						icon={ClipboardListIcon}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Completed"
						value={data.completedAudits}
						icon={CheckCircle2Icon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Mismatch"
						value={data.mismatchCount}
						icon={SearchXIcon}
						colorClass="from-amber-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Damage"
						value={data.damageCount}
						icon={PackageXIcon}
						colorClass="from-rose-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Expiry"
						value={data.expiryCount}
						icon={ClockIcon}
						colorClass="from-orange-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Stock Accuracy"
						value={`${data.stockAccuracy}%`}
						icon={TargetIcon}
						colorClass="from-emerald-500/10 to-transparent"
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
				{/* Expiry Timeline Chart */}
				<motion.div variants={itemVariants} className="lg:col-span-2">
					<Card className="flex h-full flex-col border-border/50 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle>Expiry Risk Timeline</CardTitle>
							<CardDescription>
								Forecast of upcoming product expirations
							</CardDescription>
						</CardHeader>
						<CardContent className="min-h-[250px] flex-1">
							{data.expiryTimeline ? (
								<ChartContainer config={chartConfig} className="h-full w-full">
									<AreaChart
										data={data.expiryTimeline}
										margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
									>
										<defs>
											<linearGradient
												id="colorExpiry"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="5%"
													stopColor="hsl(var(--chart-4))"
													stopOpacity={0.3}
												/>
												<stop
													offset="95%"
													stopColor="hsl(var(--chart-4))"
													stopOpacity={0}
												/>
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="month" tickLine={false} axisLine={false} />
										<YAxis tickLine={false} axisLine={false} />
										<ChartTooltip content={<ChartTooltipContent />} />
										<Area
											type="monotone"
											dataKey="count"
											stroke="hsl(var(--chart-4))"
											fillOpacity={1}
											fill="url(#colorExpiry)"
										/>
									</AreaChart>
								</ChartContainer>
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Realtime Notifications Feed */}
				<motion.div variants={itemVariants} className="flex flex-col gap-6">
					<Card className="flex h-full flex-col overflow-hidden border-border/50 bg-background/40 shadow-sm backdrop-blur-md">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-base">
								<BellIcon className="h-4 w-4 text-primary" /> Live Audit Alerts
							</CardTitle>
						</CardHeader>
						<CardContent className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2 pb-2">
							{data.notifications?.map((notif: any) => (
								<div key={notif.id} className="flex items-start gap-2.5">
									<div
										className={`mt-0.5 flex-shrink-0 rounded-full p-1.5 ${
											notif.type === "alert"
												? "bg-rose-500/20 text-rose-500"
												: notif.type === "warning"
													? "bg-amber-500/20 text-amber-500"
													: "bg-blue-500/20 text-blue-500"
										}`}
									>
										{notif.type === "alert" && (
											<AlertTriangleIcon className="h-3 w-3" />
										)}
										{notif.type === "warning" && (
											<ClockIcon className="h-3 w-3" />
										)}
										{notif.type === "info" && <InfoIcon className="h-3 w-3" />}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-baseline justify-between">
											<h4 className="truncate font-semibold text-xs leading-tight">
												{notif.title}
											</h4>
											<span className="ml-2 whitespace-nowrap text-[9px] text-muted-foreground">
												{notif.time}
											</span>
										</div>
										<p className="mt-0.5 text-[10px] text-muted-foreground/80 leading-tight">
											{notif.message}
										</p>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</motion.div>

				{/* Damage Timeline */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Damage Reports</CardTitle>
							<CardDescription>Monthly damaged units recorded</CardDescription>
						</CardHeader>
						<CardContent>
							{data.damageTimeline ? (
								<ChartContainer
									config={chartConfig}
									className="h-[200px] w-full"
								>
									<BarChart data={data.damageTimeline}>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
											opacity={0.3}
										/>
										<XAxis
											dataKey="month"
											tickLine={false}
											axisLine={false}
											tick={{ fontSize: 10 }}
										/>
										<ChartTooltip content={<ChartTooltipContent />} />
										<Bar
											dataKey="count"
											fill="hsl(var(--chart-1))"
											radius={[4, 4, 0, 0]}
											barSize={24}
										/>
									</BarChart>
								</ChartContainer>
							) : (
								<div className="flex h-[200px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Warehouse Issues Breakdown */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Warehouse Issues</CardTitle>
							<CardDescription>Breakdown by discrepancy type</CardDescription>
						</CardHeader>
						<CardContent>
							{data.warehouseIssues ? (
								<ChartContainer
									config={chartConfig}
									className="h-[200px] w-full"
								>
									<PieChart>
										<ChartTooltip content={<ChartTooltipContent />} />
										<Pie
											data={data.warehouseIssues}
											dataKey="value"
											nameKey="name"
											cx="50%"
											cy="50%"
											innerRadius={50}
											outerRadius={70}
											paddingAngle={2}
										>
											{data.warehouseIssues.map(
												(_entry: any, index: number) => (
													<Cell
														key={`cell-${index}`}
														fill={issueColors[index % issueColors.length]}
													/>
												),
											)}
										</Pie>
									</PieChart>
								</ChartContainer>
							) : (
								<div className="flex h-[200px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Product Mismatch Feed */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 border-rose-500/20 bg-rose-500/5 shadow-sm">
						<CardHeader className="border-rose-500/10 border-b pb-3">
							<CardTitle className="flex items-center gap-2 text-base text-rose-700">
								<SearchXIcon className="h-4 w-4" /> Live Mismatches
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 pt-4">
							{data.productMismatch?.map((item: any, idx: number) => (
								<div key={idx} className="flex items-center justify-between">
									<div>
										<h4 className="font-bold text-rose-700 text-sm">
											{item.id}
										</h4>
										<p className="mt-1 text-[10px] text-rose-600/70">
											{item.location}
										</p>
									</div>
									<div className="flex items-center gap-3 text-right">
										<div className="text-muted-foreground text-xs">
											Exp:{" "}
											<span className="font-medium text-foreground">
												{item.expected}
											</span>
											<br />
											Act:{" "}
											<span className="font-medium text-foreground">
												{item.actual}
											</span>
										</div>
										<div className="rounded bg-rose-100 px-2 py-1 font-bold text-rose-700 text-xs dark:bg-rose-900/50">
											{item.diff}
										</div>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</motion.div>

				{/* Audit Queue & Recent Audits */}
				<motion.div
					variants={itemVariants}
					className="grid grid-cols-1 gap-6 lg:col-span-3 lg:grid-cols-2"
				>
					<Card className="border-border/50 shadow-sm">
						<CardHeader className="border-border/50 border-b pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 text-base">
									<ClipboardListIcon className="h-4 w-4 text-primary" /> Audit
									Queue
								</CardTitle>
								<Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
									View Schedule
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="text-[10px]">ID / Area</TableHead>
										<TableHead className="text-[10px]">Assigned To</TableHead>
										<TableHead className="text-right text-[10px]">
											Status
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.auditQueue?.map((audit: any) => (
										<TableRow key={audit.id}>
											<TableCell>
												<div className="font-medium text-xs">{audit.id}</div>
												<div className="text-[9px] text-muted-foreground">
													{audit.area}
												</div>
											</TableCell>
											<TableCell className="text-xs">
												{audit.assignedTo}
											</TableCell>
											<TableCell className="text-right">
												<div
													className={`inline-block rounded-full px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider ${audit.status === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}
												>
													{audit.status}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					<Card className="border-border/50 shadow-sm">
						<CardHeader className="border-border/50 border-b pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 text-base">
									<CheckCircle2Icon className="h-4 w-4 text-primary" /> Recent
									Audits
								</CardTitle>
								<Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
									History
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="text-[10px]">ID / Area</TableHead>
										<TableHead className="text-[10px]">Auditor</TableHead>
										<TableHead className="text-right text-[10px]">
											Accuracy
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.recentAudits?.map((audit: any) => (
										<TableRow key={audit.id}>
											<TableCell>
												<div className="font-medium text-xs">{audit.id}</div>
												<div className="text-[9px] text-muted-foreground">
													{audit.area}
												</div>
											</TableCell>
											<TableCell className="text-xs">
												{audit.completedBy}
											</TableCell>
											<TableCell className="text-right">
												<div className="font-bold text-emerald-500 text-xs">
													{audit.accuracy}
												</div>
												<div className="mt-0.5 text-[9px] text-muted-foreground">
													{audit.issues} issues found
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
