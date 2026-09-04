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
import { FileBarChartIcon, Loader2Icon, DownloadIcon } from "lucide-react";
import { downloadCsv } from "@/lib/admin/csv";

export default function ReportsPage() {
  const trpc = useTRPC();

  // Sourced entirely from live DB stats
  const { data: performance = [], isLoading } = trpc.manager.getPerformance.useQuery();

  const handleExport = () => {
    if (performance.length === 0) return;
    
    // Construct simple standard CSV content manually to ensure type safety
    const headers = ["Staff ID", "Employee Name", "System Role", "Total Tasks", "Completed Tasks", "Completion SLA (%)", "Present Streak"];
    const rows = performance.map((p) => [
      p.id,
      `"${p.name}"`,
      `"${p.role}"`,
      p.totalTasks,
      p.completedTasks,
      p.completionRate,
      p.attendanceStreak,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    downloadCsv(csvContent, "Manager_Team_Performance_Report.csv");
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
            <FileBarChartIcon className="h-6 w-6 text-blue-600" />
            Manager Reports Center
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Export, print, and audit detailed team SLA completions, performance parameters, and active task volumes.
          </p>
        </div>
        <Button size="sm" onClick={handleExport} disabled={performance.length === 0}>
          <DownloadIcon className="mr-1.5 h-4 w-4" /> Export Team performance CSV
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Team Performance SLA Auditing</CardTitle>
          <CardDescription>Exportable spreadsheet matrix of workforce stats sourced directly from the database</CardDescription>
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
                    <th className="p-3 font-semibold">Employee ID</th>
                    <th className="p-3 font-semibold">Name</th>
                    <th className="p-3 font-semibold">Role</th>
                    <th className="p-3 font-semibold">Tasks Allocated</th>
                    <th className="p-3 font-semibold">Completed</th>
                    <th className="p-3 font-semibold text-right">Completion Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {performance.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-slate-500">EMP-#{p.id}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                      <td className="p-3 capitalize font-medium text-slate-500">{p.role}</td>
                      <td className="p-3 font-semibold text-slate-700">{p.totalTasks}</td>
                      <td className="p-3 font-semibold text-green-600">{p.completedTasks}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-200">{p.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
