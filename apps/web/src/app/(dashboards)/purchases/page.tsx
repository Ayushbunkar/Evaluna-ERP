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
  ClipboardListIcon,
  ChartLineIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function PurchasesDashboard() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: stats } = trpc.purchases.getDashboardStats.useQuery();

  return (
    <PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Procurement Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Purchase orders, supplier management, and incoming inventory
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Procurement Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/purchases/pending">
              <ClipboardListIcon className="mr-2 h-4 w-4" /> View Pending Orders
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
                <ActivityIcon className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg">
                Purchase Orders Today
              </h3>
              <p className="text-muted-foreground text-xs">
                {stats?.posToday ?? 0} orders
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
                Pending PO Approval
              </h3>
              <p className="text-muted-foreground text-xs">
                {stats?.pendingApproval ?? 0} orders
              </p>
            </div>
          </div>
        </div>
        <div className="border-border/50 bg-card/80 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                <TruckIcon className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg">
                Incoming Inventory
              </h3>
              <p className="text-muted-foreground text-xs">
                {stats?.incomingInventory ?? 0} units
              </p>
            </div>
          </div>
        </div>
        <div className="border-border/50 bg-card/80 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-1 text-center sm:gap-2">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
                <UsersIcon className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg">
                Supplier Contacts
              </h3>
              <p className="text-muted-foreground text-xs">
                {stats?.supplierContacts ?? 0} active
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}


