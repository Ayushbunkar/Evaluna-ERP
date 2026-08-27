"use client";

import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, Header, TableHead, TableRow } from "@evaluna/ui/components/table";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, CheckCircle2Icon, SearchIcon, ShippingIcon } from "lucide-react";
import Link from "next/link";

export default function PickerActivePage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: activePicks, isLoading, error } = trpc.picker.getActivePicks.useQuery();

  if (isLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-[200px] items-center justify-center">Error loading active picks</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Active Picks</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            List of picks currently in progress
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Picking Activities
          </Button>
        </div>
      </div>

      {!activePicks || activePicks.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No active picks found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHeader className="text-left">Order</TableHeader>
                <TableHeader className="text-left">Product</TableHeader>
                <TableHeader className="text-left">Quantity</TableHeader>
                <TableHeader className="text-left">Location</TableHeader>
                <TableHeader className="text-left">Status</TableHeader>
                <TableHeader className="text-left">Actions</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activePicks.map((pick) => (
                <TableRow key={pick.id}>
                  <TableCell>{pick.orderId}</TableCell>
                  <TableCell>{pick.productName}</TableCell>
                  <TableCell>{pick.quantity}</TableCell>
                  <TableCell>{pick.location}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800`}>
                      {pick.status}
                    </span>
                  </TableCell>
                  <TableCell className="flex flex-row gap-2">
                    {pick.status === "scanned" && (
                      <>
                        <Button variant="outline" size="xs" onClick={() => alert(`Verify pick ${pick.id}`)}>
                          <CheckCircle2Icon className="mr-1 h-3 w-3" /> Verify
                        </Button>
                        <Button variant="default" size="xs" onClick={() => alert(`Complete pick ${pick.id}`)}>
                          Complete
                        </Button>
                      </>
                    )}
                    {pick.status === "verified" && (
                      <Button variant="default" size="xs" onClick={() => alert(`Complete pick ${pick.id}`)}>
                        Complete
                      </>
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