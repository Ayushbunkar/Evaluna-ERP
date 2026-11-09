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
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
	FilterIcon,
	Loader2Icon,
	MapPinIcon,
	PackageIcon,
	PlaySquareIcon,
	SearchIcon,
	SparklesIcon,
	UserIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

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

export default function PickerPendingPage() {
	const t = useTranslations("picker");
	const trpc = useTRPC();
	const router = useRouter();

	const todayKey = useMemo(() => getTodayLocalDateStr(), []);
	const yesterdayKey = useMemo(() => getYesterdayLocalDateStr(), []);
	const [datePreset, setDatePreset] = useState<"all" | "today" | "yesterday" | "custom">("all");
	const [customDate, setCustomDate] = useState<string>(todayKey);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeStartingId, setActiveStartingId] = useState<number | null>(null);

	const {
		data: pendingPicks,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.picker.getPending.useQuery(
		{
			datePreset,
			date: datePreset === "custom" ? customDate : undefined,
		},
		{
			refetchInterval: 15000,
			refetchIntervalInBackground: false,
		},
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

	const startTaskMutation = trpc.warehouse.startPickingTask.useMutation({
		onSuccess: (_, variables) => {
			toast.success(
				"Picking task started successfully! Taking you to execution screen...",
			);
			router.push(`/picker/active?id=${variables.pickListId}`);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to start picking task.");
		},
	});

	const handleStartPick = (pickListId: number) => {
		setActiveStartingId(pickListId);
		startTaskMutation.mutate({ pickListId });
	};

	// Client-side date filter safety check
	const dateFilteredPicks = useMemo(() => {
		if (!pendingPicks) return [];
		return pendingPicks.filter((p: any) => {
			if (datePreset === "all") return true;
			const pDate = p.created_at ? toDateKey(p.created_at) : "";
			if (!pDate) return true;
			if (datePreset === "today") return pDate === todayKey;
			if (datePreset === "yesterday") return pDate === yesterdayKey;
			if (datePreset === "custom") return pDate === customDate;
			return true;
		});
	}, [pendingPicks, datePreset, todayKey, yesterdayKey, customDate]);

	const filteredPicks = useMemo(() => {
		if (!dateFilteredPicks) return [];
		const q = searchQuery.toLowerCase().trim();
		if (!q) return dateFilteredPicks;
		return dateFilteredPicks.filter(
			(p: any) =>
				(p.order_id && p.order_id.toLowerCase().includes(q)) ||
				(p.assigned_to && p.assigned_to.toLowerCase().includes(q)) ||
				(p.customerName && p.customerName.toLowerCase().includes(q)) ||
				(p.routeName && p.routeName.toLowerCase().includes(q)),
		);
	}, [dateFilteredPicks, searchQuery]);

	const highPriorityCount = useMemo(() => {
		return (
			dateFilteredPicks.filter(
				(p: any) => p.priority === "High" || p.priority === "Urgent",
			).length || 0
		);
	}, [dateFilteredPicks]);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<ClockIcon className="h-7 w-7 text-blue-600" />
						{t("pendingPickTasks")}
					</h1>
					<div className="flex items-center gap-2">
						<p className="text-muted-foreground text-sm">
							{t("orderPicklistsQueued")}
						</p>
						<span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
							<span
								className={`h-1.5 w-1.5 rounded-full ${isFetching ? "animate-ping bg-green-500" : "bg-green-500"}`}
							/>
							{t("live")}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isFetching}
						className="gap-1.5"
					>
						<Loader2Icon
							className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
						/>
						{isFetching ? t("refreshing") : t("refresh")}
					</Button>
					<Button
						className="bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm"
						disabled={claimNextMutation.isPending}
						onClick={() => claimNextMutation.mutate()}
					>
						<ZapIcon className="mr-2 h-4 w-4" />
						{claimNextMutation.isPending ? "Claiming Task..." : "Claim Next Task from Queue"}
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
								<div className="relative">
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
							<span className="text-xs font-semibold text-muted-foreground">
								({dateFilteredPicks.length} {dateFilteredPicks.length === 1 ? "task" : "tasks"})
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Stats Grid */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										{t("totalPendingPicks")}
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{dateFilteredPicks.length}
									</p>
									<p className="text-[11px] text-blue-600/80 mt-0.5">
										{datePreset === "all" ? "Across all dates" : "For selected date filter"}
									</p>
								</div>
								<ClockIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-sm text-yellow-700 dark:text-yellow-400">
										{t("highPriorityOrders")}
									</p>
									<p className="font-bold text-3xl text-yellow-800 dark:text-yellow-300">
										{highPriorityCount}
									</p>
									<p className="text-[11px] text-yellow-700/80 mt-0.5">
										Requires urgent dispatch
									</p>
								</div>
								<PackageIcon className="h-8 w-8 text-yellow-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-green-700 text-sm dark:text-green-400">
										{t("queueStatus")}
									</p>
									<p className="font-bold text-green-800 text-xl dark:text-green-300">
										{t("activeQueue")}
									</p>
									<p className="text-[11px] text-green-700/80 mt-0.5">
										Ready to pick & pack
									</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<ClockIcon className="h-5 w-5 text-blue-600" />
							{t("pendingPickTaskQueue")}
						</CardTitle>
						<CardDescription>
							{t("allPickingAssignmentsQueued")}
						</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder={t("searchOrderOrStaff")}
							className="w-full rounded-md border border-input bg-background py-1.5 pr-3 pl-9 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" />{" "}
							{t("loadingPendingPicks")}
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading pending picks"}
						</div>
					) : !filteredPicks || filteredPicks.length === 0 ? (
						<div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-green-500 opacity-40 mb-1" />
							<p className="font-semibold text-foreground text-sm">
								{dateFilteredPicks.length === 0
									? `No pending pick tasks found for ${
											datePreset === "all"
												? "any date"
												: datePreset === "today"
													? `Today (${todayKey})`
													: datePreset === "yesterday"
														? `Yesterday (${yesterdayKey})`
														: `Date (${customDate})`
										}`
									: "No pick tasks matching your search query"}
							</p>
							<p className="text-xs text-muted-foreground">
								{datePreset !== "all" ? (
									<button
										type="button"
										onClick={() => setDatePreset("all")}
										className="text-blue-600 hover:underline font-medium"
									>
										Click here to view All Dates
									</button>
								) : (
									"All queued orders have been picked!"
								)}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("queueNo")}</TableHead>
										<TableHead>{t("orderId")}</TableHead>
										<TableHead>Customer Name</TableHead>
										<TableHead>{t("priority")}</TableHead>
										<TableHead>Total Products</TableHead>
										<TableHead>{t("assignedPicker")}</TableHead>
										<TableHead>{t("waitingSince")}</TableHead>
										<TableHead className="text-right">
											{t("startPick")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPicks.map((pick) => (
										<TableRow key={pick.queue_no} className="hover:bg-muted/50">
											<TableCell className="font-mono font-semibold text-xs">
												#{pick.queue_no}
											</TableCell>
											<TableCell className="font-semibold text-sm">
												<div className="font-bold">{pick.order_id}</div>
												{pick.routeName && pick.routeName !== "N/A" && (
													<div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
														<MapPinIcon className="h-3 w-3" /> {pick.routeName}
													</div>
												)}
											</TableCell>
											<TableCell className="font-medium text-xs text-foreground">
												<div className="flex items-center gap-1.5">
													<UserIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
													<span className="font-semibold text-gray-900 dark:text-gray-100">
														{pick.customerName && pick.customerName !== "N/A" ? pick.customerName : "Customer"}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<span
													className={`rounded-full px-2 py-0.5 font-medium text-xs ${
														pick.priority === "High"
															? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
															: pick.priority === "Urgent"
																? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
																: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
													}`}
												>
													{pick.priority}
												</span>
											</TableCell>
											<TableCell className="font-medium text-sm">
												<div className="font-bold text-gray-900 dark:text-gray-100">
													{pick.products_count ?? pick.items} {pick.products_count === 1 ? "product" : "products"}
												</div>
												<div className="text-[11px] text-muted-foreground font-medium">
													({pick.items} {pick.items === 1 ? "unit" : "units"} total)
												</div>
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{pick.assigned_to}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												<div>{pick.waiting_since || "Just now"}</div>
												{pick.created_at && (
													<div className="text-[10px] text-muted-foreground/70">
														{toDateKey(pick.created_at)}
													</div>
												)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													className="h-8 bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
													onClick={() => handleStartPick(pick.id)}
													disabled={startTaskMutation.isPending && activeStartingId === pick.id}
												>
													<PlaySquareIcon className="mr-1 h-3.5 w-3.5" />{" "}
													{startTaskMutation.isPending && activeStartingId === pick.id
														? t("starting")
														: t("startPick")}
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
		</PageTransition>
	);
}