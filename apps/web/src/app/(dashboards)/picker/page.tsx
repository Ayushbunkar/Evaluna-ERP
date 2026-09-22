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
	Loader2Icon,
	PackageIcon,
	PlaySquareIcon,
	TrendingUpIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickerDashboard() {
	const t = useTranslations();
	const trpc = useTRPC();
	const {
		data: stats,
		isLoading,
		error,
	} = trpc.picker.getDashboardStats.useQuery(
		{},
		{ refetchInterval: 15000, refetchIntervalInBackground: false },
	);

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			{/* Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						{t("picker.pickerDashboard")}
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						{t("picker.orderPickingTaskManagement")}
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button
						className="bg-blue-600 text-white text-xs shadow-sm hover:bg-blue-700 sm:text-sm"
						asChild
					>
						<Link href="/picker/active">
							<PlaySquareIcon className="mr-2 h-4 w-4" />{" "}
							{t("picker.startPicking")}
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
										{t("picker.pendingPicks")}
									</h3>
									<p className="font-bold text-2xl text-blue-600 dark:text-blue-400">
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
										{t("picker.assignedToday")}
									</h3>
									<p className="font-bold text-2xl text-green-600 dark:text-green-400">
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
										{t("picker.completedToday")}
									</h3>
									<p className="font-bold text-2xl text-purple-600 dark:text-purple-400">
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
										{t("picker.totalItemsPicked")}
									</h3>
									<p className="font-bold text-2xl text-yellow-600 dark:text-yellow-400">
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
							<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
								<PackageIcon className="h-5 w-5 text-blue-600" />
								{t("picker.recentPickingTasks")}
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								{t("picker.latestAssignmentsCompletions")}
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/picker/pending">
								{t("picker.viewAll")}{" "}
								<ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="pt-1 sm:pt-2">
						{isLoading ? (
							<div className="flex h-32 items-center justify-center gap-2 text-muted-foreground text-xs">
								<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" />{" "}
								{t("common.loading")}
							</div>
						) : error ? (
							<div className="flex h-32 items-center justify-center text-destructive text-xs">
								{error.message || t("error.somethingWentWrong")}
							</div>
						) : !stats?.recentTasks || stats.recentTasks.length === 0 ? (
							<div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground text-xs sm:text-sm">
								<PackageIcon className="h-8 w-8 text-blue-500 opacity-30" />
								<span>{t("common.noItemFound")}</span>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("picker.picklistId")}</TableHead>
											<TableHead>{t("picker.orderId")}</TableHead>
											<TableHead>{t("picker.totalItems")}</TableHead>
											<TableHead>{t("picker.area")}</TableHead>
											<TableHead>{t("common.status")}</TableHead>
											<TableHead>{t("picker.createdTime")}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{stats.recentTasks.map((tItem) => (
											<TableRow key={tItem.id} className="hover:bg-muted/50">
												<TableCell className="font-mono font-semibold text-xs">
													{tItem.id}
												</TableCell>
												<TableCell className="font-semibold text-sm">
													<div className="font-bold">{tItem.order}</div>
													{tItem.customerName && tItem.customerName !== "N/A" && (
														<div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
															<UserIcon className="h-3 w-3" /> {tItem.customerName}
														</div>
													)}
												</TableCell>
												<TableCell className="font-medium text-sm">
													{tItem.items} {t("driver.orderItems")}
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{tItem.area}
												</TableCell>
												<TableCell>
													<span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 text-xs capitalize dark:bg-blue-900/30 dark:text-blue-400">
														{tItem.status}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{tItem.time || "Recently"}
												</TableCell>
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
