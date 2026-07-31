"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
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
	CheckCircleIcon,
	ClockIcon,
	MapPinIcon,
	TruckIcon,
	XCircleIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const statusBadge = (status: string) => {
	if (status === "delivered")
		return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
	if (status === "out_for_delivery")
		return (
			<Badge className="bg-blue-100 text-blue-800">Out for Delivery</Badge>
		);
	if (status === "failed")
		return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
	return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
};

export default function DeliveryPage() {
	const { data, isLoading } = trpc.delivery.getDashboard.useQuery({});

	const kpis = [
		{
			label: "Today's Deliveries",
			value: data?.todaysDeliveries?.toString() ?? "0",
			icon: TruckIcon,
			color: "text-blue-600",
			bg: "bg-blue-50",
		},
		{
			label: "Completed",
			value: data?.completedDeliveries?.toString() ?? "0",
			icon: CheckCircleIcon,
			color: "text-green-600",
			bg: "bg-green-50",
		},
		{
			label: "Pending",
			value: data?.pendingDeliveries?.toString() ?? "0",
			icon: ClockIcon,
			color: "text-yellow-600",
			bg: "bg-yellow-50",
		},
		{
			label: "Failed",
			value: data?.failedDeliveries?.toString() ?? "0",
			icon: XCircleIcon,
			color: "text-red-600",
			bg: "bg-red-50",
		},
	];

	return (
		<motion.div
			className="space-y-6 p-6"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text font-bold text-3xl text-transparent">
						Delivery
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Monitor deliveries, drivers, and logistics in real-time
					</p>
				</div>
				<Button className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
					<TruckIcon className="h-4 w-4" />
					Assign Delivery
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{kpis.map((kpi, i) => (
					<motion.div
						key={kpi.label}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: i * 0.07 }}
					>
						<Card className="border-0 shadow-sm">
							<CardContent className="pt-6">
								<div className="flex items-center gap-3">
									<div className={`${kpi.bg} rounded-lg p-2`}>
										<kpi.icon className={`h-5 w-5 ${kpi.color}`} />
									</div>
									<div>
										<p className="text-muted-foreground text-sm">{kpi.label}</p>
										{isLoading ? (
											<Skeleton className="mt-1 h-6 w-20" />
										) : (
											<p className="font-bold text-xl">{kpi.value}</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card className="border-0 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<MapPinIcon className="h-4 w-4 text-blue-600" /> Active Drivers
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-3">
								{[...Array(3)].map((_, i) => (
									<Skeleton key={i} className="h-10 w-full" />
								))}
							</div>
						) : (
							<div className="space-y-3">
								{(data?.activeDrivers ?? []).map((driver) => (
									<div
										key={driver.id}
										className="flex items-center justify-between rounded-lg bg-muted/30 p-2"
									>
										<div>
											<p className="font-medium text-sm">{driver.name}</p>
											<p className="text-muted-foreground text-xs capitalize">
												{driver.status}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground text-xs">
												🔋{driver.battery}%
											</span>
											<Badge
												className={
													driver.status === "driving"
														? "bg-blue-100 text-blue-800"
														: driver.status === "delivering"
															? "bg-green-100 text-green-800"
															: "bg-gray-100 text-gray-800"
												}
											>
												{driver.status}
											</Badge>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-0 shadow-sm">
					<CardHeader>
						<CardTitle className="text-sm">Performance Metrics</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex justify-between">
								<span className="text-muted-foreground text-sm">
									Success Rate
								</span>
								{isLoading ? (
									<Skeleton className="h-5 w-16" />
								) : (
									<span className="font-semibold text-green-600">
										{data?.deliverySuccessRate}%
									</span>
								)}
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground text-sm">
									Avg. Delivery Time
								</span>
								{isLoading ? (
									<Skeleton className="h-5 w-16" />
								) : (
									<span className="font-semibold">
										{data?.averageDeliveryTime}
									</span>
								)}
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground text-sm">
									COD Collected
								</span>
								{isLoading ? (
									<Skeleton className="h-5 w-16" />
								) : (
									<span className="font-semibold text-green-600">
										₹{data?.codCollection?.toLocaleString("en-IN")}
									</span>
								)}
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground text-sm">
									Vehicles Active
								</span>
								{isLoading ? (
									<Skeleton className="h-5 w-16" />
								) : (
									<span className="font-semibold">{data?.vehiclesActive}</span>
								)}
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground text-sm">
									Distance Travelled
								</span>
								{isLoading ? (
									<Skeleton className="h-5 w-16" />
								) : (
									<span className="font-semibold">
										{data?.distanceTravelled} km
									</span>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TruckIcon className="h-5 w-5 text-indigo-600" />
						Delivery Orders
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Order ID</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Address</TableHead>
									<TableHead>Driver</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(data?.deliveryOrders ?? []).map((order, i) => (
									<TableRow key={i} className="hover:bg-muted/30">
										<TableCell className="font-medium font-mono">
											{order.id}
										</TableCell>
										<TableCell>{order.customer}</TableCell>
										<TableCell className="max-w-xs truncate text-muted-foreground">
											{order.address}
										</TableCell>
										<TableCell>{order.driver}</TableCell>
										<TableCell className="font-semibold">
											₹{order.amount.toLocaleString("en-IN")}
										</TableCell>
										<TableCell>{statusBadge(order.status)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}
