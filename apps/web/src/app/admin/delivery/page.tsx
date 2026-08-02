"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
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
	ActivityIcon,
	AlertTriangleIcon,
	BanknoteIcon,
	BellIcon,
	CarIcon,
	CheckCircle2Icon,
	ClockIcon,
	MapIcon,
	NavigationIcon,
	PackageIcon,
	PackageSearchIcon,
	PhoneIcon,
	TimerIcon,
	TrendingUpIcon,
	TruckIcon,
	UsersIcon,
	WalletIcon,
	XCircleIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

const DeliveryStatusChart = dynamic(
	() =>
		import("@/components/charts/delivery-charts").then(
			(m) => m.DeliveryStatusChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[140px] w-full rounded-lg" />,
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
		<Card className="group relative overflow-hidden border-border/50 bg-background/40 shadow-sm backdrop-blur-md transition-colors hover:border-primary/50">
			<div
				className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 transition-opacity group-hover:opacity-100`}
			/>
			<CardContent className="p-3">
				<div className="flex items-center justify-between">
					<div className="rounded-lg bg-muted/50 p-1.5 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-primary">
						<Icon className="h-4 w-4" />
					</div>
				</div>
				<div className="mt-2">
					<p className="font-medium text-[9px] text-muted-foreground uppercase tracking-wider">
						{title}
					</p>
					<h3 className="mt-0.5 font-bold text-lg tracking-tight">{value}</h3>
				</div>
			</CardContent>
		</Card>
	);
}

import { DynamicMap } from "./components/DynamicMap";

export default function DeliveryDashboard() {
	const { activeBranchId } = useBranch();

	const { data, isLoading } = trpc.delivery.getDashboard.useQuery(
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

	const statusColors = [
		"hsl(var(--chart-2))",
		"hsl(var(--chart-4))",
		"hsl(var(--chart-3))",
		"hsl(var(--chart-1))",
	];

	const chartConfig = {
		value: { label: "Orders", color: "hsl(var(--chart-1))" },
	} satisfies ChartConfig;

	return (
		<div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 pb-8">
			<div className="flex items-end justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Fleet Command Center
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Real-time delivery & logistics management.
					</p>
				</div>
				<div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-500 text-xs">
					<div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{" "}
					Live Tracking Active
				</div>
			</div>

			{/* KPIs Grid - Highly dense glass cards */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12"
			>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Today's Deliveries"
						value={data.todaysDeliveries}
						icon={PackageIcon}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Completed"
						value={data.completedDeliveries}
						icon={CheckCircle2Icon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Pending"
						value={data.pendingDeliveries}
						icon={ClockIcon}
						colorClass="from-amber-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Failed"
						value={data.failedDeliveries}
						icon={XCircleIcon}
						colorClass="from-rose-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="COD Collected"
						value={formatCurrency(data.codCollection, "en-IN")}
						icon={BanknoteIcon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Success Rate"
						value={`${data.deliverySuccessRate}%`}
						icon={TrendingUpIcon}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>

				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Avg Time"
						value={data.averageDeliveryTime}
						icon={TimerIcon}
						colorClass="from-purple-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Active Vehicles"
						value={data.vehiclesActive}
						icon={CarIcon}
						colorClass="from-indigo-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Drivers Online"
						value={data.driversOnline}
						icon={UserCheckIcon}
						colorClass="from-cyan-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Orders Waiting"
						value={data.ordersWaiting}
						icon={PackageSearchIcon}
						colorClass="from-orange-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Late Deliveries"
						value={data.lateDeliveries}
						icon={AlertTriangleIcon}
						colorClass="from-rose-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div
					variants={itemVariants}
					className="col-span-1 md:col-span-2 xl:col-span-2"
				>
					<KPICard
						title="Distance Traveled"
						value={`${data.distanceTravelled} km`}
						icon={MapIcon}
						colorClass="from-zinc-500/10 to-transparent"
					/>
				</motion.div>
			</motion.div>

			{/* Main Grid Layout */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid h-auto grid-cols-1 gap-5 lg:h-[450px] lg:grid-cols-12"
			>
				{/* Live Map Widget */}
				<motion.div
					variants={itemVariants}
					className="flex h-full flex-col lg:col-span-8"
				>
					<Card className="flex h-full flex-col overflow-hidden border-border/50 bg-background/40 shadow-sm backdrop-blur-md">
						<CardHeader className="z-10 flex flex-row items-center justify-between border-border/50 border-b bg-background/80 pb-3 backdrop-blur">
							<div>
								<CardTitle className="flex items-center gap-2 text-base">
									<MapIcon className="h-4 w-4 text-primary" /> Live Tracking Map
								</CardTitle>
								<CardDescription className="text-xs">
									Real-time driver locations & route tracking
								</CardDescription>
							</div>
							<Button size="sm" variant="outline" className="h-8 text-xs">
								View Full Map
							</Button>
						</CardHeader>
						<CardContent className="relative h-[300px] flex-1 p-0 lg:h-auto">
							{data.activeDrivers && (
								<DynamicMap drivers={data.activeDrivers} />
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Side Widgets */}
				<motion.div
					variants={itemVariants}
					className="flex h-full flex-col gap-5 lg:col-span-4"
				>
					{/* Order Status Breakdown */}
					<Card className="flex-1 overflow-hidden border-border/50 bg-background/40 shadow-sm backdrop-blur-md">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm">Orders by Status</CardTitle>
						</CardHeader>
						<CardContent className="pb-2">
							{data.ordersByStatus ? (
								<DeliveryStatusChart data={data.ordersByStatus} />
							) : null}
						</CardContent>
					</Card>

					{/* Realtime Notifications Feed */}
					<Card className="flex flex-1 flex-col overflow-hidden border-border/50 bg-background/40 shadow-sm backdrop-blur-md">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-sm">
								<BellIcon className="h-4 w-4" /> Live Alerts
							</CardTitle>
						</CardHeader>
						<CardContent className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2 pb-2">
							{data.notifications?.map((notif: any) => (
								<div key={notif.id} className="group flex items-start gap-2.5">
									<div
										className={`mt-0.5 flex-shrink-0 rounded-full p-1.5 ${
											notif.type === "emergency"
												? "bg-rose-500/20 text-rose-500"
												: notif.type === "delay"
													? "bg-amber-500/20 text-amber-500"
													: notif.type === "success"
														? "bg-emerald-500/20 text-emerald-500"
														: "bg-blue-500/20 text-blue-500"
										}`}
									>
										{notif.type === "emergency" && (
											<AlertTriangleIcon className="h-3 w-3" />
										)}
										{notif.type === "delay" && (
											<ClockIcon className="h-3 w-3" />
										)}
										{notif.type === "traffic" && (
											<CarIcon className="h-3 w-3" />
										)}
										{notif.type === "success" && (
											<BanknoteIcon className="h-3 w-3" />
										)}
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
			</motion.div>

			{/* Bottom Section - Tables */}
			<motion.div
				variants={itemVariants}
				className="grid grid-cols-1 gap-5 lg:grid-cols-3"
			>
				{/* Active Delivery Orders Table */}
				<Card className="border-border/50 bg-background/40 shadow-sm backdrop-blur-md lg:col-span-2">
					<CardHeader className="border-border/50 border-b pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-base">
								<PackageIcon className="h-4 w-4" /> Live Delivery Orders
							</CardTitle>
							<Button size="sm" variant="secondary" className="h-7 text-xs">
								View All
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="text-xs">Order ID</TableHead>
									<TableHead className="text-xs">Customer</TableHead>
									<TableHead className="text-xs">Status</TableHead>
									<TableHead className="text-xs">Driver</TableHead>
									<TableHead className="text-right text-xs">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.deliveryOrders?.map((order: any) => (
									<TableRow key={order.id} className="group">
										<TableCell className="font-medium text-xs">
											{order.id}
										</TableCell>
										<TableCell className="text-xs">
											<div>{order.customer}</div>
											<div className="max-w-[150px] truncate text-[10px] text-muted-foreground">
												{order.address}
											</div>
										</TableCell>
										<TableCell>
											<div
												className={`inline-block rounded-full px-2 py-0.5 font-bold text-[10px] uppercase ${
													order.status === "delivered"
														? "bg-emerald-500/10 text-emerald-500"
														: order.status === "failed"
															? "bg-rose-500/10 text-rose-500"
															: order.status === "out_for_delivery"
																? "bg-amber-500/10 text-amber-500"
																: "bg-slate-500/10 text-slate-500"
												}`}
											>
												{order.status.replace(/_/g, " ")}
											</div>
										</TableCell>
										<TableCell className="text-xs">{order.driver}</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
												<Button size="icon" variant="ghost" className="h-6 w-6">
													<NavigationIcon className="h-3 w-3" />
												</Button>
												<Button size="icon" variant="ghost" className="h-6 w-6">
													<PhoneIcon className="h-3 w-3" />
												</Button>
												<Button size="icon" variant="ghost" className="h-6 w-6">
													<ActivityIcon className="h-3 w-3" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* Top Drivers */}
				<Card className="border-border/50 bg-background/40 shadow-sm backdrop-blur-md lg:col-span-1">
					<CardHeader className="border-border/50 border-b pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<UserCheckIcon className="h-4 w-4" /> Top Drivers
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 pt-4">
						{data.topDrivers?.map((driver: any, idx: number) => (
							<div key={idx} className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-bold text-primary text-xs">
										{driver.name.charAt(0)}
									</div>
									<div>
										<h4 className="font-medium text-sm leading-none">
											{driver.name}
										</h4>
										<p className="mt-1 text-[10px] text-muted-foreground">
											⭐ {driver.rating} Rating
										</p>
									</div>
								</div>
								<div className="text-right">
									<div className="font-bold text-sm">{driver.deliveries}</div>
									<div className="text-[9px] text-muted-foreground uppercase tracking-wider">
										Deliveries
									</div>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
