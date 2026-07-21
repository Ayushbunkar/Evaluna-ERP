"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@evaluna/ui/components/card";
import {
  SearchIcon,
  ShieldAlertIcon,
  ActivityIcon,
} from "lucide-react";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
  AnimatedCard,
} from "@/lib/animations";

export default function AuditorDashboard() {
  return (
    <PageTransition className="grid flex-1 items-start gap-6 min-w-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Auditor Dashboard</h1>
        <p className="text-muted-foreground text-sm">Monitor discrepancies and perform stock audits.</p>
      </div>

      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" slow>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Audits</p>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <SearchIcon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">12</h3>
                <p className="text-xs text-muted-foreground mt-2">Requires verification</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Discrepancies</p>
                  <div className="p-2 bg-destructive/10 rounded-full">
                    <ShieldAlertIcon className="h-4 w-4 text-destructive" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-red-600">3</h3>
                <p className="text-xs text-muted-foreground mt-2">Unresolved stock mismatches</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">System Health</p>
                  <div className="p-2 bg-emerald-500/10 rounded-full">
                    <ActivityIcon className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-emerald-600">Stable</h3>
                <p className="text-xs text-muted-foreground mt-2">No critical anomalies</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      <div className="grid gap-6 md:grid-cols-2 mt-4">
        <Card className="border-border/50 shadow-sm bg-card/50">
          <CardHeader>
            <CardTitle>Recent Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Connect to monitoring engine to see logs.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
