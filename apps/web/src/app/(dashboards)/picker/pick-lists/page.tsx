"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PickListsPage() {
  const { data: pickLists, isLoading, error } = trpc.warehouse.getPickLists.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Active Pick Lists</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse">Loading pick lists...</div>
      ) : error ? (
        <div className="text-red-500">Failed to load pick lists: {error.message}</div>
      ) : pickLists && pickLists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pickLists.map((list) => (
            <Card key={list.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Pick List #{list.id}</CardTitle>
                  <Badge variant={list.status === "completed" ? "default" : "secondary"}>
                    {list.status || "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Order ID: {list.order_id}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Created: {list.created_at ? new Date(list.created_at).toLocaleDateString() : "N/A"}
                  </span>
                  <Button variant="outline" size="sm">Start Picking</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p>No active pick lists available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
