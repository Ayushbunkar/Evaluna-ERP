"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, BanknoteIcon, ChartLineIcon, TrendingUpIcon, TrendingDownIcon, CurrencyIcon } from "lucide-react";

export default function AdminFinancePage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats, isLoading: statsLoading, error: statsError } = trpc.admin.getFinancialSummary.useQuery();

  if (statsLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (statsError) return <div className="flex h-[200px] items-center justify-center">Error loading financial data</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Finance Overview</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Financial summary and key metrics
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Financial Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Button>Reports</Button>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Cash */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Today's Cash
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Available cash balance
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
                  <CurrencyIcon className="h-6 w-6 text-indigo-500" />
                </div>
                <p className="font-bold text-2xl">
                  {stats?.cashBalance?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Revenue */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Monthly Revenue
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Current month revenue
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <TrendingUpIcon className="h-6 w-6 text-green-500" />
                </div>
                <p className="font-bold text-2xl">
                  {stats?.monthlyRevenue?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Expenses */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Monthly Expenses
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Current month expenses
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                  <TrendingDownIcon className="h-6 w-6 text-red-500" />
                </div>
                <p className="font-bold text-2xl">
                  {stats?.totalExpenses?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Profit */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Net Profit
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Revenue minus expenses
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <BanknoteIcon className="h-6 w-6 text-blue-500" />
                </div>
                <p className="font-bold text-2xl">
                  {stats?.netProfit?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Receivables */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Receivables
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Amount owed by customers
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                  <CurrencyIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <p className="font-bold text-2xl">
                  {stats?.totalReceivables?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Payables */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Payables
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Amount owed to suppliers
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                  <CurrencyIcon className="h-6 w-6 text-purple-500" />
                </div>
                <p className="font-bold text-2xl">
                  {stats?.totalPayables?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Balance */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Bank Balance
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Total bank account balances
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-500/10">
                  <BanknoteIcon className="h-6 w-6 text-gray-500" />
                </div>
                <p className="font-bold text-2xl">
                  {stats?.bankBalance?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit Margin */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg">
                  Profit Margin
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Profit as percentage of revenue
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <ChartLineIcon className="h-6 w-6 text-green-500" />
                </div>
                <p className="font-bold text-2xl">
                  {stats?.monthlyRevenue > 0 ? ((stats?.netProfit || 0) / stats?.monthlyRevenue * 100).toFixed(1) + '%' : '0%'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Details Section */}
      <div className="mt-8">
        <h2 className="font-bold text-foreground text-lg tracking-tight mb-4">
          Financial Details
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="bg-card/50 border-border/50 rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">Key Financial Ratios</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Current Ratio:</span>
                <span className="font-medium">
                  {(stats?.totalReceivables || 0) > 0 ? ((stats?.cashBalance || 0) / stats?.totalReceivables).toFixed(2) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Debt to Equity:</span>
                <span className="font-medium">
                  {(stats?.totalPayables || 0) > 0 ? ((stats?.totalExpenses || 0) / stats?.totalPayables).toFixed(2) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card/50 border-border/50 rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">Cash Flow Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Cash Inflow (Month):</span>
                <span className="font-medium">
                  {stats?.monthlyRevenue?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cash Outflow (Month):</span>
                <span className="font-medium">
                  {stats?.totalExpenses?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Net Cash Flow:</span>
                <span className="font-medium">
                  {stats?.netProfit?.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}