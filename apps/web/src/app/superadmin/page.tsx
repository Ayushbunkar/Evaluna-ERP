"use client";

import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import {
  Building2Icon,
  UsersIcon,
  CreditCardIcon,
  DatabaseZapIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ActivityIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Progress } from "@evaluna/ui/components/progress";

// Simulated animated counter component for the dashboard
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  // In a real app we'd use framer-motion useSpring here
  return (
    <span className="tabular-nums">
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = trpc.superadmin.getDashboardStats.useQuery();
  const { data: health } = trpc.superadmin.getSystemHealth.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Enterprise management overview and system health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <DatabaseZapIcon className="h-4 w-4 text-emerald-500" />
            System Status: Optimal
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20">
            <Building2Icon className="h-4 w-4" />
            Add Company
          </Button>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-background to-background/50 border-border/50 shadow-sm overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Building2Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center text-emerald-500 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                  <ArrowUpRightIcon className="h-3 w-3 mr-1" />
                  12%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
                <h3 className="text-3xl font-bold mt-1">
                  <AnimatedCounter value={stats?.totalCompanies || 0} />
                </h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-background to-background/50 border-border/50 shadow-sm overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                  <CreditCardIcon className="h-6 w-6" />
                </div>
                <div className="flex items-center text-emerald-500 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                  <ArrowUpRightIcon className="h-3 w-3 mr-1" />
                  {stats?.monthlyGrowth || "0%"}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-3xl font-bold mt-1">
                  <AnimatedCounter value={stats?.revenue || 0} prefix="$" />
                </h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-background to-background/50 border-border/50 shadow-sm overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div className="flex items-center text-emerald-500 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                  <ArrowUpRightIcon className="h-3 w-3 mr-1" />
                  8%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <h3 className="text-3xl font-bold mt-1">
                  <AnimatedCounter value={stats?.totalUsers || 0} />
                </h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-background to-background/50 border-border/50 shadow-sm overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <ActivityIcon className="h-6 w-6" />
                </div>
                <div className="flex items-center text-rose-500 text-sm font-medium bg-rose-500/10 px-2 py-1 rounded-full">
                  <ArrowDownRightIcon className="h-3 w-3 mr-1" />
                  2ms
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Latency</p>
                <h3 className="text-3xl font-bold mt-1">
                  <AnimatedCounter value={parseInt(health?.databaseLatency || "24")} suffix="ms" />
                </h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Bento Grid layout */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Chart Area */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly recurring revenue across all tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center bg-muted/20 rounded-xl border border-dashed border-border/60">
                <p className="text-muted-foreground flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" /> Chart placeholder (Recharts implementation pending)
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Health */}
        <motion.div variants={item} className="flex flex-col gap-6">
          <Card className="border-border/50 shadow-sm flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <DatabaseZapIcon className="h-5 w-5 text-emerald-500" /> System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">CPU Usage</span>
                  <span className="font-bold">{health?.cpuUsage}%</span>
                </div>
                <Progress value={health?.cpuUsage} className="h-2 bg-muted/50" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Memory</span>
                  <span className="font-bold">{health?.memoryUsage}%</span>
                </div>
                <Progress value={health?.memoryUsage} className="h-2 bg-muted/50" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Storage ({health?.storageUsed})</span>
                  <span className="font-bold">78%</span>
                </div>
                <Progress value={78} className="h-2 bg-muted/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground overflow-hidden relative border-0">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl" />
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-1">Generate Monthly Report</h3>
              <p className="text-primary-foreground/70 text-sm mb-4">Export full billing and usage analytics across all registered tenants.</p>
              <Button variant="secondary" className="w-full">Download CSV</Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
