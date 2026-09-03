"use client";

import { useState } from "react";
import Link from "next/link";
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
  ActivityIcon,
  TruckIcon,
  BoxesIcon,
  CheckSquareIcon,
  PackageIcon,
  AlertTriangleIcon,
  ClockIcon,
  UserCheckIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
  InfoIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition, StaggerList, StaggerItem, AnimatedCard } from "@/lib/animations";

export default function WMSDashboardOverview() {
  const trpc = useTRPC();

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.warehouse.getOverviewStats.useQuery({});
  const { data: pos, isLoading: posLoading } = trpc.warehouse.getReceivingPOs.useQuery();
  const { data: putAwayQueue, isLoading: putAwayLoading } = trpc.warehouse.getPutAwayQueue.useQuery();
  const { data: pickingQueue, isLoading: pickingLoading } = trpc.warehouse.getPickingQueue.useQuery();
  const { data: packingQueue, isLoading: packingLoading } = trpc.warehouse.getPackingQueue.useQuery();

  // Load general warehouse stats for the activity feed & capacity alerts
  const { data: genStats } = trpc.warehouse.getStats.useQuery({ branch_id: undefined });

  const kpis = [
    {
      title: "Orders Waiting",
      value: stats?.ordersWaiting ?? 0,
      desc: "Awaiting pick allocation",
      icon: ClipboardListIcon,
      color: "border-l-blue-500",
      iconColor: "text-blue-500",
      href: "/dashboard/warehouse/picking",
    },
    {
      title: "Inbound Receiving",
      value: stats?.receivingQueue ?? 0,
      desc: "Expected POs in queue",
      icon: TruckIcon,
      color: "border-l-yellow-500",
      iconColor: "text-yellow-500",
      href: "/dashboard/warehouse/receiving",
    },
    {
      title: "Put-Away Tasks",
      value: stats?.putAwayQueue ?? 0,
      desc: "Items pending placement",
      icon: BoxesIcon,
      color: "border-l-purple-500",
      iconColor: "text-purple-500",
      href: "/dashboard/warehouse/put-away",
    },
    {
      title: "Picking Operations",
      value: stats?.pickingQueue ?? 0,
      desc: "Active picking checklists",
      icon: CheckSquareIcon,
      color: "border-l-orange-500",
      iconColor: "text-orange-500",
      href: "/dashboard/warehouse/picking",
    },
    {
      title: "Packing Queue",
      value: stats?.packingQueue ?? 0,
      desc: "Ready for box sealing",
      icon: PackageIcon,
      color: "border-l-green-500",
      iconColor: "text-green-500",
      href: "/dashboard/warehouse/packing",
    },
  ];

  return (
    <PageTransition className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 border rounded-xl p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Welcome back, Warehouse Operations Supervisor
          </h2>
          <p className="text-muted-foreground text-sm">
            Live orchestrator control console for <strong>Bhopal Main Warehouse</strong>. Manage receipts, put-away tasks, picks, and exceptions below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Branch ID: #1
          </Badge>
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
            System Level: supervisor
          </Badge>
        </div>
      </div>

      {/* KPI Cards Row */}
      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" slow>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <StaggerItem key={idx}>
              <AnimatedCard>
                <Link href={kpi.href}>
                  <Card className={`border-l-4 ${kpi.color} shadow-sm cursor-pointer transition-all hover:scale-102 hover:shadow-md bg-white dark:bg-slate-800`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        {kpi.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="font-bold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
                        {statsLoading ? "..." : kpi.value}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {kpi.desc}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </AnimatedCard>
            </StaggerItem>
          );
        })}
      </StaggerList>

      {/* Operational Control center Workspace Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Live Operational Queues */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-base font-bold">Live Warehouse Operations Queue</CardTitle>
                <CardDescription>Real-time orchestrator tracker of inbound and outbound flow</CardDescription>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 animate-pulse">
                Auto-Updating
              </Badge>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 p-0">
              {/* Inbound PO Queue Row */}
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 flex-shrink-0">
                    <TruckIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Inbound POs Awaiting Receipt</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {posLoading ? "..." : `${pos?.filter(po => po.status === "pending").length || 0} purchase orders pending inspection`}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" asChild className="text-xs font-semibold">
                  <Link href="/dashboard/warehouse/receiving">
                    Manage Receiving <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Put-Away Row */}
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 flex-shrink-0">
                    <BoxesIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Storage Bins Allocation (Put-Away)</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {putAwayLoading ? "..." : `${putAwayQueue?.filter(t => t.status === "AWAITING_PLACEMENT").length || 0} active placement tasks unverified`}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" asChild className="text-xs font-semibold">
                  <Link href="/dashboard/warehouse/put-away">
                    Allocate Bins <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Picking Operations */}
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 flex-shrink-0">
                    <CheckSquareIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Picking Lists</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pickingLoading ? "..." : `${pickingQueue?.filter(pl => pl.status === "picking").length || 0} picks currently executing on shelves`}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" asChild className="text-xs font-semibold">
                  <Link href="/dashboard/warehouse/picking">
                    Monitor Picker <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Packing Handoff */}
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-50 text-green-600 flex-shrink-0">
                    <PackageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Packing Queue Hand-off</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {packingLoading ? "..." : `${packingQueue?.filter(p => p.status === "packing").length || 0} packages sealed & awaiting fleet loader`}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" asChild className="text-xs font-semibold">
                  <Link href="/dashboard/warehouse/packing">
                    Handoff Packages <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Storage capacity & Fifo utilization cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Physical Storage Capacity</CardTitle>
                <CardDescription>Bhopal Warehouse utilization index</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>Utilized Space</span>
                  <span className="text-blue-600">{stats?.warehouseUtilization ?? 45}% Occupied</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${stats?.warehouseUtilization ?? 45}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>Available capacity: 500 bins</span>
                  <span>Empty bins: {500 - Math.round(500 * (stats?.warehouseUtilization ?? 45) / 100)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">First-In First-Out (FIFO) Index</CardTitle>
                <CardDescription>Average shelf residency of batched stock</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>FIFO Compliance Rate</span>
                  <span className="text-green-600">97.8% On-Time</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "97.8%" }}></div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Minimal aging stock. Operator batch rotations are executing optimally.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Supervisor Critical Attention Console */}
        <div className="space-y-6">
          <Card className="border-red-200 shadow-md bg-white">
            <CardHeader className="border-b border-red-500/10 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                  <AlertTriangleIcon className="h-5 w-5" /> Supervisor Attention Console
                </CardTitle>
                <CardDescription>Delayed tasks or inventory anomalies</CardDescription>
              </div>
              {stats?.delayedTasks !== undefined && stats.delayedTasks > 0 && (
                <Badge variant="destructive" className="animate-pulse">{stats.delayedTasks} Alerts</Badge>
              )}
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {stats?.delayedTasks !== undefined && stats.delayedTasks > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
                    <ClockIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-red-800">Delayed Inbound & Pick Lists Detected</h5>
                      <p className="text-[11px] text-red-700 mt-1">
                        There are {stats.delayedTasks} WMS tasks currently past their optimal operational SLA. Picker resources require allocation adjustments.
                      </p>
                      <Button size="sm" variant="link" className="p-0 text-red-800 font-bold text-xs mt-2" asChild>
                        <Link href="/dashboard/warehouse/exceptions">
                          Investigate Discrepancies <ArrowRightIcon className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <UserCheckIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium">All tasks executing within normal SLA windows.</p>
                </div>
              )}

              {/* Real inventory alert box */}
              {genStats?.inventoryAlerts !== undefined && genStats.inventoryAlerts.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 p-3 rounded-lg flex gap-3">
                  <InfoIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800">Reorder Threshold Alerts</h5>
                    <p className="text-[11px] text-amber-700 mt-1">
                      {genStats.inventoryAlerts.length} products have fallen below minimum stock buffers.
                    </p>
                    <Link href="/dashboard/warehouse/stock" className="text-xs text-amber-800 font-bold hover:underline mt-1.5 inline-block">
                      View Stock Ledger →
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Logs card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold">WMS Live Activity Trail</CardTitle>
              <CardDescription>Most recent immutable audit-trail operations</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto px-4">
                {genStats?.recentActivity && genStats.recentActivity.length > 0 ? (
                  genStats.recentActivity.slice(0, 5).map((act, i) => (
                    <div key={i} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="flex gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                            {act.action}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Operator: {act.user}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{act.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-xs text-muted-foreground">No recent audit log entries.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
