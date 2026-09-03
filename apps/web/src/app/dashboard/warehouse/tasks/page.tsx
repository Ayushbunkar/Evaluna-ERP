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
  FilterIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";

export default function TasksPage() {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Load picking tasks and put-away tasks to combine into a central task list
  const { data: pickingQueue, isLoading: pickingLoading } = trpc.warehouse.getPickingQueue.useQuery();
  const { data: putAwayQueue, isLoading: putAwayLoading } = trpc.warehouse.getPutAwayQueue.useQuery();

  const combinedTasks: any[] = [];

  if (pickingQueue) {
    pickingQueue.forEach((pl) => {
      combinedTasks.push({
        id: `PL-${pl.id}`,
        type: "Picking Checklist",
        reference: `ORD-${pl.order_id}`,
        status: pl.status,
        operator: pl.worker_name || "Unassigned",
        priority: pl.priority || "normal",
        created_at: new Date(pl.created_at).toLocaleDateString(),
      });
    });
  }

  if (putAwayQueue) {
    putAwayQueue.forEach((pv) => {
      combinedTasks.push({
        id: `PV-${pv.id}`,
        type: "Put-Away Placement",
        reference: pv.batch_number || "Lot Verification",
        status: pv.status,
        operator: pv.worker_name || "Unassigned",
        priority: "normal",
        created_at: new Date(pv.created_at).toLocaleDateString(),
      });
    });
  }

  const filteredTasks = combinedTasks.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.operator.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (t.status === "pending" || t.status === "AWAITING_PLACEMENT" || t.status === "assigned")) ||
      (statusFilter === "completed" && (t.status === "completed" || t.status === "VERIFIED"));

    return matchesSearch && matchesStatus;
  });

  const isLoading = pickingLoading || putAwayLoading;

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Centralized WMS Task Manager
          </h2>
          <p className="text-muted-foreground text-sm">
            Monitor, prioritize, and reallocate active picking, receiving, and put-away tasks.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, operators..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="border rounded px-3 py-1.5 text-xs font-bold bg-white cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending/Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base font-bold">WMS Task Ledger</CardTitle>
            <CardDescription>A consolidated audit log of active depot task threads</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8">
            <FilterIcon className="mr-1.5 h-3.5 w-3.5" /> Filter Columns
          </Button>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Reference</TableHead>
                    <TableHead>Task Category Type</TableHead>
                    <TableHead>Lot / Order Ref</TableHead>
                    <TableHead>SLA Priority</TableHead>
                    <TableHead>Assigned Operator</TableHead>
                    <TableHead>Creation Date</TableHead>
                    <TableHead className="text-right">Execution State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">{t.id}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-500">{t.type}</TableCell>
                      <TableCell className="font-bold text-xs">{t.reference}</TableCell>
                      <TableCell>
                        <Badge variant={t.priority === "high" || t.priority === "urgent" ? "destructive" : "secondary"}>
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600">{t.operator}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{t.created_at}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={t.status === "completed" || t.status === "VERIFIED" ? "default" : "outline"}
                          className={t.status === "pending" || t.status === "AWAITING_PLACEMENT" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <ClipboardListIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No tasks match the active filters.</p>
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
