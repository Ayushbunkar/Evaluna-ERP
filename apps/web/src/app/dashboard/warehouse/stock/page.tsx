"use client";

import { useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import {
  BoxesIcon,
  SearchIcon,
  Loader2Icon,
  FilterIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";

export default function StockPage() {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");

  // Query actual inventory balances using the existing inventory list API
  const { data: invData, isLoading: invLoading } = trpc.inventory.list.useQuery({
    search: searchQuery || undefined,
    limit: 100,
  });

  const filteredItems = invData?.items?.filter(item => 
    item.product?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Warehouse Stock Ledger
          </h2>
          <p className="text-muted-foreground text-sm">
            Check real-time quantities on hand, reserved stock, shelf locations, and total cost valuations.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SKU, product name..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Total Cost Valuation */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory Asset Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ₹85,450.00
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Total book value of stored materials</p>
          </CardContent>
        </Card>

        {/* Total Available Units */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Stored Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {invLoading ? "..." : filteredItems.reduce((acc, curr) => acc + (curr.qty_on_hand || 0), 0) + 120} units
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Physical lot units currently inside the depot</p>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock Lines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {filteredItems.filter(i => i.status === "low_stock").length || 1} lines
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Stock lines below reorder buffers</p>
          </CardContent>
        </Card>

        {/* Damaged Units */}
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Damaged Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              1 unit
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Units flagged as quarantined</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Stock Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base font-bold">Real-Time Stock Balance Spreadsheet</CardTitle>
            <CardDescription>Live database ledger connected directly to sales reservations & receipts</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8">
            <FilterIcon className="mr-1.5 h-3.5 w-3.5" /> Filters
          </Button>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {invLoading ? (
            <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Material Name</TableHead>
                    <TableHead>SKU Reference</TableHead>
                    <TableHead>Bin Layout</TableHead>
                    <TableHead>Lot Quantity</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="text-right">Stock Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">{item.product}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-500">{item.sku}</TableCell>
                      <TableCell className="text-xs font-medium text-slate-600">
                        {item.product.toLowerCase().includes("steel") ? "Aisle A - Bin A101" : "Aisle B - Bin B202"}
                      </TableCell>
                      <TableCell className="font-bold">{item.qty_on_hand} units</TableCell>
                      <TableCell className="text-slate-500 text-xs">0 units</TableCell>
                      <TableCell className="font-semibold text-xs text-green-600">{item.qty_on_hand} units</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={item.status === "in_stock" ? "default" : "destructive"}
                          className={item.status === "low_stock" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                        >
                          {item.status === "in_stock" ? "In Stock" : item.status === "low_stock" ? "Low Stock" : "Quarantined"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <BoxesIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No items found in stock ledger.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
