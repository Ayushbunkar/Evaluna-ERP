"use client";

import React, { useReducer, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  UserX,
  CreditCard,
  Smartphone,
  Banknote,
  Receipt,
  CheckCircle2,
  Printer,
  Tag,
  Package,
  XCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { trpc } from "@/lib/trpc/client";

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  price: string;
  barcode?: string | null;
  sku?: string | null;
  category?: string | null;
  unit?: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  loyalty_points?: number | null;
  store_credit?: string | null;
}

type PaymentMethod = "cash" | "card" | "upi";

// ─── Cart Reducer ─────────────────────────────────────────────────────────────

type CartAction =
  | { type: "ADD_ITEM"; product: Product }
  | { type: "REMOVE_ITEM"; productId: number }
  | { type: "SET_QTY"; productId: number; quantity: number }
  | { type: "INCREMENT"; productId: number }
  | { type: "DECREMENT"; productId: number }
  | { type: "CLEAR" };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.find((i) => i.product.id === action.product.id);
      if (existing) {
        return state.map((i) =>
          i.product.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...state, { product: action.product, quantity: 1 }];
    }
    case "REMOVE_ITEM":
      return state.filter((i) => i.product.id !== action.productId);
    case "SET_QTY":
      if (action.quantity <= 0) return state.filter((i) => i.product.id !== action.productId);
      return state.map((i) =>
        i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
      );
    case "INCREMENT":
      return state.map((i) =>
        i.product.id === action.productId ? { ...i, quantity: i.quantity + 1 } : i
      );
    case "DECREMENT":
      return state
        .map((i) =>
          i.product.id === action.productId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
        )
        .filter((i) => i.quantity > 0);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

