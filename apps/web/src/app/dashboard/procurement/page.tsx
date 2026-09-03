"use client";

import Link from "next/link";
import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import {
  TruckIcon,
  UsersIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  BoxesIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  InfoIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition, StaggerList, StaggerItem, AnimatedCard } from "@/lib/animations";

export default function ProcurementDashboardOverview() {
  const trpc = useTRPC();

  // Queries
  const { data: pos, isLoading: posLoading } = trpc.warehouse.getReceivingPOs.useQuery();
  const { data: suppliersList, isLoading: suppliersLoading } = trpc.suppliers.list.useQuery();
  const { data: invData, isLoading: invLoading } = trpc.inventory.list.useQuery({ limit: 100 });

  // Calculate dynamic KPIs from DB
  const activeSuppliersCount = suppliersList?.length || 0;
  const openPOsCount = pos?.filter(p => p.status === "pending").length || 0;
  const receivedPOsCount = pos?.filter(p => p.status === "received" || p.status === "completed").length || 0;

  const totalSpend = pos?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
  const totalOutstandingBalance = suppliersList?.reduce((acc, curr) => acc + Number(curr.outstanding_balance || 0), 0) || 0;

  // Filter low stock items requiring immediate procurement
  const lowStockItems = invData?.items?.filter(item => item.status === "low_stock" || item.qty_on_hand <= 5) || [];

  const kpis = [
    {
      title: "Total Purchase Spend",
      value: `₹${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      desc: "Accumulated procurement volume",
      icon: TrendingUpIcon,
      color: "border-l-blue-500",
      iconColor: "text-blue-500",
    },
    {
      title: "Open Purchase Orders",
      value: openPOsCount,
      desc: "Expected inbound PO shipments",
      icon: TruckIcon,
      color: "border-l-yellow-500",
      iconColor: "text-yellow-500",
    },
    {
      title: "Outstanding Balance",
      value: `₹${totalOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      desc: "Due to suppliers ledger",
      icon: ClipboardListIcon,
      color: "border-l-red-500",
      iconColor: "text-red-500",
    },
    {
      title: "Active Suppliers",
      value: activeSuppliersCount,
      desc: "Partners in directory",
      icon: UsersIcon,
      color: "border-l-green-500",
      iconColor: "text-green-500",
    },
  ];

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      {/* Supervisor banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 border rounded-xl p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Procurement & Suppliers Dashboard
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage bulk purchases, supplier outstanding balances, low stock reorders, and procurement trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Role: Procurement Manager
          </Badge>
        </div>
      </div>

      {/* KPIs Row */}
      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <StaggerItem key={idx}>
              <AnimatedCard>
                <Card className={`border-l-4 ${kpi.color} shadow-sm bg-white dark:bg-slate-800`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      {kpi.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="font-bold text-xl sm:text-2xl text-slate-900 dark:text-slate-100">
                      {posLoading || suppliersLoading ? "..." : kpi.value}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{kpi.desc}</p>
                  </CardContent>
                </Card>
              </AnimatedCard>
            </StaggerItem>
          );
        })}
      </StaggerList>

      {/* Two-Column Workspace */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Low Stock Procurement Advisor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-base font-bold">Low-Stock Procurement Advisor</CardTitle>
                <CardDescription>Live catalog lines falling below reorder thresholds. Order replenishment immediately.</CardDescription>
              </div>
              <Badge variant="destructive" className="animate-pulse">
                {lowStockItems.length} Warnings
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Material</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-xs">{item.product}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-500">{item.sku}</TableCell>
                      <TableCell className="font-bold text-red-600 text-xs">{item.qty_on_hand} units</TableCell>
                      <TableCell className="text-xs font-semibold">{item.reorder_level} units</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link href="/dashboard/procurement/purchase-orders">
                            Replenish
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {lowStockItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <BoxesIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No products currently require replenishment.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Inbound Purchases Overview */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold">Inbound Purchase Track</CardTitle>
              <CardDescription>Status and progression of expected procurement lots</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center text-xs border-b pb-2">
                <span>Completed / Received Purchases</span>
                <span className="font-bold text-green-600">{receivedPOsCount} POs</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b pb-2">
                <span>Pending expected receipts</span>
                <span className="font-bold text-yellow-600">{openPOsCount} POs</span>
              </div>

              {openPOsCount > 0 && (
                <div className="border border-amber-200 bg-amber-50 p-3 rounded-lg flex gap-3">
                  <AlertTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800">Pending Goods Received Note (GRN)</h5>
                    <p className="text-[11px] text-amber-700 mt-1">
                      {openPOsCount} purchase orders are currently awaiting check-in at the dock gates. Ensure coordination with WMS team.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
