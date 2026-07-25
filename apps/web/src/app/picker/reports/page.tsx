"use client";
import { useTRPC } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { TrendingUp, Target, Clock, Award } from "lucide-react";

export default function PickerReportsPage() {
  const { data, isLoading } = useTRPC().picker.getReports.useQuery({});

  return (
    <div className="flex flex-col gap-6 p-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Picker Reports</h1>
        <p className="text-muted-foreground text-sm">Performance metrics and efficiency analytics</p>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Team Tasks Done", value: "188", icon: TrendingUp, color: "bg-blue-600" },
          { label: "Avg Accuracy", value: "98.4%", icon: Target, color: "bg-green-600" },
          { label: "Avg Pick Time", value: "20 min", icon: Clock, color: "bg-purple-600" },
          { label: "Top Picker", value: "Deepak Sharma", icon: Award, color: "bg-yellow-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50 bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="w-5 h-5 text-white" /></div>
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="font-bold">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/50 bg-card/50">
        <CardHeader><CardTitle className="text-base">Team Performance - January 2024</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50">
                  <tr className="text-left text-muted-foreground">
                    {["Name", "Tasks Done", "Accuracy %", "Avg Time", "Period"].map(h => (
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold">{row.name}</td>
                      <td className="px-4 py-3 font-bold">{row.tasks_done}</td>
                      <td className="px-4 py-3"><span className={`font-bold ${row.accuracy >= 99 ? "text-green-400" : row.accuracy >= 97 ? "text-yellow-400" : "text-red-400"}`}>{row.accuracy}%</span></td>
                      <td className="px-4 py-3">{row.avg_time}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
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
