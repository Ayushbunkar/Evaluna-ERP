"use client";

import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, Header, TableHead, TableRow } from "@evaluna/ui/components/table";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, MapPinIcon, TruckIcon, UserIcon, WarningIcon } from "lucide-react";
import Link from "next/link";

export default function DriverRoutePage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: routeStops, isLoading, error } = trpc.driver.getRouteStops.useQuery();

  if (isLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-[200px] items-center justify-center">Error loading route stops</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Driver Route</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Current route and delivery stops
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Driver Activities
          </Button>
        </div>
      </div>

      {!routeStops || routeStops.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No route stops found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHeader className="text-left">Stop #</TableHeader>
                <TableHeader className="text-left">Customer</TableHeader>
                <TableHeader className="text-left">Address</TableHeader>
                <TableHeader className="text-left">Order</TableHeader>
                <TableHeader className="text-left">Status</TableHeader>
                <TableHeader className="text-left">Actions</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routeStops.map((stop, index) => (
                <TableRow key={`${stop.id}-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{stop.customerName}</TableCell>
                  <TableCell>{stop.address}</TableCell>
                  <TableCell>{stop.orderId}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${stop.status === "completed" ? "bg-green-100 text-green-800" : stop.status === "next" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {stop.status === "completed" ? "Delivered" : stop.status === "next" ? "Next Stop" : "Pending"}
                    </span>
                  </TableCell>
                  <TableCell className="flex flex-row gap-2">
                    {stop.status === "pending" && (
                      <Button variant="outline" size="xs" onClick={() => alert(`Start delivery ${stop.id}`)}>
                        <MapPinIcon className="mr-1 h-3 w-3" /> Start
                      </Button>
                    )}
                    {stop.status === "started" && (
                      <>
                        <Button variant="outline" size="xs" onClick={() => alert(`Complete delivery ${stop.id}`)}>
                          <CheckCircle2Icon className="mr-1 h-3 w-3" /> Complete
                        </Button>
                        {stop.codRequired && (
                          <Button variant="outline" size="xs" onClick={() => alert(`Collect COD for stop ${stop.id}`)}>
                            <WarningIcon className="mr-1 h-3 w-3" /> Collect COD
                          </Button>
                        )}
                      </>
                    )}
                    {stop.status === "completed" && (
                      <Button variant="outline" size="xs" onClick={() => alert(`View proof of delivery ${stop.id}`)}>
                        <ActivityIcon className="mr-1 h-3 w-3" /> View PoD
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageTransition>
  );
}