"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@evaluna/ui/components/dialog";
import { Label } from "@evaluna/ui/components/label";
import { Input } from "@evaluna/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AuditsListPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock TRPC hook for now
  const { data: audits, isLoading } = trpc.audits?.list?.useQuery(undefined, {
    enabled: false,
  }) ?? { data: null, isLoading: false };

  const mockAudits = [
    { id: "A-101", status: "completed", date: new Date().toISOString(), auditor: "Jane Doe", branch: "Main Warehouse" },
    { id: "A-102", status: "pending", date: new Date().toISOString(), auditor: "John Smith", branch: "Downtown Branch" },
    { id: "A-103", status: "cancelled", date: new Date(Date.now() - 86400000).toISOString(), auditor: "Mike Johnson", branch: "Northside Store" },
  ];

  const displayAudits = audits || mockAudits;

  const handleCreateAudit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for trpc mutation
    toast.success("Audit created successfully");
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "pending":
        return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Audits</h1>
          <p className="text-muted-foreground mt-2">
            Manage and review inventory verifications across branches.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Start New Audit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Audit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAudit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch / Location</Label>
                <Select required>
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Warehouse</SelectItem>
                    <SelectItem value="downtown">Downtown Branch</SelectItem>
                    <SelectItem value="northside">Northside Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditor">Assigned Auditor</Label>
                <Input id="auditor" placeholder="Search or select auditor..." required />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Audit History</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search audits..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Audit ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAudits.map((audit, i) => (
                    <motion.tr
                      key={audit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell className="font-medium">{audit.id}</TableCell>
                      <TableCell>{format(new Date(audit.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{audit.branch}</TableCell>
                      <TableCell>{audit.auditor}</TableCell>
                      <TableCell>{getStatusBadge(audit.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {displayAudits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No audits found.
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
