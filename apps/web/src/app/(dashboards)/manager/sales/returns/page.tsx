"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Input } from "@evaluna/ui/components/input";
import { Search, Undo2, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function ReturnsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: orders, isLoading } = trpc.orders.list.useQuery();

  const returnedOrders = orders?.filter((order) => order.status === "cancelled") || [];

  const filteredReturns = returnedOrders.filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
      order.id.toString().includes(term) ||
      order.customer?.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Returns Management</h1>
          <p className="text-muted-foreground mt-1">
            Initiate and track customer returns and reversed transactions.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search return ID..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Initiate Return
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <Undo2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returnedOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time reversed orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return History</CardTitle>
          <CardDescription>A log of all reversed or cancelled orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Original Order Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Refund Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No returns found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReturns.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <TableCell className="font-medium">RET-{order.id}</TableCell>
                        <TableCell>
                          {order.created_at ? format(new Date(order.created_at), "MMM d, yyyy h:mm a") : "N/A"}
                        </TableCell>
                        <TableCell>{order.customer?.name || "Walk-in Customer"}</TableCell>
                        <TableCell>${parseFloat(order.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                            Refunded / Cancelled
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
