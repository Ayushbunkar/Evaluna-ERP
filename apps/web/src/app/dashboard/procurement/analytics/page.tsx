"use client";

import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import {
  BarChart3Icon,
  TrendingUpIcon,
  Loader2Icon,
  UsersIcon,
  ClipboardListIcon,
} from "lucide-react";

export default function ProcurementAnalyticsPage() {
  const trpc = useTRPC();

  // Queries
  const { data: pos, isLoading: posLoading } = trpc.warehouse.getReceivingPOs.useQuery();
  const { data: suppliersList, isLoading: suppliersLoading } = trpc.suppliers.list.useQuery();

  const totalSpend = pos?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
  const activeSuppliersCount = suppliersList?.length || 0;
  const openPOsCount = pos?.filter(p => p.status === "pending").length || 0;

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
          Procurement Spend & Partner Analytics
        </h2>
        <p className="text-muted-foreground text-sm">
          Overview lead-times, total purchase volumes, and partner delivery performance ratios.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Outlay Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              ₹{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Accumulated ledger expenditure</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Supplier On-Time Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.6%</div>
            <p className="text-[10px] text-muted-foreground mt-1">SLA on-time delivery ratio</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Supply Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {suppliersLoading ? "..." : activeSuppliersCount} channels
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Active supplier partners registered</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Expected Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {posLoading ? "..." : openPOsCount} batches
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Expected inbound deliveries in transit</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Outlay trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Monthly Purchase Outlay Trend</CardTitle>
            <CardDescription>Processed procurement capital volumes by month</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] flex items-end justify-between gap-2 pt-6">
            {[20, 35, 45, 55, 60, 45, 75, 85, 95, 100].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                  style={{ height: `${val}%` }}
                ></div>
                <span className="text-[9px] text-slate-400 font-semibold">Month {1 + i}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Lead time statistics summary */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Supplier Lead-Time Compliance</CardTitle>
            <CardDescription>Average transit durations from order issue to GRN sealing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex justify-between items-center text-xs border-b pb-2 font-semibold text-slate-700">
              <span>Bhopal Main Warehouse transit SLA</span>
              <span className="text-green-600 font-bold">2.4 Days average</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b pb-2 font-semibold text-slate-700">
              <span>Acme Corp lead time</span>
              <span className="text-green-600 font-bold">1.8 Days</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 font-semibold text-slate-700">
              <span>Overall procurement on-time rate</span>
              <span className="text-blue-600 font-bold">98.6% accuracy</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
