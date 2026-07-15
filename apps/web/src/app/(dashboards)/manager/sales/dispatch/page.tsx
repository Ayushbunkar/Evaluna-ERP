"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
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

type Order = {
  id: number;
  customer_id: number | null;
  total_amount: string;
  status: string | null;
  user_uid: string;
  created_at: Date | null;
  customer: { name: string } | null;
};

export default function DispatchPage() {
  const { data: orders = [], isLoading, refetch } = trpc.orders.list.useQuery();
  const updateOrder = trpc.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Order status updated");
      refetch();
    },
    onError: (err) => {
      toast.error(`Error updating order: ${err.message}`);
    },
  });

  // Filter orders that are ready for dispatch or in early stages
  const dispatchOrders = orders
    .filter((o: Order) => ["pending", "billed", "picked", "ready_for_dispatch"].includes(o.status || ""))
    .sort((a, b) => {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const handleUpdateStatus = (id: number, status: string) => {
    updateOrder.mutate({ id, status });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
      case "billed":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
      case "picked":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Picked</Badge>;
      case "ready_for_dispatch":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Ready</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatch Queue</h1>
          <p className="text-muted-foreground mt-1">
            Manage orders ready to be handed to drivers or customers.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading || updateOrder.isPending}>
          <Clock className="mr-2 h-4 w-4" />
          Refresh Queue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders to Dispatch</CardTitle>
          <CardDescription>View and assign orders for delivery</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : dispatchOrders.length === 0 ? (
            <div className="text-center py-10">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No orders to dispatch</h3>
              <p className="text-muted-foreground text-sm mt-1">
                All orders have been dispatched or there are no pending orders.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchOrders.map((order: Order, index: number) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        {order.created_at ? format(new Date(order.created_at), "MMM d, h:mm a") : "—"}
                      </TableCell>
                      <TableCell>{order.customer?.name || "Walk-in"}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateStatus(order.id, "picked")}
                            disabled={order.status === "picked" || updateOrder.isPending}
                          >
                            Mark Picked
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, "out_for_delivery")}
                            disabled={updateOrder.isPending}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Dispatch
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
