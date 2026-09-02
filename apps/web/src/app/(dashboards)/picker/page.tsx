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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	ActivityIcon,
	ArrowRightIcon,
	CalendarCheckIcon,
	CheckSquareIcon,
	ClockIcon,
	PackageIcon,
	PlaySquareIcon,
	TrendingUpIcon,
	Loader2Icon,
} from "lucide-react";
import Link from "next/link";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickerDashboard() {
	const trpc = useTRPC();
	const { data: stats, isLoading, error } = trpc.picker.getDashboardStats.useQuery({});

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			{/* Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Picker Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Order picking, task management, and warehouse fulfillment
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button className="text-xs shadow-sm sm:text-sm bg-blue-600 hover:bg-blue-700 text-white" asChild>
						<Link href="/picker/active">
							<PlaySquareIcon className="mr-2 h-4 w-4" /> Start Picking
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<StaggerList
				className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
				slow
			>
				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/picker/pending")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<ClockIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Pending Picks
									</h3>
									<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
										{stats?.pending || 0}
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
							onClick={() => (window.location.href = "/picker/active")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<CalendarCheckIcon className="h-6 w-6 text-green-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Assigned Today
									</h3>
									<p className="text-2xl font-bold text-green-600 dark:text-green-400">
										{stats?.assignedToday || 0}
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
							onClick={() => (window.location.href = "/picker/completed")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<CheckSquareIcon className="h-6 w-6 text-purple-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Completed Today
									</h3>
									<p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
										{stats?.completed || 0}
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
							onClick={() => (window.location.href = "/picker/reports")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<TrendingUpIcon className="h-6 w-6 text-yellow-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Total Items Picked
									</h3>
									<p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
										{stats?.totalItemsPicked || 0}
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Recent Picking Tasks Table */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
						<div className="space-y-0.5">
							<CardTitle className="text-base sm:text-lg flex items-center gap-2">
								<PackageIcon className="h-5 w-5 text-blue-600" />
								Recent Picking Tasks
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Latest picking assignments and completions
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/picker/pending">
								View All <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{isLoading ? (
							<div className="flex h-32 items-center justify-center gap-2 text-muted-foreground text-xs">
								<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" /> Loading task queue...
							</div>
						) : error ? (
							<div className="flex h-32 items-center justify-center text-destructive text-xs">
								{error.message || "Error loading picking tasks"}
							</div>
						) : !stats?.recentTasks || stats.recentTasks.length === 0 ? (
							<div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground text-xs sm:text-sm">
								<PackageIcon className="h-8 w-8 opacity-30 text-blue-500" />
								<span>No recent picking tasks logged yet</span>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Picklist ID</TableHead>
											<TableHead>Order Ref</TableHead>
											<TableHead>Total Items</TableHead>
											<TableHead>Area</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Created Time</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{stats.recentTasks.map((t) => (
											<TableRow key={t.id} className="hover:bg-muted/50">
												<TableCell className="font-mono text-xs font-semibold">{t.id}</TableCell>
												<TableCell className="font-semibold text-sm">{t.order}</TableCell>
												<TableCell className="text-sm font-medium">{t.items} items</TableCell>
												<TableCell className="text-xs text-muted-foreground">{t.area}</TableCell>
												<TableCell>
													<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
														{t.status}
													</span>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">{t.time || "Recently"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
