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
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ApprovalsPage() {
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
					Manager centralized Approval Inbox
				</h2>
				<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
					Review and execute dual-signature operational reviews of leaves,
					expenses, and purchases.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Pending Approvals */}
				<Card className="shadow-sm">
					<CardHeader className="border-b bg-slate-50/50 pb-3">
						<CardTitle className="font-bold text-sm">
							Pending Review ({pending.length})
						</CardTitle>
						<CardDescription className="text-xs">
							Incoming requests awaiting your authorization
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
												<Badge className="border border-amber-200 bg-amber-50 font-bold text-[10px] text-amber-700 capitalize tracking-wide">
													{app.reference_type}
												</Badge>
												<span className="font-bold text-slate-900 text-xs dark:text-slate-100">
													ID #{app.reference_id}
												</span>
											</div>
											<span className="text-[10px] text-slate-400">
												Created:{" "}
												{app.created_at
													? new Date(app.created_at).toLocaleDateString()
													: ""}
											</span>
										</div>
										<p className="text-slate-600 text-xs dark:text-slate-400">
											Requested by Staff Member #{app.requested_by}
										</p>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleAction(app.id, "rejected")}
												disabled={reviewApprovalMutation.isPending}
												className="h-7 flex-1 border-red-200 text-[11px] text-red-600 hover:bg-red-50"
											>
												<XCircleIcon className="mr-1 h-3.5 w-3.5" /> Reject
											</Button>
											<Button
												size="sm"
												onClick={() => handleAction(app.id, "approved")}
												disabled={reviewApprovalMutation.isPending}
												className="h-7 flex-1 bg-blue-600 text-[11px] hover:bg-blue-700"
											>
												<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />{" "}
												Approve
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="py-12 text-center text-slate-400 text-xs">
								No pending requests. Great job!
							</div>
						)}
					</CardContent>
				</Card>

				{/* Recently Approved / History */}
				<Card className="shadow-sm">
					<CardHeader className="border-b bg-slate-50/50 pb-3">
						<CardTitle className="font-bold text-sm">
							Approved History ({approved.length})
						</CardTitle>
						<CardDescription className="text-xs">
							SLA records signed off by your account
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
													className="text-[10px] capitalize"
												>
													{app.reference_type}
												</Badge>
												<span className="font-bold text-slate-800 text-xs">
													ID #{app.reference_id}
												</span>
											</div>
											<p className="mt-1 text-[10px] text-slate-400">
												Approved on:{" "}
												{app.resolved_at
													? new Date(app.resolved_at).toLocaleDateString()
													: ""}
											</p>
										</div>
										<Badge className="border-green-200 bg-green-100 text-[10px] text-green-800 capitalize">
											Approved
										</Badge>
									</div>
								))}
							</div>
						) : (
							<div className="py-12 text-center text-slate-400 text-xs">
								No past approvals found.
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
