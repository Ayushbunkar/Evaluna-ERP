"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { PackagePlus, Plus, Scan, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ReceivingPage() {
  const [grnNumber, setGrnNumber] = useState("");
  const [items, setItems] = useState<{ productId: number; name: string; quantity: number }[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const receiveMutation = trpc.warehouse.receiveGRN.useMutation({
    onSuccess: (data) => {
      toast.success(`GRN ${data.grn} received successfully!`);
      setGrnNumber("");
      setItems([]);
    },
    onError: () => {
      toast.error("Failed to receive GRN");
    }
  });

  const handleAddItem = () => {
    if (!productId) {
      toast.error("Please enter a product ID");
      return;
    }
    const id = parseInt(productId, 10);
    const qty = parseInt(quantity, 10);
    
    if (isNaN(id) || isNaN(qty) || qty <= 0) {
      toast.error("Invalid product ID or quantity");
      return;
    }

    setItems((prev) => [
      ...prev,
      { productId: id, name: `Product ${id}`, quantity: qty }
    ]);
    
    setProductId("");
    setQuantity("1");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!grnNumber) {
      toast.error("Please enter a GRN Number");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    
    receiveMutation.mutate({
      grn_number: grnNumber,
      items: items.map(item => ({ product_id: item.productId, quantity: item.quantity }))
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/putter">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PackagePlus className="h-8 w-8 text-primary" />
            GRN Receiving
          </h1>
          <p className="text-muted-foreground">Receive goods and register them for putaway</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GRN Details</CardTitle>
              <CardDescription>Enter the Good Receipt Note</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grn">GRN Number / PO Number</Label>
                <div className="flex gap-2">
                  <Input 
                    id="grn" 
                    placeholder="e.g. GRN-1002" 
                    value={grnNumber} 
                    onChange={(e) => setGrnNumber(e.target.value)} 
                  />
                  <Button size="icon" variant="outline" title="Scan Barcode">
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product ID / Barcode</Label>
                <div className="flex gap-2">
                  <Input 
                    id="product" 
                    placeholder="Scan or type..." 
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  />
                  <Button size="icon" variant="outline" title="Scan Barcode">
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity Received</Label>
                <Input 
                  id="qty" 
                  type="number" 
                  min="1" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <Button onClick={handleAddItem} className="w-full h-12" variant="secondary">
                <Plus className="h-5 w-5 mr-2" />
                Add to List
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Received Items</CardTitle>
              <CardDescription>{items.length} items ready to process</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-48 text-muted-foreground">
                          No items added yet. Scan products to begin.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, idx) => (
                        <motion.tr 
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group border-b last:border-0"
                        >
                          <TableCell className="font-medium">
                            {item.name}
                            <div className="text-xs text-muted-foreground">ID: {item.productId}</div>
                          </TableCell>
                          <TableCell className="text-right text-lg font-bold">{item.quantity}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveItem(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6">
                <Button 
                  onClick={handleSubmit} 
                  disabled={items.length === 0 || receiveMutation.isPending}
                  className="w-full h-14 text-lg"
                >
                  {receiveMutation.isPending ? "Processing..." : "Complete Receiving & Generate Putaway"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
