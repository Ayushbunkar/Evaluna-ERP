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
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function MarketingDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.marketing.getMetrics?.useQuery?.() ?? {};

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Marketing Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Campaign performance, customer engagement, and promotional effectiveness
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Marketing Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/marketing/campaigns">
              <ClipboardListIcon className="mr-2 h-4 w-4" /> View Campaigns
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
              onClick={() => (window.location.href = "/marketing/campaigns")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ChartLineIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Active Campaigns
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.activeCampaigns || 0}
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
              onClick={() => (window.location.href = "/marketing/coupons")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <BanknoteIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Total Coupons
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.totalCoupons || 0}
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
              onClick={() => (window.location.href = "/marketing/coupons")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <UsersIcon className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Redeemed Coupons
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.redeemedCoupons || 0}
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
              onClick={() => (window.location.href = "/marketing/coupons")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                    <ActivityIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    Conversion Rate
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {stats?.conversionRate || 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      {/* Campaign Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Campaign Performance (6 Months)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Monthly campaign activity and conversion rates
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/marketing/campaigns">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for campaign performance chart */}
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Campaign performance chart would be displayed here
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Campaign Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Recent Campaign Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest marketing campaigns and customer engagements
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/marketing/campaigns">
                View All <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for recent campaign activity */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ChartLineIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    Campaign Launched
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Summer Sale 2026
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <UsersIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    Coupon Redeemed
                  </p>
                  <p className="text-muted-foreground text-xs">
                    WELCOME10 - 24 uses
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-border/50 border-b pb-3">
                <div className="flex h-9 w-9 fshrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ActivityIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium text-xs sm:text-sm">
                    New Audience Created
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Loyalty Tier: Gold
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Engagement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">
                Customer Engagement
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Marketing reach and customer interaction metrics
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/customers">
                View Details <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            {/* Placeholder for customer engagement data */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-xs">Email Open Rate</p>
                  <p className="font-bold text-xl">68.4%</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    ↑ 4.2% vs last month
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-xs">SMS Click Rate</p>
                  <p className="font-bold text-xl">42.1%</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    ↓ 2.1% vs last month
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-border/50 p-4">
                <div className="flex flex-col">
                  <p className="font-medium text-xs">WhatsApp Response Rate</p>
                  <p className="font-bold text-xl">55.7%</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    → Same as last month
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}