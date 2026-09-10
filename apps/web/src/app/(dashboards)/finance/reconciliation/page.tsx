"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  ShieldCheck,
  TrendingDown,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@evaluna/ui/components/select";
import { useTRPC } from "@/lib/trpc/client";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending_collection: {
    label: "Pending Collection",
    cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  driver_collected: {
    label: "Driver Collected",
    cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  finance_submitted: {
    label: "Submitted to Finance",
    cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  reconciled: {
    label: "Reconciled",
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
};

export default function FinanceReconciliationPage() {
  const trpc = useTRPC();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [driverOpen, setDriverOpen] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState("");
  const [collectedAmount, setCollectedAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders, refetch } = trpc.financeReconciliation.getAllOrders.useQuery();

  const financeVerifyMutation = trpc.financeReconciliation.financeVerifyCollection.useMutation({
    onSuccess: () => {
      toast.success("Payment verified and reconciled!");
      setVerifyOpen(false);
      setSelectedOrder(null);
      setVerifiedAmount("");
      setNotes("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const driverSubmitMutation = trpc.financeReconciliation.driverSubmitCollection.useMutation({
    onSuccess: () => {
      toast.success("Driver collection submitted to Finance!");
      setDriverOpen(false);
      setSelectedOrder(null);
      setCollectedAmount("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = orders?.filter((o: any) => {
    if (statusFilter === "all") return true;
    return o.finance_status === statusFilter;
  });

  const stats = {
    total: orders?.length ?? 0,
    pending: orders?.filter((o: any) => o.finance_status === "pending_collection").length ?? 0,
    submitted: orders?.filter((o: any) => o.finance_status === "finance_submitted").length ?? 0,
    reconciled: orders?.filter((o: any) => o.finance_status === "reconciled").length ?? 0,
  };

  const formatAmt = (v: any) => v != null ? `₹${Number(v).toFixed(2)}` : "—";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Payment Reconciliation</h1>
        <p className="text-muted-foreground text-sm">
          Verify driver collections and reconcile with original sales amounts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Orders", value: stats.total, icon: ShieldCheck, color: "text-blue-600" },
          { label: "Pending Collection", value: stats.pending, icon: Clock, color: "text-yellow-600" },
          { label: "Awaiting Finance", value: stats.submitted, icon: Truck, color: "text-purple-600" },
          { label: "Reconciled", value: stats.reconciled, icon: CheckCircle, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`font-bold text-2xl ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm">Filter by Status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending_collection">Pending Collection</SelectItem>
            <SelectItem value="finance_submitted">Awaiting Finance</SelectItem>
            <SelectItem value="reconciled">Reconciled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Salesperson</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Original ₹</th>
                  <th className="px-4 py-3 font-medium text-right">Driver Collected</th>
                  <th className="px-4 py-3 font-medium text-right">Finance Verified</th>
                  <th className="px-4 py-3 font-medium text-right">Difference</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((order: any) => {
                  const original = Number(order.total_amount);
                  const driverCollected = order.driver_collected_amount != null ? Number(order.driver_collected_amount) : null;
                  const financeVerified = order.finance_verified_amount != null ? Number(order.finance_verified_amount) : null;
                  const diff = financeVerified != null ? financeVerified - original : null;
                  const badge = STATUS_BADGE[order.finance_status] || STATUS_BADGE.pending_collection;

                  return (
                    <tr key={order.id} className="border-b transition-colors hover:bg-muted/20 last:border-0">
                      <td className="px-4 py-3 font-mono font-medium">ORD-{order.id}</td>
                      <td className="px-4 py-3">{order.customer?.name || "Walk-in"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.user_uid?.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {order.created_at ? format(new Date(order.created_at), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatAmt(order.total_amount)}</td>
                      <td className="px-4 py-3 text-right">
                        {driverCollected != null ? (
                          <span className="text-blue-600">₹{driverCollected.toFixed(2)}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {financeVerified != null ? (
                          <span className="font-semibold text-emerald-600">₹{financeVerified.toFixed(2)}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {diff != null ? (
                          <span className={`font-semibold ${diff < 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {diff >= 0 ? "+" : ""}₹{diff.toFixed(2)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {order.finance_status === "pending_collection" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedOrder(order);
                                setCollectedAmount(order.total_amount);
                                setDriverOpen(true);
                              }}
                            >
                              <Truck className="mr-1 h-3 w-3" />
                              Driver Submit
                            </Button>
                          )}
                          {(order.finance_status === "finance_submitted" || order.finance_status === "driver_collected") && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => {
                                setSelectedOrder(order);
                                setVerifiedAmount(order.driver_collected_amount || order.total_amount);
                                setVerifyOpen(true);
                              }}
                            >
                              <ShieldCheck className="mr-1 h-3 w-3" />
                              Verify
                            </Button>
                          )}
                          {order.finance_status === "reconciled" && (
                            <span className="text-xs text-emerald-600 font-medium">✓ Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered?.length && (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-muted-foreground">
                      <ShieldCheck className="mx-auto mb-3 h-12 w-12 opacity-20" />
                      <p>No orders found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Driver Submit Dialog */}
      <Dialog open={driverOpen} onOpenChange={setDriverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Driver Collection Submission</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-mono font-semibold">ORD-{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{selectedOrder.customer?.name || "Walk-in"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Sales Amount</span>
                  <span className="font-bold">{formatAmt(selectedOrder.total_amount)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount Collected by Driver (₹)</Label>
                <Input
                  type="number"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverOpen(false)}>Cancel</Button>
            <Button
              disabled={driverSubmitMutation.isPending}
              onClick={() => {
                if (!selectedOrder || !collectedAmount) return;
                driverSubmitMutation.mutate({
                  orderId: selectedOrder.id,
                  collectedAmount,
                });
              }}
            >
              {driverSubmitMutation.isPending ? "Submitting..." : "Submit to Finance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finance Verify Dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finance Verification</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-mono font-semibold">ORD-{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{selectedOrder.customer?.name || "Walk-in"}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Original Sales Amount</span>
                  <span>{formatAmt(selectedOrder.total_amount)}</span>
                </div>
                {selectedOrder.driver_collected_amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver Collected</span>
                    <span className="text-blue-600 font-medium">{formatAmt(selectedOrder.driver_collected_amount)}</span>
                  </div>
                )}
                {verifiedAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difference</span>
                    <span className={`font-bold ${(Number(verifiedAmount) - Number(selectedOrder.total_amount)) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {(Number(verifiedAmount) - Number(selectedOrder.total_amount) >= 0 ? "+" : "")}
                      ₹{(Number(verifiedAmount) - Number(selectedOrder.total_amount)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Finance Verified Amount (₹)</Label>
                <Input
                  type="number"
                  value={verifiedAmount}
                  onChange={(e) => setVerifiedAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Finance Notes / Adjustment Reason</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Item returned, short delivery..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyOpen(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={financeVerifyMutation.isPending}
              onClick={() => {
                if (!selectedOrder || !verifiedAmount) return;
                financeVerifyMutation.mutate({
                  orderId: selectedOrder.id,
                  verifiedAmount,
                  notes,
                });
              }}
            >
              {financeVerifyMutation.isPending ? "Verifying..." : "Verify & Reconcile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
