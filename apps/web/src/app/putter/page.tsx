"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@evaluna/ui/components/card";
import {
  PackagePlusIcon,
  BoxIcon,
  AlertTriangleIcon,
} from "lucide-react";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
  AnimatedCard,
} from "@/lib/animations";

export default function PutterDashboard() {
  return (
    <PageTransition className="grid flex-1 items-start gap-6 min-w-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Putter Dashboard</h1>
        <p className="text-muted-foreground text-sm">Manage incoming shipments and warehouse putaway.</p>
      </div>

      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" slow>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Incoming Shipments</p>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <PackagePlusIcon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">3</h3>
                <p className="text-xs text-muted-foreground mt-2">Awaiting reception (GRN)</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Items to Putaway</p>
                  <div className="p-2 bg-emerald-500/10 rounded-full">
                    <BoxIcon className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-emerald-600">45</h3>
                <p className="text-xs text-muted-foreground mt-2">Requires shelf placement</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Damaged Goods</p>
                  <div className="p-2 bg-red-500/10 rounded-full">
                    <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-red-600">1</h3>
                <p className="text-xs text-muted-foreground mt-2">Reported during receiving</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>
    </PageTransition>
  );
}
