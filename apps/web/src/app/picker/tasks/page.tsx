"use client";

import { useTRPC } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { ScanLine, CheckCircle2, MapPin } from "lucide-react";

export default function CurrentTaskPage() {
  const { data, isLoading } = useTRPC().picker.getCurrentTask.useQuery({});

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading current task...</div>;

  const task = data?.task;
  const items = data?.items ?? [];
  const pct = task ? Math.round((task.picked_items / task.total_items) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Current Task</h1>
        <p className="text-muted-foreground text-sm">Your active pick list — scan items to complete</p>
      </div>

      {task && (
        <Card className="border-border/50 bg-gradient-to-r from-blue-900/30 to-blue-800/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Active Pick List</p>
                <h2 className="text-xl font-bold text-blue-400">{task.id}</h2>
                <p className="text-sm text-muted-foreground">Order: <span className="font-medium text-foreground">{task.order_id}</span> &nbsp;|&nbsp; Zone: <span className="font-medium text-foreground">{task.area}</span></p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-blue-400">{pct}%</p>
                <p className="text-xs text-muted-foreground">{task.picked_items} / {task.total_items} items</p>
              </div>
            </div>
            <div className="w-full bg-muted/40 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="p-4 pb-0"><CardTitle className="text-base">Items to Pick</CardTitle></CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50">
                <tr className="text-left text-muted-foreground">
                  {["#", "Product Name", "SKU", "Location", "Qty Required", "Qty Picked", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className={`border-b border-border/30 transition-colors ${item.status === "Picked" ? "opacity-60" : "hover:bg-muted/30"}`}>
                    <td className="px-4 py-3 text-muted-foreground">{item.id}</td>
                    <td className="px-4 py-3 font-medium">{item.product}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-mono bg-muted/30 px-2 py-1 rounded w-fit">
                        <MapPin className="w-3 h-3 text-blue-400" />{item.location}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{item.qty_required}</td>
                    <td className="px-4 py-3 font-bold text-green-400">{item.qty_picked}</td>
                    <td className="px-4 py-3">
                      {item.status === "Picked" ? (
                        <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-4 h-4" /> Picked</span>
                      ) : (
                        <span className="text-xs text-yellow-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.status !== "Picked" && (
                        <Button size="xs" className="gap-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                          <ScanLine className="w-3 h-3" /> Scan
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
