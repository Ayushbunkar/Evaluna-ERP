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
import { HistoryIcon, Loader2Icon } from "lucide-react";

export default function ActivityPage() {
  const trpc = useTRPC();

  // Query real audit logs
  const { data: activity = [], isLoading } = trpc.manager.getActivity.useQuery();

  return (
    <PageTransition className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-blue-600" />
          Centralized Activity Timeline
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Audit chronological operational events compiled automatically from database ledgers.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Chronological Activity Stream</CardTitle>
          <CardDescription>Up to 100 latest transactional, logistical, and workflow records</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activity.map((act) => (
                <div key={act.id} className="relative pl-8 pb-2 flex gap-4 items-start group">
                  {/* Timeline dot */}
                  <div className="absolute left-[5px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-slate-950 transition-colors group-hover:bg-blue-500"></div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{act.action}</span>
                      <span className="text-[10px] text-slate-400">{act.created_at ? new Date(act.created_at).toLocaleString() : ""}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Operational shift on {act.entity_type} #ID {act.entity_id}
                    </p>
                    <p className="text-[10px] text-slate-400">Captured Operator / Staff: {act.user_id ?? "System Auto-Trigger"}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No activity timelines recorded yet.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
