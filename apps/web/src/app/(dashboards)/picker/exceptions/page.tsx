"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PickerExceptionsPage() {
  // Use getPickLists as a mock for exceptions or filter client-side
  const { data: pickLists, isLoading, error } = trpc.warehouse.getPickLists.useQuery();

  // Mocking some exceptions since there is no specific exceptions endpoint
  const exceptions = pickLists?.filter(list => list.status === 'exception') || [
    { id: 999, order_id: 101, status: 'exception', reason: 'Item out of stock in assigned bin' },
    { id: 1000, order_id: 105, status: 'exception', reason: 'Damaged item found during pick' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Pick Exceptions</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse">Loading exceptions...</div>
      ) : error ? (
        <div className="text-red-500">Failed to load exceptions: {error.message}</div>
      ) : exceptions && exceptions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exceptions.map((exc: any) => (
            <Card key={exc.id} className="border-red-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Pick List #{exc.id}</CardTitle>
                  <Badge variant="destructive">
                    Exception
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold mb-2 text-red-600">
                  Reason: {exc.reason || "Missing inventory"}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Order ID: {exc.order_id}
                </div>
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                    Resolve Issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p>No picking exceptions reported.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
