"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PutterLocationsPage() {
  const { data: locations, isLoading, error } = trpc.warehouse.listLocations.useQuery({});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Warehouse Locations</h1>
        <Button>Add Location</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse">Loading locations...</div>
      ) : error ? (
        <div className="text-red-500">Failed to load locations: {error.message}</div>
      ) : locations && locations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {locations.map((loc) => (
            <Card key={loc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{loc.name}</CardTitle>
                  <Badge variant="outline">
                    {loc.location_type || "Storage"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {loc.section && <span>Section: {loc.section} <br /></span>}
                  {loc.aisle && <span>Aisle: {loc.aisle} <br /></span>}
                  {loc.shelf && <span>Shelf: {loc.shelf} <br /></span>}
                  {loc.level && <span>Level: {loc.level}</span>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Capacity: {loc.capacity}
                  </span>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">Manage</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p>No locations defined yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
