"use client";

import { useTRPC } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Play, RefreshCw } from "lucide-react";

const priorityColor = (p: string) => {
  if (p === "High") return "bg-red-500/20 text-red-400 border border-red-500/30";
  if (p === "Medium") return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  return "bg-green-500/20 text-green-400 border border-green-500/30";
};

const statusColor = (s: string) => {
  if (s === "Completed") return "bg-green-500/20 text-green-400";
  if (s === "In Progress") return "bg-blue-500/20 text-blue-400";
  if (s === "Exception") return "bg-red-500/20 text-red-400";
  return "bg-yellow-500/20 text-yellow-400";
};

export default function PickListsPage() {
  const { data: pickLists, isLoading, refetch } = useTRPC().picker.getPickLists.useQuery({});

  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pick Lists</h1>
          <p className="text-muted-foreground text-sm">All active and completed picking tasks</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading pick lists...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50">
                  <tr className="text-left text-muted-foreground">
                    {["List ID", "Order ID", "Priority", "Items", "Assigned To", "Area/Zone", "Est. Time", "Status", "Action"].map(h => (
                      <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(pickLists ?? []).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">{row.id}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{row.order_id}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColor(row.priority)}`}>{row.priority}</span></td>
                      <td className="px-4 py-3 font-bold">{row.items_count}</td>
                      <td className="px-4 py-3">{row.assigned_to}</td>
                      <td className="px-4 py-3 font-mono text-xs bg-muted/20 rounded">{row.area}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.estimated_time}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(row.status)}`}>{row.status}</span></td>
                      <td className="px-4 py-3">
                        {row.status === "Pending" && (
                          <Button size="xs" className="gap-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                            <Play className="w-3 h-3" /> Start
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
