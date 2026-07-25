"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { format, subDays } from "date-fns";
import { Download, TrendingUp, AlertTriangle, FileText, Loader2, Table as TableIcon, LayoutDashboard, ShoppingCart, Users, Briefcase, IndianRupee, Store, Ticket, Star, ShieldAlert, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REPORT_TYPES = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sales", label: "Sales", icon: ShoppingCart },
  { id: "gst", label: "GST", icon: FileText },
  { id: "profit", label: "Profit", icon: TrendingUp },
  { id: "stock", label: "Stock", icon: TableIcon },
  { id: "low_stock", label: "Low Stock", icon: AlertTriangle },
  { id: "damage", label: "Damage", icon: ShieldAlert },
  { id: "expiry", label: "Expiry", icon: Timer },
  { id: "customers", label: "Customers", icon: Users },
  { id: "suppliers", label: "Suppliers", icon: Briefcase },
  { id: "cash_book", label: "Cash Book", icon: IndianRupee },
  { id: "branch_comparison", label: "Branch Comparison", icon: Store },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "loyalty", label: "Loyalty", icon: Star },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("overview");
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });
  const [branchId, setBranchId] = useState("all");
  
  const utils = trpc.useUtils();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        let result: any = null;
        const args = { startDate: dateRange.start, endDate: dateRange.end, branchId: branchId === "all" ? undefined : branchId };

        switch (activeReport) {
          case "sales": result = await utils.reports.getSalesReport.fetch(args); break;
          case "gst": result = await utils.reports.getGstReport.fetch(args); break;
          case "profit": result = await utils.reports.getProfitReport.fetch(args); break;
          case "stock": result = await utils.reports.getStockReport.fetch(args); break;
          case "low_stock": result = await utils.reports.getLowStockReport.fetch(args); break;
          case "damage": result = await utils.reports.getDamageReport.fetch(args); break;
          case "expiry": result = await utils.reports.getExpiryReport.fetch(args); break;
          case "customers": result = await utils.reports.getCustomersReport.fetch(args); break;
          case "suppliers": result = await utils.reports.getSuppliersReport.fetch(args); break;
          case "cash_book": result = await utils.reports.getCashBookReport.fetch(args); break;
          case "branch_comparison": result = await utils.reports.getBranchComparisonReport.fetch(args); break;
          case "coupons": result = await utils.reports.getCouponsReport.fetch(args); break;
          case "loyalty": result = await utils.reports.getLoyaltyReport.fetch(args); break;
          case "overview": 
            const p = await utils.reports.getProfitReport.fetch(args);
            const g = await utils.reports.getGstReport.fetch(args);
            result = { profit: p, gst: g };
            break;
          default: break;
        }

        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch report", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();

    return () => { isMounted = false; };
  }, [activeReport, dateRange.start, dateRange.end, branchId, utils]);

  const handleExport = () => {
    if (!data) return;
    
    // Normalize data to array
    let arrayData: any[] = [];
    if (activeReport === "overview") {
      arrayData = [{
        Revenue: data.profit?.totalRevenue || 0,
        COGS: data.profit?.cogs || 0,
        GrossProfit: data.profit?.grossProfit || 0,
        CGST: data.gst?.totalCgst || 0,
        SGST: data.gst?.totalSgst || 0,
        TotalTax: data.gst?.totalTax || 0,
      }];
    } else {
      arrayData = Array.isArray(data) ? data : [data];
    }
    
    if (arrayData.length === 0) return;
    
    const headers = Object.keys(arrayData[0]);
    const csvRows = [headers.join(",")];

    for (const row of arrayData) {
      const values = headers.map(header => {
        const val = row[header];
        if (typeof val === 'object' && val !== null) {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val ?? "").replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport}-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading report data...</p>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>No data available for this report.</p>
        </div>
      );
    }

    // Special rendering for overview
    if (activeReport === "overview") {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.profit?.totalRevenue?.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">₹{data.profit?.cogs?.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">₹{data.profit?.grossProfit?.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total GST Collected</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.gst?.totalTax?.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-muted-foreground">
                CGST: ₹{data.gst?.totalCgst?.toFixed(2)} | SGST: ₹{data.gst?.totalSgst?.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Generic table rendering for array data
    let arrayData = Array.isArray(data) ? data : [data];

    // If it's empty
    if (arrayData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>The report is empty for the selected period.</p>
        </div>
      );
    }

    const headers = Object.keys(arrayData[0]);

    return (
      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map(header => (
                  <TableHead key={header} className="capitalize">{header.replace(/_/g, " ")}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrayData.map((row, idx) => (
                <TableRow key={idx}>
                  {headers.map(header => {
                    const val = row[header];
                    let displayVal = val;
                    if (typeof val === 'object' && val !== null) {
                      displayVal = JSON.stringify(val);
                    }
                    return <TableCell key={header}>{String(displayVal ?? "-")}</TableCell>;
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      {/* Sticky Header / Filters */}
      <div className="flex-none border-b bg-background z-10 sticky top-0 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Report Center</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-card">
              <Label htmlFor="start" className="sr-only">Start Date</Label>
              <Input 
                id="start"
                type="date" 
                value={dateRange.start} 
                onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))}
                className="w-[140px] h-8 border-0 focus-visible:ring-0 p-0"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Label htmlFor="end" className="sr-only">End Date</Label>
              <Input 
                id="end"
                type="date" 
                value={dateRange.end} 
                onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}
                className="w-[140px] h-8 border-0 focus-visible:ring-0 p-0"
              />
            </div>

            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="main">Main Branch</SelectItem>
                <SelectItem value="downtown">Downtown Branch</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} variant="outline" className="h-10">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-none border-r bg-muted/20 overflow-y-auto hidden md:block p-4">
          <nav className="flex flex-col gap-1">
            {REPORT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveReport(type.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeReport === type.id 
                      ? "bg-primary text-primary-foreground shadow" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReport}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight">
                  {REPORT_TYPES.find(r => r.id === activeReport)?.label} Report
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Showing data from {dateRange.start} to {dateRange.end}
                </p>
              </div>

              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
