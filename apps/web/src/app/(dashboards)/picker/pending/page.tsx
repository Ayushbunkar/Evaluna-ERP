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
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	PackageIcon,
	PlaySquareIcon,
	SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickerPendingPage() {
	const t = useTranslations("picker");
	const trpc = useTRPC();
	const router = useRouter();
	const {
		data: pendingPicks,
		isLoading,
		isFetching,
		error,
		refetch,
	} = trpc.picker.getPending.useQuery(
		{},
		{
			refetchInterval: 15000, // Auto-refresh every 15 seconds
			refetchIntervalInBackground: false, // Only poll when tab is active
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

	const [searchQuery, setSearchQuery] = useState("");
	const [activeStartingId, setActiveStartingId] = useState<number | null>(null);

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

	const filteredPicks = pendingPicks?.filter(
		(p) =>
			p.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()),
	);

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
						<PlaySquareIcon className="mr-2 h-4 w-4" />
						{claimNextMutation.isPending ? "Claiming Task..." : "⚡ Claim Next Task from Queue"}
					</Button>
				</div>
			</div>

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
										{pendingPicks?.length ?? 0}
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
										{pendingPicks?.filter(
											(p) => p.priority === "High" || p.priority === "Urgent",
										).length ?? 0}
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
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-green-500 opacity-30" />
							<p>{t("noPendingPicksFound")}</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("queueNo")}</TableHead>
										<TableHead>{t("orderId")}</TableHead>
										<TableHead>{t("priority")}</TableHead>
										<TableHead>{t("totalItems")}</TableHead>
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
												<div>{pick.order_id}</div>
												{pick.routeName && pick.routeName !== "N/A" && (
													<div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
														📍 {pick.routeName}
													</div>
												)}
											</TableCell>
											<TableCell>
												<span
													className={`rounded-full px-2 py-0.5 font-medium text-xs ${
														pick.priority === "High"
															? "bg-red-100 text-red-800"
															: pick.priority === "Urgent"
																? "bg-orange-100 text-orange-800"
																: "bg-gray-100 text-gray-800"
													}`}
												>
													{pick.priority}
												</span>
											</TableCell>
											<TableCell className="font-medium text-sm">
												{pick.items}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{pick.assigned_to}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{pick.waiting_since || "Just now"}
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													className="h-8 bg-blue-600 text-white hover:bg-blue-700"
													onClick={() => handleStartPick(pick.id)}
													disabled={startTaskMutation.isPending}
												>
													<PlaySquareIcon className="mr-1 h-3.5 w-3.5" />{" "}
													{startTaskMutation.isPending
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
