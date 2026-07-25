"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { PackageSearch, Boxes, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { KpiCard } from "@/components/shared/cards/kpi-card";
import Link from "next/link";
import { Skeleton } from "@evaluna/ui/components/skeleton";

export default function PutterDashboard() {
  const { data: putLists, isLoading } = trpc.warehouse.getPutLists.useQuery({});
  
  const pendingCount = putLists?.filter(p => p.status === 'pending').length || 0;
  const completedCount = putLists?.filter(p => p.status === 'completed').length || 0;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Putter Dashboard</h1>
          <p className="text-muted-foreground">Manage GRN receiving, putaways, and bin locations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Pending Putaways" 
          value={isLoading ? <Skeleton className="h-8 w-20" /> : pendingCount} 
          icon={PackageSearch} 
          description="Items waiting to be placed" 
        />
        <KpiCard 
          title="Completed Today" 
          value={isLoading ? <Skeleton className="h-8 w-20" /> : completedCount} 
          icon={ShieldCheck} 
          description="Putaways completed today" 
        />
        <KpiCard 
          title="Locations" 
          value="1,240" 
          icon={Boxes} 
          description="Total active bin locations" 
        />
        <KpiCard 
          title="Stock Moves" 
          value="18" 
          icon={ArrowRightLeft} 
          description="Items moved today" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-primary" />
              GRN Receiving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Receive goods against purchase orders or transfer notes and generate barcodes.
            </p>
            <Link href="/putter/receiving">
              <Button className="w-full h-12 text-lg">Receive Goods</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              Pending Putaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Scan items and shelf locations to place received stock into bins.
            </p>
            <Link href="/putter/putaways">
              <Button className="w-full h-12 text-lg" variant="secondary">Start Putaway</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Location Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Move stock between bins, update capacities, and audit locations.
            </p>
            <Link href="/putter/locations">
              <Button className="w-full h-12 text-lg" variant="outline">Manage Bins</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}