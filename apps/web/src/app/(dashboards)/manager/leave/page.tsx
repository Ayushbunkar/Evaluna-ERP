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
import { CalendarIcon, Loader2Icon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

export default function LeavePage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const { data: leavesList = [], isLoading } = trpc.manager.getLeaveRequests.useQuery();

  const reviewApprovalMutation = trpc.manager.reviewApproval.useMutation({
    onSuccess: () => {
      toast.success("Leave decision logged successfully!");
      utils.manager.getLeaveRequests.invalidate();
      utils.manager.getDashboardStats.invalidate();
    },
    onError: (err) => {
      toast.error(`Decision failed: ${err.message}`);
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
          <CalendarIcon className="h-6 w-6 text-blue-600" />
          Leave Management Workspace
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Review, approve, or reject employee leave and time-off requests.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Time-Off Requests Queue</CardTitle>
          <CardDescription>Approved, pending, or rejected leaves across your entire workforce</CardDescription>
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
                    <th className="p-3 font-semibold">Request ID</th>
                    <th className="p-3 font-semibold">Requested By</th>
                    <th className="p-3 font-semibold">Created At</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leavesList.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/40">
                      <td className="p-3 font-bold text-slate-900">LEAVE-#{leave.reference_id}</td>
                      <td className="p-3 font-medium">Staff ID #{leave.requested_by}</td>
                      <td className="p-3 font-medium">{leave.created_at ? new Date(leave.created_at).toLocaleDateString() : ""}</td>
                      <td className="p-3">
                        <Badge className="capitalize text-[10px]" variant={leave.status === "approved" ? "default" : "outline"}>
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
                              className="text-red-600 border-red-200 hover:bg-red-50 text-[10px] h-7"
                            >
                              <XCircleIcon className="mr-1 h-3.5 w-3.5" /> Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAction(leave.id, "approved")}
                              disabled={reviewApprovalMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 text-[10px] h-7"
                            >
                              <CheckCircle2Icon className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leavesList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                        No leave requests logged.
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
