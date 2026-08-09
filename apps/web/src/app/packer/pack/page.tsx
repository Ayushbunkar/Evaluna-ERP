"use client";

import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Badge } from "@evaluna/ui/components/badge";
import { Checkbox } from "@evaluna/ui/components/checkbox";
import { useTranslations } from "next-intl";
import { Package, CheckCircle, AlertCircle, Search, Barcode } from "lucide-react";

export default function PackItemsPage() {
  const t = useTranslations("nav");
  const [searchTerm, setSearchTerm] = useState("");
  const [scannedItem, setScannedItem] = useState("");
  const [packingInProgress, setPackingInProgress] = useState(false);

  // Fetch pending orders
  const { data: pendingOrders, isLoading } = useTRPC().packer.getPendingOrders.useQuery();

  // Mock data for demonstration
  const mockOrders = [
    {
      orderId: "ORD-001",
      customer: "Rural Mart",
      items: [
        { id: "ITEM-001", name: "Rice 5kg", barcode: "123456789", packed: false },
        { id: "ITEM-002", name: "Wheat Flour 10kg", barcode: "987654321", packed: false },
        { id: "ITEM-003", name: "Sugar 1kg", barcode: "456123789", packed: false },
      ],
      status: "pending",
    },
    {
      orderId: "ORD-002",
      customer: "Village Store",
      items: [
        { id: "ITEM-004", name: "Cooking Oil 1L", barcode: "789123456", packed: false },
        { id: "ITEM-005", name: "Tea Leaves 500g", barcode: "321654987", packed: false },
      ],
      status: "pending",
    },
  ];

  const ordersToDisplay = pendingOrders || mockOrders;

  const handleScan = (barcode: string) => {
    setScannedItem(barcode);
    // In a real app, this would verify the item and mark it as packed
    setTimeout(() => {
      setScannedItem("");
    }, 2000);
  };

  const handleStartPacking = () => {
    setPackingInProgress(true);
  };

  const handleCompletePacking = () => {
    setPackingInProgress(false);
    // In a real app, this would submit the packed order to the backend
  };

  const filteredOrders = ordersToDisplay.filter(order =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">{t("Pack Items")}</h1>
        <div className="flex gap-2">
          {!packingInProgress ? (
            <Button size="sm" onClick={handleStartPacking}>
              <Package className="mr-2 h-4 w-4" />
              Start Packing
            </Button>
          ) : (
            <Button size="sm" onClick={handleCompletePacking} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Packing
            </Button>
          )}
        </div>
      </div>

      {/* Barcode Scanner Section */}
      <Card>
        <CardHeader>
          <CardTitle>Barcode Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Scan or enter barcode..."
                value={scannedItem}
                onChange={(e) => setScannedItem(e.target.value)}
                className="text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleScan(scannedItem)}
              />
            </div>
            <Button
              onClick={() => handleScan(scannedItem)}
              disabled={!scannedItem}
              className="w-full sm:w-auto"
            >
              <Barcode className="mr-2 h-4 w-4" />
              Scan Item
            </Button>
          </div>

          {scannedItem && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-700">Item {scannedItem} scanned successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
          ) : filteredOrders.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="mx-auto h-8 w-8 mb-2" />
        <p>No pending orders found</p>
      </div>
          ) : (
      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <div key={order.orderId} className="border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div>
                <h3 className="font-semibold">{order.orderId}</h3>
                <p className="text-sm text-muted-foreground">{order.customer}</p>
              </div>
              <Badge variant={order.status === "pending" ? "secondary" : "default"}>
                {order.status}
              </Badge>
            </div>

            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={item.id}
                      checked={item.packed}
                      onCheckedChange={() => handleScan(item.barcode)}
                      disabled={!packingInProgress}
                    />
                    <label htmlFor={item.id} className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">Barcode: {item.barcode}</span>
                    </label>
                  </div>
                  {item.packed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
          )}
        </CardContent>
      </Card>

      {/* Packing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Packing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">1</span>
          </div>
          <div>
            <h4 className="font-medium">Scan Items</h4>
            <p className="text-sm text-muted-foreground">Use the barcode scanner to verify each item before packing</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">2</span>
          </div>
          <div>
            <h4 className="font-medium">Verify Order</h4>
            <p className="text-sm text-muted-foreground">Ensure all items match the order requirements</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">3</span>
          </div>
          <div>
            <h4 className="font-medium">Complete Packing</h4>
            <p className="text-sm text-muted-foreground">Click "Complete Packing" when all items are scanned and packed</p>
          </div>
        </div>
      </div>
        </CardContent>
      </Card>
    </div>
  );
}