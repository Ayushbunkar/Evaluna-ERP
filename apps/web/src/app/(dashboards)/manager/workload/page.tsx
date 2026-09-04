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
import { Badge } from "@evaluna/ui/components/badge";
import { BarChart3Icon, Loader2Icon, AlertTriangleIcon } from "lucide-react";

export default function WorkloadPage() {
  const trpc = useTRPC();

  // Query real workload stats
  const { data: workload = [], isLoading } = trpc.manager.getWorkload.useQuery();

  return (
    <PageTransition className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
          <BarChart3Icon className="h-6 w-6 text-blue-600" />
          Team Workload Balancing
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Monitor current assigned, in-progress, completed, and overdue tasks to balance employee work utilization.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Workforce Load Balancing Sheet</CardTitle>
          <CardDescription>Identify over-allocated or under-utilized staff based on open SLA targets</CardDescription>
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
                    <th className="p-3 font-semibold">Name</th>
                    <th className="p-3 font-semibold">Assigned (Open)</th>
                    <th className="p-3 font-semibold">In Progress</th>
                    <th className="p-3 font-semibold">Overdue Tasks</th>
                    <th className="p-3 font-semibold text-right">Fulfillment Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {workload.map((wl) => {
                    const totalActive = wl.assigned + wl.inProgress;
                    const allocationStatus = totalActive >= 4 ? "overloaded" : totalActive >= 1 ? "optimal" : "underutilized";

                    return (
                      <tr key={wl.id} className="hover:bg-slate-50/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{wl.name}</td>
                        <td className="p-3 font-medium text-blue-600 font-semibold">{wl.assigned} tasks</td>
                        <td className="p-3 font-medium text-amber-600 font-semibold">{wl.inProgress} active</td>
                        <td className="p-3 font-medium text-red-600 font-semibold flex items-center gap-1">
                          {wl.overdue > 0 && <AlertTriangleIcon className="h-3.5 w-3.5" />}
                          {wl.overdue} overdue
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            className={`capitalize text-[10px] tracking-wide font-bold ${
                              allocationStatus === "overloaded"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : allocationStatus === "optimal"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-slate-50 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {allocationStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
