"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { useState } from "react";
import { AddCustomerDialog } from "./add-customer-dialog";
import { InventorySearchDialog } from "./inventory-search-dialog";
import { CheckoutDialog } from "./checkout-dialog";
import { formatCurrency } from "@/lib/utils";

export default function BillerPOSPage() {
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null);
  const [cart, setCart] = useState<
    Array<{
      id: number;
      name: string;
      price: number;
      cartQuantity: number;
    }>
  >([]);

  const handleCustomerSelected = (id: number, name: string) => {
    setCustomer({ id, name });
    setShowCustomerDialog(false);
  };

  const handleAddToCart = (items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>) => {
    setCart((prev) => {
      const newCart = [...prev];
      items.forEach((item) => {
        const existingItem = newCart.find((i) => i.id === item.id);
        if (existingItem) {
          existingItem.cartQuantity += item.quantity;
        } else {
          newCart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            cartQuantity: item.quantity,
          });
        }
      });
      return newCart;
    });
    setShowInventoryDialog(false);
  };

  const handleRemoveFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleQuantityChange = (id: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cartQuantity: quantity } : item))
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Type-safe input change handler
  };

  const subtotal = cart.reduce((total, item) => total + item.price * item.cartQuantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleSaleComplete = () => {
    setCart([]);
    setCustomer(null);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Billing & POS</h1>
          <p className="text-muted-foreground">Point of Sale System</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customer ? (
                <div className="p-4 border rounded-lg">
                  <div className="font-medium">{customer.name}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setCustomer(null)}
                  >
                    Change Customer
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => setShowCustomerDialog(true)}
                >
                  Select Customer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cart Section */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Cart ({cart.length} items)</CardTitle>
            <div className="text-lg font-bold">
              {formatCurrency(total, "en")}
            </div>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Your cart is empty</p>
                <p className="text-sm mt-2">Add items to start a sale</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(item.price, "en")} × {item.cartQuantity}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={item.cartQuantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="space-y-2 p-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal, "en")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>{formatCurrency(tax, "en")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(total, "en")}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={() => setShowCheckoutDialog(true)}
                  disabled={!customer}
                >
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setShowInventoryDialog(true)}
        >
          Add Items
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCart([]);
            setCustomer(null);
          }}
        >
          Clear Cart
        </Button>
      </div>

      {/* Dialogs */}
      <AddCustomerDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        onCustomerSelected={handleCustomerSelected}
      />

      <InventorySearchDialog
        open={showInventoryDialog}
        onOpenChange={setShowInventoryDialog}
        onConfirm={handleAddToCart}
      />

      <CheckoutDialog
        open={showCheckoutDialog}
        onOpenChange={setShowCheckoutDialog}
        cart={cart}
        customerId={customer?.id || null}
        onSuccess={handleSaleComplete}
      />
    </div>
  );
}