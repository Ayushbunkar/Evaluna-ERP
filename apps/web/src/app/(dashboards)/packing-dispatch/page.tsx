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
	ArchiveIcon,
	CheckCircleIcon,
	ClockIcon,
	PackageIcon,
	TruckIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function PackingDispatchDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const { data: stats } = trpc.packer.getDashboardStats.useQuery();

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Packing & Dispatch Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Order packaging, shipment preparation, and logistics coordination
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Packing & Dispatch
						Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/packer/pending">
							<PackageIcon className="mr-2 h-4 w-4" /> View Pending Packing
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<StaggerList
				className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-6"
				slow
			>
				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/packer/pending")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<ClockIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Pending to Pack
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.pendingToPack || 0}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
							onClick={() => (window.location.href = "/packer/history")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<CheckCircleIcon className="h-6 w-6 text-green-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Packed Today
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.packedToday || 0}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
							onClick={() => (window.location.href = "/packer/reports")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<TrendingUpIcon className="h-6 w-6 text-yellow-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Packing Efficiency
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.packingEfficiency?.toFixed(1)}%
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
							onClick={() => (window.location.href = "/dispatch")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<TruckIcon className="h-6 w-6 text-purple-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Ready for Shipment
									</h3>
									<p className="text-muted-foreground text-xs">
										{stats?.packedToday || 0} packages
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
							onClick={() => (window.location.href = "/driver")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<UsersIcon className="h-6 w-6 text-orange-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Active Drivers
									</h3>
									<p className="text-muted-foreground text-xs">
										{/* Placeholder for active driver count */}8 drivers
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Packing Queue */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Packing Queue
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Completed picks waiting for packing
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/packer/pending">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{/* In a real app, this would come from getPendingToPack or getPendingOrders */}
						<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
							Pending packing orders would be displayed here
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Dispatch Ready */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.4 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Dispatch Ready
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Packed orders awaiting shipment
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/dispatch">
								View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{/* Placeholder for dispatch ready data */}
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Today's Shipments
								</p>
								<p className="font-bold text-2xl">
									{stats?.packedToday || 0} packages
								</p>
							</div>
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Out for Delivery
								</p>
								<p className="font-bold text-2xl">
									{/* Placeholder for out for delivery count */}5 shipments
								</p>
							</div>
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Delivered Today
								</p>
								<p className="font-bold text-2xl">
									{/* Placeholder for delivered count */}
									12 shipments
								</p>
							</div>
							<div className="border-border/50 p-4">
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Pending Pickup
								</p>
								<p className="font-bold text-2xl">
									{/* Placeholder for pending pickup */}3 shipments
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Loading Performance */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.5 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Loading Performance
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Truck loading and dispatch metrics
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/dispatch/reports">
								View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{/* Placeholder for loading performance data */}
						<div className="space-y-3">
							<div className="flex items-center justify-between border-border/50 p-4">
								<div className="flex flex-col">
									<p className="font-medium text-xs">Loading Efficiency</p>
									<p className="font-bold text-xl">
										{stats?.packingEfficiency?.toFixed(1)}%
									</p>
								</div>
								<div className="flex items-center gap-2 text-right">
									<span className="text-muted-foreground text-sm">
										↑ 2% vs yesterday
									</span>
								</div>
							</div>
							<div className="flex items-center justify-between border-border/50 p-4">
								<div className="flex flex-col">
									<p className="font-medium text-xs">Avg. Load Time</p>
									<p className="font-bold text-xl">18 min</p>
								</div>
								<div className="flex items-center gap-2 text-right">
									<span className="text-muted-foreground text-sm">
										↓ 3 min vs yesterday
									</span>
								</div>
							</div>
							<div className="flex items-center justify-between border-border/50 p-4">
								<div className="flex flex-col">
									<p className="font-medium text-xs">Dock Utilization</p>
									<p className="font-bold text-xl">75%</p>
								</div>
								<div className="flex items-center gap-2 text-right">
									<span className="text-muted-foreground text-sm">
										→ Same as yesterday
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Recent Packing & Dispatch Activity */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.6 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg">
								Recent Packing & Dispatch Activity
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Latest packaging and shipment events
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/packer/history">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{/* Placeholder for recent packing & dispatch activity */}
						<div className="space-y-3">
							<div className="flex items-start gap-3 border-border/50 border-b pb-3">
								<div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
									<PackageIcon className="h-4 w-4" />
								</div>
								<div className="flex flex-1 flex-col gap-1">
									<p className="font-medium text-xs sm:text-sm">
										Packing Completed
									</p>
									<p className="text-muted-foreground text-xs">
										Order #PK-2026-0891 - 24 packages
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3 border-border/50 border-b pb-3">
								<div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
									<TruckIcon className="h-4 w-4" />
								</div>
								<div className="flex flex-1 flex-col gap-1">
									<p className="font-medium text-xs sm:text-sm">
										Shipment Dispatched
									</p>
									<p className="text-muted-foreground text-xs">
										TRK #TRK-2026-0934
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3 border-border/50 border-b pb-3">
								<div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
									<ActivityIcon className="h-4 w-4" />
								</div>
								<div className="flex flex-1 flex-col gap-1">
									<p className="font-medium text-xs sm:text-sm">
										Loading Issue
									</p>
									<p className="text-muted-foreground text-xs">
										TRK #TRK-2026-0933 - Weight variance
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
