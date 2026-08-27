"use client";

import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, Header, TableHead, TableRow } from "@evaluna/ui/components/table";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, ArchiveIcon, CheckCircle2Icon, SearchIcon, TrendingUpIcon, UsersIcon, WarehouseIcon } from "lucide-react";
import Link from "next/link";

export default function InventoryLowStockPage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: lowStockItems, isLoading, error } = trpc.inventory.getLowStockItems.useQuery();

  if (isLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-[200px] items-center justify-center">Error loading low stock items</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Low Stock Alerts</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Items below minimum stock level requiring attention
          </p>
        </div
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Inventory Activities
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/inventory">
              <ArchiveIcon className="mr-1 h-3 w-3" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {!lowStockItems || lowStockItems.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No low stock items found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHeader className="text-left">Product</TableHeader>
                <TableHeader className="text-left">SKU</TableHeader>
                <TableHeader className="text-left">Category</TableHeader>
                <TableHeader className="text-left">Warehouse</TableHeader>
                <TableHeader className="text-left">Current Qty</TableHeader>
                <TableHeader className="text-left">Min Level</TableHeader>
                <TableHeader className="text-left">Days of Supply</TableHeader>
                <TableHeader className="text-left">Actions</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.warehouse}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.min_level}</TableCell>
                  <TableCell>{item.days_of_supply || "N/A"}</TableCell>
                  <TableCell className="flex flex-row gap-2">
                    <Button variant="outline" size="xs" onClick={() => alert(`View stock details ${item.id}`)}>
                      <SearchIcon className="mr-1 h-3 w-3" /> View
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => alert(`Adjust stock for ${item.name}`)}>
                      <ActivityIcon className="mr-1 h-3 w-3" /> Adjust
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => alert(`Reorder ${item.name}`)}>
                      <TrendingUpIcon className="mr-1 h-3 w-3" /> Reorder
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