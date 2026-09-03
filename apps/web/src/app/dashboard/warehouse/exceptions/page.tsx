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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@evaluna/ui/components/dialog";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
  AlertTriangleIcon,
  SearchIcon,
  Loader2Icon,
  XCircleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import { toast } from "sonner";

export default function ExceptionsPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");

  // Queries (load overview to get stats and triggers)
  const { data: stats, isLoading: statsLoading } = trpc.warehouse.getOverviewStats.useQuery({});

  // Mutations
  const logExceptionMutation = trpc.warehouse.logException.useMutation({
    onSuccess: () => {
      toast.success("Operational exception successfully logged!");
      utils.warehouse.getOverviewStats.invalidate();
    },
    onError: (err) => {
      toast.error(`Reporting failed: ${err.message}`);
    }
  });

  // Modal State
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [exceptionProdId, setExceptionProdId] = useState("1");
  const [exceptionQty, setExceptionQty] = useState("");
  const [exceptionType, setExceptionType] = useState<"damage" | "missing" | "mismatch">("damage");
  const [exceptionReason, setExceptionReason] = useState("");

  const handleRaiseException = async () => {
    await logExceptionMutation.mutateAsync({
      productId: parseInt(exceptionProdId),
      qty: parseInt(exceptionQty) || 1,
      reason: exceptionReason,
      type: exceptionType
    });
    setIsExceptionModalOpen(false);
    setExceptionQty("");
    setExceptionReason("");
  };

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Operational Exceptions Console
          </h2>
          <p className="text-muted-foreground text-sm">
            Investigate receiving mismatches, missing units on racks, and log damaged/quarantined goods.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="destructive" onClick={() => setIsExceptionModalOpen(true)} className="text-xs h-9 font-bold shadow-sm">
            Report New Exception
          </Button>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exceptions..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Exception alert log list */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-950">Active Incident Tickets</CardTitle>
            <CardDescription>Live quality deviations currently pending investigation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.delayedTasks !== undefined && stats.delayedTasks > 0 ? (
              <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-3 rounded-lg">
                <AlertTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-amber-800">SLA Violation Warning: Overdue Picking Checklist</h5>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Fulfillment picks have exceeded the 2-hour window on shelves. Operator reallocations recommended.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-3 rounded-lg">
              <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-red-800">Damaged Stock Quarantined: High-Grade Steel Widget</h5>
                <p className="text-[11px] text-red-700 mt-1">
                  1 lot unit received with dented physical outer housing. Moved to isolation shelf in Zone A.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resolved exceptions summary */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Resolution Log Archive</CardTitle>
            <CardDescription>Supervisor actions completed in the past 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 border border-green-200 bg-green-50 p-3 rounded-lg">
              <CheckCircle2Icon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-green-800">RESOLVED: PO-1024 Receiving Qty Mismatch</h5>
                <p className="text-[11px] text-green-700 mt-1">
                  Verified with supplier. Adjusted GRN expected counts in database. Stock ledger updated cleanly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REPORT EXCEPTION DIALOG MODAL */}
      <Dialog open={isExceptionModalOpen} onOpenChange={setIsExceptionModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Report Operational Exception / Deviation</DialogTitle>
            <DialogDescription>Submit physical lot discrepancies directly to the system logs, triggering quality quarantine.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Affected Product Item</Label>
              <select
                className="w-full border rounded p-2 bg-white mt-1 text-xs font-bold"
                value={exceptionProdId}
                onChange={(e) => setExceptionProdId(e.target.value)}
              >
                <option value="1">High-Grade Steel Widget</option>
                <option value="2">Copper Wire Coil</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Discrepant Quantity</Label>
              <Input
                type="number"
                value={exceptionQty}
                onChange={(e) => setExceptionQty(e.target.value)}
                placeholder="E.g. 1"
                className="mt-1 font-bold text-xs h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Discrepancy Category Type</Label>
              <select
                className="w-full border rounded p-2 bg-white mt-1 text-xs font-bold"
                value={exceptionType}
                onChange={(e) => setExceptionType(e.target.value as any)}
              >
                <option value="damage">Physical Damaged Stock</option>
                <option value="missing">Missing units from Shelf</option>
                <option value="mismatch">Lot Receipt Count Mismatch</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Discrepancy Investigation Notes</Label>
              <Textarea
                placeholder="Specify precise damage indicators, box condition, or shelf scan mismatch..."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="mt-1 text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsExceptionModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleRaiseException}
              variant="destructive"
              disabled={logExceptionMutation.isPending}
            >
              {logExceptionMutation.isPending ? "Logging..." : "Submit Exception Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
