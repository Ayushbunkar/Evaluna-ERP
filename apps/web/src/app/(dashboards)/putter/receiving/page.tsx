"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PutterReceivingPage() {
  const { data: putLists, isLoading, error } = trpc.warehouse.getPutLists.useQuery({});
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Receiving (GRNs)</h1>
        <Button>New Receipt (GRN)</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse">Loading receipts...</div>
      ) : error ? (
        <div className="text-red-500">Failed to load receipts: {error.message}</div>
      ) : putLists && putLists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {putLists.map((list) => (
            <Card key={list.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Put List #{list.id}</CardTitle>
                  <Badge variant={list.status === "completed" ? "default" : "secondary"}>
                    {list.status || "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Type: Inbound Receipt
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Created: {list.created_at ? new Date(list.created_at).toLocaleDateString() : "N/A"}
                  </span>
                  <Button variant="outline" size="sm">Process GRN</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p>No inbound items to receive.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
