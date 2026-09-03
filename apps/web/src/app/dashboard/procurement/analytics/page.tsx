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
  AlertTriangleIcon,
} from "lucide-react";

export default function ProcurementAnalyticsPage() {
  const trpc = useTRPC();

  // Query real analytics from database
  const { data, isLoading } = trpc.purchases.getAnalytics.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const {
    totalSpend = 0,
    activeSuppliersCount = 0,
    openPOsCount = 0,
    avgLeadTimeDays = 0,
    outlayTrend = [],
    suppliersMetric = [],
    onTimeRate = 100,
    lowStockCount = 0,
    lowStockItems = [],
  } = data || {};

  // Find max outlay to scale chart bars nicely
  const maxOutlay = Math.max(...outlayTrend.map((t) => t.amount), 1);

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
            <div className="text-2xl font-bold text-green-600">{onTimeRate}%</div>
            <p className="text-[10px] text-muted-foreground mt-1">SLA on-time delivery ratio</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Supply Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeSuppliersCount} channels
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
              {openPOsCount} batches
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
            {outlayTrend.map((t, i) => {
              const pct = (t.amount / maxOutlay) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  <div className="absolute bottom-16 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    ₹{t.amount.toLocaleString()}
                  </div>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  ></div>
                  <span className="text-[9px] text-slate-400 font-semibold whitespace-nowrap">{t.label}</span>
                </div>
              );
            })}
            {outlayTrend.length === 0 && (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                No monthly transactional data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead time statistics summary */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Supplier Spend & Lead-Time Metrics</CardTitle>
            <CardDescription>Real transit compliance from purchase issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex justify-between items-center text-xs border-b pb-2 font-semibold text-slate-700 dark:text-slate-300">
              <span>Overall procurement on-time rate</span>
              <span className="text-blue-600 font-bold">{onTimeRate}% accuracy</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b pb-2 font-semibold text-slate-700 dark:text-slate-300">
              <span>Average purchase lead time</span>
              <span className="text-green-600 font-bold">
                {avgLeadTimeDays > 0 ? `${avgLeadTimeDays} Days` : "No completed GRNs yet"}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Suppliers Spend</span>
              <div className="mt-2 space-y-2">
                {suppliersMetric.map((sm, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">{sm.name} ({sm.poCount} POs)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{sm.spend.toLocaleString()}</span>
                  </div>
                ))}
                {suppliersMetric.length === 0 && (
                  <div className="text-xs text-muted-foreground">No supplier spend data recorded.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alerts section */}
      <Card className="shadow-sm border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <AlertTriangleIcon className="h-5 w-5 text-red-500" />
          <div>
            <CardTitle className="text-base font-bold">Procurement Shortage & Low-Stock Alerts</CardTitle>
            <CardDescription>Items below minimum threshold (10 units) needing urgent purchase orders</CardDescription>
          </div>
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {lowStockCount} Critical
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {lowStockItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="pb-2 font-semibold">Product Name</th>
                    <th className="pb-2 font-semibold">SKU Code</th>
                    <th className="pb-2 font-semibold text-right">In-Stock Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lowStockItems.map((item, idx) => (
                    <tr key={idx} className="text-slate-700 dark:text-slate-300">
                      <td className="py-2">{item.productName}</td>
                      <td className="py-2 font-mono">{item.sku}</td>
                      <td className="py-2 text-right font-bold text-red-600">{item.inStock} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              All inventory levels are currently above minimum critical thresholds. No actions required.
            </p>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
