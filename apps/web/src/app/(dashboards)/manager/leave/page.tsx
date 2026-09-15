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
	CalendarIcon,
	CheckCircle2Icon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function LeavePage() {
	const t = useTranslations("manager");
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const { data: leavesList = [], isLoading } =
		trpc.manager.getLeaveRequests.useQuery();

	const reviewApprovalMutation = trpc.manager.reviewApproval.useMutation({
		onSuccess: () => {
			toast.success("Leave decision logged successfully!");
			utils.manager.getLeaveRequests.invalidate();
			utils.manager.getDashboardStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Decision failed: ${err.message}`);
		},
	});

	const handleAction = async (
		id: number,
		decision: "approved" | "rejected",
	) => {
		await reviewApprovalMutation.mutateAsync({
			approvalId: id,
			decision,
		});
	};

	return (
		<PageTransition className="space-y-6">
			<div>
				<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
					<CalendarIcon className="h-6 w-6 text-blue-600" />
					{t("leaveManagementWorkspace")}
				</h2>
				<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
					{t("leaveManagementSub")}
				</p>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						{t("timeOffRequestsQueue")}
					</CardTitle>
					<CardDescription>{t("timeOffRequestsQueueSub")}</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead>
									<tr className="border-b text-slate-500">
										<th className="p-3 font-semibold">
											{t("requestIdHeader", { id: "" }).replace(" #", "")}
										</th>
										<th className="p-3 font-semibold">Employee</th>
										<th className="p-3 font-semibold">Leave Details</th>
										<th className="p-3 font-semibold">Reason</th>
										<th className="p-3 font-semibold">{t("statusHeader")}</th>
										<th className="p-3 text-right font-semibold">
											{t("actionsCol")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{leavesList.map((leave: any) => (
										<tr key={leave.id} className="hover:bg-slate-50/40">
											<td className="p-3 font-bold text-slate-900">
												LEAVE-#{leave.reference_id}
											</td>
											<td className="p-3 font-medium">
												<div className="flex flex-col">
													<span>{leave.emp_name || "Unknown"}</span>
													<span className="text-muted-foreground text-xs">
														{t("staffIdRef", { id: leave.requested_by })}
													</span>
												</div>
											</td>
											<td className="p-3 font-medium">
												<div className="flex flex-col gap-1">
													<Badge
														variant="outline"
														className="w-fit text-[10px]"
													>
														{leave.leave_type || "N/A"}
													</Badge>
													<span className="text-muted-foreground text-xs">
														{leave.start_date
															? new Date(leave.start_date).toLocaleDateString()
															: ""}{" "}
														-{" "}
														{leave.end_date
															? new Date(leave.end_date).toLocaleDateString()
															: ""}
													</span>
												</div>
											</td>
											<td className="max-w-[200px] truncate p-3 text-muted-foreground">
												{leave.reason || "N/A"}
											</td>
											<td className="p-3">
												<Badge
													className="text-[10px] capitalize"
													variant={
														leave.status === "approved" ? "default" : "outline"
													}
												>
													{leave.status}
												</Badge>
											</td>
											<td className="p-3 text-right">
												{leave.status === "pending" && (
													<div className="flex justify-end gap-2">
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleAction(leave.id, "rejected")}
															disabled={reviewApprovalMutation.isPending}
															className="h-7 border-red-200 text-[10px] text-red-600 hover:bg-red-50"
														>
															<XCircleIcon className="mr-1 h-3.5 w-3.5" />{" "}
															{t("reject")}
														</Button>
														<Button
															size="sm"
															onClick={() => handleAction(leave.id, "approved")}
															disabled={reviewApprovalMutation.isPending}
															className="h-7 bg-blue-600 text-[10px] hover:bg-blue-700"
														>
															<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />{" "}
															{t("approve")}
														</Button>
													</div>
												)}
											</td>
										</tr>
									))}
									{leavesList.length === 0 && (
										<tr>
											<td
												colSpan={5}
												className="py-12 text-center text-slate-400 text-xs"
											>
												{t("noLeaveRequestsLogged")}
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
