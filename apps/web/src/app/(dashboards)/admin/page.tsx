"use client";

import { KpiCard } from "@/components/shared/cards/kpi-card";
import { ActivityCard, type ActivityItem } from "@/components/shared/cards/activity-card";
import { Button } from "@evaluna/ui/components/button";
import { Plus, Download, GitBranch, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 1,
    title: "High value transaction flagged",
    description: "Order #8932 exceeds threshold",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    user: "System",
    icon: <ShieldAlert className="h-4 w-4 text-amber-500" />
  },
  {
    id: 2,
    title: "Offline sync completed",
    description: "Branch 'Downtown' synced 42 records",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    user: "Auto Sync",
  },
  {
    id: 3,
    title: "New branch provisioned",
    description: "Branch 'Westside Mall' is now active",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    user: "admin@evaluna.com",
    icon: <GitBranch className="h-4 w-4 text-emerald-500" />
  }
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">Monitor high-level metrics and system health.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Quick Action
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue (30d)"
          value="$124,500.00"
          icon={ArrowRight}
          trend={12.5}
          trendLabel="vs last month"
        />
        <KpiCard
          title="Active Branches"
          value="12"
          icon={GitBranch}
          description="All systems online"
        />
        <KpiCard
          title="Pending Syncs"
          value="4"
          icon={ArrowRight}
          description="Across 2 branches"
        />
        <KpiCard
          title="Security Alerts"
          value="1"
          icon={ShieldAlert}
          trend={-100}
          trendLabel="vs last week"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue vs Target</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 h-[350px] flex items-center justify-center border-dashed border-2 m-4 rounded-xl text-muted-foreground">
            Chart Component Placeholder
          </CardContent>
        </Card>

        <div className="col-span-3">
          <ActivityCard
            title="System Activity"
            description="Recent audit logs and automated events."
            items={MOCK_ACTIVITY}
          />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
             <Link href="/admin/users" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
               <span className="font-medium text-sm">Manage Users</span>
               <ArrowRight className="h-4 w-4 text-muted-foreground" />
             </Link>
             <Link href="/admin/branches" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
               <span className="font-medium text-sm">Branch Configuration</span>
               <ArrowRight className="h-4 w-4 text-muted-foreground" />
             </Link>
             <Link href="/admin/backups" className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
               <span className="font-medium text-sm">Disaster Recovery</span>
               <ArrowRight className="h-4 w-4 text-muted-foreground" />
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}