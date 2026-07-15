"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Input } from "@evaluna/ui/components/input";
import { Package, Search, ArrowRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function PendingOrdersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders, isLoading } = trpc.warehouse.getPendingOrders.useQuery(undefined, {
    retry: false,
  });

  const mockOrders = [
    { id: "ORD-4093", date: new Date().toISOString(), items: 5, priority: "High", status: "pending" },
    { id: "ORD-4094", date: new Date(Date.now() - 3600000).toISOString(), items: 12, priority: "Medium", status: "pending" },
    { id: "ORD-4095", date: new Date(Date.now() - 7200000).toISOString(), items: 2, priority: "Low", status: "pending" },
  ];

  const displayOrders = orders || mockOrders;
  const filteredOrders = displayOrders.filter((o: any) => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Orders</h1>
          <p className="text-muted-foreground">Orders awaiting to be picked and packed.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search orders..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders Queue</CardTitle>
          <CardDescription>Select an order to generate a pick list.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <motion.tbody
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No pending orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order: any) => (
                      <motion.tr variants={item} key={order.id} className="group">
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(order.date), "MMM d, h:mm a")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{order.items}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            order.priority === "High" ? "destructive" : 
                            order.priority === "Medium" ? "default" : "secondary"
                          }>
                            {order.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="default" 
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => router.push(`/picker/pick-lists?order=${order.id}`)}
                          >
                            Create Pick List
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </motion.tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
