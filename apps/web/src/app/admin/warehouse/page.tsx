"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PlusIcon, MapPinIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function WarehouseDashboard() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", location_type: "storage", capacity: 0 });

  const utils = trpc.useUtils();
  const { data: locations, isLoading } = trpc.warehouse.listLocations.useQuery({ search });
  const createLocation = trpc.warehouse.createLocation.useMutation({
    onSuccess: () => {
      toast.success("Location created successfully");
      setIsCreateOpen(false);
      utils.warehouse.listLocations.invalidate();
      setNewLocation({ name: "", location_type: "storage", capacity: 0 });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleCreate = () => {
    if (!newLocation.name) return toast.error("Name is required");
    createLocation.mutate({
      warehouse_id: 1, // Defaulting to main warehouse
      name: newLocation.name,
      location_type: newLocation.location_type,
      capacity: Number(newLocation.capacity)
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 p-8 rounded-2xl shadow-2xl text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <MapPinIcon className="h-10 w-10 text-blue-300" />
            Warehouse Locations
          </h1>
          <p className="text-blue-200 mt-2 text-lg font-medium">
            Manage your physical storage bins and quarantine zones.
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          <Link href="/admin/warehouse/scanner">
            <Button variant="secondary" className="font-semibold shadow-lg hover:scale-105 transition-transform">
              Open Scanner
            </Button>
          </Link>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-400 text-white font-semibold shadow-lg hover:scale-105 transition-transform border-0">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Location
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Location Name / Code</Label>
                  <Input
                    id="name"
                    placeholder="e.g. A-01-B"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Location Type</Label>
                  <Select
                    value={newLocation.location_type}
                    onValueChange={(val) => setNewLocation({ ...newLocation, location_type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="storage">Standard Storage</SelectItem>
                      <SelectItem value="picking">Picking Bin</SelectItem>
                      <SelectItem value="quarantine">Quarantine / Damage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity (Units)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={newLocation.capacity}
                    onChange={(e) => setNewLocation({ ...newLocation, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={createLocation.isPending}>
                  {createLocation.isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  Save Location
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md shadow-sm border-gray-200"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {locations?.map((loc) => (
            <Card key={loc.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500 group">
              <CardHeader className="bg-gray-50/50 pb-4">
                <CardTitle className="flex justify-between items-center text-xl">
                  {loc.name}
                  <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider
                    ${loc.location_type === 'storage' ? 'bg-green-100 text-green-700' : 
                      loc.location_type === 'quarantine' ? 'bg-red-100 text-red-700' : 
                      'bg-blue-100 text-blue-700'}`}>
                    {loc.location_type}
                  </span>
                </CardTitle>
                <CardDescription>
                  Barcode ID: {loc.barcode || "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">Capacity</span>
                    <span className="font-bold text-gray-900">{loc.capacity > 0 ? loc.capacity : "Unlimited"}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">Current Stock</span>
                    <span className="font-bold text-gray-900">--</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="w-full">
                    Print Barcode
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {locations?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <MapPinIcon className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No locations found</p>
              <p className="text-sm">Try adjusting your search or create a new location.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
