"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { format, isToday, parseISO, startOfDay, endOfDay } from "date-fns";
import {
  Download,
  TrendingUp,
  ShoppingBag,
  Calculator,
  Receipt,
  BarChart3,
  CalendarDays,
  RefreshCw,
  Truck,
} from "lucide-react";
import Link from "next/link";

import { trpc } from "@/lib/trpc/client";
import { KpiCard } from "@/components/shared/cards/kpi-card";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TAX_RATE = 0.08; // 8% tax – adjust as needed

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function getTodayString() {
  return format(new Date(), "yyyy-MM-dd");
}

// ─── Types (inferred from TRPC) ───────────────────────────────────────────────

type Order = {
  id: number;
  customer_id: number | null;
  total_amount: string;
  status: string | null;
  user_uid: string;
  created_at: Date | null;
  customer: { name: string } | null;
};

type SaleRow = {
  id: number;
  time: string;
  customer: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  created_at: Date;
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportToCSV(rows: SaleRow[], date: string) {
  const headers = ["Order#", "Time", "Customer", "Subtotal", "Tax", "Total", "Payment Method"];
  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      [
        `#${r.id}`,
        r.time,
        `"${r.customer}"`,
        r.subtotal.toFixed(2),
        r.tax.toFixed(2),
        r.total.toFixed(2),
        r.paymentMethod,
      ].join(",")
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Skeleton KPI ─────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </Card>
      ))}
    </div>
  );
}

// ─── Hourly Chart Placeholder ─────────────────────────────────────────────────

