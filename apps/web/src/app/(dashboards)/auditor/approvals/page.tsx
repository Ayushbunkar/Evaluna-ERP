"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Badge } from "@evaluna/ui/components/badge";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

export default function AuditorApprovalsPage() {
  const utils = trpc.useUtils();
  const { data: approvals, isLoading } = trpc.auditor.getPendingApprovals.useQuery();

  const approveMutation = trpc.auditor.approveRequest.useMutation({
    onSuccess: () => {
      toast.success("Request approved");
      utils.auditor.getPendingApprovals.invalidate();
    },
    onError: () => {
      toast.error("Failed to approve request");
    }
  });

  const rejectMutation = trpc.auditor.rejectRequest.useMutation({
    onSuccess: () => {
      toast.success("Request rejected");
      utils.auditor.getPendingApprovals.invalidate();
    },
    onError: () => {
      toast.error("Failed to reject request");
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[400px] w-full mt-4" />
      </div>
    );
  }

  // Mock data fallback if TRPC query fails or router is missing
  const requests = approvals || [
    {
      id: "REQ-1234",
      date: new Date().toISOString(),
      branch: "Downtown Branch",
      manager: "Alice Smith",
      type: "Large Stock Adjustment",
      status: "pending",
    },
    {
      id: "REQ-1235",
      date: new Date(Date.now() - 86400000).toISOString(),
      branch: "Uptown Branch",
      manager: "Bob Jones",
      type: "Discrepancy Sign-off",
      status: "pending",
    }
  ];

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate({ id });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Approval Queue</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manager Requests</CardTitle>
          <CardDescription>Review and approve large stock adjustments and other sensitive requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No pending requests.</TableCell>
                  </TableRow>
                ) : (
                  requests.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell>{format(new Date(req.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{req.branch}</TableCell>
                      <TableCell>{req.manager}</TableCell>
                      <TableCell>{req.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleReject(req.id)}
                            disabled={rejectMutation.isPending || approveMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleApprove(req.id)}
                            disabled={rejectMutation.isPending || approveMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
