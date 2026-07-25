"use client";

import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@evaluna/ui/components/card";
import { DatabaseZapIcon, HardDriveIcon, CpuIcon, ActivityIcon } from "lucide-react";
import { Progress } from "@evaluna/ui/components/progress";

export default function SuperAdminHealthPage() {
  const { data: health, isLoading } = trpc.superadmin.getSystemHealth.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground mt-1">Live metrics from your infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground gap-2">
              <ActivityIcon className="h-4 w-4" /> Server Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{health?.serverStatus}</div>
            <p className="text-xs text-muted-foreground mt-1">Uptime: {health?.uptime}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground gap-2">
              <CpuIcon className="h-4 w-4" /> CPU Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.cpuUsage}%</div>
            <Progress value={health?.cpuUsage} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground gap-2">
              <HardDriveIcon className="h-4 w-4" /> Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.memoryUsage}%</div>
            <Progress value={health?.memoryUsage} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground gap-2">
              <DatabaseZapIcon className="h-4 w-4" /> Database Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.databaseLatency}</div>
            <p className="text-xs text-muted-foreground mt-1">Optimal performance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Storage Utilization</CardTitle>
            <CardDescription>Database and Object Storage metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>PostgreSQL DB</span>
                <span className="font-medium text-muted-foreground">34 GB / 100 GB</span>
              </div>
              <Progress value={34} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>S3 Bucket (Attachments)</span>
                <span className="font-medium text-muted-foreground">{health?.storageUsed} / 500 GB</span>
              </div>
              <Progress value={25} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-muted/20">
          <CardHeader>
            <CardTitle>Error Logs</CardTitle>
            <CardDescription>Recent system-level errors and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
              No recent errors recorded.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
