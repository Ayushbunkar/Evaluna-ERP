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
  ReceiptIcon,
  IndianRupeeIcon,
  CalendarIcon,
  AlertCircleIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";

const statusBadge = (status: string | null | undefined) => {
  if (status === "approved") return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
};

export default function ExpensesPage() {
  const { data, isLoading } = trpc.expenses.list.useQuery({ limit: 50 });

  const items = data?.items ?? [];
  const total = items.reduce((acc, e) => acc + parseFloat(e.amount ?? "0"), 0);
  const thisWeek = items.slice(0, Math.min(7, items.length)).reduce((acc, e) => acc + parseFloat(e.amount ?? "0"), 0);
  const pending = items.filter((e) => (e as any).status === "pending" || !(e as any).status);

  const kpis = [
    { label: "Total This Month", value: `₹${total.toLocaleString("en-IN")}`, icon: IndianRupeeIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "This Week", value: `₹${thisWeek.toLocaleString("en-IN")}`, icon: CalendarIcon, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Pending Approval", value: pending.length.toString(), icon: AlertCircleIcon, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Total Entries", value: items.length.toString(), icon: ReceiptIcon, color: "text-green-600", bg: "bg-green-50" },
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Expenses
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track all business expenses and reimbursements</p>
        </div>
        <Link href="/admin/expenses/create">
          <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white gap-2">
            <PlusIcon className="w-4 h-4" />
            Add Expense
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
            <ReceiptIcon className="w-5 h-5 text-orange-500" />
            Expense Records
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
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No expenses found. Record your first expense.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">EXP-{expense.id}</TableCell>
                      <TableCell>{expense.created_at ? new Date(expense.created_at).toLocaleDateString("en-IN") : "—"}</TableCell>
                      <TableCell className="capitalize">{expense.category ?? "General"}</TableCell>
                      <TableCell className="max-w-xs truncate">{expense.description ?? "—"}</TableCell>
                      <TableCell className="font-semibold text-red-600">₹{parseFloat(expense.amount ?? "0").toLocaleString("en-IN")}</TableCell>
                      <TableCell>{statusBadge((expense as any).status)}</TableCell>
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
