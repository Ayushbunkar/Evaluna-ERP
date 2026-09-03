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
  PlusIcon,
  XIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import { toast } from "sonner";

export default function PurchaseOrdersPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: pos, isLoading: posLoading } = trpc.warehouse.getReceivingPOs.useQuery();
  const { data: suppliersList } = trpc.suppliers.list.useQuery();
  const { data: invData } = trpc.inventory.list.useQuery({ limit: 100 });

  // Mutations
  const createPOMutation = trpc.purchases.create.useMutation({
    onSuccess: () => {
      toast.success("Purchase Order successfully created & sent to warehouse!");
      utils.warehouse.getReceivingPOs.invalidate();
      setIsCreateModalOpen(false);
      setSelectedSupplier("");
      setOrderItems([{ productId: "", quantity: 1, price: 10 }]);
    },
    onError: (err) => {
      toast.error(`PO creation failed: ${err.message}`);
    }
  });

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number; price: number }>>([
    { productId: "", quantity: 1, price: 10 }
  ]);

  // PO Detail View Modal
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [poDetailsList, setPoDetailsList] = useState<any[]>([]);
  const [loadingDetails, setLoadingItems] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const openDetailsModal = async (po: any) => {
    setSelectedPO(po);
    setIsDetailModalOpen(true);
    setLoadingItems(true);
    try {
      const items = await utils.client.warehouse.getPurchaseItems.query({ purchaseId: po.id });
      setPoDetailsList(items);
    } catch (e) {
      toast.error("Failed to load PO lines");
    } finally {
      setLoadingItems(false);
    }
  };

  const addLineItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1, price: 10 }]);
  };

  const removeLineItem = (idx: number) => {
    const updated = [...orderItems];
    updated.splice(idx, 1);
    setOrderItems(updated);
  };

  const updateLineItem = (idx: number, field: string, val: any) => {
    const updated = [...orderItems];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };
    setOrderItems(updated);
  };

  // Calculate totals
  const totalAmount = orderItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);

  const handleCreatePO = async () => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier.");
      return;
    }
    if (orderItems.some(i => !i.productId)) {
      toast.error("Please select a product for all line items.");
      return;
    }

    await createPOMutation.mutateAsync({
      supplierId: selectedSupplier,
      total: totalAmount,
      items: orderItems,
    });
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
            Purchase Orders Ledger
          </h2>
          <p className="text-muted-foreground text-sm">
            Overview procurement purchase orders, create new reorder batches, and track inbound deliveries.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsCreateModalOpen(true)} className="text-xs h-9 font-bold shadow-sm">
            <PlusIcon className="mr-1.5 h-4 w-4" /> Create Purchase Order
          </Button>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PO number, supplier..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Purchase Orders</CardTitle>
          <CardDescription>Track status, delivery schedules, and outstanding balances of active procurement lots</CardDescription>
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
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.map((po) => (
                    <TableRow key={po.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => openDetailsModal(po)}>
                      <TableCell className="font-bold text-xs">
                        PO-#{po.id} — {po.grn_number || "Draft"}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-100">{po.supplier_name}</TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {new Date(po.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold text-xs">
                        ₹{Number(po.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={po.status === "received" || po.status === "completed" ? "default" : "outline"}
                          className={po.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                        >
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-xs h-8">
                          View Items <ChevronRightIcon className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPOs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <TruckIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No purchase orders registered.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE PO MODAL DIALOG */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create Purchase Order (PO)</DialogTitle>
            <DialogDescription>Submit contract order request directly to supplier. Triggers inbound GRN routing on save.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Select Supplier Partner</Label>
              <select
                className="w-full border rounded p-2 bg-white mt-1 text-xs font-bold cursor-pointer"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                <option value="">Choose Supplier</option>
                {suppliersList?.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Code: {s.supplier_code})</option>
                ))}
              </select>
            </div>

            {/* Dynamic Items list */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-slate-700">Order Line Items</Label>
                <Button size="sm" variant="outline" onClick={addLineItem} className="text-xs h-7">
                  <PlusIcon className="mr-1 h-3 w-3" /> Add Item Line
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 border p-2 rounded-lg bg-slate-50 relative">
                    <div className="flex-1">
                      <select
                        className="w-full border rounded p-1.5 bg-white text-xs font-bold cursor-pointer"
                        value={item.productId}
                        onChange={(e) => updateLineItem(idx, "productId", e.target.value)}
                      >
                        <option value="">Choose Material</option>
                        {invData?.items?.map(i => (
                          <option key={i.id} value={i.id}>{i.product} (SKU: {i.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, "quantity", parseInt(e.target.value) || 0)}
                        className="h-8 font-bold text-xs"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Cost"
                        value={item.price}
                        onChange={(e) => updateLineItem(idx, "price", parseFloat(e.target.value) || 0)}
                        className="h-8 font-bold text-xs"
                      />
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removeLineItem(idx)}>
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time calculated totals */}
            <div className="border-t pt-4 flex justify-between items-center text-sm font-bold">
              <span>Estimated Order Volume:</span>
              <span className="text-blue-600">₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleCreatePO}
              disabled={createPOMutation.isPending}
            >
              {createPOMutation.isPending ? "Creating..." : "Issue Purchase Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO DETAIL DRAWER */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="bg-white max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Purchase Order Items — PO-#{selectedPO?.id}</DialogTitle>
            <DialogDescription className="text-xs">Supplier Company: {selectedPO?.supplier_name}</DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex justify-center py-8"><Loader2Icon className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-4 my-2 max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Line Item</TableHead>
                    <TableHead>Ordered Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poDetailsList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-xs">{item.product_name}</TableCell>
                      <TableCell className="font-semibold text-xs">{item.quantity} units</TableCell>
                      <TableCell className="font-semibold text-xs">₹{Number(item.price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setIsDetailModalOpen(false)}>Close Order Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
