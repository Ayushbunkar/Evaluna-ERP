"use client";

import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, Header, TableHead, TableRow } from "@evaluna/ui/components/table";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, CheckCircle2Icon, SearchIcon, ShippingIcon } from "lucide-react";
import Link from "next/link";

export default function PickerCompletedPage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: completedPicks, isLoading, error } = trpc.picker.getCompletedPicks.useQuery();

  if (isLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-[200px] items-center justify-center">Error loading completed picks</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Completed Picks</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            List of picks that have been completed
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Picking Activities
          </Button>
        </div>
      </div>

      {!completedPicks || completedPicks.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No completed picks found
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
              {completedPicks.map((pick) => (
                <TableRow key={pick.id}>
                  <TableCell>{pick.orderId}</TableCell>
                  <TableCell>{pick.productName}</TableCell>
                  <TableCell>{pick.quantity}</TableCell>
                  <TableCell>{pick.location}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800`}>
                      {pick.status}
                    </span>
                  </TableCell>
                  <TableCell className="flex flex-row gap-2">
                    {/* Completed picks may have no actions, or maybe a button to view details */}
                    <Button variant="outline" size="xs" onClick={() => alert(`View details of pick ${pick.id}`)}>
                      View Details
                    </Button>
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