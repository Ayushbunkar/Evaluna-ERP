"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { ArrowLeft, ArrowRightLeft, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";

export default function LocationsPage() {
  const { data: locations, isLoading: isLoadingLocations } = trpc.warehouse.listLocations.useQuery({});
  
  const [sourceLocation, setSourceLocation] = useState("");
  const [destLocation, setDestLocation] = useState("");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const moveStockMutation = trpc.warehouse.moveStock.useMutation({
    onSuccess: () => {
      toast.success("Stock moved successfully!");
      setSourceLocation("");
      setDestLocation("");
      setBatchId("");
      setQuantity("1");
    },
    onError: (err) => {
      toast.error(`Failed to move stock: ${err.message}`);
    }
  });

  const handleMove = () => {
    if (!sourceLocation || !destLocation || !batchId) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    if (sourceLocation === destLocation) {
      toast.error("Source and destination must be different.");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Invalid quantity.");
      return;
    }

    moveStockMutation.mutate({
      source_location_id: parseInt(sourceLocation, 10),
      destination_location_id: parseInt(destLocation, 10),
      batch_id: parseInt(batchId, 10),
      quantity: qty
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/putter">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="h-8 w-8 text-primary" />
            Move Stock
          </h1>
          <p className="text-muted-foreground">Transfer stock between bin locations</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
          <CardDescription>Select source and destination bins, and the batch to move.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="source">Source Location</Label>
              {isLoadingLocations ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={sourceLocation} onValueChange={setSourceLocation}>
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source bin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map(loc => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        {loc.name} {loc.aisle ? `(Aisle: ${loc.aisle})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dest">Destination Location</Label>
              {isLoadingLocations ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={destLocation} onValueChange={setDestLocation}>
                  <SelectTrigger id="dest">
                    <SelectValue placeholder="Select destination bin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map(loc => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        {loc.name} {loc.aisle ? `(Aisle: ${loc.aisle})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label htmlFor="batch">Batch ID / Product Scan</Label>
              <div className="flex gap-2">
                <Input 
                  id="batch" 
                  placeholder="Scan or enter Batch ID..." 
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                />
                <Button size="icon" variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qty">Quantity to Move</Label>
              <Input 
                id="qty" 
                type="number" 
                min="1" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg" 
              onClick={handleMove}
              disabled={moveStockMutation.isPending || !sourceLocation || !destLocation || !batchId}
            >
              <ArrowRightLeft className="h-5 w-5 mr-2" />
              {moveStockMutation.isPending ? "Moving..." : "Execute Transfer"}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
