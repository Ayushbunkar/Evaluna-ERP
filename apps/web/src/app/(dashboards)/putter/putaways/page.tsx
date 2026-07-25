"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PutterPutawaysPage() {
  const { data: putaways, isLoading, error } = trpc.warehouse.getPutaways.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Active Putaways</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse">Loading putaway tasks...</div>
      ) : error ? (
        <div className="text-red-500">Failed to load putaway tasks: {error.message}</div>
      ) : putaways && putaways.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {putaways.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Item #{item.id}</CardTitle>
                  <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                    {item.status || "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Put List ID: {item.put_list_id} <br />
                  Product ID: {item.product_id} <br />
                  Quantity: {item.quantity}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Assigned Bin: {item.destination_location_id || "Unassigned"}
                  </span>
                  <Button variant="outline" size="sm">Put Away</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p>No active putaways right now.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
