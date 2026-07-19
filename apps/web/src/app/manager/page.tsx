"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@evaluna/ui/components/card";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  UsersIcon,
  ShoppingCart,
  StoreIcon
} from "lucide-react";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
  AnimatedCard,
  motion,
} from "@/lib/animations";

import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useBranch } from "@/lib/branch-context";
import { Skeleton } from "@evaluna/ui/components/skeleton";

export default function ManagerDashboard() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { activeBranchId } = useBranch();

  const { data: kpis, isLoading } = trpc.dashboard.getKpis.useQuery(
    activeBranchId ? { branch_id: activeBranchId } : {}
  );

  if (isLoading || !kpis) {
    return (
      <div className="grid flex-1 items-start gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="grid flex-1 items-start gap-6 min-w-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Manager Overview</h1>
        <p className="text-muted-foreground text-sm">Monitor your branch performance and operations.</p>
      </div>

      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-green-600">
                    {formatCurrency(kpis.todaySales, locale)}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Gross revenue across active branch</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <StoreIcon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    {formatCurrency(kpis.totalSales, locale)}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-2">All time revenue</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Today's Expenses</p>
                  <div className="p-2 bg-destructive/10 rounded-full">
                    <Wallet className="h-4 w-4 text-destructive" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-red-600">
                    {formatCurrency(kpis.todayExpenses, locale)}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Operating costs and payouts</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Today's Profit</p>
                  <div className={`p-2 rounded-full ${kpis.todayProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {kpis.todayProfit >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-2xl font-bold tracking-tight ${kpis.todayProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(kpis.todayProfit, locale)}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Net margin for today</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="col-span-full lg:col-span-2"
        >
          <Card className="h-[400px] border-border/50 shadow-sm flex flex-col items-center justify-center text-center p-6 bg-card/50">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Recent Transactions</h3>
            <p className="text-sm text-muted-foreground">Transaction history will appear here once connected to the sales engine.</p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-full lg:col-span-1"
        >
          <Card className="h-[400px] border-border/50 shadow-sm flex flex-col items-center justify-center text-center p-6 bg-card/50">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Team Attendance</h3>
            <p className="text-sm text-muted-foreground">Shift tracking module coming soon.</p>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
