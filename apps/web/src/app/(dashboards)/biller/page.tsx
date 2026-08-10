// @ts-nocheck
"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@evaluna/ui/components/alert";
import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { motion } from "framer-motion";
import {
	AlertCircle,
	IndianRupee,
	ShoppingCart,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { ActivityCard } from "@/components/shared/cards/activity-card";
import { KpiCard } from "@/components/shared/cards/kpi-card";
import { trpc } from "@/lib/trpc/client";

export default function BillerDashboard() {
	const { data, isLoading } = trpc.biller.dashboardOverview.useQuery(
		undefined,
		{ staleTime: 30_000, refetchOnWindowFocus: false },
	);

	const { data: returnsData } = trpc.salesReturns.list.useQuery(undefined, {
		staleTime: 30_000,
	});

	const pendingReturnsCount =
		returnsData?.filter((r: any) => r.status === "pending").length || 0;

	if (isLoading) {
		return (
			<div className="space-y-6 p-6">
				<h1 className="font-bold text-2xl tracking-tight">
					Dashboard Overview
				</h1>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Skeleton className="h-32 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
				</div>
			</div>
		);
	}

	// Mock data if TRPC is not returning
	const metrics = data?.metrics || {
		totalSales: 15423.5,
		totalBills: 142,
		avgBillValue: 108.6,
		activeCashiers: 3,
	};

	const activities = data?.recentActivities || [
		{
			id: 1,
			title: "Bill #1042 Paid",
			description: "₹120.50 via Card",
			time: "2 min ago",
		},
		{
			id: 2,
			title: "Bill #1041 Paid",
			description: "₹45.00 via Cash",
			time: "15 min ago",
		},
		{
			id: 3,
			title: "Refund #1040",
			description: "₹20.00 returned",
			time: "1 hour ago",
		},
	];

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<h1 className="font-bold text-2xl tracking-tight">
					Today's Sales Overview
				</h1>
				{pendingReturnsCount > 0 && (
					<Link href="/biller/returns">
						<Button variant="destructive" size="sm">
							<AlertCircle className="mr-2 h-4 w-4" />
							{pendingReturnsCount} Pending Returns
						</Button>
					</Link>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<KpiCard
					title="Total Sales"
					value={`₹${metrics.totalSales.toFixed(2)}`}
					icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
					description="+12.5% from yesterday"
				/>
				<KpiCard
					title="Total Bills"
					value={metrics.totalBills}
					icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
					description="+5 from yesterday"
				/>
				<KpiCard
					title="Avg Bill Value"
					value={`₹${metrics.avgBillValue.toFixed(2)}`}
					icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
					description="Steady"
				/>
				<KpiCard
					title="Active Cashiers"
					value={metrics.activeCashiers}
					icon={<Users className="h-4 w-4 text-muted-foreground" />}
					description="Currently online"
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-4">
					<h2 className="font-semibold text-xl tracking-tight">
						Recent Activity
					</h2>
					<motion.div
						className="space-y-4"
						initial="hidden"
						animate="visible"
						variants={{
							visible: { transition: { staggerChildren: 0.1 } },
						}}
					>
						{activities.map((activity: any) => (
							<motion.div
								key={activity.id}
								variants={{
									hidden: { opacity: 0, y: 10 },
									visible: { opacity: 1, y: 0 },
								}}
							>
								<ActivityCard
									title={activity.title}
									description={activity.description}
									time={activity.time}
								/>
							</motion.div>
						))}
					</motion.div>
				</div>
			</div>
		</div>
	);
}
