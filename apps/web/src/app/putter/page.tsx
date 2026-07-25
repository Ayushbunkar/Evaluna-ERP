"use client";

import { useTRPC } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";

export default function PutterDashboard() {
  const { data: stats, isLoading } = useTRPC().putter.getDashboardStats.useQuery({});

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold capitalize">putter Dashboard</h1>
      {isLoading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats && Object.entries(stats).map(([key, value]) => {
            if (Array.isArray(value)) return null;
            return (
              <Card key={key} className="bg-card/50 backdrop-blur-xl border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value as any}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
