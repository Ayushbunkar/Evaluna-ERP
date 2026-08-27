"use client";

import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent CardDescription CardHeader CardTitle
} from "@evaluna/ui/components/card";
import {
  ActivityIcon
  CalendarCheckIcon
  ChartLineIcon
  ClockIcon
  PackageIcon
  TrendingUpIcon
  UsersIcon
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import motion from "framer-motion";
import { StaggerList StaggerItem AnimatedCard } from "@/lib/animations/stagger";
import { ArrowRightIcon } from "lucide-react";

export default function PickerDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.picker.getDashboardStats.useQuery();

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Picker Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Order picking, task management, and warehouse fulfillment
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Picking Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/picker/pending">
              <PackageIcon className="mr-2 h-4 w-4" /> View Pending Picks
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
              onClick={() => (window.location.href = "/picker/pending")}
            >
              <CardContent className="p-4 sm:p-6"><div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <CalendarCheckIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Pending Picks
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.pending || 0}
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
              onClick={() => (window.location.href = "/picker/active")}
            >
              <CardContent className="p-4 sm:p-6"><div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ClockIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Assigned Today
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.assignedToday || 0}
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
              onClick={() => (window.location.href = "/picker/completed")}
            >
              <CardContent className="p-4 sm:p-6"><div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <TrendingUpIcon className="h-6 w-6 text-yellow-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Completed Today
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.completed || 0}
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
              onClick={() => (window.location.href = "/picker/dashboard")}
            >
              <CardContent className="p-4 sm:p-6"><div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <UsersIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Total Items Picked
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.totalItemsPicked || 0}
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
              onClick={() => (window.location.href = "/picker/reports")}
            >
              <CardContent className="p-4 sm:p-6"><div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ChartLineIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Pick Accuracy
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.pickAccuracy?.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      {/* Recent Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Recent Picking Tasks
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest picking assignments and completions
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/picker/pending">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">{stats?.recentTasks?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">Order {task.order}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.items} items â€¢ {task.area}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className={`text-xs ${
                        task.status === "completed"
                          ? "text-green-600"
                          : task.status === "picking"
                          ? "text-blue-600"
                          : task.status === "pending"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}>
                        {task.status
                          .split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {task.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
                No recent picking tasks
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Picker Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Picker Performance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Top performers and metrics
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/picker/reports">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">{/* In a real app, this would come from the getReports procedure */}
            <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
              Picker performance data would be displayed here
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Exceptions / Issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Picking Exceptions
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Missing, damaged, or incorrect items
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/picker/pending">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">{stats?.exceptions || 0 > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border-border/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Exception Types
                  </p>
                  <p className="text-2xl font-bold">{stats?.exceptions || 0}</p>
                </div>
                <div className="border-border/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Accuracy Rate
                  </p>
                  <p className="text-2xl font-bold">{stats?.pickAccuracy?.toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
                No picking exceptions
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}




