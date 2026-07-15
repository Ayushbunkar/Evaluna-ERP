"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ShoppingCart, Trash2, Plus, Minus, Tag, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { PaymentModal } from "@/components/pos/payment-modal";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrintPreviewDialog } from "@/components/printing/PrintPreviewDialog";
import { ThermalReceipt } from "@/components/printing/ThermalReceipt";
import { PageTransition, StaggerList, StaggerItem, AnimatedCard, AnimatedButton } from "@/lib/animations";

export default function POSPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: number, code: string, discount: number } | null>(null);
  
  // TRPC Queries
  const { data: catalog, isLoading } = trpc.pos.catalog.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // heavily cache for offline use
  });

  const checkoutMutation = trpc.pos.checkout.useMutation({
    onSuccess: (data) => {
      toast.success("Order processed successfully!");
      setLastCompletedOrder({
        id: data.id,
        createdAt: new Date().toISOString(),
        items: cart,
        total: total,
        subtotal: subtotal,
        tax: 0
      });
      setCart([]);
      setAppliedCoupon(null);
    },
    onError: (err) => {
      toast.error(`Checkout failed: ${err.message}`);
    }
  });

  // Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const subtotal = cart.reduce((acc, item) => acc + parseFloat(item.price) * item.qty, 0);
  const discount = appliedCoupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  const validateCouponMutation = trpc.marketing.validateCoupon.useMutation({
    onSuccess: (data) => {
      setAppliedCoupon({ id: data.couponId, code: data.code, discount: data.discountAmount });
      toast.success("Coupon applied!");
      setCouponCode("");
    },
    onError: (error) => {
      toast.error(error.message);
      setAppliedCoupon(null);
    }
  });

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    validateCouponMutation.mutate({ code: couponCode, subtotal });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Barcode Scanner Listener
  useEffect(() => {
    let barcode = "";
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Enter") {
        if (barcode && catalog) {
          if (barcode.length === 13 && barcode.startsWith("21")) {
            const itemCode = barcode.substring(2, 7);
            const weightStr = barcode.substring(7, 12);
            const qty = parseFloat(weightStr) / 1000;
            const product = catalog.find((p) => p.barcode === itemCode);
            if (product) {
              if (product.is_weighted) {
                addToCart(product, qty);
                toast.success(`Added ${product.name}`);
              } else {
                addToCart(product, 1);
                toast.warning("Product is not weighted, added 1 unit");
              }
            } else {
              toast.error("Product not found");
            }
          } else if (barcode.length === 13 && barcode.startsWith("22")) {
            const itemCode = barcode.substring(2, 7);
            const priceStr = barcode.substring(7, 12);
            const price = parseFloat(priceStr) / 100;
            const product = catalog.find((p) => p.barcode === itemCode);
            if (product) {
              if (product.is_weighted) {
                const qty = price / parseFloat(product.price);
                addToCart(product, qty);
                toast.success(`Added ${product.name}`);
              } else {
                addToCart(product, 1);
                toast.warning("Product is not weighted, added 1 unit");
              }
            } else {
              toast.error("Product not found");
            }
          } else {
            const product = catalog.find((p) => p.barcode === barcode || p.sku === barcode);
            if (product) {
              addToCart(product, 1);
              toast.success(`Added ${product.name}`);
            } else {
              toast.error("Product not found");
            }
          }
        }
        barcode = "";
        return;
      }

      if (e.key.length === 1) {
        barcode += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcode = "";
        }, 100); // 100ms timeout to distinguish scanner from manual typing
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [catalog]);

  const addToCart = (product: any, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { ...product, qty: qty }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0.001, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    setPaymentModalOpen(true);
  };

  const finalizeOrder = (payments: any[]) => {
    if (isOffline) {
      toast.info("Saved offline bill. Will sync when online.");
      setCart([]);
      setAppliedCoupon(null);
      return;
    }

    checkoutMutation.mutate({
      items: cart.map(c => ({ productId: c.id, quantity: c.qty, price: c.price })),
      payments: payments,
      isOfflineSync: false,
      couponId: appliedCoupon?.id,
      discountAmount: appliedCoupon?.discount
    });
  };

  const filteredCatalog = catalog?.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
  );

  return (
    <PageTransition className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted/40">
      {/* Left Pane - Catalog */}
      <div className="flex-1 flex flex-col p-4 border-r">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <div className="flex items-center gap-2">
            {isOffline ? (
              <span className="flex items-center gap-2 text-destructive font-semibold">
                <WifiOff className="w-4 h-4" /> Offline
              </span>
            ) : (
              <span className="flex items-center gap-2 text-primary font-semibold">
                <Wifi className="w-4 h-4" /> Online
              </span>
            )}
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <StaggerList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
              {filteredCatalog?.map((product) => (
                <StaggerItem key={product.id}>
                  <AnimatedCard>
                    <Card
                      className="cursor-pointer border-transparent shadow-sm hover:border-primary/50 transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-semibold truncate" title={product.name}>
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold text-primary">₹{parseFloat(product.price).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {product.description || "No description"}
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </ScrollArea>
      </div>

      {/* Right Pane - Cart */}
      <div className="w-[400px] flex flex-col bg-background p-4 shadow-xl z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Order
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setCart([])} disabled={cart.length === 0}>
            Clear
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4 bg-muted/20">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4"
              >
                <ShoppingCart className="w-16 h-16 opacity-20" />
                <p>Cart is empty</p>
                <p className="text-xs">Scan a barcode or click a product</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    layout
                    className="flex justify-between items-center p-3 bg-card rounded-lg border shadow-sm group"
                  >
                    <div className="flex-1 overflow-hidden pr-2">
                      <div className="font-semibold text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Tag className="w-3 h-3" /> ₹{parseFloat(item.price).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-md h-8">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-full w-8 rounded-none rounded-l-md"
                          onClick={() => updateQty(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-12 text-center text-sm font-semibold">
                          {Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(3)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-full w-8 rounded-none rounded-r-md"
                          onClick={() => updateQty(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <AnimatedButton>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AnimatedButton>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="py-2 flex items-center gap-2">
            <Input
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="h-8 text-sm"
              disabled={!!appliedCoupon}
            />
            {appliedCoupon ? (
              <Button size="sm" variant="outline" className="h-8" onClick={removeCoupon}>
                Remove
              </Button>
            ) : (
              <Button size="sm" className="h-8" onClick={handleApplyCoupon} disabled={!couponCode || validateCouponMutation.isPending}>
                Apply
              </Button>
            )}
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Discount</span>
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> ₹{discount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center font-bold text-2xl pt-2 border-t">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4">
            <Button variant="secondary" size="lg" className="w-full" disabled={cart.length === 0}>
              Hold Bill
            </Button>
            <Button size="lg" className="w-full font-bold text-lg" onClick={handleCheckout} disabled={cart.length === 0 || checkoutMutation.isPending}>
              {checkoutMutation.isPending ? "Processing..." : "Pay Now"}
            </Button>
          </div>
        </div>
      </div>

      {paymentModalOpen && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          totalAmount={total}
          onConfirm={finalizeOrder}
        />
      )}

      <Dialog open={!!lastCompletedOrder} onOpenChange={(open) => !open && setLastCompletedOrder(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Order Completed</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center p-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <p className="font-semibold text-lg">Order #{lastCompletedOrder?.id}</p>
            <p className="text-muted-foreground mb-6">Amount: ₹{lastCompletedOrder?.total?.toFixed(2)}</p>
            <div className="flex w-full gap-3">
              <Button className="flex-1" variant="outline" onClick={() => setLastCompletedOrder(null)}>
                New Order
              </Button>
              <PrintPreviewDialog title="Print Receipt">
                <ThermalReceipt 
                  order={lastCompletedOrder} 
                  branch={{
                    name: "Evaluna Supermarket",
                    address: "123 Retail Ave, Commerce City",
                    phone: "+1 234 567 8900"
                  }}
                />
              </PrintPreviewDialog>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
