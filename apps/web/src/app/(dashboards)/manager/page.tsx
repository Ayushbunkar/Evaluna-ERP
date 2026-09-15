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
	AlertTriangleIcon,
	CalendarDaysIcon,
	CheckCircle2Icon,
	ChevronRightIcon,
	ClockIcon,
	FileCheckIcon,
	HistoryIcon,
	IndianRupeeIcon,
	Loader2Icon,
	PlayIcon,
	TruckIcon,
	UsersIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ManagerDashboard() {
	const t = useTranslations("manager");
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	// Queries Sourced Entirely From Real DB
	const { data: stats, isLoading: statsLoading } =
		trpc.manager.getDashboardStats.useQuery();
	const { data: employees = [], isLoading: employeesLoading } =
		trpc.manager.getEmployees.useQuery();
	const { data: pendingApprovals = [], isLoading: approvalsLoading } =
		trpc.manager.getApprovals.useQuery({ status: "pending" });
	const { data: exceptions = [], isLoading: exceptionsLoading } =
		trpc.manager.getExceptions.useQuery();
	const { data: workload = [] } = trpc.manager.getWorkload.useQuery();
	const { data: activity = [] } = trpc.manager.getActivity.useQuery();

	// Mutations Sourced Entirely From Real DB
	const reviewApprovalMutation = trpc.manager.reviewApproval.useMutation({
		onSuccess: () => {
			toast.success("Approval request processed successfully");
			utils.manager.getDashboardStats.invalidate();
			utils.manager.getApprovals.invalidate();
			utils.manager.getLeaveRequests.invalidate();
			utils.manager.getExpenses.invalidate();
		},
		onError: (err) => {
			toast.error(`Approval action failed: ${err.message}`);
		},
	});

	const handleAction = async (
		approvalId: number,
		decision: "approved" | "rejected",
	) => {
		await reviewApprovalMutation.mutateAsync({
			approvalId,
			decision,
		});
	};

	const isPageLoading =
		statsLoading || employeesLoading || approvalsLoading || exceptionsLoading;

	if (isPageLoading) {
		return (
			<div className="flex h-[80vh] items-center justify-center">
				<Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
			</div>
		);
	}

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						{t("managerControlCenter")}
					</h1>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						{t("managerControlSub")}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link href="/manager/activity">{t("teamActivityLog")}</Link>
					</Button>
					<Button size="sm" asChild>
						<Link href="/manager/tasks">{t("createTeamTask")}</Link>
					</Button>
				</div>
			</div>

			{/* KPI Cards Grid */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
				<Card className="shadow-sm">
					<CardContent className="flex items-center gap-3 p-4">
						<div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40">
							<UsersIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
								{t("totalTeam")}
							</p>
							<h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
								{stats?.totalEmployees ?? 0}
							</h3>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-green-500 shadow-sm">
					<CardContent className="flex items-center gap-3 p-4">
						<div className="rounded-xl bg-green-50 p-2.5 text-green-600 dark:bg-green-950/40">
							<ClockIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
								{t("presentToday")}
							</p>
							<h3 className="font-bold text-green-600 text-lg">
								{stats?.presentToday ?? 0}
							</h3>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-amber-500 shadow-sm">
					<CardContent className="flex items-center gap-3 p-4">
						<div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40">
							<FileCheckIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
								{t("pendingApprovals")}
							</p>
							<h3 className="font-bold text-amber-600 text-lg">
								{stats?.pendingApprovals ?? 0}
							</h3>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-emerald-500 shadow-sm">
					<CardContent className="flex items-center gap-3 p-4">
						<div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40">
							<IndianRupeeIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
								{t("driverCashColl")}
							</p>
							<h3 className="font-bold text-emerald-600 text-lg">
								₹{(stats?.driverCashCollected ?? 0).toLocaleString("en-IN")}
							</h3>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-red-500 shadow-sm">
					<CardContent className="flex items-center gap-3 p-4">
						<div className="rounded-xl bg-red-50 p-2.5 text-red-600 dark:bg-red-950/40">
							<AlertTriangleIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
								{t("overdueTasks")}
							</p>
							<h3 className="font-bold text-lg text-red-600">
								{stats?.overdueTasks ?? 0}
							</h3>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Left / Main operational area */}
				<div className="space-y-6 md:col-span-2">
					{/* Action Queue approvals */}
					<Card className="shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between border-b pb-3">
							<div>
								<CardTitle className="flex items-center gap-1.5 font-bold text-sm">
									<FileCheckIcon className="h-4.5 w-4.5 text-blue-500" />
									{t("actionApprovalsInbox")}
								</CardTitle>
								<CardDescription className="text-xs">
									{t("actionApprovalsInboxSub")}
								</CardDescription>
							</div>
							<Button size="sm" variant="ghost" asChild>
								<Link
									href="/manager/approvals"
									className="flex items-center font-semibold text-blue-600 text-xs"
								>
									{t("goToInbox")}{" "}
									<ChevronRightIcon className="ml-0.5 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							{pendingApprovals.length > 0 ? (
								<div className="divide-y">
									{pendingApprovals.slice(0, 3).map((app) => (
										<div
											key={app.id}
											className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center"
										>
											<div>
												<div className="flex items-center gap-2">
													<Badge className="border border-amber-200 bg-amber-50 font-bold text-[10px] text-amber-700 capitalize tracking-wide">
														{app.reference_type}
													</Badge>
													<span className="font-bold text-slate-900 text-xs">
														{t("requestId", { id: app.reference_id })}
													</span>
												</div>
												<p className="mt-1 text-slate-500 text-xs">
													{t("requestedByStaff", { id: app.requested_by })}
												</p>
											</div>
											<div className="flex w-full gap-2 sm:w-auto">
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleAction(app.id, "rejected")}
													disabled={reviewApprovalMutation.isPending}
													className="h-7 flex-1 border-red-200 text-[11px] text-red-600 hover:bg-red-50 sm:flex-initial"
												>
													{t("reject")}
												</Button>
												<Button
													size="sm"
													onClick={() => handleAction(app.id, "approved")}
													disabled={reviewApprovalMutation.isPending}
													className="h-7 flex-1 bg-blue-600 text-[11px] hover:bg-blue-700 sm:flex-initial"
												>
													{t("approve")}
												</Button>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="py-10 text-center text-slate-400 text-xs">
									<CheckCircle2Icon className="mx-auto mb-2 h-8 w-8 text-green-500" />
									{t("noPendingApprovals")}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Team Members Status */}
					<Card className="shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between border-b pb-3">
							<div>
								<CardTitle className="flex items-center gap-1.5 font-bold text-sm">
									<UsersIcon className="h-4.5 w-4.5 text-blue-500" />
									{t("teamStatusOverview")}
								</CardTitle>
								<CardDescription className="text-xs">
									{t("teamStatusOverviewSub")}
								</CardDescription>
							</div>
							<Button size="sm" variant="ghost" asChild>
								<Link
									href="/manager/team"
									className="flex items-center font-semibold text-blue-600 text-xs"
								>
									{t("fullTeam")}{" "}
									<ChevronRightIcon className="ml-0.5 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead>
										<tr className="border-b bg-slate-50/50 text-slate-500">
											<th className="p-3 font-semibold">{t("nameCol")}</th>
											<th className="p-3 font-semibold">
												{t("systemRoleCol")}
											</th>
											<th className="p-3 font-semibold">
												{t("workloadProfileCol")}
											</th>
											<th className="p-3 text-right font-semibold">
												{t("detailsCol")}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{employees.slice(0, 5).map((emp) => {
											const wl = workload.find((w) => w.id === emp.id) || {
												assigned: 0,
												overdue: 0,
											};
											return (
												<tr key={emp.id} className="hover:bg-slate-50/40">
													<td className="p-3 font-bold text-slate-900">
														{emp.name}
													</td>
													<td className="p-3 font-medium text-slate-500 capitalize">
														{emp.role}
													</td>
													<td className="p-3">
														<span className="font-bold text-[11px] text-blue-600">
															{t("tasksCount", { count: wl.assigned })}
														</span>
														{wl.overdue > 0 && (
															<span className="ml-2 font-semibold text-[10px] text-red-600">
																{t("overdueTasksCount", { count: wl.overdue })}
															</span>
														)}
													</td>
													<td className="p-3 text-right">
														<Button size="sm" variant="ghost" asChild>
															<Link href={`/manager/team?detail=${emp.id}`}>
																{t("detailsCol")}
															</Link>
														</Button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right column exceptions & logs */}
				<div className="space-y-6">
					{/* Exceptions Center */}
					<Card className="border-l-4 border-l-red-500 shadow-sm">
						<CardHeader className="border-b pb-3">
							<CardTitle className="flex items-center gap-1.5 font-bold text-red-600 text-sm">
								<AlertTriangleIcon className="h-4.5 w-4.5" />
								{t("urgentExceptionsCenter")}
							</CardTitle>
							<CardDescription className="text-xs">
								{t("urgentExceptionsCenterSub")}
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							{exceptions.length > 0 ? (
								<div className="divide-y">
									{exceptions.slice(0, 3).map((ex) => (
										<div key={ex.id} className="flex items-start gap-2.5 p-3">
											<AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
											<div>
												<p className="font-bold text-slate-900 text-xs">
													{ex.title}
												</p>
												<p className="mt-0.5 text-[10px] text-slate-500">
													{ex.description}
												</p>
												<Badge className="mt-1 border border-red-200 bg-red-50 font-semibold text-[9px] text-red-700 uppercase">
													{ex.severity}
												</Badge>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="py-8 text-center text-slate-400 text-xs">
									{t("allSystemsNormal")}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Activity log */}
					<Card className="shadow-sm">
						<CardHeader className="border-b pb-3">
							<CardTitle className="flex items-center gap-1.5 font-bold text-sm">
								<HistoryIcon className="h-4.5 w-4.5 text-blue-500" />
								{t("liveTeamTimeline")}
							</CardTitle>
							<CardDescription className="text-xs">
								{t("liveTeamTimelineSub")}
							</CardDescription>
						</CardHeader>
						<CardContent className="h-[240px] space-y-3 overflow-y-auto p-4">
							{activity.slice(0, 5).map((act) => (
								<div
									key={act.id}
									className="border-slate-200 border-l-2 pb-1 pl-3"
								>
									<span className="block font-bold text-[10px] text-blue-600">
										{act.action}
									</span>
									<span className="mt-0.5 block text-slate-600 text-xs">
										{t("entityId", {
											type: act.entity_type,
											id: act.entity_id,
										})}
									</span>
									<span className="mt-0.5 block text-[9px] text-slate-400">
										{new Date(act.created_at || "").toLocaleString()}
									</span>
								</div>
							))}
							{activity.length === 0 && (
								<div className="py-8 text-center text-slate-400 text-xs">
									{t("noTeamActivityLogged")}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</PageTransition>
	);
}
