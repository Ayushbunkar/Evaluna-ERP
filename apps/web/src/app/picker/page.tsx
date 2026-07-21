"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@evaluna/ui/components/card";
import {
  ListIcon,
  PackageCheckIcon,
  ArrowRightLeftIcon,
} from "lucide-react";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
  AnimatedCard,
} from "@/lib/animations";

export default function PickerDashboard() {
  return (
    <PageTransition className="grid flex-1 items-start gap-6 min-w-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Picker Dashboard</h1>
        <p className="text-muted-foreground text-sm">Manage outbound stock, pick lists, and branch transfers.</p>
      </div>

      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" slow>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Pick Lists</p>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ListIcon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">5</h3>
                <p className="text-xs text-muted-foreground mt-2">Waiting to be processed</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Ready for Dispatch</p>
                  <div className="p-2 bg-emerald-500/10 rounded-full">
                    <PackageCheckIcon className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-emerald-600">12</h3>
                <p className="text-xs text-muted-foreground mt-2">Items packed and ready</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Transfers</p>
                  <div className="p-2 bg-orange-500/10 rounded-full">
                    <ArrowRightLeftIcon className="h-4 w-4 text-orange-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-orange-600">2</h3>
                <p className="text-xs text-muted-foreground mt-2">Inter-branch transfers</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>
    </PageTransition>
  );
}
