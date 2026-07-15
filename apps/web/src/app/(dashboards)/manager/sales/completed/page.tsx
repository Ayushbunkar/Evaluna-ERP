"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@evaluna/ui/components/dialog";
import { RotateCcw, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@evaluna/ui/components/input";
import { motion } from "framer-motion";

export default function CompletedOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.orders.list.useQuery();
  
  const undoMutation = trpc.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Bill reversed successfully.");
      utils.orders.list.invalidate();
      setSelectedOrderId(null);
    },
    onError: (error) => {
      toast.error(`Failed to undo bill: ${error.message}`);
    }
  });

  const completedOrders = orders?.filter((order) => order.status === "completed") || [];
  
  const filteredOrders = completedOrders.filter((order) => {
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
          <h1 className="text-3xl font-bold tracking-tight">Completed Orders</h1>
          <p className="text-muted-foreground mt-1">
            View historical ledger of completed sales and undo accidental checkouts.
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by ID or customer..."
            className="pl-8 w-full sm:w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No completed orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          {order.created_at ? format(new Date(order.created_at), "MMM d, yyyy h:mm a") : "N/A"}
                        </TableCell>
                        <TableCell>{order.customer?.name || "Walk-in Customer"}</TableCell>
                        <TableCell>${parseFloat(order.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                            Completed
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Undo Bill
                          </Button>
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

      <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to reverse this bill? This will cancel the order, reverse stock, and adjust ledger entries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelectedOrderId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={undoMutation.isPending}
              onClick={() => {
                if (selectedOrderId) {
                  undoMutation.mutate({
                    id: selectedOrderId,
                    status: "cancelled",
                  });
                }
              }}
            >
              {undoMutation.isPending ? "Reversing..." : "Confirm Undo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
