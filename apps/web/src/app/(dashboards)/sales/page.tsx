"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import {
  ShoppingCart,
  UsersIcon,
  ReceiptTextIcon,
  BanknoteIcon,
  SearchIcon,
  ArrowRightIcon
} from "lucide-react";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
  AnimatedCard,
  motion,
} from "@/lib/animations";
import Link from "next/link";

export default function SalesDashboard() {
  return (
    <PageTransition className="grid flex-1 items-start gap-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back. Start a new sale or manage recent orders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-sm">
            <SearchIcon className="mr-2 h-4 w-4" /> Lookup Order
          </Button>
          <Button className="shadow-sm" asChild>
            <Link href="/sales/pos">
              <ShoppingCart className="mr-2 h-4 w-4" /> Open POS
            </Link>
          </Button>
        </div>
      </div>

      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => window.location.href = '/sales/pos'}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Point of Sale</h3>
                  <p className="text-xs text-muted-foreground">Process new transactions</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => window.location.href = '/sales/orders'}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ReceiptTextIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-lg">Orders</h3>
                  <p className="text-xs text-muted-foreground">View past receipts</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => window.location.href = '/sales/customers'}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <UsersIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-lg">Customers</h3>
                  <p className="text-xs text-muted-foreground">Manage loyalty and profiles</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => window.location.href = '/sales/cashbook'}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <BanknoteIcon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-lg">Daily Till</h3>
                  <p className="text-xs text-muted-foreground">Cash drawer operations</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      <div className="grid gap-6 md:grid-cols-2 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-border/50 shadow-sm bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Latest transactions processed</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sales/orders">
                  View All <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                Connect to POS engine to display recent sales.
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle>Daily Goal</CardTitle>
              <CardDescription>Track your sales target for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] flex-col items-center justify-center gap-4 text-center">
                <div className="relative h-32 w-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">0%</span>
                  <div className="absolute inset-0 rounded-full border-8 border-primary border-r-transparent border-b-transparent border-l-transparent rotate-45 opacity-0 transition-opacity" />
                </div>
                <p className="text-sm text-muted-foreground">Start selling to hit your target!</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}