"use client";

import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import {
  BarChart3Icon,
  TrendingUpIcon,
  Loader2Icon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";

export default function AnalyticsPage() {
  const trpc = useTRPC();

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.warehouse.getOverviewStats.useQuery({});
  const { data: genStats } = trpc.warehouse.getStats.useQuery({ branch_id: undefined });

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
          WMS Throughput & Workload Analytics
          </h2>
        <p className="text-muted-foreground text-sm">
          Monitor operational backlogs, SLA compliance index, and worker efficiency KPIs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Backlog Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {statsLoading ? "..." : (stats?.ordersWaiting ?? 0) + (stats?.receivingQueue ?? 0)} units
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Pending inbound POs + pick lists</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.4%</div>
            <p className="text-[10px] text-muted-foreground mt-1">On-time delivery transit SLA rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Operator Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">89.5%</div>
            <p className="text-[10px] text-muted-foreground mt-1">Active worker task engagement rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Delayed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {statsLoading ? "..." : stats?.delayedTasks ?? 0} tasks
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Tasks past optimal fulfillment windows</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hourly Workload Trend mockup */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Daily Throughput Activity Trend</CardTitle>
            <CardDescription>Processed bulk units vs. target capacity by hour</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] flex items-end justify-between gap-2 pt-6">
            {[30, 45, 60, 80, 50, 65, 95, 75, 40, 20].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                  style={{ height: `${val}%` }}
                ></div>
                <span className="text-[9px] text-slate-400 font-semibold">{0 + i * 2}:00</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Task Completion Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">WMS Task Category Backlog</CardTitle>
            <CardDescription>Current unallocated queues awaiting picker/putter actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Inbound Receiving</span>
                <span>{stats?.receivingQueue ?? 0} POs</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats?.receivingQueue || 0) * 10}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Put-Away Placements</span>
                <span>{stats?.putAwayQueue ?? 0} tasks</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(stats?.putAwayQueue || 0) * 10}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Fulfillment Picking</span>
                <span>{stats?.pickingQueue ?? 0} lists</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(stats?.pickingQueue || 0) * 10}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Order Packing</span>
                <span>{stats?.packingQueue ?? 0} packages</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats?.packingQueue || 0) * 10}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