function HourlySalesChart({
  rows,
  isLoading,
}: {
  rows: SaleRow[];
  isLoading: boolean;
}) {
  // Build a simple hour-bucket summary for the placeholder bars
  const hourlyData = useMemo(() => {
    const buckets: Record<number, number> = {};
    for (let h = 0; h < 24; h++) buckets[h] = 0;
    rows.forEach((r) => {
      const hour = new Date(r.created_at).getHours();
      buckets[hour] = (buckets[hour] ?? 0) + r.total;
    });
    return Object.entries(buckets)
      .map(([hour, total]) => ({ hour: parseInt(hour), total }))
      .filter((b) => b.hour >= 6 && b.hour <= 22); // show business hours
  }, [rows]);

  const maxValue = Math.max(...hourlyData.map((d) => d.total), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Hourly Sales Chart
            </CardTitle>
            <CardDescription>Revenue distribution by hour for selected date</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full flex items-end gap-1 border border-dashed rounded-xl p-4 bg-muted/20">
          {isLoading ? (
            <div className="w-full flex items-end gap-1">
              {Array.from({ length: 17 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/10 rounded-t animate-pulse"
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <BarChart3 className="h-10 w-10 opacity-30" />
              <p className="text-sm">No sales data for this date</p>
            </div>
          ) : (
            hourlyData.map((bucket) => (
              <div
                key={bucket.hour}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                <div
                  className="w-full bg-primary/70 hover:bg-primary transition-all rounded-t cursor-default relative"
                  style={{
                    height: `${Math.max((bucket.total / maxValue) * 100, 2)}%`,
                  }}
                  title={`${bucket.hour}:00 – ${formatCurrency(bucket.total)}`}
                />
                {bucket.hour % 3 === 0 && (
                  <span className="text-[9px] text-muted-foreground">
                    {bucket.hour}h
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagerSalesPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const { data: allOrders = [], isLoading, refetch } = trpc.orders.list.useQuery();

  // ── Filter completed orders by selected date ──────────────────────────────
  const saleRows = useMemo<SaleRow[]>(() => {
    return allOrders
      .filter((o: Order) => {
        if (o.status !== "completed" || !o.created_at) return false;
        const orderDate = format(new Date(o.created_at), "yyyy-MM-dd");
        return orderDate === selectedDate;
      })
      .map((o: Order) => {
        const total = parseFloat(o.total_amount || "0");
        // Back-calculate subtotal from total (tax-inclusive)
        const subtotal = total / (1 + TAX_RATE);
        const tax = total - subtotal;
        return {
          id: o.id,
          time: o.created_at ? format(new Date(o.created_at), "h:mm a") : "—",
          customer: o.customer?.name ?? "Walk-in",
          subtotal,
          tax,
          total,
          // Payment method not in list query; marked as N/A
          paymentMethod: "N/A", // NOTE: mock – full detail requires trpc.orders.get per row
          created_at: o.created_at ? new Date(o.created_at) : new Date(),
        };
      })
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }, [allOrders, selectedDate]);

  // ── KPI computations ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const grossSales = saleRows.reduce((s, r) => s + r.total, 0);
    const totalTransactions = saleRows.length;
    const avgOrderValue = totalTransactions > 0 ? grossSales / totalTransactions : 0;
    const taxCollected = saleRows.reduce((s, r) => s + r.tax, 0);
    return { grossSales, totalTransactions, avgOrderValue, taxCollected };
  }, [saleRows]);

  // ── Totals for summary row ─────────────────────────────────────────────────
  const totals = useMemo(() => {
    return {
      subtotal: saleRows.reduce((s, r) => s + r.subtotal, 0),
      tax: saleRows.reduce((s, r) => s + r.tax, 0),
      total: saleRows.reduce((s, r) => s + r.total, 0),
    };
  }, [saleRows]);

  const handleExport = useCallback(() => {
    if (saleRows.length === 0) return;
    exportToCSV(saleRows, selectedDate);
  }, [saleRows, selectedDate]);

  const isSelectedToday = selectedDate === getTodayString();

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Sales</h1>
          <p className="text-muted-foreground mt-1">
            Revenue tracking and sales ledger for your branch.
          </p>
          <div className="flex gap-2 mt-4">
            <Link href="/manager/sales/dispatch">
              <Button variant="outline" size="sm">
                <Truck className="mr-2 h-4 w-4" />
                Dispatch Queue
              </Button>
            </Link>
            <Link href="/manager/sales/delivery">
              <Button variant="outline" size="sm">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Delivery Status
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm bg-transparent focus:outline-none"
              max={getTodayString()}
            />
          </div>
          {isSelectedToday && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              Today
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={saleRows.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <KpiCard
              title="Gross Sales"
              value={formatCurrency(kpis.grossSales)}
              icon={TrendingUp}
              description={`${kpis.totalTransactions} completed order${kpis.totalTransactions !== 1 ? "s" : ""}`}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <KpiCard
              title="Total Transactions"
              value={kpis.totalTransactions}
              icon={ShoppingBag}
              description="Completed sales only"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <KpiCard
              title="Avg Order Value"
              value={formatCurrency(kpis.avgOrderValue)}
              icon={Calculator}
              description="Per completed transaction"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <KpiCard
              title="Tax Collected"
              value={formatCurrency(kpis.taxCollected)}
              icon={Receipt}
              description={`At ${(TAX_RATE * 100).toFixed(0)}% tax rate`}
            />
          </motion.div>
        </div>
      )}

      {/* ── Hourly Chart ──────────────────────────────────────────────────── */}
      <HourlySalesChart rows={saleRows} isLoading={isLoading} />

      {/* ── Sales Ledger Table ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Ledger</CardTitle>
              <CardDescription>
                {isSelectedToday
                  ? "All completed orders for today"
                  : `Completed orders for ${format(parseISO(selectedDate), "MMMM d, yyyy")}`}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {saleRows.length} record{saleRows.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Time</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Tax ({(TAX_RATE * 100).toFixed(0)}%)</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-6">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : saleRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingBag className="h-8 w-8 opacity-30" />
                      <p>No completed sales for this date.</p>
                      <p className="text-xs opacity-60">
                        Try selecting a different date or check if orders have been completed.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                saleRows.map((row, idx) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="pl-6 text-muted-foreground text-sm font-mono">
                      {row.time}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-sm">
                      #{row.id}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{row.customer}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(row.subtotal)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatCurrency(row.tax)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(row.total)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="secondary" className="text-xs">
                        {row.paymentMethod}
                      </Badge>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>

            {/* ── Summary / Totals Row ─────────────────────────────────── */}
            {!isLoading && saleRows.length > 0 && (
              <TableFooter>
                <TableRow className="font-semibold">
                  <TableCell className="pl-6" colSpan={3}>
                    <span className="text-sm uppercase tracking-wider text-muted-foreground">
                      Daily Totals
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.subtotal)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(totals.tax)}
                  </TableCell>
                  <TableCell className="text-right text-primary text-base">
                    {formatCurrency(totals.total)}
                  </TableCell>
                  <TableCell className="pr-6 text-muted-foreground text-xs">
                    {saleRows.length} tx
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}