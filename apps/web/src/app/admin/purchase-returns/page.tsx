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
  RotateCcwIcon,
  CheckCircleIcon,
  ClockIcon,
  IndianRupeeIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";

const statusBadge = (status: string | null) => {
  if (status === "processed") return <Badge className="bg-green-100 text-green-800 border-green-200">Processed</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
};

export default function PurchaseReturnsPage() {
  const { data: returns, isLoading } = trpc.purchaseReturns.list.useQuery();

  const items = Array.isArray(returns) ? returns : [];
  const total = items.reduce((acc, r) => acc + parseFloat(r.total_amount ?? "0"), 0);
  const processed = items.filter((r) => r.status === "processed");
  const pending = items.filter((r) => r.status !== "processed" && r.status !== "rejected");

  const kpis = [
    { label: "Total Returns", value: items.length.toString(), icon: RotateCcwIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Processed", value: processed.length.toString(), icon: CheckCircleIcon, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending", value: pending.length.toString(), icon: ClockIcon, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Total Refund", value: `₹${total.toLocaleString("en-IN")}`, icon: IndianRupeeIcon, color: "text-purple-600", bg: "bg-purple-50" },
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Purchase Returns
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage returned goods to suppliers</p>
        </div>
        <Link href="/admin/purchase-returns/create">
          <Button className="bg-gradient-to-r from-red-500 to-orange-500 text-white gap-2">
            <PlusIcon className="w-4 h-4" />
            New Return
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
            <RotateCcwIcon className="w-5 h-5 text-red-500" />
            Return Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Purchase ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Refund Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No purchase returns found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">RET-{r.id}</TableCell>
                      <TableCell>PO-{r.purchase_id}</TableCell>
                      <TableCell>{(r as any).supplier?.name ?? "—"}</TableCell>
                      <TableCell className="font-semibold text-red-600">₹{parseFloat(r.total_amount ?? "0").toLocaleString("en-IN")}</TableCell>
                      <TableCell>{r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "—"}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
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