// Payment method ID mapping to match DB records (Cash=1, Card=2, UPI=3)
const PAYMENT_METHOD_IDS: Record<PaymentMethod, number> = {
  cash: 1,
  card: 2,
  upi: 3,
};

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  upi: <Smartphone className="h-4 w-4" />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-3">
      <ShoppingCart className="h-12 w-12 opacity-20" />
      <p className="text-sm font-medium">Cart is empty</p>
      <p className="text-xs">Search and click a product to add it here.</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagerBillingPage() {
  // ── Search & Debounce ──────────────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleProductSearch = useCallback((val: string) => {
    setProductSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, dispatch] = useReducer(cartReducer, []);

  // ── Discount ─────────────────────────────────────────────────────────────
  const [discountPct, setDiscountPct] = useState<string>("0");
  const TAX_RATE = 0.18; // 18% GST — editable if needed

  // ── Customer ──────────────────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  // ── Payment ───────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashTendered, setCashTendered] = useState<string>("");

  // ── Success Dialog ────────────────────────────────────────────────────────
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    orderId?: number;
    total?: number;
  }>({ open: false });

  // ─── TRPC ─────────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();

  const { data: productsData, isLoading: productsLoading } = trpc.products.list.useQuery();

  const { data: customersData, isLoading: customersLoading } = trpc.customers.list.useQuery();

  const checkoutMutation = trpc.pos.checkout.useMutation({
    onSuccess: (order) => {
      toast.success(`Order #${order.id} processed successfully!`);
      setSuccessDialog({ open: true, orderId: order.id, total: parseFloat(order.total_amount) });
      dispatch({ type: "CLEAR" });
      setDiscountPct("0");
      setCashTendered("");
      setSelectedCustomer(null);
      setIsWalkIn(true);
      setCustomerSearch("");
      utils.products.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Sale failed: ${err.message}`);
    },
  });

  // ─── Derived Values ───────────────────────────────────────────────────────

  const subtotal = cart.reduce(
    (acc, item) => acc + parseFloat(item.product.price) * item.quantity,
    0
  );

  const discountAmount = subtotal * (Math.min(100, Math.max(0, parseFloat(discountPct) || 0)) / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * TAX_RATE;
  const grandTotal = afterDiscount + taxAmount;

  const cashTenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashTenderedNum - grandTotal);

  // ─── Filtered Products ────────────────────────────────────────────────────
  const filteredProducts: Product[] = React.useMemo(() => {
    if (!productsData) return [];
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return productsData as Product[];
    return (productsData as Product[]).filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [productsData, debouncedSearch]);

  // ─── Filtered Customers ───────────────────────────────────────────────────
  const filteredCustomers: Customer[] = React.useMemo(() => {
    if (!customersData) return [];
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customersData as Customer[];
    return (customersData as Customer[]).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customersData, customerSearch]);

  // ─── Close customer dropdown on outside click ─────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Process Sale Handler ─────────────────────────────────────────────────
  const handleProcessSale = () => {
    if (cart.length === 0) {
      toast.warning("Add at least one product to the cart.");
      return;
    }
    if (paymentMethod === "cash" && cashTenderedNum < grandTotal) {
      toast.warning("Cash tendered is less than the grand total.");
      return;
    }

    checkoutMutation.mutate({
      customerId: isWalkIn ? undefined : selectedCustomer?.id,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      payments: [
        {
          methodId: PAYMENT_METHOD_IDS[paymentMethod],
          amount: grandTotal.toFixed(2),
        },
      ],
      discountAmount: discountAmount.toFixed(2),
    });
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            Quick Billing
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Fast POS interface — search, add to cart, and process payments instantly.
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1.5 font-mono">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Badge>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* ════════════════════════════════════════════
            LEFT PANEL — Product Search & Cart
        ════════════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-4">
          {/* Product Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Product Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={productSearch}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  placeholder="Search product by name or barcode..."
                  className="pl-9"
                />
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {productsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-3 flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8 opacity-25" />
                    <p className="text-sm">No products found</p>
                    {debouncedSearch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProductSearch("");
                          setDebouncedSearch("");
                        }}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredProducts.slice(0, 30).map((product, i) => {
                      const inCart = cart.find((c) => c.product.id === product.id);
                      return (
                        <motion.button
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: i * 0.03, duration: 0.18 }}
                          onClick={() => dispatch({ type: "ADD_ITEM", product })}
                          className={`
                            group relative text-left rounded-lg border p-3 cursor-pointer transition-all duration-150
                            hover:border-primary hover:shadow-sm hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                            ${inCart ? "border-primary bg-primary/5" : "border-border bg-card"}
                          `}
                        >
                          {inCart && (
                            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {inCart.quantity}
                            </span>
                          )}
                          <p className="text-xs font-semibold leading-tight line-clamp-2 pr-4">
                            {product.name}
                          </p>
                          {product.category && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {product.category}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1.5 gap-1">
                            <span className="text-sm font-bold text-primary">
                              {fmt(parseFloat(product.price))}
                            </span>
                            {product.unit && (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                {product.unit}
                              </Badge>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
              {filteredProducts.length > 30 && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing first 30 results. Refine your search to narrow down.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Cart
                  {cart.length > 0 && (
                    <Badge className="ml-1 text-xs px-1.5 py-0">
                      {cart.reduce((s, i) => s + i.quantity, 0)} items
                    </Badge>
                  )}
                </CardTitle>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive h-7"
                    onClick={() => dispatch({ type: "CLEAR" })}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <EmptyCart />
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {cart.map((item) => (
                        <motion.div
                          key={item.product.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                        >
                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.product.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {fmt(parseFloat(item.product.price))} ea.
                            </p>
                          </div>

                          {/* Qty controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 rounded-md"
                              onClick={() =>
                                dispatch({ type: "DECREMENT", productId: item.product.id })
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                dispatch({
                                  type: "SET_QTY",
                                  productId: item.product.id,
                                  quantity: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-10 text-center text-sm font-bold border rounded-md h-6 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 rounded-md"
                              onClick={() =>
                                dispatch({ type: "INCREMENT", productId: item.product.id })
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Line total */}
                          <span className="text-xs font-bold text-right w-20 shrink-0">
                            {fmt(parseFloat(item.product.price) * item.quantity)}
                          </span>

                          {/* Remove */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                            onClick={() =>
                              dispatch({ type: "REMOVE_ITEM", productId: item.product.id })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Totals */}
                  <div className="rounded-lg border bg-muted/20 p-3 space-y-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{fmt(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Discount
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-xs">-{fmt(discountAmount)}</span>
                        <div className="relative w-20">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={discountPct}
                            onChange={(e) => setDiscountPct(e.target.value)}
                            className="w-full text-right text-xs font-semibold border rounded-md h-6 px-2 pr-5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span className="font-medium text-amber-600">+{fmt(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-2 mt-1">
                      <span>Grand Total</span>
                      <span className="text-primary text-lg">{fmt(grandTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT PANEL — Payment & Customer
        ════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Walk-in / Registered toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsWalkIn(true);
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    isWalkIn
                      ? "border-primary bg-primary text-primary-foreground shadow"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <UserX className="h-3.5 w-3.5" />
                  Walk-in
                </button>
                <button
                  onClick={() => {
                    setIsWalkIn(false);
                    setCustomerDropdownOpen(true);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    !isWalkIn
                      ? "border-primary bg-primary text-primary-foreground shadow"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  Registered
                </button>
              </div>

              {/* Customer search (only when Registered) */}
              {!isWalkIn && (
                <div className="relative" ref={customerSearchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setCustomerDropdownOpen(true)}
                      placeholder="Search by name, email or phone..."
                      className="pl-8 text-sm h-8"
                    />
                  </div>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {customerDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 top-full mt-1 w-full rounded-lg border bg-background shadow-lg max-h-48 overflow-y-auto"
                      >
                        {customersLoading ? (
                          <div className="p-3 space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} className="h-8 w-full" />
                            ))}
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No customers found
                          </div>
                        ) : (
                          filteredCustomers.slice(0, 20).map((customer) => (
                            <button
                              key={customer.id}
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerSearch(customer.name);
                                setCustomerDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2 transition-colors"
                            >
                              <div>
                                <p className="font-medium text-xs">{customer.name}</p>
                                <p className="text-[11px] text-muted-foreground">{customer.email}</p>
                              </div>
                              {customer.loyalty_points != null && (
                                <Badge variant="outline" className="text-[9px] shrink-0">
                                  {customer.loyalty_points} pts
                                </Badge>
                              )}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Selected customer info */}
              {!isWalkIn && selectedCustomer && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{selectedCustomer.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearch("");
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{selectedCustomer.email}</p>
                  {selectedCustomer.phone && (
                    <p className="text-[11px] text-muted-foreground">📞 {selectedCustomer.phone}</p>
                  )}
                  <div className="flex gap-2 mt-1.5">
                    {selectedCustomer.loyalty_points != null && (
                      <Badge variant="secondary" className="text-[10px]">
                        {selectedCustomer.loyalty_points} loyalty pts
                      </Badge>
                    )}
                    {selectedCustomer.store_credit && parseFloat(selectedCustomer.store_credit) > 0 && (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                        Credit: {fmt(parseFloat(selectedCustomer.store_credit))}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )}

              {isWalkIn && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
                  <UserX className="h-3.5 w-3.5 shrink-0" />
                  Walk-in customer — no loyalty tracking
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Payment toggle buttons */}
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "card", "upi"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-xs font-semibold transition-all duration-150 capitalize ${
                      paymentMethod === method
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card hover:bg-muted text-foreground"
                    }`}
                  >
                    {PAYMENT_ICONS[method]}
                    {method.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Cash tender (only when Cash selected) */}
              <AnimatePresence>
                {paymentMethod === "cash" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Cash Tendered (₹)
                      </label>
                      <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          placeholder={fmt(grandTotal)}
                          className="w-full pl-9 pr-3 h-10 rounded-md border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* Quick amounts */}
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        Math.ceil(grandTotal / 10) * 10,
                        Math.ceil(grandTotal / 50) * 50,
                        Math.ceil(grandTotal / 100) * 100,
                        Math.ceil(grandTotal / 500) * 500,
                      ]
                        .filter((v, i, arr) => arr.indexOf(v) === i && v > 0)
                        .slice(0, 4)
                        .map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setCashTendered(amount.toString())}
                            className="rounded-md border px-2.5 py-1 text-[11px] font-medium hover:bg-muted transition-colors"
                          >
                            ₹{amount.toLocaleString("en-IN")}
                          </button>
                        ))}
                    </div>

                    {/* Change calculator */}
                    <div
                      className={`rounded-lg border p-3 flex items-center justify-between ${
                        changeDue > 0
                          ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                          : cashTenderedNum > 0 && cashTenderedNum < grandTotal
                          ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                          : "border-border bg-muted/20"
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {cashTenderedNum < grandTotal && cashTenderedNum > 0
                          ? "Still needed"
                          : "Change Due"}
                      </span>
                      <span
                        className={`text-xl font-bold ${
                          changeDue > 0
                            ? "text-emerald-600"
                            : cashTenderedNum > 0 && cashTenderedNum < grandTotal
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {cashTenderedNum > 0 && cashTenderedNum < grandTotal
                          ? fmt(grandTotal - cashTenderedNum)
                          : fmt(changeDue)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card / UPI info */}
              {(paymentMethod === "card" || paymentMethod === "upi") && (
                <div className="rounded-lg bg-muted/40 border px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                  {paymentMethod === "card" ? (
                    <CreditCard className="h-4 w-4 shrink-0" />
                  ) : (
                    <Smartphone className="h-4 w-4 shrink-0" />
                  )}
                  {paymentMethod === "card"
                    ? "Swipe / tap the card on the terminal to complete payment."
                    : "Show QR code to customer for UPI payment."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary Banner */}
          {cart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-4 space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{fmt(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-rose-600">
                  <span>Discount ({discountPct}%)</span>
                  <span>-{fmt(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-amber-600">
                <span>GST (18%)</span>
                <span>+{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-primary">{fmt(grandTotal)}</span>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full h-12 text-base font-bold"
              disabled={
                cart.length === 0 ||
                checkoutMutation.isPending ||
                (paymentMethod === "cash" && cashTenderedNum < grandTotal && cashTendered !== "")
              }
              onClick={handleProcessSale}
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ChevronRight className="mr-2 h-5 w-5" />
                  Process Sale {cart.length > 0 && `· ${fmt(grandTotal)}`}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={cart.length === 0 || checkoutMutation.isPending}
              onClick={() => {
                dispatch({ type: "CLEAR" });
                setDiscountPct("0");
                setCashTendered("");
                toast.info("Cart cleared.");
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear Cart
            </Button>
          </div>
        </div>
      </div>

      {/* ── Success Dialog ── */}
      <Dialog
        open={successDialog.open}
        onOpenChange={(open) => setSuccessDialog((s) => ({ ...s, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4"
              >
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </motion.div>
              <DialogTitle className="text-2xl font-bold text-center">Sale Complete!</DialogTitle>
              <DialogDescription className="text-center text-base">
                Order processed successfully
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/40 p-4 space-y-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Order Number</p>
              <p className="text-3xl font-bold font-mono text-primary mt-1">
                #{successDialog.orderId}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Charged</p>
              <p className="text-xl font-bold mt-1">
                {successDialog.total != null ? fmt(successDialog.total) : "—"}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" />
              {new Date().toLocaleString("en-IN")}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrintReceipt}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setSuccessDialog({ open: false });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}