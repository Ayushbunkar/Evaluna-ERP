"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@evaluna/ui/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";
import { PageTransition, AnimatedCard, StaggerList, StaggerItem } from "@/lib/animations";

const mockKPIs = [
  {
    title: "Total Audits (MTD)",
    value: "24",
    change: "+12%",
    icon: ClipboardList,
    trend: "up",
  },
  {
    title: "Pending Reviews",
    value: "7",
    change: "-2",
    icon: Clock,
    trend: "down",
  },
  {
    title: "Discrepancy Value",
    value: "₹45,230",
    change: "+₹5,000",
    icon: IndianRupee,
    trend: "up",
  },
  {
    title: "Verification Rate",
    value: "94.2%",
    change: "+2.1%",
    icon: ShieldCheck,
    trend: "up",
  },
];

const mockActivities = [
  {
    id: "1",
    type: "audit_completed",
    title: "Monthly Stock Audit Completed",
    description: "Branch A stock audit finished with 3 discrepancies.",
    time: "2 hours ago",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  {
    id: "2",
    type: "discrepancy_flagged",
    title: "High Value Discrepancy",
    description: "Missing 5 units of Premium Widgets at Branch B.",
    time: "4 hours ago",
    icon: AlertTriangle,
    color: "text-red-500",
  },
  {
    id: "3",
    type: "audit_started",
    title: "Surprise Audit Started",
    description: "Audit initialized for Warehouse Central.",
    time: "1 day ago",
    icon: Activity,
    color: "text-blue-500",
  },
];

export default function AuditorDashboardOverview() {
  return (
    <PageTransition>
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Auditor Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Overview of audit operations, pending reviews, and recent activity.
            </p>
          </div>
          <Button variant="default" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Start New Audit
          </Button>
        </div>

        <StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mockKPIs.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <StaggerItem key={i}>
                <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {kpi.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span
                        className={
                          kpi.trend === "up"
                            ? "text-emerald-500 font-medium"
                            : "text-red-500 font-medium"
                        }
                      >
                        {kpi.change}
                      </span>{" "}
                      from last month
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerList>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <AnimatedCard className="lg:col-span-4 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Audit Activity</CardTitle>
              <CardDescription>
                Latest events across all branches and warehouses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {mockActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className={`mt-0.5 rounded-full p-2 bg-background shadow-sm border ${activity.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {activity.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard className="lg:col-span-3 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Pending Actions</CardTitle>
              <CardDescription>
                Tasks that require your immediate attention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4 bg-background/50 hover:bg-accent/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Review Branch C Discrepancies</p>
                    <p className="text-xs text-muted-foreground">Submitted by Jane Doe</p>
                  </div>
                  <Button size="sm" variant="outline">Review</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4 bg-background/50 hover:bg-accent/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Approve Monthly Report</p>
                    <p className="text-xs text-muted-foreground">Due in 2 days</p>
                  </div>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </div>
      </div>
    </PageTransition>
  );
}
