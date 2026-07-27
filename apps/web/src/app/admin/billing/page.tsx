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
  CreditCardIcon,
  IndianRupeeIcon,
  TrendingUpIcon,
  ClockIcon,
  UsersIcon,
} from "lucide-react";

export default function BillingPage() {
  const { data, isLoading } = trpc.billing.getDashboardStats.useQuery({});

  const kpis = [
    { label: "Today's Bills", value: data?.todaysBills?.toString() ?? "0", icon: CreditCardIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Revenue Today", value: data ? `₹${data.revenue.toLocaleString("en-IN")}` : "₹0", icon: IndianRupeeIcon, color: "text-green-600", bg: "bg-green-50" },
    { label: "Avg. Bill Value", value: data ? `₹${data.averageBill.toLocaleString("en-IN")}` : "₹0", icon: TrendingUpIcon, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Pending Bills", value: data?.pendingBills?.toString() ?? "0", icon: ClockIcon, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  const paymentCards = [
    { label: "Cash", value: data?.cashCollected ?? 0, color: "text-green-600" },
    { label: "Card", value: data?.cardCollected ?? 0, color: "text-blue-600" },
    { label: "UPI", value: data?.upiCollected ?? 0, color: "text-purple-600" },
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Billing
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Today's billing summary and payment breakdown</p>
        </div>
        <Button className="bg-gradient-to-r from-green-600 to-teal-600 text-white gap-2">
          <CreditCardIcon className="w-4 h-4" />
          New Invoice
        </Button>
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

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Payment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentCards.map((p) => (
                <div key={p.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{p.label}</span>
                  {isLoading ? <Skeleton className="h-5 w-24" /> : (
                    <span className={`font-semibold ${p.color}`}>₹{p.value.toLocaleString("en-IN")}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UsersIcon className="w-4 h-4" /> Top Cashiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                {(data?.topCashiers ?? []).map((cashier, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{cashier.name}</p>
                      <p className="text-xs text-muted-foreground">{cashier.bills} bills</p>
                    </div>
                    <span className="font-semibold text-green-600">₹{cashier.revenue.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-green-600" />
            Recent Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recentBills ?? []).map((bill, i) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">{bill.id}</TableCell>
                    <TableCell>{bill.customer}</TableCell>
                    <TableCell>{bill.items}</TableCell>
                    <TableCell className="font-semibold">₹{bill.amount.toLocaleString("en-IN")}</TableCell>
                    <TableCell><Badge variant="outline">{bill.payment}</Badge></TableCell>
                    <TableCell>
                      {bill.status === "paid"
                        ? <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        : <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
