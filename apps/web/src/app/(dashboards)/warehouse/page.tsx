"use client";

import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import {
  ActivityIcon,
  BarcodeIcon,
  ClockIcon,
  PackageIcon,
  TrendingUpIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function WarehouseOperationsDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.warehouse.getStats.useQuery({ branch_id: undefined });

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Warehouse Operations Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Warehouse management, operations monitoring, and workforce coordination
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Warehouse Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/warehouse/locations">
              <WarehouseIcon className="mr-2 h-4 w-4" /> Warehouse Layout
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <StaggerList
        className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-6"
        slow
      >
        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
              onClick={() => (window.location.href = "/warehouse")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <WarehouseIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Warehouse Utilization
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.warehouseCapacity || 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
              onClick={() => (window.location.href = "/warehouse/locations")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <UsersIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Active Workers
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {/* Placeholder for active worker count */}
                    12 workers
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
              onClick={() => (window.location.href = "/inventory/adjustments")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ClockIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Picking Queue
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.pickingQueue || 0} orders
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group transition_all cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl hover:shadow-md"
              onClick={() => (window.location.href = "/inventory/adjustments")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ActivityIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Damage Items
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.damageItems || 0} units
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      {/* Warehouse Layout Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Warehouse Layout & Utilization
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Storage zone occupancy and capacity planning
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/warehouse/locations">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for warehouse heatmap */}
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Warehouse layout heatmap would be displayed here
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Worker Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Worker Performance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Picking accuracy and productivity metrics
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/staff">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for worker performance data */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-xs">Picker A</p>
                  <p className="font-bold text-xl">94%</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    ↑ 2% vs yesterday
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-xs">Picker B</p>
                  <p className="font-bold text-xl">88%</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    ↓ 1% vs yesterday
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-xs">Putter C</p>
                  <p className="font-bold text-xl">91%</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    → Same as yesterday
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Warehouse Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Recent Warehouse Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest inventory movements and operational events
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/warehouse/activity-log">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for recent warehouse activity */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <TruckIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    Receiving Completed
                  </p>
                  <p className="text-muted-foreground text-xs">
                    PO #PO-2026-0891 - 45 units
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <PackageIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    Picking Started
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Order #ORD-2026-0934
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ActivityIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    Inventory Adjustment
                  </p>
                  <p className="text-muted-foreground text-xs">
                    ADJ-2026-0877 - Damage
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}