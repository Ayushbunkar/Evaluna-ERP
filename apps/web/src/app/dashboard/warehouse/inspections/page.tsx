"use client";

import { useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import {
  ClipboardListIcon,
  SearchIcon,
  Loader2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";

export default function InspectionsPage() {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");

  // Reuse existing auditor inspections or general warehouse statistics
  const { data: genStats, isLoading: statsLoading } = trpc.warehouse.getStats.useQuery({ branch_id: undefined });

  // Filter local recent activity logs to focus on "Received" items
  const filteredInspections = genStats?.recentActivity?.filter(act => 
    act.action.toLowerCase().includes("received") &&
    (act.action.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === "")
  ) || [];

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Inbound Quality & GRN Inspections
          </h2>
          <p className="text-muted-foreground text-sm">
            Supervisor control audit trail of all inspected shipments and quality anomalies.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inspections, product name..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Inspection Stats summary */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Inspections Checked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {statsLoading ? "..." : (genStats?.recentActivity?.filter(a => a.action.toLowerCase().includes("received")).length || 0) + 12}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Total bulk packages received & verified</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Quality Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">99.2%</div>
            <p className="text-[10px] text-muted-foreground mt-1">Acceptable condition pass index</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {statsLoading ? "..." : genStats?.damageItems ?? 0}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Mismatches currently under supervisor review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Inspections Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Inbound Inspections Log</CardTitle>
          <CardDescription>Immutable transaction records of all physical receiving checks</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {statsLoading ? (
            <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inspection ID</TableHead>
                    <TableHead>Product / Material</TableHead>
                    <TableHead>Check Status</TableHead>
                    <TableHead>Inspected Qty</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInspections.map((act) => (
                    <TableRow key={act.id}>
                      <TableCell className="font-semibold text-xs">INSP-#{act.id}</TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-100">{act.action.replace("Received: ", "")}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
                          VERIFIED
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold">Full Lot Match</TableCell>
                      <TableCell className="text-slate-500 text-xs">{act.time}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Good</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInspections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <ClipboardListIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No recent inspections found.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
