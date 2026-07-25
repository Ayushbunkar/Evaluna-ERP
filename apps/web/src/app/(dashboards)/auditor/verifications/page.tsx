"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@evaluna/ui/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Badge } from "@evaluna/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import { Save, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import { PageTransition, AnimatedCard } from "@/lib/animations";

// Mock data for stockAuditItems
const initialItems = [
  {
    id: "item-1",
    sku: "SKU-001-A",
    productName: "Premium Wireless Headphones",
    category: "Electronics",
    expectedQty: 45,
    countedQty: "",
    status: "Pending",
  },
  {
    id: "item-2",
    sku: "SKU-002-B",
    productName: "Ergonomic Office Chair",
    category: "Furniture",
    expectedQty: 12,
    countedQty: "12",
    status: "Matched",
  },
  {
    id: "item-3",
    sku: "SKU-003-C",
    productName: "Mechanical Keyboard",
    category: "Electronics",
    expectedQty: 30,
    countedQty: "28",
    status: "Discrepancy",
  },
  {
    id: "item-4",
    sku: "SKU-004-D",
    productName: "USB-C Hub Multiport",
    category: "Accessories",
    expectedQty: 150,
    countedQty: "",
    status: "Pending",
  },
  {
    id: "item-5",
    sku: "SKU-005-E",
    productName: "27-inch 4K Monitor",
    category: "Electronics",
    expectedQty: 25,
    countedQty: "",
    status: "Pending",
  },
];

export default function VerificationsPage() {
  const [items, setItems] = useState(initialItems);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCountChange = (id: string, value: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const newStatus =
            value === ""
              ? "Pending"
              : parseInt(value) === item.expectedQty
              ? "Matched"
              : "Discrepancy";
          return { ...item, countedQty: value, status: newStatus };
        }
        return item;
      })
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === "Matched") return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (status === "Discrepancy") return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <span className="h-2 w-2 rounded-full bg-slate-300 inline-block m-1" />;
  };

  const progress = Math.round(
    (items.filter((i) => i.status !== "Pending").length / items.length) * 100
  );

  return (
    <PageTransition>
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Active Audit Verification</h2>
            <p className="text-muted-foreground mt-1">
              Currently auditing: <span className="font-medium text-foreground">Downtown HQ (AUD-2023-001)</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Save Progress</Button>
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Complete Verification
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <AnimatedCard className="md:col-span-1 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Audit Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="text-4xl font-bold text-primary">{progress}%</div>
                <p className="text-sm text-muted-foreground mt-2">Completed</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-4">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Counted</span>
                  <span className="font-medium">{items.filter((i) => i.status !== "Pending").length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Matched</span>
                  <span className="text-emerald-500 font-medium">
                    {items.filter((i) => i.status === "Matched").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discrepancies</span>
                  <span className="text-red-500 font-medium">
                    {items.filter((i) => i.status === "Discrepancy").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard className="md:col-span-3 bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Count Items</CardTitle>
                  <CardDescription>Enter actual quantities found during the audit.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search SKU or Product..."
                      className="w-[250px] pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[120px]">SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">System Qty</TableHead>
                      <TableHead className="text-right w-[150px]">Counted Qty</TableHead>
                      <TableHead className="text-center w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items
                      .filter(
                        (i) =>
                          i.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.sku.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((item) => (
                        <TableRow key={item.id} className="hover:bg-accent/50 transition-colors">
                          <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-normal">
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.expectedQty}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              className={`h-8 text-right w-full ${
                                item.status === "Discrepancy"
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : item.status === "Matched"
                                  ? "border-emerald-500 focus-visible:ring-emerald-500"
                                  : ""
                              }`}
                              placeholder="-"
                              value={item.countedQty}
                              onChange={(e) => handleCountChange(item.id, e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">{getStatusIcon(item.status)}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </AnimatedCard>
        </div>
      </div>
    </PageTransition>
  );
}
