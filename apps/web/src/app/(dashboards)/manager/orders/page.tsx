"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  Eye,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
} from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { KpiCard } from "@/components/shared/cards/kpi-card";

import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@evaluna/ui/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@evaluna/ui/components/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "all" | "pending" | "completed" | "cancelled";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: string | null) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          Pending
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status ?? "Unknown"}</Badge>;
  }
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num || 0);
}

const PAGE_SIZE = 10;

const STATUS_TABS: { label: string; value: OrderStatus }[] = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

// ─── Order Detail Dialog ───────────────────────────────────────────────────────

function OrderDetailDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data: order, isLoading } = trpc.orders.get.useQuery(
    { id: orderId! },
    {
      enabled: open && orderId !== null,
      onSuccess: (data: { status: string | null } | null) => {
        if (data?.status) setSelectedStatus(data.status);
      },
    }
  );

  const updateMutation = trpc.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Order status updated successfully");
      utils.orders.list.invalidate();
      if (orderId) utils.orders.get.invalidate({ id: orderId });
    },
    onError: (err: { message: string }) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  const handleStatusSave = () => {
    if (!orderId || !selectedStatus) return;
    updateMutation.mutate({
      id: orderId,
      status: selectedStatus as "completed" | "pending" | "cancelled",
    });
  };

  const totalItems =
    order?.orderItems?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Order #{orderId} Details
          </DialogTitle>
          <DialogDescription>
            Full order information and line items.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order meta */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{order.customer?.name ?? "Walk-in"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {order.created_at
                    ? format(new Date(order.created_at), "MMM d, yyyy • h:mm a")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(order.total_amount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Status</p>
                <div className="mt-1">{getStatusBadge(order.status)}</div>
              </div>
            </div>

            {/* Items table */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Order Items ({totalItems} item{totalItems !== 1 ? "s" : ""})
              </h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.orderItems?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          No items found for this order.
                        </TableCell>
                      </TableRow>
                    ) : (
                      order.orderItems?.map((item: {
                        id: number;
                        product_id: number | null;
                        quantity: number;
                        price: string;
                        product: { name: string; category: string | null } | null;
                      }) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product?.name ?? `Product #${item.product_id}`}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.product?.category ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(
                              parseFloat(item.price) * item.quantity
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Status update */}
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm font-medium">Update Order Status</p>
              <div className="flex items-center gap-3">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusSave}
                  disabled={
                    updateMutation.isPending ||
                    selectedStatus === order.status
                  }
                  size="sm"
                >
                  {updateMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Status"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Order not found.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagerOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: orders = [], isLoading, refetch } = trpc.orders.list.useQuery();

  // ── Derived stats ────────────────────────────────────────────────────────────
  const today = new Date().toDateString();

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const completedToday = orders.filter(
      (o) =>
        o.status === "completed" &&
        o.created_at &&
        new Date(o.created_at).toDateString() === today
    ).length;
    const revenueToday = orders
      .filter(
        (o) =>
          o.status === "completed" &&
          o.created_at &&
          new Date(o.created_at).toDateString() === today
      )
      .reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0);

    return { totalOrders, pending, completedToday, revenueToday };
  }, [orders, today]);

  // ── Filtered + paginated orders ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus =
        statusFilter === "all" || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        String(o.id).includes(q) ||
        (o.customer?.name ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleViewOrder = (id: number) => {
    setSelectedOrderId(id);
    setDialogOpen(true);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleTabChange = (tab: OrderStatus) => {
    setStatusFilter(tab);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground mt-1">
            View, filter, and manage all branch orders.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* ── KPI Stats ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Orders"
          value={isLoading ? "—" : stats.totalOrders}
          icon={ShoppingCart}
          description="All time"
        />
        <KpiCard
          title="Pending"
          value={isLoading ? "—" : stats.pending}
          icon={Clock}
          description="Awaiting fulfillment"
        />
        <KpiCard
          title="Completed Today"
          value={isLoading ? "—" : stats.completedToday}
          icon={CheckCircle2}
          description="Orders fulfilled today"
        />
        <KpiCard
          title="Revenue Today"
          value={isLoading ? "—" : formatCurrency(stats.revenueToday)}
          icon={TrendingUp}
          description="From completed orders"
        />
      </div>

      {/* ── Table Card ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Order List</CardTitle>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order # or customer…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1 mt-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.value !== "all" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({orders.filter((o) => o.status === tab.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeletonRows />
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {search || statusFilter !== "all"
                      ? "No orders match your filters."
                      : "No orders found."}
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence initial={false}>
                  {paginated.map((order, idx) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="pl-6 font-mono font-medium">
                        #{order.id}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {order.customer?.name ?? (
                            <span className="text-muted-foreground italic">
                              Walk-in
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Item count not in list query – click View to see items */}
                        <span className="text-muted-foreground text-xs">See details</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {order.created_at
                          ? format(new Date(order.created_at), "MMM d, h:mm a")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}
                </span>{" "}
                –{" "}
                <span className="font-medium">
                  {Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filtered.length}</span> orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Dialog ────────────────────────────────────────────────── */}
      <OrderDetailDialog
        orderId={selectedOrderId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}