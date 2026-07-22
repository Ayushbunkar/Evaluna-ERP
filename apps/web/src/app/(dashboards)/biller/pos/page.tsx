"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@evaluna/ui/components/input";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { ScrollArea } from "@evaluna/ui/components/scroll-area";
import { 
  SearchIcon, 
  ShoppingCartIcon, 
  PlusIcon, 
  MinusIcon, 
  Trash2Icon, 
  CreditCardIcon, 
  BanknoteIcon,
  TagIcon,
  UserIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";

type Product = {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  category: string | null;
  stock_quantity: number | null;
  image_url: string | null;
};

type CartItem = Product & { cartQuantity: number };

export default function POSCatalogPage() {
  const trpc = useTRPC();
  const tc = useTranslations("common");
  const locale = useLocale();

  // In a real scenario, this trpc.pos.catalog might return the products.
  // We map it to our Product type.
  const { data: rawData = [], isLoading, error } = trpc.pos.catalog.useQuery();
  const products = rawData as unknown as Product[];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Derived state
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0);
  }, [cart]);

  const tax = cartTotal * 0.10; // 10% tax example
  const grandTotal = cartTotal + tax;

  // Actions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.cartQuantity + delta);
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = (method: string) => {
    if (cart.length === 0) return;
    toast.success(`Payment successful via ${method}`);
    clearCart();
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] gap-6 animate-pulse">
        <div className="flex-1 flex flex-col gap-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="flex gap-2"><Skeleton className="h-8 w-24 rounded-full" /><Skeleton className="h-8 w-24 rounded-full" /></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        </div>
        <div className="w-[350px] lg:w-[400px]"><Skeleton className="h-full w-full rounded-2xl" /></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 font-medium">Failed to load catalog: {error.message}</div>;
  }

  return (
    <PageTransition>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-7rem)] gap-6 overflow-hidden">
        
        {/* Left Side: Catalog */}
        <div className="flex-1 flex flex-col h-full overflow-hidden gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products by name or SKU..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-11 rounded-xl bg-background shadow-sm border-border/50"
              />
            </div>
            <Button variant="outline" className="h-11 rounded-xl gap-2 shadow-sm bg-background border-border/50">
              <UserIcon className="h-4 w-4" /> Add Customer
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar shrink-0">
            <Badge 
              variant={selectedCategory === null ? "default" : "outline"} 
              className="px-4 py-1.5 cursor-pointer rounded-full text-sm font-medium whitespace-nowrap transition-all"
              onClick={() => setSelectedCategory(null)}
            >
              All Items
            </Badge>
            {categories.map(cat => (
              <Badge 
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"} 
                className="px-4 py-1.5 cursor-pointer rounded-full text-sm font-medium whitespace-nowrap transition-all"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <TagIcon className="h-12 w-12 mb-4 opacity-20" />
                  <p>No products found matching your search.</p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <motion.div 
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)}
                  >
                    <Card className="cursor-pointer h-full border-border/40 hover:border-primary/30 hover:shadow-md transition-all rounded-2xl overflow-hidden group bg-background/50 backdrop-blur-sm">
                      <div className="aspect-square bg-muted/30 relative flex items-center justify-center p-6 group-hover:bg-primary/5 transition-colors">
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.name} fill className="object-contain p-4" />
                        ) : (
                          <PackageIcon className="h-16 w-16 text-muted-foreground/30" />
                        )}
                        {product.stock_quantity !== null && product.stock_quantity < 5 && (
                          <span className="absolute top-2 right-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {product.stock_quantity} left
                          </span>
                        )}
                      </div>
                      <CardContent className="p-4 pt-3 space-y-1">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                        <div className="pt-2 font-bold text-base text-primary">
                          {formatCurrency(product.price, locale)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Cart */}
        <Card className="w-full lg:w-[400px] flex flex-col h-full shrink-0 border-border/50 shadow-lg rounded-2xl overflow-hidden bg-background/80 backdrop-blur-xl">
          <CardHeader className="border-b border-border/40 bg-muted/20 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCartIcon className="h-5 w-5 text-primary" />
                Current Order
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs">
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          
          <ScrollArea className="flex-1 px-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground opacity-60">
                <ShoppingCartIcon className="h-16 w-16 mb-4 stroke-1" />
                <p>Cart is empty</p>
                <p className="text-sm">Click items to add them</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.price, locale)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-background rounded-lg border border-border/50 p-0.5 shadow-sm">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive" onClick={() => updateQuantity(item.id, -1)}>
                        <MinusIcon className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-semibold w-5 text-center">{item.cartQuantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary" onClick={() => updateQuantity(item.id, 1)}>
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="font-semibold text-sm w-16 text-right">
                      {formatCurrency(item.price * item.cartQuantity, locale)}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeFromCart(item.id)}>
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <CardFooter className="flex-col gap-4 border-t border-border/40 bg-muted/20 p-5 shrink-0">
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal, locale)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (10%)</span>
                <span>{formatCurrency(tax, locale)}</span>
              </div>
              <div className="border-t border-border/50 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(grandTotal, locale)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
              <Button size="lg" className="rounded-xl h-14 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20 shadow-lg" onClick={() => handleCheckout("Cash")} disabled={cart.length === 0}>
                <BanknoteIcon className="mr-2 h-5 w-5" /> Cash
              </Button>
              <Button size="lg" className="rounded-xl h-14 shadow-primary/20 shadow-lg" onClick={() => handleCheckout("Card")} disabled={cart.length === 0}>
                <CreditCardIcon className="mr-2 h-5 w-5" /> Card
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  );
}
