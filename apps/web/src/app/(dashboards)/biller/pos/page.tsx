"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@evaluna/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { toast } from "sonner";
import { ScanLine, Trash2, CreditCard, Banknote, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  qty: number;
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const checkoutMutation = trpc.pos.checkout.useMutation();

  useEffect(() => {
    inputRef.current?.focus();
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Auto-focus on scanning if not in input
      if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    // In a real app, query trpc.inventory.findByBarcode
    // For now, mock a product based on barcode
    const mockProduct = {
      id: Math.random().toString(),
      sku: barcode,
      name: `Product ${barcode}`,
      price: Math.floor(Math.random() * 50) + 5,
    };

    setCart((prev) => {
      const existing = prev.find((i) => i.sku === barcode);
      if (existing) {
        return prev.map((i) => (i.sku === barcode ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...mockProduct, qty: 1 }];
    });

    setBarcode("");
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleCheckout = (method: "cash" | "card") => {
    if (cart.length === 0) return;
    
    // Optimistic UI for offline-first support
    const payload = {
      items: cart,
      total: totalAmount,
      method,
      timestamp: new Date().toISOString(),
    };

    checkoutMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Checkout successful via ${method}`);
        setCart([]);
      },
      onError: () => {
        // Queue it locally if offline
        toast.error("Offline: Saved to local queue");
        const queue = JSON.parse(localStorage.getItem("pos-offline-queue") || "[]");
        queue.push(payload);
        localStorage.setItem("pos-offline-queue", JSON.stringify(queue));
        setCart([]);
      }
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      {/* Left side: Cart */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-4 border-b">
          <form onSubmit={handleScan} className="flex gap-2">
            <ScanLine className="w-10 h-10 p-2 bg-muted rounded-md text-muted-foreground" />
            <Input 
              ref={inputRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan barcode or enter SKU..."
              className="text-lg h-10"
              autoFocus
            />
            <Button type="submit" className="h-10">Add</Button>
          </form>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="text-right w-24">Price</TableHead>
                <TableHead className="text-right w-24">Total</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {cart.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No items in cart. Start scanning.
                    </TableCell>
                  </TableRow>
                )}
                {cart.map((item) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-b"
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}>-</Button>
                        <span className="w-4 text-center">{item.qty}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, 1)}>+</Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">${(item.price * item.qty).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Right side: Payment */}
      <Card className="w-80 flex flex-col">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-2xl font-bold border-t pt-4">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button 
            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" 
            disabled={cart.length === 0 || checkoutMutation.isPending}
            onClick={() => handleCheckout("cash")}
          >
            <Banknote className="w-5 h-5 mr-2" /> Pay Cash
          </Button>
          <Button 
            className="w-full h-12 text-lg" 
            variant="secondary"
            disabled={cart.length === 0 || checkoutMutation.isPending}
            onClick={() => handleCheckout("card")}
          >
            <CreditCard className="w-5 h-5 mr-2" /> Pay Card
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
