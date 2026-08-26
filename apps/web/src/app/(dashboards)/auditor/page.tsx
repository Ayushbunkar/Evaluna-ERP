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
  CalendarCheckIcon,
  ChartLineIcon,
  ClipboardIcon,
  ShieldIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import motion, { AnimatePresence } from "framer-motion";
import { StaggerList, StaggerItem, AnimatedCard } from "@/lib/animations/stagger";
import { ArrowRightIcon } from "lucide-react";

export default function AuditorDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.auditor.getDashboardStats.useQuery();

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Auditor Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Audit oversight, compliance monitoring, and quality control
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Audit Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/auditor/findings">
              <ClipboardIcon className="mr-2 h-4 w-4" /> View Findings
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
              onClick={() => (window.location.href = "/auditor/findings")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ShieldIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Open Findings
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.openFindings || 0}
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
              onClick={() => (window.location.href = "/auditor/upc")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <CalendarCheckIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Pending UPC Tasks
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.openUpcTasks || 0}
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
              onClick={() => (window.location.href = "/auditor/receiving")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ActivityIcon className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Pending Receiving
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.pendingReceiving || 0}
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
              onClick={() => (window.location.href = "/auditor/placement")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <UsersIcon className="h-6 w-6 text-yellow-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Awaiting Placement
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.awaitingPlacement || 0}
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
              onClick={() => (window.location.href = "/auditor/reports")}
            >
              <CardContent className="p-4 sm:p-6>
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition_transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ChartLineIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Completed Audits
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.completedAudits || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        {/* Additional stats if needed */}
        {stats?.stockAccuracy !== null && (
          <StaggerItem>
            <AnimatedCard>
              <Card
                className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition_all hover:shadow-md"
                onClick={() => (window.location.href = "/auditor/findings")}
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
        )}
      </StaggerList>

      {/* Recent Audit Findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Recent Audit Findings
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest audit findings and issues
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auditor/findings">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2>
            {stats?.recentFindings?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentFindings.map((finding) => (
                  <div key={finding.id} className="flex items-center justify-between border-border/50 border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">{finding.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {finding.type} • {finding.severity}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        finding.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : finding.severity === "high"
                          ? "bg-orange-100 text-orange-800"
                          : finding.severity === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : finding.severity === "low"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                      </span>
                      <span className={`text-xs ${
                        finding.status === "open"
                          ? "text-red-600"
                          : finding.status === "under_review"
                          ? "text-yellow-600"
                          : finding.status === "corrective_action_required"
                          ? "text-orange-600"
                          : "text-gray-600"
                      }`}>
                        {finding.status
                          .split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
                No recent audit findings
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Audit Queue / Pending Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Audit Queue
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Pending audits, UPC tasks, and inspections
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auditor/dashboard">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Pending Audits
                </p>
                <p className="text-2xl font-bold">{stats?.pendingAudits || 0}</p>
              </div>
              <div className="border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Pending UPC Tasks
                </p>
                <p className="text-2xl font-bold">{stats?.openUpcTasks || 0}</p>
              </div>
              <div className="border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Pending Receiving
                </p>
                <p className="text-2xl font-bold">{stats?.pendingReceiving || 0}</p>
              </div>
              <div className="border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Awaiting Placement
                </p>
                <p className="text-2xl font-bold">{stats?.awaitingPlacement || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Warehouse Issues Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Warehouse Issues
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Damage, expiry, and mismatch tracking
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auditor/findings">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2>
            {stats?.warehouseIssues?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {stats.warehouseIssues.map((issue) => (
                  <div key={issue.name} className="flex flex-col items-center justify-center p-3 border-border/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                      {issue.name === "Damage" && (
                        <ActivityIcon className="h-5 w-5 text-red-500" />
                      )}
                      {issue.name === "Expiry" && (
                        <CalendarCheckIcon className="h-5 w-5 text-orange-500" />
                      )}
                      {issue.name === "Missing" && (
                        <ShieldIcon className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium">{issue.name}</p>
                    <p className="text-2xl font-bold mt-1">{issue.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
                No warehouse issues data
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}