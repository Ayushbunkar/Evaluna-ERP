"use client";

import { useState } from "react";
import { ScanBarcodeIcon, PackageCheckIcon, PackageMinusIcon, ArrowRightIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function WarehouseScanner() {
  const [activeTab, setActiveTab] = useState("put");
  const [locationBarcode, setLocationBarcode] = useState("");
  const [productBarcode, setProductBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isScanning, setIsScanning] = useState(false);

  // Mock endpoints since we need full scanning logic
  // In a real app, these would fetch product ID and location ID based on barcodes
  const addPutItem = trpc.warehouse.addPutItem.useMutation({
    onSuccess: () => {
      toast.success("Item successfully stored!");
      setProductBarcode("");
      setQuantity(1);
      // Keep location in case they are putting multiple things in the same place
      setIsScanning(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsScanning(false);
    }
  });

  const handleAction = async () => {
    if (!locationBarcode || !productBarcode || quantity <= 0) {
      toast.error("Please fill in all scanning fields");
      return;
    }
    
    setIsScanning(true);
    
    // Simulate lookup of barcodes to IDs and processing
    setTimeout(() => {
      if (activeTab === "put") {
        addPutItem.mutate({
          put_list_id: 1, // Mock
          product_id: 1, // Mock from barcode
          location_id: 1, // Mock from barcode
          quantity,
          put_by: 1, // Mock current user
        });
      } else {
        // Pick logic
        toast.success(`Successfully picked ${quantity} items from ${locationBarcode}`);
        setProductBarcode("");
        setQuantity(1);
        setIsScanning(false);
      }
    }, 1000);
  };

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen bg-gray-50 flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-4">
          <ScanBarcodeIcon className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Scanner</h1>
        <p className="text-gray-500 text-sm">Scan locations and products to process tasks</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-200/50 rounded-xl">
          <TabsTrigger value="put" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">
            <PackageCheckIcon className="h-4 w-4 mr-2" />
            Put Stock
          </TabsTrigger>
          <TabsTrigger value="pick" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-700">
            <PackageMinusIcon className="h-4 w-4 mr-2" />
            Pick Stock
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <Card className={`border-t-4 shadow-xl ${activeTab === 'put' ? 'border-t-blue-500' : 'border-t-orange-500'}`}>
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                {activeTab === "put" ? "Receiving & Placement" : "Order Fulfillment"}
              </CardTitle>
              <CardDescription>
                {activeTab === "put" 
                  ? "Scan the bin location first, then the product to place it."
                  : "Scan the pick list, then the location to retrieve from."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              <div className="space-y-2 relative group">
                <Label className="text-base font-semibold">Location Barcode</Label>
                <div className="relative">
                  <Input 
                    placeholder="Scan or enter location (e.g. A-01)" 
                    className="pl-10 h-12 text-lg uppercase focus-visible:ring-blue-500"
                    value={locationBarcode}
                    onChange={(e) => setLocationBarcode(e.target.value.toUpperCase())}
                    autoFocus
                  />
                  <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Product Barcode / SKU</Label>
                <div className="relative">
                  <Input 
                    placeholder="Scan product barcode" 
                    className="pl-10 h-12 text-lg focus-visible:ring-blue-500"
                    value={productBarcode}
                    onChange={(e) => setProductBarcode(e.target.value)}
                  />
                  <ScanBarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Quantity</Label>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl text-2xl active:bg-gray-200"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <Input 
                    type="number" 
                    className="h-12 text-center text-xl font-bold bg-gray-50 border-gray-300"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                    min="1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl text-2xl active:bg-gray-200"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

            </CardContent>
            <CardFooter className="bg-gray-50/50 pt-4 rounded-b-xl border-t">
              <Button 
                className={`w-full h-14 text-lg font-bold shadow-lg transition-transform active:scale-95 ${
                  activeTab === 'put' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
                onClick={handleAction}
                disabled={isScanning || !locationBarcode || !productBarcode}
              >
                {isScanning ? (
                  <Loader2Icon className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    CONFIRM {activeTab.toUpperCase()}
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Tabs>
      
      {/* Visual Feedback Toast area via Sonner */}
    </div>
  );
}
