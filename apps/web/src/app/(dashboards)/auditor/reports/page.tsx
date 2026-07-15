"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { KPICard } from "@/components/shared/cards/kpi-card";
import { Activity, Percent, TrendingDown } from "lucide-react";

export default function AuditorReportsPage() {
  const { data, isLoading } = trpc.auditor.getReportsData.useQuery();

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Mock data fallback if TRPC data is undefined
  const reportsData = data || {
    totalAudits: 142,
    accuracyPercentage: 98.4,
    totalShrinkageValue: 2450.0,
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Audit Reports</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Total Audits"
          value={reportsData.totalAudits.toString()}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          description="Total audits conducted this month"
          trend={{ value: 12, label: "from last month", isPositive: true }}
        />
        <KPICard
          title="Accuracy Percentage"
          value={`${reportsData.accuracyPercentage}%`}
          icon={<Percent className="h-4 w-4 text-muted-foreground" />}
          description="Average inventory accuracy"
          trend={{ value: 1.2, label: "from last month", isPositive: true }}
        />
        <KPICard
          title="Total Shrinkage"
          value={`$${reportsData.totalShrinkageValue.toFixed(2)}`}
          icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
          description="Total shrinkage value"
          trend={{ value: 5.4, label: "from last month", isPositive: false }}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
            <CardDescription>Number of audits completed over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full border-2 border-dashed border-muted rounded-md flex items-center justify-center text-muted-foreground bg-muted/10">
              [Audit History Chart Visualization]
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Accuracy Over Time</CardTitle>
            <CardDescription>Inventory accuracy trend across branches.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full border-2 border-dashed border-muted rounded-md flex items-center justify-center text-muted-foreground bg-muted/10">
              [Accuracy Percentage Chart]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
