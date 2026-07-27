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
  ShoppingBagIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  PlusIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";

const statusBadge = (status: string | null) => {
  const s = status?.toLowerCase() ?? "unpaid";
  if (s === "paid") return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
  if (s === "partial") return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Partial</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200">Unpaid</Badge>;
};

export default function PurchasesPage() {
  const { data, isLoading } = trpc.purchases.list.useQuery({ limit: 50 });

  const items = data?.items ?? [];
  const total = items.reduce((acc, p) => acc + parseFloat(p.total_amount ?? "0"), 0);
  const paid = items.filter((p) => p.payment_status === "paid");
  const unpaid = items.filter((p) => p.payment_status === "unpaid");
  const partial = items.filter((p) => p.payment_status === "partial");

  const kpis = [
    { label: "Total Purchases", value: `₹${total.toLocaleString("en-IN")}`, icon: ShoppingBagIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Paid", value: paid.length.toString(), icon: CheckCircleIcon, color: "text-green-600", bg: "bg-green-50" },
    { label: "Unpaid", value: unpaid.length.toString(), icon: AlertCircleIcon, color: "text-red-600", bg: "bg-red-50" },
    { label: "Partial", value: partial.length.toString(), icon: ClockIcon, color: "text-yellow-600", bg: "bg-yellow-50" },
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Purchases
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all purchase orders and GRNs</p>
        </div>
        <Link href="/admin/purchases/create">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white gap-2">
            <PlusIcon className="w-4 h-4" />
            New Purchase
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
            <TruckIcon className="w-5 h-5 text-blue-600" />
            Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN No</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No purchases found. Create your first purchase order.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((purchase) => (
                    <TableRow key={purchase.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-medium">{purchase.grn_number ?? `PO-${purchase.id}`}</TableCell>
                      <TableCell>{(purchase as any).supplier?.name ?? "—"}</TableCell>
                      <TableCell>{purchase.created_at ? new Date(purchase.created_at).toLocaleDateString("en-IN") : "—"}</TableCell>
                      <TableCell className="font-semibold">₹{parseFloat(purchase.total_amount ?? "0").toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{parseFloat(purchase.amount_paid ?? "0").toLocaleString("en-IN")}</TableCell>
                      <TableCell>{statusBadge(purchase.payment_status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/purchases/${purchase.id}/return`}>
                            <Button size="sm" variant="outline">Return</Button>
                          </Link>
                        </div>
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
