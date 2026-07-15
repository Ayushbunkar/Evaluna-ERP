"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Badge } from "@evaluna/ui/components/badge";
import { ArrowLeft, Boxes, Scan, CheckCircle2, AlertCircle } from "lucide-react";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PutawaysPage() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [locationScan, setLocationScan] = useState("");

  const utils = trpc.useUtils();
  const { data: putaways, isLoading } = trpc.warehouse.getPutaways.useQuery();

  const completePutawayMutation = trpc.warehouse.completePutaway.useMutation({
    onSuccess: () => {
      toast.success("Item putaway completed!");
      setSelectedItemId(null);
      setLocationScan("");
      utils.warehouse.getPutaways.invalidate();
    },
    onError: () => {
      toast.error("Failed to complete putaway");
    }
  });

  const handleScanLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      toast.error("Please select an item first");
      return;
    }
    if (!locationScan.trim()) {
      toast.error("Please scan a valid location");
      return;
    }
    
    // In a real app, you would resolve the locationScan barcode to a location_id
    // Here we'll just mock it as location_id = 1 for the demo
    const locationId = parseInt(locationScan) || 1;
    
    completePutawayMutation.mutate({
      item_id: selectedItemId,
      location_id: locationId
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link href="/putter">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Boxes className="h-8 w-8 text-primary" />
            Active Putaways
          </h1>
          <p className="text-muted-foreground">Scan items and shelf locations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Column: Pending Items */}
        <Card className="flex flex-col h-full max-h-[70vh]">
          <CardHeader className="pb-3 border-b">
            <CardTitle>Pending Items</CardTitle>
            <CardDescription>Select an item to place</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : putaways?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2 opacity-50" />
                <p>No pending putaways.</p>
              </div>
            ) : (
              <div className="divide-y">
                {putaways?.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${selectedItemId === item.id ? 'bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">Product ID: {item.product_id}</span>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        Pending
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Target Qty: <span className="font-bold text-foreground">{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Scan Action */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {selectedItemId ? (
              <motion.div
                key="scan-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <Card className="h-full border-primary/50 shadow-md">
                  <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="text-xl">Place Item</CardTitle>
                    <CardDescription>
                      You are placing Product ID {putaways?.find(p => p.id === selectedItemId)?.product_id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8 mt-4">
                    <div className="bg-muted rounded-lg p-6 flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-background rounded-full shadow-sm">
                        <Scan className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Scan Shelf Barcode</h3>
                        <p className="text-sm text-muted-foreground">
                          Scan the location label where you placed the goods.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleScanLocation} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location Barcode</Label>
                        <div className="flex gap-2">
                          <Input
                            id="location"
                            autoFocus
                            placeholder="e.g. A-12-3"
                            value={locationScan}
                            onChange={(e) => setLocationScan(e.target.value)}
                            className="text-lg h-14"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full h-14 text-lg"
                        disabled={completePutawayMutation.isPending || !locationScan}
                      >
                        {completePutawayMutation.isPending ? "Confirming..." : "Confirm Placement"}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => setSelectedItemId(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <Card className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground border-dashed">
                  <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No Item Selected</h3>
                  <p>Select an item from the pending list to scan its shelf location.</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
