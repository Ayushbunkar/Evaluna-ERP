"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Badge } from "@evaluna/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import { Search, CreditCard, Banknote, History, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: transactions, isLoading } = trpc.transactions.list.useQuery();

  const filteredTransactions = transactions?.filter(t =>
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Tracking</h1>
          <p className="text-muted-foreground">Monitor payments, split transactions, and outstanding balances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Collected (Today)</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹12,450.00</div>
            <p className="text-xs text-muted-foreground">+20.1% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₹3,200.00</div>
            <p className="text-xs text-muted-foreground">4 orders awaiting completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Store Credit Issued</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹850.00</div>
            <p className="text-xs text-muted-foreground">Across 3 customers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <CardTitle>Recent Transactions</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trx ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions?.map((trx, i) => (
                    <motion.tr
                      key={trx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        TRX-{trx.id.toString().padStart(4, '0')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{trx.description || 'Payment'}</span>
                          {trx.order_id && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              Order #{trx.order_id} <ExternalLink className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {trx.type || 'income'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={trx.status === 'completed' ? 'default' : trx.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">
                          {trx.status || 'completed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={trx.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                          {trx.type === 'expense' ? '-' : '+'}₹{parseFloat(trx.amount).toFixed(2)}
                        </span>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
