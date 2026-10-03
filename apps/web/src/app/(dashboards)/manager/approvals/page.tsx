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
	CheckCircle2Icon,
	FileCheckIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ApprovalsPage() {
	const t = useTranslations("manager");
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const { data: pending = [], isLoading } = trpc.manager.getApprovals.useQuery({
		status: "pending",
	});
	const { data: approved = [] } = trpc.manager.getApprovals.useQuery({
		status: "approved",
	});

	const reviewApprovalMutation = trpc.manager.reviewApproval.useMutation({
		onSuccess: () => {
			toast.success("Approval action logged successfully!");
			utils.manager.getApprovals.invalidate();
			utils.manager.getDashboardStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Approval action failed: ${err.message}`);
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
					<FileCheckIcon className="h-6 w-6 text-blue-600" />
					{t("approvalInboxTitle")}
				</h2>
				<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
					{t("approvalInboxSub")}
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Pending Approvals */}
				<Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-950">
					<CardHeader className="border-slate-100 border-b bg-slate-50/70 pb-3 dark:border-slate-800 dark:bg-slate-900/50">
						<CardTitle className="font-bold text-slate-900 text-sm dark:text-slate-100">
							{t("pendingReviewHeader", { count: pending.length })}
						</CardTitle>
						<CardDescription className="text-slate-500 text-xs dark:text-slate-400">
							{t("pendingReviewSub")}
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{isLoading ? (
							<div className="flex justify-center py-12">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : pending.length > 0 ? (
							<div className="divide-y divide-slate-100 dark:divide-slate-800">
								{pending.map((app) => (
									<div key={app.id} className="space-y-3 p-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Badge className="border border-amber-200 bg-amber-50 font-bold text-[10px] text-amber-700 capitalize tracking-wide dark:border-amber-800/50 dark:bg-amber-950/60 dark:text-amber-300">
													{app.reference_type}
												</Badge>
												<span className="font-bold text-slate-900 text-xs dark:text-slate-100">
													ID #{app.reference_id}
												</span>
											</div>
											<span className="text-[10px] text-slate-400 dark:text-slate-500">
												{t("createdLabel", {
													date: app.created_at
														? new Date(app.created_at).toLocaleDateString()
														: "",
												})}
											</span>
										</div>
										<p className="text-slate-600 text-xs dark:text-slate-400">
											{t("requestedByStaffMember", { id: app.requested_by })}
										</p>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleAction(app.id, "rejected")}
												disabled={reviewApprovalMutation.isPending}
												className="h-7 flex-1 border-red-200 text-[11px] text-red-600 hover:bg-red-50 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/50"
											>
												<XCircleIcon className="mr-1 h-3.5 w-3.5" />{" "}
												{t("reject")}
											</Button>
											<Button
												size="sm"
												onClick={() => handleAction(app.id, "approved")}
												disabled={reviewApprovalMutation.isPending}
												className="h-7 flex-1 bg-blue-600 text-[11px] text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
											>
												<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />{" "}
												{t("approve")}
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="py-12 text-center text-slate-400 text-xs dark:text-slate-500">
								{t("noPendingRequestsGreatJob")}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Recently Approved / History */}
				<Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-950">
					<CardHeader className="border-slate-100 border-b bg-slate-50/70 pb-3 dark:border-slate-800 dark:bg-slate-900/50">
						<CardTitle className="font-bold text-slate-900 text-sm dark:text-slate-100">
							{t("approvedHistoryHeader", { count: approved.length })}
						</CardTitle>
						<CardDescription className="text-slate-500 text-xs dark:text-slate-400">
							{t("approvedHistorySub")}
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{approved.length > 0 ? (
							<div className="divide-y divide-slate-100 dark:divide-slate-800">
								{approved.slice(0, 5).map((app) => (
									<div
										key={app.id}
										className="flex items-center justify-between p-4"
									>
										<div>
											<div className="flex items-center gap-2">
												<Badge
													variant="outline"
													className="border-slate-200 text-[10px] text-slate-700 capitalize dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
												>
													{app.reference_type}
												</Badge>
												<span className="font-bold text-slate-900 text-xs dark:text-slate-100">
													ID #{app.reference_id}
												</span>
											</div>
											<p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
												{t("approvedOnLabel", {
													date: app.resolved_at
														? new Date(app.resolved_at).toLocaleDateString()
														: "",
												})}
											</p>
										</div>
										<Badge className="border-emerald-200 bg-emerald-100 text-[10px] text-emerald-800 capitalize dark:border-emerald-800/60 dark:bg-emerald-950/80 dark:text-emerald-300">
											{t("approve")}
										</Badge>
									</div>
								))}
							</div>
						) : (
							<div className="py-12 text-center text-slate-400 text-xs dark:text-slate-500">
								{t("noPastApprovalsFound")}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
