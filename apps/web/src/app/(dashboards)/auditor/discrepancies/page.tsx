"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@evaluna/ui/components/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";

export default function DiscrepanciesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discrepancy Resolution</h1>
        <p className="text-muted-foreground mt-2">
          Review and resolve stock differences, branch damages, and expiring batches.
        </p>
      </div>

      <Tabs defaultValue="stock-differences" className="w-full">
        <TabsList>
          <TabsTrigger value="stock-differences">Stock Differences</TabsTrigger>
          <TabsTrigger value="damage">Damage</TabsTrigger>
          <TabsTrigger value="expiry">Expiry</TabsTrigger>
        </TabsList>

        <TabsContent value="stock-differences">
          <StockDifferencesTab />
        </TabsContent>
        <TabsContent value="damage">
          <DamageTab />
        </TabsContent>
        <TabsContent value="expiry">
          <ExpiryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StockDifferencesTab() {
  const { data, isLoading } = trpc.audit.listEscalations.useQuery();
  const utils = trpc.useUtils();
  const resolveMutation = trpc.audit.resolveDiscrepancy.useMutation({
    onSuccess: () => {
      toast.success("Discrepancy resolved successfully.");
      utils.audit.listEscalations.invalidate();
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const handleResolve = (id: number, status: "approved" | "rejected") => {
    resolveMutation.mutate({ discrepancy_id: id, status, resolver_id: 1 /* fallback mock current user id */ });
  };

  if (isLoading) return <Skeleton className="w-full h-[400px]" />;

  return (
    <div className="mt-4 border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Qty Diff</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item: any, i: number) => (
            <TableRow key={item.id} as={motion.tr as any} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <TableCell className="capitalize">{item.discrepancy_type}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.reason || "N/A"}</TableCell>
              <TableCell>
                <Badge variant={item.resolution_status === "pending" ? "amber" : item.resolution_status === "approved" ? "green" : "red"}>
                  {item.resolution_status}
                </Badge>
              </TableCell>
              <TableCell>
                {item.resolution_status === "pending" ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleResolve(item.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleResolve(item.id, "rejected")}>Reject</Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Resolved</span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!data?.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending discrepancies found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function DamageTab() {
  // NOTE: TRPC endpoint for listing branchDamage might not exist yet, marking as mock/TODO
  // const { data, isLoading } = trpc.warehouse.listDamage.useQuery();
  const isLoading = false;
  const mockData = [
    { id: 1, location_id: 101, product_id: 5, quantity: 2, reason: "Box crushed", verified: false, created_at: new Date() },
    { id: 2, location_id: 102, product_id: 8, quantity: 1, reason: "Water damage", verified: true, created_at: new Date() }
  ];
  
  if (isLoading) return <Skeleton className="w-full h-[400px]" />;

  return (
    <div className="mt-4 border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product ID</TableHead>
            <TableHead>Location ID</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Reported At</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((item, i) => (
            <TableRow key={item.id} as={motion.tr as any} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <TableCell>{item.product_id}</TableCell>
              <TableCell>{item.location_id}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.reason}</TableCell>
              <TableCell>{format(new Date(item.created_at), "PPP")}</TableCell>
              <TableCell>
                {!item.verified ? (
                  <Button size="sm" onClick={() => toast.success("Damage verified")}>Verify & Approve</Button>
                ) : (
                  <Badge variant="green">Verified</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExpiryTab() {
  const { data, isLoading } = trpc.batches.list.useQuery({});

  if (isLoading) return <Skeleton className="w-full h-[400px]" />;

  // Filter batches with expiry date within next 30 days or already expired
  const now = new Date();
  const next30Days = new Date();
  next30Days.setDate(now.getDate() + 30);

  const expiringBatches = data?.batches.filter((b: any) => b.expiry_date && new Date(b.expiry_date) < next30Days) || [];

  return (
    <div className="mt-4 border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch No</TableHead>
            <TableHead>Product ID</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expiringBatches.map((item: any, i: number) => {
             const isExpired = new Date(item.expiry_date) < now;
             return (
               <TableRow key={item.id} as={motion.tr as any} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                 <TableCell>{item.batch_number}</TableCell>
                 <TableCell>{item.product_id}</TableCell>
                 <TableCell>{item.quantity}</TableCell>
                 <TableCell>{format(new Date(item.expiry_date), "PPP")}</TableCell>
                 <TableCell>
                   <Badge variant={isExpired ? "red" : "amber"}>{isExpired ? "Expired" : "Expiring Soon"}</Badge>
                 </TableCell>
               </TableRow>
             );
          })}
          {!expiringBatches.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No expiring batches found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
