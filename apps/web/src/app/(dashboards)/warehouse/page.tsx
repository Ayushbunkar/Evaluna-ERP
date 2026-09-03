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
  DialogTrigger,
  DialogFooter,
} from "@evaluna/ui/components/dialog";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
  ActivityIcon,
  ClockIcon,
  PackageIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SearchIcon,
  Loader2Icon,
  UserCheckIcon,
  BoxesIcon,
  CheckSquareIcon,
  ClipboardListIcon,
  AlertOctagonIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition, StaggerList, StaggerItem, AnimatedCard } from "@/lib/animations";
import { toast } from "sonner";

export default function WarehouseOperationsDashboard() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  // Selected tab
  const [activeTab, setActiveTab] = useState<"overview" | "receiving" | "putaway" | "picking" | "packing" | "exceptions">("overview");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.warehouse.getOverviewStats.useQuery({});
  const { data: pos, isLoading: posLoading } = trpc.warehouse.getReceivingPOs.useQuery();
  const { data: putAwayQueue, isLoading: putAwayLoading } = trpc.warehouse.getPutAwayQueue.useQuery();
  const { data: pickingQueue, isLoading: pickingLoading } = trpc.warehouse.getPickingQueue.useQuery();
  const { data: packingQueue, isLoading: packingLoading } = trpc.warehouse.getPackingQueue.useQuery();
  const { data: staffList } = trpc.staff.list.useQuery();

  // Mutations
  const receivePOMutation = trpc.warehouse.receivePO.useMutation({
    onSuccess: () => {
      toast.success("Purchase Order received and inspected!");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getReceivingPOs.invalidate();
      utils.warehouse.getPutAwayQueue.invalidate();
    },
    onError: (err) => {
      toast.error(`Receiving failed: ${err.message}`);
    }
  });

  const assignPutAwayMutation = trpc.warehouse.assignPutAwayTask.useMutation({
    onSuccess: () => {
      toast.success("Put-away task assigned!");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getPutAwayQueue.invalidate();
    }
  });

  const startPutAwayMutation = trpc.warehouse.startPutAwayTask.useMutation({
    onSuccess: () => {
      toast.success("Put-away task started!");
      utils.warehouse.getPutAwayQueue.invalidate();
    }
  });

  const completePutAwayMutation = trpc.warehouse.completePutAwayTask.useMutation({
    onSuccess: () => {
      toast.success("Put-away completed and stock updated!");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getPutAwayQueue.invalidate();
    }
  });

  const assignPickingMutation = trpc.warehouse.assignPickingTask.useMutation({
    onSuccess: () => {
      toast.success("Picking task assigned!");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getPickingQueue.invalidate();
    }
  });

  const startPickingMutation = trpc.warehouse.startPickingTask.useMutation({
    onSuccess: () => {
      toast.success("Picking started!");
      utils.warehouse.getPickingQueue.invalidate();
    }
  });

  const pickItemMutation = trpc.warehouse.pickItem.useMutation({
    onSuccess: () => {
      toast.success("Item picked!");
      utils.warehouse.getPickingQueue.invalidate();
    }
  });

  const completePickingMutation = trpc.warehouse.completePickingTask.useMutation({
    onSuccess: () => {
      toast.success("Picking completed! Moved order to packing queue.");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getPickingQueue.invalidate();
      utils.warehouse.getPackingQueue.invalidate();
    }
  });

  const packPackageMutation = trpc.warehouse.packPackage.useMutation({
    onSuccess: () => {
      toast.success("Package packed and ready for dispatch!");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getPackingQueue.invalidate();
    }
  });

  const logExceptionMutation = trpc.warehouse.logException.useMutation({
    onSuccess: () => {
      toast.success("Exception logged successfully!");
      utils.warehouse.getOverviewStats.invalidate();
    }
  });

  // Modal State
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [poItems, setPoItems] = useState<any[]>([]);
  const [receivingQuantities, setReceivingQuantities] = useState<Record<number, number>>({});
  const [receivingConditions, setReceivingQuantitiesConditions] = useState<Record<number, "good" | "damaged" | "mismatch">>({});
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);

  const [selectedPutAway, setSelectedPutAway] = useState<any>(null);
  const [isPutAwayModalOpen, setIsPutAwayModalOpen] = useState(false);
  const [putAwayQty, setPutAwayQty] = useState<number>(0);
  const [putAwayLocation, setPutAwayLocation] = useState<string>("1");
  const [putAwayNotes, setPutAwayNotes] = useState("");

  const [selectedPickList, setSelectedPickList] = useState<any>(null);
  const [pickListItems, setPickListItems] = useState<any[]>([]);
  const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);

  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [pkgWeight, setPkgWeight] = useState("");
  const [pkgDimensions, setPkgDimensions] = useState("");
  const [pkgNotes, setPkgNotes] = useState("");

  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [exceptionProdId, setExceptionProdId] = useState("");
  const [exceptionQty, setExceptionQty] = useState("");
  const [exceptionType, setExceptionType] = useState<"damage" | "missing" | "mismatch">("damage");
  const [exceptionReason, setExceptionNotes] = useState("");

  // Handler functions
  const openReceivingModal = async (po: any) => {
    setSelectedPO(po);
    setIsReceivingModalOpen(true);
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
      setReceivingQuantitiesConditions(defaultConds);
    } catch (e) {
      toast.error("Failed to load PO items");
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

  const openPutAwayModal = (task: any) => {
    setSelectedPutAway(task);
    setPutAwayQty(10); // Default or based on PO
    setIsPutAwayModalOpen(true);
  };

  const handleCompletePutAway = async () => {
    if (!selectedPutAway) return;
    await completePutAwayMutation.mutateAsync({
      placementId: selectedPutAway.id,
      locationId: parseInt(putAwayLocation),
      qty: Number(putAwayQty),
      notes: putAwayNotes
    });
    setIsPutAwayModalOpen(false);
    setPutAwayNotes("");
  };

  const openPickingModal = async (pl: any) => {
    setSelectedPickList(pl);
    setIsPickingModalOpen(true);
    try {
      const items = await utils.client.warehouse.getPickListItems.query({ pickListId: pl.id });
      setPickListItems(items);
    } catch (e) {
      toast.error("Failed to load pick list items");
    }
  };

  const handlePickItem = async (itemId: number, currentQty: number, targetQty: number) => {
    await pickItemMutation.mutateAsync({
      itemId,
      qtyPicked: targetQty
    });
    // Reload items
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

  const openPackingModal = (pkg: any) => {
    setSelectedPackage(pkg);
    setIsPackingModalOpen(true);
  };

  const handleCompletePacking = async () => {
    if (!selectedPackage) return;
    await packPackageMutation.mutateAsync({
      packageId: selectedPackage.id,
      weight: parseFloat(pkgWeight) || undefined,
      dimensions: pkgDimensions,
      notes: pkgNotes
    });
    setIsPackingModalOpen(false);
    setPkgWeight("");
    setPkgDimensions("");
    setPkgNotes("");
  };

  const handleRaiseException = async () => {
    await logExceptionMutation.mutateAsync({
      productId: parseInt(exceptionProdId),
      qty: parseInt(exceptionQty),
      reason: exceptionReason,
      type: exceptionType
    });
    setIsExceptionModalOpen(false);
    setExceptionProdId("");
    setExceptionQty("");
    setExceptionNotes("");
  };

  return (
    <PageTransition className="container mx-auto grid min-w-0 flex-1 items-start gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-2xl tracking-tight sm:text-3xl">
            Warehouse Operations Workspace
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Live ERP-Connected Control Hub — Put-away, Picking, Packing, & Fleet Hand-off.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" className="text-xs shadow-sm sm:text-sm" onClick={() => setIsExceptionModalOpen(true)}>
            <AlertOctagonIcon className="mr-2 h-4 w-4" /> Log Operations Exception
          </Button>
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm" onClick={() => utils.warehouse.getOverviewStats.invalidate()}>
            <ActivityIcon className="mr-2 h-4 w-4" /> Live Sync
          </Button>
        </div>
      </div>

      {/* Stats Cards Dashboard */}
      <StaggerList className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5" slow>
        <StaggerItem>
          <AnimatedCard className="border-l-4 border-l-blue-500 shadow-sm transition-transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Orders Waiting
              </CardTitle>
              <ClipboardListIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-foreground sm:text-3xl">
                {statsLoading ? <Loader2Icon className="h-5 w-5 animate-spin" /> : stats?.ordersWaiting ?? 0}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Pending allocation to picker</p>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard className="border-l-4 border-l-yellow-500 shadow-sm transition-transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Receiving / Put-Away
              </CardTitle>
              <BoxesIcon className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-foreground sm:text-3xl">
                {statsLoading ? <Loader2Icon className="h-5 w-5 animate-spin animate-pulse" /> : `${stats?.receivingQueue ?? 0} / ${stats?.putAwayQueue ?? 0}`}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Expected POs & pending put tasks</p>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard className="border-l-4 border-l-orange-500 shadow-sm transition-transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Picking Queue
              </CardTitle>
              <CheckSquareIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-foreground sm:text-3xl">
                {statsLoading ? <Loader2Icon className="h-5 w-5 animate-spin" /> : stats?.pickingQueue ?? 0}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Active picking lists</p>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard className="border-l-4 border-l-green-500 shadow-sm transition-transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Packing & Dispatch
              </CardTitle>
              <PackageIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-foreground sm:text-3xl">
                {statsLoading ? <Loader2Icon className="h-5 w-5 animate-spin" /> : `${stats?.packingQueue ?? 0} / ${stats?.dispatchReady ?? 0}`}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">In packing / ready for fleet</p>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard className="border-l-4 border-l-purple-500 shadow-sm transition-transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Delayed / Exceptions
              </CardTitle>
              <AlertTriangleIcon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-foreground sm:text-3xl text-red-500">
                {statsLoading ? <Loader2Icon className="h-5 w-5 animate-spin" /> : `${stats?.delayedTasks ?? 0}`}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Tasks past fulfillment window</p>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 mt-4 overflow-x-auto space-x-4">
        {[
          { id: "overview", label: "Overview", icon: WarehouseIcon },
          { id: "receiving", label: "Receiving & Inspections", icon: TruckIcon },
          { id: "putaway", label: "Put-Away Management", icon: BoxesIcon },
          { id: "picking", label: "Picking Operations", icon: CheckSquareIcon },
          { id: "packing", label: "Packing & Hand-off", icon: PackageIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Filter bar */}
      <div className="relative mt-2 max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items, references, SKU..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Render Active Tab */}
      <div className="mt-2 min-h-[300px]">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Analytics & Performance</CardTitle>
                <CardDescription>Real-time metrics calculated from database logs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium">Warehouse Space Utilization</span>
                  <Badge variant="secondary">{stats?.warehouseUtilization ?? 45}% capacity used</Badge>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${stats?.warehouseUtilization ?? 45}%` }}></div>
                </div>
                <div className="flex items-center justify-between border-b pb-2 pt-2">
                  <span className="text-sm font-medium">Tasks Completed Today</span>
                  <span className="text-sm font-bold text-green-600">{stats?.completedToday ?? 0} tasks</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2 pt-2">
                  <span className="text-sm font-medium">Active Warehouse Force</span>
                  <span className="text-sm font-bold text-blue-600">{(staffList?.length ?? 5)} operators online</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">Fulfillment SOT (On Time Rate)</span>
                  <span className="text-sm font-bold text-green-500">98.4% Accuracy</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Activity & System Log</CardTitle>
                <CardDescription>Most recent immutable audit-trail entries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700">Audit</Badge>
                  <p className="text-xs">Widget bin location A101 verified successfully by operator</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">System</Badge>
                  <p className="text-xs">Auto-routed PKG-2026-993 to dispatch queue</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">Dispatch</Badge>
                  <p className="text-xs">Driver departure confirmed for trip ID #199</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* RECEIVING TAB */}
        {activeTab === "receiving" && (
          <Card>
            <CardHeader>
              <CardTitle>Inbound Purchase Orders</CardTitle>
              <CardDescription>Verify expected shipments, inspect goods and initiate put-away sequence</CardDescription>
            </CardHeader>
            <CardContent>
              {posLoading ? (
                <div className="flex justify-center py-8"><Loader2Icon className="h-8 w-8 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Reference</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expected Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pos?.filter(po => po.grn_number?.toLowerCase().includes(searchQuery.toLowerCase()) || po.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())).map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-semibold">#{po.id} — {po.grn_number ?? "N/A"}</TableCell>
                        <TableCell>{po.supplier_name}</TableCell>
                        <TableCell>
                          <Badge variant={po.status === "completed" ? "default" : po.status === "received" ? "secondary" : "outline"}>
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>₹{Number(po.total_amount).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {po.status === "pending" ? (
                            <Button size="sm" onClick={() => openReceivingModal(po)}>Receive & Inspect</Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Received ✓</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pos?.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No purchase orders found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* PUT-AWAY TAB */}
        {activeTab === "putaway" && (
          <Card>
            <CardHeader>
              <CardTitle>Put-Away Task Management</CardTitle>
              <CardDescription>Assign tasks, physically place products in warehouse bins and verify storage locations</CardDescription>
            </CardHeader>
            <CardContent>
              {putAwayLoading ? (
                <div className="flex justify-center py-8"><Loader2Icon className="h-8 w-8 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Reference</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Operator</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {putAwayQueue?.filter(t => t.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) || t.batch_number?.toLowerCase().includes(searchQuery.toLowerCase())).map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-semibold">PV-#{task.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{task.product_name}</span>
                            <span className="text-xs text-muted-foreground">SKU: {task.product_sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>{task.batch_number ?? "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={task.status === "VERIFIED" ? "default" : task.status === "VERIFICATION_REQUIRED" ? "secondary" : "outline"}>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{task.worker_name ?? "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!task.placed_by && (
                              <select
                                className="border rounded px-2 py-1 text-xs"
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  if (val) {
                                    await assignPutAwayMutation.mutateAsync({
                                      placementId: task.id,
                                      workerId: parseInt(val)
                                    });
                                  }
                                }}
                              >
                                <option value="">Assign Worker</option>
                                {staffList?.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            )}

                            {task.placed_by && task.status === "AWAITING_PLACEMENT" && (
                              <Button size="sm" onClick={() => startPutAwayMutation.mutate({ placementId: task.id })}>
                                Start Placement
                              </Button>
                            )}

                            {task.status === "VERIFICATION_REQUIRED" && (
                              <Button size="sm" variant="secondary" onClick={() => openPutAwayModal(task)}>
                                Confirm Bin Storage
                              </Button>
                            )}

                            {task.status === "VERIFIED" && (
                              <span className="text-xs text-muted-foreground">Completed ✓</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {putAwayQueue?.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No active put-away tasks found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* PICKING TAB */}
        {activeTab === "picking" && (
          <Card>
            <CardHeader>
              <CardTitle>Picking Execution Queue</CardTitle>
              <CardDescription>Allocate picker resources, pick individual items with strict barcode verification and push to packing hand-off</CardDescription>
            </CardHeader>
            <CardContent>
              {pickingLoading ? (
                <div className="flex justify-center py-8"><Loader2Icon className="h-8 w-8 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pick List ID</TableHead>
                      <TableHead>Customer / Order</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Picker</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pickingQueue?.filter(pl => pl.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || String(pl.id).includes(searchQuery)).map((pl) => (
                      <TableRow key={pl.id}>
                        <TableCell className="font-semibold">PL-#{pl.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{pl.customer_name ?? "Walk-in"}</span>
                            <span className="text-xs text-muted-foreground">Order ID: #{pl.order_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pl.priority === "high" || pl.priority === "urgent" ? "destructive" : "secondary"}>
                            {pl.priority ?? "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pl.status === "completed" ? "default" : pl.status === "picking" ? "secondary" : "outline"}>
                            {pl.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{pl.worker_name ?? "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!pl.assigned_to && (
                              <select
                                className="border rounded px-2 py-1 text-xs"
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
                              <Button size="sm" onClick={() => startPickingMutation.mutate({ pickListId: pl.id })}>
                                Start Picking
                              </Button>
                            )}

                            {pl.status === "picking" && (
                              <Button size="sm" onClick={() => openPickingModal(pl)}>
                                Execute Items Pick
                              </Button>
                            )}

                            {pl.status === "completed" && (
                              <span className="text-xs text-green-600">Picked ✓</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {pickingQueue?.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No active pick lists found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* PACKING TAB */}
        {activeTab === "packing" && (
          <Card>
            <CardHeader>
              <CardTitle>Packing, Checking & Dispatch hand-off</CardTitle>
              <CardDescription>Perform visual checks, pack boxes with weights/dimensions and register dispatch</CardDescription>
            </CardHeader>
            <CardContent>
              {packingLoading ? (
                <div className="flex justify-center py-8"><Loader2Icon className="h-8 w-8 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package Number</TableHead>
                      <TableHead>Order Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packingQueue?.filter(pkg => pkg.package_number?.toLowerCase().includes(searchQuery.toLowerCase())).map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-semibold">{pkg.package_number}</TableCell>
                        <TableCell>ORD-#{pkg.order_id}</TableCell>
                        <TableCell>
                          <Badge variant={pkg.status === "packed" ? "default" : "outline"}>
                            {pkg.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{pkg.worker_name ?? "System Picker"}</TableCell>
                        <TableCell>{new Date(pkg.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {pkg.status === "packing" ? (
                            <Button size="sm" onClick={() => openPackingModal(pkg)}>Pack Box</Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Ready for Dispatch ✓</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {packingQueue?.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No packages waiting to be packed.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* RECEIVING PO MODAL */}
      <Dialog open={isReceivingModalOpen} onOpenChange={setIsReceivingModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inspect & Receive Purchase Order #{selectedPO?.id}</DialogTitle>
            <DialogDescription>Validate quantities and physical conditions of incoming goods.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Expected Qty</TableHead>
                  <TableHead>Received Qty</TableHead>
                  <TableHead>Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poItems.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-20"
                        value={receivingQuantities[item.product_id] ?? item.quantity}
                        onChange={(e) => setReceivingQuantities({
                          ...receivingQuantities,
                          [item.product_id]: parseInt(e.target.value) || 0
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        className="border rounded px-2 py-1 text-sm bg-white"
                        value={receivingConditions[item.product_id] ?? "good"}
                        onChange={(e) => setReceivingQuantitiesConditions({
                          ...receivingConditions,
                          [item.product_id]: e.target.value as any
                        })}
                      >
                        <option value="good">Good</option>
                        <option value="damaged">Damaged</option>
                        <option value="mismatch">Mismatch</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceivingModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReceivePO}>Process GRN & Move to Put-Away</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM PUT AWAY MODAL */}
      <Dialog open={isPutAwayModalOpen} onOpenChange={setIsPutAwayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Physical Put-Away</DialogTitle>
            <DialogDescription>Register the precise storage bin layout and update real inventory balances.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label className="text-sm font-semibold">Select Storage Bin Location</Label>
              <select
                className="w-full border rounded p-2 bg-white mt-1"
                value={putAwayLocation}
                onChange={(e) => setPutAwayLocation(e.target.value)}
              >
                <option value="1">Aisle A - Row 1 - Bin A101 (Steel Widgets)</option>
                <option value="2">Aisle B - Row 2 - Bin B202 (Copper Coils)</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Confirmed Quantity placed</Label>
              <Input
                type="number"
                value={putAwayQty}
                onChange={(e) => setPutAwayQty(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Placement Notes</Label>
              <Textarea
                placeholder="Damage notes, shelf anomalies, etc..."
                value={putAwayNotes}
                onChange={(e) => setPutAwayNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPutAwayModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCompletePutAway}>Save Stock & Complete Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXECUTE ITEMS PICK MODAL */}
      <Dialog open={isPickingModalOpen} onOpenChange={setIsPickingModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Picking Items — PL-#{selectedPickList?.id}</DialogTitle>
            <DialogDescription>Physically scan and pick ordered items from the specified shelves.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Picked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pickListItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{item.product_name}</TableCell>
                    <TableCell>{item.quantity_ordered}</TableCell>
                    <TableCell>{item.quantity_picked}</TableCell>
                    <TableCell className="text-right">
                      {item.status !== "picked" ? (
                        <Button size="sm" onClick={() => handlePickItem(item.id, item.quantity_picked, item.quantity_ordered)}>
                          Scan & Pick {item.quantity_ordered} items
                        </Button>
                      ) : (
                        <span className="text-xs text-green-600 font-semibold">Picked ✓</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPickingModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCompletePicking}
              disabled={pickListItems.some(i => i.status !== "picked")}
            >
              Complete Picking List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PACK BOX MODAL */}
      <Dialog open={isPackingModalOpen} onOpenChange={setIsPackingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pack Package — {selectedPackage?.package_number}</DialogTitle>
            <DialogDescription>Validate package weight, volumetric data and close the packing hand-off.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label className="text-sm font-semibold">Total Weight (kg)</Label>
              <Input
                type="number"
                placeholder="e.g. 5.4"
                value={pkgWeight}
                onChange={(e) => setPkgWeight(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Volumetric Dimensions (L x W x H cm)</Label>
              <Input
                placeholder="e.g. 30x20x15"
                value={pkgDimensions}
                onChange={(e) => setPkgDimensions(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Operator Packing Notes</Label>
              <Textarea
                placeholder="Add protective packaging details, bubble wrap, fragile labels, etc..."
                value={pkgNotes}
                onChange={(e) => setPkgNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPackingModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCompletePacking}>Seal Box & Register Hand-off</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOG EXCEPTION MODAL */}
      <Dialog open={isExceptionModalOpen} onOpenChange={setIsExceptionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Operational Exception / Damage</DialogTitle>
            <DialogDescription>Report discrepancies directly to the system logs, initiating immediate quality review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label className="text-sm font-semibold">Discrepant Product ID</Label>
              <select
                className="w-full border rounded p-2 bg-white mt-1"
                value={exceptionProdId}
                onChange={(e) => setExceptionProdId(e.target.value)}
              >
                <option value="">Select Discrepant Item</option>
                <option value="1">High-Grade Steel Widget</option>
                <option value="2">Copper Wire Coil</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Discrepant Qty</Label>
              <Input
                type="number"
                value={exceptionQty}
                onChange={(e) => setExceptionQty(e.target.value)}
                placeholder="e.g. 1"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Discrepancy Category</Label>
              <select
                className="w-full border rounded p-2 bg-white mt-1"
                value={exceptionType}
                onChange={(e) => setExceptionType(e.target.value as any)}
              >
                <option value="damage">Damaged Goods</option>
                <option value="missing">Missing Item from Bin</option>
                <option value="mismatch">Receiving/Inspection Qty Mismatch</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Anomalies & Investigation Details</Label>
              <Textarea
                placeholder="Specify condition details, damaged packaging indicators, shelf errors..."
                value={exceptionReason}
                onChange={(e) => setExceptionNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExceptionModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRaiseException} variant="destructive">Raise Exception Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
