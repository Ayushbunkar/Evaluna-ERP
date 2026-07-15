"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { MapPin, Phone, CheckCircle, Navigation, Truck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";

type Order = {
  id: number;
  customer_id: number | null;
  total_amount: string;
  status: string | null;
  user_uid: string;
  created_at: Date | null;
  customer: { name: string; phone?: string | null } | null;
};

export default function DeliveryPage() {
  const { data: orders = [], isLoading, refetch } = trpc.orders.list.useQuery();
  const updateOrder = trpc.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Order status updated to Completed");
      refetch();
    },
    onError: (err) => {
      toast.error(`Error updating order: ${err.message}`);
    },
  });

  // Only show out for delivery
  const deliveryOrders = orders
    .filter((o: Order) => o.status === "out_for_delivery")
    .sort((a, b) => {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });

  const handleCompleteDelivery = (id: number) => {
    updateOrder.mutate({ id, status: "completed" });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Deliveries</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {deliveryOrders.length} orders on the road.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || updateOrder.isPending}>
          <Truck className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : deliveryOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500/50 mb-4" />
            <h3 className="text-lg font-semibold">You're all caught up!</h3>
            <p className="text-muted-foreground text-sm mt-1">
              There are no orders out for delivery at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveryOrders.map((order: Order, index: number) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden shadow-sm">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Order #{order.id}
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200" variant="outline">
                          En Route
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Placed at {order.created_at ? format(new Date(order.created_at), "h:mm a") : "—"}
                      </CardDescription>
                    </div>
                    <div className="text-right font-semibold">
                      ${parseFloat(order.total_amount || "0").toFixed(2)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-2">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{order.customer?.name || "Guest Customer"}</p>
                        <p className="text-muted-foreground line-clamp-1">Delivery Address details here...</p>
                      </div>
                    </div>
                    {order.customer?.phone && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-muted-foreground">{order.customer.phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => toast.info("Opening map...")}>
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                    onClick={() => handleCompleteDelivery(order.id)}
                    disabled={updateOrder.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
