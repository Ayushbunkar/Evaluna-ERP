"use client";

import { useTRPC } from "@/lib/trpc/client";
import { PageTransition, StaggerList, StaggerItem, AnimatedCard } from "@/lib/animations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import {
  UsersIcon,
  ClockIcon,
  CalendarDaysIcon,
  FileCheckIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  PlayIcon,
  XCircleIcon,
  Loader2Icon,
  HistoryIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ManagerDashboard() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  // Queries Sourced Entirely From Real DB
  const { data: stats, isLoading: statsLoading } = trpc.manager.getDashboardStats.useQuery();
  const { data: employees = [], isLoading: employeesLoading } = trpc.manager.getEmployees.useQuery();
  const { data: pendingApprovals = [], isLoading: approvalsLoading } = trpc.manager.getApprovals.useQuery({ status: "pending" });
  const { data: exceptions = [], isLoading: exceptionsLoading } = trpc.manager.getExceptions.useQuery();
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
    }
  });

  const handleAction = async (approvalId: number, decision: "approved" | "rejected") => {
    await reviewApprovalMutation.mutateAsync({
      approvalId,
      decision,
    });
  };

  const isPageLoading = statsLoading || employeesLoading || approvalsLoading || exceptionsLoading;

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight sm:text-2xl">
            Manager Control Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Operational overview of your branch workforce, approval queues, exception logs, and SLA tasks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/manager/activity">Team Activity Log</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/manager/tasks">Create Team Task</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Team</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats?.totalEmployees ?? 0} members</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50 text-green-600 dark:bg-green-950/40">
              <ClockIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Present Today</p>
              <h3 className="text-lg font-bold text-green-600">{stats?.presentToday ?? 0} active</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40">
              <FileCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-lg font-bold text-amber-600">{stats?.pendingApprovals ?? 0} requests</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40">
              <AlertTriangleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overdue Tasks</p>
              <h3 className="text-lg font-bold text-red-600">{stats?.overdueTasks ?? 0} delayed</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left / Main operational area */}
        <div className="md:col-span-2 space-y-6">
          {/* Action Queue approvals */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <FileCheckIcon className="h-4.5 w-4.5 text-blue-500" />
                  My Action & Approvals Inbox
                </CardTitle>
                <CardDescription className="text-xs">Urgent items requiring your manager-level dual sign-off</CardDescription>
              </div>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/manager/approvals" className="text-xs text-blue-600 font-semibold flex items-center">
                  Go to Inbox <ChevronRightIcon className="h-4 w-4 ml-0.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {pendingApprovals.length > 0 ? (
                <div className="divide-y">
                  {pendingApprovals.slice(0, 3).map((app) => (
                    <div key={app.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="capitalize text-[10px] tracking-wide font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {app.reference_type}
                          </Badge>
                          <span className="text-xs font-bold text-slate-900">Request ID #{app.reference_id}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Requested by Staff #{app.requested_by}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(app.id, "rejected")}
                          disabled={reviewApprovalMutation.isPending}
                          className="text-red-600 border-red-200 hover:bg-red-50 text-[11px] h-7 flex-1 sm:flex-initial"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(app.id, "approved")}
                          disabled={reviewApprovalMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-[11px] h-7 flex-1 sm:flex-initial"
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <CheckCircle2Icon className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  No pending approvals. Your control inbox is clean!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Members Status */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <UsersIcon className="h-4.5 w-4.5 text-blue-500" />
                  Team status Overview
                </CardTitle>
                <CardDescription className="text-xs">Real-time status of your active branch workforce</CardDescription>
              </div>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/manager/team" className="text-xs text-blue-600 font-semibold flex items-center">
                  Full Team <ChevronRightIcon className="h-4 w-4 ml-0.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50/50 text-slate-500">
                      <th className="p-3 font-semibold">Name</th>
                      <th className="p-3 font-semibold">System Role</th>
                      <th className="p-3 font-semibold">Workload Profile</th>
                      <th className="p-3 font-semibold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {employees.slice(0, 5).map((emp) => {
                      const wl = workload.find((w) => w.id === emp.id) || { assigned: 0, overdue: 0 };
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/40">
                          <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                          <td className="p-3 capitalize font-medium text-slate-500">{emp.role}</td>
                          <td className="p-3">
                            <span className="text-[11px] font-bold text-blue-600">{wl.assigned} tasks</span>
                            {wl.overdue > 0 && (
                              <span className="text-[10px] text-red-600 font-semibold ml-2">({wl.overdue} overdue)</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/manager/team?detail=${emp.id}`}>View</Link>
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
          <Card className="shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-red-600">
                <AlertTriangleIcon className="h-4.5 w-4.5" />
                Urgent Exceptions Center
              </CardTitle>
              <CardDescription className="text-xs">Live operational anomalies needing mitigation</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {exceptions.length > 0 ? (
                <div className="divide-y">
                  {exceptions.slice(0, 3).map((ex) => (
                    <div key={ex.id} className="p-3 flex items-start gap-2.5">
                      <AlertTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{ex.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{ex.description}</p>
                        <Badge className="mt-1 text-[9px] bg-red-50 text-red-700 border border-red-200 uppercase font-semibold">
                          {ex.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  All systems operating normally.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity log */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <HistoryIcon className="h-4.5 w-4.5 text-blue-500" />
                Live Team Timeline
              </CardTitle>
              <CardDescription className="text-xs">Latest auditable events from database ledger</CardDescription>
            </CardHeader>
            <CardContent className="p-4 h-[240px] overflow-y-auto space-y-3">
              {activity.slice(0, 5).map((act) => (
                <div key={act.id} className="border-l-2 border-slate-200 pl-3 pb-1">
                  <span className="text-[10px] font-bold text-blue-600 block">{act.action}</span>
                  <span className="text-xs text-slate-600 block mt-0.5">Entity {act.entity_type} #ID {act.entity_id}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(act.created_at || "").toLocaleString()}</span>
                </div>
              ))}
              {activity.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">No team activity logged.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
