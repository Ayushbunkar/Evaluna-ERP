"use client";

import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { FileCheckIcon, Loader2Icon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const { data: pending = [], isLoading } = trpc.manager.getApprovals.useQuery({ status: "pending" });
  const { data: approved = [] } = trpc.manager.getApprovals.useQuery({ status: "approved" });

  const reviewApprovalMutation = trpc.manager.reviewApproval.useMutation({
    onSuccess: () => {
      toast.success("Approval action logged successfully!");
      utils.manager.getApprovals.invalidate();
      utils.manager.getDashboardStats.invalidate();
    },
    onError: (err) => {
      toast.error(`Approval action failed: ${err.message}`);
    }
  });

  const handleAction = async (id: number, decision: "approved" | "rejected") => {
    await reviewApprovalMutation.mutateAsync({
      approvalId: id,
      decision,
    });
  };

  return (
    <PageTransition className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
          <FileCheckIcon className="h-6 w-6 text-blue-600" />
          Manager centralized Approval Inbox
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Review and execute dual-signature operational reviews of leaves, expenses, and purchases.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Approvals */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-3 bg-slate-50/50">
            <CardTitle className="text-sm font-bold">Pending Review ({pending.length})</CardTitle>
            <CardDescription className="text-xs">Incoming requests awaiting your authorization</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pending.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pending.map((app) => (
                  <div key={app.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge className="capitalize text-[10px] tracking-wide font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {app.reference_type}
                        </Badge>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">ID #{app.reference_id}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Created: {app.created_at ? new Date(app.created_at).toLocaleDateString() : ""}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Requested by Staff Member #{app.requested_by}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(app.id, "rejected")}
                        disabled={reviewApprovalMutation.isPending}
                        className="text-red-600 border-red-200 hover:bg-red-50 text-[11px] h-7 flex-1"
                      >
                        <XCircleIcon className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(app.id, "approved")}
                        disabled={reviewApprovalMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-[11px] h-7 flex-1"
                      >
                        <CheckCircle2Icon className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No pending requests. Great job!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Approved / History */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-3 bg-slate-50/50">
            <CardTitle className="text-sm font-bold">Approved History ({approved.length})</CardTitle>
            <CardDescription className="text-xs">SLA records signed off by your account</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {approved.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {approved.slice(0, 5).map((app) => (
                  <div key={app.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {app.reference_type}
                        </Badge>
                        <span className="text-xs font-bold text-slate-800">ID #{app.reference_id}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Approved on: {app.resolved_at ? new Date(app.resolved_at).toLocaleDateString() : ""}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px] capitalize">Approved</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No past approvals found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
