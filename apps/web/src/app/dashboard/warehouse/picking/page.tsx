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
import {
  CheckSquareIcon,
  SearchIcon,
  Loader2Icon,
  UsersIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import { toast } from "sonner";

export default function PickingPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: pickingQueue, isLoading: pickingLoading } = trpc.warehouse.getPickingQueue.useQuery();
  const { data: staffList } = trpc.staff.list.useQuery();

  // Mutations
  const assignPickingMutation = trpc.warehouse.assignPickingTask.useMutation({
    onSuccess: () => {
      toast.success("Picker operator successfully assigned!");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getPickingQueue.invalidate();
    }
  });

  const startPickingMutation = trpc.warehouse.startPickingTask.useMutation({
    onSuccess: () => {
      toast.success("Picking task started on shelves!");
      utils.warehouse.getPickingQueue.invalidate();
    }
  });

  const pickItemMutation = trpc.warehouse.pickItem.useMutation({
    onSuccess: () => {
      toast.success("Line item successfully picked!");
      utils.warehouse.getPickingQueue.invalidate();
    }
  });

  const completePickingMutation = trpc.warehouse.completePickingTask.useMutation({
    onSuccess: () => {
      toast.success("Picking completed! Moved to packing/dispatch hand-off.");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getPickingQueue.invalidate();
      utils.warehouse.getPackingQueue.invalidate();
    },
    onError: (err) => {
      toast.error(`Completion failed: ${err.message}`);
    }
  });

  // Modal State
  const [selectedPickList, setSelectedPickList] = useState<any>(null);
  const [pickListItems, setPickListItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);

  const openPickingModal = async (pl: any) => {
    setSelectedPickList(pl);
    setIsPickingModalOpen(true);
    setLoadingItems(true);
    try {
      const items = await utils.client.warehouse.getPickListItems.query({ pickListId: pl.id });
      setPickListItems(items);
    } catch (e) {
      toast.error("Failed to load pick items");
    } finally {
      setLoadingItems(false);
    }
  };

  const handlePickItem = async (itemId: number, currentQty: number, targetQty: number) => {
    await pickItemMutation.mutateAsync({
      itemId,
      qtyPicked: targetQty
    });
    // Refresh items inside the modal
    if (selectedPickList) {
      const items = await utils.client.warehouse.getPickListItems.query({ pickListId: selectedPickList.id });
      setPickListItems(items);
    }
  };

  const handleCompletePicking = async () => {
    if (!selectedPickList) return;
    await completePickingMutation.mutateAsync({
      pickListId: selectedPickList.id
    });
    setIsPickingModalOpen(false);
  };

  const filteredPicks = pickingQueue?.filter(pl => 
    pl.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(pl.id).includes(searchQuery)
  ) || [];

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Outbound Picking Queue
          </h2>
          <p className="text-muted-foreground text-sm">
            Supervise the picking checklist process, allocate picker operators, and monitor shelf fulfillment times.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pick lists, customers..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Fulfillment Picking Checklist Queue</CardTitle>
          <CardDescription>Coordinate picker operators to retrieve stock items from the specified aisle bins</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {pickingLoading ? (
            <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pick List ID</TableHead>
                    <TableHead>Customer Order</TableHead>
                    <TableHead>SLA Priority</TableHead>
                    <TableHead>Checklist Status</TableHead>
                    <TableHead>Assigned Picker</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPicks.map((pl) => (
                    <TableRow key={pl.id}>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">PL-#{pl.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{pl.customer_name || "Walk-in Customer"}</span>
                          <span className="text-[11px] text-muted-foreground">Order ID: #{pl.order_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={pl.priority === "high" || pl.priority === "urgent" ? "destructive" : "secondary"}
                          className={pl.priority === "urgent" ? "animate-pulse" : ""}
                        >
                          {pl.priority || "normal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={pl.status === "completed" ? "default" : pl.status === "picking" ? "secondary" : "outline"}
                          className={pl.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                        >
                          {pl.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <UsersIcon className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{pl.worker_name ?? "Unassigned"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!pl.assigned_to && (
                            <select
                              className="border rounded px-2 py-1 text-xs bg-white font-bold cursor-pointer"
                              onChange={async (e) => {
                                const val = e.target.value;
                                if (val) {
                                  await assignPickingMutation.mutateAsync({
                                    pickListId: pl.id,
                                    workerId: parseInt(val)
                                  });
                                }
                              }}
                            >
                              <option value="">Assign Picker</option>
                              {staffList?.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          )}

                          {pl.assigned_to && pl.status === "assigned" && (
                            <Button size="sm" onClick={() => startPickingMutation.mutate({ pickListId: pl.id })} className="text-xs shadow-sm h-8">
                              Start Picking
                            </Button>
                          )}

                          {pl.status === "picking" && (
                            <Button size="sm" onClick={() => openPickingModal(pl)} className="text-xs shadow-sm h-8">
                              Execute Shelf Pick
                            </Button>
                          )}

                          {pl.status === "completed" && (
                            <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                              <CheckCircle2Icon className="h-4 w-4" /> Pick Completed
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPicks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <CheckSquareIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No picking lists found.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EXECUTE ITEMS PICK MODAL */}
      <Dialog open={isPickingModalOpen} onOpenChange={setIsPickingModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Picking Item Lines — PL-#{selectedPickList?.id}</DialogTitle>
            <DialogDescription>Physically scan and retrieve ordered items from corresponding shelf bins.</DialogDescription>
          </DialogHeader>

          {loadingItems ? (
            <div className="flex justify-center py-8"><Loader2Icon className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-4 my-2 max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Target Qty</TableHead>
                    <TableHead>Picked Qty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickListItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-xs max-w-[250px] truncate">{item.product_name}</TableCell>
                      <TableCell className="font-semibold text-xs">{item.quantity_ordered} units</TableCell>
                      <TableCell className="text-xs font-semibold">{item.quantity_picked} units</TableCell>
                      <TableCell className="text-right">
                        {item.status !== "picked" ? (
                          <Button size="sm" onClick={() => handlePickItem(item.id, item.quantity_picked, item.quantity_ordered)} className="text-xs h-8">
                            Scan & Pick {item.quantity_ordered}
                          </Button>
                        ) : (
                          <span className="text-xs text-green-600 font-bold">Picked ✓</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPickingModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleCompletePicking}
              disabled={pickListItems.some(i => i.status !== "picked") || completePickingMutation.isPending}
            >
              {completePickingMutation.isPending ? "Completing..." : "Close Pick List & Move to Packing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
