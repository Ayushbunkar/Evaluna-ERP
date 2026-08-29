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
  BanknoteIcon,
  ChartLineIcon,
  ClipboardListIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function ProcurementDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.purchases.getDashboardStats.useQuery();

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Procurement Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Purchase orders, supplier management, and incoming inventory
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Procurement Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/purchases/pending">
              <ClipboardListIcon className="mr-2 h-4 w-4" /> View Pending Orders
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <StaggerList
        className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
        slow
      >
        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
              onClick={() => (window.location.href = "/purchases")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ActivityIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Purchase Orders Today
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.posToday ?? 0} orders
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
              onClick={() => (window.location.href = "/purchases/pending")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ChartLineIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Pending PO Approval
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.pendingApproval ?? 0} orders
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
              onClick={() => (window.location.href = "/suppliers")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <TruckIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Incoming Inventory
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.incomingInventory ?? 0} units
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
              onClick={() => (window.location.href = "/suppliers")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="transition_transform mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <UsersIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Supplier Contacts
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.supplierContacts ?? 0} active
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      {/* Purchase Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Purchase Trend (6 Months)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Monthly purchase volume and spending
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/purchases">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for purchase trend chart */}
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Purchase trend chart would be displayed here
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Supplier Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Supplier Performance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Top suppliers by purchase volume
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/suppliers">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for supplier performance data */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-sm">Supplier A</p>
                  <p className="text-muted-foreground text-xs">12 POs</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="font-bold text-sm">
                    {formatCurrency(12500, locale)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-sm">Supplier B</p>
                  <p className="text-muted-foreground text-xs">8 POs</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="font-bold text-sm">
                    {formatCurrency(8750, locale)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-sm">Supplier C</p>
                  <p className="text-muted-foreground text-xs">5 POs</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="font-bold text-sm">
                    {formatCurrency(4200, locale)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Purchase Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Recent Purchase Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest purchase orders and supplier activities
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/purchases">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for recent purchase activity */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <TruckIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    PO #PO-2026-0891
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Approved - Awaiting Delivery
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ActivityIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    New Supplier Added
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Global Parts Inc.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ChartLineIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    PO #PO-2026-0885
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Received - 85% Complete
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