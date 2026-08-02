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
	ArrowDownToLineIcon,
	ArrowUpToLineIcon,
	BoxIcon,
	CheckSquareIcon,
	MapPinIcon,
	SearchIcon,
	ShieldAlertIcon,
	TimerIcon,
	TrendingUpIcon,
	TruckIcon,
	UsersIcon,
	WalletIcon,
	WarehouseIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

const WarehouseHeatmapChart = dynamic(
	() =>
		import("@/components/charts/warehouse-charts").then(
			(m) => m.WarehouseHeatmapChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
	},
);

const WarehouseRackChart = dynamic(
	() =>
		import("@/components/charts/warehouse-charts").then(
			(m) => m.WarehouseRackChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[220px] w-full rounded-lg" />,
	},
);

const WarehouseFifoChart = dynamic(
	() =>
		import("@/components/charts/warehouse-charts").then(
			(m) => m.WarehouseFifoChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[220px] w-full rounded-lg" />,
	},
);

// Premium Animated KPI Card
function KPICard({
	title,
	value,
	icon: Icon,
	trend,
	colorClass,
}: {
	title: string;
	value: string | number;
	icon: any;
	trend?: string;
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
					{trend && (
						<p className="mt-1 text-[10px] text-muted-foreground">{trend}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default function WarehouseDashboard() {
	const { activeBranchId } = useBranch();

	const { data, isLoading } = trpc.warehouse.getStats.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
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

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Warehouse Overview
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Real-time logistics and inventory tracking.
				</p>
			</div>

			{/* KPIs Grid */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8"
			>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Received"
						value={data.itemsReceived || 0}
						icon={ArrowDownToLineIcon}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Put Away"
						value={data.itemsPutAway || 0}
						icon={ArrowUpToLineIcon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Pick Queue"
						value={data.pickingQueue || 0}
						icon={SearchIcon}
						colorClass="from-indigo-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Pack Queue"
						value={data.packingQueue || 0}
						icon={BoxIcon}
						colorClass="from-cyan-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Capacity"
						value={`${data.warehouseCapacity || 0}%`}
						icon={WarehouseIcon}
						colorClass="from-purple-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Locations"
						value={data.locationsUsed || 0}
						icon={MapPinIcon}
						colorClass="from-amber-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Damaged"
						value={data.damageItems || 0}
						icon={ShieldAlertIcon}
						colorClass="from-rose-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 lg:col-span-1"
				>
					<KPICard
						title="Expired"
						value={data.expiredProducts || 0}
						icon={TimerIcon}
						colorClass="from-orange-500/10 to-transparent"
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
				{/* Warehouse Heatmap */}
				<motion.div variants={itemVariants} className="lg:col-span-2">
					<Card className="flex h-full flex-col border-border/50 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle>Live Warehouse Heatmap</CardTitle>
							<CardDescription>Real-time activity across zones</CardDescription>
						</CardHeader>
						<CardContent className="min-h-[300px] flex-1">
							{data.heatmapData ? (
								<WarehouseHeatmapChart data={data.heatmapData} />
							) : (
								<div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/20 text-muted-foreground">
									No heatmap data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Realtime Alerts & Recent Activity */}
				<motion.div variants={itemVariants} className="flex flex-col gap-6">
					<Card className="flex-1 border-border/50 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<ActivityIcon className="h-4 w-4 text-primary" /> Recent
								Activity
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.recentActivity?.map((act: any) => (
								<div
									key={act.id}
									className="relative flex flex-col border-primary/30 border-l-2 pl-3"
								>
									<div className="absolute top-1.5 -left-[5px] h-2 w-2 rounded-full bg-primary" />
									<p className="font-medium text-sm">{act.action}</p>
									<div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
										<span>{act.user}</span>
										<span>{act.time}</span>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="flex-1 border-border/50 border-rose-500/20 bg-rose-500/5 shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-base text-rose-700">
								<AlertTriangleIcon className="h-4 w-4" /> Inventory Alerts
							</CardTitle>
						</CardHeader>
						<CardContent className="mt-2 space-y-3">
							{data.inventoryAlerts?.map((alert: any) => (
								<div
									key={alert.id}
									className="flex items-start gap-2 text-rose-800 text-sm"
								>
									<ShieldAlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-70" />
									<div>
										<p className="font-medium leading-tight">{alert.message}</p>
										<span className="text-[10px] opacity-70">{alert.time}</span>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</motion.div>

				{/* Rack Utilization */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>Rack Utilization</CardTitle>
							<CardDescription>Capacity usage by zone</CardDescription>
						</CardHeader>
						<CardContent>
							{data.rackUtilization ? (
								<WarehouseRackChart data={data.rackUtilization} />
							) : (
								<div className="flex h-[220px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* FIFO Status */}
				<motion.div variants={itemVariants}>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>FIFO Status (Inventory Age)</CardTitle>
							<CardDescription>
								Units grouped by age in warehouse
							</CardDescription>
						</CardHeader>
						<CardContent>
							{data.fifoStatus ? (
								<WarehouseFifoChart data={data.fifoStatus} />
							) : (
								<div className="flex h-[220px] items-center justify-center text-muted-foreground">
									No data
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Worker Performance & Pending Tasks */}
				<motion.div
					variants={itemVariants}
					className="grid h-full grid-cols-1 gap-6 md:grid-cols-2"
				>
					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<UsersIcon className="h-4 w-4 text-primary" /> Worker
								Performance
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.workerPerformance?.map((worker: any, idx: number) => (
								<div
									key={idx}
									className="flex items-center justify-between rounded p-2 transition-colors hover:bg-muted/50"
								>
									<div>
										<h4 className="font-medium text-sm">{worker.name}</h4>
										<p className="text-[10px] text-muted-foreground uppercase">
											{worker.role}
										</p>
									</div>
									<div className="text-right">
										<div className="font-bold text-sm">
											{worker.items} items
										</div>
										<div className="font-medium text-[10px] text-emerald-500">
											{worker.accuracy}% acc
										</div>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="h-full border-border/50 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<CheckSquareIcon className="h-4 w-4 text-primary" /> Pending
								Tasks
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{data.pendingTasks?.map((task: any) => (
								<div
									key={task.id}
									className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-2.5 transition-colors hover:border-primary/30"
								>
									<div
										className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
											task.priority === "high"
												? "bg-rose-500"
												: task.priority === "medium"
													? "bg-amber-500"
													: "bg-slate-400"
										}`}
									/>
									<div>
										<h4 className="font-medium text-sm leading-tight">
											{task.title}
										</h4>
										<p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">
											{task.status}
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
