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
import { TrendingUpIcon, Loader2Icon, TrophyIcon } from "lucide-react";

export default function PerformancePage() {
  const trpc = useTRPC();

  // Query real performance metrics from actual database tasks/attendance activity
  const { data: metrics = [], isLoading } = trpc.manager.getPerformance.useQuery();

  return (
    <PageTransition className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
          <TrendingUpIcon className="h-6 w-6 text-blue-600" />
          Team Performance Workspace
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Strictly measured database performance metrics: completed vs overdue tasks and active attendance streaks.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Performance Table */}
        <div className="md:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Operational Performance Ledger</CardTitle>
              <CardDescription>Directly measured team member completion rates</CardDescription>
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
                        <th className="p-3 font-semibold">Tasks Completed</th>
                        <th className="p-3 font-semibold">Completion Rate</th>
                        <th className="p-3 font-semibold text-right">Attendance Consistency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {metrics.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{row.name}</td>
                          <td className="p-3 font-medium">{row.completedTasks} / {row.totalTasks}</td>
                          <td className="p-3 font-bold">
                            <span className={row.completionRate >= 80 ? "text-green-600" : "text-amber-600"}>
                              {row.completionRate}%
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-600 font-semibold">{row.attendanceStreak} days present</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Highlight Leaderboard */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-slate-50/50">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <TrophyIcon className="h-4.5 w-4.5 text-yellow-500" />
              SLA Top Performers
            </CardTitle>
            <CardDescription className="text-xs">Highest task completion efficiency</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {metrics.sort((a, b) => b.completionRate - a.completionRate).slice(0, 3).map((m, idx) => (
              <div key={m.id} className="flex justify-between items-center text-xs border-b pb-2">
                <span className="font-bold text-slate-700 dark:text-slate-400">
                  #{idx + 1} {m.name}
                </span>
                <Badge className="bg-yellow-50 text-yellow-800 border-yellow-200">
                  {m.completionRate}% SLA
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
