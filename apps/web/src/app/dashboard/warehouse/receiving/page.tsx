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
import {
  TruckIcon,
  SearchIcon,
  Loader2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ChevronRightIcon,
  BoxesIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import { toast } from "sonner";

export default function ReceivingPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: pos, isLoading: posLoading } = trpc.warehouse.getReceivingPOs.useQuery();

  // Mutations
  const receivePOMutation = trpc.warehouse.receivePO.useMutation({
    onSuccess: () => {
      toast.success("Purchase Order successfully received & GRN generated!");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getReceivingPOs.invalidate();
      utils.warehouse.getPutAwayQueue.invalidate();
    },
    onError: (err) => {
      toast.error(`Receiving failed: ${err.message}`);
    }
  });

  // Dialog State
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [poItems, setPoItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [receivingQuantities, setReceivingQuantities] = useState<Record<number, number>>({});
  const [receivingConditions, setReceivingConditions] = useState<Record<number, "good" | "damaged" | "mismatch">>({});
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);

  const openReceivingModal = async (po: any) => {
    setSelectedPO(po);
    setIsReceivingModalOpen(true);
    setLoadingItems(true);
    try {
      const items = await utils.client.warehouse.getPurchaseItems.query({ purchaseId: po.id });
      setPoItems(items);
      const defaultQtys: Record<number, number> = {};
      const defaultConds: Record<number, "good" | "damaged" | "mismatch"> = {};
      for (const item of items) {
        defaultQtys[item.product_id] = item.quantity;
        defaultConds[item.product_id] = "good";
      }
      setReceivingQuantities(defaultQtys);
      setReceivingConditions(defaultConds);
    } catch (e) {
      toast.error("Failed to load PO items");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleReceivePO = async () => {
    if (!selectedPO) return;
    const itemsPayload = poItems.map((item) => ({
      productId: item.product_id,
      expectedQty: item.quantity,
      receivedQty: receivingQuantities[item.product_id] ?? item.quantity,
      condition: receivingConditions[item.product_id] ?? "good"
    }));

    await receivePOMutation.mutateAsync({
      purchaseId: selectedPO.id,
      items: itemsPayload
    });
    setIsReceivingModalOpen(false);
  };

  const filteredPOs = pos?.filter(po => 
    po.grn_number?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    po.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Inbound Goods Receiving (GRN)
          </h2>
          <p className="text-muted-foreground text-sm">
            Inspect incoming bulk shipments against procurement purchase orders.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PO reference, supplier..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Active Inbound Procurement Queue</CardTitle>
          <CardDescription>Select a PO line item to record physical checks & trigger put-away verifications</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {posLoading ? (
            <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Reference</TableHead>
                    <TableHead>Supplier Partner</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead>Order Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                        #{po.id} — {po.grn_number || "Awaiting Ref"}
                      </TableCell>
                      <TableCell className="font-medium">{po.supplier_name}</TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {new Date(po.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold text-slate-800">
                        ₹{Number(po.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={po.status === "received" ? "secondary" : po.status === "completed" ? "default" : "outline"}
                          className={po.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" : ""}
                        >
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {po.status === "pending" ? (
                          <Button size="sm" onClick={() => openReceivingModal(po)} className="shadow-sm">
                            Receive & Inspect <ChevronRightIcon className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <div className="flex justify-end items-center gap-1.5 text-xs text-green-600 font-bold">
                            <CheckCircle2Icon className="h-4 w-4" /> Received & Signed
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPOs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <TruckIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No receiving purchase orders found.</p>
                        <p className="text-xs">There are no expected inbound bulk shipments matching your query.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RECEIVING PO DIALOG MODAL */}
      <Dialog open={isReceivingModalOpen} onOpenChange={setIsReceivingModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Inspect & Receive Purchase Order #{selectedPO?.id}</DialogTitle>
            <DialogDescription>Validate quantities and physical conditions of incoming goods against purchase contract lines.</DialogDescription>
          </DialogHeader>

          {loadingItems ? (
            <div className="flex justify-center py-8"><Loader2Icon className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-4 my-2 max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Line Name</TableHead>
                    <TableHead>Expected Qty</TableHead>
                    <TableHead>Received Qty</TableHead>
                    <TableHead>Quality Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poItems.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-bold text-xs max-w-[200px] truncate">{item.product_name}</TableCell>
                      <TableCell className="font-semibold text-xs">{item.quantity} units</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-24 h-8 text-xs font-bold"
                          value={receivingQuantities[item.product_id] ?? item.quantity}
                          onChange={(e) => setReceivingQuantities({
                            ...receivingQuantities,
                            [item.product_id]: parseInt(e.target.value) || 0
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          className="border rounded px-2 py-1 text-xs font-bold bg-white"
                          value={receivingConditions[item.product_id] ?? "good"}
                          onChange={(e) => setReceivingConditions({
                            ...receivingConditions,
                            [item.product_id]: e.target.value as any
                          })}
                        >
                          <option value="good">Good Condition</option>
                          <option value="damaged">Damaged Goods</option>
                          <option value="mismatch">Quantity Mismatch</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsReceivingModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleReceivePO}
              disabled={receivePOMutation.isPending}
            >
              {receivePOMutation.isPending ? "Processing..." : "Generate GRN & Move to Put-Away"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
