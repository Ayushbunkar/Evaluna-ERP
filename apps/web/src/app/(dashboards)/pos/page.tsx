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
  MapPinIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function PosDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.pos.getDashboardStats.useQuery();

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            POS Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Point of sale, transactions, and daily sales summary
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> POS Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/pos/transactions">
              <BanknoteIcon className="mr-2 h-4 w-4" /> View Transactions
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <div className="border-border/50 bg-card/80 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                <BanknoteIcon className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg">
                Sales Today
              </h3>
              <p className="text-muted-foreground text-xs">
                {stats?.totalSalesToday ?? "0"} {locale === "en" ? "USD" : "?"}
              </p>
            </div>
          </div>
        </div>
        <div className="border-border/50 bg-card/80 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                <ChartLineIcon className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg">
                Pending Orders
              </h3>
              <p className="text-muted-foreground text-xs">
                {stats?.pendingOrders ?? 0} orders
              </p>
            </div>
          </div>
        </div>
        <div className="border-border/50 bg-card/80 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                <MapPinIcon className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg">
                Active Carts
              </h3>
              <p className="text-muted-foreground text-xs">
                {stats?.activeCarts ?? 0} carts
              </p>
            </div>
          </div>
        </div>
        <div className="border-border/50 bg-card/80 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                <TruckIcon className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg">
                Shipments Today
              </h3>
              <p className="text-muted-foreground text-xs">
                {stats?.shipmentsToday ?? 0} shipments
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}


