"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { format, parseISO } from "date-fns";
import { Printer, Eye, Search } from "lucide-react";
import { Input } from "@evaluna/ui/components/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@evaluna/ui/components/dialog";
import { motion } from "framer-motion";

export default function BillingHistory() {
  const [search, setSearch] = useState("");
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  
  const { data: bills, isLoading } = trpc.biller.getBills.useQuery();

  const handlePrint = (bill: any) => {
    // Standard browser printing for receipt
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt ${bill.id}</title>
            <style>
              body { font-family: monospace; padding: 20px; width: 300px; margin: auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .line-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
              @media print {
                @page { margin: 0; }
                body { margin: 1cm; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>EVALUNA ERP</h2>
              <p>Store: Main Branch</p>
              <p>Receipt: ${bill.id}</p>
              <p>Date: ${format(parseISO(bill.date), 'PP p')}</p>
            </div>
            <div class="items">
              ${bill.items.map((item: any) => `
                <div class="line-item">
                  <span>${item.name} x${item.qty}</span>
                  <span>$${(item.price * item.qty).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="line-item total">
              <span>TOTAL</span>
              <span>$${bill.total.toFixed(2)}</span>
            </div>
            <p style="text-align: center; margin-top: 20px;">Thank you!</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Mock bills if trpc doesn't return
  const displayBills = bills || [
    { id: "INV-1004", date: new Date().toISOString(), total: 150.50, status: "completed", items: [{name: "Item A", qty: 2, price: 50}, {name: "Item B", qty: 1, price: 50.50}] },
    { id: "INV-1003", date: new Date(Date.now() - 3600000).toISOString(), total: 45.00, status: "completed", items: [{name: "Item C", qty: 1, price: 45}] },
    { id: "INV-1002", date: new Date(Date.now() - 7200000).toISOString(), total: 20.00, status: "cancelled", items: [{name: "Item D", qty: 1, price: 20}] },
  ];

  const filteredBills = displayBills.filter((b: any) => b.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Billing History</h1>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Bill ID..." 
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill: any, index: number) => (
                  <motion.tr 
                    key={bill.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TableCell className="font-medium">{bill.id}</TableCell>
                    <TableCell>{format(parseISO(bill.date), 'PP p')}</TableCell>
                    <TableCell>
                      <Badge variant={bill.status === "completed" ? "default" : bill.status === "cancelled" ? "destructive" : "secondary"}
                        className={bill.status === "completed" ? "bg-green-500 hover:bg-green-600" : bill.status === "cancelled" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500"}
                      >
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">${bill.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedBill(bill)}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handlePrint(bill)}>
                          <Printer className="w-4 h-4 mr-2" /> Print
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bill Details - {selectedBill?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground border-b pb-2">
              <span>Date: {selectedBill && format(parseISO(selectedBill.date), 'PP p')}</span>
              <Badge variant="outline">{selectedBill?.status}</Badge>
            </div>
            <div className="space-y-2">
              {selectedBill?.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.name} (x{item.qty})</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold border-t pt-2 text-lg">
              <span>Total</span>
              <span>${selectedBill?.total.toFixed(2)}</span>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => handlePrint(selectedBill)}>
                <Printer className="w-4 h-4 mr-2" /> Print Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
