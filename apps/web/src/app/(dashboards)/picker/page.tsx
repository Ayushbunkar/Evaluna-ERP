"use client";

import { Badge } from "@evaluna/ui/components/badge";
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
	CalendarIcon,
	CheckSquareIcon,
	ClockIcon,
	FilterIcon,
	Loader2Icon,
	PackageCheckIcon,
	PackageIcon,
	PlaySquareIcon,
	TrendingUpIcon,
	TruckIcon,
	UserIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatQty } from "@/lib/utils";

function toDateKey(dateVal: string | Date | null | undefined): string {
	if (!dateVal) return "";
	const d = new Date(dateVal);
	if (Number.isNaN(d.getTime())) return "";
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function getTodayLocalDateStr(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function getYesterdayLocalDateStr(): string {
	const y = new Date();
	y.setDate(y.getDate() - 1);
	const yr = y.getFullYear();
	const m = String(y.getMonth() + 1).padStart(2, "0");
	const d = String(y.getDate()).padStart(2, "0");
	return `${yr}-${m}-${d}`;
}

export default function PickerDashboard() {
	const t = useTranslations();
	const trpc = useTRPC();
	const router = useRouter();

	const todayKey = useMemo(() => getTodayLocalDateStr(), []);
	const yesterdayKey = useMemo(() => getYesterdayLocalDateStr(), []);
	const [datePreset, setDatePreset] = useState<"all" | "today" | "yesterday" | "custom">("all");
	const [customDate, setCustomDate] = useState<string>(todayKey);

	const {
		data: stats,
		isLoading,
		error,
	} = trpc.picker.getDashboardStats.useQuery(
		{},
		{ refetchInterval: 15000, refetchIntervalInBackground: false },
	);

	const claimNextMutation = trpc.picker.claimNextTask.useMutation({
		onSuccess: (data) => {
			toast.success(
				data.isExisting
					? "Resuming your active picking task..."
					: "Next task claimed from queue! Opening pick execution...",
			);
			router.push(`/picker/active?id=${data.pickListId}`);
		},
		onError: (err) => {
			toast.error(err.message || "No tasks available to claim.");
		},
	});

	// Filter recent tasks by selected day
	const filteredTasks = useMemo(() => {
		if (!stats?.recentTasks) return [];
		return stats.recentTasks.filter((task: any) => {
			if (datePreset === "all") return true;
			const taskDate = task.created_at ? toDateKey(task.created_at) : "";
			if (!taskDate) return true;
			if (datePreset === "today") return taskDate === todayKey;
			if (datePreset === "yesterday") return taskDate === yesterdayKey;
			if (datePreset === "custom") return taskDate === customDate;
			return true;
		});
	}, [stats?.recentTasks, datePreset, todayKey, yesterdayKey, customDate]);

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
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 font-semibold gap-1.5"
						disabled={claimNextMutation.isPending}
						onClick={() => claimNextMutation.mutate()}
					>
						<ZapIcon className="h-4 w-4" />
						{claimNextMutation.isPending ? "Claiming..." : "Claim Next Task"}
					</Button>
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

			{/* Day-Wise Filter Bar */}
			<Card className="border-border/60 bg-card/60 shadow-xs backdrop-blur-sm">
				<CardContent className="p-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
								<FilterIcon className="h-3.5 w-3.5 text-blue-600" />
								Filter Day:
							</span>
							<Button
								type="button"
								size="sm"
								variant={datePreset === "all" ? "default" : "outline"}
								className={
									datePreset === "all"
										? "bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs font-medium"
										: "h-8 text-xs font-medium"
								}
								onClick={() => setDatePreset("all")}
							>
								All Dates
							</Button>
							<Button
								type="button"
								size="sm"
								variant={datePreset === "today" ? "default" : "outline"}
								className={
									datePreset === "today"
										? "bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs font-medium"
										: "h-8 text-xs font-medium"
								}
								onClick={() => setDatePreset("today")}
							>
								<CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
								Today
							</Button>
							<Button
								type="button"
								size="sm"
								variant={datePreset === "yesterday" ? "default" : "outline"}
								className={
									datePreset === "yesterday"
										? "bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs font-medium"
										: "h-8 text-xs font-medium"
								}
								onClick={() => setDatePreset("yesterday")}
							>
								Yesterday
							</Button>

							<div className="flex items-center gap-1.5 pl-1">
								<span className="text-xs text-muted-foreground">Custom:</span>
								<input
									type="date"
									value={customDate}
									onChange={(e) => {
										if (e.target.value) {
											setCustomDate(e.target.value);
											setDatePreset("custom");
										}
									}}
									className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
								/>
							</div>
						</div>

						{/* Active Filter Indicator */}
						<div className="flex items-center gap-2">
							<Badge
								variant="secondary"
								className="text-xs font-normal border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 px-2.5 py-1"
							>
								<CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
								{datePreset === "all" && "Showing: All Dates"}
								{datePreset === "today" && `Showing: Today (${todayKey})`}
								{datePreset === "yesterday" && `Showing: Yesterday (${yesterdayKey})`}
								{datePreset === "custom" && `Showing: Selected Date (${customDate})`}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

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
									<p className="text-[11px] text-muted-foreground flex items-center gap-1">
										<span>Open pending queue</span>
										<ArrowRightIcon className="h-3 w-3" />
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
									<p className="text-[11px] text-muted-foreground flex items-center gap-1">
										<span>Continue active task</span>
										<ArrowRightIcon className="h-3 w-3" />
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
							onClick={() => (window.location.href = "/picker/van-stock")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<TruckIcon className="h-6 w-6 text-amber-500" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Van Stock Picking
									</h3>
									<p className="font-bold text-2xl text-amber-600 dark:text-amber-400">
										Active Vans
									</p>
									<p className="text-[11px] text-muted-foreground flex items-center gap-1">
										<span>Pick vehicle manifests</span>
										<ArrowRightIcon className="h-3 w-3" />
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
									<p className="text-[11px] text-muted-foreground flex items-center gap-1">
										<span>View pick logs</span>
										<ArrowRightIcon className="h-3 w-3" />
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
								{t("picker.latestAssignmentsCompletions")} • {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"} shown
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
						) : !filteredTasks || filteredTasks.length === 0 ? (
							<div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground text-xs sm:text-sm">
								<PackageIcon className="h-8 w-8 text-blue-500 opacity-30" />
								<span>
									{datePreset === "all"
										? t("common.noItemFound")
										: `No tasks found for ${
												datePreset === "today"
													? `Today (${todayKey})`
													: datePreset === "yesterday"
														? `Yesterday (${yesterdayKey})`
														: `Date (${customDate})`
											}`}
								</span>
								{datePreset !== "all" && (
									<button
										type="button"
										onClick={() => setDatePreset("all")}
										className="text-xs text-blue-600 hover:underline font-medium"
									>
										Show All Dates
									</button>
								)}
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
											<TableHead className="text-right">Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredTasks.map((tItem: any) => (
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
													{formatQty(tItem.items)} {Number(formatQty(tItem.items)) === 1 ? "Product" : "Products"}
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{tItem.area}
												</TableCell>
												<TableCell>
													<span
														className={`rounded-full px-2 py-0.5 font-medium text-xs capitalize ${
															tItem.status === "completed"
																? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
																: tItem.status === "picking"
																	? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
																	: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
														}`}
													>
														{tItem.status}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													<div>{tItem.time || "Recently"}</div>
													{tItem.created_at && (
														<div className="text-[10px] text-muted-foreground/70">
															{toDateKey(tItem.created_at)}
														</div>
													)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														size="sm"
														variant={tItem.status === "completed" ? "ghost" : "default"}
														className={`h-7 text-xs ${
															tItem.status === "completed"
																? "text-muted-foreground"
																: "bg-blue-600 text-white hover:bg-blue-700"
														}`}
														asChild
													>
														<Link
															href={
																tItem.numericId
																	? `/picker/active?id=${tItem.numericId}`
																	: "/picker/pending"
															}
														>
															<PlaySquareIcon className="mr-1 h-3 w-3" />
															{tItem.status === "completed" ? "View" : "Pick"}
														</Link>
													</Button>
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