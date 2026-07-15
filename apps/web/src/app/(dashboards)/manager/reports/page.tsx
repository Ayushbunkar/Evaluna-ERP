"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@evaluna/ui/components/tabs";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Download, BarChart3, TrendingUp, Package, Users, DollarSign, Activity } from "lucide-react";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  // Mock queries using trpc
  const { data: salesReport, isLoading: loadingSales } = trpc.reports.getSalesReport.useQuery({ 
    startDate: dateRange.from, endDate: dateRange.to 
  });

  const handleExportCSV = () => {
    toast.success("Exporting CSV...");
    // Mock export functionality
    setTimeout(() => toast.info("Report downloaded"), 1000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branch Reports</h1>
          <p className="text-muted-foreground">Comprehensive analytics for your branch.</p>
        </div>
        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border">
          <div className="flex items-center gap-2">
            <Label htmlFor="from" className="text-xs">From</Label>
            <Input 
              id="from" 
              type="date" 
              className="h-8 w-auto text-sm" 
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="to" className="text-xs">To</Label>
            <Input 
              id="to" 
              type="date" 
              className="h-8 w-auto text-sm"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
          </div>
          <Button size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Breakdown</CardTitle>
              <CardDescription>Daily revenue trends and totals.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Chart Placeholder */}
              <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-6 border border-dashed">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Interactive Sales Chart</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-right">Discounts</TableHead>
                    <TableHead className="text-right">Net Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Mock Data */}
                  <TableRow>
                    <TableCell>{format(new Date(), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">42</TableCell>
                    <TableCell className="text-right">$1,240.00</TableCell>
                    <TableCell className="text-right text-red-500">-$45.00</TableCell>
                    <TableCell className="text-right font-bold">$1,195.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{format(subDays(new Date(), 1), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">38</TableCell>
                    <TableCell className="text-right">$980.50</TableCell>
                    <TableCell className="text-right text-red-500">-$20.00</TableCell>
                    <TableCell className="text-right font-bold">$960.50</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Espresso Blend', 'Ceramic Mug', 'Almond Milk (1L)'].map((p, i) => (
                      <div key={p} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{i+1}</div>
                          <span className="font-medium">{p}</span>
                        </div>
                        <span className="text-muted-foreground">{150 - (i*30)} units</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Low Stock Alerts</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Oat Milk (1L)</span>
                      <Badge variant="destructive">2 left</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Caramel Syrup</span>
                      <Badge variant="destructive">5 left</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">New Customers</p>
                    <h3 className="text-2xl font-bold mt-1">+124</h3>
                  </div>
                  <Users className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Loyalty Redemptions</p>
                    <h3 className="text-2xl font-bold mt-1">45</h3>
                  </div>
                  <AwardIcon className="h-8 w-8 text-yellow-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                    <h3 className="text-2xl font-bold mt-1">68%</h3>
                  </div>
                  <Activity className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Payroll</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="text-right">$4,500.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Inventory Purchases</TableCell>
                    <TableCell>12</TableCell>
                    <TableCell className="text-right">$2,100.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Utilities</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell className="text-right">$450.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-green-800 dark:text-green-400">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1 text-green-900 dark:text-green-300">$18,450.00</h3>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-red-800 dark:text-red-400">COGS (Cost of Goods)</p>
                <h3 className="text-2xl font-bold mt-1 text-red-900 dark:text-red-300">$6,200.00</h3>
              </CardContent>
            </Card>
            <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-400">Operating Expenses</p>
                <h3 className="text-2xl font-bold mt-1 text-orange-900 dark:text-orange-300">$7,050.00</h3>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-400">Net Profit</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-900 dark:text-blue-300">$5,200.00</h3>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AwardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}