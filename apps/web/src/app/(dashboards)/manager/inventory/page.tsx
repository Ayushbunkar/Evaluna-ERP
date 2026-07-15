"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Badge } from "@evaluna/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@evaluna/ui/components/dialog";
import { Label } from "@evaluna/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Search, AlertTriangle, ArrowRightLeft, Package, PackageMinus, PackageX, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Replace with actual trpc call if available
  const { data, isLoading } = trpc.inventory.list.useQuery({ search }, {
    initialData: {
      items: [
        { id: "1", product: "Wireless Mouse", sku: "WM-01", category: "Electronics", inStock: 5, minLevel: 10, maxLevel: 50, lastUpdated: new Date(), price: 29.99 },
        { id: "2", product: "Mechanical Keyboard", sku: "MK-02", category: "Electronics", inStock: 0, minLevel: 5, maxLevel: 20, lastUpdated: new Date(), price: 89.99 },
        { id: "3", product: "Desk Mat", sku: "DM-03", category: "Accessories", inStock: 45, minLevel: 10, maxLevel: 100, lastUpdated: new Date(), price: 19.99 },
      ],
      totalItems: 3
    }
  });

  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const handleAdjustSubmit = () => {
    toast.success("Stock adjusted successfully");
    setAdjustItem(null);
    setAdjustQty("");
    setAdjustReason("");
  };

  const filteredItems = data?.items?.filter((item: any) => {
    if (category !== "all" && item.category.toLowerCase() !== category.toLowerCase()) return false;
    
    const isOut = item.inStock === 0;
    const isLow = item.inStock > 0 && item.inStock <= item.minLevel;
    const isOver = item.inStock >= item.maxLevel;
    
    if (statusFilter === "low" && !isLow) return false;
    if (statusFilter === "out" && !isOut) return false;
    if (statusFilter === "over" && !isOver) return false;
    
    return true;
  }) || [];

  const totalSKUs = data?.totalItems || 0;
  const lowStockCount = data?.items?.filter((i: any) => i.inStock > 0 && i.inStock <= i.minLevel).length || 0;
  const outOfStockCount = data?.items?.filter((i: any) => i.inStock === 0).length || 0;
  const totalValue = data?.items?.reduce((acc: number, i: any) => acc + (i.inStock * i.price), 0) || 0;

  const hasLowStock = lowStockCount > 0 || outOfStockCount > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage branch inventory and monitor stock levels</p>
        </div>
        <Button>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Request Stock Transfer
        </Button>
      </div>

      <AnimatePresence>
        {hasLowStock && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-destructive/15 text-destructive border-l-4 border-destructive p-4 rounded-r-md flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Low Stock Alert</h3>
              <p className="text-sm">You have items that are low on stock or out of stock. Please reorder soon.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSKUs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <PackageMinus className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <PackageX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
            <SelectItem value="over">Overstocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU/Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">In Stock</TableHead>
              <TableHead className="text-right">Min/Max Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
                </TableRow>
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item: any, i: number) => (
                <motion.tr 
                  key={item.id} 
                  className="group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TableCell className="font-medium align-middle">{item.product}</TableCell>
                  <TableCell className="align-middle">{item.sku}</TableCell>
                  <TableCell className="align-middle">{item.category}</TableCell>
                  <TableCell className="text-right font-semibold align-middle">{item.inStock}</TableCell>
                  <TableCell className="text-right text-muted-foreground align-middle">{item.minLevel} / {item.maxLevel}</TableCell>
                  <TableCell className="align-middle">
                    {item.inStock === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : item.inStock <= item.minLevel ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">Low Stock</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm align-middle">
                    {format(new Date(item.lastUpdated), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right align-middle">
                    <Dialog open={adjustItem?.id === item.id} onOpenChange={(open) => !open && setAdjustItem(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setAdjustItem(item)}>
                          Adjust Stock
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adjust Stock for {item.product}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="qty" className="text-right">Quantity (+/-)</Label>
                            <Input
                              id="qty"
                              type="number"
                              className="col-span-3"
                              value={adjustQty}
                              onChange={(e) => setAdjustQty(e.target.value)}
                              placeholder="e.g. -5 or 10"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reason" className="text-right">Reason</Label>
                            <Input
                              id="reason"
                              className="col-span-3"
                              value={adjustReason}
                              onChange={(e) => setAdjustReason(e.target.value)}
                              placeholder="e.g. Damage, Audit"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAdjustItem(null)}>Cancel</Button>
                          <Button onClick={handleAdjustSubmit}>Save Adjustment</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" disabled>Previous</Button>
        <Button variant="outline" size="sm" disabled>Next</Button>
      </div>
    </div>
  );
}