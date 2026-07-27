"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { PlusIcon, PackageIcon, TruckIcon, IndianRupeeIcon, UsersIcon } from "lucide-react";

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gst_number: "",
    pan_number: "",
    supplier_category: "general",
  });

  const { data: supplierList, isLoading, refetch } = trpc.suppliers.list.useQuery();

  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Supplier added successfully!");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", address: "", gst_number: "", pan_number: "", supplier_category: "general" });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const suppliers = Array.isArray(supplierList) ? supplierList : [];

  const kpis = [
    { label: "Total Suppliers", value: suppliers.length, icon: UsersIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active", value: suppliers.filter((s: any) => s.status !== "inactive").length, icon: TruckIcon, color: "text-green-600", bg: "bg-green-50" },
    { label: "Categories", value: new Set(suppliers.map((s: any) => s.supplier_category).filter(Boolean)).size, icon: PackageIcon, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "With GST", value: suppliers.filter((s: any) => s.gst_number).length, icon: IndianRupeeIcon, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <motion.div
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Suppliers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all your suppliers and vendors</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
          <PlusIcon className="w-4 h-4" />
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`${kpi.bg} p-2 rounded-lg`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    {isLoading ? <Skeleton className="h-6 w-12 mt-1" /> : <p className="text-xl font-bold">{kpi.value}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-teal-600" />
            All Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>GST No.</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No suppliers found. Add your first supplier!
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((s: any) => (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm">{s.supplier_code ?? `SUPP-${s.id}`}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.email ?? "—"}</TableCell>
                      <TableCell>{s.phone ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{s.gst_number ?? "—"}</TableCell>
                      <TableCell className="capitalize">{s.supplier_category ?? "general"}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === "inactive" ? "secondary" : "default"} className={s.status === "inactive" ? "" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                          {s.status ?? "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Supplier Name *</Label>
              <Input placeholder="e.g. Sharma Traders" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" placeholder="supplier@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>GST Number</Label>
                <Input placeholder="22AAAAA0000A1Z5" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>PAN Number</Label>
                <Input placeholder="AAAAA0000A" value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input placeholder="Full address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.supplier_category} onChange={(e) => setForm({ ...form, supplier_category: e.target.value })}>
                <option value="general">General</option>
                <option value="raw_material">Raw Material</option>
                <option value="packaging">Packaging</option>
                <option value="services">Services</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form as any)} disabled={!form.name || createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
