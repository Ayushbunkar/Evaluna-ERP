"use client";

import { trpc } from "@/lib/trpc/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import {
  ShoppingCartIcon,
  IndianRupeeIcon,
  TrendingUpIcon,
  PackageIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";

const statusBadge = (status: string | null | undefined) => {
  if (status === "completed" || status === "delivered") return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
  if (status === "cancelled") return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
  if (status === "processing") return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
};

export default function SalesPage() {
  const { data: orders, isLoading } = trpc.orders.list.useQuery();

  const items = Array.isArray(orders) ? orders : [];
  const total = items.reduce((acc, o) => acc + parseFloat(o.total_amount ?? "0"), 0);
  const avg = items.length > 0 ? total / items.length : 0;
  const completed = items.filter((o) => o.status === "completed" || o.status === "delivered");

  const kpis = [
    { label: "Total Orders", value: items.length.toString(), icon: ShoppingCartIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Revenue", value: `₹${total.toLocaleString("en-IN")}`, icon: IndianRupeeIcon, color: "text-green-600", bg: "bg-green-50" },
    { label: "Avg. Order Value", value: `₹${avg.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: TrendingUpIcon, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Completed", value: completed.length.toString(), icon: PackageIcon, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  return (
    <motion.div
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Sales
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track all sales orders and revenue</p>
        </div>
        <Link href="/admin/pos">
          <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white gap-2">
            <PlusIcon className="w-4 h-4" />
            New Sale (POS)
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`${kpi.bg} p-2 rounded-lg`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    {isLoading ? <Skeleton className="h-6 w-20 mt-1" /> : <p className="text-xl font-bold">{kpi.value}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCartIcon className="w-5 h-5 text-teal-600" />
            Sales Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No orders found. Create your first sale from POS.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">ORD-{order.id}</TableCell>
                      <TableCell>{order.customer?.name ?? "Walk-in Customer"}</TableCell>
                      <TableCell>{order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "—"}</TableCell>
                      <TableCell className="font-semibold">₹{parseFloat(order.total_amount ?? "0").toLocaleString("en-IN")}</TableCell>
                      <TableCell>{statusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
