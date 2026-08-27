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
  ClockIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition, StaggerList, StaggerItem, AnimatedCard, motion } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";

export default function ManagerDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.manager.getDashboardStats.useQuery();
  const { data: employees } = trpc.manager.getEmployees.useQuery();
  const { data: leaveRequests } = trpc.manager.getLeaveRequests.useQuery();

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Today's orders, sales, pending approvals, inventory alerts, deliveries, returns, customers, suppliers, employees, exceptions
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Team Activity
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/manager/leave">
              <CalendarCheckIcon className="mr-2 h-4 w-4" /> Manage Leave
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
              onClick={() => (window.location.href = "/manager/employees")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <UsersIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Team Members
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.totalEmployees || 0} total
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
              onClick={() => (window.location.href = "/manager/attendance")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <CalendarCheckIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Today's Attendance
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Present: {stats?.presentToday || 0} | On Leave: {stats?.onLeave || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
              onClick={() => (window.location.href = "/manager/leave")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ClockIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Pending Leave Requests
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {leaveRequests?.filter(l => l.status === 'pending').length || 0} pending
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
        <StaggerItem>
          <AnimatedCard>
            <Card
              className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
              onClick={() => (window.location.href = "/manager/reports")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ChartLineIcon className="h-6 w-6 text-yellow-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Team Performance
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Avg Salary: {formatCurrency(stats?.avgSalary || 0, locale)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Team Management
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  View and manage team members
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/manager/employees">
                  View All <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col gap-3 sm:gap-4">
                {employees?.slice(0, 5).map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between border-border/50 border-b pb-1.5 last:border-0 last:pb-0 sm:pb-2"
                  >
                    <div>
                      <p className="font-medium text-xs sm:text-sm">
                        {emp.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {emp.role || "Staff"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm">
                        {emp.status}
                      </p>
                    </div>
                  </div>
                ))}
                {(!employees || employees.length === 0) && (
                  <div className="flex h-[80px] items-center justify-center text-muted-foreground text-xs sm:h-[100px] sm:text-sm">
                    No employees found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Leave Requests
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Pending approvals and team availability
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/manager/leave">
                  View All <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col gap-3 sm:gap-4">
                {leaveRequests
                  ?.filter(l => l.status === 'pending')
                  .slice(0, 5)
                  .map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between border-border/50 border-b pb-1.5 last:border-0 last:pb-0 sm:pb-2"
                    >
                      <div>
                        <p className="font-medium text-xs sm:text-sm">
                          {leave.emp_name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {leave.leave_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <Button variant="outline" size="xs" asChild>
                          <Link href={`/manager/leave/${leave.id}`}>
                            Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                {(!leaveRequests || leaveRequests.filter(l => l.status === 'pending').length === 0) && (
                  <div className="flex h-[80px] items-center justify-center text-muted-foreground text-xs sm:h-[100px] sm:text-sm">
                    No pending leave requests
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Payroll Overview
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly payroll status and processing
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/manager/payroll">
                  View All <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Payroll Pending
                  </p>
                  <p className="font-bold text-lg">
                    {stats?.payrollPending || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    New Hires This Month
                  </p>
                  <p className="font-bold text-lg">
                    {stats?.newHiresThisMonth || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Attrition Rate
                  </p>
                  <p className="font-bold text-lg">
                    {stats?.attritionRate || 0}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Open Positions
                  </p>
                  <p className="font-bold text-lg">
                    {stats?.openPositions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Recent Team Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest HR and team activities
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/manager/activity-log">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Placeholder for recent activity - would come from actual HR audit logs */}  
              <div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
                Recent team activities will appear here
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}




