"use client";

import { trpc } from "@/lib/trpc/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
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
  LandmarkIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  IndianRupeeIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
} from "lucide-react";

export default function FinancePage() {
  const { data, isLoading } = trpc.finance.getDashboardStats.useQuery({});

  const kpis = [
    { label: "Monthly Revenue", value: data ? `₹${data.monthlyRevenue.toLocaleString("en-IN")}` : "—", icon: TrendingUpIcon, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Expenses", value: data ? `₹${data.totalExpenses.toLocaleString("en-IN")}` : "—", icon: TrendingDownIcon, color: "text-red-600", bg: "bg-red-50" },
    { label: "Net Profit", value: data ? `₹${data.netProfit.toLocaleString("en-IN")}` : "—", icon: IndianRupeeIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "GST Liability", value: data ? `₹${data.gstLiability.toLocaleString("en-IN")}` : "—", icon: LandmarkIcon, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const secondRow = [
    { label: "Total Receivables", value: data ? `₹${data.totalReceivables.toLocaleString("en-IN")}` : "—", color: "text-green-600" },
    { label: "Total Payables", value: data ? `₹${data.totalPayables.toLocaleString("en-IN")}` : "—", color: "text-red-600" },
    { label: "Cash Flow", value: data ? `₹${data.cashFlow.toLocaleString("en-IN")}` : "—", color: "text-blue-600" },
    { label: "Today's Cash", value: data ? `₹${data.todaysCash.toLocaleString("en-IN")}` : "—", color: "text-teal-600" },
  ];

  return (
    <motion.div
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Finance
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Complete financial overview — revenue, expenses, GST, and cash flow</p>
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
                    {isLoading ? <Skeleton className="h-6 w-24 mt-1" /> : <p className="text-xl font-bold">{kpi.value}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {secondRow.map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              {isLoading ? <Skeleton className="h-8 w-32 mt-2" /> : <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Bank Balances</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                {(data?.bankBalances ?? []).map((bank, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{bank.account}</p>
                      <p className="text-xs text-muted-foreground">{bank.type}</p>
                    </div>
                    <span className="font-bold text-green-600">₹{bank.balance.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm flex gap-2 items-center">
              <LandmarkIcon className="w-4 h-4" /> GST Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Input Tax Credit</span>
                {isLoading ? <Skeleton className="h-5 w-20" /> : <span className="font-semibold text-green-600">₹{data?.gstSummary?.inputTax?.toLocaleString("en-IN")}</span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Output Tax</span>
                {isLoading ? <Skeleton className="h-5 w-20" /> : <span className="font-semibold text-red-600">₹{data?.gstSummary?.outputTax?.toLocaleString("en-IN")}</span>}
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-semibold">Net GST Liability</span>
                {isLoading ? <Skeleton className="h-6 w-24" /> : <span className="font-bold text-xl text-purple-600">₹{data?.gstSummary?.netLiability?.toLocaleString("en-IN")}</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupeeIcon className="w-5 h-5 text-purple-600" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recentTransactions ?? []).map((tx, i) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{tx.date}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      {tx.type === "credit"
                        ? <div className="flex items-center gap-1 text-green-600 text-sm"><ArrowDownLeftIcon className="w-3 h-3" />Credit</div>
                        : <div className="flex items-center gap-1 text-red-600 text-sm"><ArrowUpRightIcon className="w-3 h-3" />Debit</div>
                      }
                    </TableCell>
                    <TableCell className={`font-semibold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      {tx.status === "completed"
                        ? <Badge className="bg-green-100 text-green-800">Completed</Badge>
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
