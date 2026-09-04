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
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";

export default function ExceptionsPage() {
  const trpc = useTRPC();

  // Query real exceptions/anomalies from actual database
  const { data: exceptions = [], isLoading } = trpc.manager.getExceptions.useQuery();

  return (
    <PageTransition className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2 text-red-600">
          <AlertTriangleIcon className="h-6 w-6" />
          Urgent Exceptions Center
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Overview and mitigate critical system anomalies, overdue tasks, or unresolved discrepancy escalations.
        </p>
      </div>

      <Card className="shadow-sm border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="text-base font-bold">Active System Exceptions Log</CardTitle>
          <CardDescription>Live feed of discrepancies and operational blockages requiring manager intervention</CardDescription>
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
                    <th className="p-3 font-semibold">Anomaly ID</th>
                    <th className="p-3 font-semibold">Title</th>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 font-semibold">Severity</th>
                    <th className="p-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exceptions.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/40">
                      <td className="p-3 font-bold text-slate-900">ANM-#{ex.id}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{ex.title}</td>
                      <td className="p-3 font-medium text-slate-500 leading-relaxed max-w-sm break-words">{ex.description}</td>
                      <td className="p-3">
                        <Badge className="bg-red-50 text-red-700 border border-red-200 uppercase text-[9px] font-bold">
                          {ex.severity}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Badge className="capitalize text-[10px]">{ex.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {exceptions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                        All operational workflows are clear! No exceptions flagged.
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
