"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@evaluna/ui/components/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Badge } from "@evaluna/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@evaluna/ui/components/dialog";
import { Label } from "@evaluna/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Plus, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function WarehousePage() {
  // Trpc Mock
  const { data: transfersData, isLoading: loadingTransfers } = trpc.transfers.list.useQuery(undefined, {
    initialData: [
      { id: "TR-001", from: "Main Warehouse", to: "Downtown Branch", products: "Wireless Mouse (x50)", qty: 50, status: "pending", date: new Date() },
      { id: "TR-002", from: "Main Warehouse", to: "Uptown Branch", products: "Desk Mat (x20)", qty: 20, status: "completed", date: new Date(Date.now() - 86400000) }
    ]
  });

  const { data: receivingData, isLoading: loadingReceiving } = trpc.receiving.list.useQuery(undefined, {
    initialData: [
      { id: "PO-1002", vendor: "TechSupplies Inc", items: 3, expectedQty: 150, date: new Date(), status: "pending" }
    ]
  });

  const { data: damageData, isLoading: loadingDamage } = trpc.damages.list.useQuery(undefined, {
    initialData: [
      { id: "DR-001", product: "Mechanical Keyboard", qty: 2, reason: "Water damage during transit", date: new Date(), status: "pending" }
    ]
  });

  const [isTransferDialogOpen, setTransferDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [isDamageDialogOpen, setDamageDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  const handleCreateTransfer = () => {
    toast.success("Transfer request created successfully");
    setTransferDialogOpen(false);
  };

  const handleReceiveStock = () => {
    toast.success("Stock received and recorded successfully");
    setReceiveDialogOpen(false);
    setSelectedPO(null);
  };

  const handleReportDamage = () => {
    toast.success("Damage report submitted successfully");
    setDamageDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Warehouse Operations</h1>
        <p className="text-muted-foreground">Manage stock transfers, receiving, and damage reports.</p>
      </div>

      <Tabs defaultValue="transfers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="transfers">Stock Transfers</TabsTrigger>
          <TabsTrigger value="receiving">Receiving</TabsTrigger>
          <TabsTrigger value="damage">Damage Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="transfers" asChild>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Stock Transfers</CardTitle>
                  <CardDescription>View and manage internal stock transfers</CardDescription>
                </div>
                <Dialog open={isTransferDialogOpen} onOpenChange={setTransferDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" /> New Transfer Request</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Transfer Request</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Source Branch</Label>
                        <Select defaultValue="main">
                          <SelectTrigger><SelectValue placeholder="Select Source" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main">Main Warehouse</SelectItem>
                            <SelectItem value="downtown">Downtown Branch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Destination Branch</Label>
                        <Select defaultValue="downtown">
                          <SelectTrigger><SelectValue placeholder="Select Destination" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main">Main Warehouse</SelectItem>
                            <SelectItem value="downtown">Downtown Branch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Product Search</Label>
                        <Input placeholder="Search by SKU or Name..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input type="number" placeholder="Enter quantity" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateTransfer}>Submit Request</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transfer ID</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTransfers ? (
                      <TableRow><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ) : transfersData && transfersData.length > 0 ? (
                      transfersData.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.id}</TableCell>
                          <TableCell>{t.from}</TableCell>
                          <TableCell>{t.to}</TableCell>
                          <TableCell>{t.products}</TableCell>
                          <TableCell className="text-right">{t.qty}</TableCell>
                          <TableCell>{format(new Date(t.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={t.status === 'completed' ? 'default' : 'outline'} className={t.status === 'completed' ? 'bg-green-600' : 'text-amber-600 border-amber-600'}>
                              {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No transfers found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="receiving" asChild>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Receiving (GRN)</CardTitle>
                <CardDescription>Pending purchase orders awaiting receipt</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Expected Qty</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingReceiving ? (
                      <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ) : receivingData && receivingData.length > 0 ? (
                      receivingData.map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">{po.id}</TableCell>
                          <TableCell>{po.vendor}</TableCell>
                          <TableCell className="text-right">{po.expectedQty}</TableCell>
                          <TableCell>{format(new Date(po.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-amber-600 border-amber-600">Pending Receipt</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog open={isReceiveDialogOpen && selectedPO?.id === po.id} onOpenChange={(open) => {
                              setReceiveDialogOpen(open);
                              if (open) setSelectedPO(po);
                              else setSelectedPO(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm"><CheckCircle2 className="mr-2 h-4 w-4" /> Receive Stock</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Receive Stock for {po.id}</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                  <p className="text-sm text-muted-foreground">Confirm quantities received for this purchase order.</p>
                                  <div className="space-y-2">
                                    <Label>Received Quantity</Label>
                                    <Input type="number" defaultValue={po.expectedQty} />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>Cancel</Button>
                                  <Button onClick={handleReceiveStock}>Confirm Receipt</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No pending POs to receive</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="damage" asChild>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Damage Reports</CardTitle>
                  <CardDescription>Log and track damaged inventory items</CardDescription>
                </div>
                <Dialog open={isDamageDialogOpen} onOpenChange={setDamageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive"><AlertTriangle className="mr-2 h-4 w-4" /> Report Damage</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report Damaged Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Product Search</Label>
                        <Input placeholder="Search by SKU or Name..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label>Action Needed</Label>
                          <Select defaultValue="writeoff">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="writeoff">Write-off</SelectItem>
                              <SelectItem value="return">Return to Vendor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Reason / Notes</Label>
                        <Input placeholder="Describe the damage..." />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDamageDialogOpen(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={handleReportDamage}>Submit Report</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDamage ? (
                      <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ) : damageData && damageData.length > 0 ? (
                      damageData.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.id}</TableCell>
                          <TableCell>{d.product}</TableCell>
                          <TableCell className="text-right">{d.qty}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{d.reason}</TableCell>
                          <TableCell>{format(new Date(d.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-amber-600 border-amber-600">Pending Review</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No damage reports found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}