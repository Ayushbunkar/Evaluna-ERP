"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Input } from "@evaluna/ui/components/input";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AuditVerificationsPage() {
  // Mock TRPC hook
  const { data: items, isLoading } = trpc.audits?.getItems?.useQuery(
    { auditId: "A-101" },
    { enabled: false }
  ) ?? { data: null, isLoading: false };

  // Initial mock data
  const mockItems = [
    { id: "item-1", sku: "SKU-1001", name: "Premium Widget", expectedQty: 50, countedQty: null },
    { id: "item-2", sku: "SKU-1002", name: "Standard Gizmo", expectedQty: 120, countedQty: null },
    { id: "item-3", sku: "SKU-1003", name: "Eco-friendly Bottle", expectedQty: 75, countedQty: null },
  ];

  const displayItems = items || mockItems;
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleCountChange = (id: string, value: string) => {
    setCounts((prev) => ({ ...prev, [id]: value }));
  };

  const handleLogDiscrepancy = (id: string, expected: number) => {
    const countedStr = counts[id];
    if (countedStr === undefined || countedStr === "") {
      toast.error("Please enter a counted quantity");
      return;
    }
    
    const counted = Number(countedStr);
    if (isNaN(counted)) {
      toast.error("Invalid quantity");
      return;
    }

    if (counted === expected) {
      toast.info("Quantities match, logging as success instead.");
    } else {
      toast.success(`Discrepancy logged: Expected ${expected}, Found ${counted}`);
    }
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitting(false);
    toast.success("Audit verification completed successfully");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Audit Execution</h1>
          <p className="text-muted-foreground mt-2">
            Audit ID: <span className="font-medium text-foreground">A-101</span> - Main Warehouse
          </p>
        </div>
        <Button onClick={handleSubmitAll} disabled={submitting}>
          {submitting ? "Saving..." : (
            <>
              <Save className="mr-2 h-4 w-4" /> Finish Audit
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Count Products</CardTitle>
          <CardDescription>
            Enter the physically counted quantity for each item below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-center">Expected Qty</TableHead>
                    <TableHead className="w-48">Counted Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.map((item, i) => {
                    const countedStr = counts[item.id] ?? "";
                    const hasInput = countedStr !== "";
                    const countedQty = Number(countedStr);
                    const isMatch = hasInput && !isNaN(countedQty) && countedQty === item.expectedQty;
                    const isDiscrepancy = hasInput && !isNaN(countedQty) && countedQty !== item.expectedQty;

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <TableCell className="font-medium">{item.sku}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono text-sm">
                            {item.expectedQty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Enter count"
                            value={countedStr}
                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                            className={isDiscrepancy ? "border-amber-500 focus-visible:ring-amber-500" : isMatch ? "border-green-500 focus-visible:ring-green-500" : ""}
                          />
                        </TableCell>
                        <TableCell>
                          {isMatch && (
                            <span className="flex items-center text-green-600 text-sm font-medium">
                              <CheckCircle2 className="mr-1 h-4 w-4" /> Match
                            </span>
                          )}
                          {isDiscrepancy && (
                            <span className="flex items-center text-amber-600 text-sm font-medium">
                              <AlertCircle className="mr-1 h-4 w-4" /> Discrepancy
                            </span>
                          )}
                          {!hasInput && (
                            <span className="text-muted-foreground text-sm">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant={isDiscrepancy ? "default" : "outline"}
                            size="sm"
                            className={isDiscrepancy ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                            onClick={() => handleLogDiscrepancy(item.id, item.expectedQty)}
                            disabled={!hasInput}
                          >
                            Log Result
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                  {displayItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No items found for this audit.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
