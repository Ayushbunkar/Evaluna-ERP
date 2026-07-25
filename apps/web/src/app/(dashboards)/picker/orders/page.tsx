"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PickerOrdersPage() {
  const { data: orders, isLoading, error } = trpc.orders.list.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders to Pick</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse">Loading orders...</div>
      ) : error ? (
        <div className="text-red-500">Failed to load orders: {error.message}</div>
      ) : orders && orders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                    {order.status || "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Customer: {order.customer?.name || "Walk-in"}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-primary">
                    Total: ${Number(order.total_amount).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p>No orders need picking right now.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
