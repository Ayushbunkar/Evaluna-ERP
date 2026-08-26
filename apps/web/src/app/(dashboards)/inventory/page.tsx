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
  ArchiveIcon,
  ChartLineIcon,
  ClockIcon,
  TrendingUpIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import motion from "framer-motion";
import { StaggerList, StaggerItem, AnimatedCard } from "@/lib/animations/stagger";
import { ArrowRightIcon } from "lucide-react";

export default function InventoryDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.inventory.getDashboardStats.useQuery();

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Inventory Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Stock management, warehouse operations, and inventory control
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Inventory Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/inventory/stock">
              <ArchiveIcon className="mr-2 h-4 w-4" /> View Stock Levels
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
              onClick={() => (window.location.href = "/inventory/stock")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <WarehouseIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Total Inventory Value
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {formatCurrency(stats?.inventoryValue || 0, locale)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition_all hover:shadow-md"
              onClick={() => (window.location.href = "/inventory/stock")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <UsersIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Total Products
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.totalProducts || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition_all hover:shadow-md"
              onClick={() => (window.location.href = "/inventory/stock")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ChartLineIcon className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Low Stock Items
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.lowStockItems || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition_all hover:shadow-md"
              onClick={() => (window.location.href = "/inventory/batches")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ClockIcon className="h-6 w-6 text-yellow-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Expiring Soon
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.expiringSoon || 0} batches
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition_all hover:shadow-md"
              onClick={() => (window.location.href = "/inventory/adjustments")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ActivityIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Dead Stock
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.deadStock || 0} items
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition_all hover:shadow-md"
              onClick={() => (window.location.href = "/inventory/stock")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <TrendingUpIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Stock Accuracy
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.stockAccuracy?.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      {/* Inventory Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Inventory Trend (6 Months)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Monthly inventory value trend
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory/reports">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2>
            {stats?.inventoryTrend?.length > 0 ? (
              <div className="h-[200px] w-full">
                {/* In a real app, this would render a chart using a library like recharts or victory */}
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Inventory trend chart would be displayed here
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs">
                No inventory trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Warehouse Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Warehouse Distribution
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Stock distribution across warehouses/branches
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory/stock">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2>
            {stats?.warehouseDistribution?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {stats.warehouseDistribution.map((warehouse) => (
                  <div key={warehouse.name} className="border-border/50 p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {warehouse.name}
                    </p>
                    <p className="text-2xl font-bold">{warehouse.stock || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(warehouse.value || 0, locale)} value
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
                No warehouse distribution data
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Category Distribution
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Inventory by product category
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory/stock">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2>
            {stats?.categoryDistribution?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {stats.categoryDistribution.map((category) => (
                  <div key={category.name} className="border-border/50 p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {category.name}
                    </p>
                    <p className="text-2xl font-bold">{category.count || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(category.value || 0, locale)} value
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
                No category distribution data
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ABC Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                ABC Analysis
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Inventory classification by value
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory/reports">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2>
            {stats?.abcAnalysis?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {stats.abcAnalysis.map((abc) => (
                  <div key={abc.class} className="border-border/50 p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Class {abc.class}
                    </p>
                    <p className="text-2xl font-bold">{abc.items || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {abc.value}K value ({abc.percentage}%)
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
                No ABC analysis data
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Movements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Recent Stock Movements
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest inventory transactions
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory/adjustments">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2>
            {stats?.recentMovements?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">{movement.product}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {movement.type === "in" ? "Stock In" : "Stock Out"}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className={`text-xs ${
                        movement.type === "in"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}>
                        {movement.qty > 0 ? `+${movement.qty}` : `${movement.qty}`} units
                      </span>
                      <span className="text-xs text-gray-500">
                        {movement.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
                No recent movements
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